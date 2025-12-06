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
 * Adapter pour migrer BanksPage de localStorage vers Supabase
 * Garde la même interface mais utilise Supabase en arrière-plan
 */

import { supabase } from '@/lib/supabase';
import { bankImportService, ImportResult } from './bankImportService';

export interface ImportedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  importedAt: string;
  transactionCount: number;
  status: 'completed' | 'error';
  parseMethod: string;
}

export interface BankStorageTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  balance?: number;
  category?: string;
  type: 'debit' | 'credit';
  status: 'pending' | 'reconciled';
  reference?: string;
  accountName?: string;
}

class BankStorageAdapter {
  /**
   * Charge les comptes bancaires depuis Supabase
   */
  async loadBankAccounts(companyId: string) {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading bank accounts:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Crée un compte bancaire par défaut si aucun n'existe
   */
  async ensureDefaultAccount(companyId: string, _userId: string) {
    const accounts = await this.loadBankAccounts(companyId);

    if (accounts.length === 0) {
      // Créer un compte par défaut
      const { data, error } = await supabase
        .from('bank_accounts')
        .insert({
          company_id: companyId,
          bank_name: 'Compte principal',
          account_name: 'Compte courant',
          account_number: 'XXXXX',
          currency: 'EUR',
          current_balance: 0,
          initial_balance: 0,
          account_type: 'checking',
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating default account:', error);
        return null;
      }

      return data;
    }

    return accounts[0];
  }

  /**
   * Import un fichier en utilisant bankImportService
   */
  async importFile(
    file: File,
    accountId: string,
    companyId: string
  ): Promise<ImportResult> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    let result: ImportResult;

    switch (extension) {
      case 'csv':
        result = await bankImportService.importCSV(file, accountId, companyId);
        break;
      case 'ofx':
        result = await bankImportService.importOFX(file, accountId, companyId);
        break;
      case 'qif':
        result = await bankImportService.importQIF(file, accountId, companyId);
        break;
      default:
        result = {
          success: false,
          message: 'Format de fichier non supporté',
          imported_count: 0,
          skipped_count: 0,
          error_count: 1,
          transactions: []
        };
    }

    return result;
  }

  /**
   * Charge les transactions depuis Supabase
   */
  async loadTransactions(
    companyId: string,
    accountId?: string,
    limit: number = 500
  ): Promise<BankStorageTransaction[]> {
    let query = supabase
      .from('bank_transactions')
      .select('*')
      .eq('company_id', companyId)
      .order('transaction_date', { ascending: false })
      .limit(limit);

    if (accountId) {
      query = query.eq('bank_account_id', accountId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading transactions:', error);
      return [];
    }

    // Transform to BankStorageTransaction format
    return (data || []).map(t => ({
      id: t.id,
      date: t.transaction_date,
      description: t.description,
      amount: t.amount,
      balance: 0, // Calculate if needed
      category: t.category,
      type: t.amount >= 0 ? 'credit' : 'debit',
      status: t.reconciled ? 'reconciled' : 'pending',
      reference: t.reference,
      accountName: '' // Will be populated from join if needed
    }));
  }

  /**
   * Réconcilie une transaction
   */
  async reconcileTransaction(transactionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('bank_transactions')
      .update({ reconciled: true })
      .eq('id', transactionId);

    if (error) {
      console.error('Error reconciling transaction:', error);
      return false;
    }

    return true;
  }

  /**
   * Calcule les métriques de réconciliation
   */
  async getReconciliationMetrics(companyId: string) {
    const transactions = await this.loadTransactions(companyId);

    const reconciledCount = transactions.filter(t => t.status === 'reconciled').length;
    const pendingCount = transactions.filter(t => t.status === 'pending').length;
    const autoMatchRate = transactions.length > 0 ? reconciledCount / transactions.length : 0;

    return {
      totalTransactions: transactions.length,
      reconciledTransactions: reconciledCount,
      pendingReconciliation: pendingCount,
      discrepancies: Math.max(0, transactions.length - reconciledCount - pendingCount),
      autoMatchRate
    };
  }

  /**
   * Migre les données localStorage vers Supabase (à faire une seule fois)
   */
  async migrateLocalStorageData(userId: string, companyId: string, accountId: string) {
    try {
      // Charger les données localStorage
      const savedTransactions = localStorage.getItem(`casskai_imported_transactions_${userId}`);
      if (!savedTransactions) return { success: true, migrated: 0 };

      const transactions = JSON.parse(savedTransactions);

      // Convertir au format Supabase
      const supabaseTransactions = transactions.map((t: any) => ({
        bank_account_id: accountId,
        company_id: companyId,
        transaction_date: t.date,
        amount: t.amount,
        currency: 'EUR',
        description: t.description,
        reference: t.reference,
        category: t.category,
        reconciled: t.status === 'reconciled',
        imported_from: 'csv' as const,
        raw_data: t
      }));

      // Insérer dans Supabase
      const { data, error } = await supabase
        .from('bank_transactions')
        .insert(supabaseTransactions)
        .select();

      if (error) {
        console.error('Error migrating data:', error);
        return { success: false, migrated: 0, error };
      }

      // Nettoyer localStorage après migration réussie
      localStorage.removeItem(`casskai_imported_transactions_${userId}`);
      localStorage.removeItem(`casskai_imported_files_${userId}`);

      return { success: true, migrated: data.length };
    } catch (error) {
      console.error('Migration error:', error);
      return { success: false, migrated: 0, error };
    }
  }
}

export const bankStorageAdapter = new BankStorageAdapter();
export default bankStorageAdapter;
