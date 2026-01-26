/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 *
 * Service de synchronisation bidirectionnelle entre Comptabilité et Immobilisations
 *
 * DIRECTION 1: Comptabilité → Immobilisation
 * - Détecte les factures d'achat avec comptes classe 2 (immobilisations)
 * - Propose automatiquement la création d'une immobilisation
 * - Lie l'écriture comptable à l'immobilisation créée
 *
 * DIRECTION 2: Immobilisation → Comptabilité
 * - Génère l'écriture d'acquisition lors de la création d'une immobilisation
 * - Génère les dotations aux amortissements (déjà existant)
 * - Génère l'écriture de cession (déjà existant)
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { getCurrentCompanyCurrency } from '@/lib/utils';
import { AccountingStandardAdapter, type AccountingStandard } from './accountingStandardAdapter';
import type { Asset, AssetFormData } from '@/types/assets.types';

// ============================================================================
// TYPES
// ============================================================================

export interface JournalEntryLine {
  id?: string;
  account_id?: string;
  account_number: string;
  account_name?: string;
  label: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface JournalEntry {
  id: string;
  company_id: string;
  entry_date: string;
  journal_id: string;
  reference_number?: string;
  description?: string;
  status: string;
  journal_entry_lines?: JournalEntryLineDB[];
  // Some queries may return these fields
  journal_code?: string;
  lines?: JournalEntryLine[];
}

// Type pour les lignes venant de la DB
export interface JournalEntryLineDB {
  id: string;
  journal_entry_id?: string;
  account_id: string;
  debit_amount: number;
  credit_amount: number;
  description?: string;
  chart_of_accounts?: { account_number: string; account_name: string } | { account_number: string; account_name: string }[];
}

export interface AssetSuggestion {
  journal_entry_id: string;
  entry_date: string;
  reference?: string;
  description?: string;
  suggested_name: string;
  acquisition_value: number;
  asset_account_number: string;
  asset_account_name?: string;
  supplier_name?: string;
  supplier_id?: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

export interface AssetFromEntryParams {
  journal_entry_id: string;
  name: string;
  category_id?: string;
  depreciation_method: 'linear' | 'declining_balance' | 'units_of_production';
  duration_years: number;
  residual_value?: number;
  declining_rate?: number;
  depreciation_start_date?: string;
  location?: string;
  notes?: string;
}

export interface SyncResult {
  success: boolean;
  asset_id?: string;
  journal_entry_id?: string;
  message: string;
  errors?: string[];
}

// ============================================================================
// CONSTANTES
// ============================================================================

// Comptes d'immobilisation par standard comptable
const ASSET_ACCOUNTS_BY_STANDARD: Record<AccountingStandard, string[]> = {
  PCG: ['20', '21', '22', '23', '24', '25', '26', '27'], // Classe 2
  SYSCOHADA: ['20', '21', '22', '23', '24', '25', '26', '27'], // Classe 2
  SCF: ['20', '21', '22', '23', '24', '25', '26', '27'], // Classe 2
  IFRS: ['10', '11', '12', '13', '14', '15', '16', '17', '18', '19'], // Classe 1 (Non-current Assets)
};

// Comptes d'amortissement cumulés
const DEPRECIATION_ACCOUNTS_BY_STANDARD: Record<AccountingStandard, string[]> = {
  PCG: ['28'],
  SYSCOHADA: ['28'],
  SCF: ['28'],
  IFRS: ['18', '19'], // Accumulated depreciation in IFRS
};

// Comptes de dotation aux amortissements
const EXPENSE_ACCOUNTS_BY_STANDARD: Record<AccountingStandard, string[]> = {
  PCG: ['681'], // 68112 spécifiquement
  SYSCOHADA: ['681'],
  SCF: ['681'],
  IFRS: ['72', '73'], // Depreciation expense in IFRS
};

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

export class AssetAccountingSyncService {

  /**
   * DIRECTION 1: Comptabilité → Immobilisation
   * Analyse les écritures comptables récentes pour détecter les acquisitions d'immobilisations
   */
  static async detectAssetAcquisitions(
    companyId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<AssetSuggestion[]> {
    try {
      const standard = await AccountingStandardAdapter.getCompanyStandard(companyId);
      const assetAccountPrefixes = ASSET_ACCOUNTS_BY_STANDARD[standard];

      // Récupérer les écritures non liées à une immobilisation avec leurs lignes
      let query = supabase
        .from('journal_entries')
        .select(`
          id,
          company_id,
          entry_date,
          journal_id,
          reference_number,
          description,
          status,
          linked_asset_id,
          journal_entry_lines (
            id,
            account_id,
            debit_amount,
            credit_amount,
            description,
            chart_of_accounts (
              account_number,
              account_name
            )
          )
        `)
        .eq('company_id', companyId)
        .is('linked_asset_id', null)
        .in('status', ['validated', 'posted', 'draft']);

      if (fromDate) {
        query = query.gte('entry_date', fromDate);
      }
      if (toDate) {
        query = query.lte('entry_date', toDate);
      }

      const { data: entries, error } = await query;

      if (error) {
        logger.error('AssetAccountingSyncService', 'Erreur récupération écritures:', error);
        throw error;
      }

      const suggestions: AssetSuggestion[] = [];

      for (const entry of entries || []) {
        const dbLines = entry.journal_entry_lines as JournalEntryLineDB[] || [];

        // Convertir les lignes DB en format interne
        const lines: JournalEntryLine[] = dbLines.map(dbLine => ({
          id: dbLine.id,
          account_id: dbLine.account_id,
          account_number: (Array.isArray(dbLine.chart_of_accounts) ? dbLine.chart_of_accounts[0]?.account_number : dbLine.chart_of_accounts?.account_number) || '',
          account_name: (Array.isArray(dbLine.chart_of_accounts) ? dbLine.chart_of_accounts[0]?.account_name : dbLine.chart_of_accounts?.account_name) || undefined,
          label: dbLine.description || '',
          debit: dbLine.debit_amount,
          credit: dbLine.credit_amount,
        }));

        // Chercher des lignes avec comptes d'immobilisation au débit
        for (const line of lines) {
          const isAssetAccount = assetAccountPrefixes.some(prefix =>
            line.account_number?.startsWith(prefix)
          );

          if (isAssetAccount && line.debit > 0) {
            // Adapter l'entrée pour les fonctions existantes
            const entryForHelpers = {
              ...entry,
              reference: entry.reference_number,
              lines,
            };

            // C'est probablement une acquisition d'immobilisation
            const suggestion: AssetSuggestion = {
              journal_entry_id: entry.id,
              entry_date: entry.entry_date,
              reference: entry.reference_number,
              description: entry.description,
              suggested_name: this.extractAssetName(entryForHelpers as any, line),
              acquisition_value: line.debit,
              asset_account_number: line.account_number,
              asset_account_name: line.account_name || line.label,
              confidence: this.calculateConfidence(entryForHelpers as any, line, standard),
              reason: this.generateReason(entryForHelpers as any, line, standard),
            };

            // Essayer de trouver le fournisseur
            const supplierInfo = await this.findSupplierFromEntry(entryForHelpers as any, companyId);
            if (supplierInfo) {
              suggestion.supplier_name = supplierInfo.name;
              suggestion.supplier_id = supplierInfo.id;
            }

            suggestions.push(suggestion);
          }
        }
      }

      return suggestions;
    } catch (error) {
      logger.error('AssetAccountingSyncService', 'Erreur détection acquisitions:', error);
      throw error;
    }
  }

  /**
   * Crée une immobilisation à partir d'une écriture comptable existante
   */
  static async createAssetFromEntry(
    companyId: string,
    params: AssetFromEntryParams
  ): Promise<SyncResult> {
    try {
      // 1. Récupérer l'écriture source avec ses lignes
      const { data: entry, error: entryError } = await supabase
        .from('journal_entries')
        .select(`
          *,
          journal_entry_lines (
            id,
            account_id,
            debit_amount,
            credit_amount,
            description,
            chart_of_accounts (
              account_number,
              account_name
            )
          )
        `)
        .eq('id', params.journal_entry_id)
        .eq('company_id', companyId)
        .single();

      if (entryError || !entry) {
        return {
          success: false,
          message: 'Écriture comptable non trouvée',
          errors: [entryError?.message || 'Entry not found'],
        };
      }

      // 2. Extraire les informations de l'écriture
      const standard = await AccountingStandardAdapter.getCompanyStandard(companyId);
      const assetAccountPrefixes = ASSET_ACCOUNTS_BY_STANDARD[standard];

      // Convertir les lignes DB en format interne
      const dbLines = entry.journal_entry_lines as JournalEntryLineDB[] || [];
      const lines: JournalEntryLine[] = dbLines.map(dbLine => ({
        id: dbLine.id,
        account_id: dbLine.account_id,
        account_number: (Array.isArray(dbLine.chart_of_accounts) ? dbLine.chart_of_accounts[0]?.account_number : dbLine.chart_of_accounts?.account_number) || '',
        account_name: (Array.isArray(dbLine.chart_of_accounts) ? dbLine.chart_of_accounts[0]?.account_name : dbLine.chart_of_accounts?.account_name) || undefined,
        label: dbLine.description || '',
        debit: dbLine.debit_amount,
        credit: dbLine.credit_amount,
      }));

      // Trouver la ligne d'immobilisation
      const assetLine = lines.find(line =>
        assetAccountPrefixes.some(prefix => line.account_number?.startsWith(prefix)) &&
        line.debit > 0
      );

      if (!assetLine) {
        return {
          success: false,
          message: 'Aucune ligne d\'immobilisation trouvée dans l\'écriture',
        };
      }

      // 3. Créer l'immobilisation
      const { data: user } = await supabase.auth.getUser();
      const acquisitionValue = assetLine.debit;
      const residualValue = params.residual_value || 0;
      const netBookValue = acquisitionValue - residualValue;

      const assetData = {
        company_id: companyId,
        name: params.name,
        category_id: params.category_id,
        acquisition_date: entry.entry_date,
        acquisition_value: acquisitionValue,
        depreciation_method: params.depreciation_method,
        depreciation_start_date: params.depreciation_start_date || entry.entry_date,
        duration_years: params.duration_years,
        declining_rate: params.declining_rate,
        residual_value: residualValue,
        total_depreciation: 0,
        net_book_value: netBookValue,
        status: 'active',
        location: params.location,
        notes: params.notes,
        account_asset: assetLine.account_number,
        invoice_reference: entry.reference_number,
        source_journal_entry_id: entry.id, // Lien vers l'écriture source
        created_by: user.user?.id,
      };

      const { data: asset, error: assetError } = await supabase
        .from('assets')
        .insert(assetData)
        .select()
        .single();

      if (assetError) {
        return {
          success: false,
          message: 'Erreur création immobilisation',
          errors: [assetError.message],
        };
      }

      // 4. Mettre à jour l'écriture avec le lien vers l'immobilisation
      await supabase
        .from('journal_entries')
        .update({ linked_asset_id: asset.id })
        .eq('id', entry.id);

      // 5. Générer le plan d'amortissement
      try {
        const { generateDepreciationSchedule } = await import('./assetsService');
        await generateDepreciationSchedule(asset.id);
      } catch (scheduleError) {
        logger.warn('AssetAccountingSyncService', 'Plan amortissement non généré:', scheduleError);
      }

      logger.info('AssetAccountingSyncService', `Immobilisation créée depuis écriture: ${asset.id}`);

      return {
        success: true,
        asset_id: asset.id,
        journal_entry_id: entry.id,
        message: 'Immobilisation créée et liée à l\'écriture comptable',
      };

    } catch (error: any) {
      logger.error('AssetAccountingSyncService', 'Erreur création immobilisation:', error);
      return {
        success: false,
        message: 'Erreur inattendue',
        errors: [error.message],
      };
    }
  }

  /**
   * DIRECTION 2: Immobilisation → Comptabilité
   * Génère l'écriture comptable d'acquisition pour une nouvelle immobilisation
   */
  static async generateAcquisitionEntry(
    companyId: string,
    assetId: string,
    supplierAccountNumber?: string
  ): Promise<SyncResult> {
    try {
      // 1. Récupérer l'immobilisation
      const { data: asset, error: assetError } = await supabase
        .from('assets')
        .select(`
          *,
          category:asset_categories(*)
        `)
        .eq('id', assetId)
        .eq('company_id', companyId)
        .single();

      if (assetError || !asset) {
        return {
          success: false,
          message: 'Immobilisation non trouvée',
          errors: [assetError?.message || 'Asset not found'],
        };
      }

      // Vérifier si une écriture existe déjà
      if (asset.source_journal_entry_id) {
        return {
          success: false,
          message: 'Une écriture d\'acquisition existe déjà pour cette immobilisation',
        };
      }

      // 2. Déterminer les comptes
      const standard = await AccountingStandardAdapter.getCompanyStandard(companyId);
      const assetAccount = asset.account_asset || (asset.category as any)?.account_asset || '21';
      const supplierAccount = supplierAccountNumber || '401'; // Fournisseurs par défaut

      // 3. Récupérer le journal des achats
      const { data: journal } = await supabase
        .from('journals')
        .select('id')
        .eq('company_id', companyId)
        .eq('type', 'purchase')
        .limit(1)
        .single();

      if (!journal) {
        return {
          success: false,
          message: 'Journal des achats non trouvé',
        };
      }

      // 4. Récupérer les comptes
      const { data: assetAccountData } = await supabase
        .from('chart_of_accounts')
        .select('id')
        .eq('company_id', companyId)
        .eq('account_number', assetAccount)
        .single();

      const { data: supplierAccountData } = await supabase
        .from('chart_of_accounts')
        .select('id')
        .eq('company_id', companyId)
        .eq('account_number', supplierAccount)
        .single();

      // 5. Créer l'écriture d'acquisition
      const { data: journalEntry, error: entryError } = await supabase
        .from('journal_entries')
        .insert({
          company_id: companyId,
          journal_id: journal.id,
          entry_date: asset.acquisition_date,
          reference_number: asset.invoice_reference || `ACQ-${asset.asset_number || asset.id.slice(0, 8)}`,
          description: `Acquisition immobilisation - ${asset.name}`,
          status: 'draft',
          linked_asset_id: assetId,
        })
        .select()
        .single();

      if (entryError) {
        return {
          success: false,
          message: 'Erreur création écriture d\'acquisition',
          errors: [entryError.message],
        };
      }

      // 6. Créer les lignes d'écriture
      const entryLines = [
        {
          journal_entry_id: journalEntry.id,
          account_id: assetAccountData?.id,
          debit_amount: asset.acquisition_value,
          credit_amount: 0,
          description: `Acquisition immobilisation - ${asset.name}`,
        },
        {
          journal_entry_id: journalEntry.id,
          account_id: supplierAccountData?.id,
          debit_amount: 0,
          credit_amount: asset.acquisition_value,
          description: `Fournisseur - ${asset.name}`,
        },
      ];

      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(entryLines);

      if (linesError) {
        // Rollback: supprimer l'écriture
        await supabase.from('journal_entries').delete().eq('id', journalEntry.id);
        return {
          success: false,
          message: 'Erreur création lignes d\'acquisition',
          errors: [linesError.message],
        };
      }

      // 7. Mettre à jour l'immobilisation avec le lien
      await supabase
        .from('assets')
        .update({ source_journal_entry_id: journalEntry.id })
        .eq('id', assetId);

      logger.info('AssetAccountingSyncService', `Écriture acquisition créée: ${journalEntry.id}`);

      return {
        success: true,
        asset_id: assetId,
        journal_entry_id: journalEntry.id,
        message: 'Écriture d\'acquisition créée avec succès',
      };

    } catch (error: any) {
      logger.error('AssetAccountingSyncService', 'Erreur génération écriture acquisition:', error);
      return {
        success: false,
        message: 'Erreur inattendue',
        errors: [error.message],
      };
    }
  }

  /**
   * Vérifie la cohérence entre une immobilisation et ses écritures comptables
   */
  static async checkAssetAccountingConsistency(
    companyId: string,
    assetId: string
  ): Promise<{
    consistent: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    try {
      // Récupérer l'immobilisation avec son historique
      const { data: asset, error } = await supabase
        .from('assets')
        .select(`
          *,
          category:asset_categories(*)
        `)
        .eq('id', assetId)
        .eq('company_id', companyId)
        .single();

      if (error || !asset) {
        return { consistent: false, issues: ['Immobilisation non trouvée'], suggestions: [] };
      }

      // 1. Vérifier l'écriture d'acquisition
      if (!asset.source_journal_entry_id) {
        issues.push('Aucune écriture d\'acquisition liée');
        suggestions.push('Générer l\'écriture d\'acquisition via generateAcquisitionEntry()');
      } else {
        const { data: acquisitionEntry } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('id', asset.source_journal_entry_id)
          .single();

        if (!acquisitionEntry) {
          issues.push('Écriture d\'acquisition référencée mais non trouvée');
        } else {
          // Vérifier la cohérence du montant
          const lines = acquisitionEntry.lines as JournalEntryLine[];
          const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
          if (Math.abs(totalDebit - asset.acquisition_value) > 0.01) {
            issues.push(`Montant d'acquisition incohérent: immobilisation=${asset.acquisition_value}, écriture=${totalDebit}`);
          }
        }
      }

      // 2. Vérifier le plan d'amortissement
      const { data: scheduleLines } = await supabase
        .from('asset_depreciation_schedule')
        .select('*')
        .eq('asset_id', assetId);

      if (!scheduleLines || scheduleLines.length === 0) {
        if (asset.status === 'active') {
          issues.push('Aucun plan d\'amortissement généré');
          suggestions.push('Régénérer le plan d\'amortissement via generateDepreciationSchedule()');
        }
      } else {
        // Vérifier la cohérence des amortissements cumulés
        const postedLines = scheduleLines.filter(l => l.is_posted);
        const totalPosted = postedLines.reduce((sum, l) => sum + (l.depreciation_amount || 0), 0);

        if (Math.abs(totalPosted - (asset.total_depreciation || 0)) > 0.01) {
          issues.push(`Amortissements cumulés incohérents: immobilisation=${asset.total_depreciation}, écritures=${totalPosted}`);
        }
      }

      // 3. Vérifier les écritures de dotation
      const { data: depreciationEntries } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('company_id', companyId)
        .eq('linked_asset_id', assetId)
        .ilike('reference_number', 'AMORT-%');

      const scheduledPostedCount = scheduleLines?.filter(l => l.is_posted).length || 0;
      const actualEntriesCount = depreciationEntries?.length || 0;

      if (scheduledPostedCount !== actualEntriesCount) {
        issues.push(`Nombre d'écritures d'amortissement incohérent: plan=${scheduledPostedCount}, écritures=${actualEntriesCount}`);
      }

      return {
        consistent: issues.length === 0,
        issues,
        suggestions,
      };

    } catch (error: any) {
      logger.error('AssetAccountingSyncService', 'Erreur vérification cohérence:', error);
      return {
        consistent: false,
        issues: [`Erreur: ${error.message}`],
        suggestions: [],
      };
    }
  }

  /**
   * Réconcilie les immobilisations avec les écritures comptables
   */
  static async reconcileAssets(companyId: string): Promise<{
    reconciled: number;
    errors: string[];
  }> {
    let reconciled = 0;
    const errors: string[] = [];

    try {
      // Récupérer toutes les immobilisations sans écriture liée
      const { data: assetsWithoutEntry } = await supabase
        .from('assets')
        .select('id, name')
        .eq('company_id', companyId)
        .is('source_journal_entry_id', null);

      for (const asset of assetsWithoutEntry || []) {
        const result = await this.generateAcquisitionEntry(companyId, asset.id);
        if (result.success) {
          reconciled++;
        } else {
          errors.push(`${asset.name}: ${result.message}`);
        }
      }

      return { reconciled, errors };

    } catch (error: any) {
      logger.error('AssetAccountingSyncService', 'Erreur réconciliation:', error);
      return { reconciled, errors: [error.message] };
    }
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  /**
   * Extrait un nom suggéré pour l'immobilisation depuis l'écriture
   */
  private static extractAssetName(entry: JournalEntry, line: JournalEntryLine): string {
    // Priorité: libellé de la ligne > description de l'écriture > référence
    if (line.label && line.label.length > 3) {
      return line.label.replace(/^(Achat|Acquisition|Fact\.?|FA-?\d*)\s*/i, '').trim() || line.label;
    }
    if (entry.description && entry.description.length > 3) {
      return entry.description.replace(/^(Achat|Acquisition|Fact\.?)\s*/i, '').trim() || entry.description;
    }
    return `Immobilisation ${(entry as any).reference || entry.reference_number || entry.id.slice(0, 8)}`;
  }

  /**
   * Calcule le niveau de confiance de la suggestion
   */
  private static calculateConfidence(
    entry: JournalEntry,
    line: JournalEntryLine,
    standard: AccountingStandard
  ): 'high' | 'medium' | 'low' {
    let score = 0;

    // Montant significatif (> 500€)
    if (line.debit > 500) score += 2;
    else if (line.debit > 100) score += 1;

    // Compte d'immobilisation précis (21x, 22x plutôt que 2x)
    if (line.account_number?.length >= 3) score += 2;
    else if (line.account_number?.length >= 2) score += 1;

    // Journal d'achat
    if (['ACHATS', 'ACH', 'HA'].includes(entry.journal_code?.toUpperCase())) score += 1;

    // Écriture validée
    if (entry.status === 'validated' || entry.status === 'posted') score += 1;

    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  /**
   * Génère une explication pour la suggestion
   */
  private static generateReason(
    entry: JournalEntry,
    line: JournalEntryLine,
    standard: AccountingStandard
  ): string {
    const reasons: string[] = [];

    reasons.push(`Compte ${line.account_number} (classe 2 - immobilisations)`);
    const _currency = getCurrentCompanyCurrency();
    reasons.push(`Montant: ${line.debit.toLocaleString('fr-FR', { style: 'currency', currency: _currency })}`);

    if (entry.journal_code) {
      reasons.push(`Journal: ${entry.journal_code}`);
    }

    return reasons.join(' | ');
  }

  /**
   * Essaie de trouver le fournisseur depuis l'écriture
   */
  private static async findSupplierFromEntry(
    entry: JournalEntry,
    companyId: string
  ): Promise<{ id: string; name: string } | null> {
    const lines = entry.lines as JournalEntryLine[];

    // Chercher une ligne avec compte fournisseur (401x)
    const supplierLine = lines.find(line =>
      line.account_number?.startsWith('401') && line.credit > 0
    );

    if (supplierLine?.label) {
      // Essayer de trouver le tiers dans la base
      const { data: supplier } = await supabase
        .from('third_parties')
        .select('id, name')
        .eq('company_id', companyId)
        .ilike('name', `%${supplierLine.label}%`)
        .limit(1)
        .single();

      if (supplier) {
        return supplier;
      }
    }

    return null;
  }
}

// Export par défaut
export default AssetAccountingSyncService;
