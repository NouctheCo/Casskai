$files = @(
  "src\components\account\AccountDeletionWizard.tsx",
  "src\components\crm\ClientsManagement.tsx",
  "src\components\crm\OpportunitiesKanban.tsx",
  "src\components\forecasts\ForecastChartView.tsx",
  "src\components\guards\AuthGuard.tsx",
  "src\components\setup\MarketSelector.tsx",
  "src\contexts\LocaleContext.tsx",
  "src\hooks\useReports.ts",
  "src\pages\onboarding\PreferencesStep.tsx",
  "src\pages\BillingPage.tsx",
  "src\services\accountingService.ts",
  "src\services\automationService.ts",
  "src\services\bankingService.ts",
  "src\services\bankReconciliationService.ts",
  "src\services\crmService.ts",
  "src\services\dashboardService.tsx",
  "src\services\dataMigrationService.ts",
  "src\services\enterpriseService.ts",
  "src\services\fecImportService.ts",
  "src\services\migrationService.ts",
  "src\services\tenantService.ts"
)

$totalFixed = 0

foreach ($file in $files) {
  if (Test-Path $file) {
    $content = Get-Content $file -Raw
    $originalContent = $content
    
    # Multiple replacement patterns
    $content = $content -replace '\bdata:\s*Record<string,\s*any>', 'data: Record<string, unknown>'
    $content = $content -replace '\bresults:\s*any\[\]', 'results: Array<Record<string, unknown>>'
    $content = $content -replace '\bitems:\s*any\[\]', 'items: Array<Record<string, unknown>>'
    $content = $content -replace '\bentries:\s*any\[\]', 'entries: Array<Record<string, unknown>>'
    $content = $content -replace '\bpayload:\s*any\)', 'payload: Record<string, unknown>)'
    $content = $content -replace '\bresponse:\s*any\)', 'response: unknown)'
    $content = $content -replace '\bvalue:\s*any\)', 'value: unknown)'
    $content = $content -replace '\bvalue:\s*any,', 'value: unknown,'
    $content = $content -replace '\berror:\s*any\)', 'error: unknown)'
    $content = $content -replace '\bparams:\s*any\)', 'params: Record<string, unknown>)'
    $content = $content -replace '\boptions:\s*any\)', 'options: Record<string, unknown>)'
    $content = $content -replace '\bconfig:\s*any\)', 'config: Record<string, unknown>)'
    $content = $content -replace '\bevent:\s*any\)', 'event: Event)'
    $content = $content -replace '\(data:\s*any\)', '(data: Record<string, unknown>)'
    $content = $content -replace '\(item:\s*any\)', '(item: Record<string, unknown>)'
    $content = $content -replace '\(entry:\s*any\)', '(entry: Record<string, unknown>)'
    $content = $content -replace '<any>', '<unknown>'
    $content = $content -replace 'Promise<any>', 'Promise<unknown>'
    $content = $content -replace 'Array<any>', 'Array<unknown>'
    $content = $content -replace '\[\]: any;', '[]: unknown;'
    
    if ($content -ne $originalContent) {
      Set-Content $file -Value $content -NoNewline
      $fixedCount = ([regex]::Matches($originalContent, ':\s*any')).Count - ([regex]::Matches($content, ':\s*any')).Count
      $totalFixed += $fixedCount
      Write-Host "Fixed $file - $fixedCount any types removed"
    }
  }
}

Write-Host ""
Write-Host "Total any types fixed: $totalFixed"
