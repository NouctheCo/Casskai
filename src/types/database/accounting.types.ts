// Types liés à la comptabilité

import type { Database } from '../database-types-fix'



// Types pour les comptes comptables

export type Account = Database['public']['Tables']['chart_of_accounts']['Row']

export type AccountInsert = Database['public']['Tables']['chart_of_accounts']['Insert']

export type AccountUpdate = Database['public']['Tables']['chart_of_accounts']['Update']



// Types pour les journaux

export type Journal = Database['public']['Tables']['journals']['Row']

export type JournalInsert = Database['public']['Tables']['journals']['Insert']

export type JournalUpdate = Database['public']['Tables']['journals']['Update']



// Types pour les écritures comptables

export type JournalEntry = Database['public']['Tables']['journal_entries']['Row']

export type JournalEntryInsert = Database['public']['Tables']['journal_entries']['Insert']

export type JournalEntryUpdate = Database['public']['Tables']['journal_entries']['Update']



// Types pour les lignes d'écritures

export type JournalEntryLine = Database['public']['Tables']['journal_entry_lines']['Row']

export type JournalEntryLineInsert = Database['public']['Tables']['journal_entry_lines']['Insert']

export type JournalEntryLineUpdate = Database['public']['Tables']['journal_entry_lines']['Update']



// Types métier pour la comptabilité

export interface AccountWithBalance extends Account {

  current_balance: number

  balance_date: string

}



export interface JournalWithStats extends Journal {

  entries_count: number

  last_entry_date: string | null

  total_debit: number

  total_credit: number

}



export interface JournalEntryWithLines extends JournalEntry {

  lines: JournalEntryLine[]

  total_debit: number

  total_credit: number

  is_balanced: boolean

}



export interface ChartOfAccounts {

  company_id: string

  accounts: AccountWithBalance[]

  total_assets: number

  total_liabilities: number

  total_equity: number

  total_revenue: number

  total_expenses: number

}



export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'

export type JournalType = 'sale' | 'purchase' | 'bank' | 'cash' | 'miscellaneous'



export interface TrialBalance {

  company_id: string

  period_start: string

  period_end: string

  accounts: Array<{

    account: Account

    opening_balance: number

    debit_total: number

    credit_total: number

    closing_balance: number

  }>

}
