/**
 * CassKai - Offline Database (Dexie.js / IndexedDB)
 *
 * Base de donnees locale pour le mode offline-first.
 * Permet la consultation des donnees financieres et la creation
 * de brouillons sans connexion internet.
 */

import Dexie, { type Table } from 'dexie';

// ─── Types pour les stores offline ───────────────────────────────

export interface OfflineSyncQueueEntry {
  id?: number;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  company_id: string;
  user_id: string;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  created_at: number;
  retries: number;
  error?: string;
  local_id: string;
}

export interface OfflineSyncMetadata {
  table_name: string;
  company_id: string;
  last_synced_at: number;
  record_count: number;
}

export interface OfflineKpiCache {
  company_id: string;
  data: unknown;
  updated_at: number;
}

// ─── TTL Configuration (en millisecondes) ────────────────────────

export const OFFLINE_TTL = {
  CONFIG: 60 * 60 * 1000,       // 1h - chart_of_accounts, journals, periods, companies
  TIER1: 15 * 60 * 1000,        // 15min - invoices, journal_entries, payments, bank_transactions
  TIER2: 30 * 60 * 1000,        // 30min - third_parties, articles
  KPI: 5 * 60 * 1000,           // 5min - kpi_cache
} as const;

// ─── Limite de stockage ──────────────────────────────────────────

const MAX_STORAGE_MB = 50;
const CLEANUP_AGE_DAYS = 7;

// ─── Dexie Database ──────────────────────────────────────────────

class CassKaiOfflineDB extends Dexie {
  // Tier 1 - Donnees financieres critiques
  chart_of_accounts!: Table;
  journals!: Table;
  accounting_periods!: Table;
  invoices!: Table;
  journal_entries!: Table;
  journal_entry_lines!: Table;
  payments!: Table;
  bank_transactions!: Table;

  // Tier 2 - Donnees de reference
  third_parties!: Table;
  articles!: Table;

  // Config
  companies!: Table;
  user_companies!: Table;

  // Cache & Sync
  kpi_cache!: Table<OfflineKpiCache, string>;
  sync_queue!: Table<OfflineSyncQueueEntry, number>;
  sync_metadata!: Table<OfflineSyncMetadata, string>;

  constructor() {
    super('casskai-offline');

    this.version(1).stores({
      // Tier 1 - Financier critique
      chart_of_accounts: 'id, company_id, account_number',
      journals: 'id, company_id',
      accounting_periods: 'id, company_id',
      invoices: 'id, company_id, status, invoice_date',
      journal_entries: 'id, company_id, entry_date',
      journal_entry_lines: 'id, journal_entry_id, company_id',
      payments: 'id, company_id',
      bank_transactions: 'id, bank_account_id, company_id',

      // Tier 2 - Reference
      third_parties: 'id, company_id, type',
      articles: 'id, company_id',

      // Config
      companies: 'id',
      user_companies: 'id, user_id',

      // Cache & Sync
      kpi_cache: 'company_id',
      sync_queue: '++id, status, created_at',
      sync_metadata: '[table_name+company_id]',
    });
  }
}

// ─── Singleton ───────────────────────────────────────────────────

let dbInstance: CassKaiOfflineDB | null = null;

export function getOfflineDB(): CassKaiOfflineDB {
  if (!dbInstance) {
    dbInstance = new CassKaiOfflineDB();
  }
  return dbInstance;
}

/**
 * Verifie si IndexedDB est disponible dans le navigateur
 */
export function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

// ─── Helpers TTL ─────────────────────────────────────────────────

/**
 * Retourne le TTL en ms pour une table donnee
 */
export function getTTLForTable(table: string): number {
  switch (table) {
    case 'chart_of_accounts':
    case 'journals':
    case 'accounting_periods':
    case 'companies':
    case 'user_companies':
      return OFFLINE_TTL.CONFIG;

    case 'invoices':
    case 'journal_entries':
    case 'journal_entry_lines':
    case 'payments':
    case 'bank_transactions':
      return OFFLINE_TTL.TIER1;

    case 'third_parties':
    case 'articles':
      return OFFLINE_TTL.TIER2;

    case 'kpi_cache':
      return OFFLINE_TTL.KPI;

    default:
      return OFFLINE_TTL.TIER1;
  }
}

/**
 * Verifie si les donnees en cache sont encore fraiches
 */
export function isCacheFresh(lastSyncedAt: number, table: string): boolean {
  const ttl = getTTLForTable(table);
  return Date.now() - lastSyncedAt < ttl;
}

// ─── Cleanup automatique ────────────────────────────────────────

/**
 * Nettoie les donnees perimees (> 7 jours) et les entrees sync completees
 */
export async function cleanupOfflineData(): Promise<{ deletedRecords: number }> {
  if (!isIndexedDBAvailable()) return { deletedRecords: 0 };

  const db = getOfflineDB();
  let deletedRecords = 0;
  const cutoffDate = Date.now() - CLEANUP_AGE_DAYS * 24 * 60 * 60 * 1000;

  try {
    // Nettoyer la sync_queue completee
    const completedEntries = await db.sync_queue
      .where('status')
      .equals('completed')
      .toArray();

    const oldCompleted = completedEntries.filter(e => e.created_at < cutoffDate);
    if (oldCompleted.length > 0) {
      await db.sync_queue.bulkDelete(oldCompleted.map(e => e.id!));
      deletedRecords += oldCompleted.length;
    }

    // Nettoyer les metadonnees de sync perimees
    const allMeta = await db.sync_metadata.toArray();
    const oldMeta = allMeta.filter(m => m.last_synced_at < cutoffDate);
    if (oldMeta.length > 0) {
      await db.sync_metadata.bulkDelete(
        oldMeta.map(m => [m.table_name, m.company_id]) as unknown as string[]
      );
      deletedRecords += oldMeta.length;
    }
  } catch (error) {
    console.warn('[CassKai Offline] Cleanup error:', error);
  }

  return { deletedRecords };
}

/**
 * Estime la taille du stockage IndexedDB (en octets)
 */
export async function estimateStorageUsage(): Promise<{
  usageBytes: number;
  quotaBytes: number;
  usageMB: number;
  isNearLimit: boolean;
}> {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    const usageBytes = estimate.usage || 0;
    const quotaBytes = estimate.quota || 0;
    const usageMB = Math.round(usageBytes / (1024 * 1024) * 100) / 100;
    return {
      usageBytes,
      quotaBytes,
      usageMB,
      isNearLimit: usageMB > MAX_STORAGE_MB,
    };
  }
  return { usageBytes: 0, quotaBytes: 0, usageMB: 0, isNearLimit: false };
}

export type { CassKaiOfflineDB };
