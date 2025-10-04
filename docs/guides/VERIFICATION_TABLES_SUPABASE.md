# 🔍 VÉRIFICATION DES TABLES SUPABASE

## ÉTAPE 1 : Vérifier la structure de user_profiles

Exécutez dans **Supabase SQL Editor** :

```sql
-- Vérifier les colonnes de user_profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Vérifier les contraintes
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'user_profiles';
```

**Résultat attendu** :
- Colonne `user_id` avec contrainte UNIQUE ✅
- Colonnes : first_name, last_name, phone, avatar_url, timezone, language, job_title, department, bio, website, linkedin, twitter

---

## ÉTAPE 2 : Vérifier la structure de notifications

```sql
-- Vérifier les colonnes de notifications
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;
```

**Résultat attendu** :
- Colonne `is_read` (PAS `read`) ✅
- Colonne `user_id` (PAS `company_id`) ✅
- Colonnes : id, user_id, title, message, type, category, is_read, read_at, link, metadata, created_at, expires_at

---

## ÉTAPE 3 : Tester l'insert dans user_profiles

```sql
-- Test d'insertion manuelle
INSERT INTO user_profiles (user_id, first_name, last_name)
VALUES ('67dbeb39-a0cf-4265-a2ec-e07571632a70', 'Test', 'User')
ON CONFLICT (user_id)
DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name;

-- Vérifier le résultat
SELECT * FROM user_profiles WHERE user_id = '67dbeb39-a0cf-4265-a2ec-e07571632a70';
```

**Si ça fonctionne** → Le problème est dans le code frontend
**Si ça échoue** → Le problème est dans la structure de la table

---

## ÉTAPE 4 : Identifier la source de l'erreur notifications

Le code qui fait cette requête est probablement dans un service de notifications. Cherchons :

**Fichiers suspects** :
- `src/services/notificationService.ts`
- `src/hooks/useNotifications.ts`
- Tout composant qui charge les notifications

**La requête erronée** :
```
?company_id=eq.xxx&read=eq.false
```

**Devrait être** :
```
?user_id=eq.xxx&is_read=eq.false
```

---

## ACTIONS À PRENDRE

### SI user_profiles existe correctement :
1. Vider le cache du navigateur (Ctrl+Shift+Delete)
2. Redémarrer le serveur de dev (`npm run dev`)
3. Réessayer

### SI notifications pose problème :
1. Trouver le fichier qui fait la requête
2. Remplacer `company_id` par `user_id`
3. Remplacer `read` par `is_read`

---

## COMMANDES UTILES

```bash
# Rechercher les fichiers qui utilisent "company_id" dans notifications
grep -r "company_id" src/ | grep notification

# Rechercher les fichiers qui utilisent "read=eq"
grep -r "read=eq" src/

# Rechercher "onConflict"
grep -r "onConflict" src/
```

---

**Exécutez ces vérifications et donnez-moi les résultats !**
