// Service Worker DÉSACTIVÉ - Cause des conflits avec Vite
// Pour le réactiver, voir sw.js.backup

self.addEventListener('install', () => {
  console.log('🚫 Service Worker désactivé - Installation en mode nettoyage');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('🚫 Service Worker désactivé - Nettoyage des caches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

// Ne rien faire pour les requêtes fetch - laisser passer directement
self.addEventListener('fetch', () => {
  // Service worker désactivé - aucune interception
});

console.log('🚫 Service Worker désactivé - Mode passthrough actif');
