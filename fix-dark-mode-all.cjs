/**
 * Script d'audit et correction automatique du mode sombre
 * Trouve et corrige tous les problèmes de visibilité en mode sombre
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns problématiques à corriger
const FIXES = [
  // Textes sans variante dark
  {
    pattern: /className="([^"]*text-gray-900(?!.*dark:).*?)"/g,
    fix: (match, classes) => `className="${classes} dark:text-white"`,
    description: 'text-gray-900 sans dark:text-white'
  },
  {
    pattern: /className="([^"]*text-gray-800(?!.*dark:).*?)"/g,
    fix: (match, classes) => `className="${classes} dark:text-gray-100"`,
    description: 'text-gray-800 sans dark:text-gray-100'
  },
  {
    pattern: /className="([^"]*text-gray-700(?!.*dark:).*?)"/g,
    fix: (match, classes) => `className="${classes} dark:text-gray-200"`,
    description: 'text-gray-700 sans dark:text-gray-200'
  },
  {
    pattern: /className="([^"]*text-gray-600(?!.*dark:).*?)"/g,
    fix: (match, classes) => `className="${classes} dark:text-gray-300"`,
    description: 'text-gray-600 sans dark:text-gray-300'
  },

  // Backgrounds sans variante dark
  {
    pattern: /className="([^"]*bg-white(?!.*dark:bg-).*?)"/g,
    fix: (match, classes) => `className="${classes} dark:bg-gray-800"`,
    description: 'bg-white sans dark:bg-gray-800'
  },
  {
    pattern: /className="([^"]*bg-gray-50(?!.*dark:bg-).*?)"/g,
    fix: (match, classes) => `className="${classes} dark:bg-gray-900\/30"`,
    description: 'bg-gray-50 sans dark:bg-gray-900/30'
  },
  {
    pattern: /className="([^"]*bg-gray-100(?!.*dark:bg-).*?)"/g,
    fix: (match, classes) => `className="${classes} dark:bg-gray-900\/50"`,
    description: 'bg-gray-100 sans dark:bg-gray-900/50'
  },
  {
    pattern: /className="([^"]*bg-blue-50(?!.*dark:bg-).*?)"/g,
    fix: (match, classes) => `className="${classes} dark:bg-blue-900\/20"`,
    description: 'bg-blue-50 sans dark:bg-blue-900/20'
  },
  {
    pattern: /className="([^"]*bg-green-50(?!.*dark:bg-).*?)"/g,
    fix: (match, classes) => `className="${classes} dark:bg-green-900\/20"`,
    description: 'bg-green-50 sans dark:bg-green-900/20'
  },
  {
    pattern: /className="([^"]*bg-amber-50(?!.*dark:bg-).*?)"/g,
    fix: (match, classes) => `className="${classes} dark:bg-amber-900\/20"`,
    description: 'bg-amber-50 sans dark:bg-amber-900/20'
  },
  {
    pattern: /className="([^"]*bg-red-50(?!.*dark:bg-).*?)"/g,
    fix: (match, classes) => `className="${classes} dark:bg-red-900\/20"`,
    description: 'bg-red-50 sans dark:bg-red-900/20'
  },

  // Borders sans variante dark
  {
    pattern: /className="([^"]*border-gray-300(?!.*dark:border-).*?)"/g,
    fix: (match, classes) => `className="${classes} dark:border-gray-600"`,
    description: 'border-gray-300 sans dark:border-gray-600'
  },
  {
    pattern: /className="([^"]*border-gray-200(?!.*dark:border-).*?)"/g,
    fix: (match, classes) => `className="${classes} dark:border-gray-700"`,
    description: 'border-gray-200 sans dark:border-gray-700'
  },

  // Textes colorés sans variante dark
  {
    pattern: /className="([^"]*text-blue-700(?!.*dark:text-).*?)"/g,
    fix: (match, classes) => `className="${classes} dark:text-blue-400"`,
    description: 'text-blue-700 sans dark:text-blue-400'
  },
  {
    pattern: /className="([^"]*text-blue-900(?!.*dark:text-).*?)"/g,
    fix: (match, classes) => `className="${classes} dark:text-blue-100"`,
    description: 'text-blue-900 sans dark:text-blue-100'
  },
  {
    pattern: /className="([^"]*text-green-700(?!.*dark:text-).*?)"/g,
    fix: (match, classes) => `className="${classes} dark:text-green-400"`,
    description: 'text-green-700 sans dark:text-green-400'
  },
  {
    pattern: /className="([^"]*text-orange-700(?!.*dark:text-).*?)"/g,
    fix: (match, classes) => `className="${classes} dark:text-orange-400"`,
    description: 'text-orange-700 sans dark:text-orange-400'
  },
  {
    pattern: /className="([^"]*text-amber-900(?!.*dark:text-).*?)"/g,
    fix: (match, classes) => `className="${classes} dark:text-amber-100"`,
    description: 'text-amber-900 sans dark:text-amber-100'
  },
  {
    pattern: /className="([^"]*text-red-600(?!.*dark:text-).*?)"/g,
    fix: (match, classes) => `className="${classes} dark:text-red-400"`,
    description: 'text-red-600 sans dark:text-red-400'
  },

  // Corrections des classes dupliquées dark
  {
    pattern: /dark:text-gray-400\s+dark:text-gray-500/g,
    fix: () => 'dark:text-gray-300',
    description: 'Classes dark dupliquées (dark:text-gray-400 dark:text-gray-500)'
  },
  {
    pattern: /dark:text-gray-500\s+dark:text-gray-300/g,
    fix: () => 'dark:text-gray-300',
    description: 'Classes dark dupliquées (dark:text-gray-500 dark:text-gray-300)'
  },
  {
    pattern: /dark:text-gray-300\s+dark:text-gray-200/g,
    fix: () => 'dark:text-gray-200',
    description: 'Classes dark dupliquées (dark:text-gray-300 dark:text-gray-200)'
  }
];

// Fichiers à scanner
const filesToScan = [
  'src/components/**/*.tsx',
  'src/pages/**/*.tsx',
  'src/hooks/**/*.tsx'
];

let totalIssues = 0;
let totalFixed = 0;
const issuesByFile = new Map();

function scanAndFix() {
  console.log('🔍 Scanning files for dark mode issues...\n');

  filesToScan.forEach(pattern => {
    const files = glob.sync(pattern, { cwd: __dirname });

    files.forEach(file => {
      const filePath = path.join(__dirname, file);
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      const fileIssues = [];

      FIXES.forEach(fix => {
        const matches = [...content.matchAll(fix.pattern)];
        if (matches.length > 0) {
          totalIssues += matches.length;
          fileIssues.push({
            description: fix.description,
            count: matches.length
          });

          // Apply fix
          content = content.replace(fix.pattern, fix.fix);
          modified = true;
          totalFixed += matches.length;
        }
      });

      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        issuesByFile.set(file, fileIssues);
      }
    });
  });

  // Generate report
  console.log('\n📊 RAPPORT D\'AUDIT ET CORRECTION MODE SOMBRE\n');
  console.log('='.repeat(60));
  console.log(`Total issues trouvés: ${totalIssues}`);
  console.log(`Total corrections appliquées: ${totalFixed}`);
  console.log(`Fichiers modifiés: ${issuesByFile.size}`);
  console.log('='.repeat(60));

  if (issuesByFile.size > 0) {
    console.log('\n📁 DÉTAILS PAR FICHIER:\n');

    issuesByFile.forEach((issues, file) => {
      console.log(`\n${file}:`);
      issues.forEach(issue => {
        console.log(`  ✓ ${issue.count}x ${issue.description}`);
      });
    });
  }

  console.log('\n✅ Audit et corrections terminés !');
  console.log('\n💡 Prochaines étapes:');
  console.log('   1. Vérifier les modifications avec: git diff');
  console.log('   2. Tester l\'application en mode sombre');
  console.log('   3. Committer les changements si tout est OK');
}

// Execute
scanAndFix();
