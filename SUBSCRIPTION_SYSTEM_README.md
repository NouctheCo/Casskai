# Système de Gestion des Abonnements CassKai

## Vue d'ensemble

Ce système fournit une gestion complète des abonnements basée sur des plans (Starter/Pro/Enterprise) avec intégration Stripe et contrôle d'accès aux fonctionnalités.

## Architecture

### Composants Principaux

#### 1. Hook `useEnterprisePlan`
- **Fichier**: `src/hooks/useEnterprisePlan.ts`
- **Description**: Hook unifié pour gérer les plans et capacités d'une entreprise
- **Fonctionnalités**:
  - Chargement des données d'abonnement
  - Gestion des quotas avec calcul des pourcentages
  - Source unique de vérité pour l'interface

#### 2. Composants FeatureGate
- **Fichier**: `src/components/FeatureGate.tsx`
- **Composants**:
  - `FeatureGate`: Contrôle d'accès basé sur les capacités
  - `ModuleGate`: Contrôle d'accès basé sur les modules
  - `UpgradePrompt`: Incitation à la mise à niveau
  - `QuotaIndicator`: Affichage de l'usage des quotas

#### 3. Service Stripe
- **Fichier**: `src/services/stripeSubscriptionService.ts`
- **Fonctionnalités**:
  - Création de sessions de checkout
  - Gestion des abonnements
  - Accès au portail client Stripe

#### 4. Webhooks Stripe
- **Fichier**: `src/pages/api/stripe/webhooks.ts`
- **Description**: Gestionnaire de webhooks pour synchroniser les abonnements

## Configuration

### Variables d'environnement

```bash
# Stripe Configuration - TEST MODE
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
VITE_STRIPE_STARTER_PRICE_ID=prod_...
VITE_STRIPE_PRO_PRICE_ID=prod_...
VITE_STRIPE_ENTERPRISE_PRICE_ID=prod_...
```

### Fonctions Supabase Edge

Déployez les fonctions suivantes dans Supabase :

1. `create-checkout-session`
2. `create-portal-session`
3. `update-subscription`
4. `cancel-subscription`
5. `reactivate-subscription`

Utilisez le script de déploiement :
```bash
./scripts/deploy-stripe-functions.sh
```

## Utilisation

### Vérification d'accès à une fonctionnalité

```tsx
import { useEnterprisePlan } from '@/hooks/useEnterprisePlan';
import { FeatureGate } from '@/components/FeatureGate';

function MyComponent() {
  const plan = useEnterprisePlan();

  return (
    <FeatureGate
      capability="advanced_reporting"
      fallback={<UpgradePrompt feature="Rapports Avancés" currentPlan={plan.planCode} requiredPlan="pro" />}
    >
      <AdvancedReports />
    </FeatureGate>
  );
}
```

### Affichage des quotas

```tsx
import { QuotaIndicator } from '@/components/FeatureGate';

function UsageDashboard() {
  return (
    <div>
      <QuotaIndicator quotaKey="clients" showLabel size="md" />
      <QuotaIndicator quotaKey="invoices" showLabel size="md" />
    </div>
  );
}
```

### Gestion des abonnements

```tsx
import { SubscriptionManager } from '@/components/SubscriptionManager';

function SettingsPage() {
  return <SubscriptionManager />;
}
```

## Plans et Capacités

### Plans Disponibles

- **Starter**: Fonctionnalités de base
- **Pro**: Fonctionnalités avancées + API
- **Enterprise**: Toutes les fonctionnalités + support dédié

### Capacités par Plan

Voir le fichier `src/config/moduleCapabilities.ts` pour le mapping complet des capacités.

## Migration depuis l'ancien système

1. **Remplacez les anciens hooks** par `useEnterprisePlan`
2. **Utilisez FeatureGate** au lieu des vérifications manuelles
3. **Intégrez QuotaIndicator** pour l'affichage des quotas
4. **Déployez les webhooks** pour la synchronisation automatique

## Tests

### Variables de test Stripe
- Clé publique: `pk_test_...`
- Clé secrète: `sk_test_...`
- Webhook secret: `whsec_...`

### Commandes de test
```bash
# Vérification des types
npm run type-check:app

# Tests des composants
npm run test
```

## Déploiement

1. **Configurez les variables de production** dans Supabase
2. **Déployez les fonctions Edge**
3. **Configurez le webhook Stripe** vers votre endpoint de production
4. **Testez les abonnements** en mode production

## Support

Pour toute question concernant le système de gestion des abonnements, consultez :
- La documentation Stripe
- Les logs Supabase
- Les commentaires dans le code source
