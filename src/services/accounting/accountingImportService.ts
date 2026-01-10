/**
 * Accounting Import Service
 *
 * Service avancé pour importer des données comptables depuis:
 * - CSV/Excel: Écritures comptables
 * - CSV: Plan comptable
 * - FEC: Import depuis autre logiciel
 *
 * Features:
 * - Mapping flexible des colonnes
 * - Validation avant import
 * - Preview avec corrections
 * - Import en batch
 * - Gestion des erreurs par ligne
 */
import { supabase } from '@/lib/supabase';
import Papa from 'papaparse';
import { logger } from '@/lib/logger';
// ============================================================================
// TYPES
// ============================================================================
export interface ImportMapping {
  // Source columns -> Target fields
  [sourceColumn: string]: string;
}
export interface JournalEntryImportRow {
  // Required fields
  entry_date: string;
  journal_code: string;
  account_number: string;
  description: string;
  debit_amount?: number;
  credit_amount?: number;
  // Optional fields
  entry_number?: string;
  reference_number?: string;
  auxiliary_account?: string;
  lettrage_code?: string;
}
export interface ChartOfAccountImportRow {
  account_number: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  account_class: number;
  parent_account?: string;
  is_active?: boolean;
}
export interface ImportValidationError {
  row: number;
  column?: string;
  error: string;
  value?: any;
}
export interface ImportResult {
  success: boolean;
  total_rows: number;
  imported: number;
  failed: number;
  errors: ImportValidationError[];
  warnings: string[];
}
// ============================================================================
// CSV/EXCEL PARSING
// ============================================================================
/**
 * Parse CSV file
 */
export async function parseCSV(file: File): Promise<{
  data: any[];
  columns: string[];
  error?: string;
}> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const columns = results.meta.fields || [];
        resolve({
          data: results.data,
          columns,
        });
      },
      error: (error) => {
        resolve({
          data: [],
          columns: [],
          error: error.message,
        });
      },
    });
  });
}
/**
 * Detect column mapping automatically
 */
export function detectColumnMapping(
  columns: string[],
  type: 'journal_entries' | 'chart_of_accounts'
): ImportMapping {
  const mapping: ImportMapping = {};
  if (type === 'journal_entries') {
    // Common column name variations
    const patterns = {
      entry_date: ['date', 'entry_date', 'date_ecriture', 'date_compta', 'ecriturelettre'],
      journal_code: ['journal', 'journal_code', 'code_journal', 'journalcode'],
      account_number: ['compte', 'account', 'account_number', 'comptenum', 'numero_compte'],
      description: ['libelle', 'description', 'libellé', 'intitule'],
      debit_amount: ['debit', 'montant_debit', 'debiteur', 'montantdebit'],
      credit_amount: ['credit', 'montant_credit', 'crediteur', 'montantcredit'],
      reference_number: ['piece', 'reference', 'ref', 'numero_piece', 'pieceref'],
      lettrage_code: ['lettrage', 'lettrage_code', 'code_lettrage'],
    };
    columns.forEach(col => {
      const colLower = col.toLowerCase().trim();
      for (const [targetField, variations] of Object.entries(patterns)) {
        if (variations.some(v => colLower.includes(v))) {
          mapping[col] = targetField;
          break;
        }
      }
    });
  } else if (type === 'chart_of_accounts') {
    const patterns = {
      account_number: ['compte', 'numero', 'number', 'account'],
      account_name: ['libelle', 'name', 'intitule', 'label'],
      account_type: ['type', 'category', 'categorie'],
      account_class: ['class', 'classe'],
    };
    columns.forEach(col => {
      const colLower = col.toLowerCase().trim();
      for (const [targetField, variations] of Object.entries(patterns)) {
        if (variations.some(v => colLower.includes(v))) {
          mapping[col] = targetField;
          break;
        }
      }
    });
  }
  return mapping;
}
// ============================================================================
// VALIDATION
// ============================================================================
/**
 * Validate journal entry row
 */
function validateJournalEntryRow(
  row: any,
  mapping: ImportMapping,
  rowIndex: number
): ImportValidationError[] {
  const errors: ImportValidationError[] = [];
  // Apply mapping
  const mappedRow: Partial<JournalEntryImportRow> = {};
  for (const [sourceCol, targetField] of Object.entries(mapping)) {
    mappedRow[targetField as keyof JournalEntryImportRow] = row[sourceCol];
  }
  // Required fields
  if (!mappedRow.entry_date) {
    errors.push({
      row: rowIndex,
      column: 'entry_date',
      error: 'Date manquante',
    });
  }
  if (!mappedRow.journal_code) {
    errors.push({
      row: rowIndex,
      column: 'journal_code',
      error: 'Code journal manquant',
    });
  }
  if (!mappedRow.account_number) {
    errors.push({
      row: rowIndex,
      column: 'account_number',
      error: 'Numéro de compte manquant',
    });
  }
  if (!mappedRow.description) {
    errors.push({
      row: rowIndex,
      column: 'description',
      error: 'Description manquante',
    });
  }
  // At least one amount (debit or credit)
  const debit = parseFloat(mappedRow.debit_amount as any) || 0;
  const credit = parseFloat(mappedRow.credit_amount as any) || 0;
  if (debit === 0 && credit === 0) {
    errors.push({
      row: rowIndex,
      column: 'debit_amount/credit_amount',
      error: 'Au moins un montant (débit ou crédit) est requis',
    });
  }
  // Both amounts should not be filled
  if (debit > 0 && credit > 0) {
    errors.push({
      row: rowIndex,
      column: 'debit_amount/credit_amount',
      error: 'Débit ET crédit ne peuvent pas être remplis simultanément',
    });
  }
  // Validate date format
  if (mappedRow.entry_date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(String(mappedRow.entry_date))) {
      errors.push({
        row: rowIndex,
        column: 'entry_date',
        error: 'Format de date invalide (attendu: YYYY-MM-DD)',
        value: mappedRow.entry_date,
      });
    }
  }
  // Validate account number format (French PCG style)
  if (mappedRow.account_number) {
    const accountNum = String(mappedRow.account_number);
    if (!/^\d+$/.test(accountNum)) {
      errors.push({
        row: rowIndex,
        column: 'account_number',
        error: 'Numéro de compte invalide (doit être numérique)',
        value: mappedRow.account_number,
      });
    }
  }
  return errors;
}
/**
 * Validate chart of account row
 */
function validateChartOfAccountRow(
  row: any,
  mapping: ImportMapping,
  rowIndex: number
): ImportValidationError[] {
  const errors: ImportValidationError[] = [];
  const mappedRow: Partial<ChartOfAccountImportRow> = {};
  for (const [sourceCol, targetField] of Object.entries(mapping)) {
    mappedRow[targetField as keyof ChartOfAccountImportRow] = row[sourceCol];
  }
  if (!mappedRow.account_number) {
    errors.push({
      row: rowIndex,
      column: 'account_number',
      error: 'Numéro de compte manquant',
    });
  }
  if (!mappedRow.account_name) {
    errors.push({
      row: rowIndex,
      column: 'account_name',
      error: 'Libellé manquant',
    });
  }
  return errors;
}
// ============================================================================
// IMPORT JOURNAL ENTRIES
// ============================================================================
/**
 * Import journal entries from parsed CSV data
 */
export async function importJournalEntries(
  companyId: string,
  periodId: string,
  data: any[],
  mapping: ImportMapping,
  options?: {
    validateOnly?: boolean;
    groupByEntry?: boolean;
  }
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    total_rows: data.length,
    imported: 0,
    failed: 0,
    errors: [],
    warnings: [],
  };
  // Validate all rows first
  const validatedRows: Array<{ row: any; mapped: JournalEntryImportRow; index: number }> = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowErrors = validateJournalEntryRow(row, mapping, i + 1);
    if (rowErrors.length > 0) {
      result.errors.push(...rowErrors);
      result.failed++;
    } else {
      // Map row
      const mappedRow: any = {};
      for (const [sourceCol, targetField] of Object.entries(mapping)) {
        mappedRow[targetField] = row[sourceCol];
      }
      validatedRows.push({
        row,
        mapped: mappedRow as JournalEntryImportRow,
        index: i + 1,
      });
    }
  }
  // If validation only, stop here
  if (options?.validateOnly) {
    result.success = result.errors.length === 0;
    return result;
  }
  // If errors, stop before import
  if (result.errors.length > 0) {
    return result;
  }
  // Group by entry if needed (same date + reference = same entry)
  const entries = options?.groupByEntry
    ? groupLinesByEntry(validatedRows.map(v => v.mapped))
    : validatedRows.map(v => ({
        lines: [v.mapped],
        entry_date: v.mapped.entry_date,
        entry_number: v.mapped.entry_number,
        description: v.mapped.description,
      }));
  // Get journals mapping
  const { data: journals } = await supabase
    .from('journals')
    .select('id, code')
    .eq('company_id', companyId);
  const journalsMap = new Map(journals?.map(j => [j.code, j.id]) || []);
  // Get chart of accounts
  const { data: accounts } = await supabase
    .from('chart_of_accounts')
    .select('id, account_number')
    .eq('company_id', companyId);
  const accountsMap = new Map(accounts?.map(a => [a.account_number, a.id]) || []);
  // Import entries
  for (const entry of entries) {
    try {
      const journalId = journalsMap.get(entry.lines[0].journal_code);
      if (!journalId) {
        result.warnings.push(`Journal ${entry.lines[0].journal_code} introuvable`);
        result.failed++;
        continue;
      }
      // Create journal entry header
      const { data: journalEntry, error: entryError } = await supabase
        .from('journal_entries')
        .insert({
          company_id: companyId,
          journal_id: journalId,
          accounting_period_id: periodId,
          entry_date: entry.entry_date,
          entry_number: entry.entry_number,
          description: entry.description,
          status: 'draft',
        })
        .select()
        .single();
      if (entryError) throw entryError;
      // Create lines
      const lines = entry.lines.map((line, idx) => {
        const accountId = accountsMap.get(line.account_number);
        return {
          journal_entry_id: journalEntry.id,
          company_id: companyId,
          account_id: accountId,
          account_number: line.account_number,
          account_name: '', // Will be filled by trigger
          description: line.description,
          debit_amount: parseFloat(String(line.debit_amount || 0)),
          credit_amount: parseFloat(String(line.credit_amount || 0)),
          line_order: idx + 1,
          lettrage_code: line.lettrage_code || null,
        };
      });
      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(lines);
      if (linesError) throw linesError;
      result.imported++;
    } catch (error) {
      logger.error('AccountingImport', 'Error importing entry:', error);
      result.failed++;
      result.errors.push({
        row: 0,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    }
  }
  result.success = result.errors.length === 0;
  return result;
}
/**
 * Group lines by entry (same date + entry_number)
 */
function groupLinesByEntry(lines: JournalEntryImportRow[]): Array<{
  lines: JournalEntryImportRow[];
  entry_date: string;
  entry_number?: string;
  description: string;
}> {
  const groups = new Map<string, JournalEntryImportRow[]>();
  lines.forEach(line => {
    const key = `${line.entry_date}-${line.entry_number || 'auto'}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(line);
  });
  return Array.from(groups.values()).map(groupLines => ({
    lines: groupLines,
    entry_date: groupLines[0].entry_date,
    entry_number: groupLines[0].entry_number,
    description: groupLines[0].description,
  }));
}
// ============================================================================
// IMPORT CHART OF ACCOUNTS
// ============================================================================
/**
 * Import chart of accounts from CSV
 */
export async function importChartOfAccounts(
  companyId: string,
  data: any[],
  mapping: ImportMapping,
  options?: {
    validateOnly?: boolean;
    replaceExisting?: boolean;
  }
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    total_rows: data.length,
    imported: 0,
    failed: 0,
    errors: [],
    warnings: [],
  };
  // Validate
  const validatedRows: ChartOfAccountImportRow[] = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowErrors = validateChartOfAccountRow(row, mapping, i + 1);
    if (rowErrors.length > 0) {
      result.errors.push(...rowErrors);
      result.failed++;
    } else {
      const mappedRow: any = {};
      for (const [sourceCol, targetField] of Object.entries(mapping)) {
        mappedRow[targetField] = row[sourceCol];
      }
      validatedRows.push(mappedRow as ChartOfAccountImportRow);
    }
  }
  if (options?.validateOnly) {
    result.success = result.errors.length === 0;
    return result;
  }
  if (result.errors.length > 0) {
    return result;
  }
  // Import accounts
  for (const account of validatedRows) {
    try {
      const { error } = await supabase
        .from('chart_of_accounts')
        .upsert({
          company_id: companyId,
          account_number: account.account_number,
          account_name: account.account_name,
          account_type: account.account_type || 'asset',
          account_class: account.account_class || parseInt(account.account_number[0]),
          parent_account: account.parent_account || null,
          is_active: account.is_active !== false,
        });
      if (error) throw error;
      result.imported++;
    } catch (error) {
      logger.error('AccountingImport', 'Error importing account:', error);
      result.failed++;
      result.errors.push({
        row: 0,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    }
  }
  result.success = result.errors.length === 0;
  return result;
}