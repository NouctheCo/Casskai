# Stripe Price IDs - Référence

## 📋 Price IDs actuellement configurés

Ces Price IDs sont configurés dans `supabase/functions/create-checkout-session/index.ts` (lignes 132-139).

### Test Mode (actuellement configuré)

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

## ⚠️ À FAIRE : Vérifier et mettre à jour

### 1. Vérifier dans Stripe Dashboard

1. Allez sur [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products)
2. Pour chaque produit, vérifiez que les Price IDs correspondent

### 2. Si les Price IDs ne correspondent pas

Vous devez créer les produits et prix dans Stripe :

#### Plan Starter
- **Nom** : Starter
- **Prix mensuel** : 29€ / mois
- **Prix annuel** : 290€ / an (économie de ~17%)
- **Fonctionnalités** :
  - Jusqu'à 50 factures/mois
  - 1 utilisateur
  - Support email

#### Plan Pro
- **Nom** : Professional
- **Prix mensuel** : 79€ / mois
- **Prix annuel** : 790€ / an (économie de ~17%)
- **Fonctionnalités** :
  - Factures illimitées
  - 5 utilisateurs
  - Support prioritaire
  - API access

#### Plan Enterprise
- **Nom** : Enterprise
- **Prix mensuel** : 199€ / mois
- **Prix annuel** : 1990€ / an (économie de ~17%)
- **Fonctionnalités** :
  - Tout illimité
  - Support dédié
  - Fonctionnalités personnalisées
  - SLA garanti

### 3. Mettre à jour les Price IDs

Une fois les produits créés dans Stripe :

1. Ouvrez `supabase/functions/create-checkout-session/index.ts`
2. Remplacez les Price IDs aux lignes 132-139
3. Déployez la fonction :
   ```bash
   npx supabase functions deploy create-checkout-session
   ```

## 🔄 Migration Test → Production

Quand vous passez en production :

### Étape 1 : Créer les produits en mode Live
1. Passez en mode Live dans Stripe Dashboard
2. Recréez les mêmes produits et prix
3. Notez les nouveaux Price IDs (commencent par `price_live_`)

### Étape 2 : Mettre à jour les Price IDs
Remplacez dans `create-checkout-session/index.ts` :
```typescript
const hardcodedPrices = {
  'starter_monthly': 'price_NOUVEAU_LIVE_ID',
  'starter_yearly': 'price_NOUVEAU_LIVE_ID',
  // ... etc
};
```

### Étape 3 : Mettre à jour les clés
```bash
# Dans Supabase Edge Functions → Secrets
STRIPE_SECRET_KEY=sk_live_XXXXXXXXX  # (pas sk_test_)
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXX  # (nouveau secret du webhook live)
```

### Étape 4 : Mettre à jour le frontend
```bash
# Dans .env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXX  # (pas pk_test_)
```

## 📝 Template pour créer les produits via Stripe CLI

Si vous préférez créer les produits via CLI :

```bash
# Créer le produit Starter
stripe products create \
  --name="Starter" \
  --description="Plan de démarrage pour les petites entreprises"

# Créer le prix mensuel Starter
stripe prices create \
  --product=prod_XXXXXXXXX \
  --unit-amount=2900 \
  --currency=eur \
  --recurring[interval]=month \
  --nickname="Starter Mensuel"

# Créer le prix annuel Starter
stripe prices create \
  --product=prod_XXXXXXXXX \
  --unit-amount=29000 \
  --currency=eur \
  --recurring[interval]=year \
  --nickname="Starter Annuel"

# Répéter pour Pro et Enterprise...
```

## 🔗 Liens utiles

- [Stripe Dashboard (Test)](https://dashboard.stripe.com/test/products)
- [Stripe Dashboard (Live)](https://dashboard.stripe.com/products)
- [Documentation Stripe Products](https://stripe.com/docs/api/products)
- [Documentation Stripe Prices](https://stripe.com/docs/api/prices)
