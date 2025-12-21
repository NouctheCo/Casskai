/**
 * Script pour appliquer la migration audit_logs
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://smtdtgrymuzwvctattmx.supabase.co',
  process.env.VITE_TEST_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('🔧 Application de la migration audit_logs...\n');

  try {
    // Lire le fichier SQL
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251130000002_add_audit_logs_columns.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Fichier SQL lu avec succès\n');

    // Cette fois on applique via SQL editor car Supabase JS ne supporte pas exec SQL direct
    console.log('⚠️  IMPORTANT: Ce SQL doit être exécuté dans Supabase Dashboard > SQL Editor\n');
    console.log('═'.repeat(80));
    console.log(sqlContent);
    console.log('═'.repeat(80));

    console.log('\n\n✅ Copiez le SQL ci-dessus et exécutez-le dans Supabase Dashboard');
    console.log('   https://supabase.com/dashboard/project/smtdtgrymuzwvctattmx/sql\n');

    // Tester si les colonnes existent
    console.log('🔍 Vérification des colonnes...\n');

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .limit(0);

    if (error) {
      console.error('❌ Erreur:', error.message);
    } else {
      console.log('✅ Table accessible');
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

applyMigration().catch(console.error);
