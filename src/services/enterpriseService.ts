import { supabase, handleSupabaseError } from '../lib/supabase';

import { Enterprise, TaxRegime, EnterpriseSettings } from '../types/enterprise.types';

/**
 * Service for managing enterprise-related operations
 */
export const enterpriseService = {
  /**
   * Get all enterprises for the current user
   */
  async getUserEnterprises(): Promise<{ data: Enterprise[] | null; error: Error | null }> {
    try {
      type SupabaseCompany = {
        company_id: string;
        companies: {
          id: string;
          name: string;
          country: string;
          default_currency: string;
          default_locale: string;
          timezone: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        } | null;
      };

      const { data: userCompanies, error: userCompaniesError } = await supabase
        .from('user_companies')
        .select(`
          company_id,
          companies (
            id, 
            name, 
            country,
            default_currency,
            default_locale,
            timezone,
            is_active,
            created_at,
            updated_at
          )
        `) as unknown as { data: SupabaseCompany[]; error: any };

      if (userCompaniesError) throw userCompaniesError;

      // Transform data to match Enterprise interface
      const enterprises: Enterprise[] = userCompanies
        .filter((uc: SupabaseCompany) => uc.companies) // Filter out null entries
        .map((uc: SupabaseCompany) => {
          const company = uc.companies!;
          return {
            id: company.id,
            name: company.name || 'Unnamed Enterprise',
            registrationNumber: '000000000', // Default value since not in DB
            vatNumber: undefined,
            countryCode: company.country || 'FR',
            address: {
              street: '',
              postalCode: '',
              city: '',
              country: 'France'
            },
            taxRegime: {
              id: '1',
              code: 'REAL_NORMAL',
              name: 'Réel Normal',
              type: 'realNormal',
              vatPeriod: 'monthly',
              corporateTaxRate: 25
            },
            fiscalYearStart: 1,
            fiscalYearEnd: 12,
            currency: company.default_currency || 'EUR',
            createdAt: new Date(company.created_at),
            updatedAt: new Date(company.updated_at),
            isActive: company.is_active !== false, // Default to true if undefined
            settings: {
              defaultVATRate: '20',
              defaultPaymentTerms: 30,
              taxReminderDays: 7,
              autoCalculateTax: true,
              roundingRule: 'nearest',
              emailNotifications: true,
              language: company.default_locale || 'fr',
              timezone: company.timezone || 'Europe/Paris'
            }
          };
        });

      return { data: enterprises, error: null };
    } catch (error) {
      console.error('Error fetching user enterprises:', error instanceof Error ? error.message : String(error));
      return { 
        data: null, 
        error: new Error(handleSupabaseError(error))
      };
    }
  },

  /**
   * Create a new enterprise
   */
  async createEnterprise(enterpriseData: {
    name: string;
    registrationNumber: string;
    vatNumber?: string;
    countryCode: string;
    address: {
      street: string;
      postalCode: string;
      city: string;
      country: string;
    };
    taxRegime: TaxRegime;
    fiscalYearStart: number;
    fiscalYearEnd: number;
    currency: string;
    settings: EnterpriseSettings;
  }): Promise<{ data: Enterprise | null; error: Error | null }> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // Prepare data for Supabase
      const companyData = {
        name: enterpriseData.name,
        country: enterpriseData.countryCode,
        default_currency: enterpriseData.currency,
        default_locale: enterpriseData.settings.language,
        timezone: enterpriseData.settings.timezone,
        is_active: true
      };

      // Create company in Supabase
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert([companyData])
        .select()
        .single();

      if (companyError) throw companyError;

      // Link company to user
      const { error: linkError } = await supabase
        .from('user_companies')
        .insert([{
          user_id: user.id,
          company_id: newCompany.id,
          is_default: true // Make this the default company
        }]);

      if (linkError) throw linkError;

      // Convert to Enterprise model
      const newEnterprise: Enterprise = {
        id: newCompany.id,
        name: newCompany.name,
        registrationNumber: enterpriseData.registrationNumber,
        vatNumber: enterpriseData.vatNumber,
        countryCode: newCompany.country || 'FR',
        address: enterpriseData.address,
        taxRegime: enterpriseData.taxRegime,
        fiscalYearStart: enterpriseData.fiscalYearStart,
        fiscalYearEnd: enterpriseData.fiscalYearEnd,
        currency: newCompany.default_currency || 'EUR',
        createdAt: new Date(newCompany.created_at),
        updatedAt: new Date(newCompany.updated_at),
        isActive: newCompany.is_active !== false,
        settings: enterpriseData.settings
      };

      return { data: newEnterprise, error: null };
    } catch (error) {
      console.error('Error creating enterprise:', error instanceof Error ? error.message : String(error));
      return { 
        data: null, 
        error: new Error(handleSupabaseError(error))
      };
    }
  },

  /**
   * Update an existing enterprise
   */
  async updateEnterprise(id: string, data: Partial<Enterprise>): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Prepare data for Supabase
      const updateData: any = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.countryCode !== undefined) updateData.country = data.countryCode;
      if (data.currency !== undefined) updateData.default_currency = data.currency;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;
      if (data.settings?.language !== undefined) updateData.default_locale = data.settings.language;
      if (data.settings?.timezone !== undefined) updateData.timezone = data.settings.timezone;

      // Update in Supabase
      const { error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      return { success: true, error: null };
    } catch (error) {
      console.error('Error updating enterprise:', error instanceof Error ? error.message : String(error));
      return { 
        success: false, 
        error: new Error(handleSupabaseError(error))
      };
    }
  },

  /**
   * Delete an enterprise
   */
  async deleteEnterprise(id: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Delete from Supabase
      // Note: This will cascade delete all related records due to ON DELETE CASCADE
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting enterprise:', error instanceof Error ? error.message : String(error));
      return { 
        success: false, 
        error: new Error(handleSupabaseError(error))
      };
    }
  },

  /**
   * Set an enterprise as the default for the current user
   */
  async setDefaultEnterprise(id: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // First, set all user companies to not default
      const { error: resetError } = await supabase
        .from('user_companies')
        .update({ is_default: false })
        .eq('user_id', user.id);

      if (resetError) throw resetError;

      // Then set the selected company as default
      const { error: updateError } = await supabase
        .from('user_companies')
        .update({ is_default: true })
        .eq('user_id', user.id)
        .eq('company_id', id);

      if (updateError) throw updateError;

      return { success: true, error: null };
    } catch (error) {
      console.error('Error setting default enterprise:', error instanceof Error ? error.message : String(error));
      return { 
        success: false, 
        error: new Error(handleSupabaseError(error))
      };
    }
  }
};