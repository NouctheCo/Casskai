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
import { logger } from '@/lib/logger';
import { generatePaymentJournalEntry } from './paymentJournalEntryService';
import { offlineDataService } from './offlineDataService';
export interface Payment {
  id: string;
  company_id: string;
  invoice_id?: string;
  third_party_id?: string;
  reference: string;
  amount: number;
  payment_date: string;
  payment_method: 'card' | 'bank_transfer' | 'cash' | 'check' | 'sepa' | 'other';
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
    total_incl_tax: number;
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
      .limit(1);
    if (error || !userCompanies || userCompanies.length === 0) {
      throw new Error('No active company found');
    }
    return userCompanies[0].company_id;
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

      // Note: third_parties is now a VIEW, so we cannot JOIN directly
      // Instead, we fetch payments with invoice details, which includes customer info
      let query = supabase
        .from('payments')
        .select(`
          *,
          invoice:invoices(
            id,
            invoice_number,
            total_incl_tax,
            customer_id,
            customer:third_parties!invoices_customer_id_fkey(id, name, email)
          )
        `)
        .eq('company_id', companyId);
      // Filters
      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.type) {
        query = query.eq('invoice_type', options.type);
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
        logger.error('Payments', 'Error fetching payments:', error);
        throw new Error(`Failed to fetch payments: ${error.message}`);
      }

      // Map the data to maintain compatibility with PaymentWithDetails interface
      // Extract third_party info from invoice.customer
      const mappedData = (data || []).map((payment: any) => ({
        ...payment,
        third_party: payment.invoice?.customer ? {
          id: payment.invoice.customer.id,
          name: payment.invoice.customer.name,
          email: payment.invoice.customer.email
        } : undefined
      }));

      return mappedData as PaymentWithDetails[];
    } catch (error) {
      logger.error('Payments', 'Error in getPayments:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  async getPaymentById(id: string): Promise<PaymentWithDetails | null> {
    try {
      const companyId = await this.getCurrentCompanyId();

      // Note: third_parties is now a VIEW, so we cannot JOIN directly
      // Instead, we fetch payment with invoice details, which includes customer info
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          invoice:invoices(
            id,
            invoice_number,
            total_incl_tax,
            customer_id,
            customer:third_parties!invoices_customer_id_fkey(id, name, email)
          )
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

      // Map the data to maintain compatibility with PaymentWithDetails interface
      // Extract third_party info from invoice.customer
      if (data) {
        const mappedData = {
          ...data,
          third_party: (data as any).invoice?.customer ? {
            id: (data as any).invoice.customer.id,
            name: (data as any).invoice.customer.name,
            email: (data as any).invoice.customer.email
          } : undefined
        };
        return mappedData as PaymentWithDetails;
      }

      return null;
    } catch (error) {
      logger.error('Payments', 'Error in getPaymentById:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  async createPayment(paymentData: CreatePaymentData): Promise<PaymentWithDetails> {
    // Mode offline : stocker en attente locale
    if (!navigator.onLine) {
      return this.createPaymentOffline(paymentData);
    }

    try {
      const companyId = await this.getCurrentCompanyId();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Validate required fields
      if (!paymentData.invoice_id) {
        throw new Error('Invoice ID is required for payment');
      }
      if (!paymentData.third_party_id) {
        throw new Error('Third party (customer) ID is required for payment');
      }

      // Generate reference if not provided
      const reference = paymentData.reference || await this.generatePaymentReference();
      
      // Map payment_method from form values to database format
      const paymentMethodMapping: Record<string, string> = {
        'card': 'card',
        'bank_transfer': 'transfer',
        'cash': 'cash',
        'check': 'check',
        'sepa': 'transfer',
        'other': 'other'
      };
      const dbPaymentMethod = paymentMethodMapping[paymentData.payment_method] || 'other';

      // Map type from form values to database format
      const typeMapping: Record<string, string> = {
        'income': 'incoming',
        'expense': 'outgoing'
      };
      const dbType = typeMapping[paymentData.type] || 'incoming';

      // Create the payment
      // The 'customer_id' column in the database is the same as 'third_party_id'
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          company_id: companyId,
          invoice_id: paymentData.invoice_id,
          customer_id: paymentData.third_party_id, // Map third_party_id to customer_id for database
          third_party_id: paymentData.third_party_id,
          reference,
          amount: paymentData.amount,
          payment_date: paymentData.payment_date,
          payment_method: dbPaymentMethod,
          type: dbType,
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
      if (paymentData.invoice_id && dbType === 'incoming') {
        await this.updateInvoicePaidAmount(paymentData.invoice_id);
      }

      // Retrieve the complete payment
      const createdPayment = await this.getPaymentById(payment.id);
      if (!createdPayment) {
        throw new Error('Failed to retrieve created payment');
      }

      // ✅ Générer automatiquement l'écriture comptable (fire-and-forget)
      // Ne bloque pas la création du paiement si l'écriture échoue
      try {
        await generatePaymentJournalEntry({
          id: payment.id,
          company_id: companyId,
          third_party_id: paymentData.third_party_id || '',
          reference,
          amount: paymentData.amount,
          payment_date: paymentData.payment_date,
          payment_method: paymentData.payment_method,
          type: paymentData.type,
          description: paymentData.description
        });
        logger.info('Payments', `Journal entry created for payment ${reference}`);
      } catch (journalError) {
        // Log l'erreur mais ne bloque pas la création du paiement
        logger.error('Payments', 'Failed to generate journal entry for payment:', journalError);
      }

      return createdPayment;
    } catch (error) {
      logger.error('Payments', 'Error in createPayment:', error instanceof Error ? error.message : String(error));
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
      logger.error('Payments', 'Error in updatePayment:', error instanceof Error ? error.message : String(error));
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
      logger.error('Payments', 'Error in deletePayment:', error instanceof Error ? error.message : String(error));
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
      logger.error('Payments', 'Error in getPaymentStats:', error instanceof Error ? error.message : String(error));
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
        .eq('invoice_type', 'income')
        .eq('status', 'completed');
      if (error) {
        logger.error('Payments', 'Error fetching invoice payments:', error);
        return;
      }
      const totalPaid = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
      // Update invoice paid amount
      await supabase
        .from('invoices')
        .update({ paid_amount: totalPaid })
        .eq('id', invoiceId);
    } catch (error) {
      logger.error('Payments', 'Error updating invoice paid amount:', error instanceof Error ? error.message : String(error));
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
      logger.error('Payments', 'Error generating payment reference:', error instanceof Error ? error.message : String(error));
      // Fallback
      return `PAY-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    }
  }

  /**
   * Creer un paiement en mode offline (en attente locale)
   */
  private async createPaymentOffline(paymentData: CreatePaymentData): Promise<PaymentWithDetails> {
    const localId = crypto.randomUUID();
    const companyId = localStorage.getItem('casskai_current_enterprise') || '';

    const offlinePayment = {
      company_id: companyId,
      invoice_id: paymentData.invoice_id,
      third_party_id: paymentData.third_party_id,
      customer_id: paymentData.third_party_id,
      reference: paymentData.reference || `DRAFT-PAY-${Date.now()}`,
      amount: paymentData.amount,
      payment_date: paymentData.payment_date,
      payment_method: paymentData.payment_method,
      type: paymentData.type === 'income' ? 'incoming' : 'outgoing',
      status: 'pending',
      description: paymentData.description,
    };

    const userId = (await supabase.auth.getUser().catch((): { data: { user: null } } => ({ data: { user: null } }))).data.user?.id || 'offline';
    await offlineDataService.insert('payments', offlinePayment, userId, companyId);

    logger.info('Payments', `Paiement en attente cree offline (local_id: ${localId})`);

    return {
      ...offlinePayment,
      id: localId,
      _offline: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as unknown as PaymentWithDetails;
  }
}
export const paymentsService = new PaymentsService();
export default paymentsService;