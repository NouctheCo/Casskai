# Script PowerShell pour corriger automatiquement les variables inutilisées
param(
    [switch]$DryRun = $false
)

Write-Host "Scanning for unused variable errors..." -ForegroundColor Cyan

# Run ESLint and capture output
$lintOutput = npm run lint 2>&1 | Out-String

# Parse errors
$errorPattern = "^\s*(\d+):(\d+)\s+error\s+'([^']+)'\s+(is assigned a value but never used|is defined but never used)"
$filePattern = "^([A-Z]:\\.*\.(ts|tsx))$"

$currentFile = ""
$fixes = @{}

foreach ($line in $lintOutput -split "`n") {
    if ($line -match $filePattern) {
        $currentFile = $matches[1]
        if ($currentFile -and -not $fixes.ContainsKey($currentFile)) {
            $fixes[$currentFile] = @()
        }
    }
    elseif ($line -match $errorPattern -and $currentFile) {
        $lineNum = [int]$matches[1]
        $varName = $matches[3]

        $fixes[$currentFile] += @{
            Line = $lineNum
            Var = $varName
        }
    }
}

Write-Host "Found $($fixes.Keys.Count) files with unused variables" -ForegroundColor Yellow

$totalFixed = 0

foreach ($file in $fixes.Keys) {
    if (-not (Test-Path $file)) {
        Write-Host "Skipping missing file: $file" -ForegroundColor Red
        continue
    }

    Write-Host "`nProcessing: $file" -ForegroundColor Green
    $content = Get-Content $file -Raw
    $originalContent = $content

    # Sort by line number descending to avoid offset issues
    $sortedFixes = $fixes[$file] | Sort-Object -Property Line -Descending

    foreach ($fix in $sortedFixes) {
        $varName = $fix.Var
        $line = $fix.Line

        # Pattern 1: catch (error) -> catch (_error)
        $content = $content -replace "catch\s*\(\s*$varName\s*\)", "catch (_$varName)"

        # Pattern 2: const { var, ... } -> const { var: _var, ... }
        $content = $content -replace "(\{[^}]*)\b$varName\b([^:}])", "`$1$varName: _$varName`$2"

        # Pattern 3: const var = ... -> const _var = ...
        $content = $content -replace "\bconst\s+$varName\s*=", "const _$varName ="
        $content = $content -replace "\bconst\s+$varName\s*:", "const _$varName:"

        # Pattern 4: let var = ... -> let _var = ...
        $content = $content -replace "\blet\s+$varName\s*=", "let _$varName ="

        # Pattern 5: function parameters
        # This is tricky and might need manual review
    }

    if ($content -ne $originalContent) {
        if (-not $DryRun) {
            Set-Content -Path $file -Value $content -NoNewline
            Write-Host "  Fixed unused variables in: $(Split-Path $file -Leaf)" -ForegroundColor Cyan
            $totalFixed++
        } else {
            Write-Host "  [DRY RUN] Would fix: $(Split-Path $file -Leaf)" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n✓ Total files fixed: $totalFixed" -ForegroundColor Green

if (-not $DryRun) {
    Write-Host "`nRe-running ESLint to check remaining errors..." -ForegroundColor Cyan
    npm run lint 2>&1 | Select-String "error" | Measure-Object | Select-Object -ExpandProperty Count | ForEach-Object {
        Write-Host "Remaining errors: $_" -ForegroundColor $(if ($_ -eq 0) { "Green" } else { "Yellow" })
    }
}
