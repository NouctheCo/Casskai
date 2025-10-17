import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';
import type { Database } from '@/types/supabase';

// Generic Supabase hook for CRUD operations with multi-tenancy
export function useSupabase<T extends keyof Database['public']['Tables']>(
  tableName: T,
  companyId?: string
) {
  type TableRow = Database['public']['Tables'][T]['Row'];
  type TableInsert = Database['public']['Tables'][T]['Insert'];
  type TableUpdate = Database['public']['Tables'][T]['Update'];

  const { user } = useAuth();
  const [data, setData] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all records with company filtering
  const fetchData = useCallback(async (filters?: Record<string, any>) => {
    if (!user || (tableName !== 'companies' && tableName !== 'user_companies' && !companyId)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase.from(tableName as string).select('*');

      // Add company_id filter for multi-tenant tables
      if (companyId && tableName !== 'companies' && tableName !== 'user_companies') {
        query = query.eq('company_id', companyId);
      }

      // Add additional filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      const { data: result, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setData(result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      logger.error(`Error fetching ${String(tableName)}:`, err);
    } finally {
      setLoading(false);
    }
  }, [tableName, companyId, user]);

  // Create a new record
  const create = useCallback(async (record: TableInsert): Promise<TableRow | null> => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      // Add company_id and created_by if applicable (excluding system tables)
      const tableNameString = tableName as string;
      const excludedCompanyTables = new Set([
        'companies',
        'subscriptions',
        'subscription_plans'
      ]);

      // Tables that don't have created_by column
      const excludedCreatedByTables = new Set([
        'companies',
        'user_companies',
        'subscriptions',
        'subscription_plans'
      ]);

      // Type-safe record manipulation
      const recordWithMeta = { ...record } as any;

      console.log(`🔧 [useSupabase] Creating record for table: ${tableNameString}`, {
        companyId,
        isExcluded: excludedCompanyTables.has(tableNameString),
        originalRecord: record
      });

      // FORCE REMOVE company_id from excluded tables
      if (excludedCompanyTables.has(tableNameString)) {
        delete recordWithMeta.company_id;
        logger.info(`🚫 [useSupabase] REMOVED company_id from excluded table: ${tableNameString}`)
      }

      // Only add company_id if not excluded AND companyId exists
      if (companyId && !excludedCompanyTables.has(tableNameString)) {
        recordWithMeta.company_id = companyId;
        logger.info(`✅ [useSupabase] Added company_id: ${companyId}`)
      }

      // Only add created_by if not in excluded list
      if (!excludedCreatedByTables.has(tableNameString)) {
        recordWithMeta.created_by = user.id;
        logger.info(`✅ [useSupabase] Added created_by: ${user.id}`)
      }

      logger.info(`📤 [useSupabase] Final record to insert:`, recordWithMeta);

      const { data: result, error: insertError } = await supabase
        .from(tableName as string)
        .insert(recordWithMeta)
        .select()
        .single();

      if (insertError) throw insertError;

      // Update local state
      setData(prev => [...prev, result]);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create record';
      setError(errorMessage);
      logger.error(`Error creating ${String(tableName)}:`, err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tableName, companyId, user]);

  // Update a record
  const update = useCallback(async (id: string, updates: TableUpdate): Promise<TableRow | null> => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      const { data: result, error: updateError } = await supabase
        .from(tableName as string)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state
      setData(prev => prev.map(item => 
        (item as any).id === id ? result : item
      ));

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update record';
      setError(errorMessage);
      logger.error(`Error updating ${String(tableName)}:`, err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tableName, user]);

  // Delete a record
  const remove = useCallback(async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from(tableName as string)
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Update local state
      setData(prev => prev.filter(item => (item as any).id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete record';
      setError(errorMessage);
      logger.error(`Error deleting ${String(tableName)}:`, err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tableName, user]);

  // Get a single record by ID
  const getById = useCallback(async (id: string): Promise<TableRow | null> => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      let query = supabase.from(tableName as string).select('*').eq('id', id);

      // Add company_id filter for multi-tenant tables
      if (companyId && tableName !== 'companies' && tableName !== 'user_companies') {
        query = query.eq('company_id', companyId);
      }

      const { data: result, error: fetchError } = await query.single();

      if (fetchError) throw fetchError;

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch record';
      setError(errorMessage);
      logger.error(`Error fetching ${String(tableName)} by ID:`, err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tableName, companyId, user]);

  // Refresh data
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    create,
    update,
    remove,
    getById,
    fetchData,
    refresh,
  };
}