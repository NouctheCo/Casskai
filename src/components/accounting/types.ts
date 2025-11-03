// Types for FEC Import functionality

export interface FECEntry {
  journalCode: string;
  accountNumber: string;
  date: string;
  reference?: string;
  description: string;
  debit: number;
  credit: number;
  balance?: number;
  [key: string]: string | number | undefined;
}

export interface ParseResult {
  success: boolean;
  entries?: FECEntry[];
  errors?: Array<{ message: string; line?: number }>;
  warnings?: Array<{ message: string; line?: number }>;
  validRows?: number;
  totalRows?: number;
}

export interface AccountSummary {
  code: string;
  name: string;
  type: string;
  entries: number;
}

export interface JournalSummary {
  code: string;
  name: string;
  entries: number;
}

export interface ImportSummary {
  errors: Array<{ message: string; line?: number }>;
  warnings?: Array<{ message: string; line?: number }>;
  numEntries: number;
  numAccounts?: number;
  numJournals?: number;
  totalDebit?: string;
  totalCredit?: string;
  balance?: string;
  unbalancedEntries?: string[];
}

export interface TransformedFECData {
  entries: FECEntry[];
  accounts: Map<string, AccountSummary>;
  journals: string[];
  summary: ImportSummary;
}
