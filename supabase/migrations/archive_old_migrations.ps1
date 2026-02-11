# Archiver toutes les migrations antérieures à la dernière remote
# Dernière migration remote : 20260115090000

$lastRemote = 20260115090000
$archiveDir = "_archived_local_only"
$migrationsDir = $PSScriptRoot

Write-Host "🗂️  Archivage des migrations antérieures à $lastRemote..." -ForegroundColor Cyan
Write-Host ""

# Créer le dossier d'archive
$archivePath = Join-Path $migrationsDir $archiveDir
if (!(Test-Path $archivePath)) {
    New-Item -ItemType Directory -Path $archivePath | Out-Null
}

# Trouver les fichiers à archiver
$filesToArchive = Get-ChildItem -Path $migrationsDir -File *.sql | Where-Object {
    if ($_.Name -match '^(\d+)') {
        try {
            [int64]$timestamp = $matches[1]
            return $timestamp -lt $lastRemote
        }
        catch {
            return $false
        }
    }
    return $false
}

$count = ($filesToArchive | Measure-Object).Count

if ($count -eq 0) {
    Write-Host "✅ Aucune migration à archiver." -ForegroundColor Green
    exit 0
}

Write-Host "📦 $count migrations à archiver" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  Ces migrations seront déplacées vers: $archiveDir" -ForegroundColor Yellow
Write-Host ""

$response = Read-Host "Continuer? (Y/n)"
if ($response -eq 'n' -or $response -eq 'N') {
    Write-Host "❌ Annulé." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Archiver les fichiers
$moved = 0
$failed = 0

foreach ($file in $filesToArchive) {
    try {
        $destination = Join-Path $archivePath $file.Name
        Move-Item -Path $file.FullName -Destination $destination -Force
        Write-Host "✓ $($file.Name)" -ForegroundColor Green
        $moved++
    }
    catch {
        Write-Host "✗ $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
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
Write-Host "📁 Dossier: supabase/migrations/$archiveDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "🧪 Test recommandé:" -ForegroundColor Yellow
Write-Host "   > cd c:\Users\noutc\Casskai" -ForegroundColor Gray
Write-Host "   > supabase db push --linked --dry-run" -ForegroundColor Gray
