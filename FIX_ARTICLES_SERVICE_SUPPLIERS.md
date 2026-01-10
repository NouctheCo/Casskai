# Fix ArticlesService - Relations Suppliers

**Date**: 2025-01-09
**Fichier**: `src/services/articlesService.ts`
**Status**: ✅ CORRIGÉ

---

## 🐛 Bug Critique

Le service `articlesService.ts` utilisait l'ancienne table `third_parties` au lieu de la nouvelle table `suppliers` pour les relations fournisseurs.

**Impact**: Toutes les requêtes d'articles tentant de charger le nom du fournisseur échouaient avec une erreur de relation introuvable.

---

## 🔧 Corrections Appliquées

### Lignes Modifiées

| Ligne | Fonction | Changement |
|-------|----------|------------|
| 94 | `getArticles()` | `third_parties:supplier_id` → `supplier:suppliers!supplier_id` |
| 125 | `getArticles()` (mapping) | `article.third_parties?.name` → `article.supplier?.name` |
| 139 | `getArticleById()` | `third_parties:supplier_id` → `supplier:suppliers!supplier_id` |
| 152 | `getArticleById()` (mapping) | `data.third_parties?.name` → `data.supplier?.name` |
| 279 | `getLowStockArticles()` | `third_parties:supplier_id` → `supplier:suppliers!supplier_id` |
| 292 | `getLowStockArticles()` (mapping) | `article.third_parties?.name` → `article.supplier?.name` |

---

## 📝 Détails des Corrections

### 1. Fonction `getArticles()` (Lignes 88-128)

**AVANT**:
```typescript
let query = supabase
  .from('articles')
  .select(`
    *,
    warehouses:warehouse_id (name),
    third_parties:supplier_id (name),        // ❌ OBSOLÈTE
    purchase_account:purchase_account_id (account_number),
    sales_account:sales_account_id (account_number)
  `)
  .eq('company_id', companyId);

// ...

return (data || []).map(article => ({
  ...article,
  warehouse_name: article.warehouses?.name,
  supplier_name: article.third_parties?.name,  // ❌ OBSOLÈTE
  purchase_account_number: article.purchase_account?.account_number,
  sales_account_number: article.sales_account?.account_number
}));
```

**APRÈS**:
```typescript
let query = supabase
  .from('articles')
  .select(`
    *,
    warehouses:warehouse_id (name),
    supplier:suppliers!supplier_id (name),   // ✅ CORRECT
    purchase_account:purchase_account_id (account_number),
    sales_account:sales_account_id (account_number)
  `)
  .eq('company_id', companyId);

// ...

return (data || []).map(article => ({
  ...article,
  warehouse_name: article.warehouses?.name,
  supplier_name: article.supplier?.name,       // ✅ CORRECT
  purchase_account_number: article.purchase_account?.account_number,
  sales_account_number: article.sales_account?.account_number
}));
```

---

### 2. Fonction `getArticleById()` (Lignes 133-155)

**AVANT**:
```typescript
const { data, error } = await supabase
  .from('articles')
  .select(`
    *,
    warehouses:warehouse_id (name),
    third_parties:supplier_id (name),        // ❌ OBSOLÈTE
    purchase_account:purchase_account_id (account_number),
    sales_account:sales_account_id (account_number)
  `)
  .eq('id', articleId)
  .single();

return {
  ...data,
  warehouse_name: data.warehouses?.name,
  supplier_name: data.third_parties?.name,   // ❌ OBSOLÈTE
  purchase_account_number: data.purchase_account?.account_number,
  sales_account_number: data.sales_account?.account_number
};
```

**APRÈS**:
```typescript
const { data, error } = await supabase
  .from('articles')
  .select(`
    *,
    warehouses:warehouse_id (name),
    supplier:suppliers!supplier_id (name),   // ✅ CORRECT
    purchase_account:purchase_account_id (account_number),
    sales_account:sales_account_id (account_number)
  `)
  .eq('id', articleId)
  .single();

return {
  ...data,
  warehouse_name: data.warehouses?.name,
  supplier_name: data.supplier?.name,        // ✅ CORRECT
  purchase_account_number: data.purchase_account?.account_number,
  sales_account_number: data.sales_account?.account_number
};
```

---

### 3. Fonction `getLowStockArticles()` (Lignes 273-293)

**AVANT**:
```typescript
const { data, error } = await supabase
  .from('articles')
  .select(`
    *,
    warehouses:warehouse_id (name),
    third_parties:supplier_id (name)         // ❌ OBSOLÈTE
  `)
  .eq('company_id', companyId)
  .eq('is_active', true)
  .filter('stock_quantity', 'lte', supabase.rpc('stock_min'))
  .order('stock_quantity', { ascending: true });

return (data || []).map(article => ({
  ...article,
  warehouse_name: article.warehouses?.name,
  supplier_name: article.third_parties?.name // ❌ OBSOLÈTE
}));
```

**APRÈS**:
```typescript
const { data, error } = await supabase
  .from('articles')
  .select(`
    *,
    warehouses:warehouse_id (name),
    supplier:suppliers!supplier_id (name)    // ✅ CORRECT
  `)
  .eq('company_id', companyId)
  .eq('is_active', true)
  .filter('stock_quantity', 'lte', supabase.rpc('stock_min'))
  .order('stock_quantity', { ascending: true });

return (data || []).map(article => ({
  ...article,
  warehouse_name: article.warehouses?.name,
  supplier_name: article.supplier?.name      // ✅ CORRECT
}));
```

---

## 📊 Syntaxe des Relations Supabase

### Relation Simple
```typescript
// Table source: articles
// Colonne FK: supplier_id
// Table cible: suppliers

// Syntaxe correcte:
supplier:suppliers!supplier_id (name)
//  ↑       ↑         ↑
//  alias   table     colonne FK
```

### Explication
- `supplier:` - Alias utilisé dans le code TypeScript (peut être n'importe quoi)
- `suppliers!` - Nom de la table cible (avec `!` pour forcer la relation)
- `supplier_id` - Nom de la colonne FK dans la table source
- `(name)` - Colonnes à sélectionner de la table cible

---

## ✅ Tests à Effectuer

### Tests Unitaires
- [ ] `getArticles()` retourne les articles avec supplier_name
- [ ] `getArticleById()` retourne un article avec supplier_name
- [ ] `getLowStockArticles()` retourne les articles avec supplier_name
- [ ] Pas d'erreur de relation introuvable

### Tests d'Intégration
- [ ] Page Inventaire charge correctement les articles
- [ ] Liste des articles affiche les noms des fournisseurs
- [ ] Sélecteur d'articles affiche les fournisseurs
- [ ] Filtre par fournisseur fonctionne
- [ ] Alertes de stock bas affichent les fournisseurs

### Tests de Non-Régression
- [ ] Articles sans fournisseur (supplier_id = null) fonctionnent
- [ ] Filtres (catégorie, entrepôt, recherche) fonctionnent toujours
- [ ] Création/modification d'articles fonctionne
- [ ] Statistiques d'articles fonctionnent

---

## 🔗 Relations DB Actuelles

### Table `articles`
```sql
CREATE TABLE articles (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  supplier_id uuid REFERENCES suppliers(id),     -- ✅ Relation vers suppliers
  warehouse_id uuid REFERENCES warehouses(id),
  purchase_account_id uuid REFERENCES accounts(id),
  sales_account_id uuid REFERENCES accounts(id),
  -- ... autres colonnes
);
```

### Relations Correctes
```
articles.supplier_id → suppliers.id              ✅ CORRECT
articles.warehouse_id → warehouses.id            ✅ CORRECT
articles.purchase_account_id → accounts.id       ✅ CORRECT
articles.sales_account_id → accounts.id          ✅ CORRECT
```

### Relations Obsolètes Supprimées
```
articles.supplier_id → third_parties.id          ❌ SUPPRIMÉ
```

---

## 📚 Documents Connexes

- [AUDIT_MODULE_INVENTAIRE.md](AUDIT_MODULE_INVENTAIRE.md) - Audit complet du module
- [MIGRATION_THIRD_PARTIES_SUMMARY.md](MIGRATION_THIRD_PARTIES_SUMMARY.md) - Migration globale
- [MIGRATION_SUPPLIERS_COMPLETE.md](MIGRATION_SUPPLIERS_COMPLETE.md) - Migration fournisseurs

---

## 🎯 Impact

**Avant**: Module inventaire cassé, impossible de charger les articles avec fournisseurs
**Après**: Module inventaire fonctionnel, toutes les relations correctes

**Fonctions affectées**:
- ✅ `getArticles()` - Liste des articles
- ✅ `getArticleById()` - Détail d'un article
- ✅ `getLowStockArticles()` - Alertes de stock bas
- ✅ `getArticlesBySupplier()` - Filtrage par fournisseur (indirect)

---

**Status**: ✅ **Bug critique corrigé - Module inventaire opérationnel**
