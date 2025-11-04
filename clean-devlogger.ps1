# Nettoyage imports devLogger dupliqués - version simple
$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts","*.tsx" | 
    Where-Object { $_.FullName -notmatch "node_modules" }

$fixed = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Pattern simple: supprimer toutes les occurrences sauf la première
    $firstMatch = $true
    $content = $content -split "`n" | ForEach-Object {
        if ($_ -match "^import\s+\{\s*devLogger\s*\}\s+from\s+") {
            if ($firstMatch) {
                $firstMatch = $false
                $_
            }
            # Sinon skip cette ligne
        } else {
            $_
        }
    } | Out-String
    
    if ($content -ne $originalContent) {
        $content = $content.TrimEnd()
        Set-Content $file.FullName -Value $content
        $fixed++
        Write-Host "[OK] $($file.Name)"
    }
}

Write-Host "`n✓ $fixed fichiers corrigés"
