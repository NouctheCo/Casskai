/**
 * CassKai - Offline Data Service
 *
 * Middleware de lecture/ecriture avec cache IndexedDB.
 * Pattern Network-First : tente Supabase d'abord, fallback sur Dexie en offline.
 *
 * Lectures: Supabase (online) -> stocker en Dexie -> retourner
 *           Supabase (offline) -> lire depuis Dexie -> retourner { fromCache: true }
 *
 * Ecritures: Online -> Supabase direct + invalider cache Dexie
 *            Offline -> sync_queue + mettre a jour Dexie localement
 */

import { supabase } from '@/lib/supabase';
import {
  getOfflineDB,
  isIndexedDBAvailable,
  isCacheFresh,
  type OfflineSyncQueueEntry,
} from '@/lib/offline-db';
import { logger } from '@/lib/logger';

// ─── Types ───────────────────────────────────────────────────────

export interface OfflineResult<T> {
  data: T;
  fromCache: boolean;
  lastSynced: Date | null;
  error?: string;
}

export interface QueryOptions {
  company_id: string;
  select?: string;
  filters?: Record<string, unknown>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  /** Forcer la lecture depuis le cache uniquement */
  cacheOnly?: boolean;
}

export interface SyncReport {
  synced: number;
  failed: number;
  pending: number;
}

export interface SyncStatus {
  pendingCount: number;
  failedCount: number;
  isSyncing: boolean;
  lastSyncAt: Date | null;
}

// Tables supportees pour le cache offline
const CACHEABLE_TABLES = new Set([
  'chart_of_accounts',
  'journals',
  'accounting_periods',
  'invoices',
  'journal_entries',
  'journal_entry_lines',
  'payments',
  'bank_transactions',
  'third_parties',
  'articles',
  'companies',
  'user_companies',
]);

// ─── Service ─────────────────────────────────────────────────────

class OfflineDataService {
  private static instance: OfflineDataService;
  private isSyncing = false;
  private syncListeners = new Set<(status: SyncStatus) => void>();

  static getInstance(): OfflineDataService {
    if (!OfflineDataService.instance) {
      OfflineDataService.instance = new OfflineDataService();
    }
    return OfflineDataService.instance;
  }

  // ─── Lecture ─────────────────────────────────────────────────

  /**
   * Requete avec cache automatique (network-first)
   */
  async query<T = Record<string, unknown>>(
    table: string,
    options: QueryOptions
  ): Promise<OfflineResult<T[]>> {
    const { company_id, select = '*', filters, orderBy, limit, cacheOnly } = options;

    // Si cache-only est demande, lire directement depuis Dexie
    if (cacheOnly) {
      return this.readFromCache<T>(table, company_id);
    }

    // Network-first : tenter Supabase
    if (navigator.onLine) {
      try {
        let query = supabase.from(table).select(select);

        // Appliquer les filtres
        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            if (value !== undefined && value !== null) {
              query = query.eq(key, value);
            }
          }
        }

        if (orderBy) {
          query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
        }

        if (limit) {
          query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Stocker en cache IndexedDB
        if (data && CACHEABLE_TABLES.has(table)) {
          await this.storeInCache(table, company_id, data as unknown as Record<string, unknown>[]);
        }

        return {
          data: (data || []) as T[],
          fromCache: false,
          lastSynced: new Date(),
        };
      } catch (error) {
        logger.warn('OfflineData', `Network query failed for ${table}, falling back to cache`, error);
        return this.readFromCache<T>(table, company_id);
      }
    }

    // Offline : lire depuis Dexie
    return this.readFromCache<T>(table, company_id);
  }

  /**
   * Lire un enregistrement par ID avec cache
   */
  async getById<T = Record<string, unknown>>(
    table: string,
    id: string
  ): Promise<OfflineResult<T | null>> {
    if (navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        // Mettre en cache l'enregistrement individuel
        if (data && CACHEABLE_TABLES.has(table)) {
          await this.storeRecord(table, data as Record<string, unknown>);
        }

        return {
          data: data as T,
          fromCache: false,
          lastSynced: new Date(),
        };
      } catch (error) {
        logger.warn('OfflineData', `Network getById failed for ${table}/${id}, falling back to cache`);
        return this.readRecordFromCache<T>(table, id);
      }
    }

    return this.readRecordFromCache<T>(table, id);
  }

  // ─── Ecriture ────────────────────────────────────────────────

  /**
   * Insert avec fallback offline (queue de brouillons)
   */
  async insert<T = Record<string, unknown>>(
    table: string,
    data: Record<string, unknown>,
    userId: string,
    companyId: string
  ): Promise<OfflineResult<T>> {
    if (navigator.onLine) {
      try {
        const { data: result, error } = await supabase
          .from(table)
          .insert(data)
          .select()
          .single();

        if (error) throw error;

        // Invalider le cache pour cette table
        await this.invalidateTableCache(table, companyId);

        return {
          data: result as T,
          fromCache: false,
          lastSynced: new Date(),
        };
      } catch (error) {
        logger.warn('OfflineData', `Online insert failed for ${table}, queuing offline`);
        return this.queueOfflineInsert<T>(table, data, userId, companyId);
      }
    }

    // Offline : mettre en queue
    return this.queueOfflineInsert<T>(table, data, userId, companyId);
  }

  /**
   * Update avec fallback offline
   */
  async update<T = Record<string, unknown>>(
    table: string,
    id: string,
    data: Record<string, unknown>,
    userId: string,
    companyId: string
  ): Promise<OfflineResult<T>> {
    if (navigator.onLine) {
      try {
        const { data: result, error } = await supabase
          .from(table)
          .update(data)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        await this.invalidateTableCache(table, companyId);

        return {
          data: result as T,
          fromCache: false,
          lastSynced: new Date(),
        };
      } catch (error) {
        logger.warn('OfflineData', `Online update failed for ${table}/${id}, queuing offline`);
        return this.queueOfflineUpdate<T>(table, id, data, userId, companyId);
      }
    }

    return this.queueOfflineUpdate<T>(table, id, data, userId, companyId);
  }

  // ─── Cache IndexedDB (lecture) ───────────────────────────────

  private async readFromCache<T>(
    table: string,
    companyId: string
  ): Promise<OfflineResult<T[]>> {
    if (!isIndexedDBAvailable() || !CACHEABLE_TABLES.has(table)) {
      return { data: [] as T[], fromCache: true, lastSynced: null, error: 'Cache unavailable' };
    }

    try {
      const db = getOfflineDB();
      const dexieTable = db.table(table);

      // Lire les donnees filtrees par company_id
      let records: Record<string, unknown>[];
      if (table === 'companies') {
        records = await dexieTable.toArray();
      } else {
        records = await dexieTable.where('company_id').equals(companyId).toArray();
      }

      // Lire les metadonnees de sync
      const meta = await db.sync_metadata.get([table, companyId]);
      const lastSynced = meta ? new Date(meta.last_synced_at) : null;
      const fresh = meta ? isCacheFresh(meta.last_synced_at, table) : false;

      return {
        data: records as T[],
        fromCache: true,
        lastSynced,
        error: fresh ? undefined : 'Donnees potentiellement obsoletes',
      };
    } catch (error) {
      logger.error('OfflineData', `Cache read error for ${table}:`, error);
      return { data: [] as T[], fromCache: true, lastSynced: null, error: 'Cache read failed' };
    }
  }

  private async readRecordFromCache<T>(
    table: string,
    id: string
  ): Promise<OfflineResult<T | null>> {
    if (!isIndexedDBAvailable() || !CACHEABLE_TABLES.has(table)) {
      return { data: null, fromCache: true, lastSynced: null, error: 'Cache unavailable' };
    }

    try {
      const db = getOfflineDB();
      const record = await db.table(table).get(id);
      return {
        data: (record || null) as T | null,
        fromCache: true,
        lastSynced: null,
      };
    } catch (error) {
      logger.error('OfflineData', `Cache get error for ${table}/${id}:`, error);
      return { data: null, fromCache: true, lastSynced: null, error: 'Cache read failed' };
    }
  }

  // ─── Cache IndexedDB (ecriture) ──────────────────────────────

  private async storeInCache(
    table: string,
    companyId: string,
    records: Record<string, unknown>[]
  ): Promise<void> {
    if (!isIndexedDBAvailable()) return;

    try {
      const db = getOfflineDB();
      const dexieTable = db.table(table);

      // Remplacer toutes les donnees pour cette company dans ce store
      await db.transaction('rw', dexieTable, db.sync_metadata, async () => {
        // Supprimer les anciennes donnees de cette company
        if (table !== 'companies') {
          await dexieTable.where('company_id').equals(companyId).delete();
        } else {
          await dexieTable.clear();
        }

        // Inserer les nouvelles donnees
        if (records.length > 0) {
          await dexieTable.bulkPut(records);
        }

        // Mettre a jour les metadonnees de sync
        await db.sync_metadata.put({
          table_name: table,
          company_id: companyId,
          last_synced_at: Date.now(),
          record_count: records.length,
        });
      });
    } catch (error) {
      logger.warn('OfflineData', `Cache store error for ${table}:`, error);
    }
  }

  private async storeRecord(
    table: string,
    record: Record<string, unknown>
  ): Promise<void> {
    if (!isIndexedDBAvailable()) return;

    try {
      const db = getOfflineDB();
      await db.table(table).put(record);
    } catch (error) {
      logger.warn('OfflineData', `Cache store record error for ${table}:`, error);
    }
  }

  async invalidateTableCache(table: string, companyId: string): Promise<void> {
    if (!isIndexedDBAvailable()) return;

    try {
      const db = getOfflineDB();
      await db.sync_metadata.delete([table, companyId] as unknown as string);
    } catch (error) {
      logger.warn('OfflineData', `Cache invalidation error for ${table}:`, error);
    }
  }

  // ─── Queue offline ───────────────────────────────────────────

  private async queueOfflineInsert<T>(
    table: string,
    data: Record<string, unknown>,
    userId: string,
    companyId: string
  ): Promise<OfflineResult<T>> {
    const localId = crypto.randomUUID();

    // Forcer le statut draft pour les donnees financieres
    const safeData = { ...data, status: 'draft' };

    const entry: OfflineSyncQueueEntry = {
      table,
      operation: 'insert',
      data: safeData,
      company_id: companyId,
      user_id: userId,
      status: 'pending',
      created_at: Date.now(),
      retries: 0,
      local_id: localId,
    };

    if (isIndexedDBAvailable()) {
      const db = getOfflineDB();
      await db.sync_queue.add(entry);

      // Stocker aussi localement pour affichage immediat
      const localRecord = { ...safeData, id: localId, company_id: companyId, _offline: true };
      if (CACHEABLE_TABLES.has(table)) {
        try {
          await db.table(table).put(localRecord);
        } catch {
          // Ignorer si le store n'existe pas
        }
      }
    }

    this.notifySyncListeners();

    return {
      data: { ...safeData, id: localId, _offline: true } as T,
      fromCache: true,
      lastSynced: null,
      error: 'Sauvegarde locale - sera synchronise au retour du reseau',
    };
  }

  private async queueOfflineUpdate<T>(
    table: string,
    id: string,
    data: Record<string, unknown>,
    userId: string,
    companyId: string
  ): Promise<OfflineResult<T>> {
    const localId = crypto.randomUUID();

    const entry: OfflineSyncQueueEntry = {
      table,
      operation: 'update',
      data: { ...data, id },
      company_id: companyId,
      user_id: userId,
      status: 'pending',
      created_at: Date.now(),
      retries: 0,
      local_id: localId,
    };

    if (isIndexedDBAvailable()) {
      const db = getOfflineDB();
      await db.sync_queue.add(entry);

      // Mettre a jour la copie locale
      if (CACHEABLE_TABLES.has(table)) {
        try {
          await db.table(table).update(id, { ...data, _offline: true });
        } catch {
          // Ignorer
        }
      }
    }

    this.notifySyncListeners();

    return {
      data: { ...data, id, _offline: true } as T,
      fromCache: true,
      lastSynced: null,
      error: 'Modification locale - sera synchronise au retour du reseau',
    };
  }

  // ─── Sync ────────────────────────────────────────────────────

  /**
   * Synchroniser toutes les mutations en attente
   */
  async syncAll(): Promise<SyncReport> {
    if (!isIndexedDBAvailable()) {
      return { synced: 0, failed: 0, pending: 0 };
    }

    if (this.isSyncing) {
      const status = await this.getSyncStatus();
      return { synced: 0, failed: status.failedCount, pending: status.pendingCount };
    }

    if (!navigator.onLine) {
      const status = await this.getSyncStatus();
      return { synced: 0, failed: status.failedCount, pending: status.pendingCount };
    }

    this.isSyncing = true;
    this.notifySyncListeners();

    const report: SyncReport = { synced: 0, failed: 0, pending: 0 };

    try {
      const db = getOfflineDB();
      const pendingEntries = await db.sync_queue
        .where('status')
        .equals('pending')
        .sortBy('created_at');

      for (const entry of pendingEntries) {
        try {
          // Marquer comme en cours de sync
          await db.sync_queue.update(entry.id!, { status: 'syncing' });

          await this.processQueueEntry(entry);

          // Succes : supprimer de la queue + nettoyer le flag _offline
          await db.sync_queue.delete(entry.id!);
          report.synced++;

          // Nettoyer le flag _offline dans le cache local
          if (CACHEABLE_TABLES.has(entry.table)) {
            try {
              const localRecord = await db.table(entry.table).get(entry.local_id);
              if (localRecord) {
                await db.table(entry.table).delete(entry.local_id);
              }
            } catch {
              // Ignorer
            }
          }
        } catch (error) {
          const newRetries = entry.retries + 1;
          const newStatus = newRetries >= 3 ? 'failed' : 'pending';

          await db.sync_queue.update(entry.id!, {
            status: newStatus,
            retries: newRetries,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          if (newStatus === 'failed') {
            report.failed++;
          } else {
            report.pending++;
          }
        }
      }
    } catch (error) {
      logger.error('OfflineData', 'Sync error:', error);
    } finally {
      this.isSyncing = false;
      this.notifySyncListeners();
    }

    return report;
  }

  private async processQueueEntry(entry: OfflineSyncQueueEntry): Promise<void> {
    const { table, operation, data } = entry;

    // Retirer les champs internes
    const cleanData = { ...data };
    delete cleanData._offline;
    delete cleanData.id; // L'id sera genere par Supabase pour les inserts

    switch (operation) {
      case 'insert': {
        // Forcer draft pour securite
        if ('status' in cleanData) {
          cleanData.status = 'draft';
        }
        const { error } = await supabase.from(table).insert(cleanData);
        if (error) throw error;
        break;
      }
      case 'update': {
        const id = data.id as string;
        if (!id) throw new Error('Missing id for update');
        const updateData = { ...cleanData };
        const { error } = await supabase.from(table).update(updateData).eq('id', id);
        if (error) throw error;
        break;
      }
      case 'delete': {
        const deleteId = data.id as string;
        if (!deleteId) throw new Error('Missing id for delete');
        const { error } = await supabase.from(table).delete().eq('id', deleteId);
        if (error) throw error;
        break;
      }
    }
  }

  // ─── Status ──────────────────────────────────────────────────

  async getSyncStatus(): Promise<SyncStatus> {
    if (!isIndexedDBAvailable()) {
      return { pendingCount: 0, failedCount: 0, isSyncing: false, lastSyncAt: null };
    }

    try {
      const db = getOfflineDB();
      const pendingCount = await db.sync_queue.where('status').equals('pending').count();
      const failedCount = await db.sync_queue.where('status').equals('failed').count();

      return {
        pendingCount,
        failedCount,
        isSyncing: this.isSyncing,
        lastSyncAt: null,
      };
    } catch {
      return { pendingCount: 0, failedCount: 0, isSyncing: false, lastSyncAt: null };
    }
  }

  async getLastSyncTime(table: string, companyId: string): Promise<Date | null> {
    if (!isIndexedDBAvailable()) return null;

    try {
      const db = getOfflineDB();
      const meta = await db.sync_metadata.get([table, companyId]);
      return meta ? new Date(meta.last_synced_at) : null;
    } catch {
      return null;
    }
  }

  /**
   * Retry les entrees echouees
   */
  async retryFailed(): Promise<SyncReport> {
    if (!isIndexedDBAvailable()) return { synced: 0, failed: 0, pending: 0 };

    const db = getOfflineDB();
    const failedEntries = await db.sync_queue.where('status').equals('failed').toArray();

    // Remettre en pending avec retries a 0
    for (const entry of failedEntries) {
      await db.sync_queue.update(entry.id!, { status: 'pending', retries: 0, error: undefined });
    }

    return this.syncAll();
  }

  // ─── Listeners ───────────────────────────────────────────────

  onSyncStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.syncListeners.add(listener);
    return () => {
      this.syncListeners.delete(listener);
    };
  }

  private async notifySyncListeners(): Promise<void> {
    const status = await this.getSyncStatus();
    this.syncListeners.forEach(listener => {
      try {
        listener(status);
      } catch {
        // Ignorer
      }
    });
  }

  // ─── Pre-chargement ──────────────────────────────────────────

  /**
   * Pre-charger les donnees de reference pour une entreprise
   * Appele au login / switch d'entreprise
   */
  async preloadReferenceData(companyId: string): Promise<void> {
    if (!navigator.onLine) return;

    const tables = [
      'chart_of_accounts',
      'journals',
      'accounting_periods',
    ];

    const promises = tables.map(async (table) => {
      try {
        await this.query(table, { company_id: companyId });
        logger.debug('OfflineData', `Pre-loaded ${table} for ${companyId}`);
      } catch (error) {
        logger.warn('OfflineData', `Failed to pre-load ${table}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }
}

// Export singleton
export const offlineDataService = OfflineDataService.getInstance();
