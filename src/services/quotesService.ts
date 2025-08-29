import { supabase } from '@/lib/supabase';

export interface Quote {
  id: string;
  company_id: string;
  third_party_id: string;
  quote_number: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  issue_date: string;
  valid_until: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface QuoteLine {
  id: string;
  company_id: string;
  quote_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  tax_rate?: number;
  line_total: number;
  line_order: number;
  created_at: string;
}

export interface QuoteWithDetails extends Quote {
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
  quote_lines?: QuoteLine[];
}

export interface CreateQuoteData {
  third_party_id: string;
  quote_number?: string;
  issue_date: string;
  valid_until: string;
  currency?: string;
  notes?: string;
}

export interface CreateQuoteLineData {
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  tax_rate?: number;
  line_order?: number;
}

class QuotesService {
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

  async getQuotes(options?: {
    status?: string;
    thirdPartyId?: string;
    limit?: number;
    offset?: number;
    orderBy?: 'issue_date' | 'valid_until' | 'total_amount';
    orderDirection?: 'asc' | 'desc';
  }): Promise<QuoteWithDetails[]> {
    try {
      const companyId = await this.getCurrentCompanyId();
      
      // For now, we'll use the invoices table with type='quote'
      // In a real implementation, you might have a separate quotes table
      let query = supabase
        .from('invoices')
        .select(`
          *,
          third_party:third_parties(id, name, email, phone, address, city, postal_code, country),
          invoice_lines(id, description, quantity, unit_price, discount_percent, tax_rate, line_total, line_order)
        `)
        .eq('company_id', companyId)
        .eq('type', 'quote');

      // Filters
      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.thirdPartyId) {
        query = query.eq('third_party_id', options.thirdPartyId);
      }

      // Sorting
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
        console.error('Error fetching quotes:', error);
        throw new Error(`Failed to fetch quotes: ${error.message}`);
      }

      // Map to quote format
      const quotes = (data || []).map(invoice => ({
        id: invoice.id,
        company_id: invoice.company_id,
        third_party_id: invoice.third_party_id,
        quote_number: invoice.invoice_number,
        status: invoice.status as Quote['status'],
        issue_date: invoice.issue_date,
        valid_until: invoice.due_date, // Using due_date as valid_until
        subtotal: invoice.subtotal,
        tax_amount: invoice.tax_amount,
        total_amount: invoice.total_amount,
        currency: invoice.currency,
        notes: invoice.notes,
        created_by: invoice.created_by,
        created_at: invoice.created_at,
        updated_at: invoice.updated_at,
        third_party: invoice.third_party,
        quote_lines: invoice.invoice_lines?.map(line => ({
          id: line.id,
          company_id: invoice.company_id,
          quote_id: invoice.id,
          description: line.description,
          quantity: line.quantity,
          unit_price: line.unit_price,
          discount_percent: line.discount_percent,
          tax_rate: line.tax_rate,
          line_total: line.line_total,
          line_order: line.line_order,
          created_at: line.created_at || invoice.created_at
        })) || []
      })) as QuoteWithDetails[];

      return quotes;
    } catch (error) {
      console.error('Error in getQuotes:', error);
      throw error;
    }
  }

  async getQuoteById(id: string): Promise<QuoteWithDetails | null> {
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
        .eq('type', 'quote')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to fetch quote: ${error.message}`);
      }

      return {
        id: data.id,
        company_id: data.company_id,
        third_party_id: data.third_party_id,
        quote_number: data.invoice_number,
        status: data.status as Quote['status'],
        issue_date: data.issue_date,
        valid_until: data.due_date,
        subtotal: data.subtotal,
        tax_amount: data.tax_amount,
        total_amount: data.total_amount,
        currency: data.currency,
        notes: data.notes,
        created_by: data.created_by,
        created_at: data.created_at,
        updated_at: data.updated_at,
        third_party: data.third_party,
        quote_lines: data.invoice_lines?.map(line => ({
          id: line.id,
          company_id: data.company_id,
          quote_id: data.id,
          description: line.description,
          quantity: line.quantity,
          unit_price: line.unit_price,
          discount_percent: line.discount_percent,
          tax_rate: line.tax_rate,
          line_total: line.line_total,
          line_order: line.line_order,
          created_at: line.created_at || data.created_at
        })) || []
      } as QuoteWithDetails;
    } catch (error) {
      console.error('Error in getQuoteById:', error);
      throw error;
    }
  }

  async createQuote(quoteData: CreateQuoteData, items: CreateQuoteLineData[] = []): Promise<QuoteWithDetails> {
    try {
      const companyId = await this.getCurrentCompanyId();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');
      
      // Generate quote number if not provided
      const quote_number = quoteData.quote_number || await this.generateQuoteNumber();
      
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
      
      // Create the quote (using invoices table with type='quote')
      const { data: quote, error: quoteError } = await supabase
        .from('invoices')
        .insert({
          company_id: companyId,
          third_party_id: quoteData.third_party_id,
          invoice_number: quote_number,
          type: 'quote',
          status: 'draft',
          issue_date: quoteData.issue_date,
          due_date: quoteData.valid_until, // Using due_date as valid_until
          subtotal,
          tax_amount,
          total_amount,
          paid_amount: 0,
          currency: quoteData.currency || 'EUR',
          notes: quoteData.notes,
          created_by: user.id
        })
        .select()
        .single();

      if (quoteError) {
        throw new Error(`Failed to create quote: ${quoteError.message}`);
      }

      // Create quote lines
      if (items.length > 0) {
        const quoteLines = items.map((item, index) => {
          const lineTotal = item.quantity * item.unit_price * (1 - (item.discount_percent || 0) / 100);
          return {
            company_id: companyId,
            invoice_id: quote.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percent: item.discount_percent || 0,
            tax_rate: item.tax_rate || 0,
            line_total: lineTotal,
            line_order: item.line_order || index + 1
          };
        });

        const { error: itemsError } = await supabase
          .from('invoice_lines')
          .insert(quoteLines);

        if (itemsError) {
          // Rollback the quote if items fail
          await supabase.from('invoices').delete().eq('id', quote.id);
          throw new Error(`Failed to create quote lines: ${itemsError.message}`);
        }
      }

      // Retrieve the complete quote
      const createdQuote = await this.getQuoteById(quote.id);
      if (!createdQuote) {
        throw new Error('Failed to retrieve created quote');
      }

      return createdQuote;
    } catch (error) {
      console.error('Error in createQuote:', error);
      throw error;
    }
  }

  async updateQuoteStatus(id: string, status: Quote['status']): Promise<QuoteWithDetails> {
    try {
      const companyId = await this.getCurrentCompanyId();

      const { error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', id)
        .eq('company_id', companyId)
        .eq('type', 'quote');

      if (error) {
        throw new Error(`Failed to update quote status: ${error.message}`);
      }

      const updatedQuote = await this.getQuoteById(id);
      if (!updatedQuote) {
        throw new Error('Failed to retrieve updated quote');
      }

      return updatedQuote;
    } catch (error) {
      console.error('Error in updateQuoteStatus:', error);
      throw error;
    }
  }

  async convertToInvoice(quoteId: string): Promise<any> {
    try {
      const quote = await this.getQuoteById(quoteId);
      if (!quote) {
        throw new Error('Quote not found');
      }

      if (quote.status !== 'accepted') {
        throw new Error('Quote must be accepted before converting to invoice');
      }

      const companyId = await this.getCurrentCompanyId();

      // Generate new invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Create invoice from quote
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          company_id: companyId,
          third_party_id: quote.third_party_id,
          invoice_number: invoiceNumber,
          type: 'sale',
          status: 'draft',
          issue_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          subtotal: quote.subtotal,
          tax_amount: quote.tax_amount,
          total_amount: quote.total_amount,
          paid_amount: 0,
          currency: quote.currency,
          notes: `Facture générée à partir du devis ${quote.quote_number}`,
          created_by: quote.created_by
        })
        .select()
        .single();

      if (invoiceError) {
        throw new Error(`Failed to create invoice: ${invoiceError.message}`);
      }

      // Copy quote lines to invoice lines
      if (quote.quote_lines && quote.quote_lines.length > 0) {
        const invoiceLines = quote.quote_lines.map(line => ({
          company_id: companyId,
          invoice_id: invoice.id,
          description: line.description,
          quantity: line.quantity,
          unit_price: line.unit_price,
          discount_percent: line.discount_percent,
          tax_rate: line.tax_rate,
          line_total: line.line_total,
          line_order: line.line_order
        }));

        const { error: linesError } = await supabase
          .from('invoice_lines')
          .insert(invoiceLines);

        if (linesError) {
          // Rollback invoice if lines fail
          await supabase.from('invoices').delete().eq('id', invoice.id);
          throw new Error(`Failed to create invoice lines: ${linesError.message}`);
        }
      }

      return invoice;
    } catch (error) {
      console.error('Error converting quote to invoice:', error);
      throw error;
    }
  }

  async deleteQuote(id: string): Promise<void> {
    try {
      const companyId = await this.getCurrentCompanyId();

      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId)
        .eq('type', 'quote');

      if (error) {
        throw new Error(`Failed to delete quote: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteQuote:', error);
      throw error;
    }
  }

  async generateQuoteNumber(): Promise<string> {
    try {
      const companyId = await this.getCurrentCompanyId();
      
      // Get the latest quote number for this company
      const { data: latestQuote } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('company_id', companyId)
        .eq('type', 'quote')
        .order('created_at', { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (latestQuote && latestQuote.length > 0) {
        const lastNumber = latestQuote[0].invoice_number;
        const match = lastNumber.match(/-([0-9]+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      const year = new Date().getFullYear();
      const paddedNumber = String(nextNumber).padStart(4, '0');
      
      return `DEV-${year}-${paddedNumber}`;
    } catch (error) {
      console.error('Error generating quote number:', error);
      // Fallback
      return `DEV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    }
  }

  private async generateInvoiceNumber(): Promise<string> {
    // This would use the same logic as invoicingService.generateInvoiceNumber()
    // For now, simple implementation
    const year = new Date().getFullYear();
    const timestamp = String(Date.now()).slice(-4);
    return `FAC-${year}-${timestamp}`;
  }
}

export const quotesService = new QuotesService();
export default quotesService;