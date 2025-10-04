# CassKai 🚀

**La plateforme de gestion financière tout-en-un pour PME et indépendants**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/votre-username/casskai)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)](https://www.typescriptlang.org)

> Plateforme ERP moderne avec tableau de bord unique pour la facturation, la comptabilité, l'analyse de flux de trésorerie et l'automatisation de processus.

🌐 **Production**: [https://casskai.app](https://casskai.app)

---

## ✨ Fonctionnalités Principales

### 📊 Tableau de Bord Intelligent
- Vue consolidée du chiffre d'affaires, dépenses et indicateurs prévisionnels
- Widgets personnalisables par module
- Analytics en temps réel avec graphiques interactifs
- KPIs financiers et opérationnels

### 💰 Gestion Financière Complète
- **Comptabilité**: Plan comptable international (FR, BE, LU, CH, CA, US, UK)
- **Facturation**: Devis, factures, avoirs avec templates personnalisables
- **Paiements**: Intégration Stripe pour abonnements et paiements récurrents
- **Réconciliation bancaire**: Automatique avec ML/règles intelligentes
- **Rapports**: Bilan, compte de résultat, flux de trésorerie (export PDF/Excel)

### 🔄 Automatisation
- Workflows configurables (onboarding, relances, notifications)
- Intégration N8N pour automatisations avancées
- Edge Functions Supabase pour logique métier serverless
- Webhooks Stripe synchronisés

### 🌍 International & Multi-entreprise
- Support multilingue (FR, EN) avec i18next
- Multi-devises avec conversion automatique
- Plans comptables adaptés par pays
- Gestion multi-entreprises par utilisateur

### 👥 Modules Métier
- **CRM**: Gestion clients, opportunités, pipeline commercial
- **RH**: Employés, congés, notes de frais, pointage
- **Inventaire**: Stock, mouvements, alertes de réapprovisionnement
- **Projets**: Gestion de projets, tâches, time tracking, facturation
- **Third Parties**: Clients, fournisseurs, partenaires unifiés

### 🔒 Sécurité & Conformité
- Authentification Supabase (email, OAuth, MFA)
- Row Level Security (RLS) sur toutes les données
- Secrets management avec rotation automatique
- Audit logs et traçabilité
- RGPD compliant

---

## 🏗️ Architecture Technique

### Stack Frontend
- **Framework**: React 18 + TypeScript 5.x
- **Build**: Vite (ultra-rapide HMR)
- **Styling**: TailwindCSS + Radix UI
- **State**: React Context + Custom Hooks
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts + D3.js
- **i18n**: i18next

### Stack Backend
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (JWT)
- **Serverless**: Supabase Edge Functions (Deno)
- **API**: REST + RPC Functions
- **Storage**: Supabase Storage (documents, exports)
- **Real-time**: Supabase Realtime (websockets)

### Services Tiers
- **Paiements**: Stripe (checkout, abonnements, webhooks)
- **Automatisation**: N8N (workflows)
- **AI** (optionnel): OpenAI GPT-4 pour analyses prédictives
- **Email** (optionnel): SendGrid/Resend

### Infrastructure
- **Hosting**: VPS Hostinger (89.116.111.88)
- **Web Server**: Nginx + PM2
- **Proxy**: Traefik (Docker) pour HTTPS/SSL
- **CI/CD**: Scripts automatisés (PowerShell + Bash)
- **Monitoring**: Logs PM2 + Supabase Dashboard

---

## 🚀 Démarrage Rapide

### Prérequis

- **Node.js** ≥ 18.0.0 et **npm** ≥ 8.0.0
- **Supabase CLI**: `npm install -g supabase`
- Compte [Supabase](https://supabase.com) (projet configuré)
- Compte [Stripe](https://stripe.com) (clés API)

### Installation

```bash
# 1. Cloner le repository
git clone https://github.com/votre-username/casskai.git
cd casskai

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés Supabase et Stripe

# 4. Lancer en développement
npm run dev
```

L'application sera accessible sur [http://localhost:5173](http://localhost:5173)

### Configuration Minimale

Dans `.env` :

```bash
# Supabase
VITE_SUPABASE_URL=https://[votre-projet].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Stripe
VITE_STRIPE_PUBLIC_KEY=pk_test_...

# Application
VITE_APP_URL=http://localhost:5173
```

⚠️ **IMPORTANT**: Ne JAMAIS committer les secrets dans Git. Voir [docs/security/SECURITY_CONFIGURATION_GUIDE.md](docs/security/SECURITY_CONFIGURATION_GUIDE.md)

---

## 📚 Documentation

### Guides de Démarrage
- 📖 **[Guide de Déploiement](docs/deployment/DEPLOYMENT.md)** - Déployer en production (1 minute)
- 🔧 **[Configuration Supabase](docs/guides/SUPABASE_SETUP.md)** - Setup base de données
- 💳 **[Intégration Stripe](docs/deployment/STRIPE_INTEGRATION.md)** - Paiements et abonnements
- 🔒 **[Sécurité](docs/security/SECURITY_CONFIGURATION_GUIDE.md)** - Secrets et bonnes pratiques

### Documentation Complète
- 📚 **[Index Documentation](docs/README.md)** - Table des matières complète

---

## 🛠️ Développement

### Commandes Disponibles

```bash
# Développement
npm run dev              # Démarrer le serveur de dev (port 5173)
npm run build            # Build de production
npm run preview          # Prévisualiser le build

# Tests
npm run type-check       # Vérification TypeScript
npm test                 # Tests unitaires (Vitest)
npm run test:e2e         # Tests E2E (Playwright)
npm run lint             # Linting ESLint

# Déploiement
npm run deploy           # Déploiement complet VPS (build + deploy)
./deploy-vps.ps1         # Windows PowerShell
./deploy-vps.sh          # Linux/Mac/Git Bash

# Supabase
supabase login           # Connexion Supabase CLI
supabase db push         # Appliquer migrations
supabase functions deploy [name]  # Déployer Edge Function
```

### Structure du Projet

```
casskai/
├── src/
│   ├── components/      # Composants React
│   │   ├── accounting/  # Module comptabilité
│   │   ├── invoicing/   # Module facturation
│   │   ├── dashboard/   # Dashboard
│   │   └── ui/          # Composants UI réutilisables
│   ├── pages/           # Pages (routes)
│   ├── services/        # Services métier (API calls)
│   ├── hooks/           # Custom React Hooks
│   ├── contexts/        # React Contexts (Auth, Subscription, etc.)
│   ├── types/           # Types TypeScript
│   └── utils/           # Utilitaires
├── supabase/
│   ├── migrations/      # Migrations SQL
│   └── functions/       # Edge Functions (Deno)
├── scripts/             # Scripts utilitaires
│   ├── dev/             # Scripts de développement
│   └── deploy.sh        # Script de déploiement
├── docs/                # Documentation
│   ├── deployment/      # Guides de déploiement
│   ├── guides/          # Guides utilisateur
│   ├── security/        # Sécurité
│   └── README.md        # Index documentation
└── public/              # Assets statiques
```

### Bonnes Pratiques

✅ **Toujours** exécuter `npm run type-check` avant de commit
✅ **Utiliser** les composants UI réutilisables (`src/components/ui/`)
✅ **Écrire** des tests pour les features critiques
✅ **Documenter** les nouveaux services et API
✅ **Respecter** les conventions de nommage TypeScript
✅ **Ne jamais** committer de secrets ou clés API

❌ **Éviter** les `@ts-nocheck` (dette technique)
❌ **Ne pas** créer de fichiers temporaires/test dans src/
❌ **Ne pas** dupliquer le code (DRY principle)

---

## 🚢 Déploiement

### Production (VPS)

Le déploiement en production est **entièrement automatisé** :

```bash
# Une seule commande pour tout déployer
npm run deploy
```

Cette commande :
1. ✅ Vérifie la connexion VPS
2. 🔨 Build de production (Vite)
3. 📦 Upload via SCP
4. 🔧 Configure les permissions
5. 🔄 Redémarre Nginx + PM2
6. 🧪 Teste l'application
7. 🎉 Confirme le succès

**Temps total** : ~1 minute

Voir [docs/deployment/DEPLOYMENT.md](docs/deployment/DEPLOYMENT.md) pour plus de détails.

### Edge Functions Supabase

```bash
# Déployer une fonction
supabase functions deploy create-checkout-session

# Configurer les secrets
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Voir les logs
supabase functions logs create-checkout-session --tail
```

---

## 🧪 Tests

### Tests Unitaires (Vitest)

```bash
# Lancer tous les tests
npm test

# Mode watch
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Tests E2E (Playwright)

```bash
# Installer les browsers (première fois)
npx playwright install

# Lancer les tests E2E
npm run test:e2e

# Mode UI (interactif)
npm run test:e2e -- --ui
```

### Type Checking

```bash
# Vérifier les types TypeScript
npm run type-check

# En mode watch
npm run type-check -- --watch
```

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment participer :

1. **Fork** le projet
2. **Créer** une branche (`git checkout -b feature/AmazingFeature`)
3. **Commit** les changements (`git commit -m 'Add AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrir** une Pull Request

### Guidelines

- Suivre les conventions de code existantes
- Ajouter des tests pour les nouvelles fonctionnalités
- Mettre à jour la documentation si nécessaire
- S'assurer que `npm run type-check` passe

---

## 📝 Changelog

Voir [CHANGELOG.md](CHANGELOG.md) pour l'historique des versions.

---

## 📄 License

Ce projet est sous licence MIT. Voir [LICENSE](LICENSE) pour plus de détails.

---

## 🆘 Support

### Documentation
- 📚 [Documentation Complète](docs/README.md)
- 🚀 [Guide de Déploiement](docs/deployment/DEPLOYMENT.md)
- 🔧 [Configuration Supabase](docs/guides/SUPABASE_SETUP.md)
- 💳 [Intégration Stripe](docs/deployment/STRIPE_INTEGRATION.md)

### Problèmes Courants
- **Erreur de déploiement** → [docs/deployment/DEPLOYMENT.md#troubleshooting](docs/deployment/DEPLOYMENT.md)
- **Erreur Supabase** → [docs/guides/SUPABASE_SETUP.md](docs/guides/SUPABASE_SETUP.md)
- **Erreur Stripe** → [docs/deployment/STRIPE_INTEGRATION.md#troubleshooting](docs/deployment/STRIPE_INTEGRATION.md)

### Contact
- **Production**: [https://casskai.app](https://casskai.app)
- **Issues**: [GitHub Issues](https://github.com/votre-username/casskai/issues)

---

## 🙏 Remerciements

Construit avec :
- [React](https://react.dev)
- [Vite](https://vitejs.dev)
- [Supabase](https://supabase.com)
- [Stripe](https://stripe.com)
- [TailwindCSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)

---

**Fait avec ❤️ par l'équipe CassKai**
