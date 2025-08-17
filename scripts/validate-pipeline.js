#!/usr/bin/env node

/**
 * Script de validation de la pipeline de qualité
 * Vérifie que tous les outils et configurations sont en place
 */

import fs from 'fs';
import { execSync } from 'child_process';

console.log('🔍 Validation de la pipeline de qualité CassKai\n');

const checks = [
  // Configuration files
  {
    name: 'Configuration ESLint',
    type: 'file',
    path: 'eslint.config.js',
    required: true
  },
  {
    name: 'Configuration Prettier',
    type: 'file',
    path: '.prettierrc',
    required: true
  },
  {
    name: 'Configuration TypeScript',
    type: 'file',
    path: 'tsconfig.json',
    required: true
  },
  {
    name: 'Configuration Vitest',
    type: 'file',
    path: 'vitest.config.ts',
    required: true
  },
  {
    name: 'Configuration Vitest Integration',
    type: 'file',
    path: 'vitest.integration.config.ts',
    required: true
  },
  {
    name: 'Configuration Playwright',
    type: 'file',
    path: 'playwright.config.ts',
    required: true
  },
  {
    name: 'Configuration Husky pre-commit',
    type: 'file',
    path: '.husky/pre-commit',
    required: true
  },
  {
    name: 'Configuration lint-staged',
    type: 'file',
    path: '.lintstagedrc.js',
    required: true
  },
  {
    name: 'Configuration Commitlint',
    type: 'file',
    path: '.commitlintrc.js',
    required: true
  },
  {
    name: 'Configuration Docker',
    type: 'file',
    path: 'Dockerfile',
    required: true
  },
  {
    name: 'Configuration Docker Compose',
    type: 'file',
    path: 'docker-compose.yml',
    required: true
  },
  {
    name: 'Configuration GitHub Actions',
    type: 'file',
    path: '.github/workflows/ci.yml',
    required: true
  },
  {
    name: 'Configuration SonarQube',
    type: 'file',
    path: 'sonar-project.properties',
    required: true
  },
  {
    name: 'Configuration Renovate',
    type: 'file',
    path: 'renovate.json',
    required: true
  },
  
  // Test files
  {
    name: 'Tests d\'accessibilité Playwright',
    type: 'file',
    path: 'tests/e2e/accessibility.spec.ts',
    required: true
  },
  {
    name: 'Tests d\'intégration Enterprise',
    type: 'file',
    path: 'src/test/enterprise.integration.test.ts',
    required: true
  },
  {
    name: 'Setup tests intégration',
    type: 'file',
    path: 'src/test/integration-setup.ts',
    required: true
  },
  
  // Scripts
  {
    name: 'Script validation secrets',
    type: 'file',
    path: 'scripts/check-env-secrets.js',
    required: true
  },
  {
    name: 'Script validation SQL',
    type: 'file',
    path: 'scripts/validate-sql.js',
    required: true
  },
  
  // Package.json scripts
  {
    name: 'Script test:coverage',
    type: 'script',
    command: 'test:coverage',
    required: true
  },
  {
    name: 'Script test:integration',
    type: 'script',
    command: 'test:integration',
    required: true
  },
  {
    name: 'Script test:e2e',
    type: 'script',
    command: 'test:e2e',
    required: true
  },
  {
    name: 'Script test:performance',
    type: 'script',
    command: 'test:performance',
    required: true
  },
  {
    name: 'Script test:accessibility',
    type: 'script',
    command: 'test:accessibility',
    required: true
  },
  {
    name: 'Script lint',
    type: 'script',
    command: 'lint',
    required: true
  },
  {
    name: 'Script type-check',
    type: 'script',
    command: 'type-check',
    required: true
  },
  {
    name: 'Script build',
    type: 'script',
    command: 'build',
    required: true
  },
  
  // Commands availability
  {
    name: 'TypeScript compilateur',
    type: 'command',
    command: 'npx tsc --version',
    required: true
  },
  {
    name: 'ESLint',
    type: 'command',
    command: 'npx eslint --version',
    required: true
  },
  {
    name: 'Prettier',
    type: 'command',
    command: 'npx prettier --version',
    required: true
  },
  {
    name: 'Vitest',
    type: 'command',
    command: 'npx vitest --version',
    required: true
  },
  {
    name: 'Playwright',
    type: 'command',
    command: 'npx playwright --version',
    required: true
  },
  {
    name: 'Husky',
    type: 'command',
    command: 'npx husky --version',
    required: true
  },
];

let passed = 0;
let failed = 0;
let warnings = 0;

// Charger package.json pour vérifier les scripts
let packageJson = {};
try {
  packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
} catch {
  console.error('❌ Impossible de lire package.json');
  process.exit(1);
}

function checkFile(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function checkScript(scriptName) {
  return packageJson.scripts && packageJson.scripts[scriptName];
}

function checkCommand(command) {
  try {
    execSync(command, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

console.log('📋 Vérification des configurations...\n');

checks.forEach((check) => {
  let status = false;
  let statusText = '';
  
  switch (check.type) {
    case 'file':
      status = checkFile(check.path);
      statusText = status ? '✅' : '❌';
      break;
      
    case 'script':
      status = checkScript(check.command);
      statusText = status ? '✅' : '❌';
      break;
      
    case 'command':
      status = checkCommand(check.command);
      statusText = status ? '✅' : '❌';
      break;
  }
  
  if (status) {
    passed++;
    console.log(`${statusText} ${check.name}`);
  } else {
    if (check.required) {
      failed++;
      console.error(`❌ ${check.name} - MANQUANT`);
    } else {
      warnings++;
      console.warn(`⚠️  ${check.name} - Optionnel`);
    }
  }
});

// Vérifications supplémentaires
console.log('\n🔧 Vérifications additionnelles...\n');

// Vérifier les dépendances de développement importantes
const importantDevDeps = [
  '@typescript-eslint/eslint-plugin',
  '@typescript-eslint/parser',
  '@vitest/coverage-v8',
  '@playwright/test',
  'eslint',
  'prettier',
  'husky',
  'lint-staged',
  '@commitlint/cli'
];

importantDevDeps.forEach(dep => {
  const hasDepExists = packageJson.devDependencies && packageJson.devDependencies[dep];
  if (hasDepExists) {
    passed++;
    console.log(`✅ Dépendance ${dep}`);
  } else {
    failed++;
    console.error(`❌ Dépendance ${dep} - MANQUANTE`);
  }
});

// Vérifier la structure des dossiers de tests
const testDirs = [
  'src/test',
  'tests/e2e',
  'scripts'
];

testDirs.forEach(dir => {
  const exists = fs.existsSync(dir) && fs.lstatSync(dir).isDirectory();
  if (exists) {
    passed++;
    console.log(`✅ Dossier ${dir}`);
  } else {
    failed++;
    console.error(`❌ Dossier ${dir} - MANQUANT`);
  }
});

// Vérifier les variables d'environnement d'exemple
const envExample = '.env.example';
if (fs.existsSync(envExample)) {
  passed++;
  console.log(`✅ Fichier ${envExample}`);
  
  // Vérifier les variables importantes
  const envContent = fs.readFileSync(envExample, 'utf8');
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      passed++;
      console.log(`✅ Variable d'environnement ${varName}`);
    } else {
      warnings++;
      console.warn(`⚠️  Variable d'environnement ${varName} - Manquante dans .env.example`);
    }
  });
} else {
  warnings++;
  console.warn(`⚠️  Fichier ${envExample} - Recommandé`);
}

// Résumé
console.log(`\n${  '='.repeat(50)}`);
console.log('📊 RÉSUMÉ DE LA VALIDATION');
console.log('='.repeat(50));
console.log(`✅ Réussis: ${passed}`);
console.log(`❌ Échecs: ${failed}`);
console.log(`⚠️  Avertissements: ${warnings}`);
console.log(`📋 Total: ${passed + failed + warnings}`);

if (failed === 0) {
  console.log('\n🎉 EXCELLENT ! Votre pipeline de qualité est complètement configurée !');
  console.log('\n📚 Prochaines étapes recommandées :');
  console.log('   1. Configurer les secrets GitHub pour CI/CD');
  console.log('   2. Activer SonarQube sur votre projet');
  console.log('   3. Configurer Sentry pour le monitoring');
  console.log('   4. Tester la pipeline avec un commit');
  console.log('\n🚀 Votre projet est prêt pour un développement professionnel !');
} else {
  console.error('\n🚨 Configuration incomplète !');
  console.error(`   ${failed} éléments requis sont manquants.`);
  console.error('   Veuillez corriger les erreurs ci-dessus.');
  process.exit(1);
}

if (warnings > 0) {
  console.warn(`\n💡 ${warnings} éléments optionnels pourraient améliorer votre pipeline.`);
}

console.log('\n📖 Consultez QUALITY_PIPELINE.md pour plus de détails.');
console.log('🔧 Support : https://github.com/casskai/casskai/issues');