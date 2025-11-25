import { supabase } from '../lib/supabase';
import { Purchase, PurchaseFormData, PurchaseFilters, PurchaseStats, Supplier } from '../types/purchase.types';

/**
 * Get all purchases with filters
 */
export async function getPurchases(
  companyId: string,
  filters: PurchaseFilters = {}
): Promise<{ data: Purchase[]; error?: any }> {
  try {
    let query = supabase
      .from('purchases')
      .select(`
        *,
        supplier:suppliers(name)
      `)
      .eq('company_id', companyId);

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
      query = query.or(`invoice_number.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('purchase_date', { ascending: false });

    if (error) throw error;

    const purchases: Purchase[] = (data || []).map(p => ({
      id: p.id,
      invoice_number: p.invoice_number,
      purchase_date: p.purchase_date,
      supplier_id: p.supplier_id,
      supplier_name: (p.supplier as any)?.name || 'Inconnu',
      description: p.description || '',
      amount_ht: Number(p.amount_ht) || 0,
      tva_amount: Number(p.tva_amount) || 0,
      amount_ttc: Number(p.amount_ttc) || 0,
      tva_rate: Number(p.tva_rate) || 20,
      payment_status: p.payment_status as any,
      payment_date: p.payment_date || undefined,
      due_date: p.due_date,
      created_at: p.created_at,
      updated_at: p.updated_at,
      company_id: p.company_id
    }));

    return { data: purchases };
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return { data: [], error };
  }
}

/**
 * Get purchase by ID
 */
export async function getPurchaseById(id: string): Promise<{ data: Purchase | null; error?: any }> {
  try {
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        *,
        supplier:suppliers(name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return { data: null };
    }

    const purchase: Purchase = {
      id: data.id,
      invoice_number: data.invoice_number,
      purchase_date: data.purchase_date,
      supplier_id: data.supplier_id,
      supplier_name: (data.supplier as any)?.name || 'Inconnu',
      description: data.description || '',
      amount_ht: Number(data.amount_ht) || 0,
      tva_amount: Number(data.tva_amount) || 0,
      amount_ttc: Number(data.amount_ttc) || 0,
      tva_rate: Number(data.tva_rate) || 20,
      payment_status: data.payment_status as any,
      payment_date: data.payment_date || undefined,
      due_date: data.due_date,
      created_at: data.created_at,
      updated_at: data.updated_at,
      company_id: data.company_id
    };

    return { data: purchase };
  } catch (error) {
    console.error('Error fetching purchase:', error);
    return { data: null, error };
  }
}

/**
 * Create new purchase
 */
export async function createPurchase(
  companyId: string,
  purchaseData: PurchaseFormData
): Promise<{ data: Purchase | null; error?: any }> {
  try {
    // Insert purchase (trigger will calculate TVA and TTC automatically)
    const { data, error } = await supabase
      .from('purchases')
      .insert({
        company_id: companyId,
        supplier_id: purchaseData.supplier_id,
        invoice_number: purchaseData.invoice_number,
        purchase_date: purchaseData.purchase_date,
        due_date: purchaseData.due_date,
        description: purchaseData.description,
        amount_ht: purchaseData.amount_ht,
        tva_rate: purchaseData.tva_rate,
        payment_status: 'pending'
      })
      .select(`
        *,
        supplier:suppliers(name)
      `)
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        return {
          data: null,
          error: { message: 'Une facture avec ce numéro existe déjà' }
        };
      }
      throw error;
    }

    const purchase: Purchase = {
      id: data.id,
      invoice_number: data.invoice_number,
      purchase_date: data.purchase_date,
      supplier_id: data.supplier_id,
      supplier_name: (data.supplier as any)?.name || 'Inconnu',
      description: data.description || '',
      amount_ht: Number(data.amount_ht) || 0,
      tva_amount: Number(data.tva_amount) || 0,
      amount_ttc: Number(data.amount_ttc) || 0,
      tva_rate: Number(data.tva_rate) || 20,
      payment_status: data.payment_status as any,
      payment_date: data.payment_date || undefined,
      due_date: data.due_date,
      created_at: data.created_at,
      updated_at: data.updated_at,
      company_id: data.company_id
    };

    return { data: purchase };
  } catch (error) {
    console.error('Error creating purchase:', error);
    return { data: null, error };
  }
}

/**
 * Update purchase
 */
export async function updatePurchase(
  id: string,
  purchaseData: Partial<PurchaseFormData>
): Promise<{ data: Purchase | null; error?: any }> {
  try {
    const updateData: any = {};

    if (purchaseData.invoice_number) updateData.invoice_number = purchaseData.invoice_number;
    if (purchaseData.supplier_id) updateData.supplier_id = purchaseData.supplier_id;
    if (purchaseData.purchase_date) updateData.purchase_date = purchaseData.purchase_date;
    if (purchaseData.due_date) updateData.due_date = purchaseData.due_date;
    if (purchaseData.description !== undefined) updateData.description = purchaseData.description;
    if (purchaseData.amount_ht !== undefined) updateData.amount_ht = purchaseData.amount_ht;
    if (purchaseData.tva_rate !== undefined) updateData.tva_rate = purchaseData.tva_rate;

    const { data, error } = await supabase
      .from('purchases')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        supplier:suppliers(name)
      `)
      .single();

    if (error) {
      if (error.code === '23505') {
        return {
          data: null,
          error: { message: 'Une facture avec ce numéro existe déjà' }
        };
      }
      throw error;
    }

    if (!data) {
      return { data: null, error: { message: 'Achat introuvable' } };
    }

    const purchase: Purchase = {
      id: data.id,
      invoice_number: data.invoice_number,
      purchase_date: data.purchase_date,
      supplier_id: data.supplier_id,
      supplier_name: (data.supplier as any)?.name || 'Inconnu',
      description: data.description || '',
      amount_ht: Number(data.amount_ht) || 0,
      tva_amount: Number(data.tva_amount) || 0,
      amount_ttc: Number(data.amount_ttc) || 0,
      tva_rate: Number(data.tva_rate) || 20,
      payment_status: data.payment_status as any,
      payment_date: data.payment_date || undefined,
      due_date: data.due_date,
      created_at: data.created_at,
      updated_at: data.updated_at,
      company_id: data.company_id
    };

    return { data: purchase };
  } catch (error) {
    console.error('Error updating purchase:', error);
    return { data: null, error };
  }
}

/**
 * Delete purchase
 */
export async function deletePurchase(id: string): Promise<{ data: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { data: true };
  } catch (error) {
    console.error('Error deleting purchase:', error);
    return { data: false, error: { message: 'Erreur lors de la suppression de l\'achat' } };
  }
}

/**
 * Mark purchase as paid
 */
export async function markAsPaid(
  id: string,
  paymentDate?: string
): Promise<{ data: Purchase | null; error?: any }> {
  try {
    const { data, error } = await supabase
      .from('purchases')
      .update({
        payment_status: 'paid',
        payment_date: paymentDate || new Date().toISOString().split('T')[0]
      })
      .eq('id', id)
      .select(`
        *,
        supplier:suppliers(name)
      `)
      .single();

    if (error) throw error;

    if (!data) {
      return { data: null, error: { message: 'Achat introuvable' } };
    }

    const purchase: Purchase = {
      id: data.id,
      invoice_number: data.invoice_number,
      purchase_date: data.purchase_date,
      supplier_id: data.supplier_id,
      supplier_name: (data.supplier as any)?.name || 'Inconnu',
      description: data.description || '',
      amount_ht: Number(data.amount_ht) || 0,
      tva_amount: Number(data.tva_amount) || 0,
      amount_ttc: Number(data.amount_ttc) || 0,
      tva_rate: Number(data.tva_rate) || 20,
      payment_status: data.payment_status as any,
      payment_date: data.payment_date || undefined,
      due_date: data.due_date,
      created_at: data.created_at,
      updated_at: data.updated_at,
      company_id: data.company_id
    };

    return { data: purchase };
  } catch (error) {
    console.error('Error marking purchase as paid:', error);
    return { data: null, error };
  }
}

/**
 * Get purchase statistics
 */
export async function getPurchaseStats(companyId: string): Promise<{ data: PurchaseStats; error?: any }> {
  try {
    // Get all purchases for the company
    const { data: purchases, error } = await supabase
      .from('purchases')
      .select('amount_ttc, payment_status')
      .eq('company_id', companyId);

    if (error) throw error;

    const stats: PurchaseStats = {
      total_purchases: purchases?.length || 0,
      total_amount: purchases?.reduce((sum, p) => sum + Number(p.amount_ttc), 0) || 0,
      pending_payments: purchases?.filter(p => p.payment_status === 'pending').length || 0,
      overdue_payments: purchases?.filter(p => p.payment_status === 'overdue').length || 0
    };

    return { data: stats };
  } catch (error) {
    console.error('Error fetching purchase stats:', error);
    return {
      data: {
        total_purchases: 0,
        total_amount: 0,
        pending_payments: 0,
        overdue_payments: 0
      },
      error
    };
  }
}

/**
 * Get suppliers
 */
export async function getSuppliers(companyId: string): Promise<{ data: Supplier[]; error?: any }> {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('company_id', companyId)
      .order('name', { ascending: true });

    if (error) throw error;

    return { data: data || [] };
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return { data: [], error };
  }
}

/**
 * Export purchases to CSV
 */
export async function exportToCsv(
  companyId: string,
  filters: PurchaseFilters = {}
): Promise<{ data: string; error?: any }> {
  try {
    const { data: purchases } = await getPurchases(companyId, filters);

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
      ...purchases.map(p => [
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
    console.error('Error exporting purchases to CSV:', error);
    return { data: '', error };
  }
}
