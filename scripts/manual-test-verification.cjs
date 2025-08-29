#!/usr/bin/env node

// Vérification manuelle des données créées par le test
console.log('🔍 === VÉRIFICATION MANUELLE TEST ONBOARDING ===\n');

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyTestData() {
  try {
    // Données du dernier test
    const lastTestUserId = '154d4cdd-bd8a-4eb6-bc6e-8c9ad506b5f1';
    const lastTestCompanyId = 'd735eba6-e475-4332-9f23-0a085d6f3d4f';
    const lastTestEmail = 'test-onboarding-1755473259416@gmail.com';
    
    console.log('🔍 Vérification avec les IDs du dernier test:');
    console.log('   👤 User ID:', lastTestUserId);
    console.log('   🏢 Company ID:', lastTestCompanyId);
    console.log('   📧 Email:', lastTestEmail);
    
    // 1. Vérifier l'entreprise directement avec service_role
    console.log('\n🏢 Vérification entreprise...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, active_modules, created_at')
      .eq('name', 'Test Company Demo')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (companiesError) {
      console.error('❌ Erreur récupération entreprises:', companiesError.message);
    } else if (companies && companies.length > 0) {
      console.log(`✅ ${companies.length} entreprise(s) trouvée(s):`);
      companies.forEach((company, i) => {
        console.log(`   ${i+1}. ${company.name} (${company.id})`);
        
        if (company.active_modules) {
          const modules = typeof company.active_modules === 'string' 
            ? JSON.parse(company.active_modules)
            : company.active_modules;
          const activeModulesList = Object.keys(modules).filter(k => modules[k]);
          console.log(`      📦 Modules actifs: ${activeModulesList.join(', ')}`);
        } else {
          console.log('      ⚠️ Aucun module actif');
        }
      });
    } else {
      console.log('❌ Aucune entreprise trouvée');
    }
    
    // 2. Vérifier les relations user-company
    console.log('\n👥 Vérification relations utilisateur-entreprise...');
    const { data: userCompanies, error: relationsError } = await supabase
      .from('user_companies')
      .select(`
        user_id,
        company_id,
        role,
        companies(name, active_modules)
      `)
      .eq('company_id', lastTestCompanyId);
      
    if (relationsError) {
      console.error('❌ Erreur relations:', relationsError.message);
    } else if (userCompanies && userCompanies.length > 0) {
      console.log(`✅ ${userCompanies.length} relation(s) trouvée(s):`);
      userCompanies.forEach(rel => {
        console.log(`   👤 ${rel.user_id}`);
        console.log(`   🏢 ${rel.companies?.name} (${rel.company_id})`);
        console.log(`   👑 Rôle: ${rel.role}`);
        
        if (rel.companies?.active_modules) {
          const modules = typeof rel.companies.active_modules === 'string'
            ? JSON.parse(rel.companies.active_modules)
            : rel.companies.active_modules;
          const activeModulesList = Object.keys(modules).filter(k => modules[k]);
          console.log(`   📦 Modules: ${activeModulesList.join(', ')}`);
        }
      });
    } else {
      console.log('❌ Aucune relation trouvée');
    }
    
    // 3. Recommandations pour test manuel
    console.log('\n🧪 === RECOMMANDATIONS POUR TEST MANUEL ===');
    
    if (companies && companies.length > 0) {
      const latestCompany = companies[0];
      console.log('✅ Base de données préparée avec succès !');
      console.log('\n📋 Instructions pour test manuel:');
      console.log('1. Ouvrir https://casskai.app en mode incognito');
      console.log(`2. Se connecter avec: ${lastTestEmail}`);
      console.log('   Mot de passe: TestPassword123!');
      console.log('3. Vérifier redirection vers dashboard');
      console.log('4. Dans la sidebar, chercher les modules premium:');
      
      if (latestCompany.active_modules) {
        const modules = typeof latestCompany.active_modules === 'string'
          ? JSON.parse(latestCompany.active_modules)
          : latestCompany.active_modules;
        const expectedModules = ['crm', 'hr', 'projects', 'marketplace'];
        expectedModules.forEach(module => {
          if (modules[module]) {
            console.log(`   ✅ ${module.toUpperCase()} - Doit apparaître avec badge Premium`);
          }
        });
      }
      
      console.log('\n🎯 Critères de succès:');
      console.log('   ✅ Login réussi sans erreur');
      console.log('   ✅ 4 modules premium visibles dans sidebar');
      console.log('   ✅ Navigation fonctionnelle dans chaque module');
      console.log('   ✅ Mode essai activé (notification visible)');
      
    } else {
      console.log('❌ Données de test non trouvées');
      console.log('Relancer: node scripts/automated-onboarding-test.cjs');
    }
    
  } catch (error) {
    console.error('❌ Erreur vérification:', error);
  }
}

verifyTestData();