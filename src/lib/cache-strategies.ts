/**
 * CassKai - Advanced Cache Strategies
 *
 * Phase 2 (P1) - Optimisation Performance
 *
 * Fonctionnalités:
 * - 5 stratégies de cache configurables
 * - IndexedDB pour données structurées
 * - TTL (Time To Live) pour expiration automatique
 * - Background sync pour actions offline
 * - Préchargement intelligent
 * - Gestion automatique de la mémoire
 */

import { logger } from './logger';

/**
 * Types de stratégies de cache
 */
export type CacheStrategy =
  | 'cache-first' // Cache d'abord, réseau en fallback (images, fonts, CSS)
  | 'network-first' // Réseau d'abord, cache en fallback (API, données dynamiques)
  | 'cache-only' // Uniquement cache (offline-first strict)
  | 'network-only' // Uniquement réseau (pas de cache)
  | 'stale-while-revalidate'; // Cache immédiat + update en background

export interface CacheConfig {
  /** Nom du cache */
  name: string;
  /** Stratégie par défaut */
  strategy: CacheStrategy;
  /** TTL en secondes (0 = infini) */
  maxAge?: number;
  /** Nombre max d'entrées dans le cache */
  maxEntries?: number;
  /** Patterns d'URLs à matcher */
  urlPatterns?: RegExp[];
  /** Headers à inclure dans la clé de cache */
  cacheKeyHeaders?: string[];
}

/**
 * Classe principale pour gérer les caches
 */
export class CacheManager {
  private configs: Map<string, CacheConfig> = new Map();
  private db: IDBDatabase | null = null;

  constructor() {
    this.initIndexedDB();
  }

  /**
   * Initialiser IndexedDB pour métadonnées de cache
   */
  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('casskai-cache-meta', 1);

      request.onerror = () => {
        logger.error('CacheManager', 'Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        logger.debug('CacheManager', 'IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store pour métadonnées de cache
        if (!db.objectStoreNames.contains('cache-metadata')) {
          const store = db.createObjectStore('cache-metadata', { keyPath: 'url' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('cacheName', 'cacheName', { unique: false });
        }

        // Store pour sync background
        if (!db.objectStoreNames.contains('sync-queue')) {
          const store = db.createObjectStore('sync-queue', {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Enregistrer une configuration de cache
   */
  registerCache(config: CacheConfig): void {
    this.configs.set(config.name, config);
    logger.debug('CacheManager', 'Cache registered:', config.name);
  }

  /**
   * Obtenir la configuration pour une URL
   */
  private getConfigForUrl(url: string): CacheConfig | null {
    for (const [_, config] of this.configs) {
      if (config.urlPatterns) {
        for (const pattern of config.urlPatterns) {
          if (pattern.test(url)) {
            return config;
          }
        }
      }
    }
    return null;
  }

  /**
   * Générer clé de cache unique
   */
  private generateCacheKey(request: Request, headers?: string[]): string {
    const url = new URL(request.url);
    let key = url.href;

    if (headers && headers.length > 0) {
      const headerValues = headers
        .map((h) => `${h}:${request.headers.get(h) || ''}`)
        .join(';');
      key += `?headers=${encodeURIComponent(headerValues)}`;
    }

    return key;
  }

  /**
   * Stratégie: Cache First
   */
  async cacheFirst(request: Request, config: CacheConfig): Promise<Response> {
    const cache = await caches.open(config.name);
    const cached = await cache.match(request);

    if (cached && (await this.isValidCache(request.url, config))) {
      logger.debug('CacheManager', 'Cache hit (cache-first):', request.url);
      return cached;
    }

    try {
      const response = await fetch(request);
      if (response.ok) {
        await this.putInCache(cache, request, response.clone(), config);
      }
      return response;
    } catch (error) {
      // Fallback sur cache expiré si réseau échoue
      if (cached) {
        logger.warn('CacheManager', 'Network failed, serving stale cache:', request.url);
        return cached;
      }
      throw error;
    }
  }

  /**
   * Stratégie: Network First
   */
  async networkFirst(request: Request, config: CacheConfig): Promise<Response> {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(config.name);
        await this.putInCache(cache, request, response.clone(), config);
      }
      return response;
    } catch (error) {
      logger.warn('CacheManager', 'Network failed, trying cache:', request.url);
      const cache = await caches.open(config.name);
      const cached = await cache.match(request);

      if (cached) {
        return cached;
      }

      throw error;
    }
  }

  /**
   * Stratégie: Stale While Revalidate
   */
  async staleWhileRevalidate(request: Request, config: CacheConfig): Promise<Response> {
    const cache = await caches.open(config.name);
    const cached = await cache.match(request);

    // Retourner cache immédiatement et update en background
    const fetchPromise = fetch(request)
      .then((response) => {
        if (response.ok) {
          this.putInCache(cache, request, response.clone(), config);
        }
        return response;
      })
      .catch((error) => {
        logger.error('CacheManager', 'Background fetch failed:', error);
      });

    // Si cache existe, le retourner et laisser fetch se terminer en background
    if (cached) {
      logger.debug('CacheManager', 'Serving stale cache, revalidating:', request.url);
      return cached;
    }

    // Si pas de cache, attendre le fetch
    return fetchPromise as Promise<Response>;
  }

  /**
   * Ajouter dans le cache avec métadonnées
   */
  private async putInCache(
    cache: Cache,
    request: Request,
    response: Response,
    config: CacheConfig
  ): Promise<void> {
    await cache.put(request, response);

    // Sauvegarder métadonnées dans IndexedDB
    if (this.db) {
      const transaction = this.db.transaction(['cache-metadata'], 'readwrite');
      const store = transaction.objectStore('cache-metadata');

      store.put({
        url: request.url,
        cacheName: config.name,
        timestamp: Date.now(),
        maxAge: config.maxAge,
      });
    }

    // Nettoyer si dépassement de maxEntries
    if (config.maxEntries) {
      await this.enforceMaxEntries(cache, config);
    }

    logger.debug('CacheManager', 'Cached:', request.url);
  }

  /**
   * Vérifier si le cache est encore valide (TTL)
   */
  private async isValidCache(url: string, config: CacheConfig): Promise<boolean> {
    if (!config.maxAge || config.maxAge === 0) {
      return true; // Pas de TTL, toujours valide
    }

    if (!this.db) return true;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['cache-metadata'], 'readonly');
      const store = transaction.objectStore('cache-metadata');
      const request = store.get(url);

      request.onsuccess = () => {
        const metadata = request.result;
        if (!metadata) {
          resolve(false);
          return;
        }

        const age = (Date.now() - metadata.timestamp) / 1000; // en secondes
        const isValid = age < config.maxAge!;

        if (!isValid) {
          logger.debug('CacheManager', 'Cache expired:', url, `(${age.toFixed(0)}s)`);
        }

        resolve(isValid);
      };

      request.onerror = () => resolve(true); // En cas d'erreur, considérer valide
    });
  }

  /**
   * Appliquer limite maxEntries
   */
  private async enforceMaxEntries(cache: Cache, config: CacheConfig): Promise<void> {
    if (!config.maxEntries) return;

    const keys = await cache.keys();
    if (keys.length <= config.maxEntries) return;

    // Supprimer les plus anciennes entrées
    if (this.db) {
      const transaction = this.db.transaction(['cache-metadata'], 'readonly');
      const store = transaction.objectStore('cache-metadata');
      const index = store.index('timestamp');
      const request = index.openCursor();

      const toDelete: string[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const metadata = cursor.value;
          if (metadata.cacheName === config.name) {
            toDelete.push(metadata.url);
          }
          cursor.continue();
        } else {
          // Supprimer les plus anciennes
          const deleteCount = keys.length - (config.maxEntries ?? 0);
          const urlsToDelete = toDelete.slice(0, deleteCount);

          urlsToDelete.forEach((url) => {
            cache.delete(url);
          });

          logger.debug(
            'CacheManager',
            `Deleted ${urlsToDelete.length} old entries from ${config.name}`
          );
        }
      };
    }
  }

  /**
   * Nettoyer tous les caches expirés
   */
  async cleanupExpiredCaches(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['cache-metadata'], 'readwrite');
    const store = transaction.objectStore('cache-metadata');
    const request = store.openCursor();

    const toDelete: string[] = [];

    request.onsuccess = async (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const metadata = cursor.value;
        const config = this.configs.get(metadata.cacheName);

        if (config && config.maxAge) {
          const age = (Date.now() - metadata.timestamp) / 1000;
          if (age >= config.maxAge) {
            toDelete.push(metadata.url);
            cursor.delete();
          }
        }

        cursor.continue();
      } else {
        // Supprimer des caches
        for (const url of toDelete) {
          const cacheName = this.configs.get(url)?.name;
          if (cacheName) {
            const cache = await caches.open(cacheName);
            await cache.delete(url);
          }
        }

        logger.info('CacheManager', `Cleaned up ${toDelete.length} expired cache entries`);
      }
    };
  }

  /**
   * Ajouter une action à la queue de sync background
   */
  async addToSyncQueue(action: {
    url: string;
    method: string;
    body?: any;
    headers?: Record<string, string>;
  }): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['sync-queue'], 'readwrite');
    const store = transaction.objectStore('sync-queue');

    store.add({
      ...action,
      timestamp: Date.now(),
    });

    logger.debug('CacheManager', 'Added to sync queue:', action.url);
  }

  /**
   * Traiter la queue de sync
   */
  async processSyncQueue(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['sync-queue'], 'readwrite');
    const store = transaction.objectStore('sync-queue');
    const request = store.openCursor();

    request.onsuccess = async (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const action = cursor.value;

        try {
          await fetch(action.url, {
            method: action.method,
            body: action.body ? JSON.stringify(action.body) : undefined,
            headers: {
              'Content-Type': 'application/json',
              ...action.headers,
            },
          });

          cursor.delete();
          logger.info('CacheManager', 'Sync completed:', action.url);
        } catch (error) {
          logger.error('CacheManager', 'Sync failed:', action.url, error);
        }

        cursor.continue();
      }
    };
  }

  /**
   * Précharger URLs
   */
  async preloadUrls(urls: string[]): Promise<void> {
    const promises = urls.map(async (url) => {
      const config = this.getConfigForUrl(url);
      if (!config) return;

      try {
        const response = await fetch(url);
        if (response.ok) {
          const cache = await caches.open(config.name);
          await this.putInCache(cache, new Request(url), response, config);
        }
      } catch (error) {
        logger.warn('CacheManager', 'Preload failed:', url, error);
      }
    });

    await Promise.allSettled(promises);
    logger.info('CacheManager', `Preloaded ${urls.length} URLs`);
  }

  /**
   * Obtenir stats de cache
   */
  async getCacheStats(): Promise<{
    caches: Array<{ name: string; size: number; entries: number }>;
    totalSize: number;
    totalEntries: number;
  }> {
    const cacheNames = await caches.keys();
    const stats = await Promise.all(
      cacheNames.map(async (name) => {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        const entries = keys.length;

        // Estimer taille (approximatif)
        let size = 0;
        for (const request of keys.slice(0, 10)) {
          // Échantillon de 10
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            size += blob.size;
          }
        }
        size = Math.round((size / Math.min(10, entries)) * entries); // Extrapoler

        return { name, size, entries };
      })
    );

    const totalSize = stats.reduce((sum, s) => sum + s.size, 0);
    const totalEntries = stats.reduce((sum, s) => sum + s.entries, 0);

    return { caches: stats, totalSize, totalEntries };
  }
}

// Export singleton
export const cacheManager = new CacheManager();

/**
 * Configurations de cache prédéfinies
 */
export function setupCacheStrategies() {
  // Assets statiques (images, fonts, CSS) - Cache First avec TTL 7 jours
  cacheManager.registerCache({
    name: 'static-assets',
    strategy: 'cache-first',
    maxAge: 7 * 24 * 60 * 60, // 7 jours
    maxEntries: 100,
    urlPatterns: [
      /\.(png|jpg|jpeg|svg|gif|webp|avif)$/,
      /\.(woff|woff2|ttf|eot)$/,
      /\.css$/,
    ],
  });

  // JavaScript bundles - Stale While Revalidate
  cacheManager.registerCache({
    name: 'js-bundles',
    strategy: 'stale-while-revalidate',
    maxAge: 24 * 60 * 60, // 1 jour
    maxEntries: 50,
    urlPatterns: [/\.js$/],
  });

  // API responses - Network First avec TTL 5 minutes
  cacheManager.registerCache({
    name: 'api-responses',
    strategy: 'network-first',
    maxAge: 5 * 60, // 5 minutes
    maxEntries: 50,
    urlPatterns: [/\/api\//],
  });

  // Rapports générés - Cache First avec TTL 1 heure
  cacheManager.registerCache({
    name: 'reports',
    strategy: 'cache-first',
    maxAge: 60 * 60, // 1 heure
    maxEntries: 20,
    urlPatterns: [/\/reports\//],
  });

  logger.info('CacheManager', 'Cache strategies configured');
}
