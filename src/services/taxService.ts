// Helper to format Supabase errors
function handleSupabaseError(error: unknown, context: string) {
  if (error instanceof Error) {
    return { message: `[${context}] ${error.message}` };
  }
  return { message: `[${context}] ${JSON.stringify(error)}` };
}
import { supabase } from '../lib/supabase';
import { 
  TaxRate, 
  TaxDeclaration, 
  TaxPayment, 
  TaxDashboardData,
  TaxCalendarEvent,
  TaxAlert,
  TaxObligation,
  TaxServiceResponse
} from '../types/tax.types';
import { logger } from '@/utils/logger';

/**
 * Service for managing tax-related operations
 */
export const taxService = {
  /**
   * Get tax rates for a company
   */
  async getTaxRates(companyId: string): Promise<{ data: TaxRate[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('company_tax_rates')
        .select('*')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;

      // Map DB data to TaxRate model
      const taxRates = data?.map(rate => ({
        id: rate.id,
        name: rate.name,
        rate: rate.rate,
        type: rate.type,
        description: rate.description,
        countryCode: 'FR', // This should come from the company
        isActive: rate.is_active,
        isDefault: rate.is_default,
        createdAt: new Date(rate.created_at),
        updatedAt: new Date(rate.updated_at),
        createdBy: rate.created_by
      })) || null;

      return { data: taxRates, error: null };
    } catch (error) {
      logger.error('Error fetching tax rates:', error);
      const errorInfo = handleSupabaseError(error, 'Fetching tax rates');
      return { 
        data: null, 
        error: new Error(errorInfo.message) 
      };
    }
  },

  /**
   * Create a new tax rate
   */
  async createTaxRate(companyId: string, taxRate: Omit<TaxRate, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ data: TaxRate | null; error: Error | null }> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // Prepare data for Supabase
      const rateData = {
        company_id: companyId,
        name: taxRate.name,
        rate: taxRate.rate,
        type: taxRate.type,
        description: taxRate.description || '',
        is_default: taxRate.isDefault || false,
        is_active: taxRate.isActive !== false,
        valid_from: new Date().toISOString(),
        created_by: user.id
      };

      // Insert into database
      const { data, error } = await supabase
        .from('company_tax_rates')
        .insert([rateData])
        .select()
        .single();

      if (error) throw error;

      // Convert to TaxRate model
      const newRate: TaxRate = {
        id: data.id,
        name: data.name,
        rate: data.rate,
        type: data.type,
        description: data.description,
        countryCode: taxRate.countryCode,
        isActive: data.is_active,
        isDefault: data.is_default,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        createdBy: data.created_by
      };

      return { data: newRate, error: null };
    } catch (error) {
      logger.error('Error creating tax rate:', error);
      const errorInfo = handleSupabaseError(error, 'Creating tax rate');
      return { 
        data: null, 
        error: new Error(errorInfo.message) 
      };
    }
  },

  /**
   * Update an existing tax rate
   */
  async updateTaxRate(id: string, updates: Partial<TaxRate>): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Prepare data for Supabase
      const updateData: Record<string, unknown> = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.rate !== undefined) updateData.rate = updates.rate;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault;

      // Update in database
      const { error } = await supabase
        .from('company_tax_rates')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      return { success: true, error: null };
    } catch (error) {
      logger.error('Error updating tax rate:', error);
      const errorInfo = handleSupabaseError(error, 'Updating tax rate');
      return { 
        success: false, 
        error: new Error(errorInfo.message) 
      };
    }
  },

  /**
   * Delete a tax rate
   */
  async deleteTaxRate(id: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase
        .from('company_tax_rates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true, error: null };
    } catch (error) {
      logger.error('Error deleting tax rate:', error);
      const errorInfo = handleSupabaseError(error, 'Deleting tax rate');
      return { 
        success: false, 
        error: new Error(errorInfo.message) 
      };
    }
  },

  /**
   * Get tax declarations for a company
   */
  async getTaxDeclarations(companyId: string, filters?: {
    status?: string;
    type?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<{ data: TaxDeclaration[] | null; error: Error | null }> {
    try {
      let query = supabase
        .from('company_tax_declarations')
        .select('*')
        .eq('company_id', companyId);

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      
      if (filters?.fromDate) {
        query = query.gte('due_date', filters.fromDate.toISOString());
      }
      
      if (filters?.toDate) {
        query = query.lte('due_date', filters.toDate.toISOString());
      }

      // Order by due date
      query = query.order('due_date');

      const { data, error } = await query;

      if (error) throw error;

      // Map DB data to TaxDeclaration model
      const declarations = data?.map(decl => ({
        id: decl.id,
        type: decl.type,
        name: decl.name,
        dueDate: new Date(decl.due_date),
        status: decl.status,
        amount: decl.amount,
        description: decl.description,
        companyId: decl.company_id,
        countryCode: 'FR', // This should come from the company
        period: {
          start: new Date(decl.period_start),
          end: new Date(decl.period_end)
        },
        submittedDate: decl.submitted_date ? new Date(decl.submitted_date) : undefined,
        submittedBy: decl.submitted_by
      })) || null;

      return { data: declarations, error: null };
    } catch (error) {
      logger.error('Error fetching tax declarations:', error);
      const errorInfo = handleSupabaseError(error, 'Fetching tax declarations');
      return { 
        data: null, 
        error: new Error(errorInfo.message) 
      };
    }
  },

  /**
   * Create a new tax declaration
   */
  async createTaxDeclaration(companyId: string, declaration: Omit<TaxDeclaration, 'id'>): Promise<{ data: TaxDeclaration | null; error: Error | null }> {
    try {
      // Prepare data for Supabase
      const declarationData = {
        company_id: companyId,
        type: declaration.type,
        name: declaration.name,
        period_start: declaration.period?.start.toISOString(),
        period_end: declaration.period?.end.toISOString(),
        due_date: declaration.dueDate.toISOString(),
        status: declaration.status,
        amount: declaration.amount,
        description: declaration.description || '',
        currency: 'EUR' // This should come from the company
      };

      // Insert into database
      const { data, error } = await supabase
        .from('company_tax_declarations')
        .insert([declarationData])
        .select()
        .single();

      if (error) throw error;

      // Convert to TaxDeclaration model
      const newDeclaration: TaxDeclaration = {
        id: data.id,
        type: data.type,
        name: data.name,
        dueDate: new Date(data.due_date),
        status: data.status,
        amount: data.amount,
        description: data.description,
        companyId: data.company_id,
        countryCode: declaration.countryCode,
        period: {
          start: new Date(data.period_start),
          end: new Date(data.period_end)
        }
      };

      return { data: newDeclaration, error: null };
    } catch (error) {
      logger.error('Error creating tax declaration:', error);
      const errorInfo = handleSupabaseError(error, 'Creating tax declaration');
      return { 
        data: null, 
        error: new Error(errorInfo.message) 
      };
    }
  },

  /**
   * Update an existing tax declaration
   */
  async updateTaxDeclaration(id: string, updates: Partial<TaxDeclaration>): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Prepare data for Supabase
      const updateData: Record<string, unknown> = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate.toISOString();
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.period !== undefined) {
        updateData.period_start = updates.period.start.toISOString();
        updateData.period_end = updates.period.end.toISOString();
      }
      if (updates.submittedDate !== undefined) updateData.submitted_date = updates.submittedDate.toISOString();
      if (updates.submittedBy !== undefined) updateData.submitted_by = updates.submittedBy;

      // Update in database
      const { error } = await supabase
        .from('company_tax_declarations')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      return { success: true, error: null };
    } catch (error) {
      logger.error('Error updating tax declaration:', error);
      const errorInfo = handleSupabaseError(error, 'Updating tax declaration');
      return { 
        success: false, 
        error: new Error(errorInfo.message) 
      };
    }
  },

  /**
   * Mark a tax declaration as submitted
   */
  async markDeclarationAsSubmitted(id: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // Update in database
      const { error } = await supabase
        .from('company_tax_declarations')
        .update({
          status: 'submitted',
          submitted_date: new Date().toISOString(),
          submitted_by: user.id
        })
        .eq('id', id);

      if (error) throw error;

      return { success: true, error: null };
    } catch (error) {
      logger.error('Error marking declaration as submitted:', error);
      const errorInfo = handleSupabaseError(error, 'Marking declaration as submitted');
      return { 
        success: false, 
        error: new Error(errorInfo.message) 
      };
    }
  },

  /**
   * Create a new tax payment
   */
  async createTaxPayment(companyId: string, payment: Omit<TaxPayment, 'id'>): Promise<{ data: TaxPayment | null; error: Error | null }> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // Prepare data for Supabase
      const paymentData = {
        company_id: companyId,
        declaration_id: payment.declarationId,
        amount: payment.amount,
        currency: payment.currency,
        payment_date: payment.paymentDate.toISOString(),
        payment_method: payment.paymentMethod,
        reference: payment.reference,
        status: payment.status,
        receipt_url: payment.receiptUrl,
        created_by: user.id
      };

      // Insert into database
      const { data, error } = await supabase
        .from('company_tax_payments')
        .insert([paymentData])
        .select()
        .single();

      if (error) throw error;

      // Convert to TaxPayment model
      const newPayment: TaxPayment = {
        id: data.id,
        declarationId: data.declaration_id,
        amount: data.amount,
        currency: data.currency,
        paymentDate: new Date(data.payment_date),
        paymentMethod: data.payment_method,
        reference: data.reference,
        status: data.status,
        receiptUrl: data.receipt_url
      };

      return { data: newPayment, error: null };
    } catch (error) {
      logger.error('Error creating tax payment:', error);
      const errorInfo = handleSupabaseError(error, 'Creating tax payment');
      return { 
        data: null, 
        error: new Error(errorInfo.message) 
      };
    }
  },

  /**
   * Calculate tax for a given amount and rate
   */
  calculateTax(amount: number, rate: number): {
    baseAmount: number;
    taxRate: number;
    taxAmount: number;
    totalAmount: number;
  } {
    const taxAmount = (amount * rate) / 100;
    return {
      baseAmount: amount,
      taxRate: rate,
      taxAmount,
      totalAmount: amount + taxAmount
    };
  },

  /**
   * Export tax data to PDF
   */
  async exportToPDF(data: Record<string, unknown>): Promise<{ success: boolean; error: Error | null }> {
    // This would be implemented with a PDF generation library
    // For now, we'll just return success
    return { success: true, error: null };
  },

  /**
   * Get tax dashboard data
   */
  async getDashboardData(enterpriseId: string): Promise<TaxServiceResponse<TaxDashboardData>> {
    try {
      // Récupérer les factures pour calculer la TVA
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('type, total_tax, status, due_date, created_at')
        .eq('company_id', enterpriseId);

      if (invoicesError) throw invoicesError;

      // Récupérer les déclarations fiscales existantes
      const { data: declarations, error: declarationsError } = await supabase
        .from('tax_declarations')
        .select('*')
        .eq('company_id', enterpriseId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (declarationsError) throw declarationsError;

      // Calculer les statistiques TVA
      const currentYear = new Date().getFullYear();
      const currentYearInvoices = invoices?.filter(inv => {
        const invoiceYear = new Date(inv.created_at).getFullYear();
        return invoiceYear === currentYear;
      }) || [];

      const vatCollected = currentYearInvoices
        .filter(inv => inv.type === 'sale')
        .reduce((sum, inv) => sum + (inv.total_tax || 0), 0);

      const vatDeductible = currentYearInvoices
        .filter(inv => inv.type === 'purchase')
        .reduce((sum, inv) => sum + (inv.total_tax || 0), 0);

      const vatToPay = vatCollected - vatDeductible;

      // Calculer les statistiques de déclarations
      const totalDeclarations = declarations?.length || 0;
      const pendingDeclarations = declarations?.filter(d => d.status === 'draft' || d.status === 'submitted').length || 0;
      const overdueDeclarations = declarations?.filter(d => {
        return (d.status === 'draft' || d.status === 'submitted') && new Date(d.due_date) < new Date();
      }).length || 0;

      const totalTaxAmount = declarations?.reduce((sum, d) => sum + (d.tax_amount || 0), 0) || 0;
      const paidTaxAmount = declarations?.filter(d => d.status === 'accepted').reduce((sum, d) => sum + (d.tax_amount || 0), 0) || 0;

      // Récupérer les alertes fiscales (factures impayées proches de l'échéance)
      const upcomingDueInvoices = invoices?.filter(inv => {
        if (inv.status !== 'unpaid') return false;
        const dueDate = new Date(inv.due_date);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilDue <= 30 && daysUntilDue >= 0;
      }).length || 0;

      const dashboardData: TaxDashboardData = {
        stats: {
          total_declarations: totalDeclarations,
          pending_declarations: pendingDeclarations,
          overdue_declarations: overdueDeclarations,
          total_tax_due: totalTaxAmount,
          total_tax_paid: paidTaxAmount,
          upcoming_deadlines: upcomingDueInvoices,
          active_alerts: upcomingDueInvoices,
          by_type: [] // TODO: Implémenter la répartition par type
        },
        upcoming_obligations: [],
        recent_declarations: declarations?.slice(0, 5).map(d => ({
          id: d.id,
          type: d.declaration_type as 'TVA' | 'IS' | 'Liasse' | 'IR' | 'CFE' | 'CVAE',
          name: `${d.declaration_type} ${d.year}${d.month ? `-${d.month}` : d.quarter ? `-Q${d.quarter}` : ''}`,
          dueDate: new Date(d.due_date),
          status: d.status === 'accepted' ? 'completed' : d.status === 'submitted' ? 'submitted' : 'pending',
          amount: d.tax_amount,
          companyId: d.company_id,
          countryCode: 'FR',
          period: {
            start: new Date(d.period_start),
            end: new Date(d.period_end)
          }
        })) || [],
        active_alerts: [],
        compliance_score: {
          current_score: 85,
          max_score: 100,
          factors: [
            {
              name: 'Déclarations à temps',
              score: 90,
              max_score: 100,
              status: 'good'
            },
            {
              name: 'Paiements fiscaux',
              score: 80,
              max_score: 100,
              status: 'warning'
            }
          ]
        }
      };

      return { data: dashboardData };
    } catch (error) {
      logger.error('Error fetching tax dashboard data:', error);
      return {
        data: {} as TaxDashboardData,
        error: { message: 'Failed to fetch tax dashboard data' }
      };
    }
  },

  /**
   * Get tax declarations
   */
  async getDeclarations(enterpriseId: string): Promise<TaxServiceResponse<TaxDeclaration[]>> {
    try {
      const { data: declarations, error } = await supabase
        .from('tax_declarations')
        .select('*')
        .eq('company_id', enterpriseId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const taxDeclarations: TaxDeclaration[] = declarations?.map(d => ({
        id: d.id,
        type: d.declaration_type as 'TVA' | 'IS' | 'Liasse' | 'IR' | 'CFE' | 'CVAE',
        name: `${d.declaration_type} ${d.year}${d.month ? `-${d.month}` : d.quarter ? `-Q${d.quarter}` : ''}`,
        dueDate: new Date(d.due_date),
        status: d.status === 'accepted' ? 'completed' : d.status === 'submitted' ? 'submitted' : 'pending',
        amount: d.tax_amount,
        companyId: d.company_id,
        countryCode: 'FR',
        period: {
          start: new Date(d.period_start),
          end: new Date(d.period_end)
        }
      })) || [];

      return { data: taxDeclarations };
    } catch (error) {
      logger.error('Error fetching tax declarations:', error);
      return {
        data: [],
        error: { message: 'Failed to fetch declarations' }
      };
    }
  },

  /**
   * Get tax calendar events
   */
  async getCalendarEvents(enterpriseId: string): Promise<TaxServiceResponse<TaxCalendarEvent[]>> {
    try {
      const { data: events, error } = await supabase
        .from('tax_calendar_events')
        .select('*')
        .eq('enterprise_id', enterpriseId)
        .order('start_date', { ascending: true });

      if (error) throw error;

      const calendarEvents: TaxCalendarEvent[] = events?.map(e => ({
        id: e.id,
        title: e.title,
        description: e.description,
        type: e.type as 'declaration_due' | 'payment_due' | 'filing_deadline' | 'audit_date' | 'meeting' | 'reminder',
        tax_type: e.tax_type,
        start_date: e.start_date,
        end_date: e.end_date,
        all_day: e.all_day,
        status: e.status as 'upcoming' | 'in_progress' | 'completed' | 'overdue' | 'cancelled',
        priority: e.priority as 'low' | 'medium' | 'high' | 'critical',
        declaration_id: e.declaration_id,
        amount: e.amount,
        reminders: e.reminders || [],
        enterprise_id: e.enterprise_id,
        created_by: e.created_by,
        created_at: e.created_at,
        updated_at: e.updated_at
      })) || [];

      return { data: calendarEvents };
    } catch (error) {
      logger.error('Error fetching calendar events:', error);
      return {
        data: [],
        error: { message: 'Failed to fetch calendar events' }
      };
    }
  },

  /**
   * Get tax alerts
   */
  async getAlerts(enterpriseId: string): Promise<TaxServiceResponse<TaxAlert[]>> {
    try {
      const { data: alerts, error } = await supabase
        .from('tax_alerts')
        .select('*')
        .eq('enterprise_id', enterpriseId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const taxAlerts: TaxAlert[] = alerts?.map(a => ({
        id: a.id,
        type: a.type as 'deadline_approaching' | 'payment_overdue' | 'declaration_missing' | 'rate_change' | 'new_regulation',
        severity: a.severity as 'info' | 'warning' | 'error' | 'critical',
        title: a.title,
        message: a.message,
        action_required: a.action_required,
        trigger_date: a.trigger_date,
        due_date: a.due_date,
        auto_resolve_date: a.auto_resolve_date,
        status: a.status as 'active' | 'acknowledged' | 'resolved' | 'dismissed',
        acknowledged_by: a.acknowledged_by,
        acknowledged_at: a.acknowledged_at,
        resolved_by: a.resolved_by,
        resolved_at: a.resolved_at,
        declaration_id: a.declaration_id,
        enterprise_id: a.enterprise_id,
        created_at: a.created_at,
        updated_at: a.updated_at
      })) || [];

      return { data: taxAlerts };
    } catch (error) {
      logger.error('Error fetching tax alerts:', error);
      return {
        data: [],
        error: { message: 'Failed to fetch alerts' }
      };
    }
  },

  /**
   * Get tax obligations
   */
  async getObligations(enterpriseId: string): Promise<TaxServiceResponse<TaxObligation[]>> {
    try {
      // Pour l'instant, retourner des obligations fiscales par défaut
      // TODO: Implémenter une vraie table tax_obligations si nécessaire
      const defaultObligations: TaxObligation[] = [
        {
          id: 'tva-monthly',
          tax_type_id: 'tva',
          tax_type_name: 'TVA',
          enterprise_id: enterpriseId,
          frequency: 'monthly',
          due_day: 20,
          advance_notice_days: 10,
          next_due_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 20).toISOString(),
          is_active: true,
          auto_generate: true,
          requires_approval: false,
          email_notifications: true,
          notification_emails: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'is-annual',
          tax_type_id: 'is',
          tax_type_name: 'Impôt sur les Sociétés',
          enterprise_id: enterpriseId,
          frequency: 'annual',
          due_day: 15,
          advance_notice_days: 30,
          next_due_date: new Date(new Date().getFullYear() + 1, 3, 15).toISOString(),
          is_active: true,
          auto_generate: false,
          requires_approval: true,
          email_notifications: true,
          notification_emails: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      return { data: defaultObligations };
    } catch (error) {
      logger.error('Error fetching tax obligations:', error);
      return {
        data: [],
        error: { message: 'Failed to fetch obligations' }
      };
    }
  }
};