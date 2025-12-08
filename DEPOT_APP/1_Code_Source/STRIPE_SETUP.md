# Guide d'implémentation Stripe Billing - CassKai

## 📋 État actuel

### ✅ Déjà implémenté
- ✅ Tables `stripe_customers` et `invoices_stripe`
- ✅ Edge Functions : `create-checkout-session`, `stripe-webhook`, `create-portal-session`
- ✅ Services frontend : `stripeService.ts`, `stripeSubscriptionService.ts`
- ✅ Page Billing connectée avec `useSubscription()` context
- ✅ Migration SQL pour table `subscriptions` créée

### 🔧 À configurer

## Étape 1 : Appliquer la migration SQL

### Dans Supabase Dashboard

1. Allez dans **SQL Editor**
2. Copiez le contenu du fichier `supabase/migrations/20251204_create_subscriptions_table.sql`
3. Exécutez la requête
4. Vérifiez que la table `subscriptions` est créée avec succès

**Ou via CLI :**
```bash
# Se connecter au projet Supabase
npx supabase login

# Lier le projet
npx supabase link --project-ref [VOTRE_PROJECT_ID]

# Appliquer la migration
npx supabase db push
```

## Étape 2 : Configurer les secrets Supabase

### Dans Supabase Dashboard → Edge Functions → Secrets

Ajoutez les secrets suivants :

```bash
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Comment obtenir ces clés :**

1. **STRIPE_SECRET_KEY** :
   - Stripe Dashboard → Developers → API keys
   - Copiez la "Secret key" (commence par `sk_test_` en test)

2. **STRIPE_WEBHOOK_SECRET** :
   - Créé à l'étape 3 ci-dessous

## Étape 3 : Configurer le Webhook Stripe

### Dans Stripe Dashboard → Developers → Webhooks

1. Cliquez sur **Add endpoint**
2. URL du endpoint :
   ```
   https://[VOTRE_PROJECT_ID].supabase.co/functions/v1/stripe-webhook
   ```
3. Sélectionnez les événements suivants :
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

4. Cliquez sur **Add endpoint**
5. **Copiez le "Signing secret"** (commence par `whsec_`)
6. Ajoutez-le dans Supabase comme `STRIPE_WEBHOOK_SECRET`

## Étape 4 : Vérifier les Price IDs

### Les Price IDs sont déjà configurés dans l'Edge Function

Ouvrez `supabase/functions/create-checkout-session/index.ts` ligne 132-139 :

```typescript
const hardcodedPrices = {
  'starter_monthly': 'price_1S41hYR73rjyEju0EKgIBDHu',
  'starter_yearly': 'price_1S41abR73rjyEju0VG4dhoo4',
  'pro_monthly': 'price_1S41glR73rjyEju0evm9xCiz',
  'pro_yearly': 'price_1S41buR73rjyEju0CVANPm3D',
  'enterprise_monthly': 'price_1S41gHR73rjyEju0YsNBUoZb',
  'enterprise_yearly': 'price_1S41d1R73rjyEju0t6a2GBwo',
  'trial': 'price_1S82ISR73rjyEju0Dklrlubp',
};
```

**Vérifier si ces Price IDs existent dans votre compte Stripe :**

1. Allez dans Stripe Dashboard → Products
2. Pour chaque produit (Starter, Pro, Enterprise), cliquez dessus
3. Vérifiez les Price IDs et mettez à jour si nécessaire

**Si vous devez créer les produits :**
```bash
# Utilisez le script Stripe CLI ou créez-les manuellement dans le dashboard
```

## Étape 5 : Configurer les variables d'environnement frontend

### Dans le fichier `.env` ou `.env.local`

```bash
# Clé publique Stripe (commence par pk_test_ en mode test)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXX

# URL de l'API (déjà configurée normalement)
VITE_API_BASE_URL=https://casskai.app/api
```

## Étape 6 : Déployer les Edge Functions

### Via Supabase CLI

```bash
# Déployer create-checkout-session
npx supabase functions deploy create-checkout-session

# Déployer stripe-webhook
npx supabase functions deploy stripe-webhook

# Déployer create-portal-session
npx supabase functions deploy create-portal-session
```

### Via Supabase Dashboard

1. Allez dans **Edge Functions**
2. Pour chaque fonction, cliquez sur **Deploy new version**
3. Sélectionnez le fichier correspondant
4. Déployez

## Étape 7 : Tester le flux complet

### Test en mode Stripe Test

1. **Aller sur la page Billing** : `https://casskai.app/billing`

2. **Cliquer sur "Choisir Starter"** (ou un autre plan)

3. **Vous serez redirigé vers Stripe Checkout**

4. **Utiliser une carte de test :**
   ```
   Numéro : 4242 4242 4242 4242
   Date : N'importe quelle date future
   CVC : N'importe quel 3 chiffres
   ```

5. **Compléter le paiement**

6. **Vérifier que :**
   - ✅ Vous êtes redirigé vers `/billing?success=true`
   - ✅ Un message de succès s'affiche
   - ✅ L'abonnement apparaît dans la table `subscriptions`
   - ✅ Une facture apparaît dans la table `invoices_stripe`
   - ✅ Le webhook a été reçu (vérifier dans Stripe Dashboard → Webhooks)

### Test du portail client

1. **Cliquer sur "Gérer mon abonnement"**
2. **Vous serez redirigé vers le portail Stripe**
3. **Vérifier que vous pouvez :**
   - ✅ Voir vos factures
   - ✅ Mettre à jour votre carte bancaire
   - ✅ Annuler votre abonnement

## Étape 8 : Vérifications de sécurité

### RLS (Row Level Security)

La table `subscriptions` a déjà les politiques RLS :
- ✅ Les utilisateurs peuvent voir leur propre abonnement
- ✅ Le service role (webhooks) peut tout gérer

### Authentification JWT

Les Edge Functions vérifient l'authentification :
- ✅ Token JWT requis pour `create-checkout-session`
- ✅ Token JWT requis pour `create-portal-session`
- ✅ Signature Stripe requise pour `stripe-webhook`

## Étape 9 : Passer en production

### Quand vous êtes prêt pour la prod

1. **Créer les produits en mode Live dans Stripe**
2. **Mettre à jour les Price IDs dans l'Edge Function**
3. **Configurer les secrets avec les clés Live :**
   ```bash
   STRIPE_SECRET_KEY=sk_live_XXXXXXXXX
   STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXX
   ```
4. **Mettre à jour le webhook Stripe en mode Live**
5. **Mettre à jour la clé publique frontend :**
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXX
   ```

## Troubleshooting

### Erreur "No Stripe customer found"
- Vérifier que la table `stripe_customers` contient bien l'entrée pour l'utilisateur
- Vérifier les logs de `create-checkout-session`

### Webhook ne reçoit pas les événements
- Vérifier que l'URL du webhook est correcte
- Vérifier que `STRIPE_WEBHOOK_SECRET` est configuré
- Vérifier les logs dans Stripe Dashboard → Webhooks → Attempts

### Price ID not found
- Vérifier que les Price IDs dans `create-checkout-session` correspondent bien à Stripe
- Vérifier que les produits existent dans votre compte Stripe

### Abonnement non synchronisé
- Vérifier les logs du webhook
- Vérifier que la table `subscriptions` a bien les politiques RLS
- Forcer une resynchronisation en rejouant le webhook depuis Stripe Dashboard

## Commandes utiles

```bash
# Voir les logs des Edge Functions
npx supabase functions logs create-checkout-session
npx supabase functions logs stripe-webhook

# Tester localement une Edge Function
npx supabase functions serve create-checkout-session

# Vérifier la base de données
psql "postgres://[CONNECTION_STRING]" -c "SELECT * FROM subscriptions;"

# Rejouer un webhook depuis Stripe CLI
stripe trigger checkout.session.completed
```

## Support

- Documentation Stripe : https://stripe.com/docs
- Documentation Supabase : https://supabase.com/docs
- Stripe Webhook Testing : https://stripe.com/docs/webhooks/test
