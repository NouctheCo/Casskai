/**
 * Types pour l'analyse de documents par IA
 */

export interface JournalEntryLine {
  account_suggestion: string;
  account_class: string;
  debit_amount: number;
  credit_amount: number;
  description: string;
}

export interface RawExtraction {
  supplier_name?: string;
  customer_name?: string;
  invoice_number?: string;
  invoice_date?: string;
  total_ht?: number;
  total_ttc?: number;
  vat_amount?: number;
  vat_rate?: number;
  currency?: string;
  line_items?: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    vat_rate: number;
  }>;
}

export interface JournalEntryExtracted {
  entry_date: string;
  description: string;
  reference_number: string;
  lines: JournalEntryLine[];
  confidence_score: number;
  raw_extraction: RawExtraction;
}

export interface DocumentAnalysisResult {
  success: boolean;
  data?: JournalEntryExtracted;
  error?: string;
}

export interface CategorySuggestion {
  category: string;
  account_number: string;
  account_class: string;
  account_name: string;
  confidence: number;
  reasoning?: string;
}

export interface BankCategorizationResult {
  success: boolean;
  categories?: CategorySuggestion[];
  processed_count?: number;
  total_count?: number;
  has_more?: boolean;
  error?: string;
}

export type DocumentType = 'invoice' | 'receipt' | 'bank_statement';
export type ExpectedFormat = 'journal_entry' | 'transaction_categorization';
