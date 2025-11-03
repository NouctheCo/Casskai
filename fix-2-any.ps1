# Fix files with exactly 2 any types

$files = @(
  "src/services/einvoicing/adapters/ChannelProviders/PPFProvider.ts",
  "src/services/fiscal/FrenchTaxComplianceService.ts",
  "src/services/openBanking/reconciliation/ReconciliationEngine.ts",
  "src/contexts/LocaleContext.tsx",
  "src/contexts/DashboardWidgetContext.tsx",
  "src/contexts/EnterpriseContext.tsx",
  "src/hooks/useAccountingImport.ts",
  "src/hooks/useReports.ts",
  "src/types/dashboard-widget.types.ts",
  "src/components/accounting/ChartOfAccountsEnhanced.tsx",
  "src/components/budget/BudgetFormModern.tsx",
  "src/components/setup/MarketSelector.tsx",
  "src/components/ui/LazyChart.tsx",
  "src/components/ui/DataTable.tsx"
)

$totalFixed = 0

foreach ($file in $files) {
  if (Test-Path $file) {
    $content = Get-Content $file -Raw
    $originalContent = $content
    
    # Replace common patterns
    $content = $content -replace ':\s*any\s*\)', ': Record<string, unknown>)'
    $content = $content -replace ':\s*any\s*;', ': Record<string, unknown>;'
    $content = $content -replace ':\s*any\s*=', ': Record<string, unknown> ='
    $content = $content -replace ':\s*any\s*\|', ': Record<string, unknown> |'
    $content = $content -replace '\(payload:\s*any\)', '(payload: Record<string, unknown>)'
    $content = $content -replace '<any>', '<Record<string, unknown>>'
    $content = $content -replace 'details\?:\s*any', 'details?: Record<string, unknown>'
    $content = $content -replace 'data:\s*Record<string,\s*any>', 'data: Record<string, unknown>'
    
    if ($content -ne $originalContent) {
      Set-Content $file -Value $content -NoNewline
      $fixedCount = ([regex]::Matches($originalContent, ':\s*any')).Count - ([regex]::Matches($content, ':\s*any')).Count
      $totalFixed += $fixedCount
      Write-Host "Fixed $file - $fixedCount any types removed"
    }
  }
}

Write-Host "`nTotal any types fixed: $totalFixed"
