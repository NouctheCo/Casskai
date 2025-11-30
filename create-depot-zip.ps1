# Script de création du ZIP pour dépôt APP
Write-Host "[1/6] Création du dossier temporaire..." -ForegroundColor Cyan

# Nettoyer si existe déjà
if (Test-Path "DEPOT_APP_TEMP") {
    Remove-Item -Path "DEPOT_APP_TEMP" -Recurse -Force
}

New-Item -ItemType Directory -Path "DEPOT_APP_TEMP\casskai" -Force | Out-Null

Write-Host "[2/6] Copie des fichiers sources..." -ForegroundColor Cyan

# Liste des dossiers à copier
$foldersToInclude = @(
    "src",
    "public",
    "supabase"
)

# Copier les dossiers
foreach ($folder in $foldersToInclude) {
    if (Test-Path $folder) {
        Write-Host "  Copie de $folder..." -ForegroundColor Gray
        Copy-Item -Path $folder -Destination "DEPOT_APP_TEMP\casskai\$folder" -Recurse -Force
    }
}

Write-Host "[3/6] Copie des fichiers de configuration..." -ForegroundColor Cyan

# Liste des fichiers à copier
$filesToInclude = @(
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "tsconfig.node.json",
    "vite.config.ts",
    "tailwind.config.js",
    "postcss.config.js",
    "index.html",
    ".env.example",
    "README.md",
    "LICENSE",
    "LICENSE_AUDIT_REPORT.md",
    "CLAUDE.md",
    "deploy-vps.ps1",
    ".gitignore",
    "eslint.config.js",
    "playwright.config.ts"
)

foreach ($file in $filesToInclude) {
    if (Test-Path $file) {
        Write-Host "  Copie de $file..." -ForegroundColor Gray
        Copy-Item -Path $file -Destination "DEPOT_APP_TEMP\casskai\$file" -Force
    }
}

Write-Host "[4/6] Création de l'archive ZIP..." -ForegroundColor Cyan
$zipName = "casskai-app-v1.0.0-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
Compress-Archive -Path "DEPOT_APP_TEMP\casskai\*" -DestinationPath $zipName -Force -CompressionLevel Optimal

Write-Host "[5/6] Vérification de la taille..." -ForegroundColor Cyan
$zipSize = (Get-Item $zipName).Length / 1MB
Write-Host "  Taille du ZIP: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Green

if ($zipSize -gt 50) {
    Write-Host "  ATTENTION: Le fichier dépasse 50 MB!" -ForegroundColor Red
} else {
    Write-Host "  OK: Taille inférieure à 50 MB" -ForegroundColor Green
}

Write-Host "[6/6] Nettoyage..." -ForegroundColor Cyan
Remove-Item -Path "DEPOT_APP_TEMP" -Recurse -Force

Write-Host "`n[SUCCESS] Archive créée: $zipName" -ForegroundColor Green
Write-Host "Pour DEPOT_APP, renommez en: casskai-app-v1.0.0.zip" -ForegroundColor Yellow