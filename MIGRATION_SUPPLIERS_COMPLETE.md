# Migration suppliers - Module ACHATS

## Date : 2025-01-09

## Résumé
✅ **Migration TERMINÉE** : Le module ACHATS utilise maintenant la table `suppliers` au lieu de `third_parties`.

---

## ✅ Fichiers modifiés

### 1. **src/components/purchases/SupplierSelector.tsx** - RÉÉCRITURE COMPLÈTE
- ✅ Supprimé dépendance à `unifiedThirdPartiesService`
- ✅ Supprimé dépendance à `ThirdPartyFormDialog`
- ✅ Créé requête directe sur table `suppliers`
- ✅ Créé formulaire inline de création de fournisseur
- ✅ Génération automatique du `supplier_number` : format `FO{timestamp}`
- ✅ Interface `Supplier` avec les champs de la table `suppliers`

**Colonnes utilisées** :
```typescript
- id, name, email, phone
- company_name
- billing_address_line1, billing_city, billing_postal_code, billing_country
- supplier_number, is_active
```

**Code clé** :
```typescript
// Ligne 86-90 : Requête directe sur suppliers
const { data, error } = await supabase
  .from('suppliers')
  .select('id, name, email, phone, company_name, billing_city, billing_postal_code, billing_country')
  .eq('company_id', currentCompany.id)
  .eq('is_active', true)
  .order('name');

// Ligne 144-159 : Insertion directe avec auto-génération du supplier_number
const supplierNumber = `FO${Date.now().toString().slice(-6)}`;
await supabase.from('suppliers').insert({
  company_id: currentCompany.id,
  supplier_number: supplierNumber,
  name: newSupplierForm.name.trim(),
  // ... autres champs
  is_active: true
});
```

---

### 2. **src/services/purchasesServiceImplementations.ts** - DÉJÀ À JOUR ✅
- ✅ Utilise déjà `supplier_id` dans toutes les requêtes
- ✅ Ligne 372 : Utilise `.from('suppliers')` pour charger les fournisseurs
- ✅ Ligne 24, 54, 114, 148, 179, etc. : Toutes les références utilisent `supplier_id`

**Pas de modification nécessaire** : Le service était déjà compatible avec la nouvelle structure.

---

## Structure de la base de données

### Table `purchases`
```sql
CREATE TABLE purchases (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL,
  supplier_id uuid NOT NULL,  -- ✅ Référence la table suppliers
  invoice_number text,
  purchase_date date,
  due_date date,
  description text,
  subtotal_amount numeric,
  tax_amount numeric,
  total_amount numeric,
  payment_status text,
  ...
  CONSTRAINT purchases_supplier_id_fkey
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);
```

### Table `suppliers`
```sql
CREATE TABLE suppliers (
  id uuid PRIMARY KEY,
  supplier_number text NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  company_name text,
  tax_number text,
  billing_address_line1 text,
  billing_city text,
  billing_postal_code text,
  billing_country text DEFAULT 'FR',
  payment_terms integer,
  currency text DEFAULT 'EUR',
  discount_rate numeric,
  is_active boolean DEFAULT true,
  notes text,
  company_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

---

## Comparaison CLIENTS vs FOURNISSEURS

| Aspect | Clients (invoices) | Fournisseurs (purchases) |
|--------|-------------------|--------------------------|
| **Table** | `customers` | `suppliers` |
| **Sélecteur** | `ClientSelector.tsx` | `SupplierSelector.tsx` |
| **Numéro auto** | `CL{timestamp}` | `FO{timestamp}` |
| **Colonne FK** | `customer_id` | `supplier_id` |
| **Service** | `invoicingService` | `purchasesServiceImplementations` |
| **État** | ✅ Migré | ✅ Migré |

---

## Tests à effectuer

### ✅ À tester
- [ ] Chargement de la page Achats
- [ ] Liste des fournisseurs dans le sélecteur
- [ ] Création d'un nouveau fournisseur
- [ ] Création d'un achat avec un fournisseur existant
- [ ] Modification d'un achat
- [ ] Suppression d'un achat
- [ ] Filtrage par fournisseur
- [ ] Statistiques des achats

---

## Avantages de la migration

✅ **Séparation claire** : Clients et fournisseurs ont des tables dédiées
✅ **Performance** : Pas de filtrage par `type` nécessaire
✅ **Champs métier** : Champs spécifiques aux fournisseurs (payment_terms, discount_rate, etc.)
✅ **Code plus clair** : Moins de confusion entre clients et fournisseurs
✅ **Cohérence** : Même pattern que le module FACTURATION

---

## Notes importantes

### ⚠️ Données legacy
- Les anciens achats peuvent encore avoir des références à `third_parties`
- Migration de données nécessaire si des achats existent avec `third_party_id`

### 🔧 Script de migration (si nécessaire)
```sql
-- Migrer les fournisseurs de third_parties vers suppliers
INSERT INTO suppliers (id, company_id, supplier_number, name, email, phone, ...)
SELECT
  id,
  company_id,
  code as supplier_number,
  name,
  email,
  phone,
  ...
FROM third_parties
WHERE type IN ('supplier', 'both');

-- Mettre à jour les achats existants (si colonne third_party_id existe)
UPDATE purchases
SET supplier_id = third_party_id
WHERE supplier_id IS NULL AND third_party_id IS NOT NULL;
```

---

**Auteur** : Claude Code (Assistant IA)
**Version** : CassKai v1.0
**Date** : 2025-01-09
