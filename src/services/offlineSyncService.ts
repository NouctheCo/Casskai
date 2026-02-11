/**
 * CassKai - Offline Sync Service
 *
 * Service dedie a la synchronisation des mutations offline.
 * Remplace le sync-queue non-integre de cache-strategies.ts
 * et le offlineActions en memoire de useServiceWorker.tsx.
 *
 * Regles critiques:
 * - Les ecritures offline sont TOUJOURS poussees avec status 'draft'
 * - UUID local pour tracking et deduplication
 * - Max 3 retries avant marquage 'failed'
 */

import { supabase } from '@/lib/supabase';
import {
  getOfflineDB,
  isIndexedDBAvailable,
  type OfflineSyncQueueEntry,
} from '@/lib/offline-db';
import { logger } from '@/lib/logger';

export interface SyncReport {
  synced: number;
  failed: number;
  pending: number;
  errors: string[];
}

const MAX_RETRIES = 3;

// Tables pour lesquelles on force le statut 'draft'
const FORCE_DRAFT_TABLES = new Set([
  'invoices',
  'journal_entries',
  'payments',
]);

class OfflineSyncService {
  private static instance: OfflineSyncService;
  private isSyncing = false;

  static getInstance(): OfflineSyncService {
    if (!OfflineSyncService.instance) {
      OfflineSyncService.instance = new OfflineSyncService();
    }
    return OfflineSyncService.instance;
  }

  /**
   * Ajouter une mutation a la queue offline
   */
  async enqueue(entry: Omit<OfflineSyncQueueEntry, 'id' | 'status' | 'created_at' | 'retries'>): Promise<number | null> {
    if (!isIndexedDBAvailable()) return null;

    const db = getOfflineDB();

    // Forcer draft pour securite financiere
    const safeData = { ...entry.data };
    if (FORCE_DRAFT_TABLES.has(entry.table) && 'status' in safeData) {
      safeData.status = 'draft';
    }

    const queueEntry: OfflineSyncQueueEntry = {
      ...entry,
      data: safeData,
      status: 'pending',
      created_at: Date.now(),
      retries: 0,
    };

    const id = await db.sync_queue.add(queueEntry);
    logger.debug('OfflineSync', `Queued ${entry.operation} on ${entry.table} (local_id: ${entry.local_id})`);
    return id as number;
  }

  /**
   * Traiter la queue de sync
   */
  async processQueue(): Promise<SyncReport> {
    if (!isIndexedDBAvailable() || this.isSyncing || !navigator.onLine) {
      return { synced: 0, failed: 0, pending: 0, errors: [] };
    }

    this.isSyncing = true;
    const report: SyncReport = { synced: 0, failed: 0, pending: 0, errors: [] };

    try {
      const db = getOfflineDB();
      const pending = await db.sync_queue
        .where('status')
        .equals('pending')
        .sortBy('created_at');

      for (const entry of pending) {
        try {
          await db.sync_queue.update(entry.id!, { status: 'syncing' });
          await this.processSingleEntry(entry);
          await db.sync_queue.delete(entry.id!);
          report.synced++;
        } catch (error) {
          const newRetries = entry.retries + 1;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';

          if (newRetries >= MAX_RETRIES) {
            await db.sync_queue.update(entry.id!, {
              status: 'failed',
              retries: newRetries,
              error: errorMsg,
            });
            report.failed++;
            report.errors.push(`${entry.table}/${entry.operation}: ${errorMsg}`);
          } else {
            await db.sync_queue.update(entry.id!, {
              status: 'pending',
              retries: newRetries,
              error: errorMsg,
            });
            report.pending++;
          }
        }
      }
    } catch (error) {
      logger.error('OfflineSync', 'Queue processing error:', error);
    } finally {
      this.isSyncing = false;
    }

    if (report.synced > 0) {
      logger.info('OfflineSync', `Sync complete: ${report.synced} synced, ${report.failed} failed, ${report.pending} pending`);
    }

    return report;
  }

  private async processSingleEntry(entry: OfflineSyncQueueEntry): Promise<void> {
    const { table, operation, data } = entry;

    // Nettoyer les champs internes
    const cleanData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (key !== '_offline' && key !== 'id') {
        cleanData[key] = value;
      }
    }

    // Forcer draft pour les tables financieres
    if (FORCE_DRAFT_TABLES.has(table)) {
      cleanData.status = 'draft';
    }

    switch (operation) {
      case 'insert': {
        const { error } = await supabase.from(table).insert(cleanData);
        if (error) throw new Error(`Insert ${table}: ${error.message}`);
        break;
      }
      case 'update': {
        const id = data.id as string;
        if (!id) throw new Error(`Missing id for update on ${table}`);
        const { error } = await supabase.from(table).update(cleanData).eq('id', id);
        if (error) throw new Error(`Update ${table}/${id}: ${error.message}`);
        break;
      }
      case 'delete': {
        const deleteId = data.id as string;
        if (!deleteId) throw new Error(`Missing id for delete on ${table}`);
        const { error } = await supabase.from(table).delete().eq('id', deleteId);
        if (error) throw new Error(`Delete ${table}/${deleteId}: ${error.message}`);
        break;
      }
    }
  }

  /**
   * Obtenir le compteur de pending
   */
  async getPendingCount(): Promise<number> {
    if (!isIndexedDBAvailable()) return 0;
    const db = getOfflineDB();
    return db.sync_queue.where('status').equals('pending').count();
  }

  /**
   * Obtenir le compteur de failed
   */
  async getFailedCount(): Promise<number> {
    if (!isIndexedDBAvailable()) return 0;
    const db = getOfflineDB();
    return db.sync_queue.where('status').equals('failed').count();
  }

  /**
   * Retry les entrees echouees
   */
  async retryFailed(): Promise<SyncReport> {
    if (!isIndexedDBAvailable()) return { synced: 0, failed: 0, pending: 0, errors: [] };

    const db = getOfflineDB();
    const failed = await db.sync_queue.where('status').equals('failed').toArray();

    for (const entry of failed) {
      await db.sync_queue.update(entry.id!, {
        status: 'pending',
        retries: 0,
        error: undefined,
      });
    }

    return this.processQueue();
  }

  /**
   * Nettoyer les entrees completees et echouees
   */
  async clearCompleted(): Promise<void> {
    if (!isIndexedDBAvailable()) return;
    const db = getOfflineDB();
    await db.sync_queue.where('status').equals('completed').delete();
  }

  get syncing(): boolean {
    return this.isSyncing;
  }
}

export const offlineSyncService = OfflineSyncService.getInstance();
