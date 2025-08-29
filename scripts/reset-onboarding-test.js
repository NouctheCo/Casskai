#!/usr/bin/env node

/**
 * Script maître de réinitialisation pour tests d'onboarding CassKai
 * 
 * Ce script orchestre un nettoyage complet de l'environnement de test
 * pour permettre un nouveau test d'onboarding depuis un état propre.
 * 
 * Usage: node scripts/reset-onboarding-test.js [options]
 * 
 * Options:
 * --dry-run     : Simule les actions sans les exécuter
 * --skip-db     : Ignore le nettoyage de la base de données
 * --skip-files  : Ignore le nettoyage des fichiers locaux
 * --user-email=x: Nettoie seulement un utilisateur spécifique
 * --quiet       : Mode silencieux (moins de sortie)
 * --force       : Force l'exécution sans confirmation
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class OnboardingTestResetter {
  constructor() {
    this.parseArguments();
    this.startTime = new Date();
    this.results = {
      steps: [],
      errors: [],
      warnings: []
    };
  }

  parseArguments() {
    this.options = {
      dryRun: process.argv.includes('--dry-run'),
      skipDb: process.argv.includes('--skip-db'),
      skipFiles: process.argv.includes('--skip-files'),
      quiet: process.argv.includes('--quiet'),
      force: process.argv.includes('--force'),
      userEmail: this.extractArgument('--user-email')
    };
  }

  extractArgument(prefix) {
    const arg = process.argv.find(arg => arg.startsWith(`${prefix}=`));
    return arg ? arg.split('=')[1] : null;
  }

  log(message, type = 'info') {
    if (this.options.quiet && type === 'info') return;
    
    const timestamp = new Date().toISOString().substr(11, 8);
    const prefix = type === 'error' ? '❌' : 
                  type === 'warning' ? '⚠️ ' : 
                  type === 'success' ? '✅' : 'ℹ️ ';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async confirmReset() {
    if (this.options.force || this.options.dryRun) return true;
    
    console.log('\n🔄 RÉINITIALISATION COMPLÈTE DES TESTS D\'ONBOARDING');
    console.log('='.repeat(55));
    console.log('Cette opération va:');
    console.log('• Supprimer toutes les données de test de la base');
    console.log('• Nettoyer les fichiers d\'authentification locaux');
    console.log('• Effacer les caches navigateur (instructions)');
    console.log('• Réinitialiser l\'état de l\'application\n');
    
    if (this.options.userEmail) {
      console.log(`🎯 Nettoyage ciblé pour: ${this.options.userEmail}`);
    } else {
      console.log('🌐 Nettoyage global de toutes les données de test');
    }
    
    const { createInterface } = await import('readline');
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      rl.question('\nConfirmez-vous cette opération ? (y/N): ', (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  async runScript(scriptPath, args = []) {
    return new Promise((resolve) => {
      const fullPath = join(__dirname, scriptPath);
      
      if (!existsSync(fullPath)) {
        this.log(`Script non trouvé: ${fullPath}`, 'error');
        resolve({ success: false, error: 'Script non trouvé' });
        return;
      }

      const child = spawn('node', [fullPath, ...args], {
        stdio: this.options.quiet ? 'pipe' : 'inherit',
        env: { ...process.env }
      });

      let output = '';
      let errorOutput = '';

      if (this.options.quiet) {
        child.stdout?.on('data', (data) => {
          output += data.toString();
        });
        
        child.stderr?.on('data', (data) => {
          errorOutput += data.toString();
        });
      }

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output });
        } else {
          resolve({ 
            success: false, 
            error: `Script exited with code ${code}`,
            output: errorOutput || output 
          });
        }
      });

      child.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });
    });
  }

  async checkPrerequisites() {
    this.log('Vérification des prérequis...');
    
    // Vérifier Node.js
    try {
      const { stdout } = await execAsync('node --version');
      const nodeVersion = stdout.trim();
      this.log(`Node.js version: ${nodeVersion}`);
    } catch {
      this.log('Node.js non trouvé', 'error');
      return false;
    }

    // Vérifier les variables d'environnement
    const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      this.log(`Variables d'environnement manquantes: ${missingVars.join(', ')}`, 'error');
      return false;
    }

    // Vérifier les scripts nécessaires
    const requiredScripts = [
      'cleanup-test-data.js',
      'cleanup-browser-data.js', 
      'validate-clean-state.js'
    ];
    
    for (const script of requiredScripts) {
      const scriptPath = join(__dirname, script);
      if (!existsSync(scriptPath)) {
        this.log(`Script manquant: ${script}`, 'error');
        return false;
      }
    }

    this.log('Prérequis vérifiés avec succès', 'success');
    return true;
  }

  async cleanupDatabase() {
    if (this.options.skipDb) {
      this.log('Nettoyage base de données ignoré (--skip-db)');
      return { success: true };
    }

    this.log('🗄️  Nettoyage de la base de données...');
    
    const args = [];
    if (this.options.dryRun) args.push('--dry-run');
    if (this.options.userEmail) args.push(`--user-email=${this.options.userEmail}`);
    args.push('--confirm'); // Auto-confirm pour l'orchestration

    const result = await this.runScript('cleanup-test-data.js', args);
    
    if (result.success) {
      this.log('Base de données nettoyée', 'success');
      this.results.steps.push({ step: 'Database cleanup', success: true });
    } else {
      this.log(`Erreur nettoyage BDD: ${result.error}`, 'error');
      this.results.errors.push(`Database cleanup: ${result.error}`);
    }

    return result;
  }

  async cleanupLocalFiles() {
    if (this.options.skipFiles) {
      this.log('Nettoyage fichiers locaux ignoré (--skip-files)');
      return { success: true };
    }

    this.log('📁 Nettoyage des fichiers locaux...');
    
    const filesToClean = [
      '.auth/user.json',
      '.auth/session.json'
    ];

    let cleanedCount = 0;
    let errors = 0;

    for (const file of filesToClean) {
      try {
        const filePath = join(process.cwd(), file);
        
        if (existsSync(filePath)) {
          if (!this.options.dryRun) {
            unlinkSync(filePath);
          }
          this.log(`Supprimé: ${file}`);
          cleanedCount++;
        }
      } catch (error) {
        this.log(`Erreur suppression ${file}: ${error.message}`, 'error');
        errors++;
      }
    }

    const result = { success: errors === 0, cleanedCount, errors };
    
    if (result.success) {
      this.log(`${cleanedCount} fichiers nettoyés`, 'success');
      this.results.steps.push({ step: 'Local files cleanup', success: true });
    } else {
      this.log(`${errors} erreurs lors du nettoyage des fichiers`, 'error');
      this.results.errors.push(`Local files cleanup: ${errors} errors`);
    }

    return result;
  }

  async showBrowserCleanupInstructions() {
    this.log('🌐 Génération des instructions navigateur...');
    
    const result = await this.runScript('cleanup-browser-data.js');
    
    if (result.success) {
      this.log('Instructions navigateur générées', 'success');
      console.log('\n📱 NETTOYAGE NAVIGATEUR REQUIS:');
      console.log('Un fichier HTML interactif a été généré:');
      console.log(`file://${join(__dirname, 'cleanup-browser.html')}`);
      console.log('\nOu exécutez manuellement dans la console navigateur:');
      console.log('Object.keys(localStorage).filter(k => k.startsWith("casskai_")).forEach(k => localStorage.removeItem(k));');
    } else {
      this.log(`Erreur génération instructions: ${result.error}`, 'warning');
    }
  }

  async validateCleanState() {
    this.log('🔍 Validation de l\'état propre...');
    
    const result = await this.runScript('validate-clean-state.js');
    
    if (result.success) {
      this.log('Validation terminée - Consultez les résultats ci-dessus', 'success');
      this.results.steps.push({ step: 'State validation', success: true });
    } else {
      this.log(`Erreur validation: ${result.error}`, 'warning');
      this.results.warnings.push(`State validation: ${result.error}`);
    }

    return result;
  }

  async createResetReport() {
    const endTime = new Date();
    const duration = Math.round((endTime - this.startTime) / 1000);
    
    const report = {
      timestamp: endTime.toISOString(),
      duration: `${duration}s`,
      options: this.options,
      results: this.results,
      success: this.results.errors.length === 0
    };

    const reportPath = join(__dirname, `reset-report-${endTime.toISOString().replace(/[:.]/g, '-')}.json`);
    
    try {
      const fs = await import('fs/promises');
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      this.log(`Rapport généré: ${reportPath}`);
    } catch (error) {
      this.log(`Erreur génération rapport: ${error.message}`, 'warning');
    }

    return report;
  }

  async runReset() {
    console.log('🚀 RÉINITIALISATION TESTS D\'ONBOARDING CASSKAI');
    console.log('='.repeat(50));
    
    if (this.options.dryRun) {
      console.log('🧪 MODE DRY-RUN: Simulation sans modifications\n');
    }

    // 1. Vérification des prérequis
    const prereqsOK = await this.checkPrerequisites();
    if (!prereqsOK) {
      this.log('Prérequis non satisfaits - Arrêt', 'error');
      process.exit(1);
    }

    // 2. Demande de confirmation
    const confirmed = await this.confirmReset();
    if (!confirmed) {
      this.log('Opération annulée par l\'utilisateur');
      process.exit(0);
    }

    console.log('\n🧹 DÉBUT DE LA RÉINITIALISATION');
    console.log('='.repeat(32));

    // 3. Nettoyage de la base de données
    await this.cleanupDatabase();

    // 4. Nettoyage des fichiers locaux
    await this.cleanupLocalFiles();

    // 5. Instructions navigateur
    await this.showBrowserCleanupInstructions();

    // 6. Validation de l'état final
    console.log('\n🔍 VALIDATION FINALE');
    console.log('='.repeat(20));
    await this.validateCleanState();

    // 7. Génération du rapport
    const report = await this.createResetReport();

    // 8. Résumé final
    console.log('\n📊 RÉSUMÉ DE LA RÉINITIALISATION');
    console.log('='.repeat(35));
    
    const successCount = this.results.steps.filter(step => step.success).length;
    const totalSteps = this.results.steps.length;
    
    console.log(`Étapes réussies: ${successCount}/${totalSteps}`);
    console.log(`Erreurs: ${this.results.errors.length}`);
    console.log(`Avertissements: ${this.results.warnings.length}`);
    console.log(`Durée: ${report.duration}`);

    if (report.success) {
      console.log('\n✅ RÉINITIALISATION RÉUSSIE !');
      console.log('\n🎯 PROCHAINES ÉTAPES:');
      console.log('1. Nettoyer le cache navigateur (voir instructions ci-dessus)');
      console.log('2. Redémarrer le serveur de développement (npm run dev)');
      console.log('3. Ouvrir l\'application dans un nouvel onglet');
      console.log('4. Vérifier l\'accès à la page d\'accueil/connexion');
      console.log('5. Commencer un nouveau test d\'onboarding complet');
    } else {
      console.log('\n⚠️  RÉINITIALISATION PARTIELLE');
      console.log('Certaines étapes ont échoué. Consultez les erreurs ci-dessus.');
      console.log('Vous pouvez réexécuter le script ou corriger manuellement.');
    }

    console.log('\n📝 Rapport détaillé: Non généré');
    
    if (this.options.dryRun) {
      console.log('\n🧪 Ceci était une simulation. Relancez sans --dry-run pour appliquer les changements.');
    }

    return report.success;
  }
}

// Fonction utilitaire pour afficher l'aide
function showHelp() {
  console.log(`
🔄 Script de Réinitialisation des Tests d'Onboarding CassKai

USAGE:
  node scripts/reset-onboarding-test.js [options]

OPTIONS:
  --dry-run           Simulation sans modification
  --skip-db           Ignore le nettoyage de la base
  --skip-files        Ignore le nettoyage des fichiers locaux
  --user-email=email  Nettoie seulement un utilisateur spécifique
  --quiet             Mode silencieux (moins de sortie)
  --force             Force l'exécution sans confirmation
  --help              Affiche cette aide

EXEMPLES:
  # Réinitialisation complète avec confirmation
  node scripts/reset-onboarding-test.js

  # Simulation pour voir ce qui serait fait
  node scripts/reset-onboarding-test.js --dry-run

  # Nettoyage d'un utilisateur spécifique
  node scripts/reset-onboarding-test.js --user-email=test@example.com

  # Nettoyage automatique sans confirmation
  node scripts/reset-onboarding-test.js --force --quiet

PRÉREQUIS:
  - Variables d'environnement: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
  - Scripts présents: cleanup-test-data.js, cleanup-browser-data.js, validate-clean-state.js
  - Connexion active à Supabase

⚠️  ATTENTION:
  Ce script supprime définitivement les données de test.
  Utilisez uniquement dans un environnement de développement.
`);
}

// Point d'entrée
async function main() {
  if (process.argv.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  try {
    const resetter = new OnboardingTestResetter();
    const success = await resetter.runReset();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécution si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default OnboardingTestResetter;