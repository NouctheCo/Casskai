# Quick Reference - Composants UX CassKai

Guide ultra-rapide pour utiliser les nouveaux composants UX.

---

## 🔔 Toast Notifications

```typescript
import { toastSuccess, toastError, toastDeleted, toastCreated } from '@/lib/toast-helpers';

// ✅ Succès
toastSuccess('Données enregistrées !');

// ❌ Erreur
toastError('Une erreur est survenue');

// 🎯 CRUD
toastCreated('L\'employé');
toastUpdated('Le document');
toastDeleted('La facture');

// 🔄 Loading + Result
await toastPromise(
  saveData(),
  {
    loading: 'Enregistrement...',
    success: 'Sauvegardé !',
    error: 'Erreur'
  }
);
```

**Guide complet**: `src/lib/TOAST_USAGE_GUIDE.md`

---

## 📭 Empty State

```tsx
import { EmptyState, EmptyList, EmptySearch } from '@/components/ui';
import { Users } from 'lucide-react';

// Liste vide
<EmptyList
  icon={Users}
  title="Aucun employé"
  description="Commencez par ajouter un employé."
  action={{
    label: 'Ajouter',
    onClick: handleCreate
  }}
/>

// Recherche vide
<EmptySearch
  icon={Search}
  title="Aucun résultat"
  description="Essayez d'autres termes."
/>
```

**Guide complet**: `src/components/ui/EMPTYSTATE_USAGE_GUIDE.md`

---

## ⚠️ Confirmation Dialog

```tsx
import { ConfirmDeleteDialog, ConfirmActionDialog } from '@/components/ui';

// Suppression
<ConfirmDeleteDialog
  itemName="l'employé Jean Dupont"
  onConfirm={async () => {
    await deleteEmployee(id);
    toastDeleted('L\'employé');
  }}
>
  <Button variant="destructive">Supprimer</Button>
</ConfirmDeleteDialog>

// Action importante
<ConfirmActionDialog
  title="Valider le budget"
  description="Budget envoyé pour approbation."
  onConfirm={handleValidation}
>
  <Button>Valider</Button>
</ConfirmActionDialog>
```

---

## 🎯 Pattern Complet (CRUD)

```tsx
import { EmptyList, ConfirmDeleteDialog } from '@/components/ui';
import { toastCreated, toastDeleted, toastError } from '@/lib/toast-helpers';
import { Users, Trash2, Plus } from 'lucide-react';

function EmployeesPage() {
  const { employees, loading } = useEmployees();

  // 1. Création
  const handleCreate = async (data) => {
    try {
      await createEmployee(data);
      toastCreated('L\'employé');
    } catch (error) {
      toastError(error.message);
    }
  };

  // 2. Suppression
  const handleDelete = async (id) => {
    try {
      await deleteEmployee(id);
      toastDeleted('L\'employé');
    } catch (error) {
      toastError(error.message);
    }
  };

  // 3. État vide
  if (!loading && employees.length === 0) {
    return (
      <EmptyList
        icon={Users}
        title="Aucun employé"
        description="Commencez par ajouter des employés."
        action={{
          label: 'Ajouter un employé',
          onClick: () => setShowCreate(true)
        }}
      />
    );
  }

  // 4. Table avec confirmation
  return (
    <Table>
      {employees.map(employee => (
        <TableRow key={employee.id}>
          <TableCell>{employee.name}</TableCell>
          <TableCell>
            <ConfirmDeleteDialog
              itemName={`l'employé ${employee.name}`}
              onConfirm={() => handleDelete(employee.id)}
            >
              <Button variant="ghost" size="sm">
                <Trash2 className="w-4 h-4" />
              </Button>
            </ConfirmDeleteDialog>
          </TableCell>
        </TableRow>
      ))}
    </Table>
  );
}
```

---

## 🎨 Icônes Recommandées

```tsx
import {
  // Général
  FileQuestion, FolderOpen, Package, Search,
  // Utilisateurs
  Users, UserPlus, UserX,
  // Finance
  FileText, Calculator, TrendingUp, Wallet,
  // CRM
  UserCircle, Phone, Calendar, Target,
  // Projets
  FolderKanban, CheckSquare, Clock,
  // Système
  AlertCircle, Info, ShieldAlert, Database
} from 'lucide-react';
```

---

## 🚀 Migration Rapide

### Avant
```tsx
const { toast } = useToast();
toast({
  variant: 'destructive',
  title: 'Erreur',
  description: 'Impossible de supprimer'
});
```

### Après
```tsx
import { toastError } from '@/lib/toast-helpers';
toastError('Impossible de supprimer');
```

**Gain**: 1 ligne au lieu de 6, cohérence garantie.

---

## 📦 Imports Rapides

```tsx
// Tout en un
import {
  EmptyState,
  EmptyList,
  EmptySearch,
  ConfirmDialog,
  ConfirmDeleteDialog,
  ConfirmActionDialog
} from '@/components/ui';

import {
  toastSuccess,
  toastError,
  toastCreated,
  toastUpdated,
  toastDeleted,
  toastPromise
} from '@/lib/toast-helpers';
```

---

## ✅ Checklist Intégration

Pour chaque page/module:

- [ ] Remplacer `toast()` par `toastSuccess/Error/etc`
- [ ] Ajouter `EmptyState` si liste peut être vide
- [ ] Wrapper boutons "Supprimer" avec `ConfirmDeleteDialog`
- [ ] Tester en mode sombre
- [ ] Tester responsive (mobile)
- [ ] Vérifier accessibilité (Tab, Enter, Escape)

---

## 🎯 Priorités

1. **Toast** → Remplacer 50+ usages existants (impact: feedback immédiat)
2. **EmptyState** → 20+ listes vides (impact: guidage utilisateur)
3. **ConfirmDialog** → Tous les "Supprimer" (impact: prévention erreurs)

**Estimation**: 2h pour impact maximal.

---

## 📚 Documentation Complète

- `src/lib/TOAST_USAGE_GUIDE.md` (450 lignes)
- `src/components/ui/EMPTYSTATE_USAGE_GUIDE.md` (550 lignes)
- `UX_IMPROVEMENTS_SUMMARY.md` (statut global)

---

## 💡 Conseils

1. **Commencer petit**: Un module à la fois (ex: HR)
2. **Tester immédiatement**: Dev server + test manuel
3. **Itérer**: Ajuster messages, icônes, variantes
4. **Documenter**: Ajouter exemples pour l'équipe

**Tu as tout ce qu'il faut pour un UX extraordinaire ! 🚀**
