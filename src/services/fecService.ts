// Service de parsing et validation de fichiers FEC (Fichier des Écritures Comptables)
// Conforme aux normes DGFiP (Direction Générale des Finances Publiques)

import { supabase } from '@/lib/supabase';

export interface FECEntry {
  JournalCode: string;
  JournalLib: string;
  EcritureNum: string;
  EcritureDate: string;
  CompteNum: string;
  CompteLib: string;
  CompAuxNum?: string;
  CompAuxLib?: string;
  PieceRef: string;
  PieceDate: string;
  EcritureLib: string;
  Debit: number;
  Credit: number;
  EcritureLet?: string;
  DateLet?: string;
  ValidDate: string;
  Montantdevise?: number;
  Idevise?: string;
}

export interface FECAnalysisResult {
  isValid: boolean;
  totalEntries: number;
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
  balanceDifference: number;
  errors: string[];
  warnings: string[];
  journalCount: number;
  accountCount: number;
  dateRange: {
    start: string;
    end: string;
  };
  entries: FECEntry[];
  statistics: {
    byJournal: Record<string, number>;
    byMonth: Record<string, number>;
    byAccount: Record<string, number>;
  };
}

export class FECService {
  private static instance: FECService;
  
  // Colonnes obligatoires selon DGFiP (pipe-separated)
  private static readonly REQUIRED_COLUMNS = [
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
  ];

  static getInstance(): FECService {
    if (!this.instance) {
      this.instance = new FECService();
    }
    return this.instance;
  }

  /**
   * ✅ Analyser un fichier FEC
   */
  async analyzeFECFile(file: File): Promise<FECAnalysisResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const entries: FECEntry[] = [];
    
    let totalDebit = 0;
    let totalCredit = 0;
    const journals = new Set<string>();
    const accounts = new Set<string>();
    const byJournal: Record<string, number> = {};
    const byMonth: Record<string, number> = {};
    const byAccount: Record<string, number> = {};
    
    let minDate = '';
    let maxDate = '';

    try {
      // Lire le fichier
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim());

      if (lines.length === 0) {
        errors.push('Fichier vide');
        return this.createErrorResult(errors);
      }

      // Vérifier l'en-tête (ligne 1)
      const headers = lines[0].split('|');
      
      if (headers.length !== 18) {
        errors.push(`Format invalide: ${headers.length} colonnes trouvées, 18 attendues selon norme DGFiP`);
      }

      // Vérifier que les colonnes correspondent
      for (let i = 0; i < FECService.REQUIRED_COLUMNS.length; i++) {
        if (headers[i] !== FECService.REQUIRED_COLUMNS[i]) {
          errors.push(`Colonne ${i + 1} invalide: "${headers[i]}" au lieu de "${FECService.REQUIRED_COLUMNS[i]}"`);
        }
      }

      // Parser les lignes de données
      for (let lineNum = 1; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum].trim();
        if (!line) continue;

        const cols = line.split('|');

        if (cols.length !== 18) {
          warnings.push(`Ligne ${lineNum + 1}: ${cols.length} colonnes au lieu de 18`);
          continue;
        }

        // Parser l'écriture
        try {
          const entry: FECEntry = {
            JournalCode: cols[0].trim(),
            JournalLib: cols[1].trim(),
            EcritureNum: cols[2].trim(),
            EcritureDate: cols[3].trim(),
            CompteNum: cols[4].trim(),
            CompteLib: cols[5].trim(),
            CompAuxNum: cols[6]?.trim(),
            CompAuxLib: cols[7]?.trim(),
            PieceRef: cols[8].trim(),
            PieceDate: cols[9].trim(),
            EcritureLib: cols[10].trim(),
            Debit: this.parseAmount(cols[11]),
            Credit: this.parseAmount(cols[12]),
            EcritureLet: cols[13]?.trim(),
            DateLet: cols[14]?.trim(),
            ValidDate: cols[15].trim(),
            Montantdevise: cols[16] ? this.parseAmount(cols[16]) : undefined,
            Idevise: cols[17]?.trim()
          };

          // Validations
          if (!this.isValidDate(entry.EcritureDate)) {
            warnings.push(`Ligne ${lineNum + 1}: Date d'écriture invalide "${entry.EcritureDate}"`);
          }

          if (!entry.JournalCode) {
            warnings.push(`Ligne ${lineNum + 1}: Code journal manquant`);
          }

          if (!entry.CompteNum) {
            warnings.push(`Ligne ${lineNum + 1}: Numéro de compte manquant`);
          }

          // Accumuler les totaux
          totalDebit += entry.Debit;
          totalCredit += entry.Credit;

          // Statistiques
          journals.add(entry.JournalCode);
          accounts.add(entry.CompteNum);

          byJournal[entry.JournalCode] = (byJournal[entry.JournalCode] || 0) + 1;
          
          const month = entry.EcritureDate.substring(0, 7); // YYYY-MM
          byMonth[month] = (byMonth[month] || 0) + 1;
          
          byAccount[entry.CompteNum] = (byAccount[entry.CompteNum] || 0) + 1;

          // Dates min/max
          if (!minDate || entry.EcritureDate < minDate) minDate = entry.EcritureDate;
          if (!maxDate || entry.EcritureDate > maxDate) maxDate = entry.EcritureDate;

          entries.push(entry);

        } catch (error) {
          warnings.push(`Ligne ${lineNum + 1}: Erreur de parsing - ${error}`);
        }
      }

      // Vérifier l'équilibre débit/crédit
      const balanceDifference = Math.abs(totalDebit - totalCredit);
      const balanced = balanceDifference < 0.01; // Tolérance de 1 centime

      if (!balanced) {
        errors.push(`Fichier déséquilibré: différence de ${balanceDifference.toFixed(2)}€ entre débit et crédit`);
      }

      // Vérifier la cohérence des dates
      if (minDate > maxDate) {
        errors.push('Dates incohérentes dans le fichier');
      }

      return {
        isValid: errors.length === 0,
        totalEntries: entries.length,
        totalDebit: Math.round(totalDebit * 100) / 100,
        totalCredit: Math.round(totalCredit * 100) / 100,
        balanced,
        balanceDifference: Math.round(balanceDifference * 100) / 100,
        errors,
        warnings,
        journalCount: journals.size,
        accountCount: accounts.size,
        dateRange: {
          start: minDate,
          end: maxDate
        },
        entries,
        statistics: {
          byJournal,
          byMonth,
          byAccount
        }
      };

    } catch (error) {
      errors.push(`Erreur critique: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      return this.createErrorResult(errors);
    }
  }

  /**
   * ✅ Importer les écritures FEC dans Supabase
   */
  async importFECToSupabase(
    companyId: string,
    entries: FECEntry[],
    fiscalYear: string
  ): Promise<{ success: boolean; imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;

    try {
      // Commencer une transaction
      for (const entry of entries) {
        try {
          // Créer ou récupérer le compte
          const { data: account } = await supabase
            .from('accounts')
            .select('id')
            .eq('company_id', companyId)
            .eq('number', entry.CompteNum)
            .single();

          let accountId = account?.id;

          if (!accountId) {
            // Créer le compte s'il n'existe pas
            const { data: newAccount, error: accountError } = await supabase
              .from('accounts')
              .insert({
                company_id: companyId,
                number: entry.CompteNum,
                name: entry.CompteLib,
                class: entry.CompteNum.charAt(0),
                is_active: true
              })
              .select()
              .single();

            if (accountError) throw accountError;
            accountId = newAccount.id;
          }

          // Insérer l'écriture comptable
          const { error: entryError } = await supabase
            .from('journal_entries')
            .insert({
              company_id: companyId,
              account_id: accountId,
              entry_date: entry.EcritureDate,
              description: entry.EcritureLib,
              debit: entry.Debit,
              credit: entry.Credit,
              reference: entry.PieceRef,
              journal_code: entry.JournalCode,
              entry_number: entry.EcritureNum,
              fiscal_year: fiscalYear,
              created_at: new Date().toISOString()
            });

          if (entryError) throw entryError;
          
          imported++;

        } catch (error) {
          errors.push(`Erreur ligne ${entry.EcritureNum}: ${error}`);
        }
      }

      return {
        success: errors.length === 0,
        imported,
        errors
      };

    } catch (error) {
      errors.push(`Erreur d'import: ${error}`);
      return { success: false, imported, errors };
    }
  }

  /**
   * Parser un montant (virgule ou point décimal)
   */
  private parseAmount(value: string): number {
    if (!value || value.trim() === '') return 0;
    
    // Remplacer la virgule par un point
    const normalized = value.trim().replace(',', '.');
    const amount = parseFloat(normalized);
    
    return isNaN(amount) ? 0 : amount;
  }

  /**
   * Vérifier si une date est valide au format YYYYMMDD
   */
  private isValidDate(dateStr: string): boolean {
    if (!dateStr || dateStr.length !== 8) return false;
    
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6));
    const day = parseInt(dateStr.substring(6, 8));
    
    if (year < 1900 || year > 2100) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    
    return true;
  }

  /**
   * Créer un résultat d'erreur
   */
  private createErrorResult(errors: string[]): FECAnalysisResult {
    return {
      isValid: false,
      totalEntries: 0,
      totalDebit: 0,
      totalCredit: 0,
      balanced: false,
      balanceDifference: 0,
      errors,
      warnings: [],
      journalCount: 0,
      accountCount: 0,
      dateRange: { start: '', end: '' },
      entries: [],
      statistics: {
        byJournal: {},
        byMonth: {},
        byAccount: {}
      }
    };
  }
}

export const fecService = FECService.getInstance();
