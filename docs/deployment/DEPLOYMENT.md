# 🚀 Guide de Déploiement CassKai

## Déploiement en Une Commande

```bash
npm run deploy
```

**C'est tout !** ⚡ Le script gère automatiquement tout le processus.

## Architecture de Déploiement

### Infrastructure
- **Méthode**: Déploiement direct sur VPS Hostinger (unique méthode supportée)
- **Serveur**: VPS Hostinger (89.116.111.88)
- **Frontend**: React/Vite compilé et servi par Nginx
- **Proxy**: Docker avec Traefik pour HTTPS automatique
- **Domaine**: casskai.app via proxy inverse

### Processus Automatique

La commande `npm run deploy` exécute automatiquement :
1. ✅ Vérification de la connexion VPS (SSH)
2. 🔨 Build de production avec Vite (~30s)
3. 📦 Transfer des fichiers via SCP (~15s)
4. 🔧 Configuration des permissions (www-data:www-data)
5. 🔄 Redémarrage des services (Nginx, PM2)
6. 🧪 Tests de santé de l'application
7. 🎉 Confirmation du déploiement réussi

**Temps total**: ~1 minute

## Prérequis

Avant le premier déploiement :

- ✅ Node.js ≥ 18.0.0 installé
- ✅ Accès SSH configuré vers `root@89.116.111.88`
- ✅ Clés SSH dans `~/.ssh/`
- ✅ DNS configuré : casskai.app → 89.116.111.88

## Structure sur le Serveur

```
/var/www/casskai.app/
├── public/          # Frontend React (build Vite)
│   ├── index.html
│   ├── assets/
│   └── ...
├── api/            # Backend Node.js (géré par PM2)
└── logs/           # Logs de l'application
```

## URLs et Accès

- **🌍 Production**: https://casskai.app
- **🔌 API**: https://casskai.app/api/
- **💚 Health Check**: https://casskai.app/health
- **🖥️ Direct VPS**: http://89.116.111.88:8080

## Scripts Disponibles

```bash
# Déploiement standard
npm run deploy

# Déploiement rapide (skip build si déjà fait)
./deploy-vps.ps1 -SkipBuild    # Windows
./deploy-vps.sh --skip-build   # Linux/Mac

# Build local uniquement
npm run build

# Vérification TypeScript avant déploiement
npm run type-check
```

## Résultat Attendu

```bash
🚀 === Déploiement CassKai sur VPS Hostinger ===
✅ VPS accessible (89.116.111.88)
✅ Build réussi (dist/ créé)
✅ Backup effectué (backup-YYYYMMDD-HHMMSS)
✅ Frontend déployé (/var/www/casskai.app/public)
✅ Permissions corrigées (www-data:www-data)
✅ Nginx redémarré
✅ Backend API active (PM2 casskai-api)
✅ Tests passés (HTTP 200)
🎉 === Déploiement terminé avec succès ===

📊 Rapport:
- Fichiers déployés: 125
- Taille totale: 2.3 MB
- Temps total: 58s
- URL: https://casskai.app
```

## Troubleshooting

### Problème: Erreur de connexion SSH
```bash
# Vérifier l'accès SSH
ssh root@89.116.111.88

# Si échec, vérifier les clés
ls -la ~/.ssh/
cat ~/.ssh/config
```

### Problème: Build qui échoue
```bash
# Vérifier les erreurs TypeScript d'abord
npm run type-check

# Nettoyer et rebuilder
rm -rf dist node_modules
npm install
npm run build
```

### Problème: Application ne démarre pas
```bash
# Se connecter au VPS
ssh root@89.116.111.88

# Vérifier Nginx
sudo systemctl status nginx
sudo nginx -t  # Test de configuration

# Vérifier les permissions
ls -la /var/www/casskai.app/public

# Vérifier le backend API
pm2 status
pm2 logs casskai-api --lines 50
```

### Problème: HTTPS ne fonctionne pas
```bash
# Sur le VPS, vérifier Traefik
docker logs root-traefik-1 --tail=50

# Vérifier le proxy Nginx
docker logs casskai-proxy --tail=50
```

## Logs Utiles

### Sur le VPS
```bash
# Se connecter
ssh root@89.116.111.88

# Logs Nginx
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Logs Backend API
pm2 logs casskai-api

# Logs Docker/Traefik
docker logs root-traefik-1 --follow
docker logs casskai-proxy --follow
```

### En local
```bash
# Logs de build
npm run build > build.log 2>&1

# Logs de déploiement
npm run deploy > deploy.log 2>&1
```

## ⚠️ Important

### Ce qui est supporté
- ✅ **VPS direct uniquement** : Méthode unique et recommandée
- ✅ **Déploiement automatisé** : Scripts Windows (PowerShell) et Linux (Bash)
- ✅ **HTTPS automatique** : Certificats Let's Encrypt via Traefik
- ✅ **Backups automatiques** : Avant chaque déploiement

### Ce qui n'est PAS supporté
- ❌ **GitHub Actions** : Supprimées (conflits avec VPS direct)
- ❌ **Netlify/Vercel** : Configuration supprimée (incompatible avec l'architecture)
- ❌ **Docker Compose déploiement** : VPS utilise Nginx natif + Docker uniquement pour Traefik

## Configuration Avancée

### Variables d'environnement

Le déploiement utilise automatiquement les variables de `.env.production` :

```bash
VITE_SUPABASE_URL=https://smtdtgrymuzwvctattmx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
# Autres variables...
```

### Personnaliser le déploiement

Modifier `scripts/deploy.sh` ou `deploy-vps.ps1` selon vos besoins.

## Support et Documentation

- **Scripts de déploiement**: `scripts/deploy.sh`, `deploy-vps.ps1`
- **Edge Functions**: Voir `docs/deployment/DEPLOYMENT_EDGE_FUNCTIONS.md`
- **Stripe**: Voir `docs/deployment/STRIPE_INTEGRATION.md`
- **Sécurité**: Voir `docs/security/SECURITY_CONFIGURATION_GUIDE.md`

---

**👥 Pour toute l'équipe : `npm run deploy` et c'est parti !**
