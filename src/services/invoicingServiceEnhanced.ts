import { supabase } from '@/lib/supabase';
import { errorHandler, type ErrorContext, withErrorHandling } from './errorHandlingService';
import { toast } from 'sonner';

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

export interface CreateInvoiceRequest {
  company_id: string;
  third_party_id: string;
  invoice_number: string;
  type: Invoice['type'];
  issue_date: string;
  due_date: string;
  currency: string;
  notes?: string;
  lines: Omit<InvoiceLine, 'id' | 'invoice_id' | 'company_id' | 'created_at'>[];
}

export interface UpdateInvoiceRequest extends Partial<CreateInvoiceRequest> {
  id: string;
}

export class InvoicingService {
  private static instance: InvoicingService;
  
  private constructor() {}
  
  static getInstance(): InvoicingService {
    if (!InvoicingService.instance) {
      InvoicingService.instance = new InvoicingService();
    }
    return InvoicingService.instance;
  }

  private getContext(method: string, additionalData?: Record<string, any>): ErrorContext {
    return {
      service: 'invoicingService',
      method,
      userId: this.getCurrentUserId() as any,
      companyId: this.getCurrentCompanyId(),
      additional: additionalData,
    };
  }

  private async getCurrentUserId(): Promise<string | undefined> {
    try {
      const { data } = await supabase.auth.getUser();
      return data.user?.id;
    } catch {
      return undefined;
    }
  }

  private getCurrentCompanyId(): string | undefined {
    try {
      // Récupérer depuis le contexte local storage ou autre
      return localStorage.getItem('currentCompanyId') || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Récupérer toutes les factures d'une entreprise
   */
  async getInvoices(companyId: string, filters?: {
    status?: Invoice['status'];
    type?: Invoice['type'];
    startDate?: string;
    endDate?: string;
    thirdPartyId?: string;
  }): Promise<InvoiceWithDetails[]> {
    const context = this.getContext('getInvoices', { companyId, filters });
    
    return errorHandler.supabaseCall(async () => {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          third_party:third_parties(*),
          invoice_lines(*)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      
      if (filters?.startDate) {
        query = query.gte('issue_date', filters.startDate);
      }
      
      if (filters?.endDate) {
        query = query.lte('issue_date', filters.endDate);
      }
      
      if (filters?.thirdPartyId) {
        query = query.eq('third_party_id', filters.thirdPartyId);
      }

      return await query;
    }, context);
  }

  /**
   * Récupérer une facture par son ID
   */
  async getInvoice(invoiceId: string): Promise<InvoiceWithDetails> {
    const context = this.getContext('getInvoice', { invoiceId });
    
    return errorHandler.supabaseCall(async () => {
      return await supabase
        .from('invoices')
        .select(`
          *,
          third_party:third_parties(*),
          invoice_lines(*)
        `)
        .eq('id', invoiceId)
        .single();
    }, context);
  }

  /**
   * Créer une nouvelle facture
   */
  async createInvoice(request: CreateInvoiceRequest): Promise<InvoiceWithDetails> {
    const context = this.getContext('createInvoice', { 
      invoiceNumber: request.invoice_number,
      thirdPartyId: request.third_party_id,
    });

    return errorHandler.executeWithRetry(async () => {
      // Validation des données
      this.validateInvoiceRequest(request);

      // Calculer les totaux
      const { subtotal, taxAmount, totalAmount } = this.calculateInvoiceTotals(request.lines);

      // Commencer une transaction
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          company_id: request.company_id,
          third_party_id: request.third_party_id,
          invoice_number: request.invoice_number,
          type: request.type,
          status: 'draft',
          issue_date: request.issue_date,
          due_date: request.due_date,
          subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          paid_amount: 0,
          currency: request.currency,
          notes: request.notes,
          created_by: this.getCurrentUserId(),
        })
        .select()
        .single();

      if (invoiceError) {
        throw invoiceError;
      }

      // Créer les lignes de facture
      const invoiceLinesData = request.lines.map((line, index) => ({
        company_id: request.company_id,
        invoice_id: invoice.id,
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unit_price,
        discount_percent: line.discount_percent || 0,
        tax_rate: line.tax_rate || 0,
        line_total: this.calculateLineTotal(line),
        account_id: line.account_id,
        line_order: index,
      }));

      const { error: linesError } = await supabase
        .from('invoice_lines')
        .insert(invoiceLinesData);

      if (linesError) {
        // Rollback - supprimer la facture créée
        await supabase.from('invoices').delete().eq('id', invoice.id);
        throw linesError;
      }

      // Récupérer la facture complète
      const fullInvoice = await this.getInvoice(invoice.id);
      
      // Success notification
      toast.success(`Facture ${request.invoice_number} créée avec succès`);
      
      return fullInvoice;
    }, context);
  }

  /**
   * Mettre à jour une facture
   */
  async updateInvoice(request: UpdateInvoiceRequest): Promise<InvoiceWithDetails> {
    const context = this.getContext('updateInvoice', { 
      invoiceId: request.id,
      invoiceNumber: request.invoice_number,
    });

    return errorHandler.executeWithRetry(async () => {
      // Validation des données
      if (request.lines) {
        this.validateInvoiceLines(request.lines);
      }

      const updates: Partial<Invoice> = { ...request };
      delete (updates as any).id;
      delete (updates as any).lines;

      // Calculer les nouveaux totaux si les lignes sont mises à jour
      if (request.lines) {
        const { subtotal, taxAmount, totalAmount } = this.calculateInvoiceTotals(request.lines);
        updates.subtotal = subtotal;
        updates.tax_amount = taxAmount;
        updates.total_amount = totalAmount;
      }

      // Mettre à jour la facture
      const { error: updateError } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', request.id);

      if (updateError) {
        throw updateError;
      }

      // Mettre à jour les lignes si nécessaire
      if (request.lines) {
        // Supprimer les anciennes lignes
        const { error: deleteError } = await supabase
          .from('invoice_lines')
          .delete()
          .eq('invoice_id', request.id);

        if (deleteError) {
          throw deleteError;
        }

        // Créer les nouvelles lignes
        const invoiceLinesData = request.lines.map((line, index) => ({
          company_id: request.company_id!,
          invoice_id: request.id,
          description: line.description,
          quantity: line.quantity,
          unit_price: line.unit_price,
          discount_percent: line.discount_percent || 0,
          tax_rate: line.tax_rate || 0,
          line_total: this.calculateLineTotal(line),
          account_id: line.account_id,
          line_order: index,
        }));

        const { error: linesError } = await supabase
          .from('invoice_lines')
          .insert(invoiceLinesData);

        if (linesError) {
          throw linesError;
        }
      }

      const updatedInvoice = await this.getInvoice(request.id);
      
      toast.success(`Facture ${updatedInvoice.invoice_number} mise à jour`);
      
      return updatedInvoice;
    }, context);
  }

  /**
   * Changer le statut d'une facture
   */
  async updateInvoiceStatus(invoiceId: string, status: Invoice['status']): Promise<InvoiceWithDetails> {
    const context = this.getContext('updateInvoiceStatus', { invoiceId, status });

    const result = await errorHandler.supabaseCall(async () => {
      const updates: Partial<Invoice> = { status };
      
      // Ajouter des champs spécifiques selon le statut
      if (status === 'sent') {
        updates.updated_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', invoiceId);

      if (error) {
        throw error;
      }

      const invoice = await this.getInvoice(invoiceId);
      
      const statusLabels = {
        draft: 'brouillon',
        sent: 'envoyée',
        paid: 'payée',
        overdue: 'en retard',
        cancelled: 'annulée',
      };
      
      toast.success(`Facture ${(invoice as any).invoice_number} marquée comme ${statusLabels[status]}`);

      return { data: invoice, error: null };
    }, context);

    return (result as any).data;
  }

  /**
   * Supprimer une facture
   */
  async deleteInvoice(invoiceId: string): Promise<void> {
    const context = this.getContext('deleteInvoice', { invoiceId });

    return errorHandler.executeWithRetry(async () => {
      // Récupérer la facture pour obtenir son numéro
      const invoice = await this.getInvoice(invoiceId);
      
      // Vérifier si la facture peut être supprimée
      if (invoice.status === 'paid') {
        throw new Error('Impossible de supprimer une facture payée');
      }

      // Supprimer les lignes de facture
      const { error: linesError } = await supabase
        .from('invoice_lines')
        .delete()
        .eq('invoice_id', invoiceId);

      if (linesError) {
        throw linesError;
      }

      // Supprimer la facture
      const { error: invoiceError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (invoiceError) {
        throw invoiceError;
      }

      toast.success(`Facture ${invoice.invoice_number} supprimée`);
    }, context);
  }

  /**
   * Générer le prochain numéro de facture
   */
  async generateInvoiceNumber(companyId: string, type: Invoice['type'] = 'sale'): Promise<string> {
    const context = this.getContext('generateInvoiceNumber', { companyId, type });

    const result = await errorHandler.supabaseCall(async (): Promise<{ data: string; error: any }> => {
      const { data: lastInvoice } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('company_id', companyId)
        .eq('type', type)
        .order('created_at', { ascending: false })
        .limit(1);

      const prefix = type === 'sale' ? 'FAC' : 'ACH';
      const currentYear = new Date().getFullYear();

      if (!lastInvoice || lastInvoice.length === 0) {
        return { data: `${prefix}-${currentYear}-001`, error: null };
      }

      const lastNumber = lastInvoice[0].invoice_number;
      const numberMatch = lastNumber.match(/(\d+)$/);

      if (!numberMatch) {
        return { data: `${prefix}-${currentYear}-001`, error: null };
      }

      const nextNumber = parseInt(numberMatch[1], 10) + 1;
      const invoiceNumber = `${prefix}-${currentYear}-${nextNumber.toString().padStart(3, '0')}`;
      return { data: invoiceNumber, error: null };
    }, context);

    return (result as any).data;
  }

  /**
   * Validation des données de facture
   */
  private validateInvoiceRequest(request: CreateInvoiceRequest): void {
    const errors: string[] = [];

    if (!request.company_id) errors.push('ID entreprise requis');
    if (!request.third_party_id) errors.push('Client requis');
    if (!request.invoice_number) errors.push('Numéro de facture requis');
    if (!request.issue_date) errors.push('Date d\'émission requise');
    if (!request.due_date) errors.push('Date d\'échéance requise');
    if (!request.currency) errors.push('Devise requise');
    
    if (new Date(request.issue_date) > new Date(request.due_date)) {
      errors.push('La date d\'échéance doit être postérieure à la date d\'émission');
    }

    if (!request.lines || request.lines.length === 0) {
      errors.push('Au moins une ligne de facture est requise');
    } else {
      this.validateInvoiceLines(request.lines);
    }

    if (errors.length > 0) {
      throw new Error(`Données invalides: ${errors.join(', ')}`);
    }
  }

  /**
   * Validation des lignes de facture
   */
  private validateInvoiceLines(lines: Omit<InvoiceLine, 'id' | 'invoice_id' | 'company_id' | 'created_at'>[]): void {
    lines.forEach((line, index) => {
      if (!line.description) {
        throw new Error(`Description requise pour la ligne ${index + 1}`);
      }
      if (line.quantity <= 0) {
        throw new Error(`Quantité invalide pour la ligne ${index + 1}`);
      }
      if (line.unit_price < 0) {
        throw new Error(`Prix unitaire invalide pour la ligne ${index + 1}`);
      }
      if (line.discount_percent && (line.discount_percent < 0 || line.discount_percent > 100)) {
        throw new Error(`Remise invalide pour la ligne ${index + 1}`);
      }
      if (line.tax_rate && line.tax_rate < 0) {
        throw new Error(`Taux de taxe invalide pour la ligne ${index + 1}`);
      }
    });
  }

  /**
   * Calculer le total d'une ligne
   */
  private calculateLineTotal(line: { quantity: number; unit_price: number; discount_percent?: number; tax_rate?: number }): number {
    const subtotal = line.quantity * line.unit_price;
    const discountAmount = subtotal * ((line.discount_percent || 0) / 100);
    const discountedSubtotal = subtotal - discountAmount;
    const taxAmount = discountedSubtotal * ((line.tax_rate || 0) / 100);
    
    return Math.round((discountedSubtotal + taxAmount) * 100) / 100;
  }

  /**
   * Calculer les totaux de la facture
   */
  private calculateInvoiceTotals(lines: { quantity: number; unit_price: number; discount_percent?: number; tax_rate?: number }[]): {
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
  } {
    let subtotal = 0;
    let taxAmount = 0;

    lines.forEach(line => {
      const lineSubtotal = line.quantity * line.unit_price;
      const discountAmount = lineSubtotal * ((line.discount_percent || 0) / 100);
      const discountedSubtotal = lineSubtotal - discountAmount;
      const lineTaxAmount = discountedSubtotal * ((line.tax_rate || 0) / 100);

      subtotal += discountedSubtotal;
      taxAmount += lineTaxAmount;
    });

    // Arrondir à 2 décimales
    subtotal = Math.round(subtotal * 100) / 100;
    taxAmount = Math.round(taxAmount * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    return { subtotal, taxAmount, totalAmount };
  }
}

// Export de l'instance singleton
export const invoicingService = InvoicingService.getInstance();
