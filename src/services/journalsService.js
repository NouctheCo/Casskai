// src/services/journalsService.js
import { supabase } from '../lib/supabase';

export const journalsService = {
  // Récupérer tous les journaux d'une entreprise
  getJournals: async (currentEnterpriseId, options = {}) => {
    if (!currentEnterpriseId) return { data: [], error: null, count: 0 };
    
    const { 
      isActive = true, 
      type = null,
      searchTerm = '',
      sortBy = 'code',
      sortOrder = 'asc'
    } = options;

    try {
      let query = supabase
        .from('journals')
        .select('*', { count: 'exact' })
        .eq('company_id', currentEnterpriseId);

      // Filtrer par statut actif
      if (isActive !== null) {
        query = query.eq('is_active', isActive);
      }

      // Filtrer par type de journal
      if (type) {
        query = query.eq('type', type);
      }

      // Recherche dans le code et le nom
      if (searchTerm) {
        query = query.or(`code.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`);
      }

      // Tri
      const ascending = sortOrder === 'asc';
      query = query.order(sortBy, { ascending });

      const result = await query;
      
      return {
        data: result.data || [],
        error: result.error,
        count: result.count || 0
      };
    } catch (error) {
      console.error('Error fetching journals:', error);
      return { data: [], error, count: 0 };
    }
  },

  // Créer un nouveau journal
  createJournal: async (currentEnterpriseId, journalData) => {
    if (!currentEnterpriseId) {
      return { data: null, error: new Error('Company ID is required') };
    }

    try {
      // Vérifier si le code journal existe déjà
      const { data: existingJournal } = await supabase
        .from('journals')
        .select('id')
        .eq('company_id', currentEnterpriseId)
        .eq('code', journalData.code)
        .single();

      if (existingJournal) {
        return { 
          data: null, 
          error: new Error(`Journal with code "${journalData.code}" already exists`) 
        };
      }

      // Préparer les données avec valeurs par défaut
      const dataWithDefaults = {
        company_id: currentEnterpriseId,
        code: journalData.code.toUpperCase(),
        name: journalData.name,
        type: journalData.type,
        description: journalData.description || null,
        is_active: journalData.is_active !== undefined ? journalData.is_active : true,
        last_entry_number: 0
      };

      const result = await supabase
        .from('journals')
        .insert(dataWithDefaults)
        .select()
        .single();

      return result;
    } catch (error) {
      console.error('Error creating journal:', error);
      return { data: null, error };
    }
  },

  // Mettre à jour un journal
  updateJournal: async (journalId, journalData) => {
    if (!journalId) {
      return { data: null, error: new Error('Journal ID is required') };
    }

    try {
      // Nettoyer les données (enlever les champs non modifiables)
      const { id, company_id, created_at, updated_at, last_entry_number, ...updateData } = journalData;
      
      // Mettre à jour automatiquement le timestamp
      updateData.updated_at = new Date().toISOString();

      // S'assurer que le code est en majuscules
      if (updateData.code) {
        updateData.code = updateData.code.toUpperCase();
      }

      const result = await supabase
        .from('journals')
        .update(updateData)
        .eq('id', journalId)
        .select()
        .single();

      return result;
    } catch (error) {
      console.error('Error updating journal:', error);
      return { data: null, error };
    }
  },

  // Supprimer un journal (soft delete si des écritures existent)
  deleteJournal: async (journalId) => {
    if (!journalId) {
      return { data: null, error: new Error('Journal ID is required') };
    }

    try {
      // Vérifier s'il y a des écritures liées
      const { count, error: checkError } = await supabase
        .from('journal_entries')
        .select('id', { count: 'exact', head: true })
        .eq('journal_id', journalId);

      if (checkError) throw checkError;

      if (count > 0) {
        // Si des écritures existent, désactiver au lieu de supprimer
        return await supabase
          .from('journals')
          .update({ 
            is_active: false, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', journalId)
          .select()
          .single();
      } else {
        // Sinon, supprimer définitivement
        return await supabase
          .from('journals')
          .delete()
          .eq('id', journalId)
          .select()
          .single();
      }
    } catch (error) {
      console.error('Error deleting journal:', error);
      return { data: null, error };
    }
  },

  // Créer les journaux par défaut pour une entreprise
  createDefaultJournals: async (currentEnterpriseId, defaultJournals) => {
    if (!currentEnterpriseId || !defaultJournals?.length) {
      return { data: null, error: new Error('Company ID and journals data are required') };
    }

    try {
      // Vérifier s'il y a déjà des journaux
      const { count, error: countError } = await supabase
        .from('journals')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', currentEnterpriseId);

      if (countError) throw countError;

      if (count > 0) {
        return { 
          data: null, 
          error: new Error('Journals already exist. Use individual journal creation instead.') 
        };
      }

      // Préparer les journaux avec les données de l'entreprise
      const journalsWithCompany = defaultJournals.map(journal => ({
        company_id: currentEnterpriseId,
        code: journal.code.toUpperCase(),
        name: journal.name,
        type: journal.type,
        description: journal.description || null,
        is_active: true,
        last_entry_number: 0
      }));

      const result = await supabase
        .from('journals')
        .insert(journalsWithCompany)
        .select();

      return result;
    } catch (error) {
      console.error('Error creating default journals:', error);
      return { data: null, error };
    }
  },

  // Obtenir la liste simple des journaux (pour les sélecteurs)
  getJournalsList: async (currentEnterpriseId, options = {}) => {
    if (!currentEnterpriseId) return [];
    
    const { isActive = true, type = null } = options;

    try {
      let query = supabase
        .from('journals')
        .select('id, code, name, type')
        .eq('company_id', currentEnterpriseId)
        .eq('is_active', isActive)
        .order('code');

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching journals list:', error);
      return [];
    }
  },

  // Récupérer un journal par son code
  getJournalByCode: async (currentEnterpriseId, journalCode) => {
    if (!currentEnterpriseId || !journalCode) {
      return { data: null, error: new Error('Company ID and journal code are required') };
    }

    try {
      const result = await supabase
        .from('journals')
        .select('*')
        .eq('company_id', currentEnterpriseId)
        .eq('code', journalCode.toUpperCase())
        .single();

      return result;
    } catch (error) {
      console.error('Error fetching journal by code:', error);
      return { data: null, error };
    }
  },

  // Obtenir le prochain numéro d'écriture pour un journal
  getNextEntryNumber: async (journalId) => {
    if (!journalId) {
      return { data: null, error: new Error('Journal ID is required') };
    }

    try {
      // Utiliser la fonction SQL pour générer le numéro automatiquement
      const { data, error } = await supabase.rpc('get_next_journal_entry_number', {
        p_journal_id: journalId
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error getting next entry number:', error);
      return { data: null, error };
    }
  },

  // Obtenir les statistiques d'un journal
  getJournalStats: async (journalId, options = {}) => {
    if (!journalId) {
      return { data: null, error: new Error('Journal ID is required') };
    }

    const { startDate = null, endDate = null } = options;

    try {
      let query = supabase
        .from('journal_entries')
        .select(`
          id,
          entry_date,
          journal_entry_items!inner(debit_amount, credit_amount)
        `)
        .eq('journal_id', journalId);

      if (startDate) {
        query = query.gte('entry_date', startDate);
      }
      if (endDate) {
        query = query.lte('entry_date', endDate);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Calculer les statistiques
      const stats = {
        total_entries: data.length,
        total_debit: 0,
        total_credit: 0,
        period: { start: startDate, end: endDate }
      };

      data.forEach(entry => {
        entry.journal_entry_items.forEach(item => {
          stats.total_debit += item.debit_amount || 0;
          stats.total_credit += item.credit_amount || 0;
        });
      });

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error getting journal stats:', error);
      return { data: null, error };
    }
  },

  // Vérifier si un code journal existe déjà
  checkJournalCodeExists: async (currentEnterpriseId, journalCode, excludeId = null) => {
    if (!currentEnterpriseId || !journalCode) {
      return { exists: false, error: new Error('Company ID and journal code are required') };
    }

    try {
      let query = supabase
        .from('journals')
        .select('id')
        .eq('company_id', currentEnterpriseId)
        .eq('code', journalCode.toUpperCase());

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
      console.error('Error checking journal code:', error);
      return { exists: false, error };
    }
  },

  // Obtenir les journaux par type
  getJournalsByType: async (currentEnterpriseId, type) => {
    if (!currentEnterpriseId || !type) {
      return { data: [], error: new Error('Company ID and type are required') };
    }

    try {
      const { data, error } = await supabase
        .from('journals')
        .select('*')
        .eq('company_id', currentEnterpriseId)
        .eq('type', type)
        .eq('is_active', true)
        .order('code');

      if (error) throw error;
      
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching journals by type:', error);
      return { data: [], error };
    }
  },

  // Activer/désactiver un journal
  toggleJournalStatus: async (journalId, isActive) => {
    if (!journalId) {
      return { data: null, error: new Error('Journal ID is required') };
    }

    try {
      // Vérifier s'il y a des écritures en cours si on veut désactiver
      if (!isActive) {
        const { count, error: checkError } = await supabase
          .from('journal_entries')
          .select('id', { count: 'exact', head: true })
          .eq('journal_id', journalId)
          .eq('status', 'draft');

        if (checkError) throw checkError;

        if (count > 0) {
          return { 
            data: null, 
            error: new Error('Cannot deactivate journal with draft entries') 
          };
        }
      }

      const result = await supabase
        .from('journals')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', journalId)
        .select()
        .single();

      return result;
    } catch (error) {
      console.error('Error toggling journal status:', error);
      return { data: null, error };
    }
  },

  // Dupliquer un journal
  duplicateJournal: async (journalId, newCode, newName) => {
    if (!journalId || !newCode || !newName) {
      return { data: null, error: new Error('Journal ID, new code and new name are required') };
    }

    try {
      // Récupérer le journal source
      const { data: sourceJournal, error: fetchError } = await supabase
        .from('journals')
        .select('*')
        .eq('id', journalId)
        .single();

      if (fetchError) throw fetchError;

      // Vérifier que le nouveau code n'existe pas
      const { exists } = await journalsService.checkJournalCodeExists(
        sourceJournal.company_id, 
        newCode
      );

      if (exists) {
        return { 
          data: null, 
          error: new Error(`Journal with code "${newCode}" already exists`) 
        };
      }

      // Créer le nouveau journal
      const newJournalData = {
        company_id: sourceJournal.company_id,
        code: newCode.toUpperCase(),
        name: newName,
        type: sourceJournal.type,
        description: sourceJournal.description,
        is_active: true,
        last_entry_number: 0
      };

      const result = await supabase
        .from('journals')
        .insert(newJournalData)
        .select()
        .single();

      return result;
    } catch (error) {
      console.error('Error duplicating journal:', error);
      return { data: null, error };
    }
  },

  // Obtenir le résumé des journaux pour une entreprise
  getJournalsSummary: async (currentEnterpriseId) => {
    if (!currentEnterpriseId) {
      return { data: null, error: new Error('Company ID is required') };
    }

    try {
      const { data, error } = await supabase
        .from('journals')
        .select('type, is_active')
        .eq('company_id', currentEnterpriseId);

      if (error) throw error;

      const summary = {
        total: data.length,
        active: data.filter(j => j.is_active).length,
        inactive: data.filter(j => !j.is_active).length,
        by_type: {}
      };

      // Grouper par type
      data.forEach(journal => {
        if (!summary.by_type[journal.type]) {
          summary.by_type[journal.type] = { 
            total: 0, 
            active: 0, 
            inactive: 0 
          };
        }
        summary.by_type[journal.type].total++;
        if (journal.is_active) {
          summary.by_type[journal.type].active++;
        } else {
          summary.by_type[journal.type].inactive++;
        }
      });

      return { data: summary, error: null };
    } catch (error) {
      console.error('Error getting journals summary:', error);
      return { data: null, error };
    }
  }
};
