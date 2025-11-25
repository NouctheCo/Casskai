# ============================================================================
# Script d'application de la correction RLS pour generated_reports
# ============================================================================

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  CORRECTION RLS - generated_reports" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que le fichier SQL existe
$sqlFile = "fix_generated_reports_rls.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ Erreur: Fichier $sqlFile introuvable" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Fichier SQL trouvé: $sqlFile" -ForegroundColor Green
Write-Host ""

# Demander confirmation
Write-Host "⚠️  Cette opération va:" -ForegroundColor Yellow
Write-Host "   1. Supprimer les anciennes policies RLS" -ForegroundColor Yellow
Write-Host "   2. Créer 4 nouvelles policies (SELECT, INSERT, UPDATE, DELETE)" -ForegroundColor Yellow
Write-Host "   3. Permettre aux utilisateurs d'insérer des rapports" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Voulez-vous continuer? (O/N)"
if ($confirmation -ne "O" -and $confirmation -ne "o") {
    Write-Host "❌ Opération annulée" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "📋 Instructions pour appliquer le SQL:" -ForegroundColor Cyan
Write-Host ""
Write-Host "OPTION 1 - Via Supabase Dashboard (Recommandé):" -ForegroundColor Green
Write-Host "   1. Ouvrir https://supabase.com/dashboard" -ForegroundColor White
Write-Host "   2. Sélectionner votre projet" -ForegroundColor White
Write-Host "   3. Aller dans 'SQL Editor'" -ForegroundColor White
Write-Host "   4. Cliquer sur 'New Query'" -ForegroundColor White
Write-Host "   5. Copier-coller le contenu de: $sqlFile" -ForegroundColor White
Write-Host "   6. Cliquer sur 'Run'" -ForegroundColor White
Write-Host ""

Write-Host "OPTION 2 - Via psql (Avancé):" -ForegroundColor Green
Write-Host "   psql -h your-project.supabase.co -U postgres -d postgres -f $sqlFile" -ForegroundColor White
Write-Host ""

Write-Host "OPTION 3 - Via Supabase CLI:" -ForegroundColor Green
Write-Host "   supabase db push --file $sqlFile" -ForegroundColor White
Write-Host ""

# Ouvrir le fichier SQL dans l'éditeur par défaut
Write-Host "📝 Ouverture du fichier SQL..." -ForegroundColor Cyan
Start-Process notepad $sqlFile

Write-Host ""
Write-Host "✅ Fichier SQL ouvert dans Notepad" -ForegroundColor Green
Write-Host "   Copiez le contenu et exécutez-le dans Supabase SQL Editor" -ForegroundColor Yellow
Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan

