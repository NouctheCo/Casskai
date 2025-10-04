# Script PowerShell pour appliquer les migrations des paramètres
# ATTENTION : Ce script applique des migrations sur la base de données PRODUCTION

param(
    [switch]$DryRun = $false,
    [switch]$Force = $false
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MIGRATION DES PARAMÈTRES - SUPABASE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Supabase CLI est installé
$supabaseVersion = supabase --version 2>$null
if (-not $supabaseVersion) {
    Write-Host "❌ Supabase CLI n'est pas installé" -ForegroundColor Red
    Write-Host "   Installez-le avec: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Supabase CLI détecté: $supabaseVersion" -ForegroundColor Green
Write-Host ""

# Liste des migrations à appliquer
$migrations = @(
    "20251001000000_fix_companies_missing_columns.sql",
    "20251001000001_create_user_profiles.sql",
    "20251001000002_create_user_profiles_rls.sql",
    "20251001000003_create_avatars_storage.sql",
    "20251001000004_verify_subscription_rpc.sql",
    "20251001000005_create_notifications_system.sql"
)

Write-Host "📋 Migrations à appliquer:" -ForegroundColor Yellow
foreach ($migration in $migrations) {
    Write-Host "   - $migration" -ForegroundColor White
}
Write-Host ""

# Avertissement PRODUCTION
if (-not $Force) {
    Write-Host "⚠️  ATTENTION : BASE DE DONNÉES EN PRODUCTION ⚠️" -ForegroundColor Red -BackgroundColor Yellow
    Write-Host ""
    Write-Host "Ces migrations vont être appliquées sur votre base de données de PRODUCTION." -ForegroundColor Red
    Write-Host "Assurez-vous d'avoir:" -ForegroundColor Yellow
    Write-Host "  1. ✓ Fait un backup récent" -ForegroundColor White
    Write-Host "  2. ✓ Testé les migrations en local" -ForegroundColor White
    Write-Host "  3. ✓ Lu le fichier AUDIT_SETTINGS_ISSUES.md" -ForegroundColor White
    Write-Host ""

    $confirmation = Read-Host "Voulez-vous continuer? (tapez 'OUI' en majuscules pour confirmer)"

    if ($confirmation -ne "OUI") {
        Write-Host "❌ Opération annulée" -ForegroundColor Red
        exit 0
    }
}

Write-Host ""
Write-Host "🔄 Début de l'application des migrations..." -ForegroundColor Cyan
Write-Host ""

# Vérifier le statut Supabase
Write-Host "🔍 Vérification de la connexion Supabase..." -ForegroundColor Yellow
$statusOutput = supabase status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Impossible de se connecter à Supabase" -ForegroundColor Red
    Write-Host "   Vérifiez votre configuration et votre connexion internet" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Connexion Supabase OK" -ForegroundColor Green
Write-Host ""

# Mode DryRun
if ($DryRun) {
    Write-Host "🔍 MODE DRY-RUN ACTIVÉ - Aucune modification ne sera appliquée" -ForegroundColor Magenta
    Write-Host ""

    $dryRunOutput = supabase db push --dry-run 2>&1
    Write-Host $dryRunOutput

    Write-Host ""
    Write-Host "✅ Dry-run terminé - Aucune modification appliquée" -ForegroundColor Green
    exit 0
}

# Appliquer les migrations
Write-Host "📤 Application des migrations sur Supabase..." -ForegroundColor Yellow

try {
    # Appliquer toutes les migrations d'un coup
    $pushOutput = supabase db push 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Migrations appliquées avec succès!" -ForegroundColor Green
        Write-Host ""

        # Afficher un résumé
        Write-Host "📊 Résumé des changements:" -ForegroundColor Cyan
        Write-Host "   ✓ Table 'companies' - Colonnes ajoutées (accounting_method, vat_number, description)" -ForegroundColor White
        Write-Host "   ✓ Table 'user_profiles' - Créée avec RLS" -ForegroundColor White
        Write-Host "   ✓ Bucket 'avatars' - Créé avec politiques de sécurité" -ForegroundColor White
        Write-Host "   ✓ Fonctions RPC subscription - Créées" -ForegroundColor White
        Write-Host "   ✓ Système de notifications - Créé" -ForegroundColor White
        Write-Host ""

        Write-Host "🎯 Prochaines étapes:" -ForegroundColor Yellow
        Write-Host "   1. Tester l'enregistrement du profil utilisateur" -ForegroundColor White
        Write-Host "   2. Tester l'upload d'avatar" -ForegroundColor White
        Write-Host "   3. Tester la gestion des abonnements" -ForegroundColor White
        Write-Host "   4. Tester les notifications" -ForegroundColor White
        Write-Host ""

        Write-Host "📖 Consultez AUDIT_SETTINGS_ISSUES.md pour plus de détails" -ForegroundColor Cyan
    }
    else {
        Write-Host ""
        Write-Host "❌ Erreur lors de l'application des migrations" -ForegroundColor Red
        Write-Host $pushOutput
        Write-Host ""
        Write-Host "💡 Conseils de dépannage:" -ForegroundColor Yellow
        Write-Host "   1. Vérifiez les logs d'erreur ci-dessus" -ForegroundColor White
        Write-Host "   2. Assurez-vous que les tables n'existent pas déjà" -ForegroundColor White
        Write-Host "   3. Vérifiez votre connexion à Supabase" -ForegroundColor White
        exit 1
    }
}
catch {
    Write-Host ""
    Write-Host "❌ Exception lors de l'application des migrations" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MIGRATION TERMINÉE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
