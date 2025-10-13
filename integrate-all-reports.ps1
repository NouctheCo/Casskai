# Script PowerShell pour intégrer automatiquement TOUS les générateurs de rapports

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "   INTÉGRATION COMPLÈTE DES 8 RAPPORTS MANQUANTS" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

$errors = @()

# ============================================================================
# ÉTAPE 1: Intégrer les services dans reportsService.ts
# ============================================================================

Write-Host "📦 ÉTAPE 1/3: Intégration des services dans reportsService.ts" -ForegroundColor Yellow
Write-Host ""

$extensionsFile = "src/services/reportsServiceExtensions.ts"
$targetFile = "src/services/reportsService.ts"

if (-not (Test-Path $extensionsFile)) {
    Write-Host "❌ Fichier $extensionsFile introuvable!" -ForegroundColor Red
    $errors += "Extensions service not found"
} elseif (-not (Test-Path $targetFile)) {
    Write-Host "❌ Fichier $targetFile introuvable!" -ForegroundColor Red
    $errors += "Target service file not found"
} else {
    $targetContent = Get-Content $targetFile -Raw

    if ($targetContent -match "generateAgedReceivables") {
        Write-Host "⚠️  Les services semblent déjà intégrés!" -ForegroundColor Yellow
    } else {
        # Lire les méthodes à intégrer
        $extensionsContent = Get-Content $extensionsFile -Raw

        # Extraire seulement les méthodes (après les imports)
        $methodsStart = $extensionsContent.IndexOf("/**`n * 1. Clients")
        if ($methodsStart -gt 0) {
            $methodsContent = $extensionsContent.Substring($methodsStart)

            # Convertir "export async function" en "async"
            $methodsContent = $methodsContent -replace 'export async function ', '  async '

            # Trouver position d'insertion
            $insertPosition = $targetContent.LastIndexOf("}`n`nexport const reportsService")

            if ($insertPosition -eq -1) {
                Write-Host "❌ Position d'insertion introuvable!" -ForegroundColor Red
                $errors += "Insert position not found"
            } else {
                $newContent = $targetContent.Substring(0, $insertPosition) + "`n`n  // ==================== NOUVEAUX RAPPORTS ====================`n" + $methodsContent + "`n" + $targetContent.Substring($insertPosition)
                $newContent | Set-Content $targetFile -Encoding UTF8
                Write-Host "✅ Services intégrés avec succès!" -ForegroundColor Green
            }
        }
    }
}

Write-Host ""

# ============================================================================
# ÉTAPE 2: Intégrer les générateurs PDF
# ============================================================================

Write-Host "📄 ÉTAPE 2/3: Intégration des générateurs PDF dans pdfGenerator.ts" -ForegroundColor Yellow
Write-Host ""

$pdfExtFile = "src/utils/reportGeneration/core/pdfGeneratorExtensions.ts"
$pdfTargetFile = "src/utils/reportGeneration/core/pdfGenerator.ts"

if (-not (Test-Path $pdfExtFile)) {
    Write-Host "❌ Fichier $pdfExtFile introuvable!" -ForegroundColor Red
    $errors += "PDF extensions not found"
} elseif (-not (Test-Path $pdfTargetFile)) {
    Write-Host "❌ Fichier $pdfTargetFile introuvable!" -ForegroundColor Red
    $errors += "PDF target file not found"
} else {
    $pdfTargetContent = Get-Content $pdfTargetFile -Raw

    if ($pdfTargetContent -match "generateCashFlowStatement.*:.*PDFGenerator") {
        Write-Host "⚠️  Les générateurs PDF semblent déjà intégrés!" -ForegroundColor Yellow
    } else {
        $pdfExtContent = Get-Content $pdfExtFile -Raw

        # Extraire les méthodes
        $methodsStart = $pdfExtContent.IndexOf("/**`n * 1. Flux")
        if ($methodsStart -gt 0) {
            $pdfMethods = $pdfExtContent.Substring($methodsStart)

            # Convertir en méthodes de classe (ajouter indentation)
            $pdfMethods = $pdfMethods -replace '^', '  ' -replace '`n', "`n  "

            # Trouver la position d'insertion (avant le dernier })
            $lastBrace = $pdfTargetContent.LastIndexOf("}`n")

            if ($lastBrace -eq -1) {
                Write-Host "❌ Impossible de trouver la fin de la classe!" -ForegroundColor Red
                $errors += "PDF insert position not found"
            } else {
                $newPdfContent = $pdfTargetContent.Substring(0, $lastBrace) + "`n`n  // ==================== NOUVEAUX RAPPORTS PDF ====================`n" + $pdfMethods + "`n" + $pdfTargetContent.Substring($lastBrace)
                $newPdfContent | Set-Content $pdfTargetFile -Encoding UTF8
                Write-Host "✅ Générateurs PDF intégrés avec succès!" -ForegroundColor Green
            }
        }
    }
}

Write-Host ""

# ============================================================================
# ÉTAPE 3: Intégrer les générateurs Excel
# ============================================================================

Write-Host "📊 ÉTAPE 3/3: Intégration des générateurs Excel dans excelGenerator.ts" -ForegroundColor Yellow
Write-Host ""

$excelExtFile = "src/utils/reportGeneration/core/excelGeneratorExtensions.ts"
$excelTargetFile = "src/utils/reportGeneration/core/excelGenerator.ts"

if (-not (Test-Path $excelExtFile)) {
    Write-Host "❌ Fichier $excelExtFile introuvable!" -ForegroundColor Red
    $errors += "Excel extensions not found"
} elseif (-not (Test-Path $excelTargetFile)) {
    Write-Host "❌ Fichier $excelTargetFile introuvable!" -ForegroundColor Red
    $errors += "Excel target file not found"
} else {
    $excelTargetContent = Get-Content $excelTargetFile -Raw

    if ($excelTargetContent -match "generateCashFlowStatement.*:.*Promise<Blob>") {
        Write-Host "⚠️  Les générateurs Excel semblent déjà intégrés!" -ForegroundColor Yellow
    } else {
        $excelExtContent = Get-Content $excelExtFile -Raw

        # Extraire les méthodes
        $methodsStart = $excelExtContent.IndexOf("/**`n * 1. Flux")
        if ($methodsStart -gt 0) {
            $excelMethods = $excelExtContent.Substring($methodsStart)

            # Convertir en méthodes de classe
            $excelMethods = $excelMethods -replace '^', '  ' -replace '`n', "`n  "

            # Trouver la position d'insertion
            $lastBrace = $excelTargetContent.LastIndexOf("}`n")

            if ($lastBrace -eq -1) {
                Write-Host "❌ Impossible de trouver la fin de la classe!" -ForegroundColor Red
                $errors += "Excel insert position not found"
            } else {
                $newExcelContent = $excelTargetContent.Substring(0, $lastBrace) + "`n`n  // ==================== NOUVEAUX RAPPORTS EXCEL ====================`n" + $excelMethods + "`n" + $excelTargetContent.Substring($lastBrace)
                $newExcelContent | Set-Content $excelTargetFile -Encoding UTF8
                Write-Host "✅ Générateurs Excel intégrés avec succès!" -ForegroundColor Green
            }
        }
    }
}

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan

# Résumé
if ($errors.Count -eq 0) {
    Write-Host "✅ INTÉGRATION RÉUSSIE!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Prochaines étapes:" -ForegroundColor Cyan
    Write-Host "  1. Vérifier la compilation: npm run type-check" -ForegroundColor White
    Write-Host "  2. Ajouter les switch cases dans OptimizedReportsTab.tsx" -ForegroundColor White
    Write-Host "  3. Tester les rapports: npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "📄 Voir docs/FINAL_INTEGRATION_GUIDE.md pour les switch cases à ajouter" -ForegroundColor Yellow
} else {
    Write-Host "❌ ERREURS RENCONTRÉES:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "Veuillez corriger les erreurs et relancer le script." -ForegroundColor Yellow
}

Write-Host "====================================================================" -ForegroundColor Cyan
