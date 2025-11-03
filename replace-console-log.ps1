# Replace console.log with devLog in all TypeScript files
# Run this script to automatically fix ESLint no-console warnings

Write-Host "🔧 Starting console.log replacement..." -ForegroundColor Cyan

$replacements = 0
$files = Get-ChildItem -Path "$PSScriptRoot\src" -Recurse -Include "*.ts","*.tsx" -File

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Skip if already has devLogger import
    if ($content -match "from '@/utils/devLogger'") {
        Write-Host "⏭️  Skipping $($file.Name) (already uses devLogger)" -ForegroundColor Yellow
        continue
    }
    
    # Count console.log occurrences
    $logCount = ([regex]::Matches($content, "console\.log")).Count
    
    if ($logCount -eq 0) {
        continue
    }
    
    Write-Host "📝 Processing $($file.Name) ($logCount console.log found)..." -ForegroundColor Green
    
    # Add import at the top (after existing imports)
    if ($content -match "import.*from") {
        $content = $content -replace "(import.*from '[^']+';?\n)(?!import)", "`$1import { devLog } from '@/utils/devLogger';`n"
    }
    
    # Replace console.log with devLog
    $content = $content -replace "console\.log\(", "devLog("
    
    # Replace console.warn with warn (if devLogger supports it)
    # $content = $content -replace "console\.warn\(", "warn("
    
    # Save if changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $replacements += $logCount
        Write-Host "✅ Fixed $logCount occurrences in $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`n🎉 Replacement complete!" -ForegroundColor Cyan
Write-Host "📊 Total replacements: $replacements" -ForegroundColor Green
Write-Host "`n⚠️  Note: Review changes before committing!" -ForegroundColor Yellow
Write-Host "Run: git diff" -ForegroundColor Yellow
