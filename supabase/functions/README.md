# Supabase Edge Functions - CassKai

## 📁 Structure

```
supabase/functions/
├── create-checkout-session/    # Crée une session de paiement Stripe
│   └── index.ts
├── stripe-webhook/              # Gère les webhooks Stripe
│   └── index.ts
├── create-portal-session/       # Crée une session du portail client
│   └── index.ts
├── ai-assistant/                # 🤖 Assistant IA conversationnel
│   └── index.ts
├── ai-kpi-analysis/             # 📊 Analyse IA des KPI financiers
│   └── index.ts
├── ai-dashboard-analysis/       # 📈 Analyse IA du tableau de bord
│   └── index.ts
├── ai-report-analysis/          # 📑 Analyse IA des rapports spécialisés
│   └── index.ts
└── README.md
```

## 🤖 Edge Functions IA

### Sécurité
- ✅ **Clé OpenAI sécurisée** : Stockée dans Supabase Secrets, jamais exposée au frontend
- ✅ **Authentification requise** : Toutes les fonctions IA nécessitent un JWT valide
- ✅ **Vérification d'accès** : Contrôle que l'utilisateur a accès à la company
- ✅ **Logging** : Toutes les interactions sont loggées dans `ai_interactions`

### 1. `ai-assistant` - Assistant Conversationnel
**Modèle**: gpt-4-turbo-preview
**Usage**: Chat intelligent avec contexte entreprise

**Exemple d'appel**:
```typescript
const { data, error } = await supabase.functions.invoke('ai-assistant', {
  body: {
    query: "Comment créer une facture?",
    context_type: "invoicing",
    company_id: "uuid"
  }
});
```

### 2. `ai-kpi-analysis` - Analyse KPI
**Modèle**: gpt-4o-mini
**Usage**: Analyse approfondie des indicateurs financiers

**Exemple d'appel**:
```typescript
const { data, error } = await supabase.functions.invoke('ai-kpi-analysis', {
  body: {
    kpis: { revenues: 150000, expenses: 120000, ... },
    periodStart: "2025-01-01",
    periodEnd: "2025-03-31",
    company_id: "uuid"
  }
});
```

### 3. `ai-dashboard-analysis` - Analyse Dashboard
**Modèle**: gpt-4o
**Usage**: Analyse stratégique complète du dashboard

**Exemple d'appel**:
```typescript
const { data, error } = await supabase.functions.invoke('ai-dashboard-analysis', {
  body: {
    kpiData: { financial: {...}, liquidity: {...}, ... },
    companyName: "Ma Société",
    company_id: "uuid",
    industryType: "Services"
  }
});
```

### 4. `ai-report-analysis` - Analyse Rapports
**Modèle**: gpt-4o-mini
**Usage**: Analyse de rapports spécialisés (trésorerie, créances, etc.)

**Exemple d'appel**:
```typescript
const { data, error } = await supabase.functions.invoke('ai-report-analysis', {
  body: {
    reportType: "cashflow",
    reportData: { operatingCashFlow: 50000, ... },
    company_id: "uuid",
    periodStart: "2025-01-01",
    periodEnd: "2025-03-31"
  }
});
```

## 🚀 Déploiement

### Déployer toutes les fonctions

**Windows (PowerShell) :**
```powershell
.\deploy-edge-functions.ps1
```

**Linux/Mac (Bash) :**
```bash
chmod +x deploy-edge-functions.sh
./deploy-edge-functions.sh
```

### Déployer une fonction spécifique

```bash
npx supabase functions deploy create-checkout-session
npx supabase functions deploy stripe-webhook
npx supabase functions deploy create-portal-session
```

## 📋 Fonctions disponibles

### 1. create-checkout-session

**Description** : Crée une session de checkout Stripe pour souscrire à un abonnement

**Endpoint** : `POST /functions/v1/create-checkout-session`

**Authentification** : JWT Bearer token requis

**Body** :
```json
{
  "planId": "starter_monthly",
  "userId": "uuid"
}
```

**Response** :
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/pay/cs_test_...",
  "success": true
}
```

**Utilisé par** :
- `stripeService.ts` → `createCheckoutSession()`
- `BillingPage.tsx` → Boutons "Choisir ce plan"

---

### 2. stripe-webhook

**Description** : Reçoit et traite les événements webhook de Stripe

**Endpoint** : `POST /functions/v1/stripe-webhook`

**Authentification** : Signature Stripe requise (header `stripe-signature`)

**Événements gérés** :
- ✅ `checkout.session.completed` - Abonnement créé
- ✅ `customer.subscription.created` - Synchronisation initiale
- ✅ `customer.subscription.updated` - Mise à jour d'abonnement
- ✅ `customer.subscription.deleted` - Annulation
- ✅ `invoice.payment_succeeded` - Paiement réussi
- ✅ `invoice.payment_failed` - Paiement échoué

**Actions** :
- Crée/met à jour la table `subscriptions`
- Crée/met à jour la table `invoices_stripe`
- Synchronise le statut de l'abonnement

**Configuration** :
1. Créer le webhook dans Stripe Dashboard
2. URL: `https://[PROJECT_ID].supabase.co/functions/v1/stripe-webhook`
3. Copier le signing secret dans `STRIPE_WEBHOOK_SECRET`

---

### 3. create-portal-session

**Description** : Crée une session du portail client Stripe pour gérer l'abonnement

**Endpoint** : `POST /functions/v1/create-portal-session`

**Authentification** : JWT Bearer token requis

**Body** : Aucun (le user_id est extrait du JWT)

**Response** :
```json
{
  "url": "https://billing.stripe.com/session/...",
  "success": true
}
```

**Utilisé par** :
- `stripeService.ts` → `createBillingPortalSession()`
- `BillingPage.tsx` → Bouton "Gérer mon abonnement"

**Fonctionnalités du portail** :
- Voir et télécharger les factures
- Mettre à jour la carte bancaire
- Annuler l'abonnement
- Voir l'historique des paiements

## 🔐 Secrets requis

Configurez dans Supabase Dashboard → Edge Functions → Secrets :

```bash
# Clé secrète Stripe (sk_test_ en test, sk_live_ en prod)
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXX

# Secret du webhook Stripe (whsec_XXXXXXXXXXXXXXXXXXXXXXXXXX)
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXXXX
```

## 🧪 Test local

### Démarrer le serveur local

```bash
npx supabase functions serve create-checkout-session
```

### Tester avec curl

```bash
# Test create-checkout-session
curl -X POST http://localhost:54321/functions/v1/create-checkout-session \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planId": "starter_monthly", "userId": "uuid"}'

# Test stripe-webhook (avec Stripe CLI)
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
stripe trigger checkout.session.completed
```

## 📊 Logs

### Voir les logs en temps réel

```bash
npx supabase functions logs create-checkout-session --follow
npx supabase functions logs stripe-webhook --follow
npx supabase functions logs create-portal-session --follow
```

### Voir les derniers logs

```bash
npx supabase functions logs create-checkout-session --limit 50
```

## 🔍 Debugging

### Erreurs communes

#### 1. "Missing authorization header"
- **Cause** : Le token JWT n'est pas envoyé
- **Solution** : Vérifier que `Authorization: Bearer TOKEN` est dans les headers

#### 2. "Webhook signature verification failed"
- **Cause** : Le secret webhook ne correspond pas
- **Solution** : Vérifier que `STRIPE_WEBHOOK_SECRET` est correct

#### 3. "No Stripe customer found"
- **Cause** : L'utilisateur n'a pas encore de client Stripe
- **Solution** : Le client sera créé automatiquement lors du premier checkout

#### 4. "Price ID not found"
- **Cause** : Les Price IDs ne correspondent pas à votre compte Stripe
- **Solution** : Mettre à jour les Price IDs dans `create-checkout-session/index.ts`

## 📚 Documentation

- [Guide d'installation complet](../../STRIPE_SETUP.md)
- [Référence des Price IDs](../../STRIPE_PRICE_IDS.md)
- [Documentation Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Documentation Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Documentation Stripe Checkout](https://stripe.com/docs/payments/checkout)

## 🛠️ Maintenance

### Mettre à jour une fonction

1. Modifier le fichier `index.ts`
2. Déployer :
   ```bash
   npx supabase functions deploy [nom-fonction]
   ```

### Rollback

```bash
# Voir l'historique
npx supabase functions list

# Déployer une version précédente
npx supabase functions deploy [nom-fonction] --version [version-id]
```

### Monitoring

- **Supabase Dashboard** → Edge Functions → [Fonction] → Logs
- **Stripe Dashboard** → Developers → Webhooks → Attempts
- **Sentry/CloudWatch** (si configuré)

## 🔗 Liens utiles

- [Supabase Project Dashboard](https://supabase.com/dashboard/project/_)
- [Stripe Dashboard (Test)](https://dashboard.stripe.com/test)
- [Stripe Dashboard (Live)](https://dashboard.stripe.com)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
