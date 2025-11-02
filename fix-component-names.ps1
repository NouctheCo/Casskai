# Script de correction massive des noms de composants supprimés
Write-Host "🔧 Correction des composants supprimés par erreur..." -ForegroundColor Cyan

$files = Get-ChildItem -Path "src" -Recurse -Include *.tsx,*.ts

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    
    if (-not $content) { continue }
    
    $original = $content
    
    # Corriger les balises JSX où le nom du composant a été supprimé
    # Pattern: <className= devient <ComponentName className=
    $content = $content -replace '<className="([^"]+)"\s*/>', '<div className="$1" />'
    $content = $content -replace '<className="([^"]+)">', '<div className="$1">'
    
    if ($content -ne $original) {
        $content | Set-Content $file.FullName -NoNewline
        Write-Host "✓ $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`n✅ Terminé!" -ForegroundColor Green
