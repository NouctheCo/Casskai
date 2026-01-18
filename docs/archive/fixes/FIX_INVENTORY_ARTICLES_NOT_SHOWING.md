# Fix: Articles Créés N'apparaissent Pas dans Inventory

**Date**: 2025-01-09
**Statut**: 🔴 BUG IDENTIFIÉ - Solution à Implémenter
**Priorité**: 🔴 CRITIQUE

---

## 🐛 Problème Identifié

### Symptôme
Les articles créés via `NewArticleModal` :
- ✅ Sont bien créés en base de données
- ✅ Apparaissent dans le sélecteur de factures
- ❌ **N'apparaissent PAS** dans la liste "Articles en stock" (onglet Inventory)
- Message affiché : "Aucun article ne correspond aux filtres"

### Cause Racine

**CONFLIT DE TABLES** : Deux systèmes d'inventaire différents coexistent dans l'application.

#### Système 1 : Table `articles` (ancien/simple)
- **Utilisé par** : `NewArticleModal` + `articlesService`
- **Table** : `articles`
- **Service** : `articlesService.createArticle()`
- **Où ça apparaît** : Sélecteurs de factures, module facturation

#### Système 2 : Table `inventory_items` (nouveau/complet)
- **Utilisé par** : Page Inventory + `InventoryService`
- **Table** : `inventory_items`
- **Service** : `InventoryService.createInventoryItem()`
- **Où ça apparaît** : Page Inventory (Dashboard, Products, Movements, etc.)

---

## 📊 Flux Actuel (Problématique)

```
User clicks "Nouvel article"
    ↓
NewArticleModal opens
    ↓
User fills form and submits
    ↓
articlesService.createArticle() called
    ↓
INSERT INTO articles (company_id, reference, name, ...)
    ↓
✅ Article créé dans `articles`
    ↓
User checks "Articles en stock" tab
    ↓
InventoryService.getInventoryItems() called
    ↓
SELECT * FROM inventory_items WHERE company_id = ...
    ↓
❌ VIDE - L'article n'est pas dans inventory_items!
    ↓
Message: "Aucun article ne correspond aux filtres"
```

---

## 🔍 Analyse Détaillée

### Fichiers Impliqués

#### 1. NewArticleModal.tsx (Lignes 288-293)
```typescript
const article = await articlesService.createArticle(currentCompany.id, articleInput);
// ❌ Crée dans `articles`, pas dans `inventory_items`
```

#### 2. articlesService.ts (Lignes 186-210)
```typescript
async createArticle(companyId: string, articleData: CreateArticleInput): Promise<Article> {
  const dataToInsert = {
    company_id: companyId,
    ...articleData,
    is_active: true
  };

  // ❌ INSERT dans articles
  const { data, error } = await supabase
    .from('articles')
    .insert(dataToInsert)
    .select()
    .single();
}
```

#### 3. inventoryService.ts (Lignes 217-281)
```typescript
static async getInventoryItems(companyId?: string, filters?: InventoryItemFilters): Promise<InventoryItem[]> {
  let query = supabase
    .from('inventory_items') // ❌ Lit depuis inventory_items
    .select(...)
    .eq('company_id', company_id)
    .order('updated_at', { ascending: false });

  // Retourne les items depuis inventory_items UNIQUEMENT
}
```

#### 4. useInventory.ts (Lignes 142-183)
```typescript
const fetchItems = useCallback(async (filters?: InventoryItemFilters & { status?: string }) => {
  if (!currentCompany?.id) return;

  const response = await InventoryService.getInventoryItems(currentCompany.id, filters);
  // ❌ Ne voit QUE les items dans inventory_items
  setItems(filteredItems);
}, [currentCompany?.id]);
```

### Différences Entre les Tables

#### Table `articles`
```sql
CREATE TABLE articles (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL,
  reference text NOT NULL,
  name text NOT NULL,
  description text,
  category text,
  unit text,
  purchase_price numeric,
  selling_price numeric,
  tva_rate numeric,
  barcode text,
  supplier_id uuid,
  supplier_reference text,
  purchase_account_id uuid,
  sales_account_id uuid,
  warehouse_id uuid,
  stock_quantity numeric DEFAULT 0,
  stock_min numeric DEFAULT 0,
  stock_max numeric,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

#### Table `inventory_items`
```sql
CREATE TABLE inventory_items (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL,
  product_id uuid NOT NULL, -- ❌ Référence à products, pas articles
  product_variant_id uuid,
  warehouse_id uuid NOT NULL,
  location_id uuid,
  quantity_on_hand numeric NOT NULL DEFAULT 0,
  quantity_reserved numeric DEFAULT 0,
  quantity_available numeric GENERATED ALWAYS AS (quantity_on_hand - COALESCE(quantity_reserved, 0)) STORED,
  reorder_point numeric,
  reorder_quantity numeric,
  last_count_date date,
  last_received_date date,
  last_shipped_date date,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

**Différences clés** :
- `articles` : table **simple**, autonome, contient toutes les infos produit
- `inventory_items` : table **normalisée**, référence `products` (table séparée), focus sur le stock

---

## 🎯 Solutions Possibles

### Option 1 : Unifier vers `inventory_items` (✅ RECOMMANDÉ)

**Avantages** :
- ✅ Système plus moderne et complet
- ✅ Meilleure normalisation (séparation produits/stock)
- ✅ Supporte variantes, localisations, mouvements
- ✅ Plus évolutif

**Inconvénients** :
- ⚠️ Nécessite migration des données `articles` → `inventory_items` + `products`
- ⚠️ Modification de plusieurs services (facturation, etc.)

**Actions à faire** :
1. Modifier `NewArticleModal` pour utiliser `InventoryService.createInventoryItem()`
2. Adapter le mapping des données
3. Tester la création d'articles
4. Migrer les anciens articles si nécessaire

### Option 2 : Unifier vers `articles` (⚠️ PAS RECOMMANDÉ)

**Avantages** :
- ✅ Modification minimale
- ✅ Pas de migration complexe

**Inconvénients** :
- ❌ Perd les fonctionnalités avancées (inventory_items)
- ❌ Régression fonctionnelle
- ❌ Moins évolutif

### Option 3 : Synchroniser les Deux Tables (❌ NE PAS FAIRE)

**Avantages** :
- ✅ Compatibilité immédiate

**Inconvénients** :
- ❌ Double maintenance
- ❌ Risque de désynchronisation
- ❌ Complexité accrue
- ❌ Bugs potentiels

---

## 🔧 Solution Recommandée : Option 1

### Étape 1 : Adapter NewArticleModal pour inventory_items

**Fichier** : `src/components/inventory/NewArticleModal.tsx`

**Changement ligne 288** :
```typescript
// ❌ AVANT
const article = await articlesService.createArticle(currentCompany.id, articleInput);

// ✅ APRÈS
const article = await InventoryService.createInventoryItem(currentCompany.id, {
  productCode: articleInput.reference,
  productName: articleInput.name,
  description: articleInput.description,
  category: articleInput.category,
  unit: articleInput.unit,
  purchasePrice: articleInput.purchase_price,
  salePrice: articleInput.selling_price,
  taxRate: articleInput.tva_rate,
  warehouseId: articleInput.warehouse_id,
  initialQuantity: articleInput.stock_quantity,
  reorderPoint: articleInput.stock_min,
  reorderQuantity: articleInput.stock_max - articleInput.stock_min,
  supplierId: articleInput.supplier_id,
  supplierReference: articleInput.supplier_reference,
  barcode: articleInput.barcode,
  purchaseAccountId: articleInput.purchase_account_id,
  salesAccountId: articleInput.sales_account_id
});
```

### Étape 2 : Vérifier le mapping des champs

#### Mapping `articles` → `inventory_items` + `products`

| Champ `articles` | Destination | Nouveau champ |
|------------------|-------------|---------------|
| `reference` | `products.code` | `productCode` |
| `name` | `products.name` | `productName` |
| `description` | `products.description` | `description` |
| `category` | `products.category` | `category` |
| `unit` | `products.stock_unit` | `unit` |
| `purchase_price` | `products.purchase_price` | `purchasePrice` |
| `selling_price` | `products.sale_price` | `salePrice` |
| `tva_rate` | *pas stocké* | `taxRate` |
| `barcode` | `product_variants.barcode` | `barcode` |
| `warehouse_id` | `inventory_items.warehouse_id` | `warehouseId` |
| `stock_quantity` | `inventory_items.quantity_on_hand` | `initialQuantity` |
| `stock_min` | `inventory_items.reorder_point` | `reorderPoint` |
| `stock_max` | *calculé* | `reorderQuantity` |
| `supplier_id` | *pas stocké* | `supplierId` |
| `supplier_reference` | *pas stocké* | `supplierReference` |
| `purchase_account_id` | *pas stocké* | `purchaseAccountId` |
| `sales_account_id` | *pas stocké* | `salesAccountId` |

**Note** : Les champs `supplier_id`, `purchase_account_id`, `sales_account_id` ne sont pas directement dans `inventory_items`. Ils doivent être stockés ailleurs ou ajoutés à `products`.

### Étape 3 : Tester

1. Créer un article via `NewArticleModal`
2. Vérifier qu'il apparaît dans "Articles en stock"
3. Vérifier qu'il apparaît toujours dans les sélecteurs de factures
4. Vérifier les mouvements de stock

---

## 📝 Modifications à Faire

### Fichiers à Modifier

1. ✅ **NewArticleModal.tsx** (lignes 288-293)
   - Remplacer `articlesService.createArticle()` par `InventoryService.createInventoryItem()`
   - Adapter le mapping des données

2. ⚠️ **articlesService.ts** (vérifier les usages)
   - Vérifier où `articles` est encore utilisé
   - Migrer vers `inventory_items` si possible

3. ⚠️ **Sélecteurs de factures** (à vérifier)
   - S'assurer qu'ils peuvent lire depuis `inventory_items`
   - Adapter les requêtes si nécessaire

4. ⚠️ **Migration de données** (si articles existants)
   - Script de migration `articles` → `inventory_items` + `products`

---

## ⚠️ Points d'Attention

### 1. Compatibilité Ascendante

**Problème** : Des articles existent peut-être déjà dans `articles`.

**Solution** :
- Créer un script de migration
- Conserver `articles` en lecture seule temporairement
- Union des données dans les sélecteurs pendant la transition

### 2. Champs Manquants dans inventory_items

Certains champs de `articles` n'ont pas d'équivalent direct dans `inventory_items` :
- `supplier_id` → Ajouter à `products` ?
- `purchase_account_id` → Ajouter à `products` ?
- `sales_account_id` → Ajouter à `products` ?
- `tva_rate` → Ajouter à `products` ?

**Options** :
- Étendre la table `products`
- Créer une table de liaison `product_settings`
- Accepter la perte de ces métadonnées (⚠️ pas recommandé)

### 3. Performance

`InventoryService.createInventoryItem()` fait plus d'opérations :
- Upsert dans `products`
- Insert dans `inventory_items`
- Possibles variantes

Vérifier que cela reste performant.

---

## 🧪 Plan de Test

### Test 1 : Création Article
- [ ] Ouvrir NewArticleModal
- [ ] Remplir tous les champs
- [ ] Soumettre
- [ ] Vérifier dans Inventory > Articles en stock
- [ ] ✅ L'article apparaît immédiatement

### Test 2 : Sélecteur Factures
- [ ] Créer un nouvel article via NewArticleModal
- [ ] Ouvrir une facture
- [ ] Ajouter une ligne
- [ ] Chercher l'article dans le sélecteur
- [ ] ✅ L'article apparaît dans le sélecteur

### Test 3 : Mouvements Stock
- [ ] Créer un article
- [ ] Créer un mouvement d'entrée (+10)
- [ ] Vérifier dans Inventory > Mouvements
- [ ] ✅ Le mouvement apparaît
- [ ] ✅ Le stock est mis à jour

### Test 4 : Données Existantes
- [ ] Vérifier les anciens articles (si migration)
- [ ] ✅ Tous les anciens articles sont visibles
- [ ] ✅ Pas de perte de données

---

## 📊 Résumé

### Problème
❌ Deux systèmes d'inventaire → Les articles ne se voient pas entre eux

### Solution
✅ Unifier vers `inventory_items` + `products` (système moderne et complet)

### Impact
- ⚠️ Modification de NewArticleModal
- ⚠️ Adaptation du mapping des données
- ⚠️ Migration des données existantes (si nécessaire)
- ⚠️ Tests de non-régression

### Bénéfices
- ✅ Articles visibles dans Inventory
- ✅ Système unifié et cohérent
- ✅ Fonctionnalités avancées disponibles (variantes, localisations, etc.)
- ✅ Meilleure évolutivité

---

## 🔗 Références

- Table `articles` : Système simple historique
- Table `inventory_items` : Système moderne avec normalisation
- Service : `articlesService.ts` vs `inventoryService.ts`
- Composants : `NewArticleModal.tsx`, `ProductsTab.tsx`
- Hooks : `useInventory.ts`, `useInventoryPageController.ts`
