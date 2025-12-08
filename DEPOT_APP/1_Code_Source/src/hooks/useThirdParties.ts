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

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type ThirdParty = any;

export interface ThirdPartyFilters {
  type?: 'customer' | 'supplier' | 'partner' | 'employee' | 'ALL';
  searchTerm?: string;
  statusFilter?: 'active' | 'inactive';
  countryFilter?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface CreateThirdPartyData {
  type: 'customer' | 'supplier' | 'partner' | 'employee';
  name: string;
  legal_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  vat_number?: string;
  payment_terms?: number;
  credit_limit?: number;
  is_active?: boolean;
  notes?: string;
}

export function useThirdParties(companyId: string) {
  const { user } = useAuth();
  const [thirdParties, setThirdParties] = useState<ThirdParty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to safely escape search terms for ILIKE queries
  const escapeSearchTerm = useCallback((term: string) => {
    if (!term) return '';
    // Escape special characters that could be used for SQL injection
    return term.replace(/[%_\\]/g, '\\$&').replace(/'/g, "''");
  }, []);

  // Fetch third parties with optional filters
  const fetchThirdParties = useCallback(async (filters: ThirdPartyFilters = {}) => {
    if (!user || !companyId) return;

    const { 
      type = 'ALL', 
      searchTerm = '', 
      statusFilter, 
      countryFilter, 
      sortBy = 'name', 
      sortDirection = 'asc',
      page,
      pageSize
    } = filters;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('third_parties')
        .select('*', { count: 'exact' })
        .eq('company_id', companyId);

      // Apply filters
      if (type && type !== 'ALL') {
        query = query.eq('type', type);
      }
      
      if (searchTerm) {
        const escapedTerm = escapeSearchTerm(searchTerm);
        query = query.or(
          `name.ilike.%${escapedTerm}%,email.ilike.%${escapedTerm}%,phone.ilike.%${escapedTerm}%,vat_number.ilike.%${escapedTerm}%`
        );
      }
      
      if (statusFilter === 'active') {
        query = query.eq('is_active', true);
      } else if (statusFilter === 'inactive') {
        query = query.eq('is_active', false);
      }
      
      if (countryFilter) {
        query = query.eq('country', countryFilter);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortDirection === 'asc' });

      // Apply pagination
      if (page && pageSize) {
        const offset = (page - 1) * pageSize;
        query = query.range(offset, offset + pageSize - 1);
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setThirdParties(data || []);
      return { data: data || [], count: count || 0, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? (err as Error).message : 'Failed to fetch third parties';
      setError(errorMessage);
      console.error('...', error);
      return { data: [], count: 0, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, companyId, escapeSearchTerm]);

  // Create a new third party
  const createThirdParty = useCallback(async (
    thirdPartyData: CreateThirdPartyData
  ): Promise<ThirdParty | null> => {
    if (!user || !companyId) throw new Error('User not authenticated or company not selected');

    setLoading(true);
    setError(null);

    try {
      const { data: newThirdParty, error: insertError } = await supabase
        .from('third_parties')
        .insert({
          ...thirdPartyData,
          company_id: companyId,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setThirdParties(prev => [newThirdParty, ...prev]);
      return newThirdParty;
    } catch (err) {
      const errorMessage = err instanceof Error ? (err as Error).message : 'Failed to create third party';
      setError(errorMessage);
      console.error('...', error);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, companyId]);

  // Update a third party
  const updateThirdParty = useCallback(async (
    id: string,
    updates: Partial<ThirdParty>
  ): Promise<ThirdParty | null> => {
    if (!user || !companyId) throw new Error('User not authenticated or company not selected');

    setLoading(true);
    setError(null);

    try {
      const { data: updatedThirdParty, error: updateError } = await supabase
        .from('third_parties')
        .update(updates)
        .eq('id', id)
        .eq('company_id', companyId)
        .select()
        .single();

      if (updateError) throw updateError;

      setThirdParties(prev => prev.map(tp => 
        tp.id === id ? updatedThirdParty : tp
      ));

      return updatedThirdParty;
    } catch (err) {
      const errorMessage = err instanceof Error ? (err as Error).message : 'Failed to update third party';
      setError(errorMessage);
      console.error('...', error);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, companyId]);

  // Delete a third party
  const deleteThirdParty = useCallback(async (id: string): Promise<void> => {
    if (!user || !companyId) throw new Error('User not authenticated or company not selected');

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('third_parties')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);

      if (deleteError) throw deleteError;

      setThirdParties(prev => prev.filter(tp => tp.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? (err as Error).message : 'Failed to delete third party';
      setError(errorMessage);
      console.error('...', error);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, companyId]);

  // Get third party by ID
  const getThirdPartyById = useCallback(async (id: string): Promise<ThirdParty | null> => {
    if (!user || !companyId) return null;

    try {
      const { data, error: fetchError } = await supabase
        .from('third_parties')
        .select('*')
        .eq('id', id)
        .eq('company_id', companyId)
        .single();

      if (fetchError) throw fetchError;
      return data;
    } catch (_err) {
      console.error('...', error);
      return null;
    }
  }, [user, companyId]);

  // Get statistics
  const getStatistics = useCallback(async () => {
    if (!user || !companyId) return null;

    try {
      const { data, error } = await supabase
        .from('third_parties')
        .select('type')
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (error) throw error;

      const stats = {
        totalCustomers: 0,
        totalSuppliers: 0,
        totalPartners: 0,
        totalEmployees: 0,
        totalActive: data?.length || 0,
      };

      data?.forEach(tp => {
        switch (tp.type) {
          case 'customer':
            stats.totalCustomers++;
            break;
          case 'supplier':
            stats.totalSuppliers++;
            break;
          case 'partner':
            stats.totalPartners++;
            break;
          case 'employee':
            stats.totalEmployees++;
            break;
        }
      });

      return stats;
    } catch (_err) {
      console.error('...', error);
      return null;
    }
  }, [user, companyId]);

  // Load third parties on mount and company change
  useEffect(() => {
    if (companyId) {
      fetchThirdParties();
    }
  }, [companyId, fetchThirdParties]);

  return {
    thirdParties,
    loading,
    error,
    createThirdParty,
    updateThirdParty,
    deleteThirdParty,
    getThirdPartyById,
    fetchThirdParties,
    getStatistics,
    refresh: () => fetchThirdParties(),
  };
}
