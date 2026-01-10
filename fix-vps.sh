#!/bin/bash

# VPS FIX SCRIPT - Traefik vs Nginx Conflict Resolution
# Usage: bash fix-vps.sh

set -e

echo "🚀 === VPS FIX SCRIPT === 🚀"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# STEP 1: Diagnostic
log_info "Step 1: Diagnostic check..."
echo ""
echo "🔍 Checking Docker status..."
docker ps
echo ""
echo "🔍 Checking which services are listening on ports 80/443..."
sudo netstat -tulpn 2>/dev/null | grep -E ':(80|443)' || echo "No services on 80/443 currently"
echo ""

# STEP 2: Backup current state
log_info "Step 2: Backing up current state..."
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
docker ps -a > "$BACKUP_DIR/containers-before.log"
docker images > "$BACKUP_DIR/images-before.log"
cp docker-compose.yml "$BACKUP_DIR/docker-compose.yml.bak"
log_info "Backup created in $BACKUP_DIR"
echo ""

# STEP 3: Stop conflicting services
log_warn "Step 3: Stopping conflicting services..."
docker-compose down 2>&1 || true
docker stop casskai-app-prod 2>/dev/null || log_warn "casskai-app-prod not running"
docker stop casskai-nginx 2>/dev/null || log_warn "casskai-nginx not running"
docker stop nginx 2>/dev/null || log_warn "nginx not running"
docker stop traefik 2>/dev/null || log_warn "traefik not running"
echo ""

# STEP 4: Clean up
log_info "Step 4: Cleaning up unused Docker resources..."
docker system prune -f --volumes || true
echo ""

# STEP 5: Verify ports are free
log_info "Step 5: Verifying ports 80/443 are free..."
if sudo netstat -tulpn 2>/dev/null | grep -E ':(80|443)'; then
    log_error "Ports 80/443 are still in use!"
    log_error "Kill processes manually or restart the system"
    exit 1
fi
log_info "✅ Ports 80/443 are free"
echo ""

# STEP 6: Start Traefik and app-prod
log_info "Step 6: Starting Traefik and app-prod..."
docker-compose -f docker-compose.yml -f docker-compose.traefik.yml up -d traefik app-prod
echo ""
log_info "Waiting for services to start..."
sleep 10
echo ""

# STEP 7: Health check
log_info "Step 7: Health check..."
log_info "Checking Traefik..."
docker logs casskai-traefik 2>&1 | tail -20
echo ""
log_info "Checking app-prod..."
docker logs casskai-app-prod 2>&1 | tail -20
echo ""

# STEP 8: Verify ports
log_info "Step 8: Final verification..."
echo "🔍 Services listening on ports 80/443:"
sudo netstat -tulpn 2>/dev/null | grep -E ':(80|443)' || echo "ERROR: No services on 80/443!"
echo ""

log_info "Testing HTTP access..."
curl -v http://localhost/ 2>&1 | head -20 || log_warn "HTTP not accessible yet (might need DNS/cert setup)"
echo ""

# STEP 9: Display status
log_info "Step 9: Final status..."
docker-compose ps
echo ""

log_info "✅ VPS FIX COMPLETED!"
echo ""
echo "📝 Next steps:"
echo "1. Verify your domain DNS is pointing to this VPS IP"
echo "2. Update .env with your domain name (DOMAIN_NAME=your-domain.com)"
echo "3. Update ACME_EMAIL in .env for Let's Encrypt"
echo "4. Monitor: docker-compose logs -f traefik"
echo "5. Dashboard: http://localhost:8080 (or traefik.your-domain.com)"
echo ""
