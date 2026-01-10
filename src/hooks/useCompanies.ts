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
import type { Company, UserRole } from '@/types/database.types';
import { logger } from '@/lib/logger';
export interface CompanyWithRole extends Company {
  role: UserRole;
  is_default: boolean;
}
export function useCompanies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<CompanyWithRole[]>([]);
  const [currentCompany, setCurrentCompany] = useState<CompanyWithRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Fetch user companies with roles
  const fetchCompanies = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data: userCompanies, error: fetchError } = await supabase
        .from('user_companies')
        .select(`
          role,
          is_default,
          companies (
            id,
            name,
            legal_name,
            siret,
            vat_number,
            address,
            city,
            postal_code,
            country,
            phone,
            email,
            website,
            default_currency,
            default_locale,
            timezone,
            fiscal_year_start,
            is_active,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });
      if (fetchError) throw fetchError;
      const companiesWithRole: CompanyWithRole[] = (userCompanies || []).map((uc: any) => ({
        ...uc.companies,
        role: uc.role,
        is_default: uc.is_default,
      }));
      setCompanies(companiesWithRole);
      // Set current company (default or first)
      const defaultCompany = companiesWithRole.find(c => c.is_default);
      if (defaultCompany) {
        setCurrentCompany(defaultCompany);
      } else if (companiesWithRole.length > 0) {
        setCurrentCompany(companiesWithRole[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? (err as Error).message : 'Failed to fetch companies');
      logger.error('UseCompanies', '...', error);
    } finally {
      setLoading(false);
    }
  }, [user]);
  // Create a new company
  const createCompany = useCallback(async (companyData: {
    name: string;
    country?: string;
    currency?: string;
  }): Promise<CompanyWithRole | null> => {
    if (!user) throw new Error('User not authenticated');
    setLoading(true);
    setError(null);
    try {
      const { data: newCompanyId, error: createError } = await supabase.rpc(
        'create_company_with_setup',
        {
          company_name: companyData.name,
          user_uuid: user.id,
          country_code: companyData.country || 'FR',
          currency_code: companyData.currency || 'EUR',
          accounting_standard_param: (companyData as any).accountingStandard || null,
        }
      );
      if (createError) throw createError;
      // Fetch the newly created company
      const { data: company, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', newCompanyId)
        .single();
      if (fetchError) throw fetchError;
      const newCompany: CompanyWithRole = {
        ...company,
        role: 'owner' as unknown as UserRole,
        is_default: companies.length === 0, // First company becomes default
      };
      setCompanies(prev => [...prev, newCompany]);
      // Set as current company if it's the first one
      if (companies.length === 0) {
        setCurrentCompany(newCompany);
      }
      return newCompany;
    } catch (err) {
      const errorMessage = err instanceof Error ? (err as Error).message : 'Failed to create company';
      setError(errorMessage);
      logger.error('UseCompanies', '...', error);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, companies.length]);
  // Update company
  const updateCompany = useCallback(async (
    companyId: string, 
    updates: Partial<Company>
  ): Promise<CompanyWithRole | null> => {
    if (!user) throw new Error('User not authenticated');
    setLoading(true);
    setError(null);
    try {
      const { data: updatedCompany, error: updateError } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', companyId)
        .select()
        .single();
      if (updateError) throw updateError;
      // Update local state
      setCompanies(prev => prev.map(company => 
        company.id === companyId 
          ? { ...updatedCompany, role: company.role, is_default: company.is_default }
          : company
      ));
      // Update current company if it's the one being updated
      if (currentCompany?.id === companyId) {
        setCurrentCompany(prev => prev ? {
          ...updatedCompany,
          role: prev.role,
          is_default: prev.is_default
        } : null);
      }
      return {
        ...updatedCompany,
        role: companies.find(c => c.id === companyId)?.role || 'viewer',
        is_default: companies.find(c => c.id === companyId)?.is_default || false
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? (err as Error).message : 'Failed to update company';
      setError(errorMessage);
      logger.error('UseCompanies', '...', error);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, companies, currentCompany?.id]);
  // Switch current company
  const switchCompany = useCallback(async (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (!company) {
      setError('Company not found');
      return;
    }
    // Update default company in database
    if (!company.is_default) {
      try {
        // Remove default from all companies
        await supabase
          .from('user_companies')
          .update({ is_default: false })
          .eq('user_id', user?.id);
        // Set new default
        await supabase
          .from('user_companies')
          .update({ is_default: true })
          .eq('user_id', user?.id)
          .eq('company_id', companyId);
        // Update local state
        setCompanies(prev => prev.map(c => ({
          ...c,
          is_default: c.id === companyId
        })));
      } catch (_err) {
        logger.error('UseCompanies', '...', error);
        // Continue with local switch even if DB update fails
      }
    }
    setCurrentCompany(company);
  }, [companies, user?.id]);
  // Check if user has permission for an action
  const hasPermission = useCallback((
    companyId: string,
    requiredRoles: UserRole[]
  ): boolean => {
    const company = companies.find(c => c.id === companyId);
    return company ? requiredRoles.includes(company.role) : false;
  }, [companies]);
  // Get user role for a company
  const getUserRole = useCallback((companyId: string): UserRole | null => {
    const company = companies.find(c => c.id === companyId);
    return company?.role || null;
  }, [companies]);
  // Load data on mount and user change
  useEffect(() => {
    if (user) {
      fetchCompanies();
    } else {
      setCompanies([]);
      setCurrentCompany(null);
    }
  }, [user, fetchCompanies]);
  return {
    companies,
    currentCompany,
    loading,
    error,
    createCompany,
    updateCompany,
    switchCompany,
    hasPermission,
    getUserRole,
    refresh: fetchCompanies,
  };
}