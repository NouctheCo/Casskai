# Script PowerShell pour remplacer tous les symboles € dans le batch 1
# Batch 1: AnomalyDetectionDashboard, FECImportTab, LettragePanel, OptimizedJournalsTab, OptimizedReportsTab

$ErrorActionPreference = "Stop"
$filesProcessed = 0
$replacementsMade = 0

# Function to add import if not present
function Add-CurrencyImport {
    param([string]$FilePath, [string]$ImportLine)

    $content = Get-Content $FilePath -Raw -Encoding UTF8

    # Check if import already exists
    if ($content -notmatch [regex]::Escape($ImportLine)) {
        # Find last import statement
        $lines = Get-Content $FilePath -Encoding UTF8
        $lastImportIndex = -1

        for ($i = 0; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match "^import\s+") {
                $lastImportIndex = $i
            }
        }

        if ($lastImportIndex -ge 0) {
            # Insert after last import
            $lines = @($lines[0..$lastImportIndex]) + $ImportLine + @($lines[($lastImportIndex + 1)..($lines.Count - 1)])
            Set-Content $FilePath -Value $lines -Encoding UTF8 -NoNewline
            return $true
        }
    }
    return $false
}

# Function to replace euro symbols
function Replace-EuroSymbols {
    param([string]$FilePath)

    Write-Host "Processing: $FilePath" -ForegroundColor Cyan

    if (-not (Test-Path $FilePath)) {
        Write-Host "  File not found, skipping..." -ForegroundColor Yellow
        return
    }

    $content = Get-Content $FilePath -Raw -Encoding UTF8
    $originalContent = $content
    $replacements = 0

    # Pattern 1: {amount.toFixed(2)} € or {amount} € -> <CurrencyAmount amount={amount} />
    $pattern1 = '\{([a-zA-Z_][a-zA-Z0-9_\.]*(?:\.toFixed\(\d+\))?)\}\s*€'
    if ($content -match $pattern1) {
        $content = $content -replace $pattern1, '<CurrencyAmount amount={$1} />'
        $replacements += ([regex]::Matches($originalContent, $pattern1)).Count

        # Add CurrencyAmount import
        Add-CurrencyImport $FilePath "import { CurrencyAmount } from '@/components/ui/CurrencyAmount';"
    }

    # Pattern 2: amount.toFixed(2)} € (without opening brace)
    $pattern2 = '([a-zA-Z_][a-zA-Z0-9_\.]*\.toFixed\(\d+\))\}\s*€'
    if ($content -match $pattern2) {
        $matches = [regex]::Matches($content, $pattern2)
        foreach ($match in $matches) {
            $varName = $match.Groups[1].Value
            # Extract just the variable name without .toFixed()
            $cleanVar = $varName -replace '\.toFixed\(\d+\)', ''
            $content = $content.Replace("$varName} €", "<CurrencyAmount amount={$cleanVar} />")
            $replacements++
        }

        Add-CurrencyImport $FilePath "import { CurrencyAmount } from '@/components/ui/CurrencyAmount';"
    }

    # Pattern 3: .toFixed(2)} € in font-mono spans
    $pattern3 = '<span[^>]*class="[^"]*font-mono[^"]*"[^>]*>\{([a-zA-Z_][a-zA-Z0-9_\.]*\.toFixed\(\d+\))\}\s*€</span>'
    if ($content -match $pattern3) {
        $content = $content -replace $pattern3, '<CurrencyAmount amount={$1} />'
        $replacements += ([regex]::Matches($originalContent, $pattern3)).Count

        Add-CurrencyImport $FilePath "import { CurrencyAmount } from '@/components/ui/CurrencyAmount';"
    }

    # Save if changes were made
    if ($content -ne $originalContent) {
        Set-Content $FilePath -Value $content -Encoding UTF8 -NoNewline
        Write-Host "  ✓ Made $replacements replacement(s)" -ForegroundColor Green
        return $replacements
    } else {
        Write-Host "  No € symbols found" -ForegroundColor Gray
        return 0
    }
}

# Batch 1 files
$batch1Files = @(
    "src\components\accounting\AnomalyDetectionDashboard.tsx",
    "src\components\accounting\FECImportTab.tsx",
    "src\components\accounting\LettragePanel.tsx",
    "src\components\accounting\OptimizedJournalsTab.tsx",
    "src\components\accounting\OptimizedReportsTab.tsx"
)

Write-Host "======================================" -ForegroundColor Magenta
Write-Host "Starting Batch 1 Currency Replacement" -ForegroundColor Magenta
Write-Host "======================================" -ForegroundColor Magenta
Write-Host ""

foreach ($file in $batch1Files) {
    $fullPath = Join-Path $PSScriptRoot "..\$file"
    $count = Replace-EuroSymbols $fullPath
    if ($null -ne $count -and $count -gt 0) {
        $filesProcessed++
        $replacementsMade += [int]$count
    }
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Magenta
Write-Host "Batch 1 Complete!" -ForegroundColor Green
Write-Host "Files processed: $filesProcessed" -ForegroundColor Green
Write-Host "Total replacements: $replacementsMade" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Magenta
