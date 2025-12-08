# 🔍 Audit complet : Select basiques à remplacer

**Date** : 2025-12-04
**Objectif** : Identifier tous les Select qui chargent des données sans composant réutilisable

---

## ✅ Modules corrigés

### 1. Facturation - Clients ✅
**Fichier** : `src/components/invoicing/OptimizedInvoicesTab.tsx`
- **Status** : ✅ CORRIGÉ - Utilise `ClientSelector`
- **Déployé** : ✅ OUI

### 2. Achats - Fournisseurs (Composant créé)
**Fichier** : `src/components/purchases/SupplierSelector.tsx`
- **Status** : ✅ COMPOSANT CRÉÉ
- **Déployé** : ✅ OUI
- **Note** : Prêt à l'emploi mais pas encore intégré dans PurchaseForm

---

## ⚠️ Bugs identifiés à corriger

### 🔴 PRIORITÉ HAUTE

#### 1. PurchaseForm.tsx - Fournisseurs
**Fichier** : `src/components/purchases/PurchaseForm.tsx`
**Lignes** : 233-269

**Problème** :
- Utilise encore un `<Select>` basique (lignes 251-265)
- Dépend de la prop `suppliers: Supplier[]` (ligne 20)
- Import `SupplierSelector` ajouté mais pas utilisé (ligne 13)
- Code legacy présent : `isSupplierModalOpen`, `handleSupplierCreated`, `<NewSupplierModal>`

**Solution** :
```tsx
// REMPLACER lignes 233-269 par :
<div className="space-y-2">
  <SupplierSelector
    value={formData.supplier_id}
    onChange={(supplierId) => handleInputChange('supplier_id', supplierId)}
    label={t('purchases.form.supplier')}
    placeholder={t('purchases.form.selectSupplier')}
    required={true}
  />
  {errors.supplier_id && (
    <p className="text-sm text-red-600 dark:text-red-400">{errors.supplier_id}</p>
  )}
</div>
```

**Code à supprimer** :
```tsx
// Ligne 20 : supprimer de l'interface
suppliers: Supplier[];
onSupplierCreated?: () => void;

// Ligne 30-32 : supprimer des props
suppliers,
onSupplierCreated

// Ligne 47 : supprimer l'état
const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

// Lignes 179-187 : supprimer la fonction
const handleSupplierCreated = (supplierId: string) => { ... };

// Lignes 458-462 : supprimer le composant
<NewSupplierModal
  isOpen={isSupplierModalOpen}
  onClose={() => setIsSupplierModalOpen(false)}
  onSuccess={handleSupplierCreated}
/>

// Ligne 2 : supprimer de l'import
import { PurchaseFormData, Purchase } from '../../types/purchase.types';
// (enlever Supplier)
```

**Impact** : Module Achats - bug identique au bug facturation

---

#### 2. NewActionModal.tsx - Clients (CRM)
**Fichier** : `src/components/crm/NewActionModal.tsx`
**Lignes** : 95-100, 112-130, 320-324

**Problème** :
- Charge les clients **conditionnellement** : `useEffect(() => { if (open && currentCompany?.id) { loadClients(); } }, [open, ...])`
- Liste vide au premier rendu si le modal s'ouvre rapidement
- Pattern identique au bug facturation

**Code actuel** :
```tsx
// Lignes 95-100
useEffect(() => {
  if (open && currentCompany?.id) {
    loadClients();
    loadOpportunities();
  }
}, [open, currentCompany?.id]);

// Lignes 320-324
{clients.map((client) => (
  <SelectItem key={client.id} value={client.id}>
    {client.name}
  </SelectItem>
))}
```

**Solution** : Utiliser `ClientSelector` ou déplacer le chargement hors du `if (open)`

**Option A** : Utiliser ClientSelector (recommandé)
```tsx
<ClientSelector
  value={formData.third_party_id}
  onChange={(clientId) => setFormData(prev => ({ ...prev, third_party_id: clientId }))}
  label={t('crm.action.client')}
  placeholder={t('crm.action.placeholders.selectClient')}
  required={false}
/>
```

**Option B** : Charger immédiatement
```tsx
// Remplacer lignes 95-100 par :
useEffect(() => {
  if (currentCompany?.id) {
    loadClients();
    loadOpportunities();
  }
}, [currentCompany?.id]);
// Enlever la condition "open"
```

**Impact** : Module CRM - Actions commerciales

---

#### 3. NewOpportunityModal.tsx - Clients (CRM)
**Fichier** : `src/components/crm/NewOpportunityModal.tsx`

**Problème** : Probablement identique à `NewActionModal.tsx` (chargement conditionnel)

**À vérifier** :
- Pattern `useEffect(() => { if (open) { loadClients(); } }, [open])`
- Utilisation de `clients.map()` dans un Select

**Solution** : Même approche que NewActionModal

**Impact** : Module CRM - Opportunités

---

### 🟡 PRIORITÉ MOYENNE

#### 4. NewArticleModal.tsx - Fournisseurs et Entrepôts (Inventaire)
**Fichier** : `src/components/inventory/NewArticleModal.tsx`
**Lignes** : 100-107, 456-473

**Problème** :
- Reçoit `suppliers` et `warehouses` en **props**
- Ne charge pas les données lui-même
- Dépend du composant parent pour le chargement

**Code actuel** :
```tsx
// Props
suppliers?: Array<{ id: string; name: string }>;
warehouses?: Array<{ id: string; name: string }>;

// Utilisation lignes 456-473
<Select value={formData.supplier_id} onValueChange={...}>
  <SelectContent>
    {suppliers.length > 0 ? (
      suppliers.map(supplier => (
        <SelectItem key={supplier.id} value={supplier.id}>
          {supplier.name}
        </SelectItem>
      ))
    ) : (
      <SelectItem value="none" disabled>
        {t('inventory.articleModal.noSupplier', 'Aucun fournisseur disponible')}
      </SelectItem>
    )}
  </SelectContent>
</Select>
```

**Solution** : Utiliser `SupplierSelector`
```tsx
<SupplierSelector
  value={formData.supplier_id}
  onChange={(supplierId) => handleInputChange('supplier_id', supplierId)}
  label={t('inventory.articleModal.supplier')}
  placeholder={t('inventory.articleModal.supplierPlaceholder')}
  required={false}
/>
```

**Pour les entrepôts** : Créer `WarehouseSelector` (pattern identique)

**Impact** : Module Inventaire - Création d'articles

---

#### 5. ContractForm.tsx - Clients
**Fichier** : `src/components/contracts/ContractForm.tsx`
**Ligne** : ~405-415

**Problème** : Probablement dépend de props `clients` chargées par le parent

**Solution** : Utiliser `ClientSelector`

**Impact** : Module Contrats

---

### 🟢 PRIORITÉ BASSE (Filtres, non bloquant)

#### 6. PurchasesFilters.tsx
**Fichier** : `src/components/purchases/PurchasesFilters.tsx`

**Note** : Filtres de recherche, pas de création de données
**Impact** : Faible - les filtres peuvent être chargés après le rendu initial

---

#### 7. SuppliersTab.tsx
**Fichier** : `src/components/inventory/SuppliersTab.tsx`

**Note** : Probablement liste des fournisseurs, pas un Select
**Impact** : À vérifier si nécessaire

---

## 📊 Résumé par priorité

### 🔴 Haute priorité (3 fichiers)
1. ✅ `OptimizedInvoicesTab.tsx` - CORRIGÉ
2. ❌ `PurchaseForm.tsx` - À CORRIGER
3. ❌ `NewActionModal.tsx` - À CORRIGER
4. ❌ `NewOpportunityModal.tsx` - À VÉRIFIER + CORRIGER

### 🟡 Moyenne priorité (2 fichiers)
5. `NewArticleModal.tsx` - Inventaire
6. `ContractForm.tsx` - Contrats

### 🟢 Basse priorité (2 fichiers)
7. `PurchasesFilters.tsx` - Filtres
8. `SuppliersTab.tsx` - Liste

---

## 🎯 Plan de correction

### Phase 1 : Achats (15 min) - URGENT
- [x] Créer `SupplierSelector` ✅
- [ ] Intégrer `SupplierSelector` dans `PurchaseForm.tsx`
- [ ] Supprimer code legacy de `PurchaseForm.tsx`
- [ ] Déployer

**Résultat** : Bug achats identique au bug facturation sera corrigé

### Phase 2 : CRM (30 min) - HAUTE PRIORITÉ
- [ ] Option A : Utiliser `ClientSelector` dans `NewActionModal.tsx`
- [ ] Option B : Déplacer chargement hors du `if (open)`
- [ ] Répliquer pour `NewOpportunityModal.tsx`
- [ ] Tester module CRM
- [ ] Déployer

**Résultat** : Actions et opportunités CRM auront les clients pré-chargés

### Phase 3 : Inventaire (45 min) - MOYENNE PRIORITÉ
- [ ] Intégrer `SupplierSelector` dans `NewArticleModal.tsx`
- [ ] Créer `WarehouseSelector` (pattern identique)
- [ ] Intégrer `WarehouseSelector` dans `NewArticleModal.tsx`
- [ ] Tester module Inventaire
- [ ] Déployer

**Résultat** : Création d'articles avec chargement automatique

### Phase 4 : Contrats (15 min) - BASSE PRIORITÉ
- [ ] Vérifier et corriger `ContractForm.tsx`
- [ ] Déployer

---

## ✅ Checklist de validation

Une fois toutes les corrections appliquées :

### Tests manuels par module :

**Achats** :
- [ ] Ouvrir "Nouvel achat"
- [ ] Les fournisseurs s'affichent immédiatement
- [ ] "+ Nouveau fournisseur" fonctionne
- [ ] Auto-sélection après création

**CRM - Actions** :
- [ ] Ouvrir "Nouvelle action commerciale"
- [ ] Les clients s'affichent immédiatement
- [ ] Pas de délai de chargement

**CRM - Opportunités** :
- [ ] Ouvrir "Nouvelle opportunité"
- [ ] Les clients s'affichent immédiatement

**Inventaire** :
- [ ] Ouvrir "Nouvel article"
- [ ] Les fournisseurs s'affichent immédiatement
- [ ] Les entrepôts s'affichent immédiatement

**Contrats** :
- [ ] Ouvrir "Nouveau contrat"
- [ ] Les clients s'affichent immédiatement

### Console navigateur :
- [ ] Aucune erreur Supabase
- [ ] Pas de toast d'erreur pour listes vides

---

## 📈 Métriques attendues

### Avant corrections complètes :
- ❌ 4 modules avec bug de chargement (Facturation, Achats, CRM Actions, CRM Opportunités)
- ⚠️ 2 modules avec chargement dépendant du parent (Inventaire, Contrats)
- 📈 Code dupliqué dans chaque formulaire

### Après corrections complètes :
- ✅ 0 bug de chargement
- ✅ Pattern unifié ClientSelector / SupplierSelector / WarehouseSelector
- ✅ Code réutilisable et maintenable
- ✅ UX cohérente dans toute l'application

---

## 🚀 Commande de déploiement après chaque phase

```powershell
.\deploy-vps.ps1
```

---

## 📝 Notes techniques

### Pattern à suivre pour tous les Selector :

```tsx
// 1. Chargement automatique au montage (PAS de condition if (open))
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await service.getData();
      setData(data || []);
    } catch (error) {
      console.error('Error:', error);
      // ⚠️ Ne PAS afficher de toast si liste vide (c'est normal)
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []); // ✅ Pas de dépendance "open"

// 2. État de chargement visible
{loading ? (
  <div>Chargement...</div>
) : (
  <Select>...</Select>
)}

// 3. Gestion liste vide sans erreur
{data.length === 0 ? (
  <SelectItem value="none" disabled>
    Aucun élément disponible
  </SelectItem>
) : (
  data.map(item => <SelectItem key={item.id} value={item.id}>...)
)}

// 4. Bouton "+ Nouveau" intégré
<Button onClick={() => setShowModal(true)}>
  <Plus /> Nouveau
</Button>
```

---

**Dernière mise à jour** : 2025-12-04
**Status global** : 🟡 EN COURS (1/7 corrigé, 6 restants)
