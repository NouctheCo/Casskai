/**
 * Lettrage (Reconciliation) Service
 *
 * Service complet pour le lettrage comptable des écritures.
 * Permet de réconcilier les comptes clients, fournisseurs et banques.
 *
 * Features:
 * - Lettrage automatique par montant exact
 * - Lettrage manuel
 * - Délettrage
 * - Génération codes de lettrage (AA, AB, AC...)
 * - Suggestions de lettrage intelligentes
 * - Historique des lettrages
 */
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
// ============================================================================
// TYPES
// ============================================================================
export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  company_id: string;
  account_id: string;
  account_number: string;
  account_name: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  net_amount: number;
  entry_date: string;
  entry_number: string;
  journal_code: string;
  journal_name: string;
  lettrage_code: string | null;
  lettrage_date: string | null;
  lettrage_by: string | null;
}
export interface LettrageMatch {
  debitLines: JournalEntryLine[];
  creditLines: JournalEntryLine[];
  debitTotal: number;
  creditTotal: number;
  balance: number;
  confidence: 'exact' | 'partial' | 'suggested';
}
export interface LettrageRule {
  accountPattern: string;
  tolerance: number;
  matchBy: 'exact' | 'description' | 'reference';
  allowPartial: boolean;
}
export interface LettrageResult {
  success: boolean;
  lettrage_code: string;
  lines_count: number;
  total_amount: number;
  message?: string;
  error?: string;
}
// ============================================================================
// CONSTANTS
// ============================================================================
const LETTRAGE_RULES: Record<string, LettrageRule> = {
  // Clients (411) - Strict exact match
  clients: {
    accountPattern: '411%',
    tolerance: 0.01,
    matchBy: 'exact',
    allowPartial: false,
  },
  // Fournisseurs (401) - Tolerance for rounding
  fournisseurs: {
    accountPattern: '401%',
    tolerance: 0.05,
    matchBy: 'exact',
    allowPartial: false,
  },
  // Banque (512) - Can match by reference
  banque: {
    accountPattern: '512%',
    tolerance: 0.02,
    matchBy: 'reference',
    allowPartial: true,
  },
};
// ============================================================================
// LETTRAGE CODE GENERATION
// ============================================================================
/**
 * Generate next available lettrage code (AA, AB, AC..., ZZ)
 */
export async function generateLettrageCode(companyId: string): Promise<string> {
  // Get last lettrage code used
  const { data: lastLettrage } = await supabase
    .from('journal_entry_lines')
    .select('lettrage_code')
    .eq('company_id', companyId)
    .not('lettrage_code', 'is', null)
    .order('lettrage_code', { ascending: false })
    .limit(1)
    .single();
  if (!lastLettrage || !lastLettrage.lettrage_code) {
    return 'AA';
  }
  // Increment code (AA -> AB -> AC... -> ZZ)
  const code = lastLettrage.lettrage_code;
  const chars = code.split('');
  // Increment second character
  if (chars[1] < 'Z') {
    chars[1] = String.fromCharCode(chars[1].charCodeAt(0) + 1);
  } else {
    // Roll over to next first character
    chars[1] = 'A';
    if (chars[0] < 'Z') {
      chars[0] = String.fromCharCode(chars[0].charCodeAt(0) + 1);
    } else {
      // Reset to AA if we reach ZZ (rare case)
      return 'AA';
    }
  }
  return chars.join('');
}
// ============================================================================
// GET UNLETTRAGED LINES
// ============================================================================
/**
 * Get all unlettraged lines for an account pattern
 */
export async function getUnlettragedLines(
  companyId: string,
  accountPattern: string
): Promise<JournalEntryLine[]> {
  const { data, error } = await supabase
    .from('v_unlettraged_lines')
    .select('*')
    .eq('company_id', companyId)
    .ilike('account_number', accountPattern)
    .order('entry_date', { ascending: true });
  if (error) {
    logger.error('Lettrage', 'Error fetching unlettraged lines:', error);
    throw error;
  }
  return data || [];
}
// ============================================================================
// AUTO LETTRAGE SUGGESTIONS
// ============================================================================
/**
 * Find automatic lettrage suggestions based on rules
 */
export async function findLettrageMatches(
  companyId: string,
  accountPattern: string
): Promise<LettrageMatch[]> {
  const lines = await getUnlettragedLines(companyId, accountPattern);
  const rule = Object.values(LETTRAGE_RULES).find(r =>
    accountPattern.match(new RegExp(r.accountPattern.replace('%', '.*')))
  );
  if (!rule) {
    logger.warn('Lettrage', `No lettrage rule found for account pattern: ${accountPattern}`);
    return [];
  }
  const matches: LettrageMatch[] = [];
  // Separate debit and credit lines
  const debitLines = lines.filter(l => l.net_amount > 0);
  const creditLines = lines.filter(l => l.net_amount < 0);
  // Try to match each debit with credits
  for (const debit of debitLines) {
    const debitAmount = Math.abs(debit.net_amount);
    // Try exact match first
    const exactCredit = creditLines.find(c =>
      Math.abs(Math.abs(c.net_amount) - debitAmount) <= rule.tolerance
    );
    if (exactCredit) {
      matches.push({
        debitLines: [debit],
        creditLines: [exactCredit],
        debitTotal: debitAmount,
        creditTotal: Math.abs(exactCredit.net_amount),
        balance: 0,
        confidence: 'exact',
      });
      continue;
    }
    // Try multiple credits summing to debit
    if (rule.allowPartial) {
      const creditCombination = findCreditCombination(
        creditLines,
        debitAmount,
        rule.tolerance
      );
      if (creditCombination.length > 0) {
        const creditTotal = creditCombination.reduce(
          (sum, c) => sum + Math.abs(c.net_amount),
          0
        );
        matches.push({
          debitLines: [debit],
          creditLines: creditCombination,
          debitTotal: debitAmount,
          creditTotal,
          balance: Math.abs(debitAmount - creditTotal),
          confidence: 'suggested',
        });
      }
    }
  }
  return matches;
}
/**
 * Find combination of credits that sum to target amount
 * (Simple greedy algorithm, can be improved with dynamic programming)
 */
function findCreditCombination(
  credits: JournalEntryLine[],
  targetAmount: number,
  tolerance: number
): JournalEntryLine[] {
  const sorted = [...credits].sort((a, b) =>
    Math.abs(b.net_amount) - Math.abs(a.net_amount)
  );
  const result: JournalEntryLine[] = [];
  let currentSum = 0;
  for (const credit of sorted) {
    const creditAmount = Math.abs(credit.net_amount);
    if (currentSum + creditAmount <= targetAmount + tolerance) {
      result.push(credit);
      currentSum += creditAmount;
      if (Math.abs(currentSum - targetAmount) <= tolerance) {
        break;
      }
    }
  }
  // Only return if we found a good match
  if (Math.abs(currentSum - targetAmount) <= tolerance) {
    return result;
  }
  return [];
}
// ============================================================================
// APPLY LETTRAGE
// ============================================================================
/**
 * Apply lettrage to a set of lines
 */
export async function applyLettrage(
  companyId: string,
  lineIds: string[],
  customCode?: string
): Promise<LettrageResult> {
  try {
    // Validate lines exist and are unlettraged
    const { data: lines, error: fetchError } = await supabase
      .from('journal_entry_lines')
      .select('id, debit_amount, credit_amount, lettrage_code')
      .in('id', lineIds)
      .eq('company_id', companyId);
    if (fetchError) throw fetchError;
    if (!lines || lines.length === 0) {
      return {
        success: false,
        lettrage_code: '',
        lines_count: 0,
        total_amount: 0,
        error: 'Aucune ligne trouvée',
      };
    }
    // Check if any line is already lettraged
    const alreadyLettraged = lines.filter(l => l.lettrage_code);
    if (alreadyLettraged.length > 0) {
      return {
        success: false,
        lettrage_code: '',
        lines_count: 0,
        total_amount: 0,
        error: `${alreadyLettraged.length} ligne(s) déjà lettrée(s)`,
      };
    }
    // Verify balance
    const totalDebit = lines.reduce((sum, l) => sum + (l.debit_amount || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (l.credit_amount || 0), 0);
    const balance = Math.abs(totalDebit - totalCredit);
    if (balance > 0.05) {
      return {
        success: false,
        lettrage_code: '',
        lines_count: 0,
        total_amount: 0,
        error: `Lignes déséquilibrées: débit=${totalDebit.toFixed(2)}€ crédit=${totalCredit.toFixed(2)}€ diff=${balance.toFixed(2)}€`,
      };
    }
    // Generate or use custom lettrage code
    const lettrageCode = customCode || await generateLettrageCode(companyId);
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    // Apply lettrage
    const { error: updateError } = await supabase
      .from('journal_entry_lines')
      .update({
        lettrage_code: lettrageCode,
        lettrage_date: new Date().toISOString().split('T')[0],
        lettrage_by: user?.id || null,
      })
      .in('id', lineIds);
    if (updateError) throw updateError;
    return {
      success: true,
      lettrage_code: lettrageCode,
      lines_count: lines.length,
      total_amount: Math.max(totalDebit, totalCredit),
      message: `Lettrage ${lettrageCode} appliqué à ${lines.length} ligne(s)`,
    };
  } catch (error) {
    logger.error('Lettrage', 'Error applying lettrage:', error);
    return {
      success: false,
      lettrage_code: '',
      lines_count: 0,
      total_amount: 0,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}
// ============================================================================
// AUTO LETTRAGE
// ============================================================================
/**
 * Automatically apply lettrage for all exact matches
 */
export async function autoLettrage(
  companyId: string,
  accountPattern: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  const matches = await findLettrageMatches(companyId, accountPattern);
  const exactMatches = matches.filter(m => m.confidence === 'exact');
  let success = 0;
  let failed = 0;
  const errors: string[] = [];
  for (const match of exactMatches) {
    const lineIds = [
      ...match.debitLines.map(l => l.id),
      ...match.creditLines.map(l => l.id),
    ];
    const result = await applyLettrage(companyId, lineIds);
    if (result.success) {
      success++;
    } else {
      failed++;
      if (result.error) {
        errors.push(result.error);
      }
    }
  }
  return { success, failed, errors };
}
// ============================================================================
// DELETTRAGE (UNLETTER)
// ============================================================================
/**
 * Remove lettrage from lines
 */
export async function deleteLettrage(
  companyId: string,
  lettrageCode: string
): Promise<LettrageResult> {
  try {
    // Get lines with this lettrage code
    const { data: lines, error: fetchError } = await supabase
      .from('journal_entry_lines')
      .select('id')
      .eq('company_id', companyId)
      .eq('lettrage_code', lettrageCode);
    if (fetchError) throw fetchError;
    if (!lines || lines.length === 0) {
      return {
        success: false,
        lettrage_code: lettrageCode,
        lines_count: 0,
        total_amount: 0,
        error: `Aucune ligne avec le code ${lettrageCode}`,
      };
    }
    // Remove lettrage
    const { error: updateError } = await supabase
      .from('journal_entry_lines')
      .update({
        lettrage_code: null,
        lettrage_date: null,
        lettrage_by: null,
      })
      .eq('lettrage_code', lettrageCode)
      .eq('company_id', companyId);
    if (updateError) throw updateError;
    return {
      success: true,
      lettrage_code: lettrageCode,
      lines_count: lines.length,
      total_amount: 0,
      message: `Délettrage de ${lines.length} ligne(s) (code ${lettrageCode})`,
    };
  } catch (error) {
    logger.error('Lettrage', 'Error removing lettrage:', error);
    return {
      success: false,
      lettrage_code: lettrageCode,
      lines_count: 0,
      total_amount: 0,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}
// ============================================================================
// LETTRAGE STATS
// ============================================================================
/**
 * Get lettrage statistics for an account
 */
export async function getLettrageStats(
  companyId: string,
  accountPattern: string
): Promise<{
  total: number;
  lettraged: number;
  unlettraged: number;
  percentLettraged: number;
  oldestUnlettraged: string | null;
}> {
  const { data: allLines } = await supabase
    .from('journal_entry_lines')
    .select('id, lettrage_code, created_at')
    .eq('company_id', companyId)
    .ilike('account_number', accountPattern);
  if (!allLines) {
    return {
      total: 0,
      lettraged: 0,
      unlettraged: 0,
      percentLettraged: 0,
      oldestUnlettraged: null,
    };
  }
  const lettraged = allLines.filter(l => l.lettrage_code).length;
  const unlettraged = allLines.length - lettraged;
  const unlettradedLines = allLines
    .filter(l => !l.lettrage_code)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  return {
    total: allLines.length,
    lettraged,
    unlettraged,
    percentLettraged: allLines.length > 0 ? (lettraged / allLines.length) * 100 : 0,
    oldestUnlettraged: unlettradedLines.length > 0 ? unlettradedLines[0].created_at : null,
  };
}