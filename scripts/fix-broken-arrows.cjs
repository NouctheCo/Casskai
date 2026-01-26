const fs = require('fs');
const path = require('path');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) processFile(full);
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const orig = content;
  // Fix common malformed arrow patterns introduced by previous transform
  // Replace `= />` (possibly with spaces) with `=>`
  content = content.replace(/=\s*\/\>/g, '=>');
  // Also fix patterns where there is `{e =>` lost parentheses spacing
  content = content.replace(/\{\s*\(?(\w+)\s*=>/g, (m) => m); // noop to preserve

  if (content !== orig) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('patched', filePath);
  }
}

walk(path.join(__dirname, '..', 'src'));
console.log('done');
