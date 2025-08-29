import { supabase } from '../lib/supabase';

export const testSupabaseConnection = async () => {
  try {
    // Test basic connection
    const { error } = await supabase.from('companies').select('count').limit(1);

    if (error) {
      console.error('❌ Connection test failed:', error.message);
      return { success: false, error: error.message };
    }

    // Test authentication state
    const { data: { session } } = await supabase.auth.getSession();
    const authStatus = session ? 'authenticated' : 'not authenticated';

    return {
      success: true,
      authStatus,
      message: 'Connection test passed!',
    };
  } catch (error) {
    console.error('❌ Unexpected error during connection test:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: 'Unexpected connection error',
      details: errorMessage,
    };
  }
};

export const testDatabaseTables = async () => {
  try {
    const tables = [
      'companies',
      'user_companies',
      'accounts',
      'journals',
      'journal_entries',
      'third_parties',
      'company_tax_rates',
      'purchases',
    ];

    const tableCheckPromises = tables.map(async (table) => {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.error(`❌ Table ${table}: ${error.message}`);
          return { table, status: 'error', error: error.message };
        }
        return { table, status: 'ok', count };
      } catch (err) {
        console.error(`❌ Table ${table}: Unexpected error`, err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        return { table, status: 'error', error: 'Unexpected error', details: errorMessage };
      }
    });

    const results = await Promise.all(tableCheckPromises);

    return { success: true, results };
  } catch (error) {
    console.error('❌ Database test failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
};