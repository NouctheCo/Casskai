# 🚀 Guide d'Application des Migrations CassKai

Ce guide vous accompagne pour appliquer les migrations de base de données et configurer votre environnement Supabase.

## 📋 Prérequis

### 1. Projet Supabase
- [ ] Compte Supabase créé sur [supabase.com](https://supabase.com)
- [ ] Nouveau projet créé
- [ ] URL et clé API récupérées

### 2. CLI Supabase (Recommandé)
```bash
npm install -g supabase
```

### 3. Variables d'environnement
- [ ] Fichier `.env.local` créé avec vos clés Supabase

---

## 🎯 Méthode 1 : Application via Supabase CLI (Recommandée)

### Étape 1 : Configuration du CLI
```bash
# Se connecter à Supabase
supabase login

# Initialiser le projet local
supabase init

# Lier votre projet (remplacez par votre ref project)
supabase link --project-ref YOUR_PROJECT_REF
```

### Étape 2 : Application des migrations
```bash
# Appliquer toutes les migrations
supabase db push

# OU appliquer une migration spécifique
supabase db push --include-schemas=public
```

### Étape 3 : Vérification
```bash
# Vérifier le statut des migrations
supabase migration list

# Voir la structure de la base
supabase db describe
```

---

## 🎯 Méthode 2 : Application via Dashboard Supabase

### Étape 1 : Accès au SQL Editor
1. Aller sur [supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionner votre projet
3. Aller dans **SQL Editor**

### Étape 2 : Copier-coller les migrations

#### 📄 Migration 1 : Schéma initial
```sql
-- Copier tout le contenu de /supabase/migrations/001_initial_schema.sql
-- et l'exécuter dans le SQL Editor
```

#### 📄 Migration 2 : Données par défaut
```sql
-- Copier tout le contenu de /supabase/migrations/002_default_data.sql
-- et l'exécuter dans le SQL Editor
```

#### 📄 Migration 3 : Fonctions et triggers
```sql
-- Copier tout le contenu de /supabase/migrations/003_functions_and_triggers.sql
-- et l'exécuter dans le SQL Editor
```

### Étape 3 : Vérification des tables
Dans **Table Editor**, vous devriez voir :
- ✅ `companies`
- ✅ `users_companies`
- ✅ `accounts`
- ✅ `journals`
- ✅ `journal_entries`
- ✅ `journal_entry_items`
- ✅ `bank_accounts`
- ✅ `bank_transactions`
- ✅ `third_parties`
- ✅ `currencies`
- ✅ `exchange_rates`
- ✅ Et autres...

---

## 🔧 Configuration de l'environnement

### 1. Variables d'environnement
Créer le fichier `.env.local` à la racine :

```bash
# Remplacer par vos vraies valeurs
VITE_SUPABASE_URL=https://votre-projet-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_ENVIRONMENT=development
VITE_DEBUG_MODE=true
```

### 2. Récupérer vos clés Supabase
1. **URL du projet** : `Settings` > `API` > `Project URL`
2. **Clé anon** : `Settings` > `API` > `Project API keys` > `anon public`

### 3. Configurer l'authentification (optionnel)
Dans `Authentication` > `Settings` :
- Activer les providers nécessaires (Email, OAuth...)
- Configurer les URLs de redirection

---

## ✅ Tests de vérification

### 1. Test de connexion
```bash
# Démarrer l'application
npm run dev

# Vérifier dans la console du navigateur qu'il n'y a pas d'erreurs Supabase
```

### 2. Test des fonctions RPC
Dans le SQL Editor de Supabase :
```sql
-- Test de la fonction get_dashboard_stats
SELECT get_dashboard_stats('00000000-0000-0000-0000-000000000000');

-- Test de la fonction de validation
SELECT validate_accounting_data('00000000-0000-0000-0000-000000000000');
```

### 3. Test des permissions RLS
```sql
-- Vérifier que RLS est activé
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
```

---

## 🚨 Résolution des problèmes courants

### Problème : "relation does not exist"
**Solution :** Les migrations ne sont pas appliquées
```bash
# Vérifier les migrations
supabase migration list

# Réappliquer si nécessaire
supabase db reset
supabase db push
```

### Problème : "permission denied"
**Solution :** Problème de RLS ou de permissions
```sql
-- Désactiver temporairement RLS pour debug
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Réactiver après debug
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Problème : "function does not exist"
**Solution :** Migration 003 pas appliquée
- Réexécuter la migration `003_functions_and_triggers.sql`

### Problème : Variables d'environnement non trouvées
**Solution :** 
1. Vérifier que `.env.local` est à la racine
2. Redémarrer le serveur de développement
3. Vérifier que les variables commencent par `VITE_`

---

## 📊 Données de test (optionnel)

Pour créer des données de test :

```sql
-- Créer une entreprise de démo
INSERT INTO companies (name, country, currency, accounting_standard) 
VALUES ('Ma Société Test', 'FR', 'EUR', 'PCG');

-- Récupérer l'ID
SELECT id FROM companies WHERE name = 'Ma Société Test';

-- Insérer le plan comptable français
SELECT insert_default_french_accounts('ID_RÉCUPÉRÉ_CI_DESSUS');
```

---

## 🎯 Prochaines étapes

Une fois les migrations appliquées :

1. **Tester la connexion** dans l'application
2. **Créer un compte utilisateur** 
3. **Créer une première entreprise**
4. **Vérifier les fonctionnalités** (comptes, journaux, écritures)

---

## 📞 Support

En cas de problème :

1. **Vérifier les logs** dans la console du navigateur
2. **Consulter les logs Supabase** dans le dashboard
3. **Tester les requêtes** directement dans le SQL Editor
4. **Revenir aux migrations** si nécessaire

---

## ⚠️ Notes importantes

- **Sauvegardez** toujours avant d'appliquer des migrations en production
- **Testez** en développement avant de passer en production
- **Les RLS policies** protègent vos données - ne les désactivez qu'en debug
- **Les fonctions RPC** sont sécurisées avec `SECURITY DEFINER`

Bon développement ! 🚀
