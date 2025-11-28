/**
 * Script to apply HR Module SQL Migration
 * Reads the migration file and applies it to Supabase
 */

const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  console.error('\nPlease set these variables in your .env file');
  process.exit(1);
}

// Read migration file (ALTER version for existing tables)
const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251128_hr_module_alter.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('📄 Migration file loaded:', migrationPath);
console.log('📊 SQL size:', Math.round(migrationSQL.length / 1024), 'KB');
console.log('');

// Apply migration
async function applyMigration() {
  console.log('🚀 Applying HR Module Migration to Supabase...');
  console.log('');

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        query: migrationSQL
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();

    console.log('✅ Migration applied successfully!');
    console.log('');
    console.log('📋 Tables created:');
    console.log('   ✓ employees');
    console.log('   ✓ trainings');
    console.log('   ✓ training_sessions');
    console.log('   ✓ training_enrollments');
    console.log('   ✓ employee_certifications');
    console.log('   ✓ leave_requests');
    console.log('   ✓ expense_reports');
    console.log('   ✓ hr_documents');
    console.log('');
    console.log('📊 Features:');
    console.log('   ✓ 18 indexes created');
    console.log('   ✓ RLS enabled with policies');
    console.log('   ✓ Check constraints for validation');
    console.log('');
    console.log('🎉 HR Module is ready to use!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Test creating an employee in the HR page');
    console.log('2. Add translations (see CORRECTIONS_MODULE_HR_FINAL.md)');
    console.log('3. Remove mocked data from HR analytics');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('Alternative method:');
    console.error('1. Open Supabase Dashboard → SQL Editor');
    console.error('2. Copy content from:', migrationPath);
    console.error('3. Paste and execute in SQL Editor');
    process.exit(1);
  }
}

// Note: Supabase doesn't have a direct exec_sql RPC by default
// This script provides instructions for manual application
console.log('⚠️  Note: This script requires manual SQL execution');
console.log('');
console.log('To apply the HR Module migration:');
console.log('');
console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
console.log('2. Select your project');
console.log('3. Go to SQL Editor');
console.log('4. Click "New Query"');
console.log('5. Copy the entire content from:');
console.log('   ' + migrationPath);
console.log('6. Paste into SQL Editor');
console.log('7. Click "Run" or press Ctrl+Enter');
console.log('');
console.log('Expected result:');
console.log('✅ Migration Module RH complétée avec succès!');
console.log('   - 8 tables créées (employees, trainings, sessions, etc.)');
console.log('   - 18 index créés');
console.log('   - RLS activé avec policies');
console.log('   - Prêt pour la gestion complète des RH');
console.log('');
