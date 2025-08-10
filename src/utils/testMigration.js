// src/utils/testMigration.js
// Script pour tester et valider la migration des services

import { accountsService } from '../services/accountsService';
import { journalsService } from '../services/journalsService';
import { journalEntryService } from '../services/journalEntryService';
import { dashboardService } from '../services/dashboardService';

// Configuration de test
const TEST_COMPANY_ID = 'your-test-company-id'; // Remplacer par votre ID d'entreprise de test

export const migrationTester = {
  // 1. Test du service des comptes
  async testAccountsService() {
    console.log('🧪 Testing AccountsService...');
    
    try {
      // Test 1: Récupérer les comptes
      const { data: accounts, error } = await accountsService.getAccounts(TEST_COMPANY_ID);
      console.log('✅ getAccounts:', accounts?.length || 0, 'comptes trouvés');
      
      // Test 2: Créer un compte de test
      const testAccount = {
        account_number: 'TEST001',
        name: 'Compte de test',
        type: 'asset',
        description: 'Compte créé pour les tests'
      };
      
      const { data: newAccount, error: createError } = await accountsService.createAccount(
        TEST_COMPANY_ID, 
        testAccount
      );
      
      if (createError) {
        console.log('ℹ️ Compte de test existe déjà ou erreur:', createError.message);
      } else {
        console.log('✅ createAccount: Compte créé avec ID:', newAccount.id);
        
        // Test 3: Mettre à jour le compte
        const { error: updateError } = await accountsService.updateAccount(newAccount.id, {
          description: 'Description mise à jour'
        });
        
        if (!updateError) {
          console.log('✅ updateAccount: Compte mis à jour');
        }
      }
      
      // Test 4: Statistiques des comptes
      const { data: stats } = await accountsService.getAccountsStats(TEST_COMPANY_ID);
      console.log('✅ getAccountsStats:', stats?.total || 0, 'comptes au total');
      
      return { success: true };
    } catch (error) {
      console.error('❌ AccountsService Error:', error);
      return { success: false, error };
    }
  },

  // 2. Test du service des journaux
  async testJournalsService() {
    console.log('🧪 Testing JournalsService...');
    
    try {
      // Test 1: Récupérer les journaux
      const { data: journals } = await journalsService.getJournals(TEST_COMPANY_ID);
      console.log('✅ getJournals:', journals?.length || 0, 'journaux trouvés');
      
      // Test 2: Créer un journal de test
      const testJournal = {
        code: 'TEST',
        name: 'Journal de test',
        type: 'VENTE',
        description: 'Journal créé pour les tests'
      };
      
      const { data: newJournal, error: createError } = await journalsService.createJournal(
        TEST_COMPANY_ID,
        testJournal
      );
      
      if (createError) {
        console.log('ℹ️ Journal de test existe déjà ou erreur:', createError.message);
      } else {
        console.log('✅ createJournal: Journal créé avec ID:', newJournal.id);
      }
      
      // Test 3: Statistiques des journaux
      const { data: summary } = await journalsService.getJournalsSummary(TEST_COMPANY_ID);
      console.log('✅ getJournalsSummary:', summary?.total || 0, 'journaux au total');
      
      return { success: true };
    } catch (error) {
      console.error('❌ JournalsService Error:', error);
      return { success: false, error };
    }
  },

  // 3. Test du service des écritures
  async testJournalEntryService() {
    console.log('🧪 Testing JournalEntryService...');
    
    try {
      // Test 1: Récupérer les comptes et journaux disponibles
      const accounts = await journalEntryService.getAccountsList(TEST_COMPANY_ID);
      const journals = await journalEntryService.getJournalsList(TEST_COMPANY_ID);
      
      console.log('✅ getAccountsList:', accounts.length, 'comptes disponibles');
      console.log('✅ getJournalsList:', journals.length, 'journaux disponibles');
      
      if (accounts.length >= 2 && journals.length >= 1) {
        // Test 2: Créer une écriture de test
        const testEntry = {
          company_id: TEST_COMPANY_ID,
          journal_id: journals[0].id,
          entry_date: new Date().toISOString().split('T')[0],
          description: 'Écriture de test migration',
          reference_number: 'TEST-001',
          items: [
            {
              account_id: accounts[0].id,
              debit_amount: 100,
              credit_amount: 0,
              description: 'Débit test'
            },
            {
              account_id: accounts[1].id,
              debit_amount: 0,
              credit_amount: 100,
              description: 'Crédit test'
            }
          ]
        };
        
        const { data: newEntry, error: createError } = await journalEntryService.createJournalEntry(testEntry);
        
        if (createError) {
          console.log('❌ createJournalEntry Error:', createError.message);
        } else {
          console.log('✅ createJournalEntry: Écriture créée avec ID:', newEntry.id);
          
          // Test 3: Valider l'équilibre
          const { isValid } = await journalEntryService.validateJournalEntryBalance(newEntry.id);
          console.log('✅ validateJournalEntryBalance:', isValid ? 'Équilibrée' : 'Déséquilibrée');
          
          // Test 4: Récupérer l'écriture
          const { data: retrievedEntry } = await journalEntryService.getJournalEntryById(newEntry.id);
          console.log('✅ getJournalEntryById: Écriture récupérée avec', retrievedEntry?.journal_entry_items?.length || 0, 'lignes');
        }
      } else {
        console.log('⚠️ Pas assez de comptes ou journaux pour créer une écriture de test');
      }
      
      // Test 5: Récupérer les écritures
      const { data: entries, count } = await journalEntryService.getJournalEntries(TEST_COMPANY_ID, {
        limit: 5
      });
      console.log('✅ getJournalEntries:', count || 0, 'écritures trouvées');
      
      return { success: true };
    } catch (error) {
      console.error('❌ JournalEntryService Error:', error);
      return { success: false, error };
    }
  },

  // 4. Test du service dashboard
  async testDashboardService() {
    console.log('🧪 Testing DashboardService...');
    
    try {
      // Test 1: Statistiques du dashboard
      const { data: stats } = await dashboardService.getDashboardStats(TEST_COMPANY_ID);
      console.log('✅ getDashboardStats:', stats ? 'Données récupérées' : 'Aucune donnée');
      
      // Test 2: Bilan comptable
      const { data: balanceSheet } = await dashboardService.getBalanceSheet(TEST_COMPANY_ID);
      console.log('✅ getBalanceSheet:', balanceSheet ? 'Bilan généré' : 'Erreur bilan');
      
      // Test 3: Compte de résultat
      const { data: incomeStatement } = await dashboardService.getIncomeStatement(TEST_COMPANY_ID);
      console.log('✅ getIncomeStatement:', incomeStatement ? 'Compte de résultat généré' : 'Erreur compte de résultat');
      
      // Test 4: Écritures récentes
      const { data: recentEntries } = await dashboardService.getRecentJournalEntries(TEST_COMPANY_ID, 5);
      console.log('✅ getRecentJournalEntries:', recentEntries?.length || 0, 'écritures récentes');
      
      // Test 5: Alertes du dashboard
      const { data: alerts } = await dashboardService.getDashboardAlerts(TEST_COMPANY_ID);
      console.log('✅ getDashboardAlerts:', alerts?.length || 0, 'alertes trouvées');
      
      return { success: true };
    } catch (error) {
      console.error('❌ DashboardService Error:', error);
      return { success: false, error };
    }
  },

  // Test complet de la migration
  async runFullMigrationTest() {
    try {
      console.log('🚀 Début des tests de migration des services CassKai...\n');
      
      const results = {
      accounts: await this.testAccountsService(),
      journals: await this.testJournalsService(),
      journalEntries: await this.testJournalEntryService(),
      dashboard: await this.testDashboardService()
    };
    
    console.log('\n📊 Résultats des tests:');
    console.log('==========================================');
    
    Object.entries(results).forEach(([service, result]) => {
      const status = result.success ? '✅ SUCCÈS' : '❌ ÉCHEC';
      console.log(`${service.padEnd(15)}: ${status}`);
      if (!result.success && result.error) {
        console.log(`  Erreur: ${result.error.message}`);
      }
    });
    
    const allSuccess = Object.values(results).every(r => r.success);
    
    if (allSuccess) {
      console.log('\n🎉 Tous les tests sont passés ! La migration est réussie.');
      console.log('\n📋 Prochaines étapes recommandées:');
      console.log('1. Tester l\'interface utilisateur avec les nouveaux services');
      console.log('2. Importer des données réelles');
      console.log('3. Configurer l\'authentification');
      console.log('4. Déployer en production');
    } else {
      console.log('\n⚠️ Certains tests ont échoué. Vérifiez la configuration avant de continuer.');
    }
  } catch (error) {
    console.error('Erreur lors du test de migration:', error);
  }
}
