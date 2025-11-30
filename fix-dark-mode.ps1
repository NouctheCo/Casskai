# Dark Mode Fix Script - Automated corrections for all components
# This script applies dark mode variants to text, backgrounds, and borders

$filesFixed = 0
$totalCorrections = 0

# Get all .tsx files in src/ that need fixing
$files = Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse | Where-Object {
    $content = Get-Content $_.FullName -Raw
    # Check if file has text-gray without dark: or bg-white without dark:bg
    ($content -match 'text-gray-[4-7]00(?!["\s]*dark:)') -or
    ($content -match 'bg-white(?!["\s]*dark:bg)') -or
    ($content -match 'border-gray-[2-4]00(?!["\s]*dark:)')
}

Write-Host "Found $($files.Count) files needing dark mode fixes" -ForegroundColor Cyan
Write-Host ""

foreach ($file in $files) {
    Write-Host "Processing: $($file.Name)" -ForegroundColor Yellow
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $fileCorrections = 0

    # Fix text-gray-700 -> text-gray-700 dark:text-gray-300
    if ($content -match 'className="([^"]*\s)?text-gray-700(\s[^"]*)?"') {
        $content = $content -replace '(className="[^"]*)(text-gray-700)(\s)', '$1text-gray-700 dark:text-gray-300$3'
        $content = $content -replace '(className="[^"]*)(text-gray-700)(")', '$1text-gray-700 dark:text-gray-300$3'
        $fileCorrections++
    }

    # Fix text-gray-600 -> text-gray-600 dark:text-gray-400
    if ($content -match 'className="([^"]*\s)?text-gray-600(\s[^"]*)?"') {
        $content = $content -replace '(className="[^"]*)(text-gray-600)(\s)', '$1text-gray-600 dark:text-gray-400$3'
        $content = $content -replace '(className="[^"]*)(text-gray-600)(")', '$1text-gray-600 dark:text-gray-400$3'
        $fileCorrections++
    }

    # Fix text-gray-500 -> text-gray-500 dark:text-gray-400
    if ($content -match 'className="([^"]*\s)?text-gray-500(\s[^"]*)?"') {
        $content = $content -replace '(className="[^"]*)(text-gray-500)(\s)', '$1text-gray-500 dark:text-gray-400$3'
        $content = $content -replace '(className="[^"]*)(text-gray-500)(")', '$1text-gray-500 dark:text-gray-400$3'
        $fileCorrections++
    }

    # Fix text-gray-400 -> text-gray-400 dark:text-gray-500
    if ($content -match 'className="([^"]*\s)?text-gray-400(\s[^"]*)?"') {
        $content = $content -replace '(className="[^"]*)(text-gray-400)(\s)', '$1text-gray-400 dark:text-gray-500$3'
        $content = $content -replace '(className="[^"]*)(text-gray-400)(")', '$1text-gray-400 dark:text-gray-500$3'
        $fileCorrections++
    }

    # Fix text-gray-900 -> text-gray-900 dark:text-gray-100
    if ($content -match 'className="([^"]*\s)?text-gray-900(\s[^"]*)?"') {
        $content = $content -replace '(className="[^"]*)(text-gray-900)(\s)', '$1text-gray-900 dark:text-gray-100$3'
        $content = $content -replace '(className="[^"]*)(text-gray-900)(")', '$1text-gray-900 dark:text-gray-100$3'
        $fileCorrections++
    }

    # Fix bg-white -> bg-white dark:bg-gray-800
    if ($content -match 'className="([^"]*\s)?bg-white(\s[^"]*)?"') {
        $content = $content -replace '(className="[^"]*)(bg-white)(\s)', '$1bg-white dark:bg-gray-800$3'
        $content = $content -replace '(className="[^"]*)(bg-white)(")', '$1bg-white dark:bg-gray-800$3'
        $fileCorrections++
    }

    # Fix border-gray-300 -> border-gray-300 dark:border-gray-600
    if ($content -match 'className="([^"]*\s)?border-gray-300(\s[^"]*)?"') {
        $content = $content -replace '(className="[^"]*)(border-gray-300)(\s)', '$1border-gray-300 dark:border-gray-600$3'
        $content = $content -replace '(className="[^"]*)(border-gray-300)(")', '$1border-gray-300 dark:border-gray-600$3'
        $fileCorrections++
    }

    # Fix border-gray-200 -> border-gray-200 dark:border-gray-600
    if ($content -match 'className="([^"]*\s)?border-gray-200(\s[^"]*)?"') {
        $content = $content -replace '(className="[^"]*)(border-gray-200)(\s)', '$1border-gray-200 dark:border-gray-600$3'
        $content = $content -replace '(className="[^"]*)(border-gray-200)(")', '$1border-gray-200 dark:border-gray-600$3'
        $fileCorrections++
    }

    # Fix placeholder-gray-400 -> placeholder-gray-400 dark:placeholder-gray-500
    if ($content -match 'className="([^"]*\s)?placeholder-gray-400(\s[^"]*)?"') {
        $content = $content -replace '(className="[^"]*)(placeholder-gray-400)(\s)', '$1placeholder-gray-400 dark:placeholder-gray-500$3'
        $content = $content -replace '(className="[^"]*)(placeholder-gray-400)(")', '$1placeholder-gray-400 dark:placeholder-gray-500$3'
        $fileCorrections++
    }

    # Only write if changes were made
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $filesFixed++
        $totalCorrections += $fileCorrections
        Write-Host "  Fixed $fileCorrections issues" -ForegroundColor Green
    } else {
        Write-Host "  No automatic fixes needed" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Dark Mode Fix Complete!" -ForegroundColor Green
Write-Host "Files fixed: $filesFixed" -ForegroundColor Green
Write-Host "Total corrections: $totalCorrections" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
