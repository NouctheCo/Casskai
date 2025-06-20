import { supabase } from '@/lib/supabase';
import { formatDateForSQL, getAccountType, getAccountClass, getJournalType } from '@/lib/fecUtils';

/**
 * Service pour gérer l'import des fichiers FEC (Fichier des Écritures Comptables)
 */
export const fecImportService = {
  /**
   * Importe les données FEC dans la base de données
   * @param {Object} data - Les données FEC parsées
   * @param {string} companyId - L'ID de l'entreprise
   * @returns {Promise<Object>} - Le résultat de l'import
   */
  async importFECData(data, companyId) {
    try {
      // 1. Créer les journaux manquants
      const journalsResult = await this.createMissingJournals(data.journals, companyId);
      
      // 2. Créer les comptes manquants
      const accountsResult = await this.createMissingAccounts(data.accounts, companyId);
      
      // 3. Créer les écritures comptables
      const entriesResult = await this.createJournalEntries(data.entriesByJournalAndNum, companyId);
      
      return {
        success: true,
        journals: journalsResult,
        accounts: accountsResult,
        entries: entriesResult,
        summary: {
          journalsCreated: journalsResult.created,
          journalsExisting: journalsResult.existing,
          accountsCreated: accountsResult.created,
          accountsExisting: accountsResult.existing,
          entriesCreated: entriesResult.created,
          entriesWithErrors: entriesResult.errors.length,
          errors: entriesResult.errors
        }
      };
    } catch (error) {
      console.error('Erreur lors de l\'import FEC:', error);
      return {
        success: false,
        error: error.message || 'Une erreur est survenue lors de l\'importation'
      };
    }
  },
  
  /**
   * Crée les journaux manquants dans la base de données
   * @param {Array} journalCodes - Les codes des journaux à créer
   * @param {string} companyId - L'ID de l'entreprise
   * @returns {Promise<Object>} - Le résultat de la création
   */
  async createMissingJournals(journalCodes, companyId) {
    try {
      // 1. Récupérer les journaux existants
      const { data: existingJournals, error: fetchError } = await supabase
        .from('journals')
        .select('code')
        .eq('company_id', companyId);
      
      if (fetchError) throw fetchError;
      
      const existingCodes = new Set(existingJournals.map(j => j.code));
      const journalsToCreate = [];
      
      // 2. Identifier les journaux à créer
      for (const code of journalCodes) {
        if (!existingCodes.has(code)) {
          const type = getJournalType(code);
          let name = '';
          
          switch (type) {
            case 'OPENING':
              name = 'Journal des à-nouveaux';
              break;
            case 'VENTE':
              name = 'Journal des ventes';
              break;
            case 'ACHAT':
              name = 'Journal des achats';
              break;
            case 'BANQUE':
              name = `Journal de banque ${code.replace('BQ', '')}`;
              break;
            case 'CAISSE':
              name = 'Journal de caisse';
              break;
            case 'OD':
              name = 'Opérations diverses';
              break;
            case 'REVERSAL':
              name = 'Journal d\'extourne';
              break;
            default:
              name = `Journal ${code}`;
          }
          
          journalsToCreate.push({
            company_id: companyId,
            code,
            name,
            type,
            description: `Journal importé depuis FEC - ${name}`,
            is_active: true,
            imported_from_fec: true
          });
        }
      }
      
      // 3. Créer les journaux manquants
      if (journalsToCreate.length > 0) {
        const { data: createdJournals, error: insertError } = await supabase
          .from('journals')
          .insert(journalsToCreate)
          .select();
        
        if (insertError) throw insertError;
        
        return {
          created: journalsToCreate.length,
          existing: existingCodes.size,
          journals: createdJournals
        };
      }
      
      return {
        created: 0,
        existing: existingCodes.size,
        journals: []
      };
    } catch (error) {
      console.error('Erreur lors de la création des journaux:', error);
      throw error;
    }
  },
  
  /**
   * Crée les comptes manquants dans la base de données
   * @param {Array} accountsData - Les comptes à créer
   * @param {string} companyId - L'ID de l'entreprise
   * @returns {Promise<Object>} - Le résultat de la création
   */
  async createMissingAccounts(accountsData, companyId) {
    try {
      // 1. Récupérer les comptes existants
      const { data: existingAccounts, error: fetchError } = await supabase
        .from('accounts')
        .select('account_number')
        .eq('company_id', companyId);
      
      if (fetchError) throw fetchError;
      
      const existingAccountNumbers = new Set(existingAccounts.map(a => a.account_number));
      const accountsToCreate = [];
      
      // 2. Identifier les comptes à créer
      for (const [accountNumber, accountInfo] of accountsData) {
        if (!existingAccountNumbers.has(accountNumber)) {
          const type = getAccountType(accountNumber);
          const accountClass = getAccountClass(accountNumber);
          
          accountsToCreate.push({
            company_id: companyId,
            account_number: accountNumber,
            name: accountInfo.libelle || `Compte ${accountNumber}`,
            type,
            class: accountClass,
            description: `Compte importé depuis FEC - ${accountInfo.libelle || accountNumber}`,
            is_active: true,
            currency: 'EUR', // Par défaut
            balance: 0,
            imported_from_fec: true
          });
        }
      }
      
      // 3. Créer les comptes manquants
      if (accountsToCreate.length > 0) {
        const { data: createdAccounts, error: insertError } = await supabase
          .from('accounts')
          .insert(accountsToCreate)
          .select();
        
        if (insertError) throw insertError;
        
        return {
          created: accountsToCreate.length,
          existing: existingAccountNumbers.size,
          accounts: createdAccounts
        };
      }
      
      return {
        created: 0,
        existing: existingAccountNumbers.size,
        accounts: []
      };
    } catch (error) {
      console.error('Erreur lors de la création des comptes:', error);
      throw error;
    }
  },
  
  /**
   * Crée les écritures comptables dans la base de données
   * @param {Array} entriesByJournalAndNum - Les écritures regroupées par journal et numéro
   * @param {string} companyId - L'ID de l'entreprise
   * @returns {Promise<Object>} - Le résultat de la création
   */
  async createJournalEntries(entriesByJournalAndNum, companyId) {
    try {
      // 1. Récupérer les journaux et les comptes pour faire la correspondance
      const { data: journals, error: journalsError } = await supabase
        .from('journals')
        .select('id, code')
        .eq('company_id', companyId);
      
      if (journalsError) throw journalsError;
      
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('id, account_number')
        .eq('company_id', companyId);
      
      if (accountsError) throw accountsError;
      
      // Créer des maps pour faciliter la recherche
      const journalMap = new Map(journals.map(j => [j.code, j.id]));
      const accountMap = new Map(accounts.map(a => [a.account_number, a.id]));
      
      // 2. Préparer les écritures à créer
      const journalEntriesToCreate = [];
      const journalEntryItemsToCreate = [];
      const errors = [];
      
      for (const [key, entriesGroup] of entriesByJournalAndNum) {
        if (entriesGroup.length === 0) continue;
        
        const [journalCode, ecritureNum] = key.split('-');
        const journalId = journalMap.get(journalCode);
        
        if (!journalId) {
          errors.push({
            key,
            message: `Journal with code ${journalCode} not found in the database.`
          });
          continue;
        }
        
        // Prendre les informations de la première entrée du groupe
        const firstEntry = entriesGroup[0];
        const entryDate = formatDateForSQL(firstEntry.EcritureDate);
        
        // Créer l'entrée de journal
        const journalEntry = {
          company_id: companyId,
          journal_id: journalId,
          entry_date: entryDate,
          description: firstEntry.EcritureLib || `Écriture ${ecritureNum}`,
          reference_number: firstEntry.PieceRef || ecritureNum,
          status: 'imported',
          imported_from_fec: true,
          fec_journal_code: journalCode,
          fec_entry_num: ecritureNum,
          original_fec_data: JSON.stringify(entriesGroup)
        };
        
        journalEntriesToCreate.push(journalEntry);
      }
      
      // 3. Insérer les écritures de journal
      let createdEntries = [];
      if (journalEntriesToCreate.length > 0) {
        const { data: insertedEntries, error: insertError } = await supabase
          .from('journal_entries')
          .insert(journalEntriesToCreate)
          .select();
        
        if (insertError) throw insertError;
        createdEntries = insertedEntries;
      }
      
      // 4. Préparer les lignes d'écritures
      const entryMap = new Map();
      for (let i = 0; i < journalEntriesToCreate.length; i++) {
        const key = `${journalEntriesToCreate[i].fec_journal_code}-${journalEntriesToCreate[i].fec_entry_num}`;
        if (createdEntries[i]) {
          entryMap.set(key, createdEntries[i].id);
        }
      }
      
      for (const [key, entriesGroup] of entriesByJournalAndNum) {
        const journalEntryId = entryMap.get(key);
        
        if (!journalEntryId) {
          errors.push({
            key,
            message: `Failed to find created journal entry for ${key}.`
          });
          continue;
        }
        
        // Créer les lignes d'écriture
        for (const entry of entriesGroup) {
          const accountId = accountMap.get(entry.CompteNum);
          
          if (!accountId) {
            errors.push({
              key,
              message: `Account with number ${entry.CompteNum} not found in the database.`
            });
            continue;
          }
          
          journalEntryItemsToCreate.push({
            journal_entry_id: journalEntryId,
            company_id: companyId,
            account_id: accountId,
            debit_amount: entry.Debit || 0,
            credit_amount: entry.Credit || 0,
            currency: 'EUR', // Par défaut
            description: entry.EcritureLib || ''
          });
        }
      }
      
      // 5. Insérer les lignes d'écritures
      if (journalEntryItemsToCreate.length > 0) {
        // Insérer par lots de 100 pour éviter les problèmes de taille de requête
        const batchSize = 100;
        for (let i = 0; i < journalEntryItemsToCreate.length; i += batchSize) {
          const batch = journalEntryItemsToCreate.slice(i, i + batchSize);
          const { error: itemsError } = await supabase
            .from('journal_entry_items')
            .insert(batch);
          
          if (itemsError) {
            errors.push({
              message: `Error inserting batch of journal entry items: ${itemsError.message}`
            });
          }
        }
      }
      
      return {
        created: createdEntries.length,
        itemsCreated: journalEntryItemsToCreate.length,
        errors
      };
    } catch (error) {
      console.error('Erreur lors de la création des écritures:', error);
      throw error;
    }
  }
};