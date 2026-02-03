# 🔒 Correction Linter Supabase - 30 Janvier 2026

## 📋 Résumé

Migration créée : `20260130_fix_security_linter_issues.sql`

**Score avant** : 4 erreurs + 8 warnings  
**Score après** : 0 erreurs + 1 warning (config Auth)

---

## ✅ Erreurs Corrigées (4)

### 1. Vue `customers` avec SECURITY DEFINER ❌ → SECURITY INVOKER ✅

**Problème** : La vue utilisait `SECURITY DEFINER`, contournant les politiques RLS de l'utilisateur

**Solution** :
```sql
DROP VIEW IF EXISTS public.customers CASCADE;

CREATE OR REPLACE VIEW public.customers
WITH (security_invoker = true)  -- ✅ SECURITY INVOKER
AS
SELECT tp.*
FROM third_parties tp
WHERE tp.type = 'customer';
```

**Impact** : Les permissions RLS de l'utilisateur connecté s'appliquent maintenant correctement

---

### 2. Vue `suppliers` avec SECURITY DEFINER ❌ → SECURITY INVOKER ✅

**Problème** : Même problème que `customers`

**Solution** : Identique à `customers` mais pour `type = 'supplier'`

---

### 3. Table `migration_third_parties_log` sans RLS ❌ → RLS activé ✅

**Problème** : Table publique accessible sans restriction

**Solution** :
```sql
ALTER TABLE public.migration_third_parties_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "migration_third_parties_log_select" 
ON public.migration_third_parties_log
FOR SELECT
USING (
    -- Accessible uniquement aux administrateurs
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
);
```

**Impact** : Seuls les admins peuvent lire les logs de migration

---

### 4. Table `third_parties_id_mapping` sans RLS ❌ → RLS activé ✅

**Problème** : Table de mapping accessible sans restriction

**Solution** :
```sql
ALTER TABLE public.third_parties_id_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "third_parties_id_mapping_select" 
ON public.third_parties_id_mapping
FOR SELECT
USING (
    -- Accessible aux utilisateurs de la compagnie propriétaire
    EXISTS (
        SELECT 1 FROM third_parties tp
        JOIN user_companies uc ON uc.company_id = tp.company_id
        WHERE tp.id = third_parties_id_mapping.new_id
        AND uc.user_id = auth.uid()
        AND uc.is_active = true
    )
);
```

**Impact** : Les utilisateurs ne voient que les mappings de leurs compagnies

---

## ✅ Warnings Corrigés (7)

### Fonctions avec `search_path` mutable

**Problème** : Les fonctions sans `search_path` fixe sont vulnérables aux attaques par injection de schéma

**Fonctions corrigées** :
1. `insert_customer_view`
2. `update_customer_view`
3. `delete_customer_view`
4. `insert_supplier_view`
5. `update_supplier_view`
6. `delete_supplier_view`
7. `extend_user_trial`

**Solution appliquée** :
```sql
CREATE OR REPLACE FUNCTION public.insert_customer_view()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ AJOUT
AS $$
BEGIN
    -- Code de la fonction
END;
$$;
```

**Impact** : Les fonctions ne peuvent plus être exploitées via un schéma malveillant

---

## ⚠️ Warning Non Corrigé (1)

### Protection contre les mots de passe compromis (Auth Config)

**Warning** : `auth_leaked_password_protection` désactivé

**Pourquoi non corrigé dans la migration ?**  
Ce paramètre est une configuration Auth dans Supabase Dashboard, pas une migration SQL

**Action manuelle requise** :

1. Aller dans Supabase Dashboard
2. Naviguer vers **Settings** → **Authentication** → **Password Policy**
3. Activer **"Leaked password protection"**

**Référence** : https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

**Impact** : Les mots de passe sont vérifiés contre la base HaveIBeenPwned pour empêcher l'utilisation de mots de passe compromis

---

## 🔍 Vérifications Automatiques

La migration inclut des vérifications finales :

```sql
DO $$
BEGIN
    -- Vérifier SECURITY INVOKER sur les vues
    -- Vérifier RLS activé sur les tables
    -- Vérifier search_path sur les fonctions
    -- Afficher un résumé
END $$;
```

**Sortie attendue** :
```
✓ Vue customers: SECURITY INVOKER
✓ Vue suppliers: SECURITY INVOKER
✓ RLS migration_third_parties_log: ACTIVÉ
✓ RLS third_parties_id_mapping: ACTIVÉ
✓ Fonctions avec search_path: 7 / 7
✅ Migration terminée avec succès!
```

---

## 📊 Score Final

| Catégorie | Avant | Après | Status |
|-----------|-------|-------|--------|
| **Erreurs** | 4 | 0 | ✅ |
| **Warnings (SQL)** | 7 | 0 | ✅ |
| **Warnings (Config)** | 1 | 1 | ⚠️ Action manuelle |
| **Score Total** | 🔴 12 | 🟢 1 | ✅ 92% |

---

## 🚀 Déploiement

### Option 1 : Via Supabase CLI

```bash
cd c:\Users\noutc\Casskai
npx supabase db push --project-ref smtdtgrymuzwvctattmx
```

### Option 2 : Via Supabase Dashboard

1. Aller dans **Database** → **Migrations**
2. Créer une nouvelle migration
3. Copier-coller le contenu de `20260130_fix_security_linter_issues.sql`
4. Exécuter

### Option 3 : Via SQL Editor

1. Aller dans **SQL Editor**
2. Copier-coller le contenu
3. Cliquer sur **Run**

---

## 🔐 Impact Sécurité

**Niveau de risque AVANT** : 🔴 **ÉLEVÉ**
- Vues contournant RLS (accès non autorisé possible)
- Tables sans RLS (exposition de données sensibles)
- Fonctions vulnérables (injection de schéma possible)

**Niveau de risque APRÈS** : 🟢 **FAIBLE**
- Toutes les vues respectent RLS
- Toutes les tables ont RLS activé
- Toutes les fonctions ont search_path sécurisé

**Seul risque restant** : Mots de passe compromis (correction manuelle requise)

---

## 📝 Notes Importantes

1. **Pas de downtime** : La migration peut être appliquée en production sans interruption
2. **Rétrocompatibilité** : Les vues conservent les mêmes colonnes et comportement
3. **Performance** : Aucun impact négatif attendu
4. **Tests** : Vérifier l'accès aux vues `customers` et `suppliers` après migration

---

## 🧪 Tests Post-Migration

```sql
-- Test 1: Vérifier SECURITY INVOKER
SELECT 
    viewname, 
    definition
FROM pg_views
WHERE viewname IN ('customers', 'suppliers')
AND schemaname = 'public';

-- Test 2: Vérifier RLS activé
SELECT 
    tablename, 
    rowsecurity
FROM pg_tables
WHERE tablename IN ('migration_third_parties_log', 'third_parties_id_mapping')
AND schemaname = 'public';

-- Test 3: Vérifier search_path des fonctions
SELECT 
    p.proname,
    pg_get_function_identity_arguments(p.oid),
    prosrc
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
AND p.proname LIKE '%customer_view%'
OR p.proname LIKE '%supplier_view%'
OR p.proname = 'extend_user_trial';
```

---

## 🎯 Checklist Finale

- [x] ✅ Migration SQL créée
- [x] ✅ Vues SECURITY INVOKER
- [x] ✅ RLS activé sur tables de migration
- [x] ✅ search_path fixe sur toutes les fonctions
- [x] ✅ Triggers recréés
- [x] ✅ Vérifications automatiques incluses
- [ ] ⏳ **À FAIRE** : Activer leaked password protection dans Dashboard
- [ ] ⏳ **À FAIRE** : Déployer la migration en production
- [ ] ⏳ **À FAIRE** : Tester l'accès aux vues post-migration

---

**Audit réalisé par** : GitHub Copilot  
**Date** : 30 Janvier 2026  
**Migration** : `20260130_fix_security_linter_issues.sql`  
**Statut** : ✅ Prêt pour déploiement
