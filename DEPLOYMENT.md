# 🚀 Déploiement CassKai - VPS Hostinger

## Méthode de déploiement unique

CassKai utilise **exclusivement** le déploiement direct sur VPS Hostinger. 

### Architecture
- **Frontend**: React/Vite compilé et servi par Nginx
- **Serveur**: VPS Hostinger (89.116.111.88)
- **Proxy**: Docker avec Traefik pour HTTPS automatique
- **Domaine**: casskai.app via proxy inverse

## 🔧 Déploiement

### Commande unique
```bash
npm run deploy
```

Cette commande exécute automatiquement :
1. ✅ Vérification de la connexion VPS
2. 🔨 Build de production avec Vite
3. 📦 Déploiement des fichiers via SCP
4. 🔧 Configuration des permissions
5. 🧪 Tests de santé de l'application

### Prérequis
- Accès SSH configuré vers `root@89.116.111.88`
- Clés SSH dans `~/.ssh/`
- Node.js ≥ 18.0.0

## 📁 Structure sur le serveur

```
/var/www/casskai.app/
├── public/          # Frontend React (compilé)
├── api/            # Backend Node.js (séparé)
└── logs/           # Logs de l'application
```

## 🌐 Accès

- **Production**: https://casskai.app
- **Direct VPS**: http://89.116.111.88:8080
- **API**: https://casskai.app/api/
- **Health Check**: https://casskai.app/health

## 🔍 Troubleshooting

### Problèmes courants
1. **Erreur de connexion SSH** : Vérifier les clés SSH
2. **Build qui échoue** : Lancer `npm run type-check` d'abord
3. **Permissions** : Le script corrige automatiquement les permissions

### Logs utiles
```bash
# Sur le VPS
ssh root@89.116.111.88
docker logs root-traefik-1 --tail=50      # Traefik
docker logs casskai-proxy --tail=50       # Proxy Nginx
sudo systemctl status nginx              # Nginx principal
```

## ⚠️ Important

- **Une seule méthode de déploiement** : VPS direct uniquement
- **Pas de GitHub Actions** : Supprimées pour éviter les confusions
- **Pas de Netlify/Vercel** : Configuration supprimée
- **DNS requis** : Configurer casskai.app → 89.116.111.88 dans Hostinger

---

Pour toute question sur le déploiement, consulter `scripts/deploy.sh`