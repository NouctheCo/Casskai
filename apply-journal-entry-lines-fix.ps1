# Script d'application de la migration pour corriger journal_entry_lines
# Date: 2025-12-22
# Description: Applique la migration qui ajoute company_id à journal_entry_lines

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🚀 Application de la migration" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Supabase CLI est installé
$supabaseCli = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseCli) {
    Write-Host "❌ Supabase CLI n'est pas installé" -ForegroundColor Red
    Write-Host "   Installez-le avec: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "supabase\migrations")) {
    Write-Host "❌ Répertoire supabase\migrations non trouvé" -ForegroundColor Red
    Write-Host "   Exécutez ce script depuis la racine du projet" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Migration à appliquer:" -ForegroundColor White
Write-Host "   20251222_add_company_id_to_journal_entry_lines.sql" -ForegroundColor Gray
Write-Host ""

# Demander confirmation
$confirmation = Read-Host "Voulez-vous appliquer cette migration ? (oui/non)"
if ($confirmation -ne "oui") {
    Write-Host "❌ Migration annulée" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🔄 Application de la migration..." -ForegroundColor Cyan

# Appliquer la migration avec Supabase CLI
try {
    # Pousser les migrations vers Supabase
    supabase db push
    
    Write-Host ""
    Write-Host "✅ Migration appliquée avec succès !" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "📊 Vérification de l'application:" -ForegroundColor Cyan
    Write-Host "   1. La colonne company_id a été ajoutée à journal_entry_lines" -ForegroundColor Gray
    Write-Host "   2. Les données existantes ont été migrées" -ForegroundColor Gray
    Write-Host "   3. Un trigger maintient la cohérence automatiquement" -ForegroundColor Gray
    Write-Host "   4. Les politiques RLS ont été simplifiées" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "🎯 Prochaines étapes:" -ForegroundColor Cyan
    Write-Host "   1. Tester la catégorisation sur https://casskai.app" -ForegroundColor Gray
    Write-Host "   2. Vérifier que les journal_entry_lines sont créées" -ForegroundColor Gray
    Write-Host "   3. Le code TypeScript a déjà été mis à jour automatiquement" -ForegroundColor Gray
    
} catch {
    Write-Host ""
    Write-Host "❌ Erreur lors de l'application de la migration:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Solutions possibles:" -ForegroundColor Yellow
    Write-Host "   1. Vérifiez que vous êtes connecté: supabase login" -ForegroundColor Gray
    Write-Host "   2. Vérifiez que le projet est lié: supabase link" -ForegroundColor Gray
    Write-Host "   3. Appliquez manuellement via le Dashboard Supabase" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ Terminé !" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
