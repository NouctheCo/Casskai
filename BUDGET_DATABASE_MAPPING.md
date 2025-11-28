# Budget Module - Database/TypeScript Mapping

## ⚠️ Important: Column Name Mapping

La table `budget_lines` utilise `line_type` dans PostgreSQL au lieu de `type` pour éviter un conflit avec un mot réservé SQL.

### Mapping entre Database et TypeScript

| TypeScript Interface | Database Column | Type | Notes |
|---------------------|-----------------|------|-------|
| `type` | `line_type` | `VARCHAR(10)` | 'revenue' ou 'expense' |
| `annual_amount` | `annual_amount` | `DECIMAL(15,2)` | Montant annuel |
| `monthly_distribution` | `monthly_distribution` | `DECIMAL[]` | Array de 12 valeurs |
| `account_id` | `account_id` | `UUID` | Foreign key vers `accounts` |
| `account_number` | `account_number` | `VARCHAR(20)` | Dénormalisé |
| `account_name` | `account_name` | `VARCHAR(255)` | Dénormalisé |
| `subcategory` | `subcategory` | `VARCHAR(255)` | Sous-catégorie optionnelle |
| `growth_rate` | `growth_rate` | `DECIMAL(5,2)` | Taux de croissance % |
| `notes` | `notes` | `TEXT` | Notes optionnelles |

## 📝 Quand utiliser quoi

### Dans le code TypeScript
```typescript
interface BudgetCategory {
  type: 'revenue' | 'expense';  // ✅ Utiliser 'type'
  annual_amount: number;
  monthly_distribution: number[];
}
```

### Dans les requêtes Supabase
```typescript
// ❌ INCORRECT
const { data } = await supabase
  .from('budget_lines')
  .select('type, annual_amount')  // ❌ 'type' n'existe pas en BDD
  .eq('type', 'revenue');

// ✅ CORRECT
const { data } = await supabase
  .from('budget_lines')
  .select('line_type, annual_amount')  // ✅ Utiliser 'line_type'
  .eq('line_type', 'revenue');

// Puis mapper dans le code
const categories = data.map(row => ({
  ...row,
  type: row.line_type,  // Mapping explicite
}));
```

### Dans les INSERT/UPDATE
```typescript
// ❌ INCORRECT
await supabase.from('budget_lines').insert({
  type: 'revenue',  // ❌ La colonne s'appelle 'line_type'
  annual_amount: 50000,
});

// ✅ CORRECT
await supabase.from('budget_lines').insert({
  line_type: 'revenue',  // ✅ Bon nom de colonne
  annual_amount: 50000,
});

// Ou avec mapping depuis l'interface
const category: BudgetCategory = {
  type: 'revenue',
  annual_amount: 50000,
  monthly_distribution: [...]
};

await supabase.from('budget_lines').insert({
  ...category,
  line_type: category.type,  // Mapper explicitement
  type: undefined,  // Supprimer le champ 'type'
});
```

## 🔧 Fonctions SQL

Les fonctions PostgreSQL utilisent `line_type`:

```sql
-- Fonction get_budget_totals
SELECT
  COALESCE(SUM(CASE WHEN line_type = 'revenue' THEN annual_amount ELSE 0 END), 0),
  COALESCE(SUM(CASE WHEN line_type = 'expense' THEN annual_amount ELSE 0 END), 0)
FROM budget_lines
WHERE budget_id = p_budget_id;
```

## 📋 Migration appliquée

La migration [20251128_budget_tables_v2.sql](supabase/migrations/20251128_budget_tables_v2.sql) crée:

- ✅ Table `budget_lines` avec colonne `line_type`
- ✅ Check constraint: `line_type IN ('revenue', 'expense')`
- ✅ Index: `idx_budget_lines_type ON (budget_id, line_type)`
- ✅ Fonction `get_budget_totals()` utilisant `line_type`

## 🚀 Action requise dans le code

Avant d'utiliser les nouvelles tables, assurez-vous de:

1. **Mapper les données lors du SELECT**:
```typescript
const { data } = await supabase
  .from('budget_lines')
  .select('*, line_type')
  .eq('budget_id', budgetId);

const categories = data.map(row => ({
  ...row,
  type: row.line_type,
}));
```

2. **Mapper les données lors de l'INSERT/UPDATE**:
```typescript
const { type, ...rest } = categoryData;
await supabase.from('budget_lines').insert({
  ...rest,
  line_type: type,
});
```

3. **Créer un helper de mapping** (recommandé):
```typescript
// utils/budgetMapping.ts
export const toBudgetLineDB = (category: BudgetCategory) => {
  const { type, ...rest } = category;
  return {
    ...rest,
    line_type: type,
  };
};

export const fromBudgetLineDB = (row: any): BudgetCategory => {
  const { line_type, ...rest } = row;
  return {
    ...rest,
    type: line_type,
  };
};
```

## ✅ Prochaines étapes

1. Appliquer la migration dans Supabase SQL Editor
2. Créer les helpers de mapping
3. Mettre à jour `BudgetCategoryForm` pour utiliser le mapping
4. Mettre à jour `businessPlanService` pour mapper les données
5. Tester la création d'un budget avec des lignes
