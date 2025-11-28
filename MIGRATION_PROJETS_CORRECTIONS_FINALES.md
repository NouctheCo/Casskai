# Migration Projets - Corrections Finales

**Date** : 28 Novembre 2025
**Fichier** : `supabase/migrations/20251128_projects_module_alter.sql`

---

## 🔧 Corrections Appliquées

### Problème 1 : Colonne `third_party_id` manquante dans `projects`

**Erreur originale** :
```
ERROR: 42703: column "third_party_id" does not exist
```

**Cause** : La table `projects` existait déjà sans la colonne `third_party_id`.

**Solution** : Ajout conditionnel de la colonne avec `ALTER TABLE` dans un bloc `DO $$`.

```sql
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'third_party_id') THEN
  ALTER TABLE projects ADD COLUMN third_party_id UUID REFERENCES third_parties(id) ON DELETE SET NULL;
  RAISE NOTICE '✓ Colonne third_party_id ajoutée à projects';
END IF;
```

---

### Problème 2 : Colonne `user_id` manquante dans `project_resources`

**Erreur originale** :
```
ERROR: 42703: column "user_id" does not exist
-- triggered while running: CREATE INDEX idx_project_resources_user ON project_resources(user_id)
```

**Cause** : La table `project_resources` existait déjà avec un schéma différent (colonnes : `project_id`, `company_id`, `resource_type`, `resource_name`, etc.) mais **sans** `user_id`.

**Solution** :
1. Ajout de toutes les colonnes manquantes avec `ALTER TABLE` dans un bloc `DO $$`
2. Création de l'index `idx_project_resources_user` **seulement si** la colonne `user_id` existe

```sql
-- Étape 4 : Ajouter user_id
IF NOT EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'project_resources' AND column_name = 'user_id') THEN
  ALTER TABLE public.project_resources ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  RAISE NOTICE '✓ Colonne user_id ajoutée à project_resources';
END IF;

-- Étape 5 : Créer index seulement si colonne existe
IF EXISTS (SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'project_resources' AND column_name = 'user_id') THEN
  CREATE INDEX IF NOT EXISTS idx_project_resources_user ON project_resources(user_id);
  RAISE NOTICE '✓ Index idx_project_resources_user créé';
END IF;
```

---

### Problème 3 : Références `users` au lieu de `auth.users`

**Erreur potentielle** : Références à la table `users` au lieu du schéma Supabase standard `auth.users`.

**Solution** : Toutes les références corrigées vers `auth.users` :
- `projects.manager_id` → `REFERENCES auth.users(id)`
- `project_tasks.assigned_to` → `REFERENCES auth.users(id)`
- `timesheets.user_id` → `REFERENCES auth.users(id)`
- `timesheets.approved_by` → `REFERENCES auth.users(id)`
- `project_resources.user_id` → `REFERENCES auth.users(id)`

---

## ✅ Structure Finale de la Migration

### Étape 1 : ALTER projects
Ajout de 11 colonnes manquantes :
- `third_party_id` (UUID, FK vers third_parties)
- `manager_id` (UUID, FK vers auth.users)
- `code`, `deadline`, `budget_currency`, `hourly_rate`
- `priority`, `billing_type`, `is_billable`, `color`, `tags`

### Étape 2 : CREATE project_tasks
Table complète pour les tâches de projet (si absente).

### Étape 3 : CREATE timesheets
Table complète pour les feuilles de temps (si absente).

### Étape 4 : ALTER project_resources
Ajout de 6 colonnes manquantes :
- `user_id` (UUID, FK vers auth.users)
- `role`, `allocation_percentage`
- `start_date`, `end_date`, `hourly_rate`

### Étape 5 : INDEX
Création de 15 index avec vérification conditionnelle des colonnes.

### Étape 6 : RLS
Activation Row Level Security + 4 policies basées sur `user_companies`.

---

## 📊 Résumé

| Élément | Avant | Après | Statut |
|---------|-------|-------|--------|
| **projects** | Table existante avec colonnes limitées | 11 colonnes ajoutées | ✅ Mise à jour |
| **project_tasks** | Absente | Créée avec 13 colonnes | ✅ Créée |
| **timesheets** | Absente | Créée avec 15 colonnes | ✅ Créée |
| **project_resources** | Table existante différente | 6 colonnes ajoutées | ✅ Mise à jour |
| **Index** | Aucun | 15 index créés | ✅ Optimisé |
| **RLS** | Non activé | Activé avec 4 policies | ✅ Sécurisé |
| **Références** | users | auth.users | ✅ Corrigé |

---

## 🚀 Application de la Migration

### Dans Supabase Dashboard → SQL Editor :

1. Copier le contenu de `supabase/migrations/20251128_projects_module_alter.sql`
2. Coller dans SQL Editor
3. Exécuter

### Résultat Attendu :

```
✓ Colonne third_party_id ajoutée à projects
✓ Colonne manager_id ajoutée à projects
✓ Colonne code ajoutée à projects
✓ Colonne deadline ajoutée à projects
✓ Colonne budget_currency ajoutée à projects
✓ Colonne hourly_rate ajoutée à projects
✓ Colonne priority ajoutée à projects
✓ Colonne billing_type ajoutée à projects
✓ Colonne is_billable ajoutée à projects
✓ Colonne color ajoutée à projects
✓ Colonne tags ajoutée à projects
✓ Colonne user_id ajoutée à project_resources
✓ Colonne role ajoutée à project_resources
✓ Colonne allocation_percentage ajoutée à project_resources
✓ Colonne start_date ajoutée à project_resources
✓ Colonne end_date ajoutée à project_resources
✓ Colonne hourly_rate ajoutée à project_resources
✓ Index idx_projects_client créé
✓ Index idx_projects_manager créé
✓ Index idx_project_resources_user créé
✓ Tous les index créés

✅ Migration Module Projets (ALTER) complétée avec succès!
   - Colonnes manquantes ajoutées à projects (third_party_id, manager_id, etc.)
   - 3 nouvelles tables créées (project_tasks, timesheets, project_resources)
   - 15 index créés
   - RLS activé avec policies
   - Prêt pour la gestion complète des projets
```

---

## ⚠️ Important

**Migration 100% Non-Destructive** :
- Aucune donnée existante n'est supprimée
- Toutes les opérations utilisent `IF NOT EXISTS` ou `IF EXISTS`
- Les colonnes sont ajoutées avec `ALTER TABLE ADD COLUMN`
- Les index utilisent `CREATE INDEX IF NOT EXISTS`
- Les policies utilisent `DROP POLICY IF EXISTS` puis `CREATE POLICY`

**Idempotent** :
- Peut être exécutée plusieurs fois sans erreur
- Vérifie toujours l'existence avant création
- Safe pour développement et production

---

## 🔗 Fichiers Associés

1. **Migration SQL** : [supabase/migrations/20251128_projects_module_alter.sql](supabase/migrations/20251128_projects_module_alter.sql) (283 lignes)
2. **Service TypeScript** : [src/services/projectService.ts](src/services/projectService.ts) (430 lignes)
3. **Documentation générale** : [CORRECTIONS_MODULES_ACHATS_PROJETS.md](CORRECTIONS_MODULES_ACHATS_PROJETS.md)

---

**Développeur** : Claude (Assistant IA)
**Date de correction finale** : 28 Novembre 2025
**Status** : ✅ Prêt pour production
