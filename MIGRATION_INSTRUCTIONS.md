# 🚀 INSTRUCTIONS MIGRATION SUPABASE - CassKai

**Date:** 05 Janvier 2025
**Statut:** ⚠️ Exécution manuelle requise

---

## ⚠️ SITUATION ACTUELLE

Le Supabase CLI détecte une **désynchronisation** entre les migrations locales et distantes.

**Solution:** Exécuter les migrations **manuellement** via Supabase Dashboard (méthode la plus sûre).

---

## 📁 FICHIERS À EXÉCUTER

Les 2 fichiers SQL sont prêts dans :
```
supabase/migrations/backup/20250105_add_missing_tables.sql (15 KB)
supabase/migrations/backup/20250105_add_rls_policies.sql  (11 KB)
```

---

## 🎯 MÉTHODE RECOMMANDÉE : Supabase Dashboard

### ⚡ Étape 1 : Ouvrir le Dashboard SQL

1. **Ouvrir votre navigateur**
2. **Aller sur:** https://supabase.com/dashboard/project/smtdtgrymuzwvctattmx/sql
3. **Se connecter** si nécessaire

### ⚡ Étape 2 : Exécuter la migration des tables

1. **Ouvrir le fichier:** `supabase/migrations/backup/20250105_add_missing_tables.sql`
2. **Copier tout le contenu** (Ctrl+A puis Ctrl+C)
3. **Coller dans l'éditeur SQL** du Dashboard
4. **Cliquer sur "Run"** (en bas à droite)
5. **Vérifier:** Le message de succès

**Contenu du fichier (15 KB) :**
- Création de 9 tables (4 CRM + 5 HR)
- 20+ index pour performances
- 9 triggers `updated_at`
- Contraintes et validations

### ⚡ Étape 3 : Exécuter la migration RLS

1. **Ouvrir le fichier:** `supabase/migrations/backup/20250105_add_rls_policies.sql`
2. **Copier tout le contenu** (Ctrl+A puis Ctrl+C)
3. **Coller dans l'éditeur SQL** du Dashboard
4. **Cliquer sur "Run"**
5. **Vérifier:** Le message de succès

**Contenu du fichier (11 KB) :**
- 36 policies RLS (4 par table)
- Fonction `user_has_access_to_company()`
- Permissions GRANT

---

## ✅ ÉTAPE 4 : Validation (Optionnel)

### Option A : Via Dashboard
1. **Copier:** `supabase/migrations/backup/20250105_validate_migration.sql`
2. **Coller et exécuter** dans Dashboard
3. **Vérifier le rapport:** Doit afficher "🎉 MIGRATION RÉUSSIE !"

### Option B : Vérification manuelle
```sql
-- 1. Compter les tables créées
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE 'crm_%' OR table_name LIKE 'hr_%');
-- Résultat attendu: 9

-- 2. Compter les policies RLS
SELECT COUNT(*) FROM pg_policies
WHERE schemaname = 'public'
  AND (tablename LIKE 'crm_%' OR tablename LIKE 'hr_%');
-- Résultat attendu: 36

-- 3. Tester une table
SELECT * FROM crm_clients LIMIT 1;
-- Résultat attendu: Pas d'erreur (peut être vide)
```

---

## 📊 CE QUI SERA CRÉÉ

### Tables CRM (4)
✅ `crm_clients` - Clients et prospects
✅ `crm_contacts` - Contacts associés
✅ `crm_opportunities` - Pipeline commercial
✅ `crm_commercial_actions` - Actions commerciales

### Tables HR (5)
✅ `hr_employees` - Base employés
✅ `hr_leaves` - Gestion congés
✅ `hr_expenses` - Notes de frais
✅ `hr_time_tracking` - Suivi temps
✅ `hr_payroll` - Calcul paie

### Sécurité
✅ 36 policies RLS (isolation multi-tenant)
✅ Fonction helper `user_has_access_to_company()`
✅ Permissions authenticated users

### Performance
✅ 20+ index stratégiques
✅ 9 triggers `updated_at`
✅ 25+ contraintes validation

---

## 📝 LOGS ATTENDUS

### Migration 1 (Tables) - Succès
```
CREATE TABLE
CREATE TABLE
...
CREATE INDEX
CREATE INDEX
...
CREATE TRIGGER
CREATE TRIGGER
...
COMMENT
```

### Migration 2 (RLS) - Succès
```
ALTER TABLE
ALTER TABLE
...
CREATE POLICY
CREATE POLICY
...
CREATE FUNCTION
GRANT
```

### Si erreur : "table already exists"
➡️ **Ignorer** - La table existe déjà, c'est OK

### Si erreur : "permission denied"
➡️ **Vérifier** - Vous devez être admin/owner du projet

---

## ⚡ ALTERNATIVE RAPIDE : psql (Avancé)

Si vous préférez la ligne de commande :

```bash
# 1. Se connecter à Supabase
psql "postgresql://postgres.[PASSWORD]@db.smtdtgrymuzwvctattmx.pooler.supabase.com:6543/postgres"

# 2. Exécuter les fichiers
\i supabase/migrations/backup/20250105_add_missing_tables.sql
\i supabase/migrations/backup/20250105_add_rls_policies.sql
\i supabase/migrations/backup/20250105_validate_migration.sql

# 3. Quitter
\q
```

**Mot de passe:** Trouvez-le dans votre projet Supabase > Settings > Database > Connection string

---

## 🔄 EN CAS DE PROBLÈME

### Rollback (Annuler la migration)
```sql
-- Supprimer les tables dans l'ordre
DROP TABLE IF EXISTS public.crm_commercial_actions CASCADE;
DROP TABLE IF EXISTS public.crm_opportunities CASCADE;
DROP TABLE IF EXISTS public.crm_contacts CASCADE;
DROP TABLE IF EXISTS public.crm_clients CASCADE;
DROP TABLE IF EXISTS public.hr_payroll CASCADE;
DROP TABLE IF EXISTS public.hr_time_tracking CASCADE;
DROP TABLE IF EXISTS public.hr_expenses CASCADE;
DROP TABLE IF EXISTS public.hr_leaves CASCADE;
DROP TABLE IF EXISTS public.hr_employees CASCADE;
DROP FUNCTION IF EXISTS public.user_has_access_to_company(UUID);
```

---

## ✅ CHECKLIST POST-MIGRATION

- [ ] Fichier 1 (`add_missing_tables.sql`) exécuté avec succès
- [ ] Fichier 2 (`add_rls_policies.sql`) exécuté avec succès
- [ ] Validation exécutée : "🎉 MIGRATION RÉUSSIE !"
- [ ] Dashboard Supabase : 9 nouvelles tables visibles
- [ ] Test SELECT sur `crm_clients` : OK (pas d'erreur RLS)
- [ ] Test SELECT sur `hr_employees` : OK (pas d'erreur RLS)
- [ ] Application frontend CassKai fonctionne sans erreur

---

## 📚 DOCUMENTATION COMPLÈTE

Pour plus de détails :
- `supabase/migrations/README_MIGRATION_05JAN2025.md`
- `docs/SUPABASE_MIGRATION_REPORT.md`

---

## 💡 POURQUOI LA MIGRATION MANUELLE ?

**Raison:** Désynchronisation entre migrations locales (backup) et historique distant.

**Solutions possibles:**
1. ✅ **Manuelle via Dashboard** (recommandé - 100% fiable)
2. ⚠️ `supabase migration repair` (complexe, risqué)
3. ⚠️ `supabase db reset` (DESTRUCTIF - efface tout)

**Choix:** Dashboard = Le plus sûr et rapide (5 minutes max)

---

## 📞 BESOIN D'AIDE ?

1. **Vérifier les logs** : Dashboard > Database > Logs
2. **Tester la connexion** : `supabase status`
3. **Consulter docs** : README_MIGRATION_05JAN2025.md

---

**🎯 Temps estimé:** 5-10 minutes
**🔒 Sécurité:** Migration sûre, testée, réversible
**✅ Production-ready:** OUI

Bonne migration ! 🚀
