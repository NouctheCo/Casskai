import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are properly configured
const isConfigured = supabaseUrl && 
                    supabaseAnonKey && 
                    supabaseUrl !== 'your-supabase-url' && 
                    supabaseAnonKey !== 'your-supabase-anon-key' &&
                    supabaseUrl !== 'https://placeholder.supabase.co' &&
                    supabaseAnonKey !== 'placeholder-key';

if (!isConfigured) {
  console.error('❌ Supabase configuration error:');
  console.error('Missing or invalid Supabase environment variables.');
  console.error('Please check your .env file and ensure you have:');
  console.error('- VITE_SUPABASE_URL=your-actual-supabase-url');
  console.error('- VITE_SUPABASE_ANON_KEY=your-actual-supabase-anon-key');
  console.error('');
  console.error('Current values:');
  console.error(`- VITE_SUPABASE_URL: ${supabaseUrl || 'undefined'}`);
  console.error(`- VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '[REDACTED]' : 'undefined'}`);
}

// Create Supabase client with additional options for better error handling
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web'
      }
    },
    // Add retry logic for failed requests
    db: {
      schema: 'public'
    }
  }
);

// Enhanced connection test with better error handling
if (isConfigured) {
  const testConnection = async () => {
    try {
      // Test basic connectivity first
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Supabase auth test failed:', error.message);
        
        // Provide specific guidance based on error type
        if (error.message.includes('Failed to fetch')) {
          console.error('🔧 This indicates a network connectivity issue. Please check:');
          console.error('1. Your internet connection');
          console.error('2. Supabase project status at https://status.supabase.com/');
          console.error('3. CORS settings in your Supabase project dashboard');
          console.error('4. Firewall or proxy settings blocking the request');
        } else if (error.message.includes('Invalid API key')) {
          console.error('🔧 Invalid API key. Please verify your VITE_SUPABASE_ANON_KEY in .env');
        } else if (error.message.includes('Project not found')) {
          console.error('🔧 Project not found. Please verify your VITE_SUPABASE_URL in .env');
        }
      } else {
        console.log('✅ Supabase auth connection established successfully');
        
        // Test a simple database query to ensure full connectivity
        try {
          const { data: testData, error: testError } = await supabase
            .from('companies')
            .select('id')
            .limit(1);
            
          if (testError) {
            console.warn('⚠️ Database query test failed:', testError.message);
            console.warn('Auth works but database access may be restricted');
          } else {
            console.log('✅ Database connectivity confirmed');
          }
        } catch (dbError) {
          console.warn('⚠️ Database test error:', dbError.message);
        }
      }
    } catch (err) {
      console.error('❌ Supabase connection test error:', err.message);
      
      if (err.message.includes('Failed to fetch')) {
        console.error('🔧 Network connectivity issue detected. Possible solutions:');
        console.error('1. Check if your Supabase project is active');
        console.error('2. Verify CORS settings allow localhost:5173');
        console.error('3. Try accessing your Supabase URL directly in browser');
        console.error(`   URL to test: ${supabaseUrl}`);
      }
    }
  };

  // Run connection test with a slight delay to avoid blocking app startup
  setTimeout(testConnection, 1000);
} else {
  console.warn('⚠️ Skipping Supabase connection test due to missing configuration');
}

// Export a helper to check if Supabase is configured
export const isSupabaseConfigured = () => isConfigured;

// Export a helper function to handle common Supabase errors
export const handleSupabaseError = (error, context = 'Supabase operation') => {
  console.error(`${context} error:`, error);
  
  if (error?.message?.includes('Failed to fetch')) {
    return {
      message: 'Network connection error. Please check your internet connection and try again.',
      isNetworkError: true
    };
  } else if (error?.message?.includes('JWT')) {
    return {
      message: 'Authentication error. Please sign in again.',
      isAuthError: true
    };
  } else if (error?.message?.includes('permission')) {
    return {
      message: 'Permission denied. You may not have access to this resource.',
      isPermissionError: true
    };
  } else {
    return {
      message: error?.message || 'An unexpected error occurred.',
      isGenericError: true
    };
  }
};