# Script avancé pour archiver TOUTES les migrations locales-seulement
# Se base sur la sortie réelle de 'supabase migration list --linked'

$archiveDir = "_archived_local_only"
$migrationsDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "🔍 Analyse de l'historique Supabase..." -ForegroundColor Cyan

# Exécuter supabase migration list et capturer la sortie
$output = & supabase migration list --linked 2>&1 | Out-String

# Parser les lignes pour trouver les migrations sans remote
$linesToArchive = @()
$output -split "`n" | ForEach-Object {
    if ($_ -match '^\s+(\d{8}[\d_]*)\s+\|\s+\|\s+') {
        # Ligne avec Local mais sans Remote (colonne Remote vide)
        $timestamp = $matches[1]
        $linesToArchive += $timestamp
    }
}

if ($linesToArchive.Count -eq 0) {
    Write-Host "✅ Aucune migration locale-seulement détectée." -ForegroundColor Green
    exit 0
}

Write-Host "📊 $($linesToArchive.Count) timestamps détectés sans remote" -ForegroundColor Yellow
Write-Host ""

# Trouver les fichiers correspondants
$filesToMove = @()
foreach ($timestamp in $linesToArchive) {
    $pattern = "$timestamp*.sql"
    $matches = Get-ChildItem -Path $migrationsDir -File -Filter $pattern
    $filesToMove += $matches
}

$count = ($filesToMove | Measure-Object).Count

if ($count -eq 0) {
    Write-Host "✅ Aucun fichier de migration à archiver." -ForegroundColor Green
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
if ($failed -gt 0) {
    Write-Host "   Échecs: $failed" -ForegroundColor Red
}
Write-Host ""
Write-Host "📁 Fichiers archivés dans: $archiveDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "ℹ️  Vérification recommandée:" -ForegroundColor Yellow
Write-Host "   > supabase db push --linked --dry-run" -ForegroundColor Gray
