# Configuration des Plans d'Abonnement CassKai

Ce guide explique comment configurer les plans d'abonnement dans Supabase pour une intégration complète avec Stripe.

## 📋 Prérequis

1. **Compte Stripe actif** avec accès au dashboard
2. **Base de données Supabase** avec la table `subscription_plans` créée
3. **Variables d'environnement** configurées dans votre application

## 🚀 Étape 1: Configuration Stripe

### Créer les produits dans Stripe

1. Allez dans votre [Stripe Dashboard](https://dashboard.stripe.com/)
2. Cliquez sur **"Produits"** dans le menu latéral
3. Cliquez sur **"Créer un produit"** pour chaque plan:

#### Plan Starter
- **Nom**: `CassKai - Abo Mensuel Plan Starter`
- **Description**: `Parfait pour débuter avec CassKai`
- **Prix**: `29,00 €`
- **Intervalle**: `Mensuel`
- **Copiez l'ID du prix** (commence par `price_`)

#### Plan Professionnel
- **Nom**: `CassKai - Abo Mensuel Plan Professionnel`
- **Description**: `Idéal pour les entreprises en croissance`
- **Prix**: `69,00 €`
- **Intervalle**: `Mensuel`
- **Marquer comme populaire** ✅

#### Plan Entreprise
- **Nom**: `CassKai - Abo Mensuel Plan Entreprise`
- **Description**: `Solution complète pour grandes entreprises`
- **Prix**: `129,00 €`
- **Intervalle**: `Mensuel`

#### Plan d'Essai (optionnel)
- **Nom**: `CassKai - Essai Gratuit`
- **Description**: `Découvrez CassKai gratuitement`
- **Prix**: `0,00 €`
- **Intervalle**: `Mensuel`

## 🔧 Étape 2: Configuration des Variables d'Environnement

Ajoutez ces variables dans votre fichier `.env`:

```env
# Clés Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51... # ou pk_live_51...
VITE_STRIPE_STARTER_MONTHLY_PRICE_ID=price_1ABC... # Remplacez par vos vrais IDs
VITE_STRIPE_PRO_MONTHLY_PRICE_ID=price_1DEF...
VITE_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_1GHI...
```

## 🗄️ Étape 3: Exécution de la Requête SQL

1. Ouvrez **Supabase Dashboard**
2. Allez dans **"SQL Editor"**
3. Copiez-collez le contenu du fichier `populate_subscription_plans.sql`
4. **Remplacez les `stripe_price_id`** par vos vrais IDs Stripe
5. Cliquez sur **"Run"**

## ✅ Étape 4: Vérification

Exécutez ces requêtes pour vérifier:

```sql
-- Compter les plans actifs
SELECT COUNT(*) FROM subscription_plans WHERE is_active = true;

-- Voir tous les plans
SELECT id, name, price, stripe_price_id FROM subscription_plans ORDER BY price;

-- Tester la fonction d'essai
SELECT * FROM create_trial_subscription('test-user-id', 'test-company-id');
```

## 🔄 Mise à Jour des Plans

Pour modifier un plan existant:

```sql
UPDATE subscription_plans
SET price = 39, stripe_price_id = 'price_new_starter_id'
WHERE id = 'starter';
```

## 🐛 Dépannage

### Erreur "Price ID not found"
- Vérifiez que les `stripe_price_id` correspondent exactement à ceux de Stripe
- Assurez-vous que les prix sont actifs dans Stripe

### Erreur "Product not found"
- Vérifiez les `stripe_product_id` dans la table
- Confirmez que les produits existent dans Stripe

### Variables d'environnement non chargées
- Redémarrez votre serveur de développement
- Vérifiez que le fichier `.env` est dans le bon répertoire

## 📞 Support

Si vous rencontrez des problèmes:
1. Vérifiez les logs de Supabase
2. Consultez la documentation Stripe
3. Vérifiez les variables d'environnement</content>
<parameter name="filePath">c:\Users\noutc\Casskai\SUBSCRIPTION_SETUP_README.md