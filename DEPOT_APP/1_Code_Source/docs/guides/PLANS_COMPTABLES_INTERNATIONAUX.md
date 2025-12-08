# Plans Comptables Internationaux - Guide Complet

## 🌍 Vue d'Ensemble

CassKai supporte désormais **10 pays** avec leurs plans comptables standards:

| Région | Pays | Code | Standard | Comptes |
|--------|------|------|----------|---------|
| **Afrique Francophone** | Bénin | BJ | SYSCOHADA | ~150 |
| | Côte d'Ivoire | CI | SYSCOHADA | ~150 |
| | Togo | TG | SYSCOHADA | ~150 |
| | Cameroun | CM | SYSCOHADA | ~150 |
| | Gabon | GA | SYSCOHADA | ~150 |
| **Afrique Anglophone** | Ghana | GH | Ghana GAAP | ~80 |
| | Nigeria | NG | Nigerian GAAP | ~70 |
| **International** | France | FR | PCG | ~200 |
| | États-Unis | US | US GAAP | ~150 |
| | Royaume-Uni | UK | UK GAAP / FRS 102 | ~130 |

## 📋 Détails par Région

### 🇧🇯🇨🇮🇹🇬🇨🇲🇬🇦 SYSCOHADA (Afrique Francophone)

**Pays**: Bénin, Côte d'Ivoire, Togo, Cameroun, Gabon

**Référence**: Système Comptable OHADA (Organisation pour l'Harmonisation en Afrique du Droit des Affaires)

**Structure**:
- **Classe 1**: Comptes de ressources durables
  - 10: Capital
  - 11: Réserves
  - 12: Report à nouveau
  - 13: Résultat net
  - 16: Emprunts et dettes

- **Classe 2**: Comptes d'actif immobilisé
  - 21: Immobilisations incorporelles
  - 22: Terrains
  - 23: Bâtiments et installations
  - 24: Matériel
  - 28: Amortissements

- **Classe 3**: Comptes de stocks
  - 31: Marchandises
  - 32: Matières premières
  - 33: Autres approvisionnements
  - 34-37: Produits et en-cours

- **Classe 4**: Comptes de tiers
  - 40: Fournisseurs
  - 41: Clients
  - 42: Personnel
  - 43: Organismes sociaux
  - 44: État et collectivités

- **Classe 5**: Comptes de trésorerie
  - 50: Titres de placement
  - 52: Banques
  - 57: Caisse

- **Classe 6**: Comptes de charges
  - 60: Achats
  - 61: Transports
  - 62-63: Services extérieurs
  - 64: Impôts et taxes
  - 65: Autres charges
  - 66: Charges de personnel
  - 67: Frais financiers
  - 68-69: Dotations

- **Classe 7**: Comptes de produits
  - 70: Ventes
  - 71: Subventions d'exploitation
  - 75: Autres produits
  - 77: Revenus financiers
  - 79: Reprises de provisions

**Exemples de comptes**:
```
601 - Achats de marchandises
622 - Locations et charges locatives
661 - Rémunérations du personnel national
664 - Charges sociales
701 - Ventes de marchandises
706 - Services vendus
```

### 🇬🇭 Ghana GAAP

**Standard**: Basé sur IFRS for SMEs

**Structure** (en anglais):
- **1000-1999**: Assets
  - 1100: Current Assets (Cash, Receivables, Inventory)
  - 1200: Non-Current Assets (PPE, Intangibles)

- **2000-2999**: Liabilities
  - 2100: Current Liabilities (Payables, VAT, PAYE)
  - 2200: Non-Current Liabilities (Long-term Loans)

- **3000-3999**: Equity
  - 3100: Share Capital
  - 3200: Retained Earnings

- **4000-4999**: Revenue
  - 4100: Sales Revenue (Goods, Services)
  - 4200: Other Income

- **5000-5999**: Cost of Sales
  - 5100: COGS
  - 5200: Direct Labor

- **6000-6999**: Operating Expenses
  - 6100: Salaries & Wages
  - 6200: Employee Benefits (Social Security, Pensions)
  - 6300: Rent & Utilities
  - 6400: Professional Fees
  - 6500: Marketing

- **7000-7999**: Finance Costs

**Exemples**:
```
1110 - Cash and Cash Equivalents
1130 - Accounts Receivable
2141 - VAT Payable
2143 - PAYE Payable (Pay As You Earn)
4110 - Sales - Goods
6100 - Salaries and Wages
```

### 🇳🇬 Nigerian GAAP

**Standard**: Nigerian GAAP / IFRS for SMEs

**Structure similaire au Ghana** avec spécificités:
- **WHT** (Withholding Tax) - Impôt retenu à la source
- **CIT** (Companies Income Tax) - Impôt sur les sociétés
- Terminologie nigériane

**Comptes spécifiques Nigeria**:
```
2142 - WHT Payable (Withholding Tax)
2143 - CIT Payable (Companies Income Tax)
1110 - Cash and Bank
6200 - Staff Welfare
7000 - Selling and Distribution
```

### 🇫🇷 France - PCG

**Référence**: Plan Comptable Général

**Structure**: Voir fichier `20250104_seed_chart_of_accounts.sql`

~200 comptes détaillés avec 60+ catégories budgétaires

### 🇺🇸 États-Unis - US GAAP

**Standard**: Generally Accepted Accounting Principles (Simplified)

**Structure**:
- **1000-1999**: Assets
  - 1100: Current Assets (Cash, A/R, Inventory, Prepaid)
  - 1500: Property, Plant & Equipment
  - 1600: Intangible Assets (Goodwill, Patents, Software)

- **2000-2999**: Liabilities
  - 2100: Current Liabilities (A/P, Payroll Liabilities, Sales Tax)
  - 2200: Long-term Liabilities (Loans, Mortgage)

- **3000-3999**: Equity
  - 3100: Owner's Equity (Common Stock, Preferred Stock, APIC)
  - 3200: Retained Earnings
  - 3300: Owner's Draws

- **4000-4999**: Revenue
  - 4100: Sales Revenue (Products, Services, Returns, Discounts)
  - 4200: Other Income (Interest, Dividends, Gains)

- **5000-5999**: Cost of Goods Sold
  - 5100: Purchases
  - 5200: Freight-in
  - 5300: Direct Labor

- **6000-6999**: Operating Expenses
  - 6100: Payroll Expenses (Salaries, Payroll Taxes, Benefits, 401k)
  - 6200: Rent and Occupancy
  - 6300: Utilities
  - 6400: Professional Services
  - 6500: Marketing
  - 6600: Travel and Entertainment

- **7000-7999**: Other Expenses
  - 7100: Interest Expense
  - 7200: Bank Charges

- **8000-8999**: Income Tax

**Spécificités US**:
```
2141 - Federal Income Tax Withholding
2142 - State Income Tax Withholding
2143 - FICA Payable (Social Security + Medicare)
6120 - Payroll Taxes
6140 - Retirement Plans (401k, IRA)
6220 - Property Taxes
```

### 🇬🇧 Royaume-Uni - UK GAAP / FRS 102

**Standard**: Financial Reporting Standard 102

**Structure** (terminologie UK):
- **0000-0999**: Fixed Assets
  - 0010: Intangible Fixed Assets (Goodwill, Software)
  - 0100: Tangible Fixed Assets (Property, Plant, Vehicles)
  - 0200: Depreciation

- **1000-1999**: Current Assets
  - 1100: Stock (Finished Goods, Raw Materials)
  - 1200: Debtors (Trade Debtors, Prepayments, VAT Recoverable)
  - 1300: Cash at Bank and in Hand

- **2000-2999**: Liabilities
  - 2100: Creditors (Trade Creditors, Accruals, VAT Payable, PAYE/NI)
  - 2200: Short-term Loans (Bank Overdraft, Directors' Loan)
  - 2300: Long-term Liabilities

- **3000-3999**: Capital and Reserves
  - 3100: Share Capital (Ordinary, Preference)
  - 3200: Reserves (Share Premium, P&L Account)

- **4000-4999**: Turnover (Revenue)
  - 4100: Sales (UK, Export)
  - 4200: Service Income
  - 4300: Other Income

- **5000-5999**: Cost of Sales
  - 5100: Purchases
  - 5200: Direct Labour

- **6000-6999**: Administrative Expenses
  - 6100: Wages & Salaries (Gross Wages, Employer's NI, Pensions)
  - 6200: Rent and Rates (Rent, Business Rates, Water Rates)
  - 6300: Light, Heat and Power
  - 6400: Telephone
  - 6500: Professional Fees (Accountancy, Legal)

- **7000-7999**: Selling and Distribution
  - 7100: Advertising and Marketing
  - 7300: Entertainment

- **8000-8999**: Finance Costs
  - 8100: Bank Interest Paid
  - 8500: Depreciation

- **9000-9999**: Taxation

**Terminologie britannique**:
```
Stock = Inventory (US)
Debtors = Accounts Receivable (US)
Creditors = Accounts Payable (US)
Turnover = Revenue (US)
Profit and Loss Account = Retained Earnings (US)
Motor Expenses = Vehicle Expenses
Business Rates = Property Tax
PAYE = Pay As You Earn (Income Tax Withholding)
NI = National Insurance (Social Security)
```

**Comptes spécifiques UK**:
```
2130 - VAT Payable (20% standard rate)
2140 - PAYE/NI Payable
6110 - Gross Wages
6120 - Employer's National Insurance
6130 - Pension Costs
6220 - Business Rates
```

## 🚀 Installation

### Étape 1: Exécuter la Migration SQL

```bash
# Via Supabase Dashboard SQL Editor
# Copier-coller le contenu de:
supabase/migrations/20250104_seed_international_charts.sql
```

### Étape 2: Initialiser pour une Entreprise

```sql
-- Exemple: Ghana
SELECT initialize_company_chart_of_accounts(
  'company-uuid'::UUID,
  'GH'  -- Ghana
);

-- Exemple: Nigeria
SELECT initialize_company_chart_of_accounts(
  'company-uuid'::UUID,
  'NG'  -- Nigeria
);

-- Exemple: Bénin (SYSCOHADA)
SELECT initialize_company_chart_of_accounts(
  'company-uuid'::UUID,
  'BJ'  -- Bénin
);
```

### Étape 3: Créer Budget avec Mappings

```sql
-- Fonctionne pour tous les pays
SELECT create_budget_with_standard_categories(
  'company-uuid'::UUID,
  2025,
  'Budget 2025',
  'GH'  -- Ou 'NG', 'BJ', 'CI', 'TG', 'CM', 'GA', 'FR', 'US', 'UK'
);
```

## 🔄 Mappings Catégories Budgétaires

Les mappings sont **universels** et fonctionnent pour tous les pays:

### Revenus
- `ventes_produits` → Sales / Ventes de produits
- `prestations_services` → Services / Service Income
- `ventes_marchandises` → Merchandise / Trade

### Charges - Personnel
- `salaires_bruts` → Gross Wages / Salaries
- `charges_sociales` → Social Security / NI / FICA
- `retraite` → Pension / 401k

### Charges - Services
- `loyers` → Rent
- `telecom` → Telephone / Internet
- `energie_eau` → Utilities / Power
- `assurances` → Insurance
- `honoraires` → Professional Fees
- `marketing_publicite` → Marketing / Advertising

### Charges - Financières
- `interets_emprunts` → Interest Expense / Intérêts
- `frais_bancaires` → Bank Charges

### Investissements
- `immobilisations_corporelles` → PPE / Tangible Assets
- `immobilisations_incorporelles` → Intangible Assets
- `materiel_transport` → Vehicles / Motor Vehicles
- `materiel_informatique` → Computer Equipment / IT

## 📊 Tableau de Correspondance

| Catégorie Budgétaire | France (PCG) | SYSCOHADA | Ghana | Nigeria | US GAAP | UK GAAP |
|----------------------|--------------|-----------|-------|---------|---------|---------|
| Ventes produits | 701 | 702 | 4110 | 4100 | 4110 | 4110 |
| Prestations services | 706 | 706 | 4120 | 4200 | 4120 | 4200 |
| Salaires bruts | 6411 | 661 | 6100 | 6100 | 6110 | 6110 |
| Charges sociales | 6451 | 664 | 6210 | 6200 | 6120 | 6120 |
| Loyers | 6131 | 622 | 6310 | 6300 | 6210 | 6210 |
| Télécom | 6262 | 628 | 6330 | 6700 | 6330 | 6400 |
| Assurances | 616 | 625 | 6910 | 6900 | 6900 | 6910 |
| Frais bancaires | 627 | 631 | 6920 | 8200 | 7200 | 8300 |

## 🎯 Workflow Multi-Pays

### Scénario 1: Entreprise au Ghana
```sql
-- 1. Initialiser le plan comptable Ghana
SELECT initialize_company_chart_of_accounts('company-id'::UUID, 'GH');
-- Résultat: ~80 comptes créés

-- 2. Créer un budget avec catégories
SELECT create_budget_with_standard_categories(
  'company-id'::UUID, 2025, 'Budget 2025', 'GH'
);

-- 3. Import FEC (optionnel)
-- Les comptes du FEC s'ajoutent automatiquement

-- 4. Le forecast fonctionne immédiatement
SELECT * FROM get_budget_forecast('company-id'::UUID, 'budget-id'::UUID, current_date, 'prorata');
```

### Scénario 2: Entreprise au Bénin (SYSCOHADA)
```sql
SELECT initialize_company_chart_of_accounts('company-id'::UUID, 'BJ');
-- Plan SYSCOHADA complet (~150 comptes)

SELECT create_budget_with_standard_categories(
  'company-id'::UUID, 2025, 'Budget 2025', 'BJ'
);
```

### Scénario 3: Entreprise aux États-Unis
```sql
SELECT initialize_company_chart_of_accounts('company-id'::UUID, 'US');
-- Plan US GAAP (~150 comptes)

SELECT create_budget_with_standard_categories(
  'company-id'::UUID, 2025, 'Budget 2025', 'US'
);
```

## 🔧 Personnalisation par Pays

### Ajouter un compte SYSCOHADA personnalisé
```sql
INSERT INTO chart_of_accounts (company_id, account_number, name, type, class)
VALUES (
  'company-id'::UUID,
  '6221', -- Nouveau compte
  'Sous-traitance spécialisée',
  'expense',
  6
);

-- Mapper au budget
INSERT INTO category_account_map (company_id, category_id, account_code)
VALUES ('company-id'::UUID, 'category-sous-traitance-id'::UUID, '6221');
```

## 📝 Notes Importantes

1. **SYSCOHADA**: Le même plan est utilisé pour les 5 pays (BJ, CI, TG, CM, GA)

2. **Langue**:
   - France, SYSCOHADA: Français
   - Ghana, Nigeria, US, UK: Anglais

3. **TVA/Sales Tax**:
   - France: TVA (6.5%, 10%, 20%)
   - SYSCOHADA: TVA (18-20% selon pays)
   - Ghana: VAT (15%)
   - Nigeria: VAT (7.5%)
   - US: Sales Tax (varie par État)
   - UK: VAT (20%, 5%, 0%)

4. **Charges sociales**:
   - France: URSSAF, Retraite, ASSEDIC
   - SYSCOHADA: Charges sociales obligatoires (CNPS)
   - Ghana: Social Security (13.5%)
   - Nigeria: Staff Welfare
   - US: FICA (Social Security 6.2% + Medicare 1.45%)
   - UK: National Insurance (Employer's NI)

5. **Import FEC**: Compatible avec tous les plans comptables

## 🌟 Prochaines Étapes

1. ✅ **10 pays disponibles** avec plans standards
2. 🎨 **UI de gestion** - Interface pour gérer les comptes et mappings
3. 🔄 **Synchronisation** - Import/Export entre systèmes comptables
4. 📊 **Reporting multi-devises** - Consolidation multi-pays

---

*Date: 2025-01-04*
*Version: 1.0 - 10 pays couverts*
