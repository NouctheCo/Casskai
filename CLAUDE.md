# CassKai - Configuration et Commandes

## Déploiement VPS
**⚠️ Architecture mise à jour (21 janvier 2026) :**
- Traefik et Docker supprimés
- Nginx sert directement les fichiers statiques
- Plus besoin de redémarrer les containers après déploiement

**Commande automatisée recommandée :**
- **Windows PowerShell** : `.\deploy-vps.ps1`
- **Linux/Mac/Git Bash** : `./deploy-vps.sh`

**Options avancées :**
- Skip build : `.\deploy-vps.ps1 -SkipBuild` ou `./deploy-vps.sh --skip-build`
- **Commandes manuelles** :
  - `npm run build` - Build local
  - `npm run type-check` - Vérification TypeScript
  - `npm run validate:db` - Validation colonnes DB Supabase

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
**Architecture simplifiée (sans Docker/Traefik) :**
```
Internet → Nginx (système) → Fichiers statiques
```

- **VPS** : 89.116.111.88
- **Domaines** :
  - Production : https://casskai.app et https://www.casskai.app
  - Staging : https://staging.casskai.app
- **SSL** : Let's Encrypt (`/etc/letsencrypt/live/casskai.app/`)
- **Frontend Production** : React/Vite servi par Nginx depuis `/var/www/casskai.app/`
- **Frontend Staging** : `/var/www/casskai-staging/`
- **API Backend** : Node.js géré par PM2 (casskai-api)
- **Nginx Config** : `/etc/nginx/sites-available/casskai-frontend`
- **Cache** : Désactivé pour HTML, 30 jours pour assets

## Processus de déploiement automatisé :
1. **Build local** - Construction optimisée du projet
2. **Backup VPS** - Sauvegarde automatique avec timestamp
3. **Upload sécurisé** - Transfert vers répertoire temporaire
4. **Déploiement atomique** - Remplacement sans interruption
5. **Permissions** - Correction automatique (www-data:www-data)
6. **Vérification API** - Redémarrage PM2 si nécessaire
7. **Tests de santé** - Validation HTTPS (casskai.app et www.casskai.app)
8. **Rapport** - Informations détaillées du déploiement

**Note importante :** Nginx sert automatiquement les nouveaux fichiers après upload. Aucun redémarrage de service n'est nécessaire pour le frontend.

## Commandes de déploiement manuel :
```bash
# Production
scp -r dist/* root@89.116.111.88:/var/www/casskai.app/
ssh root@89.116.111.88 "chown -R www-data:www-data /var/www/casskai.app"

# Staging
scp -r dist/* root@89.116.111.88:/var/www/casskai-staging/
ssh root@89.116.111.88 "chown -R www-data:www-data /var/www/casskai-staging"

# Vérification
curl -I https://casskai.app
ssh root@89.116.111.88 "tail -f /var/log/nginx/casskai-access.log"
```