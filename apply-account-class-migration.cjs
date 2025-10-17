// Script pour appliquer la migration account_class directement
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Ne pas hardcoder d'URL/clé ici. Utilisez des variables d'environnement.
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variables SUPABASE_URL et SUPABASE_ANON_KEY requises.');
  console.error('   Exemple: SUPABASE_URL=https://xxx.supabase.co SUPABASE_ANON_KEY=xxxx node apply-account-class-migration.cjs');
  process.exit(1);
}

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
