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
// src/services/chartOfAccountsService.ts
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import { logger } from '@/lib/logger';
type Account = Database['public']['Tables']['chart_of_accounts']['Row'];
type AccountInsert = {
  company_id: string;
  account_number: string;
  account_name: string;
  account_type: Account['account_type'];
  account_class?: number | null;
  parent_account_id?: string | null;
  description?: string | null;
  is_active?: boolean;
  is_detail_account?: boolean;
};
export class ChartOfAccountsService {
  private static instance: ChartOfAccountsService;
  static getInstance(): ChartOfAccountsService {
    if (!ChartOfAccountsService.instance) {
      ChartOfAccountsService.instance = new ChartOfAccountsService();
    }
    return ChartOfAccountsService.instance;
  }
  // Récupérer tous les comptes d'une entreprise
  async getAccounts(companyId: string, filters?: {
    type?: Account['account_type'] | 'all';
    isActive?: boolean;
    search?: string;
  }): Promise<Account[]> {
    try {
      let query = supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('company_id', companyId)
        .order('account_number', { ascending: true });
      if (filters?.type && filters.type !== 'all') {
        query = query.eq('account_type', filters.type);
      }
      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      if (filters?.search) {
        const searchTerm = filters.search.trim();
        query = query.or(`account_number.ilike.%${searchTerm}%,account_name.ilike.%${searchTerm}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error: unknown) {
      logger.error('ChartOfAccounts', 'Erreur récupération comptes:', error);
      return [];
    }
  }
  // Créer un nouveau compte
  async createAccount(accountData: AccountInsert): Promise<{ 
    success: boolean; 
    data?: Account; 
    error?: string 
  }> {
    try {
      const { data: existing } = await supabase
        .from('chart_of_accounts')
        .select('id')
        .eq('company_id', accountData.company_id)
        .eq('account_number', accountData.account_number)
        .single();
      if (existing) {
        return { success: false, error: 'Ce numéro de compte existe déjà' };
      }
      const accountClass = accountData.account_class ?? this.inferAccountClass(accountData.account_number);
      const insertPayload = {
        company_id: accountData.company_id,
        account_number: accountData.account_number,
        account_name: accountData.account_name,
        account_type: accountData.account_type,
        account_class: accountClass,
        parent_account_id: accountData.parent_account_id ?? null,
        description: accountData.description ?? null,
        is_active: accountData.is_active ?? true,
        is_detail_account: accountData.is_detail_account ?? true,
      } satisfies Database['public']['Tables']['chart_of_accounts']['Insert'];
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .insert([insertPayload])
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error: unknown) {
      logger.error('ChartOfAccounts', 'Erreur création compte:', error);
      const message = error instanceof Error ? (error instanceof Error ? error.message : 'Une erreur est survenue') : 'Erreur inconnue lors de la création du compte';
      return { success: false, error: message };
    }
  }
  // Mettre à jour un compte
  async updateAccount(id: string, updates: Partial<AccountInsert>): Promise<{ 
    success: boolean; 
    data?: Account; 
    error?: string 
  }> {
    try {
      if (updates.account_number) {
        const { data: existing } = await supabase
          .from('chart_of_accounts')
          .select('id, company_id')
          .eq('id', id)
          .single();
        if (existing) {
          const { data: duplicate } = await supabase
            .from('chart_of_accounts')
            .select('id')
            .eq('company_id', existing.company_id)
            .eq('account_number', updates.account_number)
            .neq('id', id)
            .single();
          if (duplicate) {
            return { success: false, error: 'Ce numéro de compte existe déjà' };
          }
        }
        if (updates.account_class === undefined) {
          updates.account_class = this.inferAccountClass(updates.account_number);
        }
      }
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error: unknown) {
      logger.error('ChartOfAccounts', 'Erreur modification compte:', error);
      const message = error instanceof Error ? (error instanceof Error ? error.message : 'Une erreur est survenue') : 'Erreur inconnue lors de la mise à jour du compte';
      return { success: false, error: message };
    }
  }
  // Supprimer un compte
  async deleteAccount(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Vérifier qu'aucune écriture n'utilise ce compte
      const { data: lines } = await supabase
        .from('journal_entry_lines')
        .select('id')
        .eq('account_id', id)
        .limit(1);
      if (lines && lines.length > 0) {
        return { success: false, error: 'Impossible de supprimer un compte utilisé dans des écritures' };
      }
      const { error } = await supabase
        .from('chart_of_accounts')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (error: unknown) {
      logger.error('ChartOfAccounts', 'Erreur suppression compte:', error);
      const message = error instanceof Error ? (error instanceof Error ? error.message : 'Une erreur est survenue') : 'Erreur inconnue lors de la suppression du compte';
      return { success: false, error: message };
    }
  }
  // Obtenir les statistiques des comptes
  async getAccountsStats(companyId: string): Promise<{
    totalAccounts: number;
    activeAccounts: number;
    accountsByType: Record<string, number>;
    totalBalance: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('account_type, is_active, current_balance')
        .eq('company_id', companyId);
      if (error) throw error;
      const stats = {
        totalAccounts: data?.length || 0,
        activeAccounts: 0,
        accountsByType: {} as Record<string, number>,
        totalBalance: {} as Record<string, number>
      };
      data?.forEach(account => {
        if (account.is_active) {
          stats.activeAccounts++;
        }
        const accountType = account.account_type ?? 'unknown';
        stats.accountsByType[accountType] = (stats.accountsByType[accountType] || 0) + 1;
        const balanceValue = Number(account.current_balance) || 0;
        stats.totalBalance[accountType] = (stats.totalBalance[accountType] || 0) + balanceValue;
      });
      return stats;
    } catch (error: unknown) {
      logger.error('ChartOfAccounts', 'Erreur stats comptes:', error);
      return {
        totalAccounts: 0,
        activeAccounts: 0,
        accountsByType: {},
        totalBalance: {}
      };
    }
  }
  // Exporter le plan comptable en CSV
  async exportAccountsToCSV(companyId: string): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const accounts = await this.getAccounts(companyId, { isActive: true });
      const csvHeaders = [
        'Numéro de compte',
        'Nom du compte',
        'Type',
        'Classe',
        'Description',
        'Actif',
        'Compte de détail',
        'Solde courant'
      ];
      const csvRows = accounts.map(account => [
        account.account_number,
        account.account_name,
        account.account_type,
        (account.account_class ?? '').toString(),
        account.description || '',
        account.is_active ? 'Oui' : 'Non',
        account.is_detail_account ? 'Oui' : 'Non',
        (account.current_balance ?? 0).toString()
      ]);
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      return { success: true, data: csvContent };
    } catch (error: unknown) {
      logger.error('ChartOfAccounts', 'Erreur export CSV:', error);
      return { success: false, error: (error instanceof Error ? error.message : 'Une erreur est survenue') };
    }
  }
  // Importer des comptes depuis CSV
  async importAccountsFromCSV(companyId: string, csvData: string): Promise<{ 
    success: boolean; 
    imported: number; 
    errors: string[];
  }> {
    const errors: string[] = [];
    let imported = 0;
    try {
      const lines = csvData.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        return { success: false, imported: 0, errors: ['Le fichier CSV est vide ou invalide'] };
      }
      // Ignorer l'en-tête
      const dataLines = lines.slice(1);
      for (let i = 0; i < dataLines.length; i++) {
        try {
          const values = dataLines[i].split(',').map(v => v.replace(/^"|"$/g, ''));
          if (values.length < 3) {
            errors.push(`Ligne ${i + 2}: Données insuffisantes`);
            continue;
          }
          const accountData: AccountInsert = {
            company_id: companyId,
            account_number: values[0]?.trim(),
            account_name: values[1]?.trim(),
            account_type: values[2]?.trim() as Account['account_type'],
            account_class: values[3] ? parseInt(values[3], 10) : undefined,
            description: values[4]?.trim() || undefined,
            is_active: values[5]?.toLowerCase() !== 'non',
            is_detail_account: values[6]?.toLowerCase() !== 'non'
          };
          if (!accountData.account_number || !accountData.account_name) {
            errors.push(`Ligne ${i + 2}: Numéro de compte et nom requis`);
            continue;
          }
          if (!['asset', 'liability', 'equity', 'revenue', 'expense'].includes(accountData.account_type)) {
            errors.push(`Ligne ${i + 2}: Type de compte invalide (${accountData.account_type})`);
            continue;
          }
          const result = await this.createAccount(accountData);
          if (result.success) {
            imported++;
          } else {
            errors.push(`Ligne ${i + 2}: ${result.error}`);
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? (error instanceof Error ? error.message : 'Une erreur est survenue') : 'Erreur inconnue';
          errors.push(`Ligne ${i + 2}: Erreur de traitement - ${message}`);
        }
      }
      return { 
        success: errors.length < dataLines.length, 
        imported, 
        errors 
      };
    } catch (error: unknown) {
      logger.error('ChartOfAccounts', 'Erreur import CSV:', error);
      const message = error instanceof Error ? (error instanceof Error ? error.message : 'Une erreur est survenue') : 'Erreur inconnue lors de l\'import CSV';
      return { 
        success: false, 
        imported, 
        errors: [...errors, message] 
      };
    }
  }
  // Obtenir un modèle d'import CSV
  getImportTemplate(): string {
      const headers = [
        'Numéro de compte',
        'Nom du compte', 
        'Type',
        'Classe',
        'Description',
        'Actif',
        'Compte de détail'
      ];
      const sampleData = [
        ['411000', 'Clients', 'asset', '4', 'Créances clients', 'Oui', 'Oui'],
        ['401000', 'Fournisseurs', 'liability', '4', 'Dettes fournisseurs', 'Oui', 'Oui'],
        ['701000', 'Ventes de produits', 'revenue', '7', 'Chiffre d\'affaires', 'Oui', 'Oui']
      ];
    return [
      headers.join(','),
      ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }
  private inferAccountClass(accountNumber: string): number | null {
    const digit = parseInt(accountNumber.charAt(0), 10);
    return Number.isNaN(digit) ? null : digit;
  }
  // Calculer le solde d'un compte à une date donnée
  async getAccountBalance(accountId: string, date?: string): Promise<number> {
    try {
      const selection = date
        ? `
            debit_amount,
            credit_amount,
            journal_entries!inner(entry_date)
          `
        : 'debit_amount, credit_amount';
      let query = supabase
        .from('journal_entry_lines')
        .select(selection)
        .eq('account_id', accountId);
      if (date) {
        query = query.lte('journal_entries.entry_date', date);
      }
      const { data, error } = await query;
      if (error) throw error;
      const balance = data?.reduce((acc, line) => {
        const debit = Number((line as any).debit_amount) || 0;
        const credit = Number((line as any).credit_amount) || 0;
        return acc + (debit - credit);
      }, 0) ?? 0;
      return balance;
    } catch (error: unknown) {
      logger.error('ChartOfAccounts', 'Erreur calcul solde:', error);
      return 0;
    }
  }
}
export const chartOfAccountsService = ChartOfAccountsService.getInstance();