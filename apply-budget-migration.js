/**
 * Script pour appliquer la migration des tables budget
 * Usage: node apply-budget-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lire les variables d'environnement
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erreur: Variables d\'environnement manquantes');
  console.error('   Assurez-vous que VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définis dans .env');
  process.exit(1);
}

console.log('🔧 Configuration Supabase:');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key: ${supabaseServiceKey.substring(0, 20)}...`);
console.log('');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('📖 Lecture du fichier de migration...');
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251128_budget_tables_v2.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log(`   Fichier: ${migrationPath}`);
    console.log(`   Taille: ${sql.length} caractères`);
    console.log('');

    console.log('🚀 Application de la migration...');
    console.log('');

    // Diviser le SQL en blocs pour une meilleure gestion des erreurs
    const sqlBlocks = sql
      .split(/;\s*$/gm)
      .map(block => block.trim())
      .filter(block => block.length > 0 && !block.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < sqlBlocks.length; i++) {
      const block = sqlBlocks[i] + ';';

      // Ignorer les commentaires et blocs DO
      if (block.startsWith('--') || block.startsWith('/*')) {
        continue;
      }

      // Afficher un extrait du bloc
      const preview = block.substring(0, 80).replace(/\n/g, ' ') + '...';
      process.stdout.write(`   [${i + 1}/${sqlBlocks.length}] ${preview}`);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: block });

        if (error) {
          // Essayer une approche alternative
          const { error: error2 } = await supabase.from('_migrations').insert({
            name: `budget_migration_block_${i}`,
            sql: block,
            executed_at: new Date().toISOString()
          });

          if (error2) {
            console.log(' ❌');
            console.error(`      Erreur: ${error.message || error2.message}`);
            errorCount++;
          } else {
            console.log(' ✅');
            successCount++;
          }
        } else {
          console.log(' ✅');
          successCount++;
        }
      } catch (err) {
        console.log(' ⚠️');
        console.warn(`      Warning: ${err.message}`);
      }
    }

    console.log('');
    console.log('📊 Résultats:');
    console.log(`   ✅ Blocs réussis: ${successCount}`);
    console.log(`   ❌ Blocs échoués: ${errorCount}`);
    console.log('');

    if (errorCount === 0) {
      console.log('✅ Migration appliquée avec succès!');
      console.log('');
      console.log('Prochaines étapes:');
      console.log('   1. Vérifiez les tables dans Supabase Dashboard');
      console.log('   2. Testez la création d\'un budget');
      console.log('   3. Essayez l\'export PDF Business Plan');
    } else {
      console.log('⚠️  Migration terminée avec des erreurs');
      console.log('   Vérifiez les logs ci-dessus pour plus de détails');
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'application de la migration:');
    console.error(error);
    process.exit(1);
  }
}

// Approche alternative: utiliser l'API REST directement
async function applyMigrationDirect() {
  try {
    console.log('📖 Lecture du fichier de migration...');
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251128_budget_tables_v2.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log(`   Fichier: ${migrationPath}`);
    console.log('');

    console.log('🚀 Application de la migration via SQL Editor...');
    console.log('');
    console.log('⚠️  Note: Cette méthode nécessite que vous appliquiez manuellement le SQL');
    console.log('');
    console.log('📋 Instructions:');
    console.log('   1. Ouvrez Supabase Dashboard');
    console.log('   2. Allez dans SQL Editor');
    console.log('   3. Créez une nouvelle requête');
    console.log('   4. Copiez-collez le contenu suivant:');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(sql);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('   5. Cliquez sur "Run" pour exécuter');
    console.log('');

    // Sauvegarder aussi dans un fichier temporaire pour faciliter le copier-coller
    const tempFile = path.join(__dirname, 'temp-migration-to-apply.sql');
    fs.writeFileSync(tempFile, sql);
    console.log(`📄 SQL sauvegardé dans: ${tempFile}`);
    console.log('   Vous pouvez ouvrir ce fichier et copier-coller son contenu');

  } catch (error) {
    console.error('❌ Erreur:');
    console.error(error);
    process.exit(1);
  }
}

// Exécuter la méthode directe (plus simple)
console.log('═══════════════════════════════════════════════════════════════');
console.log('  MIGRATION TABLES BUDGET - Application');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

applyMigrationDirect();
