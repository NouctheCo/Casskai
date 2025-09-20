#!/bin/bash

# Solution de déploiement VPS CassKai avec N8n/Traefik
echo "🚀 Fixing CassKai deployment on VPS with N8n/Traefik"

# 1. Build le projet local
echo "📦 Building project..."
npm run build:production

# 2. Upload les fichiers
echo "📤 Uploading files to VPS..."
scp -r dist/* root@89.116.111.88:/var/www/casskai.app/
scp backend/server.js root@89.116.111.88:/var/www/casskai.app/api/
scp package.json root@89.116.111.88:/var/www/casskai.app/api/

# 3. Configuration Nginx host pour port 8080
echo "🔧 Configuring Nginx on host..."
ssh root@89.116.111.88 << 'EOF'
# Créer la configuration Nginx pour servir le frontend sur port 8080
cat > /etc/nginx/sites-available/casskai-frontend << 'NGINX_CONFIG'
server {
    listen 8080;
    server_name localhost;
    root /var/www/casskai.app;
    index index.html;
    
    # Frontend React
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    # Assets avec cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_CONFIG

# Activer le site
ln -sf /etc/nginx/sites-available/casskai-frontend /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Tester et recharger Nginx
nginx -t && systemctl reload nginx
EOF

# 4. Installer les dépendances et redémarrer le backend
echo "🔄 Restarting backend..."
ssh root@89.116.111.88 << 'EOF'
cd /var/www/casskai.app/api
npm install --production
pkill -f "node.*server.js" || true
nohup node server.js > /tmp/casskai-backend.log 2>&1 &
sleep 2
ps aux | grep "node.*server.js"
EOF

# 5. Redémarrer le container Traefik/CassKai
echo "🐳 Restarting Docker containers..."
ssh root@89.116.111.88 << 'EOF'
cd /root
docker-compose restart casskai-proxy
sleep 5
docker-compose logs --tail=20 casskai-proxy
EOF

echo "✅ Deployment complete!"
echo "🌐 Test: https://casskai.app"
echo "📊 Backend health: https://casskai.app/api/health"