# Implémentation Chargement Données Formulaire Article

**Date**: 2025-01-09
**Fichiers Modifiés**:
- `src/components/inventory/NewArticleModal.tsx`
- `src/pages/InventoryPage.tsx`

**Status**: ✅ COMPLETE

---

## 🎯 Objectif

Modifier le composant `NewArticleModal` pour qu'il charge automatiquement les données nécessaires (warehouses, suppliers, comptes comptables) au lieu de les recevoir via props.

---

## 🔧 Modifications Appliquées

### 1. **Imports Ajoutés** ([NewArticleModal.tsx](src/components/inventory/NewArticleModal.tsx#L13-L30))

```typescript
import React, { useState, useEffect } from 'react';  // ✅ Ajout useEffect
import warehousesService, { type Warehouse } from '@/services/warehousesService';  // ✅ NOUVEAU
import { ChartOfAccountsService } from '@/services/chartOfAccountsService';  // ✅ NOUVEAU
import { logger } from '@/lib/logger';  // ✅ NOUVEAU
```

---

### 2. **Interface Props Simplifiée** ([NewArticleModal.tsx](src/components/inventory/NewArticleModal.tsx#L32-L36))

#### Avant ❌
```typescript
export interface NewArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (articleId: string) => void;
  suppliers?: Array<{ id: string; name: string }>;           // ❌ À supprimer
  warehouses?: Array<{ id: string; name: string }>;          // ❌ À supprimer
  chartOfAccounts?: Array<{ id: string; account_number: string; account_name: string }>;  // ❌ À supprimer
}
```

#### Après ✅
```typescript
export interface NewArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (articleId: string) => void;
  // Props supprimées - données chargées automatiquement
}

interface Account {
  id: string;
  account_number: string;
  account_name: string;
  account_type: string;
}
```

---

### 3. **State pour les Données Chargées** ([NewArticleModal.tsx](src/components/inventory/NewArticleModal.tsx#L122-L127))

```typescript
// State pour les données chargées
const [localSuppliers, setLocalSuppliers] = useState<Array<{ id: string; name: string }>>([]);
const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
const [purchaseAccounts, setPurchaseAccounts] = useState<Account[]>([]);
const [salesAccounts, setSalesAccounts] = useState<Account[]>([]);
const [dataLoading, setDataLoading] = useState(false);
```

---

### 4. **useEffect pour Charger les Données** ([NewArticleModal.tsx](src/components/inventory/NewArticleModal.tsx#L129-L186))

```typescript
// Charger les données quand le modal s'ouvre
useEffect(() => {
  async function loadFormData() {
    if (!isOpen || !currentCompany) return;

    setDataLoading(true);
    logger.debug('NewArticleModal', '📦 Chargement des données du formulaire...');

    try {
      const chartService = ChartOfAccountsService.getInstance();

      // ✅ Charger toutes les données en parallèle
      const [suppliersData, warehousesData, allAccounts] = await Promise.all([
        thirdPartiesService.getThirdParties(currentCompany.id, 'supplier'),
        warehousesService.getWarehouses(currentCompany.id),
        chartService.getAccounts(currentCompany.id, { isActive: true })
      ]);

      // Formater les fournisseurs
      const formattedSuppliers = suppliersData.map(s => ({
        id: s.id,
        name: s.name || s.display_name || s.legal_name || 'Sans nom'
      }));

      // ✅ Filtrer les comptes par type (classe 6 et 7)
      const purchase = allAccounts.filter(acc =>
        acc.account_number.startsWith('6') || // Classe 6 = Charges (achats)
        acc.account_type === 'expense'
      );
      const sales = allAccounts.filter(acc =>
        acc.account_number.startsWith('7') || // Classe 7 = Produits (ventes)
        acc.account_type === 'revenue'
      );

      setLocalSuppliers(formattedSuppliers);
      setWarehouses(warehousesData);
      setPurchaseAccounts(purchase);
      setSalesAccounts(sales);

      logger.info('NewArticleModal', '✅ Données chargées:', {
        suppliers: formattedSuppliers.length,
        warehouses: warehousesData.length,
        purchaseAccounts: purchase.length,
        salesAccounts: sales.length
      });
    } catch (err) {
      logger.error('NewArticleModal', '❌ Erreur chargement données:', err);
      showToast(
        t('inventory.articleModal.errorLoadingData', 'Erreur lors du chargement des données du formulaire'),
        'error'
      );
    } finally {
      setDataLoading(false);
    }
  }

  loadFormData();
}, [isOpen, currentCompany, t, showToast]);
```

**Bénéfices**:
- ✅ Chargement en parallèle avec `Promise.all` (performance optimale)
- ✅ Filtrage intelligent des comptes (classe 6 pour achats, classe 7 pour ventes)
- ✅ Logs détaillés pour debugging
- ✅ Gestion d'erreurs avec toast
- ✅ Se déclenche automatiquement à l'ouverture du modal

---

### 5. **Utilisation des Nouveaux États dans les Selects**

#### Comptes d'Achat ([NewArticleModal.tsx](src/components/inventory/NewArticleModal.tsx#L642-L654))

**Avant** ❌:
```typescript
<SelectContent>
  {chartOfAccounts.length > 0 ? (
    chartOfAccounts.filter(acc => acc.account_number.startsWith('6')).map(account => (
      <SelectItem key={account.id} value={account.id}>
        {account.account_number} - {account.account_name}
      </SelectItem>
    ))
  ) : (
    <SelectItem value="none" disabled>
      {t('inventory.articleModal.noAccount', 'Aucun compte disponible')}
    </SelectItem>
  )}
</SelectContent>
```

**Après** ✅:
```typescript
<SelectContent>
  {purchaseAccounts.length > 0 ? (
    purchaseAccounts.map(account => (
      <SelectItem key={account.id} value={account.id}>
        {account.account_number} - {account.account_name}
      </SelectItem>
    ))
  ) : (
    <SelectItem value="none" disabled>
      {t('inventory.articleModal.noAccount', 'Aucun compte disponible')}
    </SelectItem>
  )}
</SelectContent>
```

**Amélioration**: Pas besoin de filtrer au moment du rendu, déjà filtré dans le state

---

#### Comptes de Vente ([NewArticleModal.tsx](src/components/inventory/NewArticleModal.tsx#L666-L678))

**Avant** ❌:
```typescript
<SelectContent>
  {chartOfAccounts.length > 0 ? (
    chartOfAccounts.filter(acc => acc.account_number.startsWith('7')).map(account => (
      // ...
    ))
  ) : (
    // ...
  )}
</SelectContent>
```

**Après** ✅:
```typescript
<SelectContent>
  {salesAccounts.length > 0 ? (
    salesAccounts.map(account => (
      <SelectItem key={account.id} value={account.id}>
        {account.account_number} - {account.account_name}
      </SelectItem>
    ))
  ) : (
    <SelectItem value="none" disabled>
      {t('inventory.articleModal.noAccount', 'Aucun compte disponible')}
    </SelectItem>
  )}
</SelectContent>
```

---

### 6. **Indicateur de Chargement** ([NewArticleModal.tsx](src/components/inventory/NewArticleModal.tsx#L690-L698))

**Avant** ❌:
```typescript
<DialogFooter>
  <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
    {t('common.cancel', 'Annuler')}
  </Button>
  <Button type="submit" disabled={loading}>
    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
    {t('inventory.articleModal.create', 'Créer l\'article')}
  </Button>
</DialogFooter>
```

**Après** ✅:
```typescript
<DialogFooter>
  <Button type="button" variant="outline" onClick={onClose} disabled={loading || dataLoading}>
    {t('common.cancel', 'Annuler')}
  </Button>
  <Button type="submit" disabled={loading || dataLoading}>
    {(loading || dataLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
    {dataLoading ? t('common.loading', 'Chargement...') : t('inventory.articleModal.create', 'Créer l\'article')}
  </Button>
</DialogFooter>
```

**Amélioration**: Désactive le formulaire pendant le chargement des données ET pendant la soumission

---

### 7. **Rechargement des Fournisseurs Amélioré** ([NewArticleModal.tsx](src/components/inventory/NewArticleModal.tsx#L201-L226))

**Avant** ❌:
```typescript
const handleSupplierCreated = async () => {
  if (!currentCompany) return;

  const updatedSuppliers = await thirdPartiesService.getThirdParties(currentCompany.id, 'supplier');
  setLocalSuppliers(updatedSuppliers.map(s => ({ id: s.id, name: s.name || ... })));
  setShowNewSupplierForm(false);
  showToast("Le fournisseur a été ajouté avec succès", 'success');
};
```

**Après** ✅:
```typescript
const handleSupplierCreated = async () => {
  if (!currentCompany) return;

  try {
    const updatedSuppliers = await thirdPartiesService.getThirdParties(currentCompany.id, 'supplier');
    const formattedSuppliers = updatedSuppliers.map(s => ({
      id: s.id,
      name: s.name || s.display_name || s.legal_name || 'Sans nom'
    }));
    setLocalSuppliers(formattedSuppliers);

    logger.info('NewArticleModal', '✅ Fournisseurs rechargés:', formattedSuppliers.length);
    setShowNewSupplierForm(false);

    showToast(
      t('inventory.articleModal.supplierCreatedSuccess', "Le fournisseur a été ajouté avec succès"),
      'success'
    );
  } catch (err) {
    logger.error('NewArticleModal', '❌ Erreur rechargement fournisseurs:', err);
  }
};
```

**Amélioration**: Ajout de try-catch, logs, et traduction

---

### 8. **InventoryPage Simplifié** ([InventoryPage.tsx](src/pages/InventoryPage.tsx#L89-L101))

**Avant** ❌:
```typescript
<NewArticleModal
  isOpen={newArticleModalOpen}
  onClose={() => {
    console.log('🔒 Closing NewArticleModal');
    setNewArticleModalOpen(false);
  }}
  onSuccess={(articleId) => {
    console.log('✅ Article created successfully, ID:', articleId);
    setNewArticleModalOpen(false);
    window.location.reload();
  }}
  suppliers={[]}           // ❌ Props vides
  warehouses={[]}          // ❌ Props vides
  chartOfAccounts={[]}     // ❌ Props vides
/>
```

**Après** ✅:
```typescript
<NewArticleModal
  isOpen={newArticleModalOpen}
  onClose={() => {
    console.log('🔒 Closing NewArticleModal');
    setNewArticleModalOpen(false);
  }}
  onSuccess={(articleId) => {
    console.log('✅ Article created successfully, ID:', articleId);
    setNewArticleModalOpen(false);
    window.location.reload(); // TODO: Refresh articles list
  }}
  // ✅ Plus de props - données chargées automatiquement
/>
```

**Amélioration**: Interface plus propre, moins de coupling entre composants

---

## 📊 Flux de Données

### Avant ❌
```
InventoryPage
  └─ Props vides: suppliers=[], warehouses=[], chartOfAccounts=[]
      └─ NewArticleModal
          └─ Affiche "Aucun entrepôt disponible"
          └─ Affiche "Aucun compte disponible"
          └─ ❌ Impossible de créer un article
```

### Après ✅
```
InventoryPage
  └─ NewArticleModal (isOpen=true)
      └─ useEffect déclenché
          ├─ Promise.all([
          │   thirdPartiesService.getThirdParties(),      // Fournisseurs
          │   warehousesService.getWarehouses(),          // Entrepôts
          │   chartService.getAccounts()                  // Comptes
          │ ])
          ├─ Filtrage comptes (classe 6 et 7)
          └─ setState pour chaque type de donnée
      └─ Formulaire affiche les données
      └─ ✅ Création d'article possible
```

---

## 🧪 Tests à Effectuer

### Test 1: Ouverture du Modal et Chargement
- [ ] Ouvrir le modal de création d'article
- [ ] Observer les logs dans la console:
  ```
  📦 Chargement des données du formulaire...
  ✅ Données chargées: { suppliers: X, warehouses: Y, purchaseAccounts: Z, salesAccounts: W }
  ```
- [ ] Vérifier que le bouton affiche "Chargement..." pendant le chargement
- [ ] Vérifier que le bouton devient "Créer l'article" après le chargement

### Test 2: Vérifier les Entrepôts
- [ ] Ouvrir le select "Entrepôt"
- [ ] Vérifier que les entrepôts sont listés
- [ ] Si aucun entrepôt: affiche "Aucun entrepôt disponible"

### Test 3: Vérifier les Comptes Comptables
- [ ] Section "Comptabilité"
- [ ] Ouvrir le select "Compte d'achat"
- [ ] Vérifier que les comptes commençant par "6" sont listés
- [ ] Ouvrir le select "Compte de vente"
- [ ] Vérifier que les comptes commençant par "7" sont listés

### Test 4: Vérifier les Fournisseurs
- [ ] Ouvrir le select "Fournisseur"
- [ ] Vérifier que les fournisseurs sont listés
- [ ] Cliquer sur "Créer un nouveau fournisseur"
- [ ] Créer un fournisseur
- [ ] Vérifier qu'il apparaît immédiatement dans la liste

### Test 5: Créer un Article Complet
- [ ] Remplir tous les champs:
  - Référence: TEST-001
  - Nom: Article de Test
  - Entrepôt: Sélectionner un entrepôt
  - Compte d'achat: Sélectionner un compte (6...)
  - Compte de vente: Sélectionner un compte (7...)
- [ ] Cliquer sur "Créer l'article"
- [ ] Observer les logs de soumission
- [ ] Vérifier que l'article est créé avec succès

### Test 6: Gestion d'Erreur de Chargement
- [ ] Simuler une erreur réseau (DevTools → Network → Offline)
- [ ] Ouvrir le modal
- [ ] Vérifier qu'un toast d'erreur s'affiche
- [ ] Vérifier le log: `❌ Erreur chargement données:`

---

## 🎯 Impact

### Avant ❌
- ❌ Données passées en props (vides)
- ❌ Impossible de sélectionner warehouses ou comptes
- ❌ Coupling fort entre InventoryPage et NewArticleModal
- ❌ Pas de logs de debugging
- ❌ Pas d'indicateur de chargement
- ❌ Filtrage des comptes fait au moment du rendu

### Après ✅
- ✅ Données chargées automatiquement à l'ouverture du modal
- ✅ Chargement parallèle avec `Promise.all` (performance)
- ✅ Filtrage intelligent des comptes (classe 6 et 7)
- ✅ Interface props simplifiée (moins de coupling)
- ✅ Logs détaillés à chaque étape
- ✅ Indicateur de chargement pendant le fetch
- ✅ Gestion d'erreurs avec toast et logs
- ✅ Rechargement automatique des fournisseurs après création

---

## 📝 Logs Console Attendus

### Lors de l'ouverture du modal:
```
[DEBUG] NewArticleModal: 📦 Chargement des données du formulaire...
[INFO] NewArticleModal: ✅ Données chargées: {
  suppliers: 5,
  warehouses: 2,
  purchaseAccounts: 12,
  salesAccounts: 8
}
```

### Lors de la création d'un fournisseur:
```
[INFO] NewArticleModal: ✅ Fournisseurs rechargés: 6
```

### En cas d'erreur:
```
[ERROR] NewArticleModal: ❌ Erreur chargement données: Error: Network error
```

---

## ⚠️ Actions Requises Avant Utilisation

### 1. Appliquer la Migration RLS Warehouses (URGENT)

**Fichier**: [supabase/migrations/20250109000000_add_warehouses_rls_policies.sql](supabase/migrations/20250109000000_add_warehouses_rls_policies.sql)

```bash
cd c:\Users\noutc\Casskai
supabase db push
```

Ou via Supabase Studio SQL Editor.

**Sans cette migration**, les warehouses ne pourront pas être créés/modifiés.

---

### 2. Vérifier qu'il y a des Données de Test

#### Créer un Entrepôt de Test (via SQL si nécessaire)

```sql
-- Remplacer <COMPANY_ID> par l'ID de votre entreprise
INSERT INTO warehouses (company_id, code, name, is_active, is_default)
VALUES ('<COMPANY_ID>', 'EP001', 'Entrepôt Principal', true, true);
```

#### Créer des Comptes Comptables de Test (si nécessaire)

```sql
-- Compte d'achat (classe 6)
INSERT INTO chart_of_accounts (company_id, account_number, account_name, account_type, is_active)
VALUES ('<COMPANY_ID>', '607000', 'Achats de marchandises', 'expense', true);

-- Compte de vente (classe 7)
INSERT INTO chart_of_accounts (company_id, account_number, account_name, account_type, is_active)
VALUES ('<COMPANY_ID>', '707000', 'Ventes de marchandises', 'revenue', true);
```

---

## 🔄 Améliorations Futures Possibles

### 1. Cache des Données
```typescript
// Éviter de recharger à chaque ouverture
const [dataCache, setDataCache] = useState<{
  suppliers: Supplier[],
  warehouses: Warehouse[],
  // ...
} | null>(null);

useEffect(() => {
  if (dataCache) {
    // Utiliser le cache
    setLocalSuppliers(dataCache.suppliers);
    // ...
    return;
  }
  // Sinon charger
  loadFormData();
}, [isOpen, dataCache]);
```

### 2. Skeleton Loader
Afficher des placeholders pendant le chargement au lieu de désactiver le formulaire:
```typescript
{dataLoading ? (
  <Skeleton className="h-10 w-full" />
) : (
  <Select>...</Select>
)}
```

### 3. React Query pour le Cache
```typescript
const { data: warehouses, isLoading } = useQuery(
  ['warehouses', currentCompany?.id],
  () => warehousesService.getWarehouses(currentCompany!.id),
  { enabled: !!currentCompany }
);
```

---

## 📚 Documents Connexes

- [FIX_WAREHOUSE_AND_ACCOUNTS_SELECTION.md](FIX_WAREHOUSE_AND_ACCOUNTS_SELECTION.md) - Migration RLS et services
- [FIX_NEW_ARTICLE_BUTTON.md](FIX_NEW_ARTICLE_BUTTON.md) - Connexion du bouton
- [TRANSLATIONS_ARTICLE_FORM_COMPLETE.md](TRANSLATIONS_ARTICLE_FORM_COMPLETE.md) - Traductions
- [DEBUG_ARTICLE_FORM_LOGS.md](DEBUG_ARTICLE_FORM_LOGS.md) - Logs de diagnostic

---

**Status**: ✅ **Chargement automatique des données implémenté avec succès**

**Prochaine Étape**: Appliquer la migration RLS puis tester la création d'un article complet avec tous les champs.
