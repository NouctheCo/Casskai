// Script de test final pour vérifier que les fonctions Supabase fonctionnent
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Charger les variables d'environnement depuis .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFinal() {
  console.log('🧪 Test final des fonctions Supabase après corrections...\n');

  try {
    // 1. Vérifier toutes les tables
    console.log('📋 Vérification des tables:');
    const tables = ['companies', 'user_companies', 'accounts', 'subscriptions'];

    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: OK`);
        }
      } catch (err) {
        console.log(`❌ Table ${table}: Erreur - ${err.message}`);
      }
    }

    // 2. Tester la connexion utilisateur
    console.log('\n� Test de connexion utilisateur:');
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.log('❌ Pas d\'utilisateur connecté:', authError.message);
      console.log('ℹ️  Pour tester complètement, connectez-vous d\'abord dans l\'application');
    } else if (user) {
      console.log('✅ Utilisateur connecté:', user.id);

      // 3. Tester create_company_with_setup avec l'utilisateur réel
      console.log('\n🏢 Test de create_company_with_setup:');
      const testCompanyName = `Test Company ${Date.now()}`;

      const { data: companyId, error: companyError } = await supabase.rpc(
        'create_company_with_setup',
        {
          company_name: testCompanyName,
          user_uuid: user.id,
          country_code: 'FR',
          currency_code: 'EUR',
          accounting_standard_param: null
        }
      );

      if (companyError) {
        console.log('❌ Erreur create_company_with_setup:', companyError);
      } else {
        console.log('✅ Entreprise créée avec succès:', companyId);

        // 4. Tester create_trial_subscription
        console.log('\n🎫 Test de create_trial_subscription:');
        const { data: subscriptionId, error: subError } = await supabase.rpc(
          'create_trial_subscription',
          {
            p_user_id: user.id,
            p_company_id: companyId
          }
        );

        if (subError) {
          console.log('❌ Erreur create_trial_subscription:', subError);
        } else {
          console.log('✅ Abonnement créé avec succès:', subscriptionId);
        }

        // 5. Vérifier les données créées
        console.log('\n� Vérification des données créées:');

        // Vérifier l'entreprise
        const { data: company, error: companyCheckError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single();

        if (companyCheckError) {
          console.log('❌ Erreur vérification entreprise:', companyCheckError);
        } else {
          console.log('✅ Entreprise vérifiée:', company.name);
        }

        // Vérifier user_companies
        const { data: userCompany, error: userCompanyError } = await supabase
          .from('user_companies')
          .select('*')
          .eq('user_id', user.id)
          .eq('company_id', companyId)
          .single();

        if (userCompanyError) {
          console.log('❌ Erreur vérification user_companies:', userCompanyError);
        } else {
          console.log('✅ Association user-company vérifiée:', userCompany.role);
        }

        // Vérifier les comptes
        const { data: accounts, error: accountsError } = await supabase
          .from('accounts')
          .select('*')
          .eq('company_id', companyId);

        if (accountsError) {
          console.log('❌ Erreur vérification comptes:', accountsError);
        } else {
          console.log(`✅ ${accounts.length} comptes créés`);
        }

        // Vérifier l'abonnement
        if (subscriptionId) {
          const { data: subscription, error: subCheckError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('id', subscriptionId)
            .single();

          if (subCheckError) {
            console.log('❌ Erreur vérification abonnement:', subCheckError);
          } else {
            console.log('✅ Abonnement vérifié:', subscription.status);
          }
        }
      }
    } else {
      console.log('❌ Aucun utilisateur trouvé');
    }

  } catch (err) {
    console.error('❌ Erreur générale:', err);
  }

  console.log('\n🎉 Test terminé !');
  console.log('💡 Si tout est vert ✅, l\'onboarding devrait maintenant fonctionner.');
}

testFinal();
