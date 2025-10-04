#!/bin/bash
# Script de déploiement ULTRA-RAPIDE pour CassKai
# Usage: ./deploy-ultra-fast.sh [--skip-build] [--quick]

VPS_HOST="89.116.111.88"
VPS_USER="root"
VPS_PATH="/var/www/casskai.app"
SKIP_BUILD=false
QUICK=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --skip-build) SKIP_BUILD=true ;;
        --quick) QUICK=true ;;
    esac
done

echo "🚀 [ULTRA-DEPLOY] Démarrage ultra-rapide..."

# 1. Build conditionnel intelligent
if [ "$SKIP_BUILD" != true ]; then
    if [ ! -d "dist" ] || [ "$QUICK" != true ]; then
        echo "🔨 [BUILD] Construction..."
        npm run build:production > /dev/null
    else
        echo "⏩ [SKIP] Build existant détecté"
    fi
fi

# 2. Compression + Upload + Déploiement en une seule commande pipeline
echo "📦 [PIPELINE] Compression → Upload → Déploiement..."
tar -czf - -C dist . | ssh -o ConnectTimeout=5 -o Compression=yes "$VPS_USER@$VPS_HOST" "
cd '$VPS_PATH' &&
tar -xzf - &&
chown -R www-data:www-data . &&
systemctl reload nginx > /dev/null 2>&1 &&
echo '✅ Déploiement pipeline terminé'
"

echo "🎉 [SUCCESS] Ultra-déploiement terminé!"
echo "🌐 Site: https://casskai.app"

# Optionnel: Test rapide
if command -v curl &> /dev/null; then
    echo "🧪 [TEST] Vérification rapide..."
    if curl -s -o /dev/null -w "%{http_code}" https://casskai.app | grep -q "200"; then
        echo "✅ Site accessible"
    else
        echo "⚠️ Problème détecté"
    fi
fi