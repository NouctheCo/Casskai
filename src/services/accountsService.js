// src/services/accountsService.js
import { supabase } from '@/lib/supabase';

export const accountsService = {
  // Récupérer les comptes avec filtres et pagination
  getAccounts: async (currentEnterpriseId, options = {}) => {
    if (!currentEnterpriseId) return { data: [], error: null, count: 0 };
    
    const { 
      page = 1, 
      limit = 15, 
      searchTerm = '', 
      classFilter = '', 
      typeFilter = '', 
      isActive = true,
      sortConfig = { key: 'account_number', direction: 'ascending' } 
    } = options;
    
    try {
      let query = supabase
        .from('accounts')
        .select('*', { count: 'exact' })
        .eq('company_id', currentEnterpriseId);

      // Filtrer par statut actif (par défaut on ne montre que les comptes actifs)
      if (isActive !== null) {
        query = query.eq('is_active', isActive);
      }

      // Recherche dans numéro et nom
      if (searchTerm) {
        query = query.or(`account_number.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`);
      }
      
      // Filtre par classe comptable
      if (classFilter) {
        query = query.eq('class', parseInt(classFilter));
      }
      
      // Filtre par type
      if (typeFilter) {
        query = query.eq('type', typeFilter);
      }

      // Tri
      const ascending = sortConfig.direction === 'ascending';
      query = query.order(sortConfig.key, { ascending });

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const result = await query;
      
      return {
        data: result.data || [],
        error: result.error,
        count: result.count || 0
      };
    } catch (error) {
      console.error('Error fetching accounts:', error);
      return { data: [], error, count: 0 };
    }
  },

  // Créer un nouveau compte
  createAccount: async (currentEnterpriseId, accountData) => {
    if (!currentEnterpriseId) {
      return { data: null, error: new Error('Company ID is required') };
    }

    try {
      // Déterminer la classe automatiquement si pas fournie
      if (!accountData.class && accountData.account_number) {
        accountData.class = parseInt(accountData.account_number.charAt(0));
      }

      // Préparer les données avec valeurs par défaut
      const dataWithDefaults = {
        company_id: currentEnterpriseId,
        account_number: accountData.account_number,
        name: accountData.name,
        type: accountData.type || 'asset',
        description: accountData.description || null,
        is_active: accountData.is_active !== undefined ? accountData.is_active : true,
        balance: accountData.balance || 0,
        currency: accountData.currency || 'EUR',
        class: accountData.class || parseInt(accountData.account_number?.charAt(0)) || 1,
        parent_code: accountData.parent_code || null,
        tva_type: accountData.tva_type || null
      };

      const result = await supabase
        .from('accounts')
        .insert(dataWithDefaults)
        .select()
        .single();

      return result;
    } catch (error) {
      console.error('Error creating account:', error);
      return { data: null, error };
    }
  },

  // Mettre à jour un compte
  updateAccount: async (accountId, accountData) => {
    if (!accountId) {
      return { data: null, error: new Error('Account ID is required') };
    }

    try {
      // Nettoyer les données (enlever les champs non modifiables)
      const { id, company_id, created_at, updated_at, ...updateData } = accountData;
      
      // Mettre à jour automatiquement le timestamp
      updateData.updated_at = new Date().toISOString();

      // Déterminer la classe automatiquement si account_number modifié
      if (updateData.account_number && !updateData.class) {
        updateData.class = parseInt(updateData.account_number.charAt(0));
      }

      const result = await supabase
        .from('accounts')
        .update(updateData)
        .eq('id', accountId)
        .select()
        .single();

      return result;
    } catch (error) {
      console.error('Error updating account:', error);
      return { data: null, error };
    }
  },

  // Supprimer un compte (soft delete)
  deleteAccount: async (accountId) => {
    if (!accountId) {
      return { data: null, error: new Error('Account ID is required') };
    }

    try {
      // Vérifier s'il y a des écritures liées
      const { count, error: checkError } = await supabase
        .from('journal_entry_items')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', accountId);

      if (checkError) throw checkError;

      if (count > 0) {
        // Si des écritures existent, désactiver au lieu de supprimer
        return await supabase
          .from('accounts')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', accountId)
          .select()
          .single();
      } else {
        // Sinon, supprimer définitivement
        return await supabase
          .from('accounts')
          .delete()
          .eq('id', accountId)
          .select()
          .single();
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      return { data: null, error };
    }
  },

  // Importer un plan comptable standard
  importStandardChartOfAccounts: async (currentEnterpriseId, defaultAccounts) => {
    if (!currentEnterpriseId || !defaultAccounts?.length) {
      return { data: null, error: new Error('Company ID and accounts data are required') };
    }

    try {
      // Vérifier s'il y a déjà des comptes
      const { count, error: countError } = await supabase
        .from('accounts')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', currentEnterpriseId);

      if (countError) throw countError;

      if (count > 0) {
        return { 
          data: null, 
          error: new Error('Chart of accounts already exists. Use individual account creation instead.') 
        };
      }

      // Préparer les comptes avec les données de l'entreprise
      const accountsWithCompany = defaultAccounts.map(acc => ({
        company_id: currentEnterpriseId,
        account_number: acc.account_number || acc.number || acc.code,
        name: acc.name || acc.label,
        type: acc.type,
        description: acc.description || null,
        is_active: true,
        balance: 0,
        currency: 'EUR',
        class: acc.class || parseInt((acc.account_number || acc.number || acc.code).charAt(0)),
        parent_code: acc.parent_code || null,
        tva_type: acc.tva_type || null
      }));

      const result = await supabase
        .from('accounts')
        .insert(accountsWithCompany)
        .select();

      return result;
    } catch (error) {
      console.error('Error importing chart of accounts:', error);
      return { data: null, error };
    }
  },

  // Obtenir la liste simple des comptes (pour les sélecteurs)
  getAccountsList: async (currentEnterpriseId, options = {}) => {
    if (!currentEnterpriseId) return [];
    
    const { type = null, isActive = true } = options;

    try {
      let query = supabase
        .from('accounts')
        .select('id, account_number, name, type, class, balance')
        .eq('company_id', currentEnterpriseId)
        .eq('is_active', isActive)
        .order('account_number');

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching accounts list:', error);
      return [];
    }
  },

  // Récupérer un compte par son numéro
  getAccountByNumber: async (currentEnterpriseId, accountNumber) => {
    if (!currentEnterpriseId || !accountNumber) {
      return { data: null, error: new Error('Company ID and account number are required') };
    }

    try {
      const result = await supabase
        .from('accounts')
        .select('*')
        .eq('company_id', currentEnterpriseId)
        .eq('account_number', accountNumber)
        .single();

      return result;
    } catch (error) {
      console.error('Error fetching account by number:', error);
      return { data: null, error };
    }
  },

  // Recalculer le solde d'un compte (utilise la fonction SQL)
  recalculateAccountBalance: async (accountId) => {
    if (!accountId) {
      return { data: null, error: new Error('Account ID is required') };
    }

    try {
      // Utiliser la fonction SQL créée dans les migrations
      const { data, error } = await supabase.rpc('update_account_balances');
      
      if (error) throw error;
      
      return { data: 'Balance recalculated successfully', error: null };
    } catch (error) {
      console.error('Error recalculating account balance:', error);
      return { data: null, error };
    }
  },

  // Obtenir la balance par classe comptable
  getBalanceByClass: async (currentEnterpriseId, classNumber = null) => {
    if (!currentEnterpriseId) {
      return { data: [], error: new Error('Company ID is required') };
    }

    try {
      let query = supabase
        .from('accounts')
        .select('class, type, balance')
        .eq('company_id', currentEnterpriseId)
        .eq('is_active', true);

      if (classNumber) {
        query = query.eq('class', classNumber);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Grouper par classe et calculer les totaux
      const balanceByClass = (data || []).reduce((acc, account) => {
        const className = account.class;
        if (!acc[className]) {
          acc[className] = { 
            class: className, 
            total: 0, 
            accounts_count: 0,
            type: account.type 
          };
        }
        acc[className].total += account.balance || 0;
        acc[className].accounts_count += 1;
        return acc;
      }, {});

      return { 
        data: Object.values(balanceByClass), 
        error: null 
      };
    } catch (error) {
      console.error('Error getting balance by class:', error);
      return { data: [], error };
    }
  },

  // Vérifier si un numéro de compte existe déjà
  checkAccountNumberExists: async (currentEnterpriseId, accountNumber, excludeId = null) => {
    if (!currentEnterpriseId || !accountNumber) {
      return { exists: false, error: new Error('Company ID and account number are required') };
    }

    try {
      let query = supabase
        .from('accounts')
        .select('id')
        .eq('company_id', currentEnterpriseId)
        .eq('account_number', accountNumber);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      return { 
        exists: (data || []).length > 0, 
        error: null 
      };
    } catch (error) {
      console.error('Error checking account number:', error);
      return { exists: false, error };
    }
  },

  // Obtenir les statistiques des comptes
  getAccountsStats: async (currentEnterpriseId) => {
    if (!currentEnterpriseId) {
      return { data: null, error: new Error('Company ID is required') };
    }

    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('class, type, is_active, balance')
        .eq('company_id', currentEnterpriseId);

      if (error) throw error;

      const stats = {
        total: data.length,
        active: data.filter(acc => acc.is_active).length,
        inactive: data.filter(acc => !acc.is_active).length,
        by_class: {},
        by_type: {},
        total_balance: data.reduce((sum, acc) => sum + (acc.balance || 0), 0)
      };

      // Statistiques par classe
      data.forEach(acc => {
        if (!stats.by_class[acc.class]) {
          stats.by_class[acc.class] = { count: 0, balance: 0 };
        }
        stats.by_class[acc.class].count++;
        stats.by_class[acc.class].balance += acc.balance || 0;
      });

      // Statistiques par type
      data.forEach(acc => {
        if (!stats.by_type[acc.type]) {
          stats.by_type[acc.type] = { count: 0, balance: 0 };
        }
        stats.by_type[acc.type].count++;
        stats.by_type[acc.type].balance += acc.balance || 0;
      });

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error getting accounts stats:', error);
      return { data: null, error };
    }
  }
};
