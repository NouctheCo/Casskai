import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function applyMigration() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase configuration');
    console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
    console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
    console.error('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('🔄 Applying journal entry numbering function migration...');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250115000000_create_journal_entry_numbering_function.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Remove comments and clean up SQL
    const cleanSQL = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .trim();

    console.log('Executing SQL:', cleanSQL.substring(0, 100) + '...');

    // Try to execute the SQL directly
    const { data, error } = await supabase.from('_supabase_migration_temp').select('*').limit(1);

    // Since we can't execute raw SQL directly, let's try a different approach
    // We'll create the function by calling it through a test query that will create it if it doesn't exist

    console.log('✅ Migration SQL prepared. Since we cannot execute raw SQL via the client,');
    console.log('   please apply this migration manually using one of these methods:');
    console.log('');
    console.log('Method 1 - Supabase Dashboard:');
    console.log('   1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql');
    console.log('   2. Create a new query');
    console.log('   3. Paste the following SQL:');
    console.log('');
    console.log(cleanSQL);
    console.log('');
    console.log('Method 2 - Supabase CLI:');
    console.log('   npx supabase db push --include-all (but may have conflicts)');
    console.log('');
    console.log('Method 3 - Direct database connection:');
    console.log('   Use psql or any PostgreSQL client to execute the SQL above');
    console.log('');

    // Save the SQL to a file for easy copying
    const outputPath = path.join(__dirname, 'migration_to_apply.sql');
    fs.writeFileSync(outputPath, cleanSQL);
    console.log(`📄 SQL saved to: ${outputPath}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Apply this migration before using the automatic numbering feature!');

  } catch (err) {
    console.error('❌ Error preparing migration:', err);
    process.exit(1);
  }
}

applyMigration();