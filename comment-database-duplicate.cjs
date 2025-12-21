const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'types', 'types-fixes.d.ts');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);

// Commenter les lignes 189-222 (indices 188-221)
const commented = lines.map((line, idx) => {
  if (idx >= 188 && idx <= 221) {
    return '// ' + line;
  }
  return line;
});

fs.writeFileSync(filePath, commented.join('\n'), 'utf8');
console.log('✅ Lignes 189-222 commentées pour éviter duplicate Database');
