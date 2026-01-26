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
import { supabase } from '../lib/supabase';
import { Purchase, PurchaseFormData, PurchaseFilters, PurchaseStats, Supplier } from '../types/purchase.types';
import { auditService } from './auditService';
import { logger } from '@/lib/logger';
const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const mapPurchaseRecord = (record: Record<string, any>): Purchase => ({
  id: record.id,
  invoice_number: record.invoice_number,
  purchase_date: record.purchase_date,
  supplier_id: record.supplier_id,
  supplier_name: (record.supplier as any)?.name || record.supplier_name || 'Inconnu',
  description: record.description || '',
  amount_ht: toNumber(record.amount_ht ?? record.subtotal_amount),
  tva_amount: toNumber(record.tva_amount ?? record.tax_amount),
  amount_ttc: toNumber(record.amount_ttc ?? record.total_amount),
  tva_rate: toNumber(record.tva_rate ?? record.tax_rate ?? 20),
  payment_status: record.payment_status as any,
  payment_date: record.payment_date || record.paid_at || undefined,
  due_date: record.due_date,
  created_at: record.created_at,
  updated_at: record.updated_at,
  company_id: record.company_id
});
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
        supplier:suppliers!supplier_id(name)
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
    const purchases: Purchase[] = (data || []).map(mapPurchaseRecord);
    return { data: purchases };
  } catch (error) {
    logger.error('PurchasesServiceImplementations', 'Error fetching purchases:', error);
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
        supplier:suppliers!supplier_id(name)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!data) {
      return { data: null };
    }
    return { data: mapPurchaseRecord(data) };
  } catch (error) {
    logger.error('PurchasesServiceImplementations', 'Error fetching purchase:', error);
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
        subtotal_amount: purchaseData.amount_ht,
        tax_rate: purchaseData.tva_rate,
        payment_status: 'pending'
      })
      .select(`
        *,
        supplier:suppliers!supplier_id(name)
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
    // Audit log - purchase creation
    if (data) {
      auditService.log({
        event_type: 'CREATE',
        table_name: 'purchases',
        record_id: data.id,
        company_id: companyId,
        new_values: {
          invoice_number: data.invoice_number,
          purchase_date: data.purchase_date,
          supplier_id: data.supplier_id,
          subtotal_amount: data.subtotal_amount,
          total_amount: data.total_amount,
          payment_status: data.payment_status
        },
        security_level: 'standard',
        compliance_tags: []
      }).catch(err => logger.error('PurchasesServiceImplementations', 'Audit log failed:', err));
    }
    return { data: data ? mapPurchaseRecord(data) : null };
  } catch (error) {
    logger.error('PurchasesServiceImplementations', 'Error creating purchase:', error);
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
    // Fetch old values for audit trail
    const { data: oldPurchase } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', id)
      .single();
    const updateData: any = {};
    if (purchaseData.invoice_number) updateData.invoice_number = purchaseData.invoice_number;
    if (purchaseData.supplier_id) updateData.supplier_id = purchaseData.supplier_id;
    if (purchaseData.purchase_date) updateData.purchase_date = purchaseData.purchase_date;
    if (purchaseData.due_date) updateData.due_date = purchaseData.due_date;
    if (purchaseData.description !== undefined) updateData.description = purchaseData.description;
    if (purchaseData.amount_ht !== undefined) updateData.subtotal_amount = purchaseData.amount_ht;
    if (purchaseData.tva_rate !== undefined) updateData.tax_rate = purchaseData.tva_rate;
    const { data, error } = await supabase
      .from('purchases')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        supplier:suppliers!supplier_id(name)
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
    // Audit log - purchase update
    if (oldPurchase) {
      const changedFields = Object.keys(updateData);
      auditService.log({
        event_type: 'UPDATE',
        table_name: 'purchases',
        record_id: id,
        company_id: data.company_id,
        old_values: {
          invoice_number: oldPurchase.invoice_number,
          purchase_date: oldPurchase.purchase_date,
          supplier_id: oldPurchase.supplier_id,
          subtotal_amount: oldPurchase.subtotal_amount,
          payment_status: oldPurchase.payment_status
        },
        new_values: {
          invoice_number: data.invoice_number,
          purchase_date: data.purchase_date,
          supplier_id: data.supplier_id,
          subtotal_amount: data.subtotal_amount,
          payment_status: data.payment_status
        },
        changed_fields: changedFields,
        security_level: 'standard',
        compliance_tags: []
      }).catch(err => logger.error('PurchasesServiceImplementations', 'Audit log failed:', err));
    }
    return { data: mapPurchaseRecord(data) };
  } catch (error) {
    logger.error('PurchasesServiceImplementations', 'Error updating purchase:', error);
    return { data: null, error };
  }
}
/**
 * Delete purchase
 */
export async function deletePurchase(id: string): Promise<{ data: boolean; error?: any }> {
  try {
    // Fetch purchase data before deletion for audit trail
    const { data: purchaseToDelete } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', id)
      .single();
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('id', id);
    if (error) throw error;
    // Audit log - purchase deletion (CRITICAL)
    if (purchaseToDelete) {
      auditService.log({
        event_type: 'DELETE',
        table_name: 'purchases',
        record_id: id,
        company_id: purchaseToDelete.company_id,
        old_values: {
          invoice_number: purchaseToDelete.invoice_number,
          purchase_date: purchaseToDelete.purchase_date,
          supplier_id: purchaseToDelete.supplier_id,
          subtotal_amount: purchaseToDelete.subtotal_amount,
          total_amount: purchaseToDelete.total_amount,
          payment_status: purchaseToDelete.payment_status
        },
        security_level: 'critical', // Deletion = always critical
        compliance_tags: []
      }).catch(err => logger.error('PurchasesServiceImplementations', 'Audit log failed:', err));
    }
    return { data: true };
  } catch (error) {
    logger.error('PurchasesServiceImplementations', 'Error deleting purchase:', error);
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
    // Fetch old status for audit trail
    const { data: oldPurchase } = await supabase
      .from('purchases')
      .select('payment_status, company_id')
      .eq('id', id)
      .single();
    const { data, error } = await supabase
      .from('purchases')
      .update({
        payment_status: 'paid',
        paid_at: paymentDate || new Date().toISOString().split('T')[0]
      })
      .eq('id', id)
      .select(`
        *,
        supplier:suppliers!supplier_id(name)
      `)
      .single();
    if (error) throw error;
    if (!data) {
      return { data: null, error: { message: 'Achat introuvable' } };
    }
    // Audit log - payment status change
    if (oldPurchase) {
      auditService.log({
        event_type: 'UPDATE',
        table_name: 'purchases',
        record_id: id,
        company_id: oldPurchase.company_id,
        old_values: {
          payment_status: oldPurchase.payment_status
        },
        new_values: {
          payment_status: 'paid',
          paid_at: data.paid_at
        },
        changed_fields: ['payment_status', 'paid_at'],
        security_level: 'standard',
        compliance_tags: []
      }).catch(err => logger.error('PurchasesServiceImplementations', 'Audit log failed:', err));
    }
    return { data: mapPurchaseRecord(data) };
  } catch (error) {
    logger.error('PurchasesServiceImplementations', 'Error marking purchase as paid:', error);
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
      .select('total_amount, payment_status')
      .eq('company_id', companyId);
    if (error) throw error;
    const stats: PurchaseStats = {
      total_purchases: purchases?.length || 0,
      total_amount: purchases?.reduce((sum, p) => sum + toNumber((p as any).amount_ttc ?? p.total_amount), 0) || 0,
      pending_payments: purchases?.filter(p => p.payment_status === 'pending').length || 0,
      overdue_payments: purchases?.filter(p => p.payment_status === 'overdue').length || 0
    };
    return { data: stats };
  } catch (error) {
    logger.error('PurchasesServiceImplementations', 'Error fetching purchase stats:', error);
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
    logger.error('PurchasesServiceImplementations', 'Error fetching suppliers:', error);
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
    logger.error('PurchasesServiceImplementations', 'Error exporting purchases to CSV:', error);
    return { data: '', error };
  }
}