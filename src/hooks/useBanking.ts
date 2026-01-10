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
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { bankImportService, BankTransaction, BankAccount, ImportResult } from '@/services/bankImportService';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
interface UseBankingReturn {
  // State
  bankAccounts: BankAccount[];
  transactions: BankTransaction[];
  loading: boolean;
  error: string | null;
  // Actions
  loadBankAccounts: () => Promise<void>;
  loadTransactions: (accountId?: string) => Promise<void>;
  importFile: (file: File, accountId: string, format?: 'csv' | 'ofx' | 'qif') => Promise<ImportResult>;
  createBankAccount: (account: Omit<BankAccount, 'id' | 'created_at' | 'updated_at'>) => Promise<BankAccount | null>;
  deleteBankAccount: (accountId: string) => Promise<boolean>;
  reconcileTransaction: (transactionId: string) => Promise<boolean>;
}
export function useBanking(): UseBankingReturn {
  const { currentCompany } = useAuth();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Load bank accounts for current company
  const loadBankAccounts = useCallback(async () => {
    if (!currentCompany?.id) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setBankAccounts(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load bank accounts';
      setError(errorMessage);
      logger.error('UseBanking', 'Error loading bank accounts:', err);
    } finally {
      setLoading(false);
    }
  }, [currentCompany?.id]);
  // Load transactions for a specific account or all accounts
  const loadTransactions = useCallback(async (accountId?: string) => {
    if (!currentCompany?.id) return;
    try {
      setLoading(true);
      setError(null);
      let query = supabase
        .from('bank_transactions')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('transaction_date', { ascending: false })
        .limit(500);
      if (accountId) {
        query = query.eq('bank_account_id', accountId);
      }
      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setTransactions(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load transactions';
      setError(errorMessage);
      logger.error('UseBanking', 'Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [currentCompany?.id]);
  // Import file (CSV, OFX, QIF)
  const importFile = useCallback(async (
    file: File,
    accountId: string,
    format?: 'csv' | 'ofx' | 'qif'
  ): Promise<ImportResult> => {
    if (!currentCompany?.id) {
      return {
        success: false,
        message: 'No company selected',
        imported_count: 0,
        skipped_count: 0,
        error_count: 1,
        transactions: []
      };
    }
    try {
      setLoading(true);
      setError(null);
      // Auto-detect format from file extension if not provided
      const fileFormat = format || file.name.split('.').pop()?.toLowerCase() as 'csv' | 'ofx' | 'qif';
      let result: ImportResult;
      switch (fileFormat) {
        case 'csv':
          result = await bankImportService.importCSV(file, accountId, currentCompany.id);
          break;
        case 'ofx':
          result = await bankImportService.importOFX(file, accountId, currentCompany.id);
          break;
        case 'qif':
          result = await bankImportService.importQIF(file, accountId, currentCompany.id);
          break;
        default:
          result = {
            success: false,
            message: 'Unsupported file format',
            imported_count: 0,
            skipped_count: 0,
            error_count: 1,
            transactions: []
          };
      }
      // Reload transactions after successful import
      if (result.success) {
        await loadTransactions(accountId);
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Import failed';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
        imported_count: 0,
        skipped_count: 0,
        error_count: 1,
        transactions: []
      };
    } finally {
      setLoading(false);
    }
  }, [currentCompany?.id, loadTransactions]);
  // Create new bank account
  const createBankAccount = useCallback(async (
    account: Omit<BankAccount, 'id' | 'created_at' | 'updated_at'>
  ): Promise<BankAccount | null> => {
    if (!currentCompany?.id) return null;
    try {
      setLoading(true);
      setError(null);
      const { data, error: insertError } = await supabase
        .from('bank_accounts')
        .insert({
          ...account,
          company_id: currentCompany.id,
          is_active: true
        })
        .select()
        .single();
      if (insertError) throw insertError;
      // Reload accounts
      await loadBankAccounts();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create bank account';
      setError(errorMessage);
      logger.error('UseBanking', 'Error creating bank account:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentCompany?.id, loadBankAccounts]);
  // Delete bank account
  const deleteBankAccount = useCallback(async (accountId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      // Soft delete - just mark as inactive
      const { error: updateError } = await supabase
        .from('bank_accounts')
        .update({ is_active: false })
        .eq('id', accountId);
      if (updateError) throw updateError;
      // Reload accounts
      await loadBankAccounts();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete bank account';
      setError(errorMessage);
      logger.error('UseBanking', 'Error deleting bank account:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadBankAccounts]);
  // Reconcile transaction
  const reconcileTransaction = useCallback(async (transactionId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const { error: updateError } = await supabase
        .from('bank_transactions')
        .update({ is_reconciled: true })
        .eq('id', transactionId);
      if (updateError) throw updateError;
      // Reload transactions
      await loadTransactions();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reconcile transaction';
      setError(errorMessage);
      logger.error('UseBanking', 'Error reconciling transaction:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadTransactions]);
  // Load data on mount
  useEffect(() => {
    if (currentCompany?.id) {
      loadBankAccounts();
      loadTransactions();
    }
  }, [currentCompany?.id, loadBankAccounts, loadTransactions]);
  return {
    bankAccounts,
    transactions,
    loading,
    error,
    loadBankAccounts,
    loadTransactions,
    importFile,
    createBankAccount,
    deleteBankAccount,
    reconcileTransaction
  };
}