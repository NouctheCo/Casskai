# 🎯 CassKai - Guide de Démarrage Rapide

**Version**: 1.0.0
**Dernière mise à jour**: 2026-01-08
**Status**: ✅ Production Ready

---

## 📁 Structure du Projet (Nettoyée le 2026-01-08)

Le projet a été nettoyé pour une meilleure lisibilité. **89% de fichiers en moins à la racine!**

### 📋 Documentation Principale
- **README.md** - Documentation générale du projet
- **CHANGELOG.md** - Historique des versions et changements
- **CLAUDE.md** - Instructions pour l'assistant Claude Code
- **LICENSE** - Licence du projet

### ⚙️ Configuration
- **package.json** - Dépendances et scripts npm
- **vite.config.ts** - Configuration Vite (build)
- **tsconfig.*.json** - Configuration TypeScript
- **tailwind.config.cjs** - Configuration Tailwind CSS
- **eslint.config.js** - Configuration ESLint
- **components.json** - Configuration shadcn/ui
- **postcss.config.js** - Configuration PostCSS
- **playwright.config.ts** - Configuration tests E2E
- **vitest.config.ts** - Configuration tests unitaires
- **cspell.config.json** - Vérification orthographique
- **sonar-project.properties** - Configuration SonarQube
- **renovate.json** - Mises à jour automatiques

### 🚀 Déploiement
- **deploy-vps.ps1** - Script de déploiement VPS (Windows)
- **deploy-backend.ps1** - Déploiement backend
- **deploy-backend.sh** - Déploiement backend (Unix)
- **docker-compose.yml** - Configuration Docker standard
- **docker-compose.traefik.yml** - Configuration avec Traefik
- **Dockerfile** - Image Docker de l'application
- **nginx.conf** - Configuration Nginx

### 📂 Dossiers Principaux
- **src/** - Code source de l'application
- **backend/** - API backend Node.js
- **supabase/** - Migrations et configuration Supabase
- **scripts/** - Scripts utilitaires
- **docs/** - Documentation utilisateur
- **public/** - Assets statiques
- **tests/** - Tests unitaires
- **e2e/** - Tests end-to-end
- **_archive/** - Documentation technique archivée (non versionnée)

### 🗄️ Archive de Documentation

**⚠️ Important** : Toute la documentation technique de développement (437 fichiers) a été déplacée vers le dossier `_archive/` qui n'est **pas versionné par Git**.

Pour explorer l'archive :
```bash
# Voir l'index de l'archive
cat _archive/DOCS_INDEX.md

# Rechercher dans l'archive
grep -r "mot-clé" _archive/
```

---

## 🚀 Commandes Essentielles

### Développement
```bash
# Installation
npm install

# Démarrage en développement
npm run dev

# Vérification TypeScript
npm run type-check

# Linting
npm run lint

# Tests unitaires
npm test

# Tests E2E
npm run test:e2e
```

### Build & Déploiement
```bash
# Build de production
npm run build

# Aperçu du build
npm run preview

# Déploiement VPS (recommandé)
.\deploy-vps.ps1

# Déploiement backend
.\deploy-backend.ps1
```

### Base de Données
```bash
# Valider les colonnes DB
npm run validate:db

# Migrations Supabase
cd supabase
supabase migration list
supabase db push
```

---

## 🎨 Architecture

### Frontend (React + Vite)
- **React 18** avec TypeScript
- **Vite** pour le build ultra-rapide
- **TanStack Query** pour la gestion d'état serveur
- **Tailwind CSS** + **shadcn/ui** pour le design
- **i18next** pour l'internationalisation (FR/EN/ES)
- **Recharts** pour les graphiques
- **Sentry** pour le monitoring d'erreurs

### Backend (Node.js + Supabase)
- **Supabase** comme backend-as-a-service
- **PostgreSQL** avec Row Level Security (RLS)
- **Edge Functions** pour la logique métier
- **Realtime** pour les mises à jour en temps réel

### Modules Métier
- 📊 **Comptabilité** - Plan comptable, écritures, rapports
- 🧾 **Facturation** - Factures clients/fournisseurs
- 🏦 **Banque** - Rapprochement bancaire, imports
- 📈 **Rapports** - Bilan, compte de résultat, tableaux de bord
- 👥 **Tiers** - Clients, fournisseurs, contacts
- 💼 **RH** - Gestion des employés, congés, paie
- 📦 **Inventaire** - Gestion des stocks
- 🤖 **Automatisation** - Workflows métier
- ⚖️ **Conformité** - RGPD, obligations fiscales

---

## 🔐 Sécurité

- ✅ Row Level Security (RLS) activé sur toutes les tables
- ✅ Authentification JWT via Supabase Auth
- ✅ Chiffrement des données sensibles
- ✅ Rate limiting via Nginx
- ✅ Headers de sécurité configurés
- ✅ Audit logs pour la traçabilité
- ✅ Logging centralisé avec Sentry

---

## 🌍 Environnements

### Développement
- URL: http://localhost:5173
- API: http://localhost:54321

### Production
- URL: https://casskai.app
- VPS: 89.116.111.88
- SSL: Let's Encrypt
- Nginx + PM2

---

## 📊 Statistiques du Nettoyage (2026-01-08)

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| **Fichiers à la racine** | 398 | 43 | **-89%** |
| **Fichiers archivés** | 0 | 437 | Documentation préservée |
| **Build réussi** | ✅ | ✅ | Aucune régression |

### Ce qui a été archivé
- ✅ Documentation technique (PHASE*, IMPLEMENTATION*, etc.)
- ✅ Scripts de migration obsolètes
- ✅ Fichiers de débogage et diagnostics
- ✅ Rapports de tests et lint
- ✅ Guides de déploiement historiques
- ✅ Fichiers SQL temporaires

### Ce qui reste à la racine
- ✅ Fichiers essentiels uniquement
- ✅ Configuration active
- ✅ Scripts de déploiement courants
- ✅ Documentation principale

---

## 📞 Support & Ressources

- **Documentation** : Voir le dossier `docs/`
- **Archive technique** : Voir `_archive/DOCS_INDEX.md`
- **Changelog** : Voir `CHANGELOG.md`
- **Configuration Claude** : Voir `CLAUDE.md`

---

## 🎯 Prochaines Étapes

1. ✅ Nettoyage de la racine du projet
2. 🚀 **Déploiement en production** via `.\deploy-vps.ps1`
3. 📝 Mise à jour de la documentation utilisateur
4. 🧪 Tests de régression complets
5. 📊 Monitoring et optimisation

---

## 🔧 Corrections Finales Appliquées

### Session 2026-01-08
- ✅ Suppression de 3 fichiers backup restants
- ✅ Ajout de fallbacks dans `invoiceJournalEntryService.ts` (lignes 81 et 104)
- ✅ Build de production vérifié et fonctionnel
- ✅ 355+ fichiers de documentation archivés
- ✅ Structure du projet simplifiée

---

## 📝 Notes de Développement

### Logger Centralisé
Le projet utilise un logger centralisé (`@/lib/logger`) :
- **Développement** : Console avec préfixes colorés
- **Production** : Sentry avec breadcrumbs
- **Performance** : Métriques de timing disponibles

### Migrations Console → Logger
- ✅ ~2200 occurrences migrées
- ✅ Seules 3 occurrences légitimes restantes (commentaires/strings)
- ✅ Aucune régression fonctionnelle

---

**Note** : Ce fichier a été mis à jour le 2026-01-08 suite au nettoyage majeur du projet. L'ancienne version (17 Décembre 2025) a été archivée dans `_archive/docs-dev/`.
