import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type Journal = any;

export interface JournalFilters {
  type?: string;
  searchTerm?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateJournalData {
  code: string;
  name: string;
  type: string;
  description?: string;
  is_active?: boolean;
}

export function useJournals(companyId: string) {
  const { user } = useAuth();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to safely escape search terms for ILIKE queries
  const escapeSearchTerm = useCallback((term: string) => {
    if (!term) return '';
    // Escape special characters that could be used for SQL injection
    return term.replace(/[%_\\]/g, '\\$&').replace(/'/g, "''");
  }, []);

  // Fetch journals with optional filters
  const fetchJournals = useCallback(async (filters: JournalFilters = {}) => {
    if (!user || !companyId) return;

    const { 
      type, 
      searchTerm = '', 
      isActive = true,
      sortBy = 'code',
      sortOrder = 'asc'
    } = filters;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('journals')
        .select('*', { count: 'exact' })
        .eq('company_id', companyId);

      // Filter by active status
      if (isActive !== null && isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }

      // Filter by journal type
      if (type) {
        query = query.eq('type', type);
      }

      // Search in code and name
      if (searchTerm) {
        const escapedTerm = escapeSearchTerm(searchTerm);
        query = query.or(`code.ilike.%${escapedTerm}%,name.ilike.%${escapedTerm}%`);
      }

      // Apply sorting
      const ascending = sortOrder === 'asc';
      query = query.order(sortBy, { ascending });

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setJournals(data || []);
      return { data: data || [], count: count || 0, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? (err as Error).message : 'Failed to fetch journals';
      setError(errorMessage);
      console.error('...', error);
      return { data: [], count: 0, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, companyId, escapeSearchTerm]);

  // Create a new journal
  const createJournal = useCallback(async (
    journalData: CreateJournalData
  ): Promise<Journal | null> => {
    if (!user || !companyId) throw new Error('User not authenticated or company not selected');

    setLoading(true);
    setError(null);

    try {
      // Check if journal code already exists
      const { data: existingJournal } = await supabase
        .from('journals')
        .select('id')
        .eq('company_id', companyId)
        .eq('code', journalData.code.toUpperCase())
        .single();

      if (existingJournal) {
        throw new Error(`Journal with code "${journalData.code}" already exists`);
      }

      // Prepare data with defaults
      const dataWithDefaults = {
        company_id: companyId,
        code: journalData.code.toUpperCase(),
        name: journalData.name,
        type: journalData.type,
        description: journalData.description || null,
        is_active: journalData.is_active !== undefined ? journalData.is_active : true,
        last_entry_number: 0
      };

      const { data: newJournal, error: insertError } = await supabase
        .from('journals')
        .insert(dataWithDefaults)
        .select()
        .single();

      if (insertError) throw insertError;

      setJournals(prev => [newJournal, ...prev]);
      return newJournal;
    } catch (err) {
      const errorMessage = err instanceof Error ? (err as Error).message : 'Failed to create journal';
      setError(errorMessage);
      console.error('...', error);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, companyId]);

  // Update a journal
  const updateJournal = useCallback(async (
    id: string,
    updates: Partial<Journal>
  ): Promise<Journal | null> => {
    if (!user || !companyId) throw new Error('User not authenticated or company not selected');

    setLoading(true);
    setError(null);

    try {
      // Clean the data (remove non-updatable fields)
      const { id: _, company_id, created_at, updated_at, ...updateData } = updates;
      
      // Auto-update timestamp
      updateData.updated_at = new Date().toISOString();

      // If updating code, make it uppercase and check uniqueness
      if (updateData.code) {
        updateData.code = updateData.code.toUpperCase();
        
        const { data: existingJournal } = await supabase
          .from('journals')
          .select('id')
          .eq('company_id', companyId)
          .eq('code', updateData.code)
          .neq('id', id)
          .single();

        if (existingJournal) {
          throw new Error(`Journal with code "${updateData.code}" already exists`);
        }
      }

      const { data: updatedJournal, error: updateError } = await supabase
        .from('journals')
        .update(updateData)
        .eq('id', id)
        .eq('company_id', companyId)
        .select()
        .single();

      if (updateError) throw updateError;

      setJournals(prev => prev.map(journal => 
        journal.id === id ? updatedJournal : journal
      ));

      return updatedJournal;
    } catch (err) {
      const errorMessage = err instanceof Error ? (err as Error).message : 'Failed to update journal';
      setError(errorMessage);
      console.error('...', error);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, companyId]);

  // Delete a journal (soft delete if it has entries, hard delete otherwise)
  const deleteJournal = useCallback(async (id: string): Promise<void> => {
    if (!user || !companyId) throw new Error('User not authenticated or company not selected');

    setLoading(true);
    setError(null);

    try {
      // Check if journal has entries
      const { count: entriesCount, error: checkError } = await supabase
        .from('journal_entries')
        .select('id', { count: 'exact', head: true })
        .eq('journal_id', id);

      if (checkError) throw checkError;

      if (entriesCount && entriesCount > 0) {
        // Soft delete - deactivate journal
        await updateJournal(id, { is_active: false });
      } else {
        // Hard delete - remove journal permanently
        const { error: deleteError } = await supabase
          .from('journals')
          .delete()
          .eq('id', id)
          .eq('company_id', companyId);

        if (deleteError) throw deleteError;

        setJournals(prev => prev.filter(journal => journal.id !== id));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? (err as Error).message : 'Failed to delete journal';
      setError(errorMessage);
      console.error('...', error);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, companyId, updateJournal]);

  // Get journal by ID
  const getJournalById = useCallback(async (id: string): Promise<Journal | null> => {
    if (!user || !companyId) return null;

    try {
      const { data, error: fetchError } = await supabase
        .from('journals')
        .select('*')
        .eq('id', id)
        .eq('company_id', companyId)
        .single();

      if (fetchError) throw fetchError;
      return data;
    } catch (err) {
      console.error('...', error);
      return null;
    }
  }, [user, companyId]);

  // Get journal by code
  const getJournalByCode = useCallback(async (code: string): Promise<Journal | null> => {
    if (!user || !companyId) return null;

    try {
      const { data, error: fetchError } = await supabase
        .from('journals')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('company_id', companyId)
        .single();

      if (fetchError) throw fetchError;
      return data;
    } catch (err) {
      console.error('...', error);
      return null;
    }
  }, [user, companyId]);

  // Create default journals for a company
  const createDefaultJournals = useCallback(async (defaultJournals: CreateJournalData[]): Promise<Journal[]> => {
    if (!user || !companyId) throw new Error('User not authenticated or company not selected');
    if (!defaultJournals?.length) throw new Error('Default journals data is required');

    setLoading(true);
    setError(null);

    try {
      // Check if journals already exist
      const { count, error: countError } = await supabase
        .from('journals')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId);

      if (countError) throw countError;

      if (count && count > 0) {
        throw new Error('Journals already exist. Use individual journal creation instead.');
      }

      // Prepare journals with company data
      const journalsWithCompany = defaultJournals.map(journal => ({
        company_id: companyId,
        code: journal.code.toUpperCase(),
        name: journal.name,
        type: journal.type,
        description: journal.description || null,
        is_active: journal.is_active !== undefined ? journal.is_active : true,
        last_entry_number: 0
      }));

      const { data: createdJournals, error: insertError } = await supabase
        .from('journals')
        .insert(journalsWithCompany)
        .select();

      if (insertError) throw insertError;

      setJournals(createdJournals || []);
      return createdJournals || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? (err as Error).message : 'Failed to create default journals';
      setError(errorMessage);
      console.error('...', error);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, companyId]);

  // Get journal statistics
  const getJournalStats = useCallback(async () => {
    if (!user || !companyId) return null;

    try {
      const { data, error } = await supabase
        .from('journals')
        .select('type, is_active')
        .eq('company_id', companyId);

      if (error) throw error;

      const stats = {
        total: data.length,
        active: data.filter(j => j.is_active).length,
        inactive: data.filter(j => !j.is_active).length,
        byType: data.reduce((acc, journal) => {
          acc[journal.type] = (acc[journal.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return stats;
    } catch (err) {
      console.error('...', error);
      return null;
    }
  }, [user, companyId]);

  // Load journals on mount and company change
  useEffect(() => {
    if (companyId) {
      fetchJournals();
    }
  }, [companyId, fetchJournals]);

  return {
    journals,
    loading,
    error,
    createJournal,
    createDefaultJournals,
    updateJournal,
    deleteJournal,
    getJournalById,
    getJournalByCode,
    fetchJournals,
    getJournalStats,
    refresh: () => fetchJournals(),
  };
}
