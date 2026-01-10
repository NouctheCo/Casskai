#!/bin/bash

# DEPLOY CASSKAI BACKEND API TO VPS
# Run from your local machine

set -e

echo "🚀 Deploying Casskai Backend API to VPS..."

# Configuration
VPS_HOST="root@89.116.111.88"
VPS_PATH="/var/www/casskai.app/api"
LOCAL_BACKEND="./backend"

echo "📦 Step 1: Creating backup on VPS..."
ssh $VPS_HOST "mkdir -p $VPS_PATH.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true"

echo "📂 Step 2: Creating API directory..."
ssh $VPS_HOST "mkdir -p $VPS_PATH"

echo "📤 Step 3: Uploading backend files..."
scp -r $LOCAL_BACKEND/* $VPS_HOST:$VPS_PATH/

echo "🔧 Step 4: Installing dependencies on VPS..."
ssh $VPS_HOST "cd $VPS_PATH && npm install --production"

echo "📝 Step 5: Creating .env on VPS..."
ssh $VPS_HOST "cat > $VPS_PATH/.env << 'EOF'
PORT=3001
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
ALLOWED_ORIGINS=https://casskai.app,https://www.casskai.app
NODE_ENV=production
EOF"

echo "⚠️  WARNING: Update .env with real credentials!"
echo "Run on VPS: nano $VPS_PATH/.env"

echo "🔄 Step 6: Restarting PM2..."
ssh $VPS_HOST "cd $VPS_PATH && pm2 restart casskai-api || pm2 start server.js --name casskai-api"
ssh $VPS_HOST "pm2 save"

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps on VPS:"
echo "1. ssh $VPS_HOST"
echo "2. cd $VPS_PATH"
echo "3. nano .env  # Add your real credentials"
echo "4. pm2 restart casskai-api"
echo "5. pm2 logs casskai-api"
echo ""
echo "🔍 Test: curl -I http://localhost:3001/health"
