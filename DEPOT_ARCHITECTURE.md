# Architecture CassKai - Documentation technique

## Vue d'ensemble

CassKai est une application SaaS moderne construite avec une architecture en couches, séparant clairement le frontend (React/TypeScript) du backend (Supabase/PostgreSQL).

## Stack technologique

### Frontend
- **Framework UI** : React 18.3.1
- **Langage** : TypeScript 5.6.3
- **Build Tool** : Vite 7.1.7
- **Styling** : Tailwind CSS 3.4.17
- **State Management** : React Context API + Custom Hooks
- **Routing** : React Router DOM 7.1.1
- **Data Fetching** : React Query / Custom Hooks
- **Forms** : React Hook Form + Zod validation
- **Charts** : Recharts 2.15.0
- **Date Handling** : date-fns 4.1.0
- **i18n** : i18next 24.2.0
- **Icons** : Lucide React 0.468.0
- **PDF Generation** : jsPDF 2.5.2, pdfmake 0.2.15
- **Excel Export** : xlsx 0.18.5

### Backend (Supabase)
- **Database** : PostgreSQL 15
- **Auth** : Supabase Auth (JWT)
- **Storage** : Supabase Storage (S3-compatible)
- **Realtime** : Supabase Realtime (WebSocket)
- **Edge Functions** : Deno Runtime
- **API** : Auto-generated REST + GraphQL

### Infrastructure
- **Hosting** : Hostinger VPS (Ubuntu)
- **Web Server** : Nginx
- **Process Manager** : PM2
- **SSL** : Let's Encrypt
- **CDN** : Cloudflare (optional)
- **Monitoring** : PM2 Monitoring + Custom Analytics

## Architecture Frontend

### Structure des dossiers

```
src/
├── components/           # Composants React réutilisables
│   ├── accounting/      # Comptabilité
│   ├── ai/              # Assistant IA
│   ├── analytics/       # Analytics
│   ├── auth/            # Authentification
│   ├── automation/      # Automatisation
│   ├── banking/         # Banques
│   ├── budget/          # Budget
│   ├── common/          # Composants communs
│   ├── crm/             # CRM
│   ├── dashboard/       # Tableaux de bord
│   ├── error/           # Gestion d'erreurs
│   ├── fiscal/          # Fiscalité
│   ├── forecasts/       # Prévisions
│   ├── guards/          # Guards de routes
│   ├── hr/              # Ressources Humaines
│   ├── inventory/       # Inventaire
│   ├── invoicing/       # Facturation
│   ├── layout/          # Layout (Header, Sidebar)
│   ├── modules/         # Gestion des modules
│   ├── navigation/      # Navigation
│   ├── notifications/   # Notifications
│   ├── projects/        # Projets
│   ├── purchases/       # Achats
│   ├── reports/         # Rapports
│   ├── settings/        # Paramètres
│   ├── setup/           # Configuration initiale
│   ├── subscription/    # Abonnements
│   ├── support/         # Support
│   ├── third-parties/   # Tiers
│   ├── ui/              # UI Components de base
│   └── widgets/         # Widgets réutilisables
│
├── pages/               # Pages principales
│   ├── AccountingPage.tsx
│   ├── DashboardPage.tsx
│   ├── InvoicingPage.tsx
│   ├── BanksPage.tsx
│   ├── BudgetPage.tsx
│   ├── TaxPage.tsx
│   ├── SalesCrmPage.tsx
│   ├── ContractsPage.tsx
│   ├── PurchasesPage.tsx
│   ├── InventoryPage.tsx
│   ├── ProjectsPage.tsx
│   ├── ThirdPartiesPage.tsx
│   ├── HumanResourcesPage.tsx
│   ├── ReportsPage.tsx
│   ├── AutomationPage.tsx
│   ├── SettingsPage.tsx
│   ├── UserManagementPage.tsx
│   ├── BillingPage.tsx
│   └── admin/
│       └── RGPDAdminDashboard.tsx
│
├── services/            # Services API
│   ├── accountingService.ts
│   ├── authService.ts
│   ├── bankingService.ts
│   ├── budgetService.ts
│   ├── clientsService.ts
│   ├── companiesService.ts
│   ├── contractsService.ts
│   ├── crmService.ts
│   ├── employeesService.ts
│   ├── forecastsService.ts
│   ├── invoicesService.ts
│   ├── journalEntriesService.ts
│   ├── modulesService.ts
│   ├── notificationsService.ts
│   ├── paymentsService.ts
│   ├── productsService.ts
│   ├── projectsService.ts
│   ├── purchasesService.ts
│   ├── quotesService.ts
│   ├── referentialsService.ts
│   ├── reportsService.ts
│   ├── sepaService.ts
│   ├── subscriptionService.ts
│   ├── taxService.ts
│   ├── unifiedThirdPartiesService.ts
│   ├── userManagementService.ts
│   └── workflowService.ts
│
├── hooks/               # Custom Hooks
│   ├── useAuth.ts
│   ├── useCompany.ts
│   ├── useModules.ts
│   ├── useNotifications.ts
│   ├── usePermissions.ts
│   ├── useServiceWorker.ts
│   ├── useSubscription.ts
│   └── useTenant.ts
│
├── contexts/            # React Contexts
│   ├── AuthContext.tsx
│   ├── LocaleContext.tsx
│   ├── OnboardingContextNew.tsx
│   └── ThemeContext.tsx
│
├── lib/                 # Utilitaires
│   ├── supabase.ts      # Client Supabase
│   ├── stripe.ts        # Client Stripe
│   ├── utils.ts         # Helpers généraux
│   ├── encryption.ts    # Chiffrement AES-256
│   ├── validation.ts    # Schémas de validation
│   └── constants.ts     # Constantes
│
├── types/               # Types TypeScript
│   ├── accounting.types.ts
│   ├── ai-types.ts
│   ├── automation.types.ts
│   ├── banking.types.ts
│   ├── budget.types.ts
│   ├── company.types.ts
│   ├── crm.types.ts
│   ├── database.types.ts
│   ├── hr.types.ts
│   ├── inventory.types.ts
│   ├── invoicing.types.ts
│   ├── modules.types.ts
│   ├── projects.types.ts
│   ├── reports.types.ts
│   ├── subscription.types.ts
│   └── user.types.ts
│
└── i18n/                # Internationalisation
    ├── i18n.ts
    └── locales/
        ├── en.json      # Anglais
        ├── es.json      # Espagnol
        └── fr.json      # Français
```

### Flux de données

```
┌─────────────────────────────────────────────────────────┐
│                     React Components                     │
│  (Pages, Components, Forms, Tables, Charts, Modals)     │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ useState, useEffect, useQuery
                     │
┌────────────────────▼────────────────────────────────────┐
│                   Custom Hooks                          │
│  (useAuth, useCompany, useModules, usePermissions)      │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Service calls
                     │
┌────────────────────▼────────────────────────────────────┐
│                   Services Layer                        │
│  (API clients, Business logic, Data transformation)     │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Supabase Client
                     │
┌────────────────────▼────────────────────────────────────┐
│                   Supabase API                          │
│  (REST, GraphQL, Realtime, Auth, Storage)              │
└────────────────────┬────────────────────────────────────┘
                     │
                     │
┌────────────────────▼────────────────────────────────────┐
│                   PostgreSQL Database                   │
│  (Tables, Views, Functions, Triggers, RLS)             │
└─────────────────────────────────────────────────────────┘
```

## Architecture Backend (Supabase)

### Schéma de base de données

#### Tables principales

**companies** - Entreprises (Tenants)
```sql
- id (uuid, PK)
- name (text)
- siren (text)
- country (text)
- currency (text)
- accounting_standard (text) -- PCG, SYSCOHADA, IFRS
- fiscal_year_end (date)
- onboarding_completed_at (timestamp)
- created_at (timestamp)
```

**users** - Utilisateurs
```sql
- id (uuid, PK, FK auth.users)
- email (text)
- role (text) -- admin, manager, user
- company_id (uuid, FK companies)
- preferences (jsonb)
- last_login_at (timestamp)
- created_at (timestamp)
```

**modules** - Modules activés par entreprise
```sql
- id (uuid, PK)
- company_id (uuid, FK companies)
- module_type (text) -- accounting, invoicing, etc.
- is_enabled (boolean)
- config (jsonb)
- created_at (timestamp)
```

**journal_entries** - Écritures comptables
```sql
- id (uuid, PK)
- company_id (uuid, FK companies)
- journal_code (text)
- entry_date (date)
- reference (text)
- description (text)
- status (text) -- draft, posted, validated
- created_by (uuid, FK users)
- created_at (timestamp)
```

**journal_entry_lines** - Lignes d'écriture
```sql
- id (uuid, PK)
- journal_entry_id (uuid, FK journal_entries)
- account_number (text)
- label (text)
- debit (decimal)
- credit (decimal)
- currency (text)
```

**chart_of_accounts** - Plan comptable
```sql
- id (uuid, PK)
- company_id (uuid, FK companies)
- account_number (text)
- account_name (text)
- account_type (text) -- asset, liability, equity, revenue, expense
- parent_account (text)
- is_active (boolean)
```

**invoices** - Factures
```sql
- id (uuid, PK)
- company_id (uuid, FK companies)
- invoice_number (text)
- invoice_date (date)
- due_date (date)
- client_id (uuid, FK third_parties)
- total_ht (decimal)
- total_ttc (decimal)
- status (text) -- draft, sent, paid, cancelled
- currency (text)
```

**invoice_lines** - Lignes de facture
```sql
- id (uuid, PK)
- invoice_id (uuid, FK invoices)
- description (text)
- quantity (decimal)
- unit_price (decimal)
- vat_rate (decimal)
- total (decimal)
```

**bank_accounts** - Comptes bancaires
```sql
- id (uuid, PK)
- company_id (uuid, FK companies)
- bank_name (text)
- account_number (text)
- iban (text)
- currency (text)
- balance (decimal)
```

**bank_transactions** - Transactions bancaires
```sql
- id (uuid, PK)
- bank_account_id (uuid, FK bank_accounts)
- transaction_date (date)
- description (text)
- amount (decimal)
- category (text)
- is_reconciled (boolean)
- reconciled_entry_id (uuid, FK journal_entries)
```

**budgets** - Budgets
```sql
- id (uuid, PK)
- company_id (uuid, FK companies)
- name (text)
- fiscal_year (int)
- status (text) -- draft, active, archived
- created_at (timestamp)
```

**budget_lines** - Lignes de budget
```sql
- id (uuid, PK)
- budget_id (uuid, FK budgets)
- account_number (text)
- period (text) -- monthly, quarterly, yearly
- amount_planned (decimal)
```

**third_parties** - Tiers (clients/fournisseurs)
```sql
- id (uuid, PK)
- company_id (uuid, FK companies)
- type (text) -- client, supplier, both
- name (text)
- email (text)
- phone (text)
- address (jsonb)
- tax_number (text)
```

**crm_opportunities** - Opportunités CRM
```sql
- id (uuid, PK)
- company_id (uuid, FK companies)
- client_id (uuid, FK third_parties)
- name (text)
- value (decimal)
- stage (text) -- lead, qualified, proposal, negotiation, won, lost
- probability (int)
- expected_close_date (date)
```

**projects** - Projets
```sql
- id (uuid, PK)
- company_id (uuid, FK companies)
- name (text)
- client_id (uuid, FK third_parties)
- budget (decimal)
- status (text) -- planned, active, completed, cancelled
- start_date (date)
- end_date (date)
```

**employees** - Employés
```sql
- id (uuid, PK)
- company_id (uuid, FK companies)
- first_name (text)
- last_name (text)
- email (text)
- position (text)
- hire_date (date)
- salary (decimal)
- status (text) -- active, inactive
```

**subscriptions** - Abonnements
```sql
- id (uuid, PK)
- company_id (uuid, FK companies)
- plan (text) -- starter, pro, enterprise
- status (text) -- active, cancelled, past_due
- stripe_subscription_id (text)
- current_period_end (timestamp)
```

**audit_logs** - Logs d'audit
```sql
- id (uuid, PK)
- company_id (uuid, FK companies)
- user_id (uuid, FK users)
- action (text)
- resource_type (text)
- resource_id (uuid)
- details (jsonb)
- ip_address (inet)
- user_agent (text)
- created_at (timestamp)
```

### Row Level Security (RLS)

Toutes les tables sont protégées par RLS Supabase :

```sql
-- Exemple pour la table companies
CREATE POLICY "Users can only see their own company"
  ON companies FOR SELECT
  USING (id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- Exemple pour la table journal_entries
CREATE POLICY "Users can only access their company's entries"
  ON journal_entries FOR ALL
  USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));
```

### Fonctions PostgreSQL

**calculate_account_balance(account_number, company_id, date_end)**
- Calcule le solde d'un compte à une date donnée

**generate_invoice_number(company_id)**
- Génère automatiquement le prochain numéro de facture

**apply_bank_reconciliation_rules(transaction_id)**
- Applique les règles de catégorisation automatique

**calculate_vat(amount, country_code, vat_type)**
- Calcule la TVA selon le pays et le type

## Flux d'authentification

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ 1. Login (email/password)
       │
┌──────▼──────────────────────────────────┐
│  Supabase Auth                          │
│  - Vérifie credentials                  │
│  - Génère JWT access + refresh token    │
└──────┬──────────────────────────────────┘
       │ 2. JWT tokens
       │
┌──────▼──────────────────────────────────┐
│  Frontend (React)                       │
│  - Stocke tokens (localStorage)         │
│  - Configure Supabase client            │
└──────┬──────────────────────────────────┘
       │ 3. API calls avec JWT
       │
┌──────▼──────────────────────────────────┐
│  Supabase API + RLS                     │
│  - Valide JWT                           │
│  - Applique RLS policies                │
│  - Retourne données filtrées            │
└─────────────────────────────────────────┘
```

### Gestion des sessions

- **Access Token** : JWT valide 1 heure
- **Refresh Token** : Valide 30 jours
- **Auto-refresh** : Géré automatiquement par Supabase client
- **Logout** : Suppression des tokens + révocation côté serveur

## Intégrations externes

### Stripe (Paiements)

```typescript
// Création d'un checkout Stripe
const session = await stripe.checkout.sessions.create({
  customer: stripeCustomerId,
  mode: 'subscription',
  line_items: [{ price: priceId, quantity: 1 }],
  success_url: 'https://casskai.app/billing/success',
  cancel_url: 'https://casskai.app/billing/cancel'
});
```

### Webhooks Stripe

Événements écoutés :
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## Sécurité

### Chiffrement

**AES-256 pour données sensibles**
```typescript
// Chiffrement
const encrypted = CryptoJS.AES.encrypt(
  data,
  encryptionKey
).toString();

// Déchiffrement
const decrypted = CryptoJS.AES.decrypt(
  encrypted,
  encryptionKey
).toString(CryptoJS.enc.Utf8);
```

### Protection CSRF

- Tokens CSRF sur formulaires sensibles
- SameSite cookies
- Validation des origins

### Protection XSS

- Sanitization des inputs utilisateur
- Content Security Policy headers
- Escape des données dans le DOM

### SQL Injection

- Requêtes paramétrées (Supabase)
- Validation des entrées
- Types stricts TypeScript

## Performance

### Optimisations Frontend

- **Code splitting** : Lazy loading des pages
- **Tree shaking** : Vite optimise le bundle
- **Compression** : Gzip + Brotli
- **CDN** : Assets statiques
- **Service Worker** : Cache offline

### Optimisations Backend

- **Indexation DB** : Index sur colonnes fréquemment requêtées
- **Materialized Views** : Vues matérialisées pour rapports
- **Connection pooling** : Supabase gère automatiquement
- **Caching** : Redis pour sessions et données fréquentes

### Métriques

- **Lighthouse Score** : > 90
- **First Contentful Paint** : < 1.5s
- **Time to Interactive** : < 3s
- **Bundle size** : ~2.3 MB (gzipped ~687 KB)

## Monitoring & Logs

### Frontend
- Sentry pour erreurs JavaScript
- Google Analytics pour usage
- Custom analytics pour événements métier

### Backend
- Supabase Dashboard (logs, performance)
- PM2 monitoring (CPU, RAM, uptime)
- Nginx access logs
- PostgreSQL slow query logs

## Déploiement

### Pipeline CI/CD

```
┌────────────┐
│ Git Push   │
└─────┬──────┘
      │
┌─────▼───────────────┐
│ npm run build       │
│ - TypeScript check  │
│ - Vite build        │
│ - Optimization      │
└─────┬───────────────┘
      │
┌─────▼───────────────┐
│ Upload to VPS       │
│ - SCP to temp dir   │
│ - Backup old build  │
└─────┬───────────────┘
      │
┌─────▼───────────────┐
│ Atomic Deploy       │
│ - Move to /var/www  │
│ - Fix permissions   │
└─────┬───────────────┘
      │
┌─────▼───────────────┐
│ Restart Services    │
│ - Nginx reload      │
│ - PM2 restart       │
└─────┬───────────────┘
      │
┌─────▼───────────────┐
│ Health Check        │
│ - HTTP 200 test     │
│ - HTTPS test        │
└─────────────────────┘
```

### Script de déploiement

Fichier : [deploy-vps.ps1](deploy-vps.ps1) (Windows) ou [deploy-vps.sh](deploy-vps.sh) (Linux)

## Backup & Disaster Recovery

### Base de données
- **Backup automatique** : Supabase (quotidien)
- **Point-in-time recovery** : Jusqu'à 7 jours
- **Export manuel** : SQL dumps

### Fichiers
- **VPS Backup** : Automatique avant chaque déploiement
- **Storage Supabase** : Réplication multi-région

### Plan de reprise
1. Restauration DB Supabase (< 1h)
2. Redéploiement frontend depuis Git (< 15 min)
3. Vérification des services (< 5 min)

---

**Document mis à jour** : 30 novembre 2025
**Version** : 1.0.0