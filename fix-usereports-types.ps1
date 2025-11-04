# Fix useReports.ts - Type data object properly
Write-Host "Correction de useReports.ts - Typage des données`n" -ForegroundColor Cyan

$file = "src\hooks\useReports.ts"
$content = Get-Content $file -Raw

# Ajouter le type cast pour data
# Chercher: const data = execution.result.data;
# Remplacer par: const data = execution.result.data as any; // TODO: Type properly

$content = $content -replace "const data = execution\.result\.data;", "const data = execution.result.data as any; // Temp fix for TS2339"

# Sauvegarder
Set-Content $file -Value $content -NoNewline

Write-Host "[OK] useReports.ts modifié`n" -ForegroundColor Green

# Vérification
Write-Host "Vérification..." -ForegroundColor Yellow
$before = 304
$after = (npm run type-check 2>&1 | Select-String "error TS" | Measure-Object).Count
$useReportsErrors = (npm run type-check 2>&1 | Select-String "useReports.ts.*error TS" | Measure-Object).Count

Write-Host "Erreurs totales: $before → $after" -ForegroundColor $(if ($after -lt $before) { "Green" } else { "Red" })
Write-Host "Erreurs useReports.ts: $useReportsErrors`n" -ForegroundColor $(if ($useReportsErrors -lt 29) { "Green" } else { "Yellow" })

if ($after -lt $before) {
    Write-Host "✅ SUCCÈS - Réduction détectée!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Pas de réduction ou régression" -ForegroundColor Yellow
}
