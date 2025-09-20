# CassKai - Configuration et Commandes

## Déploiement VPS
**Commande automatisée recommandée :**
- **Windows PowerShell** : `.\deploy-vps.ps1`
- **Linux/Mac/Git Bash** : `./deploy-vps.sh`

**Options avancées :**
- Skip build : `.\deploy-vps.ps1 -SkipBuild` (utilise le build existant)
- **Commandes manuelles** :
  - `npm run build` - Build local
  - `npm run type-check` - Vérification TypeScript
  - `npm run deploy` - Déploiement basique (obsolète)

## État TypeScript
Il reste des erreurs TypeScript complexes liées à :
- Conflits de types entre `ai.types` et `ai-types`
- Types de base de données manquants
- Imports et déclarations dupliquées

**Solution recommandée** : Configurer TypeScript avec `skipLibCheck: true` temporairement pour le déploiement, et nettoyer les types progressivement.

## Corrections urgentes à faire :
1. Unifier les types AI dans un seul fichier (`ai-types.ts`)
2. Nettoyer les déclarations globales dupliquées
3. Vérifier les imports de services (`journalEntriesService` vs `journalEntryService`)

## Architecture déployée :
- **VPS** : 89.116.111.88
- **Domaine** : https://casskai.app
- **SSL** : Let's Encrypt avec Nginx
- **Frontend** : React/Vite servi par Nginx depuis `/var/www/casskai.app/`
- **API Backend** : Node.js géré par PM2 (casskai-api)
- **Nginx Config** : `/etc/nginx/sites-available/casskai-frontend`

## Processus de déploiement automatisé :
1. **Build local** - Construction optimisée du projet
2. **Backup VPS** - Sauvegarde automatique avec timestamp
3. **Upload sécurisé** - Transfert vers répertoire temporaire
4. **Déploiement atomique** - Remplacement sans interruption
5. **Permissions** - Correction automatique (www-data:www-data)
6. **Services** - Redémarrage de Nginx et vérification API
7. **Tests de santé** - Validation HTTP/HTTPS
8. **Rapport** - Informations détaillées du déploiement