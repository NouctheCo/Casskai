// Types liés aux transactions et paiements
import type { Database } from '../database-types-fix'

// Types pour les transactions
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

// Types pour les paiements
export type Payment = Database['public']['Tables']['payments']['Row']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']
export type PaymentUpdate = Database['public']['Tables']['payments']['Update']

// Types métier pour les transactions
export interface TransactionWithDetails extends Transaction {
  account?: {
    id: string
    name: string
    account_number: string
    type: string
  }
  journal?: {
    id: string
    name: string
    code: string
    type: string
  }
  third_party?: {
    id: string
    name: string
    type: string
  }
}

export interface PaymentWithTransaction extends Payment {
  transaction?: TransactionWithDetails
}

export interface TransactionSummary {
  company_id: string
  period_start: string
  period_end: string
  total_income: number
  total_expenses: number
  net_result: number
  transaction_count: number
  account_summary: Array<{
    account_id: string
    account_name: string
    total_debit: number
    total_credit: number
    balance: number
  }>
}

export type TransactionStatus = 'draft' | 'pending' | 'validated' | 'cancelled'
export type PaymentMethod = 'cash' | 'check' | 'transfer' | 'card' | 'other'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled'

export interface CashFlowStatement {
  company_id: string
  period_start: string
  period_end: string
  operating_activities: number
  investing_activities: number
  financing_activities: number
  net_cash_flow: number
  opening_cash: number
  closing_cash: number
}
