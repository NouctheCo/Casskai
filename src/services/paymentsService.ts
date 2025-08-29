import { supabase } from '@/lib/supabase';

export interface Payment {
  id: string;
  company_id: string;
  invoice_id?: string;
  third_party_id?: string;
  reference: string;
  amount: number;
  payment_date: string;
  payment_method: 'card' | 'bank_transfer' | 'cash' | 'check' | 'other';
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  type: 'income' | 'expense';
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentWithDetails extends Payment {
  invoice?: {
    id: string;
    invoice_number: string;
    total_amount: number;
  };
  third_party?: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface CreatePaymentData {
  invoice_id?: string;
  third_party_id?: string;
  reference?: string;
  amount: number;
  payment_date: string;
  payment_method: Payment['payment_method'];
  type: Payment['type'];
  description?: string;
}

class PaymentsService {
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

  async getPayments(options?: {
    status?: string;
    type?: 'income' | 'expense';
    invoiceId?: string;
    thirdPartyId?: string;
    limit?: number;
    offset?: number;
    orderBy?: 'payment_date' | 'amount' | 'created_at';
    orderDirection?: 'asc' | 'desc';
  }): Promise<PaymentWithDetails[]> {
    try {
      const companyId = await this.getCurrentCompanyId();
      
      let query = supabase
        .from('payments')
        .select(`
          *,
          invoice:invoices(id, invoice_number, total_amount),
          third_party:third_parties(id, name, email)
        `)
        .eq('company_id', companyId);

      // Filters
      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.type) {
        query = query.eq('type', options.type);
      }
      if (options?.invoiceId) {
        query = query.eq('invoice_id', options.invoiceId);
      }
      if (options?.thirdPartyId) {
        query = query.eq('third_party_id', options.thirdPartyId);
      }

      // Sorting
      const orderBy = options?.orderBy || 'payment_date';
      const orderDirection = options?.orderDirection || 'desc';
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });

      // Pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching payments:', error);
        throw new Error(`Failed to fetch payments: ${error.message}`);
      }

      return (data || []) as PaymentWithDetails[];
    } catch (error) {
      console.error('Error in getPayments:', error);
      throw error;
    }
  }

  async getPaymentById(id: string): Promise<PaymentWithDetails | null> {
    try {
      const companyId = await this.getCurrentCompanyId();
      
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          invoice:invoices(id, invoice_number, total_amount),
          third_party:third_parties(id, name, email)
        `)
        .eq('id', id)
        .eq('company_id', companyId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to fetch payment: ${error.message}`);
      }

      return data as PaymentWithDetails;
    } catch (error) {
      console.error('Error in getPaymentById:', error);
      throw error;
    }
  }

  async createPayment(paymentData: CreatePaymentData): Promise<PaymentWithDetails> {
    try {
      const companyId = await this.getCurrentCompanyId();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');
      
      // Generate reference if not provided
      const reference = paymentData.reference || await this.generatePaymentReference();
      
      // Create the payment
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          company_id: companyId,
          invoice_id: paymentData.invoice_id,
          third_party_id: paymentData.third_party_id,
          reference,
          amount: paymentData.amount,
          payment_date: paymentData.payment_date,
          payment_method: paymentData.payment_method,
          type: paymentData.type,
          status: 'completed', // Default to completed for manual entries
          description: paymentData.description,
          created_by: user.id
        })
        .select()
        .single();

      if (paymentError) {
        throw new Error(`Failed to create payment: ${paymentError.message}`);
      }

      // If payment is for an invoice, update the invoice paid amount
      if (paymentData.invoice_id && paymentData.type === 'income') {
        await this.updateInvoicePaidAmount(paymentData.invoice_id);
      }

      // Retrieve the complete payment
      const createdPayment = await this.getPaymentById(payment.id);
      if (!createdPayment) {
        throw new Error('Failed to retrieve created payment');
      }

      return createdPayment;
    } catch (error) {
      console.error('Error in createPayment:', error);
      throw error;
    }
  }

  async updatePayment(id: string, updates: Partial<CreatePaymentData>): Promise<PaymentWithDetails> {
    try {
      const companyId = await this.getCurrentCompanyId();

      const { error } = await supabase
        .from('payments')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('company_id', companyId);

      if (error) {
        throw new Error(`Failed to update payment: ${error.message}`);
      }

      const updatedPayment = await this.getPaymentById(id);
      if (!updatedPayment) {
        throw new Error('Failed to retrieve updated payment');
      }

      return updatedPayment;
    } catch (error) {
      console.error('Error in updatePayment:', error);
      throw error;
    }
  }

  async deletePayment(id: string): Promise<void> {
    try {
      const companyId = await this.getCurrentCompanyId();

      // Get payment details before deletion
      const payment = await this.getPaymentById(id);
      
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);

      if (error) {
        throw new Error(`Failed to delete payment: ${error.message}`);
      }

      // Update invoice paid amount if payment was linked to an invoice
      if (payment?.invoice_id) {
        await this.updateInvoicePaidAmount(payment.invoice_id);
      }
    } catch (error) {
      console.error('Error in deletePayment:', error);
      throw error;
    }
  }

  async getPaymentStats(options?: {
    periodStart?: string;
    periodEnd?: string;
  }): Promise<{
    totalPayments: number;
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    pendingPayments: number;
    completedPayments: number;
    methodDistribution: Record<string, number>;
  }> {
    try {
      const companyId = await this.getCurrentCompanyId();
      
      let query = supabase
        .from('payments')
        .select('*')
        .eq('company_id', companyId);

      if (options?.periodStart) {
        query = query.gte('payment_date', options.periodStart);
      }
      if (options?.periodEnd) {
        query = query.lte('payment_date', options.periodEnd);
      }

      const { data: payments, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch payment stats: ${error.message}`);
      }

      const completedPayments = payments?.filter(p => p.status === 'completed') || [];
      const totalIncome = completedPayments.filter(p => p.type === 'income').reduce((sum, p) => sum + p.amount, 0);
      const totalExpenses = completedPayments.filter(p => p.type === 'expense').reduce((sum, p) => sum + p.amount, 0);
      
      const methodDistribution = (payments || []).reduce((acc, payment) => {
        acc[payment.payment_method] = (acc[payment.payment_method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalPayments: payments?.length || 0,
        totalIncome,
        totalExpenses,
        netIncome: totalIncome - totalExpenses,
        pendingPayments: payments?.filter(p => p.status === 'pending').length || 0,
        completedPayments: completedPayments.length,
        methodDistribution
      };
    } catch (error) {
      console.error('Error in getPaymentStats:', error);
      throw error;
    }
  }

  private async updateInvoicePaidAmount(invoiceId: string): Promise<void> {
    try {
      // Get all payments for this invoice
      const { data: payments, error } = await supabase
        .from('payments')
        .select('amount')
        .eq('invoice_id', invoiceId)
        .eq('type', 'income')
        .eq('status', 'completed');

      if (error) {
        console.error('Error fetching invoice payments:', error);
        return;
      }

      const totalPaid = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

      // Update invoice paid amount
      await supabase
        .from('invoices')
        .update({ paid_amount: totalPaid })
        .eq('id', invoiceId);

    } catch (error) {
      console.error('Error updating invoice paid amount:', error);
    }
  }

  async generatePaymentReference(): Promise<string> {
    try {
      const companyId = await this.getCurrentCompanyId();
      
      // Get the latest payment number for this company
      const { data: latestPayment } = await supabase
        .from('payments')
        .select('reference')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (latestPayment && latestPayment.length > 0) {
        const lastRef = latestPayment[0].reference;
        const match = lastRef.match(/-([0-9]+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      const year = new Date().getFullYear();
      const paddedNumber = String(nextNumber).padStart(4, '0');
      
      return `PAY-${year}-${paddedNumber}`;
    } catch (error) {
      console.error('Error generating payment reference:', error);
      // Fallback
      return `PAY-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    }
  }
}

export const paymentsService = new PaymentsService();
export default paymentsService;