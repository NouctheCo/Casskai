# Fix remaining 'err' in catch blocks
$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts","*.tsx" | 
    Where-Object { $_.FullName -notmatch "node_modules" }

$fixed = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $modified = $false
    
    # Pattern: catch (xxx) { ... err.message ... }
    # Remplacer err par error dans les catch blocks
    if ($content -match "\berr\b" -and $content -match "catch\s*\(") {
        # Remplacer err.message par (error as Error).message
        $newContent = $content -replace "\berr\.message\b", "(error as Error).message"
        $newContent = $newContent -replace "\berr\.name\b", "(error as Error).name"
        $newContent = $newContent -replace "\berr\.stack\b", "(error as Error).stack"
        $newContent = $newContent -replace "console\.error\(['\`"].*['\`"],\s*\berr\b\)", "console.error('...', error)"
        $newContent = $newContent -replace "console\.error\(\berr\b\)", "console.error(error)"
        
        if ($newContent -ne $content) {
            Set-Content $file.FullName -Value $newContent -NoNewline
            $fixed++
            Write-Host "[OK] $($file.Name)"
            $modified = $true
        }
    }
}

Write-Host "`n✓ $fixed fichiers corrigés"
