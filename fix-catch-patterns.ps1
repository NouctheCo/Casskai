# Fix catch blocks and object spreading patterns

$files = Get-ChildItem -Path src -Include *.ts,*.tsx -Recurse | Where-Object { $_.Name -notlike "*.d.ts" }
$totalFixed = 0

foreach ($file in $files) {
  $content = Get-Content $file.FullName -Raw
  $originalContent = $content
  
  # Fix catch blocks - keep as unknown for proper error handling
  $content = $content -replace '\}\s*catch\s*\((\w+):\s*any\)', '} catch (${1}: unknown)'
  
  # Fix updateData patterns
  $content = $content -replace 'const\s+updateData:\s*any\s*=\s*\{', 'const updateData: Record<string, unknown> = {'
  $content = $content -replace 'let\s+updateData:\s*any\s*=\s*\{', 'let updateData: Record<string, unknown> = {'
  
  # Fix other variable initializations with objects
  $content = $content -replace 'const\s+(\w+):\s*any\s*=\s*\{', 'const ${1}: Record<string, unknown> = {'
  $content = $content -replace 'let\s+(\w+):\s*any\s*=\s*\{', 'let ${1}: Record<string, unknown> = {'
  
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
Write-Host "Total any types fixed: $totalFixed"
