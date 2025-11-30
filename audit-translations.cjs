const fs = require('fs');
const path = require('path');

// Charger les fichiers de traduction
const frTranslations = JSON.parse(fs.readFileSync('./src/i18n/locales/fr.json', 'utf8'));
const enTranslations = JSON.parse(fs.readFileSync('./src/i18n/locales/en.json', 'utf8'));
const esTranslations = JSON.parse(fs.readFileSync('./src/i18n/locales/es.json', 'utf8'));

// Fonction pour aplatir les objets JSON
function flattenKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(flattenKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const frKeys = new Set(flattenKeys(frTranslations));
const enKeys = new Set(flattenKeys(enTranslations));
const esKeys = new Set(flattenKeys(esTranslations));

console.log(`\n=== STATISTIQUES DES FICHIERS DE TRADUCTION ===`);
console.log(`FR: ${frKeys.size} clés`);
console.log(`EN: ${enKeys.size} clés`);
console.log(`ES: ${esKeys.size} clés`);

// Fonction pour trouver tous les fichiers
function findFiles(dir, extensions, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!filePath.includes('node_modules') && !filePath.includes('.git')) {
        findFiles(filePath, extensions, fileList);
      }
    } else if (extensions.some(ext => file.endsWith(ext))) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

// Rechercher les fichiers source
const sourceFiles = findFiles('./src', ['.tsx', '.ts', '.jsx', '.js']);

console.log(`\n=== ANALYSE DES FICHIERS SOURCE ===`);
console.log(`Fichiers à analyser: ${sourceFiles.length}`);

// Patterns pour détecter les appels de traduction
const tCallPattern = /\bt\(['"`]([^'"`]+)['"`][,\)]/g;
const tObjectPattern = /\{t\(['"`]([^'"`]+)['"`][,\)]/g;

const usedKeys = new Set();
const hardcodedTexts = {};

sourceFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');

    // Trouver tous les appels t('...')
    let match;
    while ((match = tCallPattern.exec(content)) !== null) {
      usedKeys.add(match[1]);
    }

    // Trouver tous les {t('...')}
    tObjectPattern.lastIndex = 0;
    while ((match = tObjectPattern.exec(content)) !== null) {
      usedKeys.add(match[1]);
    }

    // Détecter les textes hardcodés potentiels (patterns simplifiés)
    const hardcodedPattern = /<(Button|Label|h[1-6]|p|span|div)[^>]*>([A-ZÉÈÊËÀÂÄÔÖÙÛÜÏÎ][a-zéèêëàâäôöùûüïîç]{4,}[^<]{10,})</g;
    let hardcodedMatch;
    let count = 0;
    while ((hardcodedMatch = hardcodedPattern.exec(content)) !== null) {
      const text = hardcodedMatch[2].trim();
      if (text.length > 15 && !text.includes('{') && !text.includes('t(')) {
        count++;
      }
    }
    if (count > 0) {
      hardcodedTexts[file.replace(/\\/g, '/')] = count;
    }
  } catch (err) {
    console.error(`Erreur lors de la lecture de ${file}:`, err.message);
  }
});

console.log(`\nClés de traduction utilisées dans le code: ${usedKeys.size}`);

// Trouver les clés manquantes
const missingInFr = [...usedKeys].filter(key => !frKeys.has(key));
const missingInEn = [...usedKeys].filter(key => !enKeys.has(key));
const missingInEs = [...usedKeys].filter(key => !esKeys.has(key));

// Trouver les clés orphelines (définies mais jamais utilisées)
const unusedInFr = [...frKeys].filter(key => !usedKeys.has(key));
const unusedInEn = [...enKeys].filter(key => !usedKeys.has(key));
const unusedInEs = [...esKeys].filter(key => !usedKeys.has(key));

console.log(`\n=== CLÉS MANQUANTES DANS LES FICHIERS DE TRADUCTION ===`);
console.log(`\nManquantes en FR: ${missingInFr.length}`);
if (missingInFr.length > 0 && missingInFr.length <= 50) {
  missingInFr.forEach(key => console.log(`  - ${key}`));
} else if (missingInFr.length > 50) {
  console.log(`  (Top 50):`);
  missingInFr.slice(0, 50).forEach(key => console.log(`  - ${key}`));
}

console.log(`\nManquantes en EN: ${missingInEn.length}`);
if (missingInEn.length > 0 && missingInEn.length <= 50) {
  missingInEn.forEach(key => console.log(`  - ${key}`));
} else if (missingInEn.length > 50) {
  console.log(`  (Top 50):`);
  missingInEn.slice(0, 50).forEach(key => console.log(`  - ${key}`));
}

console.log(`\nManquantes en ES: ${missingInEs.length}`);
if (missingInEs.length > 0 && missingInEs.length <= 50) {
  missingInEs.forEach(key => console.log(`  - ${key}`));
} else if (missingInEs.length > 50) {
  console.log(`  (Top 50):`);
  missingInEs.slice(0, 50).forEach(key => console.log(`  - ${key}`));
}

console.log(`\n=== CLÉS ORPHELINES (Définies mais non utilisées) ===`);
console.log(`FR: ${unusedInFr.length} clés orphelines`);
console.log(`EN: ${unusedInEn.length} clés orphelines`);
console.log(`ES: ${unusedInEs.length} clés orphelines`);

console.log(`\n=== TOP 20 FICHIERS AVEC TEXTES HARDCODÉS ===`);
const sortedHardcoded = Object.entries(hardcodedTexts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20);

sortedHardcoded.forEach(([file, count]) => {
  console.log(`${count.toString().padStart(3)} - ${file.replace('./src/', '')}`);
});

// Rapport JSON détaillé
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalTranslationFiles: 3,
    keysInFr: frKeys.size,
    keysInEn: enKeys.size,
    keysInEs: esKeys.size,
    keysUsedInCode: usedKeys.size,
    sourceFilesAnalyzed: sourceFiles.length,
  },
  missing: {
    fr: missingInFr,
    en: missingInEn,
    es: missingInEs,
  },
  unused: {
    fr: unusedInFr.slice(0, 100),
    en: unusedInEn.slice(0, 100),
    es: unusedInEs.slice(0, 100),
  },
  hardcodedTexts: sortedHardcoded.slice(0, 50),
  recommendations: [
    missingInFr.length > 0 ? `Ajouter ${missingInFr.length} clés manquantes en FR` : null,
    missingInEn.length > 0 ? `Ajouter ${missingInEn.length} clés manquantes en EN` : null,
    missingInEs.length > 0 ? `Ajouter ${missingInEs.length} clés manquantes en ES` : null,
    sortedHardcoded.length > 0 ? `Internationaliser ${sortedHardcoded.length} fichiers avec textes hardcodés` : null,
    unusedInFr.length > 50 ? `Nettoyer ${unusedInFr.length} clés orphelines en FR` : null,
  ].filter(Boolean),
};

fs.writeFileSync('./translation-audit-report.json', JSON.stringify(report, null, 2));
console.log(`\n=== RAPPORT DÉTAILLÉ ===`);
console.log(`Rapport JSON sauvegardé dans: ./translation-audit-report.json`);

console.log(`\n=== RECOMMANDATIONS ===`);
report.recommendations.forEach((rec, i) => {
  console.log(`${i + 1}. ${rec}`);
});

console.log(`\n=== TAUX DE COMPLÉTION ===`);
const frCompletion = ((frKeys.size - missingInFr.length) / usedKeys.size * 100).toFixed(1);
const enCompletion = ((enKeys.size - missingInEn.length) / usedKeys.size * 100).toFixed(1);
const esCompletion = ((esKeys.size - missingInEs.length) / usedKeys.size * 100).toFixed(1);

console.log(`FR: ${frCompletion}% (${frKeys.size - missingInFr.length}/${usedKeys.size})`);
console.log(`EN: ${enCompletion}% (${enKeys.size - missingInEn.length}/${usedKeys.size})`);
console.log(`ES: ${esCompletion}% (${esKeys.size - missingInEs.length}/${usedKeys.size})`);

console.log(`\n=== AUDIT TERMINÉ ===\n`);
