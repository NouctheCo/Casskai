#!/bin/bash

# 🚀 Script de déploiement CassKai vers VPS Hostinger
# Architecture : VPS 89.116.111.88 avec Traefik + Nginx + PM2

set -e

echo "🚀 === Déploiement CassKai sur VPS Hostinger ==="
echo ""

# Configuration
VPS_IP="89.116.111.88"
VPS_USER="root"
FRONTEND_PATH="/var/www/casskai.app/public"
BACKEND_PATH="/var/www/casskai.app/api"

# Vérifications pré-déploiement
echo "📋 Vérifications pré-déploiement..."

# Vérifier que le VPS est accessible
if ! ssh -o ConnectTimeout=5 $VPS_USER@$VPS_IP "echo 'VPS accessible'" > /dev/null 2>&1; then
    echo "❌ Impossible de se connecter au VPS $VPS_IP"
    echo "Vérifiez votre connexion SSH et les clés"
    exit 1
fi

echo "✅ VPS accessible"

# Vérifier Node.js local
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

echo "✅ Node.js trouvé ($(node --version))"

# Étape 1 : Build local
echo ""
echo "🔨 Compilation du projet..."
npm run build:production

if [ ! -d "dist" ]; then
    echo "❌ Le dossier dist n'existe pas après le build"
    exit 1
fi

echo "✅ Build réussi"

# Étape 2 : Déploiement Frontend
echo ""
echo "📦 Déploiement du Frontend..."

# Essayer rsync d'abord, puis SCP en fallback
if command -v rsync &> /dev/null; then
    echo "Utilisation de rsync..."
    rsync -avz --delete dist/ $VPS_USER@$VPS_IP:$FRONTEND_PATH/
    DEPLOY_RESULT=$?
else
    echo "rsync non disponible, utilisation de SCP..."
    scp -r dist/* $VPS_USER@$VPS_IP:$FRONTEND_PATH/
    DEPLOY_RESULT=$?
fi

if [ $DEPLOY_RESULT -eq 0 ]; then
    echo "✅ Frontend déployé"
    # Corriger les permissions
    ssh $VPS_USER@$VPS_IP "chown -R www-data:www-data $FRONTEND_PATH && chmod -R 755 $FRONTEND_PATH"
    echo "✅ Permissions corrigées"
else
    echo "❌ Erreur lors du déploiement frontend"
    exit 1
fi

# Étape 3 : Vérification du Backend (optionnel)
echo ""
echo "🔍 Vérification du Backend..."
ssh $VPS_USER@$VPS_IP "pm2 status casskai-api" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Backend API active"
else
    echo "⚠️  Backend API non trouvée (normal si premier déploiement)"
fi

# Étape 4 : Tests de déploiement
echo ""
echo "🧪 Tests de déploiement..."

# Test de santé de l'API
if curl -f -s https://casskai.app/health > /dev/null; then
    echo "✅ API accessible : https://casskai.app/health"
else
    echo "⚠️  API non accessible (peut prendre quelques secondes)"
fi

# Test du frontend
if curl -f -s -I https://casskai.app > /dev/null; then
    echo "✅ Frontend accessible : https://casskai.app"
else
    echo "⚠️  Frontend non accessible"
fi

echo ""
echo "🎉 === Déploiement terminé ==="
echo ""
echo "📊 Résumé :"
echo "   • Frontend : https://casskai.app"
echo "   • API : https://casskai.app/api"
echo "   • Health Check : https://casskai.app/health"
echo ""
echo "📖 Voir DEPLOYMENT.md pour plus d'informations"

# Optionnel : Ouvrir dans le navigateur
if command -v xdg-open &> /dev/null; then
    echo "🌐 Ouverture dans le navigateur..."
    xdg-open https://casskai.app
elif command -v open &> /dev/null; then
    echo "🌐 Ouverture dans le navigateur..."
    open https://casskai.app
fi

echo "✨ Déploiement réussi !"