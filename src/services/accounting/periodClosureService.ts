/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { Database } from '@/types/supabase';

type AccountingPeriod = Database['public']['Tables']['accounting_periods']['Row'];
type AccountingPeriodInsert = Database['public']['Tables']['accounting_periods']['Insert'];

export interface PeriodClosureResult {
  success: boolean;
  message: string;
  period?: AccountingPeriod;
  closingEntryId?: string;
  anEntryId?: string;
  resultAmount?: number;
  resultType?: 'profit' | 'loss';
  errors?: string[];
  warnings?: string[];
}

export interface AccountBalance {
  accountNumber: string;
  accountName: string;
  debitTotal: number;
  creditTotal: number;
  balance: number;
}

export interface ClosureValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  balanceSheet: {
    totalDebit: number;
    totalCredit: number;
    isBalanced: boolean;
  };
  unpostedEntries: number;
  unletteredEntries: number;
  periodName?: string;
  isClosed?: boolean;
}

/**
 * Interface pour la réponse RPC de clôture
 */
interface CloseAccountingPeriodResponse {
  success: boolean;
  error?: string;
  message?: string;
  period_id?: string;
  closing_entry_id?: string;
  result_amount?: number;
  result_type?: 'profit' | 'loss';
  balance?: AccountBalance[];
  warnings?: {
    unlettraged_clients: number;
    unlettraged_suppliers: number;
  };
  a_nouveaux_generated?: boolean;
  a_nouveaux_entry_id?: string;
  validation_failed?: string;
}

/**
 * Interface pour la réponse RPC de statut
 */
interface PeriodClosureStatusResponse {
  is_closed: boolean;
  period_name: string;
  start_date: string;
  end_date: string;
  total_entries: number;
  draft_entries: number;
  posted_entries: number;
  unlettraged_clients: number;
  unlettraged_suppliers: number;
  has_closing_entry: boolean;
}

/**
 * Service de clôture de période comptable
 * 
 * Utilise les fonctions RPC Supabase pour garantir:
 * - Transactions atomiques
 * - Cohérence des données
 * - Performance optimale
 * 
 * Fonctions RPC utilisées:
 * - close_accounting_period(p_period_id, p_company_id)
 * - reopen_accounting_period(p_period_id, p_company_id)
 * - get_period_closure_status(p_period_id, p_company_id)
 */
class PeriodClosureService {
  private static instance: PeriodClosureService;

  private constructor() {}

  static getInstance(): PeriodClosureService {
    if (!PeriodClosureService.instance) {
      PeriodClosureService.instance = new PeriodClosureService();
    }
    return PeriodClosureService.instance;
  }

  // ============================================================================
  // GESTION DES PÉRIODES
  // ============================================================================

  /**
   * Récupère toutes les périodes comptables d'une entreprise
   */
  async getPeriods(companyId: string): Promise<AccountingPeriod[]> {
    const { data, error } = await supabase
      .from('accounting_periods')
      .select('*')
      .eq('company_id', companyId)
      .order('start_date', { ascending: false });

    if (error) {
      logger.error('PeriodClosure', 'Error fetching periods:', error);
      throw new Error(`Erreur lors de la récupération des périodes: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Récupère une période par son ID
   */
  async getPeriodById(periodId: string): Promise<AccountingPeriod | null> {
    const { data, error } = await supabase
      .from('accounting_periods')
      .select('*')
      .eq('id', periodId)
      .single();

    if (error) {
      logger.error('PeriodClosure', 'Error fetching period:', error);
      return null;
    }

    return data;
  }

  /**
   * Crée une nouvelle période comptable
   */
  async createPeriod(
    companyId: string,
    name: string,
    startDate: string,
    endDate: string
  ): Promise<PeriodClosureResult> {
    try {
      // Vérifier qu'il n'y a pas de chevauchement
      const overlap = await this.checkPeriodOverlap(companyId, startDate, endDate);
      if (overlap) {
        return {
          success: false,
          message: 'Cette période chevauche une période existante',
          errors: ['Chevauchement de période détecté']
        };
      }

      const insert: AccountingPeriodInsert = {
        company_id: companyId,
        name,
        start_date: startDate,
        end_date: endDate,
        is_closed: false
      };

      const { data, error } = await supabase
        .from('accounting_periods')
        .insert(insert)
        .select()
        .single();

      if (error) {
        logger.error('PeriodClosure', 'Error creating period:', error);
        return {
          success: false,
          message: `Erreur lors de la création de la période: ${error.message}`,
          errors: [error.message]
        };
      }

      logger.info('PeriodClosure', `Period created: ${name}`, { periodId: data.id });

      return {
        success: true,
        message: `Période "${name}" créée avec succès`,
        period: data
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      return { success: false, message, errors: [message] };
    }
  }

  /**
   * Vérifie s'il y a chevauchement avec une période existante
   */
  private async checkPeriodOverlap(
    companyId: string,
    startDate: string,
    endDate: string,
    excludePeriodId?: string
  ): Promise<boolean> {
    let query = supabase
      .from('accounting_periods')
      .select('id')
      .eq('company_id', companyId)
      .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

    if (excludePeriodId) {
      query = query.neq('id', excludePeriodId);
    }

    const { data } = await query;
    return (data?.length ?? 0) > 0;
  }

  // ============================================================================
  // VALIDATION PRÉ-CLÔTURE (via RPC)
  // ============================================================================

  /**
   * Valide qu'une période peut être clôturée
   * Utilise la fonction RPC get_period_closure_status
   */
  async validateClosureReadiness(
    companyId: string,
    periodId: string
  ): Promise<ClosureValidation> {
    try {
      const { data, error } = await supabase.rpc('get_period_closure_status', {
        p_period_id: periodId,
        p_company_id: companyId
      });

      if (error) {
        logger.error('PeriodClosure', 'Error getting closure status:', error);
        return {
          isValid: false,
          errors: [`Erreur de validation: ${error.message}`],
          warnings: [],
          balanceSheet: { totalDebit: 0, totalCredit: 0, isBalanced: false },
          unpostedEntries: 0,
          unletteredEntries: 0
        };
      }

      const status = data as PeriodClosureStatusResponse;
      
      if (!status) {
        return {
          isValid: false,
          errors: ['Période non trouvée'],
          warnings: [],
          balanceSheet: { totalDebit: 0, totalCredit: 0, isBalanced: false },
          unpostedEntries: 0,
          unletteredEntries: 0
        };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // Période déjà clôturée
      if (status.is_closed) {
        errors.push('Cette période est déjà clôturée');
      }

      // Écritures en brouillon
      if (status.draft_entries > 0) {
        errors.push(`${status.draft_entries} écriture(s) en brouillon doivent être validées ou supprimées`);
      }

      // Avertissements pour les écritures non lettrées
      const totalUnlettraged = status.unlettraged_clients + status.unlettraged_suppliers;
      if (totalUnlettraged > 0) {
        warnings.push(`${totalUnlettraged} ligne(s) sur comptes tiers non lettrées (${status.unlettraged_clients} clients, ${status.unlettraged_suppliers} fournisseurs)`);
      }

      // Calculer les totaux depuis les écritures validées
      const balanceData = await this.getAccountBalances(companyId, status.start_date, status.end_date);
      const totalDebit = balanceData.reduce((sum, b) => sum + b.debitTotal, 0);
      const totalCredit = balanceData.reduce((sum, b) => sum + b.creditTotal, 0);
      const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

      if (!isBalanced) {
        errors.push(`Déséquilibre comptable: Débit ${totalDebit.toFixed(2)}€ ≠ Crédit ${totalCredit.toFixed(2)}€`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        balanceSheet: {
          totalDebit,
          totalCredit,
          isBalanced
        },
        unpostedEntries: status.draft_entries,
        unletteredEntries: totalUnlettraged,
        periodName: status.period_name,
        isClosed: status.is_closed
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error('PeriodClosure', 'Validation error:', err);
      return {
        isValid: false,
        errors: [message],
        warnings: [],
        balanceSheet: { totalDebit: 0, totalCredit: 0, isBalanced: false },
        unpostedEntries: 0,
        unletteredEntries: 0
      };
    }
  }

  // ============================================================================
  // CALCUL DES SOLDES
  // ============================================================================

  /**
   * Calcule les soldes de tous les comptes pour une période
   */
  async getAccountBalances(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<AccountBalance[]> {
    const { data, error } = await supabase
      .from('journal_entry_lines')
      .select(`
        account_number,
        account_name,
        debit,
        credit,
        journal_entries!inner(entry_date, company_id, status)
      `)
      .eq('journal_entries.company_id', companyId)
      .eq('journal_entries.status', 'posted')
      .gte('journal_entries.entry_date', startDate)
      .lte('journal_entries.entry_date', endDate);

    if (error) {
      logger.error('PeriodClosure', 'Error fetching balances:', error);
      return [];
    }

    // Agréger par compte
    const balanceMap = new Map<string, { name: string; debit: number; credit: number }>();
    for (const line of data || []) {
      const key = line.account_number;
      const current = balanceMap.get(key) || { name: line.account_name || '', debit: 0, credit: 0 };
      current.debit += Number(line.debit) || 0;
      current.credit += Number(line.credit) || 0;
      if (!current.name && line.account_name) current.name = line.account_name;
      balanceMap.set(key, current);
    }

    return Array.from(balanceMap.entries()).map(([accountNumber, amounts]) => ({
      accountNumber,
      accountName: amounts.name,
      debitTotal: amounts.debit,
      creditTotal: amounts.credit,
      balance: amounts.debit - amounts.credit
    })).filter(b => b.debitTotal !== 0 || b.creditTotal !== 0);
  }

  /**
   * Calcule le résultat de l'exercice (classes 6 et 7)
   */
  async calculatePeriodResult(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    totalCharges: number;
    totalProduits: number;
    result: number;
    isProfit: boolean;
  }> {
    const balances = await this.getAccountBalances(companyId, startDate, endDate);

    // Classe 6 = Charges (solde débiteur = montant)
    const charges = balances
      .filter(b => b.accountNumber.startsWith('6'))
      .reduce((sum, b) => sum + (b.debitTotal - b.creditTotal), 0);

    // Classe 7 = Produits (solde créditeur = montant)
    const produits = balances
      .filter(b => b.accountNumber.startsWith('7'))
      .reduce((sum, b) => sum + (b.creditTotal - b.debitTotal), 0);

    const result = produits - charges;

    return {
      totalCharges: charges,
      totalProduits: produits,
      result,
      isProfit: result >= 0
    };
  }

  // ============================================================================
  // CLÔTURE DE PÉRIODE (via RPC)
  // ============================================================================

  /**
   * Clôture une période comptable via la fonction RPC Supabase
   * 
   * La fonction RPC gère automatiquement:
   * 1. Validation pré-clôture
   * 2. Génération des écritures de clôture des comptes de résultat (classes 6, 7)
   * 3. Affectation du résultat au compte 120
   * 4. Génération des à-nouveaux pour la période suivante (si elle existe)
   * 5. Verrouillage de la période
   */
  async closePeriod(
    companyId: string,
    periodId: string
  ): Promise<PeriodClosureResult> {
    try {
      logger.info('PeriodClosure', `Closing period ${periodId} for company ${companyId}`);

      const { data, error } = await supabase.rpc('close_accounting_period', {
        p_period_id: periodId,
        p_company_id: companyId
      });

      if (error) {
        logger.error('PeriodClosure', 'RPC error closing period:', error);
        return {
          success: false,
          message: `Erreur lors de la clôture: ${error.message}`,
          errors: [error.message]
        };
      }

      const response = data as CloseAccountingPeriodResponse;

      if (!response.success) {
        logger.warn('PeriodClosure', 'Period closure failed:', response.error);
        return {
          success: false,
          message: response.error || 'Échec de la clôture',
          errors: [response.error || 'Erreur inconnue']
        };
      }

      // Récupérer la période mise à jour
      const period = await this.getPeriodById(periodId);

      // Construire les warnings
      const warnings: string[] = [];
      if (response.warnings) {
        if (response.warnings.unlettraged_clients > 0) {
          warnings.push(`${response.warnings.unlettraged_clients} ligne(s) clients non lettrées`);
        }
        if (response.warnings.unlettraged_suppliers > 0) {
          warnings.push(`${response.warnings.unlettraged_suppliers} ligne(s) fournisseurs non lettrées`);
        }
      }
      if (response.a_nouveaux_generated) {
        warnings.push('Écritures à-nouveaux générées pour la période suivante');
      }

      logger.info('PeriodClosure', 'Period closed successfully', {
        periodId,
        closingEntryId: response.closing_entry_id,
        resultAmount: response.result_amount,
        anGenerated: response.a_nouveaux_generated
      });

      return {
        success: true,
        message: response.message || 'Période clôturée avec succès',
        period: period || undefined,
        closingEntryId: response.closing_entry_id,
        anEntryId: response.a_nouveaux_entry_id,
        resultAmount: response.result_amount,
        resultType: response.result_type,
        warnings
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error('PeriodClosure', 'Closure exception:', err);
      return { success: false, message, errors: [message] };
    }
  }

  // ============================================================================
  // RÉOUVERTURE DE PÉRIODE (via RPC)
  // ============================================================================

  /**
   * Réouvre une période clôturée via la fonction RPC Supabase
   * 
   * La fonction RPC gère automatiquement:
   * 1. Suppression de l'écriture de clôture
   * 2. Suppression des à-nouveaux générés pour la période suivante
   * 3. Réouverture de la période
   */
  async reopenPeriod(
    companyId: string,
    periodId: string,
    reason: string
  ): Promise<PeriodClosureResult> {
    try {
      // Vérifier qu'aucune période postérieure n'est clôturée
      const period = await this.getPeriodById(periodId);
      if (!period) {
        return { success: false, message: 'Période non trouvée', errors: ['Période non trouvée'] };
      }

      const { data: laterPeriods } = await supabase
        .from('accounting_periods')
        .select('name')
        .eq('company_id', companyId)
        .gt('start_date', period.end_date)
        .eq('is_closed', true);

      if (laterPeriods && laterPeriods.length > 0) {
        return {
          success: false,
          message: 'Impossible de réouvrir: des périodes postérieures sont clôturées',
          errors: ['Périodes postérieures clôturées'],
          warnings: laterPeriods.map(p => `Période "${p.name}" est clôturée`)
        };
      }

      logger.warn('PeriodClosure', `Reopening period ${periodId}`, { reason });

      const { data, error } = await supabase.rpc('reopen_accounting_period', {
        p_period_id: periodId,
        p_company_id: companyId
      });

      if (error) {
        logger.error('PeriodClosure', 'RPC error reopening period:', error);
        return {
          success: false,
          message: `Erreur lors de la réouverture: ${error.message}`,
          errors: [error.message]
        };
      }

      const response = data as { success: boolean; error?: string; message?: string };

      if (!response.success) {
        return {
          success: false,
          message: response.error || 'Échec de la réouverture',
          errors: [response.error || 'Erreur inconnue']
        };
      }

      // Récupérer la période mise à jour
      const updatedPeriod = await this.getPeriodById(periodId);

      logger.warn('PeriodClosure', `Period reopened: ${period.name}`, {
        periodId,
        reason,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        message: response.message || `Période "${period.name}" réouverte`,
        period: updatedPeriod || undefined,
        warnings: [`Raison de réouverture: ${reason}`]
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error('PeriodClosure', 'Reopen exception:', err);
      return { success: false, message, errors: [message] };
    }
  }

  // ============================================================================
  // GÉNÉRATION DES À-NOUVEAUX (info)
  // ============================================================================

  /**
   * Note: Les à-nouveaux sont générés automatiquement par close_accounting_period
   * si la période suivante existe.
   * 
   * Si la période suivante n'existait pas lors de la clôture:
   * 1. Créer la nouvelle période
   * 2. Réouvrir l'ancienne période
   * 3. Reclôturer l'ancienne période (les AN seront générés)
   */
  async generateOpeningEntries(
    companyId: string,
    closedPeriodId: string,
    _newPeriodStartDate: string
  ): Promise<PeriodClosureResult> {
    const closedPeriod = await this.getPeriodById(closedPeriodId);
    
    if (!closedPeriod) {
      return { success: false, message: 'Période clôturée non trouvée', errors: ['Période non trouvée'] };
    }

    if (!closedPeriod.is_closed) {
      return {
        success: false,
        message: 'La période doit être clôturée pour générer les à-nouveaux',
        errors: ['Période non clôturée']
      };
    }

    // Vérifier si une période suivante existe
    const { data: nextPeriods } = await supabase
      .from('accounting_periods')
      .select('id, name')
      .eq('company_id', companyId)
      .gt('start_date', closedPeriod.end_date)
      .eq('is_closed', false)
      .order('start_date', { ascending: true })
      .limit(1);

    if (!nextPeriods || nextPeriods.length === 0) {
      return {
        success: false,
        message: 'Créez d\'abord la période suivante, puis réouvrez et reclôturez cette période pour générer les à-nouveaux automatiquement',
        warnings: ['Les à-nouveaux sont générés automatiquement lors de la clôture si la période suivante existe']
      };
    }

    // Si période suivante existe, proposer de réouvrir/reclôturer
    return {
      success: false,
      message: `La période suivante "${nextPeriods[0].name}" existe. Réouvrez puis reclôturez la période "${closedPeriod.name}" pour générer les à-nouveaux.`,
      warnings: ['Utilisez le bouton "Réouvrir" puis "Clôturer" à nouveau']
    };
  }
}

export const periodClosureService = PeriodClosureService.getInstance();
export default PeriodClosureService;
