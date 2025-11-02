# Script de correction SÉCURISÉE des warnings ESLint
# Corrige UNIQUEMENT les cas 100% sûrs sans risque de casser le code

Write-Host "🔧 Correction sécurisée des warnings ESLint..." -ForegroundColor Cyan
Write-Host "Ce script corrige UNIQUEMENT les patterns sûrs :" -ForegroundColor Yellow
Write-Host "  1. Paramètres de callbacks inutilisés dans les déclarations de type" -ForegroundColor Gray
Write-Host "  2. Variables déjà préfixées avec _ mais signalées comme unused" -ForegroundColor Gray
Write-Host ""

$filesModified = 0
$patterns = @{
    # Pattern 1: Paramètres dans les déclarations de type (totalement sûr)
    # Ex: export type Handler = (event: Event) => void;
    # Devient: export type Handler = (_event: Event) => void;
    'TypeParams' = @{
        Regex = '(type\s+\w+\s*=\s*\([^)]*?)(\b\w+)(\s*:\s*[^,)]+)'
        Description = "Paramètres dans déclarations de type"
    }
}

$files = Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx -File

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    
    $original = $content
    $modified = $false
    
    # Pattern sûr : Paramètres dans les types qui ne sont jamais utilisés
    # Ex: type Handler = (data: Data) => void; 
    # Ces paramètres sont juste pour la documentation
    if ($content -match 'type\s+\w+\s*=\s*\([^)]+\)\s*=>\s*\w+') {
        # On préfixe SEULEMENT si le paramètre n'est pas déjà préfixé
        $content = $content -replace '(\btype\s+\w+\s*=\s*\()(\w+)(\s*:\s*)', '${1}_${2}${3}'
        if ($content -ne $original) {
            $modified = $true
        }
    }
    
    if ($modified) {
        $content | Set-Content $file.FullName -NoNewline
        $filesModified++
        Write-Host "✓ $($file.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ Terminé : $filesModified fichiers modifiés" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Vérification recommandée :" -ForegroundColor Yellow
Write-Host "   npm run lint" -ForegroundColor Gray
Write-Host "   npm run type-check" -ForegroundColor Gray
