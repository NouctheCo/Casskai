# Nettoyage imports devLogger dupliqués
$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts","*.tsx" | 
    Where-Object { $_.FullName -notmatch "node_modules" }

$fixed = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Compter les occurrences de devLogger import
    $matches = [regex]::Matches($content, "import\s+\{\s*devLogger\s*\}\s+from\s+['\`"]@/utils/devLogger['\`"];?\s*\r?\n")
    
    if ($matches.Count -gt 1) {
        # Garder seulement le premier, supprimer les autres
        $newContent = $content
        for ($i = 1; $i -lt $matches.Count; $i++) {
            $newContent = $newContent -replace "import\s+\{\s*devLogger\s*\}\s+from\s+['\`"]@/utils/devLogger['\`"];?\s*\r?\n", "", 1
        }
        
        if ($newContent -ne $content) {
            Set-Content $file.FullName -Value $newContent -NoNewline
            $fixed++
            Write-Host "[OK] $($file.Name) - $($matches.Count) imports → 1"
        }
    }
}

Write-Host "`n✓ $fixed fichiers corrigés"
