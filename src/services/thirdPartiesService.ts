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
    total_amount: number;
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

  private createBillingAddress(item: any) {
    return item.billing_address || {
      street: item.address_line1 || '',
      city: item.city || '',
      postal_code: item.postal_code || '',
      country: item.country || 'FR'
    };
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
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform data to match expected structure
      const transformedData = (data || []).map((item) => ({
        ...item,
        billing_address: this.createBillingAddress(item),
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
      console.error('Error fetching third parties:', error);
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
      console.error('Error fetching third party:', error);
      throw error;
    }
  }

  async createThirdParty(thirdPartyData: CreateThirdPartyData): Promise<ThirdParty> {
    try {
      const companyId = await this.getCurrentCompanyId();

      // Generate code if not provided
      const code = await this.generateThirdPartyCode(companyId, thirdPartyData.type);

      const { data, error } = await supabase
        .from('third_parties')
        .insert({
          company_id: companyId,
          code,
          type: thirdPartyData.type,
          name: thirdPartyData.name,
          legal_name: thirdPartyData.legal_name,
          email: thirdPartyData.email,
          phone: thirdPartyData.phone,
          address_line1: thirdPartyData.address,
          city: thirdPartyData.city,
          postal_code: thirdPartyData.postal_code,
          country: thirdPartyData.country || 'FR',
          vat_number: thirdPartyData.vat_number,
          payment_terms: thirdPartyData.payment_terms || 30,
          credit_limit: thirdPartyData.credit_limit || 0,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating third party:', error);
      throw error;
    }
  }

  private async generateThirdPartyCode(companyId: string, type: ThirdPartyType): Promise<string> {
    const prefix = type === 'customer' ? 'CLI' : type === 'supplier' ? 'FOU' : 'PAR';

    // Get the last code for this type
    const { data, error } = await supabase
      .from('third_parties')
      .select('code')
      .eq('company_id', companyId)
      .eq('type', type)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error generating code:', error);
      return `${prefix}-${Date.now()}`;
    }

    if (!data || data.length === 0) {
      return `${prefix}-001`;
    }

    // Extract number from last code and increment
    const lastCode = data[0].code;
    const match = lastCode.match(/\d+$/);
    if (match) {
      const nextNumber = parseInt(match[0]) + 1;
      return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
    }

    return `${prefix}-${Date.now()}`;
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
      console.error('Error updating third party:', error);
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
      console.error('Error deleting third party:', error);
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
          invoices!inner(total_amount)
        `)
        .eq('company_id', companyId)
        .eq('type', 'customer')
        .eq('is_active', true)
        .limit(5);

      if (topCustomersError) throw topCustomersError;

      const topCustomers = (topCustomersData || []).map(customer => ({
        id: customer.id,
        name: customer.name,
        total_invoices: customer.invoices?.length || 0,
        total_amount: customer.invoices?.reduce((sum: number, inv: { total_amount?: number | null }) => sum + parseFloat(inv.total_amount?.toString() || '0'), 0) || 0
      })).sort((a, b) => b.total_amount - a.total_amount);

      return {
        total_customers: totalCustomers,
        total_suppliers: totalSuppliers,
        active_customers: activeCustomers,
        active_suppliers: activeSuppliers,
        total_credit_limit: totalCreditLimit,
        top_customers: topCustomers
      };
    } catch (error) {
      console.error('Error fetching third party stats:', error);
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
        supabaseQuery = supabaseQuery.eq('type', type);
      }

      // Add text search
      supabaseQuery = supabaseQuery.or(
        `name.ilike.%${query}%,legal_name.ilike.%${query}%,email.ilike.%${query}%,contact_person.ilike.%${query}%`
      );

      const { data, error } = await supabaseQuery.order('name').limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching third parties:', error);
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
      console.error('Error fetching dashboard data:', error);
      return { 
        data: {} as ThirdPartyDashboardData,
        error: { message: 'Failed to fetch dashboard data' } 
      };
    }
  }

  async getAgingReport(enterpriseId: string): Promise<ThirdPartyServiceResponse<AgingReport[]>> {
    try {
      // Récupérer toutes les factures non payées pour l'entreprise
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          id,
          third_party_id,
          due_date,
          total_amount,
          paid_amount,
          status,
          third_parties (
            id,
            name
          )
        `)
        .eq('company_id', enterpriseId)
        .neq('status', 'paid');

      if (invoicesError) throw invoicesError;

      // Calculer le rapport de vieillissement
      const agingMap = new Map<string, AgingReport>();

      // Filtrer les factures vraiment impayées (montant dû > 0)
      const unpaidInvoices = invoices?.filter(invoice =>
        (invoice.total_amount - (invoice.paid_amount || 0)) > 0
      ) || [];

      unpaidInvoices.forEach(invoice => {
        const thirdParty = Array.isArray(invoice.third_parties) 
          ? invoice.third_parties[0] as { id: string; name: string }
          : invoice.third_parties as { id: string; name: string };
        if (!thirdParty) return;

        const thirdPartyId = thirdParty.id;
        const thirdPartyName = thirdParty.name;

        // Calculer le montant dû
        const outstandingAmount = invoice.total_amount - (invoice.paid_amount || 0);

        // Calculer le nombre de jours d'écart
        const dueDate = new Date(invoice.due_date);
        const today = new Date();
        const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        // Déterminer la tranche
        let bucket: keyof AgingReport['aging_buckets'] = 'current';
        if (daysDiff > 120) bucket = 'bucket_over_120';
        else if (daysDiff > 90) bucket = 'bucket_90';
        else if (daysDiff > 60) bucket = 'bucket_60';
        else if (daysDiff > 30) bucket = 'bucket_30';

        // Initialiser ou mettre à jour l'entrée pour ce tiers
        const existingEntry = agingMap.get(thirdPartyId);
        if (!existingEntry) {
          agingMap.set(thirdPartyId, {
            third_party_id: thirdPartyId,
            third_party_name: thirdPartyName,
            aging_buckets: {
              current: 0,
              bucket_30: 0,
              bucket_60: 0,
              bucket_90: 0,
              bucket_over_120: 0
            },
            total_outstanding: 0,
            oldest_invoice_date: invoice.due_date
          });
        }

        const agingEntry = agingMap.get(thirdPartyId);
        if (agingEntry) {
          agingEntry.aging_buckets[bucket] += outstandingAmount;
          agingEntry.total_outstanding += outstandingAmount;

          // Mettre à jour la date de facture la plus ancienne si nécessaire
          const currentOldest = agingEntry.oldest_invoice_date;
          if (!currentOldest || new Date(invoice.due_date) < new Date(currentOldest)) {
            agingEntry.oldest_invoice_date = invoice.due_date;
          }
        }
      });

      const agingReport = Array.from(agingMap.values());

      return { data: agingReport };
    } catch (error) {
      console.error('Error fetching aging report:', error);
      return {
        data: [],
        error: { message: 'Failed to fetch aging report' }
      };
    }
  }  exportThirdPartiesToCSV(thirdParties: ThirdParty[], config: ExportConfig, filename: string): void {
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