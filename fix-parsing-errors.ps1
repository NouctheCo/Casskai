# Script pour corriger les erreurs de parsing introduites
Write-Host "🔧 Correction des erreurs de parsing..." -ForegroundColor Cyan

$fixes = @(
    @{ File = "src\components\TrialComponents.tsx"; Pattern = "import { AlertCircle Loader2 "; Replace = "import { AlertCircle, Loader2 " }
    @{ File = "src\components\budget\BudgetCard.tsx"; Pattern = "import { Plus Trash2 "; Replace = "import { Plus, Trash2 " }
    @{ File = "src\components\purchases\PurchasesFilters.tsx"; Pattern = "import { Search Filter "; Replace = "import { Search, Filter " }
    @{ File = "src\components\reports\ReportViewer.tsx"; Pattern = "import { Download Loader "; Replace = "import { Download, Loader " }
    @{ File = "src\components\ui\FeedbackAnimations.tsx"; Pattern = "import { Check X "; Replace = "import { Check, X " }
)

foreach ($fix in $fixes) {
    $filePath = Join-Path "C:\Users\noutc\Casskai" $fix.File
    
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        
        if ($content -match [regex]::Escape($fix.Pattern)) {
            $content = $content -replace [regex]::Escape($fix.Pattern), $fix.Replace
            $content | Set-Content $filePath -NoNewline
            Write-Host "✓ Corrigé: $($fix.File)" -ForegroundColor Green
        }
    }
}

Write-Host "`n✅ Corrections terminées!" -ForegroundColor Green
