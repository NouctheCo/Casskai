const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://smtdtgrymuzwvctattmx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

async function applyMigration(filePath) {
  console.log(`\nApplying migration: ${filePath}`);

  const sql = fs.readFileSync(filePath, 'utf8');

  try {
    // Use direct database connection config
    const { Client } = require('pg');
    const client = new Client({
      host: 'db.smtdtgrymuzwvctattmx.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'Jcvd1960#'
    });

    await client.connect();
    console.log('Connected to database');

    await client.query(sql);
    console.log('✅ Migration applied successfully');

    await client.end();
  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    throw error;
  }
}

async function main() {
  try {
    // Apply storage migration first
    await applyMigration('C:/Users/noutc/Casskai/supabase/migrations/20251109000002_create_hr_documents_storage.sql');

    // Then apply document templates migration
    await applyMigration('C:/Users/noutc/Casskai/supabase/migrations/20251109000004_add_document_templates.sql');

    console.log('\n✅ All HR migrations applied successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
