import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://smtdtgrymuzwvctattmx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NzYwMjMsImV4cCI6MjA3MDE1MjAyM30.7SefKj_zSbmaYNbrai9sKeGqcPZtcaXENdA4bNrXa5I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function quickTest() {
  console.log('🚀 Test rapide des fonctions après déploiement...\n');

  try {
    // Test avec un utilisateur fictif pour vérifier la logique
    const testUserId = '550e8400-e29b-41d4-a716-446655440000'; // UUID fictif pour test
    const testCompanyName = 'Test Company & Co';

    console.log('📤 Test de create_company_with_setup...');
    const { data: companyResult, error: companyError } = await supabase.rpc(
      'create_company_with_setup',
      {
        company_name_param: testCompanyName,
        user_uuid_param: testUserId,
        country_code_param: 'FR',
        currency_code_param: 'EUR',
        accounting_standard_param: 'PCG'
      }
    );

    if (companyError) {
      console.log('❌ Erreur create_company_with_setup:');
      console.log('   Message:', companyError.message);
      console.log('   Code:', companyError.code);
      console.log('   Details:', companyError.details);

      // Analyser l'erreur
      if (companyError.message.includes('does not exist')) {
        console.log('💡 La fonction n\'existe pas encore - déploiement nécessaire');
      } else if (companyError.message.includes('violates not-null constraint')) {
        console.log('💡 Problème de contrainte NOT NULL - fonction à corriger');
      }
    } else {
      console.log('✅ create_company_with_setup réussi!');
      console.log('   Company ID:', companyResult);

      // Test de create_trial_subscription si la première fonction a réussi
      console.log('\n📤 Test de create_trial_subscription...');
      const { data: subscriptionResult, error: subscriptionError } = await supabase.rpc(
        'create_trial_subscription',
        {
          p_user_id: testUserId,
          p_company_id: companyResult
        }
      );

      if (subscriptionError) {
        console.log('❌ Erreur create_trial_subscription:');
        console.log('   Message:', subscriptionError.message);
      } else {
        console.log('✅ create_trial_subscription réussi!');
        console.log('   Subscription ID:', subscriptionResult);
      }
    }

  } catch (error) {
    console.error('❌ Erreur inattendue:', error.message);
  }

  console.log('\n📋 Résumé:');
  console.log('- Si les fonctions n\'existent pas: déployez le SQL');
  console.log('- Si erreur de contrainte: la version corrigée devrait résoudre le problème');
  console.log('- Si succès: les fonctions sont prêtes pour l\'onboarding!');
}

quickTest();
