// ExcelJS import conditionnel pour éviter les problèmes de build
let ExcelJS: typeof import('exceljs') | null = null;
try {
  ExcelJS = require('exceljs');
} catch (error) {
  console.warn('ExcelJS not available in browser environment');
}
import { CSVMapping, ImportResult, ImportError, ImportWarning, FileParserOptions, ImportSession, FECEntry } from '../types/accounting-import.types';

/**
 * Service d'import CSV/Excel avec mapping intelligent des colonnes
 */
export class CSVImportService {
  private static readonly FIELD_PATTERNS: Record<string, RegExp[]> = {
    date: [
      /date/i, /jour/i, /échéance/i, /echeance/i, /datum/i
    ],
    accountNumber: [
      /compte/i, /account/i, /numero.?compte/i, /n°.?compte/i, /cpt/i
    ],
    accountName: [
      /libellé.?compte/i, /libelle.?compte/i, /nom.?compte/i, /account.?name/i
    ],
    journalCode: [
      /journal/i, /code.?journal/i, /jrn/i
    ],
    reference: [
      /référence/i, /reference/i, /ref/i, /numéro/i, /numero/i, /n°/i, /piece/i
    ],
    label: [
      /libellé/i, /libelle/i, /description/i, /label/i, /intitulé/i, /intitule/i
    ],
    debit: [
      /débit/i, /debit/i, /doit/i, /montant.?débit/i, /montant.?debit/i
    ],
    credit: [
      /crédit/i, /credit/i, /avoir/i, /montant.?crédit/i, /montant.?credit/i
    ],
    amount: [
      /montant/i, /amount/i, /somme/i, /valeur/i, /value/i
    ],
    thirdParty: [
      /tiers/i, /client/i, /fournisseur/i, /supplier/i, /customer/i, /third.?party/i
    ]
  };

  /**
   * Analyse un fichier pour détecter le format et proposer un mapping
   */
  static async analyzeFile(file: File): Promise<{
    format: 'CSV' | 'Excel';
    encoding: string;
    delimiter?: string;
    sheets?: string[];
    preview: Array<Record<string, unknown>>;
    suggestedMapping: CSVMapping[];
  }> {
    const format = this.detectFileFormat(file);
    
    if (format === 'Excel') {
      return this.analyzeExcelFile(file);
    } else {
      return this.analyzeCSVFile(file);
    }
  }

  /**
   * Détecte le format du fichier
   */
  private static detectFileFormat(file: File): 'CSV' | 'Excel' {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const excelExtensions = ['xlsx', 'xls', 'xlsm'];
    return excelExtensions.includes(extension || '') ? 'Excel' : 'CSV';
  }

  /**
   * Analyse un fichier Excel
   */
  private static async analyzeExcelFile(file: File): Promise<{
    format: 'CSV' | 'Excel';
    encoding: string;
    delimiter?: string;
    sheets?: string[];
    preview: Array<Record<string, unknown>>;
    suggestedMapping: CSVMapping[];
  }> {
    if (!ExcelJS) {
      throw new Error('ExcelJS n\'est pas disponible dans cet environnement. Veuillez utiliser des fichiers CSV.');
    }
    
    try {
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        throw new Error('Aucune feuille trouvée dans le fichier Excel');
      }

      const jsonData: string[][] = [];
      worksheet.eachRow((row, rowNumber) => {
        const rowData: string[] = [];
        row.eachCell({ includeEmpty: true }, (cell) => {
          rowData.push(cell.value?.toString() || '');
        });
        jsonData.push(rowData);
      });

      if (jsonData.length === 0) {
        throw new Error('Le fichier Excel est vide');
      }

      const headers = jsonData[0] as string[];
      const preview = jsonData.slice(0, 6).map((row: string[]) =>
        headers.reduce((obj, header, colIndex) => {
          obj[header || `Column${colIndex + 1}`] = row[colIndex] || '';
          return obj;
        }, {} as Record<string, string>)
      );

      const suggestedMapping = this.generateSmartMapping(headers);
      const sheetNames = workbook.worksheets.map(ws => ws.name);

      return {
        format: 'Excel',
        encoding: 'UTF-8',
        sheets: sheetNames,
        preview: preview.slice(1), // Skip header row
        suggestedMapping
      };
    } catch (error) {
      throw new Error(`Erreur lors de l'analyse Excel: ${error.message}`);
    }
  }

  /**
   * Analyse un fichier CSV
   */
  private static async analyzeCSVFile(file: File): Promise<{
    format: 'CSV' | 'Excel';
    encoding: string;
    delimiter?: string;
    sheets?: string[];
    preview: Array<Record<string, unknown>>;
    suggestedMapping: CSVMapping[];
  }> {
    const encoding = await this.detectCSVEncoding(file);
    const delimiter = await this.detectCSVDelimiter(file, encoding);

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const lines = content.split(/\r?\n/).filter(line => line.trim());
          
          if (lines.length === 0) {
            throw new Error('Fichier CSV vide');
          }

          const headers = this.parseCSVLine(lines[0], delimiter);
          const preview = lines.slice(1, 6).map(line => {
            const values = this.parseCSVLine(line, delimiter);
            return headers.reduce((obj, header, index) => {
              obj[header || `Column${index + 1}`] = values[index] || '';
              return obj;
            }, {} as Record<string, string>);
          });

          const suggestedMapping = this.generateSmartMapping(headers);

          resolve({
            format: 'CSV',
            encoding,
            delimiter,
            preview,
            suggestedMapping
          });
        } catch (error) {
          reject(new Error(`Erreur lors de l'analyse CSV: ${error.message}`));
        }
      };
      reader.onerror = () => reject(new Error('Impossible de lire le fichier CSV'));
      reader.readAsText(file, encoding);
    });
  }

  /**
   * Génère un mapping intelligent basé sur les noms de colonnes
   */
  private static generateSmartMapping(headers: string[]): CSVMapping[] {
    const mapping: CSVMapping[] = [];
    const usedColumns = new Set<number>();

    // Mapping automatique basé sur les patterns
    Object.entries(this.FIELD_PATTERNS).forEach(([fieldName, patterns]) => {
      for (let i = 0; i < headers.length; i++) {
        if (usedColumns.has(i)) continue;

        const header = headers[i];
        if (patterns.some(pattern => pattern.test(header))) {
          mapping.push({
            fieldName,
            columnIndex: i,
            columnName: header,
            isRequired: this.isRequiredField(fieldName),
            dataType: this.getFieldDataType(fieldName)
          });
          usedColumns.add(i);
          break;
        }
      }
    });

    // Détection spéciale pour les montants
    this.detectAmountColumns(headers, mapping, usedColumns);

    // Tri par ordre d'importance
    const fieldOrder = [
      'date', 'accountNumber', 'accountName', 'journalCode', 
      'reference', 'label', 'debit', 'credit', 'amount'
    ];

    mapping.sort((a, b) => {
      const aIndex = fieldOrder.indexOf(a.fieldName);
      const bIndex = fieldOrder.indexOf(b.fieldName);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

    return mapping;
  }

  /**
   * Détection spécialisée des colonnes de montants
   */
  private static detectAmountColumns(
    headers: string[], 
    mapping: CSVMapping[], 
    usedColumns: Set<number>
  ): void {
    // Si pas de débit/crédit trouvés, chercher des colonnes montants
    const hasDebit = mapping.some(m => m.fieldName === 'debit');
    const hasCredit = mapping.some(m => m.fieldName === 'credit');

    if (!hasDebit && !hasCredit) {
      for (let i = 0; i < headers.length; i++) {
        if (usedColumns.has(i)) continue;

        const header = headers[i].toLowerCase();
        if (header.includes('montant') || header.includes('amount')) {
          // Analyser le contexte pour déterminer débit/crédit
          if (header.includes('débit') || header.includes('debit') || header.includes('doit')) {
            mapping.push({
              fieldName: 'debit',
              columnIndex: i,
              columnName: headers[i],
              isRequired: true,
              dataType: 'amount'
            });
          } else if (header.includes('crédit') || header.includes('credit') || header.includes('avoir')) {
            mapping.push({
              fieldName: 'credit',
              columnIndex: i,
              columnName: headers[i],
              isRequired: true,
              dataType: 'amount'
            });
          } else {
            // Montant générique - pourrait être débit ou crédit
            mapping.push({
              fieldName: 'amount',
              columnIndex: i,
              columnName: headers[i],
              isRequired: true,
              dataType: 'amount',
              transform: (value: string) => ({
                debit: parseFloat(value) > 0 ? Math.abs(parseFloat(value)) : 0,
                credit: parseFloat(value) < 0 ? Math.abs(parseFloat(value)) : 0
              })
            });
          }
          usedColumns.add(i);
          break;
        }
      }
    }
  }

  /**
   * Import avec mapping personnalisé
   */
  static async importWithMapping(
    file: File,
    mapping: CSVMapping[],
    options: FileParserOptions = {}
  ): Promise<ImportResult> {
    const format = this.detectFileFormat(file);
    
    if (format === 'Excel') {
      return this.importExcelWithMapping(file, mapping, options);
    } else {
      return this.importCSVWithMapping(file, mapping, options);
    }
  }

  /**
   * Import Excel avec mapping
   */
  private static async importExcelWithMapping(
    file: File,
    mapping: CSVMapping[],
    options: FileParserOptions
  ): Promise<ImportResult> {
    try {
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        return this.createErrorResult('Aucune feuille trouvée dans le fichier Excel');
      }

      const jsonData: string[][] = [];
      worksheet.eachRow((row) => {
        const rowData: string[] = [];
        row.eachCell({ includeEmpty: true }, (cell) => {
          rowData.push(cell.value?.toString() || '');
        });
        jsonData.push(rowData);
      });
      
      const result = this.processDataWithMapping(jsonData, mapping, options);
      return result;
    } catch (error) {
      return this.createErrorResult(error.message);
    }
  }

  /**
   * Import CSV avec mapping
   */
  private static async importCSVWithMapping(
    file: File,
    mapping: CSVMapping[],
    options: FileParserOptions
  ): Promise<ImportResult> {
    const encoding = options.encoding || await this.detectCSVEncoding(file);
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const lines = content.split(/\r?\n/).filter(line => line.trim());
          const delimiter = options.delimiter || ',';

          const data = lines.map(line => this.parseCSVLine(line, delimiter));
          const result = this.processDataWithMapping(data, mapping, options);
          resolve(result);
        } catch (error) {
          resolve(this.createErrorResult(error.message));
        }
      };
      reader.onerror = () => resolve(this.createErrorResult('Impossible de lire le fichier CSV'));
      reader.readAsText(file, encoding);
    });
  }

  /**
   * Traite les données avec le mapping fourni
   */
  private static processDataWithMapping(
    data: string[][],
    mapping: CSVMapping[],
    options: FileParserOptions
  ): ImportResult {
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];
    const entries: FECEntry[] = [];
    
    const startRow = options.skipFirstRow !== false ? 1 : 0;
    const dataRows = data.slice(startRow);

    dataRows.forEach((row, index) => {
      const rowNumber = index + startRow + 1;
      
      if (options.skipEmptyLines && this.isEmptyRow(row)) {
        return;
      }

      try {
        const entry = this.mapRowToEntry(row, mapping, rowNumber);
        
        // Validation de base
        const validationErrors = this.validateMappedEntry(entry, rowNumber);
        if (validationErrors.length > 0) {
          errors.push(...validationErrors);
        } else {
          entries.push(entry);
        }

      } catch (error) {
        errors.push({
          row: rowNumber,
          message: `Erreur de mapping: ${error.message}`,
          type: 'format',
          severity: 'error'
        });
      }
    });

    return {
      success: errors.length === 0,
      totalRows: dataRows.length,
      validRows: entries.length,
      errors,
      entries,
      duplicates: [],
      warnings
    };
  }

  /**
   * Mappe une ligne vers un objet entry
   */
  private static mapRowToEntry(row: string[], mapping: CSVMapping[], rowNumber: number): Partial<FECEntry> {
    const entry: Record<string, unknown> = {};

    mapping.forEach(map => {
      const rawValue = row[map.columnIndex] || map.defaultValue || '';
      
      try {
        let processedValue = this.processFieldValue(rawValue, map.dataType);
        
        if (map.transform) {
          processedValue = map.transform(processedValue);
        }
        
        entry[map.fieldName] = processedValue;
      } catch (error) {
        throw new Error(`Colonne ${map.columnName}: ${error.message}`);
      }
    });

    return entry as Partial<FECEntry>;
  }

  /**
   * Traite une valeur selon son type
   */
  private static processFieldValue(value: unknown, dataType: string): string | number | Date {
    if (value === null || value === undefined || value === '') {
      return dataType === 'number' || dataType === 'amount' ? 0 : '';
    }

    const stringValue = String(value).trim();

    switch (dataType) {
      case 'number':
      case 'amount':
        return this.parseNumber(stringValue);
      case 'date':
        return this.parseDate(stringValue);
      case 'string':
      default:
        return stringValue;
    }
  }

  /**
   * Parse un nombre avec gestion des formats internationaux
   */
  private static parseNumber(value: string): number {
    if (!value) return 0;
    
    // Nettoyage et normalisation
    let cleanValue = value.replace(/[^\d,.-]/g, ''); // Garde seulement chiffres, virgules, points, tirets
    
    // Détection du format (1,234.56 vs 1.234,56)
    const lastComma = cleanValue.lastIndexOf(',');
    const lastDot = cleanValue.lastIndexOf('.');
    
    if (lastComma > lastDot) {
      // Format européen: 1.234,56
      cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
    } else if (lastDot > lastComma) {
      // Format anglo-saxon: 1,234.56
      cleanValue = cleanValue.replace(/,/g, '');
    }
    
    const result = parseFloat(cleanValue);
    return isNaN(result) ? 0 : result;
  }

  /**
   * Parse une date avec détection automatique du format
   */
  private static parseDate(value: string): string {
    if (!value) return '';
    
    // Formats communs à détecter
    const formats = [
      /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/, // DD/MM/YYYY
      /^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/, // YYYY/MM/DD
      /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2})$/,  // DD/MM/YY
    ];

    for (const format of formats) {
      const match = value.match(format);
      if (match) {
        const [, part1, part2, part3] = match;
        
        // Déterminer l'ordre des composants
        if (part3.length === 4) {
          // Format avec année à 4 chiffres
          if (parseInt(part1) > 12) {
            // DD/MM/YYYY
            return `${part3}-${part2.padStart(2, '0')}-${part1.padStart(2, '0')}`;
          } else {
            // YYYY/MM/DD ou MM/DD/YYYY
            return parseInt(part1) > 31 
              ? `${part1}-${part2.padStart(2, '0')}-${part3.padStart(2, '0')}`
              : `${part3}-${part1.padStart(2, '0')}-${part2.padStart(2, '0')}`;
          }
        } else {
          // Format avec année à 2 chiffres - assume 20xx
          const year = `20${part3}`;
          return `${year}-${part2.padStart(2, '0')}-${part1.padStart(2, '0')}`;
        }
      }
    }
    
    return value; // Retourne tel quel si pas de format reconnu
  }

  // Méthodes utilitaires
  private static parseCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i - 1] === delimiter || line[i - 1] === ' ')) {
        inQuotes = true;
      } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i + 1] === delimiter)) {
        inQuotes = false;
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

  private static async detectCSVEncoding(file: File): Promise<string> {
    // Réutilise la logique de FECParser
    return 'UTF-8'; // Simplifié pour cet exemple
  }

  private static async detectCSVDelimiter(file: File, encoding: string): Promise<string> {
    // Réutilise la logique de FECParser
    return ';'; // Délimiteur par défaut français
  }

  private static isRequiredField(fieldName: string): boolean {
    const requiredFields = ['date', 'accountNumber', 'label'];
    return requiredFields.includes(fieldName);
  }

  private static getFieldDataType(fieldName: string): 'string' | 'number' | 'date' | 'amount' {
    const typeMap: Record<string, 'string' | 'number' | 'date' | 'amount'> = {
      date: 'date',
      debit: 'amount',
      credit: 'amount',
      amount: 'amount',
    };
    return typeMap[fieldName] || 'string';
  }

  private static isEmptyRow(row: string[]): boolean {
    return row.every(cell => !cell || String(cell).trim() === '');
  }

  private static validateMappedEntry(entry: Partial<FECEntry>, rowNumber: number): ImportError[] {
    const errors: ImportError[] = [];
    
    // Validations de base
    if (!entry.date) {
      errors.push({
        row: rowNumber,
        field: 'date',
        message: 'Date obligatoire',
        type: 'validation',
        severity: 'error'
      });
    }

    if (!entry.accountNumber) {
      errors.push({
        row: rowNumber,
        field: 'accountNumber',
        message: 'Numéro de compte obligatoire',
        type: 'validation',
        severity: 'error'
      });
    }

    if (!entry.label) {
      errors.push({
        row: rowNumber,
        field: 'label',
        message: 'Libellé obligatoire',
        type: 'validation',
        severity: 'error'
      });
    }

    return errors;
  }

  private static createErrorResult(message: string): ImportResult {
    return {
      success: false,
      totalRows: 0,
      validRows: 0,
      errors: [{
        row: 0,
        message,
        type: 'format',
        severity: 'error'
      }],
      entries: [],
      duplicates: [],
      warnings: []
    };
  }
}
