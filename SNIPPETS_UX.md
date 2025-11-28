# 📋 Copy-Paste Snippets - Système UX CassKai v2.0

> **Snippets prêts à copier-coller** pour une intégration ultra-rapide

---

## 🔔 Toast Notifications

### Imports de Base
```typescript
import { 
  toastSuccess, 
  toastError, 
  toastCreated, 
  toastUpdated,
  toastDeleted,
  toastSaved,
  toastPromise 
} from '@/lib/toast-helpers';
```

### Patterns Courants

#### Succès Simple
```typescript
toastSuccess('Opération réussie !');
```

#### Erreur Simple
```typescript
toastError('Une erreur est survenue');
```

#### CRUD - Création
```typescript
await createEmployee(data);
toastCreated('L\'employé');
```

#### CRUD - Modification
```typescript
await updateEmployee(id, data);
toastUpdated('L\'employé');
```

#### CRUD - Suppression
```typescript
await deleteEmployee(id);
toastDeleted('L\'employé');
```

#### Avec Promise et Loading
```typescript
await toastPromise(
  saveData(),
  {
    loading: 'Enregistrement en cours...',
    success: 'Données enregistrées avec succès !',
    error: 'Erreur lors de l\'enregistrement'
  }
);
```

#### Avec Promise et Callback
```typescript
await toastPromise(
  createInvoice(data),
  {
    loading: 'Création de la facture...',
    success: (invoice) => {
      router.push(`/invoices/${invoice.id}`);
      return `Facture ${invoice.number} créée avec succès !`;
    },
    error: (err) => `Erreur: ${err.message}`
  }
);
```

---

## 📭 EmptyState

### Imports
```typescript
import { EmptyList, EmptySearch, EmptyWithAction } from '@/components/ui';
import { Package, Users, FileText, ShoppingCart } from 'lucide-react';
```

### EmptyList - Liste Vide Standard
```tsx
{items.length === 0 && (
  <EmptyList
    icon={Package}
    title="Aucun élément"
    description="Commencez par ajouter des éléments à votre liste."
    action={{
      label: 'Ajouter un élément',
      onClick: () => setShowCreateModal(true)
    }}
  />
)}
```

### EmptySearch - Résultats de Recherche Vides
```tsx
{filteredItems.length === 0 && searchTerm && (
  <EmptySearch
    searchTerm={searchTerm}
    suggestions={['Vérifiez l\'orthographe', 'Essayez des mots-clés différents']}
    onReset={() => setSearchTerm('')}
  />
)}
```

### EmptyWithAction - Avec Action Principale
```tsx
<EmptyWithAction
  icon={Users}
  title="Aucun employé"
  description="Votre équipe est vide. Commencez par ajouter des employés."
  primaryAction={{
    label: 'Ajouter un employé',
    onClick: handleCreate
  }}
  secondaryAction={{
    label: 'Importer depuis Excel',
    onClick: handleImport
  }}
/>
```

### Pattern: Liste avec Recherche
```tsx
const [searchTerm, setSearchTerm] = useState('');
const filtered = items.filter(item => 
  item.name.toLowerCase().includes(searchTerm.toLowerCase())
);

return (
  <>
    <Input 
      placeholder="Rechercher..." 
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
    
    {filtered.length === 0 ? (
      searchTerm ? (
        <EmptySearch 
          searchTerm={searchTerm}
          onReset={() => setSearchTerm('')}
        />
      ) : (
        <EmptyList
          icon={Package}
          title="Aucun élément"
          action={{ label: 'Ajouter', onClick: handleCreate }}
        />
      )
    ) : (
      <Table>
        {/* Résultats */}
      </Table>
    )}
  </>
);
```

---

## 🛡️ ConfirmDialog

### Imports
```typescript
import { ConfirmDeleteDialog, ConfirmActionDialog } from '@/components/ui';
import { toastDeleted, toastSuccess } from '@/lib/toast-helpers';
```

### ConfirmDeleteDialog - Suppression Simple
```tsx
<ConfirmDeleteDialog
  itemName="cet élément"
  onConfirm={async () => {
    await deleteItem(id);
    toastDeleted('L\'élément');
  }}
>
  <Button variant="destructive">
    <Trash2 className="w-4 h-4 mr-2" />
    Supprimer
  </Button>
</ConfirmDeleteDialog>
```

### ConfirmDeleteDialog - Avec Nom Dynamique
```tsx
<ConfirmDeleteDialog
  itemName={`l'employé ${employee.firstName} ${employee.lastName}`}
  onConfirm={async () => {
    await deleteEmployee(employee.id);
    toastDeleted('L\'employé');
    router.push('/employees');
  }}
>
  <Button variant="destructive">Supprimer</Button>
</ConfirmDeleteDialog>
```

### ConfirmActionDialog - Action Importante
```tsx
<ConfirmActionDialog
  title="Valider la facture"
  description="Êtes-vous sûr de vouloir valider cette facture ? Cette action est irréversible."
  onConfirm={async () => {
    await validateInvoice(id);
    toastSuccess('Facture validée avec succès');
  }}
>
  <Button>Valider la facture</Button>
</ConfirmActionDialog>
```

### Pattern: Bouton dans Tableau
```tsx
<TableCell>
  <div className="flex items-center gap-2">
    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
      <Pencil className="w-4 h-4" />
    </Button>
    
    <ConfirmDeleteDialog
      itemName={item.name}
      onConfirm={async () => {
        await deleteItem(item.id);
        toastDeleted('L\'élément');
        refetch();
      }}
    >
      <Button variant="ghost" size="icon">
        <Trash2 className="w-4 h-4" />
      </Button>
    </ConfirmDeleteDialog>
  </div>
</TableCell>
```

---

## ✅ Validation Formulaires

### Imports
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  createEmployeeSchema,
  createInvoiceSchema,
  createClientSchema,
  companySettingsSchema 
} from '@/lib/validation-schemas';
import { toastCreated, toastUpdated } from '@/lib/toast-helpers';
```

### Setup Formulaire avec Validation
```typescript
const form = useForm({
  resolver: zodResolver(createEmployeeSchema),
  mode: 'onChange', // Validation en temps réel
  defaultValues: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    // ... autres champs
  }
});
```

### Composant Formulaire Complet (Employé)
```tsx
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function EmployeeForm({ onSuccess }: { onSuccess: () => void }) {
  const form = useForm({
    resolver: zodResolver(createEmployeeSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      hireDate: '',
    }
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await createEmployee(data);
      toastCreated('L\'employé');
      form.reset();
      onSuccess();
    } catch (error) {
      toastError(error.message);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Prénom */}
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prénom *</FormLabel>
              <FormControl>
                <Input placeholder="Jean" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Nom */}
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom *</FormLabel>
              <FormControl>
                <Input placeholder="Dupont" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input type="email" placeholder="jean.dupont@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Annuler
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Création...' : 'Créer l\'employé'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

### Formulaire avec Select
```tsx
<FormField
  control={form.control}
  name="department"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Département *</FormLabel>
      <Select onValueChange={field.onChange} value={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un département" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="IT">Informatique</SelectItem>
          <SelectItem value="HR">Ressources Humaines</SelectItem>
          <SelectItem value="SALES">Ventes</SelectItem>
          <SelectItem value="FINANCE">Finance</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Formulaire avec Date
```tsx
<FormField
  control={form.control}
  name="hireDate"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Date d'embauche *</FormLabel>
      <FormControl>
        <Input type="date" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Formulaire d'Édition (avec données existantes)
```typescript
const form = useForm({
  resolver: zodResolver(updateEmployeeSchema),
  mode: 'onChange',
  defaultValues: {
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone,
    // ... autres champs
  }
});

const handleSubmit = form.handleSubmit(async (data) => {
  await updateEmployee(employee.id, data);
  toastUpdated('L\'employé');
  onSuccess();
});
```

---

## ♿ Accessibilité

### Bouton Icon-Only
```tsx
// ✅ TOUJOURS ajouter aria-label
<Button 
  variant="ghost" 
  size="icon"
  aria-label="Modifier l'employé Jean Dupont"
>
  <Pencil className="w-4 h-4" aria-hidden="true" />
</Button>

<Button 
  variant="destructive" 
  size="icon"
  aria-label="Supprimer l'employé Jean Dupont"
>
  <Trash2 className="w-4 h-4" aria-hidden="true" />
</Button>

<Button 
  variant="outline" 
  size="icon"
  aria-label="Télécharger la facture INV-2024-001"
>
  <Download className="w-4 h-4" aria-hidden="true" />
</Button>
```

### Screen Reader Only Text
```tsx
<span className="sr-only">Chargement des données en cours...</span>

<Badge variant="default">
  3
  <span className="sr-only">notifications non lues</span>
</Badge>
```

### Focus Visible
```tsx
<button className="px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Cliquez ici
</button>
```

### Label Associé à Input
```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input 
    id="email" 
    type="email" 
    placeholder="votre@email.com"
    aria-describedby="email-error"
  />
  <p id="email-error" className="text-sm text-red-500">
    {error && error.message}
  </p>
</div>
```

### Navigation Clavier dans Dialog
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Ouvrir</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Titre du dialogue</DialogTitle>
      <DialogDescription>Description accessible</DialogDescription>
    </DialogHeader>
    
    {/* Contenu */}
    
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Annuler</Button>
      </DialogClose>
      <Button>Confirmer</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 🎨 Pattern CRUD Complet

### Page Complète avec Tous les Patterns
```tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEmployeeSchema } from '@/lib/validation-schemas';
import { toastCreated, toastDeleted, toastPromise } from '@/lib/toast-helpers';
import { EmptyList, ConfirmDeleteDialog } from '@/components/ui';
import { Users, Pencil, Trash2 } from 'lucide-react';

export function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrage
  const filteredEmployees = employees.filter(emp =>
    `${emp.firstName} ${emp.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Formulaire de création
  const form = useForm({
    resolver: zodResolver(createEmployeeSchema),
    mode: 'onChange',
  });

  const handleCreate = form.handleSubmit(async (data) => {
    await toastPromise(
      createEmployee(data),
      {
        loading: 'Création de l\'employé...',
        success: () => {
          form.reset();
          setShowCreateModal(false);
          refetchEmployees();
          return 'Employé créé avec succès !';
        },
        error: 'Erreur lors de la création'
      }
    );
  });

  const handleDelete = async (employee) => {
    await deleteEmployee(employee.id);
    toastDeleted('L\'employé');
    refetchEmployees();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Employés</h1>
          <p className="text-muted-foreground">
            Gérez votre équipe et leurs informations
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un employé
        </Button>
      </div>

      {/* Recherche */}
      <Input
        placeholder="Rechercher un employé..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-md"
      />

      {/* Liste ou État vide */}
      {filteredEmployees.length === 0 ? (
        searchTerm ? (
          <EmptySearch
            searchTerm={searchTerm}
            onReset={() => setSearchTerm('')}
          />
        ) : (
          <EmptyList
            icon={Users}
            title="Aucun employé"
            description="Commencez par ajouter des employés à votre équipe."
            action={{
              label: 'Ajouter un employé',
              onClick: () => setShowCreateModal(true)
            }}
          />
        )
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Poste</TableHead>
              <TableHead>Département</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">
                  {employee.firstName} {employee.lastName}
                </TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(employee)}
                      aria-label={`Modifier l'employé ${employee.firstName} ${employee.lastName}`}
                    >
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                    </Button>
                    
                    <ConfirmDeleteDialog
                      itemName={`l'employé ${employee.firstName} ${employee.lastName}`}
                      onConfirm={() => handleDelete(employee)}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Supprimer l'employé ${employee.firstName} ${employee.lastName}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    </ConfirmDeleteDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Modal de création */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un employé</DialogTitle>
            <DialogDescription>
              Remplissez les informations de l'employé
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={handleCreate} className="space-y-4">
              {/* Champs du formulaire... */}
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Annuler
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Création...' : 'Créer'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## 📊 Checklist Post-Copie

Après avoir copié un snippet, vérifier:

- [ ] Les imports sont corrects
- [ ] Les noms de variables correspondent
- [ ] Les fonctions API existent (createEmployee, deleteEmployee, etc.)
- [ ] Les types TypeScript sont corrects
- [ ] Le `aria-label` est contextualisé
- [ ] La validation fonctionne
- [ ] Les toasts s'affichent correctement

---

**🎉 Snippets prêts à l'emploi ! Copy-paste et adaptez selon vos besoins.**

*Gain de temps estimé: **80% vs développement from scratch***
