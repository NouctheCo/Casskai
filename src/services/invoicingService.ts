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
import { auditService } from './auditService';
import { generateInvoiceJournalEntry } from './invoiceJournalEntryService';
import { logger } from '@/lib/logger';
import { kpiCacheService } from './kpiCacheService';
export interface Invoice {
  id: string;
  company_id: string;
  third_party_id: string;
  journal_entry_id?: string;
  customer_id?: string;
  quote_id?: string;
  invoice_number: string;
  invoice_type: 'sale' | 'purchase' | 'credit_note' | 'debit_note';
  title?: string;
  invoice_date: string;
  due_date: string;
  payment_date?: string;
  subtotal_excl_tax: number;
  total_tax_amount: number;
  total_incl_tax: number;
  paid_amount: number;
  remaining_amount: number;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  currency: string;
  notes?: string;
  internal_notes?: string;
  tax_rate?: number;
  payment_terms?: number;
  discount_amount?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  sent_at?: string;
  paid_at?: string;
}
export interface InvoiceItem {
  id: string;
  invoice_id: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
  item_type?: string;
  line_order: number;
  created_at?: string;
}
export interface InvoiceWithDetails extends Invoice {
  third_party?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address_line1?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
  invoice_items?: InvoiceItem[];
}
export interface CreateInvoiceData {
  customer_id?: string;
  third_party_id?: string;
  invoice_number?: string;
  invoice_type?: 'sale' | 'purchase' | 'credit_note' | 'debit_note';
  invoice_date: string;
  due_date: string;
  service_date?: string;
  delivery_date?: string;
  vat_exemption_reason?: string;
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
    orderBy?: 'invoice_date' | 'due_date' | 'total_incl_tax';
    orderDirection?: 'asc' | 'desc';
  }): Promise<InvoiceWithDetails[]> {
    try {
      const companyId = await this.getCurrentCompanyId();
      let query = supabase
        .from('invoices')
        .select(`
          *,
          client:customers!customer_id(id, name, email, phone, company_name, billing_city, billing_postal_code, billing_country),
          invoice_items(id, name, description, quantity, unit_price, tax_rate, discount_rate, line_order)
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
      const orderBy = options?.orderBy || 'invoice_date';
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
        logger.error('InvoicingService: Error fetching invoices:', error);
        throw new Error(`Failed to fetch invoices: ${error.message}`);
      }
      // Gérer le cas où data est null (base vide)
      if (!data) {
        return [];
      }
      const enrichedInvoices = data.map(invoice => ({
        ...invoice,
        client: invoice.client,
        invoice_items: invoice.invoice_items || []
      })) as InvoiceWithDetails[];
      return enrichedInvoices;
    } catch (error) {
      logger.error('InvoicingService: Error in getInvoices:', error);
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
          client:customers!customer_id(id, name, email, phone, company_name, billing_city, billing_postal_code, billing_country),
          invoice_items(id, name, description, quantity, unit_price, tax_rate, discount_rate, line_order)
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
        client: data.client,
        invoice_items: data.invoice_items || []
      } as InvoiceWithDetails;
    } catch (error) {
      logger.error('InvoicingService: Error in getInvoiceById:', error);
      throw error;
    }
  }
  async createInvoice(invoiceData: CreateInvoiceData, items: CreateInvoiceLineData[] = []): Promise<InvoiceWithDetails> {
    try {
      const companyId = await this.getCurrentCompanyId();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Validate that at least one customer ID is provided
      if (!invoiceData.customer_id && !invoiceData.third_party_id) {
        throw new Error('Either customer_id or third_party_id must be provided');
      }

      // Generate invoice number if not provided
      const invoice_number = invoiceData.invoice_number || await this.generateInvoiceNumber();

      // Validate and normalize dates
      const today = new Date().toISOString().split('T')[0];
      const invoice_date = invoiceData.invoice_date && invoiceData.invoice_date.trim() !== ''
        ? invoiceData.invoice_date
        : today;

      // Calculate due date: if not provided, use invoice_date + 30 days
      let due_date: string;
      if (invoiceData.due_date && invoiceData.due_date.trim() !== '') {
        due_date = invoiceData.due_date;
      } else {
        const dueDateTime = new Date(invoice_date);
        dueDateTime.setDate(dueDateTime.getDate() + 30);
        due_date = dueDateTime.toISOString().split('T')[0];
      }

      // Optional dates: convert empty strings to null
      const service_date = invoiceData.service_date && invoiceData.service_date.trim() !== ''
        ? invoiceData.service_date
        : null;
      const delivery_date = invoiceData.delivery_date && invoiceData.delivery_date.trim() !== ''
        ? invoiceData.delivery_date
        : null;

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
      // For compatibility: use customer_id if provided, otherwise fall back to third_party_id
      const insertData: any = {
        company_id: companyId,
        invoice_number,
        invoice_type: invoiceData.invoice_type || 'sale',
        status: 'draft',
        invoice_date,
        due_date,
        service_date,
        delivery_date,
        vat_exemption_reason: invoiceData.vat_exemption_reason,
        subtotal_excl_tax: subtotal,
        total_tax_amount: tax_amount,
        total_incl_tax: total_amount,
        paid_amount: 0,
        remaining_amount: total_amount,
        currency: invoiceData.currency || 'EUR',
        notes: invoiceData.notes,
        created_by: user.id
      };

      // Add customer_id if provided (new structure)
      if (invoiceData.customer_id) {
        insertData.customer_id = invoiceData.customer_id;
      }

      // Add third_party_id for compatibility (legacy or as fallback)
      // Note: third_party_id is NOT NULL in database, so we need to handle this
      if (invoiceData.third_party_id) {
        insertData.third_party_id = invoiceData.third_party_id;
      } else if (invoiceData.customer_id) {
        // If only customer_id is provided, use it for third_party_id as well (temporary compatibility)
        insertData.third_party_id = invoiceData.customer_id;
      }

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert(insertData)
        .select()
        .single();
      if (invoiceError) {
        throw new Error(`Failed to create invoice: ${invoiceError.message}`);
      }
      // 2. Create invoice items
      if (items.length > 0) {
        const invoiceItems = items.map((item, index) => ({
          invoice_id: invoice.id,
          name: item.description || 'Article',
          description: item.description || null,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          tax_rate: item.tax_rate || 20,
          discount_rate: item.discount_percent || 0,
          line_order: item.line_order || index + 1
        }));
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(invoiceItems);
        if (itemsError) {
          // Rollback the invoice if items fail
          await supabase.from('invoices').delete().eq('id', invoice.id);
          throw new Error(`Failed to create invoice items: ${itemsError.message}`);
        }
      }
      // 3. Retrieve the complete invoice
      const createdInvoice = await this.getInvoiceById(invoice.id);
      if (!createdInvoice) {
        throw new Error('Failed to retrieve created invoice');
      }
      // 4. Audit trail (fire-and-forget, never blocks)
      auditService.logAsync({
        event_type: 'CREATE',
        table_name: 'invoices',
        record_id: invoice.id,
        company_id: companyId,
        new_values: {
          invoice_number,
          invoice_type: invoiceData.invoice_type || 'sale',
          total_amount,
          third_party_id: invoiceData.third_party_id,
          items_count: items.length
        },
        security_level: 'standard',
        compliance_tags: ['SOC2', 'ISO27001']
      });
      // 5. Générer automatiquement l'écriture comptable (fire-and-forget)
      // Ne bloque pas la création de la facture si l'écriture échoue
      try {
        await generateInvoiceJournalEntry(createdInvoice as any, createdInvoice.invoice_items || []);
        logger.info(`InvoicingService: Journal entry created for invoice ${invoice_number}`);
      } catch (journalError) {
        // Log l'erreur mais ne bloque pas la création
        logger.error('InvoicingService: Failed to generate journal entry for invoice:', journalError);
        // L'utilisateur peut régénérer l'écriture manuellement depuis la compta
      }
      // 6. Invalider le cache KPI pour forcer le recalcul
      kpiCacheService.invalidateCache(companyId);
      return createdInvoice;
    } catch (error) {
      logger.error('InvoicingService: Error in createInvoice:', error);
      throw error;
    }
  }
  async updateInvoiceStatus(id: string, status: Invoice['status']): Promise<InvoiceWithDetails> {
    try {
      const companyId = await this.getCurrentCompanyId();

      // Récupérer la facture avant mise à jour pour voir si on doit générer une écriture
      const invoiceBeforeUpdate = await this.getInvoiceById(id);
      if (!invoiceBeforeUpdate) {
        throw new Error('Invoice not found');
      }

      logger.info('InvoicingService', '=== UPDATE INVOICE STATUS DEBUG ===', {
        invoiceId: id,
        invoiceNumber: invoiceBeforeUpdate.invoice_number,
        currentStatus: invoiceBeforeUpdate.status,
        newStatus: status,
        hasJournalEntry: !!invoiceBeforeUpdate.journal_entry_id,
        journalEntryId: invoiceBeforeUpdate.journal_entry_id,
        hasInvoiceItems: invoiceBeforeUpdate.invoice_items?.length || 0
      });

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

      // ✅ Si la facture passe de "draft" à un statut validé (sent, paid, etc.)
      // ET qu'elle n'a pas encore d'écriture comptable, la générer automatiquement
      const shouldGenerateEntry = invoiceBeforeUpdate.status === 'draft' &&
                                   status !== 'draft' &&
                                   !invoiceBeforeUpdate.journal_entry_id;

      logger.info('InvoicingService', 'Should generate journal entry?', {
        shouldGenerateEntry,
        condition1_wasDraft: invoiceBeforeUpdate.status === 'draft',
        condition2_isNotDraft: status !== 'draft',
        condition3_noExistingEntry: !invoiceBeforeUpdate.journal_entry_id
      });

      if (shouldGenerateEntry) {
        logger.info('InvoicingService', '>>> ATTEMPTING TO CREATE JOURNAL ENTRY NOW <<<');
        try {
          await generateInvoiceJournalEntry(updatedInvoice as any, updatedInvoice.invoice_items || []);
          logger.info('InvoicingService', `✅ Journal entry created successfully for invoice ${updatedInvoice.invoice_number}`);
        } catch (journalError) {
          logger.error('InvoicingService', '❌ FAILED to generate journal entry on status update', journalError);
          logger.error('InvoicingService', 'Error details:', {
            errorMessage: journalError instanceof Error ? journalError.message : String(journalError),
            errorStack: journalError instanceof Error ? journalError.stack : undefined,
            invoice: {
              id: updatedInvoice.id,
              invoice_number: updatedInvoice.invoice_number,
              invoice_type: (updatedInvoice as any).type || (updatedInvoice as any).invoice_type,
              third_party_id: updatedInvoice.third_party_id,
              company_id: updatedInvoice.company_id,
              total_incl_tax: updatedInvoice.total_incl_tax,
              total_tax_amount: updatedInvoice.total_tax_amount
            }
          });
          // Ne bloque pas la mise à jour du statut mais affiche l'erreur clairement
        }
      } else {
        logger.info('InvoicingService', '>>> SKIPPING JOURNAL ENTRY CREATION (conditions not met) <<<');
      }

      // Audit trail (fire-and-forget, never blocks)
      auditService.logAsync({
        event_type: 'UPDATE',
        table_name: 'invoices',
        record_id: id,
        company_id: companyId,
        new_values: { status },
        changed_fields: ['status'],
        security_level: 'standard',
        compliance_tags: ['SOC2', 'ISO27001']
      });
      // Invalider le cache KPI pour forcer le recalcul
      kpiCacheService.invalidateCache(companyId);
      return updatedInvoice;
    } catch (error) {
      logger.error('InvoicingService: Error in updateInvoiceStatus:', error);
      throw error;
    }
  }
  async deleteInvoice(id: string): Promise<void> {
    try {
      const companyId = await this.getCurrentCompanyId();
      // Get invoice details before deletion for audit trail
      const invoiceToDelete = await this.getInvoiceById(id);
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);
      if (error) {
        throw new Error(`Failed to delete invoice: ${error.message}`);
      }
      // Audit trail (fire-and-forget, never blocks)
      // Deletion is HIGH security level as it's irreversible
      if (invoiceToDelete) {
        auditService.logAsync({
          event_type: 'DELETE',
          table_name: 'invoices',
          record_id: id,
          company_id: companyId,
          old_values: {
            invoice_number: invoiceToDelete.invoice_number,
            type: invoiceToDelete.invoice_type,
            status: invoiceToDelete.status,
            total_amount: invoiceToDelete.total_incl_tax,
            third_party_id: invoiceToDelete.third_party_id
          },
          security_level: 'high',
          compliance_tags: ['SOC2', 'ISO27001']
        });
      }
    } catch (error) {
      logger.error('InvoicingService: Error in deleteInvoice:', error);
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
      logger.error('Invoicing', 'Error generating invoice number:', error);
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
        invoice_type: originalInvoice.invoice_type,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currency: originalInvoice.currency,
        notes: originalInvoice.notes
      };
      const newLines: CreateInvoiceLineData[] = (originalInvoice.invoice_items || []).map(item => ({
        description: item.name || item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_rate,
        tax_rate: item.tax_rate,
        line_order: item.line_order
      }));
      return await this.createInvoice(newInvoiceData, newLines);
    } catch (error) {
      logger.error('Invoicing', 'Error duplicating invoice:', error);
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
        invoice_type: 'credit_note',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        currency: originalInvoice.currency,
        notes: `Avoir pour facture ${originalInvoice.invoice_number}`
      };
      // Create credit note items with negative quantities
      const creditLines: CreateInvoiceLineData[] = (originalInvoice.invoice_items || []).map(item => ({
        description: `Avoir: ${item.name || item.description}`,
        quantity: -item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_rate,
        tax_rate: item.tax_rate,
        line_order: item.line_order
      }));
      return await this.createInvoice(creditNoteData, creditLines);
    } catch (error) {
      logger.error('Invoicing', 'Error creating credit note:', error);
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
        invoicesQuery = invoicesQuery.gte('invoice_date', params.periodStart);
      }
      if (params?.periodEnd) {
        invoicesQuery = invoicesQuery.lte('invoice_date', params.periodEnd);
      }
      const { data: invoices, error: invoicesError } = await invoicesQuery;
      if (invoicesError) throw invoicesError;
      // Get clients count
      const { data: clients, error: clientsError } = await supabase
        .from('customers')
        .select('id')
        .eq('company_id', companyId);
      if (clientsError) throw clientsError;
      // Get quotes count from the quotes table
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select('id')
        .eq('company_id', companyId);
      if (quotesError) logger.warn('InvoicingService: Error fetching quotes', { error: quotesError });
      const invoicesList = invoices || [];
      const clientsList = clients || [];
      const quotesList = quotes || [];
      // Calculate statistics
      // ✅ Seulement les factures de vente (pas les avoirs), avec montant TTC

      // CA total = Factures émises (sent, paid, partially_paid)
      // En comptabilité française, le CA est reconnu dès l'émission, pas seulement au paiement
      const totalRevenue = invoicesList
        .filter(inv => ['sent', 'paid', 'partially_paid'].includes(inv.status) && inv.invoice_type === 'sale')
        .reduce((sum, inv) => sum + (inv.total_incl_tax || inv.total_amount || 0), 0);

      // Montant des factures payées (en €)
      const paidInvoices = invoicesList
        .filter(inv => inv.status === 'paid' && inv.invoice_type === 'sale')
        .reduce((sum, inv) => sum + (inv.total_incl_tax || inv.total_amount || 0), 0);

      // Montant des factures en attente (sent + partially_paid)
      const pendingInvoices = invoicesList
        .filter(inv => ['sent', 'partially_paid'].includes(inv.status) && inv.invoice_type === 'sale' && inv.status !== 'cancelled')
        .reduce((sum, inv) => sum + (inv.total_incl_tax || inv.total_amount || 0), 0);

      // Montant des factures en retard
      const overdueInvoices = invoicesList.filter(inv => {
        const today = new Date();
        const dueDate = new Date(inv.due_date);
        return inv.status === 'sent' && dueDate < today && inv.invoice_type === 'sale';
      }).reduce((sum, inv) => sum + (inv.total_incl_tax || inv.total_amount || 0), 0);

      // Nombre de factures
      const invoicesCount = invoicesList.filter(inv => inv.invoice_type === 'sale').length;
      const clientsCount = clientsList.length;
      const quotesCount = quotesList.length;

      // Valeur moyenne par facture
      const averageInvoiceValue = invoicesCount > 0 ? totalRevenue / invoicesCount : 0;
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
      logger.error('Invoicing', 'Error getting invoicing stats:', error);
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
   * Calculate trend percentage between two periods
   */
  private calculateTrend(current: number, previous: number): number | undefined {
    if (previous === 0) {
      // Si la période précédente était à 0 et maintenant on a des données, c'est +100%
      return current > 0 ? 100 : undefined;
    }
    return ((current - previous) / previous) * 100;
  }
  /**
   * Get invoicing stats with trends compared to previous period
   */
  async getInvoicingStatsWithTrends(params?: {
    periodStart?: string;
    periodEnd?: string;
    companyId?: string;
  }) {
    try {
      const companyId = params?.companyId || await this.getCurrentCompanyId();
      // Get current period stats
      const currentStats = await this.getInvoicingStats({
        periodStart: params?.periodStart,
        periodEnd: params?.periodEnd,
        companyId
      });
      // Calculate previous period dates
      let previousStart: string | undefined;
      let previousEnd: string | undefined;
      if (params?.periodStart && params?.periodEnd) {
        const start = new Date(params.periodStart);
        const end = new Date(params.periodEnd);
        const periodDuration = end.getTime() - start.getTime();
        previousEnd = new Date(start.getTime() - 1).toISOString().split('T')[0];
        previousStart = new Date(start.getTime() - periodDuration).toISOString().split('T')[0];
      }
      // Get previous period stats
      const previousStats = previousStart && previousEnd
        ? await this.getInvoicingStats({
            periodStart: previousStart,
            periodEnd: previousEnd,
            companyId
          })
        : null;
      // Calculate trends
      const trends = previousStats ? {
        totalRevenueTrend: this.calculateTrend(currentStats.totalRevenue, previousStats.totalRevenue),
        paidInvoicesTrend: this.calculateTrend(currentStats.paidInvoices, previousStats.paidInvoices),
        pendingInvoicesTrend: this.calculateTrend(currentStats.pendingInvoices, previousStats.pendingInvoices),
        overdueInvoicesTrend: this.calculateTrend(currentStats.overdueInvoices, previousStats.overdueInvoices)
      } : {
        totalRevenueTrend: undefined,
        paidInvoicesTrend: undefined,
        pendingInvoicesTrend: undefined,
        overdueInvoicesTrend: undefined
      };
      return {
        ...currentStats,
        ...trends
      };
    } catch (error) {
      logger.error('Invoicing', 'Error getting invoicing stats with trends:', error);
      return {
        totalRevenue: 0,
        paidInvoices: 0,
        pendingInvoices: 0,
        overdueInvoices: 0,
        invoicesCount: 0,
        clientsCount: 0,
        quotesCount: 0,
        averageInvoiceValue: 0,
        totalRevenueTrend: undefined,
        paidInvoicesTrend: undefined,
        pendingInvoicesTrend: undefined,
        overdueInvoicesTrend: undefined
      };
    }
  }

  /**
   * Crée un avoir (credit note) pour annuler une facture
   */
  async createCreditNote(originalInvoiceId: string): Promise<Invoice> {
    try {
      // 1. Récupérer la facture originale avec ses items
      const { data: original, error: fetchError } = await supabase
        .from('invoices')
        .select(`
          *,
          items:invoice_items(*)
        `)
        .eq('id', originalInvoiceId)
        .single();

      if (fetchError || !original) {
        throw new Error('Facture non trouvée');
      }

      // Vérifier que ce n'est pas déjà un avoir
      if (original.invoice_type === 'credit_note') {
        throw new Error('Impossible de créer un avoir pour un avoir');
      }

      // Vérifier que la facture n'est pas déjà annulée
      if (original.status === 'cancelled') {
        throw new Error('Cette facture est déjà annulée');
      }

      // 2. Générer le numéro d'avoir
      const year = new Date().getFullYear();
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', original.company_id)
        .eq('invoice_type', 'credit_note')
        .gte('invoice_date', `${year}-01-01`);

      const num = (count || 0) + 1;
      const creditNoteNumber = `AV-${year}-${num.toString().padStart(4, '0')}`;

      // 3. Créer l'avoir
      const { data: creditNote, error: insertError } = await supabase
        .from('invoices')
        .insert({
          company_id: original.company_id,
          customer_id: original.customer_id,
          invoice_number: creditNoteNumber,
          invoice_type: 'credit_note',
          related_invoice_id: originalInvoiceId,
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: new Date().toISOString().split('T')[0],
          status: 'paid', // Un avoir est considéré comme "réglé"
          subtotal_amount: -Math.abs(original.subtotal_amount || 0),
          tax_amount: -Math.abs(original.tax_amount || 0),
          total_amount: -Math.abs(original.total_amount || 0),
          subtotal_excl_tax: -Math.abs(original.subtotal_excl_tax || 0),
          total_tax_amount: -Math.abs(original.total_tax_amount || 0),
          total_incl_tax: -Math.abs(original.total_incl_tax || 0),
          tax_rate: original.tax_rate,
          currency: original.currency,
          notes: `Avoir pour annulation de la facture ${original.invoice_number}`,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (insertError) {
        logger.error('InvoicingService', 'Error creating credit note:', insertError);
        throw insertError;
      }

      // 4. Créer les lignes de l'avoir (quantités négatives)
      if (original.items && original.items.length > 0) {
        const creditItems = original.items.map((item: any) => ({
          invoice_id: creditNote.id,
          name: item.name,
          description: `Annulation: ${item.description || item.name}`,
          quantity: -Math.abs(item.quantity),
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          discount_rate: item.discount_rate || 0,
          item_type: item.item_type || 'service'
        }));

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(creditItems);

        if (itemsError) {
          logger.error('InvoicingService', 'Error creating credit note items:', itemsError);
          throw itemsError;
        }
      }

      // 5. Mettre à jour le statut de la facture originale
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', originalInvoiceId);

      if (updateError) {
        logger.error('InvoicingService', 'Error updating original invoice:', updateError);
        throw updateError;
      }

      logger.info('InvoicingService', `Credit note ${creditNoteNumber} created for invoice ${original.invoice_number}`);

      return creditNote as Invoice;
    } catch (error) {
      logger.error('InvoicingService', 'Error in createCreditNote:', error);
      throw error;
    }
  }
}
export const invoicingService = new InvoicingService();
export default invoicingService;