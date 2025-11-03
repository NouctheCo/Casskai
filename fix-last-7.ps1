# Fix the last 7 files with targeted replacements

$replacements = @{
  "src\pages\onboarding\PreferencesStep.tsx" = @(
    @{ Pattern = 'currencies\?:\s*any\[\];'; Replacement = 'currencies?: Array<Record<string, unknown>>;' },
    @{ Pattern = 'timezones\?:\s*any\[\];'; Replacement = 'timezones?: Array<Record<string, unknown>>;' }
  )
  "src\pages\BillingPage.tsx" = @(
    @{ Pattern = 'const handleDownloadPDF = async \(invoice: any\)'; Replacement = 'const handleDownloadPDF = async (invoice: Record<string, unknown>)' },
    @{ Pattern = 'const handleViewInvoice = async \(invoice: any\)'; Replacement = 'const handleViewInvoice = async (invoice: Record<string, unknown>)' }
  )
  "src\services\bankingService.ts" = @(
    @{ Pattern = 'accountingEntries:\s*any\[\]'; Replacement = 'accountingEntries: Array<Record<string, unknown>>'},
    @{ Pattern = 'payload:\s*any,'; Replacement = 'payload: Record<string, unknown>,' }
  )
  "src\services\dashboardService.tsx" = @(
    @{ Pattern = '\.sort\(\(a:\s*any,\s*b:\s*any\)'; Replacement = '.sort((a: Record<string, unknown>, b: Record<string, unknown>)' }
  )
  "src\services\dataMigrationService.ts" = @(
    @{ Pattern = 'companyData:\s*any\)'; Replacement = 'companyData: Record<string, unknown>)' },
    @{ Pattern = 'companies:\s*any\[\];'; Replacement = 'companies: Array<Record<string, unknown>>;' }
  )
  "src\services\fecImportService.ts" = @(
    @{ Pattern = 'errors:\s*any\[\];'; Replacement = 'errors: Array<Record<string, unknown>>;' },
    @{ Pattern = 'data:\s*any,'; Replacement = 'data: Record<string, unknown>,' }
  )
  "src\services\tenantService.ts" = @(
    @{ Pattern = 'private supabaseClient:\s*any\s*='; Replacement = 'private supabaseClient: unknown =' },
    @{ Pattern = 'getSupabaseClient\(\):\s*any\s*\{'; Replacement = 'getSupabaseClient(): unknown {' }
  )
}

$totalFixed = 0

foreach ($file in $replacements.Keys) {
  if (Test-Path $file) {
    $content = Get-Content $file -Raw
    $originalContent = $content
    
    foreach ($replacement in $replacements[$file]) {
      $content = $content -replace $replacement.Pattern, $replacement.Replacement
    }
    
    if ($content -ne $originalContent) {
      Set-Content $file -Value $content -NoNewline
      $beforeCount = ([regex]::Matches($originalContent, ':\s*any')).Count
      $afterCount = ([regex]::Matches($content, ':\s*any')).Count
      $fixedCount = $beforeCount - $afterCount
      $totalFixed += $fixedCount
      Write-Host "Fixed $file - $fixedCount any types removed"
    }
  }
}

Write-Host ""
Write-Host "Total any types fixed: $totalFixed"
