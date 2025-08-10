import { supabase } from '../lib/supabase';
const isDev = typeof import.meta !== 'undefined' && !!import.meta.env?.DEV;

export const testSupabaseConnection = async () => {
  try {
  if (isDev) console.warn('🔄 Testing Supabase connection...');
    
    // Test basic connection
  const { error } = await supabase.from('companies').select('count').limit(1);
    
    if (error) {
      if (isDev) console.error('❌ Connection test failed:', error.message);
      return { success: false, error: error.message };
    }
    if (isDev) console.warn('✅ Supabase connection successful!');
    
    // Test authentication state
    const { data: { session } } = await supabase.auth.getSession();
    const authStatus = session ? 'authenticated' : 'not authenticated';
  if (isDev) console.warn(`🔐 Auth status: ${authStatus}`);
    
    return { 
      success: true, 
      authStatus,
      message: 'Connection test passed!'
    };
  } catch (error) {
  if (isDev) console.error('❌ Unexpected error:', error);
    return { 
      success: false, 
      error: 'Unexpected connection error'
    };
  }
};

export const testDatabaseTables = async () => {
  try {
  if (isDev) console.warn('🔄 Testing database tables...');
    
    const tables = [
      'companies',
      'user_companies', 
      'accounts',
      'journals',
      'journal_entries',
      'third_parties',
      'company_tax_rates',
      'purchases'
    ];
    
    const results = [];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          if (isDev) console.error(`❌ Table ${table}: ${error.message}`);
          results.push({ table, status: 'error', error: error.message });
        } else {
          if (isDev) console.warn(`✅ Table ${table}: ${count} records`);
          results.push({ table, status: 'ok', count });
        }
      } catch {
        if (isDev) console.error(`❌ Table ${table}: Unexpected error`);
        results.push({ table, status: 'error', error: 'Unexpected error' });
      }
    }
    
    return { success: true, results };
  } catch (error: any) {
    if (isDev) console.error('❌ Database test failed:', error);
    return { success: false, error: error?.message || 'Unexpected error' };
  }
};