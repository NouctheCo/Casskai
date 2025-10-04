# Système de Forecast Budgétaire - PRÊT POUR DÉPLOIEMENT

## ✅ Modifications Complètes

### 1. Migration SQL - ADAPTÉE À LA STRUCTURE EXISTANTE
**Fichier**: `supabase/migrations/20250104_budget_forecast_adapted.sql`

**Éléments créés**:
- ✅ Table `category_account_map` - Mapping catégories ↔ comptes comptables
- ✅ Vue `v_actuals_monthly` - Réels mensuels depuis journal_entries + journal_entry_lines (JOIN)
- ✅ Vue `v_actuals_by_category` - Réels agrégés par catégorie budgétaire
- ✅ Vue `v_budget_by_category_monthly` - Budget mensuel (unpivot des monthly_amounts[])
- ✅ Fonction `get_budget_forecast()` - Calcul du forecast avec prorata
- ✅ Fonction `get_budget_forecast_kpi()` - KPIs synthétiques (YTD, EOY, écarts)
- ✅ Fonction `get_unmapped_journal_entries()` - Détection des écritures non mappées (JOIN avec journal_entry_lines)
- ✅ RLS activé sur `category_account_map`

**Corrections appliquées**:
- ✅ Utilisation de `journal_entry_lines.account_number` au lieu de `journal_entries.account_code`
- ✅ Calcul des montants: `debit_amount - credit_amount`
- ✅ JOIN systématique entre `journal_entries` et `journal_entry_lines`
- ✅ Filtre sur `journal_entries.status = 'posted'`

**Signature corrigée**:
```sql
CREATE OR REPLACE FUNCTION get_budget_forecast(
  p_company_id UUID,
  p_budget_id UUID,      -- ✅ Corrigé: p_budget_id (pas p_header_id)
  p_as_of_date DATE,
  p_mode TEXT DEFAULT 'prorata'
)
```

### 2. Service TypeScript - CORRIGÉ
**Fichier**: `src/services/budgetForecastService.ts`

**Modifications**:
- ✅ Paramètre `budgetHeaderId` → `budgetId` (ligne 94)
- ✅ RPC call `p_header_id` → `p_budget_id` (ligne 104)
- ✅ RPC call `p_header_id` → `p_budget_id` (ligne 120)

```typescript
async getForecast(
  companyId: string,
  budgetId: string,      // ✅ Corrigé
  asOfDate: Date = new Date(),
  mode: 'prorata' | 'run_rate' = 'prorata'
): Promise<{ data: BudgetForecastData | null; error: any }>
```

### 3. Composant React - CORRIGÉ
**Fichier**: `src/components/budget/BudgetForecastView.tsx`

**Modifications**:
- ✅ Prop `budgetHeaderId` → `budgetId` (ligne 25)
- ✅ Variable `budgetHeaderId` → `budgetId` (ligne 31)
- ✅ Dépendance useEffect mise à jour (ligne 44)
- ✅ Appel service mis à jour (ligne 51)

```typescript
interface BudgetForecastViewProps {
  companyId: string;
  budgetId: string;     // ✅ Corrigé
  budgetYear: number;
}
```

### 4. Page Budget - CORRIGÉE
**Fichier**: `src/pages/BudgetPage.tsx`

**Modifications**:
- ✅ Prop `budgetHeaderId` → `budgetId` (ligne 108)

```tsx
<BudgetForecastView
  companyId={currentEnterprise.id}
  budgetId={forecastBudgetId}     // ✅ Corrigé
  budgetYear={forecastBudgetYear}
/>
```

## 📊 Fonctionnalités du Forecast

### Calcul du Forecast
- **Mois passés**: Montants réels depuis `journal_entry_lines` (débit - crédit)
- **Mois courant**: Prorata du budget `Budget × (jour_actuel / jours_dans_mois)`
- **Mois futurs**: Budget complet

### KPIs Affichés
1. **Réel YTD** - Réalisé depuis début d'année
2. **Budget Annuel** - Budget total de l'année
3. **Forecast EOY** - Atterrissage estimé fin d'année
4. **Écart** - Forecast - Budget (montant et %)
5. **Taux d'absorption** - Réel YTD / Budget Annuel

### 3 Vues
1. **Totaux** - Vue agrégée (Revenus, Charges, Investissements, Net)
2. **Par Catégorie** - Détail par catégorie budgétaire
3. **Mois par Mois** - Vue mensuelle avec réel/budget/forecast

### Fonctionnalités Supplémentaires
- 🔍 Détection des écritures comptables non mappées
- 📥 Export CSV du forecast
- 🔄 Rafraîchissement en temps réel
- 🌙 Mode sombre complet

## 🚀 Déploiement

### Étape 1: Appliquer la Migration SQL
```bash
# Via Supabase CLI
supabase db push

# OU via Dashboard Supabase
# SQL Editor > New Query > Copier le contenu de 20250104_budget_forecast_adapted.sql > Run
```

### Étape 2: Créer les Mappings Catégorie ↔ Comptes
```sql
-- Exemple de mapping
INSERT INTO category_account_map (company_id, category_id, account_code)
VALUES
  -- Revenus
  ('uuid-company', 'uuid-category-ventes', '707000'),
  ('uuid-company', 'uuid-category-ventes', '706000'),

  -- Charges
  ('uuid-company', 'uuid-category-salaires', '641000'),
  ('uuid-company', 'uuid-category-salaires', '645000'),

  -- Etc.
;
```

### Étape 3: Tester
1. Créer un budget avec catégories
2. Ajouter des écritures dans `journal_entries`
3. Créer les mappings dans `category_account_map`
4. Cliquer sur le bouton "Forecast" dans la carte budget
5. Vérifier les 3 vues et l'export CSV

## 🔧 Dépendances Vérifiées

### Tables Existantes (utilisées)
- ✅ `budgets` - Table principale des budgets
- ✅ `budget_categories` - Catégories avec monthly_amounts[]
- ✅ `journal_entries` - En-têtes d'écritures comptables
- ✅ `journal_entry_lines` - **Lignes d'écritures** avec:
  - `account_number` (TEXT) - Numéro de compte comptable
  - `debit_amount` (NUMERIC) - Montant débit
  - `credit_amount` (NUMERIC) - Montant crédit
  - `journal_entry_id` (FK vers journal_entries)
- ✅ `companies` - Entreprises
- ✅ `user_companies` - Relation utilisateurs ↔ entreprises

### Nouvelle Table
- ✅ `category_account_map` - Créée par la migration

## 📝 Notes Importantes

1. **Structure de données**: La migration utilise la structure réelle de votre base:
   - `budgets.id` (pas `budget_headers.id`)
   - `budget_categories.budget_id` (pas `header_id`)
   - `budget_categories.monthly_amounts[]` - Array de 12 nombres
   - `journal_entry_lines.account_number` (pas `account_code`)
   - Montant = `debit_amount - credit_amount` (convention comptable)

2. **Unpivot**: La vue `v_budget_by_category_monthly` transforme le tableau `monthly_amounts[12]` en 12 lignes distinctes (UNION ALL × 12)

3. **RLS**: La politique RLS sur `category_account_map` utilise `user_companies` pour garantir l'isolation des données

4. **Performance**: Les vues sont créées avec `CREATE OR REPLACE VIEW` (pas matérialisées) pour garantir la fraîcheur des données

## ✨ Prochaines Étapes (Optionnel)

1. **Amélioration**: Ajouter un mode "run rate" en plus du prorata
2. **IA**: Suggestions automatiques de mappings catégories ↔ comptes
3. **Alertes**: Notifications quand écart > seuil configurable
4. **Historique**: Sauvegarder les snapshots de forecast mensuels
5. **Comparaison**: Comparer forecast N vs N-1

## 🎯 Statut

**PRÊT POUR DÉPLOIEMENT** ✅

Tous les fichiers TypeScript sont synchronisés avec la structure SQL adaptée.
Il ne reste plus qu'à:
1. Exécuter la migration SQL dans Supabase
2. Créer les premiers mappings `category_account_map`
3. Tester l'interface utilisateur

---
*Date de création: 2025-01-04*
*Version: 1.0 - Adaptée à la structure existante*
