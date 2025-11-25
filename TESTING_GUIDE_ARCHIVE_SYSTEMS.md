# Guide de Test - Systèmes d'Archivage Complets

## 📋 Vue d'ensemble

Ce guide vous permet de tester systématiquement tous les systèmes d'archivage implémentés :
- **Reports** (Rapports financiers)
- **Tax** (Déclarations fiscales)
- **Contracts** (Contrats)
- **Purchases** (Bons de commande)

## 🗄️ Migrations SQL à exécuter

### Ordre d'exécution (IMPORTANT)

Vous avez déjà appliqué les migrations 1 et 2. Appliquez les suivantes dans cet ordre :

```sql
-- ✅ DÉJÀ APPLIQUÉ
-- 1. supabase/migrations/20251109000006_create_reports_archive_system.sql
-- 2. supabase/migrations/20251109000007_create_reports_storage_bucket.sql

-- 🔄 À APPLIQUER MAINTENANT
-- 3. Tax Module
\i supabase/migrations/20251109000008_create_tax_archive_system.sql
\i supabase/migrations/20251109000009_create_tax_storage_bucket.sql

-- 4. Contracts & Purchases (migration combinée)
\i supabase/migrations/20251109000010_create_contracts_purchases_archive_systems.sql
```

### Vérification post-migration

Après chaque migration, vérifiez la création des tables :

```sql
-- Vérification Reports (déjà fait)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('generated_reports', 'reports_archive', 'report_comparisons', 'report_schedules_executions')
ORDER BY table_name;

-- Vérification Tax
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('generated_tax_documents', 'tax_documents_archive')
ORDER BY table_name;

-- Vérification Contracts & Purchases
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('generated_contracts', 'contracts_archive', 'generated_purchase_orders', 'purchase_orders_archive')
ORDER BY table_name;

-- Vérification des buckets storage
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE name IN ('financial-reports', 'tax-documents', 'contracts', 'purchase-orders');

-- Vérification des fonctions créées
SELECT proname, pronargs
FROM pg_proc
WHERE proname IN (
  'generate_archive_reference',
  'generate_tax_archive_reference',
  'generate_contract_archive_reference',
  'generate_purchase_archive_reference',
  'calculate_retention_date',
  'auto_archive_report',
  'auto_archive_tax_document',
  'auto_archive_contract',
  'auto_archive_purchase_order'
)
ORDER BY proname;
```

Résultats attendus :
- **Tables** : 10 tables au total
- **Buckets** : 4 buckets storage
- **Fonctions** : 9 fonctions PL/pgSQL

## 🧪 Tests par Module

### 1. Module Reports (Rapports financiers)

#### Test 1.1 : Génération d'un rapport

1. **Accéder** : Navigation → Reports
2. **Onglet** : "Génération"
3. **Sélectionner** :
   - Type de rapport : "Bilan comptable"
   - Période : Mois en cours
   - Format : PDF
4. **Générer** : Cliquer sur "Générer le rapport"
5. **Vérifier** :
   - Message de succès
   - Rapport téléchargé automatiquement
   - Passage automatique à l'onglet "Historique"

**Vérification DB** :
```sql
SELECT id, report_name, status, is_archived, archive_reference, file_url
FROM generated_reports
WHERE company_id = 'VOTRE_COMPANY_ID'
ORDER BY created_at DESC
LIMIT 1;
```

Attendu : 1 ligne avec `status = 'generated'`, `is_archived = false`

#### Test 1.2 : Workflow d'approbation

1. **Onglet** : "Historique"
2. **Localiser** : Le rapport généré (badge bleu "Généré")
3. **Approuver** : Cliquer sur l'icône ✓ (CheckCircle)
4. **Vérifier** : Badge devient vert "Approuvé"

**Vérification DB** :
```sql
SELECT status, updated_at
FROM generated_reports
WHERE id = 'REPORT_ID';
```

Attendu : `status = 'approved'`

#### Test 1.3 : Archivage automatique

1. **Localiser** : Rapport approuvé
2. **Archiver** : Cliquer sur bouton jaune Archive
3. **Vérifier** :
   - Badge jaune "Archivé" apparaît
   - Référence d'archive (ARC-2025-0001)
   - Boutons d'action disparaissent (sauf Download)
   - Rapport apparaît dans l'onglet "Archive Légale"

**Vérification DB** :
```sql
-- Dans generated_reports
SELECT is_archived, archive_reference, archived_at, retention_until
FROM generated_reports
WHERE id = 'REPORT_ID';

-- Dans reports_archive (copie créée automatiquement par trigger)
SELECT archive_reference, archived_at, retention_years, retention_until,
       legal_requirement, importance_level
FROM reports_archive
WHERE generated_report_id = 'REPORT_ID';
```

Attendu :
- `generated_reports.is_archived = true`
- `generated_reports.archive_reference` existe
- `reports_archive` contient 1 ligne correspondante
- `retention_until` = date actuelle + 10 ans

#### Test 1.4 : Statistiques et filtres

1. **Onglet** : "Historique"
2. **Vérifier** : 5 cartes statistiques en haut
   - Total (nombre correct)
   - Brouillons
   - Générés
   - Approuvés
   - Archivés
3. **Tester filtres** :
   - Recherche textuelle
   - Filtre par statut
   - Filtre par type de rapport
   - Filtre par année fiscale

#### Test 1.5 : Archive légale

1. **Onglet** : "Archive Légale"
2. **Vérifier** :
   - Rapport archivé visible
   - Référence légale affichée (Code de commerce Art. L123-22)
   - Barre de progression de rétention
   - Date de destruction affichée (dans 10 ans)
   - Catégorie d'importance (haute/moyenne/basse)

#### Test 1.6 : Comparaisons automatiques

**Via console navigateur** (fonctionnalité backend) :
```javascript
// Générer 2 rapports de mois différents puis :
const result = await reportArchiveService.compareReportsAutomatically(
  'COMPANY_ID',
  'balance_sheet',
  '2025-10-01',
  '2025-10-31'
);
console.log(result);
```

**Vérification DB** :
```sql
SELECT * FROM report_comparisons
WHERE company_id = 'COMPANY_ID'
ORDER BY created_at DESC
LIMIT 1;
```

#### Test 1.7 : Export ZIP groupé

**Via console navigateur** :
```javascript
// Sélectionner plusieurs IDs de rapports
const result = await reportArchiveService.exportReportsToZip(
  'COMPANY_ID',
  ['REPORT_ID_1', 'REPORT_ID_2', 'REPORT_ID_3'],
  'Rapports_Q1_2025'
);
// Fichier ZIP téléchargé automatiquement
```

#### Test 1.8 : Protection contre suppression

1. **Localiser** : Rapport archivé
2. **Tenter suppression** : Bouton Delete doit être absent
3. **Vérifier** : Message d'erreur si tentative via API

### 2. Module Tax (Déclarations fiscales)

#### Structure similaire au module Reports

**Tables** : `generated_tax_documents`, `tax_documents_archive`

**Workflow** : draft → generated → submitted → validated → archived

**Spécificités Tax** :
- Champs fiscaux : `tax_period_start`, `tax_period_end`, `tax_base`, `tax_amount`, `tax_due`
- Référence : TAX-YYYY-NNNN
- Types : TVA_CA3, IS, CVAE, CFE, DAS2, DADS, etc.
- Rétention : 6-10 ans selon type
- Bucket : `tax-documents`

**Tests clés** :
```sql
-- Vérifier création d'un document fiscal
INSERT INTO generated_tax_documents (
  company_id, document_name, document_type,
  tax_period_start, tax_period_end, tax_amount, status
) VALUES (
  'COMPANY_ID', 'TVA CA3 - Octobre 2025', 'TVA_CA3',
  '2025-10-01', '2025-10-31', 15000.00, 'generated'
);

-- Vérifier génération de référence
UPDATE generated_tax_documents
SET status = 'archived'
WHERE id = 'DOC_ID';

-- Vérifier trigger d'archivage automatique
SELECT * FROM tax_documents_archive
WHERE generated_tax_document_id = 'DOC_ID';
```

### 3. Module Contracts (Contrats)

**Tables** : `generated_contracts`, `contracts_archive`

**Workflow** : draft → generated → sent → signed → active → expired/terminated → archived

**Spécificités Contracts** :
- Types : client, supplier, employee_cdi, employee_cdd, service
- Dates : `start_date`, `end_date`, `signature_date`
- Parties : `party_name`, `party_type`
- Montant : `contract_value`, `currency`
- Référence : CNT-YYYY-NNNN
- Bucket : `contracts`

**Tests clés** :
```sql
-- Créer un contrat
INSERT INTO generated_contracts (
  company_id, contract_name, contract_type,
  start_date, party_name, contract_value, status
) VALUES (
  'COMPANY_ID', 'Contrat Prestation ABC', 'client',
  '2025-11-01', 'Client ABC SAS', 50000.00, 'generated'
);

-- Signer le contrat
UPDATE generated_contracts
SET status = 'signed', signed_at = NOW(), signed_by = 'USER_ID'
WHERE id = 'CONTRACT_ID';

-- Activer puis archiver
UPDATE generated_contracts SET status = 'active' WHERE id = 'CONTRACT_ID';
UPDATE generated_contracts SET status = 'archived' WHERE id = 'CONTRACT_ID';

-- Vérifier archivage
SELECT * FROM contracts_archive WHERE generated_contract_id = 'CONTRACT_ID';
```

### 4. Module Purchases (Bons de commande)

**Tables** : `generated_purchase_orders`, `purchase_orders_archive`

**Workflow** : draft → generated → sent → approved → received → invoiced → paid → archived

**Spécificités Purchases** :
- Types : purchase_order, receipt, invoice
- Fournisseur : `supplier_id`, `supplier_name`
- Montants : `subtotal`, `tax_amount`, `total_amount`
- Données : `order_data` (JSONB items, quantities, prices)
- Référence : PO-YYYY-NNNN
- Bucket : `purchase-orders`

**Tests clés** :
```sql
-- Créer un bon de commande
INSERT INTO generated_purchase_orders (
  company_id, order_name, order_type, order_number,
  supplier_name, order_date, total_amount, status,
  order_data
) VALUES (
  'COMPANY_ID', 'BC2025-001', 'purchase_order', 'BC2025-001',
  'Fournisseur XYZ', '2025-11-09', 8500.00, 'generated',
  '{"items": [{"name": "Article A", "qty": 10, "price": 850}]}'::jsonb
);

-- Approuver
UPDATE generated_purchase_orders
SET status = 'approved', approved_at = NOW(), approved_by = 'USER_ID'
WHERE id = 'ORDER_ID';

-- Workflow complet
UPDATE generated_purchase_orders SET status = 'received' WHERE id = 'ORDER_ID';
UPDATE generated_purchase_orders SET status = 'invoiced' WHERE id = 'ORDER_ID';
UPDATE generated_purchase_orders SET status = 'paid' WHERE id = 'ORDER_ID';
UPDATE generated_purchase_orders SET status = 'archived' WHERE id = 'ORDER_ID';

-- Vérifier archivage
SELECT * FROM purchase_orders_archive WHERE generated_order_id = 'ORDER_ID';
```

## 🔍 Tests de Sécurité (RLS)

### Isolation multi-tenant

```sql
-- En tant qu'utilisateur 1 (company A)
SET LOCAL jwt.claims.sub = 'USER_ID_1';

-- Voir uniquement les données de sa company
SELECT COUNT(*) FROM generated_reports; -- Doit voir seulement company A

-- Tenter d'accéder aux données d'une autre company (doit échouer)
SELECT * FROM generated_reports WHERE company_id = 'COMPANY_B_ID'; -- Aucun résultat

-- En tant qu'utilisateur 2 (company B)
SET LOCAL jwt.claims.sub = 'USER_ID_2';
SELECT COUNT(*) FROM generated_reports; -- Doit voir seulement company B
```

## 📊 Tests de Performance

### Indexes

```sql
-- Vérifier que les index existent
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE tablename IN (
  'generated_reports', 'reports_archive',
  'generated_tax_documents', 'tax_documents_archive',
  'generated_contracts', 'contracts_archive',
  'generated_purchase_orders', 'purchase_orders_archive'
);

-- Tester performance de recherche
EXPLAIN ANALYZE
SELECT * FROM reports_archive
WHERE company_id = 'COMPANY_ID'
AND archive_reference LIKE 'ARC-2025%';
```

Attendu : Index scan, temps < 50ms

### Full-text search

```sql
-- Recherche textuelle
SELECT report_name, keywords
FROM reports_archive
WHERE keywords @@ to_tsquery('french', 'bilan & comptable');

-- Performance
EXPLAIN ANALYZE
SELECT * FROM reports_archive
WHERE keywords @@ to_tsquery('french', 'rapport');
```

## 🐛 Troubleshooting

### Problème : Trigger d'archivage ne se déclenche pas

**Vérifier** :
```sql
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname LIKE '%archive%';
```

**Solution** : Si `tgenabled = 'D'`, réactiver :
```sql
ALTER TABLE generated_reports ENABLE TRIGGER trigger_auto_archive_report;
```

### Problème : Référence d'archive non générée

**Vérifier fonction** :
```sql
SELECT generate_archive_reference('COMPANY_ID');
```

**Solution** : Ré-exécuter la migration de la fonction

### Problème : Upload de fichier échoue

**Vérifier policies storage** :
```sql
SELECT name, definition
FROM storage.policies
WHERE bucket_id = 'financial-reports';
```

**Solution** : Vérifier que `user_id` correspond à `auth.uid()` dans policies

### Problème : RLS bloque les requêtes

**Vérifier policies** :
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'generated_reports';
```

**Debug** :
```sql
-- Désactiver temporairement RLS pour debug
ALTER TABLE generated_reports DISABLE ROW LEVEL SECURITY;
-- ... tests ...
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;
```

## ✅ Checklist finale

### Base de données
- [ ] 10 tables créées
- [ ] 4 buckets storage créés
- [ ] 9 fonctions PL/pgSQL créées
- [ ] Triggers actifs (8 triggers)
- [ ] RLS policies actives (16 policies)
- [ ] Indexes créés (20+ indexes)

### Fonctionnalités Reports
- [ ] Génération de rapport fonctionne
- [ ] Sauvegarde automatique en DB
- [ ] Upload fichier vers Storage
- [ ] Workflow approval fonctionne
- [ ] Archivage automatique (trigger)
- [ ] Référence unique générée (ARC-YYYY-NNNN)
- [ ] Calcul rétention (10 ans)
- [ ] Statistiques affichées correctement
- [ ] Filtres fonctionnent
- [ ] Recherche textuelle fonctionne
- [ ] Téléchargement fichier fonctionne
- [ ] Protection suppression archives
- [ ] Comparaisons automatiques OK
- [ ] Export ZIP OK

### Fonctionnalités Tax
- [ ] Création document fiscal
- [ ] Workflow submission/validation
- [ ] Archivage automatique
- [ ] Référence TAX-YYYY-NNNN
- [ ] Rétention variable (6-10 ans)

### Fonctionnalités Contracts
- [ ] Création contrat
- [ ] Workflow signature
- [ ] Archivage automatique
- [ ] Référence CNT-YYYY-NNNN

### Fonctionnalités Purchases
- [ ] Création bon de commande
- [ ] Workflow approval/reception/payment
- [ ] Archivage automatique
- [ ] Référence PO-YYYY-NNNN

### Sécurité
- [ ] RLS isole les companies
- [ ] Users peuvent CRUD leurs données uniquement
- [ ] Storage policies fonctionnent
- [ ] Pas d'accès unauthorized

### Performance
- [ ] Queries < 100ms
- [ ] Indexes utilisés
- [ ] Full-text search performant

## 📈 Métriques de succès

À la fin des tests, vous devriez avoir :

1. **Documents créés** : Au moins 1 de chaque type (report, tax, contract, purchase)
2. **Archives** : Au moins 1 document archivé dans chaque module
3. **Références** : Générées automatiquement et uniques
4. **Fichiers** : Stockés dans les buckets appropriés
5. **Workflow** : Transitions de statut fluides
6. **Sécurité** : RLS vérifié et fonctionnel
7. **Conformité** : Rétention calculée correctement (10 ans pour rapports)

## 📝 Rapport de test

Après les tests, documenter :

```markdown
# Rapport de test - Archive Systems

Date : YYYY-MM-DD
Testeur : [Nom]
Environnement : Production/Staging

## Résultats

### Module Reports
- [ ] ✅ PASS / [ ] ❌ FAIL
- Problèmes : [Description si FAIL]

### Module Tax
- [ ] ✅ PASS / [ ] ❌ FAIL
- Problèmes : [Description si FAIL]

### Module Contracts
- [ ] ✅ PASS / [ ] ❌ FAIL
- Problèmes : [Description si FAIL]

### Module Purchases
- [ ] ✅ PASS / [ ] ❌ FAIL
- Problèmes : [Description si FAIL]

## Performance
- Temps moyen de génération : X ms
- Temps moyen d'archivage : Y ms
- Temps moyen de recherche : Z ms

## Recommandations
[Améliorations suggérées]
```

## 🎯 Prochaines étapes

Après validation complète :

1. **Documentation utilisateur** : Guide pour clients finaux
2. **Formation** : Vidéos tutorielles
3. **Dashboard analytics** : Graphiques et KPIs
4. **Notifications** : Alerts avant expiration documents
5. **API publique** : Endpoints pour intégrations tierces

---

**Dernière mise à jour** : 2025-11-09
**Version** : 1.0.0
**Contact support** : [Votre email/lien]
