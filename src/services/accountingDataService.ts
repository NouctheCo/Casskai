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
/**
 * Service de récupération et traitement des données comptables
 * Interface entre les écritures comptables et les rapports financiers
 */
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
export interface AccountingTransaction {
  id: string;
  company_id: string;
  transaction_date: string;
  reference: string;
  description: string;
  journal_code: string;
  entries: AccountingEntry[];
  total_debit: number;
  total_credit: number;
  validated: boolean;
  created_at: string;
  updated_at: string;
}
export interface AccountingEntry {
  id: string;
  transaction_id: string;
  account_code: string;
  account_name: string;
  debit_amount: number;
  credit_amount: number;
  description: string;
  analytical_code?: string;
  third_party_code?: string;
}
export interface ChartOfAccounts {
  account_code: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  account_class: '1' | '2' | '3' | '4' | '5' | '6' | '7';
  parent_code?: string;
  is_active: boolean;
  balance_type: 'debit' | 'credit';
}
export interface AccountBalance {
  account_code: string;
  account_name: string;
  opening_balance: number;
  period_debit: number;
  period_credit: number;
  closing_balance: number;
  balance_type: 'debit' | 'credit';
}

export interface ReceivablesAgingDetail {
  invoice_id: string;
  invoice_number: string;
  client_name: string;
  amount: number;
  due_date: string;
  days_overdue: number;
  aging_bucket: string;
}

export interface ReceivablesAgingAnalysis {
  aged_analysis: {
    current: number;
    days_1_30: number;
    days_31_60: number;
    days_61_90: number;
    over_90: number;
  };
  total_receivables: number;
  average_collection_period: number;
  details?: ReceivablesAgingDetail[];
}
export class AccountingDataService {
  private static instance: AccountingDataService;
  static getInstance(): AccountingDataService {
    if (!AccountingDataService.instance) {
      AccountingDataService.instance = new AccountingDataService();
    }
    return AccountingDataService.instance;
  }
  /**
   * Récupère toutes les écritures comptables d'une période
   */
  async getTransactions(
    companyId: string,
    startDate: string,
    endDate: string,
    accountCodes?: string[]
  ): Promise<AccountingTransaction[]> {
    try {
      // TODO: Remplacer par l'appel réel à Supabase
      const _query = `
        SELECT
          t.*,
          json_agg(e.*) as entries
        FROM accounting_transactions t
        LEFT JOIN accounting_entries e ON t.id = e.transaction_id
        WHERE t.company_id = $1
        AND t.transaction_date BETWEEN $2 AND $3
        AND t.validated = true
        ${accountCodes ? 'AND e.account_code = ANY($4)' : ''}
        GROUP BY t.id
        ORDER BY t.transaction_date, t.reference
      `;
      // Simulation de données pour le développement
      // return this.generateMockTransactions(companyId, startDate, endDate);
      return [];
    } catch (error) {
      logger.error('AccountingData', 'Erreur lors de la récupération des transactions:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }
  /**
   * Calcule les soldes de tous les comptes pour une période
   */
  async getAccountBalances(
    companyId: string,
    startDate: string,
    endDate: string,
    accountCodes?: string[]
  ): Promise<Record<string, AccountBalance>> {
    const transactions = await this.getTransactions(companyId, startDate, endDate, accountCodes);
    const balances: Record<string, AccountBalance> = {};
    // Initialiser les soldes
    const chart = await this.getChartOfAccounts(companyId);
    for (const account of chart) {
      balances[account.account_code] = {
        account_code: account.account_code,
        account_name: account.account_name,
        opening_balance: 0, // TODO: Calculer le solde d'ouverture
        period_debit: 0,
        period_credit: 0,
        closing_balance: 0,
        balance_type: account.balance_type
      };
    }
    // Calculer les mouvements de la période
    for (const transaction of transactions) {
      for (const entry of transaction.entries) {
        if (balances[entry.account_code]) {
          balances[entry.account_code].period_debit += entry.debit_amount;
          balances[entry.account_code].period_credit += entry.credit_amount;
        }
      }
    }
    // Calculer les soldes de clôture
    for (const accountCode in balances) {
      const balance = balances[accountCode];
      const netMovement = balance.period_debit - balance.period_credit;
      if (balance.balance_type === 'debit') {
        balance.closing_balance = balance.opening_balance + netMovement;
      } else {
        balance.closing_balance = balance.opening_balance - netMovement;
      }
    }
    return balances;
  }
  /**
   * Récupère le plan comptable de l'entreprise
   */
  async getChartOfAccounts(companyId: string): Promise<ChartOfAccounts[]> {
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('account_number');
      if (error) throw error;
      if (!data || data.length === 0) {
        return this.getDefaultChartOfAccounts();
      }
      return data.map(account => ({
        account_code: account.account_number || '',
        account_name: account.account_name || '',
        account_type: this.determineAccountType(account.account_number || ''),
        account_class: (account.account_number?.charAt(0) || '1') as '1' | '2' | '3' | '4' | '5' | '6' | '7',
        parent_code: account.parent_account_id || undefined,
        is_active: account.is_active ?? true,
        balance_type: this.determineBalanceType(account.account_number || '')
      }));
    } catch (error) {
      logger.error('AccountingData', 'Erreur lors de la récupération du plan comptable:', error instanceof Error ? error.message : String(error));
      return this.getDefaultChartOfAccounts();
    }
  }
  /**
   * Retourne le plan comptable par défaut (Plan Comptable OHADA)
   */
  private getDefaultChartOfAccounts(): ChartOfAccounts[] {
    return [
      // Classe 1 - Comptes de capitaux
      { account_code: '101', account_name: 'Capital social', account_type: 'equity', account_class: '1', is_active: true, balance_type: 'credit' },
      { account_code: '106', account_name: 'Réserves', account_type: 'equity', account_class: '1', is_active: true, balance_type: 'credit' },
      { account_code: '12', account_name: 'Résultat de l\'exercice', account_type: 'equity', account_class: '1', is_active: true, balance_type: 'credit' },
      { account_code: '16', account_name: 'Emprunts et dettes assimilées', account_type: 'liability', account_class: '1', is_active: true, balance_type: 'credit' },
      // Classe 2 - Comptes d'immobilisations
      { account_code: '21', account_name: 'Immobilisations incorporelles', account_type: 'asset', account_class: '2', is_active: true, balance_type: 'debit' },
      { account_code: '22', account_name: 'Terrains', account_type: 'asset', account_class: '2', is_active: true, balance_type: 'debit' },
      { account_code: '23', account_name: 'Bâtiments', account_type: 'asset', account_class: '2', is_active: true, balance_type: 'debit' },
      { account_code: '24', account_name: 'Matériel', account_type: 'asset', account_class: '2', is_active: true, balance_type: 'debit' },
      // Classe 3 - Comptes de stocks
      { account_code: '31', account_name: 'Marchandises', account_type: 'asset', account_class: '3', is_active: true, balance_type: 'debit' },
      { account_code: '32', account_name: 'Matières premières', account_type: 'asset', account_class: '3', is_active: true, balance_type: 'debit' },
      { account_code: '37', account_name: 'Stocks de produits finis', account_type: 'asset', account_class: '3', is_active: true, balance_type: 'debit' },
      // Classe 4 - Comptes de tiers
      { account_code: '401', account_name: 'Fournisseurs', account_type: 'liability', account_class: '4', is_active: true, balance_type: 'credit' },
      { account_code: '411', account_name: 'Clients', account_type: 'asset', account_class: '4', is_active: true, balance_type: 'debit' },
      { account_code: '421', account_name: 'Personnel - Rémunérations dues', account_type: 'liability', account_class: '4', is_active: true, balance_type: 'credit' },
      { account_code: '43', account_name: 'Organismes sociaux', account_type: 'liability', account_class: '4', is_active: true, balance_type: 'credit' },
      { account_code: '44', account_name: 'État et collectivités publiques', account_type: 'liability', account_class: '4', is_active: true, balance_type: 'credit' },
      // Classe 5 - Comptes de trésorerie
      { account_code: '512', account_name: 'Banques', account_type: 'asset', account_class: '5', is_active: true, balance_type: 'debit' },
      { account_code: '53', account_name: 'Caisse', account_type: 'asset', account_class: '5', is_active: true, balance_type: 'debit' },
      // Classe 6 - Comptes de charges
      { account_code: '601', account_name: 'Achats de marchandises', account_type: 'expense', account_class: '6', is_active: true, balance_type: 'debit' },
      { account_code: '604', account_name: 'Achats de matières premières', account_type: 'expense', account_class: '6', is_active: true, balance_type: 'debit' },
      { account_code: '61', account_name: 'Transports', account_type: 'expense', account_class: '6', is_active: true, balance_type: 'debit' },
      { account_code: '62', account_name: 'Services extérieurs', account_type: 'expense', account_class: '6', is_active: true, balance_type: 'debit' },
      { account_code: '63', account_name: 'Impôts et taxes', account_type: 'expense', account_class: '6', is_active: true, balance_type: 'debit' },
      { account_code: '64', account_name: 'Charges de personnel', account_type: 'expense', account_class: '6', is_active: true, balance_type: 'debit' },
      { account_code: '65', account_name: 'Autres charges', account_type: 'expense', account_class: '6', is_active: true, balance_type: 'debit' },
      // Classe 7 - Comptes de produits
      { account_code: '701', account_name: 'Ventes de marchandises', account_type: 'revenue', account_class: '7', is_active: true, balance_type: 'credit' },
      { account_code: '706', account_name: 'Prestations de services', account_type: 'revenue', account_class: '7', is_active: true, balance_type: 'credit' },
      { account_code: '707', account_name: 'Produits des activités annexes', account_type: 'revenue', account_class: '7', is_active: true, balance_type: 'credit' },
      { account_code: '75', account_name: 'Autres produits', account_type: 'revenue', account_class: '7', is_active: true, balance_type: 'credit' },
    ];
  }
  /**
   * Détermine le type de compte en fonction du numéro
   */
  private determineAccountType(accountNumber: string): 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' {
    const firstChar = accountNumber.charAt(0);
    switch (firstChar) {
      case '1':
        return 'equity';
      case '2':
      case '3':
      case '4':
      case '5':
        return accountNumber.startsWith('4') && parseInt(accountNumber.charAt(1)) < 2 ? 'liability' : 'asset';
      case '6':
        return 'expense';
      case '7':
        return 'revenue';
      default:
        return 'asset';
    }
  }
  /**
   * Détermine le type de solde (débit ou crédit) en fonction du numéro de compte
   */
  private determineBalanceType(accountNumber: string): 'debit' | 'credit' {
    const firstChar = accountNumber.charAt(0);
    // Classes 1, 4 (certains), 7 = crédit
    // Classes 2, 3, 5, 6 = débit
    if (firstChar === '1' || firstChar === '7') return 'credit';
    if (firstChar === '4') {
      // 401-429 = crédit (fournisseurs, dettes)
      // 430+ = débit (clients, créances)
      const accountNum = parseInt(accountNumber.substring(0, 3));
      return accountNum >= 401 && accountNum < 430 ? 'credit' : 'debit';
    }
    return 'debit';
  }
  /**
   * Calcule le besoin en fonds de roulement
   */
  async calculateWorkingCapital(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    current_assets: number;
    current_liabilities: number;
    working_capital: number;
    working_capital_ratio: number;
  }> {
    const balances = await this.getAccountBalances(companyId, startDate, endDate);
    const currentAssets = this.sumAccountsByPattern(balances, ['3', '41', '42', '43', '44', '5']);
    const currentLiabilities = this.sumAccountsByPattern(balances, ['40', '42', '43', '44', '45']);
    const workingCapital = currentAssets - currentLiabilities;
    const workingCapitalRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
    return {
      current_assets: currentAssets,
      current_liabilities: currentLiabilities,
      working_capital: workingCapital,
      working_capital_ratio: workingCapitalRatio
    };
  }
  /**
   * Analyse l'évolution des créances clients
   *
   * ✅ IMPLÉMENTATION RÉELLE basée sur les factures de vente impayées
   * Source primaire : table invoices (factures émises non réglées)
   * Source secondaire (vérification) : comptes 411/413/416 du plan comptable
   */
  async analyzeReceivables(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    total_receivables: number;
    aged_analysis: {
      current: number;
      days_1_30: number;
      days_31_60: number;
      days_61_90: number;
      over_90: number;
    };
    average_collection_period: number;
    details?: ReceivablesAgingDetail[];
  }> {
    try {
      const today = new Date();

      // 1️⃣ Récupérer les factures de vente impayées
      const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('id, invoice_number, invoice_date, due_date, total_incl_tax, paid_amount, status, customers!customer_id(name)')
        .eq('company_id', companyId)
        .eq('invoice_type', 'sale')
        .neq('status', 'paid')
        .neq('status', 'cancelled')
        .gte('issue_date', startDate)
        .lte('issue_date', endDate);

      if (invError) {
        logger.error('AccountingData', 'Error fetching invoices for aging:', invError);
        // Fallback sur les soldes comptables
        return this.analyzeReceivablesFallback(companyId, startDate, endDate);
      }

      // 2️⃣ Classer chaque facture dans un bucket d'ancienneté
      const aging = { current: 0, days_1_30: 0, days_31_60: 0, days_61_90: 0, over_90: 0 };
      const details: ReceivablesAgingDetail[] = [];
      let totalDaysWeighted = 0;
      let totalReceivables = 0;

      (invoices || []).forEach((inv: any) => {
        const balance = (inv.total_incl_tax || 0) - (inv.paid_amount || 0);
        if (balance <= 0) return;

        totalReceivables += balance;

        // Calcul des jours d'échéance
        const dueDate = inv.due_date ? new Date(inv.due_date) : new Date(inv.invoice_date);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        // Pondération pour le délai moyen de recouvrement
        const invoiceDate = new Date(inv.invoice_date);
        const daysOutstanding = Math.max(0, Math.floor((today.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24)));
        totalDaysWeighted += daysOutstanding * balance;

        // Bucket d'ancienneté (clés alignées avec ReceivablesAgingChart)
        let bucket: string;
        if (daysOverdue <= 0) {
          aging.current += balance;
          bucket = 'current';
        } else if (daysOverdue <= 30) {
          aging.days_1_30 += balance;
          bucket = 'days_1_30';
        } else if (daysOverdue <= 60) {
          aging.days_31_60 += balance;
          bucket = 'days_31_60';
        } else if (daysOverdue <= 90) {
          aging.days_61_90 += balance;
          bucket = 'days_61_90';
        } else {
          aging.over_90 += balance;
          bucket = 'over_90';
        }

        // Détail de la facture
        details.push({
          invoice_id: inv.id,
          invoice_number: inv.invoice_number || inv.id.substring(0, 8),
          client_name: inv.customers?.name || 'Client inconnu',
          amount: balance,
          due_date: inv.due_date || inv.invoice_date,
          days_overdue: Math.max(0, daysOverdue),
          aging_bucket: bucket
        });
      });

      // Délai moyen de recouvrement pondéré
      const averageCollectionPeriod = totalReceivables > 0
        ? Math.round(totalDaysWeighted / totalReceivables)
        : 0;

      // Trier les détails par jours de retard décroissant
      details.sort((a, b) => b.days_overdue - a.days_overdue);

      return {
        total_receivables: totalReceivables,
        aged_analysis: aging,
        average_collection_period: averageCollectionPeriod,
        details
      };
    } catch (error) {
      logger.error('AccountingData', 'Error in analyzeReceivables:', error);
      return this.analyzeReceivablesFallback(companyId, startDate, endDate);
    }
  }

  /**
   * Fallback : analyse basée sur les soldes comptables (comptes 411/413/416)
   * Utilisé si la table invoices est indisponible
   */
  private async analyzeReceivablesFallback(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    total_receivables: number;
    aged_analysis: {
      current: number;
      days_1_30: number;
      days_31_60: number;
      days_61_90: number;
      over_90: number;
    };
    average_collection_period: number;
  }> {
    const balances = await this.getAccountBalances(companyId, startDate, endDate);
    const totalReceivables = this.sumAccountsByPattern(balances, ['411', '413', '416']);

    // Avec seulement les soldes comptables, on ne peut pas ventiler par ancienneté
    // On met tout en "current" pour ne pas induire en erreur
    return {
      total_receivables: totalReceivables,
      aged_analysis: {
        current: totalReceivables,
        days_1_30: 0,
        days_31_60: 0,
        days_61_90: 0,
        over_90: 0
      },
      average_collection_period: 0
    };
  }
  /**
   * Calcule les ratios de rentabilité
   */
  async calculateProfitabilityRatios(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    gross_margin: number;
    operating_margin: number;
    net_margin: number;
    return_on_assets: number;
    return_on_equity: number;
  }> {
    const balances = await this.getAccountBalances(companyId, startDate, endDate);
    const revenue = Math.abs(this.sumAccountsByPattern(balances, ['70', '71', '72']));
    const cogs = this.sumAccountsByPattern(balances, ['60', '601', '602']);
    const operatingExpenses = this.sumAccountsByPattern(balances, ['61', '62', '63', '64']);
    const netIncome = Math.abs(this.sumAccountsByPattern(balances, ['120']));
    const totalAssets = this.sumAccountsByPattern(balances, ['2', '3', '4', '5']);
    const totalEquity = Math.abs(this.sumAccountsByPattern(balances, ['1']));
    const grossProfit = revenue - Math.abs(cogs);
    const operatingIncome = grossProfit - Math.abs(operatingExpenses);
    return {
      gross_margin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
      operating_margin: revenue > 0 ? (operatingIncome / revenue) * 100 : 0,
      net_margin: revenue > 0 ? (netIncome / revenue) * 100 : 0,
      return_on_assets: totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0,
      return_on_equity: totalEquity > 0 ? (netIncome / totalEquity) * 100 : 0
    };
  }
  /**
   * Génère les données pour la déclaration de TVA
   */
  async generateVATData(
    companyId: string,
    month: string,
    year: string
  ): Promise<{
    period: string;
    vat_collected: number;
    vat_deductible: number;
    vat_due: number;
    turnover_subject_to_vat: number;
  }> {
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
    const balances = await this.getAccountBalances(companyId, startDate, endDate);
    const vatCollected = Math.abs(this.sumAccountsByPattern(balances, ['4457']));
    const vatDeductible = this.sumAccountsByPattern(balances, ['4456']);
    const vatDue = Math.max(0, vatCollected - vatDeductible);
    const turnover = Math.abs(this.sumAccountsByPattern(balances, ['70', '71']));
    return {
      period: `${month}/${year}`,
      vat_collected: vatCollected,
      vat_deductible: vatDeductible,
      vat_due: vatDue,
      turnover_subject_to_vat: turnover
    };
  }
  // Méthodes utilitaires privées
  private sumAccountsByPattern(balances: Record<string, AccountBalance>, patterns: string[]): number {
    let total = 0;
    for (const accountCode in balances) {
      const shouldInclude = patterns.some(pattern => {
        if (pattern.length === 1) {
          return accountCode.startsWith(pattern);
        }
        return accountCode.startsWith(pattern);
      });
      if (shouldInclude) {
        const balance = balances[accountCode];
        total += balance.closing_balance;
      }
    }
    return total;
  }
  /**
   * Get accounting statistics for a period
   */
  async getAccountingStats(params?: {
    periodStart?: string;
    periodEnd?: string;
    companyId?: string;
  }) {
    try {
      const companyId = params?.companyId || await this.getCurrentCompanyId();
      // Build query for journal entries with their lines
      let entriesQuery = supabase
        .from('journal_entries')
        .select('id, entry_date, status')
        .eq('company_id', companyId);
      if (params?.periodStart) {
        entriesQuery = entriesQuery.gte('entry_date', params.periodStart);
      }
      if (params?.periodEnd) {
        entriesQuery = entriesQuery.lte('entry_date', params.periodEnd);
      }
      const { data: entries, error: entriesError } = await entriesQuery;
      if (entriesError) throw entriesError;
      const entriesList = entries || [];
      const entryIds = entriesList.map(e => e.id);
      // Get journal entry lines for these entries (only posted and imported)
      let totalDebit = 0;
      let totalCredit = 0;
      if (entryIds.length > 0) {
        const { data: lines, error: linesError } = await supabase
          .from('journal_entry_lines')
          .select('debit_amount, credit_amount, journal_entry_id')
          .in('journal_entry_id', entryIds);
        if (linesError) {
          logger.error('AccountingData', 'Error fetching journal entry lines:', linesError);
        } else if (lines) {
          // ✅ FIX: Inclure TOUS les statuts (draft, review, validated, posted, imported)
          // Les totaux doivent refléter toutes les écritures, pas seulement celles comptabilisées
          for (const line of lines) {
            totalDebit += Number(line.debit_amount) || 0;
            totalCredit += Number(line.credit_amount) || 0;
          }
        }
      }
      const totalBalance = totalDebit - totalCredit;
      // Get counts
      const { count: accountsCount } = await supabase
        .from('chart_of_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);
      const { count: journalsCount } = await supabase
        .from('journals')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);
      // Count entries by status
      const pendingEntriesCount = entriesList.filter(e => e.status === 'draft').length;
      const postedEntriesCount = entriesList.filter(e => e.status === 'posted' || e.status === 'imported').length;
      // Get unpaid invoices (clients - accounts receivable)
      // ✅ Exclure les factures cancelled et les avoirs (credit_note)
      const { data: unpaidInvoices } = await supabase
        .from('invoices')
        .select('total_incl_tax, due_date, invoice_type')
        .eq('company_id', companyId)
        .eq('invoice_type', 'sale') // ✅ Seulement les factures de vente
        .neq('status', 'paid')
        .neq('status', 'cancelled'); // ✅ Exclure les factures annulées
      const unpaidInvoicesAmount = (unpaidInvoices || []).reduce((sum, inv) => sum + (Number(inv.total_incl_tax) || 0), 0);
      const unpaidInvoicesCount = (unpaidInvoices || []).length;
      // Calculate overdue invoices (aging > 0 days)
      const today = new Date();
      const overdueInvoices = (unpaidInvoices || []).filter(inv => {
        if (!inv.due_date) return false;
        const dueDate = new Date(inv.due_date);
        return dueDate < today;
      });
      const overdueInvoicesCount = overdueInvoices.length;
      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (Number(inv.total_incl_tax) || 0), 0);
      // Get unpaid purchases (fournisseurs - accounts payable)
      const { data: unpaidPurchases } = await supabase
        .from('purchases')
        .select('total_amount, due_date')
        .eq('company_id', companyId)
        .neq('payment_status', 'paid');
      const unpaidPurchasesAmount = (unpaidPurchases || []).reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);
      const unpaidPurchasesCount = (unpaidPurchases || []).length;
      return {
        totalBalance,
        totalDebit,
        totalCredit,
        entriesCount: entriesList.length,
        pendingEntriesCount,
        postedEntriesCount,
        accountsCount: accountsCount || 0,
        journalsCount: journalsCount || 0,
        unpaidInvoicesAmount,
        unpaidInvoicesCount,
        overdueInvoicesCount,
        overdueAmount,
        unpaidPurchasesAmount,
        unpaidPurchasesCount
      };
    } catch (error) {
      logger.error('AccountingData', 'Error getting accounting stats:', error);
      return {
        totalBalance: 0,
        totalDebit: 0,
        totalCredit: 0,
        entriesCount: 0,
        pendingEntriesCount: 0,
        postedEntriesCount: 0,
        accountsCount: 0,
        journalsCount: 0,
        unpaidInvoicesAmount: 0,
        unpaidInvoicesCount: 0,
        overdueInvoicesCount: 0,
        overdueAmount: 0,
        unpaidPurchasesAmount: 0,
        unpaidPurchasesCount: 0
      };
    }
  }
  /**
   * Calculate trend percentage
   */
  private calculateTrend(current: number, previous: number): number | undefined {
    if (previous === 0) {
      return current > 0 ? 100 : undefined;
    }
    return ((current - previous) / previous) * 100;
  }
  /**
   * Get accounting stats with trends
   */
  async getAccountingStatsWithTrends(params?: {
    periodStart?: string;
    periodEnd?: string;
    companyId?: string;
  }) {
    try {
      const companyId = params?.companyId || await this.getCurrentCompanyId();
      // Get current period stats
      const currentStats = await this.getAccountingStats({
        periodStart: params?.periodStart,
        periodEnd: params?.periodEnd,
        companyId
      });
      // Calculate previous period dates
      let previousStart: string | undefined;
      let previousEnd: string | undefined;
      if (params?.periodStart && params?.periodEnd) {
        const start = new Date(params.periodStart);
        const end = new Date(params.periodEnd);
        const periodDuration = end.getTime() - start.getTime();
        previousEnd = new Date(start.getTime() - 1).toISOString().split('T')[0];
        previousStart = new Date(start.getTime() - periodDuration).toISOString().split('T')[0];
      }
      // Get previous period stats
      const previousStats = previousStart && previousEnd
        ? await this.getAccountingStats({
            periodStart: previousStart,
            periodEnd: previousEnd,
            companyId
          })
        : null;
      // Calculate trends
      const trends = previousStats ? {
        totalBalanceTrend: this.calculateTrend(Math.abs(currentStats.totalBalance), Math.abs(previousStats.totalBalance)),
        totalDebitTrend: this.calculateTrend(currentStats.totalDebit, previousStats.totalDebit),
        totalCreditTrend: this.calculateTrend(currentStats.totalCredit, previousStats.totalCredit),
        entriesCountTrend: this.calculateTrend(currentStats.entriesCount, previousStats.entriesCount),
        pendingEntriesCountTrend: this.calculateTrend(currentStats.pendingEntriesCount, previousStats.pendingEntriesCount)
      } : {
        totalBalanceTrend: undefined,
        totalDebitTrend: undefined,
        totalCreditTrend: undefined,
        entriesCountTrend: undefined,
        pendingEntriesCountTrend: undefined
      };
      return {
        ...currentStats,
        ...trends
      };
    } catch (error) {
      logger.error('AccountingData', 'Error getting accounting stats with trends:', error);
      return {
        totalBalance: 0,
        totalDebit: 0,
        totalCredit: 0,
        entriesCount: 0,
        pendingEntriesCount: 0,
        postedEntriesCount: 0,
        accountsCount: 0,
        journalsCount: 0,
        totalBalanceTrend: undefined,
        totalDebitTrend: undefined,
        totalCreditTrend: undefined,
        entriesCountTrend: undefined,
        pendingEntriesCountTrend: undefined
      };
    }
  }
  /**
   * Get journal distribution statistics
   */
  async getJournalDistribution(params?: { periodStart?: string; periodEnd?: string; companyId?: string }): Promise<Array<{ name: string; code: string; count: number; percentage: number }>> {
    try {
      const companyId = params?.companyId || await this.getCurrentCompanyId();

      logger.debug('AccountingData', '📊 Fetching journal distribution for company:', companyId);
      logger.debug('AccountingData', '📅 Period:', { start: params?.periodStart, end: params?.periodEnd });

      // Build query - Include all active statuses (validated, posted, imported, draft)
      let query = supabase
        .from('journal_entries')
        // Use explicit relationship name to avoid ambiguous-relationship PGRST201 errors
        .select('journal_id, journals!journal_entries_journal_id_fkey(code, name)')
        .eq('company_id', companyId)
        .in('status', ['validated', 'posted', 'imported', 'draft', 'pending']);
      // Apply period filters if provided
      if (params?.periodStart) {
        query = query.gte('entry_date', params.periodStart);
      }
      if (params?.periodEnd) {
        query = query.lte('entry_date', params.periodEnd);
      }
      const { data, error } = await query;

      logger.debug('AccountingData', '📋 Journal entries found:', data?.length || 0);

      if (error) {
        logger.error('AccountingData', 'Error fetching journal distribution:', error);
        return [];
      }
      if (!data || data.length === 0) {
        logger.warn('AccountingData', '⚠️ No journal entries found for this period');
        // Ne retournons rien au lieu de retourner des journaux vides
        // Cela permettra au composant d'afficher "Aucune donnée disponible"
        return [];
      }
      // Aggregate by journal
      const journalMap = new Map<string, { name: string; code: string; count: number }>();
      data.forEach((entry: any) => {
        const journal = entry.journals;
        if (journal) {
          const key = journal.code;
          if (journalMap.has(key)) {
            journalMap.get(key)!.count++;
          } else {
            journalMap.set(key, {
              name: journal.name || journal.code,
              code: journal.code,
              count: 1
            });
          }
        }
      });
      // Calculate percentages and convert to array
      const total = data.length;
      const distribution = Array.from(journalMap.values()).map(journal => ({
        ...journal,
        percentage: Math.round((journal.count / total) * 100)
      }));
      // Sort by count descending
      distribution.sort((a, b) => b.count - a.count);

      logger.debug('AccountingData', '✅ Journal distribution calculated:', distribution);
      return distribution;
    } catch (error) {
      logger.error('AccountingData', 'Error getting journal distribution:', error);
      return [];
    }
  }
  /**
   * Get current company ID from user's active company
   */
  private async getCurrentCompanyId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data: userCompanies } = await supabase
      .from('user_companies')
      .select('company_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();
    if (!userCompanies) {
      throw new Error('No active company found');
    }
    return userCompanies.company_id;
  }

  /**
   * Get trial balance (balance générale) for all accounts
   * Used for interactive drill-down reports
   */
  async getTrialBalance(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    data: Array<{
      account_code: string;
      account_name: string;
      total_debit: number;
      total_credit: number;
      balance: number;
    }> | null;
    error: Error | null;
  }> {
    try {
      logger.debug('AccountingData', '📊 Getting trial balance:', { companyId, startDate, endDate });

      // 1. Get all accounts from chart of accounts
      const { data: accounts, error: accountsError } = await supabase
        .from('chart_of_accounts')
        .select('account_number, account_name')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('account_number');

      if (accountsError) {
        logger.error('AccountingData', 'Error fetching accounts:', accountsError);
        return { data: null, error: accountsError };
      }

      // 2. Get all journal entry lines for the period
      const { data: journalEntries, error: entriesError } = await supabase
        .from('journal_entry_lines')
        .select(`
          account_code,
          debit_amount,
          credit_amount,
          journal_entries!inner(entry_date, company_id, status)
        `)
        .eq('journal_entries.company_id', companyId)
        .gte('journal_entries.entry_date', startDate)
        .lte('journal_entries.entry_date', endDate)
        .in('journal_entries.status', ['validated', 'posted', 'imported']);

      if (entriesError) {
        logger.error('AccountingData', 'Error fetching journal entries:', entriesError);
        return { data: null, error: entriesError };
      }

      // 3. Aggregate balances by account
      const balanceMap = new Map<string, { debit: number; credit: number }>();

      (journalEntries || []).forEach((line: any) => {
        const accountCode = line.account_code;
        if (!balanceMap.has(accountCode)) {
          balanceMap.set(accountCode, { debit: 0, credit: 0 });
        }
        const balance = balanceMap.get(accountCode)!;
        balance.debit += Number(line.debit_amount) || 0;
        balance.credit += Number(line.credit_amount) || 0;
      });

      // 4. Build trial balance data
      const trialBalanceData = (accounts || [])
        .map((account: any) => {
          const accountCode = account.account_number;
          const balance = balanceMap.get(accountCode) || { debit: 0, credit: 0 };
          return {
            account_code: accountCode,
            account_name: account.account_name,
            total_debit: balance.debit,
            total_credit: balance.credit,
            balance: balance.debit - balance.credit
          };
        })
        .filter(acc => acc.total_debit !== 0 || acc.total_credit !== 0); // Only accounts with movements

      logger.debug('AccountingData', '✅ Trial balance calculated:', {
        totalAccounts: trialBalanceData.length
      });

      return { data: trialBalanceData, error: null };
    } catch (error) {
      logger.error('AccountingData', 'Error in getTrialBalance:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Get all journal entries for a specific account
   * Used for drill-down from trial balance to account detail
   */
  async getAccountEntries(
    companyId: string,
    accountCode: string,
    startDate: string,
    endDate: string
  ): Promise<{
    data: Array<{
      id: string;
      journal_entry_number: string;
      entry_date: string;
      description: string;
      reference: string | null;
      debit: number;
      credit: number;
      balance: number;
    }> | null;
    error: Error | null;
  }> {
    try {
      logger.debug('AccountingData', '📋 Getting account entries:', {
        companyId,
        accountCode,
        startDate,
        endDate
      });

      // Get journal entry lines for this account
      const { data: lines, error: linesError } = await supabase
        .from('journal_entry_lines')
        .select(`
          id,
          account_code,
          debit_amount,
          credit_amount,
          description,
          journal_entries!inner(
            id,
            entry_number,
            entry_date,
            description,
            reference,
            company_id,
            status
          )
        `)
        .eq('account_code', accountCode)
        .eq('journal_entries.company_id', companyId)
        .gte('journal_entries.entry_date', startDate)
        .lte('journal_entries.entry_date', endDate)
        .in('journal_entries.status', ['validated', 'posted', 'imported'])
        .order('journal_entries.entry_date', { ascending: true });

      if (linesError) {
        logger.error('AccountingData', 'Error fetching account entries:', linesError);
        return { data: null, error: linesError };
      }

      // Transform to entries format
      const entries = (lines || []).map((line: any) => {
        const je = line.journal_entries;
        return {
          id: line.id,
          journal_entry_number: je.entry_number || je.id.substring(0, 8),
          entry_date: je.entry_date,
          description: line.description || je.description || '',
          reference: je.reference,
          debit: Number(line.debit_amount) || 0,
          credit: Number(line.credit_amount) || 0,
          balance: (Number(line.debit_amount) || 0) - (Number(line.credit_amount) || 0)
        };
      });

      logger.debug('AccountingData', '✅ Account entries fetched:', {
        accountCode,
        entriesCount: entries.length
      });

      return { data: entries, error: null };
    } catch (error) {
      logger.error('AccountingData', 'Error in getAccountEntries:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }
}
export const accountingDataService = AccountingDataService.getInstance();