import { supabase } from '@/lib/supabase';

export const accountsService = {
  getAccounts: async (currentEnterpriseId, options = {}) => {
    if (!currentEnterpriseId) return { data: [], error: null, count: 0 };
    
    const { page = 1, limit = 15, searchTerm = '', classFilter = '', typeFilter = '', sortConfig = { key: 'account_number', direction: 'ascending' } } = options;
    
    let query = supabase
      .from('accounts')
      .select('*', { count: 'exact' })
      .eq('company_id', currentEnterpriseId);

    if (searchTerm) {
      query = query.or(`account_number.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`);
    }
    
    if (classFilter) {
      query = query.eq('class', parseInt(classFilter));
    }
    
    if (typeFilter) {
      query = query.eq('type', typeFilter);
    }

    const ascending = sortConfig.direction === 'ascending';
    query = query.order(sortConfig.key, { ascending });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    return await query;
  },

  createAccount: async (currentEnterpriseId, accountData) => {
    const dataWithCompany = { ...accountData, company_id: currentEnterpriseId };
    return await supabase.from('accounts').insert(dataWithCompany).select();
  },

  updateAccount: async (accountId, accountData) => {
    return await supabase.from('accounts').update(accountData).eq('id', accountId).select();
  },

  importStandardChartOfAccounts: async (currentEnterpriseId, defaultAccounts) => {
    const accountsWithCompany = defaultAccounts.map(acc => ({
      ...acc,
      company_id: currentEnterpriseId
    }));
    
    return await supabase.from('accounts').insert(accountsWithCompany);
  },

  getAccountsList: async (currentEnterpriseId) => {
    if (!currentEnterpriseId) return [];
    
    const { data, error } = await supabase
      .from('accounts')
      .select('id, account_number, name')
      .eq('company_id', currentEnterpriseId)
      .eq('is_active', true)
      .order('account_number');
    
    if (error) throw error;
    return data || [];
  }
};