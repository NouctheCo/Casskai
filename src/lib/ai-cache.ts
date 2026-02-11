/**
 * CassKai - Système de caching intelligent pour IA
 * Réduit les appels OpenAI en cachant les résultats
 * 
 * Économies estimées : 70% des appels récurrents
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface CacheEntry {
  id: string;
  company_id: string;
  cache_key: string;
  cache_type: 'document_analysis' | 'bank_categorization' | 'chat' | 'suggestion';
  cached_result: Record<string, any>;
  hit_count: number;
  created_at: string;
  expires_at: string;
  metadata?: Record<string, any>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  savedApiCalls: number;
  estimatedSavings: number; // en euros
}

/**
 * Générateur de clé de cache unique
 * Utilise hash pour éviter les clés trop longues
 */
function generateCacheKey(
  type: CacheEntry['cache_type'],
  data: Record<string, any>
): string {
  const dataStr = JSON.stringify(data);
  // Créer un hash simple basé sur le contenu
  let hash = 0;
  for (let i = 0; i < dataStr.length; i++) {
    const char = dataStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir en entier 32-bit
  }
  return `${type}-${Math.abs(hash).toString(16)}`;
}

/**
 * Service de caching pour IA
 * Intégré à Supabase pour persistence
 */
class AICacheService {
  private readonly CACHE_TTL_HOURS = {
    document_analysis: 30 * 24, // 30 jours (invoices ne changent pas souvent)
    bank_categorization: 24, // 24h (patterns changent lentement)
    chat: 7 * 24, // 7 jours (conversations archivées)
    suggestion: 12, // 12h (suggestions moins critiques)
  };

  /**
   * Récupère un résultat du cache
   * Incrémente le compteur de hits
   */
  async get<T>(
    companyId: string,
    cacheType: CacheEntry['cache_type'],
    lookupData: Record<string, any>
  ): Promise<T | null> {
    try {
      const cacheKey = generateCacheKey(cacheType, lookupData);

      const { data, error } = await supabase
        .from('ai_cache')
        .select('cached_result, expires_at, hit_count')
        .eq('company_id', companyId)
        .eq('cache_key', cacheKey)
        .eq('cache_type', cacheType)
        .gt('expires_at', new Date().toISOString())
        .limit(1)
        .single();

      if (error || !data) {
        logger.debug('[AICacheService] Cache miss:', { cacheKey, cacheType });
        return null;
      }

      // Incrémenter hit_count asynchronously (non-blocking)
      supabase
        .from('ai_cache')
        .update({ hit_count: data.hit_count + 1 })
        .eq('cache_key', cacheKey)
        .eq('company_id', companyId)
        .then(() => {
          logger.info('[AICacheService] Cache hit (count updated):', {
            cacheKey,
            newCount: data.hit_count + 1,
          });
        }, (err) => {
          logger.error('[AICacheService] Failed to update hit count:', err);
        });

      logger.info('[AICacheService] Cache hit:', { cacheKey, cacheType });
      return data.cached_result as T;
    } catch (error) {
      logger.error('[AICacheService] Get error:', error);
      return null; // Failover gracieux si cache indisponible
    }
  }

  /**
   * Stocke un résultat dans le cache
   */
  async set(
    companyId: string,
    cacheType: CacheEntry['cache_type'],
    lookupData: Record<string, any>,
    result: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      const cacheKey = generateCacheKey(cacheType, lookupData);
      const ttlHours = this.CACHE_TTL_HOURS[cacheType];
      const expiresAt = new Date(Date.now() + ttlHours * 3600000).toISOString();

      const { error } = await supabase.from('ai_cache').upsert(
        {
          company_id: companyId,
          cache_key: cacheKey,
          cache_type: cacheType,
          cached_result: result,
          hit_count: 0,
          expires_at: expiresAt,
          metadata,
          created_at: new Date().toISOString(),
        },
        {
          onConflict: 'cache_key,company_id',
        }
      );

      if (error) {
        logger.error('[AICacheService] Set error:', error);
        return false;
      }

      logger.info('[AICacheService] Cached result:', {
        cacheKey,
        cacheType,
        ttlHours,
      });
      return true;
    } catch (error) {
      logger.error('[AICacheService] Set exception:', error);
      return false; // Failover gracieux
    }
  }

  /**
   * Récupère les stats de cache pour l'affichage/monitoring
   */
  async getStats(companyId: string): Promise<CacheStats> {
    try {
      const { data, error } = await supabase
        .from('ai_cache')
        .select('hit_count, cache_type')
        .eq('company_id', companyId)
        .gt('expires_at', new Date().toISOString());

      if (error || !data) {
        return {
          hits: 0,
          misses: 0,
          hitRate: 0,
          savedApiCalls: 0,
          estimatedSavings: 0,
        };
      }

      const hits = data.reduce((sum, entry) => sum + entry.hit_count, 0);
      const totalAccesses = data.length;
      const hitRate = totalAccesses > 0 ? (hits / (hits + totalAccesses)) * 100 : 0;

      // Coûts estimés (en euros)
      // Document analysis: ~0.10€ par appel (vision API)
      // Bank categorization: ~0.01€ par batch
      // Chat: ~0.005€ par message
      const costPerCall = {
        document_analysis: 0.10,
        bank_categorization: 0.01,
        chat: 0.005,
        suggestion: 0.005,
      };

      const estimatedSavings = data.reduce((total, entry) => {
        const cost = costPerCall[entry.cache_type as keyof typeof costPerCall] || 0.005;
        return total + cost * entry.hit_count;
      }, 0);

      return {
        hits,
        misses: totalAccesses - hits,
        hitRate: Math.round(hitRate * 100) / 100,
        savedApiCalls: hits,
        estimatedSavings: Math.round(estimatedSavings * 100) / 100,
      };
    } catch (error) {
      logger.error('[AICacheService] Stats error:', error);
      return {
        hits: 0,
        misses: 0,
        hitRate: 0,
        savedApiCalls: 0,
        estimatedSavings: 0,
      };
    }
  }

  /**
   * Vide le cache pour une entreprise (maintenance)
   */
  async clearCache(companyId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_cache')
        .delete()
        .eq('company_id', companyId);

      if (error) {
        logger.error('[AICacheService] Clear cache error:', error);
        return false;
      }

      logger.info('[AICacheService] Cache cleared for company:', companyId);
      return true;
    } catch (error) {
      logger.error('[AICacheService] Clear cache exception:', error);
      return false;
    }
  }

  /**
   * Vide les entrées expirées (cleanup automatique)
   * À appeler périodiquement (ex: cron job)
   */
  async cleanupExpiredEntries(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('ai_cache')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('cache_key');

      if (error) {
        logger.error('[AICacheService] Cleanup error:', error);
        return 0;
      }

      const count = data?.length || 0;
      logger.info('[AICacheService] Cleaned up expired entries:', count);
      return count;
    } catch (error) {
      logger.error('[AICacheService] Cleanup exception:', error);
      return 0;
    }
  }

  /**
   * Récupère le top des requêtes cachées (pour analytics)
   */
  async getTopCachedQueries(
    companyId: string,
    limit: number = 10
  ): Promise<Array<{ cacheKey: string; hits: number; type: string }>> {
    try {
      const { data, error } = await supabase
        .from('ai_cache')
        .select('cache_key, hit_count, cache_type')
        .eq('company_id', companyId)
        .gt('expires_at', new Date().toISOString())
        .order('hit_count', { ascending: false })
        .limit(limit);

      if (error || !data) return [];

      return data.map((entry) => ({
        cacheKey: entry.cache_key,
        hits: entry.hit_count,
        type: entry.cache_type,
      }));
    } catch (error) {
      logger.error('[AICacheService] getTopCachedQueries error:', error);
      return [];
    }
  }
}

export const aiCacheService = new AICacheService();
