// src/types/accounting.ts

export interface AccountPlan {
  standard: 'SYSCOHADA' | 'PCG' | 'GAAP' | 'IFRS';
  country: string;
  classes: AccountClass[];
}

export interface AccountClass {
  number: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  accounts: Account[];
}

export interface Account {
  number: string;
  name: string;
  type: AccountType;
  isDebitNormal: boolean;
  subAccounts?: Account[];
}

export type AccountType = 
  | 'immobilisations'
  | 'stocks' 
  | 'creances'
  | 'tresorerie'
  | 'dettes'
  | 'capitaux'
  | 'charges'
  | 'produits';

export interface JournalEntry {
  id: string;
  date: Date;
  reference: string;
  description: string;
  lines: JournalEntryLine[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  companyId: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{ field: string; message: string; severity: 'error' | 'warning' | 'info' }>;
  warnings: Array<{ field: string; message: string; severity: 'warning' | 'info' }>;
}

export interface JournalEntryLine {
  id: string;
  accountNumber: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
  reference?: string;
}

export interface AccountBalance {
  accountNumber: string;
  accountName: string;
  debitTotal: number;
  creditTotal: number;
  balance: number;
  balanceType: 'debit' | 'credit';
}

export interface TrialBalance {
  date: Date;
  accounts: AccountBalance[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

export interface FinancialStatement {
  companyId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  type: 'balance_sheet' | 'income_statement' | 'cash_flow';
  data: Record<string, number>;
  generatedAt: Date;
}

// Types pour les rapports
export interface BalanceSheet {
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
}

export interface IncomeStatement {
  revenues: AccountBalance[];
  expenses: AccountBalance[];
  netIncome: number;
  period: {
    startDate: Date;
    endDate: Date;
  };
}
