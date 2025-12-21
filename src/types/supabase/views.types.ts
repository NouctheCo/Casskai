// Database views, functions, enums, and composite types
export interface DatabaseViews {
  balance_generale: {
    Row: {
      account_number: string | null
      name: string | null
      type: string | null
      class: number | null
      balance: number | null
      currency: string | null
      company_name: string | null
      company_id: string | null
    }
  }
  grand_livre: {
    Row: {
      entry_date: string | null
      entry_number: string | null
      description: string | null
      account_number: string | null
      account_name: string | null
      line_description: string | null
      debit_amount: number | null
      credit_amount: number | null
      journal_name: string | null
      company_name: string | null
      company_id: string | null
    }
  }
}

export type DatabaseFunctions = {
  [_ in never]: never
}

export type DatabaseEnums = {
  [_ in never]: never
}

export type DatabaseCompositeTypes = {
  [_ in never]: never
}
