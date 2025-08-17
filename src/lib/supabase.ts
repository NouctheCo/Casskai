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
    };
  };
}

// Utility function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  
  if (error?.message?.includes('JWT')) {
    return 'Session expired. Please log in again.';
  }
  
  if (error?.message?.includes('Row Level Security')) {
    return 'Access denied. You don\'t have permission for this operation.';
  }
  
  return error?.message || 'An unexpected error occurred.';
};

// Helper function to get current user's companies
export const getUserCompanies = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
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
    .eq('user_id', user.id);

  if (error) {
    throw new Error(handleSupabaseError(error));
  }

  return data || [];
};

// Helper function to get current user's default company
export const getCurrentCompany = async () => {
  const companies = await getUserCompanies();
  const defaultCompany = companies.find(uc => uc.is_default);
  return defaultCompany?.companies || companies[0]?.companies || null;
};

export default supabase;