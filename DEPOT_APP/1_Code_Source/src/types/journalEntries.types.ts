import type { Database } from '@/types/supabase';

export type JournalEntryRow = Database['public']['Tables']['journal_entries']['Row'];
export type JournalEntryLineRow = Database['public']['Tables']['journal_entry_lines']['Row'];
export type JournalRow = Database['public']['Tables']['journals']['Row'];
export type AccountRow = Database['public']['Tables']['chart_of_accounts']['Row'];

export type JournalEntryStatus = JournalEntryRow['status'];

export interface JournalEntryLineForm {
  accountId: string;
  debitAmount: number;
  creditAmount: number;
  description?: string;
  currency?: string;
}

export interface JournalEntryFormValues {
  entryDate: Date;
  description: string;
  referenceNumber?: string;
  journalId: string;
  items: JournalEntryLineForm[];
}

export interface JournalEntryFormInitialValues extends JournalEntryFormValues {
  id?: string;
  status?: JournalEntryStatus;
  entryNumber?: string | null;
}

export type MinimalJournal = Pick<JournalRow, 'id' | 'code' | 'name' | 'type' | 'is_active'>;
export type MinimalAccount = Pick<AccountRow, 'id' | 'account_number' | 'account_name' | 'account_type' | 'account_class' | 'is_active' | 'is_detail_account'>;

export interface JournalEntryPayload {
  companyId: string;
  entryDate: string;
  description: string;
  referenceNumber?: string;
  journalId?: string | null;
  status?: JournalEntryStatus;
  entryNumber?: string | null;
  items: JournalEntryLineForm[];
}

export type JournalEntryWithItems = JournalEntryRow & {
  journal_entry_lines?: (JournalEntryLineRow & {
    chart_of_accounts?: {
      id: string;
      account_number: string | null;
      account_name: string | null;
      account_type?: string | null;
      account_class?: number | null;
    };
  })[];
};
