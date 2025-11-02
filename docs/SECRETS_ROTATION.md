# CassKai - Rotation et rangement des secrets

Ne communiquez JAMAIS de secrets en clair dans cette conversation ou dans des issues. Utilisez les emplacements suivants selon l'environnement.

## Emplacements recommandés

- Production (GitHub Actions):
  - Repository Settings > Secrets and variables > Actions
  - Secrets requis:
    - `VITE_SUPABASE_URL` (public)
    - `VITE_SUPABASE_ANON_KEY` (public)
    - `SUPABASE_SERVICE_ROLE_KEY` (secret)
    - `STRIPE_SECRET_KEY` (secret)
    - `STRIPE_WEBHOOK_SECRET` (secret)
    - (Optionnel) `GITGUARDIAN_API_KEY` pour le job ggshield

- Supabase Edge Functions (runtime):
  - Via CLI: `supabase secrets set KEY=VALUE`
  - Clés:
    - `SUPABASE_URL`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `STRIPE_SECRET_KEY`
    - `STRIPE_WEBHOOK_SECRET`

- Serveur/VPS (déploiement Web):
  - Fichier d'environnement sécurisé (ex: /etc/casskai/.env) ou variables système pour Nginx/PM2.
  - Ne pas déployer en root (voir `DEPLOYMENT.md`).

## Procédure de rotation (exemple Stripe & Supabase)

1. Stripe
   - Créez une nouvelle clé secrète (test ou live) dans le Dashboard.
   - Créez un nouveau secret de Webhook (ou régénérez) sur l'endpoint configuré.
   - Mettez à jour:
     - Supabase (secrets): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
     - GitHub Actions (si utilisé côté CI ou scripts): mêmes clés
   - Re-déployez la fonction: `supabase functions deploy stripe-webhook`

2. Supabase Service Role
   - Régénérez la clé Service Role depuis le Dashboard (Project Settings > API).
   - Mettez à jour:
     - Supabase (secrets): `SUPABASE_SERVICE_ROLE_KEY`
     - GitHub Actions: `SUPABASE_SERVICE_ROLE_KEY`
     - VPS/Serveur: variable d'environnement équivalente si utilisée

3. Vérifications
   - Lancer les tests rapides:
     - `verify-journals.js` (vérifie VITE_SUPABASE_URL/ANON_KEY)
     - `test-rpc.js` (requiert `SUPABASE_SERVICE_ROLE_KEY`)
   - Consulter les logs de la fonction `stripe-webhook` après une notification test.

## Variables connues et où elles sont lues

- Front (Vite): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`
- Edge Functions: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Scripts Node: `SUPABASE_URL`/`DEV_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`/`DEV_SUPABASE_SERVICE_ROLE_KEY`
- Email: `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`
- Divers fournisseurs (côté serveur): `PPF_CLIENT_ID`, `PPF_CLIENT_SECRET`, `REACT_APP_BRIDGE_*`, `REACT_APP_BUDGET_INSIGHT_*`

> Note: Les préfixes `REACT_APP_*` ne sont pas chargés par Vite côté client. Conservez ces valeurs côté serveur uniquement.

## Bonnes pratiques

- Jamais de secrets dans le code ou les PR.
- `.env.sample` sert de référence, `.env` est ignoré par git.
- Activez Gitleaks/ggshield en local (voir `docs/SECRET_SCANNING_SETUP.md`).
- Limitez la portée des clés (Stripe test vs live, scopes Supabase).
