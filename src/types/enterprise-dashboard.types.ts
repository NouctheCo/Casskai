// Types pour le dashboard exceptionnel niveau enterprise de CassKai

export interface DashboardMetric {

  id: string;

  title: string;

  current_value: number | string;

  target_value?: number;

  previous_period_value?: number;

  budget_value?: number;

  unit: 'currency' | 'percentage' | 'number' | 'days';

  trend_percentage: number;

  vs_budget_percentage?: number;

  vs_previous_year_percentage?: number;

  color: 'green' | 'red' | 'blue' | 'orange' | 'purple' | 'yellow' | 'indigo' | 'emerald';

  category: 'financial' | 'operational' | 'customers' | 'inventory' | 'performance';

  icon: string;
  // Données brutes pour détecter les comptes vides
  transactions?: Record<string, unknown>[];
  journal_entries?: Record<string, unknown>[];

}



export interface TimeSeriesData {

  date: string;

  current_year: number;

  previous_year?: number;

  budget?: number;

  label?: string;

}



export interface DashboardChart {

  id: string;

  title: string;

  type: 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'gauge' | 'waterfall' | 'combo';

  data: TimeSeriesData[];

  metrics: {

    total: number;

    growth_rate: number;

    vs_budget: number;

    vs_previous_year: number;

  };

  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

  comparison_enabled: boolean;

  drill_down_available: boolean;

}



export interface FinancialHealthScore {

  overall_score: number; // 0-100

  liquidity_score: number;

  profitability_score: number;

  efficiency_score: number;

  growth_score: number;

  risk_score: number;

  sustainability_score: number;

  recommendations: HealthRecommendation[];

  critical_alerts: string[];

  last_updated: string;

}



export interface HealthRecommendation {

  id: string;

  category: 'cash_flow' | 'profitability' | 'efficiency' | 'growth' | 'risk';

  priority: 'low' | 'medium' | 'high' | 'critical';

  title: string;

  description: string;

  impact: 'positive' | 'negative' | 'neutral';

  effort: 'low' | 'medium' | 'high';

  timeframe: 'immediate' | 'short_term' | 'long_term';

  action_items: string[];

}



export interface CashFlowForecast {

  period_start: string;

  period_end: string;

  opening_balance: number;

  expected_inflows: CashFlowItem[];

  expected_outflows: CashFlowItem[];

  projected_balance: number;

  confidence_level: number; // 0-100

  risk_factors: RiskFactor[];

  scenarios: CashFlowScenario[];

}



export interface CashFlowItem {

  category: string;

  amount: number;

  probability: number; // 0-100

  expected_date: string;

  source: string;

}



export interface CashFlowScenario {

  name: 'pessimistic' | 'realistic' | 'optimistic';

  probability: number;

  projected_balance: number;

  key_assumptions: string[];

}



export interface RiskFactor {

  id: string;

  type: 'operational' | 'financial' | 'market' | 'regulatory';

  description: string;

  impact: 'low' | 'medium' | 'high' | 'critical';

  likelihood: number; // 0-100

  mitigation_actions: string[];

}



export interface BudgetComparison {

  category: string;

  subcategory?: string;

  budget_amount: number;

  actual_amount: number;

  variance_amount: number;

  variance_percentage: number;

  previous_year_amount: number;

  forecast_end_year: number;

  trend: 'improving' | 'declining' | 'stable';

  alerts: string[];

}



export interface PeriodComparison {

  metric: string;

  current_period: number;

  previous_period: number;

  previous_year_same_period: number;

  variance_vs_previous_period: number;

  variance_vs_previous_year: number;

  budget_amount?: number;

  variance_vs_budget?: number;

  trend_analysis: TrendAnalysis;

}



export interface TrendAnalysis {

  direction: 'up' | 'down' | 'stable';

  strength: 'weak' | 'moderate' | 'strong';

  consistency: number; // 0-100

  seasonality_factor: number;

  prediction_confidence: number; // 0-100

}



export interface DashboardAlert {

  id: string;

  type: 'critical' | 'warning' | 'info' | 'success';

  category: 'cash_flow' | 'invoices' | 'inventory' | 'budget' | 'performance' | 'compliance';

  title: string;

  message: string;

  value?: number;

  threshold?: number;

  created_at: string;

  action_required: boolean;

  action_url?: string;

  affected_metrics: string[];

  estimated_impact: 'low' | 'medium' | 'high';

  auto_resolve_date?: string;

}



export interface EnterpriseDashboardData {

  company_id: string;

  period: 'today' | '7d' | '30d' | '90d' | '1y' | 'ytd' | 'custom';

  comparison_period: 'none' | 'previous_period' | 'previous_year' | 'budget' | 'all';

  generated_at: string;

  refresh_rate: number; // seconds



  // Vue exécutive

  executive_summary: ExecutiveSummary;



  // Métriques principales avec comparaisons

  key_metrics: DashboardMetric[];



  // Graphiques et visualisations interactives

  charts: DashboardChart[];



  // Santé financière complète

  financial_health: FinancialHealthScore | null;



  // Prévisions de trésorerie avancées

  cash_flow_forecast: CashFlowForecast[];



  // Comparaisons budgétaires détaillées

  budget_comparison: BudgetComparison[];



  // Analyses de performance par période

  period_comparisons: PeriodComparison[];



  // Système d'alertes intelligent

  alerts: DashboardAlert[];



  // KPI opérationnels

  operational_kpis: OperationalKPI[];



  // Analyse de rentabilité

  profitability_analysis: ProfitabilityAnalysis;

  // Données brutes pour vérification d'activité (optionnelles)
  transactions?: unknown[];
  journal_entries?: unknown[];
}



export interface ExecutiveSummary {

  revenue_ytd: number;

  revenue_growth: number;

  profit_margin: number;

  cash_runway_days: number;

  customer_satisfaction: number;

  market_position: string;

  key_achievements: string[];

  strategic_priorities: string[];

}



export interface OperationalKPI {

  id: string;

  name: string;

  value: number;

  unit: string;

  target: number;

  benchmark: number;

  trend: TrendAnalysis;

  department: string;

  frequency: 'daily' | 'weekly' | 'monthly';

}



export interface ProfitabilityAnalysis {

  gross_margin: number;

  operating_margin: number;

  net_margin: number;

  ebitda: number;

  roi: number;

  roa: number;

  roe: number;

  by_product_line: ProductLineProfitability[];

  by_customer_segment: CustomerSegmentProfitability[];

}



export interface ProductLineProfitability {

  product_line: string;

  revenue: number;

  cost: number;

  margin: number;

  margin_percentage: number;

  volume: number;

  growth_rate: number;

}



export interface CustomerSegmentProfitability {

  segment: string;

  revenue: number;

  customer_count: number;

  avg_order_value: number;

  lifetime_value: number;

  acquisition_cost: number;

  churn_rate: number;

}



// Types pour le système de budgets

export interface BudgetData {

  id: string;

  company_id: string;

  year: number;

  version: number;

  status: 'draft' | 'under_review' | 'approved' | 'active' | 'archived';

  created_at: string;

  updated_at: string;

  approved_at?: string;

  approved_by?: string;



  // Budgets par catégorie avec détails

  revenue_budget: BudgetCategory[];

  expense_budget: BudgetCategory[];

  capital_expenditure_budget: BudgetCategory[];



  // Hypothèses et paramètres

  assumptions: BudgetAssumption[];



  // Totaux et métriques

  total_revenue_budget: number;

  total_expense_budget: number;

  total_capex_budget: number;

  net_profit_budget: number;



  // Répartition temporelle

  monthly_breakdown: MonthlyBudget[];

  quarterly_breakdown: QuarterlyBudget[];



  // Scénarios

  scenarios: BudgetScenario[];

}



export interface BudgetCategory {

  id: string;

  category: string;

  subcategory?: string;

  account_codes: string[];

  annual_amount: number;

  monthly_amounts: number[]; // 12 mois

  growth_rate: number;

  driver: BudgetDriver;

  notes?: string;

  responsible_person?: string;

  approval_status: 'pending' | 'approved' | 'rejected';

}



export interface BudgetDriver {

  type: 'fixed' | 'variable' | 'step' | 'formula';

  base_value?: number;

  variable_rate?: number; // per unit

  formula?: string;

  dependencies: string[]; // autres catégories liées

}



export interface BudgetAssumption {

  id: string;

  category: 'economic' | 'market' | 'operational' | 'regulatory';

  name: string;

  value: number | string;

  unit?: string;

  confidence_level: number; // 0-100

  source: string;

  impact_analysis: string;

}



export interface MonthlyBudget {

  month: number; // 1-12

  revenue_budget: number;

  expense_budget: number;

  capex_budget: number;

  net_profit_budget: number;

  cash_flow_budget: number;

  headcount_budget?: number;

}



export interface QuarterlyBudget {

  quarter: number; // 1-4

  revenue_budget: number;

  expense_budget: number;

  capex_budget: number;

  net_profit_budget: number;

  key_initiatives: string[];

  risk_factors: string[];

}



export interface BudgetScenario {

  name: string;

  description: string;

  probability: number; // 0-100

  revenue_impact: number; // percentage

  expense_impact: number; // percentage

  key_variables: Record<string, number>;

  outcomes: ScenarioOutcome[];

}



export interface ScenarioOutcome {

  metric: string;

  value: number;

  variance_from_base: number;

  risk_level: 'low' | 'medium' | 'high';

}



// Types pour les filtres et paramètres du dashboard

export interface DashboardFilter {

  period: 'today' | '7d' | '30d' | '90d' | '1y' | 'ytd' | 'custom';

  start_date?: string;

  end_date?: string;

  comparison: 'none' | 'previous_period' | 'previous_year' | 'budget' | 'all';

  departments?: string[];

  categories?: string[];

  metrics?: string[];

  show_forecasts: boolean;

  show_benchmarks: boolean;

  currency: string;

}



export interface RealTimeUpdate {

  type: 'metric_update' | 'new_alert' | 'data_refresh' | 'budget_variance' | 'forecast_update';

  metric_id?: string;

  new_value?: number | string;

  alert?: DashboardAlert;

  variance_info?: BudgetVarianceInfo;

  timestamp: string;

  priority: 'low' | 'medium' | 'high' | 'critical';

}



export interface BudgetVarianceInfo {

  category: string;

  budgeted: number;

  actual: number;

  variance: number;

  variance_percentage: number;

  threshold_exceeded: boolean;

  action_required: boolean;

}
