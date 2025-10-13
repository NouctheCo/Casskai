# Script pour integrer les 7 generateurs PDF restants dans pdfGenerator.ts

$targetFile = "c:\Users\noutc\Casskai\src\utils\reportGeneration\core\pdfGenerator.ts"
$extensionsFile = "c:\Users\noutc\Casskai\src\utils\reportGeneration\core\pdfGeneratorExtensions.ts"

Write-Host "Lecture des fichiers..." -ForegroundColor Cyan

# Lire le contenu du fichier extensions (lignes 70-473 qui contiennent les 7 methodes restantes)
$extensionsContent = Get-Content $extensionsFile -Raw

# Extraire les 7 methodes restantes (generateAgedReceivables a generateTaxSummary)
$methodsToAdd = $extensionsContent -replace '(?s)^.*?(?=public static generateAgedReceivables)', '' `
                                   -replace '(?s)\}[\r\n]*$', ''

# Lire le fichier cible
$targetContent = Get-Content $targetFile -Raw

# Trouver le dernier "}" de la classe (avant le dernier "}" du fichier)
$lastBrace = $targetContent.LastIndexOf('}')

# Inserer les methodes avant le dernier "}"
$newContent = $targetContent.Substring(0, $lastBrace) + "`n" + $methodsToAdd + "`n}"

Write-Host "Ecriture du fichier avec les 7 nouveaux generateurs PDF..." -ForegroundColor Cyan

# Ecrire le nouveau contenu
Set-Content -Path $targetFile -Value $newContent -NoNewline

Write-Host "Integration des 7 generateurs PDF terminee!" -ForegroundColor Green
Write-Host "Fichier modifie: $targetFile" -ForegroundColor Yellow
