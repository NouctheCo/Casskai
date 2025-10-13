# 🎯 Roadmap EntitySelector - Implémentation Cross-Module

## Vision

Généraliser le pattern **EntitySelector** à tous les modules pour :
- ✅ Éviter la redondance de données
- ✅ Permettre création à la volée depuis n'importe quel formulaire
- ✅ Maintenir une source unique de vérité
- ✅ Améliorer l'UX (pas besoin de quitter la page pour créer une entité)

## État actuel

### ✅ Module **Facturation** (FAIT)
- EntitySelector pour articles/produits
- Création/sélection d'articles depuis `products`
- TVA par article
- **Référence**: `src/components/invoicing/OptimizedInvoicesTab.tsx`

### 📋 Modules à implémenter (5 modules prioritaires)

---

## 1. 🔴 PRIORITÉ HAUTE : Module **Achats** (PurchasesPage)

### Intégrations nécessaires

#### A. EntitySelector pour **Fournisseurs**
**Fichier cible**: `src/pages/PurchasesPage.tsx`

**Où intégrer**:
- Formulaire de création de bon de commande
- Formulaire de création de facture fournisseur

**Table Supabase**: `third_parties` (type='supplier')

**Service existant**: `thirdPartiesService.ts` ✅

**Champs formulaire création rapide**:
```typescript
[
  { name: 'name', label: 'Nom du fournisseur', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Téléphone', type: 'text' },
  { name: 'address', label: 'Adresse', type: 'text' },
  { name: 'city', label: 'Ville', type: 'text' },
  { name: 'postal_code', label: 'Code postal', type: 'text' },
  { name: 'payment_terms', label: 'Délai de paiement (jours)', type: 'number', defaultValue: '30' }
]
```

**Handler création**:
```typescript
const handleCreateSupplier = async (data: Record<string, any>) => {
  const result = await thirdPartiesService.createThirdParty({
    type: 'supplier',
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    city: data.city,
    postal_code: data.postal_code,
    payment_terms: data.payment_terms || 30,
    country: 'FR'
  });

  if (result.success) {
    // Rafraîchir liste fournisseurs
    return { success: true, id: result.id };
  }
  return { success: false, error: result.error };
};
```

#### B. EntitySelector pour **Articles à acheter**
**Où intégrer**:
- Lignes de bon de commande
- Lignes de facture fournisseur

**Table Supabase**: `products`

**Service existant**: `inventoryItemsService.ts` ✅

**Même pattern que Facturation** (déjà documenté)

---

## 2. 🟠 PRIORITÉ MOYENNE : Module **CRM** (SalesCrmPage)

### Intégrations nécessaires

#### A. EntitySelector pour **Clients**
**Fichier cible**: `src/pages/SalesCrmPage.tsx`

**Où intégrer**:
- Formulaire de création d'opportunité
- Formulaire de création d'action commerciale
- Formulaire de création de devis

**Table Supabase**: `third_parties` (type='customer')

**Service existant**: `thirdPartiesService.ts` ✅

**Champs formulaire**: (Même que fournisseur mais type='customer')

#### B. EntitySelector pour **Produits/Services**
**Où intégrer**:
- Lignes de devis
- Configuration d'offres commerciales

**Table Supabase**: `products`

**Service existant**: `inventoryItemsService.ts` ✅

---

## 3. 🟡 PRIORITÉ MOYENNE : Module **Projets** (ProjectsPage)

### Intégrations nécessaires

#### A. EntitySelector pour **Clients**
**Fichier cible**: `src/pages/ProjectsPage.tsx`

**Où intégrer**:
- Formulaire de création de projet (champ client)

**Table Supabase**: `third_parties` (type='customer')

**Service existant**: `thirdPartiesService.ts` ✅

#### B. EntitySelector pour **Employés**
**Où intégrer**:
- Affectation de ressources au projet
- Attribution de tâches

**Table Supabase**: `employees` ou `hr_employees`

**Service à créer**: `employeesService.ts` ❌ (TODO)

**Structure du service**:
```typescript
// src/services/employeesService.ts
export interface Employee {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
  hire_date?: string;
  is_active: boolean;
}

class EmployeesService {
  async createEmployee(companyId: string, payload: CreateEmployeePayload): Promise<ServiceResult<Employee>>
  async getEmployees(companyId: string): Promise<ServiceResult<Employee[]>>
  async getEmployeeById(employeeId: string): Promise<ServiceResult<Employee>>
  // ...
}
```

---

## 4. 🟢 PRIORITÉ BASSE : Module **RH** (HumanResourcesPage)

### Intégrations nécessaires

#### A. EntitySelector pour **Postes/Fonctions**
**Fichier cible**: `src/pages/HumanResourcesPage.tsx`

**Où intégrer**:
- Formulaire de création d'employé (champ poste)
- Formulaire de recrutement (poste à pourvoir)

**Table Supabase**: `hr_positions` ou nouvelle table `positions`

**Service à créer**: `positionsService.ts` ❌ (TODO)

#### B. EntitySelector pour **Départements**
**Où intégrer**:
- Formulaire employé (champ département)

**Table Supabase**: `hr_departments` ou `departments`

**Service à créer**: `departmentsService.ts` ❌ (TODO)

---

## 5. 🔵 PRIORITÉ BASSE : Module **Comptabilité** (AccountingPage)

### Intégrations nécessaires

#### A. EntitySelector pour **Comptes comptables**
**Fichier cible**: `src/pages/AccountingPage.tsx` ou composant d'écritures

**Où intégrer**:
- Formulaire d'écriture manuelle (compte débit/crédit)
- Import bancaire (affectation de comptes)

**Table Supabase**: `chart_of_accounts`

**Service existant**: Probablement dans `accountingService.ts` ✅

**Spécificités**:
- Afficher hiérarchie des comptes (classe → compte → sous-compte)
- Filtrer par type (actif, passif, charge, produit)
- Recherche intelligente par numéro ou libellé

---

## Plan d'implémentation recommandé

### Phase 1 : Achats (Priorité HAUTE)
**Durée estimée**: 2-3 heures
**Impact**: Très élevé (complète le cycle achat-vente)

1. ✅ Service `thirdPartiesService` existe déjà
2. ✅ Service `inventoryItemsService` existe déjà
3. Intégrer EntitySelector dans `PurchasesPage.tsx`
4. Tester : créer bon de commande avec nouveau fournisseur + nouveaux articles

### Phase 2 : CRM (Priorité MOYENNE)
**Durée estimée**: 2-3 heures
**Impact**: Élevé (améliore workflow commercial)

1. ✅ Service `thirdPartiesService` existe déjà
2. ✅ Service `inventoryItemsService` existe déjà
3. Intégrer EntitySelector dans `SalesCrmPage.tsx`
4. Tester : créer opportunité avec nouveau client + nouveau produit

### Phase 3 : Projets (Priorité MOYENNE)
**Durée estimée**: 3-4 heures
**Impact**: Moyen

1. ✅ Service `thirdPartiesService` existe déjà
2. ❌ **Créer** `employeesService.ts`
3. Intégrer EntitySelector dans `ProjectsPage.tsx`
4. Tester : créer projet avec nouveau client + affecter employés

### Phase 4 : RH (Priorité BASSE)
**Durée estimée**: 4-5 heures
**Impact**: Faible (module peu utilisé au début)

1. ❌ **Créer** `positionsService.ts`
2. ❌ **Créer** `departmentsService.ts`
3. Intégrer EntitySelector dans `HumanResourcesPage.tsx`

### Phase 5 : Comptabilité (Priorité BASSE)
**Durée estimée**: 3-4 heures
**Impact**: Moyen (comptables expérimentés préfèrent souvent saisir codes)

1. Vérifier service comptes existant
2. Intégrer EntitySelector avec recherche intelligente
3. Gérer hiérarchie des comptes

---

## Temps total estimé

| Phase | Module | Temps | Complexité |
|-------|--------|-------|------------|
| 1 | Achats | 2-3h | ⭐ Facile (services prêts) |
| 2 | CRM | 2-3h | ⭐ Facile (services prêts) |
| 3 | Projets | 3-4h | ⭐⭐ Moyen (créer service employés) |
| 4 | RH | 4-5h | ⭐⭐⭐ Difficile (2 services à créer) |
| 5 | Comptabilité | 3-4h | ⭐⭐ Moyen (hiérarchie comptes) |
| **TOTAL** | | **14-19h** | |

---

## Checklist par module

### Pour chaque module, le dev doit :

- [ ] Identifier les formulaires qui créent/sélectionnent des entités
- [ ] Vérifier que le service existe (sinon le créer)
- [ ] Remplacer les `<Select>` basiques par `<EntitySelector>`
- [ ] Ajouter les `createFormFields` appropriés
- [ ] Implémenter le handler `onCreateEntity`
- [ ] Tester la création à la volée
- [ ] Tester que l'entité créée apparaît bien dans les autres modules
- [ ] Vérifier les permissions Supabase (RLS)
- [ ] Build + déploiement

---

## Exemple de code type (à adapter)

```typescript
// Dans n'importe quel formulaire
<EntitySelector
  options={entityOptions}
  value={selectedEntityId}
  onChange={setSelectedEntityId}
  entityName="un fournisseur"
  entityNamePlural="des fournisseurs"
  placeholder="Sélectionner un fournisseur"
  canCreate={true}
  createFormFields={[
    { name: 'name', label: 'Nom', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    // ... autres champs
  ]}
  onCreateEntity={async (data) => {
    const result = await myService.createEntity(companyId, data);
    if (result.success) {
      await loadEntities(); // Rafraîchir liste
      return { success: true, id: result.data.id };
    }
    return { success: false, error: result.error };
  }}
/>
```

---

## Recommandation finale

**OUI**, ton dev devrait s'en occuper, mais **par phases prioritaires** :

1. **Commence par Achats** (Phase 1) → Impact immédiat, services prêts
2. **Puis CRM** (Phase 2) → Améliore l'expérience commerciale
3. **Projets** ensuite (Phase 3) → Crée le service employés d'abord
4. **RH et Comptabilité** en dernier (Phases 4-5) → Moins urgent

**Durée totale réaliste** : 2-3 semaines en parallèle d'autres tâches.

---

## Documentation de référence

- ✅ Pattern de base : `docs/ENTITY_SELECTOR_INTEGRATION.md`
- ✅ Exemple complet : `src/components/invoicing/OptimizedInvoicesTab.tsx` (lignes 805-866, 1209-1277)
- ✅ Composant réutilisable : `src/components/common/EntitySelector.tsx`
- ✅ Service type : `src/services/inventoryItemsService.ts`
- ✅ Service tiers : `src/services/thirdPartiesService.ts`

---

**Créé le**: 12 Octobre 2025
**Auteur**: Assistant IA
**Statut**: Prêt pour implémentation
