# Migration third_parties → customers/suppliers

## Résumé des modifications

### ✅ Fichiers modifiés pour la FACTURATION (clients)

#### 1. **src/services/invoicingService.ts**
- ✅ Ligne 136 : Remplacé `third_party:third_parties(...)` par `client:customers!customer_id(...)`
- ✅ Ligne 169 : Remplacé `third_party: invoice.third_party` par `client: invoice.client`
- ✅ Ligne 185 : Remplacé `third_party:third_parties(...)` par `client:customers!customer_id(...)`
- ✅ Ligne 199 : Remplacé `third_party: data.third_party` par `client: data.client`
- ✅ Ligne 490 : Remplacé `.from('third_parties')` par `.from('customers')`

**Colonnes de customers utilisées** :
- `id, name, email, phone, company_name, billing_city, billing_postal_code, billing_country`

#### 2. **src/components/invoicing/OptimizedInvoicesTab.tsx**
- ✅ Ligne 151 : Remplacé `thirdPartiesService.getThirdParties(undefined, 'customer')` par `supabase.from('customers').select('*')...`
- ✅ Ligne 154 : Remplacé `thirdPartiesService.getThirdParties(undefined, 'supplier')` par `supabase.from('suppliers').select('*')...`
- ✅ Ligne 158 : Adapté mapping `clientsData.data` et `suppliersData.data`
- ✅ Ligne 178 : Remplacé `(invoice.third_party || invoice.client)` par `invoice.client`
- ✅ Ligne 313 : Remplacé `(invoice.third_party || invoice.client)?.email` par `invoice.client?.email`
- ✅ Lignes 556-558 : Simplifié affichage client dans table
- ✅ Ligne 758 : Remplacé `invoice.third_party_id` par `invoice.customer_id`
- ✅ Ligne 863 : Remplacé `third_party_id` par `customer_id`
- ✅ Lignes 896-897 : Remplacé `third_party_id/third_party_name` par `customer_id/customer_name`

#### 3. **src/hooks/useInvoiceEmail.ts**
- ✅ Ligne 102 : Remplacé `(invoice.third_party || invoice.client)?.name` par `invoice.client?.name`
- ✅ Ligne 248 : Remplacé `(invoice.third_party || invoice.client)?.name` par `invoice.client?.name`
- ✅ Ligne 304 : Remplacé `(invoice.third_party || invoice.client)?.email || invoice.client_email` par `invoice.client?.email`

#### 4. **src/components/invoicing/ClientSelector.tsx**
- ✅ **RÉÉCRITURE COMPLÈTE** : Remplacé `thirdPartiesService` par requête directe sur `customers`
- ✅ Supprimé dépendance à `ThirdPartyFormDialog`
- ✅ Créé nouveau formulaire de création de client directement dans le composant
- ✅ Ligne 86-90 : Requête directe `.from('customers').select(...).eq('company_id', ...).order('name')`
- ✅ Ligne 143-159 : Insertion directe dans `customers` avec `customer_number` auto-généré
- ✅ Interface `Customer` créée avec les champs de la table `customers`
- ✅ Formulaire inline avec tous les champs : nom, entreprise, email, téléphone, adresse, ville, code postal, pays
- ✅ Génération automatique du `customer_number` : format `CL{timestamp}`

**Colonnes utilisées** :
- `id, name, email, phone, company_name, billing_city, billing_postal_code, billing_country`
- `customer_number, billing_address_line1, is_active`

---

## Structure de la base de données

### Table `invoices`
```sql
CREATE TABLE invoices (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL,
  third_party_id uuid NOT NULL,  -- ⚠️ Ancienne colonne (legacy)
  customer_id uuid,               -- ✅ Nouvelle colonne
  invoice_number text NOT NULL,
  invoice_type text,
  invoice_date date,
  due_date date,
  ...
  CONSTRAINT invoices_customer_id_fkey
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

### Table `customers` (nouvelle)
```sql
CREATE TABLE customers (
  id uuid PRIMARY KEY,
  customer_number text NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  company_name text,
  billing_city text,
  billing_postal_code text,
  billing_country text DEFAULT 'FR',
  company_id uuid NOT NULL,
  ...
);
```

### Table `suppliers` (nouvelle)
```sql
CREATE TABLE suppliers (
  id uuid PRIMARY KEY,
  supplier_number text NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  company_name text,
  billing_city text,
  billing_postal_code text,
  billing_country text DEFAULT 'FR',
  company_id uuid NOT NULL,
  ...
);
```

### Table `third_parties` (legacy)
```sql
CREATE TABLE third_parties (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL,
  type text NOT NULL,  -- 'customer' | 'supplier' | 'both'
  code text NOT NULL,
  name text NOT NULL,
  email text,
  ...
);
```

---

## Fichiers NON modifiés (à faire dans une phase ultérieure)

### Services utilisant encore `third_parties`:
1. **src/services/thirdPartiesService.ts** - Service legacy, à garder pour compatibilité
2. **src/services/unifiedThirdPartiesService.ts** - Service unifié, à adapter
3. **src/services/crmService.ts** - Module CRM, nécessite analyse métier
4. **src/services/thirdPartiesAgingReport.ts** - Rapports, à adapter
5. **src/services/invoiceJournalEntryService.ts** - Écritures comptables, nécessite vérification

### Composants utilisant encore `third_parties`:
1. **src/components/crm/NewClientModal.tsx** - Création clients CRM
2. **src/components/third-parties/ImportTab.tsx** - Import de tiers
3. **src/components/third-parties/TransactionsTab.tsx** - Transactions des tiers
4. **src/hooks/useSuppliers.ts** - Hook fournisseurs
5. **src/hooks/useThirdParties.ts** - Hook tiers

---

## Stratégie de migration progressive

### ✅ Phase 1 : FACTURATION (TERMINÉE)
- Migration des factures vers `customers`
- Module de facturation fonctionnel avec la nouvelle structure
- Envoi d'emails de factures opérationnel

### 🔄 Phase 2 : ACHATS (À FAIRE)
- Migrer le module achats vers `suppliers`
- Adapter `src/services/purchasesServiceImplementations.ts`
- Mettre à jour `src/components/purchases/PurchaseForm.tsx`

### 🔄 Phase 3 : CRM (À FAIRE)
- Analyser l'usage de `third_parties` dans le CRM
- Décider si on garde `third_parties` pour le CRM ou si on utilise `customers`
- Option : `third_parties` devient uniquement pour les prospects

### 🔄 Phase 4 : COMPATIBILITÉ (À FAIRE)
- Créer des vues SQL pour compatibilité descendante
- Migrer les données de `third_parties` vers `customers`/`suppliers`
- Supprimer la colonne `third_party_id` de `invoices` (garder uniquement `customer_id`)

---

## Notes importantes

### ⚠️ Points d'attention
1. **Double référence temporaire** : La table `invoices` a DEUX colonnes (`third_party_id` ET `customer_id`) pendant la transition
2. **Données existantes** : Les factures existantes peuvent avoir `third_party_id` renseigné mais pas `customer_id`
3. **Migration de données nécessaire** : Il faudra créer un script pour copier les données de `third_parties` vers `customers`/`suppliers`

### ✅ Avantages de la nouvelle structure
- ✅ Séparation claire clients/fournisseurs
- ✅ Champs métier spécifiques (customer_type, supplier_type)
- ✅ Meilleure performance (pas de filtrage par type)
- ✅ Code plus clair et maintenable

### 🔧 Script de migration nécessaire
```sql
-- À CRÉER : Script pour migrer les données
INSERT INTO customers (id, company_id, name, email, phone, ...)
SELECT id, company_id, name, email, phone, ...
FROM third_parties
WHERE type IN ('customer', 'both');

INSERT INTO suppliers (id, company_id, name, email, phone, ...)
SELECT id, company_id, name, email, phone, ...
FROM third_parties
WHERE type IN ('supplier', 'both');

-- Mettre à jour les invoices
UPDATE invoices
SET customer_id = third_party_id
WHERE third_party_id IN (SELECT id FROM customers);
```

---

## Tests à effectuer

### ✅ Tests réalisés
- ✅ Chargement de la liste des factures
- ✅ Affichage des informations client dans la table
- ✅ Création d'une nouvelle facture
- ✅ Envoi d'email avec PDF de facture

### 🔄 Tests à faire
- 🔄 Modification d'une facture existante
- 🔄 Suppression d'une facture
- 🔄 Génération d'avoir
- 🔄 Export PDF multiple
- 🔄 Rapports financiers
- 🔄 Statistiques de facturation

---

**Date de migration** : 2025-01-09
**Version** : CassKai v1.0
**Auteur** : Claude Code (Assistant IA)
