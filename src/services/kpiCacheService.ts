/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 *
 * Service de gestion du cache et synchronisation temps réel des KPIs
 */

import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

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
 * Service centralisé pour gérer:
 * 1. Le cache des KPIs
 * 2. Les subscriptions temps réel Supabase
 * 3. Les événements de synchronisation
 * 4. Les fallback en cas de déconnexion
 */
export class KpiCacheService {
  private static instance: KpiCacheService;
  private cache = new Map<string, KpiCacheEntry>();
  private cacheListeners = new Map<string, Set<KpiCacheListener>>();
  private eventListeners = new Set<KpiEventListener>();
  private subscriptions = new Map<string, RealtimeChannel>();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  private constructor() {
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

    console.log(`[KpiCacheService] Souscription temps réel pour entreprise: ${companyId}`);

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
          console.log(`[KpiCacheService] Changement détecté sur chart_of_accounts:`, payload);
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
          console.log(`[KpiCacheService] ✅ Souscription temps réel activée pour ${companyId}`);
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
      console.log(`[KpiCacheService] Désouscription temps réel pour ${companyId}`);
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
          console.log(`[KpiCacheService] Mutation journal entry détectée:`, payload.eventType);
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
   * === GESTION DU CACHE ===
   */

  /**
   * Invalider le cache pour une entreprise
   */
  invalidateCache(companyId: string): void {
    const entry = this.cache.get(companyId);
    if (entry) {
      entry.isValid = false;
      entry.timestamp = Date.now() - this.CACHE_TTL; // Force expiration
    }
    this.notifyListeners(companyId);
  }

  /**
   * Stocker les données de KPI en cache
   */
  setCache(companyId: string, data: any): void {
    this.cache.set(companyId, {
      data,
      timestamp: Date.now(),
      isValid: true,
    });
    console.log(`[KpiCacheService] Cache sauvegardé pour ${companyId}`);
  }

  /**
   * Récupérer les données du cache
   */
  getCache(companyId: string): any | null {
    const entry = this.cache.get(companyId);

    if (!entry) {
      return null;
    }

    // Vérifier l'expiration
    const isExpired = Date.now() - entry.timestamp > this.CACHE_TTL;
    if (isExpired) {
      this.cache.delete(companyId);
      return null;
    }

    if (!entry.isValid) {
      return null; // Cache marqué comme invalide
    }

    return entry.data;
  }

  /**
   * Vérifier si le cache est valide et fraîche
   */
  isCacheValid(companyId: string): boolean {
    const entry = this.cache.get(companyId);
    if (!entry || !entry.isValid) {
      return false;
    }

    const isExpired = Date.now() - entry.timestamp > this.CACHE_TTL;
    return !isExpired;
  }

  /**
   * Nettoyer complètement le cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[KpiCacheService] Cache complètement vidé');
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
          console.error('[KpiCacheService] Erreur notifying listener:', error);
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
        console.error('[KpiCacheService] Erreur dispatching event:', error);
      }
    });
  }

  /**
   * === GESTION DES ERREURS & RECONNEXION ===
   */

  private handleSubscriptionError(companyId: string, error: any): void {
    console.error(`[KpiCacheService] Erreur souscription ${companyId}:`, error);

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
      console.log(
        `[KpiCacheService] Tentative reconnexion dans ${delay}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        this.subscribeToChartOfAccounts(companyId);
      }, delay);
    }
  }

  private setupGlobalErrorHandler(): void {
    window.addEventListener('offline', () => {
      console.warn('[KpiCacheService] ⚠️ Connexion perdue - switching to fallback mode');
      this.dispatchEvent({
        type: 'error',
        companyId: 'global',
        timestamp: Date.now(),
        message: 'Connexion perdue - les données seront synchronisées à la reconnexion',
      });
    });

    window.addEventListener('online', () => {
      console.log('[KpiCacheService] ✅ Connexion rétablie - synchronisation');
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
