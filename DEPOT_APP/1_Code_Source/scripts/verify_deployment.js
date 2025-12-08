import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://smtdtgrymuzwvctattmx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NzYwMjMsImV4cCI6MjA3MDE1MjAyM30.7SefKj_zSbmaYNbrai9sKeGqcPZtcaXENdA4bNrXa5I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDeployment() {
  console.log('🔍 Vérification du déploiement des fonctions...\n');

  try {
    // Test 1: Vérifier que les fonctions existent
    console.log('📋 Test 1: Vérification de l\'existence des fonctions');

    const functions = ['create_company_with_setup', 'create_trial_subscription'];
    let allFunctionsExist = true;

    for (const func of functions) {
      try {
        // Essayer d'appeler la fonction avec des paramètres vides pour voir si elle existe
        const { error } = await supabase.rpc(func);
        if (error && error.code === 'PGRST202') {
          console.log(`❌ Fonction ${func}: n'existe pas`);
          allFunctionsExist = false;
        } else {
          console.log(`✅ Fonction ${func}: existe`);
        }
      } catch (e) {
        console.log(`❌ Fonction ${func}: erreur lors de la vérification - ${e.message}`);
        allFunctionsExist = false;
      }
    }

    if (!allFunctionsExist) {
      console.log('\n❌ Certaines fonctions sont manquantes. Veuillez d\'abord exécuter le SQL dans Supabase.');
      return;
    }

    // Test 2: Tester avec un utilisateur réel (si connecté)
    console.log('\n📋 Test 2: Test avec un utilisateur authentifié');

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log('❌ Aucun utilisateur authentifié trouvé');
      console.log('💡 Pour tester complètement, connectez-vous d\'abord à l\'application');
    } else {
      console.log(`✅ Utilisateur authentifié: ${user.email}`);

      // Tester create_company_with_setup avec l'utilisateur réel
      console.log('\n📤 Test de create_company_with_setup...');
      const { data: companyResult, error: companyError } = await supabase.rpc(
        'create_company_with_setup',
        {
          company_name_param: 'Test Company & Co',
          user_uuid_param: user.id,
          country_code_param: 'FR',
          currency_code_param: 'EUR',
          accounting_standard_param: 'PCG'
        }
      );

      if (companyError) {
        console.log('❌ Erreur create_company_with_setup:', companyError.message);
      } else {
        console.log('✅ create_company_with_setup réussi:', companyResult);

        // Tester create_trial_subscription
        console.log('\n📤 Test de create_trial_subscription...');
        const { data: subscriptionResult, error: subscriptionError } = await supabase.rpc(
          'create_trial_subscription',
          {
            p_user_id: user.id,
            p_company_id: companyResult
          }
        );

        if (subscriptionError) {
          console.log('❌ Erreur create_trial_subscription:', subscriptionError.message);
        } else {
          console.log('✅ create_trial_subscription réussi:', subscriptionResult);
        }
      }
    }

    console.log('\n🎉 Vérification terminée!');
    console.log('💡 Si tout est vert, l\'onboarding devrait maintenant fonctionner correctement.');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  }
}

verifyDeployment();
