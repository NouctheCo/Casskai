# Déploiement des Edge Functions Stripe

 > **NOTE (2025-10)**  
 > Ce guide faisait référence aux Edge Functions Stripe désormais retirées.  
 > Vous pouvez ignorer les étapes Supabase ci-dessous et utiliser les routes backend (`/api/stripe/*`).
## ✅ Code mis à jour

Le code `PricingPage.tsx` utilise maintenant les **Edge Functions Supabase** pour gérer les paiements Stripe.

## 🚀 Déploiement des fonctions

### 1. Prérequis

```bash
# Installer Supabase CLI si pas encore fait
npm install -g supabase

# Se connecter à Supabase
supabase login
```

### 2. Initialiser le projet Supabase

```bash
# Depuis la racine du projet CassKai
supabase init

# Lier au projet Supabase distant
supabase link --project-ref VOTRE_PROJECT_REF
```

### 3. Déployer la fonction create-checkout-session

```bash
# Déployer la fonction
supabase functions deploy create-checkout-session

# Vérifier le déploiement
supabase functions list
```

### 4. Configurer les variables d'environnement

Dans le **Dashboard Supabase** → **Edge Functions** → **Settings** :

```bash
# Variables requises
STRIPE_SECRET_KEY=sk_test_51RN...  # Votre clé secrète Stripe
SUPABASE_SERVICE_ROLE_KEY=eyJhb...  # Clé service role Supabase
SUPABASE_URL=https://smtdtgrymuzw...  # URL Supabase

# Variables optionnelles pour les prix
VITE_STRIPE_PRO_MONTHLY_PRICE_ID=price_...
VITE_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_...
```

### 5. Tester la fonction

```bash
# Test local
supabase functions serve create-checkout-session

# Test avec curl
curl -X POST 'https://VOTRE_PROJECT.supabase.co/functions/v1/create-checkout-session' \
  -H 'Authorization: Bearer VOTRE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"planId":"pro","userId":"test-user-id"}'
```

## 🔧 Comportement actuel

Après déploiement, le bouton **"Choisir un plan"** :

1. ✅ **Plan Gratuit** → Redirection immédiate vers dashboard
2. ✅ **Plan Pro** → Création session Stripe + redirection checkout
3. ✅ **Plan Enterprise** → Message de contact commercial
4. ✅ **Essai Gratuit** → Création d'un essai 14 jours (si fonctions RPC installées)

## 📊 Logs de debug

Dans la **console du navigateur**, vous verrez :

```
🎯 Bouton cliqué - Plan sélectionné: pro
👤 Utilisateur: user@example.com (uuid)
🔑 Stripe Key disponible: true
💳 Checkout Stripe en cours...
📦 Session créée: {sessionId: "cs_test_..."}
```

## 🐛 Dépannage

### Erreur "Function not found"
- ✅ Vérifiez que la fonction est déployée : `supabase functions list`
- ✅ Vérifiez l'URL de la fonction dans les logs réseau

### Erreur "Stripe key missing"
- ✅ Configurez `STRIPE_SECRET_KEY` dans les variables d'environnement
- ✅ Redéployez après configuration : `supabase functions deploy create-checkout-session`

### Erreur "User not found"
- ✅ L'utilisateur doit être connecté
- ✅ Vérifiez que `user.id` est valide

## 🎉 Validation finale

Une fois déployé, testez :

1. **Se connecter** à l'application
2. **Aller sur** `/pricing`
3. **Cliquer** sur "Choisir ce plan" (Pro)
4. **Vérifier** la redirection vers Stripe Checkout

Le flux complet est maintenant opérationnel ! 🚀

## 📞 Support

Si vous rencontrez des problèmes :
- Vérifiez les logs dans **Supabase Dashboard** → **Edge Functions** → **Logs**
- Vérifiez les logs dans la **console du navigateur**
- Assurez-vous que toutes les variables d'environnement sont configurées
