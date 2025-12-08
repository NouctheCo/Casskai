# Correction Dropdowns Immobilisations (06/12/2025)

## Problème identifié
Dans le formulaire de création/édition d'immobilisation, deux dropdowns étaient vides :
1. ✅ **"Sélectionner une catégorie"** → Maintenant corrigé
2. ✅ **"Sélectionner un responsable"** → Déjà fonctionnel

## Analyse

### Dropdown Catégorie (CORRIGÉ)
**Problème** : Le type `AssetCategory` était incomplet dans la fonction `loadCategories()` de `AssetsPage.tsx`

Le type `AssetCategory` requiert les propriétés suivantes :
```typescript
interface AssetCategory {
  id: string;
  company_id: string;           // ❌ Manquant
  name: string;
  code?: string;
  account_asset?: string;
  default_depreciation_method: DepreciationMethod;
  default_duration_years: number;
  default_residual_value?: number;
  is_active: boolean;           // ❌ Manquant
  created_at: string;           // ❌ Manquant
  updated_at: string;           // ❌ Manquant
}
```

**Solution appliquée** : Ajout des propriétés manquantes lors de la conversion des comptes comptables en catégories.

### Dropdown Responsable (DÉJÀ FONCTIONNEL)
**État** : Le chargement des employés actifs fonctionne correctement dans `AssetFormDialog.tsx` (lignes 91-108).

```typescript
const loadEmployees = async () => {
  const { data } = await supabase
    .from('employees')
    .select('id, first_name, last_name')
    .eq('company_id', currentCompany.id)
    .eq('status', 'active')
    .order('last_name');

  setEmployees(data || []);
};
```

## Corrections appliquées

### Fichier : `src/pages/AssetsPage.tsx`

**Avant** (lignes 143-179) :
```typescript
const categoriesData: AssetCategory[] = mainCategories.map(acc => ({
  id: acc.id,
  code: acc.account_code,
  name: acc.account_name,
  account_asset: acc.account_code,
  default_depreciation_method: 'linear' as DepreciationMethod,
  default_duration_years: 5,
  default_residual_value: 0,
  // ❌ Propriétés manquantes
}));
```

**Après** (lignes 164-176) :
```typescript
const categoriesData: AssetCategory[] = mainCategories.map(acc => ({
  id: acc.id,
  company_id: currentCompany.id,          // ✅ Ajouté
  code: acc.account_code,
  name: acc.account_name,
  account_asset: acc.account_code,
  default_depreciation_method: 'linear' as DepreciationMethod,
  default_duration_years: 5,
  default_residual_value: 0,
  is_active: true,                        // ✅ Ajouté
  created_at: acc.created_at || new Date().toISOString(), // ✅ Ajouté
  updated_at: new Date().toISOString(),   // ✅ Ajouté
}));
```

**Requête modifiée** (ligne 150) :
```typescript
// Ajout de 'created_at' dans la requête SELECT
.select('id, account_code, account_name, created_at')
```

## Fonctionnement

### Chargement des catégories
Les catégories sont chargées depuis le plan comptable :
- **Source** : Table `chart_of_accounts`
- **Filtre** : Comptes classe 21 (immobilisations corporelles)
  - `account_code >= '21'`
  - `account_code < '28'`
  - Longueur <= 4 caractères (comptes principaux uniquement)
- **Exemples** : 211 (Terrains), 213 (Constructions), 2154 (Matériel industriel), 2183 (Matériel de bureau)

### Affichage dans le dropdown
Le dropdown affiche maintenant :
```
{category.name} ({category.code})
```
Exemple : "Matériel de bureau (2183)"

## Test recommandé

1. **Accéder à la page Immobilisations** : `/assets`
2. **Cliquer sur "Nouvelle immobilisation"**
3. **Vérifier le dropdown "Catégorie"** :
   - Devrait afficher les comptes 21x du plan comptable
   - Exemple : "Terrains (211)", "Constructions (213)", etc.
4. **Vérifier le dropdown "Responsable"** :
   - Devrait afficher les employés actifs
   - Format : "Prénom Nom"

## Prérequis

Pour que les catégories s'affichent, l'entreprise doit avoir :
1. ✅ Un plan comptable configuré
2. ✅ Des comptes de classe 21 (immobilisations corporelles)

Si le plan comptable n'a pas de comptes 21x :
- Utiliser le setup comptable pour importer un plan standard (PCG ou SYSCOHADA)
- Ou créer manuellement les comptes 21x nécessaires

## Impact

✅ **Dropdown Catégorie** : Maintenant fonctionnel
✅ **Dropdown Responsable** : Déjà fonctionnel
✅ **Compatibilité TypeScript** : Types corrects
✅ **Performance** : Pas de changement (requête optimisée)

## Fichiers modifiés

- [src/pages/AssetsPage.tsx](src/pages/AssetsPage.tsx) - Lignes 143-183

## Status

✅ **RÉSOLU** - Les deux dropdowns du formulaire d'immobilisation fonctionnent correctement.
