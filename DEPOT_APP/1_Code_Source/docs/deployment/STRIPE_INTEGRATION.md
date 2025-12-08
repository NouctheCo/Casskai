# 💳 Guide d'Intégration Stripe - CassKai

## Vue d'Ensemble

CassKai intègre Stripe pour gérer les abonnements et paiements des utilisateurs avec trois plans :
- **Free** : Gratuit avec fonctionnalités limitées
- **Pro** : 29€/mois avec fonctionnalités avancées
- **Enterprise** : Sur mesure avec support dédié

## Architecture d'Intégration

### Composants
1. **Frontend React** : Page de pricing et checkout
2. **Supabase Edge Functions** : Backend serverless pour Stripe
3. **Stripe Webhooks** : Synchronisation des événements
4. **Base de données** : Tables `subscriptions` et `subscription_plans`

### Flux de Paiement

```
User clicks "Choisir un plan"
    ↓
Frontend → Edge Function `create-checkout-session`
    ↓
Stripe Checkout Session créée
    ↓
User redirigé vers Stripe Checkout
    ↓
Paiement effectué
    ↓
Webhook `stripe-webhook` déclenché
    ↓
Subscription créée en DB
    ↓
User redirigé vers Dashboard
```

## Configuration Initiale

### 1. Prérequis

```bash
# Installer Supabase CLI si nécessaire
npm install -g supabase

# Se connecter à Supabase
supabase login
```

### 2. Variables d'Environnement

Configurer dans `.env` et Supabase Dashboard :

```bash
# Stripe Keys
VITE_STRIPE_PUBLIC_KEY=pk_live_...           # Clé publique (frontend)
STRIPE_SECRET_KEY=sk_live_...                # Clé secrète (Edge Functions)
STRIPE_WEBHOOK_SECRET=whsec_...              # Secret webhook

# Supabase (Edge Functions)
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=eyJ...                     # Clé publique
SUPABASE_SERVICE_ROLE_KEY=eyJ...             # Clé service (serveur only)

# URLs de redirection
VITE_APP_URL=https://casskai.app             # URL de production
```

### 3. Créer les Tables de Base de Données

Exécuter dans **Supabase SQL Editor** :

```sql
-- Table des plans d'abonnement
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  interval TEXT DEFAULT 'month',
  features JSONB DEFAULT '[]'::jsonb,
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des abonnements utilisateurs
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  plan_id TEXT REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer les plans par défaut
INSERT INTO subscription_plans (id, name, price, features, stripe_price_id) VALUES
('free', 'Free', 0.00, '["1 utilisateur", "Fonctionnalités de base", "Support communautaire"]'::jsonb, NULL),
('pro', 'Pro', 29.00, '["Utilisateurs illimités", "Toutes les fonctionnalités", "Support prioritaire", "Exports avancés"]'::jsonb, 'price_1234567890'),
('enterprise', 'Enterprise', 99.00, '["Solution sur mesure", "Support dédié", "Intégrations personnalisées", "SLA garanti"]'::jsonb, 'price_0987654321')
ON CONFLICT (id) DO NOTHING;

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_company_id ON subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
```

### 4. Créer les Row Level Security (RLS) Policies

```sql
-- Activer RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent lire leurs propres abonnements
CREATE POLICY "Users can read own subscriptions"
ON subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Tout le monde peut lire les plans
CREATE POLICY "Anyone can read subscription plans"
ON subscription_plans FOR SELECT
USING (is_active = true);

-- Seul le service peut créer/modifier des abonnements
CREATE POLICY "Service role can manage subscriptions"
ON subscriptions FOR ALL
USING (auth.jwt()->>'role' = 'service_role');
```

## Déploiement des Edge Functions

### 1. Fonction `create-checkout-session`

Déployer la fonction qui crée les sessions Stripe :

```bash
supabase functions deploy create-checkout-session
```

**Configuration des secrets** :

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...
supabase secrets set VITE_APP_URL=https://casskai.app
```

### 2. Fonction `stripe-webhook`

Déployer le webhook handler :

```bash
supabase functions deploy stripe-webhook
```

**Configuration des secrets** :

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 3. Vérifier les déploiements

```bash
# Lister les fonctions déployées
supabase functions list

# Vérifier les secrets
supabase secrets list
```

## Configuration Stripe Dashboard

### 1. Créer les Produits et Prix

Dans [Stripe Dashboard](https://dashboard.stripe.com) :

1. Aller dans **Products** → **Add Product**
2. Créer le produit "CassKai Pro" :
   - Name: `CassKai Pro`
   - Price: `29.00 EUR`
   - Billing period: `Monthly`
   - Copier le `Price ID` (ex: `price_1234567890`)

3. Mettre à jour la DB avec le Price ID :
```sql
UPDATE subscription_plans
SET stripe_price_id = 'price_1234567890'
WHERE id = 'pro';
```

### 2. Configurer le Webhook

1. Aller dans **Developers** → **Webhooks** → **Add endpoint**
2. URL: `https://smtdtgrymuzwvctattmx.supabase.co/functions/v1/stripe-webhook`
3. Sélectionner les événements :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

4. Copier le **Signing secret** (whsec_...)
5. Configurer dans Supabase :
```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

## Tester l'Intégration

### Test Manual

1. **Se connecter à l'application** : https://casskai.app
2. **Aller sur la page Pricing** : `/pricing`
3. **Cliquer sur "Choisir un plan Pro"**
4. **Vérifier la redirection** vers Stripe Checkout
5. **Utiliser une carte de test** :
   - Numéro: `4242 4242 4242 4242`
   - Expiry: N'importe quelle date future
   - CVC: N'importe quel 3 chiffres
6. **Compléter le paiement**
7. **Vérifier la redirection** vers le Dashboard
8. **Vérifier en DB** :
```sql
SELECT * FROM subscriptions WHERE user_id = auth.uid();
```

### Test Stripe CLI

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe  # Mac
# ou télécharger depuis https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks en local (pour dev)
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

# Trigger test event
stripe trigger checkout.session.completed
```

### Test des Webhooks

Aller dans Stripe Dashboard → Webhooks → [votre endpoint] → **Send test webhook**

Vérifier les logs :
```bash
supabase functions logs stripe-webhook --tail
```

## Troubleshooting

### Problème: "Erreur lors de la création de la session"

**Cause**: Edge Function non déployée ou secrets manquants

**Solution**:
```bash
# Vérifier les fonctions
supabase functions list

# Redéployer
supabase functions deploy create-checkout-session

# Vérifier les secrets
supabase secrets list

# Vérifier les logs
supabase functions logs create-checkout-session --tail
```

### Problème: Webhook ne reçoit pas les événements

**Cause**: URL incorrecte ou secret webhook invalide

**Solution**:
1. Vérifier l'URL dans Stripe Dashboard
2. S'assurer que l'URL est publique et accessible
3. Vérifier le webhook secret :
```bash
supabase secrets list
```
4. Tester avec Stripe CLI :
```bash
stripe listen --forward-to [your-function-url]
```

### Problème: Abonnement non créé en DB

**Cause**: RLS policies ou webhook handler qui échoue

**Solution**:
1. Vérifier les RLS policies
2. Vérifier les logs du webhook :
```bash
supabase functions logs stripe-webhook --tail
```
3. Vérifier que SUPABASE_SERVICE_ROLE_KEY est configuré
4. Tester manuellement l'insertion :
```sql
-- En tant que service_role
INSERT INTO subscriptions (user_id, company_id, plan_id, status)
VALUES ('[user-id]', '[company-id]', 'pro', 'active');
```

### Problème: "Payment method required" lors du checkout

**Cause**: Prix non configuré dans Stripe ou ID incorrect

**Solution**:
1. Vérifier que le produit existe dans Stripe Dashboard
2. Vérifier le `stripe_price_id` en DB :
```sql
SELECT id, name, stripe_price_id FROM subscription_plans;
```
3. Mettre à jour si nécessaire :
```sql
UPDATE subscription_plans
SET stripe_price_id = 'price_XXXXXX'
WHERE id = 'pro';
```

## Monitoring et Logs

### Logs Supabase Edge Functions

```bash
# Logs en temps réel
supabase functions logs stripe-webhook --tail
supabase functions logs create-checkout-session --tail

# Logs des dernières 24h
supabase functions logs stripe-webhook --limit 100
```

### Logs Stripe Dashboard

1. Aller dans **Developers** → **Logs**
2. Filtrer par :
   - Event type: `checkout.session`, `customer.subscription`
   - Status: `succeeded`, `failed`

### Métriques à Surveiller

```sql
-- Nombre d'abonnements actifs par plan
SELECT plan_id, COUNT(*)
FROM subscriptions
WHERE status = 'active'
GROUP BY plan_id;

-- Revenue mensuel récurrent (MRR)
SELECT
  SUM(sp.price) as mrr
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.status = 'active' AND sp.interval = 'month';

-- Taux de conversion (essai → payant)
SELECT
  COUNT(CASE WHEN plan_id != 'free' THEN 1 END)::float /
  COUNT(*)::float * 100 as conversion_rate
FROM subscriptions;
```

## Sécurité

### Best Practices

✅ **Ne JAMAIS committer les secrets** dans Git
✅ **Utiliser les secrets Supabase** pour les clés sensibles
✅ **Valider la signature** des webhooks Stripe
✅ **Activer RLS** sur toutes les tables
✅ **Utiliser HTTPS** uniquement en production
✅ **Logger les erreurs** mais pas les données sensibles

### Vérification des Secrets

```bash
# S'assurer qu'aucun secret n'est dans Git
git log -p | grep -E "(sk_live|whsec_|pk_live)" && echo "⚠️ SECRETS DETECTES!" || echo "✅ Pas de secrets"

# Vérifier .gitignore
cat .gitignore | grep -E "(.env|.env.local|.env.production)"
```

## Support et Documentation

- **Stripe Documentation**: https://stripe.com/docs
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Security Guide**: `docs/security/SECURITY_CONFIGURATION_GUIDE.md`
- **Edge Functions Code**: `supabase/functions/`

---

**Pour toute question, consulter les logs Supabase et Stripe Dashboard en premier lieu.**
