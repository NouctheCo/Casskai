# Implémentation des Documents Fiscaux Africains - CassKai

**Date :** 10 janvier 2026
**Status :** 📋 Spécification technique

---

## 🎯 Objectif

Implémenter la génération automatique des documents fiscaux pour les 3 standards comptables africains supportés par CassKai :

1. **SYSCOHADA** : 17 pays de l'OHADA
2. **IFRS for SMEs** : Nigeria, Kenya, Ghana, Afrique du Sud
3. **SCF/PCM** : Maroc, Algérie, Tunisie

**Situation actuelle** : Seule la liasse fiscale française (PCG) est implémentée.

---

## 📊 Couverture géographique

### Pays SYSCOHADA (17 pays)
| Pays | Code | Devise | TVA | IS |
|------|------|--------|-----|-----|
| Sénégal | SN | XOF | 18% | 30% |
| Côte d'Ivoire | CI | XOF | 18% | 25% |
| Bénin | BJ | XOF | 18% | 30% |
| Burkina Faso | BF | XOF | 18% | 27.5% |
| Mali | ML | XOF | 18% | 30% |
| Niger | NE | XOF | 19% | 30% |
| Togo | TG | XOF | 18% | 27% |
| Guinée-Bissau | GW | XOF | 17% | 25% |
| Cameroun | CM | XAF | 19.25% | 33% |
| Tchad | TD | XAF | 18% | 35% |
| Congo-Brazzaville | CG | XAF | 18% | 30% |
| Gabon | GA | XAF | 18% | 30% |
| Guinée Équatoriale | GQ | XAF | 15% | 35% |
| RCA | CF | XAF | 19% | 30% |
| RD Congo | CD | CDF | 16% | 30% |
| Guinée | GN | GNF | 18% | 35% |
| Comores | KM | KMF | 10% | 35% |

### Pays IFRS (4 pays)
| Pays | Code | Devise | VAT | Corporate Tax |
|------|------|--------|-----|---------------|
| Nigeria | NG | NGN | 7.5% | 30% |
| Kenya | KE | KES | 16% | 30% |
| Ghana | GH | GHS | 15% | 25% |
| Afrique du Sud | ZA | ZAR | 15% | 27% |

### Pays SCF/PCM (3 pays)
| Pays | Code | Devise | TVA | IS |
|------|------|--------|-----|-----|
| Maroc | MA | MAD | 20% | 31% |
| Algérie | DZ | DZD | 19% | 26% |
| Tunisie | TN | TND | 19% | 15-25% |

---

## 📑 Documents à générer

### 1. SYSCOHADA (OHADA)

#### Documents annuels (DSF - Déclaration Statistique et Fiscale)
- **Bilan SYSCOHADA** (Actif/Passif)
  - Actif immobilisé (Classe 2)
  - Actif circulant (Classe 3, 4)
  - Trésorerie actif (Classe 5)
  - Capitaux propres (Classe 1)
  - Dettes (Classe 1, 4, 5)

- **Compte de Résultat SYSCOHADA**
  - Activités d'exploitation (Classe 6, 7)
  - Activités financières
  - Activités HAO (Hors Activités Ordinaires - Classe 8)

- **TAFIRE** (Tableau Financier des Ressources et Emplois)
  - Capacité d'autofinancement
  - Variation du BFR
  - Flux de trésorerie

- **État Annexé**
  - Règles d'évaluation
  - Événements post-clôture
  - Engagements hors bilan

#### Documents périodiques
- **Déclaration TVA** (mensuelle ou trimestrielle selon pays)
- **Acomptes IS** (trimestriels)
- **IS annuel**
- **Patente** (impôt forfaitaire annuel)

### 2. IFRS for SMEs

#### Documents annuels
- **Balance Sheet** (Bilan IFRS)
  - Non-current Assets (Classe 1)
  - Current Assets (Classe 2)
  - Equity (Classe 3)
  - Non-current Liabilities (Classe 4)
  - Current Liabilities (Classe 5)

- **Income Statement** (Compte de Résultat)
  - Revenue (Classe 6)
  - Expenses (Classe 7)

- **Statement of Cash Flows**
  - Operating activities
  - Investing activities
  - Financing activities

- **Statement of Changes in Equity**

- **Notes to Financial Statements**

#### Documents périodiques
- **VAT Return** (mensuel/trimestriel)
- **PAYE** (Pay As You Earn - mensuel)
- **Withholding Tax** (mensuel)
- **Corporate Tax** (annuel avec acomptes)

### 3. SCF/PCM (Maghreb)

#### Documents annuels
- **Bilan SCF** (inspiré du PCG français)
- **Compte de Résultat SCF**
- **Tableau des Flux de Trésorerie**
- **Annexes**

#### Documents périodiques
- **Déclaration TVA** (mensuelle)
- **IS** (annuel avec acomptes)
- **Retenues à la source**

---

## 🏗️ Architecture technique

### Structure des fichiers

```
src/services/fiscal/
├── SYSCOHADATaxComplianceService.ts    # Service SYSCOHADA (17 pays)
├── IFRSTaxComplianceService.ts         # Service IFRS (4 pays)
├── SCFTaxComplianceService.ts          # Service SCF/PCM (3 pays)
├── types/
│   ├── syscohada.types.ts
│   ├── ifrs.types.ts
│   └── scf.types.ts
├── templates/
│   ├── syscohada/
│   │   ├── bilan.template.ts
│   │   ├── compte-resultat.template.ts
│   │   └── tafire.template.ts
│   ├── ifrs/
│   │   ├── balance-sheet.template.ts
│   │   └── income-statement.template.ts
│   └── scf/
│       ├── bilan.template.ts
│       └── compte-resultat.template.ts
└── utils/
    ├── accountMapping.ts               # Mapping comptes → postes
    └── validations.ts                  # Validations fiscales
```

### Interfaces communes

```typescript
export interface FiscalDeclaration {
  id: string;
  type: string;
  country: string;
  period: string;
  dueDate: Date;
  status: 'draft' | 'ready' | 'filed' | 'accepted' | 'rejected';
  companyId: string;
  data: Record<string, any>;
  validationErrors: string[];
  warnings: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔧 Fonctionnalités par service

### SYSCOHADATaxComplianceService

**Méthodes principales :**
```typescript
// DSF complète
generateDSF(companyId: string, exercice: string, countryCode: string): Promise<SYSCOHADADeclaration[]>

// Documents individuels
generateBilanSYSCOHADA(companyId: string, exercice: string, countryCode: string): Promise<SYSCOHADADeclaration>
generateCompteResultatSYSCOHADA(companyId: string, exercice: string, countryCode: string): Promise<SYSCOHADADeclaration>
generateTAFIRE(companyId: string, exercice: string, countryCode: string): Promise<SYSCOHADADeclaration>
generateEtatAnnexe(companyId: string, exercice: string, countryCode: string): Promise<SYSCOHADADeclaration>

// Déclarations périodiques
generateTVADeclaration(companyId: string, period: string, countryCode: string): Promise<SYSCOHADADeclaration>
generateISDeclaration(companyId: string, exercice: string, countryCode: string, type: 'acompte' | 'annuel'): Promise<SYSCOHADADeclaration>
```

**Mapping des comptes SYSCOHADA :**
```typescript
// Classe 1 : Comptes de ressources durables
// Classe 2 : Comptes d'actif immobilisé
// Classe 3 : Comptes de stocks
// Classe 4 : Comptes de tiers
// Classe 5 : Comptes de trésorerie
// Classe 6 : Comptes de charges
// Classe 7 : Comptes de produits
// Classe 8 : Comptes HAO
// Classe 9 : Comptes analytiques
```

### IFRSTaxComplianceService

**Méthodes principales :**
```typescript
// États financiers annuels
generateBalanceSheet(companyId: string, year: string, countryCode: string): Promise<IFRSDeclaration>
generateIncomeStatement(companyId: string, year: string, countryCode: string): Promise<IFRSDeclaration>
generateCashFlowStatement(companyId: string, year: string, countryCode: string): Promise<IFRSDeclaration>
generateStatementOfChangesInEquity(companyId: string, year: string, countryCode: string): Promise<IFRSDeclaration>

// Déclarations périodiques
generateVATReturn(companyId: string, period: string, countryCode: string): Promise<IFRSDeclaration>
generatePAYEReturn(companyId: string, period: string, countryCode: string): Promise<IFRSDeclaration>
generateCorporateTaxReturn(companyId: string, year: string, countryCode: string): Promise<IFRSDeclaration>
```

**Mapping des comptes IFRS :**
```typescript
// Class 1 : Non-current Assets
// Class 2 : Current Assets
// Class 3 : Equity
// Class 4 : Non-current Liabilities
// Class 5 : Current Liabilities
// Class 6 : Revenue
// Class 7 : Expenses
```

### SCFTaxComplianceService

**Méthodes principales :**
```typescript
// États financiers annuels
generateBilanSCF(companyId: string, exercice: string, countryCode: string): Promise<SCFDeclaration>
generateCompteResultatSCF(companyId: string, exercice: string, countryCode: string): Promise<SCFDeclaration>
generateTableauFluxTresorerie(companyId: string, exercice: string, countryCode: string): Promise<SCFDeclaration>

// Déclarations périodiques
generateTVADeclarationSCF(companyId: string, period: string, countryCode: string): Promise<SCFDeclaration>
generateISDeclarationSCF(companyId: string, exercice: string, countryCode: string): Promise<SCFDeclaration>
```

---

## 📐 Calculs spécifiques

### SYSCOHADA

#### Bilan - Actif
```typescript
Actif Immobilisé = Σ(Classe 2) - Σ(Classe 28 - Amortissements)
Actif Circulant = Σ(Classe 3 + 4) - Σ(Classe 39 + 49 - Dépréciations)
Trésorerie Actif = Σ(Classe 5)
```

#### Bilan - Passif
```typescript
Capitaux Propres = Σ(Classe 10 à 14)
Dettes = Σ(Classe 16 à 18) + Σ(Classe 40 à 47 créditeurs) + Σ(Classe 56 passif)
```

#### Compte de Résultat
```typescript
Produits d'Exploitation = Σ(Classe 70 à 75)
Charges d'Exploitation = Σ(Classe 60 à 65)
Résultat d'Exploitation = Produits - Charges

Produits Financiers = Σ(Classe 77)
Charges Financières = Σ(Classe 67)
Résultat Financier = Produits Financiers - Charges Financières

Produits HAO = Σ(Classe 82, 84, 86, 88)
Charges HAO = Σ(Classe 81, 83, 85, 87)
Résultat HAO = Produits HAO - Charges HAO

Résultat Net = Résultat Exploitation + Résultat Financier + Résultat HAO - IS
```

### IFRS

#### Balance Sheet
```typescript
Non-current Assets = Property, Plant & Equipment + Intangible Assets + Financial Assets
Current Assets = Inventories + Receivables + Cash
Total Assets = Non-current Assets + Current Assets

Equity = Share Capital + Reserves + Retained Earnings
Non-current Liabilities = Long-term Borrowings + Provisions
Current Liabilities = Trade Payables + Short-term Borrowings + Tax Payables
Total Equity and Liabilities = Equity + Non-current Liabilities + Current Liabilities
```

#### Income Statement
```typescript
Gross Profit = Revenue - Cost of Sales
Operating Profit = Gross Profit - Operating Expenses
Profit Before Tax = Operating Profit + Finance Income - Finance Costs
Profit After Tax = Profit Before Tax - Income Tax Expense
```

### SCF

Similaire au PCG français avec adaptations locales.

---

## 🔍 Validation et contrôles

### Contrôles comptables
1. **Équilibre du bilan** : Actif = Passif
2. **Cohérence résultat** : Résultat CR = Résultat Bilan
3. **Sommes de contrôle** : Totaux par classe
4. **Comptes obligatoires** : Présence des comptes réglementaires

### Contrôles fiscaux
1. **TVA** : TVA collectée ≥ TVA déductible (sauf crédit)
2. **IS** : IS ≥ Minimum de perception (1% CA dans OHADA)
3. **Dates limites** : Vérification des échéances
4. **Formats** : Respect des formats réglementaires

### Alertes
- Bilan déséquilibré
- Résultat incohérent
- TVA créditrice > 3 mois
- IS négatif sans déficit reportable
- Comptes non lettrés

---

## 📤 Export et formats

### Formats de sortie
1. **JSON** : Structure données brutes
2. **PDF** : Documents officiels imprimables
3. **Excel** : Analyse et ajustements
4. **XML/EDI** : Télédéclaration (selon pays)

### Templates PDF
- En-tête avec logo entreprise
- Mentions légales obligatoires
- Signature numérique (si applicable)
- Numérotation des pages
- Récapitulatif des contrôles

---

## 🗄️ Stockage Supabase

### Nouvelle table : `fiscal_declarations`

```sql
CREATE TABLE fiscal_declarations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'DSF', 'VAT_RETURN', 'CORPORATE_TAX', etc.
  standard TEXT NOT NULL, -- 'SYSCOHADA', 'IFRS', 'SCF'
  country TEXT NOT NULL,
  period TEXT NOT NULL, -- '2024', '2024-Q1', '2024-01', etc.
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'ready', 'filed', 'accepted', 'rejected'
  data JSONB NOT NULL, -- Données de la déclaration
  validation_errors JSONB DEFAULT '[]'::jsonb,
  warnings JSONB DEFAULT '[]'::jsonb,
  filed_at TIMESTAMPTZ,
  filed_by UUID REFERENCES profiles(id),
  acceptance_date DATE,
  reference_number TEXT, -- Numéro de dépôt
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fiscal_declarations_status_check CHECK (status IN ('draft', 'ready', 'filed', 'accepted', 'rejected'))
);

CREATE INDEX idx_fiscal_declarations_company ON fiscal_declarations(company_id);
CREATE INDEX idx_fiscal_declarations_period ON fiscal_declarations(period);
CREATE INDEX idx_fiscal_declarations_status ON fiscal_declarations(status);
CREATE INDEX idx_fiscal_declarations_due_date ON fiscal_declarations(due_date);
```

---

## 🚀 Prochaines étapes

### Phase 1 : Service SYSCOHADA (prioritaire - 17 pays)
1. ✅ Créer `SYSCOHADATaxComplianceService.ts`
2. ⏳ Implémenter génération Bilan SYSCOHADA
3. ⏳ Implémenter génération Compte de Résultat
4. ⏳ Implémenter génération TAFIRE
5. ⏳ Implémenter déclarations TVA
6. ⏳ Tests avec données réelles Sénégal, Côte d'Ivoire, Cameroun

### Phase 2 : Service IFRS (4 pays)
1. ⏳ Créer `IFRSTaxComplianceService.ts`
2. ⏳ Implémenter Balance Sheet
3. ⏳ Implémenter Income Statement
4. ⏳ Implémenter VAT Returns
5. ⏳ Tests avec données Nigeria, Kenya

### Phase 3 : Service SCF (3 pays)
1. ⏳ Créer `SCFTaxComplianceService.ts`
2. ⏳ Adapter depuis PCG français
3. ⏳ Tests Maroc, Algérie, Tunisie

### Phase 4 : Interface utilisateur
1. ⏳ Page génération documents fiscaux
2. ⏳ Prévisualisation PDF
3. ⏳ Téléchargement et archivage
4. ⏳ Suivi des échéances
5. ⏳ Alertes automatiques

### Phase 5 : Intégrations
1. ⏳ API télédéclaration (selon pays)
2. ⏳ Signature électronique
3. ⏳ Envoi automatique
4. ⏳ Suivi des accusés de réception

---

## 📊 Impact business

### Marchés adressés
- **17 pays OHADA** : 200+ millions d'habitants
- **4 pays anglophones** : 400+ millions d'habitants
- **3 pays Maghreb** : 100+ millions d'habitants

### Avantages concurrentiels
- ✅ Seule solution ERP avec génération automatique multi-standards africains
- ✅ Conformité réglementaire garantie
- ✅ Gain de temps considérable pour les cabinets comptables
- ✅ Réduction des erreurs de déclaration
- ✅ Alertes échéances fiscales

### Revenus potentiels
- Module fiscal premium : +20€/mois par entreprise
- Services d'accompagnement fiscal
- Formations utilisateurs
- API pour cabinets comptables

---

**📅 Début implémentation :** 10 janvier 2026
**⏱️ Durée estimée Phase 1 :** 2-3 semaines
**✅ Validation :** Tests avec experts-comptables locaux
