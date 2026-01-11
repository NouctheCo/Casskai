# Script pour remplacer automatiquement les symboles EUR par CurrencyAmount
# Usage: .\scripts\replace-currency-symbols.ps1

$rootPath = "c:\Users\noutc\Casskai\src"
$euroSymbol = [char]0x20AC  # Code Unicode pour €

Write-Host "🔍 Recherche des fichiers contenant le symbole Euro..." -ForegroundColor Cyan
$files = Get-ChildItem -Path $rootPath -Filter "*.tsx" -Recurse | Where-Object {
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue -Encoding UTF8
    $content -and ($content -match $euroSymbol)
}

Write-Host "✅ Trouvé $($files.Count) fichiers avec symbole Euro" -ForegroundColor Green

$replacedCount = 0
$filesModified = 0

foreach ($file in $files) {
    Write-Host "`n📝 Traitement: $($file.Name)" -ForegroundColor Yellow

    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    $fileReplacements = 0

    # Pattern 1: {amount.toFixed(2)} €
    $pattern1 = "\{([a-zA-Z_$][\w.$]*?)\.toFixed\((\d+)\)\}\s*$euroSymbol"
    $replacement1 = '<CurrencyAmount amount={$1} />'
    if ($content -match $pattern1) {
        $count = ([regex]::Matches($content, $pattern1)).Count
        $content = $content -replace $pattern1, $replacement1
        $fileReplacements += $count
        Write-Host "  ✓ Pattern 1 (toFixed + EUR): $count occurrences" -ForegroundColor Green
    }

    # Pattern 2: {amount.toLocaleString('fr-FR')} €
    $pattern2 = "\{([a-zA-Z_$][\w.$]*?)\.toLocaleString\(['""][\w-]+['""](,\s*\{[^}]+\})?\)\}\s*$euroSymbol"
    $replacement2 = '<CurrencyAmount amount={$1} />'
    if ($content -match $pattern2) {
        $count = ([regex]::Matches($content, $pattern2)).Count
        $content = $content -replace $pattern2, $replacement2
        $fileReplacements += $count
        Write-Host "  ✓ Pattern 2 (toLocaleString + EUR): $count occurrences" -ForegroundColor Green
    }

    # Pattern 3: `${amount} €`
    $pattern3 = "``\$\{([a-zA-Z_$][\w.$]*?)\}\s*$euroSymbol``"
    $replacement3 = '{formatAmount($1)}'
    if ($content -match $pattern3) {
        $count = ([regex]::Matches($content, $pattern3)).Count
        $content = $content -replace $pattern3, $replacement3
        $fileReplacements += $count
        Write-Host "  ✓ Pattern 3 (template literal + EUR): $count occurrences" -ForegroundColor Green

        # Vérifier si le hook est importé
        if ($content -notmatch 'import.*useCompanyCurrency.*from') {
            $importLine = "import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';"
            $firstImport = [regex]::Match($content, '(import\s+.*?;)')
            if ($firstImport.Success) {
                $content = $content -replace '(import\s+.*?;)', "`$1`n$importLine"
                Write-Host "  ✓ Ajout import useCompanyCurrency" -ForegroundColor Cyan
            }
        }
    }

    # Pattern 4: {amount} € (simple)
    $pattern4 = "\{([a-zA-Z_$][\w.$]*?)\}\s*$euroSymbol"
    $replacement4 = '<CurrencyAmount amount={$1} />'
    if ($content -match $pattern4) {
        $count = ([regex]::Matches($content, $pattern4)).Count
        $content = $content -replace $pattern4, $replacement4
        $fileReplacements += $count
        Write-Host "  ✓ Pattern 4 (simple + EUR): $count occurrences" -ForegroundColor Green
    }

    # Vérifier si CurrencyAmount est importé (pour patterns 1, 2, 4)
    if ($fileReplacements -gt 0 -and ($content -match '<CurrencyAmount')) {
        if ($content -notmatch 'import.*CurrencyAmount.*from') {
            $importLine = "import { CurrencyAmount } from '@/components/ui/CurrencyAmount';"
            $firstImport = [regex]::Match($content, '(import\s+.*?;)')
            if ($firstImport.Success) {
                $content = $content -replace '(import\s+.*?;)', "`$1`n$importLine"
                Write-Host "  ✓ Ajout import CurrencyAmount" -ForegroundColor Cyan
            }
        }
    }

    # Sauvegarder si modifié
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        $filesModified++
        $replacedCount += $fileReplacements
        Write-Host "  ✅ $fileReplacements remplacements effectués" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Aucun pattern détecté" -ForegroundColor Yellow
    }
}

Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "✨ RÉSUMÉ" -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "📁 Fichiers modifiés: $filesModified" -ForegroundColor Cyan
Write-Host "🔄 Remplacements totaux: $replacedCount" -ForegroundColor Cyan

# Compter les symboles Euro restants
Write-Host "`n🔍 Vérification des symboles Euro restants..." -ForegroundColor Yellow
$remaining = 0
Get-ChildItem -Path $rootPath -Filter "*.tsx" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
    if ($content -and ($content -match $euroSymbol)) {
        $count = ([regex]::Matches($content, $euroSymbol)).Count
        $remaining += $count
    }
}

Write-Host "⚠️ Symboles Euro restants: $remaining" -ForegroundColor $(if ($remaining -eq 0) { "Green" } else { "Yellow" })
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Magenta

if ($remaining -gt 0) {
    Write-Host "`n💡 Certains cas complexes nécessitent une révision manuelle" -ForegroundColor Yellow
    Write-Host "Recherchez les fichiers avec: Get-ChildItem -Recurse *.tsx | Select-String '$euroSymbol' | Select-Object -First 10 Path, LineNumber" -ForegroundColor Gray
}
