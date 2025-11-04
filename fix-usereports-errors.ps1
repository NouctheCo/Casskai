# Fix useReports.ts - String to Error conversions
Write-Host "Correction des conversions string → Error dans useReports.ts`n" -ForegroundColor Cyan

$file = "src\hooks\useReports.ts"
$content = Get-Content $file -Raw

# Pattern: setError(... as Error) avec un string
# Remplacer par new Error(...)
$content = $content -replace "setError\(([^)]+)\s+as\s+Error\)", 'setError(new Error($1))'

# Sauvegarder
Set-Content $file -Value $content -NoNewline

Write-Host "[OK] useReports.ts modifié`n" -ForegroundColor Green

# Vérification
Write-Host "Vérification..." -ForegroundColor Yellow
$after = (npm run type-check 2>&1 | Select-String "error TS" | Measure-Object).Count
$useReportsErrors = (npm run type-check 2>&1 | Select-String "useReports.ts.*error TS" | Measure-Object).Count

Write-Host "Erreurs totales: 284 → $after" -ForegroundColor $(if ($after -lt 284) { "Green" } else { "Red" })
Write-Host "Erreurs useReports.ts: 9 → $useReportsErrors`n" -ForegroundColor $(if ($useReportsErrors -eq 0) { "Green" } else { "Yellow" })

if ($useReportsErrors -eq 0) {
    Write-Host "🎉 useReports.ts est CLEAN! 0 erreur!" -ForegroundColor Green
} elseif ($after -lt 284) {
    Write-Host "✅ Progrès détecté!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Pas de réduction" -ForegroundColor Yellow
}
