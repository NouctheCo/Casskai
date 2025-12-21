# ============================================================================
# Script d'exécution complète des tests E2E (PowerShell - Windows)
# ============================================================================

param(
    [string]$TestEnv = "production"  # production ou local
)

Write-Host "🧪 Démarrage des tests automatisés CassKai...`n" -ForegroundColor Cyan

# Configuration
if ($TestEnv -eq "local") {
    $env:PLAYWRIGHT_TEST_BASE_URL = "http://localhost:5173"
    Write-Host "Mode: Tests locaux (localhost:5173)" -ForegroundColor Blue
} else {
    $env:PLAYWRIGHT_TEST_BASE_URL = "https://casskai.app"
    Write-Host "Mode: Tests production (casskai.app)" -ForegroundColor Blue
}

# Charger les variables d'environnement
if (Test-Path .env.test.local) {
    Get-Content .env.test.local | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
    Write-Host "✓ Variables d'environnement chargées" -ForegroundColor Green
} else {
    Write-Host "⚠ Fichier .env.test.local non trouvé" -ForegroundColor Yellow
    Write-Host "Utilisation des valeurs par défaut..."
}

Write-Host "`n============================================"
Write-Host "  TESTS SYSTÈMES D'ARCHIVAGE"
Write-Host "============================================`n"

# Vérifier que Playwright est installé
Write-Host "Vérification des navigateurs Playwright..." -ForegroundColor Blue
npx playwright install --with-deps chromium

Write-Host "`nLancement des tests...`n" -ForegroundColor Blue

# Exécuter les tests
npx playwright test e2e/archive-systems.spec.ts `
  --reporter=html `
  --reporter=list `
  --output=test-results

$TestExitCode = $LASTEXITCODE

Write-Host "`n============================================"

if ($TestExitCode -eq 0) {
    Write-Host "✓ TOUS LES TESTS SONT PASSÉS !" -ForegroundColor Green
    Write-Host "`n📊 Rapport HTML généré: playwright-report/index.html"
    Write-Host "`nPour voir le rapport:"
    Write-Host "  npx playwright show-report"
} else {
    Write-Host "✗ CERTAINS TESTS ONT ÉCHOUÉ" -ForegroundColor Red
    Write-Host "`n📊 Voir les détails dans: playwright-report/index.html"
    Write-Host "`nPour déboguer:"
    Write-Host "  npx playwright test --debug"
    Write-Host "  npx playwright show-report"
}

Write-Host "============================================`n"

exit $TestExitCode
