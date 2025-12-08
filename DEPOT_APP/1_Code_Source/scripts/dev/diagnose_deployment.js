import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://smtdtgrymuzwvctattmx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NzYwMjMsImV4cCI6MjA3MDE1MjAyM30.7SefKj_zSbmaYNbrai9sKeGqcPZtcaXENdA4bNrXa5I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseDeployment() {
  console.log('🔍 Diagnostic du déploiement des fonctions...\n');

  try {
    // Test 1: Vérifier les permissions de base
    console.log('📋 Test 1: Permissions de base');
    const { data: _testData, error: testError } = await supabase
      .from('companies')
      .select('count')
      .limit(1);

    if (testError) {
      console.log('❌ Erreur d\'accès aux tables:', testError.message);
      return;
    } else {
      console.log('✅ Accès aux tables OK');
    }

    // Test 2: Vérifier si les fonctions existent déjà avec d'autres signatures
    console.log('\n📋 Test 2: Recherche de fonctions existantes');

    // Tester différentes signatures possibles pour create_company_with_setup
    const signatures = [
      {}, // sans paramètres
      { company_name: 'test' },
      { company_name_param: 'test' },
      { company_name_param: 'test', user_uuid_param: '00000000-0000-0000-0000-000000000000' }
    ];

    for (const sig of signatures) {
      try {
        const { error } = await supabase.rpc('create_company_with_setup', sig);
        if (!error) {
          console.log(`✅ Fonction trouvée avec signature:`, Object.keys(sig));
          break;
        } else if (!error.message.includes('function') && !error.message.includes('does not exist')) {
          console.log(`⚠️  Fonction existe mais erreur:`, error.message);
        }
      } catch (_e) {
        // Ignorer les erreurs de signature
      }
    }

    // Test 3: Essayer de créer une fonction simple
    console.log('\n📋 Test 3: Test de création de fonction simple');

    const simpleFunctionSQL = `
      CREATE OR REPLACE FUNCTION test_function()
      RETURNS TEXT AS $$
      BEGIN
        RETURN 'Hello World';
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    console.log('🔧 Tentative de création d\'une fonction de test...');

    // Essayer via RPC si disponible
    try {
      const { data: _data, error } = await supabase.rpc('exec_sql', {
        sql: simpleFunctionSQL
      });

      if (error) {
        console.log('❌ Erreur RPC exec_sql:', error.message);
      } else {
        console.log('✅ Fonction de test créée via RPC');
      }
    } catch (e) {
      console.log('❌ RPC exec_sql non disponible:', e.message);
    }

    // Test 4: Vérifier l'utilisateur actuel
    console.log('\n📋 Test 4: Utilisateur actuel');
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.log('❌ Erreur récupération utilisateur:', userError.message);
    } else if (user) {
      console.log(`✅ Utilisateur connecté: ${user.email} (ID: ${user.id})`);
    } else {
      console.log('❌ Aucun utilisateur connecté');
    }

    console.log('\n📋 Recommandations:');
    console.log('1. Vérifiez que vous êtes connecté à Supabase avec un compte admin');
    console.log('2. Assurez-vous d\'avoir les permissions pour créer des fonctions');
    console.log('3. Essayez de créer les fonctions via l\'interface SQL de Supabase');
    console.log('4. Vérifiez les logs d\'erreur dans Supabase pour plus de détails');

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message);
  }
}

diagnoseDeployment();
