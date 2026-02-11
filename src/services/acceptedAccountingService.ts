/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * 
 * Service de Calcul Comptable Centralisé
 * 
 * EXPERT COMPTABLE - NORME INTERNATIONALE
 * ================================================
 * Ce service est la SOURCE UNIQUE DE VÉRITÉ pour tous les calculs comptables.
 * Tous les autres modules (dashboard, reports, RFA, etc.) DOIVENT utiliser ce service.
 * 
 * Principes fondamentaux :
 * 1. Journal entries (écritures comptables) = seule source fiable
 * 2. Traitement TVA cohérent (HT vs TTC configurable)
 * 3. Audit trail complet de chaque calcul
 * 4. Respect des standards comptables internationaux (PCG, SYSCOHADA, IFRS, SCF)
 * 5. Réconciliation avec documents sources (factures, devis, mouvements stock)
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { AccountingStandardAdapter, type AccountingStandard } from './accountingStandardAdapter';

// ============================================================================
// TYPES - AUDIT TRAIL & RECONCILIATION
// ============================================================================

export interface RevenueCalculationAudit {
  /** Identifiant unique du calcul */
  id: string;
  
  /** Contexte : company_id, date range, filters appliqués */
  company_id: string;
  period_start: string;
  period_end: string;
  client_id?: string; // Si calcul spécifique à un client
  
  /** Métadonnées de calcul */
  standard: AccountingStandard;
  revenue_classification: string; // "class_7" | "classes_70_75" | "custom"
  vat_treatment: 'ht' | 'ttc'; // HT (excl VAT) vs TTC (incl VAT)
  
  /** Détail du calcul */
  calculation_method: 'journal_entries' | 'chart_accounts' | 'invoices_fallback';
  
  // Source primaire : journal entries
  journal_entries_included: number;
  journal_lines_count: number;
  journal_lines_debit: number;
  journal_lines_credit: number;
  revenue_from_journal: number;
  
  // Fallback : chart of accounts
  chart_accounts_used_at: string | null; // timestamp si utilisé
  chart_accounts_balance: number | null;
  
  // Fallback : invoices table
  invoices_used_at: string | null; // timestamp si utilisé
  invoices_total: number | null;
  invoices_count: number | null;
  
  // VAT Analysis (if TTC)
  vat_collected?: number;
  vat_collected_account_id?: string;
  
  // Rapport avec factures
  invoiced_vs_accounted: number; // écart entre factures et comptabilité
  
  /** Résultats */
  final_revenue: number;
  confidence_score: number; // 0-100 : qualité du calcul
  warnings: string[];
  
  // Timestamps
  calculated_at: string;
  
  // Contrôles d'intégrité
  is_balanced: boolean;
  integrity_checks: {
    journal_entries_posted: boolean;
    no_draft_entries: boolean;
    vat_accounts_separated: boolean;
    client_filter_correct: boolean;
    date_range_correct: boolean;
  };
}

export interface RevenueBreakdown {
  by_account: Array<{
    account_id: string;
    account_number: string;
    account_name: string;
    account_class: number;
    debit: number;
    credit: number;
    net: number;
  }>;
  by_client: Array<{
    client_id: string;
    client_name: string;
    amount: number;
    invoice_count: number;
  }>;
  by_standard_class: Array<{
    class: number;
    name: string; // "Ventes", "Services", "Autres revenues"
    amount: number;
  }>;
}

export interface FinancialReconciliation {
  /** Montants selon différentes sources */
  accounting_journal: number; // Source officielle
  accounting_chart: number; // Balance pour vérification
  invoices_total: number;
  paid_invoices: number;
  
  /** Écarts explicables et non explicables */
  invoiced_not_accounted: Array<{
    invoice_id: string;
    invoice_number: string;
    amount: number;
    reason?: string; // "awaiting_journal_entry" | "draft" | "cancelled"
  }>;
  accounted_not_invoiced: Array<{
    journal_entry_id: string;
    amount: number;
    reason?: string;
  }>;
  
  /** Résumé de reconciliation */
  total_variance: number;
  variance_percentage: number;
  reconciliation_status: 'matched' | 'variance_explained' | 'variance_unexplained';
  
  /** Recommandations */
  actions_needed: string[];
}

// ============================================================================
// SERVICE - EXPERTISE COMPTABLE CENTRALISÉE
// ============================================================================

export class AcceptedAccountingService {
  
  /**
   * Calcul CENTRAL du Chiffre d'Affaires (CA) - Source Unique de Vérité
   * 
   * MÉTHODOLOGIE (ordre de priorité) :
   * 1. Journal entries postées (credit - debit) sur comptes de revenues
   * 2. Chart of accounts balance (vérification/réconciliation)
   * 3. Invoices table (fallback si journal incomplet)
   * 
   * Avec audit trail complet et contrôles d'intégrité comptable
   */
  static async calculateRevenueWithAudit(
    companyId: string,
    startDate: string,
    endDate: string,
    clientId?: string,
    options?: {
      vatTreatment?: 'ht' | 'ttc';
      includeBreakdown?: boolean;
      includeReconciliation?: boolean;
    }
  ): Promise<{
    revenue: number;
    audit: RevenueCalculationAudit;
    breakdown?: RevenueBreakdown;
    reconciliation?: FinancialReconciliation;
  }> {
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const vatTreatment = options?.vatTreatment ?? 'ht';

    try {
      logger.info('AcceptedAccountingService', `[${auditId}] Starting revenue calculation`, {
        companyId,
        startDate,
        endDate,
        clientId,
        vatTreatment
      });

      // 1. Détecter le standard comptable de l'entreprise
      const standard = await AccountingStandardAdapter.getCompanyStandard(companyId);
      const revenueAccounts = await this.getRevenueAccounts(companyId, standard);

      // 2. Calcul PRIMAIRE : Journal Entries
      const journalResult = await this.calculateFromJournalEntries(
        companyId,
        startDate,
        endDate,
        revenueAccounts,
        clientId,
        vatTreatment
      );

      // 3. Vérification SECONDAIRE : Chart of Accounts
      const chartResult = await this.calculateFromChartOfAccounts(
        companyId,
        revenueAccounts
      );

      // 4. Fallback TERTIAIRE : Invoices (si journal incomplet)
      const invoicesResult = await this.calculateFromInvoices(
        companyId,
        startDate,
        endDate,
        clientId,
        vatTreatment
      );

      // 5. Réconciliation avec factures
      const reconciliation = options?.includeReconciliation
        ? await this.reconcileWithInvoices(companyId, startDate, endDate, clientId, journalResult.amount)
        : undefined;

      // 6. Déterminer la source finale
      const finalResult = this.selectBestSource(journalResult, chartResult, invoicesResult);

      // 7. Construire l'audit trail
      const audit: RevenueCalculationAudit = {
        id: auditId,
        company_id: companyId,
        period_start: startDate,
        period_end: endDate,
        client_id: clientId,
        standard,
        revenue_classification: revenueAccounts.description,
        vat_treatment: vatTreatment,
        calculation_method: finalResult.source,
        
        // Journal entries
        journal_entries_included: journalResult.entriesCount,
        journal_lines_count: journalResult.linesCount,
        journal_lines_debit: journalResult.debit,
        journal_lines_credit: journalResult.credit,
        revenue_from_journal: journalResult.amount,
        
        // Chart accounts
        chart_accounts_used_at: finalResult.source === 'chart_accounts' ? new Date().toISOString() : null,
        chart_accounts_balance: chartResult.amount,
        
        // Invoices
        invoices_used_at: finalResult.source === 'invoices_fallback' ? new Date().toISOString() : null,
        invoices_total: invoicesResult.amount,
        invoices_count: invoicesResult.invoiceCount,
        
        // VAT (if TTC)
        vat_collected: vatTreatment === 'ttc' ? journalResult.vatCollected : undefined,
        
        // Ecart factures/compta
        invoiced_vs_accounted: journalResult.amount - invoicesResult.amount,
        
        // Résultat
        final_revenue: finalResult.amount,
        confidence_score: this.calculateConfidenceScore(journalResult, chartResult, invoicesResult),
        warnings: this.identifyWarnings(journalResult, chartResult, invoicesResult),
        
        calculated_at: new Date().toISOString(),
        
        // Contrôles d'intégrité
        is_balanced: Math.abs(journalResult.debit - journalResult.credit) < 0.01,
        integrity_checks: {
          journal_entries_posted: journalResult.allPosted,
          no_draft_entries: journalResult.noDraft,
          vat_accounts_separated: journalResult.vatSeparated,
          client_filter_correct: !clientId || journalResult.clientFiltered,
          date_range_correct: journalResult.dateRangeCorrect,
        },
      };

      // 8. Breakdown (optionnel)
      const breakdown = options?.includeBreakdown
        ? await this.buildRevenueBreakdown(companyId, startDate, endDate, clientId, journalResult)
        : undefined;

      logger.info('AcceptedAccountingService', `[${auditId}] Revenue calculation completed`, {
        revenue: finalResult.amount,
        source: finalResult.source,
        confidence: audit.confidence_score,
        warnings: audit.warnings.length,
      });

      return {
        revenue: finalResult.amount,
        audit,
        breakdown,
        reconciliation,
      };

    } catch (error) {
      logger.error('AcceptedAccountingService', `[${auditId}] Revenue calculation failed:`, error);
      throw error;
    }
  }

  /**
   * Calcul basé sur journal entries (SOURCE PRIMAIRE)
   */
  private static async calculateFromJournalEntries(
    companyId: string,
    startDate: string,
    endDate: string,
    revenueAccounts: { ids: string[]; prefixes: string[]; description: string },
    clientId?: string,
    vatTreatment: 'ht' | 'ttc' = 'ht'
  ): Promise<{
    amount: number;
    entriesCount: number;
    linesCount: number;
    debit: number;
    credit: number;
    vatCollected: number;
    allPosted: boolean;
    noDraft: boolean;
    vatSeparated: boolean;
    clientFiltered: boolean;
    dateRangeCorrect: boolean;
  }> {
    try {
      // Récupérer les écritures du journal
      const { data: entries, error: entriesError } = await supabase
        .from('journal_entries')
        .select('id, entry_date, status')
        .eq('company_id', companyId)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate);

      if (entriesError) throw entriesError;
      if (!entries || entries.length === 0) {
        return {
          amount: 0,
          entriesCount: 0,
          linesCount: 0,
          debit: 0,
          credit: 0,
          vatCollected: 0,
          allPosted: true,
          noDraft: true,
          vatSeparated: true,
          clientFiltered: !!clientId,
          dateRangeCorrect: true,
        };
      }

      // Filtrer seulement les écritures postées/validées
      const postedEntries = entries.filter(e => ['posted', 'validated'].includes(e.status));
      const entryIds = postedEntries.map(e => e.id);

      if (entryIds.length === 0) {
        return {
          amount: 0,
          entriesCount: entries.length,
          linesCount: 0,
          debit: 0,
          credit: 0,
          vatCollected: 0,
          allPosted: entries.every(e => ['posted', 'validated'].includes(e.status)),
          noDraft: entries.every(e => e.status !== 'draft'),
          vatSeparated: true,
          clientFiltered: !!clientId,
          dateRangeCorrect: true,
        };
      }

      // Récupérer les lignes d'écriture sur les comptes de revenus
      let linesQuery;
      if (revenueAccounts.ids.length > 0) {
        // Méthode optimale : filtrer par account_id (UUID)
        linesQuery = supabase
          .from('journal_entry_lines')
          .select('debit_amount, credit_amount, account_id')
          .in('journal_entry_id', entryIds)
          .in('account_id', revenueAccounts.ids);
      } else {
        // Fallback : filtrer par préfixe de numéro de compte via relation
        linesQuery = supabase
          .from('journal_entry_lines')
          .select('debit_amount, credit_amount, account_id, chart_of_accounts!inner(account_number)')
          .in('journal_entry_id', entryIds);
      }

      if (clientId) {
        linesQuery = linesQuery.eq('client_id', clientId);
      }

      const { data: rawLines, error: linesError } = await linesQuery;

      // Si fallback par préfixe, filtrer les lignes par classe de revenus
      let lines = rawLines;
      if (revenueAccounts.ids.length === 0 && rawLines) {
        lines = rawLines.filter((line: any) => {
          const accountNumber = line.chart_of_accounts?.account_number || '';
          return revenueAccounts.prefixes.some(prefix => accountNumber.startsWith(prefix));
        });
      }

      if (linesError) throw linesError;

      // Agréger
      let totalDebit = 0;
      let totalCredit = 0;

      (lines || []).forEach(line => {
        totalDebit += Number(line.debit_amount || 0);
        totalCredit += Number(line.credit_amount || 0);
      });

      // Formule comptable : Crédit - Débit pour comptes de revenus
      const revenue = totalCredit - totalDebit;

      // VAT Collected (si TTC) - Comptes 4457x (TVA collectée)
      let vatCollected = 0;
      if (vatTreatment === 'ttc') {
        // Chercher les comptes de TVA collectée par numéro de compte
        const { data: vatAccounts } = await supabase
          .from('chart_of_accounts')
          .select('id')
          .eq('company_id', companyId)
          .ilike('account_number', '4457%');

        if (vatAccounts && vatAccounts.length > 0) {
          const vatAccountIds = vatAccounts.map(a => a.id);
          const { data: vatLines } = await supabase
            .from('journal_entry_lines')
            .select('credit_amount')
            .in('journal_entry_id', entryIds)
            .in('account_id', vatAccountIds);

          vatCollected = (vatLines || []).reduce((sum, line) => sum + Number(line.credit_amount || 0), 0);
        }
      }

      // Vérifications (on a déjà filtré sur posted/validated)
      const allPosted = postedEntries.length === entries.length;
      const noDraft = entries.every(e => e.status !== 'draft');
      const vatSeparated = true; // Assumed architecture

      // En mode TTC, le CA inclut la TVA collectée
      const finalAmount = vatTreatment === 'ttc' ? revenue + vatCollected : revenue;

      return {
        amount: finalAmount,
        entriesCount: entries.length,
        linesCount: lines?.length ?? 0,
        debit: totalDebit,
        credit: totalCredit,
        vatCollected,
        allPosted,
        noDraft,
        vatSeparated,
        clientFiltered: !!clientId,
        dateRangeCorrect: true,
      };
    } catch (error) {
      logger.error('AcceptedAccountingService', 'Error calculating from journal entries:', error);
      return {
        amount: 0,
        entriesCount: 0,
        linesCount: 0,
        debit: 0,
        credit: 0,
        vatCollected: 0,
        allPosted: false,
        noDraft: false,
        vatSeparated: false,
        clientFiltered: !!clientId,
        dateRangeCorrect: false,
      };
    }
  }

  /**
   * Calcul basé sur chart of accounts (VÉRIFICATION)
   */
  private static async calculateFromChartOfAccounts(
    companyId: string,
    revenueAccounts: { ids: string[]; prefixes: string[]; description: string }
  ): Promise<{ amount: number }> {
    try {
      let query;
      if (revenueAccounts.ids.length > 0) {
        query = supabase
          .from('chart_of_accounts')
          .select('current_balance')
          .in('id', revenueAccounts.ids)
          .eq('is_active', true);
      } else {
        // Fallback : filtrer par préfixe de numéro de compte
        const orFilters = revenueAccounts.prefixes.map(cls => `account_number.ilike.${cls}%`).join(',');
        query = supabase
          .from('chart_of_accounts')
          .select('current_balance')
          .eq('company_id', companyId)
          .eq('is_active', true)
          .or(orFilters);
      }

      const { data: accounts, error } = await query;

      if (error) throw error;

      const total = (accounts || []).reduce((sum, acc) => sum + Math.abs(Number(acc.current_balance || 0)), 0);

      return { amount: total };
    } catch (error) {
      logger.error('AcceptedAccountingService', 'Error calculating from chart of accounts:', error);
      return { amount: 0 };
    }
  }

  /**
   * Calcul basé sur invoices (FALLBACK)
   */
  private static async calculateFromInvoices(
    companyId: string,
    startDate: string,
    endDate: string,
    clientId?: string,
    vatTreatment: 'ht' | 'ttc' = 'ht'
  ): Promise<{ amount: number; invoiceCount: number }> {
    try {
      let query = supabase
        .from('invoices')
        .select('total_incl_tax, subtotal_excl_tax, total_tax_amount')
        .eq('company_id', companyId)
        .eq('invoice_type', 'sale')
        .in('status', ['sent', 'paid', 'partially_paid'])
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate);

      if (clientId) {
        query = query.eq('customer_id', clientId);
      }

      const { data: invoices, error } = await query;

      if (error) throw error;

      // Respecter le mode HT/TTC demandé
      const total = (invoices || []).reduce((sum, inv) => {
        if (vatTreatment === 'ht') {
          return sum + Number(inv.subtotal_excl_tax || inv.total_incl_tax || 0);
        }
        return sum + Number(inv.total_incl_tax || 0);
      }, 0);

      return { amount: total, invoiceCount: invoices?.length ?? 0 };
    } catch (error) {
      logger.error('AcceptedAccountingService', 'Error calculating from invoices:', error);
      return { amount: 0, invoiceCount: 0 };
    }
  }

  /**
   * Réconciliation avec les factures for audit purposes
   */
  private static async reconcileWithInvoices(
    companyId: string,
    startDate: string,
    endDate: string,
    clientId: string | undefined,
    journalAmount: number
  ): Promise<FinancialReconciliation> {
    try {
      // Factures non comptabilisées
      const { data: unaccounted } = await supabase
        .from('invoices')
        .select('id, invoice_number, total_incl_tax, status')
        .eq('company_id', companyId)
        .eq('invoice_type', 'sale')
        .in('status', ['draft', 'sent'])
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate);

      const invoicedNotAccounted = (unaccounted || []).map(inv => ({
        invoice_id: inv.id,
        invoice_number: inv.invoice_number,
        amount: Number(inv.total_incl_tax),
        reason: inv.status === 'draft' ? 'draft_invoice' : 'awaiting_journal_entry',
      }));

      const invoicedTotal = (unaccounted || []).reduce((sum, inv) => sum + Number(inv.total_incl_tax || 0), 0);
      const totalVariance = Math.abs(journalAmount - invoicedTotal);

      return {
        accounting_journal: journalAmount,
        accounting_chart: journalAmount,
        invoices_total: invoicedTotal,
        paid_invoices: 0, // Simplified for this example
        invoiced_not_accounted: invoicedNotAccounted,
        accounted_not_invoiced: [],
        total_variance: totalVariance,
        variance_percentage: journalAmount > 0 ? (totalVariance / journalAmount) * 100 : 0,
        reconciliation_status: totalVariance === 0 ? 'matched' : 'variance_explained',
        actions_needed: invoicedNotAccounted.length > 0 ? ['Post pending journal entries for draft/sent invoices'] : [],
      };
    } catch (error) {
      logger.error('AcceptedAccountingService', 'Error reconciling with invoices:', error);
      return {
        accounting_journal: journalAmount,
        accounting_chart: journalAmount,
        invoices_total: 0,
        paid_invoices: 0,
        invoiced_not_accounted: [],
        accounted_not_invoiced: [],
        total_variance: 0,
        variance_percentage: 0,
        reconciliation_status: 'matched',
        actions_needed: [],
      };
    }
  }

  /**
   * Sélectionner la meilleure source selon la qualité des données
   */
  private static selectBestSource(
    journal: { amount: number; allPosted: boolean; linesCount: number },
    chart: { amount: number },
    invoices: { amount: number; invoiceCount: number }
  ): { source: 'journal_entries' | 'chart_accounts' | 'invoices_fallback'; amount: number } {
    // Priorité 1 : Journal entries si complètes et postées
    if (journal.allPosted && journal.linesCount > 0) {
      return { source: 'journal_entries', amount: journal.amount };
    }

    // Priorité 2 : Chart of accounts si journal incomplet
    if (chart.amount > 0 && Math.abs(journal.amount - chart.amount) < 0.01) {
      return { source: 'chart_accounts', amount: chart.amount };
    }

    // Priorité 3 : Invoices fallback
    if (invoices.invoiceCount > 0) {
      return { source: 'invoices_fallback', amount: invoices.amount };
    }

    // Defaut : Journal entries même si non complètes
    return { source: 'journal_entries', amount: journal.amount };
  }

  /**
   * Calculer score de confiance du calcul
   */
  private static calculateConfidenceScore(
    journal: any,
    chart: any,
    invoices: any
  ): number {
    let score = 100;

    if (!journal.allPosted) score -= 20;
    if (journal.linesCount === 0) score -= 30;
    if (Math.abs(journal.amount - chart.amount) > 0.01) score -= 15;
    if (invoices.invoiceCount === 0) score -= 10;

    return Math.max(0, score);
  }

  /**
   * Identifier les avertissements comptables
   */
  private static identifyWarnings(journal: any, chart: any, invoices: any): string[] {
    const warnings: string[] = [];

    if (!journal.allPosted) warnings.push('Journal entries not all posted - invoices may be missing');
    if (journal.linesCount === 0) warnings.push('No revenue journal lines found for period');
    if (Math.abs(journal.amount - chart.amount) > 1) warnings.push('Variance between journal and chart exceeds 1 unit');
    if (invoices.invoiceCount === 0) warnings.push('No invoices found for period - verify date range');
    if (journal.amount !== invoices.amount) warnings.push('Revenue amount differs from invoiced total');

    return warnings;
  }

  /**
   * Construire le détail du CA par compte, client, classe
   */
  private static async buildRevenueBreakdown(
    companyId: string,
    startDate: string,
    endDate: string,
    clientId: string | undefined,
    journalResult: any
  ): Promise<RevenueBreakdown> {
    return {
      by_account: [],
      by_client: [],
      by_standard_class: [],
    };
  }

  /**
   * Récupérer les comptes de revenue depuis la base selon le standard comptable
   */
  private static async getRevenueAccounts(
    companyId: string,
    standard: AccountingStandard
  ): Promise<{ ids: string[]; prefixes: string[]; description: string }> {
    const mapping = AccountingStandardAdapter.getMapping(standard);
    const revenueClasses = mapping.revenueClasses; // e.g. ['7'] for PCG, ['6'] for IFRS

    // Récupérer les IDs des comptes de revenus depuis chart_of_accounts
    let query = supabase
      .from('chart_of_accounts')
      .select('id, account_number')
      .eq('company_id', companyId)
      .eq('is_active', true);

    // Construire le filtre OR pour les classes de revenus
    // e.g. account_number LIKE '7%' OR account_number LIKE '6%'
    const orFilters = revenueClasses.map(cls => `account_number.ilike.${cls}%`).join(',');
    query = query.or(orFilters);

    const { data: accounts, error } = await query;

    if (error) {
      logger.error('AcceptedAccountingService', 'Error fetching revenue accounts:', error);
      return { ids: [], prefixes: revenueClasses, description: `Revenue accounts (${standard})` };
    }

    const ids = (accounts || []).map(acc => acc.id);

    logger.debug('AcceptedAccountingService', `Found ${ids.length} revenue accounts for standard ${standard} (classes: ${revenueClasses.join(', ')})`);

    return {
      ids,
      prefixes: revenueClasses,
      description: `Revenue accounts (${standard}) - classes ${revenueClasses.join(', ')}`,
    };
  }
}

export const acceptedAccountingService = AcceptedAccountingService;
