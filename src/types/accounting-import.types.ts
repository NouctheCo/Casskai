import { z } from 'zod';

// ===== TYPES DE BASE =====
export interface FECEntry {
  journalCode: string;
  journalName: string;
  entryNumber: string;
  date: string;
  accountNumber: string;
  accountName: string;
  auxiliaryAccount?: string;
  auxiliaryName?: string;
  reference: string;
  label: string;
  debit: number;
  credit: number;
  letterage?: string;
  reconciliation?: string;
  validDate?: string;
  currency?: string;
  currencyDebit?: number;
  currencyCredit?: number;
  multiplier?: number;
}

export interface CSVMapping {
  fieldName: string;
  columnIndex: number;
  columnName: string;
  isRequired: boolean;
  dataType: 'string' | 'number' | 'date' | 'amount';
  defaultValue?: string;
  transform?: (value: string) => any;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  errors: ImportError[];
  entries: JournalEntry[];
  duplicates: JournalEntry[];
  warnings: ImportWarning[];
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  type: 'validation' | 'format' | 'business' | 'duplicate';
  severity: 'error' | 'warning';
}

export interface ImportWarning {
  row: number;
  field?: string;
  message: string;
  suggestion?: string;
}

// ===== VALIDATION SCHEMAS AVEC ZOD =====
export const FECEntrySchema = z.object({
  journalCode: z.string().min(1, 'Code journal obligatoire').max(20),
  journalName: z.string().min(1, 'Nom journal obligatoire').max(100),
  entryNumber: z.string().min(1, 'Numéro d\'écriture obligatoire'),
  date: z.string().regex(/^\d{8}$/, 'Date au format AAAAMMJJ'),
  accountNumber: z.string().min(3, 'Numéro de compte minimum 3 caractères').max(20),
  accountName: z.string().min(1, 'Nom du compte obligatoire').max(200),
  auxiliaryAccount: z.string().max(20).optional(),
  auxiliaryName: z.string().max(200).optional(),
  reference: z.string().max(100),
  label: z.string().min(1, 'Libellé obligatoire').max(200),
  debit: z.number().min(0, 'Débit positif ou nul'),
  credit: z.number().min(0, 'Crédit positif ou nul'),
  letterage: z.string().max(10).optional(),
  reconciliation: z.string().max(20).optional(),
  validDate: z.string().regex(/^\d{8}$/).optional(),
  currency: z.string().length(3).optional(),
  currencyDebit: z.number().min(0).optional(),
  currencyCredit: z.number().min(0).optional(),
  multiplier: z.number().min(0).optional(),
}).refine(data => data.debit > 0 || data.credit > 0, {
  message: 'Une écriture doit avoir un débit ou un crédit',
  path: ['debit']
}).refine(data => !(data.debit > 0 && data.credit > 0), {
  message: 'Une écriture ne peut avoir débit ET crédit',
  path: ['credit']
});

export const JournalEntrySchema = z.object({
  id: z.string().uuid().optional(),
  companyId: z.string().uuid(),
  journalId: z.string().uuid(),
  entryNumber: z.string().min(1),
  date: z.string().datetime(),
  description: z.string().min(1, 'Description obligatoire'),
  reference: z.string().optional(),
  status: z.enum(['draft', 'validated', 'posted']),
  items: z.array(z.object({
    accountId: z.string().uuid(),
    debitAmount: z.number().min(0),
    creditAmount: z.number().min(0),
    description: z.string(),
    auxiliaryAccount: z.string().optional(),
    letterage: z.string().optional(),
  })).min(2, 'Au moins 2 lignes d\'écriture'),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
}).refine(data => {
  const totalDebit = data.items.reduce((sum, item) => sum + item.debitAmount, 0);
  const totalCredit = data.items.reduce((sum, item) => sum + item.creditAmount, 0);
  return Math.abs(totalDebit - totalCredit) < 0.01;
}, {
  message: 'L\'écriture doit être équilibrée (débit = crédit)',
  path: ['items']
});

// ===== TEMPLATES D'ÉCRITURES =====
export interface EntryTemplate {
  id: string;
  name: string;
  description: string;
  category: 'sale' | 'purchase' | 'payment' | 'bank' | 'other';
  isRecurring: boolean;
  frequency?: 'monthly' | 'quarterly' | 'yearly';
  accounts: TemplateAccount[];
  vatRules?: VATRule[];
  conditions?: TemplateCondition[];
}

export interface TemplateAccount {
  id: string;
  accountType: 'debit' | 'credit';
  accountNumber?: string;
  accountId?: string;
  label: string;
  amountFormula: string; // Ex: "#{amount}", "#{amount} * 0.2"
  isVariable: boolean;
  conditions?: string[];
}

export interface VATRule {
  id: string;
  name: string;
  rate: number;
  type: 'standard' | 'reduced' | 'super_reduced' | 'zero' | 'exempt';
  deductible: boolean;
  accountDebit?: string;
  accountCredit?: string;
  regime?: 'normal' | 'simplified' | 'mini' | 'franchise';
}

export interface TemplateCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
  value: any;
  action: 'include' | 'exclude' | 'modify';
}

// ===== LETTRAGE AUTOMATIQUE =====
export interface LetterageRule {
  id: string;
  name: string;
  accountPattern: string;
  criteria: LetterageCriteria[];
  tolerance: number;
  autoValidate: boolean;
}

export interface LetterageCriteria {
  field: 'amount' | 'date' | 'reference' | 'thirdParty';
  tolerance?: number;
  daysWindow?: number;
  exactMatch?: boolean;
}

export interface LetterageMatch {
  debitEntries: string[];
  creditEntries: string[];
  difference: number;
  confidence: number;
  letterCode: string;
}

// ===== GESTION DES IMPORTS =====
export interface ImportSession {
  id: string;
  filename: string;
  format: 'FEC' | 'CSV' | 'Excel';
  status: 'parsing' | 'mapping' | 'validating' | 'importing' | 'completed' | 'failed';
  totalRows: number;
  validRows: number;
  errors: number;
  warnings: number;
  mapping?: CSVMapping[];
  preview?: any[];
  result?: ImportResult;
  createdAt: string;
  completedAt?: string;
}

export interface FileParserOptions {
  encoding?: string;
  delimiter?: string;
  skipEmptyLines?: boolean;
  skipFirstRow?: boolean;
  dateFormat?: string;
  decimalSeparator?: string;
  thousandSeparator?: string;
}

// ===== EXPORT DES TYPES POUR ZOD =====
export type FECEntryType = z.infer<typeof FECEntrySchema>;
export type JournalEntryType = z.infer<typeof JournalEntrySchema>;