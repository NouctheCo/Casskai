# Audit Module Inventaire - CassKai

**Date**: 2025-01-09
**Status**: Module partiellement implémenté

---

## 📦 1. Fichiers Existants

### Pages
- ✅ `src/pages/InventoryPage.tsx` - Page principale avec 6 onglets

### Composants (`src/components/inventory/`)
```
✅ AlertsTab.tsx              (5.2 KB) - Alertes de stock
✅ ArticleSelector.tsx         (5.5 KB) - Sélecteur d'articles
✅ DashboardTab.tsx            (3.0 KB) - Tableau de bord
✅ InventoryDialogs.tsx       (25.0 KB) - Dialogs de gestion
✅ InventoryHeader.tsx         (2.1 KB) - En-tête de la page
✅ InventoryStats.tsx          (2.3 KB) - Statistiques
✅ MovementsTab.tsx            (9.9 KB) - Mouvements de stock
✅ NewArticleModal.tsx        (23.9 KB) - Création d'articles
✅ ProductionTab.tsx           (2.2 KB) - Production
✅ ProductsTab.tsx            (10.2 KB) - Liste des produits
✅ SuppliersTab.tsx            (4.0 KB) - Fournisseurs
```

### Composants Production (`src/components/inventory/production/`)
```
✅ ProductionFiltersCard.tsx
✅ ProductionOrderCard.tsx
✅ ProductionOrdersPanel.tsx
✅ ProductionSidebar.tsx
✅ ProductionSummary.tsx
```

### Services
```
✅ src/services/inventoryService.ts          - Service principal inventaire
✅ src/services/articlesService.ts           - Service articles (table articles)
✅ src/services/warehousesService.ts         - Service entrepôts
✅ src/services/productionOrdersService.ts   - Ordres de production
✅ src/services/suppliersService.ts          - Fournisseurs
```

### Services Inventaire Organisés (`src/services/inventory/`)
```
✅ inventory-calculations.ts    - Calculs de métriques
✅ inventory-normalizers.ts     - Normalisation des données
✅ inventory-validations.ts     - Validations
✅ inventory-queries.ts         - Requêtes SQL
✅ types/inventory-db.types.ts  - Types DB
```

### Hooks
```
✅ src/hooks/useInventory.ts
✅ src/hooks/useInventoryPageController.ts
```

### Types
```
✅ src/types/inventory.ts
✅ src/types/production.ts
```

### Modules
```
✅ src/modules/inventory/inventoryModule.ts
```

---

## 🗄️ 2. Tables de Base de Données Utilisées

### Table `articles` ✅ EXISTE
```sql
CREATE TABLE articles (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL,
  reference text NOT NULL,
  barcode text,
  name text NOT NULL,
  description text,
  category text,
  unit text NOT NULL,
  purchase_price numeric NOT NULL,
  selling_price numeric NOT NULL,
  tva_rate numeric NOT NULL,
  stock_quantity numeric DEFAULT 0,
  stock_min numeric DEFAULT 0,
  stock_max numeric,
  warehouse_id uuid,
  supplier_id uuid,
  supplier_reference text,
  purchase_account_id uuid,
  sales_account_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### Table `warehouses` ✅ EXISTE
```sql
CREATE TABLE warehouses (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  address_line1 text,
  address_line2 text,
  city text,
  postal_code text,
  country text,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  warehouse_type text,
  contact_person text,
  contact_email text,
  contact_phone text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### Tables Manquantes ❌
```
❌ stock_movements          - Mouvements de stock (entrées/sorties)
❌ inventory_items          - Items d'inventaire par entrepôt
❌ inventory_adjustments    - Ajustements d'inventaire
❌ inventory_counts         - Comptages physiques
❌ product_locations        - Emplacements dans l'entrepôt
❌ inventory_batches        - Gestion par lots
❌ inventory_serials        - Gestion par numéros de série
```

---

## 🐛 3. Bug Critique Identifié

### ❌ ArticlesService utilise `third_parties` (obsolète)

**Fichier**: `src/services/articlesService.ts`

**Lignes concernées**: 94, 125, 139, 152, 279, 292

**Problème**: Le service fait des joins sur `third_parties:supplier_id (name)` qui n'existe plus.

**Exemple ligne 94**:
```typescript
.select(`
  *,
  warehouses:warehouse_id (name),
  third_parties:supplier_id (name),        // ❌ ERREUR
  purchase_account:purchase_account_id (account_number),
  sales_account:sales_account_id (account_number)
`)
```

**Correction nécessaire**:
```typescript
.select(`
  *,
  warehouses:warehouse_id (name),
  supplier:suppliers!supplier_id (name),   // ✅ CORRECT
  purchase_account:purchase_account_id (account_number),
  sales_account:sales_account_id (account_number)
`)
```

**Impact**: Toutes les requêtes sur les articles qui tentent de charger le nom du fournisseur vont échouer.

---

## ✅ 4. Fonctionnalités Existantes

### Dashboard (Tab 1)
- ✅ Vue d'ensemble des stocks
- ✅ Métriques principales
- ✅ Graphiques

### Produits (Tab 2)
- ✅ Liste des articles
- ✅ Filtrage (catégorie, entrepôt, recherche)
- ✅ Création d'article via modal
- ✅ Modification d'article
- ✅ Activation/désactivation
- ✅ Affichage stock min/max
- ✅ Calcul valeur totale

### Mouvements (Tab 3)
- ✅ Historique des mouvements
- ✅ Filtres (type, produit, dates)
- ✅ Types: entry, exit, adjustment, transfer
- ⚠️ **Pas de table DB** - Stockage en mémoire uniquement?

### Production (Tab 4)
- ✅ Ordres de production
- ✅ Composants
- ✅ Suivi statut
- ✅ KPIs production
- ✅ Service dédié `productionOrdersService`

### Fournisseurs (Tab 5)
- ✅ Liste fournisseurs
- ✅ Statistiques par fournisseur
- ⚠️ Service `suppliersService` - vérifie s'il utilise aussi `third_parties`

### Alertes (Tab 6)
- ✅ Alertes stock bas
- ✅ Alertes rupture
- ✅ Configuration seuils

---

## ❌ 5. Fonctionnalités Manquantes

### Gestion des Stocks
```
❌ Table stock_movements
❌ Entrées de stock physiques (réceptions)
❌ Sorties de stock physiques (expéditions)
❌ Transferts entre entrepôts
❌ Ajustements d'inventaire persistants
❌ Réservations de stock
❌ Stock disponible vs réservé
```

### Inventaires Physiques
```
❌ Table inventory_counts
❌ Création de comptages
❌ Saisie des comptages par produit
❌ Comparaison comptage vs théorique
❌ Génération d'écritures d'ajustement
❌ Historique des comptages
```

### Gestion Avancée
```
❌ Emplacements dans l'entrepôt (allées, rayons)
❌ Gestion par lots (batch/lot numbers)
❌ Gestion par numéros de série
❌ Traçabilité complète
❌ Dates d'expiration (FIFO/FEFO)
❌ Coût moyen pondéré (CUMP)
```

### Approvisionnement
```
❌ Calcul automatique des besoins
❌ Suggestions de réapprovisionnement
❌ Génération automatique de commandes fournisseurs
❌ Suivi des commandes en cours
❌ Réceptions partielles
```

### Intégrations Comptables
```
⚠️ Liens comptes comptables (purchase_account_id, sales_account_id)
❌ Génération d'écritures automatiques sur mouvements
❌ Valorisation du stock (compte 3x)
❌ Variation de stock en comptabilité
❌ Cohérence stock <-> comptabilité
```

### Rapports et Analyses
```
❌ Rapport de valorisation du stock
❌ Analyse ABC des articles
❌ Taux de rotation par article
❌ Analyse des ruptures
❌ Prévisions de consommation
❌ Rapport d'obsolescence
❌ Export des mouvements
```

### UX et Fonctionnalités Pratiques
```
❌ Scan de codes-barres
❌ Import/Export CSV des articles
❌ Import/Export CSV des mouvements
❌ Photos des articles
❌ Impression d'étiquettes
❌ Historique des prix (achats/ventes)
```

---

## 🔧 6. Architecture Technique

### Points Forts
✅ **Structure modulaire** - Services bien séparés
✅ **Typage TypeScript** - Types définis
✅ **Validations** - `inventory-validations.ts`
✅ **Calculs centralisés** - `inventory-calculations.ts`
✅ **Normalisation** - `inventory-normalizers.ts`
✅ **Hook controller** - `useInventoryPageController.ts` pour la logique

### Points d'Amélioration
⚠️ **Pas de table stock_movements** - Mouvements non persistés?
⚠️ **Relations third_parties obsolètes** - Bug critique
⚠️ **Manque table inventory_items** - Lien article <-> entrepôt
⚠️ **Pas de gestion multi-entrepôts** - Stock global uniquement
⚠️ **Pas de transactions DB** - Risque d'incohérence

---

## 📊 7. État des Relations DB

### Relations Actuelles (articles)
```
articles.warehouse_id     → warehouses.id              ✅ OK
articles.supplier_id      → third_parties.id           ❌ OBSOLÈTE (suppliers.id maintenant)
articles.purchase_account_id → accounts.id             ✅ OK
articles.sales_account_id    → accounts.id             ✅ OK
```

### Relations Manquantes
```
stock_movements.article_id      → articles.id
stock_movements.warehouse_id    → warehouses.id
stock_movements.user_id         → auth.users.id
inventory_counts.article_id     → articles.id
inventory_counts.warehouse_id   → warehouses.id
```

---

## 🎯 8. Priorités de Développement

### P0 - URGENT (Bugs Bloquants)
```
1. ❌ Corriger articlesService.ts → utiliser suppliers au lieu de third_parties
2. ❌ Vérifier suppliersService.ts → même problème potentiel
```

### P1 - CRITIQUE (Fonctionnalités Essentielles)
```
3. Créer table stock_movements
4. Implémenter enregistrement des mouvements
5. Implémenter calcul du stock disponible vs réservé
6. Ajouter historique des mouvements persistant
```

### P2 - IMPORTANT (Gestion d'Inventaire)
```
7. Créer table inventory_counts
8. Implémenter comptages physiques
9. Implémenter ajustements automatiques
10. Ajouter rapport d'écarts d'inventaire
```

### P3 - UTILE (Multi-Entrepôts)
```
11. Créer table inventory_items (article par entrepôt)
12. Implémenter transferts entre entrepôts
13. Ajouter vue stock par entrepôt
14. Implémenter réservations de stock
```

### P4 - AVANCÉ (Fonctionnalités Pro)
```
15. Gestion par lots
16. Gestion par numéros de série
17. Emplacements dans l'entrepôt
18. FIFO/FEFO
19. Coût moyen pondéré (CUMP)
20. Intégration comptable automatique
```

---

## 📝 9. Schémas SQL Proposés

### Table `stock_movements` (Priorité P1)
```sql
CREATE TABLE stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  article_id uuid NOT NULL REFERENCES articles(id),
  warehouse_id uuid NOT NULL REFERENCES warehouses(id),
  movement_type text NOT NULL CHECK (movement_type IN ('entry', 'exit', 'adjustment', 'transfer_in', 'transfer_out')),
  quantity numeric NOT NULL,
  unit_cost numeric,
  reference text,
  notes text,
  source_document_type text, -- 'purchase', 'sale', 'production', 'manual'
  source_document_id uuid,
  destination_warehouse_id uuid REFERENCES warehouses(id), -- Pour les transferts
  user_id uuid REFERENCES auth.users(id),
  movement_date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_stock_movements_article ON stock_movements(article_id);
CREATE INDEX idx_stock_movements_warehouse ON stock_movements(warehouse_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(movement_date);
```

### Table `inventory_counts` (Priorité P2)
```sql
CREATE TABLE inventory_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  warehouse_id uuid NOT NULL REFERENCES warehouses(id),
  count_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'in_progress', 'completed', 'validated')),
  notes text,
  created_by uuid REFERENCES auth.users(id),
  validated_by uuid REFERENCES auth.users(id),
  validated_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE inventory_count_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  count_id uuid NOT NULL REFERENCES inventory_counts(id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES articles(id),
  theoretical_quantity numeric NOT NULL,
  counted_quantity numeric,
  difference numeric,
  notes text,
  counted_by uuid REFERENCES auth.users(id),
  counted_at timestamp with time zone
);
```

### Table `inventory_items` (Priorité P3)
```sql
CREATE TABLE inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  article_id uuid NOT NULL REFERENCES articles(id),
  warehouse_id uuid NOT NULL REFERENCES warehouses(id),
  location_code text, -- Ex: "A-12-3" (allée-rayon-niveau)
  quantity numeric NOT NULL DEFAULT 0,
  reserved_quantity numeric NOT NULL DEFAULT 0,
  available_quantity numeric GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
  reorder_point numeric,
  max_stock numeric,
  last_movement_date timestamp with time zone,
  last_count_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(article_id, warehouse_id)
);

CREATE INDEX idx_inventory_items_warehouse ON inventory_items(warehouse_id);
CREATE INDEX idx_inventory_items_article ON inventory_items(article_id);
```

---

## 🚀 10. Plan d'Action Recommandé

### Phase 1: Correction Bugs (1-2 jours)
1. Corriger `articlesService.ts` - remplacer `third_parties` par `suppliers`
2. Vérifier `suppliersService.ts`
3. Tester que les articles se chargent correctement
4. Tester que les fournisseurs sont bien liés

### Phase 2: Mouvements de Stock (3-5 jours)
1. Créer table `stock_movements` en DB
2. Créer service `stockMovementsService.ts`
3. Modifier `MovementsTab` pour lire/écrire en DB
4. Ajouter calcul du stock disponible
5. Ajouter validation des quantités (pas de stock négatif)

### Phase 3: Inventaires Physiques (3-5 jours)
1. Créer tables `inventory_counts` et `inventory_count_lines`
2. Créer service `inventoryCountsService.ts`
3. Créer composant `InventoryCountTab`
4. Implémenter workflow: brouillon → en cours → validé
5. Générer ajustements automatiques après validation

### Phase 4: Multi-Entrepôts (5-7 jours)
1. Créer table `inventory_items`
2. Migrer stock_quantity d'articles vers inventory_items
3. Implémenter transferts entre entrepôts
4. Ajouter vue par entrepôt dans ProductsTab
5. Ajouter réservations de stock

### Phase 5: Fonctionnalités Avancées (10-15 jours)
1. Gestion par lots/numéros de série
2. Emplacements précis dans l'entrepôt
3. FIFO/FEFO
4. Coût moyen pondéré
5. Intégration comptable automatique
6. Rapports avancés

---

## 📌 11. Conclusion

### État Actuel
Le module inventaire dispose d'une **base solide** avec:
- Interface complète (6 onglets)
- Architecture modulaire bien pensée
- Services organisés et typés
- Gestion des articles et entrepôts

### Problèmes Majeurs
1. **Bug critique**: Relations `third_parties` obsolètes
2. **Pas de persistance**: Mouvements de stock non enregistrés en DB
3. **Pas d'inventaires physiques**: Comptages impossibles
4. **Pas de multi-entrepôts**: Stock global uniquement

### Estimation
- **Code existant**: ~70% de l'interface
- **Fonctionnalités critiques manquantes**: 50%
- **Effort restant estimé**: 20-30 jours de dev

Le module est **utilisable pour une gestion basique** mais nécessite les tables `stock_movements` et `inventory_counts` pour être réellement fonctionnel en production.
