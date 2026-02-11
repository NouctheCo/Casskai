/**
 * Hook pour récupérer KPIs en temps réel via Supabase Realtime
 * Subscribe automatiquement aux changements et refresh les KPIs
 *
 * @module useRealtimeKPIs
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeService, createChannelName, createCompanyFilter, debounceRealtimeCallback } from '@/services/realtimeService';
import { realDashboardKpiService, type RealKPIData } from '@/services/realDashboardKpiService';
import { kpiCacheService } from '@/services/kpiCacheService';
import { logger } from '@/lib/logger';

export interface UseRealtimeKPIsOptions {
  /**
   * Interval de refresh automatique (ms)
   * Si null, pas de refresh automatique
   * @default 30000 (30 secondes)
   */
  refreshInterval?: number | null;

  /**
   * Debounce delay pour éviter trop de refreshes (ms)
   * @default 500
   */
  debounceDelay?: number;

  /**
   * Tables à surveiller pour refresh
   * @default ['invoices', 'payments', 'journal_entries']
   */
  watchTables?: Array<'invoices' | 'payments' | 'journal_entries' | 'bank_transactions'>;

  /**
   * Enable logging pour debug
   * @default false
   */
  enableLogging?: boolean;
}

export interface UseRealtimeKPIsReturn {
  /**
   * KPIs actuels
   */
  kpis: RealKPIData | null;

  /**
   * Loading initial
   */
  isLoading: boolean;

  /**
   * Refresh en cours
   */
  isRefreshing: boolean;

  /**
   * Erreur
   */
  error: Error | null;

  /**
   * Dernière mise à jour
   */
  lastUpdate: Date | null;

  /**
   * Nombre de refreshes depuis le mount
   */
  refreshCount: number;

  /**
   * Forcer un refresh manuel
   */
  refresh: () => Promise<void>;

  /**
   * Activer/désactiver le realtime
   */
  toggleRealtime: (enabled: boolean) => void;

  /**
   * Realtime activé ?
   */
  isRealtimeEnabled: boolean;
}

/**
 * Hook pour récupérer KPIs en temps réel
 *
 * @example
 * function Dashboard() {
 *   const { kpis, isLoading, isRefreshing, lastUpdate, refresh } = useRealtimeKPIs(
 *     'company-123',
 *     { refreshInterval: 30000 }
 *   );
 *
 *   if (isLoading) return <Loading />;
 *
 *   return (
 *     <div>
 *       <KPICards kpis={kpis} />
 *       {isRefreshing && <Badge>Actualisation...</Badge>}
 *       <p>Dernière mise à jour: {lastUpdate?.toLocaleTimeString()}</p>
 *       <Button onClick={refresh}>Actualiser</Button>
 *     </div>
 *   );
 * }
 */
export function useRealtimeKPIs(
  companyId: string | undefined,
  options: UseRealtimeKPIsOptions = {}
): UseRealtimeKPIsReturn {
  const {
    refreshInterval = 30000, // 30 secondes par défaut
    debounceDelay = 500,
    watchTables = ['invoices', 'payments', 'journal_entries'],
    enableLogging = false
  } = options;

  const [kpis, setKpis] = useState<RealKPIData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(true);

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Fetch KPIs depuis le service (avec fallback Dexie offline)
   */
  const fetchKPIs = useCallback(async () => {
    if (!companyId) {
      if (enableLogging) logger.warn('useRealtimeKPIs', 'No companyId provided');
      return;
    }

    try {
      if (enableLogging) logger.debug('useRealtimeKPIs', 'Fetching KPIs...', { companyId, refreshCount });

      // Si offline, tenter le cache Dexie
      if (!navigator.onLine) {
        const cached = await kpiCacheService.getCacheWithDexieFallback(companyId);
        if (cached && isMountedRef.current) {
          setKpis(cached.data as RealKPIData);
          setLastUpdate(new Date());
          setError(null);
          if (enableLogging) logger.debug('useRealtimeKPIs', 'KPIs loaded from offline cache');
          return;
        }
      }

      const stats = await realDashboardKpiService.calculateRealKPIs(companyId);

      if (isMountedRef.current) {
        setKpis(stats);
        setLastUpdate(new Date());
        setError(null);
        setRefreshCount(prev => prev + 1);

        if (enableLogging) {
          logger.debug('useRealtimeKPIs', 'KPIs updated', {
            revenue: stats.revenue_ytd,
            pending: stats.pending_invoices,
            lastUpdate: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      // En cas d'erreur reseau, tenter le cache Dexie
      const cached = await kpiCacheService.getCacheWithDexieFallback(companyId);
      if (cached && isMountedRef.current) {
        setKpis(cached.data as RealKPIData);
        setLastUpdate(new Date());
        if (enableLogging) logger.debug('useRealtimeKPIs', 'KPIs fallback from Dexie cache after error');
        return;
      }

      if (isMountedRef.current) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        logger.error('useRealtimeKPIs', 'Error fetching KPIs:', error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [companyId, refreshCount, enableLogging]);

  /**
   * Refresh avec debounce
   */
  const debouncedRefresh = useCallback(
    debounceRealtimeCallback(async () => {
      if (!isMountedRef.current || !isRealtimeEnabled) return;

      setIsRefreshing(true);
      await fetchKPIs();
    }, debounceDelay),
    [fetchKPIs, debounceDelay, isRealtimeEnabled]
  );

  /**
   * Refresh manuel (sans debounce)
   */
  const refresh = useCallback(async () => {
    if (!companyId) return;

    setIsRefreshing(true);
    await fetchKPIs();
  }, [companyId, fetchKPIs]);

  /**
   * Toggle realtime on/off
   */
  const toggleRealtime = useCallback((enabled: boolean) => {
    if (enableLogging) {
      logger.info('useRealtimeKPIs', `Realtime ${enabled ? 'enabled' : 'disabled'}`);
    }
    setIsRealtimeEnabled(enabled);
  }, [enableLogging]);

  /**
   * Setup Supabase Realtime subscriptions
   */
  useEffect(() => {
    if (!companyId || !isRealtimeEnabled) return;

    const channelName = createChannelName('dashboard-kpis', companyId);
    const filter = createCompanyFilter(companyId);

    if (enableLogging) {
      logger.debug('useRealtimeKPIs', 'Setting up Realtime subscriptions...', {
        channelName,
        filter,
        watchTables
      });
    }

    // Subscribe à plusieurs tables
    const subscription = realtimeService.subscribeMultiple<any>(
      watchTables.map(table => ({
        table,
        event: '*' as const,
        filter,
        callback: (payload) => {
          if (enableLogging) {
            logger.debug('useRealtimeKPIs', `Realtime event: ${payload.table} ${payload.eventType}`, {
              new: payload.new,
              old: payload.old
            });
          }

          // Refresh KPIs avec debounce
          debouncedRefresh();
        }
      })),
      channelName
    );

    // Cleanup
    return () => {
      if (enableLogging) {
        logger.debug('useRealtimeKPIs', 'Cleaning up Realtime subscriptions...');
      }
      subscription.unsubscribe();
    };
  }, [companyId, isRealtimeEnabled, watchTables, debouncedRefresh, enableLogging]);

  /**
   * Setup refresh automatique périodique
   */
  useEffect(() => {
    if (!companyId || refreshInterval === null) return;

    if (enableLogging) {
      logger.debug('useRealtimeKPIs', 'Setting up automatic refresh...', {
        interval: refreshInterval,
        intervalMinutes: refreshInterval / 1000 / 60
      });
    }

    // Premier fetch
    fetchKPIs();

    // Refresh périodique
    refreshTimerRef.current = setInterval(() => {
      if (enableLogging) {
        logger.debug('useRealtimeKPIs', 'Automatic refresh triggered');
      }
      refresh();
    }, refreshInterval);

    // Cleanup
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [companyId, refreshInterval, fetchKPIs, refresh, enableLogging]);

  /**
   * Fetch initial (si pas de refresh automatique)
   */
  useEffect(() => {
    if (!companyId || refreshInterval !== null) return;

    fetchKPIs();
  }, [companyId, refreshInterval, fetchKPIs]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;

      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, []);

  return {
    kpis,
    isLoading,
    isRefreshing,
    error,
    lastUpdate,
    refreshCount,
    refresh,
    toggleRealtime,
    isRealtimeEnabled
  };
}

/**
 * Hook simplifié pour un seul KPI en temps réel
 *
 * @example
 * const { value, isLoading } = useRealtimeKPI(
 *   'company-123',
 *   (kpis) => kpis.revenue,
 *   { watchTables: ['invoices', 'payments'] }
 * );
 */
export function useRealtimeKPI<T>(
  companyId: string | undefined,
  selector: (kpis: RealKPIData) => T,
  options?: UseRealtimeKPIsOptions
) {
  const { kpis, ...rest } = useRealtimeKPIs(companyId, options);

  return {
    value: kpis ? selector(kpis) : null,
    ...rest
  };
}
