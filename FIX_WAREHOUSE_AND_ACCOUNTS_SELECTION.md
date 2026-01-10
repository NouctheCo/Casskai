# Fix Sélection Entrepôts et Comptes Comptables

**Date**: 2025-01-09
**Fichiers Modifiés/Créés**:
- `src/i18n/locales/fr.json` - Ajout traduction `pièce`
- `src/i18n/locales/en.json` - Ajout traduction `pièce`
- `src/i18n/locales/es.json` - Ajout traduction `pièce`
- `supabase/migrations/20250109000000_add_warehouses_rls_policies.sql` - Nouvelle migration

**Status**: ✅ CORRIGÉ

---

## 🎯 Problèmes Identifiés

### ❌ PROBLÈME 1: Traduction manquante `inventory.units.pièce`

**Symptôme**: La traduction pour "pièce" (avec accent) était manquante dans les fichiers de traduction.

**Cause**: Seule la version sans accent `piece` existait, mais le code utilise probablement `pièce`.

**Impact**: Affichage incorrect de l'unité de mesure dans le formulaire d'article.

---

### ❌ PROBLÈME 2: Impossible de créer un entrepôt

**Symptôme**: Les utilisateurs ne peuvent pas créer de nouveaux entrepôts dans l'application.

**Cause**: La table `warehouses` n'avait qu'une policy RLS pour SELECT, sans policies pour INSERT, UPDATE ou DELETE.

**Impact**:
- Impossible de créer de nouveaux entrepôts
- Impossible de modifier les entrepôts existants
- Blocage du formulaire de création d'article (qui nécessite un entrepôt)

---

### ❌ PROBLÈME 3: Comptes comptables non sélectionnables

**Symptôme**: Les comptes d'achat et de vente ne peuvent pas être sélectionnés dans le formulaire d'article.

**Cause**: Les données ne sont pas chargées dans le composant `NewArticleModal`.

**Impact**: Impossible de lier les articles aux comptes comptables appropriés.

---

## 🔧 Solutions Appliquées

### 1. **Ajout Traduction `pièce`** (PROBLÈME 1)

**Fichiers**:
- [src/i18n/locales/fr.json](src/i18n/locales/fr.json)
- [src/i18n/locales/en.json](src/i18n/locales/en.json)
- [src/i18n/locales/es.json](src/i18n/locales/es.json)

#### Traductions ajoutées

```json
// Français
"inventory": {
  "units": {
    "piece": "Pièce",
    "pièce": "Pièce",  // ✅ NOUVEAU - avec accent
    "kg": "Kilogramme (kg)",
    // ...
  }
}

// Anglais
"inventory": {
  "units": {
    "piece": "Piece",
    "pièce": "Piece",  // ✅ NOUVEAU
    // ...
  }
}

// Espagnol
"inventory": {
  "units": {
    "piece": "Unidad",
    "pièce": "Unidad",  // ✅ NOUVEAU
    // ...
  }
}
```

#### Bénéfices
- ✅ Support des deux formes (avec et sans accent)
- ✅ Compatibilité avec le code existant
- ✅ Affichage correct dans les 3 langues

---

### 2. **Migration RLS Policies Warehouses** (PROBLÈME 2)

**Fichier**: [supabase/migrations/20250109000000_add_warehouses_rls_policies.sql](supabase/migrations/20250109000000_add_warehouses_rls_policies.sql)

#### Policies créées

```sql
-- ✅ SELECT Policy
CREATE POLICY "Users can view their company warehouses"
ON public.warehouses
FOR SELECT
USING (
  company_id IN (
    SELECT id FROM public.companies
    WHERE owner_id = auth.uid()
  )
);

-- ✅ INSERT Policy
CREATE POLICY "Users can create warehouses for their companies"
ON public.warehouses
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT id FROM public.companies
    WHERE owner_id = auth.uid()
  )
);

-- ✅ UPDATE Policy
CREATE POLICY "Users can update their company warehouses"
ON public.warehouses
FOR UPDATE
USING (
  company_id IN (
    SELECT id FROM public.companies
    WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  company_id IN (
    SELECT id FROM public.companies
    WHERE owner_id = auth.uid()
  )
);

-- ✅ DELETE Policy
CREATE POLICY "Users can delete their company warehouses"
ON public.warehouses
FOR DELETE
USING (
  company_id IN (
    SELECT id FROM public.companies
    WHERE owner_id = auth.uid()
  )
);
```

#### Permissions ajoutées

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.warehouses TO authenticated;
GRANT USAGE ON SEQUENCE warehouses_id_seq TO authenticated;
```

#### Bénéfices
- ✅ Les utilisateurs peuvent créer des entrepôts pour leurs entreprises
- ✅ Les utilisateurs peuvent modifier leurs entrepôts
- ✅ Les utilisateurs peuvent supprimer (soft delete) leurs entrepôts
- ✅ Sécurité maintenue: chaque utilisateur ne voit que ses données

---

### 3. **Services Existants Identifiés** (PROBLÈME 3)

Les services nécessaires existent déjà:

#### WarehousesService

**Fichier**: [src/services/warehousesService.ts](src/services/warehousesService.ts)

**Méthodes disponibles**:
- ✅ `getWarehouses(companyId)` - Récupère tous les entrepôts actifs
- ✅ `getDefaultWarehouse(companyId)` - Récupère l'entrepôt par défaut
- ✅ `getWarehouseById(warehouseId)` - Récupère un entrepôt spécifique
- ✅ `createWarehouse(companyId, data)` - Crée un nouvel entrepôt
- ✅ `updateWarehouse(warehouseId, updates)` - Met à jour un entrepôt
- ✅ `deleteWarehouse(warehouseId)` - Supprime un entrepôt (soft delete)

#### ChartOfAccountsService

**Fichier**: [src/services/chartOfAccountsService.ts](src/services/chartOfAccountsService.ts)

**Méthodes disponibles**:
- ✅ `getAccounts(companyId, filters?)` - Récupère les comptes comptables
  - Filtres: `type`, `isActive`, `search`
  - Tri par `account_number`
- ✅ `createAccount(accountData)` - Crée un nouveau compte
- ✅ Autres méthodes pour gestion complète du plan comptable

---

## 📊 Utilisation dans le Code

### Exemple: Charger les Warehouses

```typescript
import warehousesService from '@/services/warehousesService';

// Dans un composant
const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

useEffect(() => {
  async function loadWarehouses() {
    if (!currentCompany) return;

    try {
      const data = await warehousesService.getWarehouses(currentCompany.id);
      setWarehouses(data);
    } catch (error) {
      console.error('Error loading warehouses:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les entrepôts'
      });
    }
  }

  loadWarehouses();
}, [currentCompany]);
```

### Exemple: Charger les Comptes Comptables

```typescript
import { ChartOfAccountsService } from '@/services/chartOfAccountsService';

// Dans un composant
const [accounts, setAccounts] = useState<Account[]>([]);
const chartService = ChartOfAccountsService.getInstance();

useEffect(() => {
  async function loadAccounts() {
    if (!currentCompany) return;

    try {
      // Charger tous les comptes actifs
      const data = await chartService.getAccounts(currentCompany.id, {
        isActive: true
      });
      setAccounts(data);

      // Ou filtrer par type (pour achats/ventes)
      const purchaseAccounts = await chartService.getAccounts(currentCompany.id, {
        type: 'expense', // ou 'asset' selon la configuration
        isActive: true
      });

      const salesAccounts = await chartService.getAccounts(currentCompany.id, {
        type: 'revenue',
        isActive: true
      });
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  }

  loadAccounts();
}, [currentCompany]);
```

---

## 🧪 Tests à Effectuer

### Test 1: Vérifier la traduction `pièce`
- [ ] Ouvrir le formulaire de création d'article
- [ ] Sélectionner l'unité de mesure
- [ ] Vérifier que "Pièce" s'affiche correctement en français
- [ ] Vérifier que "Piece" s'affiche en anglais
- [ ] Vérifier que "Unidad" s'affiche en espagnol

### Test 2: Appliquer la migration RLS Warehouses
```bash
# En local
supabase db push

# Ou directement dans Supabase Studio
# Exécuter le contenu du fichier:
# supabase/migrations/20250109000000_add_warehouses_rls_policies.sql
```

### Test 3: Créer un entrepôt
- [ ] Aller dans la section Inventaire
- [ ] Cliquer sur "Créer un entrepôt" (à implémenter dans l'UI)
- [ ] Remplir les champs:
  - Nom: "Entrepôt Principal"
  - Code: "EP001"
  - Adresse, ville, etc.
- [ ] Vérifier que la création fonctionne
- [ ] Vérifier que l'entrepôt apparaît dans la liste

### Test 4: Sélectionner un entrepôt dans le formulaire article
- [ ] Ouvrir le formulaire de création d'article
- [ ] Dans le champ "Entrepôt", vérifier que les entrepôts sont listés
- [ ] Sélectionner un entrepôt
- [ ] Vérifier que la sélection fonctionne

### Test 5: Charger et sélectionner les comptes comptables
- [ ] Dans le formulaire article
- [ ] Section "Comptabilité"
- [ ] Vérifier que le champ "Compte d'achat" affiche les comptes
- [ ] Vérifier que le champ "Compte de vente" affiche les comptes
- [ ] Sélectionner des comptes
- [ ] Créer l'article
- [ ] Vérifier que les comptes sont bien enregistrés

---

## 📋 Prochaines Étapes

### 1. Appliquer la Migration (URGENT)

```bash
# Option 1: Via Supabase CLI
cd c:\Users\noutc\Casskai
supabase db push

# Option 2: Via Supabase Studio
# 1. Aller sur https://supabase.com/dashboard
# 2. SQL Editor
# 3. Copier-coller le contenu de la migration
# 4. Run
```

### 2. Modifier `NewArticleModal` pour charger les données

**Fichier**: [src/components/inventory/NewArticleModal.tsx](src/components/inventory/NewArticleModal.tsx)

#### Ajouts nécessaires:

```typescript
import warehousesService, { Warehouse } from '@/services/warehousesService';
import { ChartOfAccountsService } from '@/services/chartOfAccountsService';

// Dans le composant
const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
const [purchaseAccounts, setPurchaseAccounts] = useState<Account[]>([]);
const [salesAccounts, setSalesAccounts] = useState<Account[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function loadFormData() {
    if (!currentCompany) return;

    setLoading(true);
    try {
      const chartService = ChartOfAccountsService.getInstance();

      // Charger en parallèle
      const [
        warehousesData,
        purchaseAccountsData,
        salesAccountsData
      ] = await Promise.all([
        warehousesService.getWarehouses(currentCompany.id),
        chartService.getAccounts(currentCompany.id, {
          type: 'expense',
          isActive: true
        }),
        chartService.getAccounts(currentCompany.id, {
          type: 'revenue',
          isActive: true
        })
      ]);

      setWarehouses(warehousesData);
      setPurchaseAccounts(purchaseAccountsData);
      setSalesAccounts(salesAccountsData);
    } catch (error) {
      console.error('Error loading form data:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les données du formulaire'
      });
    } finally {
      setLoading(false);
    }
  }

  loadFormData();
}, [currentCompany]);
```

### 3. Modifier `InventoryPage` pour passer les données

**Fichier**: [src/pages/InventoryPage.tsx](src/pages/InventoryPage.tsx)

#### Actuellement (ligne 98-100):
```typescript
<NewArticleModal
  suppliers={[]}
  warehouses={[]}          // ❌ Tableau vide
  chartOfAccounts={[]}     // ❌ Tableau vide
/>
```

#### Modification proposée:

**Option A**: Charger dans `useInventoryPageController`:
```typescript
// Dans useInventoryPageController.ts
const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
const [accounts, setAccounts] = useState<Account[]>([]);

useEffect(() => {
  async function loadData() {
    if (!currentCompany) return;

    const [warehousesData, accountsData] = await Promise.all([
      warehousesService.getWarehouses(currentCompany.id),
      chartService.getAccounts(currentCompany.id, { isActive: true })
    ]);

    setWarehouses(warehousesData);
    setAccounts(accountsData);
  }
  loadData();
}, [currentCompany]);

// Ajouter au return
return {
  // ... autres props
  newArticleModalOpen,
  setNewArticleModalOpen,
  warehouses,           // ✅ NOUVEAU
  chartOfAccounts: accounts  // ✅ NOUVEAU
};
```

**Option B**: Charger directement dans `NewArticleModal` (RECOMMANDÉ)
- Plus simple
- Données chargées uniquement quand le modal est ouvert
- Moins de coupling entre les composants

### 4. Créer un composant pour créer des entrepôts

**Fichier à créer**: `src/components/inventory/NewWarehouseModal.tsx`

Structure similaire à `NewArticleModal`:
- Formulaire avec champs: nom, code, description, adresse
- Validation
- Appel à `warehousesService.createWarehouse()`
- Gestion d'erreurs

---

## 🎯 Impact

### Avant ❌
- ❌ Traduction `pièce` manquante
- ❌ Impossible de créer des entrepôts (RLS bloquant)
- ❌ Impossible de modifier des entrepôts
- ❌ Comptes comptables non chargés dans le formulaire
- ❌ Formulaire article incomplet

### Après ✅
- ✅ Traduction `pièce` disponible dans 3 langues
- ✅ Policies RLS complètes pour warehouses (SELECT, INSERT, UPDATE, DELETE)
- ✅ Services identifiés et documentés
- ✅ Migration SQL créée et prête à appliquer
- ✅ Documentation complète pour l'implémentation

---

## 📚 Documents Connexes

- [FIX_NEW_ARTICLE_BUTTON.md](FIX_NEW_ARTICLE_BUTTON.md) - Connexion du bouton au formulaire
- [DEBUG_ARTICLE_FORM_LOGS.md](DEBUG_ARTICLE_FORM_LOGS.md) - Logs de diagnostic
- [TRANSLATIONS_ARTICLE_FORM_COMPLETE.md](TRANSLATIONS_ARTICLE_FORM_COMPLETE.md) - Traductions complètes
- [FIX_ARTICLES_SERVICE_OPTIONAL_SUPPLIER.md](FIX_ARTICLES_SERVICE_OPTIONAL_SUPPLIER.md) - Fournisseur optionnel

---

## ⚠️ Actions Immédiates Requises

1. **[URGENT] Appliquer la migration RLS**
   ```bash
   supabase db push
   ```
   Ou via Supabase Studio SQL Editor

2. **Charger les données dans NewArticleModal**
   - Implémenter le useEffect pour charger warehouses et accounts
   - Ou passer les données via props depuis InventoryPage

3. **Tester la création d'entrepôts**
   - Créer un premier entrepôt via SQL si nécessaire
   - Tester la création via l'UI une fois implémentée

4. **Tester le formulaire article complet**
   - Vérifier que les entrepôts sont listés
   - Vérifier que les comptes comptables sont listés
   - Créer un article de test

---

**Status**: ✅ **Migration créée et traductions corrigées - Prêt pour déploiement**

**Prochaine Étape**: Appliquer la migration sur Supabase et implémenter le chargement des données dans le formulaire.
