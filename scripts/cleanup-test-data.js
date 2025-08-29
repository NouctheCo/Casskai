#!/usr/bin/env node

/**
 * Script de nettoyage des données de test pour CassKai
 * 
 * Ce script nettoie toutes les données de test liées à l'onboarding et aux entreprises
 * pour permettre de repartir sur un environnement propre lors des tests d'onboarding complets.
 * 
 * Usage: node scripts/cleanup-test-data.js [--dry-run] [--user-email=email@test.com]
 * 
 * Options:
 * --dry-run : Affiche les actions qui seraient effectuées sans les exécuter
 * --user-email : Nettoie uniquement les données d'un utilisateur spécifique
 * --confirm : Confirme automatiquement le nettoyage (non-interactif)
 * 
 * Variables d'environnement requises:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_SERVICE_ROLE_KEY (clé service role pour les opérations admin)
 */

import { createClient } from '@supabase/supabase-js';
import { createInterface } from 'readline';

// Configuration
const CONFIG = {
  // Patterns pour identifier les données de test
  TEST_PATTERNS: {
    enterprises: [
      'Test %',
      '%Test%', 
      'Entreprise de test%',
      'Demo %',
      '%Demo%'
    ],
    users: [
      '%@test.com',
      '%@test.example',
      '%@demo.com',
      '%+test@%'
    ],
    sirets: [
      '12345678901234', // SIRET de test par défaut
      '00000000000000',
      '11111111111111'
    ]
  },
  
  // Tables à nettoyer dans l'ordre (respect des contraintes FK)
  CLEANUP_ORDER: [
    'journal_entry_items',
    'journal_entries', 
    'accounts',
    'journals',
    'invoices',
    'invoice_items',
    'purchases',
    'purchase_items',
    'contracts',
    'subscriptions',
    'user_companies',
    'enterprises',
    'user_profiles'
  ],
  
  // Tables à préserver (données système)
  PROTECTED_TABLES: [
    'auth.users',
    'auth.sessions',
    'auth.refresh_tokens'
  ]
};

class TestDataCleaner {
  constructor() {
    this.supabaseUrl = process.env.VITE_SUPABASE_URL;
    this.serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    this.isDryRun = process.argv.includes('--dry-run');
    this.userEmail = this.parseUserEmail();
    this.isConfirmed = process.argv.includes('--confirm');
    
    if (!this.supabaseUrl || !this.serviceRoleKey) {
      console.error('❌ Variables d\'environnement manquantes:');
      console.error('   - VITE_SUPABASE_URL');
      console.error('   - VITE_SUPABASE_SERVICE_ROLE_KEY');
      process.exit(1);
    }
    
    this.supabase = createClient(this.supabaseUrl, this.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  parseUserEmail() {
    const emailArg = process.argv.find(arg => arg.startsWith('--user-email='));
    return emailArg ? emailArg.split('=')[1] : null;
  }

  /**
   * Affiche un résumé des actions à effectuer
   */
  async showCleanupPreview() {
    console.log('\n🔍 ANALYSE DES DONNÉES DE TEST\n');
    console.log('='.repeat(50));
    
    let totalToDelete = 0;
    const summary = {};
    
    for (const table of CONFIG.CLEANUP_ORDER) {
      try {
        const count = await this.getTestDataCount(table);
        if (count > 0) {
          summary[table] = count;
          totalToDelete += count;
          console.log(`📊 ${table.padEnd(25)}: ${count} enregistrements`);
        }
      } catch (error) {
        console.warn(`⚠️  Erreur lors du comptage de ${table}:`, error.message);
      }
    }
    
    console.log('='.repeat(50));
    console.log(`📈 TOTAL À SUPPRIMER: ${totalToDelete} enregistrements`);
    
    if (this.userEmail) {
      console.log(`👤 Utilisateur ciblé: ${this.userEmail}`);
    } else {
      console.log('🌐 Nettoyage global de toutes les données de test');
    }
    
    if (this.isDryRun) {
      console.log('\n🧪 MODE DRY-RUN: Aucune modification ne sera effectuée\n');
    }
    
    return { summary, totalToDelete };
  }

  /**
   * Compte les données de test dans une table
   */
  async getTestDataCount(tableName) {
    let query = this.supabase.from(tableName).select('*', { count: 'exact', head: true });
    
    // Application des filtres selon le type de table
    query = this.applyTestDataFilters(query, tableName);
    
    const { count, error } = await query;
    
    if (error) {
      console.warn(`⚠️  Erreur lors du comptage de ${tableName}:`, error.message);
      return 0;
    }
    
    return count || 0;
  }

  /**
   * Applique les filtres pour identifier les données de test
   */
  applyTestDataFilters(query, tableName) {
    if (this.userEmail) {
      // Nettoyage ciblé pour un utilisateur spécifique
      switch (tableName) {
        case 'user_profiles':
          return query.eq('email', this.userEmail);
        case 'enterprises':
        case 'user_companies':
          // Nécessite une jointure - géré différemment
          return query;
        default:
          return query;
      }
    } else {
      // Nettoyage global basé sur les patterns
      switch (tableName) {
        case 'enterprises': {
          let enterpriseQuery = query;
          CONFIG.TEST_PATTERNS.enterprises.forEach(pattern => {
            enterpriseQuery = enterpriseQuery.or(`name.like.${pattern}`);
          });
          CONFIG.TEST_PATTERNS.sirets.forEach(siret => {
            enterpriseQuery = enterpriseQuery.or(`siret.eq.${siret}`);
          });
          return enterpriseQuery;
        }
          
        case 'user_profiles': {
          let userQuery = query;
          CONFIG.TEST_PATTERNS.users.forEach(pattern => {
            userQuery = userQuery.or(`email.like.${pattern}`);
          });
          return userQuery;
        }
          
        default:
          return query;
      }
    }
  }

  /**
   * Demande confirmation à l'utilisateur
   */
  async askConfirmation() {
    if (this.isConfirmed) return true;
    
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      rl.question('\n❓ Confirmer le nettoyage des données de test ? (y/N): ', (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  /**
   * Nettoie les données de test d'une table spécifique
   */
  async cleanupTable(tableName) {
    try {
      console.log(`🧹 Nettoyage de ${tableName}...`);
      
      if (this.isDryRun) {
        const count = await this.getTestDataCount(tableName);
        console.log(`   📊 ${count} enregistrements seraient supprimés`);
        return { deleted: 0, simulated: count };
      }
      
      // Construction de la requête de suppression
      let deleteQuery = this.supabase.from(tableName).delete();
      deleteQuery = this.applyTestDataFilters(deleteQuery, tableName);
      
      const { error, count } = await deleteQuery;
      
      if (error) {
        console.error(`   ❌ Erreur lors du nettoyage de ${tableName}:`, error.message);
        return { deleted: 0, error: error.message };
      }
      
      console.log(`   ✅ ${count || 0} enregistrements supprimés`);
      return { deleted: count || 0 };
      
    } catch (error) {
      console.error(`   ❌ Erreur lors du nettoyage de ${tableName}:`, error.message);
      return { deleted: 0, error: error.message };
    }
  }

  /**
   * Nettoie les données d'onboarding en localStorage
   */
  cleanupLocalStorage() {
    console.log('\n🧹 Instructions pour le nettoyage localStorage:');
    console.log('   1. Ouvrir les outils de développement du navigateur (F12)');
    console.log('   2. Aller dans l\'onglet Application/Storage');
    console.log('   3. Sélectionner "Local Storage" pour votre domaine');
    console.log('   4. Supprimer toutes les clés commençant par "casskai_onboarding_"');
    console.log('   5. Supprimer "casskai_config" si nécessaire');
    console.log('\n   Ou exécuter dans la console du navigateur:');
    console.log('   Object.keys(localStorage).filter(k => k.startsWith("casskai_")).forEach(k => localStorage.removeItem(k));');
  }

  /**
   * Nettoie les fichiers de session d'authentification
   */
  async cleanupAuthFiles() {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const authFile = path.resolve('.auth/user.json');
      
      if (fs.existsSync(authFile)) {
        if (!this.isDryRun) {
          fs.unlinkSync(authFile);
          console.log('✅ Fichier d\'authentification supprimé');
        } else {
          console.log('🧪 Fichier d\'authentification serait supprimé');
        }
      } else {
        console.log('ℹ️  Aucun fichier d\'authentification à supprimer');
      }
    } catch (error) {
      console.warn('⚠️  Erreur lors du nettoyage des fichiers auth:', error.message);
    }
  }

  /**
   * Génère un script SQL de nettoyage
   */
  generateCleanupSQL() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sqlFile = `cleanup-test-data-${timestamp}.sql`;
    
    let sql = `-- Script de nettoyage des données de test CassKai
-- Généré le: ${new Date().toISOString()}
-- Usage: Exécuter dans Supabase SQL Editor avec précaution

-- ATTENTION: Ce script supprime définitivement les données de test
-- Vérifiez les conditions WHERE avant d'exécuter

BEGIN;

-- Désactiver temporairement les contraintes FK
SET session_replication_role = replica;

`;

    // Génération des requêtes de suppression
    for (const table of CONFIG.CLEANUP_ORDER.reverse()) {
      sql += `-- Nettoyage de ${table}\n`;
      
      if (this.userEmail) {
        // Nettoyage ciblé
        switch (table) {
          case 'user_profiles':
            sql += `DELETE FROM ${table} WHERE email = '${this.userEmail}';\n`;
            break;
          case 'enterprises':
            sql += `DELETE FROM ${table} WHERE id IN (
              SELECT e.id FROM enterprises e
              JOIN user_companies uc ON e.id = uc.company_id
              JOIN user_profiles up ON uc.user_id = up.user_id
              WHERE up.email = '${this.userEmail}'
            );\n`;
            break;
          default:
            sql += `-- ${table}: Nécessite une logique de jointure spécifique\n`;
        }
      } else {
        // Nettoyage global
        switch (table) {
          case 'enterprises':
            sql += `DELETE FROM ${table} WHERE \n`;
            CONFIG.TEST_PATTERNS.enterprises.forEach((pattern, index) => {
              if (index > 0) sql += '  OR ';
              sql += `name LIKE '${pattern}'\n`;
            });
            CONFIG.TEST_PATTERNS.sirets.forEach(siret => {
              sql += `  OR siret = '${siret}'\n`;
            });
            sql += ';\n';
            break;
            
          case 'user_profiles':
            sql += `DELETE FROM ${table} WHERE \n`;
            CONFIG.TEST_PATTERNS.users.forEach((pattern, index) => {
              if (index > 0) sql += '  OR ';
              sql += `email LIKE '${pattern}'\n`;
            });
            sql += ';\n';
            break;
            
          default:
            sql += `-- ${table}: Données liées supprimées via CASCADE\n`;
        }
      }
      sql += '\n';
    }

    sql += `-- Réactiver les contraintes FK
SET session_replication_role = DEFAULT;

-- Vérification des suppressions
SELECT 
  'enterprises' as table_name,
  count(*) as remaining_count
FROM enterprises 
WHERE name LIKE 'Test %' OR name LIKE '%Test%'

UNION ALL

SELECT 
  'user_profiles' as table_name,
  count(*) as remaining_count
FROM user_profiles 
WHERE email LIKE '%@test.com' OR email LIKE '%@test.example';

COMMIT;
`;

    // Écriture du fichier SQL
    try {
      const fs = require('fs');
      const sqlPath = `scripts/${sqlFile}`;
      
      if (!this.isDryRun) {
        fs.writeFileSync(sqlPath, sql);
        console.log(`📄 Script SQL généré: ${sqlPath}`);
      } else {
        console.log(`🧪 Script SQL serait généré: ${sqlPath}`);
      }
      
      return sqlPath;
    } catch (error) {
      console.warn('⚠️  Erreur lors de la génération du script SQL:', error.message);
      return null;
    }
  }

  /**
   * Exécute le nettoyage complet
   */
  async runCleanup() {
    console.log('🚀 SCRIPT DE NETTOYAGE DES DONNÉES DE TEST CASSKAI');
    console.log('='.repeat(60));
    
    // 1. Affichage du résumé
    const { summary, totalToDelete } = await this.showCleanupPreview();
    
    if (totalToDelete === 0) {
      console.log('\n✅ Aucune donnée de test trouvée à nettoyer.');
      return;
    }
    
    // 2. Demande de confirmation
    if (!this.isDryRun && !(await this.askConfirmation())) {
      console.log('\n❌ Nettoyage annulé par l\'utilisateur.');
      return;
    }
    
    console.log('\n🧹 DÉBUT DU NETTOYAGE');
    console.log('='.repeat(30));
    
    const results = {
      totalDeleted: 0,
      totalErrors: 0,
      tableResults: {}
    };
    
    // 3. Nettoyage des tables
    for (const table of CONFIG.CLEANUP_ORDER) {
      if (summary[table] > 0) {
        const result = await this.cleanupTable(table);
        results.tableResults[table] = result;
        results.totalDeleted += result.deleted || result.simulated || 0;
        if (result.error) results.totalErrors++;
      }
    }
    
    // 4. Nettoyage des fichiers d'authentification
    console.log('\n🔐 Nettoyage des fichiers d\'authentification:');
    await this.cleanupAuthFiles();
    
    // 5. Instructions localStorage
    this.cleanupLocalStorage();
    
    // 6. Génération du script SQL
    console.log('\n📄 Génération du script SQL de sauvegarde:');
    this.generateCleanupSQL();
    
    // 7. Résumé final
    console.log('\n📊 RÉSUMÉ DU NETTOYAGE');
    console.log('='.repeat(25));
    
    if (this.isDryRun) {
      console.log(`🧪 Mode DRY-RUN: ${results.totalDeleted} enregistrements auraient été supprimés`);
    } else {
      console.log(`✅ ${results.totalDeleted} enregistrements supprimés`);
    }
    
    if (results.totalErrors > 0) {
      console.log(`⚠️  ${results.totalErrors} erreurs rencontrées`);
    }
    
    console.log('\n🎯 PROCHAINES ÉTAPES RECOMMANDÉES:');
    console.log('1. Vérifier que les données importantes sont préservées');
    console.log('2. Redémarrer l\'application de développement');
    console.log('3. Effacer le cache du navigateur');
    console.log('4. Tester l\'onboarding complet depuis le début');
    console.log('5. Vérifier que les nouvelles données sont créées correctement');
    
    if (!this.isDryRun) {
      console.log('\n✅ Nettoyage terminé avec succès !');
      console.log('   L\'environnement est maintenant propre pour un nouveau test d\'onboarding.');
    }
  }
}

// Point d'entrée du script
async function main() {
  try {
    const cleaner = new TestDataCleaner();
    await cleaner.runCleanup();
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

// Exécution uniquement si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default TestDataCleaner;