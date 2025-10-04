import type { Database } from '@/types/supabase';

export type JournalEntryRow = Database['public']['Tables']['journal_entries']['Row'];
export type JournalEntryItemRow = Database['public']['Tables']['journal_entry_items']['Row'];
export type JournalRow = Database['public']['Tables']['journals']['Row'];
export type AccountRow = Database['public']['Tables']['accounts']['Row'];

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
export type MinimalAccount = Pick<AccountRow, 'id' | 'account_number' | 'name' | 'type' | 'class' | 'is_active'>;

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
  journal_entry_items?: (JournalEntryItemRow & {
    accounts?: {
      id: string;
      account_number: string | null;
      name: string | null;
      type?: string | null;
      class?: string | null;
    };
  })[];
};
