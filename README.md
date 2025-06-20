# 🏢 CassKai - Gestion Financière

> Plateforme de gestion financière tout-en-un destinée aux PME et indépendants

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.# 🏢 CassKai - Gestion Financière

> Plateforme de gestion financière tout-en-un destinée aux PME et indépendants

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/NouctheCo/sb1-gafkau66)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.4-blue.svg)](https://typescriptlang.org/)
[![Live Demo](https://img.shields.io/badge/demo-casskai.app-success.svg)](https://casskai.app)

## ✨ Fonctionnalités

### 📊 **Tableau de Bord**
- Indicateurs clés de performance (KPI)
- Graphiques interactifs (revenus, dépenses, cash-flow)
- Échéances à venir et transactions récentes
- Vue d'ensemble financière en temps réel

### 📚 **Comptabilité Complète**
- **Plan comptable** français conforme
- **Journaux comptables** avec recherche et filtres
- **Écritures comptables** avec validation automatique
- **Import FEC** pour migration de données
- **Balance générale** et comptes de résultat

### 🏦 **Gestion Bancaire**
- Comptes bancaires multiples par société
- Synchronisation simulée des transactions
- Rapprochement bancaire automatisé
- Suivi des soldes en temps réel

### 📈 **Rapports Financiers**
- **Bilan comptable** (Actif/Passif)
- **Compte de résultat** (Produits/Charges)
- **Flux de trésorerie**
- **Balance générale** avec tous les comptes
- Export PDF/Excel (préparé)

### 🔮 **Prévisions Financières**
- Scénarios optimiste/réaliste/pessimiste
- Projections sur 5 ans
- Métriques CAGR, marge, cash cumulé
- Hypothèses visuelles et ajustables

### 👥 **Multi-entreprises & Utilisateurs**
- Gestion de plusieurs entreprises
- Système de rôles et permissions
- Invitations utilisateurs par email
- Contrôle d'accès granulaire

### 🌍 **International**
- **Multilingue** : Français, Anglais (extensible)
- **Thèmes** : Mode clair/sombre
- **Localisation** des devises et formats de date
- Interface adaptative et responsive

## 🛠️ Technologies

| Catégorie | Technologies |
|-----------|-------------|
| **Frontend** | React 18, TypeScript, Vite |
| **UI/UX** | Tailwind CSS, shadcn/ui, Framer Motion |
| **Backend** | Supabase (Auth, Database, Real-time) |
| **Graphiques** | Recharts, Chart.js |
| **Routing** | React Router Dom |
| **Forms** | React Hook Form, Zod |
| **i18n** | react-i18next |
| **Dates** | date-fns |
| **Icons** | Lucide React |

## 🚀 Installation

### Prérequis
- **Node.js** ≥ 18.0.0
- **npm** ≥ 8.0.0
- Compte **Supabase** (gratuit)

### Étapes

```bash
# 1. Cloner le repository
git clone https://github.com/NouctheCo/sb1-gafkau66.git
cd sb1-gafkau66

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env

# 4. Éditer .env avec vos clés Supabase
# VITE_SUPABASE_URL=https://votre-projet.supabase.co
# VITE_SUPABASE_ANON_KEY=votre-clé-anon

# 5. Démarrer en développement
npm run dev

# 6. Ouvrir http://localhost:5173
```

### Configuration Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Copiez l'URL et la clé anonyme dans `.env`
3. Exécutez les migrations (si disponibles) :
   ```bash
   npx supabase db push
   ```

## 📦 Scripts Disponibles

```bash
# Développement
npm run dev              # Serveur de développement
npm run preview          # Prévisualiser le build

# Build & Production
npm run build            # Build production
npm run build:staging    # Build staging

# Code Quality
npm run lint             # Linter ESLint
npm run lint:fix         # Fix automatique
npm run type-check       # Vérification TypeScript
npm run format           # Formatage Prettier

# Déploiement
npm run deploy:netlify   # Déployer sur Netlify
npm run deploy:vercel    # Déployer sur Vercel
```

## 🏗️ Structure du Projet

```
casskai/
├── 📁 public/           # Assets statiques
├── 📁 src/
│   ├── 📁 components/   # Composants réutilisables
│   │   ├── 📁 ui/       # Composants shadcn/ui
│   │   └── 📁 auth/     # Composants d'authentification
│   ├── 📁 contexts/     # Contextes React (Auth, Theme, Locale)
│   ├── 📁 hooks/        # Hooks personnalisés
│   ├── 📁 lib/          # Utilitaires et configuration
│   ├── 📁 locales/      # Fichiers de traduction (fr.json, en.json)
│   ├── 📁 pages/        # Pages de l'application
│   ├── 📁 services/     # Services API et logique métier
│   └── 📁 types/        # Types TypeScript
├── 📁 supabase/         # Configuration et migrations Supabase
├── 📄 .env.example      # Variables d'environnement
├── 📄 package.json      # Dépendances et scripts
└── 📄 README.md         # Ce fichier
```

## 🌐 Déploiement

### Netlify (Recommandé)
```bash
npm run build
# Uploader le dossier 'dist' sur Netlify
```

### Vercel
```bash
npm install -g vercel
vercel --prod
```

### Variables d'Environnement de Production
```bash
VITE_SUPABASE_URL=https://qkbgbgupmgonjydbkvdj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrYmdiZ3VwbWdvbmp5ZGJrdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMTUyMDIsImV4cCI6MjA2Mzc5MTIwMn0.5TzZrC67CalzVHFgqooARusmqboIwNq1FB9oZ56JAPc
VITE_APP_URL=https://casskai.app
```

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. **Forkez** le projet
2. Créez une **branche feature** (`git checkout -b feature/AmazingFeature`)
3. **Committez** vos changements (`git commit -m 'Add some AmazingFeature'`)
4. **Pushez** vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une **Pull Request**

## 📝 Roadmap

- [ ] **Tests unitaires** (Jest, React Testing Library)
- [ ] **Tests E2E** (Playwright)
- [ ] **PWA** (Service Worker, mode hors-ligne)
- [ ] **API mobile** (React Native)
- [ ] **Intégrations bancaires** réelles
- [ ] **OCR** pour factures
- [ ] **IA** pour catégorisation automatique

## 🐛 Signaler un Bug

Utilisez les [GitHub Issues](https://github.com/NouctheCo/sb1-gafkau66/issues) avec :
- **Description** détaillée du problème
- **Étapes** pour reproduire
- **Environnement** (OS, navigateur, version)
- **Screenshots** si applicable

## 📄 License

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👨‍💻 Auteurs

- **NouctheCo** - *Développement initial* - [GitHub](https://github.com/NouctheCo)

## 🙏 Remerciements

- [Supabase](https://supabase.com) pour la stack backend
- [shadcn/ui](https://ui.shadcn.com) pour les composants UI
- [Tailwind CSS](https://tailwindcss.com) pour le styling
- [Lucide](https://lucide.dev) pour les icônes

---

<div align="center">

**⭐ N'oubliez pas de star le projet si il vous plaît ! ⭐**

[🌐 Demo Live](https://casskai.app) • [📚 Documentation](https://casskai.app/docs) • [💬 Support](https://github.com/NouctheCo/sb1-gafkau66/discussions)

</div># Casskai
