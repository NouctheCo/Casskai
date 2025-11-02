# Correction Automatique Ultra-Sûre des Warnings ESLint
# Ne touche QUE aux patterns garantis sans risque

$ErrorActionPreference = "Stop"
cd C:\Users\noutc\Casskai

Write-Host "🔍 Analyse des warnings..." -ForegroundColor Cyan

# 1. Sauvegarde
$branch = "auto-fix-safe-warnings-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
git checkout -b $branch

Write-Host "✅ Branche créée: $branch" -ForegroundColor Green
Write-Host ""

# 2. Compter warnings initiaux
Write-Host "📊 Warnings initiaux..." -ForegroundColor Yellow
$initial = (npm run lint 2>&1 | Select-String "(\d+) warnings" | ForEach-Object { $_.Matches.Groups[1].Value })
Write-Host "Initial: $initial warnings" -ForegroundColor Cyan
Write-Host ""

# 3. CORRECTION 1: Record<string, any> → Record<string, unknown>
Write-Host "🔧 Correction 1: Record<string, any> → Record<string, unknown>" -ForegroundColor Magenta

$files = Get-ChildItem -Path src -Include *.ts,*.tsx -Recurse -File
$count1 = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $modified = $content -replace 'Record<string,\s*any>', 'Record<string, unknown>'
    
    if ($modified -ne $content) {
        Set-Content -Path $file.FullName -Value $modified -Encoding UTF8 -NoNewline
        $count1++
        Write-Host "  ✓ $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "Modifié: $count1 fichiers" -ForegroundColor Yellow
Write-Host ""

# Vérification
Write-Host "🔍 Vérification TypeScript..." -ForegroundColor Yellow
$typecheck = npm run type-check 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERREUR TypeScript détectée! Rollback..." -ForegroundColor Red
    git checkout main
    git branch -D $branch
    exit 1
}
Write-Host "✅ TypeScript OK" -ForegroundColor Green
Write-Host ""

# Commit
if ($count1 -gt 0) {
    git add -A
    git commit -m "fix(types): replace Record<string, any> with Record<string, unknown>"
    Write-Host "✅ Commit créé" -ForegroundColor Green
}

Write-Host ""

# 4. Compter warnings finaux
Write-Host "📊 Résultat final..." -ForegroundColor Yellow
$final = (npm run lint 2>&1 | Select-String "(\d+) warnings" | ForEach-Object { $_.Matches.Groups[1].Value })
$reduction = [int]$initial - [int]$final

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  RÉSULTATS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Avant:      $initial warnings" -ForegroundColor Gray
Write-Host "  Après:      $final warnings" -ForegroundColor Gray
Write-Host "  Éliminés:   $reduction warnings" -ForegroundColor Green
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ TERMINÉ!" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines étapes:" -ForegroundColor Cyan
Write-Host "  1. Relancer ce script pour d'autres patterns" -ForegroundColor Gray
Write-Host "  2. OU corriger manuellement fichier par fichier" -ForegroundColor Gray
Write-Host "  3. Consulter fix-warnings-manual-guide.md" -ForegroundColor Gray
