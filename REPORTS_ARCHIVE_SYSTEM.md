# Système d'Archivage et de Gestion des Rapports Financiers

## 🎯 Vue d'ensemble

Système complet de génération, gestion et archivage légal des rapports financiers avec conservation automatique sur 10 ans (conformité Code de commerce Art. L123-22).

## 📋 Architecture du système

### 1. Base de données

**Migrations créées:**
- ✅ `20251109000006_create_reports_archive_system.sql` - Tables principales
- ✅ `20251109000007_create_reports_storage_bucket.sql` - Bucket de stockage

**Tables créées:**

| Table | Description | Champs principaux |
|-------|-------------|-------------------|
| `generated_reports` | Historique complet des rapports générés | status, period_start/end, file_url, metadata |
| `reports_archive` | Archive légale (10 ans) | archive_reference, retention_until, legal_requirement |
| `report_comparisons` | Comparaisons entre rapports | base_report_id, compare_report_id, variance_data |
| `report_schedules_executions` | Historique des générations programmées | schedule_id, status, execution_time |

**Fonctions SQL créées:**
- `generate_archive_reference(company_id)` - Génère référence unique ARC-YYYY-NNNN
- `calculate_retention_date(archived_at, retention_years)` - Calcule date de fin de conservation
- `auto_archive_report()` - Trigger d'archivage automatique lors du changement de statut
- `check_report_destruction_eligibility()` - Vérifie si un rapport peut être détruit
- `update_archive_keywords()` - Met à jour le full-text search
- `get_report_storage_path()` - Génère chemin de stockage structuré

**Storage Bucket:**
- Nom: `financial-reports`
- Taille max: 50 MB par fichier
- Formats: PDF, Excel, CSV, JSON
- Structure: `{company_id}/reports/{year}/{month}/` ou `{company_id}/archived/{year}/`
- Sécurité: Privé avec RLS policies

**RLS Policies:**
- 10 policies créées pour sécuriser l'accès multi-entreprise
- Séparation des droits: lecture, écriture, suppression
- Protection des archives: impossible de supprimer un document archivé

**Vues utiles:**
- `v_archive_stats` - Statistiques d'archivage par société
- `v_recent_reports` - Rapports récents avec informations utilisateurs

---

### 2. Service Layer

**Fichier:** `src/services/reportArchiveService.ts` (686 lignes)

**Fonctionnalités principales:**

#### Gestion des rapports générés
```typescript
- createGeneratedReport() - Créer un nouveau rapport
- getGeneratedReports() - Récupérer avec filtres
- getGeneratedReport() - Récupérer un rapport spécifique
- updateGeneratedReport() - Mettre à jour
- updateReportStatus() - Changer le statut (draft/generated/reviewed/approved/archived)
- deleteGeneratedReport() - Supprimer (si non archivé)
```

#### Gestion du storage
```typescript
- uploadReportFile() - Upload vers bucket Supabase
- downloadReportFile() - Téléchargement
- getSignedUrl() - URL temporaire signée (1h par défaut)
```

#### Gestion des archives légales
```typescript
- getArchives() - Récupérer archives avec filtres
- getArchiveStats() - Statistiques complètes
- logArchiveAccess() - Traçabilité des accès
```

#### Comparaisons
```typescript
- createComparison() - Créer comparaison entre 2 rapports
- getComparisons() - Récupérer comparaisons
```

#### Utilitaires
```typescript
- formatFileSize() - Format lisible (KB, MB, GB)
- getReportTypeLabel() - Labels français
- getStatusColor() - Couleurs pour UI
```

**Types TypeScript:**
- `GeneratedReport` - Rapport généré
- `ReportArchive` - Archive légale
- `ReportComparison` - Comparaison
- `ArchiveStats` - Statistiques
- `ReportFilters` - Filtres de recherche
- `ServiceResponse<T>` - Réponse générique

---

### 3. Composants UI

#### 3.1 ReportsManagementTabs
**Fichier:** `src/components/reports/ReportsManagementTabs.tsx`

Composant principal avec 3 onglets:
- 🎨 Génération
- 📊 Historique
- 📁 Archive Légale

**Features:**
- Navigation par onglets
- Refresh synchronisé entre onglets
- Header avec titre et description

#### 3.2 ReportGenerationTab
**Fichier:** `src/components/reports/ReportGenerationTab.tsx` (428 lignes)

**Fonctionnalités:**
- ✅ 5 types de rapports: Bilan, Compte de résultat, Balance, Grand livre, TVA
- ✅ Configuration période: mois/trimestre/année en cours, personnalisée
- ✅ Filtres par type et catégorie
- ✅ Notes optionnelles
- ✅ Sauvegarde automatique en base après génération
- ✅ Tags automatiques (type, FY, période)
- ✅ Téléchargement automatique
- ✅ Info conformité légale

**Rapports disponibles:**

| Type | Nom | Conformité | Temps estimé |
|------|-----|------------|--------------|
| balance_sheet | Bilan comptable | PCG, IFRS | 2-3 min |
| income_statement | Compte de résultat | PCG, IFRS | 2-3 min |
| trial_balance | Balance générale | PCG | 1-2 min |
| general_ledger | Grand livre | PCG | 5-8 min |
| vat_report | Déclaration TVA | DGFiP | 4-5 min |

#### 3.3 ReportHistoryTab
**Fichier:** `src/components/reports/ReportHistoryTab.tsx` (323 lignes)

**Fonctionnalités:**
- ✅ Statistiques: Total, Brouillons, Générés, Approuvés, Archivés
- ✅ Filtres avancés: recherche, statut, type, année fiscale
- ✅ Liste détaillée avec métadonnées
- ✅ Actions: Télécharger, Approuver, Archiver, Supprimer
- ✅ Badges de statut avec icônes
- ✅ Affichage taille fichier et dates
- ✅ Tags personnalisés
- ✅ Protection: impossible de supprimer un rapport archivé

**Workflow de statut:**
```
draft → generated → reviewed → approved → archived
   ↓         ↓          ↓          ↓          ↓
[Edit]   [Approve]  [Approve]  [Archive] [Protected]
```

#### 3.4 ReportArchiveTab
**Fichier:** `src/components/reports/ReportArchiveTab.tsx` (409 lignes)

**Fonctionnalités:**
- ✅ Statistiques d'archivage: Total, Espace, Obligatoires, Expiration, Destruction
- ✅ Filtres: recherche, type, année fiscale, catégorie légale
- ✅ Liste détaillée avec statut de conservation
- ✅ Barre de progression de rétention
- ✅ Badges de catégorie: Obligatoire, Fiscal, Audit, Historique
- ✅ Références uniques (ARC-YYYY-NNNN)
- ✅ Base légale affichée
- ✅ Traçabilité complète des accès
- ✅ Protection contre suppression

**Catégories d'archives:**

| Catégorie | Description | Icône | Couleur |
|-----------|-------------|-------|---------|
| obligatoire | Bilan, Compte de résultat | ⚖️ Scale | Rouge |
| fiscal | TVA, Déclarations fiscales | 📄 FileText | Jaune |
| audit | Rapports d'audit | 🛡️ Shield | Violet |
| historique | Archives historiques | 📁 Archive | Gris |

**Statut de conservation:**
- ✅ **Actif** (>365 jours restants): Badge vert avec compte à rebours
- ⚠️ **Expire bientôt** (<365 jours): Badge orange avec alerte
- ❌ **Peut être détruit** (date dépassée): Badge rouge

---

### 4. Intégration

**Fichier modifié:** `src/pages/ReportsPage.tsx`

Avant:
```typescript
return <StrategicReportsPage />;
```

Après:
```typescript
return <ReportsManagementTabs companyId={currentCompany.id} />;
```

Le nouveau système remplace complètement l'ancien avec architecture complète.

---

## 🔒 Sécurité et Conformité

### Conformité légale

**Code de commerce (Art. L123-22):**
- ✅ Conservation documents comptables: **10 ans minimum**
- ✅ Conservation factures: **10 ans**
- ✅ Conservation documents fiscaux: **6 ans minimum** (10 ans recommandé)

**Implémentation:**
- Rétention automatique de 10 ans pour tous les rapports
- Calcul automatique de la date de fin de conservation
- Flag `can_be_destroyed` calculé automatiquement
- Alertes avant expiration (< 1 an)

### Row Level Security (RLS)

**Niveau base de données:**
- Isolation multi-entreprise stricte
- Utilisateurs voient uniquement leurs données
- 10 policies actives sur 4 tables

**Niveau storage:**
- Bucket privé
- Accès par company_id
- URLs signées temporaires (1h)
- Protection suppression archives

### Traçabilité

**Chaque archive enregistre:**
- ✅ Qui a généré (generated_by)
- ✅ Quand (generated_at)
- ✅ Qui a vérifié (reviewed_by, reviewed_at)
- ✅ Qui a approuvé (approved_by, approved_at)
- ✅ Qui a archivé (archived_by, archived_at)
- ✅ Accès ultérieurs (access_log avec user_id, date, action)

**Full-text search:**
- Index `tsvector` sur nom, type, notes, tags
- Recherche performante en français
- Mise à jour automatique par trigger

---

## 📊 Statistiques et Métriques

### Disponibles dans ArchiveStats

```typescript
interface ArchiveStats {
  total_archives: number;           // Nombre total d'archives
  total_size_bytes: number;         // Espace utilisé (bytes)
  total_size_mb: number;            // Espace utilisé (MB)
  obligatoires: number;             // Documents obligatoires (Bilan, CR)
  fiscaux: number;                  // Documents fiscaux (TVA, etc.)
  can_be_destroyed: number;         // Archives destructibles
  expiring_soon: number;            // Expire dans < 1 an
  by_type: Record<string, number>;  // Répartition par type
  by_fiscal_year: Record<number, number>; // Répartition par année
  oldest_archive?: string;          // Plus ancienne archive
  newest_archive?: string;          // Plus récente archive
}
```

### Affichage UI

**5 cartes statistiques:**
1. Total Archives (icône Archive, bleu)
2. Espace Utilisé (icône HardDrive, violet)
3. Obligatoires (icône Scale, rouge)
4. Expire Bientôt (icône AlertCircle, orange)
5. À Détruire (icône AlertCircle, gris)

---

## 🚀 Fonctionnalités avancées

### Workflow complet

1. **Génération** (onglet Génération)
   - Utilisateur sélectionne période + type
   - Génération automatique depuis données comptables
   - Sauvegarde en base + upload storage
   - Statut: `generated`

2. **Vérification** (onglet Historique)
   - Comptable télécharge et vérifie
   - Change statut à `reviewed`
   - Peut ajouter notes

3. **Approbation** (onglet Historique)
   - Dirigeant/Expert-comptable approuve
   - Change statut à `approved`
   - Métadonnées approval enregistrées

4. **Archivage** (automatique)
   - Changement statut `approved` → `archived`
   - Trigger SQL crée entrée dans `reports_archive`
   - Génération référence unique ARC-YYYY-NNNN
   - Calcul rétention (10 ans)
   - Copie dans folder `archived/`

5. **Conservation** (onglet Archive)
   - Affichage barre progression
   - Alertes expiration
   - Traçabilité accès
   - Protection suppression

### Comparaisons (à venir)

```typescript
// Comparer 2 rapports
const comparison = await reportArchiveService.createComparison({
  company_id: '...',
  comparison_name: 'Q1 2025 vs Q1 2024',
  report_type: 'income_statement',
  base_report_id: 'report-2025-q1',
  compare_report_id: 'report-2024-q1',
  comparison_data: {
    revenue_diff: +15.2,
    expenses_diff: +8.7,
    // ...
  },
  variance_percentage: 15.2,
  key_changes: ['Revenus en hausse', 'Charges maîtrisées']
});
```

### Planification (table existante)

**Table `report_schedules`:**
- Génération automatique mensuelle/trimestrielle/annuelle
- Envoi email automatique aux destinataires
- Historique dans `report_schedules_executions`

---

## 📦 Structure des fichiers

```
Casskai/
├── supabase/migrations/
│   ├── 20251109000006_create_reports_archive_system.sql (680 lignes)
│   └── 20251109000007_create_reports_storage_bucket.sql (110 lignes)
├── src/
│   ├── services/
│   │   ├── reportGenerationService.ts (existant, 474 lignes)
│   │   └── reportArchiveService.ts (nouveau, 686 lignes)
│   ├── components/reports/
│   │   ├── ReportsManagementTabs.tsx (nouveau, 58 lignes)
│   │   ├── ReportGenerationTab.tsx (nouveau, 428 lignes)
│   │   ├── ReportHistoryTab.tsx (nouveau, 323 lignes)
│   │   └── ReportArchiveTab.tsx (nouveau, 409 lignes)
│   └── pages/
│       └── ReportsPage.tsx (modifié, intégration)
└── REPORTS_ARCHIVE_SYSTEM.md (ce fichier)
```

**Total ajouté:** ~2,500 lignes de code + migrations

---

## ✅ État actuel

### Complété
- ✅ Base de données (4 tables, 6 fonctions, 10 RLS policies, 2 vues)
- ✅ Storage bucket avec sécurité
- ✅ Service complet (reportArchiveService)
- ✅ 3 composants UI (Génération, Historique, Archive)
- ✅ Intégration dans ReportsPage
- ✅ TypeScript sans erreurs (liées au système Reports)

### Tests réussis
- ✅ Compilation TypeScript
- ✅ Pas d'erreurs dans les nouveaux fichiers
- ✅ Architecture cohérente avec module HR

---

## 🔄 Réplication pour autres modules

Ce système est conçu pour être facilement adapté à:

### Tax Module (Déclarations fiscales)
- Tables: `generated_tax_declarations`, `tax_declarations_archive`
- Bucket: `tax-documents`
- Types: TVA, IS, CVAE, CFE, etc.
- Conservation: 6 ans minimum

### Contracts Module (Contrats)
- Tables: `generated_contracts`, `contracts_archive`
- Bucket: `contracts`
- Types: Clients, Fournisseurs, CDI, CDD, etc.
- Conservation: 5-10 ans selon type

### Purchases Module (Bons de commande)
- Tables: `generated_purchase_orders`, `purchase_orders_archive`
- Bucket: `purchase-orders`
- Types: Commandes, Réceptions, Factures
- Conservation: 10 ans

**Pattern à suivre:**
1. Copier migrations Reports
2. Adapter noms tables et bucket
3. Ajuster types et durées conservation
4. Copier service et adapter
5. Copier composants UI et adapter
6. Intégrer dans page module

---

## 💡 Avantages du système

### Pour l'entreprise
- ✅ **Conformité légale garantie** - Conservation automatique 10 ans
- ✅ **Gain de temps** - Plus besoin de gérer manuellement
- ✅ **Traçabilité complète** - Qui a fait quoi, quand
- ✅ **Recherche puissante** - Retrouver n'importe quel rapport en secondes
- ✅ **Sécurité** - Protection multi-niveau (RLS, bucket privé, accès tracés)

### Pour les utilisateurs
- ✅ **Interface intuitive** - 3 onglets clairs
- ✅ **Workflow guidé** - draft → generated → approved → archived
- ✅ **Alertes proactives** - Expiration proche, destruction possible
- ✅ **Accès rapide** - Téléchargement 1-click
- ✅ **Comparaisons** - Analyser évolutions

### Pour les développeurs
- ✅ **Code modulaire** - Service séparé, composants réutilisables
- ✅ **TypeScript strict** - Types complets, pas d'`any`
- ✅ **Patterns cohérents** - Même architecture que HR
- ✅ **Documentation inline** - JSDoc sur toutes fonctions
- ✅ **Extensible** - Facile d'ajouter nouveaux types de rapports

---

## 📚 Documentation complémentaire

### Références légales
- Code de commerce Art. L123-22 (conservation documents comptables)
- Code général des impôts Art. 54 (conservation fiscale)
- DGFiP - Conservation des documents (6 ans TVA, 10 ans compta)

### Architecture Supabase
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage](https://supabase.com/docs/guides/storage)
- [Database Functions](https://supabase.com/docs/guides/database/functions)

### Patterns utilisés
- Repository Pattern (services)
- Component Composition (UI)
- Controlled Components (formulaires)
- Optimistic UI Updates

---

## 🎓 Pour aller plus loin

### Phase 2 (à implémenter)
- [ ] Comparaison automatique mensuelle
- [ ] Envoi email automatique
- [ ] Export groupé (tous rapports d'une période)
- [ ] Annotations sur rapports
- [ ] Partage sécurisé temporaire
- [ ] Dashboard analytics
- [ ] Alertes personnalisables

### Phase 3 (avancé)
- [ ] OCR pour documents scannés
- [ ] Signature électronique intégrée
- [ ] Validation automatique par IA
- [ ] Export vers comptable (FEC)
- [ ] Synchronisation cloud (Google Drive, Dropbox)
- [ ] Mobile app (consultation archives)

---

## 👨‍💻 Auteur

Système créé le 9 novembre 2025 par Claude (Anthropic)
Basé sur l'architecture du module HR Document Templates

**Contact projet:** CassKai - Plateforme de gestion d'entreprise

---

## 📄 License

Ce système fait partie du projet CassKai.
Tous droits réservés.
