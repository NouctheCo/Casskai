// Forecasts Types
export interface ForecastScenario {
  id: string;
  name: string;
  description?: string;
  type: 'optimistic' | 'realistic' | 'pessimistic' | 'custom';
  growth_rate: number;
  market_conditions: 'favorable' | 'stable' | 'unfavorable';
  created_at: string;
  updated_at: string;
}

export interface ForecastPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  period_type: 'monthly' | 'quarterly' | 'yearly';
  enterprise_id: string;
  created_at: string;
}

export interface RevenueLineItem {
  id: string;
  category: string;
  subcategory?: string;
  description: string;
  amount: number;
  growth_rate: number;
  seasonality_factor: number;
  confidence_level: 'high' | 'medium' | 'low';
}

export interface ExpenseLineItem {
  id: string;
  category: 'fixed' | 'variable' | 'operational' | 'exceptional';
  subcategory?: string;
  description: string;
  amount: number;
  growth_rate: number;
  is_recurring: boolean;
  confidence_level: 'high' | 'medium' | 'low';
}

export interface CashFlowItem {
  id: string;
  type: 'inflow' | 'outflow';
  category: string;
  description: string;
  amount: number;
  timing: string; // Date when cash flow occurs
  probability: number; // 0-100%
}

export interface ForecastData {
  id: string;
  name: string;
  period_id: string;
  scenario_id: string;
  enterprise_id: string;
  
  // Revenue forecasts
  revenue_items: RevenueLineItem[];
  total_revenue: number;
  
  // Expense forecasts
  expense_items: ExpenseLineItem[];
  total_expenses: number;
  
  // Cash flow forecasts
  cash_flow_items: CashFlowItem[];
  net_cash_flow: number;
  
  // Calculated metrics
  gross_margin: number;
  net_margin: number;
  break_even_point: number;
  
  // Metadata
  status: 'draft' | 'review' | 'approved' | 'published';
  created_by: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  
  // Additional insights
  key_assumptions: string[];
  risk_factors: string[];
  opportunities: string[];
}

export interface ForecastComparison {
  actual_vs_forecast: {
    period: string;
    actual_value: number;
    forecasted_value: number;
    variance: number;
    variance_percentage: number;
  }[];
  accuracy_metrics: {
    mean_absolute_error: number;
    mean_absolute_percentage_error: number;
    forecast_accuracy: number;
  };
}

export interface ForecastChart {
  id: string;
  name: string;
  type: 'line' | 'bar' | 'area' | 'pie' | 'combo';
  data_source: 'revenue' | 'expenses' | 'cash_flow' | 'profitability';
  time_period: 'monthly' | 'quarterly' | 'yearly';
  scenarios: string[]; // scenario IDs to compare
  settings: {
    show_trend: boolean;
    show_variance: boolean;
    color_scheme: string;
    export_format: 'png' | 'pdf' | 'svg';
  };
}

export interface ForecastReport {
  id: string;
  name: string;
  forecast_id: string;
  type: 'executive_summary' | 'detailed' | 'variance_analysis' | 'scenario_comparison';
  format: 'pdf' | 'excel' | 'powerpoint';
  content: {
    include_charts: boolean;
    include_assumptions: boolean;
    include_risks: boolean;
    include_recommendations: boolean;
  };
  generated_at: string;
  file_url?: string;
}

// Form data types
export interface ForecastFormData {
  name: string;
  period_id: string;
  scenario_id: string;
  revenue_items: Omit<RevenueLineItem, 'id'>[];
  expense_items: Omit<ExpenseLineItem, 'id'>[];
  cash_flow_items: Omit<CashFlowItem, 'id'>[];
  key_assumptions: string[];
  risk_factors: string[];
  opportunities: string[];
}

export interface ScenarioFormData {
  name: string;
  description?: string;
  type: 'optimistic' | 'realistic' | 'pessimistic' | 'custom';
  growth_rate: number;
  market_conditions: 'favorable' | 'stable' | 'unfavorable';
}

export interface ForecastFilters {
  search?: string;
  period_id?: string;
  scenario_id?: string;
  status?: string;
  created_by?: string;
  date_from?: string;
  date_to?: string;
}

// Dashboard and analytics types
export interface ForecastDashboardData {
  summary: {
    total_forecasts: number;
    active_scenarios: number;
    avg_accuracy: number;
    next_review_date: string;
  };
  recent_forecasts: ForecastData[];
  scenario_performance: {
    scenario_name: string;
    accuracy: number;
    last_updated: string;
  }[];
  upcoming_reviews: {
    forecast_name: string;
    review_date: string;
    status: string;
  }[];
  key_metrics: {
    revenue_trend: number;
    expense_trend: number;
    cash_flow_trend: number;
    profitability_trend: number;
  };
}

export interface WhatIfAnalysis {
  base_scenario: string;
  variables: {
    name: string;
    current_value: number;
    test_values: number[];
  }[];
  results: {
    variable_combination: Record<string, number>;
    impact_on_revenue: number;
    impact_on_expenses: number;
    impact_on_cash_flow: number;
    impact_on_profitability: number;
  }[];
}

// Service response types
export interface ForecastServiceResponse<T> {
  data: T;
  error?: {
    message: string;
    code?: string;
  };
}

// Chart data types for visualization
export interface ChartDataPoint {
  period: string;
  value: number;
  scenario?: string;
  category?: string;
}

export interface ChartConfig {
  title: string;
  type: 'line' | 'bar' | 'area' | 'pie';
  data: ChartDataPoint[];
  xAxis: string;
  yAxis: string;
  colors: string[];
  showLegend: boolean;
  showGrid: boolean;
}
