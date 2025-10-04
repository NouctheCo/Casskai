import { createClient } from '@supabase/supabase-js';

// Ensure environment variables are available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing environment variable: VITE_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing environment variable: VITE_SUPABASE_ANON_KEY');
}

// Create Supabase client with proper configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'CassKai',
    },
  },
});

// Types for our database schema
export interface Database {
  public: {
    Tables: {
      companies: {
      Row: {
        id: string;
        name: string;
        country: string;
        default_currency: string;
        default_locale: string;
        timezone: string;
        owner_id: string | null;
        created_by: string | null;
        legal_form: string | null;
        registration_number: string | null;
        tax_number: string | null;
        address: string | null;
        city: string | null;
        postal_code: string | null;
        phone: string | null;
        email: string | null;
        website: string | null;
        sector: string | null;
        is_active: boolean;
        active_modules?: string | null;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        name: string;
        country?: string;
        default_currency?: string;
        default_locale?: string;
        timezone?: string;
        owner_id?: string | null;
        created_by?: string | null;
        legal_form?: string | null;
        registration_number?: string | null;
        tax_number?: string | null;
        address?: string | null;
        city?: string | null;
        postal_code?: string | null;
        phone?: string | null;
        email?: string | null;
        website?: string | null;
        sector?: string | null;
        is_active?: boolean;
        active_modules?: string | null;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        name?: string;
        country?: string;
        default_currency?: string;
        default_locale?: string;
        timezone?: string;
        owner_id?: string | null;
        created_by?: string | null;
        legal_form?: string | null;
        registration_number?: string | null;
        tax_number?: string | null;
        address?: string | null;
        city?: string | null;
        postal_code?: string | null;
        phone?: string | null;
        email?: string | null;
        website?: string | null;
        sector?: string | null;
        is_active?: boolean;
        active_modules?: string | null;
        updated_at?: string;
      };
    };
    user_companies: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          is_default: boolean;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id: string;
          is_default?: boolean;
          role?: string;
          created_at?: string;
        };
        Update: {
          is_default?: boolean;
          role?: string;
        };
      };
      accounts: {
        Row: {
          id: string;
          company_id: string;
          account_number: string;
          name: string;
          type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
          description?: string;
          is_active: boolean;
          balance: number;
          currency: string;
          class: number;
          parent_code?: string;
          tva_type?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          account_number: string;
          name: string;
          type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
          description?: string;
          is_active?: boolean;
          balance?: number;
          currency?: string;
          class: number;
          parent_code?: string;
          tva_type?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          is_active?: boolean;
          balance?: number;
          parent_code?: string;
          tva_type?: string;
          updated_at?: string;
        };
      };
      third_parties: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          type: 'CLIENT' | 'SUPPLIER';
          email?: string;
          phone?: string;
          address?: string;
          city?: string;
          postal_code?: string;
          country: string;
          website?: string;
          tax_number?: string;
          is_active: boolean;
          balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          type: 'CLIENT' | 'SUPPLIER';
          email?: string;
          phone?: string;
          address?: string;
          city?: string;
          postal_code?: string;
          country?: string;
          website?: string;
          tax_number?: string;
          is_active?: boolean;
          balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          email?: string;
          phone?: string;
          address?: string;
          city?: string;
          postal_code?: string;
          website?: string;
          tax_number?: string;
          is_active?: boolean;
          balance?: number;
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          company_id: string;
          third_party_id: string;
          invoice_number: string;
          type: 'sale' | 'purchase' | 'credit_note' | 'debit_note';
          status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
          issue_date: string;
          due_date: string;
          subtotal: number;
          tax_amount: number;
          total_amount: number;
          paid_amount: number;
          currency: string;
          notes?: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          third_party_id: string;
          invoice_number: string;
          type?: 'sale' | 'purchase' | 'credit_note' | 'debit_note';
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
          issue_date: string;
          due_date: string;
          subtotal?: number;
          tax_amount?: number;
          total_amount: number;
          paid_amount?: number;
          currency?: string;
          notes?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          third_party_id?: string;
          invoice_number?: string;
          type?: 'sale' | 'purchase' | 'credit_note' | 'debit_note';
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
          issue_date?: string;
          due_date?: string;
          subtotal?: number;
          tax_amount?: number;
          total_amount?: number;
          paid_amount?: number;
          currency?: string;
          notes?: string;
          updated_at?: string;
        };
      };
      invoice_lines: {
        Row: {
          id: string;
          company_id: string;
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          discount_percent?: number;
          tax_rate?: number;
          line_total: number;
          account_id?: string;
          line_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          discount_percent?: number;
          tax_rate?: number;
          line_total: number;
          account_id?: string;
          line_order?: number;
          created_at?: string;
        };
        Update: {
          description?: string;
          quantity?: number;
          unit_price?: number;
          discount_percent?: number;
          tax_rate?: number;
          line_total?: number;
          account_id?: string;
          line_order?: number;
        };
      };
      payments: {
        Row: {
          id: string;
          company_id: string;
          invoice_id?: string;
          third_party_id?: string;
          reference: string;
          amount: number;
          payment_date: string;
          payment_method: 'card' | 'bank_transfer' | 'cash' | 'check' | 'other';
          status: 'completed' | 'pending' | 'failed' | 'cancelled';
          type: 'income' | 'expense';
          description?: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          invoice_id?: string;
          third_party_id?: string;
          reference: string;
          amount: number;
          payment_date: string;
          payment_method: 'card' | 'bank_transfer' | 'cash' | 'check' | 'other';
          status?: 'completed' | 'pending' | 'failed' | 'cancelled';
          type: 'income' | 'expense';
          description?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          invoice_id?: string;
          third_party_id?: string;
          reference?: string;
          amount?: number;
          payment_date?: string;
          payment_method?: 'card' | 'bank_transfer' | 'cash' | 'check' | 'other';
          status?: 'completed' | 'pending' | 'failed' | 'cancelled';
          type?: 'income' | 'expense';
          description?: string;
          updated_at?: string;
        };
      };
      bank_transactions: {
        Row: {
          id: string;
          bank_account_id: string;
          company_id: string;
          transaction_date: string;
          value_date?: string;
          amount: number;
          currency: string;
          description: string;
          reference?: string;
          category?: string;
          reconciled: boolean;
          imported_from?: 'csv' | 'ofx' | 'qif' | 'api';
          raw_data?: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bank_account_id: string;
          company_id: string;
          transaction_date: string;
          value_date?: string;
          amount: number;
          currency: string;
          description: string;
          reference?: string;
          category?: string;
          reconciled?: boolean;
          imported_from?: 'csv' | 'ofx' | 'qif' | 'api';
          raw_data?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          transaction_date?: string;
          value_date?: string;
          amount?: number;
          currency?: string;
          description?: string;
          reference?: string;
          category?: string;
          reconciled?: boolean;
          updated_at?: string;
        };
      };
      bank_accounts: {
        Row: {
          id: string;
          company_id: string;
          bank_name: string;
          account_name: string;
          account_number: string;
          iban?: string;
          bic?: string;
          currency: string;
          balance: number;
          account_type: 'checking' | 'savings' | 'business' | 'other';
          status: 'active' | 'closed' | 'suspended';
          last_import?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          bank_name: string;
          account_name: string;
          account_number: string;
          iban?: string;
          bic?: string;
          currency: string;
          balance?: number;
          account_type: 'checking' | 'savings' | 'business' | 'other';
          status?: 'active' | 'closed' | 'suspended';
          last_import?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          bank_name?: string;
          account_name?: string;
          account_number?: string;
          iban?: string;
          bic?: string;
          currency?: string;
          balance?: number;
          account_type?: 'checking' | 'savings' | 'business' | 'other';
          status?: 'active' | 'closed' | 'suspended';
          last_import?: string;
          updated_at?: string;
        };
      };
      accounting_entries: {
        Row: {
          id: string;
          company_id: string;
          journal_id: string;
          account_id: string;
          date: string;
          debit: number;
          credit: number;
          description: string;
          reference?: string;
          reconciled: boolean;
          bank_transaction_id?: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          journal_id: string;
          account_id: string;
          date: string;
          debit?: number;
          credit?: number;
          description: string;
          reference?: string;
          reconciled?: boolean;
          bank_transaction_id?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          journal_id?: string;
          account_id?: string;
          date?: string;
          debit?: number;
          credit?: number;
          description?: string;
          reference?: string;
          reconciled?: boolean;
          bank_transaction_id?: string;
          updated_at?: string;
        };
      };
      reconciliation_rules: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          description?: string;
          conditions: Record<string, unknown>;
          actions: Record<string, unknown>;
          priority: number;
          active: boolean;
          auto_apply: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          description?: string;
          conditions: Record<string, unknown>;
          actions: Record<string, unknown>;
          priority?: number;
          active?: boolean;
          auto_apply?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          conditions?: Record<string, unknown>;
          actions?: Record<string, unknown>;
          priority?: number;
          active?: boolean;
          auto_apply?: boolean;
          updated_at?: string;
        };
      };
      reconciliation_log: {
        Row: {
          id: string;
          company_id: string;
          bank_transaction_id: string;
          accounting_entry_id?: string;
          action: 'match' | 'unmatch' | 'ignore';
          confidence?: number;
          match_reason?: string;
          user_id?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          bank_transaction_id: string;
          accounting_entry_id?: string;
          action: 'match' | 'unmatch' | 'ignore';
          confidence?: number;
          match_reason?: string;
          user_id?: string;
          created_at?: string;
        };
        Update: {
          accounting_entry_id?: string;
          action?: 'match' | 'unmatch' | 'ignore';
          confidence?: number;
          match_reason?: string;
        };
      };
    };
  };
}

// Utility function to handle Supabase errors
export const handleSupabaseError = (error: unknown) => {
  console.error('Supabase error:', error);
  
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    if (error.message.includes('JWT')) {
      return 'Session expired. Please log in again.';
    }
    
    if (error.message.includes('Row Level Security')) {
      return 'Access denied. You don\'t have permission for this operation.';
    }
    
    return error.message;
  }
  
  return 'An unexpected error occurred.';
};

// Helper function to get current user's companies
export const getUserCompanies = async (userId?: string) => {
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    resolvedUserId = user.id;
  }

  const { data, error } = await supabase
    .from('user_companies')
    .select(`
      *,
      companies:company_id (
        id,
        name,
        country,
        default_currency,
        default_locale,
        timezone,
        is_active
      )
    `)
  .eq('user_id', resolvedUserId);

  if (error) {
    // Gestion gracieuse des erreurs RLS/500 - permet l'onboarding
    if (error.message?.includes('500') ||
        error.message?.includes('policy') ||
        error.message?.includes('RLS') ||
        error.code === '42P17') {
      console.warn('🔄 RLS/Policy error in getUserCompanies - returning empty array for onboarding');
      return [];
    }
    throw new Error(handleSupabaseError(error));
  }

  return data || [];
};

// Helper function to get current user's default company
export const getCurrentCompany = async (userId?: string) => {
  const companies = await getUserCompanies(userId);
  const defaultCompany = companies.find(uc => uc.is_default);
  return defaultCompany?.companies || companies[0]?.companies || null;
};

export default supabase;