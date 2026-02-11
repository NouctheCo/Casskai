/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

/**
 * Hook personnalisé pour le rapprochement bancaire
 * Encapsule les appels RPC Supabase pour BankReconciliation
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useToast } from '@/components/ui/use-toast';

/**
 * Transaction bancaire non rapprochée
 */
export interface UnreconciledBankTransaction {
  id: string;
  bank_account_id: string;
  transaction_date: string;
  value_date: string;
  description: string;
  amount: number;
  transaction_type: string;
  reference: string;
  created_at: string;
}

/**
 * Écriture comptable non rapprochée
 */
export interface UnreconciledAccountingEntry {
  id: string;
  entry_id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  account_id: string;
  account_number: string;
  account_name: string;
  debit: number;
  credit: number;
  net_amount: number;
}

/**
 * Suggestion de correspondance automatique
 */
export interface BankMatchingSuggestion {
  bank_transaction_id: string;
  bank_date: string;
  bank_description: string;
  bank_amount: number;
  entry_line_id: string;
  entry_id: string;
  entry_number: string;
  entry_date: string;
  entry_description: string;
  entry_amount: number;
  confidence_score: number;
  amount_difference: number;
  days_difference: number;
}

/**
 * Résumé du rapprochement
 */
export interface ReconciliationSummary {
  total_transactions: number;
  reconciled_transactions: number;
  unreconciled_transactions: number;
  reconciliation_rate: number;
  bank_balance: number;
  accounting_balance: number;
  difference: number;
}

/**
 * Hook useBankReconciliation
 */
export function useBankReconciliation(companyId: string, bankAccountId?: string) {
  const { toast } = useToast();

  const [unreconciledTransactions, setUnreconciledTransactions] = useState<UnreconciledBankTransaction[]>([]);
  const [unreconciledEntries, setUnreconciledEntries] = useState<UnreconciledAccountingEntry[]>([]);
  const [matchingSuggestions, setMatchingSuggestions] = useState<BankMatchingSuggestion[]>([]);
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Récupérer les transactions bancaires non rapprochées
   */
  const fetchUnreconciledTransactions = useCallback(async () => {
    if (!bankAccountId) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('get_unreconciled_bank_transactions', {
        p_company_id: companyId,
        p_bank_account_id: bankAccountId,
        p_limit: 100
      });

      if (rpcError) throw rpcError;

      setUnreconciledTransactions(data || []);
      logger.info('BankReconciliation', `${data?.length || 0} transactions non rapprochées`);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la récupération des transactions';
      setError(message);
      logger.error('BankReconciliation', 'fetchUnreconciledTransactions error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, bankAccountId]);

  /**
   * Récupérer les écritures comptables non rapprochées
   */
  const fetchUnreconciledEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('get_unreconciled_accounting_entries', {
        p_company_id: companyId,
        p_account_id: null, // Tous les comptes 512
        p_limit: 100
      });

      if (rpcError) throw rpcError;

      setUnreconciledEntries(data || []);
      logger.info('BankReconciliation', `${data?.length || 0} écritures non rapprochées`);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la récupération des écritures';
      setError(message);
      logger.error('BankReconciliation', 'fetchUnreconciledEntries error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  /**
   * Obtenir les suggestions de correspondance automatique
   */
  const fetchMatchingSuggestions = useCallback(async () => {
    if (!bankAccountId) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('get_bank_matching_suggestions', {
        p_company_id: companyId,
        p_bank_account_id: bankAccountId,
        p_tolerance_days: 3,
        p_tolerance_amount: 0.01
      });

      if (rpcError) throw rpcError;

      setMatchingSuggestions(data || []);
      logger.info('BankReconciliation', `${data?.length || 0} suggestions de correspondance`);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la recherche de correspondances';
      setError(message);
      logger.error('BankReconciliation', 'fetchMatchingSuggestions error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, bankAccountId]);

  /**
   * Créer un rapprochement manuel
   */
  const createReconciliation = useCallback(async (
    bankTransactionId: string,
    journalEntryLineId: string,
    notes?: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('create_bank_reconciliation', {
        p_company_id: companyId,
        p_bank_transaction_id: bankTransactionId,
        p_journal_entry_line_id: journalEntryLineId,
        p_reconciliation_type: 'manual',
        p_confidence_score: null,
        p_notes: notes || null
      });

      if (rpcError) throw rpcError;

      toast({
        title: '✅ Rapprochement créé',
        description: 'La transaction a été rapprochée avec succès'
      });

      // Rafraîchir les données
      await Promise.all([
        fetchUnreconciledTransactions(),
        fetchUnreconciledEntries(),
        fetchSummary()
      ]);

      return data;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création du rapprochement';
      setError(message);
      toast({
        title: '❌ Erreur',
        description: message,
        variant: 'destructive'
      });
      logger.error('BankReconciliation', 'createReconciliation error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [companyId, toast, fetchUnreconciledTransactions, fetchUnreconciledEntries]);

  /**
   * Supprimer un rapprochement
   */
  const deleteReconciliation = useCallback(async (reconciliationId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('delete_bank_reconciliation', {
        p_reconciliation_id: reconciliationId
      });

      if (rpcError) throw rpcError;

      toast({
        title: '✅ Rapprochement annulé',
        description: 'Le rapprochement a été supprimé'
      });

      // Rafraîchir les données
      await Promise.all([
        fetchUnreconciledTransactions(),
        fetchUnreconciledEntries(),
        fetchSummary()
      ]);

      return data;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression du rapprochement';
      setError(message);
      toast({
        title: '❌ Erreur',
        description: message,
        variant: 'destructive'
      });
      logger.error('BankReconciliation', 'deleteReconciliation error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast, fetchUnreconciledTransactions, fetchUnreconciledEntries]);

  /**
   * Exécuter le rapprochement automatique
   */
  const executeAutoReconciliation = useCallback(async (minConfidence = 80.0) => {
    if (!bankAccountId) return { count: 0, results: [] };

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('execute_automatic_reconciliation', {
        p_company_id: companyId,
        p_bank_account_id: bankAccountId,
        p_min_confidence: minConfidence
      });

      if (rpcError) throw rpcError;

      const count = data?.length || 0;

      toast({
        title: `✅ ${count} rapprochements automatiques créés`,
        description: `Score de confiance minimum: ${minConfidence}%`
      });

      // Rafraîchir les données
      await Promise.all([
        fetchUnreconciledTransactions(),
        fetchUnreconciledEntries(),
        fetchMatchingSuggestions(),
        fetchSummary()
      ]);

      return { count, results: data || [] };

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du rapprochement automatique';
      setError(message);
      toast({
        title: '❌ Erreur',
        description: message,
        variant: 'destructive'
      });
      logger.error('BankReconciliation', 'executeAutoReconciliation error:', err);
      return { count: 0, results: [] };
    } finally {
      setIsLoading(false);
    }
  }, [companyId, bankAccountId, toast, fetchUnreconciledTransactions, fetchUnreconciledEntries, fetchMatchingSuggestions]);

  /**
   * Obtenir le résumé du rapprochement
   */
  const fetchSummary = useCallback(async () => {
    try {
      const { data, error: rpcError } = await supabase.rpc('get_reconciliation_summary', {
        p_company_id: companyId,
        p_bank_account_id: bankAccountId || null
      });

      if (rpcError) throw rpcError;

      if (data && data.length > 0) {
        setSummary(data[0]);
      }

    } catch (err) {
      logger.error('BankReconciliation', 'fetchSummary error:', err);
    }
  }, [companyId, bankAccountId]);

  /**
   * Rafraîchir toutes les données
   */
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchUnreconciledTransactions(),
      fetchUnreconciledEntries(),
      fetchMatchingSuggestions(),
      fetchSummary()
    ]);
  }, [fetchUnreconciledTransactions, fetchUnreconciledEntries, fetchMatchingSuggestions, fetchSummary]);

  /**
   * Charger les données initiales
   */
  useEffect(() => {
    if (companyId && bankAccountId) {
      refreshAll();
    }
  }, [companyId, bankAccountId, refreshAll]);

  return {
    // Données
    unreconciledTransactions,
    unreconciledEntries,
    matchingSuggestions,
    summary,

    // État
    isLoading,
    error,

    // Actions
    createReconciliation,
    deleteReconciliation,
    executeAutoReconciliation,
    refreshAll,

    // Récupération manuelle
    fetchUnreconciledTransactions,
    fetchUnreconciledEntries,
    fetchMatchingSuggestions,
    fetchSummary
  };
}

export default useBankReconciliation;
