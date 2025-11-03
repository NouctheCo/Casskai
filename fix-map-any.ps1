# Fix .map((item: any) patterns and other specific cases

$files = Get-ChildItem -Path src -Include *.ts,*.tsx -Recurse | Where-Object { $_.Name -notlike "*.d.ts" }
$totalFixed = 0

foreach ($file in $files) {
  $content = Get-Content $file.FullName -Raw
  $originalContent = $content
  
  # Fix .map patterns
  $content = $content -replace '\.map\(\((\w+):\s*any,', '.map((${1}: Record<string, unknown>,'
  $content = $content -replace '\.map\(\((\w+):\s*any\)', '.map((${1}: Record<string, unknown>)'
  
  # Fix function parameters in React components
  $content = $content -replace '\(\{\s*active,\s*payload,\s*label\s*\}:\s*any\)', '({ active, payload, label }: { active?: boolean; payload?: Array<Record<string, unknown>>; label?: string })'
  
  # Fix data parameters
  $content = $content -replace 'saveReport:\s*\([^)]*data:\s*any', 'saveReport: (type: string, name: string, data: Record<string, unknown>'
  $content = $content -replace '\(type:\s*string,\s*name:\s*string,\s*data:\s*any,', '(type: string, name: string, data: Record<string, unknown>,'
  
  # Fix context value types
  $content = $content -replace 'value:\s*any;', 'value: unknown;'
  $content = $content -replace 'value:\s*any\s*\|', 'value: unknown |'
  
  if ($content -ne $originalContent) {
    Set-Content $file.FullName -Value $content -NoNewline
    $beforeCount = ([regex]::Matches($originalContent, ':\s*any')).Count
    $afterCount = ([regex]::Matches($content, ':\s*any')).Count
    $fixedCount = $beforeCount - $afterCount
    if ($fixedCount -gt 0) {
      $totalFixed += $fixedCount
      $relativePath = $file.FullName.Replace((Get-Location).Path + "\", "")
      Write-Host "Fixed $relativePath - $fixedCount any types removed"
    }
  }
}

Write-Host ""
Write-Host "Total any types fixed in this pass: $totalFixed"
