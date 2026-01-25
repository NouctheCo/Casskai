const fs = require('fs');
const path = require('path');

function walk(dir, cb) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
    const full = path.join(dir, d.name);
    if (d.isDirectory()) walk(full, cb);
    else cb(full);
  });
}

function dedupeClasses(s) {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .reduce((arr, cls) => {
      if (!arr.includes(cls)) arr.push(cls);
      return arr;
    }, [])
    .join(' ');
}

function processFile(file) {
  let src = fs.readFileSync(file, 'utf8');
  let orig = src;

  // Deduplicate className="..."
  src = src.replace(/className=(\"|')(.*?)\1/gs, (m, q, inner) => {
    const out = dedupeClasses(inner);
    return `className=${q}${out}${q}`;
  });

  // Add aria-label to <select> without aria-label/title/aria-labelledby
  src = src.replace(/<select([^>]*?)>/gs, (m, attrs) => {
    if (/aria-label=|aria-labelledby=|title=/.test(attrs)) return `<select${attrs}>`;
    return `<select aria-label=\"Select\"${attrs}>`;
  });

  // Add placeholder and aria-label to <input> without them, preserve self-closing
  src = src.replace(/<input([^>]*?)(\/?\s*)>/gs, (m, attrs, closing) => {
    if (/aria-label=|aria-labelledby=|title=/.test(attrs) || /placeholder=/.test(attrs)) return `<input${attrs}${closing}>`;
    // keep closing slash if present
    const end = closing && closing.includes('/') ? ' /' : '';
    return `<input aria-label=\"Input\" placeholder=\"\"${attrs}${end}>`;
  });

  if (src !== orig) fs.writeFileSync(file, src, 'utf8');
}

const root = path.join(__dirname, '..', 'src');
walk(root, (file) => {
  if (!file.endsWith('.tsx') && !file.endsWith('.ts')) return;
  try {
    processFile(file);
    console.log('processed', file);
  } catch (e) {
    console.error('failed', file, e.message);
  }
});
console.log('done');
