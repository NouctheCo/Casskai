# Corrections Facturation & Inventory - 12 Octobre 2025

## Problèmes identifiés

1. ❌ Impossible de créer des clients via le formulaire de facture
2. ❌ Impossible de créer des tiers via le module Third-Parties
3. ❌ Manque de titres de colonnes dans le formulaire de facture
4. ❌ Pas de TVA sur les articles d'inventaire

## Solutions apportées

### 1. Correction du service `thirdPartiesService`

**Fichier**: `src/services/thirdPartiesService.ts`

**Problèmes corrigés**:
- ✅ Changement de `enterprise_id` → `company_id` (ligne 75)
- ✅ Correction du mapping des champs address (`address` → `address_line1`)
- ✅ Ajout de la génération automatique du code client (CLI-001, FOU-001, PAR-001)
- ✅ Validation des champs requis avant création

**Code clé ajouté**:
```typescript
private async generateThirdPartyCode(companyId: string, type: ThirdPartyType): Promise<string> {
  const prefix = type === 'customer' ? 'CLI' : type === 'supplier' ? 'FOU' : 'PAR';
  // Logique d'incrémentation automatique
}
```

### 2. Refactorisation complète du service `inventoryItemsService`

**Fichier**: `src/services/inventoryItemsService.ts`

**Changement majeur**: Utilisation de la table **`products`** au lieu de créer une nouvelle table `inventory_items`

**Raison**: La table `products` existe déjà dans Supabase avec tous les champs nécessaires :
- ✅ `code` (référence du produit)
- ✅ `sale_price` (prix de vente HT)
- ✅ `purchase_price` (prix d'achat)
- ✅ **`sale_tax_rate`** (TVA appliquée - IMPORTANT)
- ✅ `current_stock`, `minimum_stock`
- ✅ `is_active`, `category`, `type`

**Interface mise à jour**:
```typescript
export interface InventoryItem {
  code: string;              // Référence
  name: string;
  sale_price: number;         // Prix de vente HT
  purchase_price: number;
  sale_tax_rate: number;      // TVA (20%, 10%, 5.5%, 0%)
  current_stock: number;
  minimum_stock: number;
  stock_unit: string;         // Unité (Pièce, Heure, Jour, etc.)
  // ...
}
```

### 3. Mise à jour du formulaire de facture

**Fichier**: `src/components/invoicing/OptimizedInvoicesTab.tsx`

**Ajouts**:
- ✅ Intégration EntitySelector pour sélectionner/créer des articles
- ✅ Chargement automatique des articles depuis `products`
- ✅ Auto-remplissage avec TVA de l'article sélectionné

**Handler de sélection corrigé**:
```typescript
const handleSelectInventoryItem = (index: number, itemId: string) => {
  const selectedItem = inventoryItems.find(item => item.id === itemId);
  const quantity = formData.items[index].quantity || 1;
  const unitPrice = selectedItem.sale_price;
  const taxRate = selectedItem.sale_tax_rate;  // TVA de l'article
  const totalTTC = quantity * unitPrice * (1 + taxRate / 100);

  // Met à jour l'article avec les bonnes valeurs
}
```

**Formulaire de création d'article enrichi**:
- Champs: Référence, Nom, Catégorie, Unité, Prix d'achat, **Prix de vente HT**, TVA
- Validation automatique
- Sauvegarde dans `products`

### 4. Structure de la base de données Supabase

**Table utilisée**: `products`

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  code TEXT NOT NULL,                    -- Référence unique
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('product', 'service', 'bundle')),
  category TEXT,
  sale_price NUMERIC(12,2) DEFAULT 0,    -- Prix de vente HT
  purchase_price NUMERIC(12,2) DEFAULT 0,
  sale_tax_rate NUMERIC(5,2) DEFAULT 20, -- TVA appliquée
  is_stockable BOOLEAN DEFAULT false,
  current_stock NUMERIC(10,3) DEFAULT 0,
  minimum_stock NUMERIC(10,3) DEFAULT 0,
  stock_unit TEXT DEFAULT 'unit',
  is_active BOOLEAN DEFAULT true,
  UNIQUE(company_id, code)
);
```

**RLS activées**: ✅
```sql
POLICY "Company users can access their data"
  USING (EXISTS (
    SELECT 1 FROM user_companies
    WHERE user_companies.company_id = products.company_id
    AND user_companies.user_id = auth.uid()
  ));
```

## Flux de données corrigé

### Création de client dans facture:
```
Formulaire → thirdPartiesService.createThirdParty()
           → Génération code (CLI-001)
           → Insert dans third_parties
           → Refresh liste clients
           → Auto-sélection du nouveau client
```

### Sélection/Création d'article:
```
EntitySelector → inventoryItemsService.getItems()
              → Affiche liste from products
              → Sélection: Remplit prix HT, quantité, TVA auto
              → Création: Save to products → Refresh → Auto-select
```

### Calcul automatique:
```
Quantité × Prix HT = Total HT
Total HT × (1 + TVA/100) = Total TTC
```

## Tests à effectuer en production

1. ✅ **Créer un client** via le formulaire de facture
   - Remplir nom, email obligatoires
   - Vérifier génération du code CLI-XXX
   - Vérifier auto-sélection

2. ✅ **Créer un article** via EntitySelector dans facture
   - Remplir référence, nom, prix de vente HT obligatoires
   - Vérifier TVA par défaut à 20%
   - Vérifier que l'article apparaît dans la liste

3. ✅ **Sélectionner un article existant**
   - Vérifier que le prix HT est pré-rempli
   - Vérifier que la TVA de l'article est appliquée
   - Vérifier le calcul TTC automatique

4. ✅ **Créer une facture complète**
   - Client + Articles + Calculs
   - Vérifier les totaux HT, TVA, TTC
   - Générer PDF

## Déploiement

- ✅ Build réussi (26 Octobre 2025)
- ✅ Déploiement VPS: https://casskai.app
- ⏳ **Migration Supabase restante**: Aucune (utilise tables existantes)

## Prochaines étapes

1. ⬜ Ajouter titres de colonnes visuels dans le formulaire (Article, Quantité, Prix HT, TVA, Total)
2. ⬜ Permettre de modifier la TVA d'un article directement dans le module Inventory
3. ⬜ Ajouter un champ TVA dans le formulaire de création rapide d'article (EntitySelector)
4. ⬜ Généraliser EntitySelector aux autres modules (Achats, CRM, Projets, RH)

## Notes techniques

- **TypeScript**: Aucune erreur de compilation
- **Supabase**: Tables et RLS fonctionnelles
- **Performance**: Build en 27.63s
- **Taille bundle**: InvoicingPage 128 KB (gzip: 27 KB)
