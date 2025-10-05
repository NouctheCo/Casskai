import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { fecValidationService, ValidationResult } from '@/services/fecValidationService';
import { FECEntry } from '@/types/accounting-import.types';

export interface FECImportData {
  journals: string[];
  accounts: Map<string, { libelle: string }>;
  entriesByJournalAndNum: Map<string, any[]>;
}

export interface FECImportResult {
  success: boolean;
  journals?: {
    created: number;
    existing: number;
    journals: any[];
  };
  accounts?: {
    created: number;
    existing: number;
    accounts: any[];
  };
  entries?: {
    created: number;
    itemsCreated: number;
    errors: any[];
  };
  summary?: {
    journalsCreated: number;
    journalsExisting: number;
    accountsCreated: number;
    accountsExisting: number;
    entriesCreated: number;
    entriesWithErrors: number;
    errors: any[];
  };
  error?: string;
}

export interface AccountInfo {
  libelle: string;
}

export function useFECImport(companyId: string) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // Validate FEC entries before import
  const validateFECEntries = useCallback((entries: FECEntry[]): ValidationResult => {
    const result = fecValidationService.validateFEC(entries);
    setValidationResult(result);
    return result;
  }, []);

  // Import FEC data
  const importFECData = useCallback(async (data: FECImportData): Promise<FECImportResult> => {
    if (!user || !companyId) {
      throw new Error('User or company not available');
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create missing journals
      const journalsResult = await createMissingJournals(data.journals, companyId);
      
      // 2. Create missing accounts
      const accountsResult = await createMissingAccounts(data.accounts, companyId);
      
      // 3. Create journal entries
      const entriesResult = await createJournalEntries(data.entriesByJournalAndNum, companyId);
      
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error during FEC import';
      setError(errorMessage);
      console.error('Error during FEC import:', err);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [user, companyId]);

  // Create missing journals
  const createMissingJournals = useCallback(async (
    journalCodes: string[],
    companyId: string
  ) => {
    // 1. Get existing journals
    const { data: existingJournals, error: fetchError } = await supabase
      .from('journals')
      .select('code')
      .eq('company_id', companyId);
    
    if (fetchError) throw fetchError;
    
    const existingCodes = new Set(existingJournals.map(j => j.code));
    const journalsToCreate = [];
    
    // 2. Identify journals to create
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
    
    // 3. Create missing journals
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
  }, []);

  // Create missing accounts
  const createMissingAccounts = useCallback(async (
    accountsData: Map<string, AccountInfo>,
    companyId: string
  ) => {
    // 1. Get existing accounts
    const { data: existingAccounts, error: fetchError } = await supabase
      .from('accounts')
      .select('account_number')
      .eq('company_id', companyId);
    
    if (fetchError) throw fetchError;
    
    const existingAccountNumbers = new Set(existingAccounts.map(a => a.account_number));
    const accountsToCreate = [];
    
    // 2. Identify accounts to create
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
          currency: 'EUR',
          balance: 0,
          imported_from_fec: true
        });
      }
    }
    
    // 3. Create missing accounts
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
  }, []);

  // Create journal entries
  const createJournalEntries = useCallback(async (
    entriesByJournalAndNum: Map<string, any[]>,
    companyId: string
  ) => {
    // 1. Get journals and accounts for mapping
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
    
    // Create maps for easy lookup
    const journalMap = new Map(journals.map(j => [j.code, j.id]));
    const accountMap = new Map(accounts.map(a => [a.account_number, a.id]));
    
    // 2. Prepare journal entries to create
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
      
      // Take info from first entry of the group
      const firstEntry = entriesGroup[0];
      const entryDate = formatDateForSQL(firstEntry.EcritureDate);
      
      // Create journal entry
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
    
    // 3. Insert journal entries
    let createdEntries = [];
    if (journalEntriesToCreate.length > 0) {
      const { data: insertedEntries, error: insertError } = await supabase
        .from('journal_entries')
        .insert(journalEntriesToCreate)
        .select();
      
      if (insertError) throw insertError;
      createdEntries = insertedEntries;
    }
    
    // 4. Prepare journal entry items
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
      
      // Create journal entry items
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
          currency: 'EUR',
          description: entry.EcritureLib || ''
        });
      }
    }
    
    // 5. Insert journal entry items in batches
    if (journalEntryItemsToCreate.length > 0) {
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
  }, []);

  return {
    loading,
    error,
    validationResult,
    validateFECEntries,
    importFECData,
    createMissingJournals,
    createMissingAccounts,
    createJournalEntries,
  };
}

// Utility functions
function getJournalType(code: string): string {
  if (code.startsWith('AN')) return 'OPENING';
  if (code.startsWith('VT')) return 'VENTE';
  if (code.startsWith('AC')) return 'ACHAT';
  if (code.startsWith('BQ')) return 'BANQUE';
  if (code.startsWith('CA')) return 'CAISSE';
  if (code.startsWith('OD')) return 'OD';
  if (code.startsWith('EX')) return 'REVERSAL';
  return 'OTHER';
}

function getAccountType(accountNumber: string): string {
  const firstDigit = accountNumber.charAt(0);
  switch (firstDigit) {
    case '1':
      return 'equity';
    case '2':
      return 'asset';
    case '3':
      return 'asset';
    case '4':
      return accountNumber.startsWith('41') || accountNumber.startsWith('42') ? 'asset' : 'liability';
    case '5':
      return 'asset';
    case '6':
      return 'expense';
    case '7':
      return 'revenue';
    default:
      return 'other';
  }
}

function getAccountClass(accountNumber: string): number {
  return parseInt(accountNumber.charAt(0)) || 0;
}

function formatDateForSQL(dateString: string): string {
  if (!dateString) return new Date().toISOString().split('T')[0];
  
  // Handle YYYYMMDD format
  if (dateString.length === 8) {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    return `${year}-${month}-${day}`;
  }
  
  // Handle other formats
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}