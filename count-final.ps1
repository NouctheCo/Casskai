$files = Get-ChildItem -Path src -Include *.ts,*.tsx -Recurse | Where-Object { $_.Name -notlike "*.d.ts" }
$totalAny = 0
$files2Any = 0

foreach ($file in $files) {
  $count = (Select-String -Path $file.FullName -Pattern ": any" -AllMatches).Matches.Count
  $totalAny += $count
  if ($count -eq 2) {
    $files2Any++
    $relativePath = $file.FullName.Replace((Get-Location).Path + "\", "")
    Write-Host "$relativePath - $count any"
  }
}

Write-Host ""
Write-Host "=== FINAL REPORT ==="
Write-Host "Total remaining any types: $totalAny"
Write-Host "Files with exactly 2 any types: $files2Any"
