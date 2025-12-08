/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

/**
 * Service de gestion des immobilisations et calcul d'amortissements
 * Support: PCG français + SYSCOHADA
 */

import { supabase } from '@/lib/supabase';
import type {
  Asset,
  AssetCategory,
  AssetFormData,
  AssetCategoryFormData,
  AssetDepreciationScheduleLine,
  DepreciationCalculationParams,
  DepreciationCalculationResult,
  DepreciationSchedule,
  AssetStatistics,
  AssetFilters,
  AssetListItem,
  AssetDisposalFormData,
  GenerateDepreciationEntriesResponse,
} from '@/types/assets.types';

// ============================================================================
// CATEGORIES
// ============================================================================

/**
 * Récupérer toutes les catégories d'immobilisations d'une entreprise
 */
export const getAssetCategories = async (companyId: string): Promise<AssetCategory[]> => {
  const { data, error } = await supabase
    .from('asset_categories')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
};

/**
 * Créer une catégorie d'immobilisation
 */
export const createAssetCategory = async (
  companyId: string,
  categoryData: AssetCategoryFormData
): Promise<AssetCategory> => {
  const { data: user } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('asset_categories')
    .insert({
      company_id: companyId,
      created_by: user.user?.id,
      ...categoryData,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Mettre à jour une catégorie d'immobilisation
 */
export const updateAssetCategory = async (
  categoryId: string,
  categoryData: Partial<AssetCategoryFormData>
): Promise<AssetCategory> => {
  const { data, error } = await supabase
    .from('asset_categories')
    .update(categoryData)
    .eq('id', categoryId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Supprimer (désactiver) une catégorie d'immobilisation
 */
export const deleteAssetCategory = async (categoryId: string): Promise<void> => {
  const { error } = await supabase
    .from('asset_categories')
    .update({ is_active: false })
    .eq('id', categoryId);

  if (error) throw error;
};

// ============================================================================
// ASSETS
// ============================================================================

/**
 * Récupérer les immobilisations avec filtres
 */
export const getAssets = async (
  companyId: string,
  filters?: AssetFilters
): Promise<AssetListItem[]> => {
  let query = supabase
    .from('assets')
    .select(`
      id,
      asset_number,
      name,
      acquisition_date,
      acquisition_value,
      net_book_value,
      status,
      depreciation_method,
      location,
      category:asset_categories(id, name)
    `)
    .eq('company_id', companyId);

  // Appliquer les filtres
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,asset_number.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id);
  }

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters?.depreciation_method && filters.depreciation_method !== 'all') {
    query = query.eq('depreciation_method', filters.depreciation_method);
  }

  if (filters?.acquisition_date_from) {
    query = query.gte('acquisition_date', filters.acquisition_date_from);
  }

  if (filters?.acquisition_date_to) {
    query = query.lte('acquisition_date', filters.acquisition_date_to);
  }

  if (filters?.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }

  query = query.order('acquisition_date', { ascending: false });

  const { data, error } = await query;

  if (error) throw error;

  // Transformer les données pour le format de liste
  return (data || []).map((asset: any) => ({
    id: asset.id,
    asset_number: asset.asset_number,
    name: asset.name,
    category_name: asset.category?.name,
    acquisition_date: asset.acquisition_date,
    acquisition_value: asset.acquisition_value,
    net_book_value: asset.net_book_value,
    status: asset.status,
    depreciation_method: asset.depreciation_method,
    location: asset.location,
  }));
};

/**
 * Récupérer une immobilisation par ID avec tous les détails
 */
export const getAssetById = async (assetId: string): Promise<Asset> => {
  const { data, error } = await supabase
    .from('assets')
    .select(`
      *,
      category:asset_categories(*),
      supplier:third_parties(id, name)
    `)
    .eq('id', assetId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Créer une immobilisation
 */
export const createAsset = async (
  companyId: string,
  assetData: AssetFormData
): Promise<Asset> => {
  const { data: user } = await supabase.auth.getUser();

  // Calculer la VNC initiale
  const netBookValue = assetData.acquisition_value - (assetData.residual_value || 0);

  const { data, error } = await supabase
    .from('assets')
    .insert({
      company_id: companyId,
      created_by: user.user?.id,
      ...assetData,
      total_depreciation: 0,
      net_book_value: netBookValue,
      status: 'active',
    })
    .select()
    .single();

  if (error) throw error;

  // Générer le plan d'amortissement
  await generateDepreciationSchedule(data.id);

  return data;
};

/**
 * Mettre à jour une immobilisation
 */
export const updateAsset = async (
  assetId: string,
  assetData: Partial<AssetFormData>
): Promise<Asset> => {
  const { data, error } = await supabase
    .from('assets')
    .update(assetData)
    .eq('id', assetId)
    .select()
    .single();

  if (error) throw error;

  // Regénérer le plan d'amortissement si paramètres modifiés
  if (
    assetData.depreciation_method ||
    assetData.duration_years ||
    assetData.depreciation_start_date ||
    assetData.declining_rate ||
    assetData.residual_value
  ) {
    await generateDepreciationSchedule(assetId);
  }

  return data;
};

/**
 * Céder/Mettre au rebut une immobilisation
 */
export const disposeAsset = async (
  assetId: string,
  disposalData: AssetDisposalFormData
): Promise<Asset> => {
  const { data, error } = await supabase
    .from('assets')
    .update({
      status: 'disposed',
      disposal_date: disposalData.disposal_date,
      disposal_value: disposalData.disposal_value,
      disposal_method: disposalData.disposal_method,
      notes: disposalData.notes,
    })
    .eq('id', assetId)
    .select()
    .single();

  if (error) throw error;

  // TODO: Générer l'écriture de cession (plus-value/moins-value)

  return data;
};

/**
 * Supprimer une immobilisation
 */
export const deleteAsset = async (assetId: string): Promise<void> => {
  // Supprimer le plan d'amortissement d'abord
  await supabase
    .from('asset_depreciation_schedule')
    .delete()
    .eq('asset_id', assetId);

  // Puis supprimer l'immobilisation
  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', assetId);

  if (error) throw error;
};

// ============================================================================
// DEPRECIATION CALCULATIONS
// ============================================================================

/**
 * Calculer l'amortissement linéaire avec prorata temporis
 */
const calculateLinearDepreciation = (
  params: DepreciationCalculationParams
): DepreciationCalculationResult[] => {
  const results: DepreciationCalculationResult[] = [];
  const depreciableAmount = params.acquisition_value - params.residual_value;
  const annualDepreciation = depreciableAmount / params.duration_years;

  const startDate = new Date(params.depreciation_start_date);
  const fiscalYearEndMonth = params.fiscal_year_end_month || 12; // Décembre par défaut

  let cumulativeDepreciation = 0;
  let currentYear = startDate.getFullYear();

  // Première année - Prorata temporis
  const firstYearEndDate = new Date(currentYear, fiscalYearEndMonth - 1, 31);
  const daysInFirstYear = Math.ceil((firstYearEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const daysInYear = isLeapYear(currentYear) ? 366 : 365;
  const firstYearProrata = daysInFirstYear / daysInYear;
  const firstYearDepreciation = annualDepreciation * firstYearProrata;

  results.push({
    period_start_date: params.depreciation_start_date,
    period_end_date: formatDate(firstYearEndDate),
    fiscal_year: currentYear,
    period_number: 1,
    opening_net_book_value: depreciableAmount,
    depreciation_amount: firstYearDepreciation,
    cumulative_depreciation: firstYearDepreciation,
    closing_net_book_value: depreciableAmount - firstYearDepreciation,
    prorata_days: daysInFirstYear,
    prorata_factor: firstYearProrata,
  });

  cumulativeDepreciation = firstYearDepreciation;
  currentYear++;

  // Années complètes
  let periodNumber = 2;
  while (cumulativeDepreciation < depreciableAmount) {
    const periodStartDate = new Date(currentYear, fiscalYearEndMonth - 12, 1);
    const periodEndDate = new Date(currentYear, fiscalYearEndMonth - 1, 31);

    const openingNBV = depreciableAmount - cumulativeDepreciation;
    let depreciation = annualDepreciation;

    // Dernière période - ajuster pour ne pas dépasser
    if (cumulativeDepreciation + depreciation > depreciableAmount) {
      depreciation = depreciableAmount - cumulativeDepreciation;
    }

    cumulativeDepreciation += depreciation;
    const closingNBV = depreciableAmount - cumulativeDepreciation;

    results.push({
      period_start_date: formatDate(periodStartDate),
      period_end_date: formatDate(periodEndDate),
      fiscal_year: currentYear,
      period_number: periodNumber,
      opening_net_book_value: openingNBV,
      depreciation_amount: depreciation,
      cumulative_depreciation: cumulativeDepreciation,
      closing_net_book_value: closingNBV,
    });

    currentYear++;
    periodNumber++;

    // Sécurité: limite à 50 ans
    if (periodNumber > 50) break;
  }

  return results;
};

/**
 * Calculer l'amortissement dégressif (fiscal français) avec prorata temporis
 */
const calculateDecliningBalanceDepreciation = (
  params: DepreciationCalculationParams
): DepreciationCalculationResult[] => {
  const results: DepreciationCalculationResult[] = [];
  const depreciableAmount = params.acquisition_value - params.residual_value;
  const decliningRate = params.declining_rate || 1.25; // Par défaut 1.25
  const linearRate = 1 / params.duration_years;
  const fiscalRate = linearRate * decliningRate;

  const startDate = new Date(params.depreciation_start_date);
  const fiscalYearEndMonth = params.fiscal_year_end_month || 12;

  let cumulativeDepreciation = 0;
  let currentYear = startDate.getFullYear();
  let remainingYears = params.duration_years;

  // Première année - Prorata temporis
  const firstYearEndDate = new Date(currentYear, fiscalYearEndMonth - 1, 31);
  const daysInFirstYear = Math.ceil((firstYearEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const daysInYear = isLeapYear(currentYear) ? 366 : 365;
  const firstYearProrata = daysInFirstYear / daysInYear;

  const firstYearDepreciation = depreciableAmount * fiscalRate * firstYearProrata;

  results.push({
    period_start_date: params.depreciation_start_date,
    period_end_date: formatDate(firstYearEndDate),
    fiscal_year: currentYear,
    period_number: 1,
    opening_net_book_value: depreciableAmount,
    depreciation_amount: firstYearDepreciation,
    cumulative_depreciation: firstYearDepreciation,
    closing_net_book_value: depreciableAmount - firstYearDepreciation,
    prorata_days: daysInFirstYear,
    prorata_factor: firstYearProrata,
  });

  cumulativeDepreciation = firstYearDepreciation;
  currentYear++;
  remainingYears -= firstYearProrata;

  // Années suivantes
  let periodNumber = 2;
  while (cumulativeDepreciation < depreciableAmount && remainingYears > 0) {
    const periodStartDate = new Date(currentYear, fiscalYearEndMonth - 12, 1);
    const periodEndDate = new Date(currentYear, fiscalYearEndMonth - 1, 31);

    const openingNBV = depreciableAmount - cumulativeDepreciation;

    // Comparer dégressif vs linéaire restant
    const decliningDepreciation = openingNBV * fiscalRate;
    const linearDepreciationRemaining = openingNBV / remainingYears;

    // Prendre le plus élevé (basculement vers linéaire)
    let depreciation = Math.max(decliningDepreciation, linearDepreciationRemaining);

    // Dernière période - ajuster pour ne pas dépasser
    if (cumulativeDepreciation + depreciation > depreciableAmount) {
      depreciation = depreciableAmount - cumulativeDepreciation;
    }

    cumulativeDepreciation += depreciation;
    const closingNBV = depreciableAmount - cumulativeDepreciation;

    results.push({
      period_start_date: formatDate(periodStartDate),
      period_end_date: formatDate(periodEndDate),
      fiscal_year: currentYear,
      period_number: periodNumber,
      opening_net_book_value: openingNBV,
      depreciation_amount: depreciation,
      cumulative_depreciation: cumulativeDepreciation,
      closing_net_book_value: closingNBV,
    });

    currentYear++;
    periodNumber++;
    remainingYears--;

    // Sécurité: limite à 50 ans
    if (periodNumber > 50) break;
  }

  return results;
};

/**
 * Calculer l'amortissement par unités d'œuvre
 */
const calculateUnitsOfProductionDepreciation = (
  params: DepreciationCalculationParams,
  unitsPerPeriod: number[]
): DepreciationCalculationResult[] => {
  const results: DepreciationCalculationResult[] = [];
  const depreciableAmount = params.acquisition_value - params.residual_value;
  const totalUnits = params.total_units || 1;
  const unitRate = depreciableAmount / totalUnits;

  const startDate = new Date(params.depreciation_start_date);
  const fiscalYearEndMonth = params.fiscal_year_end_month || 12;

  let cumulativeDepreciation = 0;
  let currentYear = startDate.getFullYear();

  unitsPerPeriod.forEach((units, index) => {
    const periodStartDate = index === 0
      ? startDate
      : new Date(currentYear, fiscalYearEndMonth - 12, 1);
    const periodEndDate = new Date(currentYear, fiscalYearEndMonth - 1, 31);

    const openingNBV = depreciableAmount - cumulativeDepreciation;
    let depreciation = units * unitRate;

    // Ne pas dépasser le montant amortissable
    if (cumulativeDepreciation + depreciation > depreciableAmount) {
      depreciation = depreciableAmount - cumulativeDepreciation;
    }

    cumulativeDepreciation += depreciation;
    const closingNBV = depreciableAmount - cumulativeDepreciation;

    results.push({
      period_start_date: formatDate(periodStartDate),
      period_end_date: formatDate(periodEndDate),
      fiscal_year: currentYear,
      period_number: index + 1,
      opening_net_book_value: openingNBV,
      depreciation_amount: depreciation,
      cumulative_depreciation: cumulativeDepreciation,
      closing_net_book_value: closingNBV,
    });

    currentYear++;
  });

  return results;
};

/**
 * Générer le plan d'amortissement complet pour une immobilisation
 */
export const generateDepreciationSchedule = async (assetId: string): Promise<void> => {
  // Récupérer l'immobilisation
  const asset = await getAssetById(assetId);

  const params: DepreciationCalculationParams = {
    acquisition_value: asset.acquisition_value,
    residual_value: asset.residual_value,
    depreciation_method: asset.depreciation_method,
    duration_years: asset.duration_years,
    depreciation_start_date: asset.depreciation_start_date,
    declining_rate: asset.declining_rate,
    total_units: asset.total_units,
  };

  let schedule: DepreciationCalculationResult[];

  switch (asset.depreciation_method) {
    case 'linear':
      schedule = calculateLinearDepreciation(params);
      break;
    case 'declining_balance':
      schedule = calculateDecliningBalanceDepreciation(params);
      break;
    case 'units_of_production':
      // Pour unités d'œuvre, on crée un plan simplifié
      // Les unités réelles seront saisies ultérieurement
      schedule = [];
      break;
    default:
      throw new Error(`Méthode d'amortissement non supportée: ${asset.depreciation_method}`);
  }

  // Supprimer l'ancien plan
  await supabase
    .from('asset_depreciation_schedule')
    .delete()
    .eq('asset_id', assetId);

  // Insérer le nouveau plan
  if (schedule.length > 0) {
    const lines = schedule.map((line) => ({
      asset_id: assetId,
      company_id: asset.company_id,
      ...line,
      is_posted: false,
    }));

    const { error } = await supabase
      .from('asset_depreciation_schedule')
      .insert(lines);

    if (error) throw error;
  }
};

/**
 * Récupérer le plan d'amortissement d'une immobilisation
 */
export const getDepreciationSchedule = async (
  assetId: string
): Promise<AssetDepreciationScheduleLine[]> => {
  const { data, error } = await supabase
    .from('asset_depreciation_schedule')
    .select('*')
    .eq('asset_id', assetId)
    .order('period_start_date');

  if (error) throw error;
  return data || [];
};

/**
 * Générer les écritures comptables d'amortissement pour une période
 */
export const generateDepreciationEntries = async (
  companyId: string,
  fiscalYear: number,
  periodNumber?: number
): Promise<GenerateDepreciationEntriesResponse> => {
  // Récupérer toutes les lignes non passées pour la période
  let query = supabase
    .from('asset_depreciation_schedule')
    .select(`
      *,
      asset:assets(*)
    `)
    .eq('company_id', companyId)
    .eq('fiscal_year', fiscalYear)
    .eq('is_posted', false);

  if (periodNumber) {
    query = query.eq('period_number', periodNumber);
  }

  const { data: lines, error } = await query;

  if (error) throw error;

  const journalEntryIds: string[] = [];
  const errors: Array<{ asset_id: string; asset_name: string; error_message: string }> = [];
  let totalAmount = 0;

  // Générer une écriture pour chaque ligne
  for (const line of lines || []) {
    try {
      const asset = line.asset;

      // Créer l'écriture de dotation aux amortissements
      const { data: journalEntry, error: entryError } = await supabase
        .from('journal_entries')
        .insert({
          company_id: companyId,
          entry_date: line.period_end_date,
          journal_code: 'OD', // Opérations Diverses
          reference: `AMORT-${asset.asset_number || asset.id.slice(0, 8)}`,
          description: `Dotation aux amortissements - ${asset.name}`,
          lines: [
            {
              account_number: asset.account_expense || asset.category?.account_expense || '68112',
              label: `Dotation amortissement ${asset.name}`,
              debit: line.depreciation_amount,
              credit: 0,
            },
            {
              account_number: asset.account_depreciation || asset.category?.account_depreciation || '28',
              label: `Amortissement ${asset.name}`,
              debit: 0,
              credit: line.depreciation_amount,
            },
          ],
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // Marquer la ligne comme passée
      await supabase
        .from('asset_depreciation_schedule')
        .update({
          is_posted: true,
          journal_entry_id: journalEntry.id,
          posted_date: new Date().toISOString(),
        })
        .eq('id', line.id);

      // Mettre à jour l'immobilisation
      await supabase
        .from('assets')
        .update({
          total_depreciation: line.cumulative_depreciation,
          net_book_value: line.closing_net_book_value,
          last_depreciation_date: line.period_end_date,
        })
        .eq('id', asset.id);

      journalEntryIds.push(journalEntry.id);
      totalAmount += line.depreciation_amount;
    } catch (err: any) {
      errors.push({
        asset_id: line.asset.id,
        asset_name: line.asset.name,
        error_message: err.message,
      });
    }
  }

  return {
    success: errors.length === 0,
    entries_created: journalEntryIds.length,
    total_amount: totalAmount,
    period_start: lines?.[0]?.period_start_date || '',
    period_end: lines?.[0]?.period_end_date || '',
    journal_entry_ids: journalEntryIds,
    errors: errors.length > 0 ? errors : undefined,
  };
};

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Récupérer les statistiques des immobilisations
 */
export const getAssetStatistics = async (companyId: string): Promise<AssetStatistics> => {
  // Récupérer tous les actifs
  const { data: assets, error } = await supabase
    .from('assets')
    .select(`
      *,
      category:asset_categories(id, name)
    `)
    .eq('company_id', companyId);

  if (error) throw error;

  const currentYear = new Date().getFullYear();

  // Calculer les statistiques
  const stats: AssetStatistics = {
    total_assets: assets?.length || 0,
    total_acquisition_value: 0,
    total_depreciation: 0,
    total_net_book_value: 0,
    active_assets: 0,
    fully_depreciated_assets: 0,
    disposed_assets: 0,
    under_maintenance_assets: 0,
    by_category: [],
    current_year_depreciation: 0,
    pending_depreciation_entries: 0,
  };

  // Agréger par catégorie
  const categoryMap = new Map<string, any>();

  assets?.forEach((asset: any) => {
    stats.total_acquisition_value += asset.acquisition_value;
    stats.total_depreciation += asset.total_depreciation;
    stats.total_net_book_value += asset.net_book_value;

    switch (asset.status) {
      case 'active':
        stats.active_assets++;
        break;
      case 'fully_depreciated':
        stats.fully_depreciated_assets++;
        break;
      case 'disposed':
        stats.disposed_assets++;
        break;
      case 'under_maintenance':
        stats.under_maintenance_assets++;
        break;
    }

    // Agréger par catégorie
    if (asset.category_id) {
      if (!categoryMap.has(asset.category_id)) {
        categoryMap.set(asset.category_id, {
          category_id: asset.category_id,
          category_name: asset.category?.name || 'Sans catégorie',
          count: 0,
          acquisition_value: 0,
          net_book_value: 0,
        });
      }

      const catStats = categoryMap.get(asset.category_id);
      catStats.count++;
      catStats.acquisition_value += asset.acquisition_value;
      catStats.net_book_value += asset.net_book_value;
    }
  });

  stats.by_category = Array.from(categoryMap.values());

  // Amortissement de l'exercice
  const { data: currentYearLines } = await supabase
    .from('asset_depreciation_schedule')
    .select('depreciation_amount')
    .eq('company_id', companyId)
    .eq('fiscal_year', currentYear);

  stats.current_year_depreciation = currentYearLines?.reduce(
    (sum, line) => sum + line.depreciation_amount,
    0
  ) || 0;

  // Écritures non passées
  const { data: pendingLines } = await supabase
    .from('asset_depreciation_schedule')
    .select('id')
    .eq('company_id', companyId)
    .eq('is_posted', false);

  stats.pending_depreciation_entries = pendingLines?.length || 0;

  return stats;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Vérifier si une année est bissextile
 */
const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

/**
 * Formater une date en YYYY-MM-DD
 */
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Categories
  getAssetCategories,
  createAssetCategory,
  updateAssetCategory,
  deleteAssetCategory,

  // Assets
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  disposeAsset,
  deleteAsset,

  // Depreciation
  generateDepreciationSchedule,
  getDepreciationSchedule,
  generateDepreciationEntries,

  // Statistics
  getAssetStatistics,
};
