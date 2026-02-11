# 🚀 QUICK START - Intégration Document Analysis + Tests (PowerShell)
# 
# Ce script lance les étapes pour démarrer l'implémentation IA
# Usage: powershell -ExecutionPolicy Bypass -File start-ia-integration.ps1
#

$ErrorActionPreference = "Stop"

# Colors (Windows PowerShell compatible)
function Write-Green { Write-Host $args -ForegroundColor Green }
function Write-Blue { Write-Host $args -ForegroundColor Cyan }
function Write-Yellow { Write-Host $args -ForegroundColor Yellow }

Write-Blue "🎯 CassKai IA Integration - Quick Start"
Write-Blue "═══════════════════════════════════════"
Write-Host ""

# ─────────────────────────────────────────────────────────
# 1. CHECK ENVIRONMENT
# ─────────────────────────────────────────────────────────
Write-Blue "[1/5] Vérification de l'environnement..."

try {
    $nodeVersion = node --version
    Write-Green "✓ Node.js $nodeVersion"
} catch {
    Write-Yellow "❌ Node.js non trouvé. Installez Node 18+"
    exit 1
}

try {
    $npmVersion = npm --version
    Write-Green "✓ npm $npmVersion"
} catch {
    Write-Yellow "❌ npm non trouvé"
    exit 1
}

Write-Host ""

# ─────────────────────────────────────────────────────────
# 2. INSTALL DEPENDENCIES
# ─────────────────────────────────────────────────────────
Write-Blue "[2/5] Installation des dépendances..."

if (-not (Test-Path "node_modules")) {
    Write-Host "📦 npm install en cours..."
    npm install --legacy-peer-deps
} else {
    Write-Green "✓ node_modules existe déjà"
}

Write-Host ""

# ─────────────────────────────────────────────────────────
# 3. TYPE CHECK
# ─────────────────────────────────────────────────────────
Write-Blue "[3/5] Vérification des types TypeScript..."
npm run type-check
Write-Host ""

# ─────────────────────────────────────────────────────────
# 4. RUN E2E TESTS
# ─────────────────────────────────────────────────────────
Write-Blue "[4/5] Exécution des tests E2E IA..."
Write-Host ""
Write-Yellow "Option 1: Headless (CI mode)"
Write-Host "  npm run test:e2e -- e2e/ai-assistant.spec.ts"
Write-Host ""
Write-Yellow "Option 2: UI mode (interactive)"
Write-Host "  npm run test:e2e:ui -- e2e/ai-assistant.spec.ts"
Write-Host ""
Write-Yellow "Option 3: Headed (voir le browser)"
Write-Host "  npm run test:e2e:headed -- e2e/ai-assistant.spec.ts"
Write-Host ""

# Ask which mode to run
$testMode = Read-Host "Quelle option voulez-vous? (1/2/3) [1]"
if ([string]::IsNullOrWhiteSpace($testMode)) { $testMode = "1" }

switch ($testMode) {
    "1" {
        Write-Host "🧪 Lancement des tests en mode headless..."
        npm run test:e2e -- e2e/ai-assistant.spec.ts
    }
    "2" {
        Write-Host "🧪 Lancement des tests en UI mode..."
        npm run test:e2e:ui -- e2e/ai-assistant.spec.ts
    }
    "3" {
        Write-Host "🧪 Lancement des tests en headed mode..."
        npm run test:e2e:headed -- e2e/ai-assistant.spec.ts
    }
    default {
        Write-Yellow "❌ Option invalide"
        exit 1
    }
}

Write-Host ""

# ─────────────────────────────────────────────────────────
# 5. NEXT STEPS
# ─────────────────────────────────────────────────────────
Write-Green "═══════════════════════════════════════"
Write-Green "✅ Tests E2E exécutés!"
Write-Host ""
Write-Blue "📋 Prochaines étapes:"
Write-Host ""
Write-Host "1. 📖 Lire l'audit:"
Write-Host "   type AUDIT_SUMMARY_EXECUTIVE.md"
Write-Host ""
Write-Host "2. 🔧 Intégrer Document Analysis:"
Write-Host "   - Ouvrir: src/components/accounting/JournalEntryForm.tsx"
Write-Host "   - Copier le code du: IMPLEMENTATION_PLAN_IA_2026.md"
Write-Host "   - Tester avec: npm run dev"
Write-Host ""
Write-Host "3. 🚀 Déployer:"
Write-Host "   npm run build"
Write-Host "   # Puis déployer selon votre pipeline"
Write-Host ""
Write-Host "4. 📊 Monitorer:"
Write-Host "   - Coûts OpenAI: Dashboard Supabase"
Write-Host "   - User adoption: Analytics"
Write-Host "   - Errors: Sentry/monitoring"
Write-Host ""
Write-Yellow "💡 Besoin d'aide?"
Write-Host "   - Lire: AUDIT_INDEX.md (navigation)"
Write-Host "   - Questions: AUDIT_SUMMARY_EXECUTIVE.md (FAQ)"
Write-Host ""
Write-Green "Happy shipping! 🎉"
Write-Host ""

