# 🔧 INTÉGRATION RAPIDE - 5 Étapes (15 minutes)

## Étape 1: Ajouter les Routes ✅

```typescript
// src/routes.tsx (ou votre router config)

import EmailVerificationPage from '@/pages/auth/EmailVerificationPage';
import PaymentConfirmationPage from '@/pages/PaymentConfirmationPage';

export const routes = [
  // Auth routes
  {
    path: '/auth',
    element: <AuthGuard />,
  },
  {
    path: '/auth/verify-email',  // ← NOUVEAU
    element: <EmailVerificationPage />,
  },
  
  // Post-payment
  {
    path: '/payment-confirmation',  // ← NOUVEAU
    element: <PaymentConfirmationPage />,
  },
  
  // Existing routes...
  { path: '/pricing', element: <PricingPage /> },
  { path: '/dashboard', element: <DashboardPage /> },
];
```

---

## Étape 2: Ajouter Traductions i18next ✅

```json
// public/locales/fr/billing.json

{
  "payment": {
    "processing_title": "Traitement du paiement",
    "processing_description": "Veuillez patienter...",
    "success_title": "Paiement confirmé ✅",
    "success_subtitle": "Votre souscription est active",
    "plan": "Plan",
    "amount": "Montant",
    "next_billing": "Prochaine facturation",
    "confirmation_email": "Un email de confirmation a été envoyé",
    "access_granted": "Accès à tous les outils débloqué",
    "billing_portal": "Gérez votre facturation depuis le portail",
    "go_to_billing": "Voir ma facturation",
    "redirecting_in_5": "Redirection automatique dans 5 secondes...",
    "error_title": "Paiement refusé ❌",
    "error_description": "Le paiement n'a pas pu être traité",
    "try_again": "Réessayer",
    "need_help": "Besoin d'aide?",
    "session_id": "ID de session",
    "cancelled": "Paiement annulé",
    "invalid_session": "Session de paiement invalide",
    "pending_payment": "Paiement en attente",
    "checking": "Vérification du statut...",
    "check_card": "Vérifiez les informations de votre carte",
    "sufficient_funds": "Assurez-vous que vous avez des fonds",
    "contact_support": "Contactez notre support"
  }
}

// public/locales/fr/auth.json

{
  "verify": {
    "pending_title": "Vérifiez votre email",
    "pending_description": "Un email de confirmation a été envoyé. Cliquez sur le lien pour vérifier votre adresse.",
    "go_to_verification": "Aller à la vérification",
    "check_email": "Veuillez confirmer votre email. Un lien de vérification a été envoyé."
  }
}
```

---

## Étape 3: Modifier Checkout Stripe ✅

```typescript
// src/components/subscription/PlanSelector.tsx (ou votre checkout)

import { getCountry } from '@/services/pricingMultiCurrency';

export const PlanSelector = () => {
  const handleSelectPlan = async (planId: string) => {
    try {
      const country = getCountry(); // ← NOUVEAU: Détection pays
      
      // Créer checkout Stripe
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: plan.stripe_price_id,
          planId: planId,
          country, // ← Envoyer le pays détecté
          // ✅ IMPORTANT: Stripe redirect
          successUrl: `${window.location.origin}/payment-confirmation?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/pricing?cancelled=true`,
        }),
      });
      
      const data = await response.json();
      window.location.href = data.url; // Redirect vers Stripe
    } catch (error) {
      console.error('Error:', error);
    }
  };
};
```

---

## Étape 4: Vérifier Variables d'Environnement ✅

```bash
# .env.local (check these exist)

# Supabase
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=...

# Stripe (Frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Backend
STRIPE_SECRET_KEY=sk_test_... (backend/server.js)
STRIPE_WEBHOOK_SECRET=whsec_... (backend/server.js)
FRONTEND_URL=http://localhost:5173 (backend/server.js)
```

---

## Étape 5: Tester Rapidement ✅

### Test 1: Email Verification
```bash
1. npm run dev
2. Signup avec nouveau compte
3. Vérifier redirection vers /auth/verify-email
4. Ouvrir email (check votre client email)
5. Cliquer lien confirmation
6. Vérifier auto-redirect
```

### Test 2: Payment Flow
```bash
1. Aller à /pricing
2. Cliquer "Essayer 30 jours gratuits" (ou plan)
3. Vérifier redirection vers Stripe
4. Utiliser carte test Stripe: 4242 4242 4242 4242
5. Completer formulaire
6. Vérifier redirection vers /payment-confirmation?session_id=...
7. Vérifier affichage SUCCESS
```

### Test 3: Device Pricing
```bash
1. Open DevTools → Inspect element
2. localStorage.setItem('preferredCountry', 'FR')
3. Refresh
4. Vérifier pricing en EUR (pas USD)
5. localStorage.removeItem('preferredCountry')
6. Refresh
7. Vérifier pricing détecté par navigator.language
```

---

## 🎯 Checklist Finale

- [ ] Routes ajoutées
- [ ] Traductions i18next
- [ ] Stripe checkout redirect URL modifié
- [ ] Variables d'env vérifiées
- [ ] `npm run type-check` ✅
- [ ] `npm run lint:errors` ✅
- [ ] Tests E2E Playwright (optionnel)
- [ ] Deploy staging

---

## 💡 Tips

**Si erreur lors du test:**
1. Vérifier console browser (F12 → Console)
2. Vérifier logs Supabase (https://app.supabase.com → Logs)
3. Vérifier logs Stripe (https://dashboard.stripe.com → Logs)
4. Vérifier variables d'env
5. Vérifier routes React correctement configurées

**Stripe Testing:**
```bash
# Cartes de test Supp:
4242 4242 4242 4242 = Succès
4000 0000 0000 0002 = Décliné
5555 5555 5555 4444 = Mastercard
3782 822463 10005 = American Express
```

---

**Durée estimée: 15 minutes** ⏱️

Commandez maintenant! 🚀
