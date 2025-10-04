import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://smtdtgrymuzwvctattmx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NzYwMjMsImV4cCI6MjA3MDE1MjAyM30.7SefKj_zSbmaYNbrai9sKeGqcPZtcaXENdA4bNrXa5I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFunctions() {
  console.log('🔍 Vérification simple de l\'existence des fonctions...\n');

  try {
    // Test 1: Essayer d'appeler create_company_with_setup avec des paramètres vides
    console.log('📋 Test 1: create_company_with_setup (paramètres vides)');
    try {
      const { error } = await supabase.rpc('create_company_with_setup');
      if (error) {
        if (error.code === 'PGRST202') {
          console.log('❌ Fonction create_company_with_setup: n\'existe pas');
        } else {
          console.log('✅ Fonction create_company_with_setup: existe');
          console.log('   Erreur (normale):', error.message);
        }
      } else {
        console.log('✅ Fonction create_company_with_setup: existe et fonctionne');
      }
    } catch (e) {
      console.log('❌ Erreur inattendue:', e.message);
    }

    // Test 2: Essayer d'appeler create_trial_subscription avec des paramètres vides
    console.log('\n📋 Test 2: create_trial_subscription (paramètres vides)');
    try {
      const { error } = await supabase.rpc('create_trial_subscription');
      if (error) {
        if (error.code === 'PGRST202') {
          console.log('❌ Fonction create_trial_subscription: n\'existe pas');
        } else {
          console.log('✅ Fonction create_trial_subscription: existe');
          console.log('   Erreur (normale):', error.message);
        }
      } else {
        console.log('✅ Fonction create_trial_subscription: existe et fonctionne');
      }
    } catch (e) {
      console.log('❌ Erreur inattendue:', e.message);
    }

    // Test 3: Vérifier l'utilisateur actuel
    console.log('\n📋 Test 3: Utilisateur actuel');
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.log('❌ Erreur récupération utilisateur:', userError.message);
    } else if (user) {
      console.log(`✅ Utilisateur connecté: ${user.email} (ID: ${user.id})`);

      // Si utilisateur connecté, tester avec ses vraies données
      console.log('\n📋 Test 4: Test avec utilisateur réel');
      const { data: companyResult, error: companyError } = await supabase.rpc(
        'create_company_with_setup',
        {
          company_name_param: 'Test Company ' + Date.now(),
          user_uuid_param: user.id,
          country_code_param: 'FR',
          currency_code_param: 'EUR',
          accounting_standard_param: 'PCG'
        }
      );

      if (companyError) {
        console.log('❌ Erreur avec utilisateur réel:', companyError.message);
      } else {
        console.log('✅ Entreprise créée avec succès! ID:', companyResult);
      }
    } else {
      console.log('❌ Aucun utilisateur connecté');
      console.log('💡 Connectez-vous à l\'application pour tester avec un vrai utilisateur');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  }
}

checkFunctions();
