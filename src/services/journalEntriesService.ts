/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */
import { supabase, normalizeData } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import type {
  JournalEntryLineForm,
  JournalEntryPayload,
  JournalEntryStatus,
  JournalEntryWithItems,
  MinimalAccount,
  MinimalJournal,
} from '@/types/journalEntries.types';
import { auditService } from './auditService';
import AccountingRulesService from './accountingRulesService';
import { AccountingStandardAdapter, type AccountingStandard } from './accountingStandardAdapter';
import { kpiCacheService } from './kpiCacheService';
import { logger } from '@/lib/logger';
import i18n from '@/i18n/i18n';
import { offlineDataService } from './offlineDataService';
type JournalEntryInsert = Database['public']['Tables']['journal_entries']['Insert'];
type JournalEntryUpdate = Database['public']['Tables']['journal_entries']['Update'];
type JournalEntryLineInsert = Database['public']['Tables']['journal_entry_lines']['Insert'];
type PaginatedResult<T> = {
  data: T[];
  count: number;
};
type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
type JournalEntryListFilters = {
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  journalId?: string;
  accountId?: string;
  reference?: string;
  description?: string;
  status?: JournalEntryStatus;
  sortBy?: 'entry_date' | 'created_at';
  sortOrder?: 'asc' | 'desc';
};
const BALANCE_TOLERANCE = 0.01;
function coerceNumber(value: unknown): number {
  const parsed = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
class JournalEntriesService {
  private getUserFriendlyError(error: unknown, fallback: string): string {
    const rawMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : (error as { message?: string })?.message || fallback;
    const code = (error as { code?: string })?.code;
    const isClosedPeriodError =
      code === 'P0001' ||
      /période.*clôtur|clôtur.*période|period.*closed|closed.*period/i.test(rawMessage);
    if (isClosedPeriodError) {
      return i18n.t(
        'accounting.closure.errors.closedPeriodOperation',
        'Action impossible : la période comptable est clôturée. Réouvrez la période pour modifier ou saisir des écritures.'
      );
    }
    return rawMessage;
  }
  private async generateReferenceNumber(companyId: string): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    // Récupérer le nombre d'écritures du jour
    const { count } = await supabase
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .gte('created_at', `${year}-${month}-${day}T00:00:00`);
    const sequenceNumber = String((count || 0) + 1).padStart(4, '0');
    return `${year}${month}${day}-${sequenceNumber}`;
  }
  async createJournalEntry(payload: JournalEntryPayload): Promise<ServiceResult<JournalEntryWithItems>> {
    logger.debug('JournalEntries', '[JournalEntriesService] createJournalEntry called with:', payload);

    // Mode offline : creer un brouillon local
    if (!navigator.onLine) {
      return this.createJournalEntryOffline(payload);
    }

    try {
      this.ensureBalanced(payload.items);
      // Si journal_id n'est pas fourni, récupérer le premier journal actif de la company
      let journalId = payload.journalId;
      logger.warn('JournalEntries', '🔍 [JournalEntriesService] payload.journalId:', payload.journalId);
      logger.warn('JournalEntries', '🔍 [JournalEntriesService] journalId initial:', journalId);
      logger.warn('JournalEntries', '🔍 [JournalEntriesService] Tentative récupération journal par défaut...');
      if (!journalId) {
        try {
          logger.warn('JournalEntries', '🔍 Récupération journal automatique pour company:', payload.companyId);

          // ✅ Récupérer le standard comptable de l'entreprise (PCG, SYSCOHADA, IFRS, SCF)
          const accountingStandard = await AccountingStandardAdapter.getCompanyStandard(payload.companyId);
          logger.info('JournalEntries', `📊 Standard comptable de l'entreprise: ${accountingStandard}`);

          // ✅ Détection automatique du journal basée sur les comptes utilisés ET le référentiel
          const accountIds = payload.items.map(item => item.accountId).filter(Boolean);
          if (accountIds.length > 0) {
            // Récupérer les numéros de comptes pour la suggestion
            const { data: accounts } = await supabase
              .from('chart_of_accounts')
              .select('id, account_number')
              .eq('company_id', payload.companyId)
              .in('id', accountIds);

            const accountsRows = normalizeData<{ id: string; account_number?: string }>(accounts);

            if (accountsRows.length > 0) {
              const accountNumbers = accountsRows.map(acc => acc.account_number || '').filter(Boolean);
              // ✅ Passer le standard comptable pour appliquer les bonnes règles
              const suggestedJournalType = AccountingRulesService.suggestJournal(accountNumbers, accountingStandard);
              logger.info('JournalEntries', `🎯 Journal suggéré (${accountingStandard}): ${suggestedJournalType}`, { accountNumbers });

              // Mapper le type de journal vers le type en base
              const journalTypeMap: Record<string, string> = {
                'sale': 'sale',
                'purchase': 'purchase',
                'bank': 'bank',
                'cash': 'cash',
                'miscellaneous': 'miscellaneous',
              };
              const dbJournalType = journalTypeMap[suggestedJournalType] || 'miscellaneous';

              // Chercher le journal correspondant
              const { data: suggestedJournal, error: suggestError } = await supabase
                .from('journals')
                .select('id, code, name, type')
                .eq('company_id', payload.companyId)
                .eq('is_active', true)
                .eq('type', dbJournalType)
                .limit(1)
                .single();

              if (!suggestError && suggestedJournal && typeof suggestedJournal === 'object') {
                journalId = (suggestedJournal as any).id;
                logger.info('JournalEntries', `✅ Journal automatiquement sélectionné: ${(suggestedJournal as any).code} - ${(suggestedJournal as any).name} (type: ${(suggestedJournal as any).type})`);
              }
            }
          }

          // Fallback: si aucun journal trouvé via suggestion, prendre OD
          if (!journalId) {
            logger.warn('JournalEntries', '⚠️ Pas de suggestion de journal, fallback vers OD');
            const { data: defaultJournal, error: journalError } = await supabase
              .from('journals')
              .select('id, code, name, type')
              .eq('company_id', payload.companyId)
              .eq('is_active', true)
              .eq('type', 'miscellaneous')
              .limit(1)
              .single();

            if (journalError) {
              logger.error('JournalEntries', '❌ Erreur récupération journal OD:', journalError);
              // Si pas de journal OD, prendre le premier journal actif
              const { data: anyJournal } = await supabase
                .from('journals')
                .select('id, code, name, type')
                .eq('company_id', payload.companyId)
                .eq('is_active', true)
                .limit(1)
                .single();
              if (!anyJournal || typeof anyJournal !== 'object') {
                throw new Error('Aucun journal actif trouvé pour cette entreprise. Veuillez créer au moins un journal.');
              }
              journalId = (anyJournal as any).id;
              logger.warn('JournalEntries', `⚠️ Journal de secours utilisé: ${(anyJournal as any).code} - ${(anyJournal as any).name} (type: ${(anyJournal as any).type})`);
            } else {
              if (!defaultJournal || typeof defaultJournal !== 'object') {
                throw new Error('Aucun journal OD valide trouvé');
              }
              journalId = (defaultJournal as any).id;
              logger.warn('JournalEntries', '✅ Journal OD trouvé:', defaultJournal);
            }
          }
        } catch (error) {
          logger.error('JournalEntries', '💥 Exception récupération journal:', error);
          throw error;
        }
      }
      logger.warn('JournalEntries', '🔍 journalId final avant génération numéro:', journalId);
      // Vérification finale : journalId doit être défini
      if (!journalId) {
        throw new Error('Impossible de déterminer le journal pour cette écriture. Veuillez spécifier un journal valide.');
      }
      const entryNumber = payload.entryNumber ?? (await this.generateEntryNumber(payload.companyId, journalId));
      const referenceNumber = payload.referenceNumber ?? (await this.generateReferenceNumber(payload.companyId));
      const entryInsert: JournalEntryInsert = {
        company_id: payload.companyId,
        entry_date: payload.entryDate,
        description: payload.description,
        reference_number: referenceNumber,
        journal_id: journalId,
        status: payload.status ?? 'draft',
        entry_number: entryNumber,
      };
      logger.warn('JournalEntries', '🔍 Payload final pour insertion:', entryInsert);
      const { data: entry, error: entryError } = await supabase
        .from('journal_entries')
        .insert(entryInsert)
        .select('*')
        .single();
      if (entryError || !entry || typeof entry !== 'object') {
        throw entryError ?? new Error('Failed to create journal entry');
      }
      const linesInsert = await this.normalizeLines(payload.companyId, entry.id, payload.items);
      const { data: lines, error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(linesInsert)
        .select('*, chart_of_accounts!account_id (id, account_number, account_name, account_type, account_class)');
      const linesRows = normalizeData<any>(lines);
      if (linesError) {
        await supabase.from('journal_entries').delete().eq('id', entry.id);
        throw linesError;
      }
      // ✅ Audit Log: CREATE journal entry
      auditService.log({
        event_type: 'CREATE',
        table_name: 'journal_entries',
        record_id: entry.id,
        company_id: payload.companyId,
        new_values: {
          entry_number: entry.entry_number,
          entry_date: entry.entry_date,
          description: entry.description,
          status: entry.status,
          lines_count: lines?.length || 0
        },
        security_level: 'standard',
        compliance_tags: ['RGPD']
      }).catch(err => logger.error('JournalEntries', 'Audit log failed:', err));
      // 🎯 NOUVELLE: Invalider le cache KPI après création
      kpiCacheService.invalidateCache(payload.companyId);
      return {
        success: true,
        data: {
          ...entry,
          journal_entry_lines: lines ?? [],
        },
      };
    } catch (error) {
      const message = this.getUserFriendlyError(error, 'Failed to create journal entry');
      logger.error('JournalEntries', '[JournalEntriesService] createJournalEntry failed:', error);
      return { success: false, error: message };
    }
  }
  async updateJournalEntry(entryId: string, payload: JournalEntryPayload): Promise<ServiceResult<JournalEntryWithItems>> {
    try {
      this.ensureBalanced(payload.items);
      // ✅ Récupérer toutes les données existantes pour l'audit
      const { data: existingEntry, error: fetchError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('id', entryId)
        .single();
      if (fetchError || !existingEntry) {
        throw fetchError ?? new Error('Journal entry not found');
      }
      if (existingEntry.company_id !== payload.companyId) {
        throw new Error('Journal entry does not belong to the provided company');
      }
      // Si journal_id n'est pas fourni, récupérer le premier journal actif de la company
      let journalId = payload.journalId;
      logger.warn('JournalEntries', '🔍 [JournalEntriesService] updateJournalEntry - payload.journalId:', payload.journalId);
      logger.warn('JournalEntries', '🔍 [JournalEntriesService] updateJournalEntry - journalId initial:', journalId);
      if (!journalId) {
        try {
          logger.warn('JournalEntries', '🔍 [JournalEntriesService] updateJournalEntry - Récupération journal par défaut pour company:', payload.companyId);
          const { data: defaultJournal, error: journalError } = await supabase
            .from('journals')
            .select('id, code, name')
            .eq('company_id', payload.companyId)
            .eq('is_active', true)
            .limit(1)
            .single();
          logger.warn('JournalEntries', '🔍 [JournalEntriesService] updateJournalEntry - Résultat query journals:', { data: defaultJournal, error: journalError });
          if (journalError) {
            logger.error('JournalEntries', '❌ [JournalEntriesService] updateJournalEntry - Erreur récupération journal:', journalError);
            throw new Error(`Erreur récupération journal: ${journalError.message}`);
          }
          if (!defaultJournal) {
            logger.error('JournalEntries', '❌ [JournalEntriesService] updateJournalEntry - Aucun journal trouvé');
            throw new Error('Aucun journal actif trouvé pour cette entreprise');
          }
          journalId = defaultJournal.id;
          logger.warn('JournalEntries', '✅ [JournalEntriesService] updateJournalEntry - Journal par défaut trouvé:', defaultJournal);
        } catch (error) {
          logger.error('JournalEntries', '💥 [JournalEntriesService] updateJournalEntry - Exception récupération journal:', error);
          throw error;
        }
      }
      logger.warn('JournalEntries', '🔍 [JournalEntriesService] updateJournalEntry - journalId final:', journalId);
      const referenceNumber = payload.referenceNumber ?? existingEntry.reference_number ?? (await this.generateReferenceNumber(payload.companyId));
      const entryUpdate: JournalEntryUpdate = {
        entry_date: payload.entryDate,
        description: payload.description,
        reference_number: referenceNumber,
        journal_id: journalId ?? undefined, // Convertir null en undefined pour TypeScript
        status: payload.status ?? existingEntry.status ?? 'draft',
        entry_number: payload.entryNumber ?? existingEntry.entry_number,
      };
      const { data: updatedEntry, error: updateError } = await supabase
        .from('journal_entries')
        .update(entryUpdate)
        .eq('id', entryId)
        .select('*')
        .single();
      if (updateError || !updatedEntry) {
        throw updateError ?? new Error('Failed to update journal entry');
      }
      const { error: deleteError } = await supabase
        .from('journal_entry_lines')
        .delete()
        .eq('journal_entry_id', entryId);
      if (deleteError) {
        throw deleteError;
      }
      const linesInsert = await this.normalizeLines(payload.companyId, entryId, payload.items);
      const { data: lines, error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(linesInsert)
        .select('*, chart_of_accounts!account_id (id, account_number, account_name, account_type, account_class)');
      if (linesError) {
        throw linesError;
      }
      // ✅ Audit Log: UPDATE journal entry
      const changedFields = Object.keys(entryUpdate).filter(
        key => existingEntry[key] !== entryUpdate[key as keyof typeof entryUpdate]
      );
      auditService.log({
        event_type: 'UPDATE',
        table_name: 'journal_entries',
        record_id: entryId,
        company_id: payload.companyId,
        old_values: {
          entry_number: existingEntry.entry_number,
          entry_date: existingEntry.entry_date,
          description: existingEntry.description,
          status: existingEntry.status
        },
        new_values: {
          entry_number: updatedEntry.entry_number,
          entry_date: updatedEntry.entry_date,
          description: updatedEntry.description,
          status: updatedEntry.status,
          lines_count: lines?.length || 0
        },
        changed_fields: changedFields,
        security_level: 'standard',
        compliance_tags: ['RGPD']
      }).catch(err => logger.error('JournalEntries', 'Audit log failed:', err));
      // 🎯 NOUVELLE: Invalider le cache KPI après mise à jour
      kpiCacheService.invalidateCache(payload.companyId);
      return {
        success: true,
        data: {
          ...updatedEntry,
          journal_entry_lines: lines ?? [],
        },
      };
    } catch (error) {
      const message = this.getUserFriendlyError(error, 'Failed to update journal entry');
      return { success: false, error: message };
    }
  }
  async deleteJournalEntry(entryId: string, companyId: string): Promise<ServiceResult<null>> {
    try {
      // ✅ Récupérer l'entrée avant suppression pour l'audit
      const { data: entryToDelete } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('id', entryId)
        .eq('company_id', companyId)
        .single();
      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .delete()
        .eq('journal_entry_id', entryId);
      if (linesError) {
        throw linesError;
      }
      const { error: entryError } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId)
        .eq('company_id', companyId);
      if (entryError) {
        throw entryError;
      }
      // ✅ Audit Log: DELETE journal entry (CRITICAL)
      if (entryToDelete) {
        auditService.log({
          event_type: 'DELETE',
          table_name: 'journal_entries',
          record_id: entryId,
          company_id: companyId,
          old_values: {
            entry_number: entryToDelete.entry_number,
            entry_date: entryToDelete.entry_date,
            description: entryToDelete.description,
            status: entryToDelete.status
          },
          security_level: 'critical', // ⚠️ Suppression = toujours critical
          compliance_tags: ['RGPD']
        }).catch(err => logger.error('JournalEntries', 'Audit log failed:', err));
      }
      // 🎯 NOUVELLE: Invalider le cache KPI après suppression
      kpiCacheService.invalidateCache(companyId);
      return { success: true, data: null };
    } catch (error) {
      const message = this.getUserFriendlyError(error, 'Failed to delete journal entry');
      return { success: false, error: message };
    }
  }
  async deleteAllJournalEntries(companyId: string): Promise<ServiceResult<null>> {
    try {
      const { data: entries, error: entriesError } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('company_id', companyId);
      if (entriesError) {
        throw entriesError;
      }
      const entryIds = (entries ?? []).map(({ id }) => id);
      if (entryIds.length > 0) {
        await supabase
          .from('journal_entry_lines')
          .delete()
          .in('journal_entry_id', entryIds);
      }
      const { error: deleteEntriesError } = await supabase
        .from('journal_entries')
        .delete()
        .eq('company_id', companyId);
      if (deleteEntriesError) {
        throw deleteEntriesError;
      }
      return { success: true, data: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete journal entries';
      return { success: false, error: message };
    }
  }
  async getJournalEntries(
    companyId: string,
    filters: JournalEntryListFilters = {},
  ): Promise<ServiceResult<PaginatedResult<JournalEntryWithItems>>> {
    try {
      const {
        page = 1,
        limit = 20,
        dateFrom,
        dateTo,
        journalId,
        accountId,
        reference,
        description,
        status,
        sortBy = 'entry_date',
        sortOrder = 'desc',
      } = filters;
      let query = supabase
        .from('journal_entries')
        .select(
          `*,
          journals!journal_entries_journal_id_fkey (id, code, name),
          journal_entry_lines (
            *,
            chart_of_accounts!account_id (id, account_number, account_name, account_type, account_class)
          )
        `,
          { count: 'exact' },
        )
        .eq('company_id', companyId);
      if (dateFrom) {
        query = query.gte('entry_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('entry_date', dateTo);
      }
      if (journalId) {
        query = query.eq('journal_id', journalId);
      }
      if (reference) {
        query = query.ilike('reference_number', `%${reference}%`);
      }
      if (description) {
        query = query.ilike('description', `%${description}%`);
      }
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      // Sinon, on ne filtre PAS par statut - on montre TOUT
      if (accountId) {
        const { data: entryIds, error: accountFilterError } = await supabase
          .from('journal_entry_lines')
          .select('journal_entry_id')
          .eq('account_id', accountId);
        if (accountFilterError) {
          throw accountFilterError;
        }
        const ids = (entryIds ?? []).map((row) => row.journal_entry_id);
        if (ids.length === 0) {
          return { success: true, data: { data: [], count: 0 } };
        }
        query = query.in('id', ids);
      }
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      if (limit) {
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);
      }
      // Emit a console log so Playwright can capture the request context
      try {
        console.log('[journalEntriesService] getJournalEntries calling Supabase for companyId:', companyId, 'filters:', { page, limit, dateFrom, dateTo, journalId, accountId, reference, description, status, sortBy, sortOrder });
      } catch (_e) { /* ignore logging errors */ }
      const { data, error, count } = await query;
      // Log raw result for browser debugging
      try {
        console.log('[journalEntriesService] getJournalEntries raw result:', { rows: (data || []).length, count });
      } catch (_e) { /* ignore logging errors */ }
      if (error) {
        throw error;
      }
      logger.info('JournalEntries', `[getJournalEntries] fetched ${((data||[]).length)} rows, count=${count}`);
      if (Array.isArray(data) && data.length > 0) {
        logger.info('JournalEntries', `[getJournalEntries] first entry id: ${(data[0] as any).id}`);
      }
      return {
        success: true,
        data: {
          data: data ?? [],
          count: count ?? data?.length ?? 0,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch journal entries';
      return { success: false, error: message };
    }
  }
  async updateEntryStatus(
    entryId: string,
    status: JournalEntryStatus,
    companyId: string,
  ): Promise<ServiceResult<JournalEntryWithItems>> {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .update({ status })
        .eq('id', entryId)
        .eq('company_id', companyId)
        .select(
          `*,
          journal_entry_lines (
            *,
            chart_of_accounts!account_id (id, account_number, account_name, account_type, account_class)
          )
        `,
        )
        .single();
      if (error || !data) {
        throw error ?? new Error('Failed to update journal entry status');
      }
      return { success: true, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update journal entry status';
      return { success: false, error: message };
    }
  }
  async getEntriesStats(companyId: string): Promise<ServiceResult<{
    totalEntries: number;
    draftEntries: number;
    postedEntries: number;
    cancelledEntries: number;
    totalDebit: number;
    totalCredit: number;
  }>> {
    try {
      const { data: entries, error: entriesError } = await supabase
        .from('journal_entries')
        .select('id, status')
        .eq('company_id', companyId);
      if (entriesError) {
        throw entriesError;
      }
      const entriesRows = normalizeData<{ id: string; status?: string }>(entries);
      const entryIds = (entriesRows ?? []).map((entry) => entry.id);
      let lines: { debit_amount: number | null; credit_amount: number | null }[] = [];
      if (entryIds.length > 0) {
        const { data: linesData, error: linesError } = await supabase
          .from('journal_entry_lines')
          .select('debit_amount, credit_amount, journal_entry_id')
          .in('journal_entry_id', entryIds);
        if (linesError) {
          throw linesError;
        }
        lines = normalizeData<{ debit_amount: number | null; credit_amount: number | null }>(linesData) ?? [];
      }
      const totals = lines.reduce(
        (acc, line) => {
          acc.totalDebit += coerceNumber(line.debit_amount);
          acc.totalCredit += coerceNumber(line.credit_amount);
          return acc;
        },
        { totalDebit: 0, totalCredit: 0 },
      );
      const stats = {
        totalEntries: entries?.length ?? 0,
        draftEntries: entries?.filter((entry) => entry.status === 'draft').length ?? 0,
        postedEntries: entries?.filter((entry) => entry.status === 'posted').length ?? 0,
        cancelledEntries: entries?.filter((entry) => entry.status === 'cancelled').length ?? 0,
        totalDebit: totals.totalDebit,
        totalCredit: totals.totalCredit,
      };
      return { success: true, data: stats };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to compute journal entry stats';
      return { success: false, error: message };
    }
  }
  async getAccountsList(companyId: string): Promise<MinimalAccount[]> {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('id, account_number, account_name, account_type, account_class, is_active, is_detail_account')
      .eq('company_id', companyId)
      .eq('is_active', true)
      // ✅ Correction: Retourner TOUS les comptes (principaux ET auxiliaires)
      // Commenté le filtre is_detail_account pour avoir tous les comptes
      // .eq('is_detail_account', true)
      .order('account_number', { ascending: true });
    if (error) {
      logger.error('JournalEntries', 'Error fetching accounts list:', error);
      return [];
    }
    return normalizeData<MinimalAccount>(data) || [];
  }
  async getJournalsList(companyId: string): Promise<MinimalJournal[]> {
    const { data, error } = await supabase
      .from('journals')
      .select('id, code, name, type, is_active')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('code', { ascending: true });
    if (error) {
      logger.error('JournalEntries', 'Error fetching journals list:', error);
      return [];
    }
    return normalizeData<MinimalJournal>(data) || [];
  }
  async getJournalEntryById(entryId: string, companyId: string): Promise<ServiceResult<JournalEntryWithItems>> {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select(
          `*,
          journals!journal_entries_journal_id_fkey (id, code, name),
          journal_entry_lines (
            *,
            chart_of_accounts (id, account_number, account_name, account_type, account_class)
          )
        `,
        )
        .eq('id', entryId)
        .eq('company_id', companyId)
        .single();
      if (error || !data || typeof data !== 'object') {
        throw error ?? new Error('Journal entry not found');
      }
      return { success: true, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch journal entry';
      return { success: false, error: message };
    }
  }
  private ensureBalanced(items: JournalEntryLineForm[]): void {
    const totalDebit = items.reduce((sum, item) => sum + coerceNumber(item.debitAmount), 0);
    const totalCredit = items.reduce((sum, item) => sum + coerceNumber(item.creditAmount), 0);
    if (Math.abs(totalDebit - totalCredit) > BALANCE_TOLERANCE) {
      throw new Error('Journal entry is not balanced');
    }
  }
  /**
   * ✅ NOUVELLE MÉTHODE: Valider une écriture selon les règles comptables
   */
  private async validateJournalEntry(
    companyId: string,
    items: JournalEntryLineForm[]
  ): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    // Récupérer les numéros de comptes
    const accountIds = items.map(item => item.accountId);
    const { data: accounts } = await supabase
      .from('chart_of_accounts')
      .select('id, account_number')
      .eq('company_id', companyId)
      .in('id', accountIds);
    const accountsRows = normalizeData<{ id: string; account_number?: string }>(accounts);
    const accountMap = new Map((accountsRows || []).map(acc => [acc.id, acc.account_number || '']));
    // Construire l'objet pour la validation
    const entryToValidate = {
      lines: items.map(item => ({
        accountNumber: accountMap.get(item.accountId) || '',
        debitAmount: coerceNumber(item.debitAmount),
        creditAmount: coerceNumber(item.creditAmount),
      })),
    };
    return AccountingRulesService.validateJournalEntry(entryToValidate);
  }
  private async normalizeLines(
    companyId: string,
    entryId: string,
    items: JournalEntryLineForm[],
  ): Promise<JournalEntryLineInsert[]> {
    if (!items?.length) {
      throw new Error('At least one journal entry line is required');
    }
    const accountIds = Array.from(new Set(items.map((item) => item.accountId))).filter(Boolean);
    if (accountIds.length === 0) {
      throw new Error('At least one valid account is required');
    }
    const { data: accounts, error: accountsError } = await supabase
      .from('chart_of_accounts')
      .select('id, account_number, account_name')
      .eq('company_id', companyId)
      .in('id', accountIds);
    if (accountsError) {
      throw accountsError;
    }
    const accountsRows = normalizeData<{ id: string; account_number?: string; account_name?: string }>(accounts);
    const accountMap = new Map((accountsRows ?? []).map((account) => [account.id, account]));
    return items.map((item, index) => {
      const accountInfo = accountMap.get(item.accountId);
      if (!accountInfo) {
        throw new Error(`Account ${item.accountId} not found or inactive.`);
      }
      return {
        journal_entry_id: entryId,
        company_id: companyId,
        account_id: item.accountId,
        description: item.description || '',
        debit_amount: coerceNumber(item.debitAmount),
        credit_amount: coerceNumber(item.creditAmount),
        line_order: index + 1,
        account_number: accountInfo.account_number ?? null,
        account_name: accountInfo.account_name ?? null,
      };
    });
  }
  private async fetchJournalCode(journalId?: string | null): Promise<string | null> {
    if (!journalId) {
      return null;
    }
    const { data, error } = await supabase
      .from('journals')
      .select('code')
      .eq('id', journalId)
      .single();
    if (error) {
      logger.warn('JournalEntries', 'Failed to fetch journal code:', error);
      return null;
    }
    return data?.code ?? null;
  }
  private async generateEntryNumber(companyId: string, journalId?: string | null): Promise<string | null> {
    // ✅ Utiliser le service de règles comptables pour générer le numéro
    if (!journalId) {
      // Fallback si pas de journal
      const year = new Date().getFullYear();
      return `OD-${year}-${Date.now().toString().slice(-6)}`;
    }
    try {
      const entryDate = new Date().toISOString();
      return await AccountingRulesService.generateEntryNumber(companyId, journalId, entryDate);
    } catch (error) {
      logger.warn('JournalEntries', 'Failed to generate entry number, falling back to timestamp-based value:', error);
      return `JR-${Date.now()}`;
    }
  }
  /**
   * Met à jour le statut d'une écriture comptable
   * @param entryId - ID de l'écriture
   * @param newStatus - Nouveau statut ('draft', 'posted', 'imported')
   * @param companyId - ID de l'entreprise
   * @returns Résultat de l'opération
   */
  async updateJournalEntryStatus(
    entryId: string,
    newStatus: JournalEntryStatus,
    companyId: string
  ): Promise<ServiceResult<JournalEntryWithItems>> {
    try {
      logger.debug('JournalEntries', `[journalEntriesService] Updating entry ${entryId} status to ${newStatus}`);
      // Vérifier que l'écriture appartient bien à l'entreprise
      const { data: existingEntry, error: checkError } = await supabase
        .from('journal_entries')
        .select('id, status')
        .eq('id', entryId)
        .eq('company_id', companyId)
        .single();
      if (checkError || !existingEntry) {
        throw new Error('Écriture introuvable ou accès non autorisé');
      }
      // Mettre à jour le statut
      const { data: updatedEntry, error: updateError } = await supabase
        .from('journal_entries')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId)
        .eq('company_id', companyId)
        .select(`
          *,
          journal_entry_lines (
            *,
            chart_of_accounts (
              id,
              account_number,
              account_name
            )
          )
        `)
        .single();
      if (updateError || !updatedEntry) {
        throw new Error(updateError?.message || 'Échec de la mise à jour du statut');
      }
      logger.debug('JournalEntries', `[journalEntriesService] Entry ${entryId} status updated successfully`);
      // ✅ Audit Log: STATUS CHANGE (HIGH security si validation)
      auditService.log({
        event_type: 'UPDATE',
        table_name: 'journal_entries',
        record_id: entryId,
        company_id: companyId,
        old_values: { status: existingEntry.status },
        new_values: { status: newStatus },
        changed_fields: ['status'],
        security_level: newStatus === 'posted' || newStatus === 'imported' ? 'high' : 'standard',
        compliance_tags: ['RGPD']
      }).catch(err => logger.error('JournalEntries', 'Audit log failed:', err));
      return {
        success: true,
        data: updatedEntry as unknown as JournalEntryWithItems
      };
    } catch (error) {
      const errorMessage = this.getUserFriendlyError(error, 'Erreur inconnue');
      logger.error('JournalEntries', '[journalEntriesService] Error updating entry status:', errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Creer une ecriture comptable en mode offline (brouillon local)
   */
  private async createJournalEntryOffline(payload: JournalEntryPayload): Promise<ServiceResult<JournalEntryWithItems>> {
    const localId = crypto.randomUUID();

    const offlineEntry = {
      company_id: payload.companyId,
      entry_date: payload.entryDate,
      description: payload.description,
      reference_number: payload.referenceNumber || `DRAFT-${Date.now()}`,
      journal_id: payload.journalId || null,
      status: 'draft',
      entry_number: payload.entryNumber || `OFF-${Date.now()}`,
    };

    const userResult = await supabase.auth.getUser().catch((): { data: { user: { id: string } | null } } => ({ data: { user: null } }));
    const userId = userResult.data.user?.id || 'offline';
    await offlineDataService.insert('journal_entries', offlineEntry, userId, payload.companyId);

    logger.info('JournalEntries', `Ecriture comptable brouillon creee offline (local_id: ${localId})`);

    const result: JournalEntryWithItems = {
      id: localId,
      ...offlineEntry,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _offline: true,
      items: payload.items.map((item, index) => ({
        id: crypto.randomUUID(),
        journal_entry_id: localId,
        account_id: item.accountId,
        debit_amount: item.debitAmount || 0,
        credit_amount: item.creditAmount || 0,
        description: item.description || '',
        line_order: index + 1,
      })),
    } as unknown as JournalEntryWithItems;

    return { success: true, data: result };
  }
}
export const journalEntriesService = new JournalEntriesService();