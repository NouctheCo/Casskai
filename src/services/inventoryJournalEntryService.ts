/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 *
 * Service de liaison Stocks → Comptabilité
 * Génère automatiquement les écritures comptables depuis les mouvements de stock
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { AccountingStandardAdapter, type AccountingStandard } from './accountingStandardAdapter';
import { auditService } from './auditService';

// ============================================================================
// TYPES
// ============================================================================

export type MovementType = 'entry' | 'exit' | 'adjustment' | 'transfer';

export interface StockMovement {
  id: string;
  company_id: string;
  product_id: string;
  product_name?: string;
  warehouse_id: string;
  warehouse_name?: string;
  type: MovementType;
  quantity: number;
  unit_price: number;
  total_value: number;
  reason?: string;
  reference?: string;
  notes?: string;
  movement_date: string;
  journal_entry_id?: string;
}

export interface InventoryValuationAdjustment {
  id: string;
  company_id: string;
  adjustment_date: string;
  warehouse_id?: string;
  total_adjustment: number;
  reason: string;
  details: Array<{
    product_id: string;
    product_name: string;
    old_value: number;
    new_value: number;
    adjustment: number;
  }>;
}

export interface JournalEntryLine {
  account_id?: string;
  account_number: string;
  label: string;
  debit: number;
  credit: number;
}

export interface GenerateEntryResult {
  success: boolean;
  journal_entry_id?: string;
  message: string;
  errors?: string[];
}

// ============================================================================
// CONSTANTES - COMPTES PAR DÉFAUT
// ============================================================================

const DEFAULT_ACCOUNTS = {
  PCG: {
    stock: '370000', // Stock de marchandises
    stockVariation: '603700', // Variation des stocks de marchandises
    stockPurchases: '607000', // Achats de marchandises (pour entrées)
    stockLoss: '657100', // Charges exceptionnelles de gestion
    stockGain: '757100', // Produits exceptionnels de gestion
    inventoryAdjustment: '603800', // Variation de stock (ajustement)
  },
  SYSCOHADA: {
    stock: '310000', // Marchandises
    stockVariation: '603100', // Variation stocks marchandises
    stockPurchases: '601000',
    stockLoss: '831000', // Charges HAO
    stockGain: '841000', // Produits HAO
    inventoryAdjustment: '603000',
  },
  IFRS: {
    stock: '2100', // Inventories (Class 2 = Current Assets)
    stockVariation: '7100', // Cost of sales (Class 7 = Expenses)
    stockPurchases: '7100',
    stockLoss: '7500', // Other expenses
    stockGain: '6500', // Other income (Class 6 = Revenue)
    inventoryAdjustment: '7100',
  },
  SCF: {
    stock: '370000',
    stockVariation: '603700',
    stockPurchases: '607000',
    stockLoss: '657100',
    stockGain: '757100',
    inventoryAdjustment: '603800',
  },
};

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================

export class InventoryJournalEntryService {

  /**
   * Génère l'écriture comptable pour un mouvement de stock
   */
  static async generateMovementEntry(
    movement: StockMovement
  ): Promise<GenerateEntryResult> {
    try {
      const { company_id } = movement;

      // Vérifier si une écriture existe déjà
      if (movement.journal_entry_id) {
        return {
          success: false,
          message: 'Une écriture comptable existe déjà pour ce mouvement',
        };
      }

      // Récupérer le standard comptable
      const standard = await AccountingStandardAdapter.getCompanyStandard(company_id);
      const accounts = DEFAULT_ACCOUNTS[standard];

      // Récupérer le journal OD (Opérations Diverses)
      const journal = await this.getJournalByType(company_id, 'miscellaneous');
      if (!journal) {
        return {
          success: false,
          message: 'Journal des opérations diverses non trouvé',
        };
      }

      // Construire les lignes selon le type de mouvement
      const journalLines = await this.buildMovementLines(movement, accounts, company_id);

      if (journalLines.length === 0) {
        return {
          success: false,
          message: 'Impossible de construire les lignes d\'écriture',
        };
      }

      // Vérifier l'équilibre
      const totalDebit = journalLines.reduce((sum, l) => sum + l.debit, 0);
      const totalCredit = journalLines.reduce((sum, l) => sum + l.credit, 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return {
          success: false,
          message: `Écriture déséquilibrée: débit=${totalDebit}, crédit=${totalCredit}`,
        };
      }

      // Créer l'écriture
      const { data: journalEntry, error: entryError } = await supabase
        .from('journal_entries')
        .insert({
          company_id,
          journal_id: journal.id,
          entry_date: movement.movement_date,
          reference_number: movement.reference || `MVT-${movement.id.slice(0, 8)}`,
          description: this.buildDescription(movement),
          status: 'draft',
          linked_inventory_movement_id: movement.id,
        })
        .select()
        .single();

      if (entryError) {
        logger.error('InventoryJournalEntryService', 'Erreur création écriture:', entryError);
        return {
          success: false,
          message: 'Erreur lors de la création de l\'écriture',
          errors: [entryError.message],
        };
      }

      // Créer les lignes d'écriture dans journal_entry_lines
      const entryLines = journalLines.map(line => ({
        journal_entry_id: journalEntry.id,
        account_id: line.account_id,
        debit_amount: line.debit,
        credit_amount: line.credit,
        description: line.label,
      }));

      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(entryLines);

      if (linesError) {
        logger.error('InventoryJournalEntryService', 'Erreur création lignes:', linesError);
        await supabase.from('journal_entries').delete().eq('id', journalEntry.id);
        return {
          success: false,
          message: 'Erreur lors de la création des lignes d\'écriture',
          errors: [linesError.message],
        };
      }

      // Mettre à jour le mouvement avec l'ID de l'écriture
      await supabase
        .from('stock_movements')
        .update({ journal_entry_id: journalEntry.id })
        .eq('id', movement.id);

      // Audit
      await auditService.logAsync({
        action: 'generate_inventory_journal_entry',
        entityType: 'stock_movement',
        entityId: movement.id,
        metadata: {
          journal_entry_id: journalEntry.id,
          movement_type: movement.type,
          total_value: movement.total_value,
        },
      });

      logger.info('InventoryJournalEntryService', `Écriture créée: ${journalEntry.id} pour mouvement ${movement.id}`);

      return {
        success: true,
        journal_entry_id: journalEntry.id,
        message: 'Écriture comptable générée avec succès',
      };

    } catch (error: any) {
      logger.error('InventoryJournalEntryService', 'Erreur génération écriture:', error);
      return {
        success: false,
        message: 'Erreur inattendue',
        errors: [error.message],
      };
    }
  }

  /**
   * Génère l'écriture pour un ajustement d'inventaire (inventaire physique)
   */
  static async generateInventoryAdjustmentEntry(
    adjustment: InventoryValuationAdjustment
  ): Promise<GenerateEntryResult> {
    try {
      const { company_id } = adjustment;

      const standard = await AccountingStandardAdapter.getCompanyStandard(company_id);
      const accounts = DEFAULT_ACCOUNTS[standard];

      const journal = await this.getJournalByType(company_id, 'miscellaneous');
      if (!journal) {
        return {
          success: false,
          message: 'Journal des opérations diverses non trouvé',
        };
      }

      // L'ajustement peut être positif (gain) ou négatif (perte)
      const isGain = adjustment.total_adjustment > 0;
      const adjustmentAmount = Math.abs(adjustment.total_adjustment);

      const journalLines: JournalEntryLine[] = [];

      if (isGain) {
        // Augmentation de stock (ajustement positif)
        // Débit: Stock, Crédit: Variation de stock (ou produit exceptionnel)
        const stockAccount = await this.getOrCreateAccount(company_id, accounts.stock, 'Stock de marchandises');
        const variationAccount = await this.getOrCreateAccount(company_id, accounts.stockGain, 'Produit ajustement stock');

        journalLines.push({
          account_id: stockAccount?.id,
          account_number: accounts.stock,
          label: `Ajustement inventaire - Augmentation stock`,
          debit: adjustmentAmount,
          credit: 0,
        });

        journalLines.push({
          account_id: variationAccount?.id,
          account_number: accounts.stockGain,
          label: `Ajustement inventaire - ${adjustment.reason}`,
          debit: 0,
          credit: adjustmentAmount,
        });

      } else {
        // Diminution de stock (ajustement négatif)
        // Débit: Variation de stock (ou charge exceptionnelle), Crédit: Stock
        const stockAccount = await this.getOrCreateAccount(company_id, accounts.stock, 'Stock de marchandises');
        const variationAccount = await this.getOrCreateAccount(company_id, accounts.stockLoss, 'Charge ajustement stock');

        journalLines.push({
          account_id: variationAccount?.id,
          account_number: accounts.stockLoss,
          label: `Ajustement inventaire - ${adjustment.reason}`,
          debit: adjustmentAmount,
          credit: 0,
        });

        journalLines.push({
          account_id: stockAccount?.id,
          account_number: accounts.stock,
          label: `Ajustement inventaire - Diminution stock`,
          debit: 0,
          credit: adjustmentAmount,
        });
      }

      // Créer l'écriture
      const { data: journalEntry, error: entryError } = await supabase
        .from('journal_entries')
        .insert({
          company_id,
          journal_id: journal.id,
          entry_date: adjustment.adjustment_date,
          reference_number: `INV-${adjustment.id.slice(0, 8)}`,
          description: `Ajustement inventaire - ${adjustment.reason}`,
          status: 'draft',
          linked_inventory_adjustment_id: adjustment.id,
        })
        .select()
        .single();

      if (entryError) {
        return {
          success: false,
          message: 'Erreur création écriture d\'ajustement',
          errors: [entryError.message],
        };
      }

      // Créer les lignes d'écriture
      const entryLines = journalLines.map(line => ({
        journal_entry_id: journalEntry.id,
        account_id: line.account_id,
        debit_amount: line.debit,
        credit_amount: line.credit,
        description: line.label,
      }));

      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(entryLines);

      if (linesError) {
        await supabase.from('journal_entries').delete().eq('id', journalEntry.id);
        return {
          success: false,
          message: 'Erreur création lignes d\'ajustement',
          errors: [linesError.message],
        };
      }

      return {
        success: true,
        journal_entry_id: journalEntry.id,
        message: 'Écriture d\'ajustement générée avec succès',
      };

    } catch (error: any) {
      logger.error('InventoryJournalEntryService', 'Erreur génération ajustement:', error);
      return {
        success: false,
        message: 'Erreur inattendue',
        errors: [error.message],
      };
    }
  }

  /**
   * Génère les écritures pour tous les mouvements non comptabilisés
   */
  static async generatePendingEntries(
    companyId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<{
    generated: number;
    errors: string[];
  }> {
    let generated = 0;
    const errors: string[] = [];

    try {
      // Récupérer les mouvements sans écriture
      let query = supabase
        .from('stock_movements')
        .select('*')
        .eq('company_id', companyId)
        .is('journal_entry_id', null);

      if (fromDate) {
        query = query.gte('movement_date', fromDate);
      }
      if (toDate) {
        query = query.lte('movement_date', toDate);
      }

      const { data: movements } = await query;

      for (const movement of movements || []) {
        // Ne comptabiliser que les mouvements avec une valeur
        if (movement.total_value && movement.total_value > 0) {
          const result = await this.generateMovementEntry(movement);

          if (result.success) {
            generated++;
          } else {
            errors.push(`Mouvement ${movement.id}: ${result.message}`);
          }
        }
      }

    } catch (error: any) {
      errors.push(`Erreur globale: ${error.message}`);
    }

    return { generated, errors };
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  private static async buildMovementLines(
    movement: StockMovement,
    accounts: typeof DEFAULT_ACCOUNTS.PCG,
    companyId: string
  ): Promise<JournalEntryLine[]> {
    const lines: JournalEntryLine[] = [];
    const value = movement.total_value || (movement.quantity * movement.unit_price);

    if (value <= 0) return lines;

    const stockAccount = await this.getOrCreateAccount(companyId, accounts.stock, 'Stock');
    const variationAccount = await this.getOrCreateAccount(companyId, accounts.stockVariation, 'Variation de stock');

    switch (movement.type) {
      case 'entry':
        // Entrée en stock (réception achat)
        // Débit: Stock, Crédit: Variation de stock
        lines.push({
          account_id: stockAccount?.id,
          account_number: accounts.stock,
          label: `Entrée stock - ${movement.product_name || 'Produit'}`,
          debit: value,
          credit: 0,
        });
        lines.push({
          account_id: variationAccount?.id,
          account_number: accounts.stockVariation,
          label: `Entrée stock - ${movement.reason || 'Réception'}`,
          debit: 0,
          credit: value,
        });
        break;

      case 'exit':
        // Sortie de stock (vente, consommation)
        // Débit: Variation de stock, Crédit: Stock
        lines.push({
          account_id: variationAccount?.id,
          account_number: accounts.stockVariation,
          label: `Sortie stock - ${movement.reason || 'Livraison'}`,
          debit: value,
          credit: 0,
        });
        lines.push({
          account_id: stockAccount?.id,
          account_number: accounts.stock,
          label: `Sortie stock - ${movement.product_name || 'Produit'}`,
          debit: 0,
          credit: value,
        });
        break;

      case 'adjustment':
        // Ajustement (peut être positif ou négatif)
        if (movement.quantity >= 0) {
          // Ajustement positif
          lines.push({
            account_id: stockAccount?.id,
            account_number: accounts.stock,
            label: `Ajustement + stock`,
            debit: value,
            credit: 0,
          });
          const gainAccount = await this.getOrCreateAccount(companyId, accounts.stockGain, 'Produit ajustement');
          lines.push({
            account_id: gainAccount?.id,
            account_number: accounts.stockGain,
            label: `Ajustement inventaire`,
            debit: 0,
            credit: value,
          });
        } else {
          // Ajustement négatif
          const lossAccount = await this.getOrCreateAccount(companyId, accounts.stockLoss, 'Charge ajustement');
          lines.push({
            account_id: lossAccount?.id,
            account_number: accounts.stockLoss,
            label: `Ajustement inventaire`,
            debit: value,
            credit: 0,
          });
          lines.push({
            account_id: stockAccount?.id,
            account_number: accounts.stock,
            label: `Ajustement - stock`,
            debit: 0,
            credit: value,
          });
        }
        break;

      case 'transfer':
        // Transfert entre entrepôts - pas d'impact comptable sur le stock global
        // Mais on peut tracer le mouvement avec des écritures d'ordre
        // Pour l'instant, pas d'écriture générée
        break;
    }

    return lines;
  }

  private static buildDescription(movement: StockMovement): string {
    const typeLabels: Record<MovementType, string> = {
      entry: 'Entrée en stock',
      exit: 'Sortie de stock',
      adjustment: 'Ajustement de stock',
      transfer: 'Transfert de stock',
    };

    return `${typeLabels[movement.type]} - ${movement.product_name || 'Produit'} - Qté: ${movement.quantity}`;
  }

  private static async getJournalByType(companyId: string, type: string): Promise<any> {
    const { data } = await supabase
      .from('journals')
      .select('*')
      .eq('company_id', companyId)
      .eq('type', type)
      .limit(1)
      .single();

    return data;
  }

  private static async getOrCreateAccount(
    companyId: string,
    accountNumber: string,
    defaultName: string
  ): Promise<any> {
    const { data: existing } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('company_id', companyId)
      .eq('account_number', accountNumber)
      .single();

    if (existing) return existing;

    const { data: created } = await supabase
      .from('chart_of_accounts')
      .insert({
        company_id: companyId,
        account_number: accountNumber,
        account_name: defaultName,
        account_type: this.inferAccountType(accountNumber),
        is_active: true,
      })
      .select()
      .single();

    return created;
  }

  private static inferAccountType(accountNumber: string): string {
    const firstDigit = accountNumber.charAt(0);
    switch (firstDigit) {
      case '1': return 'equity';
      case '2': return 'asset';
      case '3': return 'asset'; // Stocks
      case '4': return 'liability';
      case '5': return 'asset';
      case '6': return 'expense';
      case '7': return 'revenue';
      default: return 'expense';
    }
  }
}

// Export par défaut
export default InventoryJournalEntryService;
