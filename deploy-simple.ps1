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

# 5. Restart services
Write-Host "[SERVICES] Redemarrage des services..." -ForegroundColor Blue
ssh ${VPS_USER}@${VPS_HOST} "pkill nginx 2>/dev/null ; sleep 2 ; nginx -g 'daemon on;' && pm2 restart casskai-api && echo 'Services OK'"

# 6. Test
Write-Host "[TEST] Test de sante..." -ForegroundColor Blue
Start-Sleep -Seconds 2
ssh ${VPS_USER}@${VPS_HOST} "curl -s -o /dev/null -w 'HTTP Code: %{http_code}\n' http://localhost:8080/"

# 7. Cleanup
Write-Host "[CLEANUP] Nettoyage..." -ForegroundColor Blue
Remove-Item casskai-build.tar.gz -ErrorAction SilentlyContinue
ssh ${VPS_USER}@${VPS_HOST} "rm /tmp/casskai-build.tar.gz"

Write-Host "`n[SUCCESS] Deploiement termine!" -ForegroundColor Green
Write-Host "[INFO] Site disponible sur: https://casskai.app" -ForegroundColor Cyan
Write-Host ""
