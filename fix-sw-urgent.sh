#!/bin/bash
# Script de correction Service Worker - Urgence
# Exécuter sur le VPS: bash fix-sw-urgent.sh

echo "🔧 Correction Service Worker CassKai..."

# Supprimer complètement l'ancien Service Worker
rm -f /var/www/casskai.app/sw.js

# Créer le nouveau Service Worker DÉSACTIVÉ
cat > /var/www/casskai.app/sw.js << 'EOFMARKER'
// Service Worker DESACTIVE - Version simplifiee
self.addEventListener('install', function() {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

console.log('Service Worker desactive - Tous les caches supprimes');
EOFMARKER

# Permissions correctes
chown www-data:www-data /var/www/casskai.app/sw.js
chmod 644 /var/www/casskai.app/sw.js

# Redémarrer Nginx
systemctl reload nginx

echo "✅ Service Worker corrigé!"
echo "✅ Nginx rechargé!"
echo ""
echo "🌐 Visitez maintenant: https://casskai.app/clear-cache.html?auto=1"
echo ""
echo "Si le problème persiste, videz le cache navigateur (Ctrl+Shift+Delete)"
