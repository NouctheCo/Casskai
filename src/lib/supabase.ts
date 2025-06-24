// src/lib/supabase.ts - Client Supabase mis à jour
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import ConfigService from '@/services/configService';

// Type pour le client Supabase avec la base de données typée
export type TypedSupabaseClient = SupabaseClient<Database>;

// Variables pour le client global
let supabaseClient: TypedSupabaseClient | null = null;

/**
 * Initialise le client Supabase avec la configuration
 */
export function initializeSupabase(): TypedSupabaseClient {
  const configService = ConfigService.getInstance();
  const config = configService.getConfig();

  if (!config?.supabase?.url || !config?.supabase?.anonKey) {
    throw new Error('Configuration Supabase manquante. Veuillez configurer l\'application.');
  }

  if (!config.supabase.validated) {
    throw new Error('Configuration Supabase non validée. Veuillez valider la connexion.');
  }

  // Créer le client avec la configuration
  supabaseClient = createClient<Database>(
    config.supabase.url,
    config.supabase.anonKey,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: localStorage,
        storageKey: 'casskai-auth-token',
      },
      global: {
        headers: {
          'X-Application': 'CassKai',
          'X-Version': '1.0.0',
        },
      },
      db: {
        schema: 'public',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    }
  );

  return supabaseClient;
}

/**
 * Obtient le client Supabase (l'initialise si nécessaire)
 */
export function getSupabaseClient(): TypedSupabaseClient {
  if (!supabaseClient) {
    return initializeSupabase();
  }
  return supabaseClient;
}

/**
 * Client Supabase par défaut (pour compatibilité ascendante)
 */
export const supabase = new Proxy({} as TypedSupabaseClient, {
  get(target, prop) {
    const client = getSupabaseClient();
    return client[prop as keyof TypedSupabaseClient];
  }
});

/**
 * Vérifie si Supabase est configuré et connecté
 */
export async function checkSupabaseConnection(): Promise<{
  isConfigured: boolean;
  isConnected: boolean;
  error?: string;
}> {
  try {
    const configService = ConfigService.getInstance();
    const config = configService.getConfig();

    if (!config?.supabase?.url || !config?.supabase?.anonKey) {
      return {
        isConfigured: false,
        isConnected: false,
        error: 'Configuration Supabase manquante'
      };
    }

    if (!config.supabase.validated) {
      return {
        isConfigured: true,
        isConnected: false,
        error: 'Configuration Supabase non validée'
      };
    }

    // Test de connexion
    const client = getSupabaseClient();
    const { error } = await client.from('companies').select('id').limit(1);

    if (error && error.code !== 'PGRST116') {
      return {
        isConfigured: true,
        isConnected: false,
        error: `Erreur de connexion: ${error.message}`
      };
    }

    return {
      isConfigured: true,
      isConnected: true
    };

  } catch (error) {
    return {
      isConfigured: false,
      isConnected: false,
      error: error.message
    };
  }
}

/**
 * Obtient les informations de session utilisateur
 */
export async function getCurrentUser() {
  try {
    const client = getSupabaseClient();
    const { data: { user }, error } = await client.auth.getUser();
    
    if (error) {
      throw error;
    }

    return user;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return null;
  }
}

/**
 * Obtient les entreprises de l'utilisateur connecté
 */
export async function getUserCompanies() {
  try {
    const client = getSupabaseClient();
    const user = await getCurrentUser();
    
    if (!user) {
      return [];
    }

    const { data, error } = await client
      .from('user_companies')
      .select(`
        *,
        companies (*),
        roles (*)
      `)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des entreprises:', error);
    return [];
  }
}

/**
 * Définit l'entreprise par défaut pour l'utilisateur
 */
export async function setDefaultCompany(companyId: string) {
  try {
    const client = getSupabaseClient();
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    const { error } = await client.rpc('set_default_company', {
      p_user_id: user.id,
      p_company_id: companyId
    });

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de la définition de l\'entreprise par défaut:', error);
    throw error;
  }
}

/**
 * Obtient l'entreprise par défaut de l'utilisateur
 */
export async function getDefaultCompany() {
  try {
    const companies = await getUserCompanies();
    return companies.find(uc => uc.is_default) || companies[0] || null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'entreprise par défaut:', error);
    return null;
  }
}

/**
 * Fonctions d'aide pour les requêtes courantes
 */
export const supabaseHelpers = {
  // Comptes comptables
  async getAccounts(companyId: string) {
    const client = getSupabaseClient();
    return await client
      .from('accounts')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('account_number');
  },

  // Journaux
  async getJournals(companyId: string) {
    const client = getSupabaseClient();
    return await client
      .from('journals')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('code');
  },

  // Écritures comptables avec leurs lignes
  async getJournalEntries(companyId: string, filters?: {
    dateFrom?: string;
    dateTo?: string;
    journalId?: string;
    limit?: number;
    offset?: number;
  }) {
    const client = getSupabaseClient();
    let query = client
      .from('journal_entries')
      .select(`
        *,
        journal_entry_items (
          *,
          accounts (*)
        ),
        journals (*)
      `)
      .eq('company_id', companyId);

    if (filters?.dateFrom) {
      query = query.gte('entry_date', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('entry_date', filters.dateTo);
    }
    if (filters?.journalId) {
      query = query.eq('journal_id', filters.journalId);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
    }

    return await query.order('entry_date', { ascending: false });
  },

  // Statistiques du dashboard
  async getDashboardStats(companyId: string) {
    const client = getSupabaseClient();
    return await client.rpc('get_dashboard_stats', {
      p_company_id: companyId
    });
  },

  // Bilan comptable
  // Bilan comptable
  async getBalanceSheet(companyId: string, date?: string) {
    const client = getSupabaseClient();
    return await client.rpc('get_balance_sheet', {
      p_company_id: companyId,
      p_date: date || new Date().toISOString().split('T')[0]
    });
  },

  // Compte de résultat
  async getIncomeStatement(companyId: string, startDate?: string, endDate?: string) {
    const client = getSupabaseClient();
    const currentYear = new Date().getFullYear();
    return await client.rpc('get_income_statement', {
      p_company_id: companyId,
      p_start_date: startDate || `${currentYear}-01-01`,
      p_end_date: endDate || new Date().toISOString().split('T')[0]
    });
  },

  // Cash-flow
  async getCashFlowData(companyId: string, months: number = 12) {
    const client = getSupabaseClient();
    return await client.rpc('get_cash_flow_data', {
      p_company_id: companyId,
      p_months: months
    });
  },

  // Comptes bancaires
  async getBankAccounts(companyId: string) {
    const client = getSupabaseClient();
    return await client
      .from('bank_accounts')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('account_name');
  },

  // Transactions bancaires
  async getBankTransactions(companyId: string, bankAccountId?: string, limit: number = 100) {
    const client = getSupabaseClient();
    let query = client
      .from('bank_transactions')
      .select('*')
      .eq('company_id', companyId);

    if (bankAccountId) {
      query = query.eq('bank_account_id', bankAccountId);
    }

    return await query
      .order('transaction_date', { ascending: false })
      .limit(limit);
  },

  // Tiers (clients/fournisseurs)
  async getThirdParties(companyId: string, type?: 'CLIENT' | 'SUPPLIER' | 'BOTH') {
    const client = getSupabaseClient();
    let query = client
      .from('third_parties')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (type) {
      if (type === 'BOTH') {
        query = query.in('type', ['CLIENT', 'SUPPLIER', 'BOTH']);
      } else {
        query = query.in('type', [type, 'BOTH']);
      }
    }

    return await query.order('name');
  },

  // Validation des données comptables
  async validateAccountingData(companyId: string) {
    const client = getSupabaseClient();
    return await client.rpc('validate_accounting_data', {
      p_company_id: companyId
    });
  },

  // Recalcul des soldes
  async recalculateAccountBalances(companyId: string) {
    const client = getSupabaseClient();
    return await client.rpc('recalculate_all_account_balances', {
      p_company_id: companyId
    });
  },

  // Rapprochement bancaire
  async reconcileBankTransaction(transactionId: string, journalEntryId?: string) {
    const client = getSupabaseClient();
    return await client.rpc('reconcile_bank_transaction', {
      p_transaction_id: transactionId,
      p_journal_entry_id: journalEntryId
    });
  },

  // Créer une écriture comptable complète
  async createJournalEntry(
    companyId: string,
    entryData: {
      entry_date: string;
      description: string;
      reference_number?: string;
      journal_id?: string;
      items: Array<{
        account_id: string;
        description?: string;
        debit_amount?: number;
        credit_amount?: number;
        currency?: string;
      }>;
    }
  ) {
    const client = getSupabaseClient();

    // Démarrer une transaction
    try {
      // 1. Créer l'écriture principale
      const { data: journalEntry, error: entryError } = await client
        .from('journal_entries')
        .insert({
          company_id: companyId,
          entry_date: entryData.entry_date,
          description: entryData.description,
          reference_number: entryData.reference_number,
          journal_id: entryData.journal_id,
          status: 'draft'
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // 2. Créer les lignes d'écriture
      const itemsWithEntryId = entryData.items.map(item => ({
        ...item,
        journal_entry_id: journalEntry.id,
        company_id: companyId,
        currency: item.currency || 'EUR',
        debit_amount: item.debit_amount || 0,
        credit_amount: item.credit_amount || 0
      }));

      const { data: journalItems, error: itemsError } = await client
        .from('journal_entry_items')
        .insert(itemsWithEntryId)
        .select();

      if (itemsError) throw itemsError;

      // 3. Valider l'équilibre
      const { data: isBalanced, error: validateError } = await client
        .rpc('validate_journal_entry_balance', {
          p_journal_entry_id: journalEntry.id
        });

      if (validateError) throw validateError;

      if (!isBalanced) {
        // Supprimer l'écriture si elle n'est pas équilibrée
        await client.from('journal_entries').delete().eq('id', journalEntry.id);
        throw new Error('L\'écriture n\'est pas équilibrée (débit ≠ crédit)');
      }

      // 4. Marquer comme validée
      const { error: updateError } = await client
        .from('journal_entries')
        .update({ status: 'posted' })
        .eq('id', journalEntry.id);

      if (updateError) throw updateError;

      return {
        success: true,
        data: {
          journalEntry,
          journalItems
        }
      };

    } catch (error) {
      console.error('Erreur lors de la création de l\'écriture:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Supprimer une écriture comptable
  async deleteJournalEntry(entryId: string) {
    const client = getSupabaseClient();
    
    try {
      // Les lignes d'écriture seront supprimées automatiquement (CASCADE)
      const { error } = await client
        .from('journal_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'écriture:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Obtenir les permissions de l'utilisateur
  async getUserPermissions(userId: string, companyId: string) {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('user_companies')
      .select(`
        roles (
          role_permissions (
            permissions (*)
          )
        )
      `)
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération des permissions:', error);
      return [];
    }

    // Extraire les permissions
    const permissions = data?.roles?.role_permissions?.map(rp => rp.permissions) || [];
    return permissions.flat();
  },

  // Logs d'audit
  async getAuditLogs(companyId: string, options?: {
    tableName?: string;
    recordId?: string;
    limit?: number;
    offset?: number;
  }) {
    const client = getSupabaseClient();
    
    let query = client
      .from('audit_logs')
      .select('*')
      .eq('company_id', companyId);

    if (options?.tableName) {
      query = query.eq('table_name', options.tableName);
    }
    if (options?.recordId) {
      query = query.eq('record_id', options.recordId);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1);
    }

    return await query.order('created_at', { ascending: false });
  }
};

/**
 * Hook React pour utiliser Supabase
 */
export function useSupabase() {
  return {
    client: getSupabaseClient(),
    helpers: supabaseHelpers,
    checkConnection: checkSupabaseConnection,
    getCurrentUser,
    getUserCompanies,
    getDefaultCompany,
    setDefaultCompany
  };
}

// Export pour compatibilité
export default supabase;
