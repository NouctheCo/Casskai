import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://smtdtgrymuzwvctattmx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NzYwMjMsImV4cCI6MjA3MDE1MjAyM30.7SefKj_zSbmaYNbrai9sKeGqcPZtcaXENdA4bNrXa5I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFunctions() {
  console.log('🧪 Testing Supabase functions with correct parameters...\n');

  try {
    // Test create_company_with_setup with correct parameter names
    console.log('📤 Testing create_company_with_setup...');
    const { data: companyResult, error: companyError } = await supabase.rpc(
      'create_company_with_setup',
      {
        company_name_param: 'Test Company & Co',
        user_uuid_param: '00000000-0000-0000-0000-000000000000', // dummy UUID for test
        country_code_param: 'FR',
        currency_code_param: 'EUR',
        accounting_standard_param: 'PCG'
      }
    );

    if (companyError) {
      console.log('❌ create_company_with_setup error:', companyError.message);
      console.log('Error code:', companyError.code);
      console.log('Error details:', companyError.details);
    } else {
      console.log('✅ create_company_with_setup success:', companyResult);
    }

    // Test create_trial_subscription
    console.log('\n📤 Testing create_trial_subscription...');
    const { data: subscriptionResult, error: subscriptionError } = await supabase.rpc(
      'create_trial_subscription',
      {
        p_user_id: '00000000-0000-0000-0000-000000000000', // dummy UUID for test
        p_company_id: '00000000-0000-0000-0000-000000000000' // dummy UUID for test
      }
    );

    if (subscriptionError) {
      console.log('❌ create_trial_subscription error:', subscriptionError.message);
      console.log('Error code:', subscriptionError.code);
      console.log('Error details:', subscriptionError.details);
    } else {
      console.log('✅ create_trial_subscription success:', subscriptionResult);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n📋 Instructions for manual deployment:');
  console.log('1. Go to https://supabase.com/dashboard/project/smtdtgrymuzwvctattmx/sql');
  console.log('2. Copy and paste the contents of scripts/create_supabase_functions_fixed.sql');
  console.log('3. Click "Run" to execute the SQL');
  console.log('4. Then run this test again to verify the functions work');
}

testFunctions();
