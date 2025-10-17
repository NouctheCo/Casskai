// 🚨 DEBUG SCRIPT - Nettoyer complètement le cache onboarding
// Copier-coller dans la console du navigateur

console.log('🧹 Nettoyage complet du cache onboarding...');

// 1. Nettoyer localStorage
const keysToRemove = [
  'onboarding_current_step',
  'onboarding_company_data',
  'onboarding_modules',
  'onboarding_just_completed',
  'seen_experience',
  'casskai_modules',
  'casskai_enterprises',
  'casskai_enterprises_timestamp'
];

keysToRemove.forEach(key => {
  localStorage.removeItem(key);
  console.log(`✅ Supprimé: ${key}`);
});

// 2. Nettoyer toutes les clés user-scoped (pattern: casskai_{userId}_*)
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('casskai_') && key.includes('_current_company_id')) {
    localStorage.removeItem(key);
    console.log(`✅ Supprimé: ${key}`);
  }
});

// 3. Nettoyer sessionStorage
sessionStorage.clear();
console.log('✅ sessionStorage vidé');

console.log('🎯 Cache nettoyé ! Rechargez la page (F5)');
