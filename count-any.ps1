$eslintReport = Get-Content -Path 'eslint-any-report.json' | ConvertFrom-Json

$anyCounts = @{}

foreach ($file in $eslintReport) {
    if ($file.messages -and $file.messages.Count -gt 0) {
        $anyCount = ($file.messages | Where-Object { $_.message -like '*Unexpected any*' }).Count
        if ($anyCount -gt 0) {
            $anyCounts[$file.filePath] = $anyCount
        }
    }
}

$sorted = $anyCounts.GetEnumerator() | Sort-Object -Property Value -Descending | Select-Object -First 15

Write-Host "Top 15 fichiers TypeScript avec le plus de types any:`n"

$output = @()
foreach ($item in $sorted) {
    $filepath = $item.Key
    $count = $item.Value
    
    # Extraire le chemin relatif
    if ($filepath -match '\src\') {
        $relativePath = 'src/' + ($filepath -split '\src\')[1]
    } elseif ($filepath -match '/src/') {
        $relativePath = 'src/' + ($filepath -split '/src/')[1]
    } else {
        $relativePath = $filepath
    }
    
    # Remplacer backslashes par forward slashes
    $relativePath = $relativePath -replace '\', '/'
    
    $line = "$count - $relativePath"
    Write-Host $line
    $output += $line
}

$output | Out-File -FilePath 'top-15-any-types.txt' -Encoding UTF8
Write-Host "`n✓ Rapport sauvegarde dans: top-15-any-types.txt"
