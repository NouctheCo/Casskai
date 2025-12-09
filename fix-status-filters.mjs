import { readFileSync, writeFileSync } from 'fs';

const files = [
  'src/services/accountingDataService.ts',
  'src/services/financialHealthService.ts', 
  'src/services/financialRatiosService.ts'
];

let fixed = 0;

for (const file of files) {
  try {
    let content = readFileSync(file, 'utf8');
    const original = content;
    
    // Ajouter filtre status après company_id si absent
    content = content.replace(
      /(.from\('journal_entries'\)[^]*?\.eq\('company_id',\s*[^)]+\))(\s*\n\s*\.)(?!in\('status|eq\('status)/g,
      "$1\n      .in('status', ['posted', 'validated', 'imported'])$2"
    );
    
    if (content !== original) {
      writeFileSync(file, content, 'utf8');
      console.log(`✅ ${file}`);
      fixed++;
    }
  } catch (err) {
    console.error(`❌ ${file}: ${err.message}`);
  }
}

console.log(`\n✨ ${fixed} fichiers corrigés`);
