
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

type JournalEntryInsert = Database['public']['Tables']['journal_entries']['Insert'];
type JournalEntryUpdate = Database['public']['Tables']['journal_entries']['Update'];
type JournalEntryItemInsert = Database['public']['Tables']['journal_entry_items']['Insert'];

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

const DEFAULT_CURRENCY = 'EUR';
const BALANCE_TOLERANCE = 0.01;

function coerceNumber(value: unknown): number {
  const parsed = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

class JournalEntriesService {
  async createJournalEntry(payload: JournalEntryPayload): Promise<ServiceResult<JournalEntryWithItems>> {
    try {
      this.ensureBalanced(payload.items);

      const entryNumber = payload.entryNumber ?? (await this.generateEntryNumber(payload.companyId, payload.journalId));

      const entryInsert: JournalEntryInsert = {
        company_id: payload.companyId,
        entry_date: payload.entryDate,
        description: payload.description,
        reference_number: payload.referenceNumber ?? null,
        journal_id: payload.journalId ?? null,
        status: payload.status ?? 'draft',
        entry_number: entryNumber,
      };

      const { data: entry, error: entryError } = await supabase
        .from('journal_entries')
        .insert(entryInsert)
        .select('*')
        .single();

      if (entryError || !entry) {
        throw entryError ?? new Error('Failed to create journal entry');
      }

      const linesInsert = this.normalizeLines(payload.companyId, entry.id, payload.items);

      const { data: lines, error: linesError } = await supabase
        .from('journal_entry_items')
        .insert(linesInsert)
        .select('*, accounts (id, account_number, name, type, class)');

      if (linesError) {
        await supabase.from('journal_entries').delete().eq('id', entry.id);
        throw linesError;
      }

      return {
        success: true,
        data: {
          ...entry,
          journal_entry_items: lines ?? [],
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create journal entry';
      return { success: false, error: message };
    }
  }

  async updateJournalEntry(entryId: string, payload: JournalEntryPayload): Promise<ServiceResult<JournalEntryWithItems>> {
    try {
      this.ensureBalanced(payload.items);

      const { data: existingEntry, error: fetchError } = await supabase
        .from('journal_entries')
        .select('id, company_id, entry_number, status')
        .eq('id', entryId)
        .single();

      if (fetchError || !existingEntry) {
        throw fetchError ?? new Error('Journal entry not found');
      }

      if (existingEntry.company_id !== payload.companyId) {
        throw new Error('Journal entry does not belong to the provided company');
      }

      const entryUpdate: JournalEntryUpdate = {
        entry_date: payload.entryDate,
        description: payload.description,
        reference_number: payload.referenceNumber ?? null,
        journal_id: payload.journalId ?? null,
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
        .from('journal_entry_items')
        .delete()
        .eq('journal_entry_id', entryId)
        .eq('company_id', payload.companyId);

      if (deleteError) {
        throw deleteError;
      }

      const linesInsert = this.normalizeLines(payload.companyId, entryId, payload.items);

      const { data: lines, error: linesError } = await supabase
        .from('journal_entry_items')
        .insert(linesInsert)
        .select('*, accounts (id, account_number, name, type, class)');

      if (linesError) {
        throw linesError;
      }

      return {
        success: true,
        data: {
          ...updatedEntry,
          journal_entry_items: lines ?? [],
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update journal entry';
      return { success: false, error: message };
    }
  }

  async deleteJournalEntry(entryId: string, companyId: string): Promise<ServiceResult<null>> {
    try {
      const { error: linesError } = await supabase
        .from('journal_entry_items')
        .delete()
        .eq('journal_entry_id', entryId)
        .eq('company_id', companyId);

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
          .from('journal_entry_items')
          .delete()
          .in('journal_entry_id', entryIds)
          .eq('company_id', companyId);
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
          journal_entry_items (
            *,
            accounts (id, account_number, name, type, class)
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
          .from('journal_entry_items')
          .select('journal_entry_id')
          .eq('account_id', accountId)
          .eq('company_id', companyId);

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
          journal_entry_items (
            *,
            accounts (id, account_number, name, type, class)
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

      const { data: items, error: itemsError } = await supabase
        .from('journal_entry_items')
        .select('debit_amount, credit_amount')
        .eq('company_id', companyId);

      if (itemsError) {
        throw itemsError;
      }

      const totals = (items ?? []).reduce(
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
      .from('accounts')
      .select('id, account_number, name, type, class, is_active')
      .eq('company_id', companyId)
      .eq('is_active', true)
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
          journal_entry_items (
            *,
            accounts (id, account_number, name, type, class)
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

  private normalizeLines(companyId: string, entryId: string, items: JournalEntryLineForm[]): JournalEntryItemInsert[] {
    return items.map((item) => ({
      journal_entry_id: entryId,
      company_id: companyId,
      account_id: item.accountId,
      debit_amount: coerceNumber(item.debitAmount),
      credit_amount: coerceNumber(item.creditAmount),
      description: item.description ?? null,
      currency: item.currency ?? DEFAULT_CURRENCY,
    }));
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
}

export const journalEntriesService = new JournalEntriesService();
