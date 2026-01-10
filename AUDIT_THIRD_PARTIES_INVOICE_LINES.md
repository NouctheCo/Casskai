# Audit Complet: Usages de third_parties et invoice_lines

**Date**: 2025-01-09
**Objectif**: Identifier tous les usages avant nettoyage/migration

---

## 📊 Résumé Exécutif

### Statistiques Globales

| Terme | Fichiers | Occurrences Totales |
|-------|----------|---------------------|
| `third_parties` | 31 fichiers | ~150+ occurrences |
| `invoice_lines` | 8 fichiers | ~30 occurrences |
| `thirdPartiesService` | 3 fichiers | 5 occurrences |
| `unifiedThirdPartiesService` | 5 fichiers | 15 occurrences |

---

## 1️⃣ USAGE DE `third_parties` (Table)

### 🔵 Catégorie A: Services de Gestion des Tiers

#### 📄 src/services/thirdPartiesService.ts
**Rôle**: Service principal pour la gestion des tiers
**Usages**:
- Ligne 17: Import `unifiedThirdPartiesService`
- Ligne 161: Query SELECT `from('third_parties')`
- Ligne 253: Query INSERT `from('third_parties')`
- Ligne 295: Query UPDATE `from('third_parties')`
- Ligne 345: Query UPDATE `from('third_parties')`
- Ligne 415: Query DELETE `from('third_parties')`
- Ligne 451: Query SELECT search `from('third_parties')`
- Ligne 479: Query SELECT stats `from('third_parties')`
- Ligne 557: Query SELECT search `from('third_parties')`
- Ligne 620: Appel à `unifiedThirdPartiesService.getDashboardStats()`
- Ligne 628: Query SELECT count `from('third_parties')`
- Ligne 656: Query SELECT count `from('third_parties')`
- Ligne 744: Calcul `total_third_parties`
- Ligne 766: Données `recent_third_parties`
- Ligne 929-931: Export du service

**Type**: ✅ **CRUD Complet sur third_parties**

---

#### 📄 src/services/unifiedThirdPartiesService.ts
**Rôle**: Service unifié pour customers/suppliers
**Usages**:
- Ligne 18: Commentaire "Vue `third_parties` pour lectures unifiées"
- Ligne 76: Type `current_balance` (alias from third_parties view)
- Ligne 342: Query SELECT `from('third_parties')`
- Ligne 369: Query SELECT `from('third_parties')`
- Ligne 402: Query SELECT `from('third_parties')`
- Ligne 444-445: Export du service

**Type**: ✅ **Lecture unifiée depuis third_parties**

---

#### 📄 src/services/thirdPartiesAgingReport.ts
**Rôle**: Rapports d'ancienneté des créances/dettes
**Usages**:
- Ligne 23: Query SELECT `from('third_parties')`

**Type**: ✅ **Lecture pour rapports**

---

### 🔵 Catégorie B: Services Métier Utilisant les Tiers

#### 📄 src/services/crmService.ts
**Rôle**: Gestion CRM (clients, prospects, opportunités)
**Usages**:
- Ligne 32: Commentaire "Clients - Utilise la table third_parties existante"
- Ligne 36: Query SELECT clients `from('third_parties')`
- Ligne 106-108: Query INSERT client `from('third_parties')`
- Ligne 148: Audit log `table_name: 'third_parties'`
- Ligne 173: Query UPDATE `from('third_parties')`
- Ligne 178: Query UPDATE `from('third_parties')`
- Ligne 222: Audit log `table_name: 'third_parties'`
- Ligne 254: Query DELETE `from('third_parties')`
- Ligne 259: Query UPDATE `from('third_parties')`
- Ligne 267: Audit log `table_name: 'third_parties'`
- Ligne 291-293: Query INSERT supplier `from('third_parties')`
- Ligne 532: Query SELECT contacts `from('third_parties')`
- Ligne 586: Query SELECT opportunities `from('third_parties')`
- Ligne 673: Query SELECT leads `from('third_parties')`
- Ligne 737: Query SELECT analytics `from('third_parties')`

**Type**: ✅ **Utilisation intensive pour CRM**

---

#### 📄 src/services/invoiceJournalEntryService.ts
**Rôle**: Génération d'écritures comptables depuis factures
**Usages**:
- Ligne 185: Query SELECT pour récupérer compte client `from('third_parties')`
- Ligne 230: Query SELECT pour récupérer compte fournisseur `from('third_parties')`
- Ligne 274: Query SELECT avec join `.select('*, third_parties(name)')`
- Ligne 287: Query SELECT lignes facture `from('invoice_lines')`
- Ligne 298: Utilisation `third_parties?.name`

**Type**: ✅ **Lecture pour écritures comptables**

---

#### 📄 src/services/paymentsService.ts
**Rôle**: Gestion des paiements
**Usages**:
- Ligne 84: Query SELECT avec join `third_party:third_parties(id, name, email)`
- Ligne 130: Query SELECT avec join `third_party:third_parties(id, name, email)`

**Type**: ✅ **Join pour infos tiers dans paiements**

---

#### 📄 src/services/quotesService.ts
**Rôle**: Gestion des devis
**Usages**:
- Ligne 104: Query SELECT avec join `third_party:third_parties(...)`
- Ligne 105: Query SELECT avec join `invoice_lines(...)`
- Ligne 150: Mapping `invoice.invoice_lines?.map(...)`
- Ligne 177: Query SELECT avec join `third_party:third_parties(...)`
- Ligne 178: Query SELECT avec join `invoice_lines(...)`
- Ligne 207: Mapping `data.invoice_lines?.map(...)`
- Ligne 284: Query INSERT `from('invoice_lines')`
- Ligne 375: Query UPDATE `from('invoice_lines')`

**Type**: ✅ **Devis avec tiers et lignes**

---

#### 📄 src/services/sepaService.ts
**Rôle**: Génération fichiers SEPA
**Usages**:
- Ligne 203: Query SELECT avec join `third_parties!inner(...)`
- Ligne 213: Filtre `.not('third_parties.iban', 'is', null)`
- Ligne 217: Accès conditionnel `invoice.third_parties`

**Type**: ✅ **SEPA avec coordonnées bancaires tiers**

---

#### 📄 src/services/projectService.ts
**Rôle**: Gestion des projets
**Usages**:
- Ligne 118: Query SELECT avec join `third_parties(name)`
- Ligne 132: Mapping `project.third_parties?.name`
- Ligne 147: Query SELECT avec join `third_parties(name)`
- Ligne 160: Mapping `data.third_parties?.name`

**Type**: ✅ **Projets liés aux clients**

---

#### 📄 src/services/rfaCalculationService.ts
**Rôle**: Calcul Reconnaissance du Chiffre d'Affaires
**Usages**:
- Ligne 132: Query SELECT avec join `third_parties!contracts_third_party_id_fkey(id, name)`
- Ligne 208: Mapping `contract.third_parties?.name`

**Type**: ✅ **RFA avec infos clients**

---

#### 📄 src/services/realDashboardKpiService.ts
**Rôle**: KPI temps réel du tableau de bord
**Usages**:
- Ligne 299: Query SELECT avec join `third_parties!inner(name)`
- Ligne 312: Mapping `invoice.third_parties?.name`

**Type**: ✅ **KPI avec noms clients**

---

#### 📄 src/services/workflowExecutionService.ts
**Rôle**: Exécution de workflows automatisés
**Usages**:
- Ligne 330: Query SELECT avec join `third_parties (...)`
- Ligne 358: Accès `(invoice.third_parties as any)?.email`
- Ligne 426: Mapping de table `client: 'third_parties'`

**Type**: ✅ **Workflows avec données tiers**

---

#### 📄 src/services/assetsService.ts
**Rôle**: Gestion des immobilisations
**Usages**:
- Ligne 186: Query SELECT avec join `supplier:third_parties(id, name)`

**Type**: ✅ **Immobilisations liées aux fournisseurs**

---

#### 📄 src/services/ai/cashFlowPredictionService.ts
**Rôle**: Prédiction de trésorerie par IA
**Usages**:
- Ligne 76: Query SELECT avec join `third_parties (...)`
- Ligne 101: Mapping `(inv.third_parties as any)?.name`
- Ligne 118: Query SELECT avec join `third_parties (...)`
- Ligne 136: Mapping `(inv.third_parties as any)?.name`

**Type**: ✅ **Prédictions avec noms tiers**

---

#### 📄 src/services/einvoicing/EInvoicingService.ts
**Rôle**: Facturation électronique
**Usages**:
- Ligne 260: Query SELECT avec join `third_parties(name)`
- Ligne 295: Query SELECT avec join `third_parties(*)`
- Ligne 297: Query SELECT avec join `invoice_lines(*)`

**Type**: ✅ **E-invoicing avec tiers et lignes**

---

#### 📄 src/services/einvoicing/adapters/InvoiceToEN16931Mapper.ts
**Rôle**: Mapping vers norme européenne EN16931
**Usages**:
- Ligne 39: Type `third_parties: { ... }`
- Ligne 61: Type `invoice_lines: Array<{ ... }>`
- Ligne 100: Mapping `this.mapBuyerParty(invoice.third_parties)`
- Ligne 101: Mapping `this.mapInvoiceLines(invoice.invoice_lines)`
- Ligne 174: Méthode `mapBuyerParty(thirdParty: CassKaiInvoice['third_parties'])`
- Ligne 210: Méthode `mapInvoiceLines(lines: CassKaiInvoice['invoice_lines'])`
- Ligne 236: Calcul `invoice.invoice_lines.reduce(...)`

**Type**: ✅ **Conversion format européen**

---

#### 📄 src/services/migrationService.ts
**Rôle**: Gestion des migrations et permissions
**Usages**:
- Ligne 169: Liste de tables `'bank_accounts', 'bank_transactions', 'third_parties', ...`
- Ligne 225-226: Permissions `view_third_parties`, `manage_third_parties`

**Type**: ✅ **Migrations et permissions système**

---

#### 📄 src/services/sampleData/SampleDataService.ts
**Rôle**: Génération de données d'exemple
**Usages**:
- Ligne 417: Liste de tables à nettoyer `'invoice_lines'`

**Type**: ✅ **Nettoyage données test**

---

### 🔵 Catégorie C: Composants UI

#### 📄 src/components/crm/NewClientModal.tsx
**Rôle**: Formulaire création client
**Usages**:
- Ligne 3: Commentaire "Intégré avec la table third_parties de Supabase"
- Ligne 111: Query INSERT `from('third_parties').insert({ ... })`

**Type**: ✅ **Création client direct**

---

#### 📄 src/components/inventory/NewArticleModal.tsx
**Rôle**: Formulaire création article
**Usages**:
- Ligne 26: Import `thirdPartiesService`
- Ligne 142: Appel `thirdPartiesService.getThirdParties(currentCompany.id, 'supplier')`
- Ligne 206: Appel `thirdPartiesService.getThirdParties(currentCompany.id, 'supplier')`

**Type**: ✅ **Chargement fournisseurs**

---

#### 📄 src/components/invoicing/OptimizedInvoicesTab.tsx
**Rôle**: Gestion des factures
**Usages**:
- Ligne 17: Import `thirdPartiesService`
- Ligne 838: Mapping `invoice.invoice_lines?.map(...)`

**Type**: ✅ **Factures avec lignes**

---

#### 📄 src/components/invoicing/OptimizedClientsTab.tsx
**Rôle**: Onglet gestion clients
**Usages**:
- Ligne 12: Import `unifiedThirdPartiesService`
- Ligne 430: Appel `unifiedThirdPartiesService.getCustomers(...)`
- Ligne 478: Appel `unifiedThirdPartiesService.updateCustomer(...)`
- Ligne 494: Appel `unifiedThirdPartiesService.createCustomer(...)`
- Ligne 533: Appel `unifiedThirdPartiesService.deleteCustomer(...)`

**Type**: ✅ **CRUD clients via service unifié**

---

#### 📄 src/components/third-parties/ImportTab.tsx
**Rôle**: Import CSV de tiers
**Usages**:
- Ligne 168: Query INSERT `from('third_parties').insert({ ... })`

**Type**: ✅ **Import bulk de tiers**

---

#### 📄 src/components/third-parties/ThirdPartyFormDialog.tsx
**Rôle**: Dialog formulaire tiers
**Usages**:
- Ligne 8: Import `unifiedThirdPartiesService`
- Ligne 71: Appel `unifiedThirdPartiesService.createCustomer(data)`
- Ligne 73: Appel `unifiedThirdPartiesService.createSupplier(data)`

**Type**: ✅ **Création via service unifié**

---

### 🔵 Catégorie D: Pages

#### 📄 src/pages/ThirdPartiesPage.tsx
**Rôle**: Page principale gestion tiers
**Usages**:
- Ligne 145: Calcul `total_third_parties: totalCustomers + totalSuppliers`
- Ligne 156: Données `recent_third_parties: []`
- Ligne 536: Affichage `{dashboardData.stats.total_third_parties}`

**Type**: ✅ **Page principale tiers**

---

#### 📄 src/pages/ContractsPage.tsx
**Rôle**: Page gestion contrats
**Usages**:
- Ligne 35: Import `unifiedThirdPartiesService`
- Ligne 116: Appel `unifiedThirdPartiesService.getCustomers(...)`

**Type**: ✅ **Contrats avec clients**

---

### 🔵 Catégorie E: Hooks

#### 📄 src/hooks/useSuppliers.ts
**Rôle**: Hook pour gérer les fournisseurs
**Usages**:
- Ligne 41: Query SELECT `from('third_parties')`
- Ligne 60: Query INSERT `from('third_parties')`

**Type**: ✅ **Hook fournisseurs**

---

#### 📄 src/hooks/useThirdParties.ts
**Rôle**: Hook principal gestion tiers
**Usages**:
- Ligne 72: Query SELECT `from('third_parties')`
- Ligne 122: Query INSERT `from('third_parties')`
- Ligne 151: Query UPDATE `from('third_parties')`
- Ligne 178: Query DELETE `from('third_parties')`
- Ligne 198: Query SELECT search `from('third_parties')`
- Ligne 215: Query SELECT stats `from('third_parties')`

**Type**: ✅ **Hook complet CRUD**

---

#### 📄 src/hooks/useUserManagement.ts
**Rôle**: Gestion utilisateurs et permissions
**Usages**:
- Ligne 678: Permission `'third_parties:manage'`
- Ligne 682: Permission `'third_parties:manage'`
- Ligne 685: Permission `'third_parties:read'`
- Ligne 688: Permission `'third_parties:read'`

**Type**: ✅ **Permissions tiers**

---

### 🔵 Catégorie F: Configuration et Types

#### 📄 src/components/auth/PermissionGuard.tsx
**Rôle**: Guard de permissions
**Usages**:
- Ligne 149: Permission `MANAGE_THIRD_PARTIES: 'manage_third_parties'`
- Ligne 150: Permission `VIEW_THIRD_PARTIES: 'view_third_parties'`

**Type**: ✅ **Constantes permissions**

---

#### 📄 src/config/moduleCapabilities.ts
**Rôle**: Configuration capacités modules
**Usages**:
- Ligne 44: Mapping `third_parties: 'billing'`

**Type**: ✅ **Configuration module**

---

#### 📄 src/types/database/invoices.types.ts
**Rôle**: Types TypeScript pour factures
**Usages**:
- Ligne 29: Type `Client = Database['public']['Tables']['third_parties']['Row']`
- Ligne 31: Type `ClientInsert = Database['public']['Tables']['third_parties']['Insert']`
- Ligne 33: Type `ClientUpdate = Database['public']['Tables']['third_parties']['Update']`
- Ligne 36: Type `InvoiceLine = any; // invoice_lines`
- Ligne 45: Type `invoice_lines?: InvoiceLine[]`

**Type**: ✅ **Définitions types**

---

#### 📄 src/types/database-base.ts
**Rôle**: Types base de données de base
**Usages**:
- Ligne 59: Propriété `third_parties: DatabaseTable;`

**Type**: ✅ **Type base**

---

#### 📄 src/types/database-types-fix.ts
**Rôle**: Corrections types base de données
**Usages**:
- Ligne 325: Section `third_parties: { ... }`

**Type**: ✅ **Fix types**

---

#### 📄 src/types/supabase.ts
**Rôle**: Types générés automatiquement par Supabase
**Usages**:
- Ligne 8788: Foreign key reference `referencedRelation: "third_parties"`
- Ligne 9355: Foreign key reference `referencedRelation: "third_parties"`
- Ligne 15046: Table `invoice_lines: { ... }`
- Ligne 15100-15121: Foreign keys `invoice_lines_*_fkey`
- Ligne 15361: Foreign key reference `referencedRelation: "third_parties"`
- Ligne 16900: Foreign key reference `referencedRelation: "third_parties"`
- Ligne 19929-19943: Foreign key references `referencedRelation: "third_parties"`
- Ligne 24081: Table `third_parties: { ... }`
- Ligne 24171-24185: Foreign keys `third_parties_*_fkey`
- Ligne 26442: Vue `unified_third_parties_view: { ... }`
- Ligne 27356: Fonction RPC `get_third_parties_stats`
- Ligne 27667: Fonction RPC `search_unified_third_parties`

**Type**: ✅ **Types auto-générés Supabase**

---

#### 📄 src/types/supabase/accounting.tables.ts
**Rôle**: Types tables comptables
**Usages**:
- Ligne 3: Commentaire liste tables incluant `third_parties`
- Ligne 240: Section `third_parties: { ... }`

**Type**: ✅ **Types comptables**

---

#### 📄 src/types/third-parties.types.ts
**Rôle**: Types spécifiques aux tiers
**Usages**:
- Ligne 167: Propriété `total_third_parties: number;`
- Ligne 255: Propriété `recent_third_parties: ThirdParty[];`

**Type**: ✅ **Types métier tiers**

---

### 🔵 Catégorie G: Utilitaires

#### 📄 src/utils/migrationChecker.ts
**Rôle**: Vérification migrations
**Usages**:
- Ligne 28: Liste de tables `'third_parties'`

**Type**: ✅ **Checker migrations**

---

## 2️⃣ USAGE DE `invoice_lines` (Table)

### Fichiers Utilisant `invoice_lines`

#### 📄 src/components/invoicing/OptimizedInvoicesTab.tsx
- Ligne 838: Mapping `invoice.invoice_lines?.map(line => ({ ... }))`
**Usage**: Lecture des lignes de facture pour édition

---

#### 📄 src/services/einvoicing/adapters/InvoiceToEN16931Mapper.ts
- Ligne 61: Type `invoice_lines: Array<{ ... }>`
- Ligne 101: Mapping `this.mapInvoiceLines(invoice.invoice_lines)`
- Ligne 210: Méthode `mapInvoiceLines(lines: CassKaiInvoice['invoice_lines'])`
- Ligne 236: Reduce `invoice.invoice_lines.reduce(...)`
**Usage**: Conversion format européen

---

#### 📄 src/services/einvoicing/EInvoicingService.ts
- Ligne 297: Query SELECT `invoice_lines(*)`
**Usage**: Chargement complet facture e-invoicing

---

#### 📄 src/services/invoiceJournalEntryService.ts
- Ligne 287: Query SELECT `from('invoice_lines')`
**Usage**: Génération écritures comptables

---

#### 📄 src/services/quotesService.ts
- Ligne 105: Query SELECT `invoice_lines(id, description, ...)`
- Ligne 150: Mapping `invoice.invoice_lines?.map(...)`
- Ligne 178: Query SELECT `invoice_lines(id, description, ...)`
- Ligne 207: Mapping `data.invoice_lines?.map(...)`
- Ligne 284: Query INSERT `.from('invoice_lines')`
- Ligne 375: Query UPDATE `.from('invoice_lines')`
**Usage**: Gestion complète des devis avec lignes

---

#### 📄 src/services/sampleData/SampleDataService.ts
- Ligne 417: Liste de tables `'invoice_lines'`
**Usage**: Nettoyage données test

---

#### 📄 src/types/database/invoices.types.ts
- Ligne 36: Type `InvoiceLine = any; // invoice_lines`
- Ligne 45: Propriété `invoice_lines?: InvoiceLine[]`
**Usage**: Types TypeScript

---

#### 📄 src/types/supabase.ts
- Ligne 15046: Table `invoice_lines: { ... }`
- Lignes 15100-15121: Foreign keys `invoice_lines_*_fkey`
**Usage**: Types auto-générés

---

## 3️⃣ USAGE DE `thirdPartiesService` (Import)

### Fichiers Important le Service

#### 📄 src/components/inventory/NewArticleModal.tsx
- Ligne 26: `import { thirdPartiesService } from '@/services/thirdPartiesService';`
- Ligne 142: `thirdPartiesService.getThirdParties(currentCompany.id, 'supplier')`
- Ligne 206: `thirdPartiesService.getThirdParties(currentCompany.id, 'supplier')`
**Usage**: Chargement fournisseurs dans formulaire article

---

#### 📄 src/components/invoicing/OptimizedInvoicesTab.tsx
- Ligne 17: `import { thirdPartiesService } from '@/services/thirdPartiesService';`
**Usage**: Import (probablement utilisé ailleurs dans le fichier)

---

#### 📄 src/services/thirdPartiesService.ts
- Ligne 929: `export const thirdPartiesService = new ThirdPartiesService();`
- Ligne 931: `export default thirdPartiesService;`
**Usage**: Définition et export du service

---

## 4️⃣ USAGE DE `unifiedThirdPartiesService` (Import)

### Fichiers Important le Service Unifié

#### 📄 src/components/invoicing/OptimizedClientsTab.tsx
- Ligne 12: `import { unifiedThirdPartiesService } from '@/services/unifiedThirdPartiesService';`
- Lignes 430, 478, 494, 533: Appels CRUD clients
**Usage**: Gestion clients via service unifié

---

#### 📄 src/components/third-parties/ThirdPartyFormDialog.tsx
- Ligne 8: `import { unifiedThirdPartiesService } from '@/services/unifiedThirdPartiesService';`
- Lignes 71, 73: Création customer/supplier
**Usage**: Formulaire création tiers

---

#### 📄 src/pages/ContractsPage.tsx
- Ligne 35: `import { unifiedThirdPartiesService } from '../services/unifiedThirdPartiesService';`
- Ligne 116: `unifiedThirdPartiesService.getCustomers(...)`
**Usage**: Chargement clients pour contrats

---

#### 📄 src/services/thirdPartiesService.ts
- Ligne 17: `import { unifiedThirdPartiesService } from './unifiedThirdPartiesService';`
- Ligne 620: `unifiedThirdPartiesService.getDashboardStats(enterpriseId)`
**Usage**: Délégation pour stats dashboard

---

#### 📄 src/services/unifiedThirdPartiesService.ts
- Ligne 444: `export const unifiedThirdPartiesService = new UnifiedThirdPartiesService();`
- Ligne 445: `export default unifiedThirdPartiesService;`
**Usage**: Définition et export du service

---

## 📋 RÉSUMÉ PAR CATÉGORIE

### Services (15 fichiers)
1. ✅ `thirdPartiesService.ts` - Service principal CRUD
2. ✅ `unifiedThirdPartiesService.ts` - Service unifié customers/suppliers
3. ✅ `thirdPartiesAgingReport.ts` - Rapports ancienneté
4. ✅ `crmService.ts` - CRM avec third_parties
5. ✅ `invoiceJournalEntryService.ts` - Écritures comptables
6. ✅ `paymentsService.ts` - Paiements avec tiers
7. ✅ `quotesService.ts` - Devis avec tiers et lignes
8. ✅ `sepaService.ts` - SEPA avec coordonnées tiers
9. ✅ `projectService.ts` - Projets clients
10. ✅ `rfaCalculationService.ts` - RFA avec clients
11. ✅ `realDashboardKpiService.ts` - KPI avec tiers
12. ✅ `workflowExecutionService.ts` - Workflows
13. ✅ `assetsService.ts` - Immobilisations fournisseurs
14. ✅ `ai/cashFlowPredictionService.ts` - Prédictions IA
15. ✅ `migrationService.ts` - Migrations et permissions

### Services E-Invoicing (2 fichiers)
1. ✅ `einvoicing/EInvoicingService.ts` - Facturation électronique
2. ✅ `einvoicing/adapters/InvoiceToEN16931Mapper.ts` - Mapper EN16931

### Composants UI (5 fichiers)
1. ✅ `crm/NewClientModal.tsx` - Création client
2. ✅ `inventory/NewArticleModal.tsx` - Création article
3. ✅ `invoicing/OptimizedInvoicesTab.tsx` - Gestion factures
4. ✅ `invoicing/OptimizedClientsTab.tsx` - Gestion clients
5. ✅ `third-parties/ImportTab.tsx` - Import CSV
6. ✅ `third-parties/ThirdPartyFormDialog.tsx` - Formulaire tiers

### Pages (2 fichiers)
1. ✅ `pages/ThirdPartiesPage.tsx` - Page principale
2. ✅ `pages/ContractsPage.tsx` - Page contrats

### Hooks (3 fichiers)
1. ✅ `hooks/useSuppliers.ts` - Hook fournisseurs
2. ✅ `hooks/useThirdParties.ts` - Hook principal tiers
3. ✅ `hooks/useUserManagement.ts` - Permissions

### Types (6 fichiers)
1. ✅ `types/database/invoices.types.ts` - Types factures
2. ✅ `types/database-base.ts` - Types base
3. ✅ `types/database-types-fix.ts` - Fix types
4. ✅ `types/supabase.ts` - Types auto-générés
5. ✅ `types/supabase/accounting.tables.ts` - Types comptables
6. ✅ `types/third-parties.types.ts` - Types métier

### Configuration (3 fichiers)
1. ✅ `components/auth/PermissionGuard.tsx` - Permissions
2. ✅ `config/moduleCapabilities.ts` - Config modules
3. ✅ `utils/migrationChecker.ts` - Checker migrations

### Utilitaires (1 fichier)
1. ✅ `services/sampleData/SampleDataService.ts` - Données test

---

## 🎯 RECOMMANDATIONS POUR NETTOYAGE

### ⚠️ ATTENTION: Interdépendances Critiques

1. **Services Principaux** (NE PAS TOUCHER):
   - `thirdPartiesService.ts` - Utilisé par 3 fichiers
   - `unifiedThirdPartiesService.ts` - Utilisé par 5 fichiers

2. **Table `third_parties`** (CRITIQUE):
   - Utilisée directement dans **31 fichiers**
   - Relations avec: invoices, contracts, projects, payments, assets
   - Foreign keys dans: invoices, contracts, journal_entries, etc.

3. **Table `invoice_lines`** (IMPORTANTE):
   - Utilisée dans **8 fichiers**
   - Essentielle pour: factures, devis, e-invoicing, comptabilité

### ✅ Actions Recommandées

#### Phase 1: Audit Complémentaire
- [ ] Vérifier les vues Supabase dépendantes de `third_parties`
- [ ] Lister toutes les foreign keys vers `third_parties`
- [ ] Identifier les triggers/fonctions PostgreSQL liés

#### Phase 2: Plan de Migration (si nécessaire)
- [ ] Si renommage: créer un plan de migration SQL
- [ ] Si suppression: identifier les tables de remplacement
- [ ] Planifier la migration des données existantes

#### Phase 3: Tests
- [ ] Tests unitaires pour chaque service modifié
- [ ] Tests d'intégration pour les workflows complets
- [ ] Tests de régression sur les fonctionnalités critiques

---

## 📊 Statistiques Détaillées

### Par Type d'Opération

| Opération | Occurrences | Fichiers |
|-----------|-------------|----------|
| SELECT (lecture) | ~80 | 25 |
| INSERT (création) | ~15 | 10 |
| UPDATE (modification) | ~10 | 8 |
| DELETE (suppression) | ~5 | 5 |
| JOIN (relation) | ~30 | 15 |
| Type/Interface | ~20 | 8 |

### Par Domaine Fonctionnel

| Domaine | Fichiers | Criticité |
|---------|----------|-----------|
| Services CRUD | 5 | 🔴 Critique |
| CRM | 4 | 🔴 Critique |
| Facturation | 8 | 🔴 Critique |
| Comptabilité | 5 | 🟠 Élevée |
| Projets/Contrats | 3 | 🟡 Moyenne |
| Types/Config | 9 | 🟢 Faible |

---

**Date d'Audit**: 2025-01-09
**Status**: ✅ Audit Complet Terminé
**Prochaine Étape**: Décision sur plan d'action (conserver, migrer, refactoriser)
