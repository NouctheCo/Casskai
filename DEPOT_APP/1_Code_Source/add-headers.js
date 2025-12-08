const fs = require('fs');
const path = require('path');

const header = `/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

`;

function addHeaderToFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('Copyright') && content.includes('NOUTCHE CONSEIL')) {
      console.log(`✓ Already has header: ${filePath}`);
      return false;
    }
    
    const newContent = header + content;
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ Header added: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Liste des fichiers prioritaires
const priorityFiles = [
  'src/main.tsx',
  'src/App.tsx',
  'src/AppRouter.tsx',
  'src/lib/supabase.ts',
  'src/contexts/AuthContext.tsx',
  'src/lib/company.ts'
];

let modified = 0;
let skipped = 0;

console.log('\n🔧 Adding copyright headers to priority files...\n');

priorityFiles.forEach(file => {
  if (fs.existsSync(file)) {
    if (addHeaderToFile(file)) {
      modified++;
    } else {
      skipped++;
    }
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log(`\n✅ Done! Modified: ${modified}, Skipped: ${skipped}\n`);
