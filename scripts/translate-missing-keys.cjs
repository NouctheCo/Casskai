/**
 * 🌐 SCRIPT AUTOMATION TRADUCTIONS - DeepL API
 * 
 * Objectif: Traduire automatiquement toutes les clés manquantes
 * - EN.json: 27% → 100% (2261 clés manquantes)
 * - ES.json: 25% → 100% (2348 clés manquantes)
 * 
 * Budget: ~€20 pour 500k caractères (DeepL Pro API)
 * Temps exec: ~10 minutes
 */

const fs = require('fs');
const path = require('path');

// CONFIGURATION
const DEEPL_API_KEY = process.env.DEEPL_API_KEY || 'VOTRE_CLE_API_ICI';
const LOCALES_DIR = path.join(__dirname, '../src/i18n/locales');
const BATCH_SIZE = 50; // Traiter 50 clés à la fois
const DELAY_MS = 100; // Délai entre requêtes (éviter rate limit)

// Charger fichiers JSON
const loadJSON = (lang) => {
  const filePath = path.join(LOCALES_DIR, `${lang}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
};

const saveJSON = (lang, data) => {
  const filePath = path.join(LOCALES_DIR, `${lang}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ Sauvegardé: ${lang}.json`);
};

// Extraire toutes les clés d'un objet nested
const flattenKeys = (obj, prefix = '') => {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey));
    } else {
      keys.push({ key: fullKey, value });
    }
  }
  return keys;
};

// Reconstruire objet nested depuis clés plates
const unflattenKeys = (flatKeys) => {
  const result = {};
  for (const { key, value } of flatKeys) {
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
};

// Identifier clés manquantes
const findMissingKeys = (source, target) => {
  const sourceKeys = flattenKeys(source).map(k => k.key);
  const targetKeys = flattenKeys(target).map(k => k.key);
  return sourceKeys.filter(k => !targetKeys.includes(k));
};

// Obtenir valeur d'une clé nested
const getNestedValue = (obj, keyPath) => {
  return keyPath.split('.').reduce((acc, part) => acc?.[part], obj);
};

// Traduction avec DeepL
const translateWithDeepL = async (text, sourceLang, targetLang) => {
  // OPTION 1: DeepL API (RECOMMANDÉ - Précision professionnelle)
  if (DEEPL_API_KEY && DEEPL_API_KEY !== 'VOTRE_CLE_API_ICI') {
    try {
      const response = await fetch('https://api-free.deepl.com/v2/translate', {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: [text],
          source_lang: sourceLang.toUpperCase(),
          target_lang: targetLang.toUpperCase()
        })
      });
      
      const data = await response.json();
      return data.translations[0].text;
    } catch (error) {
      console.error(`❌ Erreur DeepL: ${error.message}`);
      return translateFallback(text, targetLang);
    }
  }

  // OPTION 2: Fallback LibreTranslate (Gratuit, local possible)
  return translateFallback(text, targetLang);
};

// Traduction fallback (gratuit mais moins précis)
const translateFallback = async (text, targetLang) => {
  try {
    // LibreTranslate - Instance publique ou auto-hébergée
    const response = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: 'fr',
        target: targetLang === 'EN' ? 'en' : 'es',
        format: 'text'
      })
    });
    
    const data = await response.json();
    return data.translatedText;
  } catch (error) {
    console.warn(`⚠️ Fallback translation failed: ${error.message}`);
    return `[UNTRANSLATED] ${text}`;
  }
};

// Traiter traductions par batch
const translateBatch = async (keys, fr, sourceLang, targetLang) => {
  const results = [];
  
  for (let i = 0; i < keys.length; i += BATCH_SIZE) {
    const batch = keys.slice(i, i + BATCH_SIZE);
    console.log(`📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(keys.length / BATCH_SIZE)} (${batch.length} clés)`);
    
    const batchResults = await Promise.all(
      batch.map(async (key) => {
        const sourceText = getNestedValue(fr, key);
        if (!sourceText || typeof sourceText !== 'string') {
          console.warn(`⚠️ Clé invalide: ${key}`);
          return { key, value: sourceText };
        }
        
        const translated = await translateWithDeepL(sourceText, sourceLang, targetLang);
        await new Promise(resolve => setTimeout(resolve, DELAY_MS)); // Rate limiting
        
        return { key, value: translated };
      })
    );
    
    results.push(...batchResults);
    console.log(`✓ Batch traité (${results.length}/${keys.length})`);
  }
  
  return results;
};

// MAIN EXECUTION
(async () => {
  console.log('🚀 Début traduction automatique...\n');

  try {
    // Charger fichiers
    const fr = loadJSON('fr');
    const en = loadJSON('en');
    const es = loadJSON('es');

    console.log('📊 Analyse fichiers:');
    const frKeys = flattenKeys(fr);
    const enKeys = flattenKeys(en);
    const esKeys = flattenKeys(es);
    
    console.log(`  FR: ${frKeys.length} clés (référence)`);
    console.log(`  EN: ${enKeys.length} clés (${Math.round(enKeys.length / frKeys.length * 100)}%)`);
    console.log(`  ES: ${esKeys.length} clés (${Math.round(esKeys.length / frKeys.length * 100)}%)\n`);

    // Identifier clés manquantes
    const missingEN = findMissingKeys(fr, en);
    const missingES = findMissingKeys(fr, es);

    console.log('❌ Clés manquantes:');
    console.log(`  EN: ${missingEN.length} clés`);
    console.log(`  ES: ${missingES.length} clés\n`);

    if (missingEN.length === 0 && missingES.length === 0) {
      console.log('✅ Toutes les traductions sont déjà complètes!');
      return;
    }

    // Traduction EN
    if (missingEN.length > 0) {
      console.log('🇬🇧 Traduction EN en cours...');
      const translatedEN = await translateBatch(missingEN, fr, 'FR', 'EN');
      
      // Fusionner avec existant
      const enFlat = flattenKeys(en);
      const mergedEN = [...enFlat, ...translatedEN];
      const finalEN = unflattenKeys(mergedEN);
      
      saveJSON('en', finalEN);
      console.log(`✅ EN: ${missingEN.length} nouvelles traductions\n`);
    }

    // Traduction ES
    if (missingES.length > 0) {
      console.log('🇪🇸 Traduction ES en cours...');
      const translatedES = await translateBatch(missingES, fr, 'FR', 'ES');
      
      // Fusionner avec existant
      const esFlat = flattenKeys(es);
      const mergedES = [...esFlat, ...translatedES];
      const finalES = unflattenKeys(mergedES);
      
      saveJSON('es', finalES);
      console.log(`✅ ES: ${missingES.length} nouvelles traductions\n`);
    }

    // Rapport final
    console.log('=' .repeat(60));
    console.log('✅ TRADUCTION TERMINÉE\n');
    
    const newEN = loadJSON('en');
    const newES = loadJSON('es');
    const newENKeys = flattenKeys(newEN).length;
    const newESKeys = flattenKeys(newES).length;
    
    console.log('📊 Résultats finaux:');
    console.log(`  FR: ${frKeys.length} clés (100%)`);
    console.log(`  EN: ${newENKeys} clés (${Math.round(newENKeys / frKeys.length * 100)}%)`);
    console.log(`  ES: ${newESKeys} clés (${Math.round(newESKeys / frKeys.length * 100)}%)`);
    console.log('\n🎉 Traductions complètes et prêtes pour production!');

  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
})();

// ========================================
// INSTRUCTIONS UTILISATION
// ========================================
/*

1️⃣ OPTION A: DeepL API (RECOMMANDÉ - Qualité professionnelle)
   
   a) Créer compte gratuit: https://www.deepl.com/pro-api
      → 500k caractères/mois gratuits
   
   b) Obtenir clé API
   
   c) Exécuter:
      $env:DEEPL_API_KEY="votre-cle-api"
      node scripts/translate-missing-keys.js
   
   d) Temps: ~10 minutes
      Coût: GRATUIT (500k caractères inclus)

2️⃣ OPTION B: LibreTranslate (GRATUIT - Auto-hébergé possible)
   
   a) Laisser DEEPL_API_KEY vide
   
   b) Exécuter:
      node scripts/translate-missing-keys.js
   
   c) Temps: ~15 minutes
      Qualité: Correcte (révision recommandée)

3️⃣ VÉRIFICATION POST-TRADUCTION
   
   npm run test:i18n
   npm run dev
   → Tester interface EN + ES
   → Vérifier cohérence termes métier

4️⃣ RÉVISION NATIVE SPEAKER (Optionnel)
   
   Budget: 2h × €50/h = €100
   → EN: Reviewer anglophone
   → ES: Reviewer hispanophone
   → Focus: Termes comptables, juridiques

*/
