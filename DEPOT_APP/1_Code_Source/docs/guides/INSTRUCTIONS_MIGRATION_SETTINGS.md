# INSTRUCTIONS - MIGRATION DES PARAMÈTRES

## 📋 RÉSUMÉ DES FICHIERS CRÉÉS

### Migrations SQL
1. `20251001000000_fix_companies_missing_columns.sql` - Ajoute colonnes manquantes à `companies`
2. `20251001000001_create_user_profiles.sql` - Crée la table `user_profiles`
3. `20251001000002_create_user_profiles_rls.sql` - Politiques RLS pour `user_profiles`
4. `20251001000003_create_avatars_storage.sql` - Bucket Storage pour avatars
5. `20251001000004_verify_subscription_rpc.sql` - Fonctions RPC pour abonnements
6. `20251001000005_create_notifications_system.sql` - Système de notifications complet

### Scripts d'application
- `apply-settings-migrations.ps1` - Script PowerShell pour appliquer les migrations

### Documentation
- `AUDIT_SETTINGS_ISSUES.md` - Audit complet des problèmes identifiés

---

## 🚀 ÉTAPE 1 : APPLIQUER LES MIGRATIONS (CRITIQUE)

### Option A : Test avec Dry-Run (RECOMMANDÉ)
```powershell
.\apply-settings-migrations.ps1 -DryRun
```
Cela va afficher ce qui sera appliqué SANS faire de modifications.

### Option B : Application réelle
```powershell
.\apply-settings-migrations.ps1
```
⚠️ **ATTENTION** : Vous devrez taper "OUI" en majuscules pour confirmer.

### Option C : Application sans confirmation (DANGEREUX)
```powershell
.\apply-settings-migrations.ps1 -Force
```

### Alternative : Commandes manuelles
```bash
# Test sans application
supabase db push --dry-run

# Application réelle
supabase db push
```

---

## 🧪 ÉTAPE 2 : VÉRIFIER LES MIGRATIONS

### Vérifier les tables créées
```sql
-- Dans Supabase SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_profiles', 'notifications', 'notification_preferences', 'usage_tracking');
```

### Vérifier les colonnes de companies
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'companies'
AND column_name IN ('accounting_method', 'vat_number', 'description');
```

### Vérifier le bucket avatars
```sql
SELECT * FROM storage.buckets WHERE id = 'avatars';
```

### Vérifier les fonctions RPC
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'can_access_feature',
  'increment_feature_usage',
  'get_user_usage_limits',
  'create_trial_subscription',
  'cancel_subscription',
  'get_or_create_user_profile'
);
```

---

## 🔧 ÉTAPE 3 : ACTIVER LE CODE FRONTEND (TODO)

Les fichiers suivants ont du code commenté à activer :

### 1. UserProfileSettings.tsx
**Lignes à décommenter** :
- 12 : Import supabase
- 62-67 : Chargement du profil
- 105-108 : Sauvegarde du profil
- 134-143 : Upload avatar

**⚠️ NE PAS FAIRE MAINTENANT** - Je vais créer une version corrigée complète.

---

## 🧪 ÉTAPE 4 : TESTS À EFFECTUER

### Test 1 : Profil Utilisateur
1. Aller dans Paramètres > Profil
2. Modifier le prénom et nom
3. Cliquer sur "Sauvegarder"
4. Vérifier dans Supabase que les données sont dans `user_profiles`

### Test 2 : Upload Avatar
1. Dans Paramètres > Profil
2. Cliquer sur l'icône caméra
3. Sélectionner une image
4. Vérifier dans Storage > avatars qu'elle est uploadée

### Test 3 : Abonnement
1. Aller dans Paramètres > Abonnement
2. Vérifier que les informations du plan s'affichent
3. (Plus tard) Tester l'annulation

### Test 4 : Notifications (après création du composant)
1. Créer une notification de test
2. Vérifier qu'elle apparaît
3. Marquer comme lue
4. Modifier les préférences

---

## 🐛 DÉPANNAGE

### Erreur : "relation user_profiles already exists"
```sql
-- Supprimer et recréer si nécessaire
DROP TABLE IF EXISTS user_profiles CASCADE;
```
Puis réappliquer la migration.

### Erreur : "bucket avatars already exists"
```sql
-- Supprimer le bucket
DELETE FROM storage.buckets WHERE id = 'avatars';
```
Puis réappliquer la migration.

### Erreur : "function can_access_feature already exists"
```sql
-- Supprimer les fonctions
DROP FUNCTION IF EXISTS can_access_feature CASCADE;
DROP FUNCTION IF EXISTS increment_feature_usage CASCADE;
-- etc...
```
Puis réappliquer la migration.

### Erreur RLS : "insufficient permissions"
Vérifiez que les politiques RLS sont activées :
```sql
-- Vérifier RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'notifications', 'notification_preferences');

-- Activer RLS si nécessaire
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
```

---

## 📊 CHECKLIST POST-MIGRATION

- [ ] Migrations appliquées sans erreur
- [ ] Tables créées et visibles dans Supabase
- [ ] Bucket avatars créé
- [ ] Fonctions RPC créées
- [ ] Politiques RLS actives
- [ ] Tests de lecture/écriture OK
- [ ] Logs d'erreurs propres (pas d'erreurs RLS)

---

## 🔄 ROLLBACK SI NÉCESSAIRE

Si quelque chose ne va pas, vous pouvez supprimer les tables créées :

```sql
-- ATTENTION : Cela supprime les données!
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS usage_tracking CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Supprimer le bucket
DELETE FROM storage.buckets WHERE id = 'avatars';

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS can_access_feature CASCADE;
DROP FUNCTION IF EXISTS increment_feature_usage CASCADE;
DROP FUNCTION IF EXISTS get_user_usage_limits CASCADE;
DROP FUNCTION IF EXISTS create_trial_subscription CASCADE;
DROP FUNCTION IF EXISTS cancel_subscription CASCADE;
DROP FUNCTION IF EXISTS reactivate_subscription CASCADE;
DROP FUNCTION IF EXISTS get_or_create_user_profile CASCADE;
DROP FUNCTION IF EXISTS create_notification CASCADE;
DROP FUNCTION IF EXISTS mark_notification_as_read CASCADE;
DROP FUNCTION IF EXISTS mark_all_notifications_as_read CASCADE;
DROP FUNCTION IF EXISTS delete_old_notifications CASCADE;
DROP FUNCTION IF EXISTS get_unread_notification_count CASCADE;

-- Retirer les colonnes de companies
ALTER TABLE companies DROP COLUMN IF EXISTS accounting_method;
ALTER TABLE companies DROP COLUMN IF EXISTS vat_number;
ALTER TABLE companies DROP COLUMN IF EXISTS description;
```

---

## 📞 SUPPORT

Si vous rencontrez des problèmes :
1. Vérifiez les logs de Supabase
2. Consultez AUDIT_SETTINGS_ISSUES.md
3. Vérifiez la console du navigateur pour les erreurs frontend

---

## 📈 PROCHAINES ÉTAPES

Après validation des migrations :
1. ✅ Activer le code Supabase dans UserProfileSettings.tsx
2. ✅ Implémenter la gestion Stripe complète
3. ✅ Créer le composant NotificationSettings.tsx
4. ✅ Créer des tests automatisés
5. ✅ Documenter les nouvelles fonctionnalités
