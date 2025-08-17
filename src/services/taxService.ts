/* eslint-disable max-lines */
// Helper to format Supabase errors
function handleSupabaseError(error: unknown, context: string) {
  if (error instanceof Error) {
    return { message: `[${context}] ${error.message}` };
  }
  return { message: `[${context}] ${JSON.stringify(error)}` };
}
import { supabase } from '../lib/supabase';
import { TaxRate, TaxDeclaration, TaxPayment } from '../types/tax.types';

// DB row shapes used locally in this service
type RateRowDB = {
  id: string;
  name: string;
  rate: number;
  type: string;
  description?: string | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
};

type DeclarationRowDB = {
  id: string;
  type: string;
  name: string;
  due_date: string;
  status: string;
  amount: number | null;
  description?: string | null;
  company_id: string;
  period_start: string;
  period_end: string;
  submitted_date?: string | null;
  submitted_by?: string | null;
};

type PaymentRowDB = {
  id: string;
  declaration_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: string;
  reference?: string | null;
  status: string;
  receipt_url?: string | null;
};

// Update payloads for Supabase
type TaxRateUpdateRow = Partial<{
  name: string;
  rate: number;
  type: TaxRate['type'];
  description: string;
  is_active: boolean;
  is_default: boolean;
}>;

type TaxDeclarationUpdateRow = Partial<{
  name: string;
  type: TaxDeclaration['type'];
  due_date: string;
  status: TaxDeclaration['status'];
  amount: number;
  description: string;
  period_start: string;
  period_end: string;
  submitted_date: string;
  submitted_by: string;
}>;

/**
 * Service for managing tax-related operations
 */
export const taxService = {
  // Local DB row helpers (minimal shape used by this service)
  // These reflect columns selected from Supabase queries.
  
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
      const taxRates = data?.map((rate: RateRowDB) => ({
        id: rate.id,
        name: rate.name,
        rate: rate.rate,
        type: rate.type as TaxRate['type'],
        description: rate.description ?? undefined,
        countryCode: 'FR', // This should come from the company
        isActive: rate.is_active,
        isDefault: rate.is_default,
        createdAt: new Date(rate.created_at),
        updatedAt: new Date(rate.updated_at),
        createdBy: rate.created_by
      })) || null;

      return { data: taxRates, error: null };
    } catch (error) {
      console.error('Error fetching tax rates:', error);
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
        type: data.type as unknown as TaxRate['type'],
        description: data.description ?? undefined,
        countryCode: taxRate.countryCode,
        isActive: data.is_active,
        isDefault: data.is_default,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        createdBy: data.created_by
      };

      return { data: newRate, error: null };
    } catch (error) {
      console.error('Error creating tax rate:', error);
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
      const updateData: TaxRateUpdateRow = {};
      
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
      console.error('Error updating tax rate:', error);
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
      console.error('Error deleting tax rate:', error);
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
      const declarations = data?.map((decl: DeclarationRowDB) => ({
        id: decl.id,
        type: decl.type as TaxDeclaration['type'],
        name: decl.name,
        dueDate: new Date(decl.due_date),
        status: decl.status as TaxDeclaration['status'],
        amount: decl.amount ?? undefined,
        description: decl.description ?? undefined,
        companyId: decl.company_id,
        countryCode: 'FR', // This should come from the company
        period: {
          start: new Date(decl.period_start),
          end: new Date(decl.period_end)
        },
  submittedDate: decl.submitted_date ? new Date(decl.submitted_date) : undefined,
  submittedBy: decl.submitted_by ?? undefined
      })) || null;

      return { data: declarations, error: null };
    } catch (error) {
      console.error('Error fetching tax declarations:', error);
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
        type: data.type as unknown as TaxDeclaration['type'],
        name: data.name,
        dueDate: new Date(data.due_date),
        status: data.status as unknown as TaxDeclaration['status'],
        amount: data.amount ?? undefined,
        description: data.description ?? undefined,
        companyId: data.company_id,
        countryCode: declaration.countryCode,
        period: {
          start: new Date(data.period_start),
          end: new Date(data.period_end)
        }
      };

      return { data: newDeclaration, error: null };
    } catch (error) {
      console.error('Error creating tax declaration:', error);
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
      const updateData: TaxDeclarationUpdateRow = {};
      
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
      console.error('Error updating tax declaration:', error);
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
      console.error('Error marking declaration as submitted:', error);
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
      const row = data as PaymentRowDB;
      const newPayment: TaxPayment = {
        id: row.id,
        declarationId: row.declaration_id,
        amount: row.amount,
        currency: row.currency,
        paymentDate: new Date(row.payment_date),
        paymentMethod: row.payment_method as unknown as TaxPayment['paymentMethod'],
        reference: row.reference ?? '',
        status: row.status as unknown as TaxPayment['status'],
        receiptUrl: row.receipt_url ?? undefined
      };

      return { data: newPayment, error: null };
    } catch (error) {
      console.error('Error creating tax payment:', error);
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
   * Stubbed implementation; replace with real PDF export as needed.
   */
  async exportToPDF(_data: unknown): Promise<{ success: boolean; error: Error | null }> {
    return { success: true, error: null };
  }
};