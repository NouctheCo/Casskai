# Guide de Gestion des Dépendances

## Vue d'ensemble

Ce document détaille la stratégie de gestion des dépendances mise en place pour le projet Casskai, incluant les processus de mise à jour, l'audit de sécurité, et les bonnes pratiques.

## État Actuel des Dépendances

### Dépendances Principales (Production)

| Package | Version Actuelle | Dernière Version | Statut |
|---------|------------------|------------------|---------|
| `react` | 18.3.1 | 19.1.1 | ⚠️ Mise à jour majeure disponible |
| `react-dom` | 18.3.1 | 19.1.1 | ⚠️ Mise à jour majeure disponible |
| `react-router-dom` | 6.30.1 | 7.8.1 | ⚠️ Mise à jour majeure disponible |
| `tailwindcss` | 3.4.17 | 4.1.12 | ⚠️ Mise à jour majeure disponible |
| `lucide-react` | 0.539.0 | Latest | ✅ À jour |
| `framer-motion` | 12.23.12 | Latest | ✅ À jour |
| `i18next` | 25.3.6 | Latest | ✅ À jour |
| `recharts` | 3.1.2 | Latest | ✅ À jour |

### Dépendances de Développement

| Package | Version Actuelle | Dernière Version | Statut |
|---------|------------------|------------------|---------|
| `@vitejs/plugin-react` | 5.0.0 | Latest | ✅ À jour |
| `@types/node` | 24.3.0 | Latest | ✅ À jour |
| `typescript` | 5.x | Latest | ✅ À jour |
| `vitest` | Latest | Latest | ✅ À jour |

## Stratégie de Mise à Jour

### 1. Classification des Dépendances

#### 🟢 Sûres (Auto-update)
Dépendances avec excellente compatibilité descendante:
```json
{
  "safe-dependencies": [
    "lucide-react",
    "tailwind-merge",
    "date-fns", 
    "framer-motion",
    "@hookform/resolvers",
    "web-vitals"
  ]
}
```

#### 🟡 Modérées (Tests requis)
Dépendances nécessitant validation:
```json
{
  "moderate-dependencies": [
    "i18next",
    "recharts",
    "@vitejs/plugin-react",
    "@types/node",
    "react-day-picker"
  ]
}
```

#### 🔴 Critiques (Migration planning required)
Dépendances avec changements majeurs:
```json
{
  "critical-dependencies": [
    "react",
    "react-dom", 
    "react-router-dom",
    "tailwindcss",
    "zod",
    "typescript"
  ]
}
```

### 2. Processus de Mise à Jour

#### Phase 1: Audit et Planification
```bash
# 1. Audit complet
npm audit                # Vérifier vulnérabilités
npm outdated            # Voir mises à jour disponibles
npx depcheck           # Détecter dépendances inutilisées

# 2. Analyse d'impact
npm ls --depth=0       # Lister dépendances directes
npm ls package-name    # Vérifier qui dépend de quoi
```

#### Phase 2: Mise à Jour Progressive
```bash
# 1. Dépendances sûres (groupe)
npm install lucide-react@latest tailwind-merge@latest framer-motion@latest

# 2. Test après chaque groupe
npm run build
npm run test
npm run lint

# 3. Dépendances modérées (une par une)
npm install recharts@latest
npm run build && npm run test

# 4. Dépendances critiques (avec branch dédiée)
git checkout -b upgrade/react-19
npm install react@latest react-dom@latest
# Tests approfondis + migration si nécessaire
```

#### Phase 3: Validation
```bash
# Suite complète de tests
npm run test           # Tests unitaires
npm run build          # Compilation production
npm run lint           # Qualité code
npm run type-check     # Vérification TypeScript

# Test de performance
npm run build:analyze  # Analyse bundle
npm run perf:audit     # Audit performance
```

## Scripts d'Automation

### Package.json Scripts

```json
{
  "scripts": {
    "deps:audit": "npm audit && npm outdated && npx depcheck",
    "deps:update-safe": "npm update && npm install lucide-react@latest tailwind-merge@latest framer-motion@latest",
    "deps:update-moderate": "npm install recharts@latest i18next@latest",
    "deps:check-security": "npm audit --audit-level moderate",
    "deps:clean": "rm -rf node_modules package-lock.json && npm install",
    "deps:dedupe": "npm dedupe"
  }
}
```

### Automated Dependency Check

```javascript
// scripts/check-dependencies.js
const { execSync } = require('child_process');
const fs = require('fs');

function checkOutdatedDependencies() {
  try {
    const result = execSync('npm outdated --json', { encoding: 'utf8' });
    const outdated = JSON.parse(result);
    
    const critical = [];
    const moderate = [];
    const safe = [];
    
    Object.entries(outdated).forEach(([name, info]) => {
      const currentMajor = parseInt(info.current.split('.')[0]);
      const latestMajor = parseInt(info.latest.split('.')[0]);
      
      if (latestMajor > currentMajor) {
        if (['react', 'react-dom', 'tailwindcss'].includes(name)) {
          critical.push({ name, ...info });
        } else {
          moderate.push({ name, ...info });
        }
      } else {
        safe.push({ name, ...info });
      }
    });
    
    console.log('🔴 Critical Updates:', critical.length);
    console.log('🟡 Moderate Updates:', moderate.length);  
    console.log('🟢 Safe Updates:', safe.length);
    
    return { critical, moderate, safe };
  } catch (error) {
    console.log('✅ All dependencies up to date');
    return { critical: [], moderate: [], safe: [] };
  }
}

checkOutdatedDependencies();
```

## Gestion des Mises à Jour Critiques

### React 18 → 19 Migration

#### Changements majeurs à prévoir:
1. **Concurrent Features**: Nouvelles APIs pour le rendu concurrent
2. **StrictMode**: Comportements modifiés en développement  
3. **Suspense**: Nouvelles capacités de suspension
4. **Server Components**: Support amélioré (si applicable)

#### Plan de migration:
```bash
# 1. Créer branche dédiée
git checkout -b upgrade/react-19

# 2. Mise à jour TypeScript types d'abord
npm install @types/react@latest @types/react-dom@latest

# 3. Mise à jour React
npm install react@19 react-dom@19

# 4. Tests et corrections
npm run test
npm run build
```

#### Code à vérifier:
```typescript
// Vérifier les patterns deprecated
// - ReactDOM.render -> createRoot
// - Événements SyntheticEvent modifiés
// - useEffect cleanup plus strict
```

### React Router 6 → 7 Migration

#### Changements attendus:
1. **Data APIs**: Nouvelles APIs de chargement de données
2. **Route modules**: Système de modules de route
3. **Type safety**: Amélioration du typage des routes

```typescript
// Migration des routes
// v6
const router = createBrowserRouter([
  { path: "/", element: <Home /> }
]);

// v7 (anticipé)
const router = createBrowserRouter([
  { 
    path: "/", 
    Component: Home,
    loader: homeLoader 
  }
]);
```

### Tailwind CSS 3 → 4 Migration

#### Préparation:
```bash
# Vérifier la compatibilité PostCSS
npx tailwindcss-upgrade-tool

# Configuration mise à jour
# tailwind.config.js modifications attendues
```

## Monitoring et Alertes

### GitHub Actions Workflow

```yaml
# .github/workflows/dependency-check.yml
name: Dependency Check
on:
  schedule:
    - cron: '0 9 * * 1'  # Chaque lundi 9h
  workflow_dispatch:

jobs:
  dependency-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        
      - name: Install dependencies
        run: npm ci
        
      - name: Security audit
        run: npm audit --audit-level moderate
        
      - name: Check outdated packages
        run: |
          npm outdated || true
          node scripts/check-dependencies.js
          
      - name: Create issue if critical updates
        if: steps.check.outputs.has-critical == 'true'
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: 'Critical dependency updates available',
              body: 'Automated dependency check found critical updates that require attention.'
            })
```

### Renovate Configuration

```json
// renovate.json
{
  "extends": ["config:base"],
  "schedule": ["before 10am on monday"],
  "packageRules": [
    {
      "matchPackagePatterns": ["react", "tailwindcss"],
      "major": { "enabled": false },
      "minor": { "enabled": false }
    },
    {
      "matchPackagePatterns": ["lucide-react", "framer-motion"],
      "automerge": true
    }
  ],
  "lockFileMaintenance": {
    "enabled": true,
    "schedule": ["before 5am on monday"]
  }
}
```

## Sécurité des Dépendances

### Audit Régulier

```bash
# Audit hebdomadaire recommandé
npm audit                           # Vérification complète
npm audit --audit-level moderate   # Seulement modéré et plus
npm audit fix                       # Corrections automatiques
npm audit fix --force              # Force les corrections (attention!)
```

### Whitelist de Dépendances

```json
// scripts/allowed-dependencies.json
{
  "production": {
    "ui": ["react", "react-dom", "framer-motion", "lucide-react"],
    "routing": ["react-router-dom"],
    "forms": ["react-hook-form", "@hookform/resolvers"],
    "styling": ["tailwindcss", "tailwind-merge", "clsx"],
    "data": ["@supabase/supabase-js", "recharts"],
    "utils": ["date-fns", "lodash", "i18next"]
  },
  "development": {
    "build": ["vite", "@vitejs/plugin-react"],
    "testing": ["vitest", "@testing-library/react"],
    "types": ["typescript", "@types/react"],
    "linting": ["eslint", "@typescript-eslint"]
  },
  "blocked": [
    "moment",      // Utiliser date-fns
    "jquery",      // Non compatible React
    "lodash-es"    // Utiliser lodash standard
  ]
}
```

### Script de Validation

```javascript
// scripts/validate-dependencies.js
const packageJson = require('../package.json');
const allowedDeps = require('./allowed-dependencies.json');

function validateDependencies() {
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };
  
  const unauthorized = [];
  const blocked = [];
  
  Object.keys(allDeps).forEach(dep => {
    if (allowedDeps.blocked.includes(dep)) {
      blocked.push(dep);
    }
    
    const isAllowed = Object.values(allowedDeps.production)
      .flat()
      .concat(Object.values(allowedDeps.development).flat())
      .includes(dep);
      
    if (!isAllowed && !dep.startsWith('@types/')) {
      unauthorized.push(dep);
    }
  });
  
  if (blocked.length > 0) {
    console.error('🚫 Blocked dependencies found:', blocked);
    process.exit(1);
  }
  
  if (unauthorized.length > 0) {
    console.warn('⚠️ Unauthorized dependencies:', unauthorized);
    // Avertissement seulement, pas d'erreur
  }
  
  console.log('✅ Dependencies validation passed');
}

validateDependencies();
```

## Bonnes Pratiques

### 1. Version Pinning Strategy

```json
{
  "dependencies": {
    "react": "18.3.1",                    // Pin exact pour stabilité
    "lucide-react": "^0.539.0",          // Caret pour patches/minor
    "date-fns": "~4.1.0"                 // Tilde pour patches seulement
  },
  "devDependencies": {
    "typescript": "^5.0.0",              // Caret OK pour dev tools
    "@types/react": "^18.3.0"            // Caret pour types
  }
}
```

### 2. Lock File Management

```bash
# Bonnes pratiques package-lock.json
npm ci                    # Utiliser en CI/CD (pas npm install)
npm install --package-lock-only  # Régénérer lock sans node_modules
npm ls --depth=0          # Vérifier arbre de dépendances
```

### 3. Bundle Analysis

```bash
# Analyse d'impact après mise à jour
npm run build:analyze    # Voir impact sur bundle size
npm run build -- --mode=production --minify=false  # Debug mode
```

## Troubleshooting

### Conflits de Dépendances

```bash
# Résolution des conflits peer dependencies
npm ls                   # Identifier les conflits
npm install --legacy-peer-deps  # Solution temporaire
npm dedupe               # Déduplication
rm -rf node_modules && npm install  # Reset complet
```

### Performance après Mise à jour

```bash
# Check performance impact
npm run build:analyze
npm run perf:audit
npx bundlephobia <package-name>  # Check size impact
```

### Rollback Strategy

```bash
# Rollback en cas de problème
git checkout package.json package-lock.json
npm ci
npm run build && npm run test
```

## Métriques de Suivi

### KPIs Dependency Management
- **Security Vulnerabilities**: 0 high/critical
- **Outdated Major Versions**: < 5 packages  
- **Bundle Size Impact**: < 5% per update
- **Update Frequency**: Weekly safe updates, Monthly moderate, Quarterly critical

### Reporting Mensuel
```bash
# Générer rapport dépendances
npm outdated > reports/dependencies-$(date +%Y%m).txt
npm audit --json > reports/security-$(date +%Y%m).json
npm ls --json --depth=0 > reports/tree-$(date +%Y%m).json
```

Cette stratégie de gestion des dépendances garantit la stabilité, la sécurité et la performance du projet Casskai tout en permettant l'évolution technologique contrôlée.