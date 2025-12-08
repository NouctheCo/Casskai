// Types de base de données Supabase - Types manquants



export type Json =

  | string

  | number

  | boolean

  | null

  | { [key: string]: Json | undefined }

  | Json[]



// Types d'entreprises

export interface Company {

  id: string

  name: string

  created_at: string

  updated_at: string

  stripe_customer_id?: string

  stripe_subscription_id?: string

  country?: string

  default_currency?: string

  is_active: boolean

}



// Types d'utilisateurs

export interface UserRole {

  id: string

  name: string

  permissions: Json

}



export interface UserCompany {

  id: string

  user_id: string

  company_id: string

  role_id: string

  created_at: string

}



// Types de comptabilité

export interface Account {

  id: string

  company_id: string

  account_number: string

  account_name: string

  account_type: AccountType

  account_class?: number | null

  parent_account_id?: string | null

  level?: number | null

  description?: string | null

  is_active: boolean

  is_detail_account?: boolean | null

  balance_debit?: number | null

  balance_credit?: number | null

  current_balance?: number | null

  created_at: string | null

  updated_at: string | null

}



export interface JournalEntry {

  id: string

  entry_number: string

  journal_id: string

  company_id: string

  date: string

  description: string

  reference?: string

  status: JournalEntryStatus

  created_at: string

  updated_at: string

}



export interface JournalEntryLine {

  id: string

  journal_entry_id: string

  account_id: string

  description: string

  debit_amount: number

  credit_amount: number

  auxiliary_account?: string

  letterage?: string

  created_at: string

  updated_at: string

}



export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'



export type JournalEntryStatus = 'draft' | 'validated' | 'pending' | 'posted' | 'cancelled'



// Types FEC

export interface FECEntry {

  journalCode: string

  journalName: string

  entryNumber: string

  entryDate: string

  accountNumber: string

  accountName: string

  auxiliaryAccount?: string

  auxiliaryAccountName?: string

  reference?: string

  date: string

  description: string

  debitAmount: number

  creditAmount: number

  letterage?: string

  dateLetterage?: string

  validationDate?: string

  validationAmount?: number

  id?: string

  status?: JournalEntryStatus

  createdAt?: string

  updatedAt?: string

  companyId?: string

  journalId?: string

  items?: Array<{

    description: string

    accountId: string

    debitAmount: number

    creditAmount: number

    auxiliaryAccount?: string

    letterage?: string

  }>

}



// Types de base de données principal

export interface Database {

  public: {

    Tables: {

      companies: {

        Row: Company

        Insert: Partial<Company>

        Update: Partial<Company>

      }

      chart_of_accounts: {

        Row: Account

        Insert: Partial<Account>

        Update: Partial<Account>

      }

      journals: {

        Row: Record<string, unknown>

        Insert: Record<string, unknown>

        Update: Record<string, unknown>

      }

      journal_entries: {

        Row: JournalEntry

        Insert: Partial<JournalEntry>

        Update: Partial<JournalEntry>

      }

      journal_entry_lines: {

        Row: JournalEntryLine

        Insert: Partial<JournalEntryLine>

        Update: Partial<JournalEntryLine>

      }

      invoices: {

        Row: Record<string, unknown>

        Insert: Record<string, unknown>

        Update: Record<string, unknown>

      }

      quotes: {

        Row: Record<string, unknown>

        Insert: Record<string, unknown>

        Update: Record<string, unknown>

      }

      third_parties: {

        Row: Record<string, unknown>

        Insert: Record<string, unknown>

        Update: Record<string, unknown>

      }

      transactions: {

        Row: Record<string, unknown>

        Insert: Record<string, unknown>

        Update: Record<string, unknown>

      }

      payments: {

        Row: Record<string, unknown>

        Insert: Record<string, unknown>

        Update: Record<string, unknown>

      }

      user_companies: {

        Row: UserCompany

        Insert: Partial<UserCompany>

        Update: Partial<UserCompany>

      }

      user_roles: {

        Row: UserRole

        Insert: Partial<UserRole>

        Update: Partial<UserRole>

      }

    }

    Views: {

      [_ in never]: never

    }

    Functions: {

      [_ in never]: never

    }

    Enums: {

      account_type: AccountType

      journal_entry_status: JournalEntryStatus

    }

    CompositeTypes: {

      [_ in never]: never

    }

  }

}
