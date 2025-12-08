/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 *
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 *
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

import { supabase, getCurrentCompany } from '../lib/supabase';
import { parseAccountingFile, type ParseResult, type AccountingLine, type AccountingStandard } from '../utils/accountingFileParser';

interface ImportSummary {
  journalsCreated: number;
  journalsExisting: number;
  accountsCreated: number;
  accountsExisting: number;
  entriesCreated: number;
  entriesWithErrors: number;
  errors: any[];
  format: string;
  standard: string | null;
  statistics: {
    totalLines: number;
    validLines: number;
    totalDebit: number;
    totalCredit: number;
    balance: number;
    currencies: string[];
    journals: string[];
    dateRange: { start: string; end: string } | null;
  };
}

interface DatabaseImportResult {
  success: boolean;
  summary?: ImportSummary;
  error?: string;
  parseResult?: ParseResult;
}

/**
 * Service pour gérer l'import universel de fichiers comptables multi-pays
 * Supporte: FEC (France), SYSCOHADA (OHADA), IFRS, SCF (Maghreb), QuickBooks, Sage, Xero
 */
export const accountingImportService = {
  /**
   * Parse et importe un fichier comptable universel
   */
  async parseAndImportFile(file: File, companyId?: string, options?: {
    defaultCurrency?: string;
    expectedStandard?: AccountingStandard;
  }): Promise<DatabaseImportResult> {
    try {
      // 1. Lire le contenu du fichier
      const content = await this.readFileContent(file);

      // 2. Parse le fichier avec le parser universel
      const parseResult = parseAccountingFile(content, {
        defaultCurrency: options?.defaultCurrency,
        expectedStandard: options?.expectedStandard,
      });

      if (!parseResult.success || parseResult.lines.length === 0) {
        return {
          success: false,
          error: parseResult.errors.length > 0
            ? parseResult.errors[0].message
            : 'Aucune écriture valide trouvée',
          parseResult
        };
      }

      // 3. Obtenir l'entreprise courante si pas fournie
      const enterpriseId = companyId || await this.getCurrentEnterpriseId();
      if (!enterpriseId) {
        return {
          success: false,
          error: 'Aucune entreprise sélectionnée',
          parseResult
        };
      }

      // 4. Importer en base de données
      return await this.importParsedData(parseResult, enterpriseId);

    } catch (error) {
      console.error('Erreur lors du parsing et import:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  },

  /**
   * Lit le contenu d'un fichier
   */
  async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Format de fichier non supporté'));
        }
      };
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsText(file, 'UTF-8');
    });
  },

  /**
   * Importe les données comptables parsées dans la base de données
   */
  async importParsedData(parseResult: ParseResult, companyId: string): Promise<DatabaseImportResult> {
    try {
      // Grouper les entrées par journal
      const journalCodes = [...new Set(parseResult.lines.map(e => e.journalCode))];

      // Grouper les comptes
      const accounts = new Map<string, { name: string; entries: AccountingLine[] }>();
      parseResult.lines.forEach(entry => {
        if (!accounts.has(entry.accountNumber)) {
          accounts.set(entry.accountNumber, { name: entry.accountName, entries: [] });
        }
        accounts.get(entry.accountNumber)!.entries.push(entry);
      });

      // Grouper les écritures par journal et numéro
      const entriesByJournalAndNum = new Map<string, AccountingLine[]>();
      parseResult.lines.forEach(entry => {
        const key = `${entry.journalCode}-${entry.entryNumber}`;
        if (!entriesByJournalAndNum.has(key)) {
          entriesByJournalAndNum.set(key, []);
        }
        entriesByJournalAndNum.get(key)!.push(entry);
      });

      // 1. Créer les journaux manquants
      const journalsResult = await this.createMissingJournals(journalCodes, companyId, parseResult.standard);

      // 2. Créer les comptes manquants
      const accountsResult = await this.createMissingAccounts(accounts, companyId, parseResult.standard);

      // 3. Créer les écritures comptables
      const entriesResult = await this.createJournalEntries(entriesByJournalAndNum, companyId);

      // 4. Créer log d'audit
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('audit_logs').insert({
            company_id: companyId,
            user_id: user.id,
            action: 'fec_import',
            entity_type: 'journal_entries',
            details: {
              type: 'FEC Import',
              format: parseResult.format,
              standard: parseResult.standard,
              entries_created: entriesResult.created,
              lines_created: entriesResult.itemsCreated,
              journals_created: journalsResult.created,
              accounts_created: accountsResult.created,
              total_debit: parseResult.stats.totalDebit,
              total_credit: parseResult.stats.totalCredit,
              imported_at: new Date().toISOString(),
              status: 'success'
            }
          });
          console.log('✅ Audit log créé pour import FEC');
        }
      } catch (auditError) {
        console.warn('⚠️ Échec création audit log:', auditError);
      }

      return {
        success: true,
        summary: {
          journalsCreated: journalsResult.created,
          journalsExisting: journalsResult.existing,
          accountsCreated: accountsResult.created,
          accountsExisting: accountsResult.existing,
          entriesCreated: entriesResult.created,
          entriesWithErrors: entriesResult.errors.length,
          errors: entriesResult.errors,
          format: parseResult.format,
          standard: parseResult.standard,
          statistics: {
            totalLines: parseResult.stats.totalLines,
            validLines: parseResult.stats.validLines,
            totalDebit: parseResult.stats.totalDebit,
            totalCredit: parseResult.stats.totalCredit,
            balance: parseResult.stats.balance,
            currencies: parseResult.stats.currencies,
            journals: parseResult.stats.journals,
            dateRange: parseResult.stats.dateRange,
          }
        },
        parseResult
      };
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
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
      console.error('Erreur lors de la récupération de l\'entreprise:', error);
      return null;
    }
  },

  /**
   * Utilitaire pour obtenir le type de journal basé sur le code et le standard
   * Retourne les valeurs conformes à la contrainte journals_type_check :
   * 'sale', 'purchase', 'bank', 'cash', 'miscellaneous'
   */
  getJournalType(code: string, standard?: AccountingStandard | null): string {
    const upperCode = code.toUpperCase();

    // === BANQUE ===
    if (upperCode.startsWith('BQ') || upperCode.startsWith('BA') || upperCode.startsWith('BK') || upperCode.startsWith('BNQ')) {
      return 'bank';
    }

    // === CAISSE ===
    if (upperCode === 'CA' || upperCode.startsWith('CAI') || upperCode.startsWith('CS')) {
      return 'cash';
    }

    // === VENTES ===
    if (upperCode === 'VT' || upperCode === 'VE' || upperCode.startsWith('VEN')) {
      return 'sale';
    }

    // === ACHATS ===
    if (upperCode === 'AC' || upperCode === 'HA' || upperCode === 'AH' || upperCode.startsWith('ACH') || upperCode.startsWith('FOU') || upperCode.startsWith('PU')) {
      return 'purchase';
    }

    // === TOUT LE RESTE → miscellaneous ===
    // Inclut : OD (opérations diverses), RAN (report à nouveau), AN (à-nouveaux),
    // SA (salaires), EXT (extourne), CLO (clôture), etc.
    return 'miscellaneous';
  },

  /**
   * Utilitaire pour obtenir le type de compte selon le standard
   * Retourne les valeurs conformes à la contrainte chart_of_accounts_account_type_check :
   * 'asset', 'liability', 'equity', 'revenue', 'expense'
   */
  getAccountType(accountNumber: string, standard?: AccountingStandard | null): string {
    if (!accountNumber || accountNumber.length === 0) return 'asset';

    const firstDigit = accountNumber.charAt(0);
    const firstTwoDigits = accountNumber.substring(0, 2);

    // PCG (France) et SYSCOHADA (OHADA) ont des classes similaires
    if (standard === 'PCG' || standard === 'SYSCOHADA' || !standard) {
      switch (firstDigit) {
        case '1':
          // Classe 1 : Capitaux propres
          return 'equity';

        case '2':
          // Classe 2 : Immobilisations (actif)
          return 'asset';

        case '3':
          // Classe 3 : Stocks (actif)
          return 'asset';

        case '4':
          // Classe 4 : Tiers - dépend du sous-compte
          if (firstTwoDigits === '40') return 'liability';  // Fournisseurs
          if (firstTwoDigits === '41') return 'asset';      // Clients
          if (firstTwoDigits === '42') return 'liability';  // Personnel
          if (firstTwoDigits === '43') return 'liability';  // Sécurité sociale
          if (firstTwoDigits === '44') return 'liability';  // État/TVA
          if (firstTwoDigits === '45') return 'liability';  // Associés
          if (firstTwoDigits === '46') return 'asset';      // Débiteurs divers
          if (firstTwoDigits === '47') return 'asset';      // Transitoires
          if (firstTwoDigits === '48') return 'asset';      // Charges constatées
          if (firstTwoDigits === '49') return 'asset';      // Dépréciations
          return 'liability'; // Par défaut pour classe 4

        case '5':
          // Classe 5 : Financier (actif - banque, caisse)
          return 'asset';

        case '6':
          // Classe 6 : Charges
          return 'expense';

        case '7':
          // Classe 7 : Produits
          return 'revenue';

        case '8':
          // Classe 8 : Comptes spéciaux
          return 'expense';

        case '9':
          // Classe 9 : Analytique
          return 'expense';

        default:
          return 'asset';
      }
    }

    // IFRS / International
    if (standard === 'IFRS' || standard === 'US_GAAP') {
      if (/^[1-2]/.test(accountNumber)) return 'asset';
      if (/^[3-4]/.test(accountNumber)) return 'liability';
      if (/^5/.test(accountNumber)) return 'equity';
      if (/^6/.test(accountNumber)) return 'revenue';
      if (/^[7-8]/.test(accountNumber)) return 'expense';
    }

    return 'asset';
  },

  /**
   * Utilitaire pour obtenir la classe de compte (retourne un entier de 1 à 9)
   * La classe est le premier chiffre du numéro de compte en comptabilité française
   */
  getAccountClass(accountNumber: string): number {
    if (!accountNumber || accountNumber.length === 0) return 1;

    const firstChar = accountNumber.charAt(0);
    const classNumber = parseInt(firstChar, 10);

    // Vérifier que c'est un nombre valide entre 1 et 9
    if (isNaN(classNumber) || classNumber < 1 || classNumber > 9) {
      return 1; // Par défaut classe 1
    }

    return classNumber;
  },

  /**
   * Crée les journaux manquants dans la base de données
   */
  async createMissingJournals(journalCodes: string[], companyId: string, standard?: AccountingStandard | null) {
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
          const type = this.getJournalType(code, standard);
          let name = '';

          switch (type) {
            case 'bank':
              name = `Journal de banque ${code.replace(/^(BQ|BA|BK|BNQ)/i, '')}`;
              break;
            case 'cash':
              name = 'Journal de caisse';
              break;
            case 'sale':
              name = 'Journal des ventes';
              break;
            case 'purchase':
              name = 'Journal des achats';
              break;
            case 'miscellaneous':
              // Noms spécifiques pour les codes connus
              if (code.toUpperCase().startsWith('AN') || code.toUpperCase() === 'RAN') {
                name = 'Journal des à-nouveaux';
              } else if (code.toUpperCase().startsWith('EX')) {
                name = 'Journal d\'extourne';
              } else if (code.toUpperCase() === 'OD') {
                name = 'Opérations diverses';
              } else if (code.toUpperCase().startsWith('SA')) {
                name = 'Journal des salaires';
              } else {
                name = `Journal ${code}`;
              }
              break;
            default:
              name = `Journal ${code}`;
          }

          journalsToCreate.push({
            company_id: companyId,
            code,
            name,
            type,
            description: `Journal importé - ${name} (${standard || 'Standard détecté automatiquement'})`,
            is_active: true,
            imported_from_fec: true
          });
        }
      }

      // 3. Créer les journaux manquants
      if (journalsToCreate.length > 0) {
        console.log('[Import] Creating journals:', journalsToCreate);

        const { data: createdJournals, error: insertError } = await supabase
          .from('journals')
          .insert(journalsToCreate)
          .select('id, code, name');

        if (insertError) {
          console.error('[Import] Error creating journals:', insertError);
          throw insertError;
        }

        console.log('[Import] Journals created:', createdJournals);

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
   */
  async createMissingAccounts(
    accountsData: Map<string, { name: string; entries: AccountingLine[] }>,
    companyId: string,
    standard?: AccountingStandard | null
  ) {
    try {
      // 1. Récupérer les comptes existants
      const { data: existingAccounts, error: fetchError } = await supabase
        .from('chart_of_accounts')
        .select('account_number')
        .eq('company_id', companyId);

      if (fetchError) throw fetchError;

      const existingAccountNumbers = new Set((existingAccounts || []).map(a => a.account_number));
      const accountsToCreate = [];

      // 2. Identifier les comptes à créer
      for (const [accountNumber, accountInfo] of accountsData) {
        if (!existingAccountNumbers.has(accountNumber)) {
          const type = this.getAccountType(accountNumber, standard);
          const accountClass = this.getAccountClass(accountNumber);

          accountsToCreate.push({
            company_id: companyId,
            account_number: accountNumber,
            account_name: accountInfo.name || `Compte ${accountNumber}`,
            account_type: type,
            account_class: accountClass,
            description: `Compte importé (${standard || 'Standard détecté automatiquement'}) - ${accountInfo.name || accountNumber}`,
            is_active: true,
            is_detail_account: true,
            balance_debit: 0,
            balance_credit: 0,
            current_balance: 0,
            imported_from_fec: true
          });
        }
      }

      // 3. Créer les comptes manquants
      if (accountsToCreate.length > 0) {
        const { data: createdAccounts, error: insertError } = await supabase
          .from('chart_of_accounts')
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
   */
  async createJournalEntries(entriesByJournalAndNum: Map<string, AccountingLine[]>, companyId: string) {
    try {
      // 1. Récupérer les journaux et les comptes pour faire la correspondance
      const { data: journals, error: journalsError } = await supabase
        .from('journals')
        .select('id, code')
        .eq('company_id', companyId);

      if (journalsError) throw journalsError;

      const { data: accounts, error: accountsError } = await supabase
        .from('chart_of_accounts')
        .select('id, account_number')
        .eq('company_id', companyId);

      if (accountsError) throw accountsError;

      // Créer des maps pour faciliter la recherche
      const journalMap = new Map(journals.map(j => [j.code, j.id]));
      const accountMap = new Map((accounts || []).map(a => [a.account_number, a.id]));

      // 2. Préparer les écritures à créer
      const journalEntriesToCreate = [];
      const journalEntryLinesToCreate = [];
      const errors = [];

      for (const [key, entriesGroup] of entriesByJournalAndNum) {
        if (entriesGroup.length === 0) continue;

        const [journalCode, ecritureNum] = key.split('-');
        const journalId = journalMap.get(journalCode);

        if (!journalId) {
          errors.push({
            key,
            message: `Journal avec code ${journalCode} non trouvé dans la base de données.`
          });
          continue;
        }

        // Prendre les informations de la première entrée du groupe
        const firstEntry = entriesGroup[0];

        // Créer l'entrée de journal
        const journalEntry = {
          company_id: companyId,
          journal_id: journalId,
          entry_date: firstEntry.entryDate, // Déjà au format ISO
          description: firstEntry.description || `Écriture ${ecritureNum}`,
          reference_number: firstEntry.documentRef || ecritureNum,
          status: 'posted',
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
      createdEntries.forEach((entry, index) => {
        if (!entry?.id) return;
        const byReturnedData = entry?.fec_journal_code && entry?.fec_entry_num
          ? `${entry.fec_journal_code}-${entry.fec_entry_num}`
          : null;
        const fallbackKey = journalEntriesToCreate[index]
          ? `${journalEntriesToCreate[index].fec_journal_code}-${journalEntriesToCreate[index].fec_entry_num}`
          : null;
        const key = byReturnedData || fallbackKey;
        if (key) {
          entryMap.set(key, entry.id);
        }
      });

      for (const [key, entriesGroup] of entriesByJournalAndNum) {
        const journalEntryId = entryMap.get(key);

        if (!journalEntryId) {
          errors.push({
            key,
            message: `Impossible de trouver l'entrée de journal créée pour ${key}.`
          });
          continue;
        }

        // Créer les lignes d'écriture
        entriesGroup.forEach((entry, index) => {
          const accountId = accountMap.get(entry.accountNumber);

          if (!accountId) {
            errors.push({
              key,
              message: `Compte avec numéro ${entry.accountNumber} non trouvé dans la base de données.`
            });
            return;
          }

          // DEBUG: Log les montants AVANT insertion
          if (entry.debit > 0 || entry.credit > 0) {
            console.log(`[Import] Line ${index + 1} - Account ${entry.accountNumber}:`, {
              debit: entry.debit,
              credit: entry.credit,
              debitType: typeof entry.debit,
              creditType: typeof entry.credit
            });
          }

          journalEntryLinesToCreate.push({
            journal_entry_id: journalEntryId,
            account_id: accountId,
            description: entry.description || entry.documentRef || `Ligne ${index + 1}`,
            debit_amount: entry.debit || 0,
            credit_amount: entry.credit || 0,
            line_order: index + 1,
            account_number: entry.accountNumber,
            account_name: entry.accountName || null
          });
        });
      }

      // 5. Insérer les lignes d'écritures
      if (journalEntryLinesToCreate.length > 0) {
        // DEBUG: Log un échantillon des données à insérer
        console.log('[Import] Sample of lines to insert (first 3):',
          journalEntryLinesToCreate.slice(0, 3).map(line => ({
            account: line.account_number,
            debit: line.debit_amount,
            credit: line.credit_amount,
            desc: line.description
          }))
        );

        // Insérer par lots de 100 pour éviter les problèmes de taille de requête
        const batchSize = 100;
        for (let i = 0; i < journalEntryLinesToCreate.length; i += batchSize) {
          const batch = journalEntryLinesToCreate.slice(i, i + batchSize);
          const { error: itemsError } = await supabase
            .from('journal_entry_lines')
            .insert(batch);

          if (itemsError) {
            errors.push({
              message: `Erreur lors de l'insertion du lot de lignes: ${itemsError.message}`
            });
          }
        }
      }

      return {
        created: createdEntries.length,
        itemsCreated: journalEntryLinesToCreate.length,
        errors
      };
    } catch (error) {
      console.error('Erreur lors de la création des écritures:', error);
      throw error;
    }
  }
};
