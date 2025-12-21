/**
 * Service de lettrage factures/paiements
 * Gère les paiements partiels et multiples
 */

import { supabase } from '../lib/supabase';
import { auditService } from './auditService';

interface PaymentAllocation {
  invoiceId: string;
  amount: number;
}

interface InvoiceBalance {
  invoice_id: string;
  invoice_number: string;
  company_id: string;
  total_incl_tax: number;
  paid_amount: number;
  balance_due: number;
  payment_status: 'paid' | 'partially_paid' | 'unpaid';
}

/**
 * Allouer un paiement sur une ou plusieurs factures
 */
export async function allocatePaymentToInvoices(
  paymentId: string,
  allocations: PaymentAllocation[]
): Promise<void> {
  try {
    // 1. Récupérer le paiement
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, amount, company_id')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      throw new Error('Paiement non trouvé');
    }

    // 2. Vérifier que le montant total alloué ne dépasse pas le paiement
    const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);

    if (totalAllocated > payment.amount) {
      throw new Error(
        `Montant total alloué (${totalAllocated}) dépasse le montant du paiement (${payment.amount})`
      );
    }

    // 3. Insérer les allocations
    const { error: insertError } = await supabase
      .from('invoice_payment_allocations')
      .insert(
        allocations.map((a) => ({
          payment_id: paymentId,
          invoice_id: a.invoiceId,
          allocated_amount: a.amount,
        }))
      );

    if (insertError) {
      throw insertError;
    }

    // 4. Mettre à jour le statut de chaque facture
    for (const allocation of allocations) {
      await updateInvoicePaymentStatus(allocation.invoiceId);
    }

    // 5. Audit log
    await auditService.logAsync({
      action: 'allocate_payment',
      entityType: 'payment',
      entityId: paymentId,
      metadata: {
        allocations_count: allocations.length,
        total_allocated: totalAllocated,
        payment_amount: payment.amount,
      },
    });
  } catch (error) {
    console.error('Erreur allocation paiement:', error);
    throw error;
  }
}

/**
 * Récupérer le solde d'une facture (depuis la vue invoice_balances)
 */
export async function getInvoiceBalance(
  invoiceId: string
): Promise<InvoiceBalance | null> {
  try {
    const { data, error } = await supabase
      .from('invoice_balances')
      .select('*')
      .eq('invoice_id', invoiceId)
      .single();

    if (error) throw error;

    return data as InvoiceBalance;
  } catch (error) {
    console.error('Erreur récupération solde facture:', error);
    return null;
  }
}

/**
 * Récupérer toutes les factures impayées d'un client
 */
export async function getUnpaidInvoices(
  companyId: string,
  thirdPartyId?: string
): Promise<InvoiceBalance[]> {
  try {
    let query = supabase
      .from('invoice_balances')
      .select('*')
      .eq('company_id', companyId)
      .in('payment_status', ['unpaid', 'partially_paid'])
      .gt('balance_due', 0)
      .order('invoice_number', { ascending: true });

    if (thirdPartyId) {
      // Joindre avec invoices pour filtrer par tiers
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id')
        .eq('company_id', companyId)
        .eq('third_party_id', thirdPartyId);

      if (invoices && invoices.length > 0) {
        const invoiceIds = invoices.map((i) => i.id);
        query = query.in('invoice_id', invoiceIds);
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data as InvoiceBalance[]) || [];
  } catch (error) {
    console.error('Erreur récupération factures impayées:', error);
    return [];
  }
}

/**
 * Mettre à jour le statut de paiement d'une facture
 */
async function updateInvoicePaymentStatus(invoiceId: string): Promise<void> {
  try {
    const balance = await getInvoiceBalance(invoiceId);

    if (!balance) return;

    // Mettre à jour la facture avec le nouveau statut et montant payé
    const { error } = await supabase
      .from('invoices')
      .update({
        status: balance.payment_status,
        paid_amount: balance.paid_amount,
      })
      .eq('id', invoiceId);

    if (error) {
      console.error('Erreur mise à jour statut facture:', error);
    }
  } catch (error) {
    console.error('Erreur updateInvoicePaymentStatus:', error);
  }
}

/**
 * Supprimer une allocation (délettrer)
 */
export async function removePaymentAllocation(
  allocationId: string
): Promise<void> {
  try {
    // Récupérer l'allocation avant suppression
    const { data: allocation } = await supabase
      .from('invoice_payment_allocations')
      .select('invoice_id, payment_id, allocated_amount')
      .eq('id', allocationId)
      .single();

    if (!allocation) {
      throw new Error('Allocation non trouvée');
    }

    // Supprimer l'allocation
    const { error } = await supabase
      .from('invoice_payment_allocations')
      .delete()
      .eq('id', allocationId);

    if (error) throw error;

    // Mettre à jour le statut de la facture
    await updateInvoicePaymentStatus(allocation.invoice_id);

    // Audit log
    await auditService.logAsync({
      action: 'remove_payment_allocation',
      entityType: 'payment_allocation',
      entityId: allocationId,
      metadata: {
        invoice_id: allocation.invoice_id,
        payment_id: allocation.payment_id,
        amount: allocation.allocated_amount,
      },
    });
  } catch (error) {
    console.error('Erreur suppression allocation:', error);
    throw error;
  }
}

/**
 * Récupérer toutes les allocations d'un paiement
 */
export async function getPaymentAllocations(paymentId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('invoice_payment_allocations')
      .select(
        `
        id,
        allocated_amount,
        created_at,
        invoices:invoice_id (
          id,
          invoice_number,
          total_incl_tax,
          issue_date
        )
      `
      )
      .eq('payment_id', paymentId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Erreur récupération allocations paiement:', error);
    return [];
  }
}

/**
 * Lettrage automatique : alloue un paiement aux factures les plus anciennes
 */
export async function autoAllocatePayment(
  paymentId: string,
  thirdPartyId: string,
  companyId: string
): Promise<void> {
  try {
    // Récupérer le paiement
    const { data: payment } = await supabase
      .from('payments')
      .select('amount')
      .eq('id', paymentId)
      .single();

    if (!payment) throw new Error('Paiement non trouvé');

    // Récupérer les factures impayées du tiers (triées par date)
    const unpaidInvoices = await getUnpaidInvoices(companyId, thirdPartyId);

    let remainingAmount = payment.amount;
    const allocations: PaymentAllocation[] = [];

    // Allouer sur les factures les plus anciennes en premier
    for (const invoice of unpaidInvoices) {
      if (remainingAmount <= 0) break;

      const amountToAllocate = Math.min(remainingAmount, invoice.balance_due);

      allocations.push({
        invoiceId: invoice.invoice_id,
        amount: amountToAllocate,
      });

      remainingAmount -= amountToAllocate;
    }

    if (allocations.length > 0) {
      await allocatePaymentToInvoices(paymentId, allocations);
    }
  } catch (error) {
    console.error('Erreur lettrage automatique:', error);
    throw error;
  }
}

export const paymentAllocationService = {
  allocatePaymentToInvoices,
  getInvoiceBalance,
  getUnpaidInvoices,
  removePaymentAllocation,
  getPaymentAllocations,
  autoAllocatePayment,
};