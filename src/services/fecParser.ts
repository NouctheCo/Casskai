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

import { FECEntry, FECEntrySchema, ImportResult, ImportError, ImportWarning, FileParserOptions } from '../types/accounting-import.types';

/**
 * Service de parsing des fichiers FEC (Fichier des Écritures Comptables)
 * Conforme aux spécifications DGFiP françaises
 */
export class FECParser {
  private static readonly FEC_FIELDS = [
    'JournalCode',      // 0 - Code journal (obligatoire)
    'JournalLib',       // 1 - Libellé journal (obligatoire)
    'EcritureNum',      // 2 - Numéro écriture (obligatoire)
    'EcritureDate',     // 3 - Date écriture AAAAMMJJ (obligatoire)
    'CompteNum',        // 4 - Numéro de compte (obligatoire)
    'CompteLib',        // 5 - Libellé compte (obligatoire)
    'CompAuxNum',       // 6 - Compte auxiliaire (optionnel)
    'CompAuxLib',       // 7 - Libellé compte auxiliaire (optionnel)
    'PieceRef',         // 8 - Référence pièce (obligatoire)
    'PieceDate',        // 9 - Date pièce AAAAMMJJ (obligatoire)
    'EcritureLib',      // 10 - Libellé écriture (obligatoire)
    'Debit',            // 11 - Montant débit (obligatoire)
    'Credit',           // 12 - Montant crédit (obligatoire)
    'EcritureLet',      // 13 - Lettrage (optionnel)
    'DateLet',          // 14 - Date lettrage (optionnel)
    'ValidDate',        // 15 - Date validation (optionnel)
    'Montantdevise',    // 16 - Montant devise (optionnel)
    'Idevise',          // 17 - Identifiant devise (optionnel)
  ];

  /**
   * Détecte automatiquement l'encodage du fichier FEC
   */
  static async detectEncoding(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(result.slice(0, 1024));
        
        // Détection BOM UTF-8
        if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
          resolve('UTF-8');
          return;
        }

        // Détection BOM UTF-16LE
        if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
          resolve('UTF-16LE');
          return;
        }

        // Détection caractères français (heuristique)
        const text = new TextDecoder('UTF-8', { fatal: false }).decode(bytes);
        const frenchChars = /[àáâãäåçèéêëìíîïòóôõöùúûüý]/i;
        
        if (frenchChars.test(text)) {
          resolve('UTF-8');
        } else {
          resolve('ISO-8859-1'); // Windows-1252 par défaut pour les anciens fichiers
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Parse un fichier FEC complet
   */
  static async parseFEC(
    file: File,
    options: FileParserOptions = {}
  ): Promise<ImportResult> {
    const encoding = options.encoding || await this.detectEncoding(file);
    const delimiter = options.delimiter || await this.detectDelimiter(file);
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result;
          const result = this.parseFECContent(content as string, { ...options, delimiter });
          resolve(result as any);
        } catch (err) {
          resolve({
            success: false,
            totalRows: 0,
            validRows: 0,
            errors: [{
              row: 0,
              message: `Erreur de lecture du fichier: ${(err as any).message}`,
              type: 'format',
              severity: 'error'
            }],
            entries: [],
            duplicates: [],
            warnings: []
          });
        }
      };

      reader.onerror = () => {
        resolve({
          success: false,
          totalRows: 0,
          validRows: 0,
          errors: [{
            row: 0,
            message: 'Impossible de lire le fichier',
            type: 'format',
            severity: 'error'
          }],
          entries: [],
          duplicates: [],
          warnings: []
        });
      };

      reader.readAsText(file, encoding);
    });
  }

  /**
   * Détecte le délimiteur du fichier FEC
   */
  private static detectDelimiter(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = (event.target?.result as string).slice(0, 1000);
        const delimiters = ['|', '\t', ';', ','];
        let maxCount = 0;
        let detectedDelimiter = '|';

        delimiters.forEach(delimiter => {
          const count = (content.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
          if (count > maxCount) {
            maxCount = count;
            detectedDelimiter = delimiter;
          }
        });

        resolve(detectedDelimiter);
      };
      reader.readAsText(file.slice(0, 1000));
    });
  }

  /**
   * Parse le contenu textuel du fichier FEC
   */
  private static parseFECContent(
    content: string, 
    options: FileParserOptions
  ): ImportResult {
    const lines = content.split(/\r?\n/);
    const delimiter = options.delimiter || '|';
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];
    const entries: FECEntry[] = [];
    const duplicates: FECEntry[] = [];
    const seenEntries = new Set<string>();

    // Validation de l'en-tête
    if (lines.length === 0) {
      errors.push({
        row: 0,
        message: 'Fichier vide',
        type: 'format',
        severity: 'error'
      });
      return { success: false, totalRows: 0, validRows: 0, errors, entries, duplicates, warnings };
    }

    const headerValidation = this.validateFECHeader(lines[0], delimiter);
    if (!headerValidation.valid) {
      errors.push({
        row: 1,
        message: headerValidation.message ?? 'Format FEC invalide',
        type: 'format',
        severity: 'error'
      });
    }

    // Parse chaque ligne de données
    const dataLines = options.skipFirstRow !== false ? lines.slice(1) : lines;
    
    dataLines.forEach((line, index) => {
      const rowNumber = index + (options.skipFirstRow !== false ? 2 : 1);
      
      if (options.skipEmptyLines && line.trim() === '') {
        return;
      }

      try {
        const fields = this.parseCSVLine(line, delimiter);
        const entry = this.mapFECFields(fields, rowNumber);
        
        // Validation avec Zod
        const validation = FECEntrySchema.safeParse(entry);
        if (!validation.success) {
          validation.error.errors.forEach(err => {
            errors.push({
              row: rowNumber,
              field: err.path.join('.'),
              message: err.message,
              type: 'validation',
              severity: 'error'
            });
          });
          return;
        }

        // Vérification des doublons
        const entryKey = `${entry.journalCode}-${entry.entryNumber}-${entry.accountNumber}`;
        if (seenEntries.has(entryKey)) {
          duplicates.push(entry);
          warnings.push({
            row: rowNumber,
            message: 'Écriture en doublon détectée',
            suggestion: 'Vérifiez les numéros d\'écriture et comptes'
          });
        } else {
          seenEntries.add(entryKey);
          entries.push(entry);
        }

        // Validations métier
        this.validateBusinessRules(entry, rowNumber, warnings);

      } catch (err) {
        errors.push({
          row: rowNumber,
          message: `Erreur de parsing: ${(err as Error).message}`,
          type: 'format',
          severity: 'error'
        });
      }
    });

    return {
      success: errors.length === 0,
      totalRows: dataLines.length,
      validRows: entries.length,
      errors,
      entries,
      duplicates,
      warnings
    };
  }

  /**
   * Valide l'en-tête du fichier FEC
   */
  private static validateFECHeader(headerLine: string, delimiter: string): { valid: boolean, message?: string } {
    const fields = this.parseCSVLine(headerLine, delimiter);
    
    if (fields.length < 13) {
      return {
        valid: false,
        message: `Format FEC invalide: ${fields.length} colonnes trouvées, minimum 13 requis`
      };
    }

    const requiredFields = this.FEC_FIELDS.slice(0, 13);
    const missingFields = requiredFields.filter((field, index) => 
      !fields[index] || fields[index].toLowerCase() !== field.toLowerCase()
    );

    if (missingFields.length > 0) {
      return {
        valid: false,
        message: `En-têtes manquants ou incorrects: ${missingFields.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * Parse une ligne CSV avec gestion des guillemets
   */
  private static parseCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        if (nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = false;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
      i++;
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Mappe les champs du FEC vers notre structure
   */
  private static mapFECFields(fields: string[], rowNumber: number): FECEntry {
    if (fields.length < 13) {
      throw new Error(`Ligne ${rowNumber}: Nombre de colonnes insuffisant (${fields.length}/13)`);
    }

    return {
      journalCode: fields[0]?.trim() || '',
      journalName: fields[1]?.trim() || '',
      entryNumber: fields[2]?.trim() || '',
      date: fields[3]?.trim() || '',
      accountNumber: fields[4]?.trim() || '',
      accountName: fields[5]?.trim() || '',
      auxiliaryAccount: fields[6]?.trim() || undefined,
      auxiliaryName: fields[7]?.trim() || undefined,
      reference: fields[8]?.trim() || '',
      label: fields[10]?.trim() || '',
      debit: this.parseAmount(fields[11]),
      credit: this.parseAmount(fields[12]),
      letterage: fields[13]?.trim() || undefined,
      reconciliation: fields[14]?.trim() || undefined,
      validDate: fields[15]?.trim() || undefined,
      currency: fields[17]?.trim() || undefined,
      currencyDebit: fields[16] ? this.parseAmount(fields[16]) : undefined,
      currencyCredit: fields[16] ? this.parseAmount(fields[16]) : undefined,
    };
  }

  /**
   * Parse un montant avec gestion des formats français
   */
  private static parseAmount(value: string): number {
    if (!value || value.trim() === '') return 0;
    
    // Gestion des formats français (1 234,56)
    const cleanValue = value.trim()
      .replace(/\s/g, '') // Supprime les espaces
      .replace(',', '.'); // Remplace virgule par point
    
    const amount = parseFloat(cleanValue);
    return isNaN(amount) ? 0 : Math.abs(amount);
  }

  /**
   * Validations métier spécifiques
   */
  private static validateBusinessRules(entry: FECEntry, rowNumber: number, warnings: ImportWarning[]): void {
    // Validation de la date
    if (!this.isValidFECDate(entry.date)) {
      warnings.push({
        row: rowNumber,
        field: 'date',
        message: 'Format de date non conforme AAAAMMJJ',
        suggestion: 'Vérifiez le format de date'
      });
    }

    // Validation de l'équilibre sur la ligne (débit OU crédit)
    if (entry.debit > 0 && entry.credit > 0) {
      warnings.push({
        row: rowNumber,
        message: 'Écriture avec débit ET crédit sur la même ligne',
        suggestion: 'Séparez en deux lignes distinctes'
      });
    }

    // Validation du numéro de compte
    if (entry.accountNumber.length < 3) {
      warnings.push({
        row: rowNumber,
        field: 'accountNumber',
        message: 'Numéro de compte trop court',
        suggestion: 'Minimum 3 caractères requis'
      });
    }

    // Validation cohérence journal/compte
    const accountClass = entry.accountNumber.charAt(0);
    if (this.isJournalAccountMismatch(entry.journalCode, accountClass)) {
      warnings.push({
        row: rowNumber,
        message: 'Incohérence journal/classe de compte',
        suggestion: 'Vérifiez la correspondance journal/comptes'
      });
    }
  }

  /**
   * Valide un format de date FEC (AAAAMMJJ)
   */
  private static isValidFECDate(dateStr: string): boolean {
    if (!/^\d{8}$/.test(dateStr)) return false;
    
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6));
    const day = parseInt(dateStr.substring(6, 8));
    
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day;
  }

  /**
   * Détecte les incohérences journal/compte
   */
  private static isJournalAccountMismatch(journalCode: string, accountClass: string): boolean {
    const journalRules: Record<string, string[]> = {
      'VT': ['7', '4'], // Ventes -> Comptes 7xx et 4xx
      'AC': ['6', '4'], // Achats -> Comptes 6xx et 4xx
      'BQ': ['5', '4'], // Banque -> Comptes 5xx et 4xx
      'CA': ['5', '3'], // Caisse -> Comptes 5xx et 3xx
      'OD': [], // Opérations diverses -> Tous comptes
    };

    const allowedClasses = journalRules[journalCode.toUpperCase()];
    if (!allowedClasses || allowedClasses.length === 0) return false;
    
    return !allowedClasses.includes(accountClass);
  }
}
