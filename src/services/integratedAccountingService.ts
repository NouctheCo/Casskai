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
import { FECParser } from './fecParser';
import { CSVImportService } from './csvImportService';
import { AccountingValidationService } from './accountingValidationService';
import { EntryTemplatesService } from './entryTemplatesService';
import { VATCalculationService } from './vatCalculationService';
import { AutomaticLetterageService } from './automaticLetterageService';
import { supabase } from '../lib/supabase';
import { ImportResult, ImportSession, JournalEntryType, FECEntry } from '../types/accounting-import.types';
import { logger } from '@/lib/logger';
// Shape of rows returned by FEC export query
type FECQueryRow = {
  debit_amount: number | null;
  credit_amount: number | null;
  description: string | null;
  auxiliary_account?: string | null;
  letterage?: string | null;
  account_number?: string | null;
  account_name?: string | null;
  journal_entries: {
    entry_number: string;
    entry_date: string;
    reference_number?: string | null;
    reference?: string | null;
    description?: string | null;
    journals: { code: string; name: string } | null;
  } | null;
};
/**
 * Service intégré pour toutes les opérations d'import/export comptable
 */
export class IntegratedAccountingService {
  // Row shape for FEC export query
  private static readonly FEC_FIELDS_HEADER = [
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
  ] as const;
  private static buildFECHeader(): string {
    return (this.FEC_FIELDS_HEADER as readonly string[]).join('|');
  }
  private static mapRowToFECLine(item: FECQueryRow): string {
    const entry = (item?.journal_entries ?? {
          entry_number: '',
          entry_date: new Date().toISOString(),
          reference: '',
          description: '',
          journals: null
    }) as NonNullable<FECQueryRow['journal_entries']>;
    const journal = entry.journals ?? { code: '', name: '' };
    const journalCode = String(journal.code || '');
    const journalName = String(journal.name || '');
    const entryNumber = String(entry.entry_number || '');
    const entryDate = this.formatFECDate(String(entry.entry_date || new Date().toISOString()));
    const accountNum = String(item.account_number || '');
    const accountName = String(item.account_name || '');
    const compAuxNum = String(item.auxiliary_account || '');
    const pieceRef = String(entry.reference_number || entry.reference || '');
    const pieceDate = entryDate;
    const label = String(item.description || entry.description || '');
    const debit = this.formatFECAmount(Number(item.debit_amount || 0));
    const credit = this.formatFECAmount(Number(item.credit_amount || 0));
    const ecritureLet = String(item.letterage || '');
    const dateLet = '';
    const validDate = entryDate;
    const montantDevise = '';
    const iDevise = '';
    return [
      journalCode,
      journalName,
      entryNumber,
      entryDate,
      accountNum,
      accountName,
      compAuxNum,
      '',
      pieceRef,
      pieceDate,
      label,
      debit,
      credit,
      ecritureLet,
      dateLet,
      validDate,
      montantDevise,
      iDevise
    ].join('|');
  }
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
  format: format === 'auto' ? this.detectFormat(file) : (format as 'FEC' | 'CSV' | 'Excel'),
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
      const result: ImportResult = await this.parseImport(
        file,
        session.format,
        { encoding: options.encoding, delimiter: options.delimiter, skipFirstRow: options.skipFirstRow }
      );
      onProgress?.(25, `${result.entries.length} écritures parsées`);
      // PHASE 2: Création des comptes manquants si nécessaire
      if (options.createMissingAccounts) {
        onProgress?.(30, 'Vérification des comptes...');
        await this.ensureAccountsExist(result.entries, companyId);
      }
      // PHASE 3: Validation
      let validated: JournalEntryType[] = [];
      if (options.validateBeforeImport !== false) {
        onProgress?.(35, 'Validation des écritures...');
        const validation = await AccountingValidationService.validateBatch(
          result.entries, 
          companyId
        );
        validated = validation.valid;
        // Agréger erreurs/avertissements dans result
        result.errors.push(...validation.invalid.flatMap(inv => inv.errors));
        result.warnings.push(...validation.warnings);
      }
      onProgress?.(60, `${validated.length} écritures validées`);
      // PHASE 4: Sauvegarde
      onProgress?.(65, 'Sauvegarde en base...');
      const savedEntries = await this.saveJournalEntries(validated, journalId);
      onProgress?.(85, `${savedEntries.length} écritures sauvegardées`);
      // PHASE 5: Lettrage automatique
      if (options.autoLetterage) {
        onProgress?.(90, 'Lettrage automatique...');
        await AutomaticLetterageService.performAutoLetterage(companyId);
      }
      onProgress?.(100, 'Import terminé');
      return {
        ...result,
        validRows: savedEntries.length
      };
    } catch (error) {
      const message = (error as { message?: string })?.message || 'inconnu';
      throw new Error(`Erreur import: ${message}`);
    }
  }
  // Helper parsing
  private static async parseImport(
    file: File,
    format: 'FEC' | 'CSV' | 'Excel',
    options: { encoding?: string; delimiter?: string; skipFirstRow?: boolean }
  ): Promise<ImportResult> {
    switch (format) {
      case 'FEC':
        return FECParser.parseFEC(file, {
          encoding: options.encoding,
          skipFirstRow: options.skipFirstRow,
          skipEmptyLines: true
        });
      case 'CSV': {
        const analysis = await CSVImportService.analyzeFile(file);
        return CSVImportService.importWithMapping(
          file,
          analysis.suggestedMapping,
          {
            encoding: options.encoding,
            delimiter: options.delimiter,
            skipFirstRow: options.skipFirstRow
          }
        );
      }
      case 'Excel': {
        const excelAnalysis = await CSVImportService.analyzeFile(file);
        return CSVImportService.importWithMapping(
          file,
          excelAnalysis.suggestedMapping
        );
      }
      default:
        throw new Error(`Format ${format} non supporté`);
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
  private static async ensureAccountsExist(entries: FECEntry[], companyId: string): Promise<void> {
    const accountNumbers = new Set<string>();
    entries.forEach((entry) => {
      if (entry.accountNumber) accountNumbers.add(entry.accountNumber);
    });
    await Promise.all(
      Array.from(accountNumbers).map((acc) => this.ensureAccountExists(acc, companyId))
    );
  }
  /**
   * Assure qu'un compte spécifique existe
   */
  private static async ensureAccountExists(accountNumber: string, companyId: string): Promise<string> {
    // Vérification de l'existence
    const existing = await supabase
      .from('chart_of_accounts')
      .select('id')
      .eq('company_id', companyId)
      .eq('account_number', accountNumber)
      .single();
    if (existing.data) {
      return existing.data.id;
    }
    // Création du compte
    const accountData = this.generateAccountData(accountNumber, companyId);
    const { data, error } = await supabase
      .from('chart_of_accounts')
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
    const numericClass = Number.parseInt(accountClass, 10);
    return {
      company_id: companyId,
      account_number: accountNumber,
      account_name: accountName,
      account_type: accountType,
      account_class: Number.isNaN(numericClass) ? null : numericClass,
      is_active: true,
      is_detail_account: true,
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
  "120": "Résultat de l'exercice",
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
  "661": "Charges d'intérêts",
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
      '1': 'equity',
      '2': 'asset',
      '3': 'asset',
      '4': 'liability',
      '5': 'asset',
      '6': 'expense',
      '7': 'revenue',
      '8': 'expense',
      '9': 'expense'
    };
    return typeMapping[accountClass] || 'asset';
  }
  /**
   * Sauvegarde les écritures en base
   */
  private static async saveJournalEntries(entries: JournalEntryType[], journalId: string): Promise<JournalEntryType[]> {
    const tasks = entries.map(async (entry) => {
      try {
        const { data: journalEntry, error: entryError } = await supabase
          .from('journal_entries')
          .insert({
            company_id: entry.companyId,
            journal_id: journalId,
            entry_number: entry.entryNumber,
            entry_date: entry.date,
            description: entry.description,
            reference: entry.reference,
            status: 'validated'
          })
          .select('id')
          .single();
        if (entryError) {
          throw new Error(`Erreur sauvegarde écriture: ${entryError.message}`);
        }
        const accountIds = Array.from(new Set(entry.items.map((item) => item.accountId))).filter(Boolean);
        let accountMap = new Map<string, { account_number?: string | null; account_name?: string | null }>();
        if (accountIds.length > 0) {
          const { data: accountsData, error: accountsError } = await supabase
            .from('chart_of_accounts')
            .select('id, account_number, account_name')
            .eq('company_id', entry.companyId)
            .in('id', accountIds as string[]);
          if (accountsError) {
            throw new Error(`Erreur récupération comptes: ${accountsError.message}`);
          }
          accountMap = new Map((accountsData ?? []).map((account) => [account.id, account]));
        }
        const entryItems = entry.items.map((item, index) => {
          const accountInfo = accountMap.get(item.accountId);
          return {
            journal_entry_id: journalEntry.id,
            account_id: item.accountId,
            debit_amount: item.debitAmount,
            credit_amount: item.creditAmount,
            description: item.description,
            auxiliary_account: item.auxiliaryAccount,
            letterage: item.letterage,
            line_order: index + 1,
            account_number: accountInfo?.account_number ?? null,
            account_name: accountInfo?.account_name ?? null
          };
        });
        if (entryItems.length > 0) {
          const { error: itemsError } = await supabase
            .from('journal_entry_lines')
            .insert(entryItems);
          if (itemsError) {
            throw new Error(`Erreur sauvegarde lignes: ${itemsError.message}`);
          }
        }
        return { ...entry, id: journalEntry.id } as JournalEntryType;
      } catch (error) {
        logger.error('IntegratedAccounting', `Erreur sauvegarde écriture ${entry.entryNumber}:`, error instanceof Error ? error.message : String(error));
        return entry; // fallback
      }
    });
    return Promise.all(tasks);
  }
  /**
   * Export FEC d'une entreprise
   */
  static async exportFEC(companyId: string, year: number): Promise<string> {
    // Récupération des écritures de l'année
    const { data: entries, error } = await supabase
      .from('journal_entry_lines')
      .select(`
        debit_amount,
        credit_amount,
        description,
        auxiliary_account,
        letterage,
        account_number,
        account_name,
        line_order,
        journal_entries (
          entry_number,
          entry_date,
          reference_number,
          description,
          journals (code, name)
        )
      `)
      .eq('journal_entries.company_id', companyId)
      .gte('journal_entries.entry_date', `${year}-01-01`)
      .lte('journal_entries.entry_date', `${year}-12-31`)
      .order('journal_entries.entry_date');
    if (error || !entries) {
      const message = (error as { message?: string })?.message || 'inconnu';
      throw new Error(`Erreur export FEC: ${message}`);
    }
  // Génération du contenu FEC
  const header = this.buildFECHeader();
  const body = (entries as unknown as FECQueryRow[]).map((row) => this.mapRowToFECLine(row));
  return [header, ...body].join('\n');
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
    variables: Record<string, unknown>,
    journalId: string
  ): Promise<JournalEntryType> {
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
  if (!validation.validatedEntry) {
    throw new Error('Validation échoué: écriture invalide');
  }
  const savedEntries = await this.saveJournalEntries([validation.validatedEntry], journalId);
  return savedEntries[0];
    } catch (error) {
      const message = (error as { message?: string })?.message || 'inconnu';
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
  ): Promise<{ declaration: unknown; entry: JournalEntryType }> {
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
  if (!validation.validatedEntry) {
    throw new Error('Validation TVA échouée: écriture invalide');
  }
  const savedEntries = await this.saveJournalEntries([validation.validatedEntry], journalId);
      return {
        declaration,
        entry: savedEntries[0]
      };
    } catch (error) {
      const message = (error as { message?: string })?.message || 'inconnu';
      throw new Error(`Erreur déclaration TVA: ${message}`);
    }
  }
}