/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 *
 * Service de liaison Achats → Comptabilité
 * Génère automatiquement les écritures comptables depuis les bons de commande d'achat
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { AccountingStandardAdapter, type AccountingStandard } from './accountingStandardAdapter';
import { auditService } from './auditService';

// ============================================================================
// TYPES
// ============================================================================

export interface Purchase {
  id: string;
  company_id: string;
  supplier_id?: string;
  supplier_name?: string;
  purchase_number: string;
  purchase_date: string;
  due_date?: string;
  status: 'draft' | 'pending' | 'approved' | 'received' | 'paid' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  journal_entry_id?: string;
}

export interface PurchaseLine {
  id: string;
  purchase_id: string;
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  line_total: number;
  account_number?: string; // Compte de charge spécifique
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
    supplier: '401000', // Fournisseurs
    purchase: '607000', // Achats de marchandises
    purchaseServices: '604000', // Achats d'études et prestations
    vatDeductible: '44566', // TVA déductible sur autres biens et services
    vatDeductibleGoods: '44562', // TVA déductible sur immobilisations
  },
  SYSCOHADA: {
    supplier: '401000',
    purchase: '601000', // Achats de marchandises
    purchaseServices: '604000',
    vatDeductible: '4452', // TVA récupérable
  },
  IFRS: {
    supplier: '5100', // Trade payables (Class 5)
    purchase: '7100', // Cost of goods sold (Class 7 = Expenses)
    purchaseServices: '7200',
    vatDeductible: '5200', // VAT receivable
  },
  SCF: {
    supplier: '401000',
    purchase: '607000',
    purchaseServices: '604000',
    vatDeductible: '44566',
  },
};

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================

export class PurchaseJournalEntryService {

  /**
   * Génère l'écriture comptable pour un bon de commande d'achat
   */
  static async generatePurchaseEntry(
    purchase: Purchase,
    lines: PurchaseLine[]
  ): Promise<GenerateEntryResult> {
    try {
      const { company_id } = purchase;

      // Vérifier si une écriture existe déjà
      if (purchase.journal_entry_id) {
        return {
          success: false,
          message: 'Une écriture comptable existe déjà pour cet achat',
        };
      }

      // Récupérer le standard comptable de l'entreprise
      const standard = await AccountingStandardAdapter.getCompanyStandard(company_id);
      const accounts = DEFAULT_ACCOUNTS[standard];

      // Récupérer le journal des achats
      const journal = await this.getJournalByType(company_id, 'purchase');
      if (!journal) {
        return {
          success: false,
          message: 'Journal des achats non trouvé. Veuillez créer un journal de type "purchase".',
        };
      }

      // Récupérer ou créer le compte fournisseur
      const supplierAccount = await this.getOrCreateSupplierAccount(
        company_id,
        purchase.supplier_id,
        purchase.supplier_name,
        accounts.supplier
      );

      // Construire les lignes d'écriture
      const journalLines: JournalEntryLine[] = [];

      // Regrouper les lignes par compte de charge
      const linesByAccount = new Map<string, { total: number; description: string }>();

      for (const line of lines) {
        const accountNumber = line.account_number || accounts.purchase;
        const existing = linesByAccount.get(accountNumber);

        if (existing) {
          existing.total += line.line_total;
          existing.description += `, ${line.description}`;
        } else {
          linesByAccount.set(accountNumber, {
            total: line.line_total,
            description: line.description,
          });
        }
      }

      // Créer les lignes de charge (débit)
      for (const [accountNumber, data] of linesByAccount) {
        const account = await this.getOrCreateAccount(company_id, accountNumber, 'Achats');

        journalLines.push({
          account_id: account?.id,
          account_number: accountNumber,
          label: data.description.slice(0, 100),
          debit: data.total,
          credit: 0,
        });
      }

      // Ligne TVA déductible (débit)
      if (purchase.tax_amount > 0) {
        const vatAccount = await this.getOrCreateAccount(
          company_id,
          accounts.vatDeductible,
          'TVA déductible'
        );

        journalLines.push({
          account_id: vatAccount?.id,
          account_number: accounts.vatDeductible,
          label: 'TVA déductible',
          debit: purchase.tax_amount,
          credit: 0,
        });
      }

      // Ligne fournisseur (crédit)
      journalLines.push({
        account_id: supplierAccount?.id,
        account_number: supplierAccount?.account_number || accounts.supplier,
        label: `Fournisseur ${purchase.supplier_name || ''}`.trim(),
        debit: 0,
        credit: purchase.total_amount,
      });

      // Vérifier l'équilibre
      const totalDebit = journalLines.reduce((sum, l) => sum + l.debit, 0);
      const totalCredit = journalLines.reduce((sum, l) => sum + l.credit, 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return {
          success: false,
          message: `Écriture déséquilibrée: débit=${totalDebit}, crédit=${totalCredit}`,
        };
      }

      // Créer l'écriture comptable
      const { data: journalEntry, error: entryError } = await supabase
        .from('journal_entries')
        .insert({
          company_id,
          journal_id: journal.id,
          entry_date: purchase.purchase_date,
          reference_number: purchase.purchase_number,
          description: `Achat ${purchase.purchase_number} - ${purchase.supplier_name || 'Fournisseur'}`,
          status: 'draft',
          linked_purchase_id: purchase.id,
        })
        .select()
        .single();

      if (entryError) {
        logger.error('PurchaseJournalEntryService', 'Erreur création écriture:', entryError);
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
        logger.error('PurchaseJournalEntryService', 'Erreur création lignes:', linesError);
        // Supprimer l'écriture créée en cas d'erreur sur les lignes
        await supabase.from('journal_entries').delete().eq('id', journalEntry.id);
        return {
          success: false,
          message: 'Erreur lors de la création des lignes d\'écriture',
          errors: [linesError.message],
        };
      }

      // Mettre à jour l'achat avec l'ID de l'écriture
      await supabase
        .from('purchases')
        .update({ journal_entry_id: journalEntry.id })
        .eq('id', purchase.id);

      // Audit
      await auditService.logAsync({
        action: 'generate_purchase_journal_entry',
        entityType: 'purchase',
        entityId: purchase.id,
        metadata: {
          journal_entry_id: journalEntry.id,
          total_amount: purchase.total_amount,
        },
      });

      logger.info('PurchaseJournalEntryService', `Écriture créée: ${journalEntry.id} pour achat ${purchase.id}`);

      return {
        success: true,
        journal_entry_id: journalEntry.id,
        message: 'Écriture comptable générée avec succès',
      };

    } catch (error: any) {
      logger.error('PurchaseJournalEntryService', 'Erreur génération écriture:', error);
      return {
        success: false,
        message: 'Erreur inattendue',
        errors: [error.message],
      };
    }
  }

  /**
   * Génère l'écriture de paiement fournisseur
   */
  static async generatePaymentEntry(
    purchase: Purchase,
    paymentData: {
      payment_date: string;
      payment_method: 'bank' | 'cash' | 'check';
      bank_account_number?: string;
      reference?: string;
    }
  ): Promise<GenerateEntryResult> {
    try {
      const { company_id } = purchase;
      const standard = await AccountingStandardAdapter.getCompanyStandard(company_id);
      const accounts = DEFAULT_ACCOUNTS[standard];

      // Récupérer le journal approprié
      const journalType = paymentData.payment_method === 'cash' ? 'cash' : 'bank';
      const journal = await this.getJournalByType(company_id, journalType);

      if (!journal) {
        return {
          success: false,
          message: `Journal ${journalType === 'cash' ? 'de caisse' : 'de banque'} non trouvé`,
        };
      }

      // Comptes
      const supplierAccount = await this.getOrCreateSupplierAccount(
        company_id,
        purchase.supplier_id,
        purchase.supplier_name,
        accounts.supplier
      );

      const bankAccountNumber = paymentData.bank_account_number ||
        (paymentData.payment_method === 'cash' ? '530000' : '512000');

      const bankAccount = await this.getOrCreateAccount(
        company_id,
        bankAccountNumber,
        paymentData.payment_method === 'cash' ? 'Caisse' : 'Banque'
      );

      // Construire l'écriture de paiement
      const journalLines: JournalEntryLine[] = [
        {
          account_id: supplierAccount?.id,
          account_number: supplierAccount?.account_number || accounts.supplier,
          label: `Règlement fournisseur ${purchase.supplier_name || ''}`.trim(),
          debit: purchase.total_amount,
          credit: 0,
        },
        {
          account_id: bankAccount?.id,
          account_number: bankAccountNumber,
          label: `Paiement ${purchase.purchase_number}`,
          debit: 0,
          credit: purchase.total_amount,
        },
      ];

      // Créer l'écriture
      const { data: journalEntry, error: entryError } = await supabase
        .from('journal_entries')
        .insert({
          company_id,
          journal_id: journal.id,
          entry_date: paymentData.payment_date,
          reference_number: paymentData.reference || `PAY-${purchase.purchase_number}`,
          description: `Paiement ${purchase.purchase_number} - ${purchase.supplier_name || 'Fournisseur'}`,
          status: 'draft',
          linked_purchase_id: purchase.id,
        })
        .select()
        .single();

      if (entryError) {
        return {
          success: false,
          message: 'Erreur création écriture de paiement',
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
          message: 'Erreur création lignes de paiement',
          errors: [linesError.message],
        };
      }

      // Mettre à jour le statut de l'achat
      await supabase
        .from('purchases')
        .update({
          status: 'paid',
          payment_date: paymentData.payment_date,
          payment_journal_entry_id: journalEntry.id,
        })
        .eq('id', purchase.id);

      return {
        success: true,
        journal_entry_id: journalEntry.id,
        message: 'Écriture de paiement générée avec succès',
      };

    } catch (error: any) {
      logger.error('PurchaseJournalEntryService', 'Erreur génération paiement:', error);
      return {
        success: false,
        message: 'Erreur inattendue',
        errors: [error.message],
      };
    }
  }

  /**
   * Génère les écritures pour tous les achats en attente
   */
  static async generatePendingEntries(companyId: string): Promise<{
    generated: number;
    errors: string[];
  }> {
    let generated = 0;
    const errors: string[] = [];

    try {
      // Récupérer les achats sans écriture
      const { data: purchases } = await supabase
        .from('purchases')
        .select('*, purchase_lines(*)')
        .eq('company_id', companyId)
        .is('journal_entry_id', null)
        .in('status', ['approved', 'received']);

      for (const purchase of purchases || []) {
        const result = await this.generatePurchaseEntry(
          purchase,
          purchase.purchase_lines || []
        );

        if (result.success) {
          generated++;
        } else {
          errors.push(`${purchase.purchase_number}: ${result.message}`);
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

  private static async getOrCreateSupplierAccount(
    companyId: string,
    supplierId?: string,
    supplierName?: string,
    defaultAccount: string = '401000'
  ): Promise<any> {
    // Essayer de trouver le compte du fournisseur
    if (supplierId) {
      const { data: supplier } = await supabase
        .from('third_parties')
        .select('accounting_account')
        .eq('id', supplierId)
        .single();

      if (supplier?.accounting_account) {
        const { data: account } = await supabase
          .from('chart_of_accounts')
          .select('*')
          .eq('company_id', companyId)
          .eq('account_number', supplier.accounting_account)
          .single();

        if (account) return account;
      }
    }

    // Sinon utiliser le compte par défaut
    return this.getOrCreateAccount(companyId, defaultAccount, 'Fournisseurs');
  }

  private static async getOrCreateAccount(
    companyId: string,
    accountNumber: string,
    defaultName: string
  ): Promise<any> {
    // Chercher le compte existant
    const { data: existing } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('company_id', companyId)
      .eq('account_number', accountNumber)
      .single();

    if (existing) return existing;

    // Créer le compte s'il n'existe pas
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
      case '3': return 'asset';
      case '4': return accountNumber.startsWith('41') ? 'asset' : 'liability';
      case '5': return 'asset';
      case '6': return 'expense';
      case '7': return 'revenue';
      default: return 'expense';
    }
  }
}

// Export par défaut
export default PurchaseJournalEntryService;
