import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { 
  JournalEntry, 
  JournalEntryLine, 
  Account,
  Journal
} from '@/types/database.types';

export interface CreateJournalEntryData {
  date: string;
  description: string;
  reference?: string;
  journal_id?: string;
  items: CreateJournalEntryLineData[];
}

export interface CreateJournalEntryLineData {
  account_id: string;
  description?: string;
  debit_amount: number;
  credit_amount: number;
  currency?: string;
}

export interface JournalEntryFilters {
  page?: number;
  limit?: number;
  dateRange?: {
    from?: string;
    to?: string;
  };
  journalId?: string;
  accountId?: string;
  reference?: string;
  description?: string;
  status?: 'draft' | 'posted' | 'cancelled';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useJournalEntries(companyId: string) {
  const { user } = useAuth();
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to safely escape search terms for ILIKE queries
  const escapeSearchTerm = useCallback((term: string) => {
    if (!term) return '';
    return term.replace(/[%_\\]/g, '\\$&').replace(/'/g, "''");
  }, []);

  // Create a journal entry with automatic validation
  const createJournalEntry = useCallback(async (entryData: CreateJournalEntryData): Promise<JournalEntry | null> => {
    if (!user || !companyId) throw new Error('User not authenticated or company not selected');

    const { items, ...entryFields } = entryData;

    setLoading(true);
    setError(null);

    try {
      // 1. Validate debit/credit balance
      const totalDebit = items.reduce((sum, item) => sum + (parseFloat(item.debit_amount.toString()) || 0), 0);
      const totalCredit = items.reduce((sum, item) => sum + (parseFloat(item.credit_amount.toString()) || 0), 0);
      
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error(`Entry is not balanced: Debit ${totalDebit} ≠ Credit ${totalCredit}`);
      }

      // 2. Generate entry number if not provided
      let entryNumber = null;
      if (!entryFields.reference) {
        if (entryFields.journal_id) {
          const { data } = await supabase.rpc('get_next_journal_entry_number', {
            p_company_id: companyId,
            p_journal_id: entryFields.journal_id
          });
          entryNumber = data;
        } else {
          const { data } = await supabase.rpc('get_next_journal_entry_number', {
            p_company_id: companyId
          });
          entryNumber = data;
        }
      }

      // 3. Create main entry
      const { data: entry, error: entryError } = await supabase
        .from('journal_entries')
        .insert({
          company_id: companyId,
          entry_date: entryData.date,
          description: entryData.description,
          reference_number: entryData.reference || entryNumber,
          journal_id: entryData.journal_id,
          status: 'draft'
        })
        .select()
        .single();
      
      if (entryError) throw entryError;

      // 4. Create entry lines
      const itemsWithEntryId = items.map(item => ({
        ...item,
        journal_entry_id: entry.id,
        company_id: companyId,
        currency: item.currency || 'EUR'
      }));

      const { data: lines, error: linesError } = await supabase
        .from('journal_entry_items')
        .insert(itemsWithEntryId)
        .select();

      if (linesError) throw linesError;

      // 5. Update accounts balances (if RPC function exists)
      try {
        await supabase.rpc('update_accounts_balance_from_entry', {
          p_journal_entry_id: entry.id
        });
      } catch (err) {
        console.warn('Balance update function not available:', err);
      }

      setJournalEntries(prev => [entry, ...prev]);
      return entry;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create journal entry';
      setError(errorMessage);
      console.error('Error creating journal entry:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, companyId]);

  // Get journal entries with filters
  const getJournalEntries = useCallback(async (filters: JournalEntryFilters = {}) => {
    if (!user || !companyId) return { data: [], count: 0, error: null };

    const {
      page = 1,
      limit = 20,
      dateRange = {},
      journalId = null,
      accountId = null,
      reference = '',
      description = '',
      status = null,
      sortBy = 'entry_date',
      sortOrder = 'desc'
    } = filters;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('journal_entries')
        .select(`
          *,
          journals (id, code, name),
          journal_entry_items (
            id, account_id, description, debit_amount, credit_amount, currency,
            accounts (id, account_number, name, type, class)
          )
        `, { count: 'exact' })
        .eq('company_id', companyId);

      // Apply filters
      if (dateRange.from) {
        query = query.gte('entry_date', dateRange.from);
      }
      if (dateRange.to) {
        query = query.lte('entry_date', dateRange.to);
      }
      if (journalId) {
        query = query.eq('journal_id', journalId);
      }
      if (reference) {
        const escapedTerm = escapeSearchTerm(reference);
        query = query.ilike('reference_number', `%${escapedTerm}%`);
      }
      if (description) {
        const escapedTerm = escapeSearchTerm(description);
        query = query.ilike('description', `%${escapedTerm}%`);
      }
      if (status) {
        query = query.eq('status', status);
      }

      // Filter by account (requires subquery)
      if (accountId) {
        query = query.in('id', 
          supabase.from('journal_entry_items')
            .select('journal_entry_id')
            .eq('account_id', accountId)
        );
      }

      // Apply sorting
      const ascending = sortOrder === 'asc';
      query = query.order(sortBy, { ascending });

      // Apply pagination
      if (page && limit) {
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setJournalEntries(data || []);
      return { data: data || [], count: count || 0, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch journal entries';
      setError(errorMessage);
      console.error('Error fetching journal entries:', err);
      return { data: [], count: 0, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, companyId, escapeSearchTerm]);

  // Delete a journal entry
  const deleteJournalEntry = useCallback(async (entryId: string): Promise<void> => {
    if (!user || !companyId) throw new Error('User not authenticated or company not selected');

    setLoading(true);
    setError(null);

    try {
      // Check if entry is posted (can't delete posted entries)
      const { data: entry } = await supabase
        .from('journal_entries')
        .select('status')
        .eq('id', entryId)
        .eq('company_id', companyId)
        .single();

      if (entry && entry.status === 'posted') {
        throw new Error('Cannot delete posted journal entries');
      }

      // Delete entry lines first
      const { error: linesError } = await supabase
        .from('journal_entry_items')
        .delete()
        .eq('journal_entry_id', entryId);

      if (linesError) throw linesError;

      // Delete main entry
      const { error: entryError } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId)
        .eq('company_id', companyId);

      if (entryError) throw entryError;

      setJournalEntries(prev => prev.filter(entry => entry.id !== entryId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete journal entry';
      setError(errorMessage);
      console.error('Error deleting journal entry:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, companyId]);

  // Post a journal entry (change status from draft to posted)
  const postJournalEntry = useCallback(async (entryId: string): Promise<void> => {
    if (!user || !companyId) throw new Error('User not authenticated or company not selected');

    setLoading(true);
    setError(null);

    try {
      const { data: updatedEntry, error: updateError } = await supabase
        .from('journal_entries')
        .update({ 
          status: 'posted',
          posted_at: new Date().toISOString(),
          posted_by: user.id
        })
        .eq('id', entryId)
        .eq('company_id', companyId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update account balances
      try {
        await supabase.rpc('update_accounts_balance_from_entry', {
          p_journal_entry_id: entryId
        });
      } catch (err) {
        console.warn('Balance update function not available:', err);
      }

      setJournalEntries(prev => prev.map(entry => 
        entry.id === entryId ? updatedEntry : entry
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to post journal entry';
      setError(errorMessage);
      console.error('Error posting journal entry:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, companyId]);

  // Get accounts list for dropdowns
  const getAccountsList = useCallback(async (): Promise<Account[]> => {
    if (!user || !companyId) return [];

    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, account_number, name, type, class, balance')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('account_number');

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching accounts list:', err);
      return [];
    }
  }, [user, companyId]);

  // Get journals list for dropdowns
  const getJournalsList = useCallback(async (): Promise<Journal[]> => {
    if (!user || !companyId) return [];

    try {
      const { data, error } = await supabase
        .from('journals')
        .select('id, code, name, type')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('code');

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching journals list:', err);
      return [];
    }
  }, [user, companyId]);

  // Get journal entry by ID
  const getJournalEntryById = useCallback(async (entryId: string): Promise<JournalEntry | null> => {
    if (!user || !companyId) return null;

    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select(`
          *,
          journals (id, code, name),
          journal_entry_items (
            id, account_id, description, debit_amount, credit_amount, currency,
            accounts (id, account_number, name, type, class)
          )
        `)
        .eq('id', entryId)
        .eq('company_id', companyId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching journal entry by ID:', err);
      return null;
    }
  }, [user, companyId]);

  return {
    journalEntries,
    loading,
    error,
    createJournalEntry,
    getJournalEntries,
    deleteJournalEntry,
    postJournalEntry,
    getAccountsList,
    getJournalsList,
    getJournalEntryById,
    refresh: () => getJournalEntries(),
  };
}