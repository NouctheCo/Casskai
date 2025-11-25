# Tests Automatisés - Systèmes d'Archivage

## 🎯 Vue d'ensemble

Suite complète de tests automatisés E2E (End-to-End) avec **Playwright** pour tester tous les systèmes d'archivage.

### Couverture des tests

✅ **30+ tests automatisés** couvrant :
- Module Reports (génération, historique, archivage)
- Workflow complet (draft → generated → approved → archived)
- Intégration base de données
- Sécurité RLS (isolation multi-tenant)
- Performance (temps de chargement)
- UI/UX (accessibilité, états de chargement)

## 🚀 Lancer les tests

### Commandes npm simples (RECOMMANDÉ)

```bash
# Lancer tous les tests d'archivage
npm run test:archive

# Lancer avec interface visuelle
npm run test:archive:ui

# Lancer en mode headed (voir le navigateur)
npm run test:archive:headed

# Lancer avec rapport automatique
npm run test:archive:report
```

### Script PowerShell (Windows)

```powershell
# Tests sur production (casskai.app)
.\scripts\run-all-tests.ps1

# Tests en local (localhost:5173)
.\scripts\run-all-tests.ps1 -TestEnv local
```

## ⚙️ Configuration

### 1. Créer un compte de test

Créez un compte dédié sur https://casskai.app

### 2. Configurer les identifiants

Créez le fichier `.env.test.local` :

```env
PLAYWRIGHT_TEST_BASE_URL=https://casskai.app
TEST_USER_EMAIL=votre-email@test.com
TEST_USER_PASSWORD=VotreMotDePasse123!
```

### 3. Installer Playwright

```bash
npx playwright install --with-deps chromium
```

## 📋 Tests disponibles (30 tests)

- ✅ Génération de rapports
- ✅ Workflow complet (approval/archivage)
- ✅ Filtres et recherche
- ✅ Intégration DB (références ARC-YYYY-NNNN)
- ✅ Performance (< 5s)
- ✅ Sécurité RLS
- ✅ UI/UX (accessibilité)

## 📊 Voir les résultats

```bash
# Rapport HTML interactif
npx playwright show-report
```

## 🐛 Debugging

```bash
# Mode debug
npx playwright test --debug

# Mode headed
npx playwright test --headed

# Test spécifique
npx playwright test -g "should generate a report"
```

---

**Dernière mise à jour** : 2025-11-09
