# Déploiement des fonctions Stripe pour CassKai

## 📋 Problème résolu

Le bouton "Choisir un plan" ne fonctionnait pas car les **Edge Functions Supabase** pour gérer les paiements Stripe n'étaient pas déployées.

## 🚀 Solution temporaire active

Le bouton fonctionne maintenant avec ces comportements :
- **Plan Gratuit** : Activation immédiate + redirection dashboard
- **Plan Pro** : Message informatif pour contacter le support
- **Plan Enterprise** : Message de contact commercial
- **Essai gratuit** : Fonctionne si les fonctions RPC sont déployées

## 🛠️ Déploiement complet des fonctions Stripe

### 1. Prérequis

```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter à Supabase
supabase login
```

### 2. Déployer les fonctions RPC PostgreSQL

Exécutez le script SQL suivant dans votre dashboard Supabase :

```sql
-- Le contenu du fichier supabase/functions/trial-management.sql
-- Créer toutes les fonctions RPC pour les essais
```

### 3. Déployer les Edge Functions

```bash
# Depuis la racine du projet
cd supabase

# Déployer la fonction de checkout Stripe
supabase functions deploy create-checkout-session --no-verify-jwt

# Configurer les variables d'environnement
supabase secrets set STRIPE_SECRET_KEY=sk_test_votre_cle_secrete_stripe
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

### 4. Variables d'environnement requises

Dans Supabase Dashboard > Settings > Edge Functions :

```bash
STRIPE_SECRET_KEY=sk_test_51RN...  # Votre clé secrète Stripe
SUPABASE_SERVICE_ROLE_KEY=eyJhb...  # Clé de service Supabase
```

### 5. Tables Supabase requises

Assurez-vous d'avoir ces tables :

```sql
-- Table des plans d'abonnement
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    billing_cycle TEXT DEFAULT 'monthly',
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des abonnements utilisateur
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id),
    plan_id TEXT NOT NULL,
    status TEXT NOT NULL, -- trialing, active, canceled, expired
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    cancel_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des clients Stripe
CREATE TABLE stripe_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);
```

### 6. Tester le déploiement

Après déploiement, testez :

1. **Essai gratuit** : Doit créer un abonnement trial de 14 jours
2. **Plan Pro** : Doit rediriger vers Stripe Checkout
3. **Plan Enterprise** : Gestion personnalisée

## 🔧 Activation du code de production

Une fois les Edge Functions déployées, remplacez dans `PricingPage.tsx` :

```typescript
// Remplacer la section "Gestion temporaire" par :
const { data, error } = await supabase.functions.invoke('create-checkout-session', {
  body: { planId, userId: user.id },
});

if (error) {
  console.error('Error creating checkout session:', error);
  alert(`Erreur lors de la création de la session: ${error.message}`);
  return;
}

const stripe = await stripePromise;
await stripe.redirectToCheckout({ sessionId: data.sessionId });
```

## ✅ Statut actuel

- ✅ **Bouton fonctionnel** : Plus d'erreurs JavaScript
- ✅ **Plans gratuits** : Fonctionnent immédiatement
- ✅ **Logs détaillés** : Debug complet dans la console
- ✅ **Messages utilisateur** : Retours clairs et professionnels
- ⏳ **Stripe complet** : Nécessite déploiement Edge Functions

## 🎯 Prochaines étapes

1. Déployer les Edge Functions sur Supabase
2. Configurer les webhooks Stripe pour les événements de paiement
3. Tester les flux complets de paiement
4. Mettre en place la gestion des essais expirés