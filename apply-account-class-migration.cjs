// Script pour appliquer la migration account_class directement
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://smtdtgrymuzwvctattmx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcxMTQ3NjksImV4cCI6MjA0MjY5MDc2OX0.qSRx0vNgdVRf-GcMJgZ5QUufUj0WE_vQn7CxvxD2qH8';

async function applyMigration() {
  try {
    console.log('🔄 Connexion à Supabase...');

    // Créer le client Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    console.log('📝 Ajout de la colonne account_class...');

    // Ajouter la colonne account_class
    const { data: addColumn, error: addError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.chart_of_accounts
        ADD COLUMN IF NOT EXISTS account_class INTEGER;
      `
    });

    if (addError && !addError.message.includes('already exists')) {
      console.error('❌ Erreur lors de l\'ajout de la colonne:', addError.message);

      // Essayer une approche alternative via les services Supabase
      console.log('🔄 Tentative avec requête directe SQL...');

      const migrationSQL = fs.readFileSync(
        'c:\\Users\\noutc\\Casskai\\supabase\\migrations\\20251014100000_add_account_class_to_chart_of_accounts.sql',
        'utf8'
      );

      console.log('SQL à exécuter:');
      console.log(migrationSQL);
      console.log('\n⚠️  Cette migration doit être appliquée manuellement via le Supabase Dashboard:');
      console.log('1. Allez sur https://supabase.com/dashboard/project/smtdtgrymuzwvctattmx/sql/new');
      console.log('2. Copiez-collez le SQL ci-dessus');
      console.log('3. Cliquez sur "Run"');

    } else {
      console.log('✅ Colonne account_class ajoutée avec succès');
      console.log('✅ Migration terminée!');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n📋 SQL de migration à appliquer manuellement:');
    const migrationSQL = fs.readFileSync(
      'c:\\Users\\noutc\\Casskai\\supabase\\migrations\\20251014100000_add_account_class_to_chart_of_accounts.sql',
      'utf8'
    );
    console.log(migrationSQL);
  }
}

applyMigration();
