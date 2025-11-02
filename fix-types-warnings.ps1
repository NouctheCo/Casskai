# Script pour corriger automatiquement les warnings TypeScript courants
Write-Host "🔧 Correction automatique des warnings TypeScript..." -ForegroundColor Cyan

$files = Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx

$totalFiles = $files.Count
$processedFiles = 0
$modifiedFiles = 0

foreach ($file in $files) {
    $processedFiles++
    $modified = $false
    
    Write-Progress -Activity "Correction des fichiers" -Status "Fichier $processedFiles sur $totalFiles" -PercentComplete (($processedFiles / $totalFiles) * 100)
    
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    
    if (-not $content) {
        continue
    }
    
    $originalContent = $content
    
    # Remplacer Record<string, any> par Record<string, unknown>
    $content = $content -replace 'Record<string,\s*any>', 'Record<string, unknown>'
    
    # Remplacer : any[] par : unknown[]
    $content = $content -replace ':\s*any\[\]', ': unknown[]'
    
    # Remplacer ?: any par ?: unknown
    $content = $content -replace '\?:\s*any\b(?!where)', '?: unknown'
    
    # Remplacer any où c'est un type standalone (avec précaution)
    # $content = $content -replace '(?<=:\s)any(?=\s*[;,\)])', 'unknown'
    
    # Sauvegarder si modifié
    if ($content -ne $originalContent) {
        $content | Set-Content $file.FullName -NoNewline
        $modifiedFiles++
        Write-Host "✓ Modifié: $($file.FullName)" -ForegroundColor Green
    }
}

Write-Host "`n✅ Terminé! $modifiedFiles fichiers sur $totalFiles modifiés." -ForegroundColor Green
Write-Host "🔍 Lancement de la vérification ESLint..." -ForegroundColor Cyan

# Compter les warnings restants
npm run lint 2>&1 | Select-String "problems" | ForEach-Object {
    Write-Host $_ -ForegroundColor Yellow
}
