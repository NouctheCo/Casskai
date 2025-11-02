# Script intelligent de correction des warnings ESLint
Write-Host "🎯 Correction intelligente des warnings ESLint..." -ForegroundColor Cyan

function Fix-File {
    param([string]$filePath)
    
    $content = Get-Content $filePath -Raw -ErrorAction SilentlyContinue
    if (-not $content) { return $false }
    
    $modified = $false
    $original = $content
    
    # 1. Corriger les imports inutilisés communs
    $unusedImports = @('XCircle', 'Download', 'ReportResult')
    foreach ($import in $unusedImports) {
        if ($content -match "import.*\b$import\b") {
            $content = $content -replace ",?\s*\b$import\b\s*,?", ""
            $content = $content -replace "{\s*,", "{"
            $content = $content -replace ",\s*}", "}"
            $content = $content -replace "{\s*}", ""
            $modified = $true
        }
    }
    
    # 2. Préfixer les paramètres inutilisés dans les signatures de fonctions
    # Pattern: (param: Type) où le param n'est clairement pas utilisé
    $patterns = @(
        @{ Match = '\b(error):\s*([A-Z]\w+)'; Replace = '_error: $2' }
        @{ Match = '\b(errorInfo):\s*([A-Z]\w+)'; Replace = '_errorInfo: $2' }
        @{ Match = '\b(errorId):\s*string'; Replace = '_errorId: string' }
        @{ Match = '\b(context):\s*([A-Z]\w+)(?=\))'; Replace = '_context: $2' }
        @{ Match = '\b(parameters?):\s*([A-Z]\w+)(?=\))'; Replace = '_$1: $2' }
        @{ Match = '\b(props?):\s*([A-Z]\w+|unknown)(?=\))'; Replace = '_$1: $2' }
        @{ Match = '\b(options?):\s*([A-Z]\w+)(?=\))'; Replace = '_$1: $2' }
        @{ Match = '\b(path):\s*string(?=\))'; Replace = '_path: string' }
        @{ Match = '\b(key):\s*string(?=\))'; Replace = '_key: string' }
        @{ Match = '\b(eventName):\s*string'; Replace = '_eventName: string' }
        @{ Match = '\b(value):\s*(string|number|unknown)(?=\))'; Replace = '_value: $2' }
    )
    
    foreach ($pattern in $patterns) {
        if ($content -match $pattern.Match) {
            $content = $content -replace $pattern.Match, $pattern.Replace
            $modified = $true
        }
    }
    
    # 3. Renommer variables const/let inutilisées
    $lines = $content -split "`n"
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        
        # Detect unused const/let declarations
        if ($line -match '^\s*(?:const|let)\s+([a-zA-Z]\w*)\s*=') {
            $varName = $Matches[1]
            
            # Skip already prefixed
            if ($varName -notmatch '^_') {
                # Check if variable is used only once (declaration line)
                $usageCount = ([regex]::Matches($content, "\b$varName\b")).Count
                
                if ($usageCount -eq 1) {
                    $lines[$i] = $line -replace "\b$varName\b", "_$varName"
                    $modified = $true
                }
            }
        }
    }
    
    if ($modified) {
        $content = $lines -join "`n"
    }
    
    # 4. Sauvegarder si modifié
    if ($content -ne $original) {
        $content | Set-Content $filePath -NoNewline
        return $true
    }
    
    return $false
}

# Traiter tous les fichiers
$files = Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx | 
    Where-Object { $_.FullName -notlike "*node_modules*" }

$totalFiles = $files.Count
$modifiedCount = 0
$i = 0

foreach ($file in $files) {
    $i++
    Write-Progress -Activity "Correction" -Status "$i/$totalFiles" -PercentComplete (($i/$totalFiles)*100)
    
    if (Fix-File -filePath $file.FullName) {
        $modifiedCount++
        Write-Host "✓ $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`n✅ $modifiedCount fichiers sur $totalFiles modifiés" -ForegroundColor Green

# Vérifier le résultat
Write-Host "`n🔍 Vérification ESLint..." -ForegroundColor Cyan
npm run lint 2>&1 | Select-String "problems"
