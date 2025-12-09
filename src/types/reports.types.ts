// Financial Reports Types
export interface FinancialReport {
  id: string;
  company_id: string;
  name: string;
  type: 'balance_sheet' | 'income_statement' | 'cash_flow' | 'trial_balance' | 'profit_loss' | 'general_ledger' | 'aged_receivables' | 'aged_payables' | 'budget_variance' | 'financial_ratios' | 'tax_summary' | 'vat_report' | 'inventory_valuation' | 'cost_center_analysis' | 'revenue_analysis' | 'expense_analysis' | 'comparative_analysis' | 'kpi_dashboard';
  format: 'detailed' | 'summary';
  period_start: string;
  period_end: string;
  status: 'draft' | 'generating' | 'ready' | 'published' | 'archived';
  file_url?: string;
  file_format?: 'pdf' | 'excel' | 'csv';
  file_size?: number;
  generated_at?: string;
  generated_by?: string;
  currency?: string;
  include_notes?: boolean;
  include_charts?: boolean;
  show_variance?: boolean;
  access_level?: string;
  created_at: string;
  updated_at: string;
}

export interface BalanceSheetData {
  assets: {
    current_assets: {
      cash_and_equivalents: number;
      accounts_receivable: number;
      inventory: number;
      prepaid_expenses: number;
      other_current_assets: number;
      total_current_assets: number;
    };
    non_current_assets: {
      property_plant_equipment: number;
      intangible_assets: number;
      investments: number;
      other_non_current_assets: number;
      total_non_current_assets: number;
    };
    total_assets: number;
  };
  liabilities: {
    current_liabilities: {
      accounts_payable: number;
      short_term_debt: number;
      accrued_expenses: number;
      other_current_liabilities: number;
      total_current_liabilities: number;
    };
    non_current_liabilities: {
      long_term_debt: number;
      deferred_tax: number;
      other_non_current_liabilities: number;
      total_non_current_liabilities: number;
    };
    total_liabilities: number;
  };
  equity: {
    share_capital: number;
    retained_earnings: number;
    other_equity: number;
    total_equity: number;
  };
  total_liabilities_equity: number;
}

export interface IncomeStatementData {
  revenue: {
    gross_revenue: number;
    returns_allowances: number;
    net_revenue: number;
  };
  cost_of_goods_sold: {
    direct_materials: number;
    direct_labor: number;
    manufacturing_overhead: number;
    total_cogs: number;
  };
  gross_profit: number;
  operating_expenses: {
    selling_expenses: number;
    administrative_expenses: number;
    research_development: number;
    total_operating_expenses: number;
  };
  operating_income: number;
  other_income_expenses: {
    interest_income: number;
    interest_expense: number;
    other_income: number;
    other_expenses: number;
    net_other_income: number;
  };
  income_before_taxes: number;
  tax_expense: number;
  net_income: number;
}

export interface CashFlowData {
  operating_activities: {
    net_income: number;
    depreciation_amortization: number;
    accounts_receivable_change: number;
    inventory_change: number;
    accounts_payable_change: number;
    other_operating_changes: number;
    net_cash_from_operations: number;
  };
  investing_activities: {
    capital_expenditures: number;
    asset_sales: number;
    investments: number;
    other_investing: number;
    net_cash_from_investing: number;
  };
  financing_activities: {
    debt_proceeds: number;
    debt_payments: number;
    equity_proceeds: number;
    dividends_paid: number;
    other_financing: number;
    net_cash_from_financing: number;
  };
  net_cash_change: number;
  beginning_cash: number;
  ending_cash: number;
}

export interface TrialBalanceData {
  accounts: {
    account_number: string;
    account_name: string;
    account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    debit_balance: number;
    credit_balance: number;
    net_balance: number;
  }[];
  totals: {
    total_debits: number;
    total_credits: number;
    balance_difference: number;
  };
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'balance_sheet' | 'income_statement' | 'cash_flow' | 'trial_balance' | 'aged_receivables' | 'aged_payables' | 'financial_ratios' | 'vat_report' | 'custom';
  
  // Structure definition
  sections: {
    id: string;
    name: string;
    order: number;
    items: {
      id: string;
      name: string;
      account_codes: string[];
      calculation_type: 'sum' | 'difference' | 'percentage' | 'custom';
      format: 'currency' | 'percentage' | 'number';
      show_in_summary: boolean;
    }[];
  }[];
  
  // Styling and formatting
  styling: {
    font_family: string;
    font_size: number;
    header_color: string;
    show_logo: boolean;
    show_watermark: boolean;
  };
  
  // Metadata
  is_default: boolean;
  enterprise_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ReportSchedule {
  id: string;
  report_template_id: string;
  name: string;
  description?: string;
  
  // Schedule settings
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  day_of_week?: number; // for weekly (0-6)
  day_of_month?: number; // for monthly (1-31)
  time: string; // HH:MM format
  
  // Recipients
  recipients: {
    email: string;
    name: string;
    role: string;
  }[];
  
  // Options
  auto_send: boolean;
  include_charts: boolean;
  file_format: 'pdf' | 'excel' | 'both';
  
  // Status
  status?: string;
  report_type?: string;
  is_active: boolean;
  last_run?: string;
  next_run?: string;
  
  enterprise_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ReportAnalytics {
  report_id: string;
  period: string;
  
  // Key metrics
  profitability: {
    gross_margin: number;
    operating_margin: number;
    net_margin: number;
    return_on_assets: number;
    return_on_equity: number;
  };
  
  liquidity: {
    current_ratio: number;
    quick_ratio: number;
    cash_ratio: number;
    working_capital: number;
  };
  
  efficiency: {
    asset_turnover: number;
    inventory_turnover: number;
    receivables_turnover: number;
    payables_turnover: number;
  };
  
  leverage: {
    debt_to_equity: number;
    debt_to_assets: number;
    interest_coverage: number;
    debt_service_coverage: number;
  };
  
  // Trends
  trends: {
    revenue_growth: number;
    expense_growth: number;
    profit_growth: number;
    asset_growth: number;
  };
  
  // Benchmarks
  industry_benchmarks?: {
    gross_margin: number;
    operating_margin: number;
    current_ratio: number;
    debt_to_equity: number;
  };
}

// Form data types
export interface ReportFormData {
  name: string;
  type: 'balance_sheet' | 'income_statement' | 'cash_flow' | 'trial_balance' | 'profit_loss' | 'general_ledger' | 'aged_receivables' | 'aged_payables' | 'budget_variance' | 'financial_ratios' | 'tax_summary' | 'vat_report' | 'inventory_valuation' | 'cost_center_analysis' | 'revenue_analysis' | 'expense_analysis' | 'comparative_analysis' | 'kpi_dashboard';
  format: 'detailed' | 'summary';
  period_start: string;
  period_end: string;
  file_format?: 'pdf' | 'excel' | 'csv';
  currency?: string;
}

export interface ReportTemplateFormData {
  name: string;
  description?: string;
  type: 'balance_sheet' | 'income_statement' | 'cash_flow' | 'trial_balance' | 'aged_receivables' | 'aged_payables' | 'financial_ratios' | 'vat_report' | 'custom';
  sections: {
    name: string;
    items: {
      name: string;
      account_codes: string[];
      calculation_type: 'sum' | 'difference' | 'percentage' | 'custom';
      format: 'currency' | 'percentage' | 'number';
      show_in_summary: boolean;
    }[];
  }[];
}

export interface ReportScheduleFormData {
  report_template_id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  day_of_week?: number;
  day_of_month?: number;
  time: string;
  recipients: {
    email: string;
    name: string;
    role: string;
  }[];
  auto_send: boolean;
  include_charts: boolean;
  file_format: 'pdf' | 'excel' | 'both';
}

export interface ReportFilters {
  search?: string;
  type?: string;
  status?: string;
  period_start?: string;
  period_end?: string;
  generated_by?: string;
  access_level?: string;
  file_format?: string;
}

// Statistics and dashboard types
export interface ReportStats {
  total_reports: number;
  reports_this_month: number;
  automated_reports: number;
  manual_reports: number;
  
  // By type
  by_type: {
    type: string;
    count: number;
    last_generated?: string;
  }[];
  
  // By format
  by_format: {
    format: string;
    count: number;
    percentage: number;
  }[];
  
  // Recent activity
  recent_generations: number;
  scheduled_today: number;
}

export interface ReportsDashboardData {
  stats: ReportStats;
  recent_reports: FinancialReport[];
  scheduled_reports: ReportSchedule[];
  popular_templates: ReportTemplate[];
  
  // Quick insights
  key_metrics: {
    total_revenue_ytd: number;
    total_expenses_ytd: number;
    net_income_ytd: number;
    cash_position: number;
  };
  
  // Alerts
  alerts: {
    missing_data: number;
    failed_schedules: number;
    outdated_reports: number;
  };
}

// Export and integration types
export interface ReportExportConfig {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  include_charts: boolean;
  include_notes: boolean;
  include_raw_data: boolean;
  compress: boolean;
  password_protect: boolean;
  watermark?: string;
}

export interface ReportDistribution {
  id: string;
  report_id: string;
  method: 'email' | 'ftp' | 'api' | 'download';
  recipients: string[];
  sent_at: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  delivery_confirmation?: string;
}

// Service response types
export interface ReportServiceResponse<T> {
  data: T | null;
  error?: {
    message: string;
    code?: string;
  };
}

// Advanced financial reports data structures
export interface AgedReceivablesData {
  customers: {
    customer_id: string;
    customer_name: string;
    total_outstanding: number;
    current: number;
    days_1_30: number;
    days_31_60: number;
    days_61_90: number;
    days_over_90: number;
    credit_limit: number;
    last_payment_date?: string;
  }[];
  aging_summary: {
    total_outstanding: number;
    current_total: number;
    days_1_30_total: number;
    days_31_60_total: number;
    days_61_90_total: number;
    days_over_90_total: number;
  };
}

export interface AgedPayablesData {
  vendors: {
    vendor_id: string;
    vendor_name: string;
    total_outstanding: number;
    current: number;
    days_1_30: number;
    days_31_60: number;
    days_61_90: number;
    days_over_90: number;
    credit_terms: string;
    next_payment_date?: string;
  }[];
  aging_summary: {
    total_outstanding: number;
    current_total: number;
    days_1_30_total: number;
    days_31_60_total: number;
    days_61_90_total: number;
    days_over_90_total: number;
  };
}

export interface FinancialRatiosData {
  liquidity_ratios: {
    current_ratio: number;
    quick_ratio: number;
    cash_ratio: number;
    working_capital: number;
    working_capital_ratio: number;
  };
  profitability_ratios: {
    gross_profit_margin: number;
    operating_profit_margin: number;
    net_profit_margin: number;
    return_on_assets: number;
    return_on_equity: number;
    return_on_investment: number;
  };
  efficiency_ratios: {
    asset_turnover: number;
    inventory_turnover: number;
    receivables_turnover: number;
    payables_turnover: number;
    inventory_days: number;
    collection_period: number;
    payment_period: number;
  };
  leverage_ratios: {
    debt_to_equity: number;
    debt_to_assets: number;
    equity_multiplier: number;
    interest_coverage: number;
    debt_service_coverage: number;
    times_interest_earned: number;
  };
  market_ratios: {
    price_to_earnings?: number;
    market_to_book?: number;
    dividend_yield?: number;
    earnings_per_share?: number;
  };
}

export interface BudgetVarianceData {
  revenue_variance: {
    budgeted: number;
    actual: number;
    variance: number;
    variance_percentage: number;
    favorable: boolean;
  };
  expense_variance: {
    budgeted: number;
    actual: number;
    variance: number;
    variance_percentage: number;
    favorable: boolean;
  };
  profit_variance: {
    budgeted: number;
    actual: number;
    variance: number;
    variance_percentage: number;
    favorable: boolean;
  };
  department_variances: {
    department: string;
    budget_categories: {
      category: string;
      budgeted: number;
      actual: number;
      variance: number;
      variance_percentage: number;
      favorable: boolean;
    }[];
  }[];
}

export interface VATReportData {
  period_start: string;
  period_end: string;
  output_vat: {
    standard_rate_sales: number;
    reduced_rate_sales: number;
    zero_rate_sales: number;
    exempt_sales: number;
    total_output_vat: number;
  };
  input_vat: {
    standard_rate_purchases: number;
    reduced_rate_purchases: number;
    capital_goods: number;
    other_deductible: number;
    total_input_vat: number;
  };
  vat_summary: {
    net_vat_due: number;
    vat_reclaim: number;
    payment_due_date: string;
    return_period: string;
  };
}

export interface GeneralLedgerData {
  accounts: {
    account_code: string;
    account_name: string;
    account_type: string;
    opening_balance: number;
    transactions: {
      date: string;
      reference: string;
      description: string;
      debit: number;
      credit: number;
      running_balance: number;
    }[];
    closing_balance: number;
  }[];
  period_start: string;
  period_end: string;
  total_debits: number;
  total_credits: number;
}

export interface KPIDashboardData {
  financial_kpis: {
    revenue_growth: number;
    profit_margin: number;
    current_ratio: number;
    debt_to_equity: number;
    return_on_assets: number;
    cash_burn_rate: number;
    days_sales_outstanding: number;
    inventory_turnover: number;
  };
  operational_kpis: {
    employee_productivity: number;
    customer_satisfaction: number;
    order_fulfillment_rate: number;
    inventory_accuracy: number;
    on_time_delivery: number;
  };
  strategic_kpis: {
    market_share: number;
    customer_retention: number;
    employee_turnover: number;
    innovation_index: number;
  };
  trends: {
    period: string;
    revenue: number;
    profit: number;
    costs: number;
    cash_flow: number;
  }[];
}

// Chart data for reports
export interface ReportChartData {
  type: 'line' | 'bar' | 'pie' | 'area' | 'combo';
  title: string;
  data: {
    labels: string[];
    datasets: {
      name: string;
      data: number[];
      color: string;
    }[];
  };
  options: {
    show_legend: boolean;
    show_grid: boolean;
    currency_format: boolean;
    percentage_format: boolean;
  };
}
