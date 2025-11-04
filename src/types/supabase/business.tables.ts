import { Json } from './base.types'

// Business tables: employees, projects, budgets, budget_items, company_modules, stripe_*
export interface BusinessTables {
  employees: {
    Row: {
      id: string
      company_id: string
      user_id: string | null
      first_name: string
      last_name: string
      email: string | null
      phone: string | null
      position: string | null
      department: string | null
      hire_date: string | null
      salary: number | null
      contract_type: string | null
      is_active: boolean | null
      created_at: string | null
      updated_at: string | null
    }
    Insert: {
      id?: string
      company_id: string
      user_id?: string | null
      first_name: string
      last_name: string
      email?: string | null
      phone?: string | null
      position?: string | null
      department?: string | null
      hire_date?: string | null
      salary?: number | null
      contract_type?: string | null
      is_active?: boolean | null
      created_at?: string | null
      updated_at?: string | null
    }
    Update: {
      id?: string
      company_id?: string
      user_id?: string | null
      first_name?: string
      last_name?: string
      email?: string | null
      phone?: string | null
      position?: string | null
      department?: string | null
      hire_date?: string | null
      salary?: number | null
      contract_type?: string | null
      is_active?: boolean | null
      created_at?: string | null
      updated_at?: string | null
    }
  }
  projects: {
    Row: {
      id: string
      company_id: string
      name: string
      description: string | null
      client_name: string | null
      start_date: string | null
      end_date: string | null
      budget: number | null
      status: string
      manager_id: string | null
      created_at: string | null
      updated_at: string | null
    }
    Insert: {
      id?: string
      company_id: string
      name: string
      description?: string | null
      client_name?: string | null
      start_date?: string | null
      end_date?: string | null
      budget?: number | null
      status?: string
      manager_id?: string | null
      created_at?: string | null
      updated_at?: string | null
    }
    Update: {
      id?: string
      company_id?: string
      name?: string
      description?: string | null
      client_name?: string | null
      start_date?: string | null
      end_date?: string | null
      budget?: number | null
      status?: string
      manager_id?: string | null
      created_at?: string | null
      updated_at?: string | null
    }
  }
  budgets: {
    Row: {
      id: string
      company_id: string
      name: string
      period_start_date: string
      period_end_date: string
      description: string | null
      status: string | null
      created_at: string | null
      updated_at: string | null
    }
    Insert: {
      id?: string
      company_id: string
      name: string
      period_start_date: string
      period_end_date: string
      description?: string | null
      status?: string | null
      created_at?: string | null
      updated_at?: string | null
    }
    Update: {
      id?: string
      company_id?: string
      name?: string
      period_start_date?: string
      period_end_date?: string
      description?: string | null
      status?: string | null
      created_at?: string | null
      updated_at?: string | null
    }
  }
  budget_items: {
    Row: {
      id: string
      budget_id: string
      company_id: string
      account_id: string | null
      category_name: string | null
      budgeted_amount: number
      actual_amount: number | null
      currency: string
      notes: string | null
      created_at: string | null
      updated_at: string | null
    }
    Insert: {
      id?: string
      budget_id: string
      company_id: string
      account_id?: string | null
      category_name?: string | null
      budgeted_amount: number
      actual_amount?: number | null
      currency: string
      notes?: string | null
      created_at?: string | null
      updated_at?: string | null
    }
    Update: {
      id?: string
      budget_id?: string
      company_id?: string
      account_id?: string | null
      category_name?: string | null
      budgeted_amount?: number
      actual_amount?: number | null
      currency?: string
      notes?: string | null
      created_at?: string | null
      updated_at?: string | null
    }
  }
  company_modules: {
    Row: {
      id: string
      company_id: string
      module_key: string
      is_enabled: boolean | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      company_id: string
      module_key: string
      is_enabled?: boolean | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      company_id?: string
      module_key?: string
      is_enabled?: boolean | null
      created_at?: string
      updated_at?: string
    }
  }
  stripe_products: {
    Row: {
      id: string
      active: boolean | null
      name: string
      description: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id: string
      active?: boolean | null
      name: string
      description?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      active?: boolean | null
      name?: string
      description?: string | null
      created_at?: string
      updated_at?: string
    }
  }
  stripe_prices: {
    Row: {
      id: string
      product_id: string
      active: boolean | null
      currency: string
      unit_amount: number | null
      type: string | null
      recurring: Json | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id: string
      product_id: string
      active?: boolean | null
      currency: string
      unit_amount?: number | null
      type?: string | null
      recurring?: Json | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      product_id?: string
      active?: boolean | null
      currency?: string
      unit_amount?: number | null
      type?: string | null
      recurring?: Json | null
      created_at?: string
      updated_at?: string
    }
  }
  stripe_subscriptions: {
    Row: {
      stripe_subscription_id: string
      company_id: string
      status: string
      price_id: string | null
      current_period_end: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      stripe_subscription_id: string
      company_id: string
      status: string
      price_id?: string | null
      current_period_end?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      stripe_subscription_id?: string
      company_id?: string
      status?: string
      price_id?: string | null
      current_period_end?: string | null
      created_at?: string
      updated_at?: string
    }
  }
}
