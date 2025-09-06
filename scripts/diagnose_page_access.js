import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://smtdtgrymuzwvctattmx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NzYwMjMsImV4cCI6MjA3MDE1MjAyM30.7SefKj_zSbmaYNbrai9sKeGqcPZtcaXENdA4bNrXa5I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnosePageAccess() {
  console.log('🔍 Diagnostic d\'accès aux pages Settings et Inventory...\n');

  try {
    // Test 1: Vérifier l'utilisateur connecté
    console.log('📋 Test 1: Utilisateur connecté');
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.log('❌ Erreur récupération utilisateur:', userError.message);
      return;
    }

    if (!user) {
      console.log('❌ Aucun utilisateur connecté');
      console.log('💡 Connectez-vous d\'abord à l\'application');
      return;
    }

    console.log(`✅ Utilisateur connecté: ${user.email} (ID: ${user.id})`);

    // Test 2: Vérifier les modules sauvegardés
    console.log('\n📋 Test 2: Modules sauvegardés dans localStorage');
    const savedModules = localStorage.getItem('casskai_modules');

    if (savedModules) {
      try {
        const modulesData = JSON.parse(savedModules);
        console.log('✅ Modules trouvés dans localStorage:');
        Object.entries(modulesData).forEach(([moduleId, isActive]) => {
          console.log(`   ${moduleId}: ${isActive ? '✅ Actif' : '❌ Inactif'}`);
        });

        // Vérifier si settings et inventory sont actifs
        const settingsActive = modulesData.settings;
        const inventoryActive = modulesData.inventory;

        console.log(`\n📋 État des modules critiques:`);
        console.log(`   Settings: ${settingsActive ? '✅ Actif' : '❌ Inactif'}`);
        console.log(`   Inventory: ${inventoryActive ? '✅ Actif' : '❌ Inactif'}`);

        if (!settingsActive) {
          console.log('\n⚠️  Module Settings inactif - cela peut expliquer le problème d\'accès');
        }
        if (!inventoryActive) {
          console.log('\n⚠️  Module Inventory inactif - cela peut expliquer le problème d\'accès');
        }

      } catch (parseError) {
        console.log('❌ Erreur parsing modules localStorage:', parseError.message);
      }
    } else {
      console.log('❌ Aucun module trouvé dans localStorage');
      console.log('💡 Les modules n\'ont peut-être jamais été sauvegardés');
    }

    // Test 3: Vérifier les données d'entreprise
    console.log('\n📋 Test 3: Données d\'entreprise');
    const enterpriseId = localStorage.getItem('casskai_current_enterprise');
    const enterprises = localStorage.getItem('casskai_enterprises');

    if (enterpriseId) {
      console.log(`✅ Entreprise ID trouvée: ${enterpriseId}`);
    } else {
      console.log('❌ Aucune entreprise ID trouvée');
    }

    if (enterprises) {
      try {
        const enterprisesData = JSON.parse(enterprises);
        console.log('✅ Données entreprises trouvées:', enterprisesData.length, 'entreprises');
      } catch (parseError) {
        console.log('❌ Erreur parsing entreprises:', parseError.message);
      }
    } else {
      console.log('❌ Aucune donnée entreprise trouvée');
    }

    // Test 4: Vérifier les permissions
    console.log('\n📋 Test 4: Permissions utilisateur');
    const permissions = localStorage.getItem('casskai_permissions');

    if (permissions) {
      try {
        const permissionsData = JSON.parse(permissions);
        console.log('✅ Permissions trouvées:', permissionsData);

        const hasSettingsPermission = permissionsData.includes('*') || permissionsData.includes('settings');
        const hasInventoryPermission = permissionsData.includes('*') || permissionsData.includes('inventory');

        console.log(`\n📋 Permissions pour les modules critiques:`);
        console.log(`   Settings: ${hasSettingsPermission ? '✅ Autorisé' : '❌ Non autorisé'}`);
        console.log(`   Inventory: ${hasInventoryPermission ? '✅ Autorisé' : '❌ Non autorisé'}`);

      } catch (parseError) {
        console.log('❌ Erreur parsing permissions:', parseError.message);
      }
    } else {
      console.log('❌ Aucune permission trouvée');
    }

    // Test 5: Vérifier l'état d'onboarding
    console.log('\n📋 Test 5: État d\'onboarding');
    const onboardingCompleted = localStorage.getItem('casskai_onboarding_completed');

    if (onboardingCompleted === 'true') {
      console.log('✅ Onboarding marqué comme terminé');
    } else {
      console.log('❌ Onboarding non terminé ou état inconnu');
      console.log('💡 L\'onboarding doit être terminé pour accéder aux modules');
    }

    // Recommandations
    console.log('\n📋 Recommandations:');
    console.log('1. Si les modules ne sont pas actifs: Activez-les dans les paramètres');
    console.log('2. Si pas d\'entreprise: Créez ou sélectionnez une entreprise');
    console.log('3. Si onboarding non terminé: Terminez le processus d\'onboarding');
    console.log('4. Si permissions manquantes: Vérifiez les rôles utilisateur');
    console.log('5. Essayez de rafraîchir la page après avoir corrigé ces problèmes');

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message);
  }
}

diagnosePageAccess();
