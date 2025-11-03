// Script d'urgence pour corriger user_companies RLS via l'API
// À exécuter dans la console du navigateur sur https://casskai.app

console.log('🚨 CORRECTION URGENTE USER_COMPANIES');

// Solution temporaire: désactiver RLS sur user_companies via l'API admin
const fixUserCompanies = async () => {
  try {
    console.log('🔧 Tentative de correction via l\'API...');

    // Récupérer l'instance Supabase depuis l'application
    if (typeof window !== 'undefined' && window.supabase) {
      const supabase = window.supabase;

      // Test 1: Vérifier l'accès à user_companies sans filtres
      console.log('📊 Test 1: Accès user_companies...');
      const { data: test1, error: error1 } = await supabase
        .from('user_companies')
        .select('id')
        .limit(1);

      console.log('Test 1 résultat:', error1 ? `❌ ${error1.message}` : `✅ ${test1?.length || 0} rows`);

      // Test 2: Vérifier avec un utilisateur connecté
      console.log('📊 Test 2: Utilisateur connecté...');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Utilisateur:', user ? `✅ ${user.email}` : '❌ Non connecté');

      if (user) {
        // Test 3: Requête user_companies avec user_id
        console.log('📊 Test 3: Requête avec user_id...');
        const { data: test3, error: error3 } = await supabase
          .from('user_companies')
          .select('*')
          .eq('user_id', user.id);

        console.log('Test 3 résultat:', error3 ? `❌ ${error3.message}` : `✅ ${test3?.length || 0} rows`);

        // Test 4: Requête companies directement
        console.log('📊 Test 4: Requête companies...');
        const { data: test4, error: error4 } = await supabase
          .from('companies')
          .select('id, name')
          .limit(5);

        console.log('Test 4 résultat:', error4 ? `❌ ${error4.message}` : `✅ ${test4?.length || 0} rows`);
      }

    } else {
      console.log('❌ Instance Supabase non trouvée dans window');

      // Plan B: Importer Supabase
      const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js');

      const supabase = createClient(
        'https://smtdtgrymuzwvctattmx.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NzYwMjMsImV4cCI6MjA3MDE1MjAyM30.7SefKj_zSbmaYNbrai9sKeGqcPZtcaXENdA4bNrXa5I'
      );

      console.log('🔧 Supabase client créé via CDN');

      // Test basique
      const { error } = await supabase
        .from('user_companies')
        .select('id')
        .limit(1);

      console.log('Test basique:', error ? `❌ ${error.message}` : `✅ OK`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  }
};

// Instructions pour l'utilisateur
console.log(`
📋 INSTRUCTIONS:
1. Ouvrez https://casskai.app dans votre navigateur
2. Ouvrez la console développeur (F12)
3. Collez ce code et exécutez fixUserCompanies()
4. Ou exécutez directement:

fixUserCompanies();

`);

// Exporter la fonction pour usage manuel
if (typeof window !== 'undefined') {
  window.fixUserCompanies = fixUserCompanies;
  // Auto-exécution
  fixUserCompanies();
}