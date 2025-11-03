$files = @(
  "src\pages\onboarding\PreferencesStep.tsx",
  "src\pages\BillingPage.tsx",
  "src\services\bankingService.ts",
  "src\services\dashboardService.tsx",
  "src\services\dataMigrationService.ts",
  "src\services\fecImportService.ts",
  "src\services\tenantService.ts"
)

foreach ($file in $files) {
  if (Test-Path $file) {
    Write-Host "`n=== $file ==="
    $matches = Select-String -Path $file -Pattern ": any" -Context 1,1
    foreach ($match in $matches) {
      Write-Host $match.Line
    }
  }
}
