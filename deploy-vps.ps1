param(
    [switch]$SkipBuild = $false
)

$ErrorActionPreference = "Stop"
$VPS_HOST = "89.116.111.88"
$VPS_USER = "root"
$VPS_PATH = "/var/www/casskai.app"
$BUILD_DIR = "dist"

Write-Host "`n[DEPLOY] Demarrage du deploiement CassKai..." -ForegroundColor Cyan

# 1. Build
if (!$SkipBuild) {
    Write-Host "[BUILD] Construction du projet..." -ForegroundColor Blue
    npm run build:production
    if ($LASTEXITCODE -ne 0) { exit 1 }
    Write-Host "[SUCCESS] Build terminee" -ForegroundColor Green
} else {
    Write-Host "[SKIP] Build ignoree" -ForegroundColor Yellow
}

if (!(Test-Path $BUILD_DIR)) {
    Write-Host "[ERROR] Le repertoire dist n'existe pas" -ForegroundColor Red
    exit 1
}

# 2. Creer archive
Write-Host "[PACKAGE] Creation de l'archive..." -ForegroundColor Blue
Set-Location $BUILD_DIR
tar czf ../casskai-build.tar.gz .
Set-Location ..

# 3. Upload
Write-Host "[UPLOAD] Envoi vers le VPS..." -ForegroundColor Blue
scp casskai-build.tar.gz ${VPS_USER}@${VPS_HOST}:/tmp/

# 4. Deploy
Write-Host "[DEPLOY] Deploiement sur le VPS..." -ForegroundColor Blue
$deployScript = @'
cd /var/www && \
cp -r casskai.app casskai.app.backup.$(date +%Y%m%d_%H%M%S) && \
rm -rf casskai.app.tmp && \
mkdir -p casskai.app.tmp && \
cd casskai.app.tmp && \
tar xzf /tmp/casskai-build.tar.gz && \
cd /var/www && \
rm -rf casskai.app/* && \
cp -r casskai.app.tmp/* casskai.app/ && \
rm -rf casskai.app.tmp && \
chown -R www-data:www-data casskai.app && \
chmod -R 755 casskai.app && \
echo 'Deploy OK'
'@

ssh "${VPS_USER}@${VPS_HOST}" "$deployScript"

# 5. Verification (pas besoin de redemarrer Nginx - sert directement les fichiers)
Write-Host "[INFO] Fichiers deployes - Nginx les sert automatiquement" -ForegroundColor Green
Write-Host "[SERVICES] Verification de l'API..." -ForegroundColor Blue
$serviceScript = @'
set -e

# Verification Nginx host (architecture actuelle sans Docker/Traefik)
if systemctl is-active --quiet nginx; then
    echo "[NGINX] Service actif (sert directement /var/www/casskai.app)"
else
    echo "[WARNING] Nginx n'est pas actif"
    systemctl status nginx --no-pager
fi

# Restart API via PM2 si elle existe
if pm2 list | grep -q casskai-api; then
    echo "[API] Redemarrage de l'API PM2"
    pm2 restart casskai-api
    pm2 save
else
    echo "[API] API casskai-api non trouvee dans PM2 (normal si frontend uniquement)"
fi

echo "[SERVICES] OK"
'@
# Strip Windows CR to avoid bash parsing issues on the remote host
$serviceScript = $serviceScript -replace "`r",""
ssh "${VPS_USER}@${VPS_HOST}" "$serviceScript"

# 6. Tests
Write-Host "[TEST] Verification du domaine HTTPS" -ForegroundColor Blue
Start-Sleep -Seconds 2
$testScript = @'
curl -s -o /dev/null -w 'HTTPS casskai.app: %{http_code}\n' https://casskai.app
curl -s -o /dev/null -w 'HTTPS www.casskai.app: %{http_code}\n' https://www.casskai.app
'@
$testScript = $testScript -replace "`r",""
ssh "${VPS_USER}@${VPS_HOST}" "$testScript"

# 7. Cleanup
Write-Host "[CLEANUP] Nettoyage..." -ForegroundColor Blue
Remove-Item casskai-build.tar.gz -ErrorAction SilentlyContinue
ssh "${VPS_USER}@${VPS_HOST}" "rm -f /tmp/casskai-build.tar.gz"

Write-Host "`n[SUCCESS] Deploiement termine!" -ForegroundColor Green
Write-Host "[INFO] Site disponible sur: https://casskai.app" -ForegroundColor Cyan
Write-Host ""
