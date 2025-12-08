#!/bin/bash

# ============================================================================
# Script d'exécution complète des tests E2E
# ============================================================================

set -e

echo "🧪 Démarrage des tests automatisés CassKai..."
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
TEST_ENV=${1:-production}  # production ou local

if [ "$TEST_ENV" = "local" ]; then
  export PLAYWRIGHT_TEST_BASE_URL="http://localhost:5173"
  echo -e "${BLUE}Mode: Tests locaux (localhost:5173)${NC}"
else
  export PLAYWRIGHT_TEST_BASE_URL="https://casskai.app"
  echo -e "${BLUE}Mode: Tests production (casskai.app)${NC}"
fi

# Charger les variables d'environnement
if [ -f .env.test.local ]; then
  source .env.test.local
  echo -e "${GREEN}✓ Variables d'environnement chargées${NC}"
else
  echo -e "${YELLOW}⚠ Fichier .env.test.local non trouvé${NC}"
  echo "Utilisation des valeurs par défaut..."
fi

echo ""
echo "============================================"
echo "  TESTS SYSTÈMES D'ARCHIVAGE"
echo "============================================"
echo ""

# Vérifier que Playwright est installé
if ! command -v npx &> /dev/null; then
  echo -e "${RED}✗ npx non trouvé. Installer Node.js/npm${NC}"
  exit 1
fi

# Installer les navigateurs si nécessaire
echo -e "${BLUE}Vérification des navigateurs Playwright...${NC}"
npx playwright install --with-deps chromium

echo ""
echo -e "${BLUE}Lancement des tests...${NC}"
echo ""

# Exécuter les tests
npx playwright test e2e/archive-systems.spec.ts \
  --reporter=html \
  --reporter=list \
  --output=test-results

TEST_EXIT_CODE=$?

echo ""
echo "============================================"

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✓ TOUS LES TESTS SONT PASSÉS !${NC}"
  echo ""
  echo "📊 Rapport HTML généré: playwright-report/index.html"
  echo ""
  echo "Pour voir le rapport:"
  echo "  npx playwright show-report"
else
  echo -e "${RED}✗ CERTAINS TESTS ONT ÉCHOUÉ${NC}"
  echo ""
  echo "📊 Voir les détails dans: playwright-report/index.html"
  echo ""
  echo "Pour déboguer:"
  echo "  npx playwright test --debug"
  echo "  npx playwright show-report"
fi

echo "============================================"
echo ""

exit $TEST_EXIT_CODE
