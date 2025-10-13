// src/types/accounting.ts

// Types de base pour la comptabilité
export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type AccountClass = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type AccountingStandard = 'PCG' | 'SYSCOHADA' | 'GAAP' | 'IFRS';

// Structure hiérarchique des comptes (4 niveaux)
export interface AccountHierarchy {
  standard: AccountingStandard;
  country: string;
  classes: AccountClass[];
}

export interface AccountClassDefinition {
  number: AccountClass;
  name: string;
  type: 'balance' | 'profit_loss'; // Bilan ou Compte de Résultat
  accounts: AccountGroup[];
}

export interface AccountGroup {
  number: string; // Ex: "10", "11", "12" pour classe 1
  name: string;
  type: AccountType;
  accounts: Account[];
}

export interface Account {
  number: string; // Numéro complet (ex: "101001")
  name: string;
  type: AccountType;
  isDebitNormal: boolean;
  isActive: boolean;
  parentAccount?: string; // Numéro du compte parent
  subAccounts?: Account[];
  taxRate?: number;
  description?: string;
}

// Interface pour les écritures comptables
export interface JournalEntry {
  id: string;
  companyId: string;
  journalId: string;
  entryNumber?: string;
  entryDate: string;
  description: string;
  referenceNumber?: string;
  status: 'draft' | 'posted' | 'validated' | 'cancelled';
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  lines: JournalEntryLine[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  validatedAt?: string;
  validatedBy?: string;
}

export interface JournalEntryLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  accountNumber: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
  description?: string;
  reference?: string;
  currency: string;
  exchangeRate?: number;
  createdAt: string;
}

// Interface pour les journaux
export interface Journal {
  id: string;
  companyId: string;
  code: string; // ACHATS, VENTES, BANQUE, etc.
  name: string;
  type: 'sales' | 'purchases' | 'bank' | 'cash' | 'general' | 'payroll' | 'inventory';
  description?: string;
  isActive: boolean;
  sequenceNumber: number; // Pour numéroter les écritures
  createdAt: string;
  updatedAt: string;
}

// Balance des comptes
export interface AccountBalance {
  accountId: string;
  accountNumber: string;
  accountName: string;
  periodStart: string;
  periodEnd: string;
  openingDebit: number;
  openingCredit: number;
  movementDebit: number;
  movementCredit: number;
  closingDebit: number;
  closingCredit: number;
  balance: number;
  balanceType: 'debit' | 'credit';
}

// Balance générale
export interface TrialBalance {
  companyId: string;
  period: {
    startDate: string;
    endDate: string;
  };
  accounts: AccountBalance[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  generatedAt: string;
}

// États financiers
export interface FinancialStatement {
  companyId: string;
  period: {
    startDate: string;
    endDate: string;
  };
  type: 'balance_sheet' | 'income_statement' | 'cash_flow_statement';
  currency: string;
  data: Record<string, number>;
  generatedAt: string;
  validatedAt?: string;
}

// Bilan
export interface BalanceSheet {
  companyId: string;
  period: {
    startDate: string;
    endDate: string;
  };
  assets: {
    fixedAssets: AccountBalance[];
    currentAssets: AccountBalance[];
    total: number;
  };
  liabilities: {
    equity: AccountBalance[];
    longTermLiabilities: AccountBalance[];
    currentLiabilities: AccountBalance[];
    total: number;
  };
  isBalanced: boolean;
  generatedAt: string;
}

// Compte de résultat
export interface IncomeStatement {
  companyId: string;
  period: {
    startDate: string;
    endDate: string;
  };
  revenue: {
    sales: AccountBalance[];
    otherRevenue: AccountBalance[];
    total: number;
  };
  expenses: {
    costOfSales: AccountBalance[];
    operatingExpenses: AccountBalance[];
    financialExpenses: AccountBalance[];
    taxExpenses: AccountBalance[];
    total: number;
  };
  netIncome: number;
  generatedAt: string;
}

// Table de flux de trésorerie
export interface CashFlowStatement {
  companyId: string;
  period: {
    startDate: string;
    endDate: string;
  };
  operatingActivities: number;
  investingActivities: number;
  financingActivities: number;
  netCashFlow: number;
  openingCash: number;
  closingCash: number;
  generatedAt: string;
}

// Templates d'écritures
export interface EntryTemplate {
  id: string;
  name: string;
  description: string;
  category: 'sales' | 'purchases' | 'payments' | 'inventory' | 'payroll' | 'tax' | 'adjustments';
  isRecurring: boolean;
  isActive: boolean;
  accounts: TemplateAccount[];
  conditions?: TemplateCondition[];
  createdAt: string;
  updatedAt: string;
}

export interface TemplateAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  accountType: 'debit' | 'credit';
  amountFormula: string; // Ex: "#{amountHT}", "#{amountHT} * 0.20"
  isVariable: boolean;
  description?: string;
}

export interface TemplateCondition {
  id: string;
  field: string; // Ex: "amountHT", "taxRate"
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

// Règles TVA
export interface VATRule {
  id: string;
  name: string;
  rate: number;
  type: 'standard' | 'reduced' | 'special';
  deductible: boolean;
  accountDebit?: string; // Compte de TVA déductible
  accountCredit?: string; // Compte de TVA collectée
  description?: string;
}

// Conditions pour appliquer les templates
export interface TemplateCondition {
  id: string;
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

// Types pour les rapports
export interface AccountingReport {
  id: string;
  companyId: string;
  name: string;
  type: 'trial_balance' | 'balance_sheet' | 'income_statement' | 'cash_flow' | 'account_ledger' | 'aged_receivables' | 'aged_payables';
  format: 'pdf' | 'excel' | 'html';
  parameters: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  generatedAt?: string;
  createdBy: string;
  createdAt: string;
}

// Validation des écritures
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  warnings: Array<{
    field: string;
    message: string;
    severity: 'warning' | 'info';
  }>;
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  lineIndex?: number;
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  lineIndex?: number;
}

// Période comptable
export interface AccountingPeriod {
  id: string;
  company_id: string;
  start_date: string;
  end_date: string;
  is_open: boolean;
  is_closed: boolean;
  created_at: string;
}

// Budget
export interface Budget {
  id: string;
  company_id: string;
  account_number: string;
  period: string;
  budgeted_amount: number;
  actual_amount: number;
  variance: number;
  created_at: string;
}

// Calcul de la taxe
export interface TaxCalculation {
  id: string;
  company_id: string;
  entry_id: string;
  tax_type: string;
  base_amount: number;
  tax_rate: number;
  tax_amount: number;
  created_at: string;
}

// Données de rapport
export interface ReportData {
  id: string;
  company_id: string;
  report_type: string;
  period_start: string;
  period_end: string;
  data: Record<string, unknown>;
  generated_at: string;
}

// Types supplémentaires pour l'AccountingEngine
export interface Company {
  id: string;
  name: string;
  country_code: string;
  sector: string;
  fiscal_year_start: Date;
  currency: string;
  created_at: string;
  updated_at: string;
}
