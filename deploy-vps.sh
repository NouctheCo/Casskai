#!/bin/bash

# Script de déploiement automatisé pour CassKai VPS
# Usage: ./deploy-vps.sh [--skip-build]

set -e  # Arrêter en cas d'erreur

VPS_HOST="89.116.111.88"
VPS_USER="root"
VPS_PATH="/var/www/casskai.app"
BUILD_DIR="dist"
SKIP_BUILD=false

# Parse arguments
if [[ "$1" == "--skip-build" ]]; then
    SKIP_BUILD=true
fi

echo "🚀 Démarrage du déploiement CassKai..."

# 1. Build local
if [ "$SKIP_BUILD" = false ]; then
    echo "📦 Construction du projet..."
    if [ ! -f "package.json" ]; then
        echo "❌ Erreur: package.json introuvable. Assurez-vous d'être dans le répertoire racine du projet."
        exit 1
    fi

    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Erreur lors de la construction du projet"
        exit 1
    fi
    echo "✅ Build terminée avec succès"
else
    echo "⏭️ Build ignorée (option --skip-build)"
fi

if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Erreur: Le répertoire $BUILD_DIR n'existe pas"
    exit 1
fi

# 2. Backup des fichiers actuels sur le VPS
echo "💾 Sauvegarde des fichiers actuels..."
ssh -o ConnectTimeout=10 $VPS_USER@$VPS_HOST "
    if [ -d '$VPS_PATH' ]; then
        cp -r $VPS_PATH ${VPS_PATH}.backup.$(date +%Y%m%d_%H%M%S)
        echo '✅ Sauvegarde créée'
    fi
"

# 3. Créer le répertoire temporaire sur le VPS
echo "📁 Préparation du répertoire de déploiement..."
ssh -o ConnectTimeout=10 $VPS_USER@$VPS_HOST "
    mkdir -p ${VPS_PATH}.tmp
    rm -rf ${VPS_PATH}.tmp/*
"

# 4. Upload des nouveaux fichiers vers le répertoire temporaire
echo "📤 Envoi des fichiers..."
scp -o ConnectTimeout=10 -r $BUILD_DIR/* $VPS_USER@$VPS_HOST:${VPS_PATH}.tmp/

# 5. Vérification que les fichiers ont été uploadés
echo "🔍 Vérification des fichiers uploadés..."
ssh -o ConnectTimeout=10 $VPS_USER@$VPS_HOST "
    if [ ! -f '${VPS_PATH}.tmp/index.html' ]; then
        echo '❌ Erreur: index.html non trouvé après upload'
        exit 1
    fi
    echo '✅ Fichiers uploadés avec succès'
"

# 6. Remplacement atomique des fichiers
echo "🔄 Remplacement des fichiers..."
ssh -o ConnectTimeout=10 $VPS_USER@$VPS_HOST "
    # Supprimer les anciens fichiers frontend (garder api et autres dossiers)
    find '$VPS_PATH' -maxdepth 1 -type f -name '*.html' -delete
    find '$VPS_PATH' -maxdepth 1 -type f -name '*.js' -delete
    find '$VPS_PATH' -maxdepth 1 -type f -name '*.css' -delete
    find '$VPS_PATH' -maxdepth 1 -type f -name '*.json' -delete
    find '$VPS_PATH' -maxdepth 1 -type f -name '*.ico' -delete
    find '$VPS_PATH' -maxdepth 1 -type f -name '*.svg' -delete
    find '$VPS_PATH' -maxdepth 1 -type f -name '*.br' -delete
    find '$VPS_PATH' -maxdepth 1 -type f -name '*.gz' -delete
    rm -rf '$VPS_PATH/assets' 2>/dev/null || true

    # Déplacer les nouveaux fichiers
    mv ${VPS_PATH}.tmp/* '$VPS_PATH/'
    rmdir ${VPS_PATH}.tmp

    # Corriger les permissions
    chown -R www-data:www-data '$VPS_PATH'
    chmod -R 644 '$VPS_PATH'/*
    find '$VPS_PATH' -type d -exec chmod 755 {} \;

    echo '✅ Fichiers remplacés et permissions corrigées'
"

# 7. Test de la configuration Nginx
echo "🔧 Test de la configuration Nginx..."
ssh -o ConnectTimeout=10 $VPS_USER@$VPS_HOST "
    nginx -t
    if [ \$? -ne 0 ]; then
        echo '❌ Erreur dans la configuration Nginx'
        exit 1
    fi
    echo '✅ Configuration Nginx valide'
"

# 8. Redémarrage des services
echo "🔄 Redémarrage des services..."
ssh -o ConnectTimeout=10 $VPS_USER@$VPS_HOST "
    # Arrêter tous les processus Nginx existants proprement
    pkill nginx 2>/dev/null || true
    sleep 2

    # Redémarrer Nginx
    nginx -g 'daemon on;'
    if [ \$? -ne 0 ]; then
        echo '❌ Erreur lors du redémarrage de Nginx'
        exit 1
    fi

    # Vérifier que l'API backend tourne toujours
    pm2 status casskai-api | grep online
    if [ \$? -ne 0 ]; then
        echo '⚠️  Redémarrage de l API backend...'
        pm2 restart casskai-api
    fi

    echo '✅ Services redémarrés'
"

# 9. Test de santé du site
echo "🩺 Test de santé du site..."
sleep 3  # Attendre que les services soient prêts

# Test HTTP local depuis le VPS
ssh -o ConnectTimeout=10 $VPS_USER@$VPS_HOST "
    HTTP_CODE=\$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/)
    if [ \"\$HTTP_CODE\" != \"200\" ]; then
        echo '❌ Erreur: Le site ne répond pas correctement (Code: \$HTTP_CODE)'
        exit 1
    fi
    echo '✅ Site accessible localement (Code: \$HTTP_CODE)'
"

# Test HTTPS externe
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' https://casskai.app/ || echo "000")
if [ "$HTTP_CODE" != "200" ]; then
    echo "⚠️  Attention: Le site ne répond pas en HTTPS (Code: $HTTP_CODE)"
    echo "   Cela peut être normal si les DNS/CDN mettent du temps à se mettre à jour"
else
    echo "✅ Site accessible en HTTPS (Code: $HTTP_CODE)"
fi

# 10. Affichage des informations de déploiement
echo ""
echo "🎉 Déploiement terminé avec succès!"
echo "📊 Informations de déploiement:"
ssh -o ConnectTimeout=10 $VPS_USER@$VPS_HOST "
    echo '   - Timestamp: \$(date)'
    echo '   - Taille index.html: \$(stat -c%s $VPS_PATH/index.html) bytes'
    echo '   - Dernière modification: \$(stat -c%y $VPS_PATH/index.html)'
    echo '   - Processus Nginx: \$(pgrep nginx | wc -l) processus'
    echo '   - API Status: \$(pm2 jlist | jq -r '.[0].pm2_env.status' 2>/dev/null || echo 'N/A')'
"

echo ""
echo "🌐 Votre site est maintenant disponible sur:"
echo "   https://casskai.app"
echo ""
echo "💡 Pour forcer le rafraîchissement du cache navigateur:"
echo "   - Chrome/Firefox: Ctrl+F5 ou Ctrl+Shift+R"
echo "   - Safari: Cmd+Shift+R"
echo ""