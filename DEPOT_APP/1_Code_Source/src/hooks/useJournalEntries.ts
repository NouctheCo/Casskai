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

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type {
  JournalEntry,
  Account,
  Journal
} from '@/types/database/accounting.types';



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



      // 2. Get or set default journal if not provided

      let journalId = entryData.journal_id;

      console.warn('🔍 [useJournalEntries] createJournalEntry - journalId initial:', journalId);

      if (!journalId) {

        try {

          console.warn('🔍 [useJournalEntries] createJournalEntry - Récupération journal par défaut pour company:', companyId);

          const { data: defaultJournal, error: journalError } = await supabase

            .from('journals')

            .select('id, code, name')

            .eq('company_id', companyId)

            .eq('is_active', true)

            .limit(1)

            .single();

          console.warn('🔍 [useJournalEntries] createJournalEntry - Résultat query journals:', { data: defaultJournal, error: journalError });

          if (journalError) {

            console.error('❌ [useJournalEntries] createJournalEntry - Erreur récupération journal:', journalError);

            throw new Error(`Erreur récupération journal: ${journalError.message}`);

          }

          if (!defaultJournal) {

            console.error('❌ [useJournalEntries] createJournalEntry - Aucun journal trouvé');

            throw new Error('Aucun journal actif trouvé pour cette entreprise');

          }

          journalId = defaultJournal.id;

          console.warn('✅ [useJournalEntries] createJournalEntry - Journal par défaut trouvé:', defaultJournal);

        } catch (err) {

          console.error('💥 [useJournalEntries] createJournalEntry - Exception récupération journal:', err);

          throw err;

        }

      }

      console.warn('🔍 [useJournalEntries] createJournalEntry - journalId final:', journalId);



      // 3. Generate entry number if not provided

      let entryNumber = null;

      if (!entryFields.reference) {

        if (journalId) {

          const { data } = await supabase.rpc('get_next_journal_entry_number', {

            p_company_id: companyId,

            p_journal_id: journalId

          });

          entryNumber = data;

        } else {

          const { data } = await supabase.rpc('get_next_journal_entry_number', {

            p_company_id: companyId

          });

          entryNumber = data;

        }

      }



      // 4. Create main entry

      const entryInsertData = {

        company_id: companyId,

        entry_date: entryData.date,

        description: entryData.description,

        reference_number: entryData.reference || entryNumber,

        journal_id: journalId,

        status: 'draft'

      };

      console.warn('🔍 [useJournalEntries] createJournalEntry - Payload final pour insertion:', entryInsertData);

      const { data: entry, error: entryError } = await supabase

        .from('journal_entries')

        .insert(entryInsertData)

        .select()

        .single();

      if (entryError) throw entryError;

      const accountIds = Array.from(new Set(items.map(item => item.account_id))).filter(Boolean);

      if (accountIds.length === 0) {

        throw new Error('At least one journal entry line is required.');

      }



      const { data: accountsData, error: accountsError } = await supabase

        .from('chart_of_accounts')

        .select('id, account_number, account_name')

        .in('id', accountIds);



      if (accountsError) throw accountsError;



      const accountMap = new Map((accountsData || []).map(account => [account.id, account]));



      const linesToInsert = items.map((item, index) => {

        const accountInfo = accountMap.get(item.account_id);

        if (!accountInfo) {

          throw new Error(`Account ${item.account_id} not found.`);

        }



        return {

          journal_entry_id: entry.id,

          account_id: item.account_id,

          description: item.description || '',

          debit_amount: item.debit_amount || 0,

          credit_amount: item.credit_amount || 0,

          line_order: index + 1,

          account_number: accountInfo.account_number,

          account_name: accountInfo.account_name

        };

      });



      const { data: _lines, error: linesError } = await supabase

        .from('journal_entry_lines')

        .insert(linesToInsert)

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

      const errorMessage = err instanceof Error ? (err as Error).message : 'Failed to create journal entry';

      setError(errorMessage);

      console.error('...', error);

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

          journal_entry_lines (

            id, account_id, description, debit_amount, credit_amount, line_order,

            account_number, account_name,

            chart_of_accounts!account_id (id, account_number, account_name, account_type, account_class)

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

        const itemsQuery = await supabase.from('journal_entry_lines')

          .select('journal_entry_id')

          .eq('account_id', accountId);

        const ids = (itemsQuery.data || []).map((item: any) => item.journal_entry_id);

        query = query.in('id', ids);

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

      const errorMessage = err instanceof Error ? (err as Error).message : 'Failed to fetch journal entries';

      setError(errorMessage);

      console.error('...', error);

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

        .from('journal_entry_lines')

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

      const errorMessage = err instanceof Error ? (err as Error).message : 'Failed to delete journal entry';

      setError(errorMessage);

      console.error('...', error);

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

      const errorMessage = err instanceof Error ? (err as Error).message : 'Failed to post journal entry';

      setError(errorMessage);

      console.error('...', error);

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

        .from('chart_of_accounts')

        .select('id, account_number, account_name, account_type, account_class, current_balance, is_detail_account')

        .eq('company_id', companyId)

        .eq('is_active', true)

        // ✅ Correction: Retourner TOUS les comptes (principaux ET auxiliaires)
        // Commenté le filtre is_detail_account pour avoir tous les comptes
        // .eq('is_detail_account', true)

        .order('account_number');



      if (error) throw error;

      return (data || []) as Account[];

    } catch (_err) {

      console.error('...', error);

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

    } catch (_err) {

      console.error('...', error);

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

          journal_entry_lines (

            id, account_id, description, debit_amount, credit_amount, line_order,

            account_number, account_name,

            chart_of_accounts!account_id (id, account_number, account_name, account_type, account_class)

          )

        `)

        .eq('id', entryId)

        .eq('company_id', companyId)

        .single();



      if (error) throw error;

      return data;

    } catch (_err) {

      console.error('...', error);

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
