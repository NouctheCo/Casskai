import { supabase } from '@/lib/supabase';

export const journalsService = {
  getJournals: async (currentEnterpriseId) => {
    if (!currentEnterpriseId) return { data: [], error: null };
    
    return await supabase
      .from('journals')
      .select('*')
      .eq('company_id', currentEnterpriseId)
      .order('code', { ascending: true });
  },

  createJournal: async (currentEnterpriseId, journalData) => {
    const dataWithCompany = { ...journalData, company_id: currentEnterpriseId };
    return await supabase.from('journals').insert(dataWithCompany).select();
  },

  updateJournal: async (journalId, journalData) => {
    return await supabase.from('journals').update(journalData).eq('id', journalId).select();
  },

  createDefaultJournals: async (currentEnterpriseId, defaultJournals) => {
    const journalsWithCompany = defaultJournals.map(journal => ({
      ...journal,
      company_id: currentEnterpriseId
    }));
    
    return await supabase.from('journals').insert(journalsWithCompany);
  },

  getJournalsList: async (currentEnterpriseId) => {
    if (!currentEnterpriseId) return [];
    
    const { data, error } = await supabase
      .from('journals')
      .select('id, code, name')
      .eq('company_id', currentEnterpriseId)
      .eq('is_active', true)
      .order('code');
    
    if (error) throw error;
    return data || [];
  }
};