import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://smtdtgrymuzwvctattmx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NzYwMjMsImV4cCI6MjA3MDE1MjAyM30.7SefKj_zSbmaYNbrai9sKeGqcPZtcaXENdA4bNrXa5I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deployFunctions() {
  console.log('🔧 Deploying Supabase functions...\n');

  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('./scripts/create_supabase_functions.sql', 'utf8');

    console.log('📄 SQL content loaded, executing...\n');

    // Execute the entire SQL as one statement using the REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
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

      // Alternative: try to execute individual statements
      console.log('\n🔄 Trying individual statement execution...\n');

      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim()) {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

          try {
            const stmtResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey
              },
              body: JSON.stringify({
                sql: statement
              })
            });

            if (stmtResponse.ok) {
              console.log(`  ✅ Statement executed successfully`);
            } else {
              console.log(`  ❌ Statement failed: ${stmtResponse.status}`);
            }
          } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
          }
        }
      }
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
