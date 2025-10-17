const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all TypeScript files
function getAllTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist' && file !== 'build') {
        getAllTsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Fix catch blocks: catch (error) => catch (_error)
function fixCatchBlocks(content) {
  return content.replace(/catch\s*\(\s*(\w+)\s*\)/g, (match, varName) => {
    if (!varName.startsWith('_')) {
      return `catch (_${varName})`;
    }
    return match;
  });
}

// Fix unused const declarations
function fixUnusedConst(content, varName) {
  // Pattern 1: const varName = ...
  const regex1 = new RegExp(`\\bconst\\s+${varName}\\s*=`, 'g');
  content = content.replace(regex1, `const _${varName} =`);

  // Pattern 2: const varName: Type = ...
  const regex2 = new RegExp(`\\bconst\\s+${varName}\\s*:`, 'g');
  content = content.replace(regex2, `const _${varName}:`);

  // Pattern 3: let varName = ...
  const regex3 = new RegExp(`\\blet\\s+${varName}\\s*=`, 'g');
  content = content.replace(regex3, `let _${varName} =`);

  return content;
}

// Fix destructuring: const { var } => const { var: _var }
function fixDestructuring(content, varName) {
  // Pattern: { varName } or { varName, ... } or { ..., varName }
  const regex1 = new RegExp(`\\{\\s*${varName}\\s*,`, 'g');
  content = content.replace(regex1, `{ ${varName}: _${varName},`);

  const regex2 = new RegExp(`,\\s*${varName}\\s*\\}`, 'g');
  content = content.replace(regex2, `, ${varName}: _${varName} }`);

  const regex3 = new RegExp(`\\{\\s*${varName}\\s*\\}`, 'g');
  content = content.replace(regex3, `{ ${varName}: _${varName} }`);

  const regex4 = new RegExp(`,\\s*${varName}\\s*,`, 'g');
  content = content.replace(regex4, `, ${varName}: _${varName},`);

  return content;
}

// Fix function parameters
function fixFunctionParam(content, varName) {
  // Arrow functions: (param) => or (param, ...) =>
  const regex1 = new RegExp(`\\(([^)]*)\\b${varName}\\b([^)]*)\\)\\s*=>`, 'g');
  content = content.replace(regex1, (match, before, after) => {
    return `(${before}_${varName}${after}) =>`;
  });

  // Regular functions: function foo(param)
  const regex2 = new RegExp(`\\bfunction\\s+\\w+\\s*\\(([^)]*)\\b${varName}\\b([^)]*)\\)`, 'g');
  content = content.replace(regex2, (match, before, after) => {
    return match.replace(new RegExp(`\\b${varName}\\b`), `_${varName}`);
  });

  return content;
}

// Process a single file
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix all catch blocks
    const newContent = fixCatchBlocks(content);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main
const srcDir = path.join(__dirname, 'src');
const files = getAllTsFiles(srcDir);

console.log(`Found ${files.length} TypeScript files`);

let fixedCount = 0;
files.forEach(file => {
  if (processFile(file)) {
    fixedCount++;
  }
});

console.log(`\nFixed ${fixedCount} files`);
console.log('\nRunning ESLint to check remaining errors...');

try {
  execSync('npm run lint', { stdio: 'inherit' });
} catch (error) {
  // ESLint exits with error code if there are errors
}
