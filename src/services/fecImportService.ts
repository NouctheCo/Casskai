import { supabase, getCurrentCompany } from '../lib/supabase';
import { FECParser } from './fecParser';
import type { ImportResult, FECEntry } from '../types/accounting-import.types';

interface ImportSummary {
  journalsCreated: number;
  journalsExisting: number;
  accountsCreated: number;
  accountsExisting: number;
  entriesCreated: number;
  entriesWithErrors: number;
  errors: any[];
}

interface DatabaseImportResult {
  success: boolean;
  summary?: ImportSummary;
  error?: string;
}

/**
 * Service pour gérer l'import des fichiers FEC (Fichier des Écritures Comptables)
 */
export const fecImportService = {
  /**
   * Parse et importe un fichier FEC complet
   */
  async parseAndImportFEC(file: File, companyId?: string): Promise<DatabaseImportResult> {
    try {
      // 1. Parse le fichier FEC
      const parseResult = await FECParser.parseFEC(file);
      
      if (!parseResult.success || parseResult.entries.length === 0) {
        return {
          success: false,
          error: parseResult.errors.length > 0 
            ? parseResult.errors[0].message 
            : 'Aucune écriture valide trouvée'
        };
      }

      // 2. Obtenir l'entreprise courante si pas fournie
      const enterpriseId = companyId || await this.getCurrentEnterpriseId();
      if (!enterpriseId) {
        return {
          success: false,
          error: 'Aucune entreprise sélectionnée'
        };
      }

      // 3. Importer en base de données
      return await this.importParsedData(parseResult, enterpriseId);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Erreur lors du parsing et import FEC:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  },

  /**
   * Importe les données FEC parsées dans la base de données
   */
  async importParsedData(parseResult: ImportResult, companyId: string): Promise<DatabaseImportResult> {
    try {
      // Grouper les entrées par journal
      const journalCodes = [...new Set(parseResult.entries.map(e => e.journalCode))];
      
      // Grouper les comptes
      const accounts = new Map<string, { name: string; entries: FECEntry[] }>();
      parseResult.entries.forEach(entry => {
        if (!accounts.has(entry.accountNumber)) {
          accounts.set(entry.accountNumber, { name: entry.accountName, entries: [] });
        }
        accounts.get(entry.accountNumber)!.entries.push(entry);
      });

      // Grouper les écritures par journal et numéro
      const entriesByJournalAndNum = new Map<string, FECEntry[]>();
      parseResult.entries.forEach(entry => {
        const key = `${entry.journalCode}-${entry.entryNumber}`;
        if (!entriesByJournalAndNum.has(key)) {
          entriesByJournalAndNum.set(key, []);
        }
        entriesByJournalAndNum.get(key)!.push(entry);
      });

      // 1. Créer les journaux manquants
      const journalsResult = await this.createMissingJournals(journalCodes, companyId);
      
      // 2. Créer les comptes manquants
      const accountsResult = await this.createMissingAccounts(accounts, companyId);
      
      // 3. Créer les écritures comptables
      const entriesResult = await this.createJournalEntries(entriesByJournalAndNum, companyId);
      
      return {
        success: true,
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
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Erreur lors de l\'import FEC:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'importation'
      };
    }
  },

  /**
   * Obtient l'ID de l'entreprise courante
   */
  async getCurrentEnterpriseId(): Promise<string | null> {
    try {
      const company = await getCurrentCompany();
      return company ? (company as any).id : null;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Erreur lors de la récupération de l\'entreprise:', error);
      return null;
    }
  },

  /**
   * Importe les données FEC dans la base de données (ancienne interface pour compatibilité)
   */
  async importFECData(data: any, companyId: string): Promise<DatabaseImportResult> {
    try {
      // 1. Créer les journaux manquants
      const journalsResult = await this.createMissingJournals(data.journals, companyId);
      
      // 2. Créer les comptes manquants
      const accountsResult = await this.createMissingAccounts(data.accounts, companyId);
      
      // 3. Créer les écritures comptables
      const entriesResult = await this.createJournalEntries(data.entriesByJournalAndNum, companyId);
      
      return {
        success: true,
        entries: entriesResult,
        summary: {
          journalsCreated: (journalsResult as any).created,
          journalsExisting: (journalsResult as any).existing,
          accountsCreated: (accountsResult as any).created,
          accountsExisting: (accountsResult as any).existing,
          entriesCreated: entriesResult.created,
          entriesWithErrors: entriesResult.errors.length,
          errors: entriesResult.errors
        }
      } as any;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Erreur lors de l\'import FEC:', error);
      return {
        success: false,
        error: error.message || 'Une erreur est survenue lors de l\'importation'
      };
    }
  },
  
  /**
   * Utilitaire pour obtenir le type de journal basé sur le code
   */
  getJournalType(code: string): string {
    const upperCode = code.toUpperCase();
    if (upperCode.startsWith('AN')) return 'OPENING';
    if (upperCode.startsWith('VT') || upperCode.startsWith('VE')) return 'VENTE';
    if (upperCode.startsWith('AC') || upperCode.startsWith('AH')) return 'ACHAT';
    if (upperCode.startsWith('BQ') || upperCode.startsWith('BA')) return 'BANQUE';
    if (upperCode.startsWith('CA')) return 'CAISSE';
    if (upperCode.startsWith('EX')) return 'REVERSAL';
    return 'OD';
  },

  /**
   * Utilitaire pour obtenir le type de compte
   */
  getAccountType(accountNumber: string): string {
    const firstDigit = accountNumber.charAt(0);
    switch (firstDigit) {
      case '1': return 'CAPITAL';
      case '2': return 'IMMOBILIZATION';
      case '3': return 'STOCK';
      case '4': return 'THIRD_PARTY';
      case '5': return 'FINANCIAL';
      case '6': return 'CHARGE';
      case '7': return 'REVENUE';
      default: return 'OTHER';
    }
  },

  /**
   * Utilitaire pour obtenir la classe de compte
   */
  getAccountClass(accountNumber: string): string {
    return `CLASSE_${accountNumber.charAt(0)}`;
  },

  /**
   * Formate une date FEC (AAAAMMJJ) au format SQL
   */
  formatDateForSQL(fecDate: string): string {
    if (fecDate.length !== 8) return new Date().toISOString().split('T')[0];
    const year = fecDate.substring(0, 4);
    const month = fecDate.substring(4, 6);
    const day = fecDate.substring(6, 8);
    return `${year}-${month}-${day}`;
  },

  /**
   * Crée les journaux manquants dans la base de données
   */
  async createMissingJournals(journalCodes: string[], companyId: string) {
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
          const type = this.getJournalType(code);
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
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Erreur lors de la création des journaux:', error);
      throw error;
    }
  },
  
  /**
   * Crée les comptes manquants dans la base de données
   */
  async createMissingAccounts(accountsData: Map<string, { name: string; entries: FECEntry[] }>, companyId: string) {
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
          const type = this.getAccountType(accountNumber);
          const accountClass = this.getAccountClass(accountNumber);
          
          accountsToCreate.push({
            company_id: companyId,
            account_number: accountNumber,
            name: accountInfo.name || `Compte ${accountNumber}`,
            type,
            class: accountClass,
            description: `Compte importé depuis FEC - ${accountInfo.name || accountNumber}`,
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
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Erreur lors de la création des comptes:', error);
      throw error;
    }
  },
  
  /**
   * Crée les écritures comptables dans la base de données
   */
  async createJournalEntries(entriesByJournalAndNum: Map<string, FECEntry[]>, companyId: string) {
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
        const entryDate = this.formatDateForSQL(firstEntry.date);
        
        // Créer l'entrée de journal
        const journalEntry = {
          company_id: companyId,
          journal_id: journalId,
          entry_date: entryDate,
          description: firstEntry.label || `Écriture ${ecritureNum}`,
          reference_number: firstEntry.reference || ecritureNum,
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
          const accountId = accountMap.get(entry.accountNumber);
          
          if (!accountId) {
            errors.push({
              key,
              message: `Account with number ${entry.accountNumber} not found in the database.`
            });
            continue;
          }
          
          journalEntryItemsToCreate.push({
            journal_entry_id: journalEntryId,
            company_id: companyId,
            account_id: accountId,
            debit_amount: entry.debit || 0,
            credit_amount: entry.credit || 0,
            currency: 'EUR', // Par défaut
            description: entry.label || ''
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
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Erreur lors de la création des écritures:', error);
      throw error;
    }
  }
};