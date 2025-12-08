# 📊 Migration Supabase - 05 Janvier 2025

## 🎯 Objectif

Cette migration ajoute **9 nouvelles tables** pour les modules **CRM** et **HR** de CassKai, avec leurs **policies RLS** (Row Level Security) complètes.

---

## 📁 Fichiers de Migration

### 1. `20250105_add_missing_tables.sql` (382 lignes)
**Tables créées :**
- ✅ `crm_clients` - Clients et prospects
- ✅ `crm_contacts` - Contacts associés aux clients
- ✅ `crm_opportunities` - Opportunités commerciales (pipeline)
- ✅ `crm_commercial_actions` - Actions commerciales (appels, meetings, etc.)
- ✅ `hr_employees` - Employés de l'entreprise
- ✅ `hr_leaves` - Demandes de congés
- ✅ `hr_expenses` - Notes de frais
- ✅ `hr_time_tracking` - Suivi du temps de travail
- ✅ `hr_payroll` - Fiches de paie et calculs

**Améliorations :**
- Ajout colonnes `tax_id`, `industry`, `logo_url` dans `companies`
- 20 index pour performances
- 9 triggers `updated_at` automatiques
- Contraintes de validation (emails, montants, dates)

### 2. `20250105_add_rls_policies.sql` (240 lignes)
**Sécurité RLS :**
- 36 policies (4 par table : SELECT, INSERT, UPDATE, DELETE)
- Fonction helper `user_has_access_to_company()`
- Permissions `GRANT` pour utilisateurs authentifiés
- Isolation multi-tenant complète

---

## 🚀 Exécution des Migrations

### Option 1 : Via Supabase CLI (Recommandé)

```bash
# 1. Se connecter au projet
supabase link --project-ref <votre-project-ref>

# 2. Appliquer les migrations dans l'ordre
supabase db push

# Ou manuellement :
supabase db execute --file ./supabase/migrations/20250105_add_missing_tables.sql
supabase db execute --file ./supabase/migrations/20250105_add_rls_policies.sql
```

### Option 2 : Via Supabase Dashboard

1. **Aller sur** : https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. **Copier-coller** le contenu de `20250105_add_missing_tables.sql`
3. **Exécuter** ✅
4. **Copier-coller** le contenu de `20250105_add_rls_policies.sql`
5. **Exécuter** ✅

### Option 3 : Via psql (Avancé)

```bash
# Connexion directe à la base
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# Exécuter les fichiers
\i supabase/migrations/20250105_add_missing_tables.sql
\i supabase/migrations/20250105_add_rls_policies.sql
```

---

## ✅ Vérification Post-Migration

### 1. Vérifier les tables créées

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'crm_%' OR table_name LIKE 'hr_%'
ORDER BY table_name;
```

**Résultat attendu :** 9 tables

### 2. Vérifier les policies RLS

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename LIKE 'crm_%' OR tablename LIKE 'hr_%'
ORDER BY tablename, policyname;
```

**Résultat attendu :** 36 policies

### 3. Vérifier les index

```sql
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND (tablename LIKE 'crm_%' OR tablename LIKE 'hr_%')
ORDER BY tablename, indexname;
```

**Résultat attendu :** 20+ index

### 4. Test d'accès utilisateur

```sql
-- En tant qu'utilisateur authentifié
SELECT * FROM crm_clients LIMIT 1;
SELECT * FROM hr_employees LIMIT 1;
```

**Résultat attendu :** Pas d'erreur RLS

---

## 📊 Schéma des Relations

```
companies (existante)
    ↓
    ├─→ crm_clients (enterprise_id)
    │       ↓
    │       ├─→ crm_contacts (client_id)
    │       ├─→ crm_opportunities (client_id)
    │       │       ↓
    │       │       └─→ crm_commercial_actions (opportunity_id)
    │
    └─→ hr_employees (company_id)
            ↓
            ├─→ hr_leaves (employee_id)
            ├─→ hr_expenses (employee_id)
            ├─→ hr_time_tracking (employee_id)
            └─→ hr_payroll (employee_id)
```

---

## 🔒 Sécurité RLS

**Principe :** Isolation multi-tenant basée sur `user_companies`

```sql
-- Fonction centrale
user_has_access_to_company(company_uuid)
    ↓
    Vérifie : auth.uid() ∈ user_companies WHERE company_id = company_uuid
```

**Résultat :**
- ✅ Utilisateur A voit uniquement les données de ses entreprises
- ✅ Utilisateur B ne peut pas accéder aux données de A
- ✅ Protection automatique à chaque requête
- ✅ Pas de code métier nécessaire côté frontend

---

## 📈 Statistiques

| Catégorie | Valeur |
|-----------|--------|
| **Tables créées** | 9 |
| **Colonnes totales** | ~120 |
| **Policies RLS** | 36 |
| **Index créés** | 20 |
| **Triggers** | 9 |
| **Contraintes** | 25+ |
| **Lignes SQL** | 622 |

---

## 🎯 Modules Activés

### ✅ Module CRM
- Gestion clients/prospects
- Pipeline opportunités
- Actions commerciales
- Contacts multiples par client
- Analytics et forecasting prêts

### ✅ Module HR
- Gestion employés
- Congés et absences
- Notes de frais
- Suivi du temps
- Calcul de paie avec comptabilité

---

## ⚠️ Points d'Attention

1. **Backup avant migration**
   ```bash
   supabase db dump -f backup_avant_migration_05jan.sql
   ```

2. **Ordre des migrations**
   - ⚠️ Exécuter `add_missing_tables.sql` **AVANT** `add_rls_policies.sql`

3. **Table `companies` existante**
   - La migration vérifie l'existence des colonnes avant ajout
   - Pas de risque de doublon

4. **Performance**
   - Les index sont créés automatiquement
   - Pas de downtime prévu (<10s d'exécution)

---

## 🔄 Rollback (En Cas de Problème)

```sql
-- Supprimer les tables CRM
DROP TABLE IF EXISTS public.crm_commercial_actions CASCADE;
DROP TABLE IF EXISTS public.crm_opportunities CASCADE;
DROP TABLE IF EXISTS public.crm_contacts CASCADE;
DROP TABLE IF EXISTS public.crm_clients CASCADE;

-- Supprimer les tables HR
DROP TABLE IF EXISTS public.hr_payroll CASCADE;
DROP TABLE IF EXISTS public.hr_time_tracking CASCADE;
DROP TABLE IF EXISTS public.hr_expenses CASCADE;
DROP TABLE IF EXISTS public.hr_leaves CASCADE;
DROP TABLE IF EXISTS public.hr_employees CASCADE;

-- Supprimer la fonction helper
DROP FUNCTION IF EXISTS public.user_has_access_to_company(UUID);
```

---

## 📞 Support

En cas de problème :
1. Vérifier les logs Supabase : Dashboard > Database > Logs
2. Tester la connexion : `supabase status`
3. Vérifier les permissions : `SELECT current_user, session_user;`

---

## ✅ Checklist Post-Migration

- [ ] Migration `20250105_add_missing_tables.sql` exécutée
- [ ] Migration `20250105_add_rls_policies.sql` exécutée
- [ ] 9 tables visibles dans Dashboard
- [ ] 36 policies RLS actives
- [ ] Test SELECT sur `crm_clients` réussi
- [ ] Test SELECT sur `hr_employees` réussi
- [ ] Frontend CassKai fonctionne sans erreur
- [ ] Backup créé avant migration

---

**Date de création :** 05 Janvier 2025
**Version CassKai :** 1.0
**Auteur :** Claude Code
**Statut :** ✅ Production-Ready
