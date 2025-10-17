#!/usr/bin/env bash
# Script de déploiement ULTRA-RAPIDE pour CassKai (durci)
# Usage sécurisé:
#   VPS_HOST=your.server VPS_USER=deploy VPS_PATH=/var/www/app ./deploy-ultra-fast.sh [--skip-build] [--quick]

set -euo pipefail

# Lire la config depuis l'environnement (ne pas hardcoder)
VPS_HOST=${VPS_HOST:-}
VPS_USER=${VPS_USER:-}
VPS_PATH=${VPS_PATH:-}
RELEASES_DIR=${RELEASES_DIR:-releases}
CURRENT_LINK=${CURRENT_LINK:-current}
SKIP_BUILD=false
QUICK=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --skip-build) SKIP_BUILD=true ;;
        --quick) QUICK=true ;;
    esac
done

if [[ -z "${VPS_HOST}" || -z "${VPS_USER}" || -z "${VPS_PATH}" ]]; then
    echo "❌ [ERREUR] VPS_HOST, VPS_USER et VPS_PATH doivent être définis (variables d'environnement)." >&2
    echo "Exemple: VPS_HOST=your.server VPS_USER=deploy VPS_PATH=/var/www/app $0 --quick" >&2
    exit 1
fi

if [[ "${VPS_USER}" == "root" ]] && [[ "${ALLOW_ROOT:-}" != "true" ]]; then
    echo "❌ [ERREUR] Le déploiement en tant que root est déconseillé. Utilisez un utilisateur non-privilégié (ex: deploy)." >&2
    echo "   Pour forcer (non recommandé): ALLOW_ROOT=true $0 ..." >&2
    exit 1
fi

echo "🚀 [ULTRA-DEPLOY] Démarrage ultra-rapide..."

# 1. Build conditionnel intelligent
if [ "$SKIP_BUILD" != true ]; then
    if [ ! -d "dist" ] || [ "$QUICK" != true ]; then
    echo "🔨 [BUILD] Construction..."
    npm run build:production
    else
        echo "⏩ [SKIP] Build existant détecté"
    fi
fi

# 2. Déploiement ATOMIQUE (répertoire versionné + symlink)
echo "📦 [PIPELINE] Upload atomique → Activation..."

TS=$(date +%Y%m%d_%H%M%S)
RELEASE_NAME="release_${TS}"

# Eviter la double compression: utiliser tar non compressé et compression SSH seulement
tar -cf - -C dist . | ssh -o ConnectTimeout=10 -o Compression=yes "${VPS_USER}@${VPS_HOST}" bash -s << REMOTE
set -euo pipefail
VPS_PATH="${VPS_PATH}"
RELEASES_DIR="${RELEASES_DIR}"
CURRENT_LINK="${CURRENT_LINK}"
RELEASE_NAME="${RELEASE_NAME}"

mkdir -p "${VPS_PATH}/${RELEASES_DIR}/${RELEASE_NAME}"
tar -xf - -C "${VPS_PATH}/${RELEASES_DIR}/${RELEASE_NAME}"

# Alterner le lien symbolique de manière atomique
ln -sfn "${VPS_PATH}/${RELEASES_DIR}/${RELEASE_NAME}" "${VPS_PATH}/${CURRENT_LINK}"

# Recharger nginx si disponible (optionnel)
if command -v systemctl >/dev/null 2>&1; then
    systemctl reload nginx >/dev/null 2>&1 || true
fi

echo "✅ Déploiement atomique terminé (${RELEASE_NAME})"
REMOTE

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