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
    // ignore cases where input is followed by </input> (rare)
    if (/<\/input>/.test(src)) return m;
    // if it's a JSX expression like <input>child</input> leave it
    const after = src.slice(src.indexOf(m) + m.length);
    if (/\s*<\/input>/.test(after)) return m;
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
