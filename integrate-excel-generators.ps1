# Script pour integrer les 8 generateurs Excel dans excelGenerator.ts

$targetFile = "c:\Users\noutc\Casskai\src\utils\reportGeneration\core\excelGenerator.ts"
$extensionsFile = "c:\Users\noutc\Casskai\src\utils\reportGeneration\core\excelGeneratorExtensions.ts"

Write-Host "Lecture des fichiers..." -ForegroundColor Cyan

# Lire le contenu du fichier extensions
$extensionsContent = Get-Content $extensionsFile -Raw

# Extraire les 8 methodes (generateCashFlowStatement a generateTaxSummary)
$methodsToAdd = $extensionsContent -replace '(?s)^.*?(?=public static async generateCashFlowStatement)', '' `
                                   -replace '(?s)\}[\r\n]*$', ''

# Lire le fichier cible
$targetContent = Get-Content $targetFile -Raw

# Trouver le dernier "}" de la classe
$lastBrace = $targetContent.LastIndexOf('}')

# Inserer les methodes avant le dernier "}"
$newContent = $targetContent.Substring(0, $lastBrace) + "`n" + $methodsToAdd + "`n}"

Write-Host "Ecriture du fichier avec les 8 nouveaux generateurs Excel..." -ForegroundColor Cyan

# Ecrire le nouveau contenu
Set-Content -Path $targetFile -Value $newContent -NoNewline

Write-Host "Integration des 8 generateurs Excel terminee!" -ForegroundColor Green
Write-Host "Fichier modifie: $targetFile" -ForegroundColor Yellow
