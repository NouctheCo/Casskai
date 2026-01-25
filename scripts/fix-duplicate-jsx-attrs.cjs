#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const attrRegex = /([A-Za-z0-9_:\-@]+)\s*=\s*(?:"[^"]*"|'[^']*'|\{[^}]*\})/g;
const spreadRegex = /\{\s*\.\.\.[^}]+\}/g;
const tagRegex = /<([A-Za-z0-9_:\-]+)([^>]*)>/gs;

function processFile(file) {
  let code = fs.readFileSync(file, 'utf8');
  let changed = false;
  const newCode = code.replace(tagRegex, (full, tagName, body) => {
    // ignore fragments
    if (tagName === '') return full;
    const original = full;
    const selfClose = /\/>\s*$/.test(original);
    const spreads = body.match(spreadRegex) || [];
    const keptAttrs = [];
    const seen = new Set();
    let m;
    while ((m = attrRegex.exec(body)) !== null) {
      const name = m[1];
      if (!seen.has(name)) {
        seen.add(name);
        keptAttrs.push(m[0]);
      }
    }
    // If no attributes matched, return original
    if (keptAttrs.length === 0 && spreads.length === 0) return full;
    const newBody = (keptAttrs.concat(spreads)).join(' ').trim();
    const rebuilt = `<${tagName}` + (newBody ? ' ' + newBody : '') + (selfClose ? '/>' : '>');
    if (rebuilt !== original) {
      changed = true;
      return rebuilt;
    }
    return original;
  });

  if (changed && newCode !== code) {
    fs.writeFileSync(file, newCode, 'utf8');
    console.log('patched', file);
  }
}

const root = path.resolve(process.cwd(), 'src');
if (!fs.existsSync(root)) {
  console.error('src directory not found at', root);
  process.exit(1);
}
const files = walk(root);
files.forEach(processFile);
console.log('done');
