# 🔄 Stratégie d'Unification des Tiers

**Date** : 2025-01-04
**Problème** : Duplication et incohérence entre modules Invoicing et ThirdParties

---

## 🔍 Situation Actuelle

### Problèmes Identifiés

1. **Duplication des données**
   - Module **Invoicing** : Gère des "clients" avec données mockées (pas de vrai stockage Supabase)
   - Module **ThirdParties** : Service cherche une table `third_parties` qui n'existe pas

2. **Incohérence des tables**
   - Tables Supabase réelles : `customers` + `suppliers`
   - Service `thirdPartiesService.ts` cherche : `third_parties` (❌ n'existe pas)
   - Vue unifiée existe : `third_parties_unified` (✅ combine customers + suppliers)

3. **Pas de synchronisation**
   - Créer un client dans Invoicing → N'apparaît pas dans ThirdParties
   - Créer un fournisseur → Pas visible dans les autres modules

---

## 🎯 Architecture Cible

### Tables Supabase (existantes)

```
customers
├── id (UUID)
├── company_id (UUID) → companies.id
├── customer_number (TEXT unique)
├── name (TEXT)
├── email (TEXT)
├── phone (TEXT)
├── company_name (TEXT)
├── tax_number (TEXT)
├── billing_address_* (colonnes adresse)
├── payment_terms (INTEGER)
├── currency (TEXT)
├── discount_rate (NUMERIC)
├── credit_limit (NUMERIC)
├── is_active (BOOLEAN)
├── notes (TEXT)
├── created_at / updated_at

suppliers
├── id (UUID)
├── company_id (UUID) → companies.id
├── supplier_number (TEXT unique)
├── name (TEXT)
├── email (TEXT)
├── phone (TEXT)
├── company_name (TEXT)
├── tax_number (TEXT)
├── billing_address_* (colonnes adresse)
├── payment_terms (INTEGER)
├── currency (TEXT)
├── discount_rate (NUMERIC)
├── is_active (BOOLEAN)
├── notes (TEXT)
├── created_at / updated_at

third_parties_unified (VUE)
├── party_type ('customer' | 'supplier')
├── id
├── company_id
├── party_number
├── name
├── email
├── phone
├── ... (tous les champs combinés)
├── total_amount (agrégé depuis invoices/purchases)
├── transaction_count
├── balance
```

### Tables Complémentaires

```
contacts
├── customer_id OU supplier_id
├── first_name, last_name
├── job_title, department
├── email, phone, mobile
├── is_primary

third_party_addresses
├── customer_id OU supplier_id
├── address_type (billing, shipping, office, etc.)
├── street, city, postal_code, country
├── is_default

third_party_documents
├── customer_id OU supplier_id
├── document_type
├── file_url
├── expiry_date

third_party_categories
├── code, name, description
├── applies_to_customers / applies_to_suppliers
```

---

## ✅ Solution Proposée

### 1. Service Unifié : `unifiedThirdPartiesService.ts`

**Responsabilités** :
- CRUD sur `customers` et `suppliers`
- Génération automatique des numéros (customer_number, supplier_number)
- Gestion des contacts, adresses, documents
- Requêtes via la vue `third_parties_unified` pour lecture
- Support des types : `'customer'`, `'supplier'`, `'both'` (peut être les 2)

**Avantages** :
- ✅ Une seule source de vérité
- ✅ API cohérente pour tous les modules
- ✅ Sync automatique

### 2. Composants Réutilisables

**`ThirdPartyFormDialog.tsx`** (nouveau)
- Formulaire générique pour créer/éditer un tiers
- Props : `type: 'customer' | 'supplier' | 'both'`
- Sections : Infos générales, Adresse, Contact, Finance
- Validation Zod
- Sauvegarde dans la bonne table (`customers` ou `suppliers`)

**`ThirdPartySelector.tsx`** (nouveau)
- Select/Combobox pour choisir un tiers
- Autocomplete avec recherche
- Bouton "Créer nouveau" intégré
- Utilisable dans : Invoices, Quotes, Purchases, Contracts, etc.

### 3. Refactorisation des Modules

#### Module Invoicing
**Avant** :
```typescript
// Données mockées, pas de Supabase
const [clients, setClients] = useState([
  { id: Date.now(), name: 'Client 1', ... }
]);
```

**Après** :
```typescript
import { unifiedThirdPartiesService } from '@/services/unifiedThirdPartiesService';

// Vraies données depuis Supabase
const { data: customers } = await unifiedThirdPartiesService.getCustomers(companyId);

// Créer un client
await unifiedThirdPartiesService.createCustomer(companyId, formData);
```

#### Module ThirdParties
**Avant** :
```typescript
// Cherche table inexistante
const { data } = await supabase.from('third_parties').select('*');
```

**Après** :
```typescript
// Utilise la vue unifiée
const { data } = await supabase.from('third_parties_unified')
  .select('*')
  .eq('company_id', companyId);
```

### 4. Hooks Partagés

**`useThirdParties.ts`** (à mettre à jour)
```typescript
export function useThirdParties(type?: 'customer' | 'supplier') {
  const { data: thirdParties, isLoading } = useQuery({
    queryKey: ['third-parties', companyId, type],
    queryFn: () => unifiedThirdPartiesService.getThirdParties(companyId, type)
  });

  const createMutation = useMutation({
    mutationFn: (data) => unifiedThirdPartiesService.create(companyId, type, data),
    onSuccess: () => queryClient.invalidateQueries(['third-parties'])
  });

  return { thirdParties, isLoading, create: createMutation.mutate };
}
```

**`useCustomers.ts`** (alias pour compatibilité)
```typescript
export function useCustomers() {
  return useThirdParties('customer');
}
```

**`useSuppliers.ts`** (alias pour compatibilité)
```typescript
export function useSuppliers() {
  return useThirdParties('supplier');
}
```

---

## 📋 Plan d'Implémentation

### Phase 1 : Service Unifié (Priorité HAUTE)
- [x] Analyser structure actuelle
- [ ] Créer `src/services/unifiedThirdPartiesService.ts`
- [ ] Implémenter CRUD customers
- [ ] Implémenter CRUD suppliers
- [ ] Fonction génération numéros automatiques
- [ ] Tests unitaires service

### Phase 2 : Composants Réutilisables
- [ ] Créer `ThirdPartyFormDialog.tsx`
- [ ] Créer `ThirdPartySelector.tsx`
- [ ] Créer `ThirdPartyCard.tsx` (affichage uniforme)
- [ ] Validation Zod schemas

### Phase 3 : Mise à Jour ThirdPartiesPage
- [ ] Remplacer `thirdPartiesService` par `unifiedThirdPartiesService`
- [ ] Intégrer `ThirdPartyFormDialog` pour création
- [ ] Ajouter onglets Clients / Fournisseurs / Tous
- [ ] Dashboard avec KPIs unifiés

### Phase 4 : Refactorisation Invoicing
- [ ] Remplacer données mockées par vraies requêtes Supabase
- [ ] Utiliser `ThirdPartySelector` pour sélection client
- [ ] Bouton "Créer client" ouvre `ThirdPartyFormDialog`
- [ ] Sync automatique avec ThirdPartiesPage

### Phase 5 : Autres Modules
- [ ] **Purchases** : Utiliser `unifiedThirdPartiesService` pour fournisseurs
- [ ] **Contracts** : Sélecteur de tiers avec les 2 types
- [ ] **Projects** : Client associé au projet
- [ ] **CRM** : Intégration complète avec customers

### Phase 6 : Features Avancées
- [ ] Gestion contacts multiples
- [ ] Gestion adresses multiples (billing/shipping)
- [ ] Upload documents (KYC, contrats, etc.)
- [ ] Catégories personnalisées
- [ ] Historique des transactions
- [ ] Balance âgée (aging report)
- [ ] Limites de crédit et alertes

---

## 🔄 Flux de Données

### Création d'un Client

```
Module Invoicing (OptimizedClientsTab.tsx)
│
├─> Bouton "Nouveau client"
│
├─> Ouvre ThirdPartyFormDialog({ type: 'customer' })
│
├─> Utilisateur remplit formulaire
│
├─> Submit → unifiedThirdPartiesService.createCustomer(...)
│
├─> INSERT INTO customers (company_id, name, email, ...)
│
├─> Retour ID du client
│
├─> Invalidation cache React Query ['third-parties']
│
├─> Rafraîchissement automatique dans :
    ├─> Module Invoicing (liste clients)
    ├─> Module ThirdParties (vue unifiée)
    ├─> Tous les ThirdPartySelector
    └─> Dashboard KPIs
```

### Sélection d'un Client dans une Facture

```
Composant InvoiceForm
│
├─> <ThirdPartySelector type="customer" />
│
├─> Autocomplete depuis customers (Supabase)
│
├─> Si client pas trouvé → Bouton "Créer nouveau"
│
├─> ThirdPartyFormDialog s'ouvre
│
├─> Création du client (voir flux ci-dessus)
│
├─> Retour automatique dans le selector avec le nouveau client
│
└─> Peut continuer la création de facture
```

---

## 🎨 Interfaces Utilisateur

### Page ThirdParties

```
┌────────────────────────────────────────────────────────────┐
│ 📊 Tableau de Bord Tiers                                   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  [👥 100 Clients] [🏢 50 Fournisseurs] [💰 150K€ CA]     │
│                                                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │ [Tous] [Clients] [Fournisseurs]   [+ Nouveau]    │    │
│  ├──────────────────────────────────────────────────┤    │
│  │                                                   │    │
│  │  🔍 Rechercher...        [Type ▼] [Statut ▼]    │    │
│  │                                                   │    │
│  │  ┌─────────────────────────────────────────┐    │    │
│  │  │ Type │ Nom         │ Email   │ Solde    │    │    │
│  │  ├─────────────────────────────────────────┤    │    │
│  │  │ 👤   │ Acme Corp   │ acme@   │ 5 000€   │    │    │
│  │  │ 🏢   │ FourniX     │ four@   │ -2 000€  │    │    │
│  │  └─────────────────────────────────────────┘    │    │
│  └──────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────┘
```

### Dialog Création Tiers

```
┌────────────────────────────────────────────────┐
│ ✨ Nouveau Tiers                               │
├────────────────────────────────────────────────┤
│                                                │
│  Type : [●Client] [○Fournisseur] [○Les deux]  │
│                                                │
│  Nom *         : [________________]            │
│  Société       : [________________]            │
│  Email *       : [________________]            │
│  Téléphone     : [________________]            │
│                                                │
│  --- Adresse de facturation ---               │
│  Rue           : [________________]            │
│  Ville         : [________________]            │
│  Code postal   : [______]                      │
│  Pays          : [France ▼]                    │
│                                                │
│  --- Paramètres commerciaux ---               │
│  Conditions pmt: [30 jours]                    │
│  Limite crédit : [10 000 €]                    │
│  Remise        : [5 %]                         │
│                                                │
│  [Annuler]               [Créer le tiers]      │
└────────────────────────────────────────────────┘
```

---

## 🧪 Tests à Effectuer

### Test 1 : Création Client dans Invoicing
1. Aller dans Invoicing > Clients
2. Cliquer "Nouveau client"
3. Remplir formulaire et sauvegarder
4. ✅ Client apparaît dans liste Invoicing
5. ✅ Aller dans ThirdParties → Client visible
6. ✅ Dashboard KPIs mis à jour

### Test 2 : Synchronisation Cross-Module
1. Créer un fournisseur dans ThirdParties
2. Aller dans Purchases
3. ✅ Fournisseur disponible dans selector
4. Modifier le fournisseur dans ThirdParties
5. ✅ Changements visibles dans Purchases

### Test 3 : Sélecteur Intelligent
1. Créer une nouvelle facture
2. Commencer à taper nom client
3. ✅ Autocomplete fonctionne
4. Taper nom inexistant
5. ✅ Bouton "Créer nouveau" apparaît
6. Cliquer, créer client, retour automatique

---

## ⚠️ Points d'Attention

### Migration des Données Existantes
Si des données mockées existent dans localStorage ou état local :
- Script de migration pour transformer en vraies entrées Supabase
- Vérifier que pas de doublons (matching par email/nom)

### Performance
- Utiliser React Query pour cache intelligent
- Pagination pour grandes listes (>1000 tiers)
- Index Supabase sur `company_id`, `email`, `name`
- Debounce sur recherche autocomplete

### Sécurité
- RLS Supabase : Un user ne voit que les tiers de son company
- Validation backend des permissions
- Pas d'exposition des IDs sensibles

### UX
- Messages de succès clairs ("Client créé et disponible partout")
- Loading states pendant création
- Optimistic updates pour réactivité
- Undo pour suppressions accidentelles

---

## 🚀 Gains Attendus

### Pour les Utilisateurs
- ✅ **Cohérence** : Un seul endroit de vérité pour les tiers
- ✅ **Productivité** : Créer un tiers une fois, utilisable partout
- ✅ **Visibilité** : Historique complet des transactions
- ✅ **Contrôle** : Limites de crédit, alertes, catégories

### Pour le Code
- ✅ **Maintenabilité** : Un seul service à maintenir
- ✅ **Réutilisabilité** : Composants partagés entre modules
- ✅ **Testabilité** : Tests centralisés
- ✅ **Scalabilité** : Architecture propre pour features futures

### Pour la Base de Données
- ✅ **Intégrité** : Relations FK garanties
- ✅ **Performance** : Requêtes optimisées via vue unifiée
- ✅ **Reporting** : Statistiques cross-modules faciles

---

*Date : 2025-01-04*
*Auteur : Claude (Anthropic)*
*Status : 📋 Stratégie validée, prêt pour implémentation*
