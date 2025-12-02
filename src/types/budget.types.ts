// Types pour la gestion budgétaire de CassKai
// Système de budgets annuels avec versions et workflow d'approbation

export interface Budget {
  id: string;
  company_id: string;
  year: number;
  version: number;
  status: BudgetStatus;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  approved_by?: string;
  total_revenue_budget: number;
  total_expense_budget: number;
  total_capex_budget: number;
  net_profit_budget: number;

  // Relations
  budget_categories?: BudgetCategory[];
  budget_assumptions?: BudgetAssumption[];
  budget_approvals?: BudgetApproval[];
}

export type BudgetStatus =
  | 'draft'
  | 'under_review'
  | 'approved'
  | 'active'
  | 'archived';

export interface BudgetCategory {
  id: string;
  budget_id: string;
  account_id?: string; // Lien vers chart_of_accounts
  category: string;
  subcategory?: string;
  category_type: CategoryType;
  account_codes?: string[];
  annual_amount: number;
  monthly_amounts: number[]; // 12 mois
  growth_rate?: number;
  driver_type: DriverType;
  base_value?: number;
  variable_rate?: number;
  formula?: string;
  notes?: string;
  responsible_person?: string;
  approval_status: ApprovalStatus;
  created_at: string;
}

export type CategoryType = 'revenue' | 'expense' | 'capex';

export type DriverType = 'fixed' | 'variable' | 'step' | 'formula';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface BudgetAssumption {
  id: string;
  budget_id: string;
  key: string;
  description: string;
  value: number | string;
  unit?: string;
  category: string;
  impact_description?: string;
  confidence_level: number; // 0-100
  source?: string;
  created_at: string;
}

export interface BudgetApproval {
  id: string;
  budget_id: string;
  approver_id: string;
  approval_level: number;
  status: ApprovalStatus;
  comments?: string;
  approved_at?: string;
  created_at: string;
}

// Types pour l'interface utilisateur
export interface BudgetFormData {
  year: number;
  categories: BudgetCategoryFormData[];
  assumptions: BudgetAssumptionFormData[];
}

export interface BudgetCategoryFormData {
  account_id?: string; // Lien vers chart_of_accounts (REQUIRED)
  category: string;
  subcategory?: string;
  category_type: CategoryType;
  account_codes?: string[];
  annual_amount: number;
  monthly_amounts: number[];
  growth_rate?: number;
  driver_type: DriverType;
  base_value?: number;
  variable_rate?: number;
  formula?: string;
  notes?: string;
  responsible_person?: string;
}

export interface BudgetAssumptionFormData {
  key: string;
  description: string;
  value: number | string;
  unit?: string;
  category: string;
  impact_description?: string;
  confidence_level: number;
  source?: string;
}

// Types pour l'analyse budgétaire
export interface BudgetAnalysis {
  budget_id: string;
  period_start: string;
  period_end: string;
  variance_analysis: BudgetVarianceAnalysis[];
  performance_summary: BudgetPerformanceSummary;
  recommendations: BudgetRecommendation[];
  kpi_summary: BudgetKPISummary;
}

export interface BudgetVarianceAnalysis {
  category: string;
  subcategory?: string;
  budget_amount: number;
  actual_amount: number;
  variance_amount: number;
  variance_percentage: number;
  ytd_budget: number;
  ytd_actual: number;
  ytd_variance_amount: number;
  ytd_variance_percentage: number;
  trend: 'favorable' | 'unfavorable' | 'neutral';
  explanation?: string;
}

export interface BudgetPerformanceSummary {
  overall_performance: number; // 0-100
  revenue_performance: number;
  expense_performance: number;
  capex_performance: number;
  key_achievements: string[];
  major_variances: string[];
  forecast_accuracy: number;
}

export interface BudgetRecommendation {
  id: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact_estimate: number;
  effort_required: 'low' | 'medium' | 'high';
  timeframe: 'short_term' | 'medium_term' | 'long_term';
  action_items: string[];
  responsible_party?: string;
}

export interface BudgetKPISummary {
  budget_accuracy: number;
  forecast_reliability: number;
  variance_trends: {
    improving: number;
    stable: number;
    deteriorating: number;
  };
  seasonal_patterns: SeasonalPattern[];
}

export interface SeasonalPattern {
  category: string;
  pattern_type: 'seasonal' | 'cyclical' | 'irregular' | 'trend';
  confidence: number;
  description: string;
}

// Types pour les templates de budget
export interface BudgetTemplate {
  id: string;
  name: string;
  description: string;
  industry: string;
  company_size: 'small' | 'medium' | 'large';
  categories: BudgetCategoryTemplate[];
  assumptions: BudgetAssumptionTemplate[];
  is_default: boolean;
  created_at: string;
}

export interface BudgetCategoryTemplate {
  category: string;
  subcategory?: string;
  category_type: CategoryType;
  default_percentage?: number; // % du CA
  account_codes?: string[];
  driver_type: DriverType;
  is_mandatory: boolean;
  description?: string;
}

export interface BudgetAssumptionTemplate {
  key: string;
  description: string;
  default_value?: number | string;
  unit?: string;
  category: string;
  is_mandatory: boolean;
}

// Types pour l'import/export
export interface BudgetImportData {
  year: number;
  categories: BudgetCategoryImport[];
  assumptions?: BudgetAssumptionImport[];
  source: 'excel' | 'csv' | 'previous_year' | 'template';
}

export interface BudgetCategoryImport {
  category: string;
  subcategory?: string;
  category_type: CategoryType;
  jan: number;
  feb: number;
  mar: number;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sep: number;
  oct: number;
  nov: number;
  dec: number;
  notes?: string;
}

export interface BudgetAssumptionImport {
  key: string;
  description: string;
  value: number | string;
  unit?: string;
  category: string;
}

// Types pour les filtres et recherche
export interface BudgetFilter {
  years?: number[];
  status?: BudgetStatus[];
  category_types?: CategoryType[];
  search_term?: string;
  date_from?: string;
  date_to?: string;
}

// Types pour les validations
export interface BudgetValidationResult {
  isValid: boolean;
  errors: BudgetValidationError[];
  warnings: BudgetValidationWarning[];
}

export interface BudgetValidationError {
  field: string;
  category?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface BudgetValidationWarning {
  field: string;
  category?: string;
  message: string;
  suggestion?: string;
}

// Types pour les notifications et workflow
export interface BudgetWorkflowEvent {
  id: string;
  budget_id: string;
  event_type: BudgetEventType;
  triggered_by: string;
  triggered_at: string;
  data?: any;
  processed: boolean;
}

export type BudgetEventType =
  | 'created'
  | 'submitted_for_review'
  | 'approved'
  | 'rejected'
  | 'activated'
  | 'archived'
  | 'modified'
  | 'variance_threshold_exceeded';
