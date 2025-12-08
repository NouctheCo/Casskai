# Validation du Schéma DB - Documentation

## 🎯 Objectif

Ce document décrit le système de validation automatique qui compare les colonnes utilisées dans le code avec le schéma Supabase réel pour éviter les erreurs 400.

## 📋 Schéma de Référence

### Tables Principales

#### `invoices`
**Colonnes valides:**
- `id`, `company_id`, `invoice_number`, `invoice_type`, `invoice_date`, `due_date`
- `status`, `subtotal_excl_tax`, `total_tax_amount`, `total_incl_tax`, `currency`
- `third_party_id`, `customer_id`, `notes`, `created_at`, `updated_at`

**❌ Colonnes SUPPRIMÉES (ne plus utiliser):**
- `type` → utiliser `invoice_type`
- `issue_date` → utiliser `invoice_date`
- `subtotal` → utiliser `subtotal_excl_tax`
- `tax_amount` → utiliser `total_tax_amount`
- `total_amount` → utiliser `total_incl_tax`

---

#### `third_parties`
**Colonnes valides:**
- `id`, `company_id`, `type`, `name`, `legal_name`, `tax_id`, `is_active`
- `current_balance`, `credit_limit`, `address_line1`, `address_line2`, `city`
- `postal_code`, `country`, `email`, `phone`, `website`, `notes`, `created_at`, `updated_at`

**❌ Colonnes SUPPRIMÉES:**
- `party_type` → utiliser `type`
- `status` → utiliser `is_active` (boolean)
- `balance` → utiliser `current_balance`
- `address` → utiliser `address_line1`

---

#### `inventory_items`
**Colonnes valides:**
- `id`, `company_id`, `product_id`, `product_variant_id`, `warehouse_id`
- `location_id`, `quantity_on_hand`, `reserved_quantity`, `available_quantity`
- `unit_cost`, `last_restock_date`, `reorder_point`, `reorder_quantity`
- `created_at`, `updated_at`

**❌ Colonnes qui N'EXISTENT PAS ici:**
- `name`, `reference`, `sku`, `category`, `status`
- ℹ️ Ces colonnes sont dans la table `products`, pas `inventory_items`

**⚠️ Tables inexistantes:**
- `inventory_categories` → cette table n'existe pas

---

#### `products`
**Colonnes valides:**
- `id`, `company_id`, `code`, `name`, `description`, `category`, `stock_unit`
- `sale_price`, `purchase_price`, `min_stock`, `max_stock`, `is_active`
- `created_at`, `updated_at`

**❌ Colonnes qui N'EXISTENT PAS ici:**
- `barcode` → utiliser `product_variants.barcode`

---

#### `product_variants`
**Colonnes valides:**
- `id`, `product_id`, `variant_name`, `sku`, `barcode`, `price_adjustment`
- `is_active`, `created_at`, `updated_at`

---

#### `chart_of_accounts`
**Colonnes valides:**
- `id`, `company_id`, `account_number`, `account_name`, `account_type`
- `parent_id`, `is_active`, `created_at`, `updated_at`

**❌ Colonnes SUPPRIMÉES:**
- `account_code` → utiliser `account_number`

---

#### `category_account_map`
**Colonnes valides:**
- `id`, `company_id`, `category_id`, `account_number`, `created_at`, `updated_at`

**❌ Colonnes SUPPRIMÉES:**
- `account_code` → utiliser `account_number`

---

## 🔧 Utilisation du Script de Validation

### Lancer la validation

```bash
npm run validate:db
```

### Sortie du script

Le script génère un rapport complet avec :
- ❌ **ERREURS CRITIQUES** : Colonnes inexistantes ou supprimées utilisées dans des requêtes
- ⚠️ **AVERTISSEMENTS** : Utilisation potentielle de colonnes dépréciées
- 📋 **SCHÉMA DE RÉFÉRENCE** : Liste complète des colonnes valides

### Exemple de sortie

```
🔍 Validation des colonnes DB...

Scanning src/services...
Scanning src/hooks...

================================================================================
RAPPORT DE VALIDATION
================================================================================

❌ ERREURS CRITIQUES (2):

1. src/services/inventoryService.ts
   Table inventory_categories n'existe pas
   Occurrences: 1

2. src/components/accounting/ChartOfAccountsEnhanced.tsx
   Utiliser account_number, pas account_code
   Occurrences: 3

⚠️  AVERTISSEMENTS (5):

1. src/services/crmService.ts
   Table: third_parties
   Colonne supprimée 'status' potentiellement utilisée
   Occurrences: 2
```

---

## 🛠️ Corrections des Erreurs Communes

### Erreur : `inventory_categories`
**Problème :**
```typescript
.select(`
  *,
  inventory_categories (*)  // ❌ Table n'existe pas
`)
```

**Solution :**
```typescript
.select(`
  *,
  products:product_id (*),
  warehouses:warehouse_id (*)
`)
```

---

### Erreur : `account_code`
**Problème :**
```typescript
.select('account_code, category_id')  // ❌ Colonne supprimée
.eq('account_code', accountNumber)     // ❌
```

**Solution :**
```typescript
.select('account_number, category_id')  // ✅
.eq('account_number', accountNumber)    // ✅
```

---

### Erreur : `products.barcode`
**Problème :**
```typescript
barcode: row.products?.barcode ?? undefined  // ❌ N'existe pas
```

**Solution :**
```typescript
barcode: row.product_variants?.barcode ?? undefined  // ✅
```

---

### Erreur : `invoices.type`
**Problème :**
```typescript
.select('type, invoice_number')  // ❌ Utiliser invoice_type
old_values: {
  type: invoice.type,            // ❌
  total_amount: invoice.total_amount  // ❌ Utiliser total_incl_tax
}
```

**Solution :**
```typescript
.select('invoice_type, invoice_number')  // ✅
old_values: {
  type: invoice.invoice_type,            // ✅
  total_amount: invoice.total_incl_tax   // ✅
}
```

---

## 📊 Intégration dans le Workflow

### Avant le Build
```bash
npm run validate:db && npm run build
```

### Dans CI/CD
```yaml
# .github/workflows/ci.yml
- name: Validate DB Schema
  run: npm run validate:db
```

### Pre-commit Hook (optionnel)
```bash
# .husky/pre-commit
npm run validate:db || exit 1
```

---

## 🎯 Prochaines Étapes Recommandées

1. **Tests d'intégration** : Ajouter des tests qui valident les requêtes Supabase
2. **Types Supabase générés** : Utiliser `supabase gen types typescript` pour avoir des types stricts
3. **Linter personnalisé** : Créer une règle ESLint pour détecter les colonnes supprimées
4. **Documentation auto** : Générer automatiquement la doc du schéma depuis Supabase

---

## 📝 Historique des Corrections

### 2025-12-07 - Corrections Majeures
- ✅ Supprimé `inventory_categories` de inventoryService.ts
- ✅ Remplacé `account_code` → `account_number` (5 occurrences)
- ✅ Corrigé `products.barcode` → `product_variants.barcode`
- ✅ Corrigé audit trail invoices avec `invoice_type` et `total_incl_tax`

---

## 🔗 Ressources

- [Supabase Schema Documentation](https://supabase.com/docs/guides/database)
- [Script de validation](../scripts/validate-db-columns.cjs)
- [Issues GitHub - DB Schema](https://github.com/anthropics/casskai/issues?q=label%3Adb-schema)
