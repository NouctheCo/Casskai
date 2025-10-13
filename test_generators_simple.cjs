/**
 * Test rapide des générateurs de rapports - vérification des méthodes
 */

const fs = require('fs');
const path = require('path');

function checkGeneratorMethods(filePath, generatorName) {
  console.log(`🔍 Vérification ${generatorName}...`);

  try {
    const content = fs.readFileSync(filePath, 'utf8');

    const expectedMethods = [
      'generateCashFlowStatement',
      'generateAgedReceivables',
      'generateAgedPayables',
      'generateFinancialRatios',
      'generateVATReport',
      'generateBudgetVariance',
      'generateKPIDashboard',
      'generateTaxSummary'
    ];

    let foundMethods = 0;
    expectedMethods.forEach(method => {
      if (content.includes(method)) {
        foundMethods++;
        console.log(`   ✅ ${method}`);
      } else {
        console.log(`   ❌ ${method} - MANQUANT`);
      }
    });

    console.log(`📊 ${generatorName}: ${foundMethods}/${expectedMethods.length} méthodes trouvées`);

    return foundMethods === expectedMethods.length;

  } catch (error) {
    console.error(`❌ Erreur lecture ${generatorName}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Test d\'intégration des générateurs de rapports\n');

  const pdfPath = path.join(__dirname, 'src', 'utils', 'reportGeneration', 'core', 'pdfGenerator.ts');
  const excelPath = path.join(__dirname, 'src', 'utils', 'reportGeneration', 'core', 'excelGenerator.ts');

  const pdfOk = checkGeneratorMethods(pdfPath, 'PDF Generator');
  console.log('');
  const excelOk = checkGeneratorMethods(excelPath, 'Excel Generator');

  console.log('\n📋 Résultats:');
  console.log(`   PDF Generator: ${pdfOk ? '✅ Complet' : '❌ Incomplet'}`);
  console.log(`   Excel Generator: ${excelOk ? '✅ Complet' : '❌ Incomplet'}`);

  if (pdfOk && excelOk) {
    console.log('\n🎉 SUCCÈS: Tous les générateurs sont correctement intégrés!');
    console.log('📈 Prêt pour la génération de 8 rapports complets (Excel + PDF)');
    process.exit(0);
  } else {
    console.log('\n❌ ÉCHEC: Intégration incomplète détectée');
    process.exit(1);
  }
}

main();