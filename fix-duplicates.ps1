# Cleanup script - Remove duplicate dark: variants
$filesFixed = 0

$files = Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse

Write-Host "Cleaning up duplicate dark: variants..." -ForegroundColor Cyan

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content

    # Remove all duplicate dark: variants (e.g., dark:text-gray-400 dark:text-gray-400 -> dark:text-gray-400)
    $content = $content -replace '(dark:[\w-]+)\s+\1', '$1'

    # Handle triple+ duplicates
    while ($content -match '(dark:[\w-]+)\s+\1') {
        $content = $content -replace '(dark:[\w-]+)\s+\1', '$1'
    }

    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $filesFixed++
        Write-Host "  Cleaned: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "Cleanup complete! Fixed $filesFixed files" -ForegroundColor Green
