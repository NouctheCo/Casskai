/**
 * Audit Script - Détecte les accès non sécurisés aux données
 * Usage: node audit-unsafe-code.js
 */

const fs = require('fs');
const path = require('path');

// Patterns dangereux à détecter
const UNSAFE_PATTERNS = [
  {
    name: 'Unsafe .map()',
    regex: /(?<!\/\/.*)(?<!\(\w+\s*\|\|\s*\[\]\))(\w+)\.map\(/g,
    description: 'Appel .map() sans protection contre undefined/null'
  },
  {
    name: 'Unsafe .filter()',
    regex: /(?<!\/\/.*)(?<!\(\w+\s*\|\|\s*\[\]\))(\w+)\.filter\(/g,
    description: 'Appel .filter() sans protection'
  },
  {
    name: 'Unsafe .reduce()',
    regex: /(?<!\/\/.*)(?<!\(\w+\s*\|\|\s*\[\]\))(\w+)\.reduce\(/g,
    description: 'Appel .reduce() sans protection'
  },
  {
    name: 'Unsafe Object.values()',
    regex: /Object\.values\((?!\w+\s*\|\|\s*\{)(\w+)\)/g,
    description: 'Object.values() sans protection'
  },
  {
    name: 'useState without initialization',
    regex: /useState<[^>]+>\(\s*\)/g,
    description: 'useState sans valeur par défaut'
  }
];

// Fichiers à ignorer
const IGNORE_PATTERNS = [
  /node_modules/,
  /\.d\.ts$/,
  /\.test\.ts$/,
  /\.spec\.ts$/,
  /dist\//,
  /build\//
];

function shouldIgnoreFile(filePath) {
  return IGNORE_PATTERNS.some(pattern => pattern.test(filePath));
}

function findFilesRecursive(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findFilesRecursive(filePath, fileList);
    } else if ((file.endsWith('.tsx') || file.endsWith('.ts')) && !shouldIgnoreFile(filePath)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];

  UNSAFE_PATTERNS.forEach(pattern => {
    lines.forEach((line, lineIndex) => {
      const matches = [...line.matchAll(pattern.regex)];
      matches.forEach(match => {
        // Ignorer certains cas sûrs
        const isSafe =
          line.includes('|| []') ||
          line.includes('|| {}') ||
          line.includes('?.') ||
          line.includes('Array.from') ||
          line.includes('// @ts-ignore') ||
          line.includes('// Safe:');

        if (!isSafe) {
          issues.push({
            pattern: pattern.name,
            line: lineIndex + 1,
            code: line.trim(),
            description: pattern.description
          });
        }
      });
    });
  });

  return issues;
}

function generateReport() {
  console.log('🔍 Scanning project for unsafe code patterns...\n');

  const startTime = Date.now();
  const srcDirs = ['src/pages', 'src/components', 'src/hooks', 'src/services'];
  let allFiles = [];

  srcDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      allFiles = allFiles.concat(findFilesRecursive(dir));
    }
  });

  console.log(`📁 Found ${allFiles.length} files to analyze\n`);

  const reportByFile = {};
  let totalIssues = 0;

  allFiles.forEach((file, index) => {
    if (index % 50 === 0) {
      console.log(`⏳ Progress: ${index}/${allFiles.length} files...`);
    }

    const issues = analyzeFile(file);
    if (issues.length > 0) {
      const relativePath = file.replace(/\\/g, '/').replace(/^.*\/src\//, 'src/');
      reportByFile[relativePath] = issues;
      totalIssues += issues.length;
    }
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n✅ Scan complete in ${elapsed}s`);
  console.log(`\n📊 AUDIT SUMMARY:`);
  console.log(`   Total files scanned: ${allFiles.length}`);
  console.log(`   Files with issues: ${Object.keys(reportByFile).length}`);
  console.log(`   Total issues found: ${totalIssues}\n`);

  // Generate detailed report
  console.log('━'.repeat(80));
  console.log('📋 DETAILED REPORT\n');

  Object.entries(reportByFile).forEach(([file, issues]) => {
    console.log(`## ${file}`);
    console.log(`   ⚠️  ${issues.length} issue(s) found\n`);

    issues.forEach((issue, idx) => {
      console.log(`   ${idx + 1}. Line ${issue.line}: ${issue.pattern}`);
      console.log(`      Code: ${issue.code}`);
      console.log(`      Fix:  Add null/undefined protection\n`);
    });

    console.log('');
  });

  // Save report to file
  const reportPath = 'audit-report.md';
  let markdown = `# Security Audit Report - Unsafe Code Patterns\n\n`;
  markdown += `**Generated:** ${new Date().toISOString()}\n`;
  markdown += `**Total Issues:** ${totalIssues}\n`;
  markdown += `**Files Affected:** ${Object.keys(reportByFile).length}\n\n`;
  markdown += `---\n\n`;

  Object.entries(reportByFile).forEach(([file, issues]) => {
    markdown += `## ${file}\n\n`;
    markdown += `**Issues:** ${issues.length}\n\n`;

    issues.forEach((issue, idx) => {
      markdown += `### ${idx + 1}. Line ${issue.line} - ${issue.pattern}\n\n`;
      markdown += `**Code:**\n\`\`\`typescript\n${issue.code}\n\`\`\`\n\n`;
      markdown += `**Description:** ${issue.description}\n\n`;
      markdown += `---\n\n`;
    });
  });

  fs.writeFileSync(reportPath, markdown);
  console.log(`📄 Full report saved to: ${reportPath}\n`);
}

// Run the audit
try {
  generateReport();
} catch (error) {
  console.error('❌ Error during audit:', error);
  process.exit(1);
}
