#!/usr/bin/env node

/**
 * Script pour remplacer tous les console.log/warn/error par le logger standard
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SRC_DIR = path.join(__dirname, '..', 'src');
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

// Statistiques
const stats = {
  filesProcessed: 0,
  filesModified: 0,
  replacements: {
    'console.log': 0,
    'console.warn': 0,
    'console.error': 0,
    'console.info': 0,
    'console.debug': 0,
  },
};

/**
 * Vérifie si le fichier doit être traité
 */
function shouldProcessFile(filePath) {
  // Ignorer les fichiers de test
  if (filePath.includes('.test.') || filePath.includes('.spec.')) {
    return false;
  }

  // Ignorer node_modules
  if (filePath.includes('node_modules')) {
    return false;
  }

  // Traiter uniquement .ts et .tsx
  return filePath.endsWith('.ts') || filePath.endsWith('.tsx');
}

/**
 * Vérifie si le fichier importe déjà le logger
 */
function hasLoggerImport(content) {
  return content.includes("from '@/utils/logger'") ||
         content.includes("from '../utils/logger'") ||
         content.includes("from './utils/logger'") ||
         content.includes('from "@/utils/logger"') ||
         content.includes('from "../utils/logger"') ||
         content.includes('from "./utils/logger"');
}

/**
 * Ajoute l'import du logger si nécessaire
 */
function addLoggerImport(content) {
  // Si le fichier a déjà l'import, ne rien faire
  if (hasLoggerImport(content)) {
    return content;
  }

  // Chercher la dernière ligne d'import
  const lines = content.split('\n');
  let lastImportIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('import ') && !line.includes('import type')) {
      lastImportIndex = i;
    } else if (lastImportIndex >= 0 && line && !line.startsWith('import')) {
      // On a trouvé la fin des imports
      break;
    }
  }

  // Insérer l'import après le dernier import
  if (lastImportIndex >= 0) {
    lines.splice(lastImportIndex + 1, 0, "import { logger } from '@/utils/logger';");
  } else {
    // Pas d'import trouvé, ajouter au début
    lines.unshift("import { logger } from '@/utils/logger';");
  }

  return lines.join('\n');
}

/**
 * Remplace les console.log par logger.info/debug/warn/error
 */
function replaceConsoleCalls(content, filePath) {
  let modified = false;
  let newContent = content;

  // Map des remplacements
  const replacements = [
    {
      pattern: /console\.error\((.*?)\);?/g,
      replacement: 'logger.error($1);',
      type: 'console.error',
    },
    {
      pattern: /console\.warn\((.*?)\);?/g,
      replacement: 'logger.warn($1);',
      type: 'console.warn',
    },
    {
      pattern: /console\.info\((.*?)\);?/g,
      replacement: 'logger.info($1);',
      type: 'console.info',
    },
    {
      pattern: /console\.debug\((.*?)\);?/g,
      replacement: 'logger.debug($1);',
      type: 'console.debug',
    },
    {
      pattern: /console\.log\((.*?)\);?/g,
      replacement: 'logger.info($1);',
      type: 'console.log',
    },
  ];

  // Appliquer chaque remplacement
  for (const { pattern, replacement, type } of replacements) {
    const matches = newContent.match(pattern);
    if (matches) {
      const count = matches.length;
      newContent = newContent.replace(pattern, replacement);
      stats.replacements[type] += count;
      modified = true;

      if (VERBOSE) {
        console.log(`  ✓ Remplacé ${count} ${type} dans ${path.relative(SRC_DIR, filePath)}`);
      }
    }
  }

  return { content: newContent, modified };
}

/**
 * Traite un fichier
 */
function processFile(filePath) {
  stats.filesProcessed++;

  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Vérifier s'il y a des console.log/warn/error
    if (!content.includes('console.log') &&
        !content.includes('console.warn') &&
        !content.includes('console.error') &&
        !content.includes('console.info') &&
        !content.includes('console.debug')) {
      return;
    }

    // Remplacer les console.* par logger.*
    const { content: replacedContent, modified } = replaceConsoleCalls(content, filePath);

    if (!modified) {
      return;
    }

    // Ajouter l'import du logger
    const finalContent = addLoggerImport(replacedContent);

    // Écrire le fichier si pas en mode dry-run
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, finalContent, 'utf8');
    }

    stats.filesModified++;

    if (!VERBOSE) {
      console.log(`✓ Modifié: ${path.relative(SRC_DIR, filePath)}`);
    }
  } catch (error) {
    console.error(`❌ Erreur lors du traitement de ${filePath}:`, error.message);
  }
}

/**
 * Parcourt récursivement un répertoire
 */
function walkDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDirectory(filePath);
    } else if (shouldProcessFile(filePath)) {
      processFile(filePath);
    }
  }
}

/**
 * Fonction principale
 */
function main() {
  console.log('\n🔍 Remplacement des console.* par logger.*\n');

  if (DRY_RUN) {
    console.log('⚠️  Mode DRY-RUN - Aucun fichier ne sera modifié\n');
  }

  // Parcourir le répertoire src/
  walkDirectory(SRC_DIR);

  // Afficher les statistiques
  console.log('\n📊 Statistiques:\n');
  console.log(`  Fichiers traités:  ${stats.filesProcessed}`);
  console.log(`  Fichiers modifiés: ${stats.filesModified}`);
  console.log('\n  Remplacements:');
  Object.entries(stats.replacements).forEach(([type, count]) => {
    if (count > 0) {
      console.log(`    ${type.padEnd(20)}: ${count}`);
    }
  });

  const total = Object.values(stats.replacements).reduce((a, b) => a + b, 0);
  console.log(`\n  Total:               ${total}\n`);

  if (DRY_RUN) {
    console.log('💡 Pour appliquer les changements, exécutez sans --dry-run\n');
  } else {
    console.log('✅ Terminé!\n');
  }
}

// Exécution
main();
