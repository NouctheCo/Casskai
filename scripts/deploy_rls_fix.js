#!/usr/bin/env node

/**
 * Script pour appliquer automatiquement la correction des policies RLS
 * Usage: node scripts/deploy_rls_fix.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSqlFile(filePath) {
  try {
    console.log(`📖 Lecture du fichier SQL: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Diviser le SQL en commandes individuelles
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`🚀 Exécution de ${commands.length} commandes SQL...`);

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.length === 0) continue;

      console.log(`⚡ Exécution commande ${i + 1}/${commands.length}`);
      console.log(`   ${command.substring(0, 80)}${command.length > 80 ? '...' : ''}`);

      const { data: _data, error } = await supabase.rpc('exec_sql', {
        sql_query: command
      });

      if (error) {
        console.error(`❌ Erreur sur la commande ${i + 1}:`, error);
        // Ne pas arrêter pour certaines erreurs attendues
        if (!error.message.includes('does not exist') && 
            !error.message.includes('already exists')) {
          throw error;
        }
      } else {
        console.log(`✅ Commande ${i + 1} exécutée avec succès`);
      }

      // Pause entre les commandes pour éviter la surcharge
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution du fichier SQL:`, error);
    return false;
  }
}

async function testConnection() {
  try {
    console.log('🔍 Test de connexion à Supabase...');
    const { data: _data, error } = await supabase
      .from('user_companies')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Erreur de connexion:', error);
      return false;
    }

    console.log('✅ Connexion Supabase réussie');
    return true;
  } catch (error) {
    console.error('❌ Erreur de test de connexion:', error);
    return false;
  }
}

async function verifyPolicies() {
  try {
    console.log('🔍 Vérification des policies après correction...');
    
    const { data: _data, error } = await supabase
      .from('user_companies')
      .select('*')
      .limit(1);

    if (error && error.code === '42P17') {
      console.error('❌ La récursion RLS persiste:', error);
      return false;
    }

    console.log('✅ Policies RLS corrigées avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    return false;
  }
}

async function main() {
  console.log('🛠️  Correction automatique des policies RLS Supabase');
  console.log('=' .repeat(60));

  // 1. Tester la connexion
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.error('❌ Impossible de se connecter à Supabase. Vérifiez vos variables d\'environnement.');
    process.exit(1);
  }

  // 2. Exécuter le script SQL de correction
  const sqlPath = path.join(__dirname, 'fix_rls_policies.sql');
  const executionOk = await executeSqlFile(sqlPath);
  
  if (!executionOk) {
    console.error('❌ Échec de l\'exécution du script de correction');
    process.exit(1);
  }

  // 3. Vérifier que la correction a fonctionné
  console.log('\n⏱️  Attente de 3 secondes pour la propagation...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  const verificationOk = await verifyPolicies();
  if (!verificationOk) {
    console.error('❌ La correction n\'a pas résolu le problème de récursion');
    process.exit(1);
  }

  console.log('\n🎉 Correction des policies RLS terminée avec succès !');
  console.log('✅ Vous pouvez maintenant utiliser l\'authentification normalement.');
}

// Exécuter le script principal
main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

export { executeSqlFile, testConnection, verifyPolicies };