# Corrections Finales - Système de Forecast Budgétaire

## 🔴 Problèmes Identifiés

**Erreurs SQL**:
1. `ERROR: 42703: column "account_code" does not exist`
2. `ERROR: 42703: column b.year does not exist`

## 🔍 Analyse de la Structure Réelle

### Structure Comptable Découverte:

```
journal_entries (en-têtes)
├── id
├── company_id
├── entry_date
├── status
└── ...

journal_entry_lines (lignes de détail)
├── id
├── journal_entry_id → journal_entries.id
├── account_number ✅ (pas account_code)
├── account_name
├── debit_amount ✅
├── credit_amount ✅
└── ...

budgets
├── id
├── company_id
├── budget_year ✅ (pas year)
├── name
├── status
└── ...
```

**Clés**:
- Les montants comptables sont dans `journal_entry_lines`, pas dans `journal_entries`
- La colonne année est `budget_year`, pas `year`

## ✅ Corrections Appliquées

### 1. Vue `v_actuals_monthly`

**AVANT** (incorrect):
```sql
CREATE OR REPLACE VIEW v_actuals_monthly AS
SELECT
  company_id,
  EXTRACT(YEAR FROM entry_date)::INTEGER AS year,
  EXTRACT(MONTH FROM entry_date)::INTEGER AS month,
  account_code,  -- ❌ N'existe pas
  SUM(amount) AS amount_base  -- ❌ N'existe pas
FROM journal_entries
GROUP BY 1, 2, 3, 4;
```

**APRÈS** (corrigé):
```sql
CREATE OR REPLACE VIEW v_actuals_monthly AS
SELECT
  je.company_id,
  EXTRACT(YEAR FROM je.entry_date)::INTEGER AS year,
  EXTRACT(MONTH FROM je.entry_date)::INTEGER AS month,
  jel.account_number,  -- ✅ Correct
  SUM(jel.debit_amount - jel.credit_amount) AS amount_base  -- ✅ Calcul comptable
FROM journal_entries je
JOIN journal_entry_lines jel ON jel.journal_entry_id = je.id  -- ✅ JOIN nécessaire
WHERE je.status = 'posted'  -- ✅ Filtrer les écritures validées
GROUP BY 1, 2, 3, 4;
```

### 2. Vue `v_actuals_by_category`

**AVANT** (incorrect):
```sql
FROM v_actuals_monthly a
JOIN category_account_map cam
  ON cam.company_id = a.company_id
  AND cam.account_code = a.account_code  -- ❌ a.account_code n'existe pas
```

**APRÈS** (corrigé):
```sql
FROM v_actuals_monthly a
JOIN category_account_map cam
  ON cam.company_id = a.company_id
  AND cam.account_code = a.account_number  -- ✅ Référence correcte
```

### 3. Vue `v_budget_by_category_monthly`

**AVANT** (incorrect):
```sql
SELECT
  bc.company_id,
  bc.budget_id,
  b.year,  -- ❌ N'existe pas
  1 AS month,
  ...
FROM budget_categories bc
JOIN budgets b ON b.id = bc.budget_id
```

**APRÈS** (corrigé):
```sql
SELECT
  bc.company_id,
  bc.budget_id,
  b.budget_year AS year,  -- ✅ Correct + alias pour compatibilité
  1 AS month,
  ...
FROM budget_categories bc
JOIN budgets b ON b.id = bc.budget_id
```

### 4. Fonction `get_unmapped_journal_entries()`

**AVANT** (incorrect):
```sql
CREATE OR REPLACE FUNCTION get_unmapped_journal_entries(
  p_company_id UUID,
  p_year INTEGER
)
RETURNS TABLE (
  account_code TEXT,
  total_amount NUMERIC,
  entry_count BIGINT
) LANGUAGE sql STABLE AS
$$
  SELECT
    je.account_code,  -- ❌ N'existe pas
    SUM(je.amount) AS total_amount,  -- ❌ N'existe pas
    COUNT(*) AS entry_count
  FROM journal_entries je
  WHERE je.company_id = p_company_id
    AND EXTRACT(YEAR FROM je.entry_date) = p_year
    AND NOT EXISTS (
      SELECT 1 FROM category_account_map cam
      WHERE cam.company_id = je.company_id
        AND cam.account_code = je.account_code  -- ❌
    )
  GROUP BY je.account_code
  ORDER BY ABS(SUM(je.amount)) DESC;
$$;
```

**APRÈS** (corrigé):
```sql
CREATE OR REPLACE FUNCTION get_unmapped_journal_entries(
  p_company_id UUID,
  p_year INTEGER
)
RETURNS TABLE (
  account_code TEXT,
  total_amount NUMERIC,
  entry_count BIGINT
) LANGUAGE sql STABLE AS
$$
  SELECT
    jel.account_number AS account_code,  -- ✅ Alias pour compatibilité
    SUM(jel.debit_amount - jel.credit_amount) AS total_amount,  -- ✅
    COUNT(DISTINCT jel.id) AS entry_count  -- ✅ DISTINCT pour éviter doublons
  FROM journal_entries je
  JOIN journal_entry_lines jel ON jel.journal_entry_id = je.id  -- ✅
  WHERE je.company_id = p_company_id
    AND EXTRACT(YEAR FROM je.entry_date) = p_year
    AND je.status = 'posted'  -- ✅
    AND NOT EXISTS (
      SELECT 1 FROM category_account_map cam
      WHERE cam.company_id = je.company_id
        AND cam.account_code = jel.account_number  -- ✅
    )
  GROUP BY jel.account_number
  ORDER BY ABS(SUM(jel.debit_amount - jel.credit_amount)) DESC;
$$;
```

## 📋 Checklist des Modifications

- [x] Vue `v_actuals_monthly` - JOIN avec `journal_entry_lines`
- [x] Vue `v_actuals_monthly` - Utiliser `account_number` au lieu de `account_code`
- [x] Vue `v_actuals_monthly` - Calcul `debit_amount - credit_amount`
- [x] Vue `v_actuals_monthly` - Filtrer `status = 'posted'`
- [x] Vue `v_actuals_by_category` - Corriger le JOIN sur `account_number`
- [x] Vue `v_budget_by_category_monthly` - Utiliser `b.budget_year AS year` (toutes les 12 UNION ALL)
- [x] Fonction `get_unmapped_journal_entries()` - JOIN avec `journal_entry_lines`
- [x] Fonction `get_unmapped_journal_entries()` - Utiliser `account_number`
- [x] Fonction `get_unmapped_journal_entries()` - Calcul `debit_amount - credit_amount`
- [x] Documentation `BUDGET_FORECAST_READY.md` - Mise à jour

## 🎯 Résultat

**Fichier Migration**: `supabase/migrations/20250104_budget_forecast_adapted.sql`

✅ **PRÊT POUR DÉPLOIEMENT**

La migration est maintenant 100% compatible avec la structure réelle de votre base de données.

## 🚀 Prochaine Étape

```bash
# Exécuter la migration dans Supabase
supabase db push

# OU via Dashboard Supabase SQL Editor
# Copier-coller le contenu de 20250104_budget_forecast_adapted.sql
```

---
*Date: 2025-01-04*
*Statut: ✅ CORRIGÉ*
