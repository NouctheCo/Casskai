import { supabase } from '../lib/supabase';
import {
  ContractData,
  ContractFormData,
  ContractFilters,
  ContractsDashboardData,
  RFACalculation,
  RFAFormData,
  RFAFilters,
  ContractServiceResponse
} from '../types/contracts.types';

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
    console.error('Error fetching contracts:', error);
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
      return { data: null, error: { message: 'Contract not found' }, success: false };
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

    return { data: contract, success: true };
  } catch (error) {
    console.error('Error fetching contract:', error);
    return { data: null, error: { message: String(error) }, success: false };
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

    return { data: contract, success: true };
  } catch (error) {
    console.error('Error creating contract:', error);
    return { data: null, error: { message: String(error) }, success: false };
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
      return { data: null, error: { message: 'Contract not found' }, success: false };
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

    return { data: contract, success: true };
  } catch (error) {
    console.error('Error updating contract:', error);
    return { data: null, error: { message: String(error) }, success: false };
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
    console.error('Error deleting contract:', error);
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

    return { data: true, success: true };
  } catch (error) {
    console.error('Error archiving contract:', error);
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
      turnover_amount: Number(r.turnover_amount) || 0,
      rfa_amount: Number(r.rfa_amount) || 0,
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
    console.error('Error fetching RFA calculations:', error);
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
    console.error('Error creating RFA calculation:', error);
    return { data: null, error: { message: String(error) }, success: false };
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
    const totalRFAPending = rfaCalcs?.filter(r => r.status === 'calculated' || r.status === 'pending').reduce((sum, r) => sum + Number(r.rfa_amount), 0) || 0;
    const totalRFAPaid = rfaCalcs?.filter(r => r.status === 'validated' || r.status === 'paid').reduce((sum, r) => sum + Number(r.rfa_amount), 0) || 0;
    const totalTurnover = rfaCalcs?.reduce((sum, r) => sum + Number(r.turnover_amount), 0) || 0;
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
        existing.totalRFA += Number(rfa.rfa_amount) || 0;
        existing.totalTurnover += Number(rfa.turnover_amount) || 0;
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
        turnover_amount: Number(r.turnover_amount) || 0,
        rfa_amount: Number(r.rfa_amount) || 0,
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
    console.error('Error fetching dashboard data:', error);
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
      ...contracts.map(c => [
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
    console.error('Error exporting contracts:', error);
    return { data: '', error: { message: String(error) }, success: false };
  }
}
