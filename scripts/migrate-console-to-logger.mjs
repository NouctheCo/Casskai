#!/usr/bin/env node
/**
 * Script de migration: console.* → logger.*
 *
 * Parcourt tous les fichiers .ts et .tsx dans src/ et remplace :
 * - console.error → logger.error
 * - console.warn → logger.warn
 * - console.log → logger.debug (ou SUPPRIME si commentaire temporaire)
 * - console.info → logger.info
 * - console.debug → logger.debug
 *
 * Usage:
 *   node scripts/migrate-console-to-logger.mjs [--dry-run] [--aggressive]
 *
 * Options:
 *   --dry-run: Affiche les changements sans modifier les fichiers
 *   --aggressive: Supprime les console.log de debug temporaire au lieu de les convertir
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const ROOT_DIR = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const DRY_RUN = process.argv.includes('--dry-run');
const AGGRESSIVE = process.argv.includes('--aggressive');

// Statistiques
const stats = {
  filesProcessed: 0,
  filesModified: 0,
  replacements: {
    'console.error': 0,
    'console.warn': 0,
    'console.log': 0,
    'console.info': 0,
    'console.debug': 0,
    'console.table': 0,
    'console.group': 0,
    'console.groupEnd': 0,
    'removed': 0,
  },
  errors: [],
};

/**
 * Extrait le contexte du nom de fichier
 * Ex: "AuthContext.tsx" → "Auth"
 *     "invoicingService.ts" → "Invoicing"
 *     "ThirdPartiesPage.tsx" → "ThirdParties"
 */
function extractContext(filename) {
  const basename = path.basename(filename, path.extname(filename));

  // Remove common suffixes
  const cleaned = basename
    .replace(/Service$/, '')
    .replace(/Context$/, '')
    .replace(/Page$/, '')
    .replace(/Component$/, '')
    .replace(/Hook$/, '')
    .replace(/Utils?$/, '')
    .replace(/Helper$/, '')
    .replace(/Provider$/, '');

  // Capitalize first letter
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Détecte si un console.log est du debug temporaire
 * Critères:
 * - Contient uniquement une variable (ex: console.log(data))
 * - Contient "TODO", "FIXME", "DEBUG", "TEST"
 * - Valeurs primitives simples (ex: console.log('here'))
 */
function isTemporaryDebug(line) {
  const trimmed = line.trim();

  // Check for debug markers
  if (/console\.log\(.*(?:TODO|FIXME|DEBUG|TEST|XXX|TEMP)/i.test(trimmed)) {
    return true;
  }

  // Check for simple value logging (single variable or string)
  if (/console\.log\([a-zA-Z_$][a-zA-Z0-9_$]*\)/.test(trimmed)) {
    return true;
  }

  // Check for simple strings like console.log('here') or console.log("test")
  if (/console\.log\(['"`][^'"`]{0,20}['"`]\)/.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Transforme une ligne console.* en logger.*
 */
function transformLine(line, context, lineNumber, filename) {
  const originalLine = line;
  let modified = false;

  // Patterns de remplacement
  const patterns = [
    {
      regex: /console\.error\((.*?)\)/g,
      replacement: (match, args) => {
        stats.replacements['console.error']++;
        modified = true;

        // Parse arguments
        const parsedArgs = parseConsoleArgs(args);
        if (parsedArgs.message && parsedArgs.data) {
          return `logger.error('${context}', ${parsedArgs.message}, ${parsedArgs.data})`;
        } else if (parsedArgs.message) {
          return `logger.error('${context}', ${parsedArgs.message})`;
        } else {
          return `logger.error('${context}', 'Error occurred', ${args})`;
        }
      }
    },
    {
      regex: /console\.warn\((.*?)\)/g,
      replacement: (match, args) => {
        stats.replacements['console.warn']++;
        modified = true;

        const parsedArgs = parseConsoleArgs(args);
        if (parsedArgs.message && parsedArgs.data) {
          return `logger.warn('${context}', ${parsedArgs.message}, ${parsedArgs.data})`;
        } else if (parsedArgs.message) {
          return `logger.warn('${context}', ${parsedArgs.message})`;
        } else {
          return `logger.warn('${context}', 'Warning', ${args})`;
        }
      }
    },
    {
      regex: /console\.info\((.*?)\)/g,
      replacement: (match, args) => {
        stats.replacements['console.info']++;
        modified = true;

        const parsedArgs = parseConsoleArgs(args);
        if (parsedArgs.message && parsedArgs.data) {
          return `logger.info('${context}', ${parsedArgs.message}, ${parsedArgs.data})`;
        } else if (parsedArgs.message) {
          return `logger.info('${context}', ${parsedArgs.message})`;
        } else {
          return `logger.info('${context}', 'Info', ${args})`;
        }
      }
    },
    {
      regex: /console\.(log|debug)\((.*?)\)/g,
      replacement: (match, method, args) => {
        const isDebug = isTemporaryDebug(line);

        if (AGGRESSIVE && isDebug) {
          // Supprimer la ligne entière
          stats.replacements['removed']++;
          modified = true;
          return ''; // Sera filtré plus tard
        }

        stats.replacements[`console.${method}`]++;
        modified = true;

        const parsedArgs = parseConsoleArgs(args);
        if (parsedArgs.message && parsedArgs.data) {
          return `logger.debug('${context}', ${parsedArgs.message}, ${parsedArgs.data})`;
        } else if (parsedArgs.message) {
          return `logger.debug('${context}', ${parsedArgs.message})`;
        } else {
          return `logger.debug('${context}', 'Debug', ${args})`;
        }
      }
    },
    {
      regex: /console\.table\((.*?)\)/g,
      replacement: (match, args) => {
        stats.replacements['console.table']++;
        modified = true;
        return `logger.debug('${context}', 'Table data', ${args})`;
      }
    },
    {
      regex: /console\.group\((.*?)\)/g,
      replacement: (match, args) => {
        stats.replacements['console.group']++;
        modified = true;
        return `logger.debug('${context}', '=== ' + ${args} + ' ===')`;
      }
    },
    {
      regex: /console\.groupEnd\(\)/g,
      replacement: () => {
        stats.replacements['console.groupEnd']++;
        modified = true;
        return ''; // Remove groupEnd calls
      }
    },
  ];

  let result = line;
  for (const pattern of patterns) {
    result = result.replace(pattern.regex, pattern.replacement);
  }

  // Si la ligne a été vidée (suppression), retourner null
  if (result.trim() === '') {
    return null;
  }

  return modified ? result : line;
}

/**
 * Parse les arguments d'un console.*
 * Essaie de séparer message et data
 */
function parseConsoleArgs(args) {
  args = args.trim();

  // Simple string → message only
  if (/^['"`]/.test(args)) {
    return { message: args, data: null };
  }

  // Try to split by comma (basic heuristic)
  const parts = args.split(',').map(p => p.trim());

  if (parts.length === 1) {
    // Single arg - could be message or data
    if (/^['"`]/.test(parts[0])) {
      return { message: parts[0], data: null };
    } else {
      return { message: null, data: parts[0] };
    }
  } else if (parts.length === 2) {
    // Two args - likely message, data
    return { message: parts[0], data: parts[1] };
  } else {
    // Multiple args - treat first as message, rest as data
    return {
      message: parts[0],
      data: `{ ${parts.slice(1).join(', ')} }`
    };
  }
}

/**
 * Vérifie si le fichier a déjà l'import du logger
 */
function hasLoggerImport(content) {
  return /import\s+.*logger.*from\s+['"]@\/lib\/logger['"]/.test(content) ||
         /import\s+.*logger.*from\s+['"]\.\.?\/.*\/logger['"]/.test(content);
}

/**
 * Ajoute l'import du logger au début du fichier (après les imports existants)
 */
function addLoggerImport(content) {
  // Find the last import statement
  const lines = content.split('\n');
  let lastImportIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/.test(lines[i].trim())) {
      lastImportIndex = i;
    }
  }

  if (lastImportIndex === -1) {
    // No imports found, add at the beginning after any comments
    let insertIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (!/^\s*(\/\/|\/\*|\*)/.test(lines[i])) {
        insertIndex = i;
        break;
      }
    }
    lines.splice(insertIndex, 0, "import { logger } from '@/lib/logger';", '');
  } else {
    // Add after last import
    lines.splice(lastImportIndex + 1, 0, "import { logger } from '@/lib/logger';");
  }

  return lines.join('\n');
}

/**
 * Traite un fichier
 */
function processFile(filepath) {
  stats.filesProcessed++;

  try {
    let content = fs.readFileSync(filepath, 'utf-8');
    const originalContent = content;
    const lines = content.split('\n');
    const context = extractContext(filepath);

    // Check if file has console.* calls
    const hasConsole = /console\.(log|error|warn|info|debug|table|group)/.test(content);

    if (!hasConsole) {
      return; // Skip files without console calls
    }

    // Transform each line
    const transformedLines = [];
    let fileModified = false;

    for (let i = 0; i < lines.length; i++) {
      const originalLine = lines[i];
      const transformedLine = transformLine(originalLine, context, i + 1, filepath);

      if (transformedLine === null) {
        // Line was removed
        fileModified = true;
        continue;
      }

      if (transformedLine !== originalLine) {
        fileModified = true;
      }

      transformedLines.push(transformedLine);
    }

    if (!fileModified) {
      return; // No changes needed
    }

    content = transformedLines.join('\n');

    // Add logger import if needed and not present
    if (!hasLoggerImport(content)) {
      content = addLoggerImport(content);
    }

    // Write file if not dry-run
    if (!DRY_RUN) {
      fs.writeFileSync(filepath, content, 'utf-8');
    }

    stats.filesModified++;

    console.log(`✅ ${filepath.replace(ROOT_DIR, '')}`);

  } catch (error) {
    stats.errors.push({ file: filepath, error: error.message });
    console.error(`❌ ${filepath.replace(ROOT_DIR, '')}: ${error.message}`);
  }
}

/**
 * Parcourt récursivement un dossier
 */
function walkDir(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);

    if (stat.isDirectory()) {
      // Skip node_modules, dist, etc.
      if (['node_modules', 'dist', 'build', '.git'].includes(file)) {
        continue;
      }
      walkDir(filepath);
    } else if (stat.isFile()) {
      // Process .ts and .tsx files
      if (/\.(ts|tsx)$/.test(file)) {
        processFile(filepath);
      }
    }
  }
}

/**
 * Point d'entrée principal
 */
function main() {
  console.log('🔧 Migration console.* → logger.*\n');
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (pas de modifications)' : '✏️  MODIFICATION'}`);
  console.log(`Aggressive: ${AGGRESSIVE ? '✅ Oui (supprime debug temporaires)' : '❌ Non'}\n`);

  console.log('📁 Traitement des fichiers...\n');

  const startTime = Date.now();
  walkDir(SRC_DIR);
  const duration = Date.now() - startTime;

  // Rapport final
  console.log('\n' + '='.repeat(80));
  console.log('📊 RAPPORT DE MIGRATION\n');
  console.log(`⏱️  Durée: ${duration}ms`);
  console.log(`📄 Fichiers traités: ${stats.filesProcessed}`);
  console.log(`✏️  Fichiers modifiés: ${stats.filesModified}`);
  console.log('');
  console.log('🔄 Remplacements:');
  console.log(`   • console.error → logger.error: ${stats.replacements['console.error']}`);
  console.log(`   • console.warn  → logger.warn:  ${stats.replacements['console.warn']}`);
  console.log(`   • console.info  → logger.info:  ${stats.replacements['console.info']}`);
  console.log(`   • console.log   → logger.debug: ${stats.replacements['console.log']}`);
  console.log(`   • console.debug → logger.debug: ${stats.replacements['console.debug']}`);
  console.log(`   • console.table → logger.debug: ${stats.replacements['console.table']}`);
  console.log(`   • console.group → logger.debug: ${stats.replacements['console.group']}`);
  console.log(`   • console.groupEnd → (supprimé): ${stats.replacements['console.groupEnd']}`);
  console.log(`   • Lignes supprimées: ${stats.replacements['removed']}`);

  const totalReplacements = Object.values(stats.replacements).reduce((a, b) => a + b, 0);
  console.log(`\n📊 Total: ${totalReplacements} remplacements`);

  if (stats.errors.length > 0) {
    console.log('\n❌ Erreurs:');
    stats.errors.forEach(({ file, error }) => {
      console.log(`   • ${file}: ${error}`);
    });
  }

  if (DRY_RUN) {
    console.log('\n⚠️  Mode DRY RUN - Aucun fichier n\'a été modifié');
    console.log('   Relancez sans --dry-run pour appliquer les changements');
  } else {
    console.log('\n✅ Migration terminée avec succès!');
    console.log('\n⚠️  IMPORTANT: Vérifiez les changements avec:');
    console.log('   git diff src/');
    console.log('\n   Puis testez l\'application:');
    console.log('   npm run build');
  }

  console.log('='.repeat(80) + '\n');
}

// Lancer le script
main();
