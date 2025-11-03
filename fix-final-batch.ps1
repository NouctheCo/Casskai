# Final batch fix for remaining 2-any files

$files = @(
  "src\components\guards\AuthGuard.tsx",
  "src\components\setup\MarketSelector.tsx",
  "src\contexts\LocaleContext.tsx",
  "src\pages\onboarding\PreferencesStep.tsx",
  "src\pages\BillingPage.tsx",
  "src\services\accountingService.ts",
  "src\services\bankingService.ts",
  "src\services\crmService.ts",
  "src\services\dashboardService.tsx",
  "src\services\dataMigrationService.ts",
  "src\services\enterpriseService.ts",
  "src\services\fecImportService.ts",
  "src\services\tenantService.ts"
)

$totalFixed = 0

foreach ($file in $files) {
  if (Test-Path $file) {
    $content = Get-Content $file -Raw
    $originalContent = $content
    
    # Fix function return types
    $content = $content -replace '(\w+)\(\):\s*any\[\]', '${1}(): Array<Record<string, unknown>>'
    
    # Fix variable declarations
    $content = $content -replace 'const\s+(\w+):\s*any\[\]\s*=', 'const ${1}: Array<Record<string, unknown>> ='
    $content = $content -replace 'let\s+(\w+):\s*any\[\]\s*=', 'let ${1}: Array<Record<string, unknown>> ='
    
    # Fix t function parameters (for translation context)
    $content = $content -replace 't:\s*\(key:\s*string,\s*defaultValueOrParams\?:\s*any,', 't: (key: string, defaultValueOrParams?: string | Record<string, unknown>,'
    $content = $content -replace 'const\s+t\s*=\s*\(key:\s*string,\s*defaultValueOrParams\?:\s*any,', 'const t = (key: string, defaultValueOrParams?: string | Record<string, unknown>,'
    
    # Fix other common patterns
    $content = $content -replace '\bhandleChange\s*=\s*\((\w+):\s*any\)', 'handleChange = (${1}: unknown)'
    $content = $content -replace '\bonChange\?:\s*\((\w+):\s*any\)', 'onChange?: (${1}: unknown)'
    
    if ($content -ne $originalContent) {
      Set-Content $file -Value $content -NoNewline
      $beforeCount = ([regex]::Matches($originalContent, ':\s*any')).Count
      $afterCount = ([regex]::Matches($content, ':\s*any')).Count
      $fixedCount = $beforeCount - $afterCount
      if ($fixedCount -gt 0) {
        $totalFixed += $fixedCount
        Write-Host "Fixed $file - $fixedCount any types removed"
      }
    }
  }
}

Write-Host ""
Write-Host "Total any types fixed: $totalFixed"
