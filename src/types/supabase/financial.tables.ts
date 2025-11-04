// Financial tables: invoices, invoice_items, taxes, company_tax_*, bank_accounts, bank_transactions, transactions, expenses
export interface FinancialTables {
  invoices: {
    Row: {
      id: string
      company_id: string
      client_id: string | null
      invoice_number: string
      issue_date: string
      due_date: string | null
      status: string
      currency: string
      subtotal: number
      tax_amount: number | null
      total_amount: number
      amount_paid: number | null
      notes: string | null
      terms: string | null
      pdf_url: string | null
      created_at: string | null
      updated_at: string | null
      client_name: string | null
    }
    Insert: {
      id?: string
      company_id: string
      client_id?: string | null
      invoice_number: string
      issue_date: string
      due_date?: string | null
      status: string
      currency: string
      subtotal: number
      tax_amount?: number | null
      total_amount: number
      amount_paid?: number | null
      notes?: string | null
      terms?: string | null
      pdf_url?: string | null
      created_at?: string | null
      updated_at?: string | null
      client_name?: string | null
    }
    Update: {
      id?: string
      company_id?: string
      client_id?: string | null
      invoice_number?: string
      issue_date?: string
      due_date?: string | null
      status?: string
      currency?: string
      subtotal?: number
      tax_amount?: number | null
      total_amount?: number
      amount_paid?: number | null
      notes?: string | null
      terms?: string | null
      pdf_url?: string | null
      created_at?: string | null
      updated_at?: string | null
      client_name?: string | null
    }
  }
  invoice_items: {
    Row: {
      id: string
      invoice_id: string
      company_id: string
      description: string
      quantity: number
      unit_price: number
      tax_rate: number | null
      total_amount: number
      created_at: string | null
      updated_at: string | null
    }
    Insert: {
      id?: string
      invoice_id: string
      company_id: string
      description: string
      quantity: number
      unit_price: number
      tax_rate?: number | null
      total_amount: number
      created_at?: string | null
      updated_at?: string | null
    }
    Update: {
      id?: string
      invoice_id?: string
      company_id?: string
      description?: string
      quantity?: number
      unit_price?: number
      tax_rate?: number | null
      total_amount?: number
      created_at?: string | null
      updated_at?: string | null
    }
  }
  taxes: {
    Row: {
      id: string
      company_id: string
      name: string
      rate: number
      is_active: boolean | null
      collect_account: string | null
      deduct_account: string | null
      country: string | null
      created_at: string | null
      updated_at: string | null
    }
    Insert: {
      id?: string
      company_id: string
      name: string
      rate: number
      is_active?: boolean | null
      collect_account?: string | null
      deduct_account?: string | null
      country?: string | null
      created_at?: string | null
      updated_at?: string | null
    }
    Update: {
      id?: string
      company_id?: string
      name?: string
      rate?: number
      is_active?: boolean | null
      collect_account?: string | null
      deduct_account?: string | null
      country?: string | null
      created_at?: string | null
      updated_at?: string | null
    }
  }
  company_tax_rates: {
    Row: {
      id: string
      company_id: string
      name: string
      rate: number
      type: string
      description: string
      is_default: boolean
      is_active: boolean
      valid_from: string
      created_by: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      company_id: string
      name: string
      rate: number
      type: string
      description?: string
      is_default?: boolean
      is_active?: boolean
      valid_from?: string
      created_by?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      company_id?: string
      name?: string
      rate?: number
      type?: string
      description?: string
      is_default?: boolean
      is_active?: boolean
      valid_from?: string
      created_by?: string | null
      created_at?: string
      updated_at?: string
    }
  }
  company_tax_declarations: {
    Row: {
      id: string
      company_id: string
      type: string
      name: string
      period_start: string | null
      period_end: string | null
      due_date: string
      status: string
      amount: number | null
      description: string
      currency: string
      submitted_date: string | null
      submitted_by: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      company_id: string
      type: string
      name: string
      period_start?: string | null
      period_end?: string | null
      due_date: string
      status?: string
      amount?: number | null
      description?: string
      currency?: string
      submitted_date?: string | null
      submitted_by?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      company_id?: string
      type?: string
      name?: string
      period_start?: string | null
      period_end?: string | null
      due_date?: string
      status?: string
      amount?: number | null
      description?: string
      currency?: string
      submitted_date?: string | null
      submitted_by?: string | null
      created_at?: string
      updated_at?: string
    }
  }
  company_tax_payments: {
    Row: {
      id: string
      company_id: string
      declaration_id: string | null
      amount: number
      currency: string
      payment_date: string
      payment_method: string
      reference: string | null
      status: string
      receipt_url: string | null
      created_by: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      company_id: string
      declaration_id?: string | null
      amount: number
      currency?: string
      payment_date: string
      payment_method: string
      reference?: string | null
      status?: string
      receipt_url?: string | null
      created_by?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      company_id?: string
      declaration_id?: string | null
      amount?: number
      currency?: string
      payment_date?: string
      payment_method?: string
      reference?: string | null
      status?: string
      receipt_url?: string | null
      created_by?: string | null
      created_at?: string
      updated_at?: string
    }
  }
  company_tax_documents: {
    Row: {
      id: string
      company_id: string
      declaration_id: string | null
      name: string
      type: string
      file_url: string
      file_size: number | null
      mime_type: string | null
      uploaded_by: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      company_id: string
      declaration_id?: string | null
      name: string
      type: string
      file_url: string
      file_size?: number | null
      mime_type?: string | null
      uploaded_by?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      company_id?: string
      declaration_id?: string | null
      name?: string
      type?: string
      file_url?: string
      file_size?: number | null
      mime_type?: string | null
      uploaded_by?: string | null
      created_at?: string
      updated_at?: string
    }
  }
  bank_accounts: {
    Row: {
      id: string
      company_id: string
      account_name: string
      bank_name: string | null
      account_number_masked: string | null
      currency: string
      type: string | null
      is_active: boolean | null
      current_balance: number | null
      last_synced_at: string | null
      notes: string | null
      created_at: string | null
      updated_at: string | null
    }
    Insert: {
      id?: string
      company_id: string
      account_name: string
      bank_name?: string | null
      account_number_masked?: string | null
      currency: string
      type?: string | null
      is_active?: boolean | null
      current_balance?: number | null
      last_synced_at?: string | null
      notes?: string | null
      created_at?: string | null
      updated_at?: string | null
    }
    Update: {
      id?: string
      company_id?: string
      account_name?: string
      bank_name?: string | null
      account_number_masked?: string | null
      currency?: string
      type?: string | null
      is_active?: boolean | null
      current_balance?: number | null
      last_synced_at?: string | null
      notes?: string | null
      created_at?: string | null
      updated_at?: string | null
    }
  }
  bank_transactions: {
    Row: {
      id: string
      company_id: string
      bank_account_id: string
      transaction_date: string
      amount: number
      currency: string | null
      label: string | null
      reference: string | null
      linked_journal_line_id: string | null
      created_at: string | null
    }
    Insert: {
      id?: string
      company_id: string
      bank_account_id: string
      transaction_date: string
      amount: number
      currency?: string | null
      label?: string | null
      reference?: string | null
      linked_journal_line_id?: string | null
      created_at?: string | null
    }
    Update: {
      id?: string
      company_id?: string
      bank_account_id?: string
      transaction_date?: string
      amount?: number
      currency?: string | null
      label?: string | null
      reference?: string | null
      linked_journal_line_id?: string | null
      created_at?: string | null
    }
  }
  transactions: {
    Row: {
      id: string
      company_id: string
      bank_account_id: string | null
      transaction_date: string
      description: string
      amount: number
      currency: string
      type: string | null
      category: string | null
      status: string | null
      reference_number: string | null
      is_reconciled: boolean | null
      created_at: string | null
      updated_at: string | null
    }
    Insert: {
      id?: string
      company_id: string
      bank_account_id?: string | null
      transaction_date: string
      description: string
      amount: number
      currency: string
      type?: string | null
      category?: string | null
      status?: string | null
      reference_number?: string | null
      is_reconciled?: boolean | null
      created_at?: string | null
      updated_at?: string | null
    }
    Update: {
      id?: string
      company_id?: string
      bank_account_id?: string | null
      transaction_date?: string
      description?: string
      amount?: number
      currency?: string
      type?: string | null
      category?: string | null
      status?: string | null
      reference_number?: string | null
      is_reconciled?: boolean | null
      created_at?: string | null
      updated_at?: string | null
    }
  }
  expenses: {
    Row: {
      id: string
      company_id: string
      supplier_id: string | null
      expense_date: string
      category: string | null
      description: string
      amount: number
      currency: string
      status: string | null
      receipt_url: string | null
      notes: string | null
      created_at: string | null
      updated_at: string | null
    }
    Insert: {
      id?: string
      company_id: string
      supplier_id?: string | null
      expense_date: string
      category?: string | null
      description: string
      amount: number
      currency: string
      status?: string | null
      receipt_url?: string | null
      notes?: string | null
      created_at?: string | null
      updated_at?: string | null
    }
    Update: {
      id?: string
      company_id?: string
      supplier_id?: string | null
      expense_date?: string
      category?: string | null
      description?: string
      amount?: number
      currency?: string
      status?: string | null
      receipt_url?: string | null
      notes?: string | null
      created_at?: string | null
      updated_at?: string | null
    }
  }
  reconciliations: {
    Row: {
      id: string
      company_id: string
      bank_account_id: string
      statement_date: string
      statement_ending_balance: number
      calculated_ending_balance: number | null
      difference: number | null
      status: string | null
      notes: string | null
      created_at: string | null
      updated_at: string | null
    }
    Insert: {
      id?: string
      company_id: string
      bank_account_id: string
      statement_date: string
      statement_ending_balance: number
      calculated_ending_balance?: number | null
      difference?: number | null
      status?: string | null
      notes?: string | null
      created_at?: string | null
      updated_at?: string | null
    }
    Update: {
      id?: string
      company_id?: string
      bank_account_id?: string
      statement_date?: string
      statement_ending_balance?: number
      calculated_ending_balance?: number | null
      difference?: number | null
      status?: string | null
      notes?: string | null
      created_at?: string | null
      updated_at?: string | null
    }
  }
  reconciled_items: {
    Row: {
      id: string
      reconciliation_id: string
      transaction_id: string
      company_id: string
      reconciled_at: string | null
    }
    Insert: {
      id?: string
      reconciliation_id: string
      transaction_id: string
      company_id: string
      reconciled_at?: string | null
    }
    Update: {
      id?: string
      reconciliation_id?: string
      transaction_id?: string
      company_id?: string
      reconciled_at?: string | null
    }
  }
  currencies: {
    Row: {
      code: string
      name: string
      symbol: string
      is_active: boolean | null
    }
    Insert: {
      code: string
      name: string
      symbol: string
      is_active?: boolean | null
    }
    Update: {
      code?: string
      name?: string
      symbol?: string
      is_active?: boolean | null
    }
  }
  exchange_rates: {
    Row: {
      id: string
      base_currency: string
      target_currency: string
      rate: number
      rate_date: string
      created_at: string | null
    }
    Insert: {
      id?: string
      base_currency: string
      target_currency: string
      rate: number
      rate_date: string
      created_at?: string | null
    }
    Update: {
      id?: string
      base_currency?: string
      target_currency?: string
      rate?: number
      rate_date?: string
      created_at?: string | null
    }
  }
}
