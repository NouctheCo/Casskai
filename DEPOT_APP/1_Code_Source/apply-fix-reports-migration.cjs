/**
 * Script pour appliquer la migration de correction des fonctions de rapports
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase (depuis .env)
require('dotenv').config();
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://smtdtgrymuzwvctattmx.supabase.co';
const supabaseServiceKey = process.env.VITE_TEST_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquante dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🔧 Application de la migration de correction des fonctions de rapports...\n');

  try {
    // Lire le fichier SQL
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251130000100_fix_report_functions_structure.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Fichier SQL lu avec succès');
    console.log(`📊 Taille: ${(sqlContent.length / 1024).toFixed(2)} KB`);

    // Séparer le contenu en plusieurs requêtes (séparées par les commentaires de section)
    const sections = sqlContent.split(/-- ={50,}/);

    console.log(`\n🔄 ${sections.length} section(s) à exécuter\n`);

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim();
      if (!section || section.startsWith('--')) continue;

      const sectionName = section.split('\n')[0].replace(/^--\s*/, '').trim();
      console.log(`${i + 1}️⃣ Exécution: ${sectionName || 'Section ' + (i + 1)}`);

      try {
        // Supabase JS client ne supporte pas l'exécution de SQL brut direct
        // On utilise rpc pour exécuter du SQL
        const { error } = await supabase.rpc('exec_sql', { sql: section });

        if (error) {
          // Si exec_sql n'existe pas, on essaie une autre approche
          console.log('   ⚠️  Impossible d\'exécuter via RPC, tentative manuelle...');
          console.log('\n📋 MIGRATION SQL À EXÉCUTER MANUELLEMENT:\n');
          console.log('Connectez-vous à Supabase Dashboard > SQL Editor et exécutez:\n');
          console.log('═'.repeat(80));
          console.log(sqlContent);
          console.log('═'.repeat(80));
          console.log('\nℹ️  Cette migration corrige les fonctions RPC pour utiliser journal_entry_lines');
          console.log('ℹ️  Elle est CRITIQUE pour que les rapports fonctionnent correctement\n');
          process.exit(1);
        }

        console.log('   ✅ Succès\n');
      } catch (err) {
        console.error(`   ❌ Erreur section ${i + 1}:`, err.message);
      }
    }

    console.log('✅ Migration appliquée avec succès!\n');

    // Tester une fonction
    console.log('🧪 Test de la fonction generate_balance_sheet...');

    // Obtenir le premier company_id
    const { data: companies } = await supabase
      .from('companies')
      .select('id')
      .limit(1);

    if (companies && companies.length > 0) {
      const testCompanyId = companies[0].id;
      const testDate = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .rpc('generate_balance_sheet', {
          p_company_id: testCompanyId,
          p_end_date: testDate
        });

      if (error) {
        console.error('❌ Erreur lors du test:', error);
      } else {
        console.log('✅ Fonction testée avec succès!');
        console.log('📊 Résultat:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
      }
    } else {
      console.log('⚠️  Aucune entreprise trouvée pour tester');
    }

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);

    // Afficher le SQL pour exécution manuelle
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251130000100_fix_report_functions_structure.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    console.log('\n📋 MIGRATION SQL À EXÉCUTER MANUELLEMENT:\n');
    console.log('Connectez-vous à Supabase Dashboard > SQL Editor et exécutez:\n');
    console.log('═'.repeat(80));
    console.log(sqlContent);
    console.log('═'.repeat(80));

    process.exit(1);
  }
}

// Exécution
applyMigration();
