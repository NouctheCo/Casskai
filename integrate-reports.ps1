# Script PowerShell pour intégrer automatiquement les nouvelles méthodes de rapports

Write-Host "🔧 Intégration des 6 nouveaux rapports dans reportsService.ts..." -ForegroundColor Cyan

# Lire le fichier source
$extensionsFile = "src/services/reportsServiceExtensions.ts"
$targetFile = "src/services/reportsService.ts"

if (-not (Test-Path $extensionsFile)) {
    Write-Host "❌ Fichier $extensionsFile introuvable!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $targetFile)) {
    Write-Host "❌ Fichier $targetFile introuvable!" -ForegroundColor Red
    exit 1
}

# Lire le contenu des extensions (seulement les méthodes, pas les imports/exports)
$extensionsContent = Get-Content $extensionsFile -Raw

# Extraire uniquement les 6 méthodes async (sans les imports)
$methodsPattern = '(?s)/\*\*\s*\* \d+\.\s.*?\s*\*/\s*export async function generate.*?(?=(?:/\*\*\s*\* \d+\.|$))'
$methods = [regex]::Matches($extensionsContent, $methodsPattern)

Write-Host "✅ Trouvé $($methods.Count) méthodes à intégrer" -ForegroundColor Green

# Lire le fichier cible
$targetContent = Get-Content $targetFile -Raw

# Vérifier si les méthodes sont déjà intégrées
if ($targetContent -match "generateAgedReceivables") {
    Write-Host "⚠️  Les méthodes semblent déjà intégrées!" -ForegroundColor Yellow
    $response = Read-Host "Voulez-vous continuer quand même? (o/n)"
    if ($response -ne 'o') {
        Write-Host "❌ Annulé par l'utilisateur" -ForegroundColor Red
        exit 0
    }
}

# Convertir les fonctions export en méthodes de classe
$classMethodsText = "`n`n  // ==================== NOUVEAUX RAPPORTS ====================`n"

foreach ($method in $methods) {
    $methodText = $method.Value

    # Convertir "export async function generateXXX" en "async generateXXX"
    $methodText = $methodText -replace 'export async function ', '  async '

    # Ajouter au texte des méthodes
    $classMethodsText += "`n$methodText`n"
}

# Trouver la position d'insertion (juste avant le dernier "}")
$insertPosition = $targetContent.LastIndexOf("}`n`nexport const reportsService")

if ($insertPosition -eq -1) {
    Write-Host "❌ Impossible de trouver la position d'insertion!" -ForegroundColor Red
    exit 1
}

# Insérer les nouvelles méthodes
$newContent = $targetContent.Substring(0, $insertPosition) + $classMethodsText + $targetContent.Substring($insertPosition)

# Sauvegarder dans le fichier
$newContent | Set-Content $targetFile -Encoding UTF8

Write-Host "✅ Méthodes intégrées avec succès dans $targetFile!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "  1. Vérifier la compilation: npm run type-check" -ForegroundColor White
Write-Host "  2. Ajouter les switch cases dans OptimizedReportsTab.tsx" -ForegroundColor White
Write-Host "  3. Voir docs/COMPLETE_ALL_REPORTS_INSTRUCTIONS.md pour la suite" -ForegroundColor White
