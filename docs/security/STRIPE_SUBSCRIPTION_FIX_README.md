# Guide de réparation du système d'abonnements Stripe

## Problème identifié
Le test `StripeIntegrationTest` échoue avec l'erreur "Erreur abonnement: Erreur lors de la récupération de l'abonnement" car les tables `subscriptions` et `subscription_plans` ne sont pas accessibles.

## Solution
Les migrations Supabase n'ont pas été appliquées correctement. Vous devez appliquer manuellement le script SQL suivant.

## Étapes à suivre

### 1. Ouvrir Supabase Dashboard
1. Allez sur [supabase.com](https://supabase.com)
2. Connectez-vous à votre projet
3. Ouvrez l'**SQL Editor**

### 2. Appliquer le script de migration
1. Copiez le contenu du fichier `scripts/apply_subscription_migrations.sql`
2. Collez-le dans l'**SQL Editor** de Supabase
3. Cliquez sur **Run** (ou **Exécuter**)

### 3. Vérifier que la migration a réussi
Le script affiche une vérification finale. Vous devriez voir:
```
Tables créées: ✅ OK
Plans insérés: ✅ OK
Fonctions RPC créées: ✅ OK
Politiques RLS actives: ✅ OK
```

### 4. Tester le système
1. Redémarrez votre application (`npm run dev`)
2. Testez le composant `StripeIntegrationTest`
3. Vérifiez que les abonnements peuvent maintenant être récupérés

## Que fait le script ?

### Tables créées :
- `subscription_plans` : Contient les différents plans d'abonnement
- `subscriptions` : Contient les abonnements des utilisateurs

### Plans par défaut insérés :
- **Trial** : Essai gratuit 30 jours
- **Starter** : 29€/mois
- **Professional** : 79€/mois
- **Enterprise** : 199€/mois

### Fonctions RPC créées :
- `get_user_subscription_status()` : Récupère le statut d'abonnement d'un utilisateur
- `can_create_trial()` : Vérifie si un utilisateur peut créer un essai
- `create_trial_subscription()` : Crée un abonnement d'essai

### Politiques de sécurité :
- RLS (Row Level Security) activé
- Seuls les utilisateurs authentifiés peuvent voir/modifier leurs abonnements
- Tout le monde peut voir les plans actifs

## Dépannage

### Si le script échoue :
1. Vérifiez que vous êtes connecté au bon projet Supabase
2. Assurez-vous d'avoir les permissions administrateur
3. Vérifiez les logs d'erreur dans la console Supabase

### Si les tests échouent encore :
1. Vérifiez que les variables d'environnement sont correctes dans `.env.local`
2. Redémarrez complètement l'application
3. Vérifiez les logs de la console du navigateur

### Commandes de vérification :
```sql
-- Vérifier les tables
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('subscriptions', 'subscription_plans');

-- Vérifier les plans
SELECT id, name, price FROM subscription_plans WHERE is_active = true;

-- Tester la fonction RPC
SELECT * FROM get_user_subscription_status('your-user-uuid');
```