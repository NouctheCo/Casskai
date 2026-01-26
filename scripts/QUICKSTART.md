# Quick Start - Suppression Companies/Users

## 🚨 Problème résolu

**Erreur avant** :
```
ERROR: 23503: insert or update on table "security_logs" violates foreign key constraint
```

**Cause** : Le trigger de logging essayait d'écrire dans `security_logs` après que la company soit déjà supprimée (CASCADE).

**Solution** : Contraintes CASCADE + triggers robustes

---

## 🚀 Installation rapide (2 étapes)

### Étape 1 : Configuration initiale
Dans **Supabase SQL Editor** :

```sql
-- Copier-coller le contenu de cleanup-cascade-constraints.sql
-- Exécuter (⌘+Enter)
```

### Étape 2 : Fix security_logs (OBLIGATOIRE)
Dans **Supabase SQL Editor** :

```sql
-- Copier-coller le contenu de fix-security-logs-cascade.sql
-- Exécuter (⌘+Enter)
```

✅ C'est fait ! Vous pouvez maintenant supprimer companies et users sans erreur.

---

## 💡 Utilisation

### Supprimer une company (avec tout son contenu)

```sql
-- Par UUID
DELETE FROM public.companies WHERE id = '3321651c-1298-4611-8883-9cbf81c1227d';

-- Par nom
DELETE FROM public.companies WHERE name = 'Test Company';

-- Toutes les companies de test
DELETE FROM public.companies WHERE name LIKE '%Test%';
```

**Ce qui est supprimé automatiquement** :
- ✅ Tous les modules, comptes, écritures, factures
- ✅ Tous les tiers, transactions, projets
- ✅ Tous les logs (security_logs, audit_logs avec CASCADE)
- ✅ Toutes les sessions et historiques d'onboarding
- ✅ Tous les liens user_companies

**Ce qui est conservé** :
- ✅ Les users (ils peuvent rejoindre d'autres companies)

---

### Supprimer un user (sans impacter les companies)

```sql
-- Par email
DELETE FROM public.users WHERE email = 'test@example.com';

-- Par UUID
DELETE FROM public.users WHERE id = 'uuid-du-user';
```

**Ce qui est supprimé automatiquement** :
- ✅ Son compte auth.users (via trigger)
- ✅ Ses liens user_companies
- ✅ Ses préférences, sessions, abonnements

**Ce qui est conservé** :
- ✅ Les companies où il était membre
- ✅ Les données métier (factures, écritures)
- ✅ Les logs (avec user_id = NULL pour traçabilité)

---

## 🔍 Vérification

Après installation, vérifier que tout fonctionne :

```sql
-- Lister les contraintes CASCADE sur companies
SELECT
    table_name,
    constraint_name,
    'CASCADE' AS delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu USING (constraint_name)
WHERE kcu.column_name = 'company_id'
    AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY table_name;

-- Devrait inclure: security_logs, journal_entries, invoices, etc.
```

---

## ⚠️ Cas particuliers

### 1. Company avec beaucoup de données (>10k écritures)

La suppression peut prendre quelques secondes. Supabase va supprimer toutes les lignes liées en cascade.

**Recommandation** : Tester d'abord sur une petite company de test.

### 2. User qui est owner de plusieurs companies

```sql
-- Voir ses companies
SELECT c.name, c.id
FROM companies c
WHERE c.owner_id = 'uuid-du-user';

-- Option 1: Supprimer TOUTES ses companies d'abord
DELETE FROM companies WHERE owner_id = 'uuid-du-user';

-- Option 2: Réassigner l'ownership avant suppression
UPDATE companies
SET owner_id = 'nouvel-owner-uuid'
WHERE owner_id = 'uuid-du-user';

-- Puis supprimer le user
DELETE FROM users WHERE id = 'uuid-du-user';
```

### 3. Erreur "permission denied"

Si vous obtenez une erreur de permission, c'est que vous n'êtes pas connecté en tant que superuser.

**Solution** : Utiliser l'éditeur SQL de Supabase Dashboard (pas l'API frontend).

---

## 📋 Checklist de validation

Après avoir exécuté les deux scripts :

- [ ] Le script cleanup-cascade-constraints.sql s'est exécuté sans erreur
- [ ] Le script fix-security-logs-cascade.sql s'est exécuté sans erreur
- [ ] Test : `DELETE FROM companies WHERE name = 'Test Company'` fonctionne
- [ ] Test : `DELETE FROM users WHERE email = 'test@example.com'` fonctionne
- [ ] Vérification : `SELECT COUNT(*) FROM security_logs` montre que les logs sont conservés
- [ ] Vérification : Aucune donnée orpheline (voir verify-cascade-constraints.sql)

---

## 🆘 Dépannage

### Erreur persistante après fix

```sql
-- Vérifier que security_logs a bien CASCADE
SELECT
    tc.constraint_name,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc USING (constraint_name)
WHERE tc.table_name = 'security_logs'
    AND tc.constraint_type = 'FOREIGN KEY';

-- Devrait afficher CASCADE pour company_id
```

### Données orphelines après suppression

```sql
-- Détecter les données sans company
SELECT
    'security_logs' AS table_name,
    COUNT(*) AS orphans
FROM security_logs sl
LEFT JOIN companies c ON sl.company_id = c.id
WHERE c.id IS NULL

UNION ALL

SELECT
    'journal_entries' AS table_name,
    COUNT(*) AS orphans
FROM journal_entries je
LEFT JOIN companies c ON je.company_id = c.id
WHERE c.id IS NULL;

-- Si orphans > 0, les nettoyer manuellement
```

---

## 📞 Support

En cas de problème non résolu :

1. Exécuter `verify-cascade-constraints.sql` pour diagnostiquer
2. Vérifier que les deux scripts ont bien été exécutés
3. Regarder les logs d'erreur complets dans Supabase Dashboard

---

**Dernière mise à jour** : 2025-01-25
**Scripts requis** : cleanup-cascade-constraints.sql + fix-security-logs-cascade.sql
