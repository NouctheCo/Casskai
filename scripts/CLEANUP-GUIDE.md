# Guide de nettoyage Supabase - Gestion des suppressions CASCADE

## 📋 Vue d'ensemble

Ce guide explique comment configurer et utiliser les suppressions CASCADE pour nettoyer proprement votre base de données Supabase sans bloquer les suppressions.

## 🎯 Objectifs

1. **Supprimer un USER** → Supprime uniquement ses données personnelles (préférences, sessions), mais PAS les companies
2. **Supprimer une COMPANY** → Supprime TOUT en cascade (users_companies, modules, données comptables, factures, etc.)

## 🚀 Installation

### Étape 1 : Exécuter le script de configuration

Dans l'éditeur SQL de Supabase :

```sql
-- Copier-coller le contenu de cleanup-cascade-constraints.sql
-- et exécuter
```

**Temps d'exécution** : ~2-5 secondes

### Étape 2 : Vérifier la configuration

```sql
-- Copier-coller le contenu de verify-cascade-constraints.sql
-- et exécuter
```

Vous devriez voir :
- ✅ Toutes les contraintes vers `company_id` en CASCADE
- ✅ Toutes les contraintes vers `user_id` en CASCADE (sauf `audit_logs` en SET NULL)
- ✅ Le trigger `cleanup_auth_user_trigger` présent

---

## 💡 Utilisation

### Supprimer un utilisateur (sans impacter les companies)

```sql
-- Supprimer depuis public.users (déclenche le trigger qui supprime auth.users)
DELETE FROM public.users WHERE email = 'user@example.com';
```

**Ce qui est supprimé automatiquement** :
- ✅ Entrée dans `public.users`
- ✅ Entrée dans `auth.users` (via trigger)
- ✅ Ses liens dans `user_companies`
- ✅ Ses préférences dans `user_preferences`
- ✅ Ses sessions dans `onboarding_sessions`
- ✅ Son abonnement dans `subscriptions`

**Ce qui est CONSERVÉ** :
- ✅ Les companies où il était membre
- ✅ Les données métier (factures, écritures) des companies
- ✅ Les logs d'audit (user_id devient NULL pour traçabilité)

---

### Supprimer une company (avec cascade total)

```sql
-- Supprimer la company (supprime TOUT en cascade)
DELETE FROM public.companies WHERE id = 'uuid-de-la-company';

-- Ou par nom
DELETE FROM public.companies WHERE name = 'Ma Société Test';
```

**Ce qui est supprimé automatiquement** :
- ✅ La company elle-même
- ✅ Tous les liens `user_companies` (les users restent, mais ne sont plus liés)
- ✅ Tous les modules `company_modules`
- ✅ Toutes les features `company_features`
- ✅ Tout le plan comptable `accounts`
- ✅ Toutes les écritures comptables `journal_entries`
- ✅ Toutes les factures `invoices`
- ✅ Tous les tiers `third_parties`
- ✅ Toutes les transactions bancaires `bank_transactions`
- ✅ Tous les journaux `journals`
- ✅ Tous les projets `projects`
- ✅ Toutes les préférences liées `user_preferences`
- ✅ Toutes les sessions d'onboarding `onboarding_sessions`
- ✅ Tout l'historique d'onboarding `onboarding_history`

**Ce qui est CONSERVÉ** :
- ✅ Les users qui étaient membres (ils peuvent rejoindre d'autres companies)

---

## 🔧 Cas d'usage courants

### 1. Nettoyer un user de test

```sql
-- Trouver les users de test
SELECT id, email, created_at
FROM public.users
WHERE email LIKE '%@test.com'
OR email LIKE '%test%';

-- Supprimer
DELETE FROM public.users WHERE email = 'test@example.com';
```

### 2. Nettoyer toutes les companies de test

```sql
-- Trouver les companies de test
SELECT id, name, created_at, owner_id
FROM public.companies
WHERE name LIKE '%Test%'
OR name LIKE '%Demo%';

-- Supprimer (cascade sur toutes les données)
DELETE FROM public.companies WHERE name LIKE '%Test%';
```

### 3. Supprimer un user et TOUTES ses companies

```sql
-- Attention: supprime TOUTES les companies où l'user est owner
-- Si d'autres users sont membres, ils perdront l'accès

-- Étape 1: Trouver les companies dont l'user est owner
SELECT c.id, c.name, c.owner_id
FROM public.companies c
WHERE c.owner_id = 'uuid-du-user';

-- Étape 2: Supprimer les companies (cascade total)
DELETE FROM public.companies WHERE owner_id = 'uuid-du-user';

-- Étape 3: Supprimer le user
DELETE FROM public.users WHERE id = 'uuid-du-user';
```

### 4. Supprimer tous les users d'une company (mais garder la company)

```sql
-- Supprimer uniquement les liens user_companies
DELETE FROM public.user_companies
WHERE company_id = 'uuid-de-la-company'
AND user_id != (SELECT owner_id FROM companies WHERE id = 'uuid-de-la-company');
-- Garde l'owner pour éviter une company sans owner
```

---

## ⚠️ Précautions

### Avant de supprimer une company

1. **Vérifier le nombre de users** :
```sql
SELECT c.name, COUNT(uc.user_id) AS nb_users
FROM companies c
LEFT JOIN user_companies uc ON c.id = uc.company_id
WHERE c.id = 'uuid-de-la-company'
GROUP BY c.name;
```

2. **Vérifier les données importantes** :
```sql
SELECT
    (SELECT COUNT(*) FROM journal_entries WHERE company_id = 'uuid') AS ecritures,
    (SELECT COUNT(*) FROM invoices WHERE company_id = 'uuid') AS factures,
    (SELECT COUNT(*) FROM third_parties WHERE company_id = 'uuid') AS tiers;
```

### Avant de supprimer un user

1. **Vérifier s'il est owner de companies** :
```sql
SELECT c.name, c.created_at
FROM companies c
WHERE c.owner_id = 'uuid-du-user';
```

2. **Vérifier ses rôles** :
```sql
SELECT c.name, uc.role
FROM user_companies uc
JOIN companies c ON uc.company_id = c.id
WHERE uc.user_id = 'uuid-du-user';
```

---

## 🛡️ Sécurité

### RLS (Row Level Security)

Les contraintes CASCADE fonctionnent **au niveau database**, donc elles contournent les politiques RLS. C'est normal et attendu.

**Recommandation** : Toujours effectuer les suppressions via l'éditeur SQL Supabase (avec droits admin) plutôt que via l'API frontend.

### Audit Trail

Les logs d'audit conservent les traces même après suppression d'un user grâce à `ON DELETE SET NULL` :

```sql
-- Voir les actions d'un user supprimé
SELECT action, timestamp, details
FROM audit_logs
WHERE user_id IS NULL
AND details->>'email' = 'ancien-user@example.com';
```

---

## 📊 Statistiques et monitoring

### Compter les suppressions en cascade potentielles

```sql
-- Pour une company donnée
WITH company_stats AS (
    SELECT
        'company_modules' AS table_name,
        COUNT(*) AS count
    FROM company_modules WHERE company_id = 'uuid'
    UNION ALL
    SELECT 'accounts', COUNT(*) FROM accounts WHERE company_id = 'uuid'
    UNION ALL
    SELECT 'journal_entries', COUNT(*) FROM journal_entries WHERE company_id = 'uuid'
    UNION ALL
    SELECT 'invoices', COUNT(*) FROM invoices WHERE company_id = 'uuid'
    UNION ALL
    SELECT 'third_parties', COUNT(*) FROM third_parties WHERE company_id = 'uuid'
)
SELECT table_name, count FROM company_stats WHERE count > 0;
```

### Vérifier l'intégrité après suppression

```sql
-- Vérifier qu'il n'y a pas de données orphelines
SELECT
    'user_companies sans user' AS issue,
    COUNT(*) AS count
FROM user_companies uc
LEFT JOIN users u ON uc.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT
    'user_companies sans company' AS issue,
    COUNT(*) AS count
FROM user_companies uc
LEFT JOIN companies c ON uc.company_id = c.id
WHERE c.id IS NULL

UNION ALL

SELECT
    'company_modules sans company' AS issue,
    COUNT(*) AS count
FROM company_modules cm
LEFT JOIN companies c ON cm.company_id = c.id
WHERE c.id IS NULL;
```

---

## 🔄 Rollback / Annulation

Si vous avez exécuté le script et souhaitez revenir en arrière :

### Option 1 : Restaurer depuis un backup Supabase

1. Aller dans Dashboard Supabase → Database → Backups
2. Restaurer le backup d'avant l'exécution du script

### Option 2 : Réinitialiser les contraintes (mode restrictif)

```sql
-- Remettre toutes les contraintes en NO ACTION (bloque les suppressions)
-- ⚠️ Attention: cela peut bloquer les futures suppressions

-- Pour companies
ALTER TABLE user_companies
DROP CONSTRAINT user_companies_company_id_fkey,
ADD CONSTRAINT user_companies_company_id_fkey
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE NO ACTION;

-- Répéter pour toutes les tables...
```

---

## ✅ Checklist de validation

Après avoir exécuté le script, vérifier :

- [ ] Le script `cleanup-cascade-constraints.sql` s'est exécuté sans erreur
- [ ] Le script `verify-cascade-constraints.sql` montre toutes les contraintes en ✅ OK
- [ ] Test : supprimer un user de test fonctionne sans erreur
- [ ] Test : supprimer une company de test fonctionne sans erreur
- [ ] Les logs d'audit conservent les traces (user_id = NULL après suppression)
- [ ] Aucune donnée orpheline détectée

---

## 📞 Support

En cas de problème :

1. Vérifier les logs d'erreur dans l'éditeur SQL
2. Exécuter `verify-cascade-constraints.sql` pour diagnostiquer
3. Consulter la documentation Supabase sur les Foreign Keys

---

## 📝 Notes importantes

- **Transactions** : Toutes les suppressions CASCADE sont atomiques (tout ou rien)
- **Performance** : Supprimer une company avec 10k+ écritures peut prendre quelques secondes
- **Irréversible** : Aucune suppression CASCADE ne peut être annulée sans backup
- **Testez d'abord** : Toujours tester sur des données de test avant de nettoyer la prod

---

**Dernière mise à jour** : 2025-01-25
