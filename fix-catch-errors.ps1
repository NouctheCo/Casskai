# Script PowerShell pour corriger les catch blocks avec variables error non définies
# Cet script traite les patterns: catch (_error) { ... error ... } -> catch (error) { ... }

# Répertoires à traiter
$srcPath = "c:\Users\noutc\Casskai\src"
$files = Get-ChildItem -Path $srcPath -Recurse -Include "*.ts", "*.tsx"

$totalFiles = $files.Count
$correctedFiles = 0
$catchBlocksFixed = 0

Write-Host "Démarrage du traitement de $totalFiles fichiers..." -ForegroundColor Green

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content

    # Pattern 1: catch (_error) { ... error ... } -> catch (error) { ... }
    # Remplace catch (_error) ou catch (_err) ou similaire par catch (error)
    $content = $content -replace 'catch \(_(?:error|err|_?)\)\s*\{', 'catch (error) {'

    # Maintenant trouver les lignes avec "console.error(...error" ou "throw error" etc.
    # et ajouter la vérification instanceof si nécessaire

    if ($content -ne $originalContent) {
        Set-Content $file.FullName -Value $content
        $correctedFiles++

        # Compter les changements
        $originalCount = ($originalContent | Select-String 'catch \(_' | Measure-Object -Line).Lines
        $catchBlocksFixed += $originalCount

        Write-Host "✓ Corrigé: $($file.Name)" -ForegroundColor Cyan
    }
}

Write-Host "`nRésumé:" -ForegroundColor Yellow
Write-Host "Fichiers traités: $totalFiles"
Write-Host "Fichiers corrigés: $correctedFiles"
Write-Host "Catch blocks corrigés: $catchBlocksFixed"
