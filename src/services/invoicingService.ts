import { supabase } from '@/lib/supabase';
import { journalEntriesService } from './journalEntriesService';
import { EntryTemplatesService } from './entryTemplatesService';
import { logger } from '@/utils/logger';

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
  quotesCount: number;
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
        logger.error('Error fetching invoices:', error);
        throw new Error(`Failed to fetch invoices: ${error.message}`);
      }

      const enrichedInvoices = data.map(invoice => ({
        ...invoice,
        third_party: invoice.third_party,
        invoice_lines: invoice.invoice_lines || []
      })) as InvoiceWithDetails[];

      return enrichedInvoices;
    } catch (error) {
      logger.error('Error in getInvoices:', error);
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
      logger.error('Error in getInvoiceById:', error);
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
      logger.error('Error in createInvoice:', error);
      throw error;
    }
  }

  async updateInvoiceStatus(id: string, status: Invoice['status']): Promise<InvoiceWithDetails> {
    try {
      const companyId = await this.getCurrentCompanyId();

      // Get current invoice before status change
      const currentInvoice = await this.getInvoiceById(id);
      if (!currentInvoice) {
        throw new Error('Invoice not found');
      }

      const { error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', id)
        .eq('company_id', companyId);

      if (error) {
        throw new Error(`Failed to update invoice status: ${error.message}`);
      }

      // Auto-generate journal entry when invoice is sent
      if (status === 'sent' && currentInvoice.status === 'draft') {
        await this.createJournalEntryForInvoice(currentInvoice);
      }

      // Auto-generate payment journal entry when invoice is paid
      if (status === 'paid' && currentInvoice.status !== 'paid') {
        await this.createPaymentJournalEntryForInvoice(currentInvoice);
      }

      const updatedInvoice = await this.getInvoiceById(id);
      if (!updatedInvoice) {
        throw new Error('Failed to retrieve updated invoice');
      }

      return updatedInvoice;
    } catch (error) {
      logger.error('Error in updateInvoiceStatus:', error);
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
      logger.error('Error in deleteInvoice:', error);
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
      logger.error('Error generating invoice number:', error);
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
      logger.error('Error duplicating invoice:', error);
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
      logger.error('Error creating credit note:', error);
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
      if (quotesError) logger.warn('Quotes table might not exist:', quotesError);
      
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
      logger.error('Error getting invoicing stats:', error);
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

  /**
   * Crée automatiquement une écriture comptable lors de l'envoi d'une facture
   */
  private async createJournalEntryForInvoice(invoice: InvoiceWithDetails): Promise<void> {
    try {
      const companyId = await this.getCurrentCompanyId();

      // Déterminer le template selon le type de facture
      const templateId = invoice.type === 'sale' ? 'template_sale_invoice' : 'template_purchase_invoice';

      // Calculer les montants HT et TTC
      const amountHT = invoice.subtotal;
      const amountTTC = invoice.total_amount;

      // Variables pour le template
      const variables = {
        amountHT,
        amountTTC,
        invoiceNumber: invoice.invoice_number,
        thirdPartyName: invoice.third_party?.name || 'Client/Fournisseur'
      };

      // Récupérer le journal approprié (VENTES pour les ventes, ACHATS pour les achats)
      const journalCode = invoice.type === 'sale' ? 'VENTES' : 'ACHATS';
      const journals = await journalEntriesService.getJournalsList(companyId);
      const journal = journals.find(j => j.code === journalCode);

      if (!journal) {
        logger.warn(`Journal ${journalCode} non trouvé, écriture non créée`);
        return;
      }

      // Appliquer le template
      const journalEntry = await EntryTemplatesService.applyTemplate(
        templateId,
        variables,
        companyId,
        journal.id
      );

      // Créer l'écriture comptable
      const payload = {
        companyId,
        entryDate: invoice.issue_date,
        description: `${invoice.type === 'sale' ? 'Facture' : 'Facture fournisseur'} ${invoice.invoice_number} - ${invoice.third_party?.name || ''}`,
        referenceNumber: invoice.invoice_number,
        journalId: journal.id,
        status: 'posted' as const,
        lines: journalEntry.items.map(item => ({
          accountId: item.accountId,
          debitAmount: item.debitAmount,
          creditAmount: item.creditAmount,
          description: item.description || '',
          auxiliaryAccount: item.auxiliaryAccount,
          letterage: item.letterage
        }))
      };

      const result = await journalEntriesService.createJournalEntry(payload);

      if (!result.success && 'error' in result) {
        logger.error('Erreur création écriture comptable:', result.error)
      } else {
        logger.warn(`Écriture comptable créée pour la facture ${invoice.invoice_number}`)
      }
    } catch (error) {
      logger.error('Erreur lors de la création automatique d\'écriture comptable:', error);
      // Ne pas bloquer la mise à jour de la facture si l'écriture échoue
    }
  }

  /**
   * Crée automatiquement une écriture comptable lors du paiement d'une facture
   */
  private async createPaymentJournalEntryForInvoice(invoice: InvoiceWithDetails): Promise<void> {
    try {
      const companyId = await this.getCurrentCompanyId();

      // Utiliser le template de paiement approprié selon le type de facture
      const templateId = invoice.type === 'sale' ? 'template_bank_payment_client' : 'template_bank_payment_supplier';

      // Variables pour le template
      const variables = {
        amount: invoice.total_amount,
        invoiceNumber: invoice.invoice_number,
        thirdPartyName: invoice.third_party?.name || 'Client/Fournisseur'
      };

      // Récupérer le journal de banque
      const journals = await journalEntriesService.getJournalsList(companyId);
      const journal = journals.find(j => j.code === 'BANQUE' || j.type === 'bank');

      if (!journal) {
        logger.warn('Journal de banque non trouvé, écriture de paiement non créée');
        return;
      }

      // Appliquer le template
      const journalEntry = await EntryTemplatesService.applyTemplate(
        templateId,
        variables,
        companyId,
        journal.id
      );

      // Créer l'écriture comptable de paiement
      const payload = {
        companyId,
        entryDate: new Date().toISOString().split('T')[0], // Date du jour
        description: `Paiement ${invoice.type === 'sale' ? 'facture' : 'facture fournisseur'} ${invoice.invoice_number} - ${invoice.third_party?.name || ''}`,
        referenceNumber: `PAY-${invoice.invoice_number}`,
        journalId: journal.id,
        status: 'posted' as const,
        lines: journalEntry.items.map(item => ({
          accountId: item.accountId,
          debitAmount: item.debitAmount,
          creditAmount: item.creditAmount,
          description: item.description || '',
          auxiliaryAccount: item.auxiliaryAccount,
          letterage: item.letterage
        }))
      };

      const result = await journalEntriesService.createJournalEntry(payload);

      if (!result.success && 'error' in result) {
        logger.error('Erreur création écriture de paiement:', result.error)
      } else {
        logger.warn(`Écriture de paiement créée pour la facture ${invoice.invoice_number}`)
      }
    } catch (error) {
      logger.error('Erreur lors de la création automatique d\'écriture de paiement:', error);
      // Ne pas bloquer la mise à jour de la facture si l'écriture échoue
    }
  }
}

export const invoicingService = new InvoicingService();
export default invoicingService;