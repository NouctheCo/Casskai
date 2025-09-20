# Configuration de l'automatisation des trials

## 🚀 Automatisation de l'expiration des trials

Ce document explique comment configurer l'automatisation de l'expiration des trials.

### 📋 Prérequis

1. **Variables d'environnement** : Assurez-vous que les variables suivantes sont configurées :

   ```bash
   VITE_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Node.js** : Version 18+ requise

### 🔧 Méthodes d'automatisation

#### Option 1 : Cron Job (Linux/Mac)

1. **Ouvrir le crontab** :
   ```bash
   crontab -e
   ```

2. **Ajouter la ligne suivante** (exécution toutes les heures) :
   ```bash
   0 * * * * cd /path/to/your/project && npm run expire-trials >> /var/log/trial-expiration.log 2>&1
   ```

3. **Pour une exécution quotidienne à 2h du matin** :
   ```bash
   0 2 * * * cd /path/to/your/project && npm run expire-trials >> /var/log/trial-expiration.log 2>&1
   ```

#### Option 2 : GitHub Actions (recommandé pour le déploiement)

Créer le fichier `.github/workflows/expire-trials.yml` :

```yaml
name: Expire Trials

on:
  schedule:
    # Exécution toutes les heures
    - cron: '0 * * * *'
  workflow_dispatch: # Permet l'exécution manuelle

jobs:
  expire-trials:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Expire trials
        run: npm run expire-trials
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

#### Option 3 : Script de surveillance (pour développement)

Créer un script de surveillance qui s'exécute en continu :

```javascript
// scripts/watch-expire-trials.js
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runExpiration() {
  try {
    console.log('🔄 Vérification des trials expirés...');
    const { stdout, stderr } = await execAsync('npm run expire-trials');

    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);

  } catch (error) {
    console.error('❌ Erreur lors de l\'expiration:', error);
  }
}

// Exécuter toutes les heures
setInterval(runExpiration, 60 * 60 * 1000);

// Exécuter immédiatement au démarrage
runExpiration();

console.log('👀 Surveillance des trials démarrée (vérification toutes les heures)');
```

### 📊 Monitoring et Alertes

#### Logs

Les logs sont automatiquement générés dans la console. Pour une production, redirigez vers un fichier :

```bash
npm run expire-trials >> logs/trial-expiration-$(date +\%Y\%m\%d).log 2>&1
```

#### Métriques importantes à surveiller

1. **Nombre d'essais expirés par jour**
2. **Taux de conversion** (essais → abonnements payants)
3. **Essais expirant bientôt** (prochains 7 jours)
4. **Erreurs d'expiration**

#### Alertes recommandées

- Alerte si plus de 10 essais expirent en une heure
- Alerte si le taux de conversion tombe en dessous de 20%
- Alerte en cas d'erreur répétée du script

### 🔍 Dépannage

#### Le script ne s'exécute pas

1. Vérifier les permissions du fichier :
   ```bash
   chmod +x scripts/expire-trials.js
   ```

2. Vérifier les variables d'environnement :
   ```bash
   echo $VITE_SUPABASE_URL
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

3. Tester manuellement :
   ```bash
   npm run expire-trials
   ```

#### Erreurs de connexion à Supabase

- Vérifier que l'URL Supabase est correcte
- Vérifier que la clé de service est valide
- Vérifier les règles RLS dans Supabase

#### Performance

Pour de gros volumes, envisager :
- Exécution en parallèle des vérifications
- Index sur les colonnes `trial_end` et `status`
- Cache des résultats fréquemment consultés

### 📈 Optimisations

1. **Index de base de données** :
   ```sql
   CREATE INDEX idx_user_subscriptions_trial_status ON user_subscriptions(status, plan_id, trial_end);
   ```

2. **Monitoring des performances** :
   - Temps d'exécution du script
   - Utilisation mémoire
   - Nombre de requêtes à la base de données

3. **Sauvegarde automatique** :
   - Sauvegarder les données avant expiration
   - Archiver les anciens essais

### 🎯 Bonnes pratiques

- **Test en staging** : Tester d'abord en environnement de staging
- **Logs détaillés** : Conserver les logs pendant au moins 30 jours
- **Alertes** : Configurer des alertes pour les anomalies
- **Rollback** : Avoir une procédure de rollback en cas de problème
- **Documentation** : Maintenir cette documentation à jour

### 📞 Support

En cas de problème :
1. Vérifier les logs du script
2. Tester manuellement les fonctions SQL
3. Vérifier la connectivité avec Supabase
4. Consulter la documentation Supabase pour les fonctions RPC