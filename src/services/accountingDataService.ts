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

      console.error('Erreur lors de la récupération des transactions:', error instanceof Error ? error.message : String(error));

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

      console.error('Erreur lors de la récupération du plan comptable:', error instanceof Error ? error.message : String(error));

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

  }> {

    // TODO: Implémenter l'analyse détaillée des créances avec dates d'échéance

    const balances = await this.getAccountBalances(companyId, startDate, endDate);

    const totalReceivables = this.sumAccountsByPattern(balances, ['411', '413', '416']);



    // Simulation de l'analyse par âge (à remplacer par une vraie analyse)

    return {

      total_receivables: totalReceivables,

      aged_analysis: {

        current: totalReceivables * 0.6,

        days_1_30: totalReceivables * 0.25,

        days_31_60: totalReceivables * 0.1,

        days_61_90: totalReceivables * 0.04,

        over_90: totalReceivables * 0.01

      },

      average_collection_period: 35 // Jours moyens de recouvrement

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
          console.error('Error fetching journal entry lines:', linesError);
        } else if (lines) {
          // Filter lines to only include those from posted/imported entries
          const postedEntryIds = new Set(
            entriesList
              .filter(e => e.status === 'posted' || e.status === 'imported')
              .map(e => e.id)
          );

          for (const line of lines) {
            if (postedEntryIds.has(line.journal_entry_id)) {
              totalDebit += Number(line.debit_amount) || 0;
              totalCredit += Number(line.credit_amount) || 0;
            }
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
      const { data: unpaidInvoices } = await supabase
        .from('invoices')
        .select('total_ttc, due_date')
        .eq('company_id', companyId)
        .neq('status', 'paid');

      const unpaidInvoicesAmount = (unpaidInvoices || []).reduce((sum, inv) => sum + (Number(inv.total_ttc) || 0), 0);
      const unpaidInvoicesCount = (unpaidInvoices || []).length;

      // Calculate overdue invoices (aging > 0 days)
      const today = new Date();
      const overdueInvoices = (unpaidInvoices || []).filter(inv => {
        if (!inv.due_date) return false;
        const dueDate = new Date(inv.due_date);
        return dueDate < today;
      });
      const overdueInvoicesCount = overdueInvoices.length;
      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (Number(inv.total_ttc) || 0), 0);

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
      console.error('Error getting accounting stats:', error);
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
      console.error('Error getting accounting stats with trends:', error);
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

      // Build query
      let query = supabase
        .from('journal_entries')
        .select('journal_id, journals(code, name)')
        .eq('company_id', companyId)
        .in('status', ['posted', 'imported']);

      // Apply period filters if provided
      if (params?.periodStart) {
        query = query.gte('entry_date', params.periodStart);
      }
      if (params?.periodEnd) {
        query = query.lte('entry_date', params.periodEnd);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching journal distribution:', error);
        return [];
      }

      if (!data || data.length === 0) {
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

      return distribution;
    } catch (error) {
      console.error('Error getting journal distribution:', error);
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

}

export const accountingDataService = AccountingDataService.getInstance();
