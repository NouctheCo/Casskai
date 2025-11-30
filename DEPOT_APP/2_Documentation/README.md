# CassKai - Plateforme de Gestion Financière

## Description

CassKai est une plateforme SaaS de gestion financière tout-en-un destinée aux PME et indépendants. Elle offre une suite complète de modules pour gérer tous les aspects financiers et opérationnels d'une entreprise.

## Propriétaire

- **Société** : NOUTCHE CONSEIL (SASU)
- **SIREN** : 909 672 685
- **Marque déposée** : CassKai - INPI N° 5202212
- **Siège social** : France
- **Contact** : contact@casskai.app

## Version

- **Version** : 1.0.0
- **Date de dépôt** : 30 novembre 2025
- **Statut** : Production

## Technologies

### Frontend
- **Framework** : React 18.3.1
- **Langage** : TypeScript 5.6.3
- **Build** : Vite 7.1.7
- **UI** : Tailwind CSS 3.4.17
- **State Management** : React Context API
- **Router** : React Router DOM 7.1.1
- **Charts** : Recharts 2.15.0
- **Forms** : React Hook Form 7.54.2
- **i18n** : i18next 24.2.0 (FR, EN, ES)

### Backend
- **BaaS** : Supabase
- **Database** : PostgreSQL 15
- **Authentication** : Supabase Auth (JWT)
- **Storage** : Supabase Storage
- **Edge Functions** : Deno Runtime

### Hébergement
- **VPS** : Hostinger
- **IP** : 89.116.111.88
- **Domaine** : https://casskai.app
- **SSL** : Let's Encrypt
- **Web Server** : Nginx
- **Process Manager** : PM2

### Paiements
- **Provider** : Stripe
- **Support** : Abonnements récurrents, facturation automatique

## Modules (19 modules fonctionnels)

### 1. Tableau de bord
- Vue synthétique de l'activité
- Widgets personnalisables
- KPIs en temps réel
- Graphiques interactifs

### 2. Comptabilité
- Plan comptable configurable (PCG, SYSCOHADA, IFRS)
- Journaux comptables
- Écritures automatiques
- Grand livre et balance
- Import FEC
- Export FEC pour contrôles fiscaux

### 3. Facturation
- Devis et factures
- Facturation récurrente
- Multi-devises (33 pays supportés)
- Gestion des paiements
- Relances automatiques
- Templates personnalisables

### 4. Banques & Trésorerie
- Rapprochement bancaire automatisé
- Règles de catégorisation intelligentes
- Prévisions de trésorerie
- Génération SEPA (virements)
- Support multi-comptes

### 5. Budget & Prévisions
- Budgets prévisionnels
- Suivi réel vs prévisionnel
- Scénarios multiples
- Alertes de dépassement
- Graphiques comparatifs

### 6. Fiscalité
- Calcul TVA (FR, EU, International)
- Déclarations fiscales
- Liasse fiscale
- Conformité multi-pays
- Calendrier fiscal

### 7. CRM Ventes
- Gestion des opportunités
- Pipeline de ventes (Kanban)
- Actions commerciales
- Suivi clients
- Prévisions de revenus

### 8. Contrats & RFA
- Gestion des contrats
- Calcul RFA (Reste à Facturer)
- Échéanciers
- Alertes de renouvellement

### 9. Achats
- Bons de commande
- Suivi fournisseurs
- Gestion des réceptions
- Analyse des dépenses

### 10. Stock & Inventaire
- Gestion multi-entrepôts
- Mouvements de stock
- Inventaires
- Valorisation (FIFO, LIFO, CMP)
- Alertes de réapprovisionnement

### 11. Projets
- Gestion de projets
- Suivi budgétaire par projet
- Rentabilité projet
- Affectation de ressources

### 12. Tiers
- Clients et fournisseurs unifiés
- Historique des transactions
- Documents associés
- Notes et tags

### 13. Ressources Humaines
- Dossiers employés
- Gestion des congés
- Notes de frais
- Évaluations de performance
- Objectifs et feedback
- Formation et certifications
- Génération de documents RH

### 14. Rapports financiers
- Bilan comptable
- Compte de résultat
- Tableau de flux de trésorerie
- Soldes intermédiaires de gestion (SIG)
- Tableaux de bord personnalisés
- Export PDF/Excel

### 15. Automatisation
- Workflows personnalisables
- Règles métier
- Notifications automatiques
- Intégrations API
- Templates d'automatisation

### 16. Paramètres
- Configuration entreprise
- Préférences utilisateur
- Gestion des modules
- Personnalisation de l'interface
- Thème clair/sombre

### 17. Gestion utilisateurs
- Rôles et permissions
- Multi-utilisateurs
- Audit des accès
- Invitation d'équipe

### 18. Abonnements
- Plans tarifaires (Starter, Pro, Enterprise)
- Gestion Stripe
- Facturation automatique
- Quotas et limites

### 19. RGPD & Conformité
- Export des données personnelles
- Droit à l'oubli (anonymisation)
- Consentement des cookies
- Audit logs complets
- Chiffrement AES-256

## Conformité légale

### RGPD (Règlement Général sur la Protection des Données)
- ✅ Export complet des données personnelles
- ✅ Droit à l'oubli avec anonymisation
- ✅ Gestion des consentements
- ✅ Registre des traitements
- ✅ Chiffrement des données sensibles (AES-256)
- ✅ Audit logs de tous les accès

### LCEN (Loi pour la Confiance dans l'Économie Numérique)
- ✅ Mentions légales complètes
- ✅ Conditions générales de vente
- ✅ Conditions générales d'utilisation
- ✅ Politique de confidentialité
- ✅ Politique des cookies

### Comptabilité & Fiscalité
- ✅ Normes FEC (Fichier des Écritures Comptables)
- ✅ Support PCG (Plan Comptable Général - France)
- ✅ Support SYSCOHADA (Afrique francophone)
- ✅ Support IFRS (International)
- ✅ Archivage légal (10 ans)

## Sécurité

- **Authentification** : JWT avec refresh tokens
- **Chiffrement** : HTTPS/TLS 1.3, AES-256 pour données sensibles
- **Protection** : CSRF, XSS, SQL Injection
- **Audit** : Logs complets de toutes les actions
- **Backup** : Sauvegardes automatiques quotidiennes
- **RLS** : Row Level Security sur Supabase

## Internationalisation

- **Langues supportées** : Français, Anglais, Espagnol
- **Devises** : 33 devises supportées
- **Pays** : 33 pays avec plans comptables adaptés
- **Formats** : Dates, nombres, devises localisés

## Support multi-pays

Australie, Autriche, Belgique, Brésil, Canada, Chili, Colombie, Danemark, Espagne, Finlande, France, Grèce, Hong Kong, Inde, Irlande, Italie, Japon, Luxembourg, Malaisie, Mexique, Norvège, Nouvelle-Zélande, Pays-Bas, Pologne, Portugal, Royaume-Uni, Singapour, Suède, Suisse, Thaïlande, Turquie, USA, Vietnam

## Installation

```bash
# Cloner le projet
unzip casskai-app-v1.0.0.zip
cd casskai

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés Supabase et Stripe

# Lancer en développement
npm run dev

# Build de production
npm run build

# Vérification TypeScript
npm run type-check
```

## Structure du projet

```
casskai/
├── src/
│   ├── components/     # Composants React réutilisables
│   ├── pages/          # Pages de l'application
│   ├── services/       # Services et API clients
│   ├── hooks/          # Custom React hooks
│   ├── contexts/       # React contexts
│   ├── lib/            # Utilitaires et helpers
│   ├── types/          # Types TypeScript
│   └── i18n/           # Traductions (fr, en, es)
├── public/             # Assets statiques
├── supabase/           # Migrations et fonctions backend
│   ├── migrations/     # Migrations SQL
│   └── functions/      # Edge Functions Deno
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Variables d'environnement requises

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_APP_ENV=production
VITE_API_URL=https://api.casskai.app
```

## License

© 2024-2025 NOUTCHE CONSEIL (SASU) - Tous droits réservés.

Marque déposée CassKai® - INPI N° 5202212

Ce logiciel est protégé par le droit d'auteur français et international. Toute reproduction, distribution ou utilisation non autorisée est strictement interdite.

## Audit de conformité

Un audit complet de conformité légale a été réalisé le 30 novembre 2025. Voir le fichier [LICENSE_AUDIT_REPORT.md](LICENSE_AUDIT_REPORT.md) pour les détails.

## Contact et support

- **Site web** : https://casskai.app
- **Email** : contact@casskai.app
- **Documentation** : https://casskai.app/documentation
- **Support** : https://casskai.app/support

---

**Dépôt APP - Version 1.0.0**
Date : 30 novembre 2025