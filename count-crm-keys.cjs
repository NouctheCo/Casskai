const fs = require('fs');

function countKeys(obj, prefix = '') {
  let count = 0;
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      count += countKeys(obj[key], fullKey);
    } else {
      count++;
    }
  }
  return count;
}

const fr = JSON.parse(fs.readFileSync('src/i18n/locales/fr.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('src/i18n/locales/en.json', 'utf8'));
const es = JSON.parse(fs.readFileSync('src/i18n/locales/es.json', 'utf8'));

console.log('📊 Statistiques des traductions CRM:\n');
console.log('🇫🇷 FR - crm.*:', countKeys(fr.crm), 'clés');
console.log('🇬🇧 EN - crm.*:', countKeys(en.crm), 'clés');
console.log('🇪🇸 ES - crm.*:', countKeys(es.crm), 'clés');
console.log('\n📈 Total:', countKeys(fr.crm) + countKeys(en.crm) + countKeys(es.crm), 'clés');
