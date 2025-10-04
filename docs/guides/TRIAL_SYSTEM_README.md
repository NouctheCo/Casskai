# Système de Gestion des Essais - Documentation

## 📋 Vue d'ensemble

Ce système fournit une gestion complète des périodes d'essai pour CassKai, incluant :

- ✅ Création automatique d'essais
- ✅ Suivi des jours restants
- ✅ Conversion en abonnement payant
- ✅ Expiration automatique
- ✅ Statistiques détaillées
- ✅ Interface utilisateur intuitive

## 🛠️ Installation

### 1. Fonctions SQL

Exécutez le fichier `create_trial_functions.sql` dans Supabase > SQL Editor :

```sql
-- Le fichier contient automatiquement :
-- ✅ DROP FUNCTION pour supprimer les conflits existants
-- ✅ 6 fonctions principales pour la gestion des essais
-- ✅ Permissions automatiquement configurées
```

#### 🔧 Résolution des conflits de type de retour

Si vous obtenez l'erreur `"cannot change return type of existing function"`, le fichier gère automatiquement la suppression des fonctions existantes :

```sql
-- Ces commandes sont incluses au début du fichier :
DROP FUNCTION IF EXISTS create_trial_subscription(uuid,uuid) CASCADE;
DROP FUNCTION IF EXISTS expire_trials() CASCADE;
-- ... et ainsi de suite pour toutes les fonctions
```

### 2. Service Frontend

Le service `trialService.ts` est automatiquement disponible :

```typescript
import { trialService } from '@/services/trialService';

// Exemples d'utilisation
const canCreate = await trialService.canCreateTrial(userId);
const trialInfo = await trialService.getUserTrialInfo(userId);
const stats = await trialService.getTrialStatistics();
```

### 3. Hooks React

Utilisez les hooks pour une intégration facile :

```typescript
import { useTrial, useTrialStatistics } from '@/hooks/trial.hooks';

function MyComponent() {
  const {
    trialInfo,
    canCreateTrial,
    createTrial,
    convertTrialToPaid,
    daysRemaining,
    isActive
  } = useTrial();

  // Composant prêt à utiliser !
}
```

## 🎯 Utilisation

### Créer un essai

```typescript
const result = await trialService.createTrialSubscription(userId, companyId);

if (result.success) {
  console.log('Essai créé:', result.subscriptionId);
} else {
  console.error('Erreur:', result.error);
}
```

### Vérifier l'éligibilité

```typescript
const canCreate = await trialService.canCreateTrial(userId);

if (canCreate) {
  // Afficher le bouton "Commencer l'essai"
}
```

### Obtenir les informations d'essai

```typescript
const trialInfo = await trialService.getUserTrialInfo(userId);

if (trialInfo) {
  console.log(`${trialInfo.daysRemaining} jours restants`);
  console.log(`Expire le: ${trialInfo.trialEnd.toLocaleDateString()}`);
}
```

### Convertir en abonnement payant

```typescript
const result = await trialService.convertTrialToPaid(
  userId,
  'starter', // plan_id
  'sub_stripe_123', // ID abonnement Stripe
  'cus_stripe_456' // ID client Stripe
);
```

### Annuler un essai

```typescript
const result = await trialService.cancelTrial(userId, 'Raison de l\'annulation');
```

## 📊 Statistiques

### Obtenir les statistiques générales

```typescript
const stats = await trialService.getTrialStatistics();

// Retourne un tableau comme :
// [
//   { metric: 'total_trials_created', value: 150 },
//   { metric: 'active_trials', value: 45 },
//   { metric: 'expired_trials', value: 89 },
//   { metric: 'converted_to_paid', value: 16 },
//   { metric: 'conversion_rate_percent', value: 11 }
// ]
```

### Surveiller les essais expirants

```typescript
const expiringTrials = await trialService.getExpiringTrials(7); // 7 jours

expiringTrials.forEach(trial => {
  const daysLeft = Math.ceil(
    (new Date(trial.trial_end) - new Date()) / (1000 * 60 * 60 * 24)
  );
  console.log(`User ${trial.user_id}: ${daysLeft} jours restants`);
});
```

## 🔄 Expiration automatique

### Script manuel

```bash
# Exécuter manuellement
node scripts/expire-trials.js
```

### Configuration cron (Linux/Mac)

```bash
# Éditer la crontab
crontab -e

# Ajouter cette ligne pour exécution toutes les heures
0 * * * * /usr/bin/node /path/to/casskai/scripts/expire-trials.js
```

### Via PM2 (recommandé)

```bash
# Installer PM2
npm install -g pm2

# Créer un fichier ecosystem.config.js
# Puis démarrer le script
pm2 start scripts/expire-trials.js --name "trial-expirer"
pm2 save
pm2 startup
```

## 🎨 Composants UI

### Gestionnaire d'essai utilisateur

```typescript
import { TrialManager } from '@/components/trial/TrialComponents';

function UserDashboard() {
  return (
    <div>
      <TrialManager />
    </div>
  );
}
```

### Statistiques administrateur

```typescript
import { TrialStatistics, ExpiringTrialsAlert } from '@/components/trial/TrialComponents';

function AdminDashboard() {
  return (
    <div className="space-y-6">
      <TrialStatistics />
      <ExpiringTrialsAlert />
    </div>
  );
}
```

## ⚙️ Configuration

### Variables d'environnement

Ajoutez dans votre `.env` :

```env
# Clé de service Supabase (pour les scripts)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Permissions Supabase

Les fonctions sont automatiquement configurées avec les permissions `authenticated`. Assurez-vous que vos utilisateurs sont connectés.

## 🚨 Dépannage

### Erreur "ALREADY_EXISTS"

Un utilisateur a déjà un essai actif. Vérifiez avec :

```sql
SELECT * FROM user_subscriptions
WHERE user_id = 'user-id' AND status = 'trialing';
```

### Erreur "cannot change return type of existing function"

**Solution automatique :** Le fichier `create_trial_functions.sql` contient maintenant des commandes `DROP FUNCTION` au début qui suppriment automatiquement les fonctions existantes avant de les recréer.

**Si le problème persiste :**

```sql
-- Exécutez manuellement ces commandes dans Supabase :
DROP FUNCTION IF EXISTS create_trial_subscription(uuid,uuid) CASCADE;
DROP FUNCTION IF EXISTS expire_trials() CASCADE;
DROP FUNCTION IF EXISTS can_create_trial(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_user_trial_info(uuid) CASCADE;
DROP FUNCTION IF EXISTS convert_trial_to_paid(uuid, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS cancel_trial(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS get_trial_statistics() CASCADE;
```

Puis réexécutez le fichier complet.

### Problèmes de permissions

Vérifiez les permissions dans Supabase :

```sql
-- Vérifier les permissions des fonctions
SELECT * FROM information_schema.role_routine_grants
WHERE routine_name LIKE '%trial%';
```

## 📈 Métriques importantes

- **Taux de conversion** : Pourcentage d'essais convertis en payant
- **Durée moyenne d'essai** : Temps avant conversion ou expiration
- **Essais expirés** : Nombre d'essais non convertis
- **Essais actifs** : Nombre d'utilisateurs en période d'essai

## 🔒 Sécurité

- Toutes les fonctions utilisent `SECURITY DEFINER`
- Vérification automatique des permissions utilisateur
- Logs détaillés pour l'audit
- Protection contre les abus (un essai par utilisateur)

---

## 📞 Support

Pour toute question ou problème :

1. Vérifiez les logs de Supabase
2. Testez les fonctions individuellement
3. Consultez la documentation Supabase RPC
4. Ouvrez une issue sur le repository

## Le système est maintenant opérationnel ! 🎉
