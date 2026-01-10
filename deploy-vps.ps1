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
$deployScript = "cd /var/www && cp -r casskai.app casskai.app.backup.`$(date +%Y%m%d_%H%M%S) && rm -rf casskai.app.tmp && mkdir -p casskai.app.tmp && cd casskai.app.tmp && tar xzf /tmp/casskai-build.tar.gz && cd /var/www && rm -rf casskai.app/* && cp -r casskai.app.tmp/* casskai.app/ && rm -rf casskai.app.tmp && chown -R www-data:www-data casskai.app && chmod -R 755 casskai.app && echo 'Deploy OK'"

ssh ${VPS_USER}@${VPS_HOST} $deployScript

# 5. Restart services (Nginx container or host, then PM2)
Write-Host "[SERVICES] Redemarrage des services..." -ForegroundColor Blue
$serviceScript = @'
set -e

# Reload Nginx if container casskai-proxy exists, else try host nginx
if docker ps --format '{{.Names}}' | grep -q '^casskai-proxy$'; then
    echo "[NGINX] Reload via container casskai-proxy"
    docker exec casskai-proxy nginx -s reload 2>/dev/null || docker restart casskai-proxy
else
    if command -v nginx >/dev/null 2>&1; then
        echo "[NGINX] Reload host nginx"
        nginx -s reload || nginx -g 'daemon on;'
    else
        echo "[NGINX] Aucun nginx detecte (container peut etre gere par Traefik)"
    fi
fi

# Restart API via PM2
cd /var/www/casskai.app/api 2>/dev/null || true
pm2 restart casskai-api 2>/dev/null || pm2 start server.js --name casskai-api
pm2 save || true
echo "[SERVICES] OK"
'@
# Strip Windows CR to avoid bash parsing issues on the remote host
$serviceScript = $serviceScript -replace "`r",""
ssh ${VPS_USER}@${VPS_HOST} "$serviceScript"

# 6. Tests
Write-Host "[TEST] Verification Nginx (localhost:8080) et domaine (https)" -ForegroundColor Blue
Start-Sleep -Seconds 2
ssh ${VPS_USER}@${VPS_HOST} "curl -s -o /dev/null -w 'Local Nginx: %{http_code}\n' http://127.0.0.1:8080/ ; curl -s -o /dev/null -w 'Domaine: %{http_code}\n' https://casskai.app"

# 7. Cleanup
Write-Host "[CLEANUP] Nettoyage..." -ForegroundColor Blue
Remove-Item casskai-build.tar.gz -ErrorAction SilentlyContinue
ssh ${VPS_USER}@${VPS_HOST} "rm /tmp/casskai-build.tar.gz"

Write-Host "`n[SUCCESS] Deploiement termine!" -ForegroundColor Green
Write-Host "[INFO] Site disponible sur: https://casskai.app" -ForegroundColor Cyan
Write-Host ""
