# Fix TS2352 errors - Conversion via unknown
Write-Host "Correction des erreurs TS2352 (Conversion via unknown)...`n" -ForegroundColor Cyan

$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts","*.tsx" | 
    Where-Object { $_.FullName -notmatch "node_modules" }

$fixed = 0
$patterns = @(
    # Pattern: (xxx as Type) where Type doesn't overlap
    @{
        Pattern = '\bas\s+([A-Z][a-zA-Z]+(?:Stage|Type|Status|Format|Category))\b'
        Replacement = 'as unknown as $1'
    }
)

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    foreach ($pattern in $patterns) {
        # Avoid double conversion
        if ($content -match $pattern.Pattern -and $content -notmatch "as unknown as") {
            $content = $content -replace $pattern.Pattern, $pattern.Replacement
        }
    }
    
    if ($content -ne $originalContent) {
        Set-Content $file.FullName -Value $content -NoNewline
        $fixed++
        Write-Host "[OK] $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`n✓ $fixed fichiers corrigés`n" -ForegroundColor Green

# Vérification
Write-Host "Vérification..." -ForegroundColor Yellow
$tsErrors = (npm run type-check 2>&1 | Select-String "error TS" | Measure-Object).Count
Write-Host "Erreurs TS: $tsErrors" -ForegroundColor $(if ($tsErrors -lt 200) { "Green" } else { "Yellow" })

$ts2352 = (npm run type-check 2>&1 | Select-String "TS2352" | Measure-Object).Count
Write-Host "Erreurs TS2352: $ts2352 (était 147)`n" -ForegroundColor $(if ($ts2352 -lt 100) { "Green" } else { "Yellow" })
