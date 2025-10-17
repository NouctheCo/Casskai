# ❌ Corrections Restantes - À faire par le dev

## Problèmes critiques identifiés dans `OptimizedInvoicesTab.tsx`

### 1. ❌ **Ligne 808** : Propriétés inexistantes `item.reference` et `item.selling_price`

**Fichier**: `src/components/invoicing/OptimizedInvoicesTab.tsx:808`

```typescript
// ❌ ERREUR - Ces propriétés n'existent pas dans InventoryItem
sublabel: `${item.reference} - ${item.selling_price.toFixed(2)}€ HT`,
```

**Correction à appliquer**:
```typescript
// ✅ CORRECT - Utiliser code et sale_price
sublabel: `${item.code} - ${item.sale_price.toFixed(2)}€ HT (TVA ${item.sale_tax_rate}%)`,
```

---

### 2. ❌ **Lignes 813-829** : Handler utilise les mauvaises propriétés

**Fichier**: `src/components/invoicing/OptimizedInvoicesTab.tsx:813-829`

```typescript
// ❌ ERREUR - selectedItem.selling_price n'existe pas
const handleSelectInventoryItem = (index: number, itemId: string) => {
  const selectedItem = inventoryItems.find(item => item.id === itemId);
  if (!selectedItem) return;

  setFormData(prev => {
    const newItems = [...prev.items];
    newItems[index] = {
      ...newItems[index],
      inventoryItemId: selectedItem.id,
      description: selectedItem.name,
      unitPrice: selectedItem.selling_price,  // ❌ N'EXISTE PAS
      taxRate: companySettings?.accounting?.defaultVatRate || 20,  // ❌ MAUVAIS - doit utiliser la TVA de l'article
      total: newItems[index].quantity * selectedItem.selling_price * (1 + (companySettings?.accounting?.defaultVatRate || 20) / 100)
    };
    return { ...prev, items: newItems };
  });
};
```

**Correction complète à appliquer**:
```typescript
// ✅ CORRECT
const handleSelectInventoryItem = (index: number, itemId: string) => {
  const selectedItem = inventoryItems.find(item => item.id === itemId);
  if (!selectedItem) return;

  setFormData(prev => {
    const newItems = [...prev.items];
    const quantity = newItems[index].quantity || 1;
    const unitPrice = selectedItem.sale_price;  // ✅ Bon champ
    const taxRate = selectedItem.sale_tax_rate;  // ✅ TVA de l'article
    const totalHT = quantity * unitPrice;
    const totalTTC = totalHT * (1 + taxRate / 100);

    newItems[index] = {
      ...newItems[index],
      inventoryItemId: selectedItem.id,
      description: selectedItem.name,
      unitPrice: unitPrice,
      taxRate: taxRate,
      total: totalTTC
    };
    return { ...prev, items: newItems };
  });
};
```

---

### 3. ⚠️ **Ligne 843** : Handler de création utilise `selling_price` au lieu de mapper vers le service

**Fichier**: `src/components/invoicing/OptimizedInvoicesTab.tsx:837-847`

```typescript
// ⚠️ ATTENTION - selling_price est correct ici car c'est le nom du champ dans le formulaire
const result = await inventoryItemsService.createItem(currentCompany.id, {
  reference: data.reference,
  name: data.name,
  category: data.category || 'Autre',
  unit: data.unit || 'Pièce',
  purchase_price: data.purchase_price || 0,
  selling_price: data.selling_price,  // ✅ OK - c'est le payload
  current_stock: data.current_stock || 0,
  min_stock: data.min_stock || 0,
  max_stock: data.max_stock || 100
});
```

**MAIS il manque le champ TVA !**

**Correction à appliquer**:
```typescript
const result = await inventoryItemsService.createItem(currentCompany.id, {
  reference: data.reference,
  name: data.name,
  category: data.category || 'Autre',
  unit: data.unit || 'Pièce',
  purchase_price: data.purchase_price || 0,
  selling_price: data.selling_price,
  current_stock: data.current_stock || 0,
  min_stock: data.min_stock || 0,
  max_stock: data.max_stock || 100,
  sale_tax_rate: data.sale_tax_rate || companySettings?.accounting?.defaultVatRate || 20  // ✅ Ajouter TVA
});
```

---

### 4. ❌ **Ligne 464** : Formulaire de création manque le champ TVA

**Fichier**: `src/components/invoicing/OptimizedInvoicesTab.tsx` lignes 415-470

Le formulaire `createFormFields` dans EntitySelector n'a PAS de champ pour la TVA !

**Correction à appliquer** - Ajouter AVANT la ligne 470 :
```typescript
{
  name: 'sale_tax_rate',
  label: 'Taux de TVA (%)',
  type: 'select',
  required: false,
  options: [
    { value: '0', label: '0% - Exonéré' },
    { value: '5.5', label: '5.5% - Taux réduit' },
    { value: '10', label: '10% - Taux intermédiaire' },
    { value: '20', label: '20% - Taux normal' }
  ],
  defaultValue: '20'
},
```

---

### 5. ⚠️ **Titres de colonnes manquants** dans le formulaire

**Fichier**: `src/components/invoicing/OptimizedInvoicesTab.tsx` ligne 401-403

Il n'y a PAS de titres au-dessus des colonnes (Article, Quantité, Prix HT, TVA, Total, Actions).

**Correction à appliquer** - Ajouter AVANT la ligne 402 :
```typescript
<CardContent>
  {/* Titres de colonnes */}
  <div className="grid grid-cols-12 gap-4 px-4 pb-2 text-sm font-medium text-gray-500">
    <div className="col-span-4">Article / Désignation</div>
    <div className="col-span-2">Quantité</div>
    <div className="col-span-2">Prix HT (€)</div>
    <div className="col-span-2">TVA</div>
    <div className="col-span-1">Total TTC</div>
    <div className="col-span-1">Actions</div>
  </div>

  <div className="space-y-4">
    {formData.items.map((item, index) => (
      // ... reste du code
```

---

## Résumé des corrections à effectuer

### Fichier: `src/components/invoicing/OptimizedInvoicesTab.tsx`

| Ligne | Problème | Correction |
|-------|----------|------------|
| **808** | `item.reference` → doit être `item.code` | Remplacer par `code` |
| **808** | `item.selling_price` → doit être `item.sale_price` | Remplacer par `sale_price` |
| **808** | Manque indication TVA dans sublabel | Ajouter `(TVA ${item.sale_tax_rate}%)` |
| **823** | `selectedItem.selling_price` → `selectedItem.sale_price` | Remplacer |
| **824** | Utilise TVA par défaut au lieu de TVA article | Utiliser `selectedItem.sale_tax_rate` |
| **825** | Même erreur dans calcul | Utiliser TVA de l'article |
| **~843** | Manque `sale_tax_rate` dans payload createItem | Ajouter le champ |
| **~465** | Formulaire création article manque champ TVA | Ajouter champ select TVA |
| **~401** | Pas de titres de colonnes | Ajouter div avec titres |

---

## Pourquoi ces erreurs ?

L'interface `InventoryItem` dans `inventoryItemsService.ts` utilise les vrais noms de colonnes de la table `products` :
- ✅ `code` (pas `reference`)
- ✅ `sale_price` (pas `selling_price`)
- ✅ `sale_tax_rate` (TVA de l'article)

Mais le formulaire utilise encore les anciens noms conceptuels (`reference`, `selling_price`).

---

## Test après corrections

1. **Créer un article** via EntitySelector :
   - ✅ Remplir référence, nom, prix HT, **TVA**
   - ✅ Vérifier qu'il est sauvé dans `products`

2. **Sélectionner un article existant** :
   - ✅ Vérifier que prix HT est pré-rempli
   - ✅ Vérifier que **TVA de l'article** est appliquée (pas la TVA par défaut)
   - ✅ Vérifier le calcul TTC automatique

3. **Voir les titres de colonnes** :
   - ✅ Vérifier qu'on voit bien : Article | Quantité | Prix HT | TVA | Total TTC | Actions

---

## Commande pour build après corrections

```bash
npm run build
```

Si le build réussit, déployer :
```bash
powershell -ExecutionPolicy Bypass -File deploy-vps.ps1 -SkipBuild
```
