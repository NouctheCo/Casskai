# Script PowerShell pour adapter les 5 rapports restants
# generateAgedPayables, generateBudgetVariance, generateKPIDashboard, generateTaxSummary, generateInventoryValuation

$filePath = "src/services/reportGenerationService.ts"
$content = Get-Content $filePath -Raw

# Liste des méthodes à adapter avec leurs lignes approximatives
$reports = @(
    @{Name="generateAgedPayables"; Line=1051},
    @{Name="generateBudgetVariance"; Line=1287},
    @{Name="generateKPIDashboard"; Line=1518},
    @{Name="generateTaxSummary"; Line=1716},
    @{Name="generateInventoryValuation"; Line=1906}
)

Write-Host "📝 Adaptation des 5 rapports restants..." -ForegroundColor Cyan

foreach ($report in $reports) {
    Write-Host "   ⚙️  Adaptation de $($report.Name)..." -ForegroundColor Yellow
}

Write-Host "✅ Script prêt - Utiliser Edit tool pour modifications manuelles" -ForegroundColor Green
