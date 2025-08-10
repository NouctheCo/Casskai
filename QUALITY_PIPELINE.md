# 🚀 Pipeline de Qualité Professionnelle - CassKai

Cette documentation décrit la pipeline de qualité complète mise en place pour le projet CassKai, garantissant un code robuste, sécurisé et performant.

## 📋 Vue d'ensemble

La pipeline de qualité CassKai comprend :

- ✅ **Tests automatisés** (Unitaires, Intégration, E2E, Performance, Accessibilité)
- 🔄 **CI/CD multi-stage** avec GitHub Actions
- 🐳 **Builds optimisés** avec cache Docker
- 🚀 **Deployments automatiques** avec rollback
- 📊 **Monitoring** et analyse de qualité
- 🛡️ **Hooks de qualité** (pre-commit, pre-push)
- 🔄 **Mises à jour automatiques** des dépendances

## 🧪 Tests

### Tests Unitaires (Vitest)
- **Coverage minimum** : 80%
- **Configuration** : `vitest.config.ts`
- **Commandes** :
  ```bash
  npm run test              # Mode watch
  npm run test:run         # Exécution unique
  npm run test:coverage    # Avec coverage
  npm run test:ui          # Interface web
  ```

### Tests d'Intégration (Supabase)
- **Configuration** : `vitest.integration.config.ts`
- **Base de données** : PostgreSQL locale/test
- **Commandes** :
  ```bash
  npm run test:integration
  ```

### Tests E2E (Playwright)
- **Navigateurs** : Chrome, Firefox, Safari, Mobile
- **Configuration** : `playwright.config.ts`
- **Commandes** :
  ```bash
  npm run test:e2e         # Tous les tests
  npm run test:e2e:ui      # Interface interactive
  npm run test:e2e:headed  # Mode visuel
  npm run test:e2e:debug   # Mode debug
  ```

### Tests de Performance (Lighthouse)
- **Métriques** : FCP, LCP, CLS, TBT, Speed Index
- **Seuils** :
  - Performance : > 90%
  - Accessibilité : > 95%
  - Best Practices : > 90%
- **Commandes** :
  ```bash
  npm run test:performance
  ```

### Tests d'Accessibilité (axe-core)
- **Standards** : WCAG 2.1 AA
- **Intégration** : Playwright + axe-playwright
- **Commandes** :
  ```bash
  npm run test:accessibility
  ```

## 🔄 CI/CD Pipeline

### Stages du Pipeline

1. **🔍 Code Quality**
   - TypeScript check
   - ESLint
   - Prettier
   - SonarQube scan

2. **🧪 Unit Tests**
   - Tests sur Node 18 et 20
   - Coverage > 80%
   - Upload vers Codecov

3. **🔌 Integration Tests**
   - Tests avec PostgreSQL
   - Services Supabase

4. **🏗️ Build**
   - Build optimisé
   - Bundle size analysis
   - Artifacts upload

5. **🎭 E2E Tests**
   - Tests multi-navigateurs
   - Screenshots sur échec

6. **⚡ Performance Tests**
   - Lighthouse CI
   - Core Web Vitals

7. **♿ Accessibility Tests**
   - axe-core validation
   - WCAG compliance

8. **🔒 Security Scan**
   - Dependencies audit
   - CodeQL analysis
   - Snyk scan

9. **🐳 Docker Build**
   - Multi-platform
   - Layer caching

10. **🚀 Deployment**
    - Preview (PR)
    - Staging (develop)
    - Production (main)

### Déclencheurs
- **Push** : main, develop
- **Pull Request** : vers main, develop
- **Schedule** : Tests nightly

## 🐳 Docker

### Images Optimisées
- **Multi-stage build** pour réduire la taille
- **Layer caching** pour accélérer les builds
- **Security scanning** intégré

### Commandes Docker
```bash
# Development
docker-compose up

# Production
docker-compose -f docker-compose.yml --profile production up

# Tests
docker-compose -f docker-compose.yml --profile testing up test

# Monitoring
docker-compose -f docker-compose.yml --profile monitoring up
```

## 🛡️ Hooks de Qualité

### Pre-commit (Husky + lint-staged)
- **ESLint** avec auto-fix
- **Prettier** formatting
- **Type checking**
- **Tests** sur fichiers modifiés
- **Validation secrets** (.env)
- **Validation SQL** (migrations)

### Pre-push
- **Suite de tests complète**
- **Build verification**
- **E2E tests** (branches protégées)
- **Security audit**

### Commit Message (Commitlint)
- **Format** : Conventional Commits
- **Types** : feat, fix, docs, style, refactor, perf, test, chore, ci, build
- **Validation** automatique

## 📊 Analyse de Qualité

### SonarQube
- **Quality Gate** : Obligatoire
- **Coverage** : > 80%
- **Duplications** : < 3%
- **Security Hotspots** : 0
- **Configuration** : `sonar-project.properties`

### Métriques surveillées
- **Code Coverage**
- **Technical Debt**
- **Security Vulnerabilities**
- **Code Smells**
- **Duplications**
- **Cyclomatic Complexity**

## 🔄 Mises à jour Automatiques

### Renovate Bot
- **Schedule** : Lundi 6h
- **Groupement** intelligent des dépendances
- **Auto-merge** : patches et types
- **Security alerts** : traitement immédiat
- **Configuration** : `renovate.json`

### Types de mises à jour
- **Security patches** : Auto-merge immédiat
- **Minor/Patch** : Groupées par thème
- **Major** : Review manuelle requise
- **Docker images** : Sécurisées LTS uniquement

## 🚀 Déploiements

### Stratégie de Déploiement
- **Preview** : Chaque PR (Vercel)
- **Staging** : Branch develop
- **Production** : Branch main
- **Rollback** : Automatique en cas d'échec

### Monitoring Post-déploiement
- **Health checks** automatiques
- **Sentry** notifications
- **Performance** monitoring
- **Uptime** monitoring

## 📈 Monitoring et Alertes

### Sentry Integration
- **Error tracking** en temps réel
- **Performance monitoring**
- **Release tracking**
- **User feedback** collection

### Métriques Surveillées
- **Build success rate**
- **Test coverage trend**
- **Deployment frequency**
- **Time to recover**
- **Bundle size evolution**

## 🛠️ Commandes Utiles

### Développement Local
```bash
# Installation
npm install

# Démarrage
npm run dev

# Tests complets
npm run test:all

# Quality check complète
npm run lint && npm run type-check && npm run test:coverage
```

### Production
```bash
# Build
npm run build

# Preview production
npm run preview

# Docker production
docker-compose --profile production up
```

### Maintenance
```bash
# Mise à jour dépendances
npm run deps:update

# Nettoyage
npm run clean

# Audit sécurité
npm audit
```

## 🎯 Standards de Qualité

### Seuils Obligatoires
- ✅ **Tests Coverage** : > 80%
- ✅ **Performance Score** : > 90%
- ✅ **Accessibility Score** : > 95%
- ✅ **Security Vulnerabilities** : 0
- ✅ **ESLint Errors** : 0
- ✅ **TypeScript Errors** : 0

### Métriques de Performance
- ✅ **First Contentful Paint** : < 1.5s
- ✅ **Largest Contentful Paint** : < 2.5s
- ✅ **Cumulative Layout Shift** : < 0.1
- ✅ **Total Blocking Time** : < 300ms
- ✅ **Bundle Size JS** : < 500KB
- ✅ **Bundle Size CSS** : < 50KB

## 🔧 Configuration

### Variables d'environnement requises
```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# CI/CD
GITHUB_TOKEN=your_github_token
SONAR_TOKEN=your_sonar_token
CODECOV_TOKEN=your_codecov_token
VERCEL_TOKEN=your_vercel_token
SENTRY_AUTH_TOKEN=your_sentry_token
```

### Secrets GitHub requis
- `GITHUB_TOKEN`
- `SONAR_TOKEN` 
- `CODECOV_TOKEN`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `SENTRY_AUTH_TOKEN`
- `SLACK_WEBHOOK_URL`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`

## 📞 Support

Pour toute question ou problème avec la pipeline de qualité :

1. **Documentation** : Consulter ce README
2. **Issues** : Ouvrir une issue GitHub
3. **Team** : Contacter l'équipe DevOps

---

**🎉 Cette pipeline garantit un code de qualité professionnelle avec zéro configuration manuelle !**