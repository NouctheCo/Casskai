import { supabase } from '@/lib/supabase';

export const journalEntryService = {
  createJournalEntry: async (entryData) => {
    const { items, ...entryFields } = entryData;
    
    const { data: entry, error: entryError } = await supabase
      .from('journal_entries')
      .insert(entryFields)
      .select()
      .single();
    
    if (entryError) throw entryError;
    
    const itemsWithEntryId = items.map(item => ({
      journal_entry_id: entry.id,
      company_id: entryFields.company_id,
      account_id: item.account_id,
      debit_amount: parseFloat(item.debit_amount) || 0,
      credit_amount: parseFloat(item.credit_amount) || 0,
      currency: item.currency || 'EUR',
      description: item.description || ''
    }));
    
    const { error: itemsError } = await supabase
      .from('journal_entry_items')
      .insert(itemsWithEntryId);
    
    if (itemsError) throw itemsError;
    
    // Update account balances after creating journal entry
    await updateAccountBalances(entryFields.company_id, items);
    
    return { data: entry, error: null };
  },

  updateJournalEntry: async (entryId, entryData) => {
    const { items, ...entryFields } = entryData;
    
    // Get the old items to reverse their effect on account balances
    const { data: oldItems, error: oldItemsError } = await supabase
      .from('journal_entry_items')
      .select('*')
      .eq('journal_entry_id', entryId);
      
    if (oldItemsError) throw oldItemsError;
    
    const { data: entry, error: entryError } = await supabase
      .from('journal_entries')
      .update(entryFields)
      .eq('id', entryId)
      .select()
      .single();
    
    if (entryError) throw entryError;
    
    await supabase
      .from('journal_entry_items')
      .delete()
      .eq('journal_entry_id', entryId);
    
    const itemsWithEntryId = items.map(item => ({
      journal_entry_id: entryId,
      company_id: entryFields.company_id,
      account_id: item.account_id,
      debit_amount: parseFloat(item.debit_amount) || 0,
      credit_amount: parseFloat(item.credit_amount) || 0,
      currency: item.currency || 'EUR',
      description: item.description || ''
    }));
    
    const { error: itemsError } = await supabase
      .from('journal_entry_items')
      .insert(itemsWithEntryId);
    
    if (itemsError) throw itemsError;
    
    // Reverse old items effect and apply new items effect on account balances
    if (oldItems && oldItems.length > 0) {
      const reversedOldItems = oldItems.map(item => ({
        account_id: item.account_id,
        debit_amount: item.credit_amount, // Swap debit and credit to reverse
        credit_amount: item.debit_amount, // Swap debit and credit to reverse
        currency: item.currency
      }));
      
      await updateAccountBalances(entryFields.company_id, reversedOldItems);
    }
    
    await updateAccountBalances(entryFields.company_id, items);
    
    return { data: entry, error: null };
  },

  deleteJournalEntry: async (entryId) => {
    // Get the items to reverse their effect on account balances
    const { data: items, error: itemsError } = await supabase
      .from('journal_entry_items')
      .select('*, journal_entries!inner(company_id)')
      .eq('journal_entry_id', entryId);
      
    if (itemsError) throw itemsError;
    
    // Delete the items
    await supabase
      .from('journal_entry_items')
      .delete()
      .eq('journal_entry_id', entryId);
    
    // Delete the entry
    const result = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entryId);
      
    // Reverse the effect on account balances
    if (items && items.length > 0) {
      const companyId = items[0].journal_entries.company_id;
      const reversedItems = items.map(item => ({
        account_id: item.account_id,
        debit_amount: item.credit_amount, // Swap debit and credit to reverse
        credit_amount: item.debit_amount, // Swap debit and credit to reverse
        currency: item.currency
      }));
      
      await updateAccountBalances(companyId, reversedItems);
    }
    
    return result;
  },

  deleteAllJournalEntries: async (companyId) => {
    if (!companyId) {
      throw new Error('Company ID is required to delete all journal entries');
    }

    try {
      // First, get all journal entries to update account balances
      const { data: entries, error: entriesError } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('company_id', companyId);
        
      if (entriesError) throw entriesError;
      
      if (entries && entries.length > 0) {
        // For each entry, get its items and reverse their effect on account balances
        for (const entry of entries) {
          const { data: items, error: itemsError } = await supabase
            .from('journal_entry_items')
            .select('*')
            .eq('journal_entry_id', entry.id);
            
          if (itemsError) throw itemsError;
          
          if (items && items.length > 0) {
            const reversedItems = items.map(item => ({
              account_id: item.account_id,
              debit_amount: item.credit_amount, // Swap debit and credit to reverse
              credit_amount: item.debit_amount, // Swap debit and credit to reverse
              currency: item.currency
            }));
            
            await updateAccountBalances(companyId, reversedItems);
          }
        }
      }
      
      // Delete all journal entry items for this company
      const { error: itemsError } = await supabase
        .from('journal_entry_items')
        .delete()
        .eq('company_id', companyId);
      
      if (itemsError) throw itemsError;
      
      // Delete all journal entries for this company
      const { error: entriesError2 } = await supabase
        .from('journal_entries')
        .delete()
        .eq('company_id', companyId);
      
      if (entriesError2) throw entriesError2;
      
      // Reset all account balances to 0
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('id')
        .eq('company_id', companyId);
        
      if (accountsError) throw accountsError;
      
      if (accounts && accounts.length > 0) {
        const { error: updateError } = await supabase
          .from('accounts')
          .update({ balance: 0 })
          .eq('company_id', companyId);
          
        if (updateError) throw updateError;
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting all journal entries:', error);
      return { success: false, error };
    }
  },

  getJournalEntries: async (currentEnterpriseId, filters = {}) => {
    if (!currentEnterpriseId) return { data: [], total: 0, error: null };
    
    let query = supabase
      .from('journal_entries')
      .select(`
        *,
        journal_entry_items (
          id, account_id, description, debit_amount, credit_amount,
          accounts:accounts (id, account_number, name)
        )
      `, { count: 'exact' })
      .eq('company_id', currentEnterpriseId);

    if (filters.dateRange?.from) {
      query = query.gte('entry_date', filters.dateRange.from);
    }
    if (filters.dateRange?.to) {
      query = query.lte('entry_date', filters.dateRange.to);
    }
    if (filters.journalId) {
      query = query.eq('journal_id', filters.journalId);
    }
    if (filters.reference) {
      query = query.ilike('reference_number', `%${filters.reference}%`);
    }
    if (filters.description) {
      query = query.ilike('description', `%${filters.description}%`);
    }
    if (filters.accountId) {
      // Pour filtrer par compte, nous devons utiliser une approche différente
      // car nous devons vérifier dans les lignes d'écriture
      const { data: itemsWithAccount } = await supabase
        .from('journal_entry_items')
        .select('journal_entry_id')
        .eq('account_id', filters.accountId)
        .eq('company_id', currentEnterpriseId);
      
      if (itemsWithAccount && itemsWithAccount.length > 0) {
        const entryIds = itemsWithAccount.map(item => item.journal_entry_id);
        query = query.in('id', entryIds);
      } else {
        // Si aucun élément ne correspond au compte, retourner un résultat vide
        return { data: [], count: 0, error: null };
      }
    }

    const sortBy = filters.sort_by || 'entry_date';
    const sortOrder = filters.sort_order || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    if (filters.page && filters.limit) {
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to);
    }

    return await query;
  },

  getAccountsList: async (currentEnterpriseId) => {
    if (!currentEnterpriseId) return [];
    
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, account_number, name, balance, type, class')
        .eq('company_id', currentEnterpriseId)
        .eq('is_active', true)
        .order('account_number');
      
      if (error) {
        console.error('Error fetching accounts:', error);
        throw new Error(`Failed to fetch accounts: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error('Network error fetching accounts:', error);
      throw new Error(`Network error: ${error.message}`);
    }
  },

  getJournalsList: async (currentEnterpriseId) => {
    if (!currentEnterpriseId) return [];
    
    try {
      const { data, error } = await supabase
        .from('journals')
        .select('id, code, name')
        .eq('company_id', currentEnterpriseId)
        .eq('is_active', true)
        .order('code');
      
      if (error) {
        console.error('Error fetching journals:', error);
        throw new Error(`Failed to fetch journals: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error('Network error fetching journals:', error);
      throw new Error(`Network error: ${error.message}`);
    }
  },
  
  // Calculate account balances based on journal entries
  calculateAccountBalances: async (companyId) => {
    if (!companyId) return { success: false, error: 'Company ID is required' };
    
    try {
      // Get all journal entry items for this company
      const { data: items, error: itemsError } = await supabase
        .from('journal_entry_items')
        .select('account_id, debit_amount, credit_amount')
        .eq('company_id', companyId);
        
      if (itemsError) throw itemsError;
      
      // Calculate balances for each account
      const balances = {};
      
      if (items && items.length > 0) {
        for (const item of items) {
          if (!balances[item.account_id]) {
            balances[item.account_id] = {
              debit_total: 0,
              credit_total: 0
            };
          }
          
          balances[item.account_id].debit_total += parseFloat(item.debit_amount || 0);
          balances[item.account_id].credit_total += parseFloat(item.credit_amount || 0);
        }
      }
      
      // Get all accounts for this company
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('id, account_number, type, class')
        .eq('company_id', companyId);
        
      if (accountsError) throw accountsError;
      
      // Update account balances
      if (accounts && accounts.length > 0) {
        for (const account of accounts) {
          const balance = balances[account.id] || { debit_total: 0, credit_total: 0 };
          
          // Calculate balance based on account type
          let finalBalance = 0;
          const accountClass = account.account_number.charAt(0);
          
          // For asset and expense accounts, debit increases the balance
          // For liability, equity, and revenue accounts, credit increases the balance
          if (['1', '2', '3', '6'].includes(accountClass)) {
            finalBalance = balance.debit_total - balance.credit_total;
          } else if (['4', '5', '7'].includes(accountClass)) {
            finalBalance = balance.credit_total - balance.debit_total;
          }
          
          // Update the account balance
          const { error: updateError } = await supabase
            .from('accounts')
            .update({ balance: finalBalance })
            .eq('id', account.id);
            
          if (updateError) throw updateError;
        }
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error calculating account balances:', error);
      return { success: false, error };
    }
  }
};

// Helper function to update account balances after journal entry operations
async function updateAccountBalances(companyId, items) {
  if (!companyId || !items || items.length === 0) return;
  
  try {
    // Group items by account_id
    const accountUpdates = {};
    
    for (const item of items) {
      if (!accountUpdates[item.account_id]) {
        accountUpdates[item.account_id] = {
          debit: 0,
          credit: 0
        };
      }
      
      accountUpdates[item.account_id].debit += parseFloat(item.debit_amount || 0);
      accountUpdates[item.account_id].credit += parseFloat(item.credit_amount || 0);
    }
    
    // Get account details to determine how to update balances
    const accountIds = Object.keys(accountUpdates);
    
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, account_number, balance, type, class')
      .in('id', accountIds);
      
    if (accountsError) throw accountsError;
    
    // Update each account's balance
    for (const account of accounts) {
      const updates = accountUpdates[account.id];
      const accountClass = account.account_number.charAt(0);
      let newBalance = parseFloat(account.balance || 0);
      
      // For asset and expense accounts, debit increases the balance
      // For liability, equity, and revenue accounts, credit increases the balance
      if (['1', '2', '3', '6'].includes(accountClass)) {
        newBalance += updates.debit - updates.credit;
      } else if (['4', '5', '7'].includes(accountClass)) {
        newBalance += updates.credit - updates.debit;
      }
      
      // Update the account balance
      const { error: updateError } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', account.id);
        
      if (updateError) throw updateError;
    }
  } catch (error) {
    console.error('Error updating account balances:', error);
    throw error;
  }
}