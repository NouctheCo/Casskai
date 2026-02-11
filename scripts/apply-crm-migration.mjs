#!/usr/bin/env node

/**
 * Script to apply CRM pipelines and stages migration
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function applyMigration() {
  // Get environment variables
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_KEY');
    process.exit(1);
  }

  // Initialize Supabase client with service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });

  console.log('📋 Reading migration file...');
  
  // Read the migration SQL file
  const migrationPath = join(__dirname, '../supabase/migrations/20260205000000_create_crm_pipelines_and_stages.sql');
  let sql = readFileSync(migrationPath, 'utf-8');

  // Split by statements and filter empty ones
  const statements = sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

  console.log(`\n📊 Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const displayLength = Math.min(100, statement.length);
    const displayText = statement.substring(0, displayLength) + (statement.length > 100 ? '...' : '');

    process.stdout.write(`[${i + 1}/${statements.length}] Executing: ${displayText}\n`);

    try {
      // Use RPC to execute raw SQL
      const { error } = await supabase.rpc('exec_sql', {
        sql_string: statement + ';'
      });

      if (error) {
        console.error(`  ❌ Error: ${error.message}`);
        errorCount++;
      } else {
        console.log(`  ✅ Success`);
        successCount++;
      }
    } catch (err) {
      // If RPC doesn't exist, try direct REST API
      try {
        console.log('  ℹ️ Attempting direct SQL execution...');
        // This won't work in the browser, but might work with proper headers
        const response = await fetch(`${SUPABASE_URL}/rest/v1/sql`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'x-client-info': 'supabase-js/2.0.0'
          },
          body: JSON.stringify({ query: statement + ';' })
        });

        if (response.ok) {
          console.log(`  ✅ Success`);
          successCount++;
        } else {
          const errorText = await response.text();
          console.error(`  ❌ HTTP Error ${response.status}: ${errorText}`);
          errorCount++;
        }
      } catch (innerErr) {
        console.error(`  ❌ Error: ${innerErr instanceof Error ? innerErr.message : String(innerErr)}`);
        errorCount++;
      }
    }
  }

  console.log(`\n\n📊 RESULTS:`);
  console.log(`  ✅ Successful: ${successCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log(`  📋 Total: ${successCount + errorCount}\n`);

  if (errorCount > 0) {
    console.log('⚠️ Some statements failed. The tables might not be created.');
    console.log('📝 Try applying the migration manually via Supabase dashboard:\n');
    console.log(`   1. Go to ${SUPABASE_URL}/project/_/sql`);
    console.log(`   2. Create a new query`);
    console.log(`   3. Copy the SQL from supabase/migrations/20260205000000_create_crm_pipelines_and_stages.sql`);
    console.log(`   4. Execute the query\n`);
  }

  process.exit(errorCount > 0 ? 1 : 0);
}

// Run migration
applyMigration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
