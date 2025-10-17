import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';
import type { Enterprise as BaseEnterprise, TaxRegime, EnterpriseSettings } from '@/types/enterprise.types';

// Simplified Enterprise type for this hook (database representation)
export interface Enterprise {
  id: string;
  name: string;
  country?: string;
  countryCode?: string;
  currency?: string;
  locale?: string;
  timezone?: string;
  isActive: boolean;
  address?: any;
  city?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxNumber?: string;
  registrationNumber?: string;
  legalForm?: string;
  createdAt?: string | Date | number;
  updatedAt?: string | Date | number;
  userRole?: string;
  isDefault?: boolean;
  // Optional fields from BaseEnterprise
  vatNumber?: string;
  taxRegime?: TaxRegime;
  fiscalYearStart?: number;
  fiscalYearEnd?: number;
  logo?: string;
  settings?: EnterpriseSettings;
}

export interface CreateEnterpriseData {
  name: string;
  country: string;
  default_currency?: string;
  default_locale?: string;
  timezone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  tax_number?: string;
  registration_number?: string;
  legal_form?: string;
}

export interface UpdateEnterpriseData extends Partial<CreateEnterpriseData> {
  is_active?: boolean;
}

export function useEnterprise() {
  const { user } = useAuth();
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [currentEnterprise, setCurrentEnterprise] = useState<Enterprise | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get all enterprises for the current user
  const getUserEnterprises = useCallback(async () => {
    if (!user) return { data: [], error: null };

    setLoading(true);
    setError(null);

    try {
      const { data: userCompanies, error: fetchError } = await supabase
        .from('user_companies')
        .select(`
          company_id,
          role,
          is_default,
          companies (
            id, 
            name, 
            country,
            default_currency,
            default_locale,
            timezone,
            is_active,
            address,
            city,
            postal_code,
            phone,
            email,
            website,
            tax_number,
            registration_number,
            legal_form,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      // Transform data to match Enterprise interface
      const transformedEnterprises: Enterprise[] = userCompanies
        .filter((uc: any) => uc.companies) // Filter out null entries
        .map((uc: any) => ({
          id: uc.companies.id,
          name: uc.companies.name,
          country: uc.companies.country,
          currency: uc.companies.default_currency || 'EUR',
          locale: uc.companies.default_locale || 'fr-FR',
          timezone: uc.companies.timezone || 'Europe/Paris',
          isActive: uc.companies.is_active,
          address: uc.companies.address,
          city: uc.companies.city,
          postalCode: uc.companies.postal_code,
          phone: uc.companies.phone,
          email: uc.companies.email,
          website: uc.companies.website,
          taxNumber: uc.companies.tax_number,
          registrationNumber: uc.companies.registration_number,
          legalForm: uc.companies.legal_form,
          createdAt: uc.companies.created_at,
          updatedAt: uc.companies.updated_at,
          userRole: uc.role,
          isDefault: uc.is_default
        }));

      setEnterprises(transformedEnterprises);
      
      // Set current enterprise to default one or first one
      const defaultEnterprise = transformedEnterprises.find(e => e.isDefault) || transformedEnterprises[0];
      if (defaultEnterprise && (!currentEnterprise || currentEnterprise.id !== defaultEnterprise.id)) {
        setCurrentEnterprise(defaultEnterprise);
      }

      return { data: transformedEnterprises, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch enterprises';
      setError(errorMessage);
      logger.error('Error fetching user enterprises:', err);
      return { data: [], error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, currentEnterprise]);

  // Create a new enterprise
  const createEnterprise = useCallback(async (enterpriseData: CreateEnterpriseData): Promise<Enterprise | null> => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      // 1. Create the company
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: enterpriseData.name,
          country: enterpriseData.country,
          default_currency: enterpriseData.default_currency || 'EUR',
          default_locale: enterpriseData.default_locale || 'fr-FR',
          timezone: enterpriseData.timezone || 'Europe/Paris',
          address: enterpriseData.address,
          city: enterpriseData.city,
          postal_code: enterpriseData.postal_code,
          phone: enterpriseData.phone,
          email: enterpriseData.email,
          website: enterpriseData.website,
          tax_number: enterpriseData.tax_number,
          registration_number: enterpriseData.registration_number,
          legal_form: enterpriseData.legal_form,
          is_active: true
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // 2. Associate user as owner
      const { error: userCompanyError } = await supabase
        .from('user_companies')
        .insert({
          user_id: user.id,
          company_id: newCompany.id,
          role: 'owner',
          is_default: enterprises.length === 0 // Set as default if it's the first company
        });

      if (userCompanyError) throw userCompanyError;

      // 3. Transform to Enterprise format
      const newEnterprise: Enterprise = {
        id: newCompany.id,
        name: newCompany.name,
        country: newCompany.country,
        currency: newCompany.default_currency,
        locale: newCompany.default_locale,
        timezone: newCompany.timezone,
        isActive: newCompany.is_active,
        address: newCompany.address,
        city: newCompany.city,
        postalCode: newCompany.postal_code,
        phone: newCompany.phone,
        email: newCompany.email,
        website: newCompany.website,
        taxNumber: newCompany.tax_number,
        registrationNumber: newCompany.registration_number,
        legalForm: newCompany.legal_form,
        createdAt: newCompany.created_at,
        updatedAt: newCompany.updated_at,
        userRole: 'owner',
        isDefault: enterprises.length === 0
      };

      setEnterprises(prev => [...prev, newEnterprise]);
      
      // Set as current if it's the first company
      if (enterprises.length === 0) {
        setCurrentEnterprise(newEnterprise);
      }

      return newEnterprise;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create enterprise';
      setError(errorMessage);
      logger.error('Error creating enterprise:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, enterprises.length]);

  // Update an enterprise
  const updateEnterprise = useCallback(async (
    enterpriseId: string,
    updates: UpdateEnterpriseData
  ): Promise<Enterprise | null> => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      // Prepare update data
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.country) updateData.country = updates.country;
      if (updates.default_currency) updateData.default_currency = updates.default_currency;
      if (updates.default_locale) updateData.default_locale = updates.default_locale;
      if (updates.timezone) updateData.timezone = updates.timezone;
      if (updates.address !== undefined) updateData.address = updates.address;
      if (updates.city) updateData.city = updates.city;
      if (updates.postal_code) updateData.postal_code = updates.postal_code;
      if (updates.phone) updateData.phone = updates.phone;
      if (updates.email) updateData.email = updates.email;
      if (updates.website) updateData.website = updates.website;
      if (updates.tax_number) updateData.tax_number = updates.tax_number;
      if (updates.registration_number) updateData.registration_number = updates.registration_number;
      if (updates.legal_form) updateData.legal_form = updates.legal_form;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

      const { data: updatedCompany, error: updateError } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', enterpriseId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Transform to Enterprise format
      const updatedEnterprise: Enterprise = {
        id: updatedCompany.id,
        name: updatedCompany.name,
        country: updatedCompany.country,
        currency: updatedCompany.default_currency,
        locale: updatedCompany.default_locale,
        timezone: updatedCompany.timezone,
        isActive: updatedCompany.is_active,
        address: updatedCompany.address,
        city: updatedCompany.city,
        postalCode: updatedCompany.postal_code,
        phone: updatedCompany.phone,
        email: updatedCompany.email,
        website: updatedCompany.website,
        taxNumber: updatedCompany.tax_number,
        registrationNumber: updatedCompany.registration_number,
        legalForm: updatedCompany.legal_form,
        createdAt: updatedCompany.created_at,
        updatedAt: updatedCompany.updated_at,
        userRole: enterprises.find(e => e.id === enterpriseId)?.userRole || 'viewer',
        isDefault: enterprises.find(e => e.id === enterpriseId)?.isDefault || false
      };

      setEnterprises(prev => prev.map(e => e.id === enterpriseId ? updatedEnterprise : e));
      
      if (currentEnterprise?.id === enterpriseId) {
        setCurrentEnterprise(updatedEnterprise);
      }

      return updatedEnterprise;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update enterprise';
      setError(errorMessage);
      logger.error('Error updating enterprise:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, enterprises, currentEnterprise]);

  // Set default enterprise
  const setDefaultEnterprise = useCallback(async (enterpriseId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      // Remove default from all user's companies
      await supabase
        .from('user_companies')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set new default company
      const { error: updateError } = await supabase
        .from('user_companies')
        .update({ is_default: true })
        .eq('user_id', user.id)
        .eq('company_id', enterpriseId);

      if (updateError) throw updateError;

      // Update local state
      setEnterprises(prev => prev.map(e => ({
        ...e,
        isDefault: e.id === enterpriseId
      })));

      const newDefault = enterprises.find(e => e.id === enterpriseId);
      if (newDefault) {
        setCurrentEnterprise({ ...newDefault, isDefault: true });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set default enterprise';
      setError(errorMessage);
      logger.error('Error setting default enterprise:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, enterprises]);

  // Switch current enterprise
  const switchEnterprise = useCallback((enterpriseId: string) => {
    const enterprise = enterprises.find(e => e.id === enterpriseId);
    if (enterprise) {
      setCurrentEnterprise(enterprise);
    }
  }, [enterprises]);

  // Get enterprise by ID
  const getEnterpriseById = useCallback((enterpriseId: string): Enterprise | null => {
    return enterprises.find(e => e.id === enterpriseId) || null;
  }, [enterprises]);

  // Check user permissions for an enterprise
  const hasPermission = useCallback((enterpriseId: string, requiredRole: string): boolean => {
    const enterprise = enterprises.find(e => e.id === enterpriseId);
    if (!enterprise) return false;

    const roleHierarchy: Record<string, number> = {
      viewer: 1,
      employee: 2,
      accountant: 3,
      admin: 4,
      owner: 5
    };

    const userRoleLevel = roleHierarchy[enterprise.userRole] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    return userRoleLevel >= requiredRoleLevel;
  }, [enterprises]);

  // Load enterprises on mount
  useEffect(() => {
    if (user) {
      getUserEnterprises();
    }
  }, [user, getUserEnterprises]);

  return {
    enterprises,
    currentEnterprise,
    loading,
    error,
    getUserEnterprises,
    createEnterprise,
    updateEnterprise,
    setDefaultEnterprise,
    switchEnterprise,
    getEnterpriseById,
    hasPermission,
    refresh: getUserEnterprises,
  };
}