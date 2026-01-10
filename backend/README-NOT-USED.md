# ⚠️ Ce Backend Node.js N'EST PAS UTILISÉ

## 🚫 Statut : NON DÉPLOYÉ

Ce répertoire contient une implémentation alternative en **Node.js + Express** pour gérer les webhooks Stripe et les checkout sessions.

**IMPORTANT : Cette implémentation N'EST PAS utilisée dans le projet actuel.**

---

## ✅ Ce qui est ACTUELLEMENT utilisé

Le projet utilise **Supabase Edge Functions** (Deno serverless) au lieu de ce backend Node.js :

```
📁 supabase/functions/
  └── create-checkout-session/
      └── index.ts          ← UTILISÉ (Deno/Edge Function)
```

### Architecture actuelle (Production)

```
Browser
  └─→ React App (Frontend)
       ├─→ Supabase JS SDK → Supabase DB
       └─→ Supabase Edge Functions → Stripe API
```

**Avantages de cette approche :**
- ✅ Serverless (pas de serveur à maintenir)
- ✅ Scaling automatique
- ✅ Hébergé par Supabase
- ✅ Secrets sécurisés côté serveur
- ✅ Pas de PM2, pas de configuration VPS

---

## 📦 Contenu de ce répertoire (backend/)

Ce dossier contient :

- `server.js` - Serveur Express avec endpoints Stripe
  - `/api/stripe/create-checkout-session` - Créer une session checkout
  - `/webhook` - Recevoir les webhooks Stripe
  - `/health` - Health check
- `package.json` - Dépendances Node.js
- `.env.example` - Variables d'environnement requises

### Fonctionnalités implémentées

1. **Checkout Sessions** : Création de sessions de paiement Stripe
2. **Webhooks Stripe** : Gestion des événements
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
3. **Synchronisation DB** : Mise à jour de Supabase selon les événements Stripe

---

## 🤔 Pourquoi ce code existe-t-il alors ?

Ce backend a été développé comme une **alternative** ou **backup** pour :

1. **Tests locaux** - Tester l'intégration Stripe en local
2. **Migration future** - Si besoin de migrer vers un serveur Node.js dédié
3. **Référence** - Code de référence pour comprendre les webhooks Stripe

---

## 🔄 Si vous voulez l'utiliser (pas recommandé)

### Prérequis
```bash
cd backend
npm install
```

### Configuration
Copiez `.env.example` vers `.env` et configurez :
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_KEY=...
PORT=3001
```

### Démarrage local
```bash
npm start
# ou
node server.js
```

### Déploiement VPS (NON RECOMMANDÉ)
```powershell
.\deploy-backend.ps1
```

**⚠️ ATTENTION :** Cela nécessiterait :
- Configurer PM2 sur le VPS
- Exposer le port 3001 via Nginx
- Gérer les mises à jour de sécurité
- Monitoring et logs
- Maintenir les dépendances npm

---

## 💡 Recommandation

**Utilisez les Supabase Edge Functions** (configuration actuelle) sauf si vous avez une raison spécifique de vouloir un serveur Node.js dédié.

### Avantages Edge Functions vs Node.js Backend

| Critère | Edge Functions ✅ | Node.js Backend ❌ |
|---------|-------------------|-------------------|
| Maintenance | Aucune | Serveur à gérer |
| Scaling | Automatique | Manuel (PM2 cluster) |
| Coût | Inclus Supabase | VPS + monitoring |
| Sécurité | Gérée par Supabase | À maintenir |
| Déploiement | `supabase functions deploy` | SSH + PM2 + Nginx |
| Cold start | ~50-100ms | 0ms (toujours actif) |

---

## 📚 Documentation

### Supabase Edge Functions
- [Documentation officielle](https://supabase.com/docs/guides/functions)
- [Exemple Stripe](https://supabase.com/docs/guides/functions/examples/stripe-webhooks)

### Code actuel
- `supabase/functions/create-checkout-session/index.ts`
- Architecture : Voir `ARCHITECTURE.md`

---

## 🗑️ Suppression

Si vous êtes sûr de ne jamais utiliser ce backend, vous pouvez supprimer ce dossier entier :

```bash
# Supprimer le répertoire backend/
rm -rf backend/
```

Aucun impact sur l'application en production car elle utilise les Edge Functions.

---

**Dernière mise à jour** : 29 décembre 2025
**Statut** : NON UTILISÉ, conservé pour référence
