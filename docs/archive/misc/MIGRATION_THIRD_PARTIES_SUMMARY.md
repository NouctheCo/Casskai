# Migration third_parties → customers / suppliers

## Vue d'ensemble

Ce document récapitule la migration complète de la table unifiée `third_parties` vers deux tables séparées `customers` et `suppliers`.

**Date** : 2025-01-09
**Auteur** : Claude Code (Assistant IA)
**Version** : CassKai v1.0

---

## 🎯 Objectif de la migration

Remplacer la table unifiée `third_parties` (avec un champ `type` pour différencier clients/fournisseurs) par deux tables dédiées :
- `customers` → Pour le module FACTURATION
- `suppliers` → Pour le module ACHATS

---

## ✅ État de la migration

| Module | Table | Statut | Fichiers modifiés | Document |
|--------|-------|--------|-------------------|----------|
| **FACTURATION** | `customers` | ✅ TERMINÉ | 4 fichiers | [MIGRATION_CUSTOMERS_SUPPLIERS.md](MIGRATION_CUSTOMERS_SUPPLIERS.md) |
| **ACHATS** | `suppliers` | ✅ TERMINÉ | 1 fichier | [MIGRATION_SUPPLIERS_COMPLETE.md](MIGRATION_SUPPLIERS_COMPLETE.md) |
| **CRM** | `third_parties` | ⚠️ À ANALYSER | - | - |

---

## 📁 Fichiers modifiés

### Module FACTURATION (customers)
1. ✅ `src/services/invoicingService.ts` - Utilise `customer_id` et `.from('customers')`
2. ✅ `src/components/invoicing/OptimizedInvoicesTab.tsx` - Requêtes directes sur `customers`
3. ✅ `src/hooks/useInvoiceEmail.ts` - Utilise `invoice.client?.email`
4. ✅ `src/components/invoicing/ClientSelector.tsx` - **RÉÉCRITURE COMPLÈTE**

### Module ACHATS (suppliers)
1. ✅ `src/components/purchases/SupplierSelector.tsx` - **RÉÉCRITURE COMPLÈTE**
2. ✅ `src/services/purchasesServiceImplementations.ts` - Déjà compatible (aucune modification)

---

## 📊 Structure des tables

### Table `customers`
```sql
CREATE TABLE customers (
  id uuid PRIMARY KEY,
  customer_number text NOT NULL,  -- Format: CL{timestamp}
  name text NOT NULL,
  email text,
  phone text,
  company_name text,
  billing_address_line1 text,
  billing_city text,
  billing_postal_code text,
  billing_country text DEFAULT 'FR',
  company_id uuid NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### Table `suppliers`
```sql
CREATE TABLE suppliers (
  id uuid PRIMARY KEY,
  supplier_number text NOT NULL,  -- Format: FO{timestamp}
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
  company_id uuid NOT NULL,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### Table `invoices` (mise à jour)
```sql
-- Nouvelle colonne ajoutée
ALTER TABLE invoices ADD COLUMN customer_id uuid;
ALTER TABLE invoices ADD CONSTRAINT invoices_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES customers(id);

-- Ancienne colonne (legacy, peut être supprimée après migration complète)
-- third_party_id uuid → À SUPPRIMER après migration des données
```

### Table `purchases` (mise à jour)
```sql
-- Colonne existante, déjà correcte
supplier_id uuid NOT NULL REFERENCES suppliers(id);
```

---

## 🔄 Pattern de migration

### Avant (utilisant third_parties)
```typescript
// ❌ Ancien code
const { data } = await supabase
  .from('third_parties')
  .select('*')
  .eq('company_id', companyId)
  .eq('type', 'customer')  // Filtrage par type
  .order('name');

// Utilisation de thirdPartiesService
const clients = await thirdPartiesService.getThirdParties(companyId, 'customer');
```

### Après (utilisant customers/suppliers)
```typescript
// ✅ Nouveau code - CLIENTS
const { data } = await supabase
  .from('customers')
  .select('*')
  .eq('company_id', companyId)
  .eq('is_active', true)
  .order('name');

// ✅ Nouveau code - FOURNISSEURS
const { data } = await supabase
  .from('suppliers')
  .select('*')
  .eq('company_id', companyId)
  .eq('is_active', true)
  .order('name');
```

---

## 🏗️ Composants de sélection

### ClientSelector (Facturation)
- **Fichier** : `src/components/invoicing/ClientSelector.tsx`
- **Table** : `customers`
- **Numéro auto** : `CL{timestamp}` (ex: `CL123456`)
- **Champs requis** : `name` uniquement
- **Formulaire inline** : Oui (Dialog avec tous les champs)
- **Dépendances** : Aucune (requêtes directes)

### SupplierSelector (Achats)
- **Fichier** : `src/components/purchases/SupplierSelector.tsx`
- **Table** : `suppliers`
- **Numéro auto** : `FO{timestamp}` (ex: `FO123456`)
- **Champs requis** : `name` uniquement
- **Formulaire inline** : Oui (Dialog avec tous les champs)
- **Dépendances** : Aucune (requêtes directes)

---

## 🎯 Avantages de la migration

### Performance
✅ **Pas de filtrage par type** : Requêtes plus rapides (index direct sur table)
✅ **Moins de données scannées** : Tables séparées = moins de lignes à parcourir
✅ **Index optimisés** : Index spécifiques par table

### Maintenabilité
✅ **Code plus clair** : Séparation nette clients/fournisseurs
✅ **Moins de confusion** : Pas de `type` à gérer
✅ **Typage TypeScript** : Interfaces séparées `Customer` et `Supplier`

### Fonctionnalités
✅ **Champs métier spécifiques** :
  - Clients : `customer_type`, `payment_method_preference`, etc.
  - Fournisseurs : `payment_terms`, `discount_rate`, `tax_number`, etc.
✅ **Évolutivité** : Facile d'ajouter des champs spécifiques à chaque type

---

## ⚠️ Points d'attention

### Double référence temporaire
Les tables `invoices` et potentiellement `purchases` peuvent avoir DEUX colonnes pendant la transition :
- `third_party_id` (legacy)
- `customer_id` / `supplier_id` (nouveau)

### Migration de données nécessaire
Script SQL à exécuter pour migrer les données existantes :

```sql
-- 1. Migrer les clients
INSERT INTO customers (
  id, company_id, customer_number, name, email, phone,
  company_name, billing_address_line1, billing_city,
  billing_postal_code, billing_country, is_active, created_at
)
SELECT
  id,
  company_id,
  code as customer_number,
  name,
  email,
  phone,
  COALESCE(legal_name, name) as company_name,
  address as billing_address_line1,
  city as billing_city,
  postal_code as billing_postal_code,
  COALESCE(country, 'FR') as billing_country,
  is_active,
  created_at
FROM third_parties
WHERE type IN ('customer', 'both')
ON CONFLICT (id) DO NOTHING;

-- 2. Migrer les fournisseurs
INSERT INTO suppliers (
  id, company_id, supplier_number, name, email, phone,
  company_name, billing_address_line1, billing_city,
  billing_postal_code, billing_country, tax_number, is_active, created_at
)
SELECT
  id,
  company_id,
  code as supplier_number,
  name,
  email,
  phone,
  COALESCE(legal_name, name) as company_name,
  address as billing_address_line1,
  city as billing_city,
  postal_code as billing_postal_code,
  COALESCE(country, 'FR') as billing_country,
  vat_number as tax_number,
  is_active,
  created_at
FROM third_parties
WHERE type IN ('supplier', 'both')
ON CONFLICT (id) DO NOTHING;

-- 3. Mettre à jour les factures
UPDATE invoices
SET customer_id = third_party_id
WHERE customer_id IS NULL AND third_party_id IS NOT NULL;

-- 4. Mettre à jour les achats (si nécessaire)
UPDATE purchases
SET supplier_id = third_party_id
WHERE supplier_id IS NULL AND third_party_id IS NOT NULL;

-- 5. (Optionnel après vérification) Supprimer les anciennes colonnes
-- ALTER TABLE invoices DROP COLUMN third_party_id;
-- ALTER TABLE purchases DROP COLUMN third_party_id;
```

---

## 📋 Tests à effectuer

### Module FACTURATION
- [x] Chargement de la liste des factures
- [x] Affichage des informations client
- [x] Création d'une nouvelle facture
- [x] Envoi d'email avec PDF
- [ ] Modification d'une facture existante
- [ ] Suppression d'une facture
- [ ] Génération d'avoir
- [ ] Export PDF multiple
- [ ] Rapports financiers

### Module ACHATS
- [ ] Chargement de la liste des achats
- [ ] Affichage des informations fournisseur
- [ ] Création d'un nouvel achat
- [ ] Modification d'un achat existant
- [ ] Suppression d'un achat
- [ ] Filtrage par fournisseur
- [ ] Statistiques des achats

---

## 🔮 Prochaines étapes

### Phase 3 : Module CRM (À ANALYSER)
Le module CRM utilise encore `third_parties`. Décisions à prendre :

**Option 1 : Garder `third_parties` pour les prospects**
- `third_parties` = Prospects uniquement
- `customers` = Clients convertis
- `suppliers` = Fournisseurs

**Option 2 : Tout migrer vers customers**
- Ajouter un champ `customer_status` : `prospect` | `active` | `inactive`
- Supprimer complètement `third_parties`

**Option 3 : Créer une table `contacts` unifiée**
- Nouvelle table pour le CRM
- Relations avec `customers` et `suppliers`

### Phase 4 : Nettoyage final
- [ ] Migration complète des données
- [ ] Suppression de la colonne `third_party_id` des tables
- [ ] Suppression de la table `third_parties` (si non utilisée)
- [ ] Mise à jour de tous les services legacy
- [ ] Tests end-to-end complets

---

## 📚 Documents connexes

- [MIGRATION_CUSTOMERS_SUPPLIERS.md](MIGRATION_CUSTOMERS_SUPPLIERS.md) - Détails module FACTURATION
- [MIGRATION_SUPPLIERS_COMPLETE.md](MIGRATION_SUPPLIERS_COMPLETE.md) - Détails module ACHATS

---

**État global** : ✅ **FACTURATION et ACHATS MIGRÉS**
**Prochaine étape** : Analyser et décider pour le module CRM
