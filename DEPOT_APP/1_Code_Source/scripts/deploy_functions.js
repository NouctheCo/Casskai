import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://smtdtgrymuzwvctattmx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU3NjAyMywiZXhwIjoyMDcwMTUyMDIzfQ.7SefKj_zSbmaYNbrai9sKeGqcPZtcaXENdA4bNrXa5I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployFunctions() {
  console.log('🔧 Deploying Supabase functions...\n');

  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('./scripts/create_supabase_functions.sql', 'utf8');

    console.log('📄 SQL content loaded, executing...\n');

    // Execute the entire SQL as one statement
  const { data: _data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });

    if (error) {
      console.log('❌ Error executing SQL:', error.message);

      // Try alternative approach - execute via REST API
      console.log('🔄 Trying alternative deployment method...\n');

      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          sql: sqlContent
        })
      });

      if (response.ok) {
        console.log('✅ Functions deployed successfully via REST API');
      } else {
        console.log('❌ REST API deployment failed:', response.status);
        const errorText = await response.text();
        console.log('Error details:', errorText);
      }
    } else {
      console.log('✅ Functions deployed successfully');
    }

    // Verify functions exist
    console.log('\n🔍 Verifying functions...\n');

    const functions = ['create_company_with_setup', 'create_trial_subscription'];

    for (const func of functions) {
      try {
        // Try to call the function with minimal parameters to check if it exists
        const { error: funcError } = await supabase.rpc(func, { company_name: 'test' });
        if (funcError && !funcError.message.includes('parameters')) {
          console.log(`❌ Function ${func}: ${funcError.message}`);
        } else {
          console.log(`✅ Function ${func}: exists`);
        }
      } catch (e) {
        console.log(`❌ Function ${func}: Error checking - ${e.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
  }
}

deployFunctions();
