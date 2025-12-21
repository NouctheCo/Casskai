import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const localeFiles = {
  fr: path.resolve('src/i18n/locales/fr.json'),
  en: path.resolve('src/i18n/locales/en.json'),
  es: path.resolve('src/i18n/locales/es.json')
};

const flattenKeys = (obj, prefix = '') => {
  const keys = new Set();
  Object.entries(obj || {}).forEach(([key, value]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const childKeys = flattenKeys(value, nextPrefix);
      childKeys.forEach((childKey) => keys.add(childKey));
    } else {
      keys.add(nextPrefix);
    }
  });
  return keys;
};

const localeData = {};
const localeKeys = {};

for (const [locale, filePath] of Object.entries(localeFiles)) {
  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  localeData[locale] = data;
  localeKeys[locale] = flattenKeys(data);
}

const sourceFiles = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      sourceFiles.push(fullPath);
    }
  }
};

walk(path.resolve('src'));
// Match translation calls like t('foo') or i18n.t("bar") but avoid identifiers ending with 't'
// (e.g. import('./file') or split(',') ) by requiring a non-word char before t(
const translationUsageRegex = /(?<![A-Za-z0-9_])t\(\s*['"]([^'"`]+)['"]/g;
const usedKeys = new Set();
const fileUsages = new Map();

for (const file of sourceFiles) {
  const content = readFileSync(file, 'utf8');
  let match;
  while ((match = translationUsageRegex.exec(content)) !== null) {
    const key = match[1];
    usedKeys.add(key);
    if (!fileUsages.has(key)) {
      fileUsages.set(key, new Set());
    }
    fileUsages.get(key).add(path.relative(process.cwd(), file));
  }
}

const unionLocaleKeys = new Set();
Object.values(localeKeys).forEach((keysSet) => {
  keysSet.forEach((key) => unionLocaleKeys.add(key));
});

const missingUsagePerLocale = {};
const localeDiffs = {};

for (const locale of Object.keys(localeFiles)) {
  const keys = localeKeys[locale];
  const missingUsed = Array.from(usedKeys).filter((key) => !keys.has(key)).sort();
  missingUsagePerLocale[locale] = missingUsed;

  const missingFromUnion = Array.from(unionLocaleKeys)
    .filter((key) => !keys.has(key))
    .sort();
  localeDiffs[locale] = missingFromUnion;
}

const report = {
  stats: {
    totalUsedKeys: usedKeys.size,
    locales: Object.fromEntries(
      Object.entries(localeKeys).map(([locale, keys]) => [locale, keys.size])
    )
  },
  missingUsedKeys: missingUsagePerLocale,
  localeDifferences: localeDiffs
};

console.log(JSON.stringify(report, null, 2));
