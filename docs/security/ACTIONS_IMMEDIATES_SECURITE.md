# 🚨 ACTIONS IMMÉDIATES REQUISES - SÉCURITÉ

**Date:** 2025-01-04
**Priorité:** 🔴 CRITIQUE
**Temps estimé:** 15-20 minutes

---

## ⚠️ SITUATION

Des vulnérabilités de sécurité critiques ont été identifiées et **corrigées** dans le code.
Les secrets suivants ont été **exposés publiquement** et doivent être révoqués **IMMÉDIATEMENT**.

---

## 🎯 CHECKLIST DES ACTIONS (À FAIRE MAINTENANT)

### ✅ Étape 1: Révoquer les Clés Exposées (5 min)

#### Stripe
1. Aller sur https://dashboard.stripe.com/test/apikeys
2. Trouver la clé commençant par `sk_test_51RNdfwR73rjyEju05...`
3. Cliquer sur "⋮" → "Delete" → Confirmer
4. Aller sur https://dashboard.stripe.com/test/webhooks
5. Trouver le webhook avec le secret `whsec_6NmLfU1hliTsI1Zop0p7rLeWRfDIqQrv`
6. Cliquer sur le webhook → "Delete endpoint" → Confirmer

**✓ Clés Stripe révoquées**

#### Supabase
1. Aller sur https://supabase.com/dashboard/project/smtdtgrymuzwvctattmx/settings/api
2. Dans la section "Service role key"
3. Cliquer sur "Reset" → Confirmer
4. **IMPORTANT:** Copier la nouvelle clé (elle ne sera affichée qu'une fois)

**✓ Clé Supabase régénérée**

---

### ✅ Étape 2: Configurer les Nouveaux Secrets (5 min)

#### Option A: Script Automatique (Recommandé)

**Linux/macOS:**
```bash
./scripts/configure-secrets.sh
```

**Windows:**
```powershell
.\scripts\configure-secrets.ps1
```

#### Option B: Configuration Manuelle

```bash
# 1. Se connecter à Supabase (si pas déjà fait)
supabase login

# 2. Lier le projet (si pas déjà fait)
supabase link --project-ref smtdtgrymuzwvctattmx

# 3. Obtenir une NOUVELLE clé Stripe test
# Aller sur: https://dashboard.stripe.com/test/apikeys
# Créer une nouvelle clé restricted avec permissions:
#   - Customers: Write
#   - Checkout Sessions: Write
#   - Subscriptions: Write
supabase secrets set STRIPE_SECRET_KEY=sk_test_VOTRE_NOUVELLE_CLE

# 4. URL Supabase
supabase secrets set SUPABASE_URL=https://smtdtgrymuzwvctattmx.supabase.co

# 5. Nouvelle Service Role Key (copiée à l'étape 1)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbG...VOTRE_NOUVELLE_KEY

# 6. Créer un nouveau webhook Stripe (voir étape 3) et copier le secret
# Attendre d'avoir le secret avant de l'exécuter
```

**✓ Secrets configurés**

---

### ✅ Étape 3: Créer un Nouveau Webhook Stripe (3 min)

1. Aller sur https://dashboard.stripe.com/test/webhooks
2. Cliquer sur "Add endpoint"
3. **Endpoint URL:** `https://smtdtgrymuzwvctattmx.supabase.co/functions/v1/stripe-webhook`
4. **Events to send:** Sélectionner:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Cliquer sur "Add endpoint"
6. Cliquer sur "Reveal" pour voir le signing secret (commence par `whsec_...`)
7. Copier le secret et exécuter:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_NOUVEAU_SECRET_COPIE
   ```

**✓ Webhook Stripe configuré**

---

### ✅ Étape 4: Redéployer les Edge Functions (2 min)

```bash
# Déployer la fonction webhook
supabase functions deploy stripe-webhook

# Déployer la fonction checkout
supabase functions deploy create-checkout-session
```

**Résultat attendu:**
```
Deploying stripe-webhook (project ref: smtdtgrymuzwvctattmx)
✓ Deployed successfully
Function URL: https://smtdtgrymuzwvctattmx.supabase.co/functions/v1/stripe-webhook

Deploying create-checkout-session (project ref: smtdtgrymuzwvctattmx)
✓ Deployed successfully
Function URL: https://smtdtgrymuzwvctattmx.supabase.co/functions/v1/create-checkout-session
```

**✓ Edge Functions redéployées**

---

### ✅ Étape 5: Tester la Sécurité (3 min)

#### Test 1: Webhook sans signature (doit échouer ❌)
```bash
curl -X POST https://smtdtgrymuzwvctattmx.supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -d '{"type": "test.event"}'
```

**Résultat attendu:**
```
Unauthorized: Missing webhook signature
```
Status: 401 ✅

---

#### Test 2: Checkout sans auth (doit échouer ❌)
```bash
curl -X POST https://smtdtgrymuzwvctattmx.supabase.co/functions/v1/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"planId": "pro_monthly", "userId": "test-id"}'
```

**Résultat attendu:**
```json
{"error":"Unauthorized: Missing authorization header"}
```
Status: 401 ✅

---

#### Test 3: Checkout authentifié (doit réussir ✅)

1. Ouvrir l'application: http://localhost:5174 (ou votre URL)
2. Se connecter avec un compte test
3. Aller sur `/pricing`
4. Cliquer sur "Choisir ce plan" pour le plan Pro
5. **Résultat attendu:** Redirection vers Stripe Checkout

**✓ Tests de sécurité passés**

---

### ✅ Étape 6: Auditer les Accès (2 min)

#### Logs Stripe
1. Aller sur https://dashboard.stripe.com/test/logs
2. Filtrer par date: dernières 24-48h
3. Vérifier s'il y a des activités suspectes:
   - Customers créés avec emails étranges (`test-*@example.com`)
   - Subscriptions créées sans paiement
   - Checkout sessions pour des utilisateurs inconnus

#### Logs Supabase
1. Aller sur https://supabase.com/dashboard/project/smtdtgrymuzwvctattmx/logs/edge-functions
2. Filtrer: `stripe-webhook` et `create-checkout-session`
3. Rechercher des erreurs ou appels suspects

#### Base de données
```sql
-- Se connecter à Supabase SQL Editor et exécuter:

-- Vérifier les subscriptions récentes
SELECT * FROM subscriptions
WHERE created_at > '2025-01-01'
ORDER BY created_at DESC
LIMIT 50;

-- Vérifier les clients Stripe avec emails de test
SELECT * FROM stripe_customers
WHERE user_id NOT IN (SELECT id FROM auth.users)
LIMIT 50;
```

**✓ Audit effectué**

---

## 📋 RÉCAPITULATIF

Une fois toutes les étapes complétées, vous devriez avoir:

- [x] Anciennes clés Stripe révoquées
- [x] Nouvelle Service Role Key Supabase générée
- [x] Nouveaux secrets configurés dans Supabase
- [x] Nouveau webhook Stripe créé et configuré
- [x] Edge Functions redéployées
- [x] Tests de sécurité passés (2 rejets + 1 succès)
- [x] Audit effectué (pas d'anomalies détectées)

---

## ✅ VALIDATION FINALE

Exécutez cette commande pour vérifier la configuration:

```bash
# Vérifier que tous les secrets sont configurés
supabase secrets list
```

**Vous devriez voir:**
```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Si tous ces secrets apparaissent, **vous êtes prêt** ✅

---

## 🔴 QUE FAIRE SI VOUS DÉTECTEZ UNE ACTIVITÉ SUSPECTE

### Scénario 1: Transactions Stripe suspectes
1. Annuler immédiatement toutes les subscriptions suspectes dans Stripe Dashboard
2. Rembourser les éventuels paiements frauduleux
3. Documenter les anomalies (capturer screenshots)
4. Contacter le support Stripe si montants importants

### Scénario 2: Données Supabase compromises
1. Identifier les enregistrements suspects
2. Supprimer ou marquer comme "fraud" dans la base
3. Vérifier si des données sensibles ont été exfiltrées (logs)
4. Envisager de forcer la reconnexion de tous les utilisateurs

### Scénario 3: Impossible de révoquer les clés
1. Contacter immédiatement le support Stripe/Supabase
2. Expliquer la situation (clés exposées publiquement)
3. Demander blocage/révocation urgente
4. Suivre leurs instructions

---

## 📞 SUPPORT

### Documentation
- 📘 **Guide complet:** [SECURITY_CONFIGURATION_GUIDE.md](SECURITY_CONFIGURATION_GUIDE.md)
- 📋 **Résumé technique:** [SECURITY_FIXES_SUMMARY.md](SECURITY_FIXES_SUMMARY.md)
- 📝 **Changelog:** [CHANGELOG_SECURITY.md](CHANGELOG_SECURITY.md)

### Scripts d'Aide
- 🐧 **Linux/macOS:** `./scripts/configure-secrets.sh`
- 🪟 **Windows:** `.\scripts\configure-secrets.ps1`

### Contacts
- **Stripe Support:** https://support.stripe.com
- **Supabase Support:** https://supabase.com/dashboard/support

---

## ⏱️ TEMPS TOTAL ESTIMÉ

- ✅ Révocation des clés: **5 min**
- ✅ Configuration secrets: **5 min**
- ✅ Création webhook: **3 min**
- ✅ Redéploiement: **2 min**
- ✅ Tests: **3 min**
- ✅ Audit: **2 min**

**TOTAL: ~20 minutes maximum**

---

## 🎯 PRIORITÉ ABSOLUE

Cette tâche doit être effectuée **AVANT** tout autre travail sur l'application.

**Statut de sécurité:**
- 🔴 Avant actions: **CRITIQUE - Secrets exposés**
- 🟢 Après actions: **SÉCURISÉ - Prêt pour production**

---

**Date limite:** IMMÉDIAT
**Responsable:** Développeur principal
**Validation:** Chef de projet / CTO

---

**⚠️ NE PAS IGNORER - SÉCURITÉ CRITIQUE**

Cette checklist garantit que votre application est sécurisée et protégée contre les exploitations des vulnérabilités précédemment exposées.

---

**Dernière mise à jour:** 2025-01-04
**Version:** 1.0.0
