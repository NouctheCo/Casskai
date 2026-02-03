const fs = require('fs');
const path = require('path');

function walk(dir, cb) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
    const full = path.join(dir, d.name);
    if (d.isDirectory()) walk(full, cb);
    else cb(full);
  });
}

function fixInputs(src) {
  // Replace <input ...> with <input ... /> unless already self-closing
  return src.replace(/<input([^>]*?)>/gs, (m, attrs) => {
    // if already has /> just return
    if (/\/>\s*$/.test(m)) return m;
    
    // Check only the substring immediately following this match for </input>
    const matchEnd = src.indexOf(m) + m.length;
    const after = src.slice(matchEnd, matchEnd + 50); // Look ahead max 50 chars
    if (/^\s*<\/input>/.test(after)) return m;
    
    // otherwise ensure space before slash
    const trimmed = attrs.replace(/\s+$/,'');
    return `<input${trimmed} />`;
  });
}

const root = path.join(__dirname, '..', 'src');
let changed = 0;
walk(root, (file) => {
  if (!file.endsWith('.tsx') && !file.endsWith('.ts')) return;
  try {
    const src = fs.readFileSync(file, 'utf8');
    const out = fixInputs(src);
    if (out !== src) {
      fs.writeFileSync(file, out, 'utf8');
      console.log('fixed', file);
      changed++;
    }
  } catch (e) {
    console.error('fail', file, e.message);
  }
});
console.log('done', changed, 'files changed');
