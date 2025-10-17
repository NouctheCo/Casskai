#!/usr/bin/env node

import { readFileSync, existsSync, statSync } from 'fs';
import { join, resolve, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const srcDir = join(rootDir, 'src');

console.log('🔍 Vérification des imports pour compatibilité Linux...\n');

let errors = 0;
let warnings = 0;

// Extensions valides pour les imports
const validExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];

// Résoudre les alias @/
function resolveAlias(importPath) {
  if (importPath.startsWith('@/')) {
    return importPath.replace('@/', '');
  }
  return importPath;
}

// Résoudre le chemin complet d'un import
function resolveImportPath(importPath, fromFile) {
  const baseDir = dirname(fromFile);
  
  if (importPath.startsWith('@/')) {
    // Alias @/ -> src/
    const resolved = resolveAlias(importPath);
    return join(srcDir, resolved);
  } else if (importPath.startsWith('./') || importPath.startsWith('../')) {
    // Import relatif
    return resolve(baseDir, importPath);
  }
  
  // Import de node_modules ou autre
  return null;
}

// Vérifier si un fichier existe avec les bonnes extensions
function checkFileExists(basePath) {
  // Si le fichier a déjà une extension, vérifier directement
  if (extname(basePath)) {
    return existsSync(basePath) ? basePath : null;
  }
  
  // Essayer les extensions TypeScript/JavaScript
  for (const ext of ['.ts', '.tsx', '.js', '.jsx', '.json']) {
    const fullPath = basePath + ext;
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }
  
  // Vérifier si c'est un dossier avec index
  if (existsSync(basePath) && statSync(basePath).isDirectory()) {
    for (const ext of ['.ts', '.tsx', '.js', '.jsx']) {
      const indexPath = join(basePath, 'index' + ext);
      if (existsSync(indexPath)) {
        return indexPath;
      }
    }
  }
  
  return null;
}

// Extraire les imports d'un fichier
function extractImports(content, filePath) {
  const imports = [];
  
  // Regex pour capturer les imports ES6
  const importRegex = /import\s+(?:[^'"]*from\s+)?['"]((?:@\/|\.\.?\/)[^'"]+)['"]/g;
  
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (importPath && !importPath.includes('node_modules')) {
      imports.push({
        path: importPath,
        line: content.substring(0, match.index).split('\n').length
      });
    }
  }
  
  return imports;
}

// Vérifier un fichier
function checkFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const imports = extractImports(content, filePath);
    const relativePath = filePath.replace(rootDir, '.');
    
    console.log(`📄 ${relativePath} (${imports.length} imports)`);
    
    for (const imp of imports) {
      const resolvedPath = resolveImportPath(imp.path, filePath);
      
      if (resolvedPath) {
        const actualPath = checkFileExists(resolvedPath);
        
        if (!actualPath) {
          console.log(`  ❌ ERREUR ligne ${imp.line}: Import introuvable '${imp.path}'`);
          console.log(`     Résolu vers: ${resolvedPath}`);
          errors++;
        } else {
          // Vérifier la casse
          const expectedPath = resolvedPath;
          if (actualPath !== expectedPath && actualPath.toLowerCase() === expectedPath.toLowerCase()) {
            console.log(`  ⚠️  ATTENTION ligne ${imp.line}: Différence de casse '${imp.path}'`);
            console.log(`     Attendu: ${expectedPath}`);
            console.log(`     Trouvé: ${actualPath}`);
            warnings++;
          }
        }
      }
    }
  } catch (error) {
    console.log(`  ❌ Erreur lecture fichier: ${error.message}`);
    errors++;
  }
}

// Scanner tous les fichiers TypeScript/JavaScript dans src/
const files = globSync('**/*.{ts,tsx,js,jsx}', {
  cwd: srcDir,
  absolute: true,
  ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts']
});

console.log(`📁 Scan de ${files.length} fichiers dans ${srcDir}\n`);

files.forEach(checkFile);

// Résumé
console.log('\n' + '='.repeat(60));
console.log(`🏁 RÉSUMÉ:`);
console.log(`   ✅ Fichiers scannés: ${files.length}`);
console.log(`   ❌ Erreurs: ${errors}`);
console.log(`   ⚠️  Avertissements: ${warnings}`);

if (errors > 0) {
  console.log('\n❌ Des imports sont introuvables. Build interrompu.');
  process.exit(1);
} else if (warnings > 0) {
  console.log('\n⚠️  Des différences de casse détectées. À corriger pour Linux.');
  process.exit(1);
} else {
  console.log('\n✅ Tous les imports sont valides !');
  process.exit(0);
}