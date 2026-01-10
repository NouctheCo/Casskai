# CassKai - Documentation Technique Consolidée

> **Version:** 1.0.0  
> **Dernière mise à jour:** Janvier 2025  
> **Auteur:** NOUTCHE CONSEIL (SIREN 909 672 685)

---

## 📋 Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture technique](#2-architecture-technique)
3. [Modules fonctionnels](#3-modules-fonctionnels)
4. [Règles de gestion comptables](#4-règles-de-gestion-comptables)
5. [Flux de données inter-modules](#5-flux-de-données-inter-modules)
6. [Base de données](#6-base-de-données)
7. [Sécurité & Conformité](#7-sécurité--conformité)
8. [Internationalisation](#8-internationalisation)
9. [Déploiement](#9-déploiement)
10. [Maintenance](#10-maintenance)

---

## 1. Vue d'ensemble

### 1.1 Qu'est-ce que CassKai ?

CassKai est une **plateforme SaaS de gestion financière tout-en-un** destinée aux PME et indépendants. Elle offre :

- 📊 Tableau de bord synthétique avec KPIs en temps réel
- 📚 Tenue de comptabilité (PCG, SYSCOHADA, IFRS)
- 🏦 Rapprochement bancaire automatisé
- 📄 Facturation et devis
- 📈 Rapports financiers et prévisions
- 🌍 Support multi-pays et multi-devises

### 1.2 Marchés cibles

| Région | Pays | Norme comptable |
|--------|------|-----------------|
| Europe | France, Belgique, Luxembourg | PCG (Plan Comptable Général) |
| Afrique OHADA | Sénégal, Côte d'Ivoire, Cameroun, Mali, Burkina Faso, Gabon, Bénin, Togo | SYSCOHADA |
| Afrique anglophone | Kenya, Nigeria, Ghana, Afrique du Sud | IFRS |
| Maghreb | Maroc, Tunisie, Algérie | SCF / PCN |

### 1.3 Positionnement

CassKai se positionne comme alternative à :
- Pennylane (France)
- Sage / Sage 50
- QuickBooks
- Wave Accounting

**Différenciateurs clés :**
- Multi-pays natif (pas un add-on)
- IA intégrée pour catégorisation et prévisions
- Prix compétitif pour marchés émergents
- Interface moderne (React 18)

---

## 2. Architecture technique

### 2.1 Stack technologique

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
├─────────────────────────────────────────────────────────────┤
│  React 18 + TypeScript + Vite                               │
│  Tailwind CSS 3 (dark mode: 'class')                        │
│  Framer Motion (animations)                                  │
│  Recharts / Chart.js (graphiques)                           │
│  Lucide React (icônes)                                       │
│  react-i18next (internationalisation)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
├─────────────────────────────────────────────────────────────┤
│  Supabase (PostgreSQL + Auth + Storage + Realtime)          │
│  Row Level Security (RLS) pour isolation multi-tenant       │
│  Edge Functions (Deno) pour logique serveur                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SERVICES EXTERNES                       │
├─────────────────────────────────────────────────────────────┤
│  Stripe (paiements)                                          │
│  SendGrid (emails transactionnels)                          │
│  Bridge / Budget Insight (Open Banking)                      │
│  OpenAI (analyse IA)                                         │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Structure du projet

```
casskai/
├── src/
│   ├── components/          # Composants React réutilisables
│   │   ├── accounting/      # Composants comptabilité
│   │   ├── banking/         # Composants banque
│   │   ├── dashboard/       # Composants tableau de bord
│   │   ├── invoicing/       # Composants facturation
│   │   ├── ui/              # Composants UI génériques (shadcn)
│   │   └── ...
│   ├── contexts/            # Contextes React (Auth, Theme, etc.)
│   ├── hooks/               # Hooks personnalisés
│   ├── lib/                 # Utilitaires (supabase, logger, utils)
│   ├── modules/             # Définitions des modules métier
│   ├── pages/               # Pages de l'application
│   ├── services/            # Services métier (API calls, logique)
│   ├── types/               # Types TypeScript
│   ├── data/                # Données statiques (PCG, SYSCOHADA)
│   └── i18n/                # Fichiers de traduction
├── supabase/
│   ├── migrations/          # Migrations SQL
│   └── functions/           # Edge Functions
├── public/                  # Assets statiques
├── scripts/                 # Scripts utilitaires
└── docs/                    # Documentation
```

### 2.3 Patterns architecturaux

#### Service Layer Pattern
Chaque domaine métier a son service dédié :
```typescript
// Exemple: services/invoicingService.ts
class InvoicingService {
  async createInvoice(data, items) { ... }
  async getInvoices(filters) { ... }
  async updateInvoiceStatus(id, status) { ... }
}
export const invoicingService = new InvoicingService();
```

#### Context Pattern pour l'état global
```typescript
// contexts/AuthContext.tsx
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const useAuth = () => useContext(AuthContext);
```

#### Logger centralisé
```typescript
// lib/logger.ts
import { logger } from '@/lib/logger';
logger.info('Context', 'Message', { data });
logger.error('Context', 'Error message', error);
```

---

## 3. Modules fonctionnels

### 3.1 Vue d'ensemble des 13 modules

| Module | Chemin | Dépendances | Description |
|--------|--------|-------------|-------------|
| **Comptabilité** | `/accounting` | - | Journal, plan comptable, écritures |
| **Facturation** | `/invoicing` | accounting, thirdParties | Factures, devis, paiements |
| **Banque** | `/banks` | accounting | Comptes, transactions, rapprochement |
| **Tiers** | `/third-parties` | - | Clients, fournisseurs |
| **CRM** | `/crm` | accounting | Pipeline commercial, opportunités |
| **Achats** | `/purchases` | accounting, thirdParties | Factures fournisseurs |
| **Rapports** | `/reports` | accounting | Bilan, compte de résultat, FEC |
| **Fiscalité** | `/tax` | accounting | TVA, déclarations fiscales |
| **Prévisions** | `/forecasts` | accounting | Budgets, projections |
| **RH** | `/hr` | - | Employés, paie, congés |
| **Projets** | `/projects` | - | Gestion de projets, tâches |
| **Stocks** | `/inventory` | - | Articles, mouvements, valorisation |
| **Contrats** | `/contracts` | - | Gestion des contrats, RFA |

### 3.2 Graphe des dépendances

```
                    ┌─────────────┐
                    │  ACCOUNTING │ (Module central)
                    └──────┬──────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   BANKING   │     │  INVOICING  │     │   REPORTS   │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
             ┌───────────┐ ┌───────────┐
             │THIRD_PARTY│ │    CRM    │
             └───────────┘ └───────────┘
```

### 3.3 Définition d'un module

```typescript
// modules/invoicing/invoicingModule.ts
export const invoicingModule: Module = {
  definition: {
    id: 'invoicing',
    key: 'invoicing',
    name: 'Facturation',
    description: 'Création et gestion de vos factures clients',
    version: '1.0.0',
    author: 'CassKai Team',
    category: 'business',
    icon: 'FileText',
    path: '/invoicing',
    isPremium: true,
    isCore: false,
    status: 'available',
    dependencies: ['accounting', 'thirdParties'], // ⬅️ Important !
    conflicts: [],
  },
  getRoutes: () => [
    { path: '/invoicing', component: InvoicingPage, exact: true },
  ],
};
```

---

## 4. Règles de gestion comptables

### 4.1 Principe fondamental : Débit = Crédit

Toute écriture comptable doit être équilibrée :

```typescript
// services/journalEntriesService.ts
async validateEntry(lines: JournalEntryLine[]): Promise<boolean> {
  const totalDebit = lines.reduce((sum, l) => sum + (l.debit_amount || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (l.credit_amount || 0), 0);
  
  // Tolérance de 0.01€ pour les arrondis
  return Math.abs(totalDebit - totalCredit) < 0.01;
}
```

### 4.2 Génération automatique des écritures comptables

Quand une facture est créée, une écriture comptable est générée automatiquement :

```typescript
// services/invoiceJournalEntryService.ts

// FACTURE DE VENTE
// Débit 411xxx (Client)      = Montant TTC
// Crédit 707xxx (Ventes)     = Montant HT
// Crédit 44571 (TVA collectée) = TVA

// FACTURE D'ACHAT  
// Débit 6xxxxx (Charges)     = Montant HT
// Débit 44566 (TVA déductible) = TVA
// Crédit 401xxx (Fournisseur) = Montant TTC
```

### 4.3 Calcul de la TVA

```typescript
// services/vatCalculationService.ts
private static readonly FRENCH_VAT_RATES = {
  standard: 0.20,        // 20% - Taux normal
  reduced: 0.10,         // 10% - Taux réduit
  super_reduced: 0.055,  // 5.5% - Taux super réduit
  special: 0.021,        // 2.1% - Taux particulier (médicaments)
  zero: 0.0,             // Exonération
  corsica_standard: 0.20,
  corsica_reduced: 0.10,
  corsica_super_reduced: 0.021,
};

static calculateVAT(params: {
  amountHT: number;
  vatRate: number;
  regime?: string;
  territory?: string;
}): { amountHT, vatAmount, amountTTC, effectiveRate } {
  // Logique de calcul avec régimes spéciaux
}
```

### 4.4 Plans comptables supportés

#### PCG Français (Plan Comptable Général)
```
Classe 1 : Comptes de capitaux
Classe 2 : Comptes d'immobilisations
Classe 3 : Comptes de stocks
Classe 4 : Comptes de tiers
Classe 5 : Comptes financiers
Classe 6 : Comptes de charges
Classe 7 : Comptes de produits
```

#### SYSCOHADA (Afrique)
```
Même structure que PCG avec adaptations :
- Classes 8 et 9 pour comptabilité analytique
- Comptes spécifiques OHADA
```

### 4.5 Rapports financiers

| Rapport | Source | Calcul |
|---------|--------|--------|
| **Bilan** | Classes 1-5 | Actif = Passif + Capitaux propres |
| **Compte de résultat** | Classes 6-7 | Résultat = Produits - Charges |
| **Balance générale** | Toutes classes | Total Débit = Total Crédit |
| **FEC** | Écritures validées | Export conforme DGFiP |

```typescript
// services/financialReportsService.ts
interface BalanceSheetData {
  assets: { current: [], fixed: [], total: number };
  liabilities: { current: [], longTerm: [], total: number };
  equity: { accounts: [], total: number };
  totalAssets: number;
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean; // ⬅️ Vérification automatique
}
```

---

## 5. Flux de données inter-modules

### 5.1 Flux principal : Facture → Comptabilité → Rapports

```
┌──────────────┐     ┌──────────────────────┐     ┌─────────────┐
│   INVOICING  │────▶│ invoiceJournalEntry  │────▶│  ACCOUNTING │
│              │     │      Service         │     │             │
│ createInvoice│     │ generateJournalEntry │     │ journal_    │
│              │     │                      │     │ entries     │
└──────────────┘     └──────────────────────┘     └──────┬──────┘
                                                         │
                     ┌───────────────────────────────────┘
                     │
                     ▼
              ┌─────────────┐     ┌─────────────┐
              │   REPORTS   │────▶│  FEC Export │
              │             │     │             │
              │ Bilan       │     │ XML/CSV     │
              │ Résultat    │     │ DGFiP       │
              └─────────────┘     └─────────────┘
```

### 5.2 Flux bancaire : Import → Catégorisation → Rapprochement

```
┌──────────────┐     ┌──────────────────────┐     ┌─────────────┐
│ Bank Import  │────▶│ AI Categorization    │────▶│Reconciliation│
│              │     │                      │     │             │
│ OFX/QIF/CSV  │     │ categorizationService│     │ Auto-match  │
│ Open Banking │     │                      │     │ Manual      │
└──────────────┘     └──────────────────────┘     └──────┬──────┘
                                                         │
                     ┌───────────────────────────────────┘
                     │
                     ▼
              ┌─────────────┐
              │  ACCOUNTING │
              │             │
              │ Écritures   │
              │ validées    │
              └─────────────┘
```

### 5.3 Flux CRM : Opportunité → Devis → Facture

```
┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│     CRM      │────▶│    QUOTES    │────▶│  INVOICING  │
│              │     │              │     │             │
│ Opportunité  │     │ Devis signé  │     │ Facture     │
│ gagnée       │     │              │     │ générée     │
└──────────────┘     └──────────────┘     └─────────────┘
```

---

## 6. Base de données

### 6.1 Tables principales

```sql
-- Entreprises (multi-tenant)
companies (id, name, siren, country, accounting_standard, ...)

-- Utilisateurs
users (id, email, ...)
user_companies (user_id, company_id, role, is_default)

-- Comptabilité
chart_of_accounts (id, company_id, account_number, account_name, account_class, ...)
journals (id, company_id, code, name, type, ...)
journal_entries (id, company_id, journal_id, entry_date, status, ...)
journal_entry_lines (id, entry_id, account_number, debit_amount, credit_amount, ...)

-- Facturation
invoices (id, company_id, third_party_id, invoice_number, total_incl_tax, status, ...)
invoice_lines (id, invoice_id, description, quantity, unit_price, tax_rate, ...)

-- Tiers
third_parties (id, company_id, type, name, email, ...)

-- Banque
bank_accounts (id, company_id, name, iban, balance, ...)
bank_transactions (id, bank_account_id, amount, transaction_date, category, ...)
```

### 6.2 Row Level Security (RLS)

Chaque table a des policies RLS pour isoler les données par entreprise :

```sql
-- Exemple pour la table invoices
CREATE POLICY "Users can view invoices of their companies"
ON invoices FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM user_companies 
    WHERE user_id = auth.uid()
  )
);
```

### 6.3 Triggers automatiques

```sql
-- Mise à jour automatique du solde des comptes
CREATE TRIGGER update_account_balance
AFTER INSERT OR UPDATE OR DELETE ON journal_entry_lines
FOR EACH ROW EXECUTE FUNCTION update_chart_of_accounts_balance();

-- Mise à jour du statut facture (overdue)
CREATE TRIGGER check_invoice_overdue
AFTER UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION check_and_update_overdue_status();
```

---

## 7. Sécurité & Conformité

### 7.1 Authentification

- **Supabase Auth** avec JWT
- Support email/password + OAuth (Google, Microsoft)
- 2FA optionnel (TOTP)
- Sessions sécurisées avec refresh tokens

### 7.2 Autorisation (RBAC)

```typescript
// Rôles disponibles
type UserRole = 'owner' | 'admin' | 'accountant' | 'user' | 'viewer';

// Permissions par module
const PERMISSIONS = {
  ACCOUNTING_VIEW: 'accounting:view',
  ACCOUNTING_EDIT: 'accounting:edit',
  INVOICING_CREATE: 'invoicing:create',
  REPORTS_EXPORT: 'reports:export',
  // ...
};
```

### 7.3 Conformité RGPD

- **Droit à l'effacement** : `accountDeletionService.ts`
- **Export des données** : `gdprRequestsService.ts`
- **Consentement cookies** : `CookieConsentBanner.tsx`
- **Logs d'audit** : `auditService.ts`

### 7.4 Conformité fiscale

| Pays | Obligation | Implémentation |
|------|------------|----------------|
| France | FEC (Fichier des Écritures Comptables) | `fecExportService.ts` |
| France | Factur-X / ZUGFeRD | `einvoicing/` |
| OHADA | États financiers SYSCOHADA | `reportGenerationService.ts` |

---

## 8. Internationalisation

### 8.1 Langues supportées

| Code | Langue | Complétude |
|------|--------|------------|
| `fr` | Français | 100% |
| `en` | English | 100% |
| `es` | Español | 90% |

### 8.2 Structure des traductions

```
src/i18n/locales/
├── fr.json        # Français
├── en.json        # English
└── es.json        # Español
```

### 8.3 Utilisation

```tsx
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  return <h1>{t('dashboard.title')}</h1>;
};
```

### 8.4 Devises supportées

```typescript
// config/currencies.ts
export const SUPPORTED_CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'XOF', symbol: 'CFA', name: 'Franc CFA BCEAO' },
  { code: 'XAF', symbol: 'FCFA', name: 'Franc CFA BEAC' },
  { code: 'MAD', symbol: 'DH', name: 'Dirham marocain' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  // ...
];
```

---

## 9. Déploiement

### 9.1 Environnements

| Environnement | URL | Base de données |
|---------------|-----|-----------------|
| Development | localhost:5173 | Supabase local |
| Staging | staging.casskai.app | Supabase Cloud (staging) |
| Production | casskai.app | Supabase Cloud (prod) |

### 9.2 Variables d'environnement

```env
# .env.production
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
VITE_OPENAI_API_KEY=sk-...
VITE_SENTRY_DSN=https://...
```

### 9.3 Déploiement VPS (Hostinger)

```bash
# Script de déploiement
./deploy-vps.ps1

# Étapes automatisées :
# 1. npm run build
# 2. Copie dist/ vers VPS via SSH
# 3. Redémarrage Nginx
```

### 9.4 CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - run: npm run deploy
```

---

## 10. Maintenance

### 10.1 Logging

```typescript
import { logger } from '@/lib/logger';

// Niveaux disponibles
logger.debug('Context', 'Message debug');   // Dev only
logger.info('Context', 'Message info');     // Dev only
logger.warn('Context', 'Message warning');  // Dev + Prod
logger.error('Context', 'Message error');   // Dev + Prod
```

### 10.2 Monitoring

- **Sentry** : Erreurs JavaScript
- **Plausible** : Analytics (RGPD-friendly)
- **Supabase Dashboard** : Métriques DB

### 10.3 Mise à jour des dépendances

```bash
# Vérifier les mises à jour
npm outdated

# Mettre à jour (avec prudence)
npm update

# Audit de sécurité
npm audit
npm audit fix
```

### 10.4 Backup base de données

- **Automatique** : Supabase fait des backups quotidiens
- **Manuel** : Export via Dashboard Supabase ou `pg_dump`

---

## 📞 Support

- **Documentation** : https://docs.casskai.app
- **Support** : support@casskai.app
- **GitHub Issues** : Pour les bugs techniques

---

## 📝 Changelog

Voir `CHANGELOG.md` pour l'historique des versions.

---

*Document généré automatiquement - Janvier 2025*
*© NOUTCHE CONSEIL - Tous droits réservés*