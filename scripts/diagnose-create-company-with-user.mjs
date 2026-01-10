#!/usr/bin/env node

/**
 * Script pour diagnostiquer le problème avec create_company_with_user
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function diagnose() {
  console.log('🔍 Diagnosing create_company_with_user function...\n');

  // 1. Try to call the function
  console.log('1️⃣  Attempting to call create_company_with_user...');
  const { error: callError } = await supabase.rpc('create_company_with_user', {
    p_user_id: '00000000-0000-0000-0000-000000000000',
    p_company_id: '00000000-0000-0000-0000-000000000001',
    p_company_data: { name: 'Test' }
  });

  if (callError) {
    if (callError.message.includes('Could not find')) {
      console.log('❌ Function not found in schema cache');
      console.log(`   Error: ${callError.message}\n`);
      return false;
    } else {
      console.log('✅ Function found! (Error is expected due to test data)');
      console.log(`   Error (expected): ${callError.message}\n`);
      return true;
    }
  } else {
    console.log('✅ Function exists and executed!\n');
    return true;
  }
}

diagnose().then(exists => {
  if (!exists) {
    console.log('📝 Solution: The function needs to be created via migration');
    console.log('   File created: supabase/migrations/20251228000000_ensure_create_company_with_user_exists.sql');
    console.log('\n   To apply it:');
    console.log('   1. Push the migration file to your repo');
    console.log('   2. Deploy via "supabase db push" or your CI/CD pipeline');
    console.log('   3. Or manually apply in Supabase dashboard > SQL editor\n');
  }
});
