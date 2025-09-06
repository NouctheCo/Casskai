import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://smtdtgrymuzwvctattmx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NzYwMjMsImV4cCI6MjA3MDE1MjAyM30.7SefKj_zSbmaYNbrai9sKeGqcPZtcaXENdA4bNrXa5I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectDatabase() {
  console.log('🔍 Inspecting Supabase database...\n');

  // 1. Check if tables exist
  console.log('📋 Checking tables...');
  const tables = ['companies', 'user_companies', 'accounts', 'journals', 'subscriptions'];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ Table ${table}: ${error.message}`);
      } else {
        console.log(`✅ Table ${table}: exists (${data?.length || 0} records)`);
      }
    } catch (err) {
      console.log(`❌ Table ${table}: error - ${err}`);
    }
  }

  console.log('\n🔧 Checking functions...');

  // 2. Check if functions exist
  const functions = ['create_company_with_setup', 'create_trial_subscription'];

  for (const func of functions) {
    try {
      // Try to call the function with dummy data to see if it exists
      const { error } = await supabase.rpc(func, {});
      if (error) {
        console.log(`❌ Function ${func}: ${error.message}`);
      } else {
        console.log(`✅ Function ${func}: exists`);
      }
    } catch (err) {
      console.log(`❌ Function ${func}: error - ${err}`);
    }
  }

  console.log('\n👤 Checking current user...');

  // 3. Check current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.log(`❌ User check: ${userError.message}`);
  } else if (user) {
    console.log(`✅ Current user: ${user.email} (${user.id})`);

    // Check if user has companies
    const { data: userCompanies, error: ucError } = await supabase
      .from('user_companies')
      .select(`
        company_id,
        companies (
          id,
          name
        )
      `)
      .eq('user_id', user.id);

    if (ucError) {
      console.log(`❌ User companies check: ${ucError.message}`);
    } else {
      console.log(`📊 User has ${userCompanies?.length || 0} companies:`);
      userCompanies?.forEach((uc) => {
        console.log(`  - ${uc.companies?.[0]?.name} (${uc.company_id})`);
      });
    }
  } else {
    console.log('❌ No authenticated user');
  }

  console.log('\n🏁 Inspection complete!');
}

inspectDatabase().catch(console.error);
