// 2025-10: Les Edge Functions Stripe ont été retirées.
// Ce script est conservé à titre informatif et indique la nouvelle marche à suivre.

console.warn('[casskai] Les Edge Functions Stripe ont été remplacées par l\'API backend sécurisée.');
console.info([
  'Pour créer une session de paiement, utilisez le point d\'entrée backend :',
  "fetch('/api/stripe/create-checkout-session', {",
  "  method: 'POST',",
  "  headers: {",
  "    'Content-Type': 'application/json',",
  "    Authorization: `Bearer ${session.access_token}`",
  "  },",
  "  body: JSON.stringify({ planId: 'pro_monthly' })",
  "});"
].join('\n'));
