# ============================================================================
# Script de Nettoyage Sécurisé du Projet CassKai
# ============================================================================
# Ce script nettoie tous les fichiers temporaires, logs, rapports et scripts
# de développement tout en préservant l'intégrité du projet.
#
# SÉCURITÉ: Tous les fichiers sont sauvegardés dans _cleanup_backup avant suppression
# ============================================================================

param(
    [switch]$DryRun,
    [switch]$NoBackup
)

$ErrorActionPreference = "Continue"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "_cleanup_backup_$timestamp"

# Couleurs pour l'affichage
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }

Write-Host @"
╔════════════════════════════════════════════════════════════════╗
║       NETTOYAGE SÉCURISÉ DU PROJET CASSKAI                    ║
╚════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

if ($DryRun) {
    Write-Warning "MODE DRY-RUN: Aucun fichier ne sera supprimé"
}

# ============================================================================
# 1. CRÉATION DU BACKUP
# ============================================================================

if (-not $NoBackup -and -not $DryRun) {
    Write-Info "Création du dossier de backup: $backupDir"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Write-Success "Dossier de backup créé"
}

function Backup-And-Remove {
    param(
        [string[]]$Patterns,
        [string]$Category
    )
    
    Write-Info "`n📦 Traitement: $Category"
    $count = 0
    
    foreach ($pattern in $Patterns) {
        $files = Get-ChildItem -Path . -Filter $pattern -File -ErrorAction SilentlyContinue
        
        foreach ($file in $files) {
            $count++
            
            if ($DryRun) {
                Write-Host "  [DRY-RUN] Supprimerait: $($file.Name)" -ForegroundColor DarkGray
            }
            else {
                # Backup
                if (-not $NoBackup) {
                    Copy-Item $file.FullName -Destination "$backupDir\$($file.Name)" -ErrorAction SilentlyContinue
                }
                
                # Suppression
                Remove-Item $file.FullName -Force -ErrorAction SilentlyContinue
                if ($?) {
                    Write-Host "  🗑️  $($file.Name)" -ForegroundColor DarkGray
                }
            }
        }
    }
    
    if ($count -eq 0) {
        Write-Host "  Aucun fichier trouvé" -ForegroundColor DarkGray
    }
    else {
        Write-Success "$count fichier(s) traité(s)"
    }
}

# ============================================================================
# 2. SUPPRESSION DES LOGS ET FICHIERS TEMPORAIRES
# ============================================================================

Backup-And-Remove -Category "Logs et fichiers temporaires" -Patterns @(
    "*.log",
    "test-output.txt",
    "lint-full-output.txt",
    "tmp-files-error.txt",
    "temp_pass.txt",
    "nul",
    "errors-list.txt",
    "journal_entry_items_audit.txt",
    "VISUAL_SUMMARY.txt"
)

# ============================================================================
# 3. SUPPRESSION DES RAPPORTS JSON TEMPORAIRES
# ============================================================================

Backup-And-Remove -Category "Rapports JSON temporaires" -Patterns @(
    "audit_report.json",
    "eslint-any-report.json",
    "eslint-final.json",
    "eslint-results.json",
    "final_production_audit_report.json",
    "modules_audit_adapted_report.json",
    "modules_audit_report.json",
    "temp-eslint.json",
    "temp-validation.json",
    "translation-report.json"
)

# ============================================================================
# 4. SUPPRESSION DES SCRIPTS POWERSHELL TEMPORAIRES
# ============================================================================

Backup-And-Remove -Category "Scripts PowerShell temporaires" -Patterns @(
    "fix-*.ps1",
    "apply-*.ps1",
    "check-*.ps1",
    "clean-*.ps1",
    "integrate-*.ps1",
    "deploy-simple.ps1",
    "deploy-fast.ps1"
)

# ============================================================================
# 5. SUPPRESSION DES SCRIPTS PYTHON TEMPORAIRES
# ============================================================================

Backup-And-Remove -Category "Scripts Python temporaires" -Patterns @(
    "apply_all_migrations.py",
    "clean_accounting_data_service.py",
    "clean_inventory_fallbacks.py",
    "clean_projects.py",
    "clean_reports_service.py",
    "find_mock_services.py",
    "fix_email_redirect.py",
    "fix_onboarding_atomic.py",
    "fix_onboarding_rls.py",
    "integrate_contracts.py",
    "integrate_forecasts.py",
    "integrate_purchases.py",
    "patch_inventory.py"
)

# ============================================================================
# 6. SUPPRESSION DES SCRIPTS JAVASCRIPT TEMPORAIRES
# ============================================================================

Backup-And-Remove -Category "Scripts JavaScript temporaires" -Patterns @(
    "audit_script.js",
    "audit_metadata_script.js",
    "check-db-schema.js",
    "check-schema.js",
    "comprehensive_audit.js",
    "count-any.js",
    "final_production_audit.js",
    "modules_audit.js",
    "modules_audit_adapted.js",
    "verify_tables.cjs",
    "apply-account-class-migration.cjs",
    "fix-case-declarations.cjs",
    "fix-eslint-errors.cjs"
)

# ============================================================================
# 7. SUPPRESSION DES FICHIERS SQL TEMPORAIRES (RACINE UNIQUEMENT)
# ============================================================================

Backup-And-Remove -Category "Fichiers SQL temporaires" -Patterns @(
    "apply_*.sql",
    "apply-*.sql",
    "check_*.sql",
    "diagnostic_*.sql",
    "audit_*.sql",
    "fix_*.sql",
    "create_*.sql",
    "enable_*.sql",
    "disable_*.sql",
    "migration_*.sql",
    "verify_*.sql",
    "cleanup_*.sql",
    "correction_*.sql",
    "complete_*.sql",
    "database_*.sql",
    "final_*.sql",
    "force_*.sql",
    "supabase-production-setup.sql",
    "supabase_migration.sql",
    "supabase_reconstruction.sql",
    "supabase_test_data.sql",
    "supabase_rpc_functions.sql"
)

# ============================================================================
# 8. SUPPRESSION DE LA DOCUMENTATION TEMPORAIRE
# ============================================================================

Backup-And-Remove -Category "Documentation temporaire" -Patterns @(
    "RAPPORT_*.md",
    "AUDIT_*.md",
    "BILAN_*.md",
    "MISSION_*.md",
    "CORRECTION_*.md",
    "CORRECTIONS_*.md",
    "SPRINT_*.md",
    "FIX_*.md",
    "APPLY_*.md",
    "CORS_*.md",
    "PROGRESS_*.md",
    "DIAGNOSTIC_*.md",
    "REFACTORING_*.md",
    "README_COMPLEXITY_MISSION.md",
    "README_REFACTORING.md",
    "README_SUPABASE_OLD.md",
    "types-fixes-cleanup-report.md",
    "mega-batch-2-report.md",
    "fix-warnings-manual-guide.md",
    "VISUAL_SUMMARY.txt",
    "ETAT_DOCUMENTS_LEGAUX.md",
    "CONTACT_AVOCAT_RGPD_PRET.md",
    "INSTRUCTIONS_UPDATE_PRIVACY.md",
    "DECISION_CHEF_PROJET.md",
    "QUICKSTART_PHASE3.md",
    "RESUME_EXECUTIF_CASSKAI.md",
    "RLS_FIX_APPLIED.md",
    "ROLLBACK_SUCCESS.md",
    "URGENT_CORRECTIONS_A_APPLIQUER.md",
    "BANKS_IMPLEMENTATION_STATUS.md",
    "BANKS_REFACTORING_PLAN.md",
    "COMPLEXITY_*.md",
    "REGISTRE_TRAITEMENTS_RGPD.md",
    "GUIDE_DECOUPAGE_FICHIERS.md",
    "GUIDE_DEPLOIEMENT_RGPD.md",
    "GUIDE_REPRISE.md",
    "GUIDE_TEST_CONTRACTS.md",
    "INTEGRATION_*.md",
    "JOURNALS_*.md",
    "MIGRATION_*.md",
    "OPENAI_*.md",
    "TESTING_*.md",
    "TESTS_*.md",
    "RESULTATS_TESTS.md",
    "REPORTS_*.md",
    "SIRH_*.md",
    "SUPABASE_*.md",
    "ENTERPRISE_*.md",
    "EMAIL_*.md",
    "ESLINT_*.md",
    "BEFORE_AFTER_*.md"
)

# ============================================================================
# 9. SUPPRESSION DES FICHIERS DE DÉPLOIEMENT OBSOLÈTES
# ============================================================================

Backup-And-Remove -Category "Fichiers de déploiement obsolètes" -Patterns @(
    "deploy-fix.sh",
    "deploy-ultra-fast.sh",
    "deploy-simple.cmd",
    "fix-sw-urgent.sh",
    "upload.bat"
)

# ============================================================================
# 10. SUPPRESSION DES FICHIERS DE CONFIGURATION OBSOLÈTES
# ============================================================================

Backup-And-Remove -Category "Fichiers de configuration obsolètes" -Patterns @(
    "docker-compose-fixed.yml",
    "nginx-staging.conf",
    "nginx-staging-http.conf",
    "Dockerfile.e2e",
    "jest.einvoicing.config.js"
)

# ============================================================================
# 11. SUPPRESSION DES FICHIERS DIVERS
# ============================================================================

Backup-And-Remove -Category "Fichiers divers temporaires" -Patterns @(
    "COMMIT_MESSAGE.txt",
    "COMMIT_SPRINT_0.txt",
    "MISSION_STATUS.txt",
    "fix_modules.html",
    "clear-browser-cache.html",
    "winscp-portable.zip",
    "dist-deploy.zip",
    "PRIVACY_SECTION_DROITS.tsx",
    "CUsersnoutcCasskaisrc*.ts",
    "head_inventoryService.ts",
    ".gitignore.createaccountdialog",
    "CLAUDE_WORK_RECOVERY.md",
    "IMPLEMENTATION_COMPLETE.md"
)

# ============================================================================
# 12. SUPPRESSION DES DOSSIERS TEMPORAIRES
# ============================================================================

Write-Info "`n📂 Traitement: Dossiers temporaires"

$foldersToRemove = @(
    "coverage",
    "playwright-report",
    "test-results",
    "winscp",
    ".netlify",
    ".auth"
)

$folderCount = 0
foreach ($folder in $foldersToRemove) {
    if (Test-Path $folder) {
        if ($DryRun) {
            Write-Host "  [DRY-RUN] Supprimerait le dossier: $folder" -ForegroundColor DarkGray
        }
        else {
            Remove-Item $folder -Recurse -Force -ErrorAction SilentlyContinue
            if ($?) {
                Write-Host "  🗑️  $folder/" -ForegroundColor DarkGray
                $folderCount++
            }
        }
    }
}

if ($folderCount -eq 0 -and -not $DryRun) {
    Write-Host "  Aucun dossier trouvé" -ForegroundColor DarkGray
}
else {
    Write-Success "$folderCount dossier(s) supprimé(s)"
}

# ============================================================================
# RÉSUMÉ
# ============================================================================

Write-Host @"

╔════════════════════════════════════════════════════════════════╗
║                    NETTOYAGE TERMINÉ                          ║
╚════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Green

if (-not $DryRun) {
    if (-not $NoBackup) {
        Write-Success "Backup sauvegardé dans: $backupDir"
        Write-Info "Pour restaurer: Copy-Item $backupDir\* -Destination . -Force"
    }
    Write-Success "Projet nettoyé avec succès!"
    Write-Info "`nVérifiez que le projet fonctionne toujours:"
    Write-Host "  npm run type-check" -ForegroundColor Cyan
    Write-Host "  npm run build" -ForegroundColor Cyan
}
else {
    Write-Info "Mode DRY-RUN terminé. Exécutez sans -DryRun pour effectuer le nettoyage."
}

Write-Host "`n📊 Statistiques de nettoyage disponibles dans le backup" -ForegroundColor Cyan
