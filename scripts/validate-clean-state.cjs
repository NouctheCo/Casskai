#!/usr/bin/env node

// Validation de l'état propre pour tests d'onboarding
console.log('🔍 === VALIDATION DE L\'ÉTAT PROPRE POUR TEST ONBOARDING ===\n');

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.log('Vérifiez que .env.local contient VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function validateCleanState() {
  try {
    console.log('🔗 Test de connexion Supabase...');
    
    // Test de connexion basique
    const { data: testData, error: testError } = await supabase
      .from('companies')
      .select('count', { count: 'exact' })
      .limit(1);
      
    if (testError) {
      console.error('❌ Erreur de connexion Supabase:', testError.message);
      return false;
    }
    
    console.log('✅ Connexion Supabase OK');
    
    // 1. Vérifier les données de test dans companies
    console.log('\n📊 Vérification des entreprises de test...');
    const { data: testCompanies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, siret, created_at')
      .or('name.ilike.%Test%,name.ilike.%Demo%,siret.like.12345678901234');
      
    if (companiesError) {
      console.warn('⚠️ Erreur vérification entreprises:', companiesError.message);
    } else {
      if (testCompanies && testCompanies.length > 0) {
        console.log(`⚠️ ${testCompanies.length} entreprise(s) de test trouvée(s):`);
        testCompanies.forEach(company => {
          console.log(`   - ${company.name} (${company.id}) - ${company.created_at}`);
        });
      } else {
        console.log('✅ Aucune entreprise de test détectée');
      }
    }
    
    // 2. Vérifier les utilisateurs de test
    console.log('\n👥 Vérification des utilisateurs (approximative via user_companies)...');
    const { data: userCompanies, error: usersError } = await supabase
      .from('user_companies')
      .select('user_id, companies(name)')
      .limit(10);
      
    if (usersError) {
      console.warn('⚠️ Erreur vérification utilisateurs:', usersError.message);
    } else {
      if (userCompanies && userCompanies.length > 0) {
        console.log(`📈 ${userCompanies.length} relation(s) utilisateur-entreprise trouvée(s)`);
        userCompanies.forEach(uc => {
          console.log(`   - User ${uc.user_id} -> ${uc.companies?.name || 'N/A'}`);
        });
      } else {
        console.log('✅ Aucune relation utilisateur-entreprise');
      }
    }
    
    // 3. Vérifier les données comptables orphelines
    console.log('\n🧾 Vérification des journaux comptables...');
    const { data: journals, error: journalsError } = await supabase
      .from('accounting_journals')
      .select('id, name, company_id')
      .limit(5);
      
    if (journalsError) {
      console.warn('⚠️ Erreur vérification journaux:', journalsError.message);
    } else {
      if (journals && journals.length > 0) {
        console.log(`📚 ${journals.length} journal/journaux comptable(s) trouvé(s)`);
      } else {
        console.log('✅ Aucun journal comptable');
      }
    }
    
    // 4. Vérifier les configurations de dashboard
    console.log('\n📊 Vérification des configurations dashboard...');
    const { data: dashboards, error: dashboardsError } = await supabase
      .from('dashboard_configs')
      .select('id, name, user_id')
      .limit(5);
      
    if (dashboardsError) {
      console.warn('⚠️ Erreur vérification dashboards:', dashboardsError.message);
    } else {
      if (dashboards && dashboards.length > 0) {
        console.log(`📈 ${dashboards.length} configuration(s) dashboard trouvée(s)`);
      } else {
        console.log('✅ Aucune configuration dashboard');
      }
    }
    
    // 5. Recommandations
    console.log('\n🎯 === RECOMMANDATIONS ===');
    
    const hasTestData = (testCompanies && testCompanies.length > 0) || 
                       (userCompanies && userCompanies.length > 0) ||
                       (journals && journals.length > 0);
    
    if (hasTestData) {
      console.log('⚠️ Données de test détectées - Recommandation:');
      console.log('   1. Exécuter: node scripts/cleanup-test-data.js --confirm');
      console.log('   2. Vider le cache navigateur et localStorage');
      console.log('   3. Utiliser un compte email frais (@test.com par exemple)');
    } else {
      console.log('✅ État semble propre - Prêt pour le test d\'onboarding');
      console.log('📋 Checklist avant test:');
      console.log('   ✅ Base de données propre');
      console.log('   🔄 Vider le cache navigateur (localStorage/sessionStorage)');
      console.log('   📧 Utiliser un nouveau email de test');
      console.log('   🌐 Ouvrir l\'application en mode incognito/privé');
    }
    
    console.log('\n🚀 Prêt à tester: https://casskai.app');
    return !hasTestData;
    
  } catch (error) {
    console.error('❌ Erreur lors de la validation:', error);
    return false;
  }
}

// Exécution
validateCleanState().then(isClean => {
  process.exit(isClean ? 0 : 1);
});