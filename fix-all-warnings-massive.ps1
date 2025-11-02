# Script massif de correction des warnings ESLint
Write-Host "🚀 Correction massive des warnings ESLint..." -ForegroundColor Cyan

$stats = @{
    totalFiles = 0
    modifiedFiles = 0
    unusedVarsFixed = 0
    anyTypesFixed = 0
}

$files = Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx | Where-Object { 
    $_.FullName -notlike "*node_modules*" -and 
    $_.FullName -notlike "*dist*" 
}

$stats.totalFiles = $files.Count
$i = 0

foreach ($file in $files) {
    $i++
    Write-Progress -Activity "Correction des fichiers" -Status "$i / $($stats.totalFiles)" -PercentComplete (($i / $stats.totalFiles) * 100)
    
    try {
        $content = Get-Content $file.FullName -Raw -ErrorAction Stop
        $originalContent = $content
        
        # 1. Corriger les paramètres inutilisés dans les fonctions fléchées et déclarations
        # Pattern: (param, param2) => dans les types/interfaces
        $content = $content -replace '\(([a-zA-Z_]\w*):\s*([^,)]+)\)\s*=>\s*(void|boolean|string|number|Promise)', '(_$1: $2) => $3'
        $content = $content -replace ',\s*([a-zA-Z_]\w*):\s*([^,)]+)\)\s*=>\s*(void|boolean|string|number|Promise)', ', _$1: $2) => $3'
        
        # 2. Corriger any[] -> unknown[]
        if ($content -match ':\s*any\[\]') {
            $content = $content -replace ':\s*any\[\]', ': unknown[]'
            $stats.anyTypesFixed++
        }
        
        # 3. Corriger Record<string, any> -> Record<string, unknown>
        if ($content -match 'Record<string,\s*any>') {
            $content = $content -replace 'Record<string,\s*any>', 'Record<string, unknown>'
            $stats.anyTypesFixed++
        }
        
        # 4. Corriger ?: any -> ?: unknown  
        if ($content -match '\?:\s*any\b') {
            $content = $content -replace '\?:\s*any\b(?!where)', '?: unknown'
            $stats.anyTypesFixed++
        }
        
        # 5. Renommer les variables inutilisées qui commencent par const/let
        # Pattern: const variableName = 
        $matches = [regex]::Matches($content, "(?:const|let)\s+([a-zA-Z]\w*)\s*=")
        foreach ($match in $matches) {
            $varName = $match.Groups[1].Value
            # Ne pas renommer si déjà préfixé par _
            if ($varName -notmatch "^_") {
                # Compter les occurrences de la variable
                $usageCount = ([regex]::Matches($content, "\b$varName\b")).Count
                # Si utilisée seulement 1 fois (la déclaration), la renommer
                if ($usageCount -eq 1) {
                    $content = $content -replace "\b$varName\b", "_$varName"
                    $stats.unusedVarsFixed++
                }
            }
        }
        
        # Sauvegarder si modifié
        if ($content -ne $originalContent) {
            $content | Set-Content $file.FullName -NoNewline -ErrorAction Stop
            $stats.modifiedFiles++
        }
    }
    catch {
        Write-Host "⚠ Erreur avec $($file.Name): $_" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Correction terminée!" -ForegroundColor Green
Write-Host "📊 Statistiques:" -ForegroundColor Cyan
Write-Host "  - Fichiers traités: $($stats.totalFiles)" -ForegroundColor White
Write-Host "  - Fichiers modifiés: $($stats.modifiedFiles)" -ForegroundColor Green
Write-Host "  - Types 'any' corrigés: $($stats.anyTypesFixed)" -ForegroundColor Yellow
Write-Host "  - Variables inutilisées corrigées: $($stats.unusedVarsFixed)" -ForegroundColor Yellow

Write-Host "`n🔍 Vérification ESLint..." -ForegroundColor Cyan
npm run lint 2>&1 | Select-String "problems" | ForEach-Object {
    Write-Host $_ -ForegroundColor Magenta
}
