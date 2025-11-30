# Script d'organisation du dossier DEPOT_APP
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ORGANISATION DU DÉPÔT APP - CASSKAI  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Nettoyer si existe
if (Test-Path "DEPOT_APP") {
    Write-Host "[CLEAN] Suppression de l'ancien dossier DEPOT_APP..." -ForegroundColor Yellow
    Remove-Item -Path "DEPOT_APP" -Recurse -Force
}

# Créer la structure
Write-Host "[1/5] Création de la structure de dossiers..." -ForegroundColor Cyan
$folders = @(
    "DEPOT_APP",
    "DEPOT_APP/1_Code_Source",
    "DEPOT_APP/2_Documentation",
    "DEPOT_APP/3_Captures_Ecran",
    "DEPOT_APP/4_Informations_Legales"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
    Write-Host "  ✓ $folder créé" -ForegroundColor Green
}

Write-Host ""
Write-Host "[2/5] Copie du code source (ZIP)..." -ForegroundColor Cyan
if (Test-Path "casskai-app-v1.0.0.zip") {
    Copy-Item -Path "casskai-app-v1.0.0.zip" -Destination "DEPOT_APP/1_Code_Source/" -Force
    $zipSize = (Get-Item "casskai-app-v1.0.0.zip").Length / 1MB
    Write-Host "  ✓ casskai-app-v1.0.0.zip copié ($([math]::Round($zipSize, 2)) MB)" -ForegroundColor Green
} else {
    Write-Host "  ✗ ERREUR: casskai-app-v1.0.0.zip introuvable!" -ForegroundColor Red
}

Write-Host ""
Write-Host "[3/5] Copie de la documentation..." -ForegroundColor Cyan
$docs = @{
    "DEPOT_README.md" = "README.md"
    "DEPOT_ARCHITECTURE.md" = "ARCHITECTURE.md"
    "DEPOT_FONCTIONNALITES.md" = "FONCTIONNALITES.md"
}

foreach ($source in $docs.Keys) {
    $dest = $docs[$source]
    if (Test-Path $source) {
        Copy-Item -Path $source -Destination "DEPOT_APP/2_Documentation/$dest" -Force
        Write-Host "  ✓ $dest copié" -ForegroundColor Green
    } else {
        Write-Host "  ✗ ERREUR: $source introuvable!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "[4/5] Copie des informations légales..." -ForegroundColor Cyan
$legalFiles = @("LICENSE", "LICENSE_AUDIT_REPORT.md")

foreach ($file in $legalFiles) {
    if (Test-Path $file) {
        Copy-Item -Path $file -Destination "DEPOT_APP/4_Informations_Legales/" -Force
        Write-Host "  ✓ $file copié" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ $file non trouvé (optionnel)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "[5/5] Création du fichier INDEX.md..." -ForegroundColor Cyan

# Créer le contenu INDEX.md dans un fichier temporaire
$indexLines = @(
    "# DEPOT APP - CASSKAI v1.0.0",
    "",
    "## Contenu du depot",
    "",
    "Ce dossier contient l'ensemble des elements constitutifs de l'application CassKai pour le depot APP legal.",
    "",
    "### 1. Code Source (1_Code_Source/)",
    "casskai-app-v1.0.0.zip (4.86 MB)",
    "  Code source complet de l'application",
    "  Package.json avec toutes les dependances",
    "  Fichiers de configuration (Vite, TypeScript, Tailwind)",
    "  Structure complete du projet",
    "",
    "### 2. Documentation (2_Documentation/)",
    "README.md : Description generale du projet, technologies, modules, installation",
    "ARCHITECTURE.md : Documentation technique detaillee",
    "FONCTIONNALITES.md : Liste exhaustive des 19 modules et leurs fonctionnalites",
    "",
    "### 3. Captures d'ecran (3_Captures_Ecran/)",
    "A completer avec des captures d'ecran de l'application",
    "",
    "### 4. Informations legales (4_Informations_Legales/)",
    "LICENSE : Licence proprietaire",
    "LICENSE_AUDIT_REPORT.md : Rapport d'audit de conformite legale",
    "",
    "## Informations sur l'application",
    "",
    "Nom : CassKai",
    "Version : 1.0.0",
    "Date de depot : 30 novembre 2025",
    "Proprietaire : NOUTCHE CONSEIL (SASU) - SIREN 909 672 685",
    "Marque : CassKai - INPI N° 5202212",
    "Site web : https://casskai.app",
    "Contact : contact@casskai.app",
    "",
    "## Description",
    "",
    "CassKai est une plateforme SaaS de gestion financiere tout-en-un destinee aux PME et independants.",
    "Elle propose 19 modules fonctionnels couvrant la comptabilite, la facturation, les banques, la fiscalite, le CRM, les achats, le stock, les projets, les RH, et bien plus.",
    "",
    "## Technologies principales",
    "",
    "Frontend : React 18, TypeScript, Vite, Tailwind CSS",
    "Backend : Supabase (PostgreSQL, Auth, Storage)",
    "Hebergement : Hostinger VPS avec Nginx",
    "Paiements : Stripe",
    "",
    "## Conformite",
    "",
    "RGPD (export donnees, droit a l'oubli, chiffrement AES-256)",
    "LCEN (mentions legales completes)",
    "Normes comptables (PCG, SYSCOHADA, IFRS)",
    "FEC (Fichier des Ecritures Comptables)",
    "",
    "---",
    "",
    "(c) 2024-2025 NOUTCHE CONSEIL (SASU) - Tous droits reserves",
    "Marque deposee CassKai - INPI N° 5202212"
)

$indexLines | Out-File -FilePath "DEPOT_APP/INDEX.md" -Encoding UTF8 -Force
Write-Host "  ✓ INDEX.md créé" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✓ DÉPÔT APP ORGANISÉ AVEC SUCCÈS     " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Récapitulatif
Write-Host "Contenu du dossier DEPOT_APP :" -ForegroundColor Cyan
Write-Host ""
Get-ChildItem -Path "DEPOT_APP" -Recurse | Where-Object { !$_.PSIsContainer } | ForEach-Object {
    $relativePath = $_.FullName -replace [regex]::Escape((Get-Item "DEPOT_APP").FullName), "DEPOT_APP"
    $size = if ($_.Length -lt 1KB) {
        "$($_.Length) B"
    } elseif ($_.Length -lt 1MB) {
        "$([math]::Round($_.Length / 1KB, 2)) KB"
    } else {
        "$([math]::Round($_.Length / 1MB, 2)) MB"
    }
    Write-Host "  📄 $relativePath" -NoNewline -ForegroundColor Gray
    Write-Host " ($size)" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "Le dossier DEPOT_APP est prêt pour le dépôt APP!" -ForegroundColor Green
Write-Host "Emplacement : $(Resolve-Path 'DEPOT_APP')" -ForegroundColor Cyan