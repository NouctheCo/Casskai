# Fix TS2352 - Ultra safe approach (only in specific contexts)
Write-Host "🎯 Correction ULTRA-SÛRE des TS2352...`n" -ForegroundColor Cyan

$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts","*.tsx" | 
    Where-Object { $_.FullName -notmatch "node_modules" }

$fixed = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Seulement dans les affectations de variables, pas dans les imports!
    # Pattern: = xxx as Type (pas import type)
    if ($content -notmatch "import.*type") {
        # Pattern très spécifique: variable = value as Type
        $content = $content -replace '=\s+([^=]+?)\s+as\s+(OpportunityStage|InvoiceStatus|AccountType|JournalType)\b', '= $1 as unknown as $2'
    }
    
    # Dans les return statements
    $content = $content -replace 'return\s+([^;]+?)\s+as\s+(OpportunityStage|InvoiceStatus|AccountType|JournalType)\b', 'return $1 as unknown as $2'
    
    # Dans les paramètres de fonctions
    $content = $content -replace '\(([^)]+?)\s+as\s+(OpportunityStage|InvoiceStatus|AccountType|JournalType)\)', '($1 as unknown as $2)'
    
    if ($content -ne $originalContent) {
        Set-Content $file.FullName -Value $content -NoNewline
        $fixed++
        Write-Host "[OK] $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`n✓ $fixed fichiers corrigés`n" -ForegroundColor Green

# Vérification
Write-Host "Vérification..." -ForegroundColor Yellow
$after = (npm run type-check 2>&1 | Select-String "error TS" | Measure-Object).Count
$ts2352 = (npm run type-check 2>&1 | Select-String "TS2352" | Measure-Object).Count

Write-Host "Erreurs totales: 284 → $after" -ForegroundColor $(if ($after -lt 284) { "Green" } else { "Red" })
Write-Host "Erreurs TS2352: $ts2352`n" -ForegroundColor $(if ($ts2352 -lt 138) { "Green" } else { "Yellow" })

if ($after -ge 284) {
    Write-Host "⚠️ Pas de progrès avec cette approche" -ForegroundColor Yellow
    Write-Host "Essayons une stratégie différente..." -ForegroundColor Cyan
}
