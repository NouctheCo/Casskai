import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

type Transaction = any;
type TransactionType = any;
type TransactionStatus = any;

export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  bankAccountId?: string;
  amountMin?: number;
  amountMax?: number;
}

export interface CreateTransactionData {
  type: TransactionType;
  description: string;
  amount: number;
  date: string;
  category?: string;
  reference?: string;
  third_party_name?: string;
  bank_account_id?: string;
  status?: TransactionStatus;
}

export function useTransactions(companyId: string) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch transactions with optional filters
  const fetchTransactions = useCallback(async (filters?: TransactionFilters) => {
    if (!user || !companyId) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          bank_accounts (
            name,
            account_number,
            bank_name
          )
        `)
        .eq('company_id', companyId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters) {
        if (filters.type) {
          query = query.eq('type', filters.type);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.dateFrom) {
          query = query.gte('date', filters.dateFrom);
        }
        if (filters.dateTo) {
          query = query.lte('date', filters.dateTo);
        }
        if (filters.category) {
          query = query.eq('category', filters.category);
        }
        if (filters.bankAccountId) {
          query = query.eq('bank_account_id', filters.bankAccountId);
        }
        if (filters.amountMin !== undefined) {
          query = query.gte('amount', filters.amountMin);
        }
        if (filters.amountMax !== undefined) {
          query = query.lte('amount', filters.amountMax);
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setTransactions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      logger.error('Error fetching transactions:', err)
    } finally {
      setLoading(false);
    }
  }, [user, companyId]);

  // Create a new transaction
  const createTransaction = useCallback(async (
    transactionData: CreateTransactionData
  ): Promise<Transaction | null> => {
    if (!user || !companyId) throw new Error('User not authenticated or company not selected');

    setLoading(true);
    setError(null);

    try {
      const { data: newTransaction, error: insertError } = await supabase
        .from('transactions')
        .insert({
          ...transactionData,
          company_id: companyId,
          created_by: user.id,
        })
        .select(`
          *,
          bank_accounts (
            name,
            account_number,
            bank_name
          )
        `)
        .single();

      if (insertError) throw insertError;

      setTransactions(prev => [newTransaction, ...prev]);
      return newTransaction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create transaction';
      setError(errorMessage);
      logger.error('Error creating transaction:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, companyId]);

  // Update a transaction
  const updateTransaction = useCallback(async (
    id: string,
    updates: Partial<Transaction>
  ): Promise<Transaction | null> => {
    if (!user || !companyId) throw new Error('User not authenticated or company not selected');

    setLoading(true);
    setError(null);

    try {
      const { data: updatedTransaction, error: updateError } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .eq('company_id', companyId)
        .select(`
          *,
          bank_accounts (
            name,
            account_number,
            bank_name
          )
        `)
        .single();

      if (updateError) throw updateError;

      setTransactions(prev => prev.map(transaction => 
        transaction.id === id ? updatedTransaction : transaction
      ));

      return updatedTransaction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update transaction';
      setError(errorMessage);
      logger.error('Error updating transaction:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, companyId]);

  // Delete a transaction
  const deleteTransaction = useCallback(async (id: string): Promise<void> => {
    if (!user || !companyId) throw new Error('User not authenticated or company not selected');

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);

      if (deleteError) throw deleteError;

      setTransactions(prev => prev.filter(transaction => transaction.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete transaction';
      setError(errorMessage);
      logger.error('Error deleting transaction:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, companyId]);

  // Get transaction statistics
  const getStatistics = useCallback(async (dateFrom?: string, dateTo?: string) => {
    if (!user || !companyId) return null;

    try {
      let query = supabase
        .from('transactions')
        .select('type, amount, status')
        .eq('company_id', companyId);

      if (dateFrom) query = query.gte('date', dateFrom);
      if (dateTo) query = query.lte('date', dateTo);

      const { data, error } = await query;
      
      if (error) throw error;

      const stats = {
        totalIncome: 0,
        totalExpenses: 0,
        pendingTransactions: 0,
        clearedTransactions: 0,
        totalTransactions: data?.length || 0,
      };

      data?.forEach(transaction => {
        if (transaction.type === 'income') {
          stats.totalIncome += transaction.amount;
        } else if (transaction.type === 'expense') {
          stats.totalExpenses += Math.abs(transaction.amount);
        }

        if (transaction.status === 'pending') {
          stats.pendingTransactions++;
        } else if (transaction.status === 'cleared' || transaction.status === 'reconciled') {
          stats.clearedTransactions++;
        }
      });

      return stats;
    } catch (err) {
      logger.error('Error calculating transaction statistics:', err);
      return null;
    }
  }, [user, companyId]);

  // Reconcile transactions (mark as reconciled)
  const reconcileTransactions = useCallback(async (transactionIds: string[]): Promise<void> => {
    if (!user || !companyId) throw new Error('User not authenticated or company not selected');

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'reconciled' })
        .in('id', transactionIds)
        .eq('company_id', companyId);

      if (updateError) throw updateError;

      // Update local state
      setTransactions(prev => prev.map(transaction =>
        transactionIds.includes(transaction.id)
          ? { ...transaction, status: 'reconciled' as TransactionStatus }
          : transaction
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reconcile transactions';
      setError(errorMessage);
      logger.error('Error reconciling transactions:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, companyId]);

  // Load transactions on mount and company change
  useEffect(() => {
    if (companyId) {
      fetchTransactions();
    }
  }, [companyId, fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    fetchTransactions,
    getStatistics,
    reconcileTransactions,
    refresh: () => fetchTransactions(),
  };
}