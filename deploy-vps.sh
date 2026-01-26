#!/bin/bash

# Script de déploiement CassKai - Architecture Nginx direct (sans Docker/Traefik)
# Usage: ./deploy-vps.sh [--skip-build]

set -e

VPS_HOST="89.116.111.88"
VPS_USER="root"
VPS_PATH="/var/www/casskai.app"
BUILD_DIR="dist"
SKIP_BUILD=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-build|-s)
            SKIP_BUILD=true
            shift
            ;;
        *)
            echo "Usage: $0 [--skip-build]"
            exit 1
            ;;
    esac
done

echo -e "\n\033[0;36m[DEPLOY] Démarrage du déploiement CassKai...\033[0m"

# 1. Build
if [ "$SKIP_BUILD" = false ]; then
    echo -e "\033[0;34m[BUILD] Construction du projet...\033[0m"
    npm run build:production
    echo -e "\033[0;32m[SUCCESS] Build terminée\033[0m"
else
    echo -e "\033[0;33m[SKIP] Build ignorée\033[0m"
fi

if [ ! -d "$BUILD_DIR" ]; then
    echo -e "\033[0;31m[ERROR] Le répertoire dist n'existe pas\033[0m"
    exit 1
fi

# 2. Créer archive
echo -e "\033[0;34m[PACKAGE] Création de l'archive...\033[0m"
cd "$BUILD_DIR"
tar czf ../casskai-build.tar.gz .
cd ..

# 3. Upload
echo -e "\033[0;34m[UPLOAD] Envoi vers le VPS...\033[0m"
scp casskai-build.tar.gz ${VPS_USER}@${VPS_HOST}:/tmp/

# 4. Deploy
echo -e "\033[0;34m[DEPLOY] Déploiement sur le VPS...\033[0m"
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
set -e
cd /var/www
# Backup avec timestamp
cp -r casskai.app casskai.app.backup.$(date +%Y%m%d_%H%M%S)
# Extraction dans répertoire temporaire
rm -rf casskai.app.tmp
mkdir -p casskai.app.tmp
cd casskai.app.tmp
tar xzf /tmp/casskai-build.tar.gz
# Déploiement atomique
cd /var/www
rm -rf casskai.app/*
cp -r casskai.app.tmp/* casskai.app/
rm -rf casskai.app.tmp
# Permissions
chown -R www-data:www-data casskai.app
chmod -R 755 casskai.app
echo "Déploiement OK"
ENDSSH

# 5. Vérification (pas besoin de redémarrer Nginx - sert directement les fichiers)
echo -e "\033[0;32m[INFO] Fichiers déployés - Nginx les sert automatiquement\033[0m"
echo -e "\033[0;34m[SERVICES] Vérification de l'API...\033[0m"
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
set -e

# Vérification Nginx host (architecture actuelle sans Docker/Traefik)
if systemctl is-active --quiet nginx; then
    echo "[NGINX] Service actif (sert directement /var/www/casskai.app)"
else
    echo "[WARNING] Nginx n'est pas actif"
    systemctl status nginx --no-pager
fi

# Restart API via PM2 si elle existe
if pm2 list | grep -q casskai-api; then
    echo "[API] Redémarrage de l'API PM2"
    pm2 restart casskai-api
    pm2 save
else
    echo "[API] API casskai-api non trouvée dans PM2 (normal si frontend uniquement)"
fi

echo "[SERVICES] OK"
ENDSSH

# 6. Tests
echo -e "\033[0;34m[TEST] Vérification du domaine HTTPS\033[0m"
sleep 2
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
curl -s -o /dev/null -w 'HTTPS casskai.app: %{http_code}\n' https://casskai.app
curl -s -o /dev/null -w 'HTTPS www.casskai.app: %{http_code}\n' https://www.casskai.app
ENDSSH

# 7. Cleanup
echo -e "\033[0;34m[CLEANUP] Nettoyage...\033[0m"
rm -f casskai-build.tar.gz
ssh ${VPS_USER}@${VPS_HOST} "rm -f /tmp/casskai-build.tar.gz"

echo -e "\n\033[0;32m[SUCCESS] Déploiement terminé!\033[0m"
echo -e "\033[0;36m[INFO] Site disponible sur: https://casskai.app\033[0m"
echo ""
