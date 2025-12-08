/**
 * Système de cache simple pour éviter les rechargements inutiles des données
 * Améliore l'expérience utilisateur en gardant les données en mémoire
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // en millisecondes
}

class PageCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  
  /**
   * Récupérer une valeur du cache
   * @param key Clé du cache
   * @returns La valeur si elle existe et n'a pas expiré, undefined sinon
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    const now = Date.now();
    const isExpired = (now - entry.timestamp) > entry.expiresIn;
    
    if (isExpired) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.data as T;
  }
  
  /**
   * Stocker une valeur dans le cache
   * @param key Clé du cache
   * @param data Données à stocker
   * @param expiresIn Durée de validité en millisecondes (défaut: 5 minutes)
   */
  set<T>(key: string, data: T, expiresIn: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn
    });
  }
  
  /**
   * Invalider une entrée du cache
   * @param key Clé du cache à invalider
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Invalider toutes les entrées correspondant à un préfixe
   * @param prefix Préfixe des clés à invalider
   */
  invalidatePrefix(prefix: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
  
  /**
   * Vider tout le cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Nettoyer les entrées expirées
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      const isExpired = (now - entry.timestamp) > entry.expiresIn;
      if (isExpired) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Instance singleton
export const pageCache = new PageCache();

// Nettoyer le cache toutes les 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    pageCache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Hook React pour utiliser le cache de page
 */
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { expiresIn?: number; enabled?: boolean } = {}
): {
  data: T | undefined;
  isLoading: boolean;
  refetch: () => Promise<void>;
} {
  const [data, setData] = React.useState<T | undefined>(pageCache.get<T>(key));
  const [isLoading, setIsLoading] = React.useState(false);
  const { expiresIn = 5 * 60 * 1000, enabled = true } = options;

  const fetchData = React.useCallback(async () => {
    if (!enabled) return;
    
    setIsLoading(true);
    try {
      const result = await fetcher();
      pageCache.set(key, result, expiresIn);
      setData(result);
    } catch (error) {
      console.error(`Erreur lors du chargement des données pour ${key}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, expiresIn, enabled]);

  React.useEffect(() => {
    const cached = pageCache.get<T>(key);
    if (cached) {
      setData(cached);
    } else if (enabled) {
      fetchData();
    }
  }, [key, fetchData, enabled]);

  return {
    data,
    isLoading,
    refetch: fetchData
  };
}

// Importer React pour le hook
import React from 'react';
