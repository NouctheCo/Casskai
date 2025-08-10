// Service Worker pour CassKai - Offline-First avec performance optimisée
const CACHE_VERSION = 'v1.3.1';
const CACHE_NAMES = {
  static: `casskai-static-${CACHE_VERSION}`,
  dynamic: `casskai-dynamic-${CACHE_VERSION}`,
  api: `casskai-api-${CACHE_VERSION}`,
  images: `casskai-images-${CACHE_VERSION}`,
};

// Ressources à mettre en cache immédiatement
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Routes à précharger
const CRITICAL_ROUTES = [
  '/dashboard',
  '/auth',
  '/accounting',
];

// API endpoints à mettre en cache
const CACHEABLE_API_PATTERNS = [
  /\/api\/enterprises/,
  /\/api\/accounts/,
  /\/api\/settings/,
  /\/rest\/v1\/enterprises/,
  /\/rest\/v1\/user_profiles/,
];

// Stratégies de cache
const CACHE_STRATEGIES = {
  // Cache First - pour les assets statiques
  cacheFirst: async (request) => {
    const cache = await caches.open(CACHE_NAMES.static);
    const cached = await cache.match(request);
    return cached || fetch(request);
  },

  // Network First - pour les données dynamiques
  networkFirst: async (request) => {
    const cache = await caches.open(CACHE_NAMES.dynamic);
    try {
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await cache.match(request);
      return cached || new Response('Offline', { status: 503 });
    }
  },

  // Stale While Revalidate - pour les API
  staleWhileRevalidate: async (request) => {
    const cache = await caches.open(CACHE_NAMES.api);
    const cached = await cache.match(request);
    
    const fetchPromise = fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    });

    return cached || fetchPromise;
  },
};

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installation');
  
  event.waitUntil(
    Promise.all([
      // Pré-cache des assets statiques
      caches.open(CACHE_NAMES.static).then(cache => {
        console.log('📦 Mise en cache des assets statiques');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Pré-cache des routes critiques
      caches.open(CACHE_NAMES.dynamic).then(cache => {
        console.log('🌐 Pré-cache des routes critiques');
        return Promise.all(
          CRITICAL_ROUTES.map(route => 
            fetch(route).then(response => {
              if (response.ok) {
                return cache.put(route, response);
              }
            }).catch(() => {
              console.log(`⚠️ Impossible de pré-charger ${route}`);
            })
          )
        );
      }),
    ])
  );

  // Forcer l'activation immédiate
  self.skipWaiting();
});

// Activation et nettoyage
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activation');
  
  event.waitUntil(
    Promise.all([
      // Nettoyer les anciens caches
      caches.keys().then(cacheNames => {
        const validCaches = Object.values(CACHE_NAMES);
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!validCaches.includes(cacheName)) {
              console.log(`🗑️ Suppression du cache obsolète: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Prendre le contrôle de tous les clients
      self.clients.claim(),
    ])
  );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-HTTP
  if (!request.url.startsWith('http')) {
    return;
  }

  // Ignorer les requêtes de Chrome extensions
  if (request.url.includes('chrome-extension://')) {
    return;
  }

  // Stratégie selon le type de ressource
  event.respondWith(handleRequest(request, url));
});

async function handleRequest(request, url) {
  // Assets statiques (CSS, JS, fonts)
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'font' ||
      url.pathname.includes('/assets/')) {
    return CACHE_STRATEGIES.cacheFirst(request);
  }

  // Images
  if (request.destination === 'image') {
    return handleImageRequest(request);
  }

  // API Supabase
  if (url.hostname.includes('supabase') || 
      CACHEABLE_API_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return CACHE_STRATEGIES.staleWhileRevalidate(request);
  }

  // Pages HTML
  if (request.destination === 'document' || 
      request.headers.get('Accept')?.includes('text/html')) {
    return handlePageRequest(request);
  }

  // Autres requêtes - network first
  return CACHE_STRATEGIES.networkFirst(request);
}

// Gestion spécialisée des images
async function handleImageRequest(request) {
  const imageCache = await caches.open(CACHE_NAMES.images);
  const cached = await imageCache.match(request);
  
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      // Mettre en cache seulement les images < 1MB
      const contentLength = response.headers.get('content-length');
      if (!contentLength || parseInt(contentLength) < 1048576) {
        imageCache.put(request, response.clone());
      }
    }
    return response;
  } catch (error) {
    // Retourner une image placeholder en cas d'erreur
    return new Response(
      '<svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="200" height="150" fill="#f0f0f0"/>' +
      '<text x="100" y="75" text-anchor="middle" fill="#666">Image indisponible</text>' +
      '</svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// Gestion spécialisée des pages
async function handlePageRequest(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAMES.dynamic);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Retourner la page en cache ou la page offline
    const cache = await caches.open(CACHE_NAMES.dynamic);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }

    // Page offline par défaut
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>CassKai - Hors ligne</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
          }
          .container { max-width: 400px; padding: 2rem; }
          h1 { margin-bottom: 1rem; }
          button {
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            cursor: pointer;
            margin-top: 1rem;
          }
          button:hover { background: rgba(255,255,255,0.3); }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🌐 Vous êtes hors ligne</h1>
          <p>CassKai n'est pas accessible actuellement. Vérifiez votre connexion internet.</p>
          <button onclick="window.location.reload()">Réessayer</button>
        </div>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Messages de l'application
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_URLS':
      cacheUrls(payload.urls);
      break;

    case 'CLEAR_CACHE':
      clearCache(payload.cacheName);
      break;

    case 'GET_CACHE_SIZE':
      getCacheSize().then(size => {
        event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
      });
      break;
  }
});

// Fonction pour pré-charger des URLs
async function cacheUrls(urls) {
  const cache = await caches.open(CACHE_NAMES.dynamic);
  const promises = urls.map(async (url) => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        console.log(`✅ Mis en cache: ${url}`);
      }
    } catch (error) {
      console.log(`❌ Échec mise en cache: ${url}`);
    }
  });
  
  await Promise.all(promises);
}

// Fonction pour vider un cache
async function clearCache(cacheName) {
  if (cacheName && CACHE_NAMES[cacheName]) {
    await caches.delete(CACHE_NAMES[cacheName]);
    console.log(`🗑️ Cache vidé: ${cacheName}`);
  }
}

// Fonction pour calculer la taille du cache
async function getCacheSize() {
  let totalSize = 0;
  const cacheNames = await caches.keys();
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }
  
  return totalSize;
}

// Nettoyage périodique du cache
setInterval(async () => {
  const cacheSize = await getCacheSize();
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  if (cacheSize > maxSize) {
    console.log('🧹 Nettoyage automatique du cache');
    const imageCache = await caches.open(CACHE_NAMES.images);
    const requests = await imageCache.keys();
    
    // Supprimer les 25% d'images les plus anciennes
    const toDelete = requests.slice(0, Math.floor(requests.length * 0.25));
    await Promise.all(toDelete.map(req => imageCache.delete(req)));
  }
}, 30 * 60 * 1000); // Toutes les 30 minutes

console.log('🚀 Service Worker CassKai initialisé');