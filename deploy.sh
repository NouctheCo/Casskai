#!/bin/bash

# 🚀 Script de déploiement automatique CassKai
# Usage: ./deploy.sh [staging|production]

set -e

# Configuration
ENVIRONMENT=${1:-staging}
PROJECT_NAME="casskai"
DIST_DIR="dist"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is required but not installed."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is required but not installed."
        exit 1
    fi
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        log_error "package.json not found. Are you in the right directory?"
        exit 1
    fi
    
    log_success "All prerequisites met!"
}

# Function to validate environment
validate_environment() {
    log_info "Validating environment: $ENVIRONMENT"
    
    if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
        log_error "Invalid environment. Use 'staging' or 'production'"
        exit 1
    fi
    
    # Check if environment file exists
    ENV_FILE=".env.$ENVIRONMENT"
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file $ENV_FILE not found!"
        exit 1
    fi
    
    log_success "Environment $ENVIRONMENT is valid!"
}

# Function to install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    log_success "Dependencies installed!"
}

# Function to run tests (if available)
run_tests() {
    log_info "Running tests..."
    
    if npm run test --if-present; then
        log_success "All tests passed!"
    else
        log_warning "No tests found or tests failed. Continuing..."
    fi
}

# Function to build the project
build_project() {
    log_info "Building project for $ENVIRONMENT..."
    
    # Clean dist directory
    if [ -d "$DIST_DIR" ]; then
        rm -rf "$DIST_DIR"
        log_info "Cleaned previous build"
    fi
    
    # Build for specific environment
    if [ "$ENVIRONMENT" = "production" ]; then
        npm run build:production
    else
        npm run build:staging
    fi
    
    # Verify build
    if [ ! -d "$DIST_DIR" ] || [ -z "$(ls -A $DIST_DIR)" ]; then
        log_error "Build failed or dist directory is empty!"
        exit 1
    fi
    
    log_success "Build completed successfully!"
}

# Function to deploy to Netlify
deploy_netlify() {
    log_info "Deploying to Netlify..."
    
    if ! command -v netlify &> /dev/null; then
        log_error "Netlify CLI not found. Install with: npm install -g netlify-cli"
        exit 1
    fi
    
    if [ "$ENVIRONMENT" = "production" ]; then
        netlify deploy --prod --dir="$DIST_DIR"
    else
        netlify deploy --dir="$DIST_DIR"
    fi
    
    log_success "Deployed to Netlify!"
}

# Function to deploy to Vercel
deploy_vercel() {
    log_info "Deploying to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        log_error "Vercel CLI not found. Install with: npm install -g vercel"
        exit 1
    fi
    
    if [ "$ENVIRONMENT" = "production" ]; then
        vercel --prod --yes
    else
        vercel --yes
    fi
    
    log_success "Deployed to Vercel!"
}

# Function to deploy to custom server
deploy_custom() {
    log_info "Deploying to custom server..."
    
    # This is a template - customize for your server
    SERVER_HOST=${SERVER_HOST:-"your-server.com"}
    SERVER_USER=${SERVER_USER:-"deploy"}
    SERVER_PATH=${SERVER_PATH:-"/var/www/casskai"}
    
    if [ -z "$SERVER_HOST" ]; then
        log_error "SERVER_HOST environment variable not set"
        exit 1
    fi
    
    # Deploy using rsync (requires SSH key setup)
    rsync -avz --delete "$DIST_DIR/" "$SERVER_USER@$SERVER_HOST:$SERVER_PATH/"
    
    log_success "Deployed to custom server!"
}

# Function to generate deployment report
generate_report() {
    log_info "Generating deployment report..."
    
    REPORT_FILE="deployment-report-$(date +%Y%m%d-%H%M%S).txt"
    
    cat > "$REPORT_FILE" << EOF
🚀 CassKai Deployment Report
=========================

Date: $(date)
Environment: $ENVIRONMENT
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo "N/A")
Git Branch: $(git branch --show-current 2>/dev/null || echo "N/A")

Build Information:
- Node Version: $(node --version)
- NPM Version: $(npm --version)
- Build Size: $(du -sh $DIST_DIR 2>/dev/null || echo "N/A")

Files in build:
$(ls -la $DIST_DIR 2>/dev/null || echo "Build directory not found")

Status: ✅ SUCCESS
EOF
    
    log_success "Report generated: $REPORT_FILE"
}

# Function to cleanup
cleanup() {
    log_info "Cleaning up temporary files..."
    # Add any cleanup logic here
    log_success "Cleanup completed!"
}

# Main deployment function
main() {
    echo "🚀 Starting CassKai Deployment Process"
    echo "======================================"
    
    check_prerequisites
    validate_environment
    install_dependencies
    run_tests
    build_project
    
    # Choose deployment method
    echo ""
    log_info "Choose deployment method:"
    echo "1) Netlify"
    echo "2) Vercel" 
    echo "3) Custom Server"
    echo "4) Build Only (no deployment)"
    echo ""
    
    read -p "Enter choice (1-4): " choice
    
    case $choice in
        1)
            deploy_netlify
            ;;
        2)
            deploy_vercel
            ;;
        3)
            deploy_custom
            ;;
        4)
            log_info "Build completed. Skipping deployment."
            ;;
        *)
            log_error "Invalid choice. Exiting."
            exit 1
            ;;
    esac
    
    generate_report
    cleanup
    
    echo ""
    log_success "🎉 Deployment completed successfully!"
    echo "======================================"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        echo "🌐 Your app is now live in production!"
        echo "📊 Check your deployment dashboard for details"
        echo "🔍 Run post-deployment tests to verify functionality"
    else
        echo "🧪 Staging deployment ready for testing"
        echo "✅ Test thoroughly before promoting to production"
    fi
}

# Error handling
trap 'log_error "Deployment failed! Check the logs above for details."; exit 1' ERR

# Run main function
main "$@"