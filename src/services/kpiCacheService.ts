/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 *
 * Service de gestion du cache et synchronisation temps réel des KPIs
 */
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { getOfflineDB, isIndexedDBAvailable, OFFLINE_TTL } from '@/lib/offline-db';
import { MemoryCache } from '@/lib/cache';

/** @deprecated Use MemoryCache from @/lib/cache instead. Kept for type compatibility. */
export interface KpiCacheEntry {
  data: any;
  timestamp: number;
  isValid: boolean;
}
type KpiCacheListener = (companyId: string) => void;
type KpiEventListener = (event: KpiEvent) => void;
export interface KpiEvent {
  type: 'cache_invalidated' | 'data_updated' | 'error';
  companyId: string;
  timestamp: number;
  message?: string;
}
/**
 * Options pour le cache KPI
 */
export interface KpiCacheOptions {
  /** TTL en millisecondes (défaut: 5 min) */
  cacheTTL?: number;
  /** Recharger en arrière-plan après ce délai (défaut: 4 min 30s) */
  revalidateAfter?: number;
  /** Délai de debounce pour éviter rechargements multiples (défaut: 500ms) */
  debounceDelay?: number;
}
/**
 * Service centralisé pour gérer:
 * 1. Le cache des KPIs
 * 2. Les subscriptions temps réel Supabase
 * 3. Les événements de synchronisation
 * 4. Les fallback en cas de déconnexion
 */
export class KpiCacheService {
  private static instance: KpiCacheService;
  private cache: MemoryCache<any>;
  private cacheListeners = new Map<string, Set<KpiCacheListener>>();
  private eventListeners = new Set<KpiEventListener>();
  private subscriptions = new Map<string, RealtimeChannel>();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private REVALIDATE_AFTER = 4.5 * 60 * 1000; // 4.5 minutes (stale-while-revalidate)
  private DEBOUNCE_DELAY = 500; // 500ms
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private isRevalidating = new Map<string, boolean>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private constructor() {
    this.cache = new MemoryCache<any>(this.CACHE_TTL);
    this.setupGlobalErrorHandler();
  }
  /**
   * Singleton instance
   */
  static getInstance(): KpiCacheService {
    if (!KpiCacheService.instance) {
      KpiCacheService.instance = new KpiCacheService();
    }
    return KpiCacheService.instance;
  }
  /**
   * === REAL-TIME SUBSCRIPTIONS ===
   * Souscrire aux changements des comptes comptables en temps réel
   */
  subscribeToChartOfAccounts(companyId: string): void {
    // Éviter les doublons
    if (this.subscriptions.has(companyId)) {
      return;
    }
    logger.debug('KpiCache', `[KpiCacheService] Souscription temps réel pour entreprise: ${companyId}`);
    const channel = supabase
      .channel(`chart_of_accounts:${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'chart_of_accounts',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          logger.debug('KpiCache', `[KpiCacheService] Changement détecté sur chart_of_accounts:`, payload);
          this.invalidateCache(companyId);
          this.dispatchEvent({
            type: 'data_updated',
            companyId,
            timestamp: Date.now(),
            message: `Comptes comptables mis à jour (${payload.eventType})`,
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.debug('KpiCache', `[KpiCacheService] ✅ Souscription temps réel activée pour ${companyId}`);
          this.reconnectAttempts = 0;
        }
      });
    this.subscriptions.set(companyId, channel);
  }
  /**
   * Arrêter la souscription temps réel
   */
  unsubscribeFromChartOfAccounts(companyId: string): void {
    const channel = this.subscriptions.get(companyId);
    if (channel) {
      channel.unsubscribe();
      this.subscriptions.delete(companyId);
      logger.debug('KpiCache', `[KpiCacheService] Désouscription temps réel pour ${companyId}`);
    }
  }
  /**
   * === SOUSCRIRE AUX JOURNAL ENTRIES (mutations manuelles) ===
   * Fallback si real-time drop temporairement
   */
  subscribeToJournalEntries(companyId: string): void {
    if (this.subscriptions.has(`journal_entries:${companyId}`)) {
      return;
    }
    const channel = supabase
      .channel(`journal_entries:${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'journal_entries',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          logger.debug('KpiCache', `[KpiCacheService] Mutation journal entry détectée:`, payload.eventType);
          // Invalider + attendre un petit délai pour que le trigger SQL mette à jour chart_of_accounts
          setTimeout(() => {
            this.invalidateCache(companyId);
            this.dispatchEvent({
              type: 'cache_invalidated',
              companyId,
              timestamp: Date.now(),
              message: `Écriture comptable modifiée (${payload.eventType})`,
            });
          }, 500); // 500ms pour laisser le trigger faire son job
        }
      )
      .subscribe();
    this.subscriptions.set(`journal_entries:${companyId}`, channel);
  }

  /**
   * === SOUSCRIRE AUX FACTURES (invoices) ===
   * Temps réel pour CA, créances clients, DSO
   */
  subscribeToInvoices(companyId: string): void {
    if (this.subscriptions.has(`invoices:${companyId}`)) {
      return;
    }

    logger.debug('KpiCache', `[KpiCacheService] Souscription invoices pour ${companyId}`);

    const channel = supabase
      .channel(`invoices:${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          logger.debug('KpiCache', `[KpiCacheService] Facture modifiée:`, payload.eventType);

          // Invalider cache immédiatement (impact CA, créances, DSO)
          this.invalidateCache(companyId);
          this.dispatchEvent({
            type: 'cache_invalidated',
            companyId,
            timestamp: Date.now(),
            message: `Facture ${payload.eventType === 'INSERT' ? 'créée' : payload.eventType === 'UPDATE' ? 'modifiée' : 'supprimée'}`,
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.debug('KpiCache', `[KpiCacheService] ✅ Souscription invoices activée pour ${companyId}`);
        }
      });

    this.subscriptions.set(`invoices:${companyId}`, channel);
  }

  /**
   * === SOUSCRIRE AUX PAIEMENTS (payments) ===
   * Temps réel pour trésorerie, créances, BFR
   */
  subscribeToPayments(companyId: string): void {
    if (this.subscriptions.has(`payments:${companyId}`)) {
      return;
    }

    logger.debug('KpiCache', `[KpiCacheService] Souscription payments pour ${companyId}`);

    const channel = supabase
      .channel(`payments:${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          logger.debug('KpiCache', `[KpiCacheService] Paiement modifié:`, payload.eventType);

          // Invalider cache (impact trésorerie, BFR)
          this.invalidateCache(companyId);
          this.dispatchEvent({
            type: 'cache_invalidated',
            companyId,
            timestamp: Date.now(),
            message: `Paiement ${payload.eventType === 'INSERT' ? 'enregistré' : payload.eventType === 'UPDATE' ? 'modifié' : 'supprimé'}`,
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.debug('KpiCache', `[KpiCacheService] ✅ Souscription payments activée pour ${companyId}`);
        }
      });

    this.subscriptions.set(`payments:${companyId}`, channel);
  }

  /**
   * === SOUSCRIRE AUX TRANSACTIONS BANCAIRES (bank_transactions) ===
   * Temps réel pour trésorerie, soldes bancaires, rapprochements
   */
  subscribeToBankTransactions(companyId: string): void {
    if (this.subscriptions.has(`bank_transactions:${companyId}`)) {
      return;
    }

    logger.debug('KpiCache', `[KpiCacheService] Souscription bank_transactions pour ${companyId}`);

    const channel = supabase
      .channel(`bank_transactions:${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bank_transactions',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          logger.debug('KpiCache', `[KpiCacheService] Transaction bancaire modifiée:`, payload.eventType);

          // Invalider cache (impact trésorerie, soldes bancaires)
          this.invalidateCache(companyId);
          this.dispatchEvent({
            type: 'cache_invalidated',
            companyId,
            timestamp: Date.now(),
            message: `Transaction bancaire ${payload.eventType === 'INSERT' ? 'ajoutée' : payload.eventType === 'UPDATE' ? 'modifiée' : 'supprimée'}`,
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.debug('KpiCache', `[KpiCacheService] ✅ Souscription bank_transactions activée pour ${companyId}`);
        }
      });

    this.subscriptions.set(`bank_transactions:${companyId}`, channel);
  }

  /**
   * === GESTION DU CACHE ===
   */
  /**
   * Invalider le cache pour une entreprise
   */
  invalidateCache(companyId: string): void {
    this.cache.delete(companyId);
    this.notifyListeners(companyId);
  }
  /**
   * Stocker les données de KPI en cache
   */
  setCache(companyId: string, data: any): void {
    this.cache.set(companyId, data);
    logger.debug('KpiCache', `[KpiCacheService] Cache sauvegardé pour ${companyId}`);

    // Persister dans IndexedDB pour survie au refresh
    this.persistKpiToDexie(companyId, data);
  }

  private async persistKpiToDexie(companyId: string, data: any): Promise<void> {
    if (!isIndexedDBAvailable()) return;
    try {
      const db = getOfflineDB();
      await db.kpi_cache.put({
        company_id: companyId,
        data,
        updated_at: Date.now(),
      });
    } catch (error) {
      logger.warn('KpiCache', '[KpiCacheService] Dexie persist error:', error);
    }
  }
  /**
   * Récupérer les données du cache
   */
  getCache(companyId: string): any | null {
    return this.cache.get(companyId) ?? null;
  }

  /**
   * Recuperer depuis Dexie si le cache in-memory est vide (apres refresh page)
   */
  async getCacheWithDexieFallback(companyId: string): Promise<{ data: any; fromDexie: boolean } | null> {
    // D'abord le cache in-memory
    const memoryData = this.getCache(companyId);
    if (memoryData) {
      return { data: memoryData, fromDexie: false };
    }

    // Fallback Dexie
    if (!isIndexedDBAvailable()) return null;

    try {
      const db = getOfflineDB();
      const cached = await db.kpi_cache.get(companyId);
      if (!cached) return null;

      // Verifier TTL
      const isExpired = Date.now() - cached.updated_at > OFFLINE_TTL.KPI;
      if (isExpired && navigator.onLine) {
        // Expire et online : ne pas utiliser (refresh imminent)
        return null;
      }

      // Restaurer dans le cache in-memory with remaining TTL
      const age = Date.now() - cached.updated_at;
      const remainingTTL = Math.max(this.CACHE_TTL - age, 60_000); // at least 1 min
      this.cache.set(companyId, cached.data, remainingTTL);

      return { data: cached.data, fromDexie: true };
    } catch (error) {
      logger.warn('KpiCache', '[KpiCacheService] Dexie fallback error:', error);
      return null;
    }
  }
  /**
   * Vérifier si le cache est valide et fraîche
   */
  isCacheValid(companyId: string): boolean {
    return this.cache.has(companyId);
  }
  /**
   * Nettoyer complètement le cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.debug('KpiCache', '[KpiCacheService] Cache complètement vidé');
  }
  /**
   * === ÉVÉNEMENTS & LISTENERS ===
   */
  /**
   * S'abonner aux changements de cache
   */
  onCacheInvalidated(
    companyId: string,
    listener: KpiCacheListener
  ): () => void {
    if (!this.cacheListeners.has(companyId)) {
      this.cacheListeners.set(companyId, new Set());
    }
    this.cacheListeners.get(companyId)?.add(listener);
    // Retourner fonction de désabonnement
    return () => {
      this.cacheListeners.get(companyId)?.delete(listener);
    };
  }
  /**
   * S'abonner aux événements KPI
   */
  onKpiEvent(listener: KpiEventListener): () => void {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }
  /**
   * Notifier les listeners quand le cache est invalidé
   */
  private notifyListeners(companyId: string): void {
    const listeners = this.cacheListeners.get(companyId);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(companyId);
        } catch (error) {
          logger.error('KpiCache', '[KpiCacheService] Erreur notifying listener:', error);
        }
      });
    }
  }
  /**
   * Dispatcher un événement KPI
   */
  private dispatchEvent(event: KpiEvent): void {
    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        logger.error('KpiCache', '[KpiCacheService] Erreur dispatching event:', error);
      }
    });
  }
  /**
   * === GESTION DES ERREURS & RECONNEXION ===
   */
  private handleSubscriptionError(companyId: string, error: any): void {
    logger.error('KpiCache', `[KpiCacheService] Erreur souscription ${companyId}:`, error);
    this.dispatchEvent({
      type: 'error',
      companyId,
      timestamp: Date.now(),
      message: `Erreur connexion temps réel. Fallback: events manuels activés.`,
    });
    // Activer le fallback: écouter les mutations directes
    this.subscribeToJournalEntries(companyId);
    // Tenter reconnexion exponentielle
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // 2s, 4s, 8s, etc.
      logger.debug('kpiCache', 
        `[KpiCacheService] Tentative reconnexion dans ${delay}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );
      setTimeout(() => {
        this.subscribeToChartOfAccounts(companyId);
      }, delay);
    }
  }
  private setupGlobalErrorHandler(): void {
    window.addEventListener('offline', () => {
      logger.warn('KpiCache', '[KpiCacheService] ⚠️ Connexion perdue - switching to fallback mode');
      this.dispatchEvent({
        type: 'error',
        companyId: 'global',
        timestamp: Date.now(),
        message: 'Connexion perdue - les données seront synchronisées à la reconnexion',
      });
    });
    window.addEventListener('online', () => {
      logger.debug('KpiCache', '[KpiCacheService] ✅ Connexion rétablie - synchronisation');
      // Reconnecter toutes les subscriptions
      this.subscriptions.forEach((channel, companyKey) => {
        if (companyKey.includes(':')) {
          const companyId = companyKey.split(':')[1];
          this.subscribeToChartOfAccounts(companyId);
        }
      });
    });
  }
  /**
   * Cleanup lors de la déconnexion
   */
  cleanup(companyId?: string): void {
    if (companyId) {
      this.unsubscribeFromChartOfAccounts(companyId);
      const journalKey = `journal_entries:${companyId}`;
      const channel = this.subscriptions.get(journalKey);
      if (channel) {
        channel.unsubscribe();
        this.subscriptions.delete(journalKey);
      }
    } else {
      // Cleanup global
      this.subscriptions.forEach((channel) => channel.unsubscribe());
      this.subscriptions.clear();
      this.cache.clear();
    }
  }
}
// Export singleton
export const kpiCacheService = KpiCacheService.getInstance();