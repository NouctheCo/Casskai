# VPS FIX SCRIPT - Traefik vs Nginx Conflict Resolution
# Usage: .\fix-vps.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 === VPS FIX SCRIPT (PowerShell) === 🚀" -ForegroundColor Green
Write-Host ""

# STEP 1: Diagnostic
Write-Host "[INFO] Step 1: Diagnostic check..." -ForegroundColor Green
Write-Host ""
Write-Host "🔍 Checking Docker status..." -ForegroundColor Cyan
docker ps
Write-Host ""

# STEP 2: Backup current state
Write-Host "[INFO] Step 2: Backing up current state..." -ForegroundColor Green
$BackupDir = ".\backups\$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
docker ps -a | Out-File "$BackupDir\containers-before.log"
docker images | Out-File "$BackupDir\images-before.log"
Copy-Item docker-compose.yml "$BackupDir\docker-compose.yml.bak"
Write-Host "[INFO] Backup created in $BackupDir" -ForegroundColor Green
Write-Host ""

# STEP 3: Stop conflicting services
Write-Host "[WARN] Step 3: Stopping conflicting services..." -ForegroundColor Yellow
try {
    docker-compose down 2>&1 | Out-Null
} catch {
    Write-Host "[WARN] docker-compose down failed, continuing..." -ForegroundColor Yellow
}

foreach ($container in @("casskai-app-prod", "casskai-nginx", "nginx", "traefik")) {
    try {
        docker stop $container 2>$null
        Write-Host "[INFO] Stopped $container" -ForegroundColor Green
    } catch {
        Write-Host "[WARN] $container not running" -ForegroundColor Yellow
    }
}
Write-Host ""

# STEP 4: Clean up
Write-Host "[INFO] Step 4: Cleaning up unused Docker resources..." -ForegroundColor Green
try {
    docker system prune -f --volumes 2>&1 | Out-Null
} catch {
    Write-Host "[WARN] docker prune failed" -ForegroundColor Yellow
}
Write-Host ""

# STEP 5: Start Traefik and app-prod
Write-Host "[INFO] Step 5: Starting Traefik and app-prod..." -ForegroundColor Green
docker-compose -f docker-compose.yml -f docker-compose.traefik.yml up -d traefik app-prod
Write-Host ""
Write-Host "[INFO] Waiting for services to start..." -ForegroundColor Green
Start-Sleep -Seconds 10
Write-Host ""

# STEP 6: Health check
Write-Host "[INFO] Step 6: Health check..." -ForegroundColor Green
Write-Host "Checking Traefik logs:" -ForegroundColor Cyan
docker logs casskai-traefik 2>&1 | Select-Object -Last 20
Write-Host ""
Write-Host "Checking app-prod logs:" -ForegroundColor Cyan
docker logs casskai-app-prod 2>&1 | Select-Object -Last 20
Write-Host ""

# STEP 7: Display status
Write-Host "[INFO] Step 7: Final status..." -ForegroundColor Green
docker-compose ps
Write-Host ""

Write-Host "✅ VPS FIX COMPLETED!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Verify your domain DNS is pointing to this VPS IP"
Write-Host "2. Update .env with your domain name (DOMAIN_NAME=your-domain.com)"
Write-Host "3. Update ACME_EMAIL in .env for Let's Encrypt"
Write-Host "4. Monitor: docker-compose logs -f traefik"
Write-Host "5. Dashboard: http://localhost:8080 (or traefik.your-domain.com)"
Write-Host ""
