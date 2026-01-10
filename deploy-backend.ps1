# DEPLOY CASSKAI BACKEND API TO VPS
# Run from PowerShell on Windows

$ErrorActionPreference = "Stop"

Write-Host "🚀 Deploying Casskai Backend API to VPS..." -ForegroundColor Green

# Configuration
$VPS_HOST = "root@89.116.111.88"
$VPS_PATH = "/var/www/casskai.app/api"
$LOCAL_BACKEND = ".\backend"

Write-Host "📦 Step 1: Creating backup on VPS..." -ForegroundColor Cyan
ssh $VPS_HOST "mkdir -p $VPS_PATH.backup.`$(date +%Y%m%d_%H%M%S) 2>/dev/null || true"

Write-Host "📂 Step 2: Creating API directory..." -ForegroundColor Cyan
ssh $VPS_HOST "mkdir -p $VPS_PATH"

Write-Host "📤 Step 3: Uploading backend files..." -ForegroundColor Cyan
scp -r "$LOCAL_BACKEND\*" "${VPS_HOST}:${VPS_PATH}/"

Write-Host "🔧 Step 4: Installing dependencies on VPS..." -ForegroundColor Cyan
ssh $VPS_HOST "cd $VPS_PATH && npm install --production"

Write-Host "📝 Step 5: Creating .env on VPS..." -ForegroundColor Cyan
$envContent = @"
PORT=3001
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
ALLOWED_ORIGINS=https://casskai.app,https://www.casskai.app
NODE_ENV=production
"@

ssh $VPS_HOST "cat > $VPS_PATH/.env << 'EOF'
$envContent
EOF"

Write-Host "⚠️  WARNING: Update .env with real credentials!" -ForegroundColor Yellow
Write-Host "Run on VPS: nano $VPS_PATH/.env" -ForegroundColor Yellow

Write-Host "🔄 Step 6: Restarting PM2..." -ForegroundColor Cyan
ssh $VPS_HOST "cd $VPS_PATH && pm2 restart casskai-api || pm2 start server.js --name casskai-api"
ssh $VPS_HOST "pm2 save"

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps on VPS:" -ForegroundColor Cyan
Write-Host "1. ssh $VPS_HOST"
Write-Host "2. cd $VPS_PATH"
Write-Host "3. nano .env  # Add your real credentials"
Write-Host "4. pm2 restart casskai-api"
Write-Host "5. pm2 logs casskai-api"
Write-Host ""
Write-Host "🔍 Test: curl -I http://localhost:3001/health"
