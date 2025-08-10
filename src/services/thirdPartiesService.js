import { supabase } from '../lib/supabase';
import { useState, useEffect, useCallback } from 'react';

const TABLE_NAME = 'third_parties';
const JOURNAL_ENTRY_ITEMS_TABLE = 'journal_entry_items';
const ACCOUNTS_TABLE = 'accounts';
const JOURNAL_ENTRIES_TABLE = 'journal_entries';

export const thirdPartiesService = {
  async getThirdParties(currentEnterpriseId, { type = 'ALL', searchTerm, statusFilter, countryFilter, sortBy, sortDirection, page, pageSize }) {
    if (!currentEnterpriseId) return { data: [], count: 0, error: { message: 'Company ID is required.' } };

    let query = supabase
      .from(TABLE_NAME)
      .select('*', { count: 'exact' })
      .eq('company_id', currentEnterpriseId);

    if (type && type !== 'ALL') {
      query = query.eq('type', type);
    }
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,tax_number.ilike.%${searchTerm}%`);
    }
    if (statusFilter === 'active') {
      query = query.eq('is_active', true);
    } else if (statusFilter === 'inactive') {
      query = query.eq('is_active', false);
    }
    if (countryFilter) {
      query = query.eq('country', countryFilter);
    }

    if (sortBy && sortDirection) {
      query = query.order(sortBy, { ascending: sortDirection === 'asc' });
    } else {
      query = query.order('name', { ascending: true });
    }

    if (page && pageSize) {
      const offset = (page - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1);
    }

    const { data, error, count } = await query;
    return { data: data || [], count: count || 0, error };
  },

  async getThirdPartyById(id) {
    if (!id) return { data: null, error: { message: 'Third party ID is required.' } };
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  async createThirdParty(currentEnterpriseId, thirdPartyData) {
    if (!currentEnterpriseId) return { data: null, error: { message: 'Company ID is required.' } };
    if (!thirdPartyData.name || thirdPartyData.name.trim() === '') {
        return { data: null, error: { message: 'Name is required.'} };
    }
    if (thirdPartyData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(thirdPartyData.email)) {
        return { data: null, error: { message: 'Invalid email format.'} };
    }
    if (thirdPartyData.website && !/^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/.test(thirdPartyData.website)) {
        return { data: null, error: { message: 'Invalid website format.'} };
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([{ ...thirdPartyData, company_id: currentEnterpriseId, balance: thirdPartyData.balance || 0 }])
      .select()
      .single();
    return { data, error };
  },

  async updateThirdParty(id, thirdPartyData) {
    if (!id) return { data: null, error: { message: 'Third party ID is required.' } };
     if (thirdPartyData.email && thirdPartyData.email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(thirdPartyData.email)) {
        return { data: null, error: { message: 'Invalid email format.'} };
    }
    if (thirdPartyData.website && thirdPartyData.website.trim() !== '' && !/^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/.test(thirdPartyData.website)) {
        return { data: null, error: { message: 'Invalid website format.'} };
    }
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(thirdPartyData)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async deleteThirdParty(id, currentEnterpriseId) {
    if (!id) return { error: { message: 'Third party ID is required.' } };
    
    // Simplified check: This checks if the third party name appears in journal entry descriptions.
    // A more robust check would require a direct third_party_id link in journal_entry_items or related tables (invoices, expenses).
    const { data: thirdParty, error: fetchError } = await this.getThirdPartyById(id);
    if (fetchError || !thirdParty) {
        return { error: fetchError || { message: 'Third party not found.'} };
    }

    const { count: relatedEntriesCount, error: entriesError } = await supabase
        .from(JOURNAL_ENTRIES_TABLE)
        .select('id', { count: 'exact', head: true })
        .eq('company_id', currentEnterpriseId)
        .or(`description.ilike.%${thirdParty.name}%,reference_number.ilike.%${thirdParty.name}%`); // Example of a loose check

    if (entriesError) {
        console.error('Error checking related journal entries:', entriesError);
        // Decide if to proceed or return error. For now, we'll log and proceed with caution.
    }

    if (relatedEntriesCount && relatedEntriesCount > 0) {
        // This check is very basic. A real app would need more specific linking.
        // For example, check invoices or expenses linked to this third_party_id.
        // return { error: { message: `Cannot delete ${thirdParty.name} as it has related journal entries. Consider deactivating instead.` } };
    }

    // Placeholder for checking invoices/expenses if those tables have a third_party_id
    // const { count: relatedInvoices, error: invoiceError } = await supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('client_id', id);
    // if (relatedInvoices > 0) return { error: { message: 'Cannot delete: related invoices exist.'}};
    // const { count: relatedExpenses, error: expenseError } = await supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('supplier_id', id);
    // if (relatedExpenses > 0) return { error: { message: 'Cannot delete: related expenses exist.'}};


    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);
    return { error };
  },

  async getThirdPartyBalance(thirdPartyId, currentEnterpriseId) {
    if (!thirdPartyId || !currentEnterpriseId) return { balance: 0, error: { message: 'Third party ID and Company ID are required.' } };
    try {
        const { data, error } = await supabase.rpc('calculate_third_party_balance', {
            p_third_party_id: thirdPartyId,
            p_company_id: currentEnterpriseId
        });

        if (error) throw error;
        
        // Update the stored balance on the third_party record
        if (data !== null && data !== undefined) {
            await supabase.from(TABLE_NAME).update({ balance: data }).eq('id', thirdPartyId);
        }
        return { balance: data || 0, error: null };
    } catch (error) {
        console.error('Error calculating balance via RPC:', error);
        return { balance: 0, error };
    }
  },

  async importThirdPartiesFromCSV(currentEnterpriseId, csvData) {
    if (!currentEnterpriseId || !csvData) return { successCount: 0, errorCount: 0, errors: [{ message: 'Company ID and CSV data are required.' }] };
    
    const results = { successCount: 0, errorCount: 0, errors: [] };
    const thirdPartiesToInsert = [];

    // Basic CSV parsing (assuming header row and comma-separated values)
    // A more robust CSV parser library should be used for production
    const lines = csvData.split(/\r\n|\n/);
    if (lines.length < 2) {
        results.errors.push({ message: 'CSV data must have a header and at least one data row.' });
        results.errorCount = 1;
        return results;
    }
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    const requiredHeaders = ['name', 'type']; // Example required headers
    for (const reqHeader of requiredHeaders) {
        if (!headers.includes(reqHeader)) {
            results.errors.push({ message: `Missing required CSV header: ${reqHeader}` });
            results.errorCount = lines.length -1;
            return results;
        }
    }

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length === 0 || values.every(v => v.trim() === '')) continue; // Skip empty lines

        const thirdParty = {};
        headers.forEach((header, index) => {
            const value = values[index] ? values[index].trim() : '';
            if (header === 'is_active') {
                thirdParty[header] = value.toLowerCase() === 'true' || value === '1';
            } else if (header === 'balance') {
                thirdParty[header] = parseFloat(value) || 0;
            } else {
                thirdParty[header] = value;
            }
        });

        if (!thirdParty.name || !thirdParty.type || !['CLIENT', 'SUPPLIER'].includes(thirdParty.type.toUpperCase())) {
            results.errorCount++;
            results.errors.push({ line: i + 1, message: 'Missing name or invalid type (must be CLIENT or SUPPLIER).', data: thirdParty });
            continue;
        }
        thirdParty.type = thirdParty.type.toUpperCase();
        thirdParty.company_id = currentEnterpriseId;
        thirdParty.country = thirdParty.country || 'FR'; // Default country if not provided
        thirdPartiesToInsert.push(thirdParty);
    }

    if (thirdPartiesToInsert.length > 0) {
        const { error: insertError } = await supabase.from(TABLE_NAME).insert(thirdPartiesToInsert);
        if (insertError) {
            results.errorCount += thirdPartiesToInsert.length;
            results.errors.push({ message: `Batch insert failed: ${insertError.message}` });
        } else {
            results.successCount = thirdPartiesToInsert.length;
        }
    }
    
    return results;
  }
};

export const useThirdParties = (currentEnterpriseId, initialType = 'CLIENT', initialFilters = {}) => {
  const [thirdParties, setThirdParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  
  const [type, setType] = useState(initialType);
  const [filters, setFilters] = useState({
    searchTerm: initialFilters.searchTerm || '',
    statusFilter: initialFilters.statusFilter || 'all', // 'all', 'active', 'inactive'
    countryFilter: initialFilters.countryFilter || '',
  });
  const [sortBy, setSortBy] = useState(initialFilters.sortBy || 'name');
  const [sortDirection, setSortDirection] = useState(initialFilters.sortDirection || 'asc');
  const [page, setPage] = useState(initialFilters.page || 1);
  const [pageSize, setPageSize] = useState(initialFilters.pageSize || 10);

  const fetchThirdParties = useCallback(async () => {
    if (!currentEnterpriseId) {
      setThirdParties([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, count, error: fetchError } = await thirdPartiesService.getThirdParties(currentEnterpriseId, {
        type,
        searchTerm: filters.searchTerm,
        statusFilter: filters.statusFilter,
        countryFilter: filters.countryFilter,
        sortBy,
        sortDirection,
        page,
        pageSize,
      });
      if (fetchError) throw fetchError;
      setThirdParties(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      setError(err);
      setThirdParties([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentEnterpriseId, type, filters, sortBy, sortDirection, page, pageSize]);

  useEffect(() => {
    fetchThirdParties();
  }, [fetchThirdParties]);

  const refreshThirdParties = () => {
    fetchThirdParties();
  };
  
  const updatePage = (newPage) => {
    setPage(newPage);
  };

  const updatePageSize = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1); 
  };
  
  const updateSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('asc');
    }
    setPage(1);
  };

  const updateFilter = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setPage(1);
  };

  return {
    thirdParties,
    loading,
    error,
    totalCount,
    page,
    pageSize,
    sortBy,
    sortDirection,
    type,
    filters,
    setType: (newType) => { setType(newType); setPage(1); },
    updateFilter,
    refreshThirdParties,
    updatePage,
    updatePageSize,
    updateSort,
  };
};