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

# Commande 1: Backup
ssh -o ConnectTimeout=10 "$VPS_USER@$VPS_HOST" "if [ -d '$VPS_PATH' ]; then cp -r '$VPS_PATH' '${VPS_PATH}.backup.`$(date +%Y%m%d_%H%M%S)'; echo 'Sauvegarde creee'; fi"

# Commande 2: Création du répertoire temporaire
ssh -o ConnectTimeout=10 "$VPS_USER@$VPS_HOST" "mkdir -p '${VPS_PATH}.tmp' && rm -rf '${VPS_PATH}.tmp'/* && echo 'Repertoire temporaire prepare'"

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

# Commande 1: Vérification
ssh -o ConnectTimeout=10 "$VPS_USER@$VPS_HOST" "if [ ! -f '${VPS_PATH}.tmp/index.html' ]; then echo 'Erreur: index.html non trouve'; exit 1; fi && echo 'Fichiers uploadés OK'"

# Commande 2: Suppression des anciens fichiers frontend
ssh -o ConnectTimeout=10 "$VPS_USER@$VPS_HOST" "find '$VPS_PATH' -maxdepth 1 -type f \( -name '*.html' -o -name '*.js' -o -name '*.css' -o -name '*.json' -o -name '*.ico' -o -name '*.svg' -o -name '*.br' -o -name '*.gz' \) -delete && rm -rf '$VPS_PATH/assets' '$VPS_PATH/css' '$VPS_PATH/icons' 2>/dev/null; echo 'Anciens fichiers supprimés'"

# Commande 3: Déplacement des nouveaux fichiers (avec force pour écraser les répertoires)
ssh -o ConnectTimeout=10 "$VPS_USER@$VPS_HOST" "cp -rf '${VPS_PATH}.tmp'/* '$VPS_PATH/' && rm -rf '${VPS_PATH}.tmp' && echo 'Nouveaux fichiers déployés'"

# Commande 4: Correction des permissions
ssh -o ConnectTimeout=10 "$VPS_USER@$VPS_HOST" "chown -R www-data:www-data '$VPS_PATH' && chmod -R 644 '$VPS_PATH'/* && find '$VPS_PATH' -type d -exec chmod 755 {} \; && echo 'Permissions corrigées'"

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Erreur lors du deploiement" -ForegroundColor Red
    exit 1
}

# 6. Redemarrage des services
Write-Host "[SERVICES] Redemarrage des services..." -ForegroundColor Blue

# Test de la configuration Nginx
ssh -o ConnectTimeout=10 "$VPS_USER@$VPS_HOST" "nginx -t"

# Redémarrage de Nginx
ssh -o ConnectTimeout=10 "$VPS_USER@$VPS_HOST" "pkill nginx 2>/dev/null; sleep 2; nginx -g 'daemon on;' && echo 'Nginx redémarré'"

# Vérification de l'API backend
ssh -o ConnectTimeout=10 "$VPS_USER@$VPS_HOST" "if pm2 status casskai-api | grep online > /dev/null; then echo 'API backend OK'; else pm2 restart casskai-api && echo 'API redémarrée'; fi"

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Erreur lors du redemarrage des services" -ForegroundColor Red
    exit 1
}

# 7. Tests de sante
Write-Host "[TEST] Tests de sante..." -ForegroundColor Blue
Start-Sleep -Seconds 3

# Test local depuis le VPS
ssh -o ConnectTimeout=10 "$VPS_USER@$VPS_HOST" "HTTP_CODE=`$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/); if [ `"`$HTTP_CODE`" = '200' ]; then echo 'Site accessible (Code: '`$HTTP_CODE')'; else echo 'Erreur HTTP (Code: '`$HTTP_CODE')'; exit 1; fi"

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

# Récupérer les informations
ssh -o ConnectTimeout=10 "$VPS_USER@$VPS_HOST" "echo '   - Timestamp: '`$(date) && echo '   - Taille index.html: '`$(stat -c%s '$VPS_PATH/index.html')' bytes' && echo '   - Derniere modification: '`$(stat -c%y '$VPS_PATH/index.html') && echo '   - Processus Nginx: '`$(pgrep nginx | wc -l)' processus'"

Write-Host ""
Write-Host "[READY] Votre site est maintenant disponible sur:" -ForegroundColor Cyan
Write-Host "   https://casskai.app" -ForegroundColor White
Write-Host ""
Write-Host "[TIP] Pour forcer le rafraichissement du cache navigateur:" -ForegroundColor Yellow
Write-Host "   - Chrome/Firefox: Ctrl+F5 ou Ctrl+Shift+R" -ForegroundColor White
Write-Host "   - Safari: Cmd+Shift+R" -ForegroundColor White
Write-Host ""