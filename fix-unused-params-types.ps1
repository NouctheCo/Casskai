# Script pour corriger les paramètres inutilisés dans les définitions de types
Write-Host "🔧 Correction des paramètres inutilisés dans les types..." -ForegroundColor Cyan

$typeFiles = Get-ChildItem -Path "src/types" -Recurse -Filter *.ts

foreach ($file in $typeFiles) {
    $content = Get-Content $file.FullName -Raw
    
    if (-not $content) {
        continue
    }
    
    $originalContent = $content
    
    # Patterns pour les signatures de méthodes dans les interfaces/types
    # Remplacer (param: Type) par (_param: Type) si pas de corps de fonction
    $content = $content -replace '\((\w+):\s*([^)]+)\)(?=\s*[=:]?\s*(?:=>|Promise|void|boolean|string|number))', '(_$1: $2)'
    
    # Correction spécifique pour les handlers
    $content = $content -replace 'handler:\s*\(\.\.\.(args):\s*', 'handler: (..._args: '
    
    # Correction des paramètres de constructeurs publics inutilisés
    $content = $content -replace 'public\s+(\w+):', 'public _$1:'
    
    if ($content -ne $originalContent) {
        $content | Set-Content $file.FullName -NoNewline
        Write-Host "✓ Modifié: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`n✅ Correction des types terminée!" -ForegroundColor Green
