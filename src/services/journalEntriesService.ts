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


import { supabase } from '@/lib/supabase';
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
  async createJournalEntry(payload: JournalEntryPayload): Promise<ServiceResult<JournalEntryWithItems>> {
    console.log('[JournalEntriesService] createJournalEntry called with:', payload);

    try {
      this.ensureBalanced(payload.items);

      // Si journal_id n'est pas fourni, récupérer le premier journal actif de la company
      let journalId = payload.journalId;

      console.warn('🔍 [JournalEntriesService] payload.journalId:', payload.journalId);
      console.warn('🔍 [JournalEntriesService] journalId initial:', journalId);
      console.warn('🔍 [JournalEntriesService] Tentative récupération journal par défaut...');

      if (!journalId) {
        try {
          console.warn('🔍 Récupération journal par défaut pour company:', payload.companyId);

          const { data: defaultJournal, error: journalError } = await supabase
            .from('journals')
            .select('id, code, name')
            .eq('company_id', payload.companyId)
            .eq('is_active', true)
            .limit(1)
            .single();

          console.warn('🔍 Résultat query journals:', { data: defaultJournal, error: journalError });

          if (journalError) {
            console.error('❌ Erreur récupération journal:', journalError);
            throw new Error(`Erreur récupération journal: ${journalError.message}`);
          }

          if (!defaultJournal) {
            console.error('❌ Aucun journal trouvé');
            throw new Error('Aucun journal actif trouvé pour cette entreprise');
          }

          journalId = defaultJournal.id;
          console.warn('✅ Journal par défaut trouvé:', defaultJournal);
        } catch (error) {
          console.error('💥 Exception récupération journal:', error);
          throw error;
        }
      }

      console.warn('🔍 journalId final avant génération numéro:', journalId);

      const entryNumber = payload.entryNumber ?? (await this.generateEntryNumber(payload.companyId, journalId));

      const entryInsert: JournalEntryInsert = {
        company_id: payload.companyId,
        entry_date: payload.entryDate,
        description: payload.description,
        reference_number: payload.referenceNumber ?? null,
        journal_id: journalId,
        status: payload.status ?? 'draft',
        entry_number: entryNumber,
      };

      console.warn('🔍 Payload final pour insertion:', entryInsert);

      const { data: entry, error: entryError } = await supabase
        .from('journal_entries')
        .insert(entryInsert)
        .select('*')
        .single();

      if (entryError || !entry) {
        throw entryError ?? new Error('Failed to create journal entry');
      }

      const linesInsert = await this.normalizeLines(payload.companyId, entry.id, payload.items);

      const { data: lines, error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(linesInsert)
        .select('*, chart_of_accounts!account_id (id, account_number, account_name, account_type, account_class)');

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
      }).catch(err => console.error('Audit log failed:', err));

      return {
        success: true,
        data: {
          ...entry,
          journal_entry_lines: lines ?? [],
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create journal entry';
      console.error('[JournalEntriesService] createJournalEntry failed:', error);
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

      console.warn('🔍 [JournalEntriesService] updateJournalEntry - payload.journalId:', payload.journalId);
      console.warn('🔍 [JournalEntriesService] updateJournalEntry - journalId initial:', journalId);

      if (!journalId) {
        try {
          console.warn('🔍 [JournalEntriesService] updateJournalEntry - Récupération journal par défaut pour company:', payload.companyId);

          const { data: defaultJournal, error: journalError } = await supabase
            .from('journals')
            .select('id, code, name')
            .eq('company_id', payload.companyId)
            .eq('is_active', true)
            .limit(1)
            .single();

          console.warn('🔍 [JournalEntriesService] updateJournalEntry - Résultat query journals:', { data: defaultJournal, error: journalError });

          if (journalError) {
            console.error('❌ [JournalEntriesService] updateJournalEntry - Erreur récupération journal:', journalError);
            throw new Error(`Erreur récupération journal: ${journalError.message}`);
          }

          if (!defaultJournal) {
            console.error('❌ [JournalEntriesService] updateJournalEntry - Aucun journal trouvé');
            throw new Error('Aucun journal actif trouvé pour cette entreprise');
          }

          journalId = defaultJournal.id;
          console.warn('✅ [JournalEntriesService] updateJournalEntry - Journal par défaut trouvé:', defaultJournal);
        } catch (error) {
          console.error('💥 [JournalEntriesService] updateJournalEntry - Exception récupération journal:', error);
          throw error;
        }
      }

      console.warn('🔍 [JournalEntriesService] updateJournalEntry - journalId final:', journalId);

      const entryUpdate: JournalEntryUpdate = {
        entry_date: payload.entryDate,
        description: payload.description,
        reference_number: payload.referenceNumber ?? null,
        journal_id: journalId,
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
      }).catch(err => console.error('Audit log failed:', err));

      return {
        success: true,
        data: {
          ...updatedEntry,
          journal_entry_lines: lines ?? [],
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update journal entry';
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
        }).catch(err => console.error('Audit log failed:', err));
      }

      return { success: true, data: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete journal entry';
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
          journals (id, code, name),
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

      const { data, error, count } = await query;

      if (error) {
        throw error;
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

      const entryIds = (entries ?? []).map((entry) => entry.id);

      let lines: { debit_amount: number | null; credit_amount: number | null }[] = [];
      if (entryIds.length > 0) {
        const { data: linesData, error: linesError } = await supabase
          .from('journal_entry_lines')
          .select('debit_amount, credit_amount, journal_entry_id')
          .in('journal_entry_id', entryIds);

        if (linesError) {
          throw linesError;
        }

        lines = linesData ?? [];
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
      console.error('Error fetching accounts list:', error);
      return [];
    }

    return data ?? [];
  }

  async getJournalsList(companyId: string): Promise<MinimalJournal[]> {
    const { data, error } = await supabase
      .from('journals')
      .select('id, code, name, type, is_active')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('code', { ascending: true });

    if (error) {
      console.error('Error fetching journals list:', error);
      return [];
    }

    return data ?? [];
  }

  async getJournalEntryById(entryId: string, companyId: string): Promise<ServiceResult<JournalEntryWithItems>> {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select(
          `*,
          journals (id, code, name),
          journal_entry_lines (
            *,
            chart_of_accounts (id, account_number, account_name, account_type, account_class)
          )
        `,
        )
        .eq('id', entryId)
        .eq('company_id', companyId)
        .single();

      if (error || !data) {
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

    const accountMap = new Map((accounts ?? []).map((account) => [account.id, account]));

    return items.map((item, index) => {
      const accountInfo = accountMap.get(item.accountId);
      if (!accountInfo) {
        throw new Error(`Account ${item.accountId} not found or inactive.`);
      }

      return {
        journal_entry_id: entryId,
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
      console.warn('Failed to fetch journal code:', error);
      return null;
    }

    return data?.code ?? null;
  }

  private async generateEntryNumber(companyId: string, journalId?: string | null): Promise<string | null> {
    try {
      const journalCode = await this.fetchJournalCode(journalId);
      const sanitizedPrefix = (journalCode ?? 'JR').replace(/[^A-Z0-9]/gi, '').toUpperCase() || 'JR';
      const year = new Date().getFullYear();
      const likePattern = `${sanitizedPrefix}-${year}-%`;

      const { data, error } = await supabase
        .from('journal_entries')
        .select('entry_number')
        .eq('company_id', companyId)
        .like('entry_number', likePattern)
        .order('entry_number', { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }

      let nextSequence = 1;
      const lastEntry = data?.[0]?.entry_number;
      if (lastEntry) {
        const match = lastEntry.match(/(\\d+)$/);
        if (match) {
          nextSequence = parseInt(match[1], 10) + 1;
        }
      }

      return `${sanitizedPrefix}-${year}-${String(nextSequence).padStart(4, '0')}`;
    } catch (error) {
      console.warn('Failed to generate entry number, falling back to timestamp-based value:', error);
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
      console.log(`[journalEntriesService] Updating entry ${entryId} status to ${newStatus}`);

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

      console.log(`[journalEntriesService] Entry ${entryId} status updated successfully`);

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
      }).catch(err => console.error('Audit log failed:', err));

      return {
        success: true,
        data: updatedEntry as unknown as JournalEntryWithItems
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('[journalEntriesService] Error updating entry status:', errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}

export const journalEntriesService = new JournalEntriesService();
