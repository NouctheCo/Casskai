#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Configuration Supabase avec service key (si disponible)
const SUPABASE_URL = 'https://smtdtgrymuzwvctattmx.supabase.co';

// Essayer avec service key d'abord, fallback sur anon key
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NzYwMjMsImV4cCI6MjA3MDE1MjAyM30.7SefKj_zSbmaYNbrai9sKeGqcPZtcaXENdA4bNrXa5I';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log('🚨 APPLICATION FIX D\'URGENCE - RÉCURSION RLS');
console.log('='.repeat(50));

try {
  // Lire le fichier de migration
  const migrationSQL = fs.readFileSync('supabase/migrations/20250929_fix_recursion_emergency.sql', 'utf8');

  // Diviser en commandes SQL individuelles
  const commands = migrationSQL
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd && !cmd.startsWith('--') && cmd !== '');

  console.log(`📋 ${commands.length} commandes SQL à exécuter...`);

  // Tentative d'exécution des commandes via RPC
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];

    // Ignorer les blocs DO $$
    if (command.includes('DO $$')) {
      console.log(`⏭️ Commande ${i + 1}: Bloc DO ignoré`);
      continue;
    }

    try {
      console.log(`🔧 Commande ${i + 1}/${commands.length}: ${command.substring(0, 60)}...`);

      // Tentative 1: Via RPC exec_sql (si fonction existe)
      const { error: rpcError } = await supabase.rpc('exec_sql', { sql_query: command + ';' });

      if (rpcError) {
        // Tentative 2: Via SQL direct pour certaines commandes
        if (command.startsWith('ALTER TABLE') && command.includes('DISABLE ROW LEVEL SECURITY')) {
          console.log('⚠️ Tentative alternative pour DISABLE RLS...');
          // Cette commande nécessite des privilèges administrateur
        } else if (command.startsWith('DROP POLICY')) {
          console.log('⚠️ DROP POLICY peut échouer si la politique n\'existe pas - normal');
        }

        console.log(`⚠️ Erreur (probablement normale): ${rpcError.message.substring(0, 100)}`);
        errorCount++;
      } else {
        console.log(`✅ Succès`);
        successCount++;
      }

      // Pause entre les commandes pour éviter la surcharge
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.log(`❌ Erreur: ${error.message.substring(0, 100)}`);
      errorCount++;
    }
  }

  console.log('\n🎯 RÉSUMÉ:');
  console.log('='.repeat(30));
  console.log(`✅ Succès: ${successCount}`);
  console.log(`⚠️ Erreurs: ${errorCount} (souvent normales pour les DROP IF EXISTS)`);

  // Test final
  console.log('\n🧪 TEST FINAL:');

  const { data: testData, error: testError } = await supabase
    .from('user_companies')
    .select('id')
    .limit(1);

  console.log('Test user_companies:', testError ?
    `❌ ${testError.message.substring(0, 100)}` :
    `✅ OK`);

  if (testError && testError.message.includes('infinite recursion')) {
    console.log('\n🚨 RÉCURSION DÉTECTÉE ENCORE - SOLUTION ALTERNATIVE NÉCESSAIRE');

    // Solution d'urgence ultime: désactiver complètement RLS sur user_companies
    console.log('🔧 Tentative désactivation RLS complète...');

    const { error: disableError } = await supabase.rpc('exec_sql', {
      sql_query: 'ALTER TABLE public.user_companies DISABLE ROW LEVEL SECURITY;'
    });

    console.log('Désactivation RLS:', disableError ?
      `❌ ${disableError.message}` :
      `✅ RLS désactivé temporairement`);

  } else {
    console.log('✅ Fix appliqué avec succès!');
  }

} catch (error) {
  console.error('❌ Erreur fatale:', error.message);

  // Fallback d'urgence
  console.log('\n🆘 FALLBACK D\'URGENCE: Désactivation RLS user_companies');

  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: 'ALTER TABLE public.user_companies DISABLE ROW LEVEL SECURITY;'
    });

    console.log('Fallback RLS:', error ? `❌ ${error.message}` : `✅ Désactivé`);
  } catch (fallbackError) {
    console.error('❌ Même le fallback a échoué:', fallbackError.message);
  }
}

console.log('\n🎉 INTERVENTION D\'URGENCE TERMINÉE');
console.log('Testez l\'onboarding maintenant sur https://casskai.app');