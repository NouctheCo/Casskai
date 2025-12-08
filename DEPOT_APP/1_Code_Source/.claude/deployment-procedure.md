# Procédure de Déploiement - CassKai

## Quand l'utilisateur demande "déploie"

### ⚡ Action Unique - Script PowerShell

```powershell
.\deploy-vps.ps1
```

**C'est tout.** Une seule commande, un seul script.

---

## Détails Technique

- **Script**: `deploy-vps.ps1` (script principal et unique)
- **VPS**: 89.116.111.88
- **User**: root
- **Path**: /var/www/casskai.app
- **URL**: https://casskai.app

### Étapes automatiques du script :
1. ✅ Build production (`npm run build`)
2. ✅ Backup VPS (timestampé)
3. ✅ Upload via SCP
4. ✅ Déploiement atomique
5. ✅ Permissions www-data
6. ✅ Reload Nginx
7. ✅ Tests de santé

---

## Si deploy-vps.ps1 demande le mot de passe

**Méthode manuelle (2 minutes)** :

```powershell
# 1. Upload
scp dist-deploy.zip root@89.116.111.88:/tmp/

# 2. Connexion
ssh root@89.116.111.88

# 3. Sur le VPS - copier-coller cette ligne :
cd /tmp && unzip -o dist-deploy.zip -d /tmp/casskai-new && mkdir -p /var/backups/casskai && tar -czf /var/backups/casskai/backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /var/www casskai.app 2>/dev/null || true && rm -rf /var/www/casskai.app/* && cp -r /tmp/casskai-new/* /var/www/casskai.app/ && chown -R www-data:www-data /var/www/casskai.app && chmod -R 755 /var/www/casskai.app && systemctl reload nginx && pm2 restart casskai-api 2>/dev/null || true && rm -rf /tmp/casskai-new /tmp/dist-deploy.zip && echo '✅ DÉPLOIEMENT RÉUSSI!'
```

---

## Après le déploiement

**Nettoyer le cache navigateur** :
https://casskai.app/clear-cache.html?auto=1

---

## 🚫 Scripts Obsolètes Supprimés

Tous les autres scripts de déploiement ont été supprimés pour éviter la confusion :
- ❌ deploy-auto.ps1
- ❌ deploy-fast.ps1
- ❌ deploy-simple.cmd
- ❌ deploy-vps.sh
- ❌ DEPLOYER.bat
- ❌ etc.

**Il n'existe plus qu'UN SEUL script** : `deploy-vps.ps1`

---

*Procédure unique et simplifiée - Mise à jour: 2025-01-07*