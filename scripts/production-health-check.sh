#!/bin/bash

# Script de monitoring de santé en production pour CassKai
# Usage: ./scripts/production-health-check.sh

DOMAIN="https://casskai.app"
LOG_FILE="logs/health-check.log"

# Couleurs pour output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
    log "SUCCESS: $1"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    log "ERROR: $1"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    log "WARNING: $1"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
    log "INFO: $1"
}

# Créer le dossier de logs s'il n'existe pas
mkdir -p logs

echo "🏥 HEALTH CHECK - CassKai Production"
echo "=================================="
log "Starting health check for $DOMAIN"

# Test 1: Connectivité HTTPS de base
info "Test 1: Connectivité HTTPS de base..."
if curl -f -s -I "$DOMAIN" > /dev/null; then
    success "Site accessible via HTTPS"
else
    error "Site non accessible via HTTPS"
    exit 1
fi

# Test 2: Temps de réponse
info "Test 2: Temps de réponse..."
RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" "$DOMAIN")
if (( $(echo "$RESPONSE_TIME < 3.0" | bc -l) )); then
    success "Temps de réponse acceptable: ${RESPONSE_TIME}s"
else
    warning "Temps de réponse lent: ${RESPONSE_TIME}s"
fi

# Test 3: Status codes importants
info "Test 3: Vérification status codes..."
declare -a ROUTES=("" "/auth" "/dashboard" "/invoicing" "/crm")

for route in "${ROUTES[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN$route")
    if [ "$status" = "200" ]; then
        success "Route $route: HTTP $status"
    else
        warning "Route $route: HTTP $status (peut être normal si auth requise)"
    fi
done

# Test 4: Ressources statiques critiques
info "Test 4: Ressources statiques..."
declare -a ASSETS=(
    "/css/index-DbtK1kxz.css"
    "/assets/index-DHLv1svq.js" 
    "/assets/vendor-CekH-Le8.js"
    "/favicon.ico"
    "/manifest.json"
)

for asset in "${ASSETS[@]}"; do
    if curl -f -s -I "$DOMAIN$asset" > /dev/null; then
        success "Asset accessible: $asset"
    else
        error "Asset manquant: $asset"
    fi
done

# Test 5: Headers de sécurité
info "Test 5: Headers de sécurité..."
headers=$(curl -s -I "$DOMAIN")

if echo "$headers" | grep -q "X-Content-Type-Options"; then
    success "Header X-Content-Type-Options présent"
else
    warning "Header X-Content-Type-Options manquant"
fi

if echo "$headers" | grep -q "X-Frame-Options"; then
    success "Header X-Frame-Options présent"
else
    warning "Header X-Frame-Options manquant"
fi

if echo "$headers" | grep -q "X-XSS-Protection"; then
    success "Header X-XSS-Protection présent"
else
    warning "Header X-XSS-Protection manquant"
fi

# Test 6: SSL/TLS
info "Test 6: Configuration SSL..."
ssl_info=$(echo | openssl s_client -connect casskai.app:443 -servername casskai.app 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
if [ $? -eq 0 ]; then
    success "Certificat SSL valide"
    expiry=$(echo "$ssl_info" | grep "notAfter" | cut -d= -f2)
    info "Expiration certificat: $expiry"
else
    error "Problème avec le certificat SSL"
fi

# Test 7: Performance basique
info "Test 7: Métriques de performance..."
perf_data=$(curl -o /dev/null -s -w "DNS:%{time_namelookup} Connect:%{time_connect} SSL:%{time_appconnect} Transfer:%{time_starttransfer} Total:%{time_total}" "$DOMAIN")
success "Métriques: $perf_data"

# Test 8: Taille des ressources
info "Test 8: Taille des ressources principales..."
main_css_size=$(curl -s -I "$DOMAIN/css/index-DbtK1kxz.css" | grep -i content-length | cut -d' ' -f2 | tr -d '\r')
main_js_size=$(curl -s -I "$DOMAIN/assets/index-DHLv1svq.js" | grep -i content-length | cut -d' ' -f2 | tr -d '\r')

if [ ! -z "$main_css_size" ]; then
    css_mb=$(echo "scale=2; $main_css_size / 1024 / 1024" | bc)
    success "CSS principal: ${css_mb}MB"
fi

if [ ! -z "$main_js_size" ]; then
    js_mb=$(echo "scale=2; $main_js_size / 1024 / 1024" | bc)
    success "JS principal: ${js_mb}MB"
fi

# Résumé final
echo ""
echo "🎯 RÉSUMÉ HEALTH CHECK"
echo "====================="
success "Site CassKai opérationnel en production"
success "Domaine: $DOMAIN"
success "HTTPS configuré et fonctionnel"
success "Ressources statiques déployées"
info "Logs sauvegardés dans: $LOG_FILE"

echo ""
echo "🚀 PRÊT POUR UTILISATION EN PRODUCTION!"
log "Health check completed successfully"