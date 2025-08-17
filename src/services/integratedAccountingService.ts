import { FECParser } from './fecParser';
import { CSVImportService } from './csvImportService';
import { AccountingValidationService } from './accountingValidationService';
import { EntryTemplatesService } from './entryTemplatesService';
import { VATCalculationService } from './vatCalculationService';
import { AutomaticLetterageService } from './automaticLetterageService';

import { supabase } from '../lib/supabase';
import { ImportResult, ImportSession } from '../types/accounting-import.types';

/**
 * Service intégré pour toutes les opérations d'import/export comptable
 */
export class IntegratedAccountingService {

  /**
   * Orchestrateur principal d'import
   */
  static async performCompleteImport(config: {
    file: File;
    format: 'FEC' | 'CSV' | 'Excel' | 'auto';
    companyId: string;
    journalId: string;
    options?: {
      encoding?: string;
      delimiter?: string;
      skipFirstRow?: boolean;
      validateBeforeImport?: boolean;
      autoLetterage?: boolean;
      createMissingAccounts?: boolean;
    };
    onProgress?: (progress: number, status: string) => void;
  }): Promise<ImportResult> {
    const { 
      file, 
      format, 
      companyId, 
      journalId, 
      options = {}, 
      onProgress 
    } = config;

    const session: ImportSession = {
      id: crypto.randomUUID(),
      filename: file.name,
      format: ((): 'FEC' | 'CSV' | 'Excel' => (
        format === 'auto' ? this.detectFormat(file) : (format as 'FEC' | 'CSV' | 'Excel')
      ))(),
      status: 'parsing',
      totalRows: 0,
      validRows: 0,
      errors: 0,
      warnings: 0,
      createdAt: new Date().toISOString()
    };

    try {
      // PHASE 1: Parsing
      onProgress?.(5, 'Analyse du fichier...');
      let result: ImportResult;

      switch (session.format) {
        case 'FEC': {
          result = await FECParser.parseFEC(file, {
            encoding: options.encoding,
            skipFirstRow: options.skipFirstRow,
            skipEmptyLines: true
          });
          break;
        }
        case 'CSV': {
          const analysis = await CSVImportService.analyzeFile(file);
          result = await CSVImportService.importWithMapping(
            file,
            analysis.suggestedMapping,
            {
              encoding: options.encoding,
              delimiter: options.delimiter,
              skipFirstRow: options.skipFirstRow
            }
          );
          break;
        }
        case 'Excel': {
          const excelAnalysis = await CSVImportService.analyzeFile(file);
          result = await CSVImportService.importWithMapping(
            file,
            excelAnalysis.suggestedMapping
          );
          break;
        }
        default: {
          throw new Error(`Format ${session.format} non supporté`);
        }
      }

      onProgress?.(25, `${result.entries.length} écritures parsées`);

      // PHASE 2: Création des comptes manquants si nécessaire
      if (options.createMissingAccounts) {
        onProgress?.(30, 'Vérification des comptes...');
        await this.ensureAccountsExist(result.entries, companyId);
      }

      // PHASE 3: Validation
      if (options.validateBeforeImport !== false) {
        onProgress?.(35, 'Validation des écritures...');
        
        const validation = await AccountingValidationService.validateBatch(
          result.entries, 
          companyId
        );

        result = {
          ...result,
          entries: validation.valid,
          errors: [...result.errors, ...validation.invalid.flatMap(inv => inv.errors)],
          warnings: [...result.warnings, ...validation.warnings]
        };
      }

      onProgress?.(60, `${result.entries.length} écritures validées`);

      // PHASE 4: Sauvegarde
      onProgress?.(65, 'Sauvegarde en base...');
      const savedEntries = await this.saveJournalEntries(result.entries, journalId);
      
      onProgress?.(85, `${savedEntries.length} écritures sauvegardées`);

      // PHASE 5: Lettrage automatique
      if (options.autoLetterage) {
        onProgress?.(90, 'Lettrage automatique...');
        await AutomaticLetterageService.performAutoLetterage(companyId);
      }

      onProgress?.(100, 'Import terminé');

      return {
        ...result,
        entries: savedEntries,
        validRows: savedEntries.length
      };

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Erreur import: ${message}`);
    }
  }

  /**
   * Détecte automatiquement le format d'un fichier
   */
  private static detectFormat(file: File): 'FEC' | 'CSV' | 'Excel' {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const excelExtensions = ['xlsx', 'xls', 'xlsm'];
    
    if (excelExtensions.includes(extension || '')) return 'Excel';
    if (extension === 'txt' || file.name.toLowerCase().includes('fec')) return 'FEC';
    return 'CSV';
  }

  /**
   * Assure que tous les comptes nécessaires existent
   */
  private static async ensureAccountsExist(
    entries: Array<{ items?: Array<{ accountNumber?: string }>; accountNumber?: string }>,
    companyId: string
  ): Promise<void> {
    const accountNumbers = new Set<string>();
    
    // Collecte tous les numéros de compte
  entries.forEach(entry => {
      if (entry.items) {
    entry.items.forEach((item) => {
          if (item.accountNumber) {
            accountNumbers.add(item.accountNumber);
          }
        });
      } else if (entry.accountNumber) {
        accountNumbers.add(entry.accountNumber);
      }
    });

    // Vérification et création des comptes manquants
    for (const accountNumber of accountNumbers) {
      await this.ensureAccountExists(accountNumber, companyId);
    }
  }

  /**
   * Assure qu'un compte spécifique existe
   */
  private static async ensureAccountExists(accountNumber: string, companyId: string): Promise<string> {
    // Vérification de l'existence
    const existing = await supabase
      .from('accounts')
      .select('id')
      .eq('company_id', companyId)
      .eq('number', accountNumber)
      .single();

    if (existing.data) {
      return existing.data.id;
    }

    // Création du compte
    const accountData = this.generateAccountData(accountNumber, companyId);
    
    const { data, error } = await supabase
      .from('accounts')
      .insert(accountData)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Impossible de créer le compte ${accountNumber}: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Génère les données d'un compte basé sur son numéro
   */
  private static generateAccountData(accountNumber: string, companyId: string) {
    const accountClass = accountNumber.charAt(0);
    const accountName = this.generateAccountName(accountNumber);
    const accountType = this.getAccountType(accountClass);

    return {
      company_id: companyId,
      number: accountNumber,
      name: accountName,
      type: accountType,
      class: accountClass,
      is_active: true,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Génère un nom de compte basé sur le numéro
   */
  private static generateAccountName(accountNumber: string): string {
    const patterns: Record<string, string> = {
      // Classe 1 - Comptes de capitaux
      '101': 'Capital',
      '106': 'Réserves',
      '110': 'Report à nouveau',
  '120': 'Résultat de l\'exercice',

      // Classe 4 - Comptes de tiers
      '401': 'Fournisseurs',
      '411': 'Clients',
      '421': 'Personnel - Rémunérations dues',
      '431': 'Sécurité sociale',
      '445': 'État - TVA',

      // Classe 5 - Comptes financiers
      '512': 'Banques',
      '530': 'Caisse',

      // Classe 6 - Comptes de charges
      '607': 'Achats de marchandises',
      '641': 'Salaires',
  '661': 'Charges d\'intérêts',

      // Classe 7 - Comptes de produits
      '707': 'Ventes de marchandises',
      '761': 'Produits financiers'
    };

    // Recherche exacte
    if (patterns[accountNumber]) {
      return patterns[accountNumber];
    }

    // Recherche par préfixe
    for (const [pattern, name] of Object.entries(patterns)) {
      if (accountNumber.startsWith(pattern)) {
        return `${name} (${accountNumber})`;
      }
    }

    // Génération basée sur la classe
    const classNames: Record<string, string> = {
      '1': 'Capitaux',
      '2': 'Immobilisations',
      '3': 'Stocks',
      '4': 'Tiers',
      '5': 'Financier',
      '6': 'Charges',
      '7': 'Produits',
      '8': 'Résultats',
      '9': 'Analytique'
    };

    const className = classNames[accountNumber.charAt(0)] || 'Divers';
    return `${className} ${accountNumber}`;
  }

  /**
   * Détermine le type de compte basé sur la classe
   */
  private static getAccountType(accountClass: string): string {
    const typeMapping: Record<string, string> = {
      '1': 'EQUITY',
      '2': 'ASSET',
      '3': 'ASSET',
      '4': 'LIABILITY',
      '5': 'ASSET',
      '6': 'EXPENSE',
      '7': 'REVENUE',
      '8': 'EXPENSE',
      '9': 'EXPENSE'
    };

    return typeMapping[accountClass] || 'ASSET';
  }

  /**
   * Sauvegarde les écritures en base
   */
  private static async saveJournalEntries(entries: any[], journalId: string): Promise<any[]> {
    const savedEntries: any[] = [];

    for (const entry of entries) {
      try {
        // Sauvegarde de l'écriture principale
        const { data: journalEntry, error: entryError } = await supabase
          .from('journal_entries')
          .insert({
            company_id: entry.companyId,
            journal_id: journalId,
            entry_number: entry.entryNumber,
            date: entry.date,
            description: entry.description,
            reference: entry.reference,
            status: 'validated'
          })
          .select('id')
          .single();

        if (entryError) {
          throw new Error(`Erreur sauvegarde écriture: ${entryError.message}`);
        }

        // Sauvegarde des lignes d'écriture
        const entryItems = entry.items?.map((item: any) => ({
          journal_entry_id: journalEntry.id,
          account_id: item.accountId,
          debit_amount: item.debitAmount,
          credit_amount: item.creditAmount,
          description: item.description,
          auxiliary_account: item.auxiliaryAccount,
          letterage: item.letterage
        })) || [];

        if (entryItems.length > 0) {
          const { error: itemsError } = await supabase
            .from('journal_entry_items')
            .insert(entryItems);

          if (itemsError) {
            throw new Error(`Erreur sauvegarde lignes: ${itemsError.message}`);
          }
        }

        savedEntries.push({
          ...entry,
          id: journalEntry.id
        });

      } catch (error) {
        console.error(`Erreur sauvegarde écriture ${entry.entryNumber}:`, error);
        // Continue avec les autres écritures
      }
    }

    return savedEntries;
  }

  /**
   * Export FEC d'une entreprise
   */
  static async exportFEC(companyId: string, year: number): Promise<string> {
    // Récupération des écritures de l'année
  const { data: entries, error } = await supabase
      .from('journal_entry_items')
      .select(`
        debit_amount,
        credit_amount,
        description,
        auxiliary_account,
        letterage,
        accounts (number, name),
        journal_entries (
          entry_number,
          date,
          reference,
          description,
          journals (code, name)
        )
      `)
      .eq('journal_entries.company_id', companyId)
      .gte('journal_entries.date', `${year}-01-01`)
      .lte('journal_entries.date', `${year}-12-31`)
      .order('journal_entries.date');

    if (error || !entries) {
      throw new Error(`Erreur export FEC: ${error?.message}`);
    }

    // Génération du contenu FEC
    const fecLines: string[] = [];
    
    // En-tête FEC
    fecLines.push([
      'JournalCode',
      'JournalLib',
      'EcritureNum',
      'EcritureDate',
      'CompteNum',
      'CompteLib',
      'CompAuxNum',
      'CompAuxLib',
      'PieceRef',
      'PieceDate',
      'EcritureLib',
      'Debit',
      'Credit',
      'EcritureLet',
      'DateLet',
      'ValidDate',
      'Montantdevise',
      'Idevise'
    ].join('|'));

    // Données
    type Journal = { code: string; name: string } | null;
    type JournalEntry = { entry_number: string; date: string; reference?: string | null; description?: string | null; journals: Journal | Journal[] | null } | null;
    type AccountRow = { number?: string; name?: string } | null;
    type ItemRow = {
      debit_amount?: number;
      credit_amount?: number;
      description?: string | null;
      auxiliary_account?: string | null;
      letterage?: string | null;
      accounts?: AccountRow | AccountRow[] | null;
      journal_entries?: JournalEntry | JournalEntry[] | null;
    };

    (entries as ItemRow[]).forEach((item) => {
      const jeRaw = Array.isArray(item.journal_entries) ? item.journal_entries[0] : item.journal_entries;
      const journalRaw = jeRaw?.journals;
      const journal = Array.isArray(journalRaw) ? journalRaw[0] : journalRaw;
      const accountRaw = item.accounts;
      const account = Array.isArray(accountRaw) ? accountRaw[0] : accountRaw;
      const entry = jeRaw;
      
      const fecLine = [
        journal?.code || '',
        journal?.name || '',
        entry?.entry_number || '',
        this.formatFECDate(entry?.date || new Date().toISOString()),
        account?.number || '',
        account?.name || '',
        item.auxiliary_account || '',
        '', // CompAuxLib - à implémenter si nécessaire
        entry?.reference || '',
        this.formatFECDate(entry?.date || new Date().toISOString()), // PieceDate = EcritureDate par défaut
        item.description || entry?.description || '',
        this.formatFECAmount(item.debit_amount ?? 0),
        this.formatFECAmount(item.credit_amount ?? 0),
        item.letterage || '',
        '', // DateLet - à implémenter si nécessaire
        this.formatFECDate(entry?.date || new Date().toISOString()), // ValidDate
        '', // Montantdevise - à implémenter si nécessaire
        ''  // Idevise - à implémenter si nécessaire
      ].join('|');
      
      fecLines.push(fecLine);
    });

    return fecLines.join('\\n');
  }

  /**
   * Formate une date au format FEC (AAAAMMJJ)
   */
  private static formatFECDate(dateStr: string): string {
    const date = new Date(dateStr);
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Formate un montant au format FEC
   */
  private static formatFECAmount(amount: number): string {
    return amount.toFixed(2).replace('.', ',');
  }

  /**
   * Génération d'écritures automatiques depuis templates
   */
  static async generateEntriesFromTemplate(
    companyId: string,
    templateId: string,
    variables: Record<string, any>,
    journalId: string
  ): Promise<any> {
    try {
      const entry = await EntryTemplatesService.applyTemplate(
        templateId,
        variables,
        companyId,
        journalId
      );

      // Validation
      const validation = await AccountingValidationService.validateJournalEntry(
        entry,
        companyId
      );

      if (!validation.isValid) {
        throw new Error(`Validation échoué: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Sauvegarde
      const savedEntries = await this.saveJournalEntries([validation.validatedEntry], journalId);
      
      return savedEntries[0];

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Erreur génération template: ${message}`);
    }
  }

  /**
   * Calcul et génération automatique des écritures de TVA
   */
  static async generateVATDeclaration(
    companyId: string,
    startDate: string,
    endDate: string,
    journalId: string
  ): Promise<any> {
    try {
      // Calcul de la déclaration
      const declaration = await VATCalculationService.calculateVATDeclaration({
        companyId,
        startDate,
        endDate
      });

      // Génération de l'écriture de déclaration
      const entry = await VATCalculationService.generateVATDeclarationEntry(
        companyId,
        journalId,
        declaration
      );

      // Validation et sauvegarde
      const validation = await AccountingValidationService.validateJournalEntry(entry, companyId);
      
      if (!validation.isValid) {
        throw new Error(`Validation TVA échouée: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      const savedEntries = await this.saveJournalEntries([validation.validatedEntry], journalId);

      return {
        declaration,
        entry: savedEntries[0]
      };

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Erreur déclaration TVA: ${message}`);
    }
  }
}