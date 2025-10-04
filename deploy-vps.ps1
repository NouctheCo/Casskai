# Script de deploiement automatise pour CassKai VPS (Windows PowerShell)
# Usage: .\deploy-vps.ps1

param(
    [switch]$SkipBuild = $false
)

$ErrorActionPreference = "Stop"

$VPS_HOST = "89.116.111.88"
$VPS_USER = "root"
$VPS_PATH = "/var/www/casskai.app"
$BUILD_DIR = "dist"

Write-Host "[DEPLOY] Demarrage du deploiement CassKai..." -ForegroundColor Green

# 1. Verifications preliminaires
if (!(Test-Path "package.json")) {
    Write-Host "[ERROR] package.json introuvable. Assurez-vous d'etre dans le repertoire racine du projet." -ForegroundColor Red
    exit 1
}

# 2. Build local (optionnel)
if (!$SkipBuild) {
    Write-Host "[BUILD] Construction du projet..." -ForegroundColor Blue
    npm run build:production
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Erreur lors de la construction du projet" -ForegroundColor Red
        exit 1
    }

    if (!(Test-Path $BUILD_DIR)) {
        Write-Host "[ERROR] Le repertoire $BUILD_DIR n'existe pas apres la build" -ForegroundColor Red
        exit 1
    }

    Write-Host "[SUCCESS] Build terminee avec succes" -ForegroundColor Green
} else {
    Write-Host "[SKIP] Build ignoree (parametre -SkipBuild)" -ForegroundColor Yellow
    if (!(Test-Path $BUILD_DIR)) {
        Write-Host "[ERROR] Le repertoire $BUILD_DIR n'existe pas. Lancez d'abord 'npm run build'" -ForegroundColor Red
        exit 1
    }
}

# 3. Backup et preparation sur le VPS
Write-Host "[BACKUP] Sauvegarde et preparation sur le VPS..." -ForegroundColor Blue

# Créer un script temporaire pour éviter les problèmes d'échappement
$tempScript = @"
if [ -d '$VPS_PATH' ]; then
    cp -r $VPS_PATH ${VPS_PATH}.backup.`$(date +%Y%m%d_%H%M%S)
    echo 'Sauvegarde creee'
fi
mkdir -p ${VPS_PATH}.tmp
rm -rf ${VPS_PATH}.tmp/*
echo 'Repertoire temporaire prepare'
"@ -replace '\$VPS_PATH', $VPS_PATH

# Écrire le script dans un fichier temporaire
$tempFile = [System.IO.Path]::GetTempFileName() + ".sh"
$tempScript | Out-File -FilePath $tempFile -Encoding UTF8

Write-Host "[DEBUG] Script temporaire: $tempFile" -ForegroundColor Yellow
Write-Host "[DEBUG] Contenu:" -ForegroundColor Yellow
Get-Content $tempFile | Write-Host -ForegroundColor Gray

# Copier et exécuter le script sur le VPS
scp -o ConnectTimeout=10 "$tempFile" "$VPS_USER@${VPS_HOST}:/tmp/deploy_backup.sh"
ssh -o ConnectTimeout=10 "$VPS_USER@$VPS_HOST" "chmod +x /tmp/deploy_backup.sh && /tmp/deploy_backup.sh"

# Nettoyer
Remove-Item $tempFile -ErrorAction SilentlyContinue

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Erreur lors de la preparation sur le VPS" -ForegroundColor Red
    exit 1
}

# 4. Upload des fichiers
Write-Host "[UPLOAD] Envoi des fichiers..." -ForegroundColor Blue
scp -o ConnectTimeout=10 -r "$BUILD_DIR/*" "$VPS_USER@${VPS_HOST}:${VPS_PATH}.tmp/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Erreur lors de l'envoi des fichiers" -ForegroundColor Red
    exit 1
}

# 5. Deploiement atomique
Write-Host "[DEPLOY] Deploiement atomique des fichiers..." -ForegroundColor Blue
$deployCommand = @"
# Verification que les fichiers ont ete uploades
if [ ! -f '${VPS_PATH}.tmp/index.html' ]; then
    echo 'Erreur: index.html non trouve apres upload'
    exit 1
fi

# Supprimer les anciens fichiers frontend (preserver api, scripts, etc.)
find '$VPS_PATH' -maxdepth 1 -type f \( -name '*.html' -o -name '*.js' -o -name '*.css' -o -name '*.json' -o -name '*.ico' -o -name '*.svg' -o -name '*.br' -o -name '*.gz' \) -delete
rm -rf '$VPS_PATH/assets' 2>/dev/null || true

# Deplacer les nouveaux fichiers
mv ${VPS_PATH}.tmp/* '$VPS_PATH/'
rmdir ${VPS_PATH}.tmp

# Corriger les permissions
chown -R www-data:www-data '$VPS_PATH'
chmod -R 644 '$VPS_PATH'/*
find '$VPS_PATH' -type d -exec chmod 755 {} \;

echo 'Fichiers deployes et permissions corrigees'
"@ -replace '\$VPS_PATH', $VPS_PATH

ssh -o ConnectTimeout=10 "$VPS_USER@$VPS_HOST" $deployCommand

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Erreur lors du deploiement" -ForegroundColor Red
    exit 1
}

# 6. Redemarrage des services
Write-Host "[SERVICES] Redemarrage des services..." -ForegroundColor Blue
$serviceCommand = @"
# Test de la configuration Nginx
nginx -t
if [ `$? -ne 0 ]; then
    echo 'Erreur dans la configuration Nginx'
    exit 1
fi

# Redemarrage de Nginx
pkill nginx 2>/dev/null || true
sleep 2
nginx -g 'daemon on;'
if [ `$? -ne 0 ]; then
    echo 'Erreur lors du redemarrage de Nginx'
    exit 1
fi

# Verification de l'API backend
if pm2 status casskai-api | grep online > /dev/null; then
    echo 'API backend operationnelle'
else
    echo 'Redemarrage de l API backend...'
    pm2 restart casskai-api
fi

echo 'Services redemarres'
"@

ssh -o ConnectTimeout=10 "$VPS_USER@$VPS_HOST" $serviceCommand

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Erreur lors du redemarrage des services" -ForegroundColor Red
    exit 1
}

# 7. Tests de sante
Write-Host "[TEST] Tests de sante..." -ForegroundColor Blue
Start-Sleep -Seconds 3

# Test local depuis le VPS
$healthCommand = @"
HTTP_CODE=`$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/)
if [ "`$HTTP_CODE" != "200" ]; then
    echo 'Erreur: Le site ne repond pas correctement (Code: '`$HTTP_CODE')'
    exit 1
fi
echo 'Site accessible localement (Code: '`$HTTP_CODE')'
"@

ssh -o ConnectTimeout=10 "$VPS_USER@$VPS_HOST" $healthCommand

# Test HTTPS externe
try {
    $response = Invoke-WebRequest -Uri "https://casskai.app/" -Method Head -TimeoutSec 10
    $statusCode = $response.StatusCode
    if ($statusCode -eq 200) {
        Write-Host "[SUCCESS] Site accessible en HTTPS (Code: $statusCode)" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Attention: Le site ne repond pas correctement en HTTPS (Code: $statusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARNING] Test HTTPS echoue - peut etre normal si les DNS/CDN se mettent a jour" -ForegroundColor Yellow
}

# 8. Informations de deploiement
Write-Host ""
Write-Host "[SUCCESS] Deploiement termine avec succes!" -ForegroundColor Green
Write-Host "[INFO] Informations de deploiement:" -ForegroundColor Blue

$infoCommand = @"
echo '   - Timestamp: '`$(date)
echo '   - Taille index.html: '`$(stat -c%s $VPS_PATH/index.html)' bytes'
echo '   - Derniere modification: '`$(stat -c%y $VPS_PATH/index.html)
echo '   - Processus Nginx: '`$(pgrep nginx | wc -l)' processus'
API_STATUS=`$(pm2 jlist 2>/dev/null | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
echo '   - API Status: '`$API_STATUS
"@

ssh -o ConnectTimeout=10 "$VPS_USER@$VPS_HOST" $infoCommand

Write-Host ""
Write-Host "[READY] Votre site est maintenant disponible sur:" -ForegroundColor Cyan
Write-Host "   https://casskai.app" -ForegroundColor White
Write-Host ""
Write-Host "[TIP] Pour forcer le rafraichissement du cache navigateur:" -ForegroundColor Yellow
Write-Host "   - Chrome/Firefox: Ctrl+F5 ou Ctrl+Shift+R" -ForegroundColor White
Write-Host "   - Safari: Cmd+Shift+R" -ForegroundColor White
Write-Host ""