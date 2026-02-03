<!-- Copilot / Agent instructions for the CassKai repo -->
# CassKai — Copilot Instructions (concise)

Purpose: give an AI coding agent the essential, immediately-actionable knowledge
to be productive in this repository.

- **Big picture**: frontend is a Vite + React + TypeScript app in `src/` that talks to Supabase for data and auth. The repo also contains a small Node backend for Stripe integrations in `backend/`.

- **Key boundaries**:
  - Frontend (UI, UX system, validation): `src/` — look for `src/lib/`, `src/components/ui/`, `src/contexts/`.
  - Backend (Stripe webhook + subscription sync): `backend/server.js` and `backend/*`.
  - Database / infra: `supabase/` contains migrations and Edge Functions; changes here require DB migration awareness and tests.

- **Dev / debug commands** (run from repo root):
  - Install: `npm install`
  - Start frontend dev: `npm run dev` (Vite — frontend served on :5173)
  - Start backend dev: `cd backend && npm run dev` (backend server default :3001)
  - Typecheck: `npm run type-check`
  - Lint: `npm run lint` / auto-fix `npm run lint:fix`
  - Unit tests: `npm run test` (Vitest)
  - E2E tests: `npm run test:e2e` (Playwright)
  - Build: `npm run build` (production build uses Vite config)

- **Important files to read before changing behavior**:
  - [README.md](../README.md) — project overview and dev quickstart
  - [package.json](../package.json) — scripts and important dev workflow commands
  - [vite.config.ts](../vite.config.ts) — build/dependency optimizations, ports, heavy-lib exclusions
  - [backend/server.js](../backend/server.js) — Stripe webhook handling (uses `express.raw`), Supabase client, dev-only endpoints
  - `supabase/` — DB migrations and Edge Functions (schema/RLS live here)

- **Project-specific conventions & patterns** (do not invent these):
  - Validation: Zod schemas live under `src/lib/validation-schemas` (forms use `zodResolver` + `react-hook-form` patterns).
  - UX helpers: toast helpers and Confirm/EmptyState components are canonical; see `src/lib/toast-helpers` and `src/components/ui/` for patterns.
  - Currency/monetary handling: amounts are often stored as integers or normalized strings; search for `currency` and `toFixed` usage before changing formatting logic.
  - DB safety: Row Level Security (RLS) is enabled — any backend/db change must respect RLS rules in `supabase/` and may require migration scripts.
  - Dev-only flags: `VITE_DEV_MODE` and other env toggles enable dev endpoints (e.g., `/api/dev/kpis`) — avoid shipping debug endpoints to production.

- **Integration notes**:
  - Supabase: frontend uses `@supabase/supabase-js`. Service role keys must never be committed. See `.env.example` and `backend/README.md` for required env names.
  - Stripe: `backend/server.js` validates webhook signatures with `STRIPE_WEBHOOK_SECRET` and uses `express.raw` on `/webhook` — preserve that behavior when refactoring.
  - Heavy libs: `@tensorflow/tfjs` is excluded from pre-bundling in `vite.config.ts`; treat similar heavy imports as load-on-demand.

- **When modifying code**:
  - Run `npm run type-check` and `npm run lint` locally before creating changes.
  - Run unit tests `npm run test` and relevant Playwright flows for any UI change that touches user flows.
  - For DB schema or RLS changes, add migration files under `supabase/` and update `docs/DB-SCHEMA-VALIDATION.md` if needed.

- **Examples (searchable patterns to reuse)**:
  - Toast usage: `import { toastSuccess } from '@/lib/toast-helpers'` then `toastSuccess('Saved')`.
  - Form validation: using `zodResolver(createEmployeeSchema)` with `react-hook-form`.
  - Backend webhook: preserve `app.use('/webhook', express.raw({ type: 'application/json' }))` and signature verification flow in `backend/server.js`.

If anything above is unclear or you want a different level of detail (more file links or code examples), tell me which area to expand. I'll iterate. 

---

Quick references
- **Essential env vars (backend & frontend):** `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `FRONTEND_URL`, `ALLOWED_ORIGINS`, `VITE_DEV_MODE`.

- **Local Stripe webhook (dev)**
  1. In one terminal run the backend:

```bash
cd backend
npm run dev
```

  2. In another terminal forward Stripe events:

```bash
stripe listen --forward-to localhost:3001/webhook
```

- **Where to look for common patterns**
  - Zod schemas: `src/lib/validation-schemas/`
  - Toast helpers & usage guide: `src/lib/toast-helpers` and `src/lib/TOAST_USAGE_GUIDE.md`
  - UI primitives (Confirm, EmptyState, Dialogs): `src/components/ui/`

- **Fragile / recently touched areas**
  - Currency & formatting: there is an active PR `fix/currency-centralize` (PR #27) that centralizes runtime currency handling — check it before changing currency fallbacks or string literals like `EUR`/`€`.

---

If you'd like, I can expand the file with exact example imports, a short checklist for making DB/RLS changes, or a snippet showing the webhook signature verification flow from `backend/server.js`.

Additional quick examples

- **Example imports** (searchable and copyable):

```ts
// toast helper
import { toastSuccess } from '@/lib/toast-helpers';

// zod schema
import { createEmployeeSchema } from '@/lib/validation-schemas/create-employee';

// supabase client (used in services)
import { createClient } from '@supabase/supabase-js';
```

- **Zod + react-hook-form example** (pattern used across forms):

```ts
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEmployeeSchema } from '@/lib/validation-schemas/create-employee';

const form = useForm({
  resolver: zodResolver(createEmployeeSchema),
  mode: 'onChange',
});
```

- **Webhook verification snippet** (preserve this behavior when editing `backend/server.js`):

```js
// express.raw used on /webhook route
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
```

- **DB / RLS change checklist** (follow for any schema or permission changes):
  1. Add a migration under `supabase/migrations/` with a clear name and rollback.
 2. Update `docs/DB-SCHEMA-VALIDATION.md` if the public contract changes.
 3. Run `npm run validate:db` and fix any column mismatches.
 4. Update RLS policies in the migration and locally test with a supabase dev instance.
 5. Run unit tests `npm run test` and E2E flows that touch the impacted features.
 6. Request a review from a backend/DB reviewer — mention `RLS` in the PR title.

---

If you want I can also extract a few canonical Zod schema examples from `src/lib/validation-schemas` and paste them here.
