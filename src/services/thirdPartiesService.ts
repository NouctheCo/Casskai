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

import { supabase } from '@/lib/supabase';

import { 

  ThirdParty, 

  ThirdPartyDashboardData, 

  AgingReport, 

  ThirdPartyServiceResponse,

  ExportConfig

} from '@/types/third-parties.types';



export type ThirdPartyType = 'customer' | 'supplier' | 'partner' | 'employee';



export interface CreateThirdPartyData {

  type: ThirdPartyType;

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

  notes?: string;

}



export interface UpdateThirdPartyData extends Partial<CreateThirdPartyData> {

  is_active?: boolean;

}



export interface ThirdPartyStats {

  total_customers: number;

  total_suppliers: number;

  active_customers: number;

  active_suppliers: number;

  total_credit_limit: number;

  top_customers: Array<{

    id: string;

    name: string;

    total_invoices: number;

    total_incl_tax: number;

  }>;

}



class ThirdPartiesService {

  async getCurrentCompanyId(): Promise<string> {

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');



    const { data: userCompanies, error } = await supabase

      .from('user_companies')

      .select('company_id')

      .eq('user_id', user.id)

      .eq('is_default', true)

      .single();



    if (error || !userCompanies) {

      throw new Error('No active company found');

    }



    return userCompanies.company_id;

  }



  async getThirdParties(enterpriseId?: string, type?: ThirdPartyType): Promise<ThirdParty[]> {

    try {

      const companyId = enterpriseId || await this.getCurrentCompanyId();



      let query = supabase

        .from('third_parties')

        .select('*')

        .eq('company_id', companyId)

        .order('name');



      if (type) {

        query = query.eq('invoice_type', type);

      }



      const { data, error } = await query;



      if (error) throw error;

      

      // Transform data to match expected structure

      const transformedData = (data || []).map(item => ({

        ...item,

        billing_address: item.billing_address || {

          street: item.address_line1 || '',

          city: item.city || '',

          postal_code: item.postal_code || '',

          country: item.country || 'FR'

        },

        primary_email: item.email || item.primary_email || '',

        primary_phone: item.phone || item.primary_phone || '',

        current_balance: item.current_balance || 0,

        total_receivables: item.total_receivables || 0,

        total_payables: item.total_payables || 0,

        tags: item.tags || [],

        contacts: item.contacts || [],

        currency: item.currency || 'EUR',

        payment_terms: item.payment_terms || 30,

        status: item.status || 'active'

      }));



      return transformedData;

    } catch (error) {

      console.error('Error fetching third parties:', error instanceof Error ? error.message : String(error));

      throw error;

    }

  }



  async getThirdPartyById(id: string): Promise<ThirdParty> {

    try {

      const companyId = await this.getCurrentCompanyId();



      const { data, error } = await supabase

        .from('third_parties')

        .select('*')

        .eq('id', id)

        .eq('company_id', companyId)

        .single();



      if (error) throw error;

      if (!data) throw new Error('Third party not found');



      return data;

    } catch (error) {

      console.error('Error fetching third party:', error instanceof Error ? error.message : String(error));

      throw error;

    }

  }



  async createThirdParty(thirdPartyData: CreateThirdPartyData): Promise<ThirdParty> {

    try {

      const companyId = await this.getCurrentCompanyId();



      const { data, error } = await supabase

        .from('third_parties')

        .insert({

          company_id: companyId,

          ...thirdPartyData,

          country: thirdPartyData.country || 'FR',

          payment_terms: thirdPartyData.payment_terms || 30,

          credit_limit: thirdPartyData.credit_limit || 0,

          is_active: true

        })

        .select()

        .single();



      if (error) throw error;

      return data;

    } catch (error) {

      console.error('Error creating third party:', error instanceof Error ? error.message : String(error));

      throw error;

    }

  }



  async updateThirdParty(id: string, updateData: UpdateThirdPartyData): Promise<ThirdParty> {

    try {

      const companyId = await this.getCurrentCompanyId();



      const { data, error } = await supabase

        .from('third_parties')

        .update(updateData)

        .eq('id', id)

        .eq('company_id', companyId)

        .select()

        .single();



      if (error) throw error;

      if (!data) throw new Error('Third party not found');



      return data;

    } catch (error) {

      console.error('Error updating third party:', error instanceof Error ? error.message : String(error));

      throw error;

    }

  }



  async deleteThirdParty(id: string): Promise<void> {

    try {

      const companyId = await this.getCurrentCompanyId();



      // Check if third party is used in invoices

      const { count: invoicesCount } = await supabase

        .from('invoices')

        .select('*', { count: 'exact', head: true })

        .eq('third_party_id', id)

        .eq('company_id', companyId);



      if (invoicesCount && invoicesCount > 0) {

        // Instead of deleting, deactivate the third party

        await this.updateThirdParty(id, { is_active: false });

        return;

      }



      const { error } = await supabase

        .from('third_parties')

        .delete()

        .eq('id', id)

        .eq('company_id', companyId);



      if (error) throw error;

    } catch (error) {

      console.error('Error deleting third party:', error instanceof Error ? error.message : String(error));

      throw error;

    }

  }



  async getThirdPartyStats(): Promise<ThirdPartyStats> {

    try {

      const companyId = await this.getCurrentCompanyId();



      // Get basic counts

      const { data: stats, error: statsError } = await supabase

        .from('third_parties')

        .select('type, is_active, credit_limit')

        .eq('company_id', companyId);



      if (statsError) throw statsError;



      const totalCustomers = stats?.filter(tp => tp.type === 'customer').length || 0;

      const totalSuppliers = stats?.filter(tp => tp.type === 'supplier').length || 0;

      const activeCustomers = stats?.filter(tp => tp.type === 'customer' && tp.is_active).length || 0;

      const activeSuppliers = stats?.filter(tp => tp.type === 'supplier' && tp.is_active).length || 0;

      const totalCreditLimit = stats?.reduce((sum, tp) => sum + (tp.credit_limit || 0), 0) || 0;



      // Get top customers with invoice totals

      const { data: topCustomersData, error: topCustomersError } = await supabase

        .from('third_parties')

        .select(`

          id,

          name,

          invoices!inner(total_incl_tax)

        `)

        .eq('company_id', companyId)

        .eq('invoice_type', 'customer')

        .eq('is_active', true)

        .limit(5);



      if (topCustomersError) throw topCustomersError;



      const topCustomers = (topCustomersData || []).map(customer => ({

        id: customer.id,

        name: customer.name,

        total_invoices: customer.invoices?.length || 0,

        total_incl_tax: customer.invoices?.reduce((sum: number, inv: any) => sum + parseFloat(inv.total_incl_tax || 0), 0) || 0

      })).sort((a, b) => b.total_incl_tax - a.total_incl_tax);



      return {

        total_customers: totalCustomers,

        total_suppliers: totalSuppliers,

        active_customers: activeCustomers,

        active_suppliers: activeSuppliers,

        total_credit_limit: totalCreditLimit,

        top_customers: topCustomers

      };

    } catch (error) {

      console.error('Error fetching third party stats:', error instanceof Error ? error.message : String(error));

      throw error;

    }

  }



  async searchThirdParties(query: string, type?: ThirdPartyType): Promise<ThirdParty[]> {

    try {

      const companyId = await this.getCurrentCompanyId();



      let supabaseQuery = supabase

        .from('third_parties')

        .select('*')

        .eq('company_id', companyId)

        .eq('is_active', true);



      if (type) {

        supabaseQuery = supabaseQuery.eq('invoice_type', type);

      }



      // Add text search

      supabaseQuery = supabaseQuery.or(

        `name.ilike.%${query}%,legal_name.ilike.%${query}%,email.ilike.%${query}%,contact_person.ilike.%${query}%`

      );



      const { data, error } = await supabaseQuery.order('name').limit(10);



      if (error) throw error;

      return data || [];

    } catch (error) {

      console.error('Error searching third parties:', error instanceof Error ? error.message : String(error));

      throw error;

    }

  }



  async getDashboardData(enterpriseId: string): Promise<ThirdPartyServiceResponse<ThirdPartyDashboardData>> {

    try {

      // Get stats

      const stats = await this.getThirdPartyStats();

      

      // Get recent third parties

      const { data: recentThirdParties, error: recentError } = await supabase

        .from('third_parties')

        .select('*')

        .eq('company_id', enterpriseId)

        .order('created_at', { ascending: false })

        .limit(5);



      if (recentError) throw recentError;



      // Get aging report summary

      const agingData = await this.getAgingReport(enterpriseId);



      // Create dashboard data

      const dashboardData: ThirdPartyDashboardData = {

        stats: {

          total_third_parties: stats.total_customers + stats.total_suppliers,

          active_clients: stats.active_customers,

          active_suppliers: stats.active_suppliers,

          new_this_month: 0, // TODO: Calculate from created_at

          total_receivables: 0, // TODO: Calculate from invoices

          total_payables: 0, // TODO: Calculate from bills

          overdue_receivables: 0, // TODO: Calculate overdue invoices

          overdue_payables: 0, // TODO: Calculate overdue bills

          top_clients_by_revenue: [],

          top_suppliers_by_spending: []

        },

        recent_third_parties: recentThirdParties || [],

        aging_summary: agingData.data || [],

        recent_transactions: [], // TODO: Implement transactions

        alerts: {

          overdue_invoices: 0,

          credit_limit_exceeded: 0,

          missing_information: 0

        }

      };



      return { data: dashboardData };

    } catch (error) {

      console.error('Error fetching dashboard data:', error instanceof Error ? error.message : String(error));

      return { 

        data: {} as ThirdPartyDashboardData,

        error: { message: 'Failed to fetch dashboard data' } 

      };

    }

  }



  async getAgingReport(_enterpriseId: string): Promise<ThirdPartyServiceResponse<AgingReport[]>> {

    try {

      // TODO: Implement real aging report calculation

      // For now, return empty data

      const mockData: AgingReport[] = [];

      

      return { data: mockData };

    } catch (error) {

      console.error('Error fetching aging report:', error instanceof Error ? error.message : String(error));

      return { 

        data: [],

        error: { message: 'Failed to fetch aging report' } 

      };

    }

  }



  exportThirdPartiesToCSV(thirdParties: ThirdParty[], config: ExportConfig, filename: string): void {

    const headers = ['Code', 'Name', 'Type', 'Email', 'Phone', 'Status', 'Current Balance'];

    const csvData = thirdParties.map(tp => [

      tp.code,

      tp.name,

      tp.type,

      tp.primary_email,

      tp.primary_phone,

      tp.status,

      tp.current_balance?.toString() || '0'

    ]);



    const csvContent = [headers, ...csvData]

      .map(row => row.map(field => `"${field}"`).join(','))

      .join('\n');



    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');

    if (link.download !== undefined) {

      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);

      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);

      link.style.visibility = 'hidden';

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

    }

  }



}



export const thirdPartiesService = new ThirdPartiesService();

export default thirdPartiesService;
