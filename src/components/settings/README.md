# Paramètres Avancés CassKai

## Vue d'ensemble

Le système de paramètres de CassKai a été complètement refondu pour offrir une expérience utilisateur professionnelle et complète. Les paramètres sont organisés en quatre sections principales :

## 🧑‍💼 1. Profil Utilisateur

### Fonctionnalités
- **Informations personnelles** : Prénom, nom, email, téléphone
- **Informations professionnelles** : Poste, département, biographie
- **Préférences** : Fuseau horaire, langue
- **Avatar personnalisé** : Upload et gestion de photo de profil
- **Réseaux sociaux** : LinkedIn, Twitter, site web

### Intégration Supabase
```sql
-- Table user_profiles
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'Europe/Paris',
  language TEXT DEFAULT 'fr',
  job_title TEXT,
  department TEXT,
  bio TEXT,
  website TEXT,
  linkedin TEXT,
  twitter TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🏢 2. Paramètres Entreprise

### Fonctionnalités
- **Informations légales** : SIRET, forme juridique, numéro TVA
- **Coordonnées** : Adresse complète, téléphone, email, site web
- **Paramètres comptables** : Devise, exercice fiscal, méthode comptable
- **Informations sectorielles** : Secteur d'activité, nombre d'employés

### Intégration Supabase
```sql
-- Table companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  siret TEXT,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'France',
  phone TEXT,
  email TEXT,
  website TEXT,
  currency TEXT DEFAULT 'EUR',
  fiscal_year TEXT DEFAULT 'calendar',
  accounting_method TEXT DEFAULT 'accrual',
  tax_id TEXT,
  legal_form TEXT,
  activity TEXT,
  employees TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔔 3. Gestion des Notifications

### Fonctionnalités
- **Notifications email** : Transactions, rapports, factures, paiements, rappels
- **Notifications push** : Alertes temps réel dans le navigateur
- **Fréquence** : Immédiat, quotidien, hebdomadaire
- **Heures calmes** : Période sans notifications (22h-08h)
- **Résumé visuel** : Statistiques des notifications actives

### Types de notifications
- **Transactions** : Nouvelles écritures, modifications
- **Rapports** : Génération automatique, envoi programmé
- **Factures** : Création, paiement, relance
- **Paiements** : Réception, envoi, confirmation
- **Rappels** : Échéances, tâches importantes

## ⚙️ 4. Gestion des Modules

### Fonctionnalités
- **Activation/Désactivation** : Contrôle granulaire des modules
- **Statistiques** : Vue d'ensemble des modules actifs/inactifs
- **Interface intuitive** : Indicateurs visuels d'état
- **Gestion des changements** : Validation avant sauvegarde
- **Support Premium** : Marquage et gestion des modules payants

### États des modules
- ✅ **Activé** : Module fonctionnel et accessible
- ⚠️ **Modifié** : Changement en attente de sauvegarde
- ❌ **Désactivé** : Module inactif mais disponible
- ⭐ **Premium** : Module nécessitant un abonnement

## 🔧 Architecture Technique

### Structure des composants
```
src/components/settings/
├── UserProfileSettings.tsx      # Profil utilisateur
├── CompanySettings.tsx          # Paramètres entreprise
├── NotificationSettings.tsx     # Gestion notifications
├── ModuleManagementSettings.tsx # Gestion modules
├── EnhancedSettings.tsx         # Conteneur principal
└── index.ts                     # Exports
```

### Hooks et Context
- `useAuth()` : Informations utilisateur et entreprise
- `useModules()` : Gestion des modules système
- `useToast()` : Notifications utilisateur

### Validation et Sécurité
- **Permissions** : Contrôle d'accès basé sur les rôles
- **Validation** : Vérification des données côté client
- **Sécurité** : Sanitisation des inputs utilisateur
- **Audit** : Traçabilité des modifications

## 🎨 Interface Utilisateur

### Design System
- **Cards** : Organisation logique des sections
- **Tabs** : Navigation entre les différentes catégories
- **Badges** : Indicateurs d'état et de statut
- **Switches** : Contrôles on/off intuitifs
- **Loading states** : Feedback visuel des opérations

### Responsive Design
- **Mobile-first** : Optimisé pour tous les appareils
- **Grid system** : Layout adaptatif
- **Typography** : Hiérarchie claire et lisible

## 🚀 Fonctionnalités Futures

### Planifiées
- [ ] **Intégration Supabase complète** : Tables et API
- [ ] **Historique des modifications** : Audit trail
- [ ] **Export/Import** : Sauvegarde et restauration
- [ ] **Multi-tenant** : Gestion d'entreprises multiples
- [ ] **API Settings** : Configuration programmatique

### Améliorations UX
- [ ] **Recherche** : Recherche dans les paramètres
- [ ] **Raccourcis** : Actions rapides
- [ ] **Thèmes** : Personnalisation visuelle
- [ ] **Accessibility** : Conformité WCAG

## 📊 Métriques et Analytics

### Suivi utilisateur
- **Temps passé** : Durée des sessions settings
- **Actions fréquentes** : Fonctionnalités les plus utilisées
- **Taux de conversion** : Activation modules premium
- **Feedback** : Satisfaction utilisateur

### Performance
- **Temps de chargement** : Optimisation des requêtes
- **Taille bundle** : Impact sur les performances
- **Cache** : Stratégie de mise en cache

---

*Ce système de paramètres représente une évolution majeure de CassKai vers une solution enterprise complète et professionnelle.*
