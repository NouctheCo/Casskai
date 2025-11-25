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

      const query = `

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

      return this.generateMockTransactions(companyId, startDate, endDate);

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

      // TODO: Remplacer par l'appel réel à Supabase

      return this.getDefaultChartOfAccounts();

    } catch (error) {

      console.error('Erreur lors de la récupération du plan comptable:', error instanceof Error ? error.message : String(error));

      return this.getDefaultChartOfAccounts();

    }

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

      // Build query for journal entries
      let query = supabase
        .from('journal_entries')
        .select('*')
        .eq('company_id', companyId);

      if (params?.periodStart) {
        query = query.gte('entry_date', params.periodStart);
      }
      if (params?.periodEnd) {
        query = query.lte('entry_date', params.periodEnd);
      }

      const { data: entries, error } = await query;
      if (error) throw error;

      const entriesList = entries || [];

      // Calculate totals
      const totalDebit = entriesList.reduce((sum, entry) => sum + (entry.total_debit || 0), 0);
      const totalCredit = entriesList.reduce((sum, entry) => sum + (entry.total_credit || 0), 0);
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

      return {
        totalBalance,
        totalDebit,
        totalCredit,
        entriesCount: entriesList.length,
        accountsCount: accountsCount || 0,
        journalsCount: journalsCount || 0
      };
    } catch (error) {
      console.error('Error getting accounting stats:', error);
      return {
        totalBalance: 0,
        totalDebit: 0,
        totalCredit: 0,
        entriesCount: 0,
        accountsCount: 0,
        journalsCount: 0
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
        entriesCountTrend: this.calculateTrend(currentStats.entriesCount, previousStats.entriesCount)
      } : {
        totalBalanceTrend: undefined,
        totalDebitTrend: undefined,
        totalCreditTrend: undefined,
        entriesCountTrend: undefined
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
        accountsCount: 0,
        journalsCount: 0,
        totalBalanceTrend: undefined,
        totalDebitTrend: undefined,
        totalCreditTrend: undefined,
        entriesCountTrend: undefined
      };
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
