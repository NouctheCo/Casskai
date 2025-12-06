# Script de déploiement des Edge Functions Supabase pour Stripe
# Usage: .\deploy-edge-functions.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Déploiement Edge Functions Stripe" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Supabase CLI est installé
Write-Host "[CHECK] Vérification de Supabase CLI..." -ForegroundColor Yellow
$supabaseCli = Get-Command npx -ErrorAction SilentlyContinue
if (-not $supabaseCli) {
    Write-Host "[ERROR] npx n'est pas installé" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Supabase CLI disponible" -ForegroundColor Green
Write-Host ""

# Liste des Edge Functions à déployer
$functions = @(
    "create-checkout-session",
    "stripe-webhook",
    "create-portal-session"
)

# Compteur de succès
$successCount = 0
$failCount = 0

foreach ($func in $functions) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "[DEPLOY] Déploiement de '$func'..." -ForegroundColor Yellow

    # Vérifier que le dossier existe
    $funcPath = "supabase\functions\$func"
    if (-not (Test-Path $funcPath)) {
        Write-Host "[ERROR] Le dossier '$funcPath' n'existe pas" -ForegroundColor Red
        $failCount++
        continue
    }

    # Déployer la fonction
    try {
        npx supabase functions deploy $func
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[SUCCESS] '$func' déployée avec succès" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "[ERROR] Échec du déploiement de '$func'" -ForegroundColor Red
            $failCount++
        }
    } catch {
        Write-Host "[ERROR] Exception lors du déploiement de '$func': $_" -ForegroundColor Red
        $failCount++
    }

    Write-Host ""
}

# Résumé
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RÉSUMÉ DU DÉPLOIEMENT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Succès: $successCount/$($functions.Count)" -ForegroundColor Green
Write-Host "❌ Échecs: $failCount/$($functions.Count)" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($successCount -eq $functions.Count) {
    Write-Host "[SUCCESS] Toutes les Edge Functions ont été déployées avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines étapes:" -ForegroundColor Yellow
    Write-Host "1. Configurer les secrets Supabase (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)" -ForegroundColor White
    Write-Host "2. Configurer le webhook dans Stripe Dashboard" -ForegroundColor White
    Write-Host "3. Appliquer la migration SQL pour créer la table subscriptions" -ForegroundColor White
    Write-Host "4. Tester le flux de paiement" -ForegroundColor White
    Write-Host ""
    Write-Host "Voir STRIPE_SETUP.md pour plus de détails" -ForegroundColor Cyan
} else {
    Write-Host "[WARNING] Certaines fonctions n'ont pas pu être déployées" -ForegroundColor Yellow
    Write-Host "Vérifiez les erreurs ci-dessus et réessayez" -ForegroundColor Yellow
    exit 1
}
