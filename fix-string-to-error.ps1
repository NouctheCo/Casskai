# Fix string to Error conversions
Write-Host "Correction des conversions string -> Error...`n" -ForegroundColor Cyan

$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts","*.tsx" | 
    Where-Object { $_.FullName -notmatch "node_modules" }

$fixed = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Pattern: setError(... as Error) ou similar avec strings
    # Remplacer par new Error(...)
    $content = $content -replace "setError\(([^)]+)\s+as\s+Error\)", "setError(new Error(`$1))"
    $content = $content -replace "throw\s+(['\`"][^'\`"]+['\`"])\s+as\s+Error", "throw new Error(`$1)"
    
    # Pattern: (error as Error).message avec error qui est string
    # Garder tel quel mais ajouter cast unknown si nécessaire
    
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
Write-Host "Erreurs TS: $tsErrors`n" -ForegroundColor $(if ($tsErrors -lt 250) { "Green" } elseif ($tsErrors -lt 300) { "Yellow" } else { "Red" })
