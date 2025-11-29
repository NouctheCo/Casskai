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

// Service de matching automatique des transactions bancaires
import { supabase } from '@/lib/supabase';

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  account_id: string;
  is_reconciled?: boolean;
}

export interface JournalEntry {
  id: string;
  entry_date: string;
  description: string;
  amount: number;
  debit: number;
  credit: number;
  account_number: string;
  is_reconciled?: boolean;
}

export interface MatchResult {
  bankTransaction: BankTransaction;
  accountingEntry: JournalEntry;
  confidence: number;
  matchType: 'exact' | 'date_amount' | 'fuzzy' | 'manual';
  score: {
    amount: number;
    date: number;
    description: number;
  };
}

export class BankMatchingService {
  private static instance: BankMatchingService;

  static getInstance(): BankMatchingService {
    if (!this.instance) {
      this.instance = new BankMatchingService();
    }
    return this.instance;
  }

  /**
   * ✅ Effectuer un matching automatique entre transactions bancaires et écritures comptables
   */
  async performAutomaticMatching(
    companyId: string,
    bankAccountId: string
  ): Promise<MatchResult[]> {
    try {
      // Récupérer les transactions bancaires non rapprochées
      const { data: bankTransactions, error: bankError } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('account_id', bankAccountId)
        .eq('is_reconciled', false)
        .order('entry_date', { ascending: false })
        .limit(100);

      if (bankError) throw bankError;

      // Récupérer les écritures comptables non rapprochées (30 derniers jours)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: journalEntries, error: journalError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_reconciled', false)
        .gte('entry_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('entry_date', { ascending: false })
        .limit(200);

      if (journalError) throw journalError;

      if (!bankTransactions || !journalEntries) {
        return [];
      }

      // Effectuer le matching
      const matches: MatchResult[] = [];

      for (const bankTx of bankTransactions) {
        const bankAmount = Math.abs(bankTx.amount);
        const bankDate = new Date(bankTx.date);

        for (const entry of journalEntries) {
          // Calculer le montant de l'écriture (débit - crédit)
          const entryAmount = Math.abs(entry.debit - entry.credit);

          // 1. Matching par montant exact (± 0.01€)
          const amountDiff = Math.abs(bankAmount - entryAmount);
          if (amountDiff > 0.01) continue;

          const amountScore = 1.0 - (amountDiff / bankAmount);

          // 2. Matching par date (± 3 jours)
          const entryDate = new Date(entry.entry_date);
          const dateDiffMs = Math.abs(bankDate.getTime() - entryDate.getTime());
          const dateDiffDays = dateDiffMs / (1000 * 60 * 60 * 24);

          if (dateDiffDays > 3) continue;

          const dateScore = 1.0 - (dateDiffDays / 3);

          // 3. Matching par description (fuzzy)
          const descriptionScore = this.calculateSimilarity(
            bankTx.description || '',
            entry.description || ''
          );

          // Score de confiance global
          const confidenceScore = 
            (amountScore * 0.5) +  // 50% poids sur montant
            (dateScore * 0.3) +     // 30% poids sur date
            (descriptionScore * 0.2); // 20% poids sur description

          // Seuil minimum de confiance: 0.7 (70%)
          if (confidenceScore >= 0.7) {
            let matchType: 'exact' | 'date_amount' | 'fuzzy' = 'fuzzy';
            
            if (amountScore === 1.0 && dateScore === 1.0) {
              matchType = 'exact';
            } else if (amountScore === 1.0 && dateScore >= 0.9) {
              matchType = 'date_amount';
            }

            matches.push({
              bankTransaction: bankTx,
              accountingEntry: entry,
              confidence: Math.round(confidenceScore * 100) / 100,
              matchType,
              score: {
                amount: Math.round(amountScore * 100) / 100,
                date: Math.round(dateScore * 100) / 100,
                description: Math.round(descriptionScore * 100) / 100
              }
            });

            // Une écriture ne peut matcher qu'une seule transaction
            break;
          }
        }
      }

      // Trier par confiance décroissante
      matches.sort((a, b) => b.confidence - a.confidence);

      return matches;

    } catch (error) {
      console.error('Erreur performAutomaticMatching:', error);
      throw error;
    }
  }

  /**
   * Calcul de similarité entre deux chaînes (Levenshtein distance normalisée)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0.0;

    // Matrice de distance de Levenshtein
    const matrix: number[][] = [];

    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    const distance = matrix[s2.length][s1.length];
    const maxLength = Math.max(s1.length, s2.length);
    
    return 1.0 - (distance / maxLength);
  }

  /**
   * ✅ Valider un match manuel
   */
  async validateMatch(
    bankTransactionId: string,
    journalEntryId: string
  ): Promise<void> {
    // Marquer la transaction bancaire comme rapprochée
    await supabase
      .from('bank_transactions')
      .update({ is_reconciled: true, reconciled_at: new Date().toISOString() })
      .eq('id', bankTransactionId);

    // Marquer l'écriture comptable comme rapprochée
    await supabase
      .from('journal_entries')
      .update({ is_reconciled: true, reconciled_at: new Date().toISOString() })
      .eq('id', journalEntryId);

    // Créer une entrée de réconciliation
    await supabase
      .from('bank_reconciliations')
      .insert({
        bank_transaction_id: bankTransactionId,
        journal_entry_id: journalEntryId,
        matched_at: new Date().toISOString(),
        match_type: 'manual'
      });
  }

  /**
   * ✅ Annuler un rapprochement
   */
  async unmatch(bankTransactionId: string, journalEntryId: string): Promise<void> {
    // Démarquer la transaction
    await supabase
      .from('bank_transactions')
      .update({ is_reconciled: false, reconciled_at: null })
      .eq('id', bankTransactionId);

    // Démarquer l'écriture
    await supabase
      .from('journal_entries')
      .update({ is_reconciled: false, reconciled_at: null })
      .eq('id', journalEntryId);

    // Supprimer la réconciliation
    await supabase
      .from('bank_reconciliations')
      .delete()
      .eq('bank_transaction_id', bankTransactionId)
      .eq('journal_entry_id', journalEntryId);
  }
}

export const bankMatchingService = BankMatchingService.getInstance();
