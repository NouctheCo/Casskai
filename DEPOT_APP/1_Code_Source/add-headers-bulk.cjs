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
      return false;
    }
    const newContent = header + content;
    fs.writeFileSync(filePath, newContent, 'utf8');
    return true;
  } catch (error) {
    return false;
  }
}

function processDirectory(dir) {
  let modified = 0, skipped = 0;
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        const result = processDirectory(fullPath);
        modified += result.modified; skipped += result.skipped;
      } else if (file.isFile() && /\.(ts|tsx)$/.test(file.name)) {
        if (addHeaderToFile(fullPath)) { modified++; } else { skipped++; }
      }
    }
  } catch (error) { }
  return { modified, skipped };
}

console.log('Processing services...');
const s = processDirectory('src/services');
console.log('Processing contexts...');
const c = processDirectory('src/contexts');
console.log('Processing hooks...');
const h = processDirectory('src/hooks');
console.log('Processing pages...');
const p = processDirectory('src/pages');
console.log('Processing lib...');
const l = processDirectory('src/lib');

const total = s.modified + c.modified + h.modified + p.modified + l.modified;
const skipped = s.skipped + c.skipped + h.skipped + p.skipped + l.skipped;
console.log('Total Modified: ' + total);
console.log('Total Skipped: ' + skipped);
console.log('Total: ' + (total + skipped));
