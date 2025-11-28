#!/usr/bin/env node
/**
 * Script pour appliquer la migration accounting_standard
 * Ajoute la colonne accounting_standard à la table companies
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erreur: Variables d\'environnement Supabase manquantes');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🔄 Application de la migration accounting_standard...\n');

  const migrationPath = join(__dirname, 'supabase', 'migrations', '20251127000000_add_accounting_standard_to_companies.sql');

  try {
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log('📄 Fichier de migration chargé:', migrationPath);
    console.log('📏 Taille:', migrationSQL.length, 'caractères\n');

    // Diviser le SQL en statements individuels
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log('📋 Nombre de statements SQL à exécuter:', statements.length, '\n');

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚙️  Exécution du statement ${i + 1}/${statements.length}...`);

      // Afficher un aperçu du statement
      const preview = statement.substring(0, 100).replace(/\n/g, ' ');
      console.log(`   Preview: ${preview}${statement.length > 100 ? '...' : ''}`);

      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Si exec_sql n'existe pas, essayer directement via REST
        console.log('   ⚠️  exec_sql non disponible, tentative via REST...');

        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ sql: statement })
        });

        if (!response.ok) {
          console.error(`   ❌ Erreur lors de l'exécution du statement ${i + 1}:`, error?.message || await response.text());

          // Si c'est juste un "already exists", continuer
          if (error?.message?.includes('already exists')) {
            console.log('   ⏭️  Colonne existe déjà, on continue...');
            continue;
          }

          throw error || new Error(await response.text());
        }
      }

      console.log(`   ✅ Statement ${i + 1} exécuté avec succès\n`);
    }

    console.log('✅ Migration appliquée avec succès!\n');

    // Vérifier que la colonne existe
    console.log('🔍 Vérification de la colonne accounting_standard...');
    const { data: companies, error: selectError } = await supabase
      .from('companies')
      .select('id, name, country, accounting_standard')
      .limit(5);

    if (selectError) {
      console.error('❌ Erreur lors de la vérification:', selectError.message);
    } else {
      console.log('\n📊 Aperçu des 5 premières entreprises:');
      console.table(companies);

      // Compter par standard
      const { data: stats } = await supabase
        .from('companies')
        .select('accounting_standard')
        .not('accounting_standard', 'is', null);

      if (stats) {
        const counts = stats.reduce((acc, c) => {
          acc[c.accounting_standard] = (acc[c.accounting_standard] || 0) + 1;
          return acc;
        }, {});

        console.log('\n📈 Répartition des standards comptables:');
        console.table(counts);
      }
    }

    console.log('\n🎉 Migration terminée avec succès!');
    console.log('\n📝 Prochaines étapes:');
    console.log('   1. Mettre à jour les types TypeScript (src/types/supabase.ts)');
    console.log('   2. Adapter les 12 rapports restants');
    console.log('   3. Tester avec une entreprise SYSCOHADA (pays OHADA)');

  } catch (error) {
    console.error('\n❌ Erreur lors de l\'application de la migration:');
    console.error(error);
    process.exit(1);
  }
}

applyMigration();
