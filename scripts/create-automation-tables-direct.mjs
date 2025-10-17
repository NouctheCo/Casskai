#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Configuration Supabase avec service key (pour admin)
const SUPABASE_URL = 'https://smtdtgrymuzwvctattmx.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU3NjAyMywiZXhwIjoyMDcwMTUyMDIzfQ.lmr9l3Lr1AjP5b-iFNgYo_b4QOSqHTfJQxZr--vdFxA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log('🚀 CRÉATION DIRECTE DES TABLES D\'AUTOMATISATION');
console.log('=' .repeat(50));

async function createTable(tableName, createSQL) {
  console.log(`\n📋 Création de la table "${tableName}"...`);

  try {
    // Essayer de créer la table via raw query
    const { error } = await supabase.rpc('exec_sql', { query: createSQL });

    if (error) {
      console.log(`❌ Erreur RPC: ${error.message}`);
      console.log(`⚠️ Tentative alternative...`);

      // Fallback: essayer directement si possible
      return false;
    } else {
      console.log(`✅ Table "${tableName}" créée avec succès`);
      return true;
    }
  } catch (err) {
    console.log(`❌ Erreur: ${err.message}`);
    return false;
  }
}

async function insertDummyData() {
  console.log(`\n🧪 Insertion de données de test...`);

  try {
    // Trouver une entreprise pour les tests
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name')
      .limit(1);

    if (!companies || companies.length === 0) {
      console.log('❌ Aucune entreprise trouvée');
      return false;
    }

    const companyId = companies[0].id;
    console.log(`📋 Utilisation de l'entreprise: ${companies[0].name}`);

    // Créer des tables directement via INSERT si elles n'existent pas
    const workflowData = {
      id: crypto.randomUUID(),
      company_id: companyId,
      name: 'Test Workflow - Migration',
      description: 'Workflow créé pour tester les tables d\'automatisation',
      is_active: false,
      trigger: {
        id: 'test-trigger',
        type: 'schedule',
        config: {
          schedule: {
            frequency: 'daily',
            time: '09:00'
          }
        }
      },
      actions: [{
        id: 'test-action',
        type: 'notification',
        config: {
          notification: {
            title: 'Test Migration',
            message: 'Tables d\'automatisation créées avec succès',
            priority: 'medium',
            recipients: ['admin@casskai.app']
          }
        }
      }],
      run_count: 0,
      success_count: 0,
      error_count: 0
    };

    console.log('🔧 Test d\'insertion dans workflows...');
    const { data, error } = await supabase
      .from('workflows')
      .insert(workflowData)
      .select()
      .single();

    if (error) {
      console.log(`❌ Erreur insertion: ${error.message}`);
      console.log('📋 Cela confirme que les tables n\'existent pas encore');
      return false;
    } else {
      console.log(`✅ Workflow inséré: ${data.name}`);

      // Nettoyer
      await supabase.from('workflows').delete().eq('id', data.id);
      console.log('🗑️ Nettoyage effectué');
      return true;
    }

  } catch (err) {
    console.log(`❌ Erreur test: ${err.message}`);
    return false;
  }
}

async function createViaEdgeFunction() {
  console.log(`\n🔧 Tentative via Edge Function...`);

  try {
    const { data, error } = await supabase.functions.invoke('admin-sql', {
      body: {
        action: 'create_automation_tables'
      }
    });

    if (error) {
      console.log(`❌ Erreur Edge Function: ${error.message}`);
      return false;
    } else {
      console.log(`✅ Succès Edge Function:`, data);
      return true;
    }
  } catch (err) {
    console.log(`❌ Erreur Edge Function: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Diagnostic initial...');

  // Test simple pour voir l'état actuel
  const testResult = await insertDummyData();

  if (testResult) {
    console.log('\n✅ LES TABLES EXISTENT DÉJÀ !');
    console.log('Le problème doit être ailleurs dans l\'interface.');
    return;
  }

  console.log('\n⚠️ CONFIRMATION: Les tables n\'existent pas');

  // Essayer différentes approches
  console.log('\n📋 TENTATIVES DE CRÉATION:');

  // Approche 1: Edge Function
  const edgeResult = await createViaEdgeFunction();
  if (edgeResult) {
    console.log('\n✅ TABLES CRÉÉES VIA EDGE FUNCTION');
    return;
  }

  // Si rien ne marche, donner des instructions manuelles
  console.log('\n🔧 SOLUTION MANUELLE REQUISE:');
  console.log('=' .repeat(30));
  console.log('1. Connectez-vous à Supabase Studio: https://supabase.com/dashboard');
  console.log('2. Allez dans SQL Editor');
  console.log('3. Exécutez le contenu du fichier:');
  console.log('   supabase/migrations/20241210000000_create_automation_tables.sql');
  console.log('4. Ou utilisez: supabase db push --include-all');

  console.log('\n📋 ALTERNATIVE: Utilisez la commande suivante:');
  console.log('supabase migration repair --status applied 20241210000000');
  console.log('supabase db push');
}

main().catch(console.error);