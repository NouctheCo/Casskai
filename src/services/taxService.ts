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
  TaxObligation,
  TaxObligationFormData
} from '../types/tax.types';
import * as TaxImpl from './taxServiceImplementations';
import { logger } from '@/lib/logger';
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
        type: rate.type as any,
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
      logger.error('Tax', 'Error fetching tax rates:', error);
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
        type: data.type as any,
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
      logger.error('Tax', 'Error creating tax rate:', error);
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
      const updateData: any = {};
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
      logger.error('Tax', 'Error updating tax rate:', error);
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
      logger.error('Tax', 'Error deleting tax rate:', error);
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
        type: decl.type as any,
        name: decl.name,
        dueDate: new Date(decl.due_date),
        status: decl.status as any,
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
      logger.error('Tax', 'Error fetching tax declarations:', error);
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
        type: data.type as any,
        name: data.name,
        dueDate: new Date(data.due_date),
        status: data.status as any,
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
      logger.error('Tax', 'Error creating tax declaration:', error);
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
      const updateData: any = {};
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
      logger.error('Tax', 'Error updating tax declaration:', error);
      const errorInfo = handleSupabaseError(error, 'Updating tax declaration');
      return { 
        success: false, 
        error: new Error(errorInfo.message) 
      };
    }
  },
  /**
   * Delete an existing tax declaration
   */
  async deleteTaxDeclaration(id: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase
        .from('company_tax_declarations')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      logger.error('Tax', 'Error deleting tax declaration:', error);
      const errorInfo = handleSupabaseError(error, 'Deleting tax declaration');
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
      logger.error('Tax', 'Error marking declaration as submitted:', error);
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
        paymentMethod: data.payment_method as any,
        reference: data.reference,
        status: data.status as any,
        receiptUrl: data.receipt_url
      };
      return { data: newPayment, error: null };
    } catch (error) {
      logger.error('Tax', 'Error creating tax payment:', error);
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
  async exportToPDF(_data: any): Promise<{ success: boolean; error: Error | null }> {
    // This would be implemented with a PDF generation library
    // For now, we'll just return success
    return { success: true, error: null };
  },
  // Tax module functions - using real implementations from taxServiceImplementations.ts
  getDashboardData: TaxImpl.getDashboardData,
  getDeclarations: TaxImpl.getDeclarations,
  getCalendarEvents: TaxImpl.getCalendarEvents,
  getAlerts: TaxImpl.getAlerts,
  getObligations: TaxImpl.getObligations,
  /**
   * Create a new tax obligation
   */
  async createObligation(enterpriseId: string, data: TaxObligationFormData): Promise<{ data: TaxObligation | null; error: Error | null }> {
    try {
      // Calculate next due date based on frequency
      const now = new Date();
      let nextDueDate = new Date(now.getFullYear(), now.getMonth(), data.due_day);
      // If the due day has passed this month, move to next period
      if (nextDueDate < now) {
        switch (data.frequency) {
          case 'monthly':
            nextDueDate = new Date(now.getFullYear(), now.getMonth() + 1, data.due_day);
            break;
          case 'quarterly':
            nextDueDate = new Date(now.getFullYear(), now.getMonth() + 3, data.due_day);
            break;
          case 'annual':
            nextDueDate = new Date(now.getFullYear() + 1, now.getMonth(), data.due_day);
            break;
          default:
            // one_time: keep as is
            break;
        }
      }
      const { data: obligation, error } = await supabase
        .from('tax_obligations')
        .insert({
          company_id: enterpriseId,
          tax_type_id: data.tax_type_id,
          tax_type_name: data.tax_type_id.toUpperCase(), // Will be improved with lookup
          frequency: data.frequency,
          due_day: data.due_day,
          advance_notice_days: data.advance_notice_days,
          next_due_date: nextDueDate.toISOString().split('T')[0],
          is_active: true,
          auto_generate: data.auto_generate,
          requires_approval: data.requires_approval,
          email_notifications: data.email_notifications,
          notification_emails: data.notification_emails || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      // Transform to match TypeScript interface
      const result: TaxObligation = {
        id: obligation.id,
        tax_type_id: obligation.tax_type_id,
        tax_type_name: obligation.tax_type_name,
        enterprise_id: obligation.company_id,
        frequency: obligation.frequency,
        due_day: obligation.due_day,
        advance_notice_days: obligation.advance_notice_days,
        next_due_date: obligation.next_due_date,
        next_declaration_id: obligation.next_declaration_id,
        is_active: obligation.is_active,
        auto_generate: obligation.auto_generate,
        requires_approval: obligation.requires_approval,
        email_notifications: obligation.email_notifications,
        notification_emails: obligation.notification_emails || [],
        created_at: obligation.created_at,
        updated_at: obligation.updated_at
      };
      return { data: result, error: null };
    } catch (error) {
      logger.error('Tax', 'Error creating obligation:', error);
      return { data: null, error: error as Error };
    }
  },
  /**
   * Update an existing tax obligation
   */
  async updateObligation(obligationId: string, data: Partial<TaxObligationFormData>): Promise<{ data: TaxObligation | null; error: Error | null }> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      // Only include fields that are provided
      if (data.tax_type_id !== undefined) {
        updateData.tax_type_id = data.tax_type_id;
        updateData.tax_type_name = data.tax_type_id.toUpperCase();
      }
      if (data.frequency !== undefined) updateData.frequency = data.frequency;
      if (data.due_day !== undefined) updateData.due_day = data.due_day;
      if (data.advance_notice_days !== undefined) updateData.advance_notice_days = data.advance_notice_days;
      if (data.auto_generate !== undefined) updateData.auto_generate = data.auto_generate;
      if (data.requires_approval !== undefined) updateData.requires_approval = data.requires_approval;
      if (data.email_notifications !== undefined) updateData.email_notifications = data.email_notifications;
      if (data.notification_emails !== undefined) updateData.notification_emails = data.notification_emails;
      const { data: obligation, error } = await supabase
        .from('tax_obligations')
        .update(updateData)
        .eq('id', obligationId)
        .select()
        .single();
      if (error) throw error;
      // Transform to match TypeScript interface
      const result: TaxObligation = {
        id: obligation.id,
        tax_type_id: obligation.tax_type_id,
        tax_type_name: obligation.tax_type_name,
        enterprise_id: obligation.company_id,
        frequency: obligation.frequency,
        due_day: obligation.due_day,
        advance_notice_days: obligation.advance_notice_days,
        next_due_date: obligation.next_due_date,
        next_declaration_id: obligation.next_declaration_id,
        is_active: obligation.is_active,
        auto_generate: obligation.auto_generate,
        requires_approval: obligation.requires_approval,
        email_notifications: obligation.email_notifications,
        notification_emails: obligation.notification_emails || [],
        created_at: obligation.created_at,
        updated_at: obligation.updated_at
      };
      return { data: result, error: null };
    } catch (error) {
      logger.error('Tax', 'Error updating obligation:', error);
      return { data: null, error: error as Error };
    }
  },
  /**
   * Delete a tax obligation
   */
  async deleteObligation(obligationId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase
        .from('tax_obligations')
        .delete()
        .eq('id', obligationId);
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      logger.error('Tax', 'Error deleting obligation:', error);
      return { success: false, error: error as Error };
    }
  },
  /**
   * Toggle obligation active status
   */
  async toggleObligationStatus(obligationId: string, isActive: boolean): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase
        .from('tax_obligations')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', obligationId);
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      logger.error('Tax', 'Error toggling obligation status:', error);
      return { success: false, error: error as Error };
    }
  },
  /**
   * Export declarations to CSV format
   */
  exportDeclarationsToCSV(declarations: TaxDeclaration[], filename: string = 'declarations_fiscales'): void {
    if (!declarations || declarations.length === 0) {
      logger.warn('Tax', 'No declarations to export');
      return;
    }
    // Define CSV headers
    const headers = [
      'Type',
      'Nom',
      'Période Début',
      'Période Fin',
      'Date Limite',
      'Montant',
      'Statut',
      'Description'
    ];
    // Convert declarations to CSV rows
    const rows = declarations.map(decl => [
      decl.type || '',
      decl.name || '',
      decl.period?.start ? new Date(decl.period.start).toLocaleDateString('fr-FR') : '',
      decl.period?.end ? new Date(decl.period.end).toLocaleDateString('fr-FR') : '',
      decl.dueDate ? new Date(decl.dueDate).toLocaleDateString('fr-FR') : '',
      decl.amount?.toString() || '0',
      decl.status || '',
      decl.description || ''
    ]);
    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');
    // Create and download file
    const blob = new Blob([`\ufeff${  csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};