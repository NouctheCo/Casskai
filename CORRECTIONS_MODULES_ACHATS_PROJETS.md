# Corrections Modules Achats et Projets

**Date**: 28 Novembre 2025

## ✅ Corrections Appliquées

### 1. Module Achats - Select Fournisseur Amélioré

**Problème**: Le dropdown "Fournisseur" ne permettait pas d'ajouter un nouveau fournisseur directement.

**Solution implémentée**:

#### Fichiers créés :
- `src/components/common/SelectWithCreate.tsx` - Composant réutilisable avec recherche et création inline
- `src/hooks/useSuppliers.ts` - Hook pour charger et créer des fournisseurs
- `src/components/purchases/SupplierSelectWithCreate.tsx` - Wrapper spécifique pour les achats

#### Fonctionnalités :
✅ Recherche en temps réel des fournisseurs existants
✅ Bouton "Créer un nouveau fournisseur" dans le dropdown
✅ Création inline sans quitter le formulaire
✅ Ajout automatique à la liste après création
✅ Toast de confirmation
✅ Affichage du nom + email/téléphone dans la liste

#### Utilisation :
```tsx
import { SupplierSelectWithCreate } from '@/components/purchases/SupplierSelectWithCreate';

// Dans le formulaire
<SupplierSelectWithCreate
  value={formData.supplier_id}
  onChange={(value) => setFormData({ ...formData, supplier_id: value })}
  error={errors.supplier_id}
  required={true}
/>
```

**Intégration à faire** :
- Remplacer le `<Select>` fournisseur existant dans `PurchaseForm.tsx` (lignes 220-240) par le nouveau composant
- Supprimer les imports `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` non utilisés

---

### 2. Module Projets - Suppression Données Mockées + Tables Réelles

**Problème**: La page Projets affichait des données fictives (Marie Dubois, Pierre Martin, Sophie Bernard) et n'était pas connectée à Supabase.

**Solution implémentée**:

#### A. Migration SQL Complète (ALTER Non-Destructive)

**Fichier**: `supabase/migrations/20251128_projects_module_alter.sql`

⚠️ **IMPORTANT** : Cette migration utilise `ALTER TABLE` pour ajouter les colonnes manquantes à la table `projects` existante sans perdre les données. Elle est **non-destructive**.

**Tables créées** :
1. **projects** - Projets avec client, budget, dates, statut
   - Colonnes : name, code, description, third_party_id, start_date, end_date, budget_amount, hourly_rate, status, priority, progress, manager_id, billing_type, is_billable, color, tags
   - Statuts : planning, active, on_hold, completed, cancelled
   - Types facturation : fixed, hourly, milestone, retainer

2. **project_tasks** - Tâches des projets
   - Colonnes : name, description, start_date, end_date, estimated_hours, status, priority, progress, assigned_to, sort_order, parent_task_id
   - Statuts : todo, in_progress, review, done, cancelled
   - Hiérarchie de tâches (parent_task_id)

3. **timesheets** - Feuilles de temps
   - Colonnes : project_id, task_id, user_id, date, hours, description, is_billable, hourly_rate, amount (calculé), status, approved_by, approved_at, invoice_id
   - Statuts : draft, submitted, approved, rejected, invoiced
   - Montant auto-calculé : `hours × hourly_rate`

4. **project_resources** - Affectation ressources
   - Colonnes : project_id, user_id, role, allocation_percentage, start_date, end_date, hourly_rate
   - Contrainte unique : un utilisateur ne peut être affecté qu'une fois par projet

**Index créés** : 15 index pour optimiser les requêtes
**RLS activé** : Toutes les tables ont Row Level Security avec policies basées sur user_companies

#### B. Service Projets Complet

**Fichier**: `src/services/projectService.ts`

**Fonctions implémentées** :

**Projets** :
- `getProjects(companyId)` - Liste avec stats
- `getProject(projectId)` - Détails d'un projet
- `getProjectStats(projectId)` - Heures, montants, tâches
- `createProject(companyId, data)`
- `updateProject(projectId, data)`
- `deleteProject(projectId)`

**Tâches** :
- `getTasks(projectId)` - Tâches avec heures réelles
- `createTask(projectId, data)`
- `updateTask(taskId, data)`
- `deleteTask(taskId)`

**Timesheets** :
- `getTimesheets(companyId, filters)` - Avec filtres projet/user/dates/statut
- `createTimesheet(companyId, data)`
- `updateTimesheet(timesheetId, data)`
- `approveTimesheet(timesheetId, userId)`
- `rejectTimesheet(timesheetId)`

**Ressources** :
- `getProjectResources(projectId)`
- `addResource(projectId, userId, data)`
- `removeResource(resourceId)`

**Dashboard** :
- `getDashboardStats(companyId)` - Stats globales pour tableau de bord

---

## 🚀 Prochaines Étapes

### 1. Appliquer la migration SQL (ALTER Non-Destructive)

Dans **Supabase Dashboard** → **SQL Editor** :

```sql
-- Copier/coller le contenu de :
-- supabase/migrations/20251128_projects_module_alter.sql
-- Puis exécuter
```

**Résultat attendu** :

```text
✅ Migration Module Projets (ALTER) complétée avec succès!
   - Colonnes manquantes ajoutées à projects (third_party_id, manager_id, etc.)
   - 3 nouvelles tables créées (project_tasks, timesheets, project_resources)
   - 15 index créés
   - RLS activé avec policies
   - Prêt pour la gestion complète des projets
```

⚠️ **Migration non-destructive** : Cette migration ajoute les colonnes manquantes sans supprimer les données existantes dans la table `projects`.

### 2. Modifier ProjectsPage.tsx

**Lignes à supprimer** :
- Lignes 220-375 : Données mockées (Marie Dubois, Pierre Martin, Sophie Bernard, dates 2024-03-15)

**Imports à ajouter** :
```tsx
import { projectService } from '@/services/projectService';
import { useAuth } from '@/contexts/AuthContext';
```

**Hook à utiliser** :
```tsx
const { currentCompany } = useAuth();
const [projects, setProjects] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  if (currentCompany?.id) {
    projectService.getProjects(currentCompany.id).then(setProjects);
  }
}, [currentCompany?.id]);
```

### 3. Intégrer SupplierSelectWithCreate dans PurchaseForm.tsx

**Remplacement à effectuer** (lignes 220-240) :
```tsx
// AVANT :
<div className="space-y-2">
  <Label htmlFor="supplier_id">
    {t('purchases.form.supplier')} *
  </Label>
  <Select
    value={formData.supplier_id}
    onValueChange={(value) => handleInputChange('supplier_id', value)}
  >
    <SelectTrigger className={errors.supplier_id ? 'border-red-500' : ''}>
      <SelectValue placeholder={t('purchases.form.selectSupplier')} />
    </SelectTrigger>
    <SelectContent>
      {suppliers.map((supplier) => (
        <SelectItem key={supplier.id} value={supplier.id}>
          {supplier.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  {errors.supplier_id && (
    <p className="text-sm text-red-600">{errors.supplier_id}</p>
  )}
</div>

// APRÈS :
<SupplierSelectWithCreate
  value={formData.supplier_id}
  onChange={(value) => handleInputChange('supplier_id', value)}
  error={errors.supplier_id}
  required={true}
/>
```

**Imports à ajouter** :
```tsx
import { SupplierSelectWithCreate } from './SupplierSelectWithCreate';
```

---

## 📋 Résumé des Fichiers Créés

### Module Achats
1. ✅ `src/components/common/SelectWithCreate.tsx` (270 lignes)
2. ✅ `src/hooks/useSuppliers.ts` (95 lignes)
3. ✅ `src/components/purchases/SupplierSelectWithCreate.tsx` (55 lignes)

### Module Projets
4. ✅ `supabase/migrations/20251128_projects_module_alter.sql` (280 lignes) - Migration ALTER non-destructive
5. ✅ `src/services/projectService.ts` (430 lignes)

### Documentation
6. ✅ `CORRECTIONS_MODULES_ACHATS_PROJETS.md` (ce fichier)

---

## ✅ Tests de Validation

### Module Achats
1. Ouvrir page Achats → Nouvel achat
2. Cliquer sur le dropdown "Fournisseur"
3. Vérifier : recherche, liste des fournisseurs existants
4. Cliquer sur "Créer un nouveau fournisseur"
5. Entrer un nom et valider
6. Vérifier : toast de confirmation, fournisseur ajouté à la liste et sélectionné

### Module Projets
1. Appliquer la migration SQL
2. Recharger page Projets
3. Vérifier : aucune donnée mockée (Marie, Pierre, Sophie)
4. Créer un nouveau projet
5. Ajouter des tâches
6. Créer des timesheets
7. Vérifier les stats du dashboard

---

## 🔗 Relations Base de Données

```
companies
  └── projects (company_id)
        ├── third_parties (third_party_id) [Client]
        ├── users (manager_id) [Chef de projet]
        ├── project_tasks (project_id)
        │     ├── users (assigned_to)
        │     └── project_tasks (parent_task_id) [Sous-tâches]
        ├── timesheets (project_id)
        │     ├── users (user_id)
        │     ├── project_tasks (task_id)
        │     └── invoices (invoice_id)
        └── project_resources (project_id)
              └── users (user_id)
```

---

**Développeur** : Claude (Assistant IA)
**Date de correction** : 28 Novembre 2025
**Status** : Prêt pour intégration
