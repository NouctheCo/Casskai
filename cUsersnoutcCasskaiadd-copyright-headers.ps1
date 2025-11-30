# Script pour ajouter les headers de copyright NOUTCHE CONSEIL

$header = @"
/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

"@

$cssHeader = @"
/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

"@

function Add-CopyrightHeader {
    param(
        [string]$FilePath,
        [string]$Header
    )
    
    # Lire le contenu du fichier
    $content = Get-Content -Path $FilePath -Raw
    
    # Vérifier si le header est déjà présent
    if ($content -match "Copyright.*NOUTCHE CONSEIL") {
        Write-Host "✓ Header already present: $FilePath" -ForegroundColor Green
        return $false
    }
    
    # Ajouter le header
    $newContent = $Header + $content
    Set-Content -Path $FilePath -Value $newContent -NoNewline
    Write-Host "✅ Header added: $FilePath" -ForegroundColor Cyan
    return $true
}

# Compteurs
$filesModified = 0
$filesSkipped = 0

Write-Host "`n🔧 Adding copyright headers to CassKai source files...`n" -ForegroundColor Yellow

# Fichiers prioritaires
$priorityFiles = @(
    "src/main.tsx",
    "src/App.tsx",
    "src/AppRouter.tsx",
    "src/lib/supabase.ts",
    "src/contexts/AuthContext.tsx"
)

Write-Host "📌 Processing priority files..." -ForegroundColor Yellow
foreach ($file in $priorityFiles) {
    $fullPath = Join-Path (Get-Location) $file
    if (Test-Path $fullPath) {
        if (Add-CopyrightHeader -FilePath $fullPath -Header $header) {
            $filesModified++
        } else {
            $filesSkipped++
        }
    }
}

# Services
Write-Host "`n📁 Processing services..." -ForegroundColor Yellow
Get-ChildItem -Path "src/services" -Filter "*.ts" -Recurse | ForEach-Object {
    if (Add-CopyrightHeader -FilePath $_.FullName -Header $header) {
        $filesModified++
    } else {
        $filesSkipped++
    }
}

# Contexts
Write-Host "`n📁 Processing contexts..." -ForegroundColor Yellow
Get-ChildItem -Path "src/contexts" -Filter "*.tsx" -Recurse | ForEach-Object {
    if (Add-CopyrightHeader -FilePath $_.FullName -Header $header) {
        $filesModified++
    } else {
        $filesSkipped++
    }
}

# Pages
Write-Host "`n📁 Processing pages..." -ForegroundColor Yellow
Get-ChildItem -Path "src/pages" -Filter "*.tsx" -Recurse | ForEach-Object {
    if (Add-CopyrightHeader -FilePath $_.FullName -Header $header) {
        $filesModified++
    } else {
        $filesSkipped++
    }
}

# Components (layout uniquement pour éviter trop de modifications)
Write-Host "`n📁 Processing layout components..." -ForegroundColor Yellow
if (Test-Path "src/components/layout") {
    Get-ChildItem -Path "src/components/layout" -Filter "*.tsx" -Recurse | ForEach-Object {
        if (Add-CopyrightHeader -FilePath $_.FullName -Header $header) {
            $filesModified++
        } else {
            $filesSkipped++
        }
    }
}

# Hooks principaux
Write-Host "`n📁 Processing hooks..." -ForegroundColor Yellow
Get-ChildItem -Path "src/hooks" -Filter "*.ts" -Recurse | ForEach-Object {
    if (Add-CopyrightHeader -FilePath $_.FullName -Header $header) {
        $filesModified++
    } else {
        $filesSkipped++
    }
}

# CSS principal
Write-Host "`n📁 Processing CSS files..." -ForegroundColor Yellow
if (Test-Path "src/index.css") {
    if (Add-CopyrightHeader -FilePath "src/index.css" -Header $cssHeader) {
        $filesModified++
    } else {
        $filesSkipped++
    }
}

# Résumé
Write-Host "`n" -NoNewline
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Copyright headers added successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Files modified: $filesModified" -ForegroundColor Cyan
Write-Host "Files skipped (already had header): $filesSkipped" -ForegroundColor Yellow
Write-Host "`nTotal files processed: $($filesModified + $filesSkipped)" -ForegroundColor White
Write-Host "`n"
