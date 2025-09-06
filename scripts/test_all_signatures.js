import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://smtdtgrymuzwvctattmx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NzYwMjMsImV4cCI6MjA3MDE1MjAyM30.7SefKj_zSbmaYNbrai9sKeGqcPZtcaXENdA4bNrXa5I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAllSignatures() {
  console.log('🔍 Test de toutes les signatures possibles des fonctions...\n');

  const signatures = [
    // Sans paramètres
    {},
    // Avec paramètres nommés corrects
    {
      company_name_param: 'Test Company',
      user_uuid_param: '550e8400-e29b-41d4-a716-446655440000',
      country_code_param: 'FR',
      currency_code_param: 'EUR',
      accounting_standard_param: 'PCG'
    },
    // Avec paramètres sans suffixe _param
    {
      company_name: 'Test Company',
      user_uuid: '550e8400-e29b-41d4-a716-446655440000',
      country_code: 'FR',
      currency_code: 'EUR',
      accounting_standard: 'PCG'
    },
    // Paramètres minimaux
    {
      company_name_param: 'Test Company',
      user_uuid_param: '550e8400-e29b-41d4-a716-446655440000'
    }
  ];

  console.log('📋 Test de create_company_with_setup avec différentes signatures:');

  for (let i = 0; i < signatures.length; i++) {
    const sig = signatures[i];
    console.log(`\n🔸 Signature ${i + 1}:`, Object.keys(sig).length > 0 ? Object.keys(sig) : 'sans paramètres');

    try {
      const { data, error } = await supabase.rpc('create_company_with_setup', sig);

      if (error) {
        if (error.code === 'PGRST202') {
          console.log('   ❌ Fonction n\'existe pas avec cette signature');
        } else {
          console.log('   ✅ Fonction existe, erreur:', error.message);
          console.log('   📝 Code erreur:', error.code);
        }
      } else {
        console.log('   ✅ Fonction fonctionne parfaitement!');
        console.log('   📝 Résultat:', data);
      }
    } catch (e) {
      console.log('   ❌ Erreur de connexion:', e.message);
    }
  }

  console.log('\n📋 Test de create_trial_subscription:');

  const trialSignatures = [
    {},
    { p_user_id: '550e8400-e29b-41d4-a716-446655440000', p_company_id: '550e8400-e29b-41d4-a716-446655440001' },
    { user_id: '550e8400-e29b-41d4-a716-446655440000', company_id: '550e8400-e29b-41d4-a716-446655440001' }
  ];

  for (let i = 0; i < trialSignatures.length; i++) {
    const sig = trialSignatures[i];
    console.log(`\n🔸 Signature ${i + 1}:`, Object.keys(sig).length > 0 ? Object.keys(sig) : 'sans paramètres');

    try {
      const { data, error } = await supabase.rpc('create_trial_subscription', sig);

      if (error) {
        if (error.code === 'PGRST202') {
          console.log('   ❌ Fonction n\'existe pas avec cette signature');
        } else {
          console.log('   ✅ Fonction existe, erreur:', error.message);
        }
      } else {
        console.log('   ✅ Fonction fonctionne parfaitement!');
        console.log('   📝 Résultat:', data);
      }
    } catch (e) {
      console.log('   ❌ Erreur de connexion:', e.message);
    }
  }

  console.log('\n📋 Recommandations:');
  console.log('- Si toutes les signatures échouent avec PGRST202: redéployez le SQL');
  console.log('- Si certaines signatures fonctionnent: les fonctions sont déployées');
  console.log('- Si erreurs de validation: les fonctions sont déployées et fonctionnelles');
}

testAllSignatures();
