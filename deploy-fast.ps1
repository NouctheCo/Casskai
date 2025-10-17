# Script de déploiement RAPIDE pour CassKai
param(
    [switch]$SkipBuild = $false,
    [switch]$Quick = $false
)

$VPS_HOST = "89.116.111.88"
$VPS_USER = "root"
$VPS_PATH = "/var/www/casskai.app"

Write-Host "[FAST-DEPLOY] Démarrage rapide..." -ForegroundColor Green

# 1. Build conditionnel
if (!$SkipBuild) {
    if (!(Test-Path "dist") -or !$Quick) {
        Write-Host "[BUILD] Construction..." -ForegroundColor Blue
        npm run build:production
    } else {
        Write-Host "[SKIP] Build existant détecté" -ForegroundColor Yellow
    }
}

# 2. Compression locale pour transfert rapide
Write-Host "[COMPRESS] Compression des fichiers..." -ForegroundColor Blue
if (Test-Path "dist.tar.gz") { Remove-Item "dist.tar.gz" }
tar -czf dist.tar.gz -C dist .

# 3. Transfert unique compressé
Write-Host "[UPLOAD] Transfert compressé..." -ForegroundColor Blue
scp -o ConnectTimeout=5 dist.tar.gz "$VPS_USER@${VPS_HOST}:/tmp/"

# 4. Déploiement atomique rapide
Write-Host "[DEPLOY] Déploiement atomique..." -ForegroundColor Blue
ssh -o ConnectTimeout=5 "$VPS_USER@$VPS_HOST" @"
cd /tmp &&
tar -xzf dist.tar.gz -C /var/www/casskai.app/ &&
chown -R www-data:www-data /var/www/casskai.app/ &&
systemctl reload nginx &&
rm dist.tar.gz &&
echo 'Déploiement terminé en mode rapide'
"@

# 5. Nettoyage local
Remove-Item "dist.tar.gz"

Write-Host "[SUCCESS] Déploiement rapide terminé!" -ForegroundColor Green
Write-Host "Site: https://casskai.app" -ForegroundColor Cyan