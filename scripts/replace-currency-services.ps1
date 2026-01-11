# Script pour remplacer les symboles € dans les fichiers de services (.ts)
# Les services n'utilisent pas JSX, donc on remplace par des fonctions helper

$rootPath = "c:\Users\noutc\Casskai\src"
$euroSymbol = [char]0x20AC  # Code Unicode pour €

Write-Host "🔍 Recherche des fichiers .ts contenant le symbole Euro..." -ForegroundColor Cyan
$files = Get-ChildItem -Path $rootPath -Filter "*.ts" -Recurse | Where-Object {
    if ($_.Name -like "*.test.ts") { return $false }
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue -Encoding UTF8
    $content -and ($content -match $euroSymbol)
}

Write-Host "✅ Trouvé $($files.Count) fichiers .ts avec symbole Euro" -ForegroundColor Green

$replacedCount = 0
$filesModified = 0

foreach ($file in $files) {
    Write-Host "`n📝 Traitement: $($file.Name)" -ForegroundColor Yellow

    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    $fileReplacements = 0

    # Pattern 1: `${amount} €` dans template literals -> ${amount} EUR (simple, pas de formatting)
    # Pour les services, on préfère EUR en texte plutôt que le symbole
    $pattern1 = "``\$\{([^}]+?)\}\s*$euroSymbol``"
    if ($content -match $pattern1) {
        $count = ([regex]::Matches($content, $pattern1)).Count
        $content = $content -replace $pattern1, '`$${$1} EUR`'
        $fileReplacements += $count
        Write-Host "  ✓ Pattern 1 (template literal): $count occurrences → EUR" -ForegroundColor Green
    }

    # Pattern 2: "${amount} €" dans strings -> "${amount} EUR"
    $pattern2 = "`"([^`"]*?)\s*$euroSymbol`""
    if ($content -match $pattern2) {
        $count = ([regex]::Matches($content, $pattern2)).Count
        $content = $content -replace $pattern2, '"$1 EUR"'
        $fileReplacements += $count
        Write-Host "  ✓ Pattern 2 (double quotes): $count occurrences → EUR" -ForegroundColor Green
    }

    # Pattern 3: '${amount} €' dans strings -> '${amount} EUR'
    $pattern3 = "'([^']*?)\s*$euroSymbol'"
    if ($content -match $pattern3) {
        $count = ([regex]::Matches($content, $pattern3)).Count
        $content = $content -replace $pattern3, "'`$1 EUR'"
        $fileReplacements += $count
        Write-Host "  ✓ Pattern 3 (single quotes): $count occurrences → EUR" -ForegroundColor Green
    }

    # Pattern 4: amount.toFixed(2) + ' €' -> amount.toFixed(2) + ' EUR'
    $pattern4 = "(\+\s*['""])\s*$euroSymbol"
    if ($content -match $pattern4) {
        $count = ([regex]::Matches($content, $pattern4)).Count
        $content = $content -replace $pattern4, '$1 EUR'
        $fileReplacements += $count
        Write-Host "  ✓ Pattern 4 (concatenation): $count occurrences → EUR" -ForegroundColor Green
    }

    # Sauvegarder si modifié
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $filesModified++
        $replacedCount += $fileReplacements
        Write-Host "  ✅ $fileReplacements remplacements effectués" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Aucun pattern détecté (peut nécessiter révision manuelle)" -ForegroundColor Yellow
    }
}

Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "✨ RÉSUMÉ - Services (.ts)" -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "📁 Fichiers modifiés: $filesModified" -ForegroundColor Cyan
Write-Host "🔄 Remplacements totaux: $replacedCount" -ForegroundColor Cyan

# Compter les symboles Euro restants dans les .ts
Write-Host "`n🔍 Vérification des symboles Euro restants dans .ts..." -ForegroundColor Yellow
$remaining = 0
Get-ChildItem -Path $rootPath -Filter "*.ts" -Recurse | ForEach-Object {
    if ($_.Name -notlike "*.test.ts") {
        $content = Get-Content $_.FullName -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
        if ($content -and ($content -match $euroSymbol)) {
            $count = ([regex]::Matches($content, $euroSymbol)).Count
            $remaining += $count
            Write-Host "  $($_.Name): $count symbole(s)" -ForegroundColor Gray
        }
    }
}

Write-Host "`n⚠️ Symboles Euro restants dans .ts: $remaining" -ForegroundColor $(if ($remaining -eq 0) { "Green" } else { "Yellow" })
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Magenta

if ($remaining -gt 0) {
    Write-Host "`n💡 Note: Pour les services, € a été remplacé par EUR (format texte)" -ForegroundColor Cyan
    Write-Host "   Les composants React utilisent CurrencyAmount pour le formatting multi-devises" -ForegroundColor Cyan
}
