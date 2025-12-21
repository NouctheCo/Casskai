/**
 * Service de génération automatique des écritures comptables de paie
 */

import { supabase } from '../lib/supabase';
import { auditService } from './auditService';

/**
 * Générer l'écriture comptable pour un bulletin de paie
 */
export async function generatePayrollJournalEntry(
  payrollSlipId: string
): Promise<{ success: boolean; journal_entry_id?: string; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('generate_payroll_journal_entry', {
      p_payroll_slip_id: payrollSlipId,
    });

    if (error) throw error;

    if (!data.success) {
      throw new Error(data.error || 'Erreur génération écriture paie');
    }

    await auditService.logAsync({
      action: 'generate_payroll_journal_entry',
      entityType: 'payroll',
      entityId: payrollSlipId,
      metadata: {
        journal_entry_id: data.journal_entry_id,
        total_gross: data.total_gross,
        net_salary: data.net_salary,
      },
    });

    return data;
  } catch (error) {
    console.error('Erreur génération écriture paie:', error);
    throw error;
  }
}

/**
 * Générer toutes les écritures de paie pour un mois donné
 */
export async function generateMonthlyPayrollEntries(
  companyId: string,
  year: number,
  month: number
): Promise<{
  success: boolean;
  entries_created: number;
  total_gross: number;
  total_net: number;
}> {
  try {
    const { data, error } = await supabase.rpc('generate_monthly_payroll_entries', {
      p_company_id: companyId,
      p_year: year,
      p_month: month,
    });

    if (error) throw error;

    if (!data.success) {
      throw new Error(data.error || 'Erreur génération écritures paie');
    }

    await auditService.logAsync({
      action: 'generate_monthly_payroll_entries',
      entityType: 'payroll',
      entityId: companyId,
      metadata: {
        period: data.period,
        entries_created: data.entries_created,
        total_gross: data.total_gross,
        total_net: data.total_net,
      },
    });

    return data;
  } catch (error) {
    console.error('Erreur génération écritures paie mensuelle:', error);
    throw error;
  }
}

/**
 * Créer un bulletin de paie
 */
export async function createPayrollSlip(slip: any): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('payroll_slips')
      .insert(slip)
      .select()
      .single();

    if (error) throw error;

    return data.id;
  } catch (error) {
    console.error('Erreur création bulletin paie:', error);
    throw error;
  }
}

/**
 * Récupérer les bulletins de paie
 */
export async function getPayrollSlips(
  companyId: string,
  year?: number,
  month?: number
): Promise<any[]> {
  try {
    let query = supabase
      .from('payroll_slips')
      .select('*')
      .eq('company_id', companyId)
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false });

    if (year) query = query.eq('period_year', year);
    if (month) query = query.eq('period_month', month);

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Erreur récupération bulletins paie:', error);
    return [];
  }
}

export const payrollJournalEntryService = {
  generatePayrollJournalEntry,
  generateMonthlyPayrollEntries,
  createPayrollSlip,
  getPayrollSlips,
};