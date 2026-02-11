# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# CassKai - Guide de développement

**CassKai®** est une plateforme SaaS complète de gestion d'entreprise pour PME et indépendants. Application React/TypeScript moderne avec backend Supabase.

## Stack technique principal

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + RLS + Edge Functions)
- **UI**: Tailwind CSS + Radix UI + Framer Motion
- **État**: React Context API (AuthContext, EnterpriseContext, LocaleContext, etc.)
- **Validation**: Zod + react-hook-form
- **Charts**: Recharts
- **Routing**: React Router v6
- **i18n**: i18next (fr, en, es)

## Commandes essentielles

### Développement
```bash
npm install              # Installation des dépendances
npm run dev              # Serveur dev (http://localhost:5173)
npm run build            # Build production optimisé
npm run build:fast       # Build rapide (minify esbuild)
npm run type-check       # Vérification TypeScript
npm run lint             # ESLint (warnings acceptés)
npm run lint:fix         # Auto-correction ESLint
npm run validate:db      # Validation colonnes Supabase
```

### Tests
```bash
npm run test             # Tests unitaires (Vitest)
npm run test:ui          # UI de test Vitest
npm run test:e2e         # Tests E2E (Playwright)
npm run test:e2e:ui      # Playwright UI mode
npm run test:coverage    # Rapport de couverture
```

### Déploiement VPS
**Architecture simplifiée (Nginx direct, sans Docker/Traefik)**

```powershell
# Windows PowerShell (recommandé)
.\deploy-vps.ps1                    # Build + deploy complet
.\deploy-vps.ps1 -SkipBuild         # Deploy sans rebuild

# Linux/Mac/Git Bash
./deploy-vps.sh                     # Build + deploy complet
./deploy-vps.sh --skip-build        # Deploy sans rebuild
```

**Infrastructure déployée:**
- **VPS**: 89.116.111.88
- **Production**: https://casskai.app et https://www.casskai.app
- **Staging**: https://staging.casskai.app
- **Frontend**: Nginx → `/var/www/casskai.app/`
- **Backend API**: PM2 (casskai-api)
- **SSL**: Let's Encrypt auto-renouvelé

**Note importante**: Après upload, Nginx sert automatiquement les nouveaux fichiers. Aucun redémarrage de service n'est nécessaire pour le frontend.

## Architecture du code

### Structure des répertoires
```
casskai/
├── src/
│   ├── components/          # Composants React par module
│   │   ├── ui/              # Composants UI réutilisables (shadcn/ui)
│   │   ├── accounting/      # Comptabilité
│   │   ├── invoicing/       # Facturation
│   │   ├── crm/             # CRM et ventes
│   │   ├── hr/              # Ressources humaines
│   │   ├── inventory/       # Stock et inventaire
│   │   ├── contracts/       # Contrats
│   │   ├── projects/        # Gestion de projets
│   │   ├── banking/         # Banque et trésorerie
│   │   ├── layout/          # Layouts (Sidebar, Header)
│   │   ├── dashboard/       # Tableaux de bord
│   │   └── landing-v2/      # Landing page publique
│   ├── pages/               # Pages principales (React Router)
│   ├── contexts/            # Contextes globaux (Auth, Enterprise, Locale, Theme, etc.)
│   ├── services/            # Services métier et API Supabase
│   ├── hooks/               # Hooks personnalisés (70+ hooks)
│   ├── lib/                 # Utilitaires et helpers
│   │   ├── toast-helpers.ts # 15+ fonctions de toast
│   │   ├── validation-schemas/ # 12+ schémas Zod
│   │   ├── utils.ts         # Utilitaires généraux (cn, formatCurrency, etc.)
│   │   └── supabase.ts      # Client Supabase configuré
│   ├── types/               # Définitions TypeScript
│   │   ├── database-types-fix.ts  # Types DB Supabase
│   │   ├── crm.types.ts     # Types CRM
│   │   ├── hr-employees.types.ts  # Types RH
│   │   └── ...              # Types par module
│   └── i18n/                # Traductions (fr.json, en.json, es.json)
├── supabase/
│   ├── migrations/          # Migrations SQL (~100+ fichiers)
│   └── functions/           # Edge Functions (Deno)
│       ├── ai-assistant/    # Assistant IA (OpenAI)
│       ├── stripe-webhook/  # Webhooks Stripe
│       ├── send-email/      # Envoi d'emails
│       └── ...
├── backend/                 # Backend Node.js pour Stripe (PM2)
│   └── server.js            # Serveur Express (webhooks Stripe)
└── public/                  # Assets statiques
```

### Contextes React (Architecture d'état)

Les contextes sont le cœur de la gestion d'état de l'application:

- **AuthContext**: Authentification Supabase, session utilisateur
- **EnterpriseContext**: Entreprise courante, switch entre entreprises, données multi-tenant
- **LocaleContext**: i18n (fr/en/es), devise, formats régionaux
- **ThemeContext**: Mode clair/sombre
- **SubscriptionContext**: Abonnement Stripe, quotas, limites
- **ModulesContext**: Modules activés par entreprise
- **DashboardContext**: Configuration des widgets de dashboard
- **OnboardingContext**: État du parcours d'onboarding

**Pattern d'utilisation**:
```typescript
import { useEnterprise } from '@/contexts/EnterpriseContext';

const { currentEnterprise, switchEnterprise } = useEnterprise();
```

### Services (Couche métier)

Plus de 100 services dans `src/services/`:

**Services clés:**
- `accountingService.ts` - Écritures comptables, journaux
- `chartOfAccountsService.ts` - Plan comptable (PCG français)
- `invoicingService.ts` - Factures, devis, avoirs
- `paymentsService.ts` - Paiements et règlements
- `crmService.ts` - CRM, clients, opportunités
- `hrService.ts` - Employés, congés, paie
- `inventoryService.ts` - Stock, mouvements
- `unifiedThirdPartiesService.ts` - Tiers (clients + fournisseurs)
- `projectsService.ts` - Projets, tâches, ressources
- `reportGenerationService.ts` - Rapports (PDF, Excel)
- `dashboardStatsService.ts` - Statistiques et KPIs
- `realDashboardKpiService.ts` - KPIs temps réel (prioritaire)

**Services IA:**
- `ai/OpenAIService.ts` - Intégration OpenAI (GPT-4)
- `aiDashboardAnalysisService.ts` - Analyse IA de tableaux de bord
- `ai/conversationService.ts` - Conversations avec cache

**Services réglementaires:**
- `regulatory/complianceService.ts` - Conformité comptable
- `regulatory/templateService.ts` - Templates réglementaires
- `fiscal/franceRegulatoryExportService.ts` - Exports FEC, liasse fiscale
- `vatDeclarationService.ts` - Déclarations TVA

**Tous les services utilisent le client Supabase avec RLS (Row Level Security).**

### Hooks personnalisés (70+ hooks)

**Hooks métier principaux:**
- `useAccounting()` - Comptabilité complète
- `useInvoicing()` - Facturation
- `useCrm()` - CRM
- `useHR()` - Ressources humaines
- `useInventory()` - Stock
- `useContracts()` - Contrats
- `useProjects()` - Projets
- `useThirdParties()` - Tiers (clients/fournisseurs)
- `useSuppliers()` - Fournisseurs
- `useBanking()` - Banque et trésorerie

**Hooks système:**
- `useEnterprise()` - Entreprise courante
- `useSubscriptionStatus()` - État abonnement
- `useFeatureAccess()` - Contrôle d'accès fonctionnalités
- `useCompanyCurrency()` - Devise de l'entreprise
- `useFiscalPeriod()` - Exercice fiscal

**Hooks UX:**
- `useToast()` - Toast notifications
- `useLocalStorage()` - Persistance locale
- `useBodyScrollLock()` - Blocage scroll (modales)

## Patterns et conventions importantes

### 1. Système UX complet (v2.0)

**Toast notifications (15+ helpers):**
```typescript
import {
  toastSuccess,
  toastError,
  toastCreated,
  toastUpdated,
  toastDeleted
} from '@/lib/toast-helpers';

toastSuccess('Facture créée avec succès !');
toastError('Impossible de créer la facture');
toastDeleted('Employé supprimé');
```

**États vides guidés:**
```typescript
import { EmptyList, EmptySearch, EmptyFilter } from '@/components/ui/empty-state';

<EmptyList
  icon={Users}
  title="Aucun employé"
  description="Commencez par ajouter votre premier employé"
  action={{ label: 'Ajouter un employé', onClick: openModal }}
/>
```

**Confirmations de suppression:**
```typescript
import { ConfirmDeleteDialog } from '@/components/ui/confirm-dialog';

<ConfirmDeleteDialog
  itemName="l'employé Jean Dupont"
  onConfirm={handleDelete}
>
  <Button variant="destructive">Supprimer</Button>
</ConfirmDeleteDialog>
```

**Validation formulaires (Zod + react-hook-form):**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEmployeeSchema } from '@/lib/validation-schemas';

const form = useForm({
  resolver: zodResolver(createEmployeeSchema),
  mode: 'onChange', // Validation temps réel
});
```

**12+ schémas Zod disponibles** dans `src/lib/validation-schemas/`:
- `createEmployeeSchema`, `createInvoiceSchema`, `createClientSchema`, etc.
- Messages d'erreur en français

### 2. Gestion des devises

**Pattern centralisé:**
```typescript
import { formatCurrency } from '@/lib/utils';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';

const { currency } = useCompanyCurrency(); // 'EUR', 'USD', etc.
const formatted = formatCurrency(1234.56, currency); // "1 234,56 €"
```

**⚠️ IMPORTANT:**
- Les montants sont stockés en base comme `NUMERIC(15, 2)` ou `INTEGER` (centimes)
- Toujours utiliser `formatCurrency()` pour l'affichage
- Ne jamais hardcoder `'EUR'` ou `'€'` dans les composants
- La devise est configurée par entreprise dans `company_settings`

### 3. Multi-tenant (RLS Supabase)

**Toutes les tables ont `company_id`:**
```typescript
// ✅ Bon - Les RLS filtrent automatiquement par company_id
const { data, error } = await supabase
  .from('invoices')
  .select('*');

// ❌ Mauvais - Jamais de filtrage manuel (sauf cas très spécifiques)
const { data, error } = await supabase
  .from('invoices')
  .select('*')
  .eq('company_id', currentCompany.id); // Redondant avec RLS
```

**Les RLS (Row Level Security) protègent automatiquement toutes les requêtes.**

### 4. Types TypeScript

**État TypeScript actuel:**
- `skipLibCheck: true` activé temporairement
- Conflits de types entre `ai.types.ts` et `ai-types.ts` (à unifier)
- Certaines déclarations globales dupliquées
- Build fonctionne, mais nécessite nettoyage progressif

**Pattern d'import types:**
```typescript
import type { Database } from '@/types/database-types-fix';
import type { Employee } from '@/types/hr-employees.types';
import type { CRMOpportunity } from '@/types/crm.types';
```

### 5. Internationalisation (i18n)

```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();

// Utilisation
<h1>{t('dashboard.title')}</h1>
```

**Fichiers de traduction:** `src/i18n/locales/{fr,en,es}.json`

**⚠️ Toujours ajouter les traductions dans les 3 langues.**

### 6. Optimisations Vite

**Configuration importante (`vite.config.ts`):**
- **Heavy libs exclus du pre-bundling**: `@tensorflow/tfjs`, `pdfjs-dist`
- **Chunks manuels**: `documents` (jsPDF, xlsx), `ui-framework` (Radix, Lucide), `vendor`
- **Compression**: Gzip + Brotli en production
- **Minification**: Terser avec `drop_console` en production
- **Build target**: ES2020, navigateurs modernes

**Ne jamais importer les libs lourdes au niveau global. Utiliser lazy loading:**
```typescript
const PDFService = lazy(() => import('@/services/invoicePdfService'));
```

## Sécurité et conformité

### Variables d'environnement

**⚠️ RÈGLES CRITIQUES:**

1. **VITE_** = Exposé côté client (safe uniquement pour URLs publiques, IDs publics)
2. **Sans VITE_** = Backend uniquement (secrets, clés API)

**Frontend (.env.local):**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_APP_URL=http://localhost:5173
```

**Backend/Edge Functions (Supabase Secrets):**
```bash
# ⚠️ Ne JAMAIS préfixer par VITE_
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
OPENAI_API_KEY=sk-...
```

**Configuration Edge Functions:**
```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
```

### Row Level Security (RLS)

**Toutes les tables ont des policies RLS strictes:**
- Isolation par `company_id`
- Vérification des permissions utilisateur via `user_companies`
- Policies dans `supabase/migrations/`

**Exemple de migration RLS:**
```sql
-- Lecture: utilisateur membre de l'entreprise
CREATE POLICY "Users can view own company data"
  ON invoices FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
  ));
```

**⚠️ Lors de changements DB:**
1. Créer migration dans `supabase/migrations/`
2. Inclure les RLS policies
3. Tester avec différents rôles utilisateur
4. Mettre à jour les types TypeScript si nécessaire
5. Exécuter `npm run validate:db`

### RGPD et archivage

- **Chiffrement AES-256-GCM** pour archives légales (7 ans)
- Service: `src/services/einvoicing/core/ArchiveService.ts`
- Clé: `ARCHIVE_ENCRYPTION_KEY` (backend uniquement, 64 caractères hex)
- **⚠️ Ne JAMAIS committer ou perdre cette clé**

## Modules de l'application

### Modules principaux
1. **Comptabilité** - Plan comptable PCG, écritures, FEC, liasse fiscale
2. **Facturation** - Factures, devis, avoirs, paiements
3. **CRM** - Clients, prospects, opportunités, actions commerciales
4. **Stock** - Articles, mouvements, inventaires, valorisation
5. **RH** - Employés, congés, paie, formations, documents
6. **Banque** - Comptes bancaires, rapprochements, trésorerie
7. **Projets** - Gestion de projets, tâches, ressources, temps
8. **Contrats** - Contrats, RFA, suivi
9. **Achats** - Fournisseurs, commandes, réceptions
10. **Tiers** - Clients et fournisseurs unifiés

### Modules premium/avancés
- **Budget & Prévisions** - Planification budgétaire, forecasts
- **Rapports** - Génération PDF/Excel de rapports financiers
- **IA** - Assistant IA, analyse prédictive, catégorisation auto
- **Automatisations** - Workflows, règles métier
- **E-invoicing** - Facturation électronique (Chorus Pro, PPF)
- **Multi-devises** - Gestion multi-devises et change
- **Réglementaire** - Conformité multi-pays, exports fiscaux

## Skills Finance & Comptabilité (IA Intégrée)

CassKai dispose de **6 skills spécialisées** pour l'expertise comptable et financière, accessibles via l'assistant IA :

### Skills d'Analyse Finance (Transverses)

**1. casskai-finance-dashboard** - Analyse Trésorerie & BFR
- Calcul DSO, DIO, DPO, Cash Conversion Cycle
- Analyse aging des créances (buckets 0-30j, 31-60j, 61-90j, 91-120j, 120+j)
- Prévisions de trésorerie (weekly/monthly)
- Dashboards opérationnels cash-oriented
- Contexte Afrique de l'Ouest francophone (SYSCOHADA, paiements tardifs)
- **Déclenchement:** "Analyse la trésorerie", "Calcule le DSO", "Génère un aging analysis"

**2. casskai-cash-optimizer** - Optimisation BFR & Libération Cash
- Stratégies réduction DSO (collection, termes paiement, escomptes)
- Extension DPO (négociation fournisseurs)
- Optimisation DIO (stocks, ABC analysis, JIT adapté)
- Modélisation scénarios cash release
- Calculs ROI optimisations BFR
- **Déclenchement:** "Comment réduire le BFR ?", "Optimise les délais paiement", "Simule libération cash"

### Skills Normes Comptables (4 normes supportées)

**3. casskai-syscohada-reports** - Rapports SYSCOHADA (17 pays OHADA)
- Bilan, Compte de Résultat, TAFIRE
- Plan comptable 8 classes SYSCOHADA
- Zone FCFA (Côte d'Ivoire, Bénin, Sénégal, Burkina Faso, Togo, Mali, Niger, etc.)
- **Déclenchement:** "Génère un Bilan SYSCOHADA", "Crée le TAFIRE"

**4. casskai-pcg-reports** - Rapports PCG (France)
- Bilan, Compte de Résultat, Tableau flux trésorerie
- PCG 2014 (Autorité des Normes Comptables)
- 3 formats: système base, abrégé, développé
- **Déclenchement:** "Génère un Bilan français PCG", "Crée Compte de Résultat PCG"

**5. casskai-ifrs-reports** - Rapports IFRS (International)
- Statement of Financial Position
- Statement of Comprehensive Income (P&L + OCI)
- Statement of Cash Flows (IAS 7)
- Statement of Changes in Equity
- Fair value, impairment testing, instruments financiers
- **Déclenchement:** "Génère Statement of Financial Position IFRS", "Crée Statement Comprehensive Income"

**6. casskai-scf-reports** - Rapports SCF (Algérie)
- Bilan, Compte de Résultats, Flux de trésorerie
- Tableau variation capitaux propres
- SCF 2010 (inspiré IFRS adapté Algérie)
- Classification Courant/Non-courant
- **Déclenchement:** "Génère Bilan algérien SCF", "Crée Tableau variation capitaux propres"

### Couverture Géographique

**Total: 160+ pays couverts**
- **Afrique:** 18 pays (SYSCOHADA: 17 pays OHADA + SCF: Algérie)
- **Europe:** 27+ pays (PCG: France + IFRS: UE cotées)
- **Monde:** 140+ pays (IFRS: multinationales, consolidation internationale)

### Différenciateur Concurrentiel

**CassKai vs Pennylane/Sage/QuickBooks:**
- ✅ **4 normes comptables natives** (vs 1 seule chez concurrents)
- ✅ **SYSCOHADA natif** (unique sur le marché)
- ✅ **Expertise IA comptable** intégrée
- ✅ **Multi-pays africains** (33 pays couverts)
- ✅ **Analyse cash-oriented** (BFR, DSO, optimisation trésorerie)

### Localisation des Skills

```
.agents/skills/
├── casskai-finance-dashboard/     (~6 KB)
├── casskai-cash-optimizer/        (~12 KB)
├── casskai-syscohada-reports/     (~12 KB)
├── casskai-pcg-reports/           (~16 KB)
├── casskai-ifrs-reports/          (~15 KB)
└── casskai-scf-reports/           (~17 KB)
```

Les skills se déclenchent automatiquement via l'assistant IA en fonction du contexte de la requête utilisateur.

## Skills Externes (Développement & IA)

CassKai intègre **3 skills externes** pour améliorer les capacités de développement et d'IA :

### 1. agent-tools - Run 150+ AI Apps (inference.sh)

**Source:** https://github.com/inferencesh/skills

**Capacités:**
- ✅ **150+ AI apps** exécutables via CLI (inference.sh)
- ✅ **Image generation:** FLUX, Gemini 3 Pro, Grok Imagine, Seedream, Reve
- ✅ **Video generation:** Veo 3.1, Seedance, Wan, OmniHuman, Fabric
- ✅ **LLMs:** Claude, Gemini, Kimi K2, GLM-4, OpenRouter
- ✅ **Search:** Tavily, Exa (search, extract, answer)
- ✅ **3D generation:** Rodin 3D Generator
- ✅ **Twitter/X automation:** post-tweet, dm-send, user-follow, post-like

**Usage:**
```bash
# Generate image
infsh app run falai/flux-dev-lora --input '{"prompt": "a cat astronaut"}'

# Generate video
infsh app run google/veo-3-1-fast --input '{"prompt": "drone over mountains"}'

# Call Claude via OpenRouter
infsh app run openrouter/claude-sonnet-45 --input '{"prompt": "Explain quantum computing"}'

# Web search
infsh app run tavily/search-assistant --input '{"query": "latest AI news"}'
```

**Déclenchement:** "run ai app", "generate image with flux", "create video", "search web", "post to twitter"

**Localisation:** `~\.agents\skills\agent-tools`

---

### 2. mcp-builder - Build MCP Servers

**Source:** https://github.com/mcp-use/skills

**Capacités:**
- ✅ **Model Context Protocol (MCP)** server creation
- ✅ **mcp-use framework** integration
- ✅ **Tools, Resources, Prompts** definition
- ✅ **React widgets** for ChatGPT apps
- ✅ **Automatic widget discovery** from `resources/` folder
- ✅ **Templates:** starter (full-featured), mcp-apps (ChatGPT optimized), blank (minimal)

**Usage:**
```bash
# Bootstrap MCP server
npx create-mcp-use-app my-mcp-server

# With template
npx create-mcp-use-app my-server --template mcp-apps
cd my-server
yarn install
```

**MCP Server Example:**
```typescript
import { MCPServer, text } from "mcp-use/server";
import { z } from "zod";

const server = new MCPServer({
  name: "my-server",
  version: "1.0.0"
});

server.tool(
  {
    name: "greet-user",
    description: "Greet a user by name",
    schema: z.object({
      name: z.string().describe("The user's name")
    })
  },
  async ({ name }) => {
    return text(`Hello ${name}!`);
  }
);
```

**Déclenchement:** "create mcp server", "build mcp tool", "mcp-use", "model context protocol"

**Localisation:** `~\.agents\skills\mcp-builder`

---

### 3. typescript-advanced-types - Master TypeScript Types

**Source:** https://github.com/wshobson/agents

**Capacités:**
- ✅ **Generics** (type parameters, constraints, inference)
- ✅ **Conditional types** (T extends U ? X : Y)
- ✅ **Mapped types** (keyof, in, Pick, Omit)
- ✅ **Template literal types** (string manipulation)
- ✅ **Utility types** (Partial, Required, Record, etc.)
- ✅ **Advanced patterns** (recursive types, discriminated unions)

**Use Cases:**
- Type-safe libraries/frameworks
- Generic reusable components
- Complex type inference logic
- Type-safe API clients
- Form validation systems
- Strongly-typed state management

**Examples:**
```typescript
// Generic with constraints
interface HasLength {
  length: number;
}

function logLength<T extends HasLength>(item: T): T {
  console.log(item.length);
  return item;
}

// Conditional type
type IsString<T> = T extends string ? true : false;

// Mapped type
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

// Template literal type
type EventName = `on${Capitalize<string>}`;
```

**Déclenchement:** "typescript generics", "conditional types", "mapped types", "type inference", "utility types"

**Localisation:** `~\.agents\skills\typescript-advanced-types`

---

### Installation des Skills Externes

Les skills externes sont installées via le CLI officiel :

```bash
# agent-tools (150+ AI apps)
npx skills add https://github.com/inferencesh/skills --skill agent-tools -y -g

# mcp-builder (MCP servers)
npx skills add https://github.com/mcp-use/skills --skill mcp-builder -y -g

# typescript-advanced-types (TS advanced)
npx skills add https://github.com/wshobson/agents --skill typescript-advanced-types -y -g
```

Les skills sont symlinked vers Claude Code et s'activent automatiquement selon le contexte de la requête.

---

## Tests

### Tests unitaires (Vitest)
```typescript
// src/services/__tests__/example.test.ts
import { describe, it, expect } from 'vitest';

describe('ServiceName', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

### Tests E2E (Playwright)
```typescript
// e2e/example.spec.ts
import { test, expect } from '@playwright/test';

test('should login successfully', async ({ page }) => {
  await page.goto('http://localhost:5173');
  // ...
});
```

**Variables de test** (`.env.test.local`):
```bash
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!
```

## Problèmes connus et workarounds

### 1. Erreurs TypeScript temporaires
- `skipLibCheck: true` activé dans tsconfig
- Conflits de types AI à nettoyer
- Build fonctionne, types à améliorer progressivement

### 2. Imports de services
- Certains imports incohérents: `journalEntriesService` vs `journalEntryService`
- Vérifier les imports lors des modifications

### 3. Double comptage KPI
- Problème connu dans `realDashboardKpiService.ts`
- Utiliser les fonctions normalisées de ce service

### 4. Optimisation build
- Build production: ~2-3 minutes (normal avec compression)
- Build fast: ~30 secondes (dev uniquement)
- Utiliser `build:fast` pour tests rapides

## Ressources et documentation

### Guides UX (à consulter)
- `UX_IMPLEMENTATION_COMPLETE.md` - Récapitulatif complet UX v2.0
- `src/lib/TOAST_USAGE_GUIDE.md` - Guide des toast notifications
- `src/components/ui/EMPTYSTATE_USAGE_GUIDE.md` - Guide EmptyState
- `src/lib/VALIDATION_GUIDE.md` - Guide validation Zod
- `ACCESSIBILITY_GUIDE.md` - Guide accessibilité WCAG 2.1 AA
- `QUICK_REFERENCE_UX.md` - Référence rapide patterns UX

### Documentation technique
- `.github/copilot-instructions.md` - Instructions pour Copilot (compatible)
- `README.md` - Vue d'ensemble du projet
- `.env.example` - Variables d'environnement documentées

### Documentation externe
- Supabase: https://supabase.com/docs
- Radix UI: https://radix-ui.com/primitives/docs/overview/introduction
- Recharts: https://recharts.org/en-US/
- Zod: https://zod.dev
- React Hook Form: https://react-hook-form.com

## Checklist avant commit

- [ ] `npm run type-check` passe (ou erreurs TypeScript connues uniquement)
- [ ] `npm run lint` passe (warnings OK, pas d'erreurs)
- [ ] Tests unitaires pertinents ajoutés/mis à jour
- [ ] Toast notifications ajoutées pour les actions utilisateur
- [ ] Traductions ajoutées (fr, en, es)
- [ ] Pas de clés API ou secrets commités
- [ ] Pas de `console.log` debug inutiles
- [ ] Confirmations de suppression pour actions destructives
- [ ] RLS policies mises à jour si changement DB
- [ ] Documentation mise à jour si nouveau pattern

## Support et contact

- **Email**: contact@casskai.app
- **Site**: https://casskai.app
- **Issues**: (Repository privé)

---

**© 2025 Noutche Conseil SAS - Tous droits réservés**
