<div align="center">
  <img src="public/logo.svg" alt="CassKai Logo" width="200"/>
  
  # CassKai Business Suite
  
  **Plateforme de gestion tout-en-un pour PME et indépendants**
  
  [![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/votre-username/casskai)
  [![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
  [![Status](https://img.shields.io/badge/status-Production_Ready-brightgreen.svg)](https://casskai.app)
  [![UX Score](https://img.shields.io/badge/UX_Score-9%2F10-success.svg)](UX_IMPLEMENTATION_COMPLETE.md)
  [![WCAG](https://img.shields.io/badge/WCAG-2.1_AA-blue.svg)](ACCESSIBILITY_GUIDE.md)
  
  [🌐 Site Web](https://casskai.app) · [📚 Documentation](https://docs.casskai.app) · [🎨 Design System](UX_IMPLEMENTATION_COMPLETE.md) · [🐛 Signaler un Bug](https://github.com/votre-username/casskai/issues)
</div>

---

## 🎉 CassKai v2.0 - L'Outil Extraordinaire

**CassKai®** est une solution de gestion d'entreprise moderne et complète, développée par **Noutche Conseil SAS**, conçue spécifiquement pour les PME et les indépendants francophones.

### 🆕 Nouveautés v2.0
- ✨ **Système UX complet** - Design system professionnel (Score 9/10)
- 🎯 **Feedback intelligent** - Toast notifications cohérentes (15+ helpers)
- 📱 **États vides guidés** - EmptyState avec call-to-action
- 🛡️ **Confirmations systématiques** - Protection contre suppressions accidentelles
- ✅ **Validation temps réel** - 12+ schémas Zod avec messages français
- ♿ **WCAG 2.1 AA** - Accessibilité complète (navigation clavier, screen readers)
- 📖 **Documentation exhaustive** - 2400+ lignes de guides et exemples

> **[➡️ Voir le récapitulatif complet des améliorations UX](UX_IMPLEMENTATION_COMPLETE.md)**

## 📋 À propos

### ✨ Fonctionnalités principales

- **💰 Comptabilité** - Gestion complète du plan comptable, écritures, rapports financiers
  - 🔄 **Import/Export Universel** - Compatibilité multi-pays (FEC, SYSCOHADA, IFRS, SCF, QuickBooks, Sage, Xero)
  - 🌍 **Standards Internationaux** - Support France (PCG), OHADA, Maghreb, Afrique anglophone, International
  - 🤖 **Détection Automatique** - Reconnaissance du format, séparateur, dates, montants
  - ✅ **Validation Complète** - Équilibre débit/crédit, création automatique des journaux et comptes
  - 📊 **Export Multi-Format** - FEC conforme DGFiP, SYSCOHADA, SCF, IFRS, CSV
- **📄 Facturation** - Création et suivi des factures, devis, avoirs
- **🏦 CRM** - Gestion des clients, prospects, contacts et opportunités
- **📊 Tableaux de bord** - Visualisation en temps réel de vos KPIs
- **📈 Budget & Prévisions** - Planification budgétaire et analyses prédictives
- **💳 Trésorerie** - Suivi des flux de trésorerie et rapprochements bancaires
- **📦 Stock** - Gestion des inventaires et mouvements
- **👥 RH** - Gestion simplifiée des employés et paies
- **🔐 Sécurité & Conformité** - Conforme RGPD, certifié NF525 (à venir)

## 🚀 Démarrage rapide

### Prérequis

- Node.js >= 18.0.0
- npm >= 8.0.0
- Un compte Supabase (gratuit)

### Installation

```bash
# Cloner le repository
git clone https://github.com/votre-username/casskai.git
cd casskai

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés Supabase

# Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 🛠️ Stack technique

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Radix UI + Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **État**: React Context API + localStorage
- **Charts**: Recharts
- **PDF**: jsPDF + html2canvas
- **Excel**: SheetJS (xlsx)
- **Routing**: React Router v6
- **UX System**: Toast helpers + EmptyState + ConfirmDialog + Zod validation
- **Accessibility**: WCAG 2.1 AA compliant

## 📚 Documentation

### Guides Fonctionnels

- **[🔄 Import Comptable Universel](IMPORT_COMPTABLE_UNIVERSEL.md)** - Guide complet d'import multi-pays (FEC, SYSCOHADA, IFRS, etc.)
- **[📊 Fonctionnalités Import/Export](FONCTIONNALITES_IMPORT_EXPORT.md)** - Vue d'ensemble des capacités d'import/export
- **[📐 Architecture](ARCHITECTURE.md)** - Architecture technique de la plateforme
- **[⚙️ Fonctionnalités](FONCTIONNALITES.md)** - Liste complète des fonctionnalités

### Guides UX v2.0

- **[🎯 Récapitulatif Complet](UX_IMPLEMENTATION_COMPLETE.md)** - Vue d'ensemble des améliorations UX
- **[🔔 Toast System](src/lib/TOAST_USAGE_GUIDE.md)** - 15+ fonctions de notification
- **[📭 EmptyState](src/components/ui/EMPTYSTATE_USAGE_GUIDE.md)** - 3 variantes d'états vides
- **[✅ Validation](src/lib/VALIDATION_GUIDE.md)** - 12+ schémas Zod avec react-hook-form
- **[♿ Accessibilité](ACCESSIBILITY_GUIDE.md)** - Guide WCAG 2.1 AA complet
- **[⚡ Référence Rapide](QUICK_REFERENCE_UX.md)** - Patterns essentiels

### Composants UX Disponibles

```typescript
// Toast notifications
import { toastSuccess, toastError, toastCreated, toastDeleted } from '@/lib/toast-helpers';
toastSuccess('Données enregistrées !');

// États vides
import { EmptyList, EmptySearch } from '@/components/ui';
<EmptyList icon={Users} title="Aucun employé" action={...} />

// Confirmations
import { ConfirmDeleteDialog } from '@/components/ui';
<ConfirmDeleteDialog itemName="l'employé" onConfirm={handleDelete}>
  <Button variant="destructive">Supprimer</Button>
</ConfirmDeleteDialog>

// Validation formulaires
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEmployeeSchema } from '@/lib/validation-schemas';
const form = useForm({ 
  resolver: zodResolver(createEmployeeSchema),
  mode: 'onChange' 
});
```

## 📦 Scripts disponibles

```bash
npm run dev              # Lancer en mode développement
npm run build            # Build de production optimisé
npm run build:fast       # Build rapide (dev)
npm run lint             # Vérifier le code
npm run lint:fix         # Corriger automatiquement
npm run type-check       # Vérifier les types TypeScript
npm run preview          # Prévisualiser le build
```

## 🏗️ Architecture

```
casskai/
├── public/              # Assets statiques (logos, favicons, etc.)
├── src/
│   ├── components/      # Composants React réutilisables
│   │   ├── ui/          # Composants UI de base
│   │   ├── layout/      # Layouts (Header, Sidebar, Footer)
│   │   ├── charts/      # Composants de graphiques
│   │   └── ...
│   ├── pages/           # Pages de l'application
│   ├── contexts/        # Contextes React (Auth, Entreprise, Locale, etc.)
│   ├── services/        # Services (API, exports, etc.)
│   ├── hooks/           # Hooks personnalisés
│   ├── lib/             # Utilitaires et config
│   ├── locales/         # Fichiers de traduction (i18n)
│   ├── types/           # Définitions TypeScript
│   └── supabase/        # Configuration Supabase
├── supabase/            # Migrations et Edge Functions
└── docs/                # Documentation
```

## 🔒 Sécurité

CassKai prend la sécurité très au sérieux :

- ✅ Authentification sécurisée (Supabase Auth)
- ✅ Row Level Security (RLS) sur toutes les tables
- ✅ Chiffrement des données sensibles
- ✅ Conformité RGPD
- ✅ Logs d'audit complets
- ✅ Isolation multi-tenant

Pour signaler une vulnérabilité : security@casskai.app

## 📝 Roadmap

### Version 1.0 (Beta - Décembre 2025)
- [x] Sprint 1 : Architecture & Authentification
- [x] Sprint 2 : Modules principaux (Comptabilité, Facturation, CRM)
- [x] Sprint 3 : UX/UI, Performance, SEO
- [ ] Sprint 4 : Tests E2E complets
- [ ] Sprint 5 : Documentation utilisateur

### Version 1.1 (Q1 2026)
- [ ] Certification NF525 (logiciel de caisse)
- [ ] Intégration bancaire (DSP2)
- [ ] Application mobile (React Native)
- [ ] API publique

### Version 2.0 (Q2 2026)
- [ ] IA prédictive avancée
- [ ] Automatisations complètes
- [ ] Marketplace de plugins

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez notre [Guide de Contribution](CONTRIBUTING.md) pour plus de détails.

## 📄 License

Ce projet est sous licence **MIT** - voir le fichier [LICENSE](LICENSE) pour plus de détails.

**CassKai®** est une marque déposée de **Noutche Conseil SAS** (INPI).

## 👥 Auteurs

Développé avec ❤️ par **Noutche Conseil SAS**

- 🌐 Site web : [https://casskai.app](https://casskai.app)
- 📧 Email : contact@casskai.app
- 💼 LinkedIn : [CassKai](https://linkedin.com/company/casskai)

## 🙏 Remerciements

- Supabase pour l'infrastructure backend
- Radix UI pour les composants accessibles
- Toute la communauté open-source

---

<div align="center">
  <sub>© 2025 Noutche Conseil SAS - Tous droits réservés</sub>
</div>
