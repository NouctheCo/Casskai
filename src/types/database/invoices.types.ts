// Types liés aux factures, devis et clients

import type { Database } from '../database-types-fix'



// Types pour les factures

export type Invoice = Database['public']['Tables']['invoices']['Row']

export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']

export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']



// Types pour les devis

export type Quote = Database['public']['Tables']['quotes']['Row']

export type QuoteInsert = Database['public']['Tables']['quotes']['Insert']

export type QuoteUpdate = Database['public']['Tables']['quotes']['Update']



// Types pour les clients/tiers

export type Client = Database['public']['Tables']['third_parties']['Row']

export type ClientInsert = Database['public']['Tables']['third_parties']['Insert']

export type ClientUpdate = Database['public']['Tables']['third_parties']['Update']

// Types pour les lignes de facture
export type InvoiceLine = any; // Database['public']['Tables']['invoice_lines']['Row']


// Types métier pour les factures

export interface InvoiceWithDetails extends Invoice {

  client?: Client

  invoice_lines?: InvoiceLine[]

  payments?: Array<{

    id: string

    amount: number

    date: string

    method: string

    status: string

  }>

  total_ht: number

  total_tva: number

  total_ttc: number

  paid_amount: number

  remaining_amount: number

  currency?: string | null

  service_date?: string | null

  delivery_date?: string | null

  vat_exemption_reason?: string | null

}



export interface QuoteWithDetails extends Quote {

  client?: Client

  quote_lines?: QuoteLine[]

  total_ht: number

  total_tva: number

  total_ttc: number

}



export interface QuoteLine {

  id: string

  quote_id: string

  product_name: string

  description?: string

  quantity: number

  unit_price: number

  discount_rate: number

  tax_rate: number

  line_total_ht: number

  line_total_ttc: number

  created_at: string

}



export interface ClientWithStats extends Client {

  total_invoices: number

  total_amount: number

  paid_amount: number

  pending_amount: number

  last_invoice_date: string | null

  payment_delay_average: number

}



export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'

export type ClientType = 'customer' | 'supplier' | 'both'



export interface InvoicingStats {

  company_id: string

  period_start: string

  period_end: string

  invoices_count: number

  quotes_count: number

  total_invoiced: number

  total_paid: number

  average_payment_delay: number

  top_clients: Array<{

    client: Client

    total_amount: number

    invoices_count: number

  }>

}
