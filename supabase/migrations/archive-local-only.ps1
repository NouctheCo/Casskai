# Script pour archiver les migrations locales-seulement
# Ces migrations ne sont pas dans l'historique Supabase distant

$lastRemoteMigration = "20260115090000"
$archiveDir = "_archived_local_only"
$migrationsDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "🔍 Archivage des migrations locales-seulement..." -ForegroundColor Cyan
Write-Host "   Derniere migration remote: $lastRemoteMigration" -ForegroundColor Gray
Write-Host ""

# Compter les fichiers à déplacer
$filesToMove = Get-ChildItem -Path $migrationsDir -File *.sql | 
    Where-Object { 
        $_.Name -match '^(\d+)' -and 
        $matches[1] -gt $lastRemoteMigration 
    } | 
    Sort-Object Name

$count = ($filesToMove | Measure-Object).Count

if ($count -eq 0) {
    Write-Host "✅ Aucune migration à archiver." -ForegroundColor Green
    exit 0
}

Write-Host "📦 $count migrations à archiver:" -ForegroundColor Yellow
$filesToMove | ForEach-Object { 
    Write-Host "   - $($_.Name)" -ForegroundColor Gray 
}

Write-Host ""
$response = Read-Host "Continuer? (Y/n)"

if ($response -eq 'n' -or $response -eq 'N') {
    Write-Host "❌ Annulé." -ForegroundColor Red
    exit 1
}

# Créer le dossier d'archive s'il n'existe pas
$archivePath = Join-Path $migrationsDir $archiveDir
if (!(Test-Path $archivePath)) {
    New-Item -ItemType Directory -Path $archivePath | Out-Null
}

# Déplacer les fichiers
$moved = 0
$failed = 0

foreach ($file in $filesToMove) {
    try {
        $destination = Join-Path $archivePath $file.Name
        Move-Item -Path $file.FullName -Destination $destination -Force
        Write-Host "✓ Archivé: $($file.Name)" -ForegroundColor Green
        $moved++
    }
    catch {
        Write-Host "✗ Échec: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Archivage terminé!" -ForegroundColor Green
Write-Host "   Déplacées: $moved" -ForegroundColor Green
Write-Host "   Échecs: $failed" -ForegroundColor $(if ($failed -gt 0) { 'Red' } else { 'Gray' })
Write-Host ""
Write-Host "📁 Fichiers archivés dans: $archiveDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "ℹ️  Pour les réappliquer plus tard:" -ForegroundColor Yellow
Write-Host "   1. Copiez-les depuis $archiveDir" -ForegroundColor Gray
Write-Host "   2. Renommez avec un timestamp futur" -ForegroundColor Gray
Write-Host "   3. Ou exécutez-les manuellement via SQL Editor" -ForegroundColor Gray
