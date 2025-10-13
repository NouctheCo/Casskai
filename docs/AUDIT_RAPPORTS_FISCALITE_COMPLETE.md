# AUDIT COMPLET - Rapports, Fiscalité & Plan Comptable

## 🔍 DIAGNOSTIC - État actuel (12 Octobre 2025)

### ❌ PROBLÈMES CRITIQUES IDENTIFIÉS

#### 1. **MODULE REPORTS - Génération impossible**

**Fichier**: `src/pages/ReportsPage.tsx`
- **Ligne 44-47**: Redirige TOUT vers `EnhancedReportsPage` sans logique de génération
- **Problème**: Même le code legacy (lignes 399-472) qui appelle les services est ignoré

**Fichier**: `src/services/reportsService.ts`
- **Lignes 172-264**: Appelle 4 RPC functions Supabase qui **N'EXISTENT PAS** :
  - `generate_balance_sheet` (ligne 174)
  - `generate_income_statement` (ligne 197)
  - `generate_cash_flow_statement` (ligne 221)
  - `generate_trial_balance` (ligne 245)

**Conséquence**: **AUCUN RAPPORT NE SE GÉNÈRE** ❌

---

#### 2. **ONGLET RAPPORTS dans Accounting - Incohérent**

**Fichier**: `src/components/accounting/OptimizedReportsTab.tsx`
- **Problème**: Affiche uniquement des statistiques KPI (CA, Charges, Résultat)
- **Manque**: Pas de génération PDF/Excel de documents comptables officiels
- **Ce qui est attendu**:
  - Bilan comptable (Balance Sheet)
  - Compte de résultat (Income Statement)
  - Grand livre (General Ledger)
  - Balance générale (Trial Balance)
  - Journaux comptables

---

#### 3. **MODULE FISCALITÉ - Déclarations non fonctionnelles**

**Fichier**: `src/pages/TaxPage.tsx` (à auditer)
- Vérifier génération déclarations TVA
- Vérifier liasses fiscales
- Vérifier déclaration IS (Impôt sur les Sociétés)

---

#### 4. **INITIALISATION PLAN COMPTABLE - NON IMPLÉMENTÉE**

**Fichier**: `supabase/functions/create-company-onboarding/index.ts`
- **Lignes 34-82**: Crée uniquement `companies` et `user_companies`
- **❌ MANQUE**: Appel à `initialize_company_chart_of_accounts(company_id, country)`
- **Conséquence**: Les utilisateurs ont des companies SANS plan comptable de base

**Fichier existant**: `supabase/migrations/20251012_fix_chart_of_accounts_initialization.sql`
- **RPC function**: `initialize_company_chart_of_accounts()` EXISTE ✅
- Utilise `chart_of_accounts_templates` pour initialiser selon pays
- **Mais jamais appelée lors de l'onboarding** ❌

---

## 📋 SOLUTION COMPLÈTE À IMPLÉMENTER

### Phase 1: Créer les RPC Functions de génération rapports (Supabase)

#### 1.1 - `generate_balance_sheet(company_id, end_date)`
```sql
-- Bilan comptable à une date donnée
-- Classes 1-5 : Bilan (Actif/Passif)
-- Retourne: {assets: {...}, liabilities: {...}, equity: {...}}
```

#### 1.2 - `generate_income_statement(company_id, start_date, end_date)`
```sql
-- Compte de résultat sur période
-- Classe 6 : Charges
-- Classe 7 : Produits
-- Retourne: {revenue: {...}, expenses: {...}, net_income: number}
```

#### 1.3 - `generate_trial_balance(company_id, end_date)`
```sql
-- Balance générale (tous les comptes avec débits/crédits)
-- Retourne: [{account_number, account_name, debit, credit, balance}]
```

#### 1.4 - `generate_cash_flow_statement(company_id, start_date, end_date)`
```sql
-- Tableau des flux de trésorerie
-- Retourne: {operating: {...}, investing: {...}, financing: {...}}
```

#### 1.5 - `generate_general_ledger(company_id, start_date, end_date, account_filter?)`
```sql
-- Grand livre (détail de tous les mouvements)
-- Retourne: [{entry_date, account, description, debit, credit, balance}]
```

---

### Phase 2: Implémenter génération PDF/Excel côté front-end

#### 2.1 - Créer utilitaire de génération PDF
**Fichier**: `src/utils/reportGeneration/pdfGenerator.ts`
- Utiliser bibliothèque `jsPDF` ou `pdfmake`
- Templates par pays (FR, BE, etc.)
- Respect des normes comptables (PCG français, etc.)

#### 2.2 - Créer utilitaire de génération Excel
**Fichier**: `src/utils/reportGeneration/excelGenerator.ts`
- Utiliser `xlsx` ou `ExcelJS`
- Format exploitable pour import dans autres logiciels

#### 2.3 - Templates par pays
**Fichier**: `src/utils/reportGeneration/templates/`
- `france/` : PCG français (classes 1-7), formats réglementaires
- `belgium/` : Plan comptable belge
- `switzerland/` : Plan comptable suisse
- Etc.

---

### Phase 3: Corriger OptimizedReportsTab.tsx

**Ajouter onglets** :
1. **Bilan** - Générer bilan comptable PDF/Excel
2. **Compte de Résultat** - Générer CR PDF/Excel
3. **Grand Livre** - Export détaillé mouvements
4. **Balance Générale** - Balance tous comptes
5. **Journaux** - Export journaux comptables

**Chaque onglet** :
- Sélection période
- Boutons "Aperçu" / "PDF" / "Excel"
- Affichage 0€ si pas de données (état vide propre)
- Remplissage dynamique selon écritures réelles

---

### Phase 4: Créer module Fiscalité complet

**Fichier**: `src/pages/TaxPage.tsx`

#### 4.1 - Déclaration TVA (France: CA3, CA12)
- Calcul TVA collectée (classe 44571)
- Calcul TVA déductible (classe 44566)
- Génération formulaires pré-remplis
- Période mensuelle/trimestrielle

#### 4.2 - Liasse fiscale (France: 2050-2059)
- Bilan actif/passif (2050/2051)
- Compte de résultat (2052/2053)
- Immobilisations (2054/2055)
- Amortissements (2055)
- Provisions (2056)
- État des échéances (2057)
- Détermination résultat fiscal (2058-A/B/C)
- Déficits/provisions (2059-A/B/C/D)

#### 4.3 - Déclaration IS (Impôt sur les Sociétés)
- Résultat comptable → Résultat fiscal
- Réintégrations/Déductions
- Calcul IS selon taux
- Génération liasse 2065

---

### Phase 5: Initialiser plan comptable à l'onboarding

**Fichier**: `supabase/functions/create-company-onboarding/index.ts`

**Ajouter après ligne 81** :
```typescript
// Initialize chart of accounts based on country
const country_code = companyData.country || 'FR';

const { data: chartInit, error: chartError } = await supabaseAdmin
  .rpc('initialize_company_chart_of_accounts', {
    p_company_id: company.id,
    p_country_code: country_code
  });

if (chartError) {
  console.error('⚠️ [Edge Function] Chart of accounts initialization warning:', chartError);
  // Non-blocking: company is created but user will need to setup accounts manually
}

console.log(`✅ [Edge Function] Initialized ${chartInit || 0} accounts for country ${country_code}`);
```

**Vérifier table**: `chart_of_accounts_templates`
- Doit contenir plans comptables pour FR, BE, CH, etc.
- Si vide: créer migration pour alimenter avec PCG français

---

### Phase 6: Adapter rapports selon pays

**Tables Supabase à créer/vérifier** :
```sql
CREATE TABLE IF NOT EXISTS report_templates_by_country (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_code TEXT NOT NULL, -- 'FR', 'BE', 'CH', etc.
  report_type TEXT NOT NULL, -- 'balance_sheet', 'income_statement', etc.
  template_structure JSONB NOT NULL, -- Structure du rapport selon normes locales
  legal_requirements JSONB, -- Exigences légales spécifiques
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎯 PRIORITÉS D'IMPLÉMENTATION

### P0 - CRITIQUE (Faire en premier)
1. ✅ Créer 4 RPC functions de base (bilan, CR, balance, flux)
2. ✅ Corriger onboarding pour initialiser plan comptable
3. ✅ Implémenter génération PDF basique (bilan + CR)

### P1 - HAUTE (Juste après)
4. ✅ Corriger OptimizedReportsTab avec vrais rapports
5. ✅ Créer templates FR (PCG) pour rapports
6. ✅ Module Fiscalité: TVA + Liasse fiscale

### P2 - MOYENNE (Ensuite)
7. ✅ Génération Excel
8. ✅ Grand Livre + Journaux
9. ✅ Déclaration IS

### P3 - BASSE (Améliorations)
10. ✅ Templates multi-pays (BE, CH, etc.)
11. ✅ Export FEC (Fichier des Écritures Comptables)
12. ✅ Planification automatique rapports

---

## 📊 ARCHITECTURE TECHNIQUE RECOMMANDÉE

### Stack de génération documents :
- **PDF**: `jspdf` + `jspdf-autotable` (léger, performant)
- **Excel**: `exceljs` (support formules, style avancé)
- **Impression**: CSS `@media print` pour aperçu navigateur

### Structure fichiers :
```
src/
├── utils/
│   ├── reportGeneration/
│   │   ├── core/
│   │   │   ├── pdfGenerator.ts
│   │   │   ├── excelGenerator.ts
│   │   │   └── dataFormatter.ts
│   │   ├── templates/
│   │   │   ├── france/
│   │   │   │   ├── balanceSheet.ts
│   │   │   │   ├── incomeStatement.ts
│   │   │   │   ├── generalLedger.ts
│   │   │   │   └── taxForms/
│   │   │   │       ├── tva.ts
│   │   │   │       ├── liasseFiscale.ts
│   │   │   │       └── is.ts
│   │   │   ├── belgium/
│   │   │   └── switzerland/
│   │   └── types.ts
│   └── accounting/
│       ├── chartOfAccounts.ts
│       └── accountingRules.ts
```

---

## 🔐 RÈGLES COMPTABLES À RESPECTER

### France (PCG - Plan Comptable Général) :
- **Classe 1** : Capitaux permanents (Passif)
- **Classe 2** : Immobilisations (Actif immobilisé)
- **Classe 3** : Stocks (Actif circulant)
- **Classe 4** : Comptes de tiers (Créances/Dettes)
- **Classe 5** : Comptes financiers (Banque, Caisse)
- **Classe 6** : Charges (Compte de résultat)
- **Classe 7** : Produits (Compte de résultat)
- **Classe 8** : Comptes spéciaux

### Règles de validation :
- Débit = Crédit (équilibre écritures)
- Bilan équilibré : Actif = Passif + Capitaux propres
- Compte de résultat : Résultat net = Produits - Charges

---

## ✅ CHECKLIST DE VALIDATION

Après implémentation, vérifier :

### Rapports :
- [ ] Bilan généré avec données à 0€ (nouvel utilisateur)
- [ ] Bilan généré avec vraies données (utilisateur existant)
- [ ] Compte de résultat : calcul correct Produits - Charges
- [ ] Balance générale : tous comptes présents
- [ ] Grand livre : mouvements détaillés par compte
- [ ] Export PDF : format professionnel
- [ ] Export Excel : formules fonctionnelles

### Fiscalité :
- [ ] Déclaration TVA : calcul correct TVA collectée - déductible
- [ ] Liasse fiscale : tous formulaires 2050-2059 générés
- [ ] Déclaration IS : réintégrations/déductions appliquées

### Plan comptable :
- [ ] Initialisation automatique à l'onboarding
- [ ] Plan selon pays (FR différent de BE)
- [ ] Possibilité ajout comptes personnalisés
- [ ] Import FEC : correspondance comptes

### Multi-pays :
- [ ] Templates France ✅
- [ ] Templates Belgique
- [ ] Templates Suisse
- [ ] Détection automatique selon company.country

---

## 📝 NOTES IMPORTANTES

1. **Performance** : Les rapports doivent se générer en < 3 secondes même avec 10 000 écritures
2. **Sécurité** : RLS policies sur financial_reports, accès par company_id
3. **Stockage** : Sauvegarder PDF générés dans Supabase Storage pour historique
4. **Cache** : Mettre en cache rapports fréquents (ex: bilan mensuel)
5. **Audit trail** : Logger toutes générations de rapports
6. **Conformité** : Templates validés par expert-comptable

---

**Document créé le**: 12 Octobre 2025
**Auteur**: Claude (Expert-comptable + Fiscaliste + Développeur)
**Statut**: 🔴 EN ATTENTE D'IMPLÉMENTATION
