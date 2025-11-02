# Script de correction progressive des warnings ESLint
# Traite UN type de warning à la fois avec validation

$ErrorActionPreference = "Stop"
$workspaceRoot = "C:\Users\noutc\Casskai"
Set-Location $workspaceRoot

Write-Host "=== Correction Progressive des Warnings ESLint ===" -ForegroundColor Cyan
Write-Host ""

# Fonction pour vérifier que le build fonctionne toujours
function Test-BuildStillWorks {
    Write-Host "Vérification du build..." -ForegroundColor Yellow
    $result = npm run type-check 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERREUR: Le build est cassé!" -ForegroundColor Red
        Write-Host $result
        return $false
    }
    Write-Host "✅ Build OK" -ForegroundColor Green
    return $true
}

# Fonction pour compter les warnings
function Get-WarningCount {
    $lintOutput = npm run lint 2>&1 | Out-String
    if ($lintOutput -match '(\d+) problems \((\d+) errors, (\d+) warnings\)') {
        return [int]$matches[3]
    }
    return 0
}

# Sauvegarde du commit actuel
$initialCommit = git rev-parse HEAD
$initialWarnings = Get-WarningCount
Write-Host "Point de départ: $initialWarnings warnings" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# ÉTAPE 1: Correction des unused vars dans les paramètres de type signatures
# ============================================================================
Write-Host "ÉTAPE 1: Préfixer les paramètres inutilisés dans les type signatures" -ForegroundColor Magenta
Write-Host "Pattern: (param: Type) => void  →  (_param: Type) => void" -ForegroundColor Gray

$files = Get-ChildItem -Path src -Include *.ts,*.tsx -Recurse -File

$step1Count = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Pattern 1: Interface method signatures avec params non utilisés
    # Exemple: method: (param: Type) => void
    $content = $content -replace '\(([a-zA-Z][a-zA-Z0-9]*):([^)]+)\)\s*=>', '(_$1:$2) =>'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $step1Count++
        Write-Host "  ✓ $($file.FullName.Replace($workspaceRoot, ''))" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Modifié: $step1Count fichiers" -ForegroundColor Yellow

if ($step1Count -gt 0) {
    Write-Host "Validation..." -ForegroundColor Yellow
    if (Test-BuildStillWorks) {
        $newWarnings = Get-WarningCount
        $reduction = $initialWarnings - $newWarnings
        Write-Host "Réduction: $reduction warnings ($newWarnings restants)" -ForegroundColor Cyan
        
        git add -A
        git commit -m "fix(lint): prefix unused params in type signatures - $reduction warnings eliminated"
        Write-Host "✅ Commit créé" -ForegroundColor Green
        $initialWarnings = $newWarnings
    } else {
        Write-Host "❌ Rollback de l'étape 1" -ForegroundColor Red
        git reset --hard $initialCommit
        exit 1
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# ÉTAPE 2: Remplacer Record<string, any> par Record<string, unknown>
# ============================================================================
Write-Host "ÉTAPE 2: Remplacer Record<string, any> → Record<string, unknown>" -ForegroundColor Magenta

$step2Count = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Record<string, any> → Record<string, unknown>
    $content = $content -replace 'Record<string,\s*any>', 'Record<string, unknown>'
    $content = $content -replace 'Record<string,any>', 'Record<string, unknown>'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $step2Count++
        Write-Host "  ✓ $($file.FullName.Replace($workspaceRoot, ''))" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Modifié: $step2Count fichiers" -ForegroundColor Yellow

if ($step2Count -gt 0) {
    Write-Host "Validation..." -ForegroundColor Yellow
    if (Test-BuildStillWorks) {
        $newWarnings = Get-WarningCount
        $reduction = $initialWarnings - $newWarnings
        Write-Host "Réduction: $reduction warnings ($newWarnings restants)" -ForegroundColor Cyan
        
        git add -A
        git commit -m "fix(lint): replace Record<string, any> with Record<string, unknown> - $reduction warnings eliminated"
        Write-Host "✅ Commit créé" -ForegroundColor Green
        $initialWarnings = $newWarnings
    } else {
        Write-Host "❌ Rollback de l'étape 2" -ForegroundColor Red
        git reset --hard $initialCommit
        exit 1
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# ÉTAPE 3: Ajouter préfixe _ aux variables déclarées mais non utilisées
# ============================================================================
Write-Host "ÉTAPE 3: Préfixer les variables inutilisées avec _" -ForegroundColor Magenta
Write-Host "Pattern: const name = ... (non utilisé) → const _name = ..." -ForegroundColor Gray

# Cette étape est plus complexe et risquée, on la saute pour l'instant
Write-Host "⚠️  SAUTÉE - Nécessite analyse contextuelle" -ForegroundColor Yellow

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# ÉTAPE 4: Ajouter eslint-disable pour les cas légitimes
# ============================================================================
Write-Host "ÉTAPE 4: Ajouter eslint-disable pour paramètres intentionnellement inutilisés" -ForegroundColor Magenta

# Parse le lint output pour identifier les fichiers avec le plus de warnings
Write-Host "Analyse du lint output..." -ForegroundColor Yellow
$lintFull = npm run lint 2>&1 | Out-String

# Extraire les fichiers avec warnings de paramètres dans callbacks
$filesWithParamWarnings = @()
if ($lintFull -match "(?m)^\s+\d+:\d+\s+warning\s+'[^']+' is defined but never used.*no-unused-vars") {
    Write-Host "Paramètres de callbacks détectés - nécessite traitement manuel" -ForegroundColor Yellow
}

Write-Host "⚠️  SAUTÉE - Nécessite analyse cas par cas" -ForegroundColor Yellow

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# RÉSUMÉ FINAL
# ============================================================================
$finalWarnings = Get-WarningCount
$totalReduction = ($initialWarnings - $finalWarnings)

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "                   RÉSUMÉ FINAL                    " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Warnings éliminés: $totalReduction" -ForegroundColor Green
Write-Host "Warnings restants: $finalWarnings" -ForegroundColor $(if ($finalWarnings -eq 0) { "Green" } else { "Yellow" })
Write-Host ""

if ($finalWarnings -gt 0) {
    Write-Host "Pour continuer:" -ForegroundColor Cyan
    Write-Host "  1. Traiter manuellement les fichiers avec le plus de warnings" -ForegroundColor Gray
    Write-Host "  2. Refactorer les fonctions trop complexes (complexity warnings)" -ForegroundColor Gray
    Write-Host "  3. Découper les fichiers trop longs (max-lines warnings)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Script terminé!" -ForegroundColor Green
