# Audit Infrastructure Multi-Standards - Rapport Complet

**Date:** 2025-11-27
**Demande utilisateur:** Vérifier si infrastructure multi-standards existe avant implémentation Option A
**Statut:** ✅ Infrastructure PARTIELLEMENT existante - Nécessite complétion

---

## 🔍 RÉSUMÉ EXÉCUTIF

**Verdict:** Une infrastructure multi-standards **EXISTE DÉJÀ** mais est **INCOMPLÈTE**

### Ce qui existe ✅
1. **Types comptables multi-standards** définis (`AccountPlan`)
2. **Données SYSCOHADA** partielles (classes 1-7)
3. **Détection automatique** par pays (AccountingStandardSelector)
4. **Tables fiscales** avec colonne `accounting_standard`
5. **17 pays OHADA** identifiés dans le code
6. **Catalogue pays** avec référence au standard (referentialsService)

### Ce qui manque ❌
1. **Class 8 (HAO) absente** du fichier syscohada.ts (626 lignes, s'arrête à class 7)
2. **Class 9 (Comptes analytiques) absente** également
3. **Colonne `accounting_standard` absente** de la table `companies` (seulement dans `company_fiscal_settings`)
4. **Aucun code dans reportGenerationService** n'utilise les standards
5. **Pas de service AccountingStandardAdapter** pour mapper les comptes
6. **Templates IFRS et SCF** totalement absents

---

## 📂 INVENTAIRE DÉTAILLÉ DES FICHIERS

### 1. Données SYSCOHADA

#### ✅ `src/data/accounts-syscohada.ts` (43 lignes)
**Contenu:** Version simplifiée avec classes 1-9 mentionnées
```typescript
export const SYSCOHADA_CLASSES = [
  { number: '1', name: 'Comptes de ressources durables' },
  { number: '2', name: 'Comptes d'actif immobilisé' },
  { number: '3', name: 'Comptes de stocks' },
  { number: '4', name: 'Comptes de tiers' },
  { number: '5', name: 'Comptes financiers' },
  { number: '6', name: 'Comptes de charges' },
  { number: '7', name: 'Comptes de produits' },
  { number: '8', name: 'Comptes spéciaux' },      // ✅ Mentionné
  { number: '9', name: 'Comptes analytiques' }   // ✅ Mentionné
];

// Comptes exemples incluent un compte 801
{ number: '801', name: 'Comptes spéciaux', class: '8' },
```

#### ⚠️ `src/data/syscohada.ts` (626 lignes)
**Contenu:** Plan détaillé INCOMPLET - **S'arrête à la classe 7**
- ✅ Classes 1-7 complètes avec tous sous-comptes
- ❌ **Classe 8 (HAO) manquante** - Critique pour OHADA
- ❌ **Classe 9 (Analytique) manquante**

**Dernière ligne du fichier:**
```typescript
    {
      number: '79',
      name: 'REPRISES DE PROVISIONS',
      type: 'produits',
      isDebitNormal: false,
      // ... sous-comptes ...
    }
  ]  // ← Fin de la classe 7, pas de classe 8 ni 9
}
```

### 2. Types et Interfaces

#### ✅ `src/types/accounting.ts`
```typescript
export interface AccountPlan {
  standard: 'SYSCOHADA' | 'PCG' | 'GAAP' | 'IFRS';  // ✅ 4 standards supportés
  country: string;
  classes: AccountClass[];
}
```

#### ⚠️ `src/types/supabase.ts` - Table `companies` (ligne 23)
**Colonne `accounting_standard`:** ❌ **ABSENTE**

Colonnes présentes:
- `id`, `name`, `country`, `default_currency`
- `legal_form`, `siret`, `vat_number`
- `fiscal_year_start_month`, `tax_regime`, `vat_regime`
- **MAIS PAS `accounting_standard`**

### 3. Services et Composants

#### ✅ `src/components/setup/AccountingStandardSelector.tsx`
**Fonctionnalité:** Sélecteur de standard avec détection automatique
```typescript
const getRecommendedStandard = (countryCode: string): string => {
  const SYSCOHADA_COUNTRIES = ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW',
                                 'CM', 'CF', 'TD', 'CG', 'GA', 'GQ', 'GN'];
  return SYSCOHADA_COUNTRIES.includes(countryCode) ? 'SYSCOHADA' : 'PCG';
};
```

**Standards affichés:**
- PCG (Plan Comptable Général)
- SYSCOHADA (Système Comptable OHADA)
- IFRS (International)
- US GAAP (États-Unis)

#### ✅ `src/components/accounting/ChartDetectionBanner.tsx`
**Fonctionnalité:** Bannière intelligente pour recommander SYSCOHADA
- Détecte zone OHADA
- Affiche alerte si pays membre OHADA
- Liste des 17 pays membres

#### ✅ `src/services/referentialsService.ts`
**Fonctionnalité:** Catalogue dynamique des pays
```typescript
export interface CountryReferential {
  code: string;
  name: string;
  currency_code: string;
  accounting_standard: string;  // ✅ Champ présent
  timezone: string;
  // ...
}
```

**Exemples de fallback:**
```typescript
{ code: 'FR', accounting_standard: 'PCG' },
{ code: 'CI', accounting_standard: 'SYSCOHADA' },
{ code: 'SN', accounting_standard: 'SYSCOHADA' },
```

#### ❌ `src/services/reportGenerationService.ts` (2088 lignes)
**Problème:** AUCUNE référence aux standards comptables

Recherche effectuée:
```bash
grep -n "standard\|SYSCOHADA\|OHADA\|IFRS" src/services/reportGenerationService.ts
# RÉSULTAT: Aucune correspondance trouvée
```

**Tous les 13 rapports utilisent des codes PCG hardcodés:**
```typescript
// Exemple: generateIncomeStatement (ligne ~300)
const revenueEntries = journalEntries.filter(e =>
  e.account_number.startsWith('7')  // ❌ Hardcodé PCG
);
const expenseEntries = journalEntries.filter(e =>
  e.account_number.startsWith('6')  // ❌ Hardcodé PCG
);
```

### 4. Base de données

#### ✅ `supabase/migrations/20251005140635_sync_production_schema.sql`
**Table `company_fiscal_settings`** (pas `companies`!)
```sql
CREATE TABLE "public"."company_fiscal_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "accounting_standard" "text" NOT NULL,  -- ✅ Présent ICI
    -- ...
    CONSTRAINT "company_fiscal_settings_accounting_standard_check"
    CHECK (("accounting_standard" = ANY (
      ARRAY['PCG'::"text", 'SYSCOHADA'::"text", 'IFRS'::"text", 'US_GAAP'::"text"]
    )))
);
```

**Table `countries_catalog`**
```sql
-- Contient colonne accounting_standard pour chaque pays
```

**⚠️ Table `companies`:**
Pas de colonne `accounting_standard` - doit faire JOIN avec `company_fiscal_settings`

---

## 🎯 GAP ANALYSIS - Ce qu'il faut faire

### CRITIQUE (Bloquant) 🔴

#### 1. **Ajouter Class 8 (HAO) au SYSCOHADA complet**
**Fichier:** `src/data/syscohada.ts`
**Action:** Ajouter après classe 7 (ligne ~593)

```typescript
{
  number: '8',
  name: 'COMPTES DES AUTRES CHARGES ET DES AUTRES PRODUITS',
  type: 'expense',  // Peut être mixte charges/produits HAO
  accounts: [
    {
      number: '81',
      name: 'VALEURS COMPTABLES DES CESSIONS D\'IMMOBILISATIONS',
      type: 'charges',
      isDebitNormal: true,
      subAccounts: [
        { number: '811', name: 'Immobilisations incorporelles', type: 'charges', isDebitNormal: true },
        { number: '812', name: 'Immobilisations corporelles', type: 'charges', isDebitNormal: true },
        { number: '816', name: 'Immobilisations financières', type: 'charges', isDebitNormal: true }
      ]
    },
    {
      number: '82',
      name: 'PRODUITS DES CESSIONS D\'IMMOBILISATIONS',
      type: 'produits',
      isDebitNormal: false,
      subAccounts: [
        { number: '821', name: 'Immobilisations incorporelles', type: 'produits', isDebitNormal: false },
        { number: '822', name: 'Immobilisations corporelles', type: 'produits', isDebitNormal: false },
        { number: '826', name: 'Immobilisations financières', type: 'produits', isDebitNormal: false }
      ]
    },
    {
      number: '83',
      name: 'CHARGES HORS ACTIVITÉS ORDINAIRES',
      type: 'charges',
      isDebitNormal: true,
      subAccounts: [
        { number: '831', name: 'Charges HAO constatées', type: 'charges', isDebitNormal: true },
        { number: '834', name: 'Pertes sur créances HAO', type: 'charges', isDebitNormal: true },
        { number: '835', name: 'Dons et libéralités accordés', type: 'charges', isDebitNormal: true },
        { number: '836', name: 'Abandons de créances consentis', type: 'charges', isDebitNormal: true },
        { number: '839', name: 'Charges provisionnées HAO', type: 'charges', isDebitNormal: true }
      ]
    },
    {
      number: '84',
      name: 'PRODUITS HORS ACTIVITÉS ORDINAIRES',
      type: 'produits',
      isDebitNormal: false,
      subAccounts: [
        { number: '841', name: 'Produits HAO constatés', type: 'produits', isDebitNormal: false },
        { number: '845', name: 'Subventions d\'équilibre', type: 'produits', isDebitNormal: false },
        { number: '846', name: 'Reprises HAO', type: 'produits', isDebitNormal: false },
        { number: '848', name: 'Transferts de charges HAO', type: 'produits', isDebitNormal: false }
      ]
    },
    {
      number: '85',
      name: 'DOTATIONS HORS ACTIVITÉS ORDINAIRES',
      type: 'charges',
      isDebitNormal: true,
      subAccounts: [
        { number: '851', name: 'Dotations aux amortissements HAO', type: 'charges', isDebitNormal: true },
        { number: '852', name: 'Dotations aux provisions HAO', type: 'charges', isDebitNormal: true }
      ]
    },
    {
      number: '86',
      name: 'REPRISES HORS ACTIVITÉS ORDINAIRES',
      type: 'produits',
      isDebitNormal: false,
      subAccounts: [
        { number: '861', name: 'Reprises d\'amortissements HAO', type: 'produits', isDebitNormal: false },
        { number: '862', name: 'Reprises de provisions HAO', type: 'produits', isDebitNormal: false }
      ]
    },
    {
      number: '87',
      name: 'PARTICIPATIONS DES TRAVAILLEURS',
      type: 'charges',
      isDebitNormal: true,
      subAccounts: [
        { number: '871', name: 'Participation des travailleurs', type: 'charges', isDebitNormal: true }
      ]
    },
    {
      number: '88',
      name: 'SUBVENTIONS D\'ÉQUILIBRE',
      type: 'produits',
      isDebitNormal: false,
      subAccounts: [
        { number: '881', name: 'Subventions d\'équilibre de l\'État', type: 'produits', isDebitNormal: false },
        { number: '888', name: 'Autres subventions d\'équilibre', type: 'produits', isDebitNormal: false }
      ]
    },
    {
      number: '89',
      name: 'IMPÔTS SUR LE RÉSULTAT',
      type: 'charges',
      isDebitNormal: true,
      subAccounts: [
        { number: '891', name: 'Impôts sur les bénéfices', type: 'charges', isDebitNormal: true },
        { number: '892', name: 'Contributions et taxes assimilées', type: 'charges', isDebitNormal: true },
        { number: '899', name: 'Impôts différés', type: 'charges', isDebitNormal: true }
      ]
    }
  ]
}
```

#### 2. **Créer service AccountingStandardAdapter**
**Fichier:** `src/services/accountingStandardAdapter.ts` (nouveau)

```typescript
export type AccountingStandard = 'PCG' | 'SYSCOHADA' | 'IFRS' | 'SCF';

export interface StandardMapping {
  revenueClasses: string[];
  expenseClasses: string[];
  assetClasses: string[];
  liabilityClasses: string[];
  equityClasses: string[];
  haoClasses?: string[];  // Spécifique SYSCOHADA
}

export const STANDARD_MAPPINGS: Record<AccountingStandard, StandardMapping> = {
  PCG: {
    revenueClasses: ['7'],
    expenseClasses: ['6'],
    assetClasses: ['2', '3', '4', '5'],
    liabilityClasses: ['1', '4'],
    equityClasses: ['1']
  },
  SYSCOHADA: {
    revenueClasses: ['7'],
    expenseClasses: ['6'],
    assetClasses: ['2', '3', '4', '5'],
    liabilityClasses: ['1', '4'],
    equityClasses: ['1'],
    haoClasses: ['8']  // ✅ CLASSE 8 HAO
  },
  IFRS: {
    // À définir selon besoins
    revenueClasses: ['4'],  // Exemple
    expenseClasses: ['6'],
    assetClasses: ['1', '2'],
    liabilityClasses: ['4', '5'],
    equityClasses: ['3']
  },
  SCF: {
    // À définir (similaire PCG algérien)
    revenueClasses: ['7'],
    expenseClasses: ['6'],
    assetClasses: ['2', '3', '4', '5'],
    liabilityClasses: ['1', '4'],
    equityClasses: ['1']
  }
};

export class AccountingStandardAdapter {

  static getMapping(standard: AccountingStandard): StandardMapping {
    return STANDARD_MAPPINGS[standard] || STANDARD_MAPPINGS.PCG;
  }

  static isRevenue(accountNumber: string, standard: AccountingStandard): boolean {
    const mapping = this.getMapping(standard);
    return mapping.revenueClasses.some(cls => accountNumber.startsWith(cls));
  }

  static isExpense(accountNumber: string, standard: AccountingStandard): boolean {
    const mapping = this.getMapping(standard);
    return mapping.expenseClasses.some(cls => accountNumber.startsWith(cls));
  }

  static isHAO(accountNumber: string, standard: AccountingStandard): boolean {
    if (standard !== 'SYSCOHADA') return false;
    const mapping = this.getMapping(standard);
    return mapping.haoClasses?.some(cls => accountNumber.startsWith(cls)) || false;
  }

  static inferStandardFromCountry(countryCode: string): AccountingStandard {
    const SYSCOHADA_COUNTRIES = ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW',
                                   'CM', 'CF', 'TD', 'CG', 'GA', 'GQ', 'GN', 'BJ', 'TG'];
    const SCF_COUNTRIES = ['DZ', 'MA', 'TN'];  // Maghreb
    const IFRS_COUNTRIES = ['GB', 'NG', 'KE', 'GH', 'ZA'];  // Anglophone Afrique

    if (SYSCOHADA_COUNTRIES.includes(countryCode)) return 'SYSCOHADA';
    if (SCF_COUNTRIES.includes(countryCode)) return 'SCF';
    if (IFRS_COUNTRIES.includes(countryCode)) return 'IFRS';
    return 'PCG';  // Par défaut
  }
}
```

#### 3. **Intégrer dans reportGenerationService**
**Fichier:** `src/services/reportGenerationService.ts`

**Modifications à apporter aux 13 méthodes:**

```typescript
import { AccountingStandardAdapter, AccountingStandard } from './accountingStandardAdapter';

// Dans chaque méthode de rapport:
async generateIncomeStatement(filters: ReportFilters, exportOptions?: ExportOptions): Promise<string> {
  const companyId = filters.company_id || 'default';

  // 1. RÉCUPÉRER LE STANDARD
  const { data: company } = await supabase
    .from('companies')
    .select('country')
    .eq('id', companyId)
    .single();

  const standard = AccountingStandardAdapter.inferStandardFromCountry(
    company?.country || 'FR'
  );

  // 2. FILTRER AVEC LE BON MAPPING
  const revenueEntries = journalEntries.filter(e =>
    AccountingStandardAdapter.isRevenue(e.account_number, standard)  // ✅ Adapté
  );

  const expenseEntries = journalEntries.filter(e =>
    AccountingStandardAdapter.isExpense(e.account_number, standard)  // ✅ Adapté
  );

  // 3. SI SYSCOHADA, TRAITER HAO SÉPARÉMENT
  if (standard === 'SYSCOHADA') {
    const haoEntries = journalEntries.filter(e =>
      AccountingStandardAdapter.isHAO(e.account_number, standard)
    );

    // Calculer résultat HAO séparé
    const haoCharges = haoEntries.filter(e => e.account_number.startsWith('81') ||
                                               e.account_number.startsWith('83') ||
                                               e.account_number.startsWith('85'));
    const haoProduits = haoEntries.filter(e => e.account_number.startsWith('82') ||
                                                e.account_number.startsWith('84') ||
                                                e.account_number.startsWith('86'));

    // Ajouter section HAO au rapport
  }

  // ... reste du code
}
```

### IMPORTANT (Nécessaire) 🟡

#### 4. **Ajouter colonne accounting_standard à table companies**
**Migration SQL à créer:**

```sql
-- Migration: add_accounting_standard_to_companies.sql
ALTER TABLE companies
ADD COLUMN accounting_standard TEXT
DEFAULT 'PCG'
CHECK (accounting_standard IN ('PCG', 'SYSCOHADA', 'IFRS', 'US_GAAP', 'SCF'));

CREATE INDEX idx_companies_accounting_standard
ON companies(accounting_standard);

-- Mise à jour automatique basée sur le pays
UPDATE companies c
SET accounting_standard = CASE
  WHEN c.country IN ('CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW',
                     'CM', 'CF', 'TD', 'CG', 'GA', 'GQ', 'GN')
  THEN 'SYSCOHADA'
  WHEN c.country IN ('DZ', 'MA', 'TN')
  THEN 'SCF'
  WHEN c.country IN ('GB', 'NG', 'KE', 'GH', 'ZA')
  THEN 'IFRS'
  ELSE 'PCG'
END;
```

#### 5. **Mettre à jour les types TypeScript**
**Fichier:** `src/types/supabase.ts`

```typescript
companies: {
  Row: {
    id: string
    name: string
    country: string | null
    default_currency: string | null
    accounting_standard: string | null  // ✅ AJOUTER
    // ... autres champs
  }
  Insert: {
    // ...
    accounting_standard?: string
  }
  Update: {
    // ...
    accounting_standard?: string
  }
}
```

### OPTIONNEL (Amélioration UX) 🟢

#### 6. **Créer templates IFRS et SCF**
**Fichiers à créer:**
- `src/data/ifrs.ts` (similaire à syscohada.ts)
- `src/data/scf.ts` (variante PCG algérien)

#### 7. **Ajouter badge du standard dans l'UI des rapports**
**Fichier:** `src/components/accounting/OptimizedReportsTab.tsx`

```typescript
// Afficher le standard actif en haut de la page
<Badge variant="outline" className="flex items-center gap-2">
  <Globe className="w-4 h-4" />
  Standard: {currentStandard}
</Badge>
```

---

## 📊 MATRICE DE PRIORITÉ

| Tâche | Priorité | Effort | Impact | Fichiers concernés |
|-------|----------|--------|--------|-------------------|
| Ajouter Class 8 HAO | 🔴 CRITIQUE | 2h | BLOQUANT | `syscohada.ts` |
| Créer AccountingStandardAdapter | 🔴 CRITIQUE | 3h | BLOQUANT | Nouveau service |
| Intégrer dans 13 rapports | 🔴 CRITIQUE | 4h | BLOQUANT | `reportGenerationService.ts` |
| Migration SQL accounting_standard | 🟡 IMPORTANT | 1h | IMPORTANT | Nouvelle migration |
| Mettre à jour types TS | 🟡 IMPORTANT | 30min | IMPORTANT | `supabase.ts` |
| Templates IFRS/SCF | 🟢 OPTIONNEL | 6h | NICE | Nouveaux fichiers |
| Badge UI standard | 🟢 OPTIONNEL | 1h | UX | `OptimizedReportsTab.tsx` |

**TOTAL EFFORT MINIMUM:** ~10h30 (sans templates IFRS/SCF)
**TOTAL EFFORT COMPLET:** ~17h30 (avec tous optionnels)

---

## ✅ PLAN D'ACTION RECOMMANDÉ

### Phase 1: Complétion SYSCOHADA (Immédiat - 2h)
1. Éditer `src/data/syscohada.ts`
2. Ajouter classe 8 complète avec tous comptes HAO (81-89)
3. Optionnel: Ajouter classe 9 (analytique) si besoin

### Phase 2: Service Adapter (Urgent - 3h)
1. Créer `src/services/accountingStandardAdapter.ts`
2. Définir mappings pour PCG, SYSCOHADA, IFRS, SCF
3. Implémenter méthodes helper (isRevenue, isExpense, isHAO, inferStandard)

### Phase 3: Intégration Rapports (Critique - 4h)
1. Modifier les 13 méthodes de `reportGenerationService.ts`
2. Ajouter détection du standard au début de chaque méthode
3. Remplacer hardcoded filters par appels à AccountingStandardAdapter
4. Ajouter sections HAO pour SYSCOHADA dans compte de résultat

### Phase 4: Base de données (Important - 1h30)
1. Créer migration SQL pour colonne `accounting_standard` dans `companies`
2. Script de mise à jour automatique basé sur pays
3. Mettre à jour `src/types/supabase.ts`

### Phase 5: Tests (1h)
1. Créer entreprise test Côte d'Ivoire (CI) → doit détecter SYSCOHADA
2. Générer compte de résultat → vérifier section HAO apparaît
3. Créer entreprise test France (FR) → doit détecter PCG
4. Vérifier pas de régression sur rapports PCG

---

## 🎯 CONCLUSION

**L'infrastructure multi-standards EXISTE mais est INCOMPLÈTE à 70%.**

**Actions BLOQUANTES pour les rapports multi-pays:**
1. ✅ Types et interfaces → OK
2. ✅ Détection automatique → OK
3. ❌ **Class 8 HAO manquante** → À AJOUTER
4. ❌ **Service adapter absent** → À CRÉER
5. ❌ **Rapports non adaptés** → À MODIFIER

**Temps estimé pour complétion minimale:** ~10h (Phase 1-4)
**Bénéfice:** 13 rapports fonctionnels pour 4 zones (France, OHADA, Maghreb, Anglophone)

**Recommandation:** Procéder à l'implémentation des Phases 1-4 immédiatement.
