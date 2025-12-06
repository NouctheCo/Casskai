# ✅ Checklist d'implémentation Stripe Billing

Utilisez cette checklist pour vous assurer que tout est correctement configuré.

## 📋 Étape 1 : Base de données

### Tables existantes
- [x] `stripe_customers` - Existe déjà ✅
- [x] `invoices_stripe` - Existe déjà ✅
- [ ] `subscriptions` - **À CRÉER**

### Migration à appliquer
- [ ] Exécuter `supabase/migrations/20251204_create_subscriptions_table.sql`
  - [ ] Via Supabase Dashboard → SQL Editor
  - [ ] OU via CLI : `npx supabase db push`
- [ ] Vérifier que la table `subscriptions` existe
- [ ] Vérifier les politiques RLS sont actives

**Commande de vérification :**
```sql
-- Dans Supabase SQL Editor
SELECT * FROM subscriptions LIMIT 1;
```

---

## 🔐 Étape 2 : Configuration Stripe

### Compte Stripe
- [ ] Compte Stripe créé
- [ ] Mode Test activé (pour les tests initiaux)
- [ ] Clés API récupérées :
  - [ ] Secret Key (sk_test_...)
  - [ ] Publishable Key (pk_test_...)

### Produits et Prix
- [ ] Produits créés dans Stripe Dashboard :
  - [ ] Plan Starter (29€/mois, 290€/an)
  - [ ] Plan Pro (79€/mois, 790€/an)
  - [ ] Plan Enterprise (199€/mois, 1990€/an)
- [ ] Price IDs notés (voir `STRIPE_PRICE_IDS.md`)
- [ ] Price IDs mis à jour dans `create-checkout-session/index.ts`

---

## 🚀 Étape 3 : Edge Functions Supabase

### Secrets configurés
- [ ] Dans Supabase Dashboard → Edge Functions → Secrets :
  - [ ] `STRIPE_SECRET_KEY` configuré
  - [ ] `STRIPE_WEBHOOK_SECRET` configuré

### Fonctions déployées
- [ ] `create-checkout-session` déployée
- [ ] `stripe-webhook` déployée
- [ ] `create-portal-session` déployée

**Commande de déploiement :**
```bash
# Windows
.\deploy-edge-functions.ps1

# Linux/Mac
./deploy-edge-functions.sh
```

### Vérification
- [ ] Les 3 fonctions apparaissent dans Supabase Dashboard → Edge Functions
- [ ] Aucune erreur dans les logs

---

## 🔗 Étape 4 : Webhook Stripe

### Configuration
- [ ] Webhook créé dans Stripe Dashboard → Developers → Webhooks
- [ ] URL configurée : `https://[PROJECT_ID].supabase.co/functions/v1/stripe-webhook`
- [ ] Événements sélectionnés :
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.payment_succeeded`
  - [ ] `invoice.payment_failed`
- [ ] Signing secret copié dans Supabase (`STRIPE_WEBHOOK_SECRET`)

### Test du webhook
- [ ] Envoyer un événement test depuis Stripe Dashboard
- [ ] Vérifier dans Stripe Dashboard → Webhooks → Attempts que l'événement est reçu (200 OK)
- [ ] Vérifier les logs de `stripe-webhook` dans Supabase

---

## 💻 Étape 5 : Configuration Frontend

### Variables d'environnement
- [ ] Fichier `.env` ou `.env.local` existe
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` configuré (pk_test_...)
- [ ] `VITE_API_BASE_URL` configuré

**Exemple `.env` :**
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_API_BASE_URL=https://casskai.app/api
```

### Build et déploiement
- [ ] Build du frontend réussi : `npm run build`
- [ ] Déployé sur le VPS : `.\deploy-vps.ps1`
- [ ] Application accessible : https://casskai.app

---

## 🧪 Étape 6 : Tests

### Test du flux de checkout
- [ ] Aller sur https://casskai.app/billing
- [ ] Cliquer sur "Choisir Starter" (ou autre plan)
- [ ] Redirection vers Stripe Checkout ✅
- [ ] Compléter avec carte de test : `4242 4242 4242 4242`
- [ ] Redirection vers `/billing?success=true` ✅
- [ ] Message de succès affiché ✅

### Vérification base de données
- [ ] Vérifier dans Supabase Dashboard → Table Editor :
  - [ ] Table `subscriptions` contient le nouvel abonnement
  - [ ] Colonne `status` = 'active' ou 'trialing'
  - [ ] Colonne `stripe_subscription_id` remplie
- [ ] Vérifier table `invoices_stripe` :
  - [ ] Facture créée
  - [ ] Colonne `status` = 'paid'

### Vérification Stripe
- [ ] Dashboard Stripe → Subscriptions : abonnement visible
- [ ] Dashboard Stripe → Customers : client créé
- [ ] Dashboard Stripe → Webhooks : événements reçus (200 OK)

### Test du portail client
- [ ] Sur la page Billing, cliquer "Gérer mon abonnement"
- [ ] Redirection vers portail Stripe ✅
- [ ] Factures visibles ✅
- [ ] Option d'annulation disponible ✅

---

## 🔄 Étape 7 : Test d'annulation

### Annuler un abonnement
- [ ] Dans le portail client, annuler l'abonnement
- [ ] Vérifier webhook reçu : `customer.subscription.deleted`
- [ ] Vérifier dans Supabase :
  - [ ] Table `subscriptions` : `status` = 'cancelled'
  - [ ] OU `cancel_at_period_end` = true

---

## 📊 Étape 8 : Monitoring

### Logs à surveiller
- [ ] Logs Supabase Edge Functions :
  ```bash
  npx supabase functions logs stripe-webhook --follow
  ```
- [ ] Logs Stripe Dashboard → Webhooks → Attempts
- [ ] Logs frontend (Console du navigateur)

### Alertes à configurer (optionnel)
- [ ] Sentry pour les erreurs frontend
- [ ] Stripe Dashboard → Webhooks → Notifications email
- [ ] Monitoring Supabase (alertes sur erreurs Edge Functions)

---

## 🚀 Étape 9 : Passage en production

### Quand tout fonctionne en test
- [ ] Créer les produits en mode Live dans Stripe
- [ ] Noter les nouveaux Price IDs (price_live_...)
- [ ] Mettre à jour `create-checkout-session/index.ts` avec les Price IDs Live
- [ ] Configurer les secrets avec les clés Live :
  - [ ] `STRIPE_SECRET_KEY=sk_live_...`
  - [ ] `STRIPE_WEBHOOK_SECRET=whsec_...` (nouveau)
- [ ] Créer un nouveau webhook en mode Live
- [ ] Mettre à jour `.env` :
  - [ ] `VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...`
- [ ] Déployer les Edge Functions avec les nouveaux Price IDs
- [ ] Déployer le frontend avec la nouvelle clé publique
- [ ] Tester avec une vraie carte (montant minimal)

---

## ✅ Checklist finale

### Avant la mise en production
- [ ] Tous les tests passent ✅
- [ ] Aucune erreur dans les logs
- [ ] Webhooks fonctionnent (200 OK)
- [ ] Synchronisation DB correcte
- [ ] Portail client fonctionne
- [ ] Documentation à jour
- [ ] Équipe formée sur la gestion des abonnements

### Sécurité
- [ ] RLS actif sur table `subscriptions`
- [ ] Secrets Stripe sécurisés (pas commités dans Git)
- [ ] JWT vérifié dans Edge Functions
- [ ] Signature webhook validée

### Support
- [ ] Process de support défini
- [ ] Accès Stripe Dashboard configuré
- [ ] Monitoring en place
- [ ] Documentation accessible

---

## 📞 Support

En cas de problème, consultez :
1. `STRIPE_SETUP.md` - Guide complet
2. `supabase/functions/README.md` - Documentation Edge Functions
3. `STRIPE_PRICE_IDS.md` - Référence des Price IDs
4. [Documentation Stripe](https://stripe.com/docs)
5. [Documentation Supabase](https://supabase.com/docs)

## 🎉 Félicitations !

Si tous les items sont cochés, votre intégration Stripe Billing est complète et prête pour la production ! 🚀
