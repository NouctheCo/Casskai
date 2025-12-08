// Script pour activer les modules critiques et corriger les problèmes d'accès
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://smtdtgrymuzwvctattmx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NzYwMjMsImV4cCI6MjA3MDE1MjAyM30.7SefKj_zSbmaYNbrai9sKeGqcPZtcaXENdA4bNrXa5I';

// Note: supabase client created but not used in this script - for future enhancements
createClient(supabaseUrl, supabaseKey);

async function fixModuleAccess() {
  console.log('🔧 Correction des problèmes d\'accès aux modules...\n');

  try {
    // Étape 1: Activer les modules critiques dans localStorage
    console.log('📋 Étape 1: Activation des modules critiques');

    const criticalModules = {
      'dashboard': true,
      'accounting': true,
      'settings': true,
      'inventory': true,
      'users': true,
      'security': true,
      'thirdParties': true,
      'banking': true,
      'invoicing': true,
      'sales': true,
      'hr': true,
      'projects': true,
      'reports': true,
      'forecasts': true,
      'tax': true,
      'contracts': true
    };

    localStorage.setItem('casskai_modules', JSON.stringify(criticalModules));
    console.log('✅ Modules critiques activés dans localStorage');

    // Étape 2: Marquer l'onboarding comme terminé
    console.log('\n📋 Étape 2: Marquage de l\'onboarding comme terminé');
    localStorage.setItem('casskai_onboarding_completed', 'true');
    console.log('✅ Onboarding marqué comme terminé');

    // Étape 3: Définir des permissions par défaut
    console.log('\n📋 Étape 3: Configuration des permissions');
    const defaultPermissions = ['*']; // Permission wildcard pour tout
    localStorage.setItem('casskai_permissions', JSON.stringify(defaultPermissions));
    console.log('✅ Permissions configurées');

    // Étape 4: Créer une entreprise de test si nécessaire
    console.log('\n📋 Étape 4: Vérification de l\'entreprise');

    const currentEnterpriseId = localStorage.getItem('casskai_current_enterprise');
    if (!currentEnterpriseId) {
      // Créer un ID d'entreprise fictif pour les tests
      const testEnterpriseId = `test-enterprise-${  Date.now()}`;
      localStorage.setItem('casskai_current_enterprise', testEnterpriseId);

      // Créer des données d'entreprise de test
      const testEnterprises = [{
        id: testEnterpriseId,
        name: 'Entreprise Test',
        country: 'FR',
        currency: 'EUR',
        accounting_standard: 'PCG'
      }];
      localStorage.setItem('casskai_enterprises', JSON.stringify(testEnterprises));

      console.log('✅ Entreprise de test créée');
    } else {
      console.log('✅ Entreprise existante trouvée');
    }

    // Étape 5: Vérifier que tout est correctement configuré
    console.log('\n📋 Étape 5: Vérification finale');

    const finalModules = localStorage.getItem('casskai_modules');
    const finalOnboarding = localStorage.getItem('casskai_onboarding_completed');
    const finalPermissions = localStorage.getItem('casskai_permissions');
    const finalEnterprise = localStorage.getItem('casskai_current_enterprise');

    console.log('📋 État final:');
    console.log(`   Modules: ${finalModules ? '✅ Configuré' : '❌ Manquant'}`);
    console.log(`   Onboarding: ${finalOnboarding === 'true' ? '✅ Terminé' : '❌ Non terminé'}`);
    console.log(`   Permissions: ${finalPermissions ? '✅ Configuré' : '❌ Manquant'}`);
    console.log(`   Entreprise: ${finalEnterprise ? '✅ Configuré' : '❌ Manquant'}`);

    // Étape 6: Instructions pour l'utilisateur
    console.log('\n🎯 Instructions:');
    console.log('1. Rafraîchissez la page de l\'application (F5 ou Ctrl+F5)');
    console.log('2. Les pages Settings et Inventory devraient maintenant être accessibles');
    console.log('3. Si vous n\'êtes pas connecté, connectez-vous d\'abord');
    console.log('4. Les modules critiques sont maintenant activés par défaut');

    console.log('\n✅ Correction terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error.message);
  }
}

fixModuleAccess();
