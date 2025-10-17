import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';
import type { 
  Account, 
  JournalEntry, 
  JournalEntryLine, 
  AccountType,
  JournalEntryStatus 
} from '@/types/database.types';

export interface CreateJournalEntryData {
  date: string;
  description: string;
  reference?: string;
  journal_id?: string;
  lines: CreateJournalEntryLineData[];
}

export interface CreateJournalEntryLineData {
  account_id: string;
  description?: string;
  debit_amount: number;
  credit_amount: number;
}

export interface BalanceSheetData {
  assets: { account_number: string; account_name: string; balance: number }[];
  liabilities: { account_number: string; account_name: string; balance: number }[];
  equity: { account_number: string; account_name: string; balance: number }[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

export function useAccounting(companyId: string) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch chart of accounts
  const fetchAccounts = useCallback(async () => {
    if (!user || !companyId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('chart_of_accounts')
        .select('id, account_number, account_name, account_type, account_class, company_id, is_active, created_at, updated_at')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('account_number');

      if (fetchError) throw fetchError;
      setAccounts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
      logger.error('Error fetching accounts:', err)
    } finally {
      setLoading(false);
    }
  }, [user, companyId]);

  // Fetch journal entries with lines
  const fetchJournalEntries = useCallback(async (limit = 50) => {
    if (!user || !companyId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('journal_entries')
        .select(`
          *,
          journal_entry_lines (
            *,
            chart_of_accounts (
              account_number,
              account_name
            )
          )
        `)
        .eq('company_id', companyId)
        .order('entry_date', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;
      setJournalEntries(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch journal entries');
      logger.error('Error fetching journal entries:', err)
    } finally {
      setLoading(false);
    }
  }, [user, companyId]);

  // Create a new account
  const createAccount = useCallback(async (accountData: {
    account_number: string;
    account_name: string;
    account_type: AccountType;
    account_class: number;
    description?: string;
    parent_account_id?: string;
  }): Promise<Account | null> => {
    if (!user || !companyId) throw new Error('User not authenticated or company not selected');

    setLoading(true);
    setError(null);

    try {
      const { data: newAccount, error: insertError } = await supabase
        .from('chart_of_accounts')
        .insert({
          ...accountData,
          company_id: companyId,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setAccounts(prev => [...prev, newAccount].sort((a, b) => 
        a.account_number.localeCompare(b.account_number)
      ));

      return newAccount;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
      setError(errorMessage);
      logger.error('Error creating account:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, companyId]);

  // Generate unique journal entry number
  const generateEntryNumber = useCallback(async (): Promise<string> => {
    const year = new Date().getFullYear();
    const { data, error } = await supabase
      .from('journal_entries')
      .select('entry_number')
      .eq('company_id', companyId)
      .like('entry_number', `${year}%`)
      .order('entry_number', { ascending: false })
      .limit(1);

    if (error) {
      logger.warn('Could not fetch last entry number:', error);
      return `${year}001`;
    }

    if (!data || data.length === 0) {
      return `${year}001`;
    }

    const lastNumber = data[0].entry_number;
    const lastSequence = parseInt(lastNumber.slice(-3)) || 0;
    const nextSequence = (lastSequence + 1).toString().padStart(3, '0');
    
    return `${year}${nextSequence}`;
  }, [companyId]);

  // Create a journal entry with lines
  const createJournalEntry = useCallback(async (
    entryData: CreateJournalEntryData
  ): Promise<JournalEntry | null> => {
    if (!user || !companyId) throw new Error('User not authenticated or company not selected');

    // Validate that debits equal credits
    const totalDebits = entryData.lines.reduce((sum, line) => sum + line.debit_amount, 0);
    const totalCredits = entryData.lines.reduce((sum, line) => sum + line.credit_amount, 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new Error('Journal entry must balance: total debits must equal total credits');
    }

    setLoading(true);
    setError(null);

    try {
      // Generate entry number
      const entryNumber = await generateEntryNumber();

      // Si pas de journal_id fourni, essayer de trouver le journal "OD" (Opérations Diverses)
      let journalId = entryData.journal_id;
      if (!journalId) {
        const { data: defaultJournal } = await supabase
          .from('journals')
          .select('id')
          .eq('company_id', companyId)
          .eq('code', 'OD')
          .single();

        journalId = defaultJournal?.id;
      }

      // Start transaction
      const { data: newEntry, error: entryError } = await supabase
        .from('journal_entries')
        .insert({
          company_id: companyId,
          entry_number: entryNumber,
          entry_date: entryData.date,
          description: entryData.description,
          reference_number: entryData.reference,
          journal_id: journalId,
          status: 'draft',
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // Create journal entry lines
      const linesData = entryData.lines.map((line, index) => ({
        journal_entry_id: newEntry.id,
        account_id: line.account_id,
        description: line.description,
        debit_amount: line.debit_amount,
        credit_amount: line.credit_amount,
      }));

      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(linesData);

      if (linesError) throw linesError;

      // Fetch the complete entry with lines and account details
      const { data: completeEntry, error: fetchError } = await supabase
        .from('journal_entries')
        .select(`
          *,
          journal_entry_lines (
            *,
            chart_of_accounts (
              account_number,
              account_name
            )
          )
        `)
        .eq('id', newEntry.id)
        .single();

      if (fetchError) throw fetchError;

      setJournalEntries(prev => [completeEntry, ...prev]);
      return completeEntry;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create journal entry';
      setError(errorMessage);
      logger.error('Error creating journal entry:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, companyId, generateEntryNumber]);

  // Post a journal entry (mark as posted)
  const postJournalEntry = useCallback(async (entryId: string): Promise<void> => {
    if (!user || !companyId) throw new Error('User not authenticated or company not selected');

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('journal_entries')
        .update({ status: 'posted' })
        .eq('id', entryId)
        .eq('company_id', companyId);

      if (updateError) throw updateError;

      // Update local state
      setJournalEntries(prev => prev.map(entry =>
        entry.id === entryId
          ? { ...entry, status: 'posted' as JournalEntryStatus }
          : entry
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to post journal entry';
      setError(errorMessage);
      logger.error('Error posting journal entry:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, companyId]);

  // Get balance sheet data
  const getBalanceSheet = useCallback(async (date?: string): Promise<BalanceSheetData | null> => {
    if (!user || !companyId) return null;

    try {
      const { data, error } = await supabase.rpc('get_balance_sheet', {
        p_company_id: companyId,
        p_date: date || new Date().toISOString().split('T')[0],
      });

      if (error) throw error;

      const assets: any[] = [];
      const liabilities: any[] = [];
      const equity: any[] = [];

      let totalAssets = 0;
      let totalLiabilities = 0;
      let totalEquity = 0;

      data?.forEach((item: any) => {
        const balance = parseFloat(item.balance) || 0;
        
        switch (item.account_type) {
          case 'asset':
            assets.push(item);
            totalAssets += balance;
            break;
          case 'liability':
            liabilities.push(item);
            totalLiabilities += balance;
            break;
          case 'equity':
            equity.push(item);
            totalEquity += balance;
            break;
        }
      });

      return {
        assets,
        liabilities,
        equity,
        totalAssets,
        totalLiabilities,
        totalEquity,
      };
    } catch (err) {
      logger.error('Error generating balance sheet:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate balance sheet');
      return null;
    }
  }, [user, companyId]);

  // Get trial balance
  const getTrialBalance = useCallback(async (date?: string) => {
    if (!user || !companyId) return null;

    try {
      const { data, error } = await supabase.rpc('get_balance_sheet', {
        p_company_id: companyId,
        p_date: date || new Date().toISOString().split('T')[0],
      });

      if (error) throw error;

      return data?.map((item: any) => ({
        account_number: item.account_number,
        account_name: item.account_name,
        debit: parseFloat(item.balance) > 0 ? parseFloat(item.balance) : 0,
        credit: parseFloat(item.balance) < 0 ? Math.abs(parseFloat(item.balance)) : 0,
      }));
    } catch (err) {
      logger.error('Error generating trial balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate trial balance');
      return null;
    }
  }, [user, companyId]);

  // Load data on mount and company change
  useEffect(() => {
    if (companyId) {
      fetchAccounts();
      fetchJournalEntries();
    }
  }, [companyId, fetchAccounts, fetchJournalEntries]);

  return {
    accounts,
    journalEntries,
    loading,
    error,
    createAccount,
    createJournalEntry,
    postJournalEntry,
    getBalanceSheet,
    getTrialBalance,
    fetchAccounts,
    fetchJournalEntries,
    refresh: () => {
      fetchAccounts();
      fetchJournalEntries();
    },
  };
}

