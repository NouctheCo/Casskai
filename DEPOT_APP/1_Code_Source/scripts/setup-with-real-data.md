# 🚀 Guide de Restauration CassKai avec Vraies Données

Ta base de données Supabase a été complètement restaurée ! Voici comment connecter ton frontend aux vraies données.

## ✅ Ce qui a été fait

### 1. Base de données restaurée
- ✅ Toutes les tables principales créées
- ✅ Fonctions PostgreSQL pour la gestion des abonnements
- ✅ Système de restriction des modules par plan
- ✅ RLS (Row Level Security) configuré
- ✅ Plans d'abonnement initialisés

### 2. Tables disponibles
- `companies` - Entreprises
- `user_companies` - Liaison utilisateurs/entreprises
- `subscription_plans` - Plans d'abonnement
- `user_subscriptions` - Abonnements utilisateurs
- `company_modules` - Modules activés par entreprise
- `chart_of_accounts` - Plan comptable
- `third_parties` - Clients/Fournisseurs
- `invoices` - Factures
- `bank_accounts` - Comptes bancaires
- `bank_transactions` - Transactions bancaires

### 3. Fonctions PostgreSQL
- `create_trial_subscription(user_id, company_id)` - Créer un essai
- `expire_trials()` - Expirer les essais automatiquement
- `get_user_subscription_status(user_id)` - Statut complet d'un utilisateur
- `get_allowed_modules_for_plan(plan_id)` - Modules autorisés par plan

## 🔧 Pour connecter ton frontend

### 1. Vérifier la configuration Supabase
```bash
# Assure-toi que Supabase est démarré
supabase status
```

Tes clés locales :
- **URL** : `http://127.0.0.1:54321`
- **Anon Key** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`

### 2. Tester la base de données
```bash
# Lister les tables
node scripts/database-utils.js tables

# Voir les plans d'abonnement
node scripts/database-utils.js plans

# Tester les fonctions PostgreSQL
node scripts/database-utils.js test
```

### 3. Créer un utilisateur de test
1. Va sur http://127.0.0.1:54323 (Supabase Studio)
2. Authentication > Users > Add user
3. Email: `test@casskai.fr`
4. Password: `testpassword123`
5. Confirme l'email automatiquement

### 4. Démarrer ton app
```bash
npm run dev
```

## 📋 Flux de données avec vraies données

### Nouvel utilisateur :
1. **Inscription** → Utilisateur créé dans `auth.users`
2. **Onboarding** → Entreprise créée dans `companies` + `user_companies`
3. **Essai automatique** → Abonnement d'essai créé dans `user_subscriptions`
4. **Modules activés** → Tous les modules disponibles pendant 30 jours

### Utilisateur existant :
1. **Connexion** → Récupération depuis `user_companies`
2. **Vérification essai** → Check automatique de l'expiration
3. **Restriction modules** → Selon le plan dans `user_subscriptions`

## 🔍 Services de migration disponibles

### dataMigrationService
```typescript
import { dataMigrationService } from '@/services/dataMigrationService';

// Migrer depuis localStorage vers Supabase
await dataMigrationService.fullSync(userId);

// Vérifier si migration nécessaire
const needsMigration = await dataMigrationService.needsMigration(userId);
```

### trialExpirationService
```typescript
import { trialExpirationService } from '@/services/trialExpirationService';

// Démarrer vérification automatique
trialExpirationService.startPeriodicCheck(60); // Chaque heure

// Vérifier un utilisateur spécifique
const status = await trialExpirationService.checkUserTrialStatus(userId);
```

## 🐛 Debug et troubleshooting

### Vérifier les données d'un utilisateur
```bash
# Remplace USER_ID par l'ID réel de ton utilisateur
node scripts/database-utils.js user USER_ID
```

### Logs utiles
Le frontend affiche maintenant des logs détaillés :
- `[AuthContext]` - Authentification et migration
- `[TrialExpirationService]` - Gestion des essais
- `[SubscriptionService]` - Abonnements
- `[ModulesContext]` - Activation/désactivation des modules

### En cas de problème
1. **Vérifier Supabase** : `supabase status`
2. **Reset complet** : `supabase db reset`
3. **Vérifier les tables** : `node scripts/database-utils.js tables`
4. **Console navigateur** : F12 pour voir les logs détaillés

## 🎯 Prochaines étapes

1. **Tester l'inscription** - Créer un nouvel utilisateur
2. **Tester les modules** - Activer/désactiver selon le plan
3. **Tester l'expiration** - Modifier manuellement `trial_end` en DB
4. **Configurer Stripe** - Pour les vrais paiements (optionnel)

## 📞 Support

Si tu rencontres des problèmes :
1. Vérifie les logs dans la console navigateur
2. Utilise `node scripts/database-utils.js` pour diagnostiquer
3. Check le Supabase Studio : http://127.0.0.1:54323

---

🎉 **Ta base CassKai est maintenant complètement restaurée et fonctionnelle !**