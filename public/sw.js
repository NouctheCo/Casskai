/**
 * CassKai - Service Worker PWA v2.0
 * Cache offline intelligent + Background Sync + Notifications push
 * Compatible Vite dev mode
 */

const CACHE_VERSION = 'v2.0.0';
const CACHE_NAME = `casskai-${CACHE_VERSION}`;
const SUPABASE_CACHE_NAME = `casskai-api-${CACHE_VERSION}`;
const IS_DEV = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

// Assets statiques essentiels (app shell - cache-first)
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/logo.svg',
  '/logo.png',
  '/offline.html'
];

// Patterns d'URLs a cacher pour les GET Supabase REST
const SUPABASE_GET_PATTERNS = [
  /supabase\.co\/rest\/v1\/(chart_of_accounts|journals|accounting_periods|companies|user_companies)/,
  /supabase\.co\/rest\/v1\/(invoices|journal_entries|payments|bank_transactions)/,
  /supabase\.co\/rest\/v1\/(third_parties|articles)/,
];

// Routes API a ne JAMAIS cacher
const NO_CACHE_PATTERNS = [
  '/api/',
  'functions/v1/',
  'localhost:5173',
  'supabase.co/auth/',
  'supabase.co/realtime/',
  'stripe.com',
];

// TTL court pour les reponses GET Supabase (5 minutes)
const SUPABASE_CACHE_TTL = 5 * 60 * 1000;

/**
 * Installation - Pre-cache app shell complet
 */
self.addEventListener('install', (event) => {
  console.log(`[CassKai SW] Installing ${CACHE_VERSION}...`);

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        if (IS_DEV) {
          console.log('[CassKai SW] Dev mode - Skipping pre-cache');
          return Promise.resolve();
        }
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          console.warn('[CassKai SW] Some assets failed to cache:', err);
          // Ne pas bloquer l'installation si certains assets manquent
          return Promise.resolve();
        });
      })
      .then(() => self.skipWaiting())
      .catch((err) => console.error('[CassKai SW] Install error:', err))
  );
});

/**
 * Activation - Nettoie anciens caches
 */
self.addEventListener('activate', (event) => {
  console.log('[CassKai SW] Activating...');

  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((name) => name.startsWith('casskai-') && name !== CACHE_NAME && name !== SUPABASE_CACHE_NAME)
          .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

/**
 * Helper: verifier si une URL correspond a un GET Supabase cacheable
 */
function isSupabaseGetCacheable(url) {
  return SUPABASE_GET_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Helper: verifier si une URL ne doit jamais etre cachee
 */
function isNoCacheUrl(href) {
  return NO_CACHE_PATTERNS.some((pattern) => href.includes(pattern));
}

/**
 * Fetch - Strategie differenciee
 * - App shell (HTML/CSS/JS) : Network First + cache fallback
 * - GET Supabase REST : Network First + cache court (5min)
 * - Mutations (POST/PUT/DELETE) : passthrough (gere par IndexedDB dans l'app)
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // En dev, laisser passer sans cache (Vite HMR)
  if (IS_DEV) return;

  // Ignorer non-GET
  if (request.method !== 'GET') return;

  // Ne JAMAIS cacher certaines URLs
  if (isNoCacheUrl(url.href)) return;

  // GET Supabase REST - Network First avec cache court
  if (isSupabaseGetCacheable(url.href)) {
    event.respondWith(handleSupabaseGet(request));
    return;
  }

  // App shell et assets - Network First avec cache fallback
  event.respondWith(handleAppShell(request));
});

/**
 * Strategie pour les requetes GET Supabase REST
 * Network first avec cache TTL court (5min)
 */
async function handleSupabaseGet(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const clone = response.clone();
      const cache = await caches.open(SUPABASE_CACHE_NAME);

      // Ajouter un header custom avec le timestamp pour TTL
      const headers = new Headers(clone.headers);
      headers.set('sw-cached-at', Date.now().toString());

      const cachedResponse = new Response(await clone.blob(), {
        status: clone.status,
        statusText: clone.statusText,
        headers,
      });

      cache.put(request, cachedResponse);
    }
    return response;
  } catch (error) {
    // Fallback : cache
    const cache = await caches.open(SUPABASE_CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
      // Verifier TTL
      const cachedAt = parseInt(cached.headers.get('sw-cached-at') || '0');
      if (Date.now() - cachedAt < SUPABASE_CACHE_TTL) {
        console.log('[CassKai SW] Serving Supabase data from cache:', new URL(request.url).pathname);
        return cached;
      }
      // Cache expire mais mieux que rien en offline
      console.log('[CassKai SW] Serving stale Supabase cache:', new URL(request.url).pathname);
      return cached;
    }

    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Strategie pour l'app shell et les assets
 * Network first avec cache fallback
 */
async function handleAppShell(request) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const clone = response.clone();
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, clone);
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      console.log('[CassKai SW] Serving from cache:', new URL(request.url).pathname);
      return cached;
    }

    // Page offline pour les documents
    if (request.destination === 'document') {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) return offlinePage;
      return caches.match('/');
    }

    return new Response('Offline', { status: 503 });
  }
}

/**
 * Background Sync (si supporte)
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'casskai-sync-queue') {
    console.log('[CassKai SW] Background sync triggered');
    event.waitUntil(notifyClientsToSync());
  }
});

/**
 * Notifier les clients (main thread) de synchroniser
 */
async function notifyClientsToSync() {
  const clientList = await clients.matchAll({ type: 'window' });
  for (const client of clientList) {
    client.postMessage({ type: 'SYNC_NOW' });
  }
}

/**
 * Push Notifications
 */
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const title = data.title || 'CassKai';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: data.url ? { url: data.url } : {},
    tag: 'casskai-notification'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/**
 * Notification Click - Ouvre l'app
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

/**
 * Messages depuis l'app
 */
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) =>
        Promise.all(names.map((name) => caches.delete(name)))
      )
    );
  }

  if (event.data?.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      getCacheSize().then((size) => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
        }
      })
    );
  }
});

/**
 * Calculer la taille totale des caches
 */
async function getCacheSize() {
  let totalSize = 0;
  const cacheNames = await caches.keys();
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    totalSize += keys.length;
  }
  return totalSize;
}

console.log(`[CassKai SW] ${CACHE_VERSION} loaded (dev: ${IS_DEV})`);
