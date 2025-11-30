/**
 * Service de gestion des immobilisations et amortissements automatiques
 */

import { supabase } from '../lib/supabase';
import { auditService } from './auditService';

interface FixedAsset {
  id?: string;
  company_id: string;
  asset_number?: string;
  name: string;
  description?: string;
  category: string;
  acquisition_cost: number;
  salvage_value: number;
  acquisition_date: string;
  start_depreciation_date: string;
  depreciation_method: 'linear' | 'declining_balance' | 'double_declining';
  useful_life_years: number;
  depreciation_rate?: number;
  asset_account_id: string;
  depreciation_account_id: string;
  expense_account_id: string;
}

/**
 * Générer les écritures d'amortissement pour toutes les immobilisations d'une période
 */
export async function generateDepreciationEntries(
  companyId: string,
  periodDate: string,
  autoPost: boolean = false
): Promise<{
  success: boolean;
  entries_created: number;
  total_depreciation: number;
  details: any[];
}> {
  try {
    const { data, error } = await supabase.rpc('generate_depreciation_entries', {
      p_company_id: companyId,
      p_period_date: periodDate,
      p_auto_post: autoPost,
    });

    if (error) throw error;

    if (!data.success) {
      throw new Error(data.error || 'Erreur génération amortissements');
    }

    await auditService.logAsync({
      action: 'generate_depreciation_entries',
      entityType: 'depreciation',
      entityId: companyId,
      metadata: {
        period_date: periodDate,
        entries_created: data.entries_created,
        total_depreciation: data.total_depreciation,
        auto_posted: autoPost,
      },
    });

    return data;
  } catch (error) {
    console.error('Erreur génération amortissements:', error);
    throw error;
  }
}

/**
 * Créer une immobilisation
 */
export async function createFixedAsset(asset: FixedAsset): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('fixed_assets')
      .insert(asset)
      .select()
      .single();

    if (error) throw error;

    await auditService.logAsync({
      action: 'create_fixed_asset',
      entityType: 'fixed_asset',
      entityId: data.id,
      metadata: { name: asset.name, cost: asset.acquisition_cost },
    });

    return data.id;
  } catch (error) {
    console.error('Erreur création immobilisation:', error);
    throw error;
  }
}

/**
 * Récupérer toutes les immobilisations
 */
export async function getFixedAssets(
  companyId: string,
  status?: string
): Promise<any[]> {
  try {
    let query = supabase
      .from('fixed_assets')
      .select('*')
      .eq('company_id', companyId)
      .order('acquisition_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Erreur récupération immobilisations:', error);
    return [];
  }
}

/**
 * Récupérer le plan d'amortissement d'une immobilisation
 */
export async function getDepreciationSchedule(assetId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('depreciation_schedules')
      .select('*')
      .eq('fixed_asset_id', assetId)
      .order('period_start', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Erreur récupération plan amortissement:', error);
    return [];
  }
}

export const depreciationService = {
  generateDepreciationEntries,
  createFixedAsset,
  getFixedAssets,
  getDepreciationSchedule,
};