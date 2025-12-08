/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

/**
 * Types pour le module de gestion des immobilisations
 */

// ============================================================================
// ENUMS
// ============================================================================

export type DepreciationMethod = 'linear' | 'declining_balance' | 'units_of_production';

export type AssetStatus = 'active' | 'fully_depreciated' | 'disposed' | 'under_maintenance';

export type DisposalMethod = 'sale' | 'scrap' | 'donation';

// ============================================================================
// INTERFACES - DATABASE ENTITIES
// ============================================================================

/**
 * Catégorie d'immobilisation avec paramètres d'amortissement par défaut
 */
export interface AssetCategory {
  id: string;
  company_id: string;
  name: string;
  code?: string; // Code comptable (ex: "2183" pour matériel de bureau)
  description?: string;

  // Comptes comptables par défaut
  account_asset?: string; // Compte d'immobilisation
  account_depreciation?: string; // Compte d'amortissement cumulé
  account_expense?: string; // Compte de dotation aux amortissements

  // Paramètres d'amortissement par défaut
  default_depreciation_method: DepreciationMethod;
  default_duration_years: number;
  default_declining_rate?: number; // Coefficient dégressif (1.25, 1.75, 2.25)
  default_residual_value?: number; // Valeur résiduelle

  // Métadonnées
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

/**
 * Immobilisation
 */
export interface Asset {
  id: string;
  company_id: string;
  category_id?: string;

  // Identification
  asset_number?: string; // Numéro d'inventaire
  name: string;
  description?: string;
  serial_number?: string; // Numéro de série fabricant

  // Acquisition
  acquisition_date: string; // Format: YYYY-MM-DD
  acquisition_value: number; // Valeur HT
  supplier_id?: string;
  invoice_reference?: string;

  // Localisation
  location?: string; // Localisation physique
  responsible_person?: string; // Personne responsable

  // Amortissement
  depreciation_method: DepreciationMethod;
  depreciation_start_date: string; // Format: YYYY-MM-DD
  duration_years: number;
  declining_rate?: number; // Pour méthode dégressif
  residual_value: number;

  // Calculs (automatiques)
  total_depreciation: number; // Amortissements cumulés
  net_book_value: number; // VNC = acquisition_value - total_depreciation
  last_depreciation_date?: string; // Format: YYYY-MM-DD

  // Statut
  status: AssetStatus;
  disposal_date?: string; // Format: YYYY-MM-DD
  disposal_value?: number;
  disposal_method?: DisposalMethod;

  // Comptes comptables (override catégorie si besoin)
  account_asset?: string;
  account_depreciation?: string;
  account_expense?: string;

  // Unités d'œuvre (pour méthode units_of_production)
  total_units?: number; // Total estimé sur durée de vie
  units_consumed?: number; // Unités consommées

  // Métadonnées
  notes?: string;
  attachments?: AssetAttachment[]; // Documents joints
  created_at: string;
  updated_at: string;
  created_by?: string;

  // Relations (jointures)
  category?: AssetCategory;
  supplier?: {
    id: string;
    name: string;
  };
}

/**
 * Ligne du plan d'amortissement
 */
export interface AssetDepreciationScheduleLine {
  id: string;
  asset_id: string;
  company_id: string;

  // Période
  period_start_date: string; // Format: YYYY-MM-DD
  period_end_date: string; // Format: YYYY-MM-DD
  fiscal_year: number; // Exercice comptable
  period_number: number; // Numéro de période (1-12 pour mensuel)

  // Calculs
  opening_net_book_value: number; // VNC début
  depreciation_amount: number; // Dotation de la période
  cumulative_depreciation: number; // Amortissements cumulés
  closing_net_book_value: number; // VNC fin

  // Prorata temporis
  prorata_days?: number; // Nombre de jours pour prorata
  prorata_factor?: number; // Coefficient (0.0 à 1.0)

  // Statut comptable
  is_posted: boolean; // Écriture passée ?
  journal_entry_id?: string; // Lien vers écriture
  posted_date?: string;

  // Métadonnées
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Document joint à une immobilisation
 */
export interface AssetAttachment {
  id: string;
  name: string;
  url: string;
  type: 'invoice' | 'photo' | 'manual' | 'other';
  uploaded_at: string;
}

// ============================================================================
// FORM DATA TYPES
// ============================================================================

/**
 * Données du formulaire de catégorie d'immobilisation
 */
export interface AssetCategoryFormData {
  name: string;
  code?: string;
  description?: string;
  account_asset?: string;
  account_depreciation?: string;
  account_expense?: string;
  default_depreciation_method: DepreciationMethod;
  default_duration_years: number;
  default_declining_rate?: number;
  default_residual_value?: number;
}

/**
 * Données du formulaire d'immobilisation
 */
export interface AssetFormData {
  category_id?: string;
  asset_number?: string;
  name: string;
  description?: string;
  serial_number?: string;

  // Acquisition
  acquisition_date: string;
  acquisition_value: number;
  supplier_id?: string;
  invoice_reference?: string;

  // Localisation
  location?: string;
  responsible_person?: string;

  // Amortissement
  depreciation_method: DepreciationMethod;
  depreciation_start_date: string;
  duration_years: number;
  declining_rate?: number;
  residual_value: number;

  // Comptes (optionnels)
  account_asset?: string;
  account_depreciation?: string;
  account_expense?: string;

  // Unités d'œuvre
  total_units?: number;

  // Métadonnées
  notes?: string;
  attachments?: File[]; // Fichiers à uploader
}

/**
 * Données du formulaire de cession d'immobilisation
 */
export interface AssetDisposalFormData {
  disposal_date: string;
  disposal_value: number;
  disposal_method: DisposalMethod;
  notes?: string;
}

// ============================================================================
// CALCULATION TYPES
// ============================================================================

/**
 * Paramètres pour le calcul d'amortissement
 */
export interface DepreciationCalculationParams {
  acquisition_value: number;
  residual_value: number;
  depreciation_method: DepreciationMethod;
  duration_years: number;
  depreciation_start_date: string; // Format: YYYY-MM-DD
  declining_rate?: number; // Pour dégressif
  total_units?: number; // Pour unités d'œuvre
  fiscal_year_end_month?: number; // Mois de clôture (1-12, défaut: 12)
}

/**
 * Résultat du calcul d'une ligne d'amortissement
 */
export interface DepreciationCalculationResult {
  period_start_date: string;
  period_end_date: string;
  fiscal_year: number;
  period_number: number;
  opening_net_book_value: number;
  depreciation_amount: number;
  cumulative_depreciation: number;
  closing_net_book_value: number;
  prorata_days?: number;
  prorata_factor?: number;
}

/**
 * Plan d'amortissement complet
 */
export interface DepreciationSchedule {
  asset_id: string;
  lines: DepreciationCalculationResult[];
  total_depreciation: number;
  final_net_book_value: number;
}

// ============================================================================
// STATISTICS & DASHBOARD TYPES
// ============================================================================

/**
 * Statistiques des immobilisations pour le dashboard
 */
export interface AssetStatistics {
  total_assets: number; // Nombre total d'immobilisations
  total_acquisition_value: number; // Valeur brute totale
  total_depreciation: number; // Amortissements cumulés totaux
  total_net_book_value: number; // VNC totale

  // Par statut
  active_assets: number;
  fully_depreciated_assets: number;
  disposed_assets: number;
  under_maintenance_assets: number;

  // Par catégorie
  by_category: Array<{
    category_id: string;
    category_name: string;
    count: number;
    acquisition_value: number;
    net_book_value: number;
  }>;

  // Amortissement de l'exercice
  current_year_depreciation: number;
  pending_depreciation_entries: number; // Écritures non passées
}

/**
 * Résumé pour un actif dans la liste
 */
export interface AssetListItem {
  id: string;
  asset_number?: string;
  name: string;
  category_name?: string;
  acquisition_date: string;
  acquisition_value: number;
  net_book_value: number;
  status: AssetStatus;
  depreciation_method: DepreciationMethod;
  location?: string;
}

/**
 * Filtres pour la liste des immobilisations
 */
export interface AssetFilters {
  search?: string; // Recherche par nom, numéro, etc.
  category_id?: string;
  status?: AssetStatus | 'all';
  depreciation_method?: DepreciationMethod | 'all';
  acquisition_date_from?: string;
  acquisition_date_to?: string;
  location?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Réponse de l'API pour une liste d'immobilisations
 */
export interface AssetsListResponse {
  data: AssetListItem[];
  total: number;
  page: number;
  per_page: number;
}

/**
 * Réponse de l'API pour le détail d'une immobilisation
 */
export interface AssetDetailResponse {
  asset: Asset;
  depreciation_schedule: AssetDepreciationScheduleLine[];
  statistics: {
    months_depreciated: number;
    months_remaining: number;
    depreciation_percentage: number;
  };
}

/**
 * Réponse pour la génération d'écritures d'amortissement
 */
export interface GenerateDepreciationEntriesResponse {
  success: boolean;
  entries_created: number;
  total_amount: number;
  period_start: string;
  period_end: string;
  journal_entry_ids: string[];
  errors?: Array<{
    asset_id: string;
    asset_name: string;
    error_message: string;
  }>;
}

// ============================================================================
// EXPORT DEFAULT - REMOVED
// ============================================================================
// All types are already exported individually above.
// Default export removed to fix TypeScript errors:
// "Type only refers to a type, but is being used as a value here"
