/**
 * Script de test pour valider la génération des rapports Excel et PDF
 * Test rapide pour s'assurer que les intégrations fonctionnent
 */

import { PDFGenerator } from '../src/utils/reportGeneration/core/pdfGenerator';
import { ExcelGenerator } from '../src/utils/reportGeneration/core/excelGenerator';

// Configuration de test
const testConfig = {
  company: {
    name: 'Test Company',
    address: '123 Test Street',
    phone: '+33123456789',
    email: 'test@company.com',
    logo_url: null
  },
  title: 'Test Report',
  subtitle: 'Validation des générateurs',
  period: {
    start: '2024-01-01',
    end: '2024-12-31'
  },
  margins: { top: 20, bottom: 20, left: 15, right: 15 }
};

// Données de test minimales
const testData = {
  balanceSheet: {
    assets: { current: [], fixed: [], total: 0 },
    liabilities: { current: [], longTerm: [], total: 0 },
    equity: { capital: 0, reserves: 0, retainedEarnings: 0, total: 0 }
  },
  incomeStatement: {
    revenues: [],
    expenses: [],
    netIncome: 0
  },
  trialBalance: [],
  generalLedger: [],
  cashFlow: {
    operating: [],
    investing: [],
    financing: [],
    netCashFlow: 0
  },
  agedReceivables: [],
  agedPayables: [],
  financialRatios: {
    liquidity: [],
    profitability: [],
    efficiency: [],
    solvency: []
  },
  vatReport: {
    period: '2024-Q4',
    sales: [],
    purchases: [],
    vatDue: 0,
    vatCredited: 0
  },
  budgetVariance: [],
  kpiDashboard: {
    financial: [],
    operational: [],
    customer: []
  },
  taxSummary: {
    corporateTax: 0,
    vat: 0,
    otherTaxes: 0,
    total: 0
  }
};

async function testPDFGeneration() {
  console.log('🧪 Test génération PDF...');

  try {
    const pdfGenerator = new PDFGenerator(testConfig);

    // Test génération bilan
    await pdfGenerator.generateBalanceSheet(testData.balanceSheet);
    console.log('✅ Bilan PDF généré');

    // Test génération compte de résultat
    await pdfGenerator.generateIncomeStatement(testData.incomeStatement);
    console.log('✅ Compte de résultat PDF généré');

    // Test génération balance générale
    await pdfGenerator.generateTrialBalance(testData.trialBalance);
    console.log('✅ Balance générale PDF générée');

    // Test génération grand livre
    await pdfGenerator.generateGeneralLedger(testData.generalLedger);
    console.log('✅ Grand livre PDF généré');

    // Test génération flux de trésorerie
    await pdfGenerator.generateCashFlowStatement(testData.cashFlow);
    console.log('✅ Flux de trésorerie PDF généré');

    // Test génération créances âgées
    await pdfGenerator.generateAgedReceivables(testData.agedReceivables);
    console.log('✅ Créances âgées PDF générées');

    // Test génération dettes âgées
    await pdfGenerator.generateAgedPayables(testData.agedPayables);
    console.log('✅ Dettes âgées PDF générées');

    // Test génération ratios financiers
    await pdfGenerator.generateFinancialRatios(testData.financialRatios);
    console.log('✅ Ratios financiers PDF générés');

    // Test génération rapport TVA
    await pdfGenerator.generateVATReport(testData.vatReport);
    console.log('✅ Rapport TVA PDF généré');

    // Test génération écart budgétaire
    await pdfGenerator.generateBudgetVariance(testData.budgetVariance);
    console.log('✅ Écart budgétaire PDF généré');

    // Test génération tableau de bord KPI
    await pdfGenerator.generateKPIDashboard(testData.kpiDashboard);
    console.log('✅ Tableau de bord KPI PDF généré');

    // Test génération résumé fiscal
    await pdfGenerator.generateTaxSummary(testData.taxSummary);
    console.log('✅ Résumé fiscal PDF généré');

    console.log('🎉 Tous les rapports PDF générés avec succès !');

  } catch (error) {
    console.error('❌ Erreur génération PDF:', error);
    throw error;
  }
}

async function testExcelGeneration() {
  console.log('🧪 Test génération Excel...');

  try {
    const excelGenerator = new ExcelGenerator(testConfig);

    // Test génération bilan
    await excelGenerator.generateBalanceSheet(testData.balanceSheet);
    console.log('✅ Bilan Excel généré');

    // Test génération compte de résultat
    await excelGenerator.generateIncomeStatement(testData.incomeStatement);
    console.log('✅ Compte de résultat Excel généré');

    // Test génération balance générale
    await excelGenerator.generateTrialBalance(testData.trialBalance);
    console.log('✅ Balance générale Excel générée');

    // Test génération grand livre
    await excelGenerator.generateGeneralLedger(testData.generalLedger);
    console.log('✅ Grand livre Excel généré');

    // Test génération flux de trésorerie
    await excelGenerator.generateCashFlowStatement(testData.cashFlow);
    console.log('✅ Flux de trésorerie Excel généré');

    // Test génération créances âgées
    await excelGenerator.generateAgedReceivables(testData.agedReceivables);
    console.log('✅ Créances âgées Excel générées');

    // Test génération dettes âgées
    await excelGenerator.generateAgedPayables(testData.agedPayables);
    console.log('✅ Dettes âgées Excel générées');

    // Test génération ratios financiers
    await excelGenerator.generateFinancialRatios(testData.financialRatios);
    console.log('✅ Ratios financiers Excel générés');

    // Test génération rapport TVA
    await excelGenerator.generateVATReport(testData.vatReport);
    console.log('✅ Rapport TVA Excel généré');

    // Test génération écart budgétaire
    await excelGenerator.generateBudgetVariance(testData.budgetVariance);
    console.log('✅ Écart budgétaire Excel généré');

    // Test génération tableau de bord KPI
    await excelGenerator.generateKPIDashboard(testData.kpiDashboard);
    console.log('✅ Tableau de bord KPI Excel généré');

    // Test génération résumé fiscal
    await excelGenerator.generateTaxSummary(testData.taxSummary);
    console.log('✅ Résumé fiscal Excel généré');

    console.log('🎉 Tous les rapports Excel générés avec succès !');

  } catch (error) {
    console.error('❌ Erreur génération Excel:', error);
    throw error;
  }
}

// Fonction principale de test
async function runTests() {
  console.log('🚀 Démarrage des tests de génération de rapports...\n');

  try {
    await testPDFGeneration();
    console.log('');
    await testExcelGeneration();

    console.log('\n🎊 Tous les tests passés avec succès !');
    console.log('📊 Les générateurs Excel et PDF sont opérationnels.');

  } catch (error) {
    console.error('\n💥 Échec des tests:', error);
    process.exit(1);
  }
}

// Exécuter les tests
runTests();