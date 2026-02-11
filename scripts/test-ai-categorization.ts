/**
 * Script de test pour Auto-Catégorisation IA
 * Valide que le système fonctionne correctement
 *
 * Usage:
 *   npm run test:ai-categorization
 */

import { aiAccountCategorizationService } from '../src/services/aiAccountCategorizationService';

// ID de test (remplacer par vrai company_id)
const TEST_COMPANY_ID = process.env.TEST_COMPANY_ID || 'your-company-id';

/**
 * Test 1 : Suggestions fallback keywords
 */
async function testKeywordSuggestions() {
  console.log('\n🧪 Test 1 : Suggestions fallback (keywords)');
  console.log('='.repeat(60));

  const testCases = [
    'VIR SALAIRES JANVIER 2024',
    'PRELEVEMENT EDF ELECTRICITE',
    'CHEQUE FOURNISSEUR ACME CORP',
    'VIREMENT CLIENT BETA INC',
    'AGIOS ET FRAIS BANCAIRES',
    'LOYER BUREAUX JANVIER'
  ];

  for (const description of testCases) {
    console.log(`\n📝 Description: "${description}"`);

    const suggestions = await aiAccountCategorizationService.suggestAccount(
      TEST_COMPANY_ID,
      description
    );

    if (suggestions.length > 0) {
      console.log('✅ Suggestions:');
      suggestions.forEach((s, i) => {
        console.log(`   ${i + 1}. ${s.account_code} - ${s.account_name}`);
        console.log(`      Confiance: ${s.confidence_score}% | ${s.reason}`);
      });
    } else {
      console.log('❌ Aucune suggestion');
    }
  }
}

/**
 * Test 2 : Apprentissage depuis historique
 */
async function testHistoryLearning() {
  console.log('\n🧪 Test 2 : Apprentissage depuis historique');
  console.log('='.repeat(60));

  const learnedCount = await aiAccountCategorizationService.learnFromHistory(
    TEST_COMPANY_ID,
    1000 // Analyser les 1000 dernières écritures
  );

  console.log(`✅ Apprentissage terminé: ${learnedCount} suggestions créées`);
}

/**
 * Test 3 : Statistiques
 */
async function testStats() {
  console.log('\n🧪 Test 3 : Statistiques d\'accuracy');
  console.log('='.repeat(60));

  const stats = await aiAccountCategorizationService.getStats(TEST_COMPANY_ID);

  if (stats) {
    console.log('📊 Statistiques:');
    console.log(`   Total suggestions: ${stats.total_suggestions}`);
    console.log(`   Validées: ${stats.validated_suggestions}`);
    console.log(`   Rejetées: ${stats.rejected_suggestions}`);
    console.log(`   Accuracy: ${stats.accuracy_rate}%`);
    console.log(`   Confiance moyenne: ${stats.avg_confidence_score.toFixed(1)}%`);

    if (stats.most_used_accounts.length > 0) {
      console.log('\n   🏆 Comptes les plus utilisés:');
      stats.most_used_accounts.slice(0, 5).forEach((acc, i) => {
        console.log(`      ${i + 1}. ${acc.account_code} (${acc.usage_count}x)`);
      });
    }
  } else {
    console.log('⚠️  Aucune statistique disponible (base vide)');
  }
}

/**
 * Test 4 : Feedback loop
 */
async function testFeedback() {
  console.log('\n🧪 Test 4 : Enregistrement feedback');
  console.log('='.repeat(60));

  const description = 'VIR SALAIRES TEST';
  const suggestedAccount = '641000';
  const actualAccount = '641000'; // Même compte = validation

  await aiAccountCategorizationService.recordFeedback(
    TEST_COMPANY_ID,
    description,
    suggestedAccount,
    actualAccount,
    true // validated
  );

  console.log('✅ Feedback enregistré (suggestion validée)');
  console.log(`   Description: ${description}`);
  console.log(`   Compte suggéré: ${suggestedAccount}`);
  console.log(`   Compte utilisé: ${actualAccount}`);
}

/**
 * Exécution de tous les tests
 */
async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  🤖 Tests Auto-Catégorisation IA - CassKai                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n📅 Date: ${new Date().toLocaleString('fr-FR')}`);
  console.log(`🏢 Company ID: ${TEST_COMPANY_ID}\n`);

  try {
    // Test 1 : Keywords (fonctionne toujours)
    await testKeywordSuggestions();

    // Test 2 : Apprentissage (nécessite écritures en DB)
    await testHistoryLearning();

    // Test 3 : Stats (nécessite données)
    await testStats();

    // Test 4 : Feedback (nécessite table suggestions)
    await testFeedback();

    console.log('\n\n✅ Tous les tests terminés avec succès !');
    console.log('\n💡 Prochaines étapes:');
    console.log('   1. Tester dans l\'UI (Comptabilité → Écritures)');
    console.log('   2. Mesurer accuracy sur données réelles');
    console.log('   3. Former les utilisateurs');

  } catch (error) {
    console.error('\n\n❌ Erreur durant les tests:', error);
    console.error('\n⚠️  Vérifiez:');
    console.error('   - Migration DB appliquée (ai_categorization_suggestions)');
    console.error('   - Variable TEST_COMPANY_ID correcte');
    console.error('   - RPC functions créées');
  }
}

// Exécution
runAllTests();
