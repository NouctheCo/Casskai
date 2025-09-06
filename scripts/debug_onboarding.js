// Script de debug pour tracer l'onboarding en temps réel
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

async function debugOnboarding() {
  console.log('🔍 Debug de l\'onboarding en temps réel...\n');

  // 1. Vérifier l'état de l'authentification
  console.log('🔐 État de l\'authentification:');
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.log('❌ Erreur d\'authentification:', authError);
    return;
  }

  if (!user) {
    console.log('❌ Aucun utilisateur connecté');
    console.log('💡 Ouvrez l\'application dans le navigateur et connectez-vous d\'abord');
    return;
  }

  console.log('✅ Utilisateur connecté:', {
    id: user.id,
    email: user.email,
    metadata: user.user_metadata
  });

  // 2. Vérifier la session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  console.log('\n🔑 État de la session:');
  if (sessionError) {
    console.log('❌ Erreur de session:', sessionError);
  } else if (session) {
    console.log('✅ Session active:', {
      access_token: session.access_token ? 'présent' : 'manquant',
      expires_at: session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'non défini',
      user_id: session.user.id
    });
  } else {
    console.log('❌ Aucune session active');
  }

  // 3. Vérifier les entreprises existantes
  console.log('\n🏢 Vérification des entreprises existantes:');
  const { data: existingCompanies, error: companiesError } = await supabase
    .from('user_companies')
    .select(`
      company_id,
      role,
      companies!inner (
        id,
        name,
        country,
        default_currency
      )
    `)
    .eq('user_id', user.id);

  if (companiesError) {
    console.log('❌ Erreur lors de la vérification des entreprises:', companiesError);
  } else {
    console.log('📋 Entreprises trouvées:', existingCompanies);
  }

  // 4. Tester la fonction create_company_with_setup
  console.log('\n🏭 Test de création d\'entreprise:');
  const testCompanyData = {
    company_name: `Test Debug ${Date.now()}`,
    user_uuid: user.id,
    country_code: 'FR',
    currency_code: 'EUR',
    accounting_standard_param: null
  };

  console.log('📤 Données de test:', testCompanyData);

  try {
    const { data: companyId, error: createError } = await supabase.rpc(
      'create_company_with_setup',
      testCompanyData
    );

    if (createError) {
      console.log('❌ Erreur lors de la création:', createError);
      console.log('📋 Code d\'erreur:', createError.code);
      console.log('📋 Message détaillé:', createError.message);
      console.log('📋 Détails:', createError.details);
    } else {
      console.log('✅ Entreprise créée avec succès:', companyId);

      // Vérifier que l'entreprise a été créée
      const { data: newCompany, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (fetchError) {
        console.log('❌ Erreur lors de la récupération:', fetchError);
      } else {
        console.log('✅ Entreprise récupérée:', newCompany);
      }

      // Vérifier l'association user-company
      const { data: userCompany, error: userCompanyError } = await supabase
        .from('user_companies')
        .select('*')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .single();

      if (userCompanyError) {
        console.log('❌ Erreur association user-company:', userCompanyError);
      } else {
        console.log('✅ Association user-company:', userCompany);
      }

      // Vérifier les comptes créés
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('company_id', companyId);

      if (accountsError) {
        console.log('❌ Erreur comptes:', accountsError);
      } else {
        console.log(`✅ ${accounts.length} comptes créés:`, accounts.map(a => `${a.account_number} - ${a.name}`));
      }
    }
  } catch (err) {
    console.log('❌ Erreur inattendue:', err);
  }

  // 5. Vérifier les métadonnées utilisateur
  console.log('\n👤 Métadonnées utilisateur:');
  console.log('Métadonnées actuelles:', user.user_metadata);

  console.log('\n🎯 Instructions pour le debug:');
  console.log('1. Ouvrez l\'application dans le navigateur');
  console.log('2. Connectez-vous avec votre compte');
  console.log('3. Allez à l\'onboarding et remplissez les étapes');
  console.log('4. Quand vous arrivez à "Commencer avec CassKai", regardez la console du navigateur (F12)');
  console.log('5. Les logs de debug apparaîtront avec les préfixes 🔍, 📤, 📥, ✅, ❌');
  console.log('6. Si vous voyez une erreur, copiez-la ici pour analyse');
}

// Fonction pour surveiller les changements en temps réel
async function watchRealtimeChanges() {
  console.log('\n👀 Surveillance des changements en temps réel...');

  // Surveiller les nouvelles entreprises
  const companiesChannel = supabase
    .channel('companies_changes')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'companies'
    }, (payload) => {
      console.log('🏢 Nouvelle entreprise créée:', payload.new);
    })
    .subscribe();

  // Surveiller les nouvelles associations user-company
  const userCompaniesChannel = supabase
    .channel('user_companies_changes')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'user_companies'
    }, (payload) => {
      console.log('👥 Nouvelle association user-company:', payload.new);
    })
    .subscribe();

  // Surveiller les nouveaux comptes
  const accountsChannel = supabase
    .channel('accounts_changes')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'accounts'
    }, (payload) => {
      console.log('💰 Nouveau compte créé:', payload.new);
    })
    .subscribe();

  console.log('✅ Surveillance activée - les changements apparaîtront en temps réel');
  console.log('💡 Appuyez sur Ctrl+C pour arrêter');

  // Garder le script actif
  process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt de la surveillance...');
    supabase.removeChannel(companiesChannel);
    supabase.removeChannel(userCompaniesChannel);
    supabase.removeChannel(accountsChannel);
    process.exit(0);
  });
}

// Exécuter le debug
await debugOnboarding();
await watchRealtimeChanges();
