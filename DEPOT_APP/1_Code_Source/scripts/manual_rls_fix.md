# Correction Manuelle des Policies RLS - Supabase

## Problème Identifié
Erreur `42P17: infinite recursion detected in policy` sur la table `user_companies`.

## Solution 1: Script Automatique (Recommandé)

### Prérequis
1. Variables d'environnement configurées :
   - `VITE_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (clé service role depuis Supabase Dashboard)

### Exécution
```bash
node scripts/deploy_rls_fix.js
```

## Solution 2: Correction Manuelle via Supabase Dashboard

### 1. Aller dans Supabase Dashboard
- Ouvrir [https://app.supabase.com](https://app.supabase.com)
- Sélectionner votre projet
- Aller dans "SQL Editor"

### 2. Exécuter le script de correction
Copier-coller le contenu de `scripts/fix_rls_policies.sql` et exécuter.

### 3. Vérification
Après exécution, vérifier que les policies sont listées :
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('user_companies', 'companies');
```

## Solution 3: Correction d'Urgence (Si les scripts échouent)

### Désactiver temporairement RLS
```sql
ALTER TABLE user_companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
```

⚠️ **Attention** : Ceci désactive la sécurité. À utiliser uniquement temporairement.

### Réactiver après correction
```sql
ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
```

## Test de Vérification

### Dans l'application
1. Effacer le localStorage du navigateur
2. Rafraîchir la page
3. Tenter une connexion
4. Vérifier l'absence d'erreur `42P17`

### Dans Supabase
```sql
SELECT * FROM user_companies LIMIT 1;
```

Si aucune erreur de récursion → ✅ Correction réussie

## En cas de problème persistant

Contactez-moi avec :
1. Les logs d'erreur exacts
2. Le résultat de la requête de vérification des policies
3. Version de Supabase utilisée