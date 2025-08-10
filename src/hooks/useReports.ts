import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  accountType?: string;
  journalId?: string;
  status?: string;
}

export interface BalanceSheetData {
  assets: {
    current_assets: Record<string, number>;
    non_current_assets: Record<string, number>;
    total_assets: number;
  };
  liabilities: {
    current_liabilities: Record<string, number>;
    non_current_liabilities: Record<string, number>;
    total_liabilities: number;
  };
  equity: {
    retained_earnings: number;
    capital: number;
    total_equity: number;
  };
}

export interface IncomeStatementData {
  revenue: Record<string, number>;
  expenses: Record<string, number>;
  total_revenue: number;
  total_expenses: number;
  net_income: number;
  gross_profit: number;
  operating_income: number;
}

export interface TrialBalanceData {
  accounts: Array<{
    account_number: string;
    account_name: string;
    account_type: string;
    debit: number;
    credit: number;
    balance: number;
  }>;
  total_debits: number;
  total_credits: number;
  is_balanced: boolean;
}

export interface ReportSummary {
  id: string;
  name: string;
  type: 'balance_sheet' | 'income_statement' | 'trial_balance' | 'cash_flow';
  period_start: string;
  period_end: string;
  status: 'draft' | 'final' | 'archived';
  created_at: string;
  created_by: string;
  file_url?: string;
}

export function useReports(companyId: string) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportSummary[]>([]);

  // Generate Balance Sheet
  const generateBalanceSheet = useCallback(async (filters: ReportFilters = {}): Promise<BalanceSheetData | null> => {
    if (!user || !companyId) return null;

    setLoading(true);
    setError(null);

    try {
      const { dateFrom, dateTo } = filters;
      
      // Get all accounts with their current balances
      const query = supabase
        .from('accounts')
        .select('id, account_number, name, type, class, balance, currency')
        .eq('company_id', companyId)
        .eq('is_active', true);

      const { data: accounts, error: accountsError } = await query;
      if (accountsError) throw accountsError;

      if (!accounts) return null;

      // Initialize balance sheet structure
      const balanceSheet: BalanceSheetData = {
        assets: {
          current_assets: {},
          non_current_assets: {},
          total_assets: 0
        },
        liabilities: {
          current_liabilities: {},
          non_current_liabilities: {},
          total_liabilities: 0
        },
        equity: {
          retained_earnings: 0,
          capital: 0,
          total_equity: 0
        }
      };

      // Process accounts by type and class
      accounts.forEach(account => {
        const balance = parseFloat(account.balance?.toString() || '0');
        const accountClass = parseInt(account.class?.toString() || '0');

        switch (account.type) {
          case 'asset':
            if (accountClass === 5) { // Class 5: Financial assets (current)
              balanceSheet.assets.current_assets[account.name] = balance;
            } else if (accountClass === 2) { // Class 2: Fixed assets (non-current)
              balanceSheet.assets.non_current_assets[account.name] = balance;
            } else {
              balanceSheet.assets.current_assets[account.name] = balance;
            }
            balanceSheet.assets.total_assets += balance;
            break;

          case 'liability':
            if (accountClass === 4) { // Class 4: Third parties (could be current or non-current)
              balanceSheet.liabilities.current_liabilities[account.name] = balance;
            } else {
              balanceSheet.liabilities.non_current_liabilities[account.name] = balance;
            }
            balanceSheet.liabilities.total_liabilities += balance;
            break;

          case 'equity':
            if (account.name.toLowerCase().includes('capital')) {
              balanceSheet.equity.capital += balance;
            } else {
              balanceSheet.equity.retained_earnings += balance;
            }
            balanceSheet.equity.total_equity += balance;
            break;
        }
      });

      return balanceSheet;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate balance sheet';
      setError(errorMessage);
      console.error('Error generating balance sheet:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, companyId]);

  // Generate Income Statement
  const generateIncomeStatement = useCallback(async (filters: ReportFilters = {}): Promise<IncomeStatementData | null> => {
    if (!user || !companyId) return null;

    setLoading(true);
    setError(null);

    try {
      // Get revenue and expense accounts
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('id, account_number, name, type, class, balance')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .in('type', ['revenue', 'expense']);

      if (accountsError) throw accountsError;

      if (!accounts) return null;

      const incomeStatement: IncomeStatementData = {
        revenue: {},
        expenses: {},
        total_revenue: 0,
        total_expenses: 0,
        net_income: 0,
        gross_profit: 0,
        operating_income: 0
      };

      // Process revenue and expense accounts
      accounts.forEach(account => {
        const balance = parseFloat(account.balance?.toString() || '0');
        
        if (account.type === 'revenue') {
          incomeStatement.revenue[account.name] = balance;
          incomeStatement.total_revenue += balance;
        } else if (account.type === 'expense') {
          incomeStatement.expenses[account.name] = balance;
          incomeStatement.total_expenses += balance;
        }
      });

      // Calculate derived values
      incomeStatement.gross_profit = incomeStatement.total_revenue - incomeStatement.total_expenses;
      incomeStatement.operating_income = incomeStatement.gross_profit; // Simplified
      incomeStatement.net_income = incomeStatement.operating_income;

      return incomeStatement;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate income statement';
      setError(errorMessage);
      console.error('Error generating income statement:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, companyId]);

  // Generate Trial Balance
  const generateTrialBalance = useCallback(async (filters: ReportFilters = {}): Promise<TrialBalanceData | null> => {
    if (!user || !companyId) return null;

    setLoading(true);
    setError(null);

    try {
      // Get all accounts
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('id, account_number, name, type, balance')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('account_number');

      if (accountsError) throw accountsError;

      if (!accounts) return null;

      let totalDebits = 0;
      let totalCredits = 0;

      const trialBalanceAccounts = accounts.map(account => {
        const balance = parseFloat(account.balance?.toString() || '0');
        let debit = 0;
        let credit = 0;

        // Determine if balance is debit or credit based on account type and balance
        if (balance > 0) {
          if (['asset', 'expense'].includes(account.type)) {
            debit = balance;
            totalDebits += balance;
          } else {
            credit = balance;
            totalCredits += balance;
          }
        } else if (balance < 0) {
          if (['asset', 'expense'].includes(account.type)) {
            credit = Math.abs(balance);
            totalCredits += Math.abs(balance);
          } else {
            debit = Math.abs(balance);
            totalDebits += Math.abs(balance);
          }
        }

        return {
          account_number: account.account_number,
          account_name: account.name,
          account_type: account.type,
          debit,
          credit,
          balance
        };
      });

      const trialBalance: TrialBalanceData = {
        accounts: trialBalanceAccounts,
        total_debits: totalDebits,
        total_credits: totalCredits,
        is_balanced: Math.abs(totalDebits - totalCredits) < 0.01
      };

      return trialBalance;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate trial balance';
      setError(errorMessage);
      console.error('Error generating trial balance:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, companyId]);

  // Get report history
  const getReportHistory = useCallback(async (): Promise<ReportSummary[]> => {
    if (!user || !companyId) return [];

    try {
      const { data: reports, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      return reports || [];
    } catch (err) {
      console.error('Error fetching report history:', err);
      return [];
    }
  }, [user, companyId]);

  // Save report
  const saveReport = useCallback(async (
    type: 'balance_sheet' | 'income_statement' | 'trial_balance',
    name: string,
    data: any,
    periodStart: string,
    periodEnd: string
  ): Promise<string | null> => {
    if (!user || !companyId) return null;

    setLoading(true);
    setError(null);

    try {
      const { data: savedReport, error: saveError } = await supabase
        .from('reports')
        .insert({
          company_id: companyId,
          name,
          type,
          period_start: periodStart,
          period_end: periodEnd,
          data: JSON.stringify(data),
          status: 'draft',
          created_by: user.id
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // Refresh report history
      const history = await getReportHistory();
      setReports(history);

      return savedReport.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save report';
      setError(errorMessage);
      console.error('Error saving report:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, companyId, getReportHistory]);

  // Delete report
  const deleteReport = useCallback(async (reportId: string): Promise<void> => {
    if (!user || !companyId) return;

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId)
        .eq('company_id', companyId);

      if (deleteError) throw deleteError;

      // Refresh report history
      const history = await getReportHistory();
      setReports(history);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete report';
      setError(errorMessage);
      console.error('Error deleting report:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, companyId, getReportHistory]);

  // Load reports on mount
  useEffect(() => {
    if (companyId) {
      getReportHistory().then(setReports);
    }
  }, [companyId, getReportHistory]);

  return {
    reports,
    loading,
    error,
    generateBalanceSheet,
    generateIncomeStatement,
    generateTrialBalance,
    getReportHistory,
    saveReport,
    deleteReport,
    refresh: () => getReportHistory().then(setReports),
  };
}