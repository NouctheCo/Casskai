# 🔒 Déploiement de la Migration de Sécurité

**Date**: 2026-01-30  
**Fichier**: `supabase/migrations/20260130_fix_security_linter_issues.sql`  
**Objectif**: Corriger 4 erreurs et 7 warnings du linter Supabase

---

## ⚠️ Problème Rencontré avec le CLI

La commande `npx supabase db push` échoue en raison d'une ancienne migration (`20250104_add_missing_automation_columns_v2.sql`) qui contient une erreur:

```
ERROR: relation "workflows_company_id_name_key" already exists (SQLSTATE 42P07)
```

**Solution recommandée**: Déployer la nouvelle migration manuellement via le Dashboard Supabase.

---

## 📋 Instructions de Déploiement Manuel

### Étape 1: Ouvrir le SQL Editor Supabase

1. Connectez-vous à [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet **CassKai** (ID: `smtdtgrymuzwvctattmx`)
3. Allez dans l'onglet **SQL Editor** (dans le menu de gauche)

### Étape 2: Créer une Nouvelle Requête

1. Cliquez sur le bouton **"New query"** en haut à droite
2. Nommez la requête: `20260130_fix_security_linter_issues`

### Étape 3: Copier-Coller le SQL

Copiez **tout le contenu** du fichier suivant:

```
c:\Users\noutc\Casskai\supabase\migrations\20260130_fix_security_linter_issues.sql
```

Et collez-le dans l'éditeur SQL.

### Étape 4: Exécuter la Migration

1. Cliquez sur le bouton **"Run"** (ou appuyez sur `Ctrl+Enter`)
2. Attendez que l'exécution se termine (environ 5-10 secondes)
3. Vérifiez qu'il n'y a **aucune erreur** dans les résultats

### Étape 5: Vérifier les Résultats

Vous devriez voir dans les messages de sortie:

```
NOTICE: 🔧 Correction des vues SECURITY DEFINER...
NOTICE: 🔒 Activation RLS sur les tables de migration...
NOTICE: 🔍 Correction des search_path des fonctions...
NOTICE: 🔄 Recréation des triggers pour les vues...
NOTICE: ✅ Vérification finale des corrections...
NOTICE:   ✓ Vue customers: SECURITY INVOKER
NOTICE:   ✓ Vue suppliers: SECURITY INVOKER
NOTICE:   ✓ RLS migration_third_parties_log: ACTIVÉ
NOTICE:   ✓ RLS third_parties_id_mapping: ACTIVÉ
NOTICE:   ✓ Fonctions avec search_path: 7 / 7
NOTICE: ✅ Migration terminée avec succès!
```

---

## ✅ Vérifications Post-Déploiement

### Test 1: Vérifier les Vues SECURITY INVOKER

Exécutez cette requête dans le SQL Editor:

```sql
SELECT 
    viewname,
    CASE 
        WHEN pg_get_viewdef(schemaname || '.' || viewname)::text LIKE '%security_invoker%' 
        THEN 'SECURITY INVOKER ✅' 
        ELSE 'SECURITY DEFINER ❌' 
    END AS security_mode
FROM pg_views
WHERE schemaname = 'public'
AND viewname IN ('customers', 'suppliers');
```

**Résultat attendu**:
```
customers  | SECURITY INVOKER ✅
suppliers  | SECURITY INVOKER ✅
```

### Test 2: Vérifier RLS Activé

```sql
SELECT 
    schemaname,
    tablename,
    CASE WHEN rowsecurity THEN 'ACTIVÉ ✅' ELSE 'DÉSACTIVÉ ❌' END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('migration_third_parties_log', 'third_parties_id_mapping');
```

**Résultat attendu**:
```
migration_third_parties_log | ACTIVÉ ✅
third_parties_id_mapping    | ACTIVÉ ✅
```

### Test 3: Vérifier les Fonctions search_path

```sql
SELECT 
    proname,
    CASE 
        WHEN prosrc LIKE '%SET search_path%' 
        THEN 'search_path FIXÉ ✅' 
        ELSE 'search_path MUTABLE ❌' 
    END AS search_path_status
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname IN (
    'insert_customer_view',
    'update_customer_view',
    'delete_customer_view',
    'insert_supplier_view',
    'update_supplier_view',
    'delete_supplier_view',
    'extend_user_trial'
);
```

**Résultat attendu**: 7 fonctions avec `search_path FIXÉ ✅`

---

## 🔐 Configuration Manuelle Requise

### Activer la Protection contre les Mots de Passe Compromis

Cette configuration ne peut pas être faite via SQL, vous devez l'activer manuellement:

1. Allez dans **Settings** → **Authentication** (dans le menu de gauche)
2. Trouvez la section **"Password Policy"**
3. Activez l'option **"Leaked password protection"**
   - Utilise la base de données HaveIBeenPwned
   - Empêche l'utilisation de mots de passe compromis
4. Cliquez sur **"Save"**

---

## 📊 Résumé des Corrections

### ✅ Erreurs Corrigées (4)

1. **customers view** → Convertie en `SECURITY INVOKER`
2. **suppliers view** → Convertie en `SECURITY INVOKER`
3. **migration_third_parties_log** → RLS activé avec politique admin-only
4. **third_parties_id_mapping** → RLS activé avec politique company-scoped

### ✅ Warnings Corrigés (7)

1. `insert_customer_view()` → `SET search_path = public, pg_temp`
2. `update_customer_view()` → `SET search_path = public, pg_temp`
3. `delete_customer_view()` → `SET search_path = public, pg_temp`
4. `insert_supplier_view()` → `SET search_path = public, pg_temp`
5. `update_supplier_view()` → `SET search_path = public, pg_temp`
6. `delete_supplier_view()` → `SET search_path = public, pg_temp`
7. `extend_user_trial()` → `SET search_path = public, pg_temp`

### ⚠️ Warning Non Corrigé (1)

- **auth_leaked_password_protection** → Configuration manuelle requise (voir ci-dessus)

---

## 🎯 Score Final Attendu

**Avant**: 4 erreurs + 8 warnings  
**Après**: 0 erreurs + 1 warning (auth config uniquement)

---

## 🚨 En Cas d'Erreur

Si vous rencontrez une erreur lors de l'exécution:

1. **Copier le message d'erreur complet**
2. **Ne pas paniquer** - la migration est idempotente (peut être réexécutée)
3. **Vérifier que la table/vue/fonction existe** avant de tenter de la modifier
4. **Me contacter** avec l'erreur exacte

---

## 📝 Prochaines Étapes

Après avoir déployé cette migration avec succès:

1. ✅ Relancer le linter Supabase pour confirmer 0 erreurs
2. ✅ Tester l'accès aux vues `customers` et `suppliers` depuis l'application
3. ✅ Vérifier que les politiques RLS fonctionnent correctement
4. ✅ Documenter le déploiement dans le CHANGELOG
5. ✅ Activer la protection contre les mots de passe compromis (manuel)

---

## 📖 Documentation de Référence

- [Supabase Security Best Practices](https://supabase.com/docs/guides/database/security)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Search Path Configuration](https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-PATH)
- [SECURITY INVOKER vs DEFINER](https://www.postgresql.org/docs/current/sql-createview.html)

---

**Migration créée par**: GitHub Copilot  
**Fichier source**: `supabase/migrations/20260130_fix_security_linter_issues.sql`  
**Documentation**: `docs/SUPABASE_LINTER_FIX_2026-01-30.md`
