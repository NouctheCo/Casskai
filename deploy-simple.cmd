@echo off
echo [DEPLOY] Deploiement simplifie CassKai VPS...

REM 1. Build
if not exist "dist\" (
    echo [BUILD] Construction du projet...
    npm run build
    if errorlevel 1 (
        echo [ERROR] Erreur lors du build
        exit /b 1
    )
)

REM 2. Upload vers repertoire temporaire
echo [UPLOAD] Envoi des fichiers vers le VPS...
scp -o ConnectTimeout=10 -r dist/* root@89.116.111.88:/var/www/casskai.app.tmp/

REM 3. Deploiement atomique via SSH
echo [DEPLOY] Deploiement atomique...
ssh -o ConnectTimeout=10 root@89.116.111.88 "mkdir -p /var/www/casskai.app.tmp && rm -rf /var/www/casskai.app.tmp/* && echo 'Repertoire prepare'"

scp -o ConnectTimeout=10 -r dist/* root@89.116.111.88:/var/www/casskai.app.tmp/

ssh -o ConnectTimeout=10 root@89.116.111.88 "cd /var/www && find casskai.app/ -maxdepth 1 -type f -name '*.html' -delete && find casskai.app/ -maxdepth 1 -type f -name '*.js' -delete && find casskai.app/ -maxdepth 1 -type f -name '*.css' -delete && rm -rf casskai.app/assets && mv casskai.app.tmp/* casskai.app/ && rmdir casskai.app.tmp && chown -R www-data:www-data casskai.app && echo 'Fichiers deployes'"

REM 4. Redemarrage des services
echo [SERVICES] Redemarrage des services...
ssh -o ConnectTimeout=10 root@89.116.111.88 "pkill nginx; sleep 2; nginx && echo 'Nginx redemarré'"

REM 5. Test
echo [TEST] Test de sante...
curl -I https://casskai.app/

echo [SUCCESS] Deploiement termine!
echo Votre site est disponible sur: https://casskai.app