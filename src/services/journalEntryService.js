// src/services/journalEntryService.js
import { supabase } from '@/lib/supabase';

export const journalEntryService = {
  // Créer une écriture comptable avec validation automatique
  createJournalEntry: async (entryData) => {
    const { items, ...entryFields } = entryData;
    
    try {
      // 1. Validation de l'équilibre débit/crédit
      const totalDebit = items.reduce((sum, item) => sum + (parseFloat(item.debit_amount) || 0), 0);
      const totalCredit = items.reduce((sum, item) => sum + (parseFloat(item.credit_amount) || 0), 0);
      
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return { 
          data: null, 
          error: new Error(`Entry is not balanced: Debit ${totalDebit} ≠ Credit ${totalCredit}`) 
        };
      }

      // 2. Générer automatiquement le numéro d'écriture si non fourni
      if (!entryFields.entry_number) {
        if (entryFields.journal_id) {
          const { data: entryNumber } = await supabase.rpc('get_next_journal_entry_number', {
            p_company_id: entryFields.company_id,
            p_journal_id: entryFields.journal_id
          });
          entryFields.entry_number = entryNumber;
        } else {
          const { data: entryNumber } = await supabase.rpc('get_next_journal_entry_number', {
            p_company_id: entryFields.company_id
          });
          entryFields.entry_number = entryNumber;
        }
      }

      // 3. Créer l'écriture principale
      const { data: entry, error: entryError } = await supabase
        .from('journal_entries')
        .insert({
          ...entryFields,
          status: entryFields.status || 'draft'
        })
        .select()
        .single();
      
      if (entryError) throw entryError;

      // 4. Créer les lignes d'écriture
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

      // 5. Les soldes des comptes sont mis à jour automatiquement par les triggers

      return { data: entry, error: null };
    } catch (error) {
      console.error('Error creating journal entry:', error);
      return { data: null, error };
    }
  },

  // Mettre à jour une écriture comptable
  updateJournalEntry: async (entryId, entryData) => {
    const { items, ...entryFields } = entryData;
    
    try {
      // 1. Validation de l'équilibre débit/crédit
      const totalDebit = items.reduce((sum, item) => sum + (parseFloat(item.debit_amount) || 0), 0);
      const totalCredit = items.reduce((sum, item) => sum + (parseFloat(item.credit_amount) || 0), 0);
      
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return { 
          data: null, 
          error: new Error(`Entry is not balanced: Debit ${totalDebit} ≠ Credit ${totalCredit}`) 
        };
      }

      // 2. Vérifier que l'écriture peut être modifiée
      const { data: existingEntry, error: fetchError } = await supabase
        .from('journal_entries')
        .select('status')
        .eq('id', entryId)
        .single();

      if (fetchError) throw fetchError;

      if (existingEntry.status === 'locked') {
        return { 
          data: null, 
          error: new Error('Cannot modify a locked journal entry') 
        };
      }

      // 3. Mettre à jour l'écriture principale
      const { data: entry, error: entryError } = await supabase
        .from('journal_entries')
        .update({
          ...entryFields,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId)
        .select()
        .single();
      
      if (entryError) throw entryError;

      // 4. Supprimer les anciennes lignes
      const { error: deleteError } = await supabase
        .from('journal_entry_items')
        .delete()
        .eq('journal_entry_id', entryId);

      if (deleteError) throw deleteError;

      // 5. Créer les nouvelles lignes
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

      // 6. Les soldes des comptes sont mis à jour automatiquement par les triggers

      return { data: entry, error: null };
    } catch (error) {
      console.error('Error updating journal entry:', error);
      return { data: null, error };
    }
  },

  // Supprimer une écriture comptable
  deleteJournalEntry: async (entryId) => {
    try {
      // 1. Vérifier que l'écriture peut être supprimée
      const { data: entry, error: fetchError } = await supabase
        .from('journal_entries')
        .select('status, company_id')
        .eq('id', entryId)
        .single();

      if (fetchError) throw fetchError;

      if (entry.status === 'locked') {
        return { 
          data: null, 
          error: new Error('Cannot delete a locked journal entry') 
        };
      }

      // 2. Supprimer les lignes d'écriture (les triggers mettront à jour les soldes)
      const { error: itemsError } = await supabase
        .from('journal_entry_items')
        .delete()
        .eq('journal_entry_id', entryId);

      if (itemsError) throw itemsError;

      // 3. Supprimer l'écriture principale
      const { data, error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      return { data: null, error };
    }
  },

  // Récupérer les écritures avec filtres et pagination
  getJournalEntries: async (currentEnterpriseId, filters = {}) => {
    if (!currentEnterpriseId) return { data: [], count: 0, error: null };
    
    try {
      const {
        page = 1,
        limit = 20,
        dateRange = {},
        journalId = null,
        accountId = null,
        reference = '',
        description = '',
        status = null,
        sortBy = 'entry_date',
        sortOrder = 'desc'
      } = filters;

      let query = supabase
        .from('journal_entries')
        .select(`
          *,
          journals (id, code, name),
          journal_entry_items (
            id, account_id, description, debit_amount, credit_amount, currency,
            accounts (id, account_number, name, type, class)
          )
        `, { count: 'exact' })
        .eq('company_id', currentEnterpriseId);

      // Filtres
      if (dateRange.from) {
        query = query.gte('entry_date', dateRange.from);
      }
      if (dateRange.to) {
        query = query.lte('entry_date', dateRange.to);
      }
      if (journalId) {
        query = query.eq('journal_id', journalId);
      }
      if (reference) {
        query = query.ilike('reference_number', `%${reference}%`);
      }
      if (description) {
        query = query.ilike('description', `%${description}%`);
      }
      if (status) {
        query = query.eq('status', status);
      }

      // Filtre par compte (nécessite une sous-requête)
      if (accountId) {
        const { data: entriesWithAccount } = await supabase
          .from('journal_entry_items')
          .select('journal_entry_id')
          .eq('account_id', accountId)
          .eq('company_id', currentEnterpriseId);
        
        if (entriesWithAccount?.length > 0) {
          const entryIds = entriesWithAccount.map(item => item.journal_entry_id);
          query = query.in('id', entryIds);
        } else {
          return { data: [], count: 0, error: null };
        }
      }

      // Tri
      const ascending = sortOrder === 'asc';
      query = query.order(sortBy, { ascending });

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const result = await query;
      
      return {
        data: result.data || [],
        count: result.count || 0,
        error: result.error
      };
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      return { data: [], count: 0, error };
    }
  },

  // Récupérer une écriture spécifique avec ses lignes
  getJournalEntryById: async (entryId) => {
    if (!entryId) {
      return { data: null, error: new Error('Entry ID is required') };
    }

    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select(`
          *,
          journals (id, code, name, type),
          journal_entry_items (
            id, account_id, description, debit_amount, credit_amount, currency,
            accounts (id, account_number, name, type, class, balance)
          )
        `)
        .eq('id', entryId)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching journal entry:', error);
      return { data: null, error };
    }
  },

  // Verrouiller/déverrouiller une écriture
  lockJournalEntry: async (entryId, isLocked = true) => {
    if (!entryId) {
      return { data: null, error: new Error('Entry ID is required') };
    }

    try {
      const status = isLocked ? 'locked' : 'draft';
      
      const { data, error } = await supabase
        .from('journal_entries')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error locking/unlocking journal entry:', error);
      return { data: null, error };
    }
  },

  // Dupliquer une écriture
  duplicateJournalEntry: async (entryId, newEntryDate = null) => {
    if (!entryId) {
      return { data: null, error: new Error('Entry ID is required') };
    }

    try {
      // 1. Récupérer l'écriture source
      const { data: sourceEntry, error: fetchError } = await supabase
        .from('journal_entries')
        .select(`
          *,
          journal_entry_items (*)
        `)
        .eq('id', entryId)
        .single();

      if (fetchError) throw fetchError;

      // 2. Préparer les données pour la nouvelle écriture
      const newEntryData = {
        company_id: sourceEntry.company_id,
        journal_id: sourceEntry.journal_id,
        entry_date: newEntryDate || new Date().toISOString().split('T')[0],
        description: `Copie de ${sourceEntry.description}`,
        reference_number: `${sourceEntry.reference_number || ''}-COPY`,
        status: 'draft'
      };

      // 3. Créer la nouvelle écriture
      const result = await journalEntryService.createJournalEntry({
        ...newEntryData,
        items: sourceEntry.journal_entry_items.map(item => ({
          account_id: item.account_id,
          debit_amount: item.debit_amount,
          credit_amount: item.credit_amount,
          currency: item.currency,
          description: item.description
        }))
      });

      return result;
    } catch (error) {
      console.error('Error duplicating journal entry:', error);
      return { data: null, error };
    }
  },

  // Valider l'équilibre d'une écriture
  validateJournalEntryBalance: async (entryId) => {
    if (!entryId) {
      return { isValid: false, error: new Error('Entry ID is required') };
    }

    try {
      const { data, error } = await supabase.rpc('validate_journal_entry_balance', {
        p_journal_entry_id: entryId
      });

      if (error) throw error;

      return { isValid: data, error: null };
    } catch (error) {
      console.error('Error validating journal entry balance:', error);
      return { isValid: false, error };
    }
  },

  // Supprimer toutes les écritures d'une entreprise (pour remise à zéro)
  deleteAllJournalEntries: async (companyId) => {
    if (!companyId) {
      return { success: false, error: new Error('Company ID is required') };
    }

    try {
      // 1. Supprimer les lignes d'écriture (les triggers mettront à jour les soldes)
      const { error: itemsError } = await supabase
        .from('journal_entry_items')
        .delete()
        .eq('company_id', companyId);
      
      if (itemsError) throw itemsError;
      
      // 2. Supprimer les écritures principales
      const { error: entriesError } = await supabase
        .from('journal_entries')
        .delete()
        .eq('company_id', companyId);
      
      if (entriesError) throw entriesError;
      
      // 3. Remettre à zéro les soldes des comptes
      const { error: resetError } = await supabase
        .from('accounts')
        .update({ balance: 0 })
        .eq('company_id', companyId);
        
      if (resetError) throw resetError;

      // 4. Remettre à zéro les compteurs des journaux
      const { error: journalsError } = await supabase
        .from('journals')
        .update({ last_entry_number: 0 })
        .eq('company_id', companyId);
        
      if (journalsError) throw journalsError;
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting all journal entries:', error);
      return { success: false, error };
    }
  },

  // Obtenir les statistiques des écritures
  getJournalEntriesStats: async (currentEnterpriseId, options = {}) => {
    if (!currentEnterpriseId) {
      return { data: null, error: new Error('Company ID is required') };
    }

    const { startDate = null, endDate = null } = options;

    try {
      let query = supabase
        .from('journal_entries')
        .select(`
          status,
          journal_entry_items!inner(debit_amount, credit_amount)
        `)
        .eq('company_id', currentEnterpriseId);

      if (startDate) {
        query = query.gte('entry_date', startDate);
      }
      if (endDate) {
        query = query.lte('entry_date', endDate);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      const stats = {
        total_entries: data.length,
        by_status: {},
        total_amount: 0,
        period: { start: startDate, end: endDate }
      };

      data.forEach(entry => {
        // Compter par statut
        if (!stats.by_status[entry.status]) {
          stats.by_status[entry.status] = 0;
        }
        stats.by_status[entry.status]++;

        // Calculer le montant total (on prend le débit car débit = crédit)
        const entryAmount = entry.journal_entry_items.reduce(
          (sum, item) => sum + (item.debit_amount || 0), 0
        );
        stats.total_amount += entryAmount;
      });

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error getting journal entries stats:', error);
      return { data: null, error };
    }
  },

  // Obtenir la liste des comptes (pour les sélecteurs)
  getAccountsList: async (currentEnterpriseId) => {
    if (!currentEnterpriseId) return [];
    
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, account_number, name, balance, type, class')
        .eq('company_id', currentEnterpriseId)
        .eq('is_active', true)
        .order('account_number');
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching accounts list:', error);
      return [];
    }
  },

  // Obtenir la liste des journaux (pour les sélecteurs)
  getJournalsList: async (currentEnterpriseId) => {
    if (!currentEnterpriseId) return [];
    
    try {
      const { data, error } = await supabase
        .from('journals')
        .select('id, code, name, type')
        .eq('company_id', currentEnterpriseId)
        .eq('is_active', true)
        .order('code');
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching journals list:', error);
      return [];
    }
  }
};
