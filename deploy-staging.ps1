#!/usr/bin/env pwsh
# CassKai - Script de déploiement STAGING (Beta Testing)
# Usage: .\deploy-staging.ps1 [-SkipBuild]

param(
    [switch]$SkipBuild = $false
)

$ErrorActionPreference = "Stop"
$VPS_HOST = "root@89.116.111.88"
$STAGING_DIR = "/var/www/staging.casskai.app"
$NGINX_CONF = "/etc/nginx/sites-available/casskai-staging"

Write-Host "🚀 DÉPLOIEMENT STAGING - CassKai Beta Testing" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Build local avec config staging
if (-not $SkipBuild) {
    Write-Host "📦 Build staging avec .env.staging..." -ForegroundColor Yellow

    if (Test-Path ".env.staging") {
        Copy-Item ".env.staging" ".env.local" -Force
        Write-Host "✅ .env.staging copié vers .env.local" -ForegroundColor Green
    } else {
        Write-Host "❌ Fichier .env.staging introuvable!" -ForegroundColor Red
        exit 1
    }

    npm run build

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build échoué!" -ForegroundColor Red
        exit 1
    }

    Write-Host "✅ Build staging terminé" -ForegroundColor Green
} else {
    Write-Host "⏭️  Build ignoré (utilisation du build existant)" -ForegroundColor Yellow
}

# 2. Vérifier le dossier dist
if (-not (Test-Path "dist")) {
    Write-Host "❌ Dossier dist/ introuvable!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📤 Préparation du transfert vers VPS..." -ForegroundColor Yellow

# 3. Créer backup sur le VPS
Write-Host "💾 Création backup staging..." -ForegroundColor Yellow
$BACKUP_DATE = Get-Date -Format "yyyy-MM-dd_HHmmss"
ssh $VPS_HOST "if [ -d $STAGING_DIR ]; then cp -r $STAGING_DIR ${STAGING_DIR}_backup_${BACKUP_DATE}; fi"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backup créé: ${STAGING_DIR}_backup_${BACKUP_DATE}" -ForegroundColor Green
}

# 4. Créer le répertoire staging sur le VPS
Write-Host "📁 Création répertoire staging sur VPS..." -ForegroundColor Yellow
ssh $VPS_HOST "mkdir -p $STAGING_DIR && mkdir -p ${STAGING_DIR}_temp"

# 5. Upload des fichiers
Write-Host "📤 Upload des fichiers vers VPS..." -ForegroundColor Yellow
scp -r dist/* "${VPS_HOST}:${STAGING_DIR}_temp/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Upload échoué!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Upload terminé" -ForegroundColor Green

# 6. Déploiement atomique
Write-Host "🔄 Déploiement atomique..." -ForegroundColor Yellow
ssh $VPS_HOST @"
    rm -rf $STAGING_DIR/* &&
    mv ${STAGING_DIR}_temp/* $STAGING_DIR/ &&
    rmdir ${STAGING_DIR}_temp &&
    chown -R www-data:www-data $STAGING_DIR &&
    chmod -R 755 $STAGING_DIR
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Déploiement échoué!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Déploiement atomique terminé" -ForegroundColor Green

# 7. Configuration Nginx staging
Write-Host "⚙️  Configuration Nginx staging..." -ForegroundColor Yellow

# Upload nginx-staging.conf
scp nginx-staging.conf "${VPS_HOST}:/tmp/casskai-staging.conf"

ssh $VPS_HOST @"
    mv /tmp/casskai-staging.conf $NGINX_CONF &&
    ln -sf $NGINX_CONF /etc/nginx/sites-enabled/casskai-staging 2>/dev/null || true &&
    nginx -t
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Configuration Nginx invalide!" -ForegroundColor Red
    exit 1
}

# 8. Obtenir certificat SSL Let's Encrypt (première fois uniquement)
Write-Host "🔒 Vérification SSL Let's Encrypt..." -ForegroundColor Yellow
ssh $VPS_HOST @"
    if [ ! -d /etc/letsencrypt/live/staging.casskai.app ]; then
        certbot certonly --nginx -d staging.casskai.app --non-interactive --agree-tos -m admin@casskai.app
    else
        echo 'Certificat SSL déjà existant'
    fi
"@

# 9. Redémarrer Nginx
Write-Host "🔄 Redémarrage Nginx..." -ForegroundColor Yellow
ssh $VPS_HOST "systemctl reload nginx"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Redémarrage Nginx échoué!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Nginx redémarré" -ForegroundColor Green

# 10. Tests de santé
Write-Host ""
Write-Host "🏥 Tests de santé..." -ForegroundColor Yellow

Start-Sleep -Seconds 3

try {
    $response = Invoke-WebRequest -Uri "https://staging.casskai.app/health" -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Health check OK: $($response.Content)" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Health check échoué (peut être normal au premier déploiement)" -ForegroundColor Yellow
}

# 11. Rapport final
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "✅ DÉPLOIEMENT STAGING TERMINÉ AVEC SUCCÈS!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 URL Staging: https://staging.casskai.app" -ForegroundColor Cyan
Write-Host "📊 Monitoring: Check Plausible & Sentry" -ForegroundColor Cyan
Write-Host "💾 Backup: ${STAGING_DIR}_backup_${BACKUP_DATE}" -ForegroundColor Cyan
Write-Host ""
Write-Host "🧪 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "  1. Tester l'accès: curl https://staging.casskai.app/health" -ForegroundColor White
Write-Host "  2. Vérifier les logs: ssh $VPS_HOST 'tail -f /var/log/nginx/staging.casskai.app.access.log'" -ForegroundColor White
Write-Host "  3. Recruter les beta testers" -ForegroundColor White
Write-Host "  4. Configurer le formulaire de feedback" -ForegroundColor White
Write-Host ""
