# Guide d'intégration du composant EntitySelector

## 🎯 Objectif

Le composant `EntitySelector` permet de **sélectionner ou créer des entités à la volée** dans tous les formulaires de CassKai, évitant ainsi les redondances de données et améliorant l'expérience utilisateur.

## 📦 Principe

**Une seule source de vérité** : Chaque entité (article, client, fournisseur, compte, etc.) est stockée dans son module d'origine et peut être référencée partout ailleurs.

```
┌──────────────┐         ┌──────────────┐
│ Facturation  │ ───────>│  Inventory   │
│              │ Réf.    │   Articles   │
│ Facture#123  │         └──────────────┘
│ - Article A  │               ↑
│ - Article B  │         Référence unique
└──────────────┘         Pas de duplication
```

## 🚀 Utilisation de base

### 1. Import

```typescript
import { EntitySelector } from '@/components/common/EntitySelector';
import { inventoryItemsService } from '@/services/inventoryItemsService';
```

### 2. Préparer les options

```typescript
const [inventoryItems, setInventoryItems] = useState([]);

useEffect(() => {
  const loadItems = async () => {
    const result = await inventoryItemsService.getItems(companyId);
    if (result.success) {
      setInventoryItems(result.data);
    }
  };
  loadItems();
}, [companyId]);

const itemOptions = inventoryItems.map(item => ({
  id: item.id,
  label: item.name,
  sublabel: `${item.reference} - ${item.selling_price}€`,
  metadata: item
}));
```

### 3. Utiliser le composant

```typescript
<EntitySelector
  options={itemOptions}
  value={selectedItemId}
  onChange={setSelectedItemId}
  entityName="un article"
  entityNamePlural="des articles"
  placeholder="Sélectionner un article"
  searchPlaceholder="Rechercher un article..."
  emptyMessage="Aucun article trouvé"
  canCreate={true}
  createFormFields={[
    {
      name: 'reference',
      label: 'Référence',
      type: 'text',
      required: true,
      placeholder: 'REF-001'
    },
    {
      name: 'name',
      label: 'Nom de l\'article',
      type: 'text',
      required: true,
      placeholder: 'Ordinateur portable'
    },
    {
      name: 'category',
      label: 'Catégorie',
      type: 'select',
      required: true,
      options: [
        { value: 'hardware', label: 'Matériel informatique' },
        { value: 'software', label: 'Logiciels' },
        { value: 'services', label: 'Services' }
      ]
    },
    {
      name: 'purchase_price',
      label: 'Prix d\'achat (€)',
      type: 'number',
      required: true,
      placeholder: '100.00'
    },
    {
      name: 'selling_price',
      label: 'Prix de vente (€)',
      type: 'number',
      required: true,
      placeholder: '150.00'
    }
  ]}
  onCreateEntity={async (data) => {
    const result = await inventoryItemsService.createItem(companyId, {
      reference: data.reference,
      name: data.name,
      category: data.category,
      unit: 'Pièce',
      purchase_price: data.purchase_price,
      selling_price: data.selling_price
    });

    if (result.success) {
      // Rafraîchir la liste
      await loadItems();
      return { success: true, id: result.data.id };
    }

    return { success: false, error: result.error };
  }}
/>
```

## 📋 Cas d'usage par module

### 1. **Facturation** → Articles (Inventory)

**Fichier**: `src/components/invoicing/OptimizedInvoicesTab.tsx`

```typescript
// Dans le formulaire de création de facture
<EntitySelector
  options={inventoryItemOptions}
  value={invoiceLineItem}
  onChange={setInvoiceLineItem}
  entityName="un article"
  canCreate={true}
  createFormFields={[
    { name: 'reference', label: 'Référence', type: 'text', required: true },
    { name: 'name', label: 'Nom', type: 'text', required: true },
    { name: 'selling_price', label: 'Prix HT', type: 'number', required: true },
    { name: 'unit', label: 'Unité', type: 'select', options: [
      { value: 'Pièce', label: 'Pièce' },
      { value: 'Heure', label: 'Heure' }
    ]}
  ]}
  onCreateEntity={handleCreateArticle}
/>
```

**Bénéfices**:
- Article créé dans Inventory
- Disponible immédiatement dans la facture
- Réutilisable dans futures factures
- Stock automatiquement mis à jour

### 2. **Facturation** → Clients (CRM)

```typescript
<EntitySelector
  options={clientOptions}
  value={selectedClient}
  onChange={setSelectedClient}
  entityName="un client"
  canCreate={true}
  createFormFields={[
    { name: 'name', label: 'Nom du client', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Téléphone', type: 'text' },
    { name: 'address', label: 'Adresse', type: 'textarea' }
  ]}
  onCreateEntity={handleCreateClient}
/>
```

### 3. **Achats** → Fournisseurs

```typescript
<EntitySelector
  options={supplierOptions}
  value={selectedSupplier}
  onChange={setSelectedSupplier}
  entityName="un fournisseur"
  canCreate={true}
  createFormFields={[
    { name: 'name', label: 'Nom du fournisseur', type: 'text', required: true },
    { name: 'contact_email', label: 'Email', type: 'email', required: true },
    { name: 'siret', label: 'SIRET', type: 'text' }
  ]}
  onCreateEntity={handleCreateSupplier}
/>
```

### 4. **Comptabilité** → Comptes du plan comptable

```typescript
<EntitySelector
  options={accountOptions}
  value={selectedAccount}
  onChange={setSelectedAccount}
  entityName="un compte"
  canCreate={true}
  createFormFields={[
    { name: 'account_number', label: 'Numéro de compte', type: 'text', required: true },
    { name: 'name', label: 'Libellé', type: 'text', required: true },
    { name: 'type', label: 'Type', type: 'select', options: [
      { value: 'asset', label: 'Actif' },
      { value: 'liability', label: 'Passif' },
      { value: 'equity', label: 'Capitaux propres' },
      { value: 'revenue', label: 'Produit' },
      { value: 'expense', label: 'Charge' }
    ]}
  ]}
  onCreateEntity={handleCreateAccount}
/>
```

### 5. **Projets** → Employés (RH)

```typescript
<EntitySelector
  options={employeeOptions}
  value={selectedEmployee}
  onChange={setSelectedEmployee}
  entityName="un employé"
  canCreate={true}
  createFormFields={[
    { name: 'first_name', label: 'Prénom', type: 'text', required: true },
    { name: 'last_name', label: 'Nom', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'position', label: 'Poste', type: 'text' }
  ]}
  onCreateEntity={handleCreateEmployee}
/>
```

## 🔧 Services à créer

Pour chaque entité, créer un service dans `src/services/` :

```typescript
// Exemple: clientsService.ts
class ClientsService {
  async getClients(companyId: string): Promise<ServiceResult<Client[]>> {
    // Implémentation
  }

  async createClient(companyId: string, data: CreateClientPayload): Promise<ServiceResult<Client>> {
    // Implémentation
  }
}

export const clientsService = new ClientsService();
```

## ✅ Checklist d'intégration

Pour chaque formulaire du projet :

- [ ] **Identifier les entités référencées** (articles, clients, fournisseurs, etc.)
- [ ] **Créer/utiliser le service** correspondant
- [ ] **Remplacer les selects simples** par `EntitySelector`
- [ ] **Définir les champs** du formulaire de création
- [ ] **Implémenter `onCreateEntity`** avec le service
- [ ] **Rafraîchir la liste** après création
- [ ] **Tester** la création et la sélection

## 🎨 UX/UI

### Avant
```
┌────────────────────────────┐
│ Article:                   │
│ ┌────────────────────────┐ │
│ │ Sélectionner...       ▼││
│ └────────────────────────┘ │
│                            │
│ Si article manquant:       │
│ 1. Aller dans Inventory    │
│ 2. Créer l'article         │
│ 3. Revenir à la facture    │
│ 4. Re-sélectionner         │
└────────────────────────────┘
```

### Après (avec EntitySelector)
```
┌────────────────────────────┐
│ Article:                   │
│ ┌────────────────────────┐ │
│ │ 🔍 Rechercher...      ▼││
│ └────────────────────────┘ │
│ ┌────────────────────────┐ │
│ │ ➕ Créer un article    │ │ ← Création directe !
│ └────────────────────────┘ │
│                            │
│ → Dialog de création       │
│ → Sauvegarde automatique   │
│ → Sélection automatique    │
└────────────────────────────┘
```

## 🚧 Modules à intégrer

| Module | Entités à intégrer | Priorité | Statut |
|--------|-------------------|----------|--------|
| **Facturation** | Articles, Clients | 🔴 Haute | ⏳ En cours |
| **Achats** | Articles, Fournisseurs | 🔴 Haute | 📋 À faire |
| **Comptabilité** | Comptes, Journaux | 🟡 Moyenne | 📋 À faire |
| **Projets** | Clients, Employés | 🟡 Moyenne | 📋 À faire |
| **CRM** | Clients, Produits | 🟢 Basse | 📋 À faire |
| **RH** | Employés, Postes | 🟢 Basse | 📋 À faire |

## 💡 Bonnes pratiques

1. **Toujours rafraîchir la liste** après création
2. **Gérer les erreurs** avec des messages clairs
3. **Valider les champs requis** avant l'envoi
4. **Utiliser des placeholders** explicites
5. **Tester la performance** avec beaucoup d'entités (>1000)
6. **Implémenter la recherche** côté serveur si nécessaire
7. **Ajouter des indices visuels** (icônes, couleurs) pour différencier les types

## 🎯 Résultat attendu

✅ **Pas de redondance de données**
✅ **Workflow fluide** (pas de changement de page)
✅ **Une seule source de vérité** par entité
✅ **Cohérence** des données dans tout le système
✅ **Gain de temps** pour l'utilisateur
✅ **Expérience moderne** et professionnelle

---

**Date**: 2025-10-12
**Version**: 1.0
**Auteur**: CassKai Development Team
