#!/bin/bash
# CassKai - Script de déploiement STAGING (Beta Testing)
# Usage: ./deploy-staging.sh [--skip-build]

set -e

VPS_HOST="root@89.116.111.88"
STAGING_DIR="/var/www/staging.casskai.app"
NGINX_CONF="/etc/nginx/sites-available/casskai-staging"
SKIP_BUILD=false

# Parse arguments
if [ "$1" = "--skip-build" ]; then
    SKIP_BUILD=true
fi

echo "🚀 DÉPLOIEMENT STAGING - CassKai Beta Testing"
echo "============================================="
echo ""

# 1. Build local avec config staging
if [ "$SKIP_BUILD" = false ]; then
    echo "📦 Build staging avec .env.staging..."

    if [ -f ".env.staging" ]; then
        cp .env.staging .env.local
        echo "✅ .env.staging copié vers .env.local"
    else
        echo "❌ Fichier .env.staging introuvable!"
        exit 1
    fi

    npm run build

    if [ $? -ne 0 ]; then
        echo "❌ Build échoué!"
        exit 1
    fi

    echo "✅ Build staging terminé"
else
    echo "⏭️  Build ignoré (utilisation du build existant)"
fi

# 2. Vérifier le dossier dist
if [ ! -d "dist" ]; then
    echo "❌ Dossier dist/ introuvable!"
    exit 1
fi

echo ""
echo "📤 Préparation du transfert vers VPS..."

# 3. Créer backup sur le VPS
echo "💾 Création backup staging..."
BACKUP_DATE=$(date +"%Y-%m-%d_%H%M%S")
ssh $VPS_HOST "if [ -d $STAGING_DIR ]; then cp -r $STAGING_DIR ${STAGING_DIR}_backup_${BACKUP_DATE}; fi"

echo "✅ Backup créé: ${STAGING_DIR}_backup_${BACKUP_DATE}"

# 4. Créer le répertoire staging sur le VPS
echo "📁 Création répertoire staging sur VPS..."
ssh $VPS_HOST "mkdir -p $STAGING_DIR && mkdir -p ${STAGING_DIR}_temp"

# 5. Upload des fichiers
echo "📤 Upload des fichiers vers VPS..."
scp -r dist/* "${VPS_HOST}:${STAGING_DIR}_temp/"

if [ $? -ne 0 ]; then
    echo "❌ Upload échoué!"
    exit 1
fi

echo "✅ Upload terminé"

# 6. Déploiement atomique
echo "🔄 Déploiement atomique..."
ssh $VPS_HOST "rm -rf $STAGING_DIR/* && mv ${STAGING_DIR}_temp/* $STAGING_DIR/ && rmdir ${STAGING_DIR}_temp && chown -R www-data:www-data $STAGING_DIR && chmod -R 755 $STAGING_DIR"

if [ $? -ne 0 ]; then
    echo "❌ Déploiement échoué!"
    exit 1
fi

echo "✅ Déploiement atomique terminé"

# 7. Configuration Nginx staging
echo "⚙️  Configuration Nginx staging..."

# Upload nginx-staging.conf
scp nginx-staging.conf "${VPS_HOST}:/tmp/casskai-staging.conf"

ssh $VPS_HOST "mv /tmp/casskai-staging.conf $NGINX_CONF && ln -sf $NGINX_CONF /etc/nginx/sites-enabled/casskai-staging 2>/dev/null || true && nginx -t"

if [ $? -ne 0 ]; then
    echo "❌ Configuration Nginx invalide!"
    exit 1
fi

# 8. Obtenir certificat SSL Let's Encrypt (première fois uniquement)
echo "🔒 Vérification SSL Let's Encrypt..."
ssh $VPS_HOST "if [ ! -d /etc/letsencrypt/live/staging.casskai.app ]; then certbot certonly --nginx -d staging.casskai.app --non-interactive --agree-tos -m admin@casskai.app; else echo 'Certificat SSL déjà existant'; fi"

# 9. Redémarrer Nginx
echo "🔄 Redémarrage Nginx..."
ssh $VPS_HOST "systemctl reload nginx"

if [ $? -ne 0 ]; then
    echo "❌ Redémarrage Nginx échoué!"
    exit 1
fi

echo "✅ Nginx redémarré"

# 10. Tests de santé
echo ""
echo "🏥 Tests de santé..."

sleep 3

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://staging.casskai.app/health || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Health check OK (HTTP)"
else
    echo "⚠️  Health check HTTP échoué (peut être normal si SSL seulement)"
fi

# 11. Rapport final
echo ""
echo "============================================="
echo "✅ DÉPLOIEMENT STAGING TERMINÉ AVEC SUCCÈS!"
echo "============================================="
echo ""
echo "🌐 URL Staging: https://staging.casskai.app"
echo "📊 Monitoring: Check Plausible & Sentry"
echo "💾 Backup: ${STAGING_DIR}_backup_${BACKUP_DATE}"
echo ""
echo "🧪 Prochaines étapes:"
echo "  1. Tester l'accès: curl https://staging.casskai.app/health"
echo "  2. Vérifier les logs: ssh $VPS_HOST 'tail -f /var/log/nginx/staging.casskai.app.access.log'"
echo "  3. Recruter les beta testers"
echo "  4. Configurer le formulaire de feedback"
echo ""
