#!/usr/bin/env node

// Script pour corriger le flag onboarding_completed des utilisateurs
console.log('🔧 === CORRECTION ONBOARDING_COMPLETED ===\n');

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Clé service role nécessaire pour modifier auth

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.log('   - VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  console.log('\n💡 Ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local');
  process.exit(1);
}

// Client avec service role pour modifier les utilisateurs
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function fixOnboardingCompletion() {
  try {
    console.log('🔍 Recherche des utilisateurs avec des entreprises mais onboarding_completed=false...\n');
    
    // 1. Récupérer tous les utilisateurs
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Erreur récupération utilisateurs:', usersError.message);
      return;
    }
    
    console.log(`👥 ${users.users.length} utilisateur(s) trouvé(s)\n`);
    
    // 2. Pour chaque utilisateur, vérifier s'il a une entreprise
    const usersToFix = [];
    
    for (const user of users.users) {
      const userMetadata = user.user_metadata || {};
      const hasCompany = userMetadata.company_id;
      const onboardingCompleted = userMetadata.onboarding_completed;
      
      console.log(`👤 ${user.email || user.id}:`);
      console.log(`   🏢 Entreprise: ${hasCompany ? userMetadata.company_id : 'Aucune'}`);
      console.log(`   ✅ Onboarding: ${onboardingCompleted ? 'Terminé' : 'Non terminé'}`);
      
      // Si l'utilisateur a une entreprise mais onboarding_completed=false, il faut le corriger
      if (hasCompany && !onboardingCompleted) {
        console.log('   🔧 NÉCESSITE CORRECTION');
        usersToFix.push({
          id: user.id,
          email: user.email,
          companyId: userMetadata.company_id
        });
      } else if (hasCompany && onboardingCompleted) {
        console.log('   ✅ OK - Déjà corrigé');
      } else {
        console.log('   ⚠️  Pas d\'entreprise - Normal');
      }
      console.log();
    }
    
    if (usersToFix.length === 0) {
      console.log('🎉 Aucune correction nécessaire - Tous les utilisateurs sont OK !');
      return;
    }
    
    console.log(`🔧 ${usersToFix.length} utilisateur(s) à corriger:\n`);
    
    // 3. Corriger chaque utilisateur
    for (const userToFix of usersToFix) {
      console.log(`🔧 Correction de ${userToFix.email || userToFix.id}...`);
      
      const { error: updateError } = await supabase.auth.admin.updateUserById(userToFix.id, {
        user_metadata: {
          onboarding_completed: true,
          company_id: userToFix.companyId
        }
      });
      
      if (updateError) {
        console.error(`   ❌ Erreur: ${updateError.message}`);
      } else {
        console.log(`   ✅ Corrigé avec succès`);
      }
    }
    
    console.log(`\n🎉 Correction terminée pour ${usersToFix.length} utilisateur(s) !`);
    console.log('\n📋 Prochaines étapes:');
    console.log('1. Les utilisateurs concernés peuvent maintenant se déconnecter/reconnecter');
    console.log('2. Ou forcer le refresh des métadonnées côté client');
    console.log('3. Tester l\'accès aux modules sur https://casskai.app');
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error.message);
  }
}

fixOnboardingCompletion();