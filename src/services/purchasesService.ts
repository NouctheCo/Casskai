import { supabase } from '../lib/supabase';
import { Purchase, PurchaseFormData, PurchaseFilters, PurchaseStats, Supplier } from '../types/purchase.types';
import { journalEntriesService } from './journalEntriesService';
import { EntryTemplatesService } from './entryTemplatesService';
import { logger } from '@/utils/logger';

export const purchasesService = {
  // Get all purchases with filters
  async getPurchases(companyId: string, filters: PurchaseFilters = {}): Promise<{ data: Purchase[]; error?: any }> {
    try {
      let query = supabase
        .from('purchases')
        .select(`
          *,
          suppliers (
            id,
            name,
            email,
            phone,
            address
          )
        `)
        .eq('company_id', companyId)
        .order('purchase_date', { ascending: false });

      // Apply filters
      if (filters.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id);
      }

      if (filters.payment_status && filters.payment_status !== 'all') {
        query = query.eq('payment_status', filters.payment_status);
      }

      if (filters.date_from) {
        query = query.gte('purchase_date', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('purchase_date', filters.date_to);
      }

      if (filters.search) {
        query = query.or(`invoice_number.ilike.%${filters.search}%,suppliers.name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to match expected format
      const purchases: Purchase[] = data?.map(purchase => ({
        id: purchase.id,
        invoice_number: purchase.invoice_number,
        purchase_date: purchase.purchase_date,
        supplier_id: purchase.supplier_id,
        supplier_name: purchase.suppliers?.name || 'Fournisseur inconnu',
        description: purchase.description,
        amount_ht: purchase.amount_ht,
        tva_amount: purchase.tva_amount,
        amount_ttc: purchase.amount_ttc,
        tva_rate: purchase.tva_rate,
        payment_status: purchase.payment_status,
        payment_date: purchase.payment_date,
        due_date: purchase.due_date,
        created_at: purchase.created_at,
        updated_at: purchase.updated_at,
        company_id: purchase.company_id
      })) || [];

      return { data: purchases };
    } catch (error) {
      logger.error('Error fetching purchases:', error);
      return {
        data: [],
        error: { message: 'Erreur lors de la récupération des achats' }
      };
    }
  },

  // Get purchase by ID
  async getPurchaseById(id: string): Promise<{ data: Purchase | null; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          suppliers (
            id,
            name,
            email,
            phone,
            address
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) return { data: null };

      const purchase: Purchase = {
        id: data.id,
        invoice_number: data.invoice_number,
        purchase_date: data.purchase_date,
        supplier_id: data.supplier_id,
        supplier_name: data.suppliers?.name || 'Fournisseur inconnu',
        description: data.description,
        amount_ht: data.amount_ht,
        tva_amount: data.tva_amount,
        amount_ttc: data.amount_ttc,
        tva_rate: data.tva_rate,
        payment_status: data.payment_status,
        payment_date: data.payment_date,
        due_date: data.due_date,
        created_at: data.created_at,
        updated_at: data.updated_at,
        company_id: data.company_id
      };

      return { data: purchase };
    } catch (error) {
      logger.error('Error fetching purchase by ID:', error);
      return {
        data: null,
        error: { message: 'Erreur lors de la récupération de l\'achat' }
      };
    }
  },

  // Create new purchase
  async createPurchase(companyId: string, purchaseData: PurchaseFormData): Promise<{ data: Purchase | null; error?: string }> {
    try {
      // Check for duplicate invoice number
      const { data: existingPurchase } = await supabase
        .from('purchases')
        .select('id')
        .eq('company_id', companyId)
        .eq('invoice_number', purchaseData.invoice_number)
        .single();

      if (existingPurchase) {
        return {
          data: null,
          error: 'Une facture avec ce numéro existe déjà'
        };
      }

      // Calculate totals
      const amount_ht = purchaseData.amount_ht;
      const tva_amount = amount_ht * (purchaseData.tva_rate / 100);
      const amount_ttc = amount_ht + tva_amount;

      // Create purchase
      const purchasePayload = {
        company_id: companyId,
        supplier_id: purchaseData.supplier_id,
        invoice_number: purchaseData.invoice_number,
        purchase_date: purchaseData.purchase_date,
        due_date: purchaseData.due_date,
        description: purchaseData.description,
        amount_ht,
        tva_amount,
        amount_ttc,
        tva_rate: purchaseData.tva_rate,
        payment_status: 'pending'
      };

      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert([purchasePayload])
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Fetch the complete purchase with supplier info
      const { data: completePurchase, error: fetchError } = await supabase
        .from('purchases')
        .select(`
          *,
          suppliers (
            id,
            name,
            email,
            phone,
            address
          )
        `)
        .eq('id', purchase.id)
        .single();

      if (fetchError) throw fetchError;

      const result: Purchase = {
        id: completePurchase.id,
        invoice_number: completePurchase.invoice_number,
        purchase_date: completePurchase.purchase_date,
        supplier_id: completePurchase.supplier_id,
        supplier_name: completePurchase.suppliers?.name || 'Fournisseur inconnu',
        description: completePurchase.description,
        amount_ht: completePurchase.amount_ht,
        tva_amount: completePurchase.tva_amount,
        amount_ttc: completePurchase.amount_ttc,
        tva_rate: completePurchase.tva_rate,
        payment_status: completePurchase.payment_status,
        payment_date: completePurchase.payment_date,
        due_date: completePurchase.due_date,
        created_at: completePurchase.created_at,
        updated_at: completePurchase.updated_at,
        company_id: completePurchase.company_id
      };

      // Auto-generate journal entry for the purchase
      await this.createPurchaseJournalEntry(result);

      return { data: result };
    } catch (error) {
      logger.error('Error creating purchase:', error);
      return {
        data: null,
        error: 'Erreur lors de la création de l\'achat'
      };
    }
  },

  // Update purchase
  async updatePurchase(id: string, purchaseData: Partial<PurchaseFormData>): Promise<{ data: Purchase | null; error?: string }> {
    try {
      const updatePayload: Record<string, number | string> = {};

      if (purchaseData.supplier_id) updatePayload.supplier_id = purchaseData.supplier_id;
      if (purchaseData.invoice_number) updatePayload.invoice_number = purchaseData.invoice_number;
      if (purchaseData.purchase_date) updatePayload.purchase_date = purchaseData.purchase_date;
      if (purchaseData.due_date) updatePayload.due_date = purchaseData.due_date;
      if (purchaseData.description !== undefined) updatePayload.description = purchaseData.description;
      if (purchaseData.amount_ht !== undefined) {
        updatePayload.amount_ht = purchaseData.amount_ht;
        updatePayload.tva_amount = purchaseData.amount_ht * ((purchaseData.tva_rate || 20) / 100);
        updatePayload.amount_ttc = purchaseData.amount_ht + updatePayload.tva_amount;
      }
      if (purchaseData.tva_rate !== undefined) {
        updatePayload.tva_rate = purchaseData.tva_rate;
        // Recalculate amounts if tva_rate changed
        const { data: currentPurchase } = await supabase
          .from('purchases')
          .select('amount_ht')
          .eq('id', id)
          .single();

        if (currentPurchase) {
          updatePayload.tva_amount = currentPurchase.amount_ht * (purchaseData.tva_rate / 100);
          updatePayload.amount_ttc = currentPurchase.amount_ht + updatePayload.tva_amount;
        }
      }

      const { data: updatedPurchase, error } = await supabase
        .from('purchases')
        .update(updatePayload)
        .eq('id', id)
        .select(`
          *,
          suppliers (
            id,
            name,
            email,
            phone,
            address
          )
        `)
        .single();

      if (error) throw error;

      const result: Purchase = {
        id: updatedPurchase.id,
        invoice_number: updatedPurchase.invoice_number,
        purchase_date: updatedPurchase.purchase_date,
        supplier_id: updatedPurchase.supplier_id,
        supplier_name: updatedPurchase.suppliers?.name || 'Fournisseur inconnu',
        description: updatedPurchase.description,
        amount_ht: updatedPurchase.amount_ht,
        tva_amount: updatedPurchase.tva_amount,
        amount_ttc: updatedPurchase.amount_ttc,
        tva_rate: updatedPurchase.tva_rate,
        payment_status: updatedPurchase.payment_status,
        payment_date: updatedPurchase.payment_date,
        due_date: updatedPurchase.due_date,
        created_at: updatedPurchase.created_at,
        updated_at: updatedPurchase.updated_at,
        company_id: updatedPurchase.company_id
      };

      return { data: result };
    } catch (error) {
      logger.error('Error updating purchase:', error);
      return {
        data: null,
        error: 'Erreur lors de la mise à jour de l\'achat'
      };
    }
  },

  // Delete purchase
  async deletePurchase(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      logger.error('Error deleting purchase:', error);
      return {
        success: false,
        error: 'Erreur lors de la suppression de l\'achat'
      };
    }
  },

  // Mark purchase as paid
  async markAsPaid(id: string): Promise<{ data: Purchase | null; error?: string }> {
    try {
      // Get current purchase before marking as paid
      const { data: currentPurchase } = await supabase
        .from('purchases')
        .select(`
          *,
          suppliers (
            id,
            name,
            email,
            phone,
            address
          )
        `)
        .eq('id', id)
        .single();

      if (!currentPurchase) {
        return {
          data: null,
          error: 'Achat non trouvé'
        };
      }

      const { data: updatedPurchase, error } = await supabase
        .from('purchases')
        .update({
          payment_status: 'paid',
          payment_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', id)
        .select(`
          *,
          suppliers (
            id,
            name,
            email,
            phone,
            address
          )
        `)
        .single();

      if (error) throw error;

      // Create payment journal entry if status was not already paid
      if (currentPurchase.payment_status !== 'paid') {
        await this.createPaymentJournalEntry(currentPurchase);
      }

      const result: Purchase = {
        id: updatedPurchase.id,
        invoice_number: updatedPurchase.invoice_number,
        purchase_date: updatedPurchase.purchase_date,
        supplier_id: updatedPurchase.supplier_id,
        supplier_name: updatedPurchase.suppliers?.name || 'Fournisseur inconnu',
        description: updatedPurchase.description,
        amount_ht: updatedPurchase.amount_ht,
        tva_amount: updatedPurchase.tva_amount,
        amount_ttc: updatedPurchase.amount_ttc,
        tva_rate: updatedPurchase.tva_rate,
        payment_status: updatedPurchase.payment_status,
        payment_date: updatedPurchase.payment_date,
        due_date: updatedPurchase.due_date,
        created_at: updatedPurchase.created_at,
        updated_at: updatedPurchase.updated_at,
        company_id: updatedPurchase.company_id
      };

      return { data: result };
    } catch (error) {
      logger.error('Error marking purchase as paid:', error);
      return {
        data: null,
        error: 'Erreur lors du marquage comme payé'
      };
    }
  },

  // Get purchase statistics
  async getPurchaseStats(companyId: string): Promise<{ data: PurchaseStats; error?: string }> {
    try {
      const { data: purchases, error } = await supabase
        .from('purchases')
        .select('payment_status, amount_ttc')
        .eq('company_id', companyId);

      if (error) throw error;

      const stats: PurchaseStats = {
        total_purchases: purchases?.length || 0,
        total_amount: purchases?.reduce((sum, p) => sum + (p.amount_ttc || 0), 0) || 0,
        pending_payments: purchases?.filter(p => p.payment_status === 'pending').length || 0,
        overdue_payments: purchases?.filter(p => p.payment_status === 'overdue').length || 0
      };

      return { data: stats };
    } catch (error) {
      logger.error('Error fetching purchase stats:', error);
      return {
        data: {
          total_purchases: 0,
          total_amount: 0,
          pending_payments: 0,
          overdue_payments: 0
        },
        error: 'Erreur lors de la récupération des statistiques'
      };
    }
  },

  // Get suppliers
  async getSuppliers(companyId: string): Promise<{ data: Supplier[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      const suppliers: Supplier[] = data?.map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        company_id: supplier.company_id
      })) || [];

      return { data: suppliers };
    } catch (error) {
      logger.error('Error fetching suppliers:', error);
      return {
        data: [],
        error: 'Erreur lors de la récupération des fournisseurs'
      };
    }
  },

  // Export purchases to CSV
  async exportToCsv(companyId: string, filters: PurchaseFilters = {}): Promise<{ data: string; error?: string }> {
    try {
      const { data: purchases, error } = await this.getPurchases(companyId, filters);

      if (error) return { data: '', error };

      const headers = [
        'Numéro facture',
        'Date d\'achat',
        'Fournisseur',
        'Description',
        'Montant HT',
        'TVA',
        'Montant TTC',
        'Statut paiement',
        'Date d\'échéance'
      ];

      const csvData = [
        headers.join(','),
        ...(purchases || []).map(p => [
          p.invoice_number,
          p.purchase_date,
          `"${p.supplier_name}"`,
          `"${p.description}"`,
          p.amount_ht.toFixed(2),
          p.tva_amount.toFixed(2),
          p.amount_ttc.toFixed(2),
          p.payment_status,
          p.due_date
        ].join(','))
      ].join('\n');

      return { data: csvData };
    } catch (error) {
      logger.error('Error exporting purchases to CSV:', error);
      return {
        data: '',
        error: 'Erreur lors de l\'export CSV'
      };
    }
  },

  // Helper function to create journal entry for purchase
  async createPurchaseJournalEntry(purchase: Purchase): Promise<void> {
    try {
      const companyId = purchase.company_id;

      // Use purchase invoice template
      const templateId = 'template_purchase_invoice';

      // Variables for template
      const variables = {
        amountHT: purchase.amount_ht,
        amountTTC: purchase.amount_ttc,
        invoiceNumber: purchase.invoice_number,
        thirdPartyName: purchase.supplier_name || 'Fournisseur'
      };

      // Get ACHATS journal
      const journals = await journalEntriesService.getJournalsList(companyId);
      const journal = journals.find(j => j.code === 'ACHATS');

      if (!journal) {
        logger.warn('Journal ACHATS non trouvé, écriture non créée');
        return;
      }

      // Apply template
      const journalEntry = await EntryTemplatesService.applyTemplate(
        templateId,
        variables,
        companyId,
        journal.id
      );

      // Map template items to JournalEntryLineForm
      const mappedItems = journalEntry.items.map(item => ({
        accountId: item.accountId || '',
        debitAmount: item.debitAmount || 0,
        creditAmount: item.creditAmount || 0,
        description: item.description || '',
        currency: 'EUR'
      }));

      // Create journal entry
      const payload = {
        companyId,
        entryDate: purchase.purchase_date,
        description: `Facture fournisseur ${purchase.invoice_number} - ${purchase.supplier_name || ''}`,
        referenceNumber: purchase.invoice_number,
        journalId: journal.id,
        status: 'posted' as const,
        lines: mappedItems
      };

      const result = await journalEntriesService.createJournalEntry(payload);

      if (!result.success) {
        logger.error('Erreur création écriture comptable achat:', (result as { success: false; error: string }).error);
      } else {
        logger.warn(`Écriture comptable créée pour l'achat ${purchase.invoice_number}`)
      }
    } catch (error) {
      logger.error('Erreur lors de la création automatique d\'écriture d\'achat:', error);
      // Don't block purchase creation if journal entry fails
    }
  },

  // Helper function to create payment journal entry for purchase
  async createPaymentJournalEntry(purchase: Purchase): Promise<void> {
    try {
      const companyId = purchase.company_id;

      // Use bank payment template for supplier
      const templateId = 'template_bank_payment_supplier';

      // Variables for template
      const variables = {
        amount: purchase.amount_ttc,
        invoiceNumber: purchase.invoice_number,
        thirdPartyName: purchase.supplier_name || 'Fournisseur'
      };

      // Get BANQUE journal
      const journals = await journalEntriesService.getJournalsList(companyId);
      const journal = journals.find(j => j.code === 'BANQUE' || j.type === 'bank');

      if (!journal) {
        logger.warn('Journal de banque non trouvé, écriture de paiement non créée');
        return;
      }

      // Apply template
      const journalEntry = await EntryTemplatesService.applyTemplate(
        templateId,
        variables,
        companyId,
        journal.id
      );

      // Map template items to JournalEntryLineForm
      const mappedItems = journalEntry.items.map(item => ({
        accountId: item.accountId || '',
        debitAmount: item.debitAmount || 0,
        creditAmount: item.creditAmount || 0,
        description: item.description || '',
        currency: 'EUR'
      }));

      // Create payment journal entry
      const payload = {
        companyId,
        entryDate: new Date().toISOString().split('T')[0], // Today's date
        description: `Paiement facture fournisseur ${purchase.invoice_number} - ${purchase.supplier_name || ''}`,
        referenceNumber: `PAY-${purchase.invoice_number}`,
        journalId: journal.id,
        status: 'posted' as const,
        lines: mappedItems
      };

      const result = await journalEntriesService.createJournalEntry(payload);

      if (!result.success) {
        logger.error('Erreur création écriture de paiement achat:', (result as { success: false; error: string }).error);
      } else {
        logger.warn(`Écriture de paiement créée pour l'achat ${purchase.invoice_number}`)
      }
    } catch (error) {
      logger.error('Erreur lors de la création automatique d\'écriture de paiement achat:', error);
      // Don't block payment marking if journal entry fails
    }
  }
};