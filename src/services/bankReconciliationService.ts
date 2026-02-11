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

/**
 * CassKai - Bank Reconciliation Service
 *
 * Phase 1 (P0) - CRITICAL Feature
 *
 * Fonctionnalités:
 * - Rapprochement automatique transactions bancaires ↔ écritures comptables
 * - Algorithme smart matching: montant exact, date ±3j, libellé fuzzy
 * - Scoring de confiance (0-100%)
 * - Types: automatic, manual, partial
 * - Utilise la table bank_reconciliations (Supabase)
 *
 * @module bankReconciliationService
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

/** Bank transaction type for reconciliation matching */
export interface BankTransaction {
  id: string;
  bank_account_id: string;
  company_id: string;
  transaction_date: string;
  value_date?: string;
  amount: number;
  currency?: string;
  description: string;
  reference?: string;
  category?: string;
  is_reconciled?: boolean;
  import_source?: string;
  created_at?: string;
  updated_at?: string;
}
// ============================================================================
// TYPES
// ============================================================================

export type ReconciliationType = 'automatic' | 'manual' | 'partial';
export type ReconciliationStatus = 'pending' | 'matched' | 'validated' | 'rejected';

export interface BankReconciliation {
  id: string;
  company_id: string;
  bank_account_id: string;
  bank_transaction_id: string;
  journal_entry_id?: string;
  reconciliation_type: ReconciliationType;
  confidence_score: number;
  match_date: string;
  validated_by?: string;
  validated_at?: string;
  notes?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MatchSuggestion {
  journalEntryId: string;
  journalEntryNumber: string;
  description: string;
  amount: number;
  date: string;
  accountCode: string;
  accountName: string;
  confidenceScore: number;
  matchReasons: string[];
}

export interface PendingBankTransaction extends BankTransaction {
  suggestions: MatchSuggestion[];
  isReconciled: boolean;
}

export interface ReconciliationFilters {
  companyId: string;
  bankAccountId?: string;
  status?: ReconciliationStatus;
  startDate?: string;
  endDate?: string;
  minConfidence?: number;
}

export interface ReconciliationStats {
  total: number;
  reconciled: number;
  pending: number;
  automatic: number;
  manual: number;
  averageConfidence: number;
}
// ============================================================================
// ALGORITHME DE MATCHING
// ============================================================================

/**
 * Calcule la distance de Levenshtein entre deux chaînes (fuzzy matching)
 * Utilisé pour comparer les libellés de transactions
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialiser la matrice
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Calculer les distances
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // Suppression
        matrix[i][j - 1] + 1,     // Insertion
        matrix[i - 1][j - 1] + cost // Substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calcule un score de similarité entre deux chaînes (0-100%)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 100;

  const maxLength = Math.max(s1.length, s2.length);
  if (maxLength === 0) return 100;

  const distance = levenshteinDistance(s1, s2);
  return Math.round((1 - distance / maxLength) * 100);
}

/**
 * Calcule la différence en jours entre deux dates
 */
function calculateDateDifference(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Algorithme principal de matching
 * Retourne un score de confiance (0-100%) et les raisons du match
 */
function calculateMatchScore(
  bankTransaction: BankTransaction,
  journalEntry: any
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // 1. Comparaison des montants (50 points max)
  const bankAmount = Math.abs(bankTransaction.amount);
  const entryAmount = Math.abs((journalEntry.debit || 0) - (journalEntry.credit || 0));
  const amountDiff = Math.abs(bankAmount - entryAmount);
  const amountDiffPercent = entryAmount > 0 ? (amountDiff / entryAmount) * 100 : 100;

  if (amountDiff === 0) {
    score += 50;
    reasons.push('Montant exact');
  } else if (amountDiffPercent < 1) {
    score += 45;
    reasons.push('Montant quasi-identique (<1% écart)');
  } else if (amountDiffPercent < 5) {
    score += 35;
    reasons.push('Montant similaire (<5% écart)');
  } else if (amountDiffPercent < 10) {
    score += 20;
    reasons.push('Montant proche (<10% écart)');
  }

  // 2. Comparaison des dates (30 points max)
  const dateDiff = calculateDateDifference(
    bankTransaction.transaction_date,
    journalEntry.entry_date
  );

  if (dateDiff === 0) {
    score += 30;
    reasons.push('Date identique');
  } else if (dateDiff <= 1) {
    score += 25;
    reasons.push('Date à ±1 jour');
  } else if (dateDiff <= 3) {
    score += 20;
    reasons.push('Date à ±3 jours');
  } else if (dateDiff <= 7) {
    score += 10;
    reasons.push('Date à ±1 semaine');
  }

  // 3. Comparaison des libellés (20 points max)
  const bankDescription = bankTransaction.description || '';
  const entryDescription = journalEntry.description || '';
  const similarityScore = calculateStringSimilarity(bankDescription, entryDescription);

  if (similarityScore >= 90) {
    score += 20;
    reasons.push('Libellé très similaire');
  } else if (similarityScore >= 70) {
    score += 15;
    reasons.push('Libellé similaire');
  } else if (similarityScore >= 50) {
    score += 10;
    reasons.push('Libellé partiellement similaire');
  }

  // 4. Bonus: référence commune (si présente)
  if (bankTransaction.reference && journalEntry.reference) {
    if (bankTransaction.reference === journalEntry.reference) {
      score += 20;
      reasons.push('Référence identique');
    }
  }

  // Limiter le score à 100
  score = Math.min(score, 100);

  return { score: Math.round(score), reasons };
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Récupère les transactions bancaires non rapprochées
 */
export async function getPendingBankTransactions(
  companyId: string,
  bankAccountId?: string
): Promise<{ data: PendingBankTransaction[] | null; error: Error | null }> {
  try {
    logger.debug('bankReconciliationService', 'Getting pending transactions...', {
      companyId,
      bankAccountId
    });

    // 1. Récupérer toutes les transactions bancaires
    let query = supabase
      .from('bank_transactions')
      .select('*')
      .eq('company_id', companyId)
      .order('transaction_date', { ascending: false });

    if (bankAccountId) {
      query = query.eq('bank_account_id', bankAccountId);
    }

    const { data: transactions, error: transError } = await query;

    if (transError) throw transError;
    if (!transactions) return { data: [], error: null };

    // 2. Récupérer les rapprochements existants
    const { data: reconciliations, error: reconError } = await supabase
      .from('bank_reconciliations')
      .select('bank_transaction_id')
      .eq('company_id', companyId);

    if (reconError) throw reconError;

    const reconciledIds = new Set(
      reconciliations?.map(r => r.bank_transaction_id) || []
    );

    // 3. Filtrer les transactions non rapprochées
    const pending = transactions
      .filter(t => !reconciledIds.has(t.id))
      .map(t => ({
        ...t,
        suggestions: [],
        isReconciled: false
      }));

    logger.debug('bankReconciliationService', 'Pending transactions found:', {
      total: transactions.length,
      pending: pending.length
    });

    return { data: pending, error: null };
  } catch (error) {
    logger.error('bankReconciliationService', 'Error getting pending transactions:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Trouve des suggestions de rapprochement pour une transaction bancaire
 */
export async function getSuggestedMatches(
  companyId: string,
  bankTransaction: BankTransaction,
  minConfidence: number = 50
): Promise<{ data: MatchSuggestion[] | null; error: Error | null }> {
  try {
    logger.debug('bankReconciliationService', 'Finding match suggestions...', {
      transactionId: bankTransaction.id,
      amount: bankTransaction.amount
    });

    // Récupérer les écritures comptables dans une plage de dates (±7 jours)
    const transDate = new Date(bankTransaction.transaction_date);
    const startDate = new Date(transDate);
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date(transDate);
    endDate.setDate(endDate.getDate() + 7);

    const { data: entries, error: entriesError } = await supabase
      .from('journal_entries')
      .select(`
        id,
        journal_entry_number,
        entry_date,
        description,
        reference,
        debit,
        credit,
        account_code,
        chart_of_accounts (
          account_name
        )
      `)
      .eq('company_id', companyId)
      .gte('entry_date', startDate.toISOString().split('T')[0])
      .lte('entry_date', endDate.toISOString().split('T')[0]);

    if (entriesError) throw entriesError;
    if (!entries || entries.length === 0) {
      return { data: [], error: null };
    }

    // Calculer les scores de matching
    const suggestions: MatchSuggestion[] = entries
      .map(entry => {
        const { score, reasons } = calculateMatchScore(bankTransaction, entry);

        return {
          journalEntryId: entry.id,
          journalEntryNumber: entry.journal_entry_number,
          description: entry.description || '',
          amount: (entry.debit || 0) - (entry.credit || 0),
          date: entry.entry_date,
          accountCode: entry.account_code,
          accountName: (entry.chart_of_accounts as any)?.account_name || '',
          confidenceScore: score,
          matchReasons: reasons
        };
      })
      .filter(s => s.confidenceScore >= minConfidence)
      .sort((a, b) => b.confidenceScore - a.confidenceScore)
      .slice(0, 5); // Top 5 suggestions

    logger.debug('bankReconciliationService', 'Match suggestions found:', {
      total: entries.length,
      suggestions: suggestions.length,
      topScore: suggestions[0]?.confidenceScore || 0
    });

    return { data: suggestions, error: null };
  } catch (error) {
    logger.error('bankReconciliationService', 'Error finding match suggestions:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Crée un rapprochement bancaire
 */
export async function createReconciliation(
  companyId: string,
  bankAccountId: string,
  bankTransactionId: string,
  journalEntryId: string,
  type: ReconciliationType,
  confidenceScore: number,
  notes?: string,
  userId?: string
): Promise<{ data: BankReconciliation | null; error: Error | null }> {
  try {
    logger.debug('bankReconciliationService', 'Creating reconciliation...', {
      type,
      confidenceScore
    });

    const reconciliation = {
      company_id: companyId,
      bank_account_id: bankAccountId,
      bank_transaction_id: bankTransactionId,
      journal_entry_id: journalEntryId,
      reconciliation_type: type,
      confidence_score: confidenceScore,
      match_date: new Date().toISOString(),
      validated_by: userId,
      validated_at: type === 'manual' ? new Date().toISOString() : undefined,
      notes,
      metadata: {}
    };

    const { data, error } = await supabase
      .from('bank_reconciliations')
      .insert(reconciliation)
      .select()
      .single();

    if (error) throw error;

    logger.debug('bankReconciliationService', 'Reconciliation created:', { id: data.id });

    return { data, error: null };
  } catch (error) {
    logger.error('bankReconciliationService', 'Error creating reconciliation:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Valide un rapprochement automatique
 */
export async function validateReconciliation(
  reconciliationId: string,
  userId: string
): Promise<{ data: BankReconciliation | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('bank_reconciliations')
      .update({
        validated_by: userId,
        validated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', reconciliationId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    logger.error('bankReconciliationService', 'Error validating reconciliation:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Supprime un rapprochement
 */
export async function deleteReconciliation(
  reconciliationId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('bank_reconciliations')
      .delete()
      .eq('id', reconciliationId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    logger.error('bankReconciliationService', 'Error deleting reconciliation:', error);
    return { error: error as Error };
  }
}

/**
 * Récupère les rapprochements avec filtres
 */
export async function getReconciliations(
  filters: ReconciliationFilters
): Promise<{ data: BankReconciliation[] | null; error: Error | null }> {
  try {
    let query = supabase
      .from('bank_reconciliations')
      .select('*')
      .eq('company_id', filters.companyId)
      .order('match_date', { ascending: false });

    if (filters.bankAccountId) {
      query = query.eq('bank_account_id', filters.bankAccountId);
    }

    if (filters.minConfidence) {
      query = query.gte('confidence_score', filters.minConfidence);
    }

    if (filters.startDate) {
      query = query.gte('match_date', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('match_date', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    logger.error('bankReconciliationService', 'Error getting reconciliations:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Récupère les statistiques de rapprochement
 */
export async function getReconciliationStats(
  companyId: string,
  bankAccountId?: string
): Promise<{ data: ReconciliationStats | null; error: Error | null }> {
  try {
    // Récupérer toutes les transactions
    let transQuery = supabase
      .from('bank_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId);

    if (bankAccountId) {
      transQuery = transQuery.eq('bank_account_id', bankAccountId);
    }

    const { count: totalTransactions } = await transQuery;

    // Récupérer les rapprochements
    let reconQuery = supabase
      .from('bank_reconciliations')
      .select('reconciliation_type, confidence_score')
      .eq('company_id', companyId);

    if (bankAccountId) {
      reconQuery = reconQuery.eq('bank_account_id', bankAccountId);
    }

    const { data: reconciliations } = await reconQuery;

    const total = totalTransactions || 0;
    const reconciled = reconciliations?.length || 0;
    const pending = total - reconciled;
    const automatic = reconciliations?.filter(r => r.reconciliation_type === 'automatic').length || 0;
    const manual = reconciliations?.filter(r => r.reconciliation_type === 'manual').length || 0;
    const averageConfidence = reconciliations && reconciliations.length > 0
      ? Math.round(reconciliations.reduce((sum, r) => sum + r.confidence_score, 0) / reconciliations.length)
      : 0;

    const stats: ReconciliationStats = {
      total,
      reconciled,
      pending,
      automatic,
      manual,
      averageConfidence
    };

    return { data: stats, error: null };
  } catch (error) {
    logger.error('bankReconciliationService', 'Error getting stats:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Rapprochement automatique en batch
 * Traite toutes les transactions non rapprochées et crée les rapprochements automatiques
 */
export async function autoReconcileBatch(
  companyId: string,
  bankAccountId?: string,
  minConfidence: number = 85
): Promise<{
  data: { processed: number; matched: number; created: BankReconciliation[] } | null;
  error: Error | null;
}> {
  try {
    logger.debug('bankReconciliationService', 'Starting auto-reconciliation batch...', {
      companyId,
      bankAccountId,
      minConfidence
    });

    // 1. Récupérer les transactions non rapprochées
    const { data: pending, error: pendingError } = await getPendingBankTransactions(
      companyId,
      bankAccountId
    );

    if (pendingError || !pending) {
      throw pendingError || new Error('No pending transactions');
    }

    const created: BankReconciliation[] = [];
    let matchedCount = 0;

    // 2. Pour chaque transaction, trouver le meilleur match
    for (const transaction of pending) {
      const { data: suggestions, error: suggestError } = await getSuggestedMatches(
        companyId,
        transaction,
        minConfidence
      );

      if (suggestError || !suggestions || suggestions.length === 0) {
        continue;
      }

      // Prendre le meilleur match (score le plus élevé)
      const bestMatch = suggestions[0];

      if (bestMatch.confidenceScore >= minConfidence) {
        const { data: reconciliation, error: createError } = await createReconciliation(
          companyId,
          transaction.bank_account_id,
          transaction.id,
          bestMatch.journalEntryId,
          'automatic',
          bestMatch.confidenceScore,
          `Auto-matched: ${bestMatch.matchReasons.join(', ')}`
        );

        if (!createError && reconciliation) {
          created.push(reconciliation);
          matchedCount++;
        }
      }
    }

    logger.debug('bankReconciliationService', 'Auto-reconciliation batch completed:', {
      processed: pending.length,
      matched: matchedCount
    });

    return {
      data: {
        processed: pending.length,
        matched: matchedCount,
        created
      },
      error: null
    };
  } catch (error) {
    logger.error('bankReconciliationService', 'Error in auto-reconciliation batch:', error);
    return { data: null, error: error as Error };
  }
}

// ============================================================================
// DEFAULT EXPORT (for backward compatibility)
// ============================================================================

/**
 * Default export for convenience
 * Prefer using named exports for better tree-shaking
 */
export default {
  getPendingBankTransactions,
  getSuggestedMatches,
  createReconciliation,
  validateReconciliation,
  deleteReconciliation,
  getReconciliations,
  getReconciliationStats,
  autoReconcileBatch
};