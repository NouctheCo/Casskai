#!/usr/bin/env node

/**
 * Script pour corriger les imports du logger mal insérés
 * Répare les cas où l'import logger a été inséré à l'intérieur d'un autre import
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, '..', 'src');
const DRY_RUN = process.argv.includes('--dry-run');

let filesFixed = 0;

/**
 * Corrige les imports dans un fichier
 */
function fixImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Pattern pour détecter l'import logger mal placé
    // Cherche les cas où "import { logger }" apparaît après "import {" sans fermeture
    const brokenPattern = /^(import\s+{[^}]*)\nimport\s+{\s*logger\s*}\s+from\s+['"]@\/utils\/logger['"];?\n/gm;

    if (!brokenPattern.test(content)) {
      return;
    }

    // Reset regex
    brokenPattern.lastIndex = 0;

    let newContent = content;
    let hasChanges = false;

    // Extraire tous les imports logger mal placés
    const loggerImportPattern = /^import\s+{\s*logger\s*}\s+from\s+['"]@\/utils\/logger['"];?\n/gm;

    // Supprimer tous les imports logger (on les réinsérera correctement)
    newContent = newContent.replace(loggerImportPattern, '');

    // Vérifier s'il y avait des imports logger
    if (content.includes("from '@/utils/logger'")) {
      hasChanges = true;

      // Trouver la position après le dernier import React/externe
      const lines = newContent.split('\n');
      let lastImportIndex = -1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('import ')) {
          lastImportIndex = i;
        } else if (lastImportIndex >= 0 && line && !line.startsWith('import')) {
          // Fin des imports
          break;
        }
      }

      // Insérer l'import logger au bon endroit
      if (lastImportIndex >= 0) {
        // Vérifier si logger n'est pas déjà là
        const hasValidLoggerImport = lines.some(line =>
          line.trim().startsWith("import { logger }") &&
          line.includes("from '@/utils/logger'")
        );

        if (!hasValidLoggerImport) {
          lines.splice(lastImportIndex + 1, 0, "import { logger } from '@/utils/logger';");
        }
      } else {
        // Pas d'import trouvé, ajouter au début
        lines.unshift("import { logger } from '@/utils/logger';");
      }

      newContent = lines.join('\n');
    }

    if (hasChanges && newContent !== content) {
      if (!DRY_RUN) {
        fs.writeFileSync(filePath, newContent, 'utf8');
      }
      filesFixed++;
      console.log(`✓ Fixed: ${path.relative(SRC_DIR, filePath)}`);
    }

  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
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
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      fixImports(filePath);
    }
  }
}

/**
 * Fonction principale
 */
function main() {
  console.log('\n🔧 Correction des imports logger mal placés\n');

  if (DRY_RUN) {
    console.log('⚠️  Mode DRY-RUN - Aucun fichier ne sera modifié\n');
  }

  walkDirectory(SRC_DIR);

  console.log(`\n✅ ${filesFixed} fichier(s) corrigé(s)\n`);

  if (DRY_RUN && filesFixed > 0) {
    console.log('💡 Pour appliquer les corrections, exécutez sans --dry-run\n');
  }
}

main();
