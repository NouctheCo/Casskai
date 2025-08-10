/**
 * Types TypeScript pour le module de gestion des contrats clients et calcul RFA
 * Réutilise les patterns existants de l'application CassKai
 */

// Types de base pour les contrats
export interface ContractData {
  id: string;
  enterprise_id: string;
  client_id: string;
  client_name?: string; // Dénormalisé pour affichage
  contract_name: string;
  contract_type: ContractType;
  discount_config: DiscountConfig;
  start_date: string;
  end_date?: string;
  status: ContractStatus;
  currency: string;
  created_at: string;
  updated_at: string;
}

export type ContractType = 'progressive' | 'fixed_percent' | 'fixed_amount';
export type ContractStatus = 'active' | 'expired' | 'archived' | 'draft';

// Configuration flexible des remises
export interface DiscountConfig {
  type: ContractType;
  // Pour paliers progressifs
  tiers?: DiscountTier[];
  // Pour pourcentage fixe
  rate?: number;
  // Pour montant fixe
  amount?: number;
  // Paramètres additionnels
  currency?: string;
  conditions?: string;
}

export interface DiscountTier {
  id?: string;
  min: number;
  max: number | null; // null = illimité
  rate: number; // Pourcentage (0.01 = 1%)
  description?: string;
}

// Calculs RFA
export interface RFACalculation {
  id: string;
  contract_id: string;
  enterprise_id: string;
  client_id: string;
  client_name?: string;
  contract_name?: string;
  period_start: string;
  period_end: string;
  turnover_amount: number;
  rfa_amount: number;
  tier_reached?: number;
  calculation_details: RFACalculationDetails;
  status: RFAStatus;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface RFACalculationDetails {
  type: ContractType;
  breakdown?: RFATierBreakdown[];
  base_amount?: number;
  applied_rate?: number;
  notes?: string;
}

export interface RFATierBreakdown {
  tier_index: number;
  tier_min: number;
  tier_max: number | null;
  tier_rate: number;
  tier_amount: number;
  rfa_amount: number;
}

export type RFAStatus = 'pending' | 'validated' | 'paid' | 'cancelled';

// Historique des contrats
export interface ContractHistory {
  id: string;
  contract_id: string;
  action_type: ContractActionType;
  changes: Record<string, any>;
  user_id?: string;
  user_name?: string;
  created_at: string;
}

export type ContractActionType = 'created' | 'updated' | 'archived' | 'activated' | 'renewed';

// Données dashboard
export interface ContractsDashboardData {
  stats: ContractsStats;
  recent_calculations: RFACalculation[];
  monthly_rfa: MonthlyRFAData[];
  top_clients: TopClientRFA[];
  alerts: ContractAlert[];
  upcoming_renewals: ContractData[];
}

export interface ContractsStats {
  total_contracts: number;
  active_contracts: number;
  expired_contracts: number;
  total_rfa_pending: number;
  total_rfa_paid: number;
  average_rfa_rate: number;
  clients_with_contracts: number;
}

export interface MonthlyRFAData {
  month: string;
  rfa_amount: number;
  turnover_amount: number;
  contracts_count: number;
  average_rate: number;
}

export interface TopClientRFA {
  client_id: string;
  client_name: string;
  total_rfa: number;
  total_turnover: number;
  contracts_count: number;
  average_rate: number;
  currency: string;
}

// Alertes et notifications
export interface ContractAlert {
  id: string;
  type: ContractAlertType;
  contract_id: string;
  client_name: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  acknowledged: boolean;
}

export type ContractAlertType = 'tier_approaching' | 'contract_expiring' | 'rfa_threshold' | 'anomaly_detected';

// Filtres et recherche
export interface ContractFilters {
  search?: string;
  client_id?: string;
  contract_type?: ContractType;
  status?: ContractStatus;
  start_date?: string;
  end_date?: string;
  currency?: string;
  rfa_min?: number;
  rfa_max?: number;
}

export interface RFAFilters {
  search?: string;
  client_id?: string;
  contract_id?: string;
  status?: RFAStatus;
  period_start?: string;
  period_end?: string;
  amount_min?: number;
  amount_max?: number;
  currency?: string;
}

// Formulaires
export interface ContractFormData {
  client_id: string;
  contract_name: string;
  contract_type: ContractType;
  discount_config: DiscountConfig;
  start_date: string;
  end_date?: string;
  currency: string;
  conditions?: string;
}

export interface RFAFormData {
  contract_id: string;
  period_start: string;
  period_end: string;
  turnover_amount: number;
  notes?: string;
}

// Simulation "What-If"
export interface RFASimulation {
  scenario_name: string;
  contract_config: DiscountConfig;
  turnover_scenarios: TurnoverScenario[];
  results: SimulationResult[];
}

export interface TurnoverScenario {
  name: string;
  amount: number;
  probability?: number;
}

export interface SimulationResult {
  scenario_name: string;
  turnover_amount: number;
  rfa_amount: number;
  effective_rate: number;
  tier_reached?: number;
  breakdown: RFATierBreakdown[];
}

// Export et rapports
export interface ContractExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  include_calculations: boolean;
  include_history: boolean;
  date_range?: {
    start: string;
    end: string;
  };
  clients?: string[];
}

export interface RFAReport {
  title: string;
  period: {
    start: string;
    end: string;
  };
  summary: RFAReportSummary;
  details: RFAReportDetail[];
  generated_at: string;
}

export interface RFAReportSummary {
  total_contracts: number;
  total_turnover: number;
  total_rfa: number;
  average_rate: number;
  currency: string;
}

export interface RFAReportDetail {
  client_name: string;
  contract_name: string;
  turnover_amount: number;
  rfa_amount: number;
  effective_rate: number;
  status: RFAStatus;
}

// Types de réponse service (suivant les patterns existants)
export interface ContractServiceResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  success: boolean;
}

// Types pour intégration avec les modules existants
export interface ClientContract {
  client_id: string;
  client_name: string;
  active_contracts: number;
  total_rfa_pending: number;
  total_rfa_paid: number;
  next_tier_threshold?: number;
  days_to_renewal?: number;
}

// Configuration système pour RFA
export interface RFASettings {
  auto_calculation: boolean;
  notification_thresholds: {
    tier_approaching_percentage: number;
    contract_expiry_days: number;
    rfa_threshold_amount: number;
  };
  default_currency: string;
  fiscal_year_start: string;
  rounding_precision: number;
}