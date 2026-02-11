/**
 * CassKai - Hook useOfflineData
 *
 * Hook generique pour lire des donnees avec cache offline automatique.
 * Pattern Network-First: tente Supabase, fallback sur IndexedDB.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineDataService, type QueryOptions, type OfflineResult } from '@/services/offlineDataService';

export interface UseOfflineDataOptions extends Omit<QueryOptions, 'company_id'> {
  /** Desactiver le fetch automatique */
  enabled?: boolean;
}

export interface UseOfflineDataReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  fromCache: boolean;
  lastSynced: Date | null;
  refresh: () => Promise<void>;
}

/**
 * Hook generique pour charger des donnees avec support offline
 *
 * @example
 * const { data, loading, fromCache, refresh } = useOfflineData<Invoice>(
 *   'invoices',
 *   companyId,
 *   { limit: 100, orderBy: { column: 'created_at', ascending: false } }
 * );
 */
export function useOfflineData<T = Record<string, unknown>>(
  table: string,
  companyId: string | undefined,
  options: UseOfflineDataOptions = {}
): UseOfflineDataReturn<T> {
  const { enabled = true, ...queryOptions } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!companyId || !enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result: OfflineResult<T[]> = await offlineDataService.query<T>(table, {
        ...queryOptions,
        company_id: companyId,
      });

      if (isMountedRef.current) {
        setData(result.data);
        setFromCache(result.fromCache);
        setLastSynced(result.lastSynced);
        setError(result.error || null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [table, companyId, enabled, JSON.stringify(queryOptions)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    isMountedRef.current = true;
    await fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    fromCache,
    lastSynced,
    refresh,
  };
}
