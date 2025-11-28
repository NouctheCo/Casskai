import { Json } from './base.types'

// Accounting tables: accounts, journals, journal_entries, journal_entry_lines, journal_lines, third_parties
export interface AccountingTables {
  accounts: {
    Row: {
      id: string
      company_id: string
      account_number: string
      name: string
      type: string
      description: string | null
      is_active: boolean | null
      balance: number | null
      currency: string
      created_at: string | null
      updated_at: string | null
      code: string | null
      label: string | null
      parent_code: string | null
      class: number | null
      tva_type: string | null
      imported_from_fec: boolean | null
    }
    Insert: {
      id?: string
      company_id: string
      account_number: string
      name: string
      type: string
      description?: string | null
      is_active?: boolean | null
      balance?: number | null
      currency: string
      created_at?: string | null
      updated_at?: string | null
      code?: string | null
      label?: string | null
      parent_code?: string | null
      class?: number | null
      tva_type?: string | null
      imported_from_fec?: boolean | null
    }
    Update: {
      id?: string
      company_id?: string
      account_number?: string
      name?: string
      type?: string
      description?: string | null
      is_active?: boolean | null
      balance?: number | null
      currency?: string
      created_at?: string | null
      updated_at?: string | null
      code?: string | null
      label?: string | null
      parent_code?: string | null
      class?: number | null
      tva_type?: string | null
      imported_from_fec?: boolean | null
    }
  }
  journals: {
    Row: {
      id: string
      company_id: string
      code: string
      name: string
      type: string
      description: string | null
      is_active: boolean | null
      last_entry_number: number | null
      created_at: string | null
      updated_at: string | null
      imported_from_fec: boolean | null
    }
    Insert: {
      id?: string
      company_id: string
      code: string
      name: string
      type: string
      description?: string | null
      is_active?: boolean | null
      last_entry_number?: number | null
      created_at?: string | null
      updated_at?: string | null
      imported_from_fec?: boolean | null
    }
    Update: {
      id?: string
      company_id?: string
      code?: string
      name?: string
      type?: string
      description?: string | null
      is_active?: boolean | null
      last_entry_number?: number | null
      created_at?: string | null
      updated_at?: string | null
      imported_from_fec?: boolean | null
    }
  }
  journal_entries: {
    Row: {
      id: string
      company_id: string
      entry_date: string
      description: string
      reference_number: string | null
      journal_id: string | null
      created_at: string | null
      updated_at: string | null
      entry_number: string | null
      status: string | null
      imported_from_fec: boolean | null
      original_fec_data: Json | null
      fec_journal_code: string | null
      fec_entry_num: string | null
    }
    Insert: {
      id?: string
      company_id: string
      entry_date: string
      description: string
      reference_number?: string | null
      journal_id?: string | null
      created_at?: string | null
      updated_at?: string | null
      entry_number?: string | null
      status?: string | null
      imported_from_fec?: boolean | null
      original_fec_data?: Json | null
      fec_journal_code?: string | null
      fec_entry_num?: string | null
    }
    Update: {
      id?: string
      company_id?: string
      entry_date?: string
      description?: string
      reference_number?: string | null
      journal_id?: string | null
      created_at?: string | null
      updated_at?: string | null
      entry_number?: string | null
      status?: string | null
      imported_from_fec?: boolean | null
      original_fec_data?: Json | null
      fec_journal_code?: string | null
      fec_entry_num?: string | null
    }
  }
  journal_entry_lines: {
    Row: {
      id: string
      journal_entry_id: string
      account_id: string
      description: string
      debit_amount: number
      credit_amount: number
      line_order: number | null
      created_at: string | null
      account_number: string | null
      account_name: string | null
    }
    Insert: {
      id?: string
      journal_entry_id: string
      account_id: string
      description: string
      debit_amount?: number
      credit_amount?: number
      line_order?: number | null
      created_at?: string | null
      account_number?: string | null
      account_name?: string | null
    }
    Update: {
      id?: string
      journal_entry_id?: string
      account_id?: string
      description?: string
      debit_amount?: number
      credit_amount?: number
      line_order?: number | null
      created_at?: string | null
      account_number?: string | null
      account_name?: string | null
    }
  }
  journal_lines: {
    Row: {
      id: string
      journal_entry_id: string
      account_id: string
      debit: number | null
      credit: number | null
      currency: string | null
      description: string | null
      client_id: string | null
      supplier_id: string | null
      tax_id: string | null
      invoice_id: string | null
      expense_id: string | null
      created_at: string | null
    }
    Insert: {
      id?: string
      journal_entry_id: string
      account_id: string
      debit?: number | null
      credit?: number | null
      currency?: string | null
      description?: string | null
      client_id?: string | null
      supplier_id?: string | null
      tax_id?: string | null
      invoice_id?: string | null
      expense_id?: string | null
      created_at?: string | null
    }
    Update: {
      id?: string
      journal_entry_id?: string
      account_id?: string
      debit?: number | null
      credit?: number | null
      currency?: string | null
      description?: string | null
      client_id?: string | null
      supplier_id?: string | null
      tax_id?: string | null
      invoice_id?: string | null
      expense_id?: string | null
      created_at?: string | null
    }
  }
  third_parties: {
    Row: {
      id: string
      company_id: string
      name: string
      email: string | null
      phone: string | null
      address: string | null
      city: string | null
      postal_code: string | null
      country: string | null
      tax_number: string | null
      type: string
      is_active: boolean | null
      balance: number | null
      notes: string | null
      default_payment_terms: string | null
      default_currency: string | null
      created_at: string | null
      updated_at: string | null
      website: string | null
      contact_name: string | null
    }
    Insert: {
      id?: string
      company_id: string
      name: string
      email?: string | null
      phone?: string | null
      address?: string | null
      city?: string | null
      postal_code?: string | null
      country?: string | null
      tax_number?: string | null
      type: string
      is_active?: boolean | null
      balance?: number | null
      notes?: string | null
      default_payment_terms?: string | null
      default_currency?: string | null
      created_at?: string | null
      updated_at?: string | null
      website?: string | null
      contact_name?: string | null
    }
    Update: {
      id?: string
      company_id?: string
      name?: string
      email?: string | null
      phone?: string | null
      address?: string | null
      city?: string | null
      postal_code?: string | null
      country?: string | null
      tax_number?: string | null
      type?: string
      is_active?: boolean | null
      balance?: number | null
      notes?: string | null
      default_payment_terms?: string | null
      default_currency?: string | null
      created_at?: string | null
      updated_at?: string | null
      website?: string | null
      contact_name?: string | null
    }
  }
}
