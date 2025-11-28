/**
 * Service de génération de rapports financiers
 * Génère automatiquement les rapports standards à partir des données comptables réelles
 */

import { supabase } from '@/lib/supabase';
import { startOfYear, endOfYear, format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types de rapports supportés
export type ReportType =
  | 'balance_sheet'        // Bilan comptable
  | 'income_statement'     // Compte de résultat
  | 'trial_balance'        // Balance générale
  | 'cash_flow'           // Tableau de flux de trésorerie
  | 'aged_receivables'    // Balance âgée clients
  | 'aged_payables';      // Balance âgée fournisseurs

export interface ReportFilters {
  companyId: string;
  startDate?: string;
  endDate?: string;
  includeZeroBalances?: boolean;
}

export interface AccountBalance {
  account_number: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  account_class: number;
  opening_balance: number;
  debit: number;
  credit: number;
  closing_balance: number;
}

export interface BalanceSheetData {
  assets: {
    current: AccountBalance[];
    fixed: AccountBalance[];
    total: number;
  };
  liabilities: {
    current: AccountBalance[];
    longTerm: AccountBalance[];
    total: number;
  };
  equity: {
    accounts: AccountBalance[];
    total: number;
  };
  totalAssets: number;
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
}

export interface IncomeStatementData {
  revenue: {
    accounts: AccountBalance[];
    total: number;
  };
  expenses: {
    accounts: AccountBalance[];
    total: number;
  };
  operatingIncome: number;
  netIncome: number;
}

export interface TrialBalanceData {
  accounts: AccountBalance[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

class FinancialReportsService {
  private static instance: FinancialReportsService;

  static getInstance(): FinancialReportsService {
    if (!this.instance) {
      this.instance = new FinancialReportsService();
    }
    return this.instance;
  }

  /**
   * Calcule les soldes de tous les comptes pour la période
   */
  private async calculateAccountBalances(filters: ReportFilters): Promise<AccountBalance[]> {
    const { companyId, startDate, endDate } = filters;

    const periodStart = startDate || startOfYear(new Date()).toISOString().split('T')[0];
    const periodEnd = endDate || endOfYear(new Date()).toISOString().split('T')[0];

    // Récupérer tous les comptes de l'entreprise
    const { data: accounts, error: accountsError } = await supabase
      .from('chart_of_accounts')
      .select('account_number, account_name, account_type, account_class')
      .eq('company_id', companyId)
      .order('account_number');

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
      return [];
    }

    // Récupérer toutes les lignes d'écritures de la période avec jointure
    const { data: entries, error: entriesError } = await supabase
      .from('journal_entries')
      .select(`
        entry_date,
        journal_entry_lines (
          account_number,
          debit_amount,
          credit_amount
        )
      `)
      .eq('company_id', companyId)
      .lte('entry_date', periodEnd);

    if (entriesError) {
      console.error('Error fetching journal entries:', entriesError);
      return [];
    }

    // Calculer les soldes pour chaque compte
    const balances = new Map<string, {
      debit: number;
      credit: number;
      openingDebit: number;
      openingCredit: number;
    }>();

    entries?.forEach(entry => {
      const entryDate = entry.entry_date;
      const isBeforePeriod = entryDate < periodStart;

      // Parcourir toutes les lignes de l'écriture
      entry.journal_entry_lines?.forEach((line: any) => {
        const accountNumber = line.account_number;
        if (!accountNumber) return;

        if (!balances.has(accountNumber)) {
          balances.set(accountNumber, {
            debit: 0,
            credit: 0,
            openingDebit: 0,
            openingCredit: 0
          });
        }

        const balance = balances.get(accountNumber)!;

        if (isBeforePeriod) {
          // Solde d'ouverture
          balance.openingDebit += line.debit_amount || 0;
          balance.openingCredit += line.credit_amount || 0;
        }

        // Mouvements de la période
        balance.debit += line.debit_amount || 0;
        balance.credit += line.credit_amount || 0;
      });
    });

    // Créer le résultat avec tous les comptes
    return (accounts || []).map(account => {
      const balance = balances.get(account.account_number) || {
        debit: 0,
        credit: 0,
        openingDebit: 0,
        openingCredit: 0
      };

      const openingBalance = balance.openingDebit - balance.openingCredit;
      const periodDebit = balance.debit - balance.openingDebit;
      const periodCredit = balance.credit - balance.openingCredit;
      const closingBalance = openingBalance + periodDebit - periodCredit;

      return {
        account_number: account.account_number,
        account_name: account.account_name || '',
        account_type: this.mapAccountType(account.account_type, account.account_class),
        account_class: account.account_class || Number.parseInt(account.account_number?.[0] ?? '0', 10) || 0,
        opening_balance: openingBalance,
        debit: periodDebit,
        credit: periodCredit,
        closing_balance: closingBalance
      };
    }).filter(acc => {
      // Filtrer les comptes à solde nul si demandé
      if (filters.includeZeroBalances) return true;
      return acc.closing_balance !== 0 || acc.debit !== 0 || acc.credit !== 0;
    });
  }

  /**
   * Mapper le type de compte de la BDD vers le type de rapport
   */
  private mapAccountType(dbType: string | null, accountClass: number | null): AccountBalance['account_type'] {
    // Utiliser la classe de compte (premier chiffre) pour déterminer le type
    const classNum = accountClass || 0;

    if (classNum === 1 || classNum === 2 || classNum === 3) {
      return 'asset';
    } else if (classNum === 4) {
      return 'liability';
    } else if (classNum === 5) {
      return 'equity';
    } else if (classNum === 6) {
      return 'expense';
    } else if (classNum === 7) {
      return 'revenue';
    }

    // Fallback sur le type de la BDD
    switch (dbType) {
      case 'asset': return 'asset';
      case 'liability': return 'liability';
      case 'equity': return 'equity';
      case 'revenue': return 'revenue';
      case 'expense': return 'expense';
      default: return 'asset';
    }
  }

  /**
   * Génère le bilan comptable (Balance Sheet)
   */
  async generateBalanceSheet(filters: ReportFilters): Promise<BalanceSheetData> {
    const balances = await this.calculateAccountBalances(filters);

    // Séparer les comptes par type
    const assets = balances.filter(b => b.account_type === 'asset');
    const liabilities = balances.filter(b => b.account_type === 'liability');
    const equity = balances.filter(b => b.account_type === 'equity');

    // Actifs immobilisés (classe 2) vs actifs circulants (classe 3, 4, 5)
    const fixedAssets = assets.filter(a => a.account_class === 2);
    const currentAssets = assets.filter(a => a.account_class !== 2);

    // Dettes long terme vs court terme (basé sur numéro de compte)
    const longTermLiabilities = liabilities.filter(l =>
      l.account_number.startsWith('16') || l.account_number.startsWith('17')
    );
    const currentLiabilities = liabilities.filter(l =>
      !l.account_number.startsWith('16') && !l.account_number.startsWith('17')
    );

    const totalAssets = assets.reduce((sum, a) => sum + Math.abs(a.closing_balance), 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + Math.abs(l.closing_balance), 0);
    const totalEquity = equity.reduce((sum, e) => sum + Math.abs(e.closing_balance), 0);

    return {
      assets: {
        current: currentAssets,
        fixed: fixedAssets,
        total: totalAssets
      },
      liabilities: {
        current: currentLiabilities,
        longTerm: longTermLiabilities,
        total: totalLiabilities
      },
      equity: {
        accounts: equity,
        total: totalEquity
      },
      totalAssets,
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
    };
  }

  /**
   * Génère le compte de résultat (Income Statement)
   */
  async generateIncomeStatement(filters: ReportFilters): Promise<IncomeStatementData> {
    const balances = await this.calculateAccountBalances(filters);

    const revenue = balances.filter(b => b.account_type === 'revenue');
    const expenses = balances.filter(b => b.account_type === 'expense');

    const totalRevenue = revenue.reduce((sum, r) => sum + Math.abs(r.closing_balance), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Math.abs(e.closing_balance), 0);

    return {
      revenue: {
        accounts: revenue,
        total: totalRevenue
      },
      expenses: {
        accounts: expenses,
        total: totalExpenses
      },
      operatingIncome: totalRevenue - totalExpenses,
      netIncome: totalRevenue - totalExpenses
    };
  }

  /**
   * Génère la balance générale (Trial Balance)
   */
  async generateTrialBalance(filters: ReportFilters): Promise<TrialBalanceData> {
    const balances = await this.calculateAccountBalances({
      ...filters,
      includeZeroBalances: true
    });

    const totalDebit = balances.reduce((sum, b) => sum + Math.abs(Math.max(b.debit, 0)), 0);
    const totalCredit = balances.reduce((sum, b) => sum + Math.abs(Math.max(b.credit, 0)), 0);

    return {
      accounts: balances.sort((a, b) => a.account_number.localeCompare(b.account_number)),
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01
    };
  }

  /**
   * Génère et sauvegarde un rapport dans la table financial_reports
   */
  async generateAndSaveReport(
    type: ReportType,
    filters: ReportFilters,
    userId: string
  ): Promise<{ success: boolean; reportId?: string; error?: string }> {
    try {
      let reportData: any;
      let reportName: string;

      // Générer le rapport selon le type
      switch (type) {
        case 'balance_sheet':
          reportData = await this.generateBalanceSheet(filters);
          reportName = 'Bilan Comptable';
          break;
        case 'income_statement':
          reportData = await this.generateIncomeStatement(filters);
          reportName = 'Compte de Résultat';
          break;
        case 'trial_balance':
          reportData = await this.generateTrialBalance(filters);
          reportName = 'Balance Générale';
          break;
        default:
          return { success: false, error: 'Type de rapport non supporté' };
      }

      const periodStart = filters.startDate || startOfYear(new Date()).toISOString().split('T')[0];
      const periodEnd = filters.endDate || endOfYear(new Date()).toISOString().split('T')[0];

      // Sauvegarder dans la table financial_reports
      const { data, error } = await supabase
        .from('financial_reports')
        .insert({
          company_id: filters.companyId,
          name: `${reportName} - ${format(new Date(periodStart), 'dd/MM/yyyy', { locale: fr })} au ${format(new Date(periodEnd), 'dd/MM/yyyy', { locale: fr })}`,
          type,
          status: 'completed',
          period_start: periodStart,
          period_end: periodEnd,
          data: reportData,
          generated_at: new Date().toISOString(),
          generated_by: userId
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error saving report:', error);
        return { success: false, error: error.message };
      }

      return { success: true, reportId: data.id };
    } catch (error) {
      console.error('Error generating report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Récupère tous les rapports d'une entreprise
   */
  async getReports(companyId: string, type?: ReportType) {
    let query = supabase
      .from('financial_reports')
      .select('*')
      .eq('company_id', companyId);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  }
}

export const financialReportsService = FinancialReportsService.getInstance();
