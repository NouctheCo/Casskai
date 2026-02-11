#!/bin/bash
# 🚀 QUICK START - Intégration Document Analysis + Tests
# 
# Ce script lance les étapes pour démarrer l'implémentation IA
# Usage: bash start-ia-integration.sh
#

set -e

echo "🎯 CassKai IA Integration - Quick Start"
echo "═══════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ─────────────────────────────────────────────────────────
# 1. CHECK ENVIRONMENT
# ─────────────────────────────────────────────────────────
echo -e "${BLUE}[1/5] Vérification de l'environnement...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}❌ Node.js non trouvé. Installez Node 18+${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}❌ npm non trouvé${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js ${NC}$(node --version)"
echo -e "${GREEN}✓ npm ${NC}$(npm --version)"
echo ""

# ─────────────────────────────────────────────────────────
# 2. INSTALL DEPENDENCIES
# ─────────────────────────────────────────────────────────
echo -e "${BLUE}[2/5] Installation des dépendances...${NC}"

if [ ! -d "node_modules" ]; then
    echo "📦 npm install en cours..."
    npm install --legacy-peer-deps
else
    echo -e "${GREEN}✓ node_modules existe déjà${NC}"
fi
echo ""

# ─────────────────────────────────────────────────────────
# 3. TYPE CHECK
# ─────────────────────────────────────────────────────────
echo -e "${BLUE}[3/5] Vérification des types TypeScript...${NC}"
npm run type-check
echo ""

# ─────────────────────────────────────────────────────────
# 4. RUN E2E TESTS
# ─────────────────────────────────────────────────────────
echo -e "${BLUE}[4/5] Exécution des tests E2E IA...${NC}"
echo ""
echo -e "${YELLOW}Option 1: Headless (CI mode)${NC}"
echo "  npm run test:e2e -- e2e/ai-assistant.spec.ts"
echo ""
echo -e "${YELLOW}Option 2: UI mode (interactive)${NC}"
echo "  npm run test:e2e:ui -- e2e/ai-assistant.spec.ts"
echo ""
echo -e "${YELLOW}Option 3: Headed (voir le browser)${NC}"
echo "  npm run test:e2e:headed -- e2e/ai-assistant.spec.ts"
echo ""

# Ask which mode to run
read -p "Quelle option voulez-vous? (1/2/3) [1]: " test_mode
test_mode=${test_mode:-1}

case $test_mode in
    1)
        echo "🧪 Lancement des tests en mode headless..."
        npm run test:e2e -- e2e/ai-assistant.spec.ts
        ;;
    2)
        echo "🧪 Lancement des tests en UI mode..."
        npm run test:e2e:ui -- e2e/ai-assistant.spec.ts
        ;;
    3)
        echo "🧪 Lancement des tests en headed mode..."
        npm run test:e2e:headed -- e2e/ai-assistant.spec.ts
        ;;
    *)
        echo "❌ Option invalide"
        exit 1
        ;;
esac

echo ""

# ─────────────────────────────────────────────────────────
# 5. NEXT STEPS
# ─────────────────────────────────────────────────────────
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Tests E2E exécutés!${NC}"
echo ""
echo -e "${BLUE}📋 Prochaines étapes:${NC}"
echo ""
echo "1. 📖 Lire l'audit:"
echo "   cat AUDIT_SUMMARY_EXECUTIVE.md"
echo ""
echo "2. 🔧 Intégrer Document Analysis:"
echo "   - Ouvrir: src/components/accounting/JournalEntryForm.tsx"
echo "   - Copier le code du: IMPLEMENTATION_PLAN_IA_2026.md"
echo "   - Tester avec: npm run dev"
echo ""
echo "3. 🚀 Déployer:"
echo "   npm run build"
echo "   # Puis déployer selon votre pipeline"
echo ""
echo "4. 📊 Monitorer:"
echo "   - Coûts OpenAI: Dashboard Supabase"
echo "   - User adoption: Analytics"
echo "   - Errors: Sentry/monitoring"
echo ""
echo -e "${YELLOW}💡 Besoin d'aide?${NC}"
echo "   - Lire: AUDIT_INDEX.md (navigation)"
echo "   - Questions: AUDIT_SUMMARY_EXECUTIVE.md (FAQ)"
echo ""
echo -e "${GREEN}Happy shipping! 🎉${NC}"
echo ""

