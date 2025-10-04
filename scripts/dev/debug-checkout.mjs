import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

async function testCheckoutSession() {
  console.log('🧪 Testing checkout session creation...');

  // Initialize Supabase client with anon key for regular operations
  const supabaseUrl = 'https://smtdtgrymuzwvctattmx.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NzYwMjMsImV4cCI6MjA3MDE1MjAyM30.7SefKj_zSbmaYNbrai9sKeGqcPZtcaXENdA4bNrXa5I';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Create admin client for user management
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Create a test user using admin client
    console.log('👤 Creating test user...');
    const testEmail = `debug-test-${Date.now()}@casskai.test`;
    const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirmed_at: new Date().toISOString()
    });

    if (createError || !user.user) {
      console.error('❌ Failed to create test user:', createError);
      return;
    }

    console.log('✅ Test user created:', user.user.id);

    // Sign in the user to get a JWT token using regular client
    console.log('🔑 Signing in test user...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'TestPassword123!'
    });

    if (signInError || !signInData.session) {
      console.error('❌ Failed to sign in:', signInError);
      return;
    }

    const jwtToken = signInData.session.access_token;
    console.log('✅ Got JWT token');

    // Now call the Edge function with the authenticated client
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        planId: 'starter_monthly',
        userId: user.user.id
      }
    });

    if (error) {
      console.log('❌ Function error:', error);
    } else {
      console.log('✅ Success! Response:', data);
    }

    // Clean up test user
    console.log('🧹 Cleaning up test user...');
    await supabaseAdmin.auth.admin.deleteUser(user.user.id);

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

testCheckoutSession();