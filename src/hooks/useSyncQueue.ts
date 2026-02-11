/**
 * CassKai - Hook useSyncQueue
 *
 * Hook pour surveiller et gerer la queue de synchronisation offline.
 * Affiche le nombre de mutations en attente, echecs, et permet la sync manuelle.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineDataService, type SyncReport, type SyncStatus } from '@/services/offlineDataService';

export interface UseSyncQueueReturn {
  pendingCount: number;
  failedCount: number;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  syncNow: () => Promise<SyncReport>;
  retryFailed: () => Promise<SyncReport>;
}

/**
 * Hook pour surveiller la queue de sync offline
 *
 * @example
 * const { pendingCount, failedCount, isSyncing, syncNow } = useSyncQueue();
 *
 * return (
 *   <div>
 *     {pendingCount > 0 && <Badge>{pendingCount} en attente</Badge>}
 *     {failedCount > 0 && <Badge variant="destructive">{failedCount} en echec</Badge>}
 *     <Button onClick={syncNow} disabled={isSyncing}>Synchroniser</Button>
 *   </div>
 * );
 */
export function useSyncQueue(): UseSyncQueueReturn {
  const [status, setStatus] = useState<SyncStatus>({
    pendingCount: 0,
    failedCount: 0,
    isSyncing: false,
    lastSyncAt: null,
  });

  const isMountedRef = useRef(true);

  // Ecouter les changements de status
  useEffect(() => {
    const unsubscribe = offlineDataService.onSyncStatusChange((newStatus) => {
      if (isMountedRef.current) {
        setStatus(newStatus);
      }
    });

    // Charger le status initial
    offlineDataService.getSyncStatus().then((initialStatus) => {
      if (isMountedRef.current) {
        setStatus(initialStatus);
      }
    });

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, []);

  // Auto-sync quand on revient en ligne
  useEffect(() => {
    const handleOnline = async () => {
      if (status.pendingCount > 0) {
        await offlineDataService.syncAll();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [status.pendingCount]);

  const syncNow = useCallback(async (): Promise<SyncReport> => {
    return offlineDataService.syncAll();
  }, []);

  const retryFailed = useCallback(async (): Promise<SyncReport> => {
    return offlineDataService.retryFailed();
  }, []);

  return {
    pendingCount: status.pendingCount,
    failedCount: status.failedCount,
    isSyncing: status.isSyncing,
    lastSyncAt: status.lastSyncAt,
    syncNow,
    retryFailed,
  };
}
