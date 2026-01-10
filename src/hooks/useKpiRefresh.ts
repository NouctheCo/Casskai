/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 *
 * Hook pour gérer l'actualisation intelligente des KPIs
 * Utilisé partout où les KPIs sont affichés (Dashboard, pages de rapports, etc.)
 */
import { useEffect, useCallback, useRef } from 'react';
import { kpiCacheService, type KpiEvent } from '@/services/kpiCacheService';
import { logger } from '@/lib/logger';
export interface UseKpiRefreshOptions {
  onCacheInvalidated?: () => Promise<void>;
  onCacheUpdated?: () => Promise<void>;
  onError?: (event: KpiEvent) => void;
  subscribeToRealtime?: boolean;
}
/**
 * Hook pour gérer l'actualisation intelligente des KPIs
 *
 * Utilisation:
 * ```tsx
 * const { isRefreshing, lastUpdate } = useKpiRefresh(companyId, {
 *   onCacheInvalidated: async () => {
 *     const newKpis = await realDashboardKpiService.calculateRealKPIs(companyId);
 *     setKpiData(newKpis);
 *   },
 *   subscribeToRealtime: true
 * });
 * ```
 */
export function useKpiRefresh(
  companyId: string | undefined,
  options: UseKpiRefreshOptions = {}
) {
  const {
    onCacheInvalidated,
    onCacheUpdated,
    onError,
    subscribeToRealtime = true,
  } = options;
  const isRefreshingRef = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const unsubscribeEventRef = useRef<(() => void) | null>(null);
  // Callback pour invalider le cache
  const handleCacheInvalidated = useCallback(
    async (invalidatedCompanyId: string) => {
      if (invalidatedCompanyId !== companyId || isRefreshingRef.current) {
        return;
      }
      // Marquer comme en cours de rafraîchissement AVANT d'attendre
      isRefreshingRef.current = true;
      try {
        logger.debug('UseKpiRefresh', `[useKpiRefresh] Cache invalidé pour ${companyId}, rafraîchissage...`);
        await onCacheInvalidated?.();
        if (onCacheUpdated) {
          await onCacheUpdated();
        }
      } catch (error) {
        logger.error('UseKpiRefresh', '[useKpiRefresh] Erreur lors du rafraîchissement:', error);
        onError?.({
          type: 'error',
          companyId: companyId || 'unknown',
          timestamp: Date.now(),
          message: error instanceof Error ? error.message : 'Erreur de rafraîchissement',
        });
      } finally {
        // Intentionnel: réinitialiser après toute opération async complétée
        // eslint-disable-next-line require-atomic-updates
        isRefreshingRef.current = false;
      }
    },
    [companyId, onCacheInvalidated, onCacheUpdated, onError]
  );
  // Callback pour les événements KPI
  const handleKpiEvent = useCallback(
    (event: KpiEvent) => {
      if (event.companyId !== companyId && event.companyId !== 'global') {
        return;
      }
      logger.debug('UseKpiRefresh', `[useKpiRefresh] Événement KPI reçu:`, event.type);
      switch (event.type) {
        case 'cache_invalidated':
          handleCacheInvalidated(event.companyId);
          break;
        case 'data_updated':
          logger.debug('UseKpiRefresh', '[useKpiRefresh] Données mises à jour:', event.message);
          break;
        case 'error':
          onError?.(event);
          break;
      }
    },
    [companyId, handleCacheInvalidated, onError]
  );
  // Setup: Souscrire au cache + événements
  useEffect(() => {
    if (!companyId) {
      return;
    }
    logger.debug('UseKpiRefresh', `[useKpiRefresh] Setup pour ${companyId}`);
    // Souscrire aux invalidations de cache
    unsubscribeRef.current = kpiCacheService.onCacheInvalidated(
      companyId,
      handleCacheInvalidated
    );
    // Souscrire aux événements KPI
    unsubscribeEventRef.current = kpiCacheService.onKpiEvent(handleKpiEvent);
    // Souscrire aux changements temps réel Supabase
    if (subscribeToRealtime) {
      kpiCacheService.subscribeToChartOfAccounts(companyId);
      kpiCacheService.subscribeToJournalEntries(companyId);
    }
    // Cleanup
    return () => {
      logger.debug('UseKpiRefresh', `[useKpiRefresh] Cleanup pour ${companyId}`);
      unsubscribeRef.current?.();
      unsubscribeEventRef.current?.();
      // Ne pas unsubscribe les real-time ici, les laisser actifs
      // car d'autres composants pourraient en avoir besoin
    };
  }, [companyId, subscribeToRealtime, handleCacheInvalidated, handleKpiEvent]);
  return {
    isRefreshing: isRefreshingRef.current,
  };
}
/**
 * Alternative: Hook simple pour juste écouter les invalidations
 */
export function useKpiCacheListener(
  companyId: string | undefined,
  callback: () => Promise<void>
) {
  useEffect(() => {
    if (!companyId) {
      return;
    }
    const unsubscribe = kpiCacheService.onCacheInvalidated(companyId, async () => {
      try {
        await callback();
      } catch (error) {
        logger.error('UseKpiRefresh', '[useKpiCacheListener] Erreur:', error);
      }
    });
    return unsubscribe;
  }, [companyId, callback]);
}