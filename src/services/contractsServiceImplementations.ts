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
import { emailService } from './emailService';
import { logger } from '@/lib/logger';
import {
  ContractData,
  ContractFormData,
  ContractFilters,
  ContractsDashboardData,
  RFACalculation,
  RFAFormData,
  RFAFilters,
  ContractServiceResponse,
  SimulationResult,
  TurnoverScenario,
  RFATierBreakdown,
  DiscountConfig,
} from '../types/contracts.types';
// Helpers -------------------------------------------------------------------
const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data?.user?.id ?? null;
  } catch (_err) {
    return null;
  }
};
const calculateRFAForTurnover = (config: DiscountConfig, turnover: number) => {
  const breakdown: RFATierBreakdown[] = [];
  if (!turnover || turnover <= 0) {
    return { rfaAmount: 0, effectiveRate: 0, breakdown };
  }
  if (config.type === 'fixed_percent') {
    const rate = config.rate || 0;
    const rfaAmount = turnover * rate;
    return { rfaAmount, effectiveRate: rate, breakdown };
  }
  if (config.type === 'fixed_amount') {
    const amount = config.amount || 0;
    const effectiveRate = turnover > 0 ? amount / turnover : 0;
    return { rfaAmount: amount, effectiveRate, breakdown };
  }
  const tiers = [...(config.tiers || [])].sort((a, b) => a.min - b.min);
  let totalRFA = 0;
  tiers.forEach((tier, index) => {
    const tierMin = tier.min;
    const tierMax = tier.max ?? Number.MAX_SAFE_INTEGER;
    if (turnover <= tierMin) return;
    const tierAmount = Math.max(0, Math.min(turnover, tierMax) - tierMin);
    const tierRFA = tierAmount * tier.rate;
    totalRFA += tierRFA;
    breakdown.push({
      tier_index: index,
      tier_min: tierMin,
      tier_max: tier.max ?? null,
      tier_rate: tier.rate,
      tier_amount: tierAmount,
      rfa_amount: tierRFA
    });
  });
  const effectiveRate = turnover > 0 ? totalRFA / turnover : 0;
  return { rfaAmount: totalRFA, effectiveRate, breakdown };
};
const logContractHistory = async (
  contractId: string,
  changeType: 'created' | 'updated' | 'status_changed' | 'terminated' | 'renewed',
  description?: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>
) => {
  try {
    const userId = await getCurrentUserId();
    await supabase.from('contract_history').insert({
      contract_id: contractId,
      change_type: changeType,
      change_description: description,
      old_values: oldValues || null,
      new_values: newValues || null,
      changed_by: userId || null
    });
  } catch (err) {
    logger.warn('ContractsServiceImplementations', 'Unable to log contract history', err);
  }
};
const assertNoOverlap = async (
  enterpriseId: string,
  clientId: string,
  startDate: string,
  endDate?: string,
  excludeContractId?: string
) => {
  const end = endDate || startDate;
  let query = supabase
    .from('contracts')
    .select('id, contract_name, start_date, end_date, status')
    .eq('company_id', enterpriseId)
    .eq('client_id', clientId)
    .not('status', 'in', '(terminated,cancelled,archived)')
    .lte('start_date', end)
    .gte('end_date', startDate);
  if (excludeContractId) {
    query = query.neq('id', excludeContractId);
  }
  const { data, error } = await query.limit(1);
  if (error) {
    throw error;
  }
  if (data && data.length > 0) {
    const overlap = data[0];
    const message = `Un autre contrat (${overlap.contract_name}) couvre déjà cette période pour ce client.`;
    throw new Error(message);
  }
};
/**
 * Get all contracts with filters
 */
export async function getContracts(
  enterpriseId: string,
  filters?: ContractFilters
): Promise<ContractServiceResponse<ContractData[]>> {
  try {
    let query = supabase
      .from('contracts')
      .select(`
        *,
        client:customers(id, name)
      `)
      .eq('company_id', enterpriseId);
    // Apply filters
    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id);
    }
    if (filters?.status && (filters.status as any) !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters?.contract_type && (filters.contract_type as any) !== 'all') {
      query = query.eq('rfa_calculation_type', filters.contract_type);
    }
    if (filters?.search) {
      query = query.or(`contract_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    const contracts: ContractData[] = (data || []).map(c => ({
      id: c.id,
      enterprise_id: c.company_id,
      client_id: c.client_id,
      client_name: (c.client as any)?.name || 'Client inconnu',
      contract_name: c.contract_name,
      contract_type: c.rfa_calculation_type || 'progressive',
      discount_config: {
        type: c.rfa_calculation_type || 'progressive',
        rate: (c.rfa_base_percentage ? c.rfa_base_percentage / 100 : 0),
        tiers: c.rfa_tiers || []
      },
      rfa_base_type: (c as any).rfa_base_type || 'total_client',
      rfa_base_product_groups: (c as any).rfa_base_product_groups || [],
      rfa_application_type: (c as any).rfa_application_type || 'same_as_base',
      rfa_application_product_groups: (c as any).rfa_application_product_groups || [],
      rfa_period_type: (c as any).rfa_period_type || 'contract_period',
      rfa_custom_period_start: (c as any).rfa_custom_period_start || null,
      rfa_custom_period_end: (c as any).rfa_custom_period_end || null,
      rfa_projection_method: (c as any).rfa_projection_method || 'linear',
      rfa_notes: (c as any).rfa_notes || null,
      start_date: c.start_date,
      end_date: c.end_date,
      status: c.status as any,
      currency: c.currency || 'EUR',
      notes: c.description,
      created_at: c.created_at,
      updated_at: c.updated_at
    }));
    return { data: contracts, success: true };
  } catch (error) {
    logger.error('ContractsServiceImplementations', 'Error fetching contracts:', error);
    return { data: [], error: { message: String(error) }, success: false };
  }
}
/**
 * Get contract by ID
 */
export async function getContract(id: string): Promise<ContractServiceResponse<ContractData>> {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        client:customers(id, name)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!data) {
      return { data: undefined, error: { message: 'Contract not found' }, success: false };
    }
    const contract: ContractData = {
      id: data.id,
      enterprise_id: data.company_id,
      client_id: data.client_id,
      client_name: (data.client as any)?.name || 'Client inconnu',
      contract_name: data.contract_name,
      contract_type: data.rfa_calculation_type as any,
      discount_config: {
        type: data.rfa_calculation_type || 'progressive',
        rate: (data.rfa_base_percentage ? data.rfa_base_percentage / 100 : 0),
        tiers: data.rfa_tiers || []
      },
      rfa_base_type: (data as any).rfa_base_type || 'total_client',
      rfa_base_product_groups: (data as any).rfa_base_product_groups || [],
      rfa_application_type: (data as any).rfa_application_type || 'same_as_base',
      rfa_application_product_groups: (data as any).rfa_application_product_groups || [],
      rfa_period_type: (data as any).rfa_period_type || 'contract_period',
      rfa_custom_period_start: (data as any).rfa_custom_period_start || null,
      rfa_custom_period_end: (data as any).rfa_custom_period_end || null,
      rfa_projection_method: (data as any).rfa_projection_method || 'linear',
      rfa_notes: (data as any).rfa_notes || null,
      start_date: data.start_date,
      end_date: data.end_date,
      status: data.status as any,
      currency: data.currency || 'EUR',
      created_at: data.created_at,
      updated_at: data.updated_at
    } as any;
    return { data: contract, success: true };
  } catch (error) {
    logger.error('ContractsServiceImplementations', 'Error fetching contract:', error);
    return { data: undefined, error: { message: String(error) }, success: false };
  }
}
/**
 * Create new contract
 */
export async function createContract(
  enterpriseId: string,
  contractData: ContractFormData
): Promise<ContractServiceResponse<ContractData>> {
  try {
    await assertNoOverlap(enterpriseId, contractData.client_id, contractData.start_date, contractData.end_date);
    const { data, error } = await supabase
      .from('contracts')
      .insert({
        company_id: enterpriseId,
        client_id: contractData.client_id,
        contract_name: contractData.contract_name,
        contract_number: `CTR-${Date.now()}`,
        rfa_calculation_type: contractData.contract_type,
        rfa_base_percentage: contractData.discount_config.rate ? contractData.discount_config.rate * 100 : 0,
        rfa_tiers: contractData.discount_config.tiers || [],
        has_rfa: true,
        rfa_base_type: (contractData as any).rfa_base_type || 'total_client',
        rfa_base_product_groups: (contractData as any).rfa_base_product_groups || [],
        rfa_application_type: (contractData as any).rfa_application_type || 'same_as_base',
        rfa_application_product_groups: (contractData as any).rfa_application_product_groups || [],
        rfa_period_type: (contractData as any).rfa_period_type || 'contract_period',
        rfa_custom_period_start: (contractData as any).rfa_custom_period_start || null,
        rfa_custom_period_end: (contractData as any).rfa_custom_period_end || null,
        rfa_projection_method: (contractData as any).rfa_projection_method || 'linear',
        rfa_notes: (contractData as any).rfa_notes || null,
        start_date: contractData.start_date,
        end_date: contractData.end_date,
        status: (contractData as any).status || 'draft',
        currency: contractData.currency || 'EUR',
        description: (contractData as any).notes
      })
      .select(`
        *,
        client:customers(id, name)
      `)
      .single();
    if (error) throw error;
    const contract: ContractData = {
      id: data.id,
      enterprise_id: data.company_id,
      client_id: data.client_id,
      client_name: (data.client as any)?.name || 'Client inconnu',
      contract_name: data.contract_name,
      contract_type: data.rfa_calculation_type as any,
      discount_config: {
        type: data.rfa_calculation_type || 'progressive',
        rate: (data.rfa_base_percentage ? data.rfa_base_percentage / 100 : 0),
        tiers: data.rfa_tiers || []
      },
      start_date: data.start_date,
      end_date: data.end_date,
      status: data.status as any,
      currency: data.currency || 'EUR',
      created_at: data.created_at,
      updated_at: data.updated_at
    } as any;
    await logContractHistory(contract.id, 'created', 'Création du contrat', undefined, contractData as any);
    return { data: contract, success: true };
  } catch (error) {
    logger.error('ContractsServiceImplementations', 'Error creating contract:', error);
    return { data: undefined, error: { message: String(error) }, success: false };
  }
}
/**
 * Update contract
 */
export async function updateContract(
  id: string,
  contractData: Partial<ContractFormData>
): Promise<ContractServiceResponse<ContractData>> {
  try {
    // fetch current state for history
    const { data: currentData } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single();
    if (currentData && (contractData.client_id || contractData.start_date || contractData.end_date)) {
      await assertNoOverlap(
        currentData.company_id,
        contractData.client_id || currentData.client_id,
        contractData.start_date || currentData.start_date,
        contractData.end_date || currentData.end_date,
        id
      );
    }
    const updateData: any = {};
    if (contractData.contract_name) updateData.contract_name = contractData.contract_name;
    if (contractData.client_id) updateData.client_id = contractData.client_id;
    if (contractData.contract_type) updateData.rfa_calculation_type = contractData.contract_type;
    if (contractData.discount_config) {
      updateData.rfa_base_percentage = contractData.discount_config.rate ? contractData.discount_config.rate * 100 : 0;
      updateData.rfa_tiers = contractData.discount_config.tiers || [];
    }
    if (contractData.start_date) updateData.start_date = contractData.start_date;
    if (contractData.end_date) updateData.end_date = contractData.end_date;
    if ((contractData as any).status) updateData.status = (contractData as any).status;
    if (contractData.currency) updateData.currency = contractData.currency;
    if ((contractData as any).notes !== undefined) updateData.description = (contractData as any).notes;
    const { data, error } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        client:customers(id, name)
      `)
      .single();
    if (error) throw error;
    if (!data) {
      return { data: undefined, error: { message: 'Contract not found' }, success: false };
    }
    const contract: ContractData = {
      id: data.id,
      enterprise_id: data.company_id,
      client_id: data.client_id,
      client_name: (data.client as any)?.name || 'Client inconnu',
      contract_name: data.contract_name,
      contract_type: data.rfa_calculation_type as any,
      discount_config: {
        type: data.rfa_calculation_type || 'progressive',
        rate: (data.rfa_base_percentage ? data.rfa_base_percentage / 100 : 0),
        tiers: data.rfa_tiers || []
      },
      start_date: data.start_date,
      end_date: data.end_date,
      status: data.status as any,
      currency: data.currency || 'EUR',
      created_at: data.created_at,
      updated_at: data.updated_at
    } as any;
    const changeType = currentData?.end_date && contractData.end_date && contractData.end_date > currentData.end_date
      ? 'renewed'
      : 'updated';
    await logContractHistory(id, changeType, 'Mise à jour du contrat', currentData as any, contractData as any);
    return { data: contract, success: true };
  } catch (error) {
    logger.error('ContractsServiceImplementations', 'Error updating contract:', error);
    return { data: undefined, error: { message: String(error) }, success: false };
  }
}
/**
 * Delete contract
 */
export async function deleteContract(id: string): Promise<ContractServiceResponse<boolean>> {
  try {
    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { data: true, success: true };
  } catch (error) {
    logger.error('ContractsServiceImplementations', 'Error deleting contract:', error);
    return { data: false, error: { message: String(error) }, success: false };
  }
}
/**
 * Archive contract (set status to 'cancelled')
 */
export async function archiveContract(id: string): Promise<ContractServiceResponse<boolean>> {
  try {
    const { error } = await supabase
      .from('contracts')
      .update({ status: 'cancelled' })
      .eq('id', id);
    if (error) throw error;
    await logContractHistory(id, 'status_changed', 'Contrat archivé', undefined, { status: 'cancelled' });
    return { data: true, success: true };
  } catch (error) {
    logger.error('ContractsServiceImplementations', 'Error archiving contract:', error);
    return { data: false, error: { message: String(error) }, success: false };
  }
}
/**
 * Get RFA calculations with filters
 */
export async function getRFACalculations(
  enterpriseId: string,
  filters?: RFAFilters
): Promise<ContractServiceResponse<RFACalculation[]>> {
  try {
    let query = supabase
      .from('rfa_calculations')
      .select(`
        *,
        contract:contracts(id, contract_name, client:customers(name))
      `)
      .eq('company_id', enterpriseId);
    if (filters?.contract_id) {
      query = query.eq('contract_id', filters.contract_id);
    }
    if (filters?.status && (filters.status as any) !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters?.period_start) {
      query = query.gte('period_start', filters.period_start);
    }
    if (filters?.period_end) {
      query = query.lte('period_end', filters.period_end);
    }
    const { data, error } = await query.order('period_start', { ascending: false });
    if (error) throw error;
    const calculations: RFACalculation[] = (data || []).map(r => ({
      id: r.id,
      contract_id: r.contract_id,
      enterprise_id: r.company_id,
      client_id: (r.contract as any)?.client_id || '',
      contract_name: (r.contract as any)?.contract_name || 'Contrat inconnu',
      client_name: (r.contract as any)?.client?.name || 'Client inconnu',
      period_start: r.period_start,
      period_end: r.period_end,
      turnover_amount: Number(r.total_turnover ?? r.turnover_amount) || 0,
      rfa_amount: Number(r.discount_amount ?? r.rfa_amount) || 0,
      tier_reached: 0,
      calculation_details: r.calculation_details || {
        type: (r.contract as any)?.rfa_calculation_type || 'progressive',
        applied_rate: Number(r.rfa_percentage) ? Number(r.rfa_percentage) / 100 : 0
      },
      status: r.status as any,
      currency: r.currency || 'EUR',
      created_at: r.created_at,
      updated_at: r.updated_at
    }));
    return { data: calculations, success: true };
  } catch (error) {
    logger.error('ContractsServiceImplementations', 'Error fetching RFA calculations:', error);
    return { data: [], error: { message: String(error) }, success: false };
  }
}
/**
 * Create RFA calculation
 */
export async function createRFACalculation(
  enterpriseId: string,
  rfaData: RFAFormData
): Promise<ContractServiceResponse<RFACalculation>> {
  try {
    // First, calculate the RFA using the database function
    const { data: calcResult, error: calcError } = await supabase
      .rpc('calculate_contract_rfa', {
        p_contract_id: rfaData.contract_id,
        p_period_start: rfaData.period_start,
        p_period_end: rfaData.period_end
      });
    if (calcError) throw calcError;
    const calculation = calcResult[0];
    // Insert the calculated RFA
    const { data, error } = await supabase
      .from('rfa_calculations')
      .insert({
        company_id: enterpriseId,
        contract_id: rfaData.contract_id,
        period_start: rfaData.period_start,
        period_end: rfaData.period_end,
        total_turnover: calculation.turnover,
        discount_amount: calculation.discount_amount,
        discount_rate: calculation.discount_rate,
        status: 'calculated'
      })
      .select(`
        *,
        contract:contracts(id, contract_name, client:customers(name))
      `)
      .single();
    if (error) throw error;
    const rfa: RFACalculation = {
      id: data.id,
      contract_id: data.contract_id,
      contract_name: (data.contract as any)?.contract_name || 'Inconnu',
      client_name: (data.contract as any)?.client?.name || 'Inconnu',
      period_start: data.period_start,
      period_end: data.period_end,
      discount_amount: Number(data.discount_amount) || 0,
      discount_rate: Number(data.discount_rate) || 0,
      tier_breakdown: data.tier_breakdown,
      status: data.status as any,
      invoice_id: data.invoice_id,
      calculated_at: data.calculated_at,
      validated_at: data.validated_at,
      validated_by: data.validated_by
    } as any;
    return { data: rfa, success: true };
  } catch (error) {
    logger.error('ContractsServiceImplementations', 'Error creating RFA calculation:', error);
    return { data: undefined, error: { message: String(error) }, success: false };
  }
}
/**
 * Automatic monthly RFA calculation for all active contracts
 */
export async function autoCalculateCurrentMonthRFA(
  enterpriseId: string
): Promise<ContractServiceResponse<{ processed: number; updated: number }>> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodStart = start.toISOString().split('T')[0];
  const periodEnd = now.toISOString().split('T')[0];
  try {
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('id, start_date, end_date, status, company_id, client_id, currency')
      .eq('company_id', enterpriseId)
      .in('status', ['active', 'draft'])
      .lte('start_date', periodEnd)
      .or(`end_date.is.null,end_date.gte.${periodStart}`);
    if (contractsError) throw contractsError;
    let processed = 0;
    let updated = 0;
    for (const contract of contracts || []) {
      const { data: calcResult, error: calcError } = await supabase
        .rpc('calculate_contract_rfa', {
          p_contract_id: contract.id,
          p_period_start: periodStart,
          p_period_end: periodEnd
        });
      if (calcError) {
        logger.warn('ContractsServiceImplementations', 'Auto RFA calculation failed for contract', contract.id, calcError);
        continue;
      }
      const calculation = calcResult?.[0];
      if (!calculation) continue;
      // Upsert logic: if a calculation exists for the same contract & period, update it
      const { data: existing, error: existingError } = await supabase
        .from('rfa_calculations')
        .select('id')
        .eq('company_id', enterpriseId)
        .eq('contract_id', contract.id)
        .eq('period_start', periodStart)
        .eq('period_end', periodEnd)
        .limit(1);
      if (existingError) {
        logger.warn('ContractsServiceImplementations', 'Auto RFA lookup failed', existingError);
        continue;
      }
      if (existing && existing.length > 0) {
        const { error: updateError } = await supabase
          .from('rfa_calculations')
          .update({
            total_turnover: calculation.turnover,
            discount_amount: calculation.discount_amount,
            discount_rate: calculation.discount_rate,
            status: 'calculated',
            updated_at: new Date().toISOString()
          })
          .eq('id', existing[0].id);
        if (!updateError) {
          updated += 1;
        }
      } else {
        await supabase.from('rfa_calculations').insert({
          company_id: enterpriseId,
          contract_id: contract.id,
          period_start: periodStart,
          period_end: periodEnd,
          total_turnover: calculation.turnover,
          discount_amount: calculation.discount_amount,
          discount_rate: calculation.discount_rate,
          status: 'calculated',
          currency: contract.currency || 'EUR'
        });
      }
      processed += 1;
    }
    return { data: { processed, updated }, success: true };
  } catch (error) {
    logger.error('ContractsServiceImplementations', 'Error running auto RFA calculation:', error);
    return { data: { processed: 0, updated: 0 }, error: { message: String(error) }, success: false };
  }
}
/**
 * Simulate RFA results for what-if turnover scenarios
 */
export async function simulateRFA(
  contractId: string,
  scenarios: TurnoverScenario[]
): Promise<ContractServiceResponse<SimulationResult[]>> {
  try {
    const contractResp = await getContract(contractId);
    if (!contractResp.success || !contractResp.data) {
      return { data: [], success: false, error: { message: 'Contrat introuvable' } };
    }
    const config = contractResp.data.discount_config;
    const results: SimulationResult[] = scenarios.map((scenario) => {
      const { rfaAmount, effectiveRate, breakdown } = calculateRFAForTurnover(config as DiscountConfig, scenario.amount);
      return {
        scenario_name: scenario.name,
        turnover_amount: scenario.amount,
        rfa_amount: Number(rfaAmount.toFixed(2)),
        effective_rate: Number(effectiveRate.toFixed(6)),
        tier_reached: breakdown.length ? breakdown[breakdown.length - 1].tier_index : undefined,
        breakdown
      };
    });
    return { data: results, success: true };
  } catch (error) {
    logger.error('ContractsServiceImplementations', 'Error simulating RFA:', error);
    return { data: [], error: { message: String(error) }, success: false };
  }
}
/**
 * Send a contract summary by email (internal follow-up or to client)
 */
export async function sendContractSummaryEmail(
  enterpriseId: string,
  contractId: string,
  recipientEmail: string
): Promise<ContractServiceResponse<boolean>> {
  try {
    const contractResp = await getContract(contractId);
    if (!contractResp.success || !contractResp.data) {
      return { data: false, success: false, error: { message: 'Contrat introuvable' } };
    }
    // Dernier calcul RFA pour donner un état récent
    const { data: recentRFA } = await supabase
      .from('rfa_calculations')
      .select('*')
      .eq('company_id', enterpriseId)
      .eq('contract_id', contractId)
      .order('period_end', { ascending: false })
      .limit(1);
    const contract = contractResp.data;
    const lastRFA = recentRFA?.[0];
    const rfaAmount = lastRFA ? Number(lastRFA.discount_amount || lastRFA.rfa_amount || 0) : 0;
    const turnover = lastRFA ? Number(lastRFA.total_turnover || lastRFA.turnover_amount || 0) : 0;
    const effectiveRate = turnover > 0 ? (rfaAmount / turnover) * 100 : 0;
    const html = `
      <h2>État du contrat ${contract.contract_name}</h2>
      <p><strong>Client :</strong> ${contract.client_name || contract.client_id}</p>
      <p><strong>Période :</strong> ${contract.start_date} → ${contract.end_date || 'Sans fin'}</p>
      <p><strong>Type :</strong> ${contract.contract_type}</p>
      <p><strong>Dernier calcul RFA :</strong> ${rfaAmount.toFixed(2)} ${contract.currency} (${effectiveRate.toFixed(2)}%)</p>
      <p><strong>Devise :</strong> ${contract.currency}</p>
    `;
    await emailService.sendEmail(enterpriseId, {
      to: recipientEmail,
      subject: `État du contrat ${contract.contract_name}`,
      html,
      text: `État du contrat ${contract.contract_name}\nDernier RFA: ${rfaAmount.toFixed(2)} ${contract.currency} (${effectiveRate.toFixed(2)}%)`
    });
    return { data: true, success: true };
  } catch (error) {
    logger.error('ContractsServiceImplementations', 'Error sending contract summary email:', error);
    return { data: false, error: { message: String(error) }, success: false };
  }
}
/**
 * Get contracts dashboard data
 */
export async function getDashboardData(enterpriseId: string): Promise<ContractServiceResponse<ContractsDashboardData>> {
  try {
    // Get all contracts
    const { data: contracts } = await supabase
      .from('contracts')
      .select('*')
      .eq('company_id', enterpriseId);
    // Get RFA calculations for this year with related data
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const { data: rfaCalcs } = await supabase
      .from('rfa_calculations')
      .select(`
        *,
        contract:contracts(id, contract_name, client_id, currency, client:customers(name))
      `)
      .eq('company_id', enterpriseId)
      .gte('period_start', yearStart)
      .order('created_at', { ascending: false });
    // Calculate stats (using real column names)
    const totalRFAPending = rfaCalcs?.filter(r => r.status === 'calculated' || r.status === 'pending').reduce((sum, r) => sum + Number(r.discount_amount ?? r.rfa_amount ?? 0), 0) || 0;
    const totalRFAPaid = rfaCalcs?.filter(r => r.status === 'validated' || r.status === 'paid').reduce((sum, r) => sum + Number(r.discount_amount ?? r.rfa_amount ?? 0), 0) || 0;
    const totalTurnover = rfaCalcs?.reduce((sum, r) => sum + Number(r.total_turnover ?? r.turnover_amount ?? 0), 0) || 0;
    const averageRFARate = totalTurnover > 0 ? (totalRFAPending + totalRFAPaid) / totalTurnover : 0;
    // Get top clients by RFA
    const clientRFAMap = new Map<string, { name: string; totalRFA: number; totalTurnover: number; count: number; currency: string }>();
    rfaCalcs?.forEach(rfa => {
      const contract = rfa.contract as any;
      const clientId = contract?.client_id;
      const clientName = contract?.client?.name || 'Client inconnu';
      const currency = contract?.currency || 'EUR';
      if (clientId) {
        const existing = clientRFAMap.get(clientId) || { name: clientName, totalRFA: 0, totalTurnover: 0, count: 0, currency };
        existing.totalRFA += Number(rfa.discount_amount ?? rfa.rfa_amount ?? 0) || 0;
        existing.totalTurnover += Number(rfa.total_turnover ?? rfa.turnover_amount ?? 0) || 0;
        existing.count += 1;
        clientRFAMap.set(clientId, existing);
      }
    });
    const topClients = Array.from(clientRFAMap.entries())
      .map(([client_id, data]) => ({
        client_id,
        client_name: data.name,
        total_rfa: data.totalRFA,
        total_turnover: data.totalTurnover,
        contracts_count: data.count,
        average_rate: data.totalTurnover > 0 ? data.totalRFA / data.totalTurnover : 0,
        currency: data.currency
      }))
      .sort((a, b) => b.total_rfa - a.total_rfa)
      .slice(0, 5);
    // Get recent calculations
    const recentCalculations = (rfaCalcs || []).slice(0, 5).map(r => {
      const contract = r.contract as any;
      return {
        id: r.id,
        contract_id: r.contract_id,
        enterprise_id: enterpriseId,
        client_id: contract?.client_id || '',
        contract_name: contract?.contract_name || 'Contrat inconnu',
        client_name: contract?.client?.name || 'Client inconnu',
        period_start: r.period_start,
        period_end: r.period_end,
        turnover_amount: Number(r.total_turnover ?? r.turnover_amount) || 0,
        rfa_amount: Number(r.discount_amount ?? r.rfa_amount) || 0,
        tier_reached: 0,
        calculation_details: r.calculation_details || {
          type: contract?.rfa_calculation_type || 'progressive',
          applied_rate: Number(r.rfa_percentage) ? Number(r.rfa_percentage) / 100 : 0
        },
        status: r.status as any,
        currency: r.currency || contract?.currency || 'EUR',
        created_at: r.created_at || new Date().toISOString(),
        updated_at: r.updated_at || r.created_at || new Date().toISOString()
      };
    });
    // Generate alerts for contracts expiring soon
    const alerts = (contracts || [])
      .filter(c => {
        if (c.status !== 'active' || !c.end_date) return false;
        const endDate = new Date(c.end_date);
        const in60Days = new Date();
        in60Days.setDate(in60Days.getDate() + 60);
        return endDate <= in60Days;
      })
      .map(c => {
        const endDate = new Date(c.end_date);
        const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: c.id,
          contract_id: c.id,
          client_name: 'Client',
          type: 'expiring_contract' as const,
          message: `Le contrat "${c.contract_name}" expire dans ${daysLeft} jours`,
          priority: daysLeft < 30 ? ('high' as const) : ('medium' as const),
          created_at: new Date().toISOString()
        };
      });
    // Get upcoming renewals (contracts expiring in next 90 days)
    const upcomingRenewals = (contracts || [])
      .filter(c => {
        if (c.status !== 'active' || !c.end_date) return false;
        const endDate = new Date(c.end_date);
        const in90Days = new Date();
        in90Days.setDate(in90Days.getDate() + 90);
        return endDate <= in90Days;
      })
      .slice(0, 10);
    const dashboardData: ContractsDashboardData = {
      stats: {
        total_contracts: contracts?.length || 0,
        active_contracts: contracts?.filter(c => c.status === 'active').length || 0,
        expired_contracts: contracts?.filter(c => c.status === 'expired').length || 0,
        total_rfa_pending: totalRFAPending,
        total_rfa_paid: totalRFAPaid,
        average_rfa_rate: averageRFARate,
        clients_with_contracts: new Set(contracts?.map(c => c.client_id)).size
      },
      recent_calculations: recentCalculations,
      monthly_rfa: [], // Could be calculated from RFA data grouped by month
      top_clients: topClients,
      alerts: alerts as any,
      upcoming_renewals: upcomingRenewals.map(c => ({
        id: c.id,
        enterprise_id: c.company_id,
        client_id: c.client_id,
        client_name: 'Client',
        contract_name: c.contract_name,
        contract_type: c.contract_type as any,
        discount_config: c.discount_config as any,
        start_date: c.start_date,
        end_date: c.end_date,
        status: c.status as any,
        currency: c.currency || 'EUR',
        notes: c.notes,
        created_at: c.created_at,
        updated_at: c.updated_at
      }))
    };
    return { data: dashboardData, success: true };
  } catch (error) {
    logger.error('ContractsServiceImplementations', 'Error fetching dashboard data:', error);
    return {
      data: {
        stats: {
          total_contracts: 0,
          active_contracts: 0,
          expired_contracts: 0,
          total_rfa_pending: 0,
          total_rfa_paid: 0,
          average_rfa_rate: 0,
          clients_with_contracts: 0
        },
        recent_calculations: [],
        monthly_rfa: [],
        top_clients: [],
        alerts: [],
        upcoming_renewals: []
      },
      error: { message: String(error) },
      success: false
    };
  }
}
/**
 * Export contracts to CSV
 */
export async function exportContractsToCSV(
  enterpriseId: string,
  filters?: ContractFilters
): Promise<ContractServiceResponse<string>> {
  try {
    const { data: contracts } = await getContracts(enterpriseId, filters);
    const headers = [
      'Nom du contrat',
      'Client',
      'Type',
      'Date début',
      'Date fin',
      'Statut',
      'Devise'
    ];
    const csvData = [
      headers.join(','),
      ...(contracts ?? []).map(c => [
        `"${c.contract_name}"`,
        `"${c.client_name}"`,
        c.contract_type,
        c.start_date,
        c.end_date,
        c.status,
        c.currency
      ].join(','))
    ].join('\n');
    return { data: csvData, success: true };
  } catch (error) {
    logger.error('ContractsServiceImplementations', 'Error exporting contracts:', error);
    return { data: '', error: { message: String(error) }, success: false };
  }
}