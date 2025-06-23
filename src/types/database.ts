// src/types/database.ts

export interface Company {
  id: string;
  name: string;
  country: string;
  currency: string;
  timezone: string;
  fiscal_year_start: string;
  tax_number?: string;
  address?: CompanyAddress;
  created_at: string;
  updated_at: string;
}

export interface CompanyAddress {
  street: string;
  city: string;
  postal_code: string;
  state?: string;
  country: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  company_id?: string;
  role: 'owner' | 'admin' | 'accountant' | 'user';
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  company_id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parent_id?: string;
  is_active: boolean;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  company_id: string;
  entry_number: string;
  date: string;
  description: string;
  reference?: string;
  status: 'draft' | 'posted' | 'cancelled';
  total_debit: number;
  total_credit: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  lines: JournalLine[];
}

export interface JournalLine {
  id: string;
  entry_id: string;
  account_id: string;
  debit: number;
  credit: number;
  description?: string;
  reference?: string;
  created_at: string;
  // Relations
  account?: Account;
}

export interface BankAccount {
  id: string;
  company_id: string;
  name: string;
  bank_name: string;
  account_number: string;
  currency: string;
  balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  company_id: string;
  bank_account_id?: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  type: 'income' | 'expense' | 'transfer';
  category?: string;
  reference?: string;
  status: 'pending' | 'cleared' | 'reconciled';
  created_at: string;
  updated_at: string;
}

// Types pour les plans comptables
export interface ChartOfAccounts {
  country: string;
  standard: string;
  accounts: AccountTemplate[];
}

export interface AccountTemplate {
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parent_code?: string;
  level: number;
  is_required: boolean;
}

// Types pour les devises
export interface Currency {
  code: string; // ISO 4217 (EUR, USD, XOF, etc.)
  name: string;
  symbol: string;
  decimal_places: number;
  countries: string[];
}

export interface ExchangeRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  date: string;
  source: string;
  created_at: string;
}

// Types pour les requêtes SQL
export interface DatabaseSchema {
  table: string;
  columns: ColumnDefinition[];
  indexes: IndexDefinition[];
  constraints: ConstraintDefinition[];
}

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
  primary?: boolean;
  unique?: boolean;
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface ConstraintDefinition {
  name: string;
  type: 'foreign_key' | 'check' | 'unique';
  columns: string[];
  reference_table?: string;
  reference_columns?: string[];
}
