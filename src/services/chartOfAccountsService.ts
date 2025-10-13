// src/services/chartOfAccountsService.ts
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type Account = {
  id: string;
  company_id: string;
  account_number: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  class: number;
  parent_account_id?: string;
  description?: string;
  is_active: boolean;
  balance: number;
  currency: string;
  tax_rate: number;
  created_at: string;
  updated_at: string;
};

type AccountInsert = {
  company_id: string;
  account_number: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  class?: number;
  parent_account_id?: string;
  description?: string;
  is_active?: boolean;
  currency?: string;
  tax_rate?: number;
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
    type?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<Account[]> {
    try {
      let query = supabase
        .from('accounts')
        .select('*')
        .eq('company_id', companyId)
        .order('account_number', { ascending: true });

      if (filters?.type && filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }

      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      if (filters?.search) {
        query = query.or(`account_number.ilike.%${filters.search}%,name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération comptes:', error);
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
      // Vérifier l'unicité du numéro de compte
      const { data: existing } = await supabase
        .from('accounts')
        .select('id')
        .eq('company_id', accountData.company_id)
        .eq('account_number', accountData.account_number)
        .single();

      if (existing) {
        return { success: false, error: 'Ce numéro de compte existe déjà' };
      }

      // Déterminer la classe automatiquement si pas fournie
      const accountClass = accountData.class || parseInt(accountData.account_number.charAt(0));
      
      const { data, error } = await supabase
        .from('accounts')
        .insert([{
          ...accountData,
          class: accountClass,
          is_active: accountData.is_active ?? true,
          currency: accountData.currency || 'EUR',
          tax_rate: accountData.tax_rate || 0
        }])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Erreur création compte:', error);
      return { success: false, error: error.message };
    }
  }

  // Mettre à jour un compte
  async updateAccount(id: string, updates: Partial<AccountInsert>): Promise<{ 
    success: boolean; 
    data?: Account; 
    error?: string 
  }> {
    try {
      // Si le numéro de compte change, vérifier l'unicité
      if (updates.account_number) {
        const { data: existing } = await supabase
          .from('accounts')
          .select('id, company_id')
          .eq('id', id)
          .single();

        if (existing) {
          const { data: duplicate } = await supabase
            .from('accounts')
            .select('id')
            .eq('company_id', existing.company_id)
            .eq('account_number', updates.account_number)
            .neq('id', id)
            .single();

          if (duplicate) {
            return { success: false, error: 'Ce numéro de compte existe déjà' };
          }
        }

        // Mettre à jour la classe si le numéro change
        if (!updates.class) {
          updates.class = parseInt(updates.account_number.charAt(0));
        }
      }

      const { data, error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Erreur modification compte:', error);
      return { success: false, error: error.message };
    }
  }

  // Supprimer un compte
  async deleteAccount(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Vérifier qu'aucune écriture n'utilise ce compte
      const { data: lines } = await supabase
        .from('journal_entry_items')
        .select('id')
        .eq('account_id', id)
        .limit(1);

      if (lines && lines.length > 0) {
        return { success: false, error: 'Impossible de supprimer un compte utilisé dans des écritures' };
      }

      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Erreur suppression compte:', error);
      return { success: false, error: error.message };
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
        .from('accounts')
        .select('type, is_active, balance')
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

        // Compter par type
        stats.accountsByType[account.type] = (stats.accountsByType[account.type] || 0) + 1;

        // Sommer les soldes par type
        stats.totalBalance[account.type] = (stats.totalBalance[account.type] || 0) + (account.balance || 0);
      });

      return stats;
    } catch (error) {
      console.error('Erreur stats comptes:', error);
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
        'Solde',
        'Devise',
        'Taux de TVA'
      ];

      const csvRows = accounts.map(account => [
        account.account_number,
        account.name,
        account.type,
        account.class.toString(),
        account.description || '',
        account.is_active ? 'Oui' : 'Non',
        account.balance.toString(),
        account.currency,
        account.tax_rate.toString()
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      return { success: true, data: csvContent };
    } catch (error) {
      console.error('Erreur export CSV:', error);
      return { success: false, error: error.message };
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
            name: values[1]?.trim(),
            type: values[2]?.trim() as any,
            class: values[3] ? parseInt(values[3]) : undefined,
            description: values[4]?.trim() || undefined,
            is_active: values[5]?.toLowerCase() !== 'non',
            currency: values[7]?.trim() || 'EUR',
            tax_rate: values[8] ? parseFloat(values[8]) : 0
          };

          // Validation
          if (!accountData.account_number || !accountData.name) {
            errors.push(`Ligne ${i + 2}: Numéro de compte et nom requis`);
            continue;
          }

          if (!['asset', 'liability', 'equity', 'revenue', 'expense'].includes(accountData.type)) {
            errors.push(`Ligne ${i + 2}: Type de compte invalide (${accountData.type})`);
            continue;
          }

          const result = await this.createAccount(accountData);
          if (result.success) {
            imported++;
          } else {
            errors.push(`Ligne ${i + 2}: ${result.error}`);
          }
        } catch (error) {
          errors.push(`Ligne ${i + 2}: Erreur de traitement - ${error.message}`);
        }
      }

      return { 
        success: errors.length < dataLines.length, 
        imported, 
        errors 
      };
    } catch (error) {
      console.error('Erreur import CSV:', error);
      return { 
        success: false, 
        imported, 
        errors: [...errors, error.message] 
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
      'Solde',
      'Devise',
      'Taux de TVA'
    ];

    const sampleData = [
      ['411000', 'Clients', 'asset', '4', 'Créances clients', 'Oui', '0', 'EUR', '0'],
      ['401000', 'Fournisseurs', 'liability', '4', 'Dettes fournisseurs', 'Oui', '0', 'EUR', '0'],
      ['701000', 'Ventes de produits', 'revenue', '7', 'Chiffre d\'affaires', 'Oui', '0', 'EUR', '20']
    ];

    return [
      headers.join(','),
      ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }

  // Calculer le solde d'un compte à une date donnée
  async getAccountBalance(accountId: string, date?: string): Promise<number> {
    try {
      let query = supabase
        .from('journal_entry_items')
        .select('debit_amount, credit_amount')
        .eq('account_id', accountId);

      if (date) {
        // Jointure avec journal_entries pour filtrer par date
        query = supabase
          .from('journal_entry_items')
          .select(`
            debit_amount,
            credit_amount,
            journal_entries!inner(date)
          `)
          .eq('account_id', accountId)
          .lte('journal_entries.date', date);
      }

      const { data, error } = await query;

      if (error) throw error;

      let balance = 0;
      data?.forEach(line => {
        balance += (line.debit_amount || 0) - (line.credit_amount || 0);
      });

      return balance;
    } catch (error) {
      console.error('Erreur calcul solde:', error);
      return 0;
    }
  }
}

export const chartOfAccountsService = ChartOfAccountsService.getInstance();