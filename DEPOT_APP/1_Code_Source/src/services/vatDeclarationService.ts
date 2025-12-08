/**
 * Service de génération automatique des déclarations TVA
 * Utilise la fonction RPC generate_vat_declaration
 */

import { supabase } from '../lib/supabase';
import { auditService } from './auditService';

interface VATDeclaration {
  company_id: string;
  period_start: string;
  period_end: string;
  declaration_type: string;
  generated_at: string;
  currency: string;
  vat_collected: number;
  vat_deductible: number;
  vat_to_pay: number;
  sales_amount_ht: number;
  purchases_amount_ht: number;
  vat_rates_breakdown: {
    rate_20: { base_ht: number; vat_amount: number; rate: string };
    rate_10: { base_ht: number; vat_amount: number; rate: string };
    rate_55: { base_ht: number; vat_amount: number; rate: string };
  };
  ca3_form: {
    ligne_01: number;
    ligne_02: number;
    ligne_15: number;
    ligne_16: number;
    ligne_23: number;
  };
  status: string;
  is_valid: boolean;
}

/**
 * Générer une déclaration TVA automatiquement depuis les écritures comptables
 */
export async function generateVATDeclaration(
  companyId: string,
  periodStart: string,
  periodEnd: string,
  declarationType: string = 'CA3'
): Promise<VATDeclaration> {
  try {
    // Appeler la fonction RPC PostgreSQL
    const { data, error } = await supabase.rpc('generate_vat_declaration', {
      p_company_id: companyId,
      p_start_date: periodStart,
      p_end_date: periodEnd,
      p_declaration_type: declarationType,
    });

    if (error) {
      console.error('Erreur RPC generate_vat_declaration:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Aucune donnée retournée par la fonction RPC');
    }

    // Vérifier si la déclaration contient une erreur
    if (data.error) {
      throw new Error(`Erreur génération TVA: ${data.error}`);
    }

    return data as VATDeclaration;
  } catch (error) {
    console.error('Erreur génération déclaration TVA:', error);
    throw error;
  }
}

/**
 * Créer et enregistrer une déclaration TVA dans la base de données
 */
export async function createVATDeclaration(
  companyId: string,
  periodStart: string,
  periodEnd: string,
  declarationType: string = 'CA3'
): Promise<{ id: string; data: VATDeclaration }> {
  try {
    // 1. Générer les données de la déclaration
    const vatData = await generateVATDeclaration(
      companyId,
      periodStart,
      periodEnd,
      declarationType
    );

    // 2. Enregistrer dans company_tax_declarations
    const { data: declaration, error: insertError } = await supabase
      .from('company_tax_declarations')
      .insert({
        company_id: companyId,
        type: 'vat',
        period_start: periodStart,
        period_end: periodEnd,
        amount: vatData.vat_to_pay,
        status: 'draft',
        metadata: vatData,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erreur insertion déclaration TVA:', insertError);
      throw insertError;
    }

    // 3. Audit log
    await auditService.logAsync({
      action: 'create_vat_declaration',
      entityType: 'tax_declaration',
      entityId: declaration.id,
      metadata: {
        period: `${periodStart} - ${periodEnd}`,
        vat_collected: vatData.vat_collected,
        vat_deductible: vatData.vat_deductible,
        vat_to_pay: vatData.vat_to_pay,
        status: vatData.status,
      },
    });

    return {
      id: declaration.id,
      data: vatData,
    };
  } catch (error) {
    console.error('Erreur création déclaration TVA:', error);
    throw error;
  }
}

/**
 * Récupérer toutes les déclarations TVA d'une entreprise
 */
export async function getVATDeclarations(
  companyId: string,
  status?: string
): Promise<any[]> {
  try {
    let query = supabase
      .from('company_tax_declarations')
      .select('*')
      .eq('company_id', companyId)
      .eq('type', 'vat')
      .order('period_start', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Erreur récupération déclarations TVA:', error);
    return [];
  }
}

/**
 * Soumettre une déclaration TVA (changer le statut en "submitted")
 */
export async function submitVATDeclaration(
  declarationId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('company_tax_declarations')
      .update({
        status: 'submitted',
        submitted_date: new Date().toISOString(),
      })
      .eq('id', declarationId);

    if (error) throw error;

    await auditService.logAsync({
      action: 'submit_vat_declaration',
      entityType: 'tax_declaration',
      entityId: declarationId,
      metadata: { submitted_at: new Date().toISOString() },
    });
  } catch (error) {
    console.error('Erreur soumission déclaration TVA:', error);
    throw error;
  }
}

/**
 * Enregistrer un paiement de TVA
 */
export async function recordVATPayment(
  declarationId: string,
  amount: number,
  paymentDate: string,
  paymentMethod: string = 'bank_transfer'
): Promise<string> {
  try {
    // 1. Créer l'enregistrement du paiement
    const { data: payment, error: paymentError } = await supabase
      .from('company_tax_payments')
      .insert({
        declaration_id: declarationId,
        amount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        status: 'completed',
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // 2. Mettre à jour le statut de la déclaration
    const { error: updateError } = await supabase
      .from('company_tax_declarations')
      .update({ status: 'paid' })
      .eq('id', declarationId);

    if (updateError) {
      console.error('Erreur mise à jour statut déclaration:', updateError);
    }

    // 3. Audit log
    await auditService.logAsync({
      action: 'record_vat_payment',
      entityType: 'tax_payment',
      entityId: payment.id,
      metadata: {
        declaration_id: declarationId,
        amount,
        payment_date: paymentDate,
      },
    });

    return payment.id;
  } catch (error) {
    console.error('Erreur enregistrement paiement TVA:', error);
    throw error;
  }
}

/**
 * Exporter une déclaration TVA au format PDF/Excel (à implémenter côté frontend)
 */
export async function exportVATDeclaration(
  declarationId: string,
  _format: 'pdf' | 'excel' = 'pdf'
): Promise<{ url: string }> {
  try {
    // Récupérer la déclaration
    const { data: declaration, error } = await supabase
      .from('company_tax_declarations')
      .select('*')
      .eq('id', declarationId)
      .single();

    if (error || !declaration) {
      throw new Error('Déclaration non trouvée');
    }

    // TODO: Générer le PDF/Excel côté frontend ou via un service externe
    // Pour l'instant, retourner les données brutes

    return {
      url: '', // URL du fichier généré
    };
  } catch (error) {
    console.error('Erreur export déclaration TVA:', error);
    throw error;
  }
}

/**
 * Calculer le montant de TVA à payer pour une période donnée (aperçu rapide)
 */
export async function previewVATAmount(
  companyId: string,
  periodStart: string,
  periodEnd: string
): Promise<{
  collected: number;
  deductible: number;
  toPay: number;
}> {
  try {
    const vatData = await generateVATDeclaration(
      companyId,
      periodStart,
      periodEnd
    );

    return {
      collected: vatData.vat_collected,
      deductible: vatData.vat_deductible,
      toPay: vatData.vat_to_pay,
    };
  } catch (error) {
    console.error('Erreur aperçu montant TVA:', error);
    return { collected: 0, deductible: 0, toPay: 0 };
  }
}

export const vatDeclarationService = {
  generateVATDeclaration,
  createVATDeclaration,
  getVATDeclarations,
  submitVATDeclaration,
  recordVATPayment,
  exportVATDeclaration,
  previewVATAmount,
};