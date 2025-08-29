import { supabase } from '@/lib/supabase';

export interface Invoice {
  id: string;
  company_id: string;
  third_party_id: string;
  invoice_number: string;
  type: 'sale' | 'purchase' | 'credit_note' | 'debit_note';
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  currency: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLine {
  id: string;
  company_id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  tax_rate?: number;
  line_total: number;
  account_id?: string;
  line_order: number;
  created_at: string;
}

export interface InvoiceWithDetails extends Invoice {
  third_party?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
  invoice_lines?: InvoiceLine[];
}

export interface CreateInvoiceData {
  third_party_id: string;
  invoice_number?: string;
  type?: 'sale' | 'purchase' | 'credit_note' | 'debit_note';
  issue_date: string;
  due_date: string;
  currency?: string;
  notes?: string;
}

export interface CreateInvoiceLineData {
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  tax_rate?: number;
  account_id?: string;
  line_order?: number;
}

export interface InvoicingStats {
  totalRevenue: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  invoicesCount: number;
  averageInvoiceValue: number;
}

// ============================================================================
// INVOICES SERVICE
// ============================================================================

class InvoicingService {
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
  async getInvoices(options?: {
    status?: string;
    thirdPartyId?: string;
    limit?: number;
    offset?: number;
    orderBy?: 'issue_date' | 'due_date' | 'total_amount';
    orderDirection?: 'asc' | 'desc';
  }): Promise<InvoiceWithDetails[]> {
    try {
      const companyId = await this.getCurrentCompanyId();
      
      let query = supabase
        .from('invoices')
        .select(`
          *,
          third_party:third_parties(id, name, email, phone, address, city, postal_code, country),
          invoice_lines(id, description, quantity, unit_price, discount_percent, tax_rate, line_total, line_order)
        `)
        .eq('company_id', companyId);

      // Filtres
      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.thirdPartyId) {
        query = query.eq('third_party_id', options.thirdPartyId);
      }

      // Tri
      const orderBy = options?.orderBy || 'issue_date';
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
        console.error('Error fetching invoices:', error);
        throw new Error(`Failed to fetch invoices: ${error.message}`);
      }

      const enrichedInvoices = data.map(invoice => ({
        ...invoice,
        third_party: invoice.third_party,
        invoice_lines: invoice.invoice_lines || []
      })) as InvoiceWithDetails[];

      return enrichedInvoices;
    } catch (error) {
      console.error('Error in getInvoices:', error);
      throw error;
    }
  }

  async getInvoiceById(id: string): Promise<InvoiceWithDetails | null> {
    try {
      const companyId = await this.getCurrentCompanyId();
      
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          third_party:third_parties(id, name, email, phone, address, city, postal_code, country),
          invoice_lines(id, description, quantity, unit_price, discount_percent, tax_rate, line_total, line_order)
        `)
        .eq('id', id)
        .eq('company_id', companyId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to fetch invoice: ${error.message}`);
      }

      return {
        ...data,
        third_party: data.third_party,
        invoice_lines: data.invoice_lines || []
      } as InvoiceWithDetails;
    } catch (error) {
      console.error('Error in getInvoiceById:', error);
      throw error;
    }
  }

  async createInvoice(invoiceData: CreateInvoiceData, items: CreateInvoiceLineData[] = []): Promise<InvoiceWithDetails> {
    try {
      const companyId = await this.getCurrentCompanyId();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');
      
      // Generate invoice number if not provided
      const invoice_number = invoiceData.invoice_number || await this.generateInvoiceNumber();
      
      // Calculate totals from items
      const subtotal = items.reduce((sum, item) => {
        const lineTotal = item.quantity * item.unit_price * (1 - (item.discount_percent || 0) / 100);
        return sum + lineTotal;
      }, 0);
      
      const tax_amount = items.reduce((sum, item) => {
        const lineTotal = item.quantity * item.unit_price * (1 - (item.discount_percent || 0) / 100);
        return sum + (lineTotal * (item.tax_rate || 0) / 100);
      }, 0);
      
      const total_amount = subtotal + tax_amount;
      
      // 1. Create the main invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          company_id: companyId,
          third_party_id: invoiceData.third_party_id,
          invoice_number,
          type: invoiceData.type || 'sale',
          status: 'draft',
          issue_date: invoiceData.issue_date,
          due_date: invoiceData.due_date,
          subtotal,
          tax_amount,
          total_amount,
          paid_amount: 0,
          currency: invoiceData.currency || 'EUR',
          notes: invoiceData.notes,
          created_by: user.id
        })
        .select()
        .single();

      if (invoiceError) {
        throw new Error(`Failed to create invoice: ${invoiceError.message}`);
      }

      // 2. Create invoice lines
      if (items.length > 0) {
        const invoiceLines = items.map((item, index) => {
          const lineTotal = item.quantity * item.unit_price * (1 - (item.discount_percent || 0) / 100);
          return {
            company_id: companyId,
            invoice_id: invoice.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percent: item.discount_percent || 0,
            tax_rate: item.tax_rate || 0,
            line_total: lineTotal,
            account_id: item.account_id,
            line_order: item.line_order || index + 1
          };
        });

        const { error: itemsError } = await supabase
          .from('invoice_lines')
          .insert(invoiceLines);

        if (itemsError) {
          // Rollback the invoice if items fail
          await supabase.from('invoices').delete().eq('id', invoice.id);
          throw new Error(`Failed to create invoice lines: ${itemsError.message}`);
        }
      }

      // 3. Retrieve the complete invoice
      const createdInvoice = await this.getInvoiceById(invoice.id);
      if (!createdInvoice) {
        throw new Error('Failed to retrieve created invoice');
      }

      return createdInvoice;
    } catch (error) {
      console.error('Error in createInvoice:', error);
      throw error;
    }
  }

  async updateInvoiceStatus(id: string, status: Invoice['status']): Promise<InvoiceWithDetails> {
    try {
      const companyId = await this.getCurrentCompanyId();

      const { error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', id)
        .eq('company_id', companyId);

      if (error) {
        throw new Error(`Failed to update invoice status: ${error.message}`);
      }

      const updatedInvoice = await this.getInvoiceById(id);
      if (!updatedInvoice) {
        throw new Error('Failed to retrieve updated invoice');
      }

      return updatedInvoice;
    } catch (error) {
      console.error('Error in updateInvoiceStatus:', error);
      throw error;
    }
  }

  async deleteInvoice(id: string): Promise<void> {
    try {
      const companyId = await this.getCurrentCompanyId();

      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);

      if (error) {
        throw new Error(`Failed to delete invoice: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteInvoice:', error);
      throw error;
    }
  }

  async getInvoicingStats(options?: {
    periodStart?: string;
    periodEnd?: string;
  }): Promise<InvoicingStats> {
    try {
      const companyId = await this.getCurrentCompanyId();
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const periodStart = options?.periodStart || firstDayOfMonth;
      const periodEnd = options?.periodEnd || lastDayOfMonth;

      const { data: invoicesData, error } = await supabase
        .from('invoices')
        .select('id, status, total_amount, paid_amount, issue_date, due_date')
        .eq('company_id', companyId)
        .gte('issue_date', periodStart)
        .lte('issue_date', periodEnd);

      if (error) {
        throw new Error(`Failed to fetch invoicing stats: ${error.message}`);
      }

      const invoices = invoicesData || [];
      const now_date = new Date();
      
      const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0);
      const paidInvoices = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0);
      const pendingInvoices = invoices.filter(inv => ['draft', 'sent'].includes(inv.status)).reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0);
      const overdueInvoices = invoices.filter(inv => {
        const dueDate = new Date(inv.due_date);
        return inv.status !== 'paid' && dueDate < now_date;
      }).reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0);
      
      const invoicesCount = invoices.length;
      const averageInvoiceValue = invoicesCount > 0 ? totalRevenue / invoicesCount : 0;

      return {
        totalRevenue,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        invoicesCount,
        averageInvoiceValue
      };
    } catch (error) {
      console.error('Error in getInvoicingStats:', error);
      throw error;
    }
  }

  async generateInvoiceNumber(): Promise<string> {
    try {
      const companyId = await this.getCurrentCompanyId();
      
      // Get the latest invoice number for this company
      const { data: latestInvoice } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (latestInvoice && latestInvoice.length > 0) {
        const lastNumber = latestInvoice[0].invoice_number;
        const match = lastNumber.match(/-([0-9]+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      const year = new Date().getFullYear();
      const paddedNumber = String(nextNumber).padStart(4, '0');
      
      return `FAC-${year}-${paddedNumber}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      // Fallback
      return `FAC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    }
  }

  async duplicateInvoice(id: string): Promise<InvoiceWithDetails> {
    try {
      const originalInvoice = await this.getInvoiceById(id);
      if (!originalInvoice) {
        throw new Error('Invoice not found');
      }

      const newInvoiceData: CreateInvoiceData = {
        third_party_id: originalInvoice.third_party_id,
        type: originalInvoice.type,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currency: originalInvoice.currency,
        notes: originalInvoice.notes
      };

      const newLines: CreateInvoiceLineData[] = (originalInvoice.invoice_lines || []).map(line => ({
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unit_price,
        discount_percent: line.discount_percent,
        tax_rate: line.tax_rate,
        line_order: line.line_order
      }));

      return await this.createInvoice(newInvoiceData, newLines);
    } catch (error) {
      console.error('Error duplicating invoice:', error);
      throw error;
    }
  }

  async createCreditNote(originalInvoiceId: string): Promise<InvoiceWithDetails> {
    try {
      const originalInvoice = await this.getInvoiceById(originalInvoiceId);
      if (!originalInvoice) {
        throw new Error('Original invoice not found');
      }

      const creditNoteData: CreateInvoiceData = {
        third_party_id: originalInvoice.third_party_id,
        type: 'credit_note',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        currency: originalInvoice.currency,
        notes: `Avoir pour facture ${originalInvoice.invoice_number}`
      };

      // Create credit note lines with negative quantities
      const creditLines: CreateInvoiceLineData[] = (originalInvoice.invoice_lines || []).map(line => ({
        description: `Avoir: ${line.description}`,
        quantity: -line.quantity,
        unit_price: line.unit_price,
        discount_percent: line.discount_percent,
        tax_rate: line.tax_rate,
        line_order: line.line_order
      }));

      return await this.createInvoice(creditNoteData, creditLines);
    } catch (error) {
      console.error('Error creating credit note:', error);
      throw error;
    }
  }

  async getInvoicingStats(params?: {
    periodStart?: string;
    periodEnd?: string;
    companyId?: string;
  }) {
    try {
      const companyId = params?.companyId || await this.getCurrentCompanyId();
      
      // Build query with optional date filtering
      let invoicesQuery = supabase
        .from('invoices')
        .select('*')
        .eq('company_id', companyId);
      
      if (params?.periodStart) {
        invoicesQuery = invoicesQuery.gte('issue_date', params.periodStart);
      }
      if (params?.periodEnd) {
        invoicesQuery = invoicesQuery.lte('issue_date', params.periodEnd);
      }
      
      const { data: invoices, error: invoicesError } = await invoicesQuery;
      if (invoicesError) throw invoicesError;
      
      // Get clients count
      const { data: clients, error: clientsError } = await supabase
        .from('third_parties')
        .select('id')
        .eq('company_id', companyId)
        .eq('client_type', 'customer');
      if (clientsError) throw clientsError;
      
      // Get quotes count (assuming quotes are stored in a quotes table or as draft invoices)
      const { data: quotes, error: quotesError } = await supabase
        .from('invoices')
        .select('id')
        .eq('company_id', companyId)
        .eq('type', 'quote');
      if (quotesError) console.warn('Quotes table might not exist:', quotesError);
      
      const invoicesList = invoices || [];
      const clientsList = clients || [];
      const quotesList = quotes || [];
      
      // Calculate statistics
      const totalRevenue = invoicesList
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      
      const paidInvoices = invoicesList.filter(inv => inv.status === 'paid').length;
      const pendingInvoices = invoicesList.filter(inv => inv.status === 'sent').length;
      const overdueInvoices = invoicesList.filter(inv => {
        const today = new Date();
        const dueDate = new Date(inv.due_date);
        return inv.status === 'sent' && dueDate < today;
      }).length;
      
      const invoicesCount = invoicesList.length;
      const clientsCount = clientsList.length;
      const quotesCount = quotesList.length;
      const averageInvoiceValue = invoicesCount > 0 ? totalRevenue / paidInvoices : 0;
      
      return {
        totalRevenue,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        invoicesCount,
        clientsCount,
        quotesCount,
        averageInvoiceValue
      };
    } catch (error) {
      console.error('Error getting invoicing stats:', error);
      // Return default stats on error
      return {
        totalRevenue: 0,
        paidInvoices: 0,
        pendingInvoices: 0,
        overdueInvoices: 0,
        invoicesCount: 0,
        clientsCount: 0,
        quotesCount: 0,
        averageInvoiceValue: 0
      };
    }
  }
}

export const invoicingService = new InvoicingService();
export default invoicingService;