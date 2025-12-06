# TODO - Synchronisation Frontend avec Edge Functions

## 📋 Résumé

Vous avez demandé de synchroniser le frontend CassKai avec vos Edge Functions Supabase sécurisées.

**Bonne nouvelle**: La plupart du travail est déjà fait! ✅

---

## ✅ Ce Qui Est Déjà Fait

### Services Créés
1. ✅ **`src/services/billingService.ts`** - Service complet pour Stripe (CRÉÉ PAR MOI)
   - `createCheckoutSession()` - Appelle l'Edge Function
   - `openCustomerPortal()` - Appelle l'Edge Function
   - `updateSubscription()` - Appelle l'Edge Function
   - `cancelSubscription()` - Appelle l'Edge Function
   - `getCurrentSubscription()` - Récupère depuis Supabase

2. ✅ **`src/services/stripeService.ts`** - Existe déjà (À CONSERVER)
   - Service plus complet avec gestion des payment methods
   - Déjà connecté aux Edge Functions (lignes 169, 313)

3. ✅ **`src/services/rgpdService.ts`** - Existe déjà
   - Export de données utilisateur
   - Suppression de compte
   - **TODO**: Mettre à jour pour utiliser les Edge Functions

4. ✅ **`src/services/emailService.ts`** - Existe déjà
   - **TODO**: Vérifier s'il utilise l'Edge Function

5. ✅ **`src/services/aiService.ts`** - Existe déjà
   - **TODO**: Vérifier s'il utilise l'Edge Function

### Pages
6. ✅ **`src/pages/StripeSuccessPage.tsx`** - Existe déjà
7. ✅ **`src/pages/StripeCancelPage.tsx`** - Existe déjà
8. ✅ **`src/pages/BillingPage.tsx`** - Existe déjà

### Documentation
9. ✅ **`FRONTEND_EDGE_FUNCTIONS_GUIDE.md`** - Guide complet (CRÉÉ PAR MOI)

---

## 🔧 Actions à Faire

### 1. Mettre à Jour BillingPage.tsx

Ouvrir `src/pages/BillingPage.tsx` et remplacer les appels directs par `billingService`:

```tsx
// AVANT
import { stripeService } from '@/services/stripeService';

// APRÈS
import { billingService } from '@/services/billingService';

// Dans les handlers:
const handleSubscribe = async (planId: string, interval: 'monthly' | 'yearly') => {
  try {
    const { url } = await billingService.createCheckoutSession(planId, interval);
    window.location.href = url;
  } catch (error) {
    toast.error(error.message);
  }
};

const handleOpenPortal = async () => {
  try {
    const { url } = await billingService.openCustomerPortal();
    window.location.href = url;
  } catch (error) {
    toast.error(error.message);
  }
};
```

**Voir exemples complets dans**: [FRONTEND_EDGE_FUNCTIONS_GUIDE.md](FRONTEND_EDGE_FUNCTIONS_GUIDE.md:95-180)

---

### 2. Mettre à Jour rgpdService.ts

Ajouter les appels aux Edge Functions:

```tsx
// src/services/rgpdService.ts

// Ajouter ces méthodes:

async exportUserData(): Promise<UserDataExport> {
  const { data, error } = await supabase.functions.invoke('export-user-data', {
    body: {}
  });

  if (error) throw new Error(error.message);
  return data;
}

async requestAccountDeletion(reason?: string, ownershipTransfers?: any[]) {
  const { data, error } = await supabase.functions.invoke('delete-account', {
    body: {
      reason,
      ownership_transfers: ownershipTransfers
    }
  });

  if (error) throw new Error(error.message);
  return data;
}
```

---

### 3. Vérifier les Routes

Ouvrir `src/routes.tsx` ou `src/AppRouter.tsx` et vérifier que ces routes existent:

```tsx
import StripeSuccessPage from '@/pages/StripeSuccessPage';
import StripeCancelPage from '@/pages/StripeCancelPage';

// Dans les routes:
{ path: '/billing/success', element: <StripeSuccessPage /> },
{ path: '/billing/cancel', element: <StripeCancelPage /> },
```

---

### 4. (Optionnel) Nettoyer les Price IDs des .env

**NOTE**: Les Price IDs Stripe sont **publics** et peuvent rester dans le frontend sans problème de sécurité.

Cependant, pour une architecture plus propre, ils sont maintenant dans les secrets Supabase Edge Functions.

Si vous voulez les supprimer du frontend:

```bash
# .env, .env.production
# Supprimer ces lignes (optionnel):
VITE_STRIPE_STARTER_MONTHLY_PRICE_ID=...
VITE_STRIPE_PRO_MONTHLY_PRICE_ID=...
# etc.
```

⚠️ **Important**: Vérifier d'abord que plus aucun fichier frontend ne les utilise directement.

---

### 5. Tester

#### Test 1: Souscription
1. Aller sur la page de tarification
2. Cliquer sur "Choisir un plan"
3. Vérifier la redirection vers Stripe Checkout
4. Utiliser la carte de test: `4242 4242 4242 4242`
5. Vérifier la redirection vers `/billing/success`

#### Test 2: Customer Portal
1. Avoir un abonnement actif
2. Cliquer sur "Gérer mon abonnement"
3. Vérifier la redirection vers le Customer Portal Stripe

#### Test 3: Annulation
1. Dans la page d'abonnement, cliquer "Annuler"
2. Confirmer
3. Vérifier le message de succès
4. Vérifier que `cancel_at_period_end` est à `true`

---

## 📁 Fichiers à Modifier

| Fichier | Action | Priorité |
|---------|--------|----------|
| `src/pages/BillingPage.tsx` | Utiliser `billingService` | 🔴 Haute |
| `src/services/rgpdService.ts` | Ajouter appels Edge Functions | 🟡 Moyenne |
| `src/routes.tsx` | Vérifier routes success/cancel | 🟢 Basse |
| `.env` | Supprimer Price IDs (optionnel) | 🟢 Basse |

---

## 🎯 Priorité des Actions

### Immédiat (Critique)
1. **Mettre à jour `BillingPage.tsx`** pour utiliser `billingService`
2. **Tester les souscriptions** avec cartes de test Stripe

### Court Terme
3. Mettre à jour `rgpdService.ts` pour les Edge Functions
4. Vérifier que les routes `/billing/success` et `/billing/cancel` existent

### Optionnel
5. Supprimer les Price IDs des fichiers .env frontend
6. Ajouter des tests unitaires pour `billingService`

---

## 📚 Documentation Disponible

1. **[FRONTEND_EDGE_FUNCTIONS_GUIDE.md](FRONTEND_EDGE_FUNCTIONS_GUIDE.md)** - Guide complet avec exemples
2. **[ENV_FILES_EXPLAINED.md](ENV_FILES_EXPLAINED.md)** - Explication des fichiers .env
3. **Edge Functions README** - Dans `supabase/functions/README.md`

---

## 🚀 Commandes Utiles

```bash
# Démarrer le dev
npm run dev

# Build pour tester
npm run build
npm run preview

# Déployer sur VPS
.\deploy-vps.ps1
```

---

## ✅ Checklist Finale

Avant de déployer en production:

- [ ] `billingService.ts` importé dans `BillingPage.tsx`
- [ ] Tous les boutons utilisent les méthodes de `billingService`
- [ ] Routes `/billing/success` et `/billing/cancel` configurées
- [ ] Tests effectués avec cartes de test Stripe
- [ ] Aucune erreur console
- [ ] Les redirections fonctionnent correctement

---

## 💡 Besoin d'Aide?

Consultez les exemples complets dans [FRONTEND_EDGE_FUNCTIONS_GUIDE.md](FRONTEND_EDGE_FUNCTIONS_GUIDE.md).

Les Edge Functions sont déjà déployées et testées côté backend. Il ne reste plus qu'à les appeler depuis le frontend!

---

**Créé le**: 6 décembre 2025
**Status**: 🟡 En attente d'intégration frontend
**Complexité**: 🟢 Faible (1-2h de travail)
