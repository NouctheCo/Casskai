#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Configuration Supabase avec service key
const SUPABASE_URL = 'https://smtdtgrymuzwvctattmx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NzYwMjMsImV4cCI6MjA3MDE1MjAyM30.7SefKj_zSbmaYNbrai9sKeGqcPZtcaXENdA4bNrXa5I';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log('🚀 APPLICATION MIGRATION AUTOMATISATION');
console.log('=' .repeat(50));

try {
  // Lire le fichier de migration
  const migrationSQL = fs.readFileSync('supabase/migrations/20241210000000_create_automation_tables.sql', 'utf8');

  console.log('📋 Migration chargée avec succès');

  // Diviser en commandes SQL individuelles (plus intelligemment)
  const commands = migrationSQL
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd && !cmd.startsWith('--') && cmd !== '')
    .map(cmd => cmd + ';'); // Re-ajouter le point-virgule

  console.log(`📊 ${commands.length} commandes SQL à exécuter...`);

  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;

  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];

    // Afficher un aperçu de la commande
    const preview = command.length > 80
      ? command.substring(0, 80) + '...'
      : command;

    console.log(`\n🔧 [${i + 1}/${commands.length}] ${preview}`);

    try {
      // Certaines commandes peuvent échouer si elles existent déjà - c'est normal
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: command
      });

      if (error) {
        // Vérifier si c'est une erreur "normale" (table/index existe déjà)
        const isNormalError = error.message.includes('already exists') ||
                             error.message.includes('does not exist') ||
                             error.message.includes('relation') && error.message.includes('already exists');

        if (isNormalError) {
          console.log(`⚠️ Info: ${error.message.substring(0, 100)}...`);
          skipCount++;
        } else {
          console.log(`❌ Erreur: ${error.message.substring(0, 100)}...`);
          errorCount++;
        }
      } else {
        console.log(`✅ Succès`);
        successCount++;
      }

      // Pause entre les commandes pour éviter la surcharge
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (err) {
      console.log(`❌ Erreur fatale: ${err.message.substring(0, 100)}...`);
      errorCount++;
    }
  }

  console.log('\n🎯 RÉSUMÉ MIGRATION:');
  console.log('=' .repeat(30));
  console.log(`✅ Succès: ${successCount}`);
  console.log(`⚠️ Ignorées (déjà existantes): ${skipCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);

  // Test final pour vérifier que les tables existent maintenant
  console.log('\n🧪 VÉRIFICATION FINALE:');

  const testTables = ['workflows', 'notifications', 'email_logs', 'email_configs'];
  let allGood = true;

  for (const table of testTables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);

      if (error) {
        console.log(`❌ Table ${table}: ${error.message}`);
        allGood = false;
      } else {
        console.log(`✅ Table ${table}: OK`);
      }
    } catch (err) {
      console.log(`❌ Table ${table}: ${err.message}`);
      allGood = false;
    }
  }

  if (allGood) {
    console.log('\n🎉 MIGRATION APPLIQUÉE AVEC SUCCÈS !');
    console.log('Les modèles d\'automatisation sont maintenant utilisables sur https://casskai.app');
  } else {
    console.log('\n⚠️ MIGRATION PARTIELLEMENT RÉUSSIE');
    console.log('Certaines tables peuvent nécessiter une intervention manuelle');
  }

} catch (error) {
  console.error('❌ Erreur fatale lors de la migration:', error.message);
}

console.log('\n🎯 MIGRATION TERMINÉE');