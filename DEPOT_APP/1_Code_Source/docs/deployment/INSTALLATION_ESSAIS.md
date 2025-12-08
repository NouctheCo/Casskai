# Installation des fonctions d'essais gratuits

## 🚨 Problème résolu

Les erreurs **"cannot change return type"** et **"column does not exist"** sont causées par des conflits avec des tables/fonctions existantes.

## ✅ 3 Solutions selon votre situation

### Option 1: 🔍 DIAGNOSTIC (Recommandé d'abord)

**Script:** `diagnostic-db.sql`

Diagnostique votre base de données et recommande la meilleure approche.
- ✅ Analyse les tables existantes
- ✅ Vérifie la structure des colonnes
- ✅ Détecte les conflits potentiels
- ✅ Donne des recommandations précises

### Option 2: 🛡️ ULTRA-SÉCURISÉ (Données existantes)

**Script:** `trial-management-ultra-safe.sql`

Pour bases de données avec des données existantes.
- ✅ Préserve toutes les données
- ✅ Met à jour les structures progressivement
- ✅ Ajoute les colonnes manquantes
- ✅ Gestion d'erreur complète

### Option 3: 🚀 INSTALLATION PROPRE (Recommandé si pas de données)

**Script:** `trial-management-minimal.sql`

Installation propre et rapide.
- ✅ Supprime et recrée les tables
- ✅ Structure optimale garantie
- ✅ Plus simple et plus rapide
- ⚠️ **ATTENTION:** Efface les données existantes

## 📋 Installation étape par étape

### Étape 1: Diagnostic (Recommandé)

1. Allez dans **SQL Editor** Supabase
2. Copiez le contenu de `diagnostic-db.sql`
3. Cliquez sur **Run**
4. Lisez les recommandations

### Étape 2: Installation

**Si données importantes existantes:**
1. Utilisez `trial-management-ultra-safe.sql`

**Si base de données vide/test:**
1. Utilisez `trial-management-minimal.sql`

### Étape 3: Validation

1. Utilisez `test-trial-functions.sql` pour valider
2. Vérifiez que tous les tests sont ✅

### 2. Vérification

Testez que les fonctions sont bien créées :

```sql
-- Tester la fonction de vérification d'éligibilité
SELECT can_create_trial('00000000-0000-0000-0000-000000000000');

-- Voir les statistiques
SELECT * FROM get_trial_statistics();

-- Voir les plans disponibles
SELECT * FROM subscription_plans;
```

### 3. Test complet

Dans votre application, les essais gratuits devraient maintenant fonctionner :

```javascript
// Dans la console du navigateur, vous devriez voir :
// "🧪 Peut créer essai: true"
// "🚀 Création d'essai en cours..."
// "✅ Essai créé avec succès"
```

## 🔧 Fonctions installées

| Fonction | Description |
|----------|-------------|
| `can_create_trial(user_id)` | Vérifie si un utilisateur peut créer un essai |
| `create_trial_subscription(user_id, company_id?)` | Crée un essai de 14 jours |
| `get_user_trial_info(user_id)` | Récupère les infos d'essai d'un utilisateur |
| `convert_trial_to_paid(...)` | Convertit un essai en abonnement payant |
| `cancel_trial(user_id, reason?)` | Annule un essai |
| `get_trial_statistics()` | Statistiques globales des essais |
| `expire_trials()` | Expire automatiquement les essais |

## 📊 Tables créées

| Table | Description |
|-------|-------------|
| `subscription_plans` | Plans d'abonnement disponibles |
| `user_subscriptions` | Abonnements des utilisateurs |
| `stripe_customers` | Liaison utilisateur ↔ client Stripe |

## 🎯 Résultat attendu

Après installation, le bouton **"Choisir un plan"** devrait :

1. ✅ **Plan Gratuit** → Activation immédiate
2. ✅ **Essai Gratuit** → Création d'un essai de 14 jours
3. ✅ **Plan Pro** → Message de contact (en attendant Stripe)
4. ✅ **Plan Enterprise** → Message commercial

## 🐛 En cas de problème

Si vous avez encore des erreurs :

1. **Vérifiez les tables** :
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('subscription_plans', 'user_subscriptions', 'stripe_customers');
   ```

2. **Vérifiez les fonctions** :
   ```sql
   SELECT routine_name FROM information_schema.routines
   WHERE routine_schema = 'public'
   AND routine_name LIKE '%trial%';
   ```

3. **Permissions** :
   ```sql
   -- Assurez-vous que l'utilisateur authenticated peut exécuter les fonctions
   GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
   ```

## 📞 Support

Si le problème persiste, les logs détaillés sont maintenant disponibles dans la console du navigateur pour identifier la cause exacte.