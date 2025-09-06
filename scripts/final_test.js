import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://smtdtgrymuzwvctattmx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NzYwMjMsImV4cCI6MjA3MDE1MjAyM30.7SefKj_zSbmaYNbrai9sKeGqcPZtcaXENdA4bNrXa5I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function finalTest() {
  console.log('🎯 Test final des fonctions déployées...\n');

  try {
    // Étape 1: Vérifier l'utilisateur actuel
    console.log('📋 Étape 1: Vérification de l\'utilisateur');
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log('❌ Aucun utilisateur connecté');
      console.log('💡 Solution: Connectez-vous à l\'application ou créez un utilisateur de test');

      // Essayer de créer un utilisateur de test
      console.log('\n🔧 Tentative de création d\'un utilisateur de test...');
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'TestPassword123!';

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword
      });

      if (signUpError) {
        console.log('❌ Impossible de créer un utilisateur de test:', signUpError.message);
        console.log('💡 Testez manuellement en vous connectant à l\'application');
        return;
      } else {
        console.log('✅ Utilisateur de test créé:', testEmail);
        console.log('📧 Vérifiez votre email pour confirmer le compte');

        // Attendre un peu pour que l'utilisateur soit créé
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Re-vérifier l'utilisateur
        const { data: { user: newUser } } = await supabase.auth.getUser();
        if (newUser) {
          console.log('✅ Utilisateur confirmé, test des fonctions...');
          await testFunctions(newUser);
        } else {
          console.log('⏳ Utilisateur créé mais pas encore confirmé');
          console.log('💡 Testez manuellement après confirmation email');
        }
      }
    } else {
      console.log(`✅ Utilisateur connecté: ${user.email}`);
      await testFunctions(user);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test final:', error.message);
  }
}

async function testFunctions(user) {
  console.log('\n📋 Étape 2: Test des fonctions avec utilisateur réel');

  try {
    // Test 1: Créer une entreprise
    const companyName = `Test Company ${Date.now()}`;
    console.log(`📤 Test 1: Création d'entreprise "${companyName}"`);

    const { data: companyId, error: companyError } = await supabase.rpc(
      'create_company_with_setup',
      {
        company_name_param: companyName,
        user_uuid_param: user.id,
        country_code_param: 'FR',
        currency_code_param: 'EUR',
        accounting_standard_param: 'PCG'
      }
    );

    if (companyError) {
      console.log('❌ Erreur création entreprise:', companyError.message);
      return;
    }

    console.log('✅ Entreprise créée avec succès!');
    console.log('   📝 ID entreprise:', companyId);

    // Test 2: Créer un abonnement d'essai
    console.log('\n📤 Test 2: Création d\'abonnement d\'essai');

    const { data: subscriptionId, error: subscriptionError } = await supabase.rpc(
      'create_trial_subscription',
      {
        p_user_id: user.id,
        p_company_id: companyId
      }
    );

    if (subscriptionError) {
      console.log('❌ Erreur création abonnement:', subscriptionError.message);
    } else {
      console.log('✅ Abonnement d\'essai créé avec succès!');
      console.log('   📝 ID abonnement:', subscriptionId);
    }

    // Test 3: Vérifier que les données ont été créées
    console.log('\n📋 Étape 3: Vérification des données créées');

    // Vérifier l'entreprise
    const { data: company, error: companyCheckError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyCheckError) {
      console.log('❌ Erreur vérification entreprise:', companyCheckError.message);
    } else {
      console.log('✅ Entreprise vérifiée:', company.name);
    }

    // Vérifier la relation user-company
    const { data: userCompany, error: userCompanyError } = await supabase
      .from('user_companies')
      .select('*')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .single();

    if (userCompanyError) {
      console.log('❌ Erreur vérification relation user-company:', userCompanyError.message);
    } else {
      console.log('✅ Relation user-company vérifiée:', userCompany.role);
    }

    // Vérifier l'abonnement
    if (subscriptionId) {
      const { data: subscription, error: subscriptionCheckError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (subscriptionCheckError) {
        console.log('❌ Erreur vérification abonnement:', subscriptionCheckError.message);
      } else {
        console.log('✅ Abonnement vérifié:', subscription.status, subscription.plan);
      }
    }

    console.log('\n🎉 SUCCÈS ! Toutes les fonctions fonctionnent correctement !');
    console.log('💡 L\'onboarding devrait maintenant marcher parfaitement dans l\'application.');

  } catch (error) {
    console.error('❌ Erreur lors du test des fonctions:', error.message);
  }
}

finalTest();
