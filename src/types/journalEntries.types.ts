import type { Database } from '@/types/supabase';
import type { JournalEntry, JournalEntryLine, Journal, AccountBalance, ValidationResult } from '@/types/accounting';

// Types de base depuis la base de données
export type JournalEntryRow = Database['public']['Tables']['journal_entries']['Row'];
export type JournalEntryItemRow = Database['public']['Tables']['journal_entry_items']['Row'];
export type JournalRow = Database['public']['Tables']['journals']['Row'];
export type AccountRow = Database['public']['Tables']['accounts']['Row'];

export type JournalEntryStatus = JournalEntryRow['status'];

// Interface pour le formulaire de création d'écritures
export interface JournalEntryLineForm {
  accountId: string;
  accountNumber?: string;
  accountName?: string;
  debitAmount: number;
  creditAmount: number;
  description?: string;
  currency?: string;
  reference?: string;
}

// Interface pour le formulaire d'écriture complète
export interface JournalEntryFormValues {
  entryDate: Date;
  description: string;
  referenceNumber?: string;
  journalId: string;
  journalCode?: string;
  journalName?: string;
  status?: JournalEntryStatus;
  items: JournalEntryLineForm[];
}

// Valeurs initiales pour le formulaire
export interface JournalEntryFormInitialValues extends JournalEntryFormValues {
  id?: string;
  entryNumber?: string | null;
  totalDebit?: number;
  totalCredit?: number;
  isBalanced?: boolean;
}

// Payload pour créer/modifier une écriture
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

// Types simplifiés pour les listes
export type MinimalJournal = Pick<JournalRow, 'id' | 'code' | 'name' | 'type' | 'is_active'>;
export type MinimalAccount = Pick<AccountRow, 'id' | 'account_number' | 'name' | 'type' | 'class' | 'is_active'>;

// Écriture avec ses lignes (pour les réponses API)
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
  journals?: {
    id: string;
    code: string | null;
    name: string | null;
    type?: string | null;
  };
};

// Résultats de recherche et pagination
export interface JournalEntrySearchResult {
  entries: JournalEntryWithItems[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Filtres de recherche
export interface JournalEntryFilters {
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  journalId?: string;
  accountId?: string;
  reference?: string;
  description?: string;
  status?: JournalEntryStatus;
  sortBy?: 'entry_date' | 'created_at' | 'entry_number';
  sortOrder?: 'asc' | 'desc';
  amountMin?: number;
  amountMax?: number;
}

// Statistiques des écritures
export interface JournalEntryStats {
  totalEntries: number;
  totalDebit: number;
  totalCredit: number;
  balancedEntries: number;
  unbalancedEntries: number;
  draftEntries: number;
  postedEntries: number;
  validatedEntries: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

// Résumé d'écriture pour les listes
export interface JournalEntrySummary {
  id: string;
  entryNumber: string | null;
  entryDate: string;
  description: string;
  referenceNumber: string | null;
  journalCode: string | null;
  journalName: string | null;
  status: JournalEntryStatus;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  lineCount: number;
  createdAt: string;
  createdBy?: string;
}

// Interface pour l'import d'écritures
export interface JournalEntryImportData {
  entryDate: string;
  description: string;
  referenceNumber?: string;
  journalCode: string;
  lines: {
    accountNumber: string;
    debitAmount: number;
    creditAmount: number;
    description?: string;
  }[];
}

// Résultat d'import
export interface JournalEntryImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: {
    row: number;
    error: string;
    data: JournalEntryImportData;
  }[];
  warnings: {
    row: number;
    warning: string;
    data: JournalEntryImportData;
  }[];
}

// Interface pour les écritures récurrentes
export interface RecurringJournalEntry {
  id: string;
  companyId: string;
  templateId: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate?: string;
  lastGenerated?: string;
  nextGeneration: string;
  isActive: boolean;
  variables: Record<string, any>; // Variables pour le template
  createdAt: string;
  updatedAt: string;
}

// Interface pour les écritures d'ajustement
export interface AdjustmentEntry {
  id: string;
  companyId: string;
  reason: 'opening_balance' | 'closing_adjustment' | 'revaluation' | 'error_correction' | 'tax_adjustment' | 'other';
  description: string;
  entryDate: string;
  journalId: string;
  lines: JournalEntryLineForm[];
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}
