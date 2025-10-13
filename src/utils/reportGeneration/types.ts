/**
 * Types pour la génération de rapports comptables et fiscaux
 * Conforme aux normes françaises (PCG) et adaptable multi-pays
 */

export interface ReportGenerationOptions {
  companyId: string;
  companyName: string;
  periodStart: string;
  periodEnd: string;
  currency?: string;
  language?: 'fr' | 'en';
  format?: 'pdf' | 'excel';
  includeZeroBalances?: boolean;
}

export interface BalanceSheetData {
  company_id: string;
  report_date: string;
  report_type: 'balance_sheet';
  currency: string;
  assets: {
    fixed_assets?: Array<AccountLine>;
    inventory?: Array<AccountLine>;
    receivables?: Array<AccountLine>;
    cash?: Array<AccountLine>;
    total: number;
  };
  liabilities: {
    payables?: Array<AccountLine>;
    loans?: Array<AccountLine>;
    total: number;
  };
  equity: {
    capital?: Array<AccountLine>;
    total: number;
  };
  totals: {
    total_assets: number;
    total_liabilities: number;
    total_equity: number;
    total_liabilities_equity: number;
    balanced: boolean;
  };
  generated_at: string;
}

export interface IncomeStatementData {
  company_id: string;
  period_start: string;
  period_end: string;
  report_type: 'income_statement';
  currency: string;
  revenue: {
    sales?: Array<AccountLine>;
    other_revenue?: Array<AccountLine>;
    total: number;
  };
  expenses: {
    purchases?: Array<AccountLine>;
    external_charges?: Array<AccountLine>;
    taxes?: Array<AccountLine>;
    personnel?: Array<AccountLine>;
    other_charges?: Array<AccountLine>;
    total: number;
  };
  summary: {
    total_revenue: number;
    total_expenses: number;
    net_income: number;
    margin_percentage: number;
  };
  generated_at: string;
}

export interface TrialBalanceData {
  company_id: string;
  report_date: string;
  report_type: 'trial_balance';
  currency: string;
  accounts: Array<TrialBalanceLine>;
  totals: {
    total_debit: number;
    total_credit: number;
    total_balance: number;
    balanced: boolean;
  };
  generated_at: string;
}

export interface GeneralLedgerData {
  company_id: string;
  period_start: string;
  period_end: string;
  account_filter?: string;
  report_type: 'general_ledger';
  currency: string;
  entries: Array<LedgerEntry>;
  totals: {
    total_debit: number;
    total_credit: number;
    entry_count: number;
  };
  generated_at: string;
}

export interface CashFlowData {
  company_id: string;
  period_start: string;
  period_end: string;
  report_type: 'cash_flow_statement';
  currency: string;
  operating_activities: {
    amount: number;
    description: string;
  };
  investing_activities: {
    amount: number;
    description: string;
  };
  financing_activities: {
    amount: number;
    description: string;
  };
  summary: {
    net_cash_change: number;
    operating: number;
    investing: number;
    financing: number;
  };
  generated_at: string;
}

export interface AccountLine {
  account_number: string;
  account_name: string;
  balance?: number;
  amount?: number;
}

export interface TrialBalanceLine {
  account_number: string;
  account_name: string;
  account_type: string;
  debit: number;
  credit: number;
  debit_total?: number;
  credit_total?: number;
  balance: number;
}

export interface LedgerEntry {
  entry_id: string;
  date: string;
  account_number: string;
  account_name: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface CompanyInfo {
  id: string;
  name: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country: string;
  siret?: string;
  vat_number?: string;
  logo_url?: string;
}

export interface PDFReportConfig {
  title: string;
  subtitle?: string;
  company: CompanyInfo;
  period: {
    start?: string;
    end: string;
  };
  footer?: string;
  watermark?: string;
  pageNumbers?: boolean;
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface ExcelReportConfig {
  title: string;
  subtitle?: string;
  company: CompanyInfo;
  period: {
    start?: string;
    end: string;
  };
  sheetName?: string;
  includeFormulas?: boolean;
  freezeHeader?: boolean;
  autoFilter?: boolean;
  columnWidths?: number[];
}

export type ReportType =
  | 'balance_sheet'
  | 'income_statement'
  | 'trial_balance'
  | 'general_ledger'
  | 'cash_flow_statement'
  | 'vat_declaration'
  | 'tax_package';

export interface TaxDeclarationVAT {
  company_id: string;
  period_start: string;
  period_end: string;
  declaration_type: 'CA3' | 'CA12';
  vat_collected: number; // TVA collectée (44571)
  vat_deductible: number; // TVA déductible (44566)
  vat_to_pay: number; // TVA à payer (ou crédit)
  sales_amount_ht: number; // Base HT des ventes
  purchases_amount_ht: number; // Base HT des achats
  details: {
    account_44571_balance: number;
    account_44566_balance: number;
    adjustments?: number;
  };
  generated_at: string;
}

export interface TaxPackageLiasse {
  company_id: string;
  fiscal_year: string;
  forms: {
    form_2050?: any; // Bilan actif
    form_2051?: any; // Bilan passif
    form_2052?: any; // Compte de résultat (charges)
    form_2053?: any; // Compte de résultat (produits)
    form_2054?: any; // Immobilisations
    form_2055?: any; // Amortissements
    form_2056?: any; // Provisions
    form_2057?: any; // État des échéances
    form_2058_A?: any; // Détermination résultat fiscal
    form_2058_B?: any; // Résultat fiscal
    form_2058_C?: any; // Tableau des amortissements
    form_2059_A?: any; // Déficits
    form_2059_B?: any; // Provisions
    form_2059_C?: any; // Plus/moins-values
    form_2059_D?: any; // Autres renseignements
  };
  generated_at: string;
}

export interface AgedReceivablesData {
  company_id: string;
  report_date: string;
  report_type: 'aged_receivables';
  currency: string;
  customers: Array<{
    customer_id: string;
    customer_name: string;
    total_amount: number;
    current: number;        // 0-30 jours
    days_30: number;        // 31-60 jours
    days_60: number;        // 61-90 jours
    days_90_plus: number;   // 90+ jours
    invoices: Array<{
      invoice_id: string;
      invoice_number: string;
      invoice_date: string;
      due_date: string;
      amount: number;
      days_overdue: number;
    }>;
  }>;
  totals: {
    total_receivables: number;
    total_current: number;
    total_30: number;
    total_60: number;
    total_90_plus: number;
  };
  generated_at: string;
}

export interface AgedPayablesData {
  company_id: string;
  report_date: string;
  report_type: 'aged_payables';
  currency: string;
  suppliers: Array<{
    supplier_id: string;
    supplier_name: string;
    total_amount: number;
    current: number;
    days_30: number;
    days_60: number;
    days_90_plus: number;
    bills: Array<{
      bill_id: string;
      bill_number: string;
      bill_date: string;
      due_date: string;
      amount: number;
      days_overdue: number;
    }>;
  }>;
  totals: {
    total_payables: number;
    total_current: number;
    total_30: number;
    total_60: number;
    total_90_plus: number;
  };
  generated_at: string;
}

export interface FinancialRatiosData {
  company_id: string;
  report_date: string;
  period_start: string;
  period_end: string;
  report_type: 'financial_ratios';
  currency: string;
  liquidity_ratios: {
    current_ratio: number;           // Actif circulant / Passif circulant
    quick_ratio: number;             // (Actif circulant - Stocks) / Passif circulant
    cash_ratio: number;              // Trésorerie / Passif circulant
  };
  profitability_ratios: {
    gross_margin: number;            // (CA - Achats) / CA
    operating_margin: number;        // Résultat d'exploitation / CA
    net_margin: number;              // Résultat net / CA
    return_on_assets: number;        // Résultat net / Total actif
    return_on_equity: number;        // Résultat net / Capitaux propres
  };
  leverage_ratios: {
    debt_ratio: number;              // Total dettes / Total actif
    debt_to_equity: number;          // Total dettes / Capitaux propres
    interest_coverage: number;       // Résultat exploitation / Charges financières
  };
  efficiency_ratios: {
    asset_turnover: number;          // CA / Total actif
    receivables_turnover: number;    // CA / Créances clients
    payables_turnover: number;       // Achats / Dettes fournisseurs
    inventory_turnover: number;      // Coût ventes / Stock moyen
  };
  generated_at: string;
}

export interface BudgetVarianceData {
  company_id: string;
  report_date: string;
  period_start: string;
  period_end: string;
  report_type: 'budget_variance';
  currency: string;
  revenue_analysis: Array<{
    account_number: string;
    account_name: string;
    budget: number;
    actual: number;
    variance: number;
    variance_percentage: number;
  }>;
  expense_analysis: Array<{
    account_number: string;
    account_name: string;
    budget: number;
    actual: number;
    variance: number;
    variance_percentage: number;
  }>;
  summary: {
    total_revenue_budget: number;
    total_revenue_actual: number;
    total_revenue_variance: number;
    total_expense_budget: number;
    total_expense_actual: number;
    total_expense_variance: number;
    net_income_budget: number;
    net_income_actual: number;
    net_income_variance: number;
  };
  generated_at: string;
}

export interface KPIDashboardData {
  company_id: string;
  report_date: string;
  period_start: string;
  period_end: string;
  report_type: 'kpi_dashboard';
  currency: string;
  financial_kpis: {
    revenue: { value: number; trend: number; target?: number };
    profit: { value: number; trend: number; target?: number };
    cash: { value: number; trend: number; target?: number };
    margin: { value: number; trend: number; target?: number };
  };
  operational_kpis: {
    invoices_sent: { value: number; trend: number; target?: number };
    invoices_paid: { value: number; trend: number; target?: number };
    average_collection_days: { value: number; trend: number; target?: number };
    average_payment_days: { value: number; trend: number; target?: number };
  };
  customer_kpis: {
    total_customers: { value: number; trend: number; target?: number };
    active_customers: { value: number; trend: number; target?: number };
    customer_retention: { value: number; trend: number; target?: number };
    average_invoice_value: { value: number; trend: number; target?: number };
  };
  generated_at: string;
}

export interface TaxSummaryData {
  company_id: string;
  fiscal_year: string;
  report_type: 'tax_summary';
  currency: string;
  vat_summary: {
    total_vat_collected: number;
    total_vat_deductible: number;
    net_vat_position: number;
    monthly_declarations: Array<{
      month: string;
      vat_collected: number;
      vat_deductible: number;
      vat_paid: number;
    }>;
  };
  corporate_tax_summary: {
    taxable_income: number;
    tax_rate: number;
    corporate_tax: number;
    tax_credits: number;
    net_tax_due: number;
  };
  social_contributions: {
    employer_contributions: number;
    employee_contributions: number;
    total_contributions: number;
  };
  tax_deadlines: Array<{
    date: string;
    type: string;
    description: string;
    estimated_amount?: number;
  }>;
  generated_at: string;
}
