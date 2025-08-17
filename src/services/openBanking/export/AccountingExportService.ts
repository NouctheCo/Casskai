/* eslint-disable max-lines */
import {
  ExportFormat,
  ExportJob,
  FieldMapping,
  ValidationRule,
  BankTransaction,
  AccountingEntry,
  ReconciliationMatch,
  OpenBankingResponse
} from '../../../types/openBanking.types';

// Service d'export vers logiciels comptables
export class AccountingExportService {
  private static instance: AccountingExportService;
  private exportFormats = new Map<string, ExportFormat>();
  private activeJobs = new Map<string, ExportJob>();
  private isInitialized = false;

  private constructor() {}

  static getInstance(): AccountingExportService {
    if (!this.instance) {
      this.instance = new AccountingExportService();
    }
    return this.instance;
  }

  async initialize(formats: ExportFormat[]): Promise<void> {
    try {
      // Charger les formats d'export
      for (const format of formats) {
        this.exportFormats.set(format.id, format);
      }

      this.isInitialized = true;
      console.warn(`Accounting export service initialized with ${formats.length} formats`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to initialize accounting export service: ${msg}`);
    }
  }

  // Créer un job d'export
  async createExportJob(
    userId: string,
    formatId: string,
    parameters: ExportJob['parameters']
  ): Promise<OpenBankingResponse<ExportJob>> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: {
          code: 'SERVICE_NOT_INITIALIZED',
          message: 'Export service not initialized'
        }
      };
    }

    try {
      const format = this.exportFormats.get(formatId);
      if (!format || !format.isActive) {
        return {
          success: false,
          error: {
            code: 'FORMAT_NOT_FOUND',
            message: `Export format ${formatId} not found or inactive`
          }
        };
      }

      const job: ExportJob = {
        id: crypto.randomUUID(),
        userId,
        formatId,
        parameters,
        status: 'pending',
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.activeJobs.set(job.id, job);

      // Démarrer l'export de manière asynchrone
      this.processExportJob(job);

      return {
        success: true,
        data: job
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      const details = error instanceof Error ? { message: error.message, stack: error.stack } : { error };
      return {
        success: false,
        error: {
          code: 'EXPORT_JOB_CREATION_ERROR',
          message: `Failed to create export job: ${msg}`,
          details
        }
      };
    }
  }

  // Traiter un job d'export
  private async processExportJob(job: ExportJob): Promise<void> {
    try {
  this.updateJob(job, { status: 'processing' });

      const format = this.exportFormats.get(job.formatId);
      if (!format) {
        throw new Error('Export format not found');
      }

      // Récupérer les données à exporter
  this.updateJob(job, { progress: 10 });
      const data = await this.fetchExportData(job.parameters);

      // Valider les données
  this.updateJob(job, { progress: 30 });
      const validationResult = await this.validateExportData(data, format);
      if (!validationResult.valid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Transformer les données selon le format
  this.updateJob(job, { progress: 50 });
      const transformedData = await this.transformData(data, format);

      // Générer le fichier d'export
  this.updateJob(job, { progress: 80 });
      const exportedFile = await this.generateExportFile(transformedData, format);

      // Sauvegarder le fichier et générer l'URL
  this.updateJob(job, { progress: 90 });
      const fileUrl = await this.saveExportFile(exportedFile, job.id, format);

      // Finaliser le job
      this.updateJob(job, {
        status: 'completed',
        progress: 100,
        resultUrl: fileUrl,
        completedAt: new Date()
      });

      console.warn(`Export job ${job.id} completed successfully`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.updateJob(job, {
        status: 'failed',
        errorMessage: msg
      });

      console.error(`Export job ${job.id} failed:`, error);
    }
  }

  // Récupérer les données à exporter
  private async fetchExportData(_parameters: ExportJob['parameters']): Promise<{
    transactions: BankTransaction[];
    entries: AccountingEntry[];
    matches: ReconciliationMatch[];
  }> {
    // En production, récupérer depuis la base de données
    const mockData = {
      transactions: [] as BankTransaction[],
      entries: [] as AccountingEntry[],
      matches: [] as ReconciliationMatch[]
    };

    return mockData;
  }

  // Valider les données avant export
  private async validateExportData(
    data: unknown,
    format: ExportFormat
  ): Promise<{ valid: boolean; errors: string[] }> {
    const results = await Promise.all(
      format.validation.map(rule => this.applyValidationRule(data, rule))
    );

    const errors = results.filter(r => !r.valid).map(r => r.error);

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Appliquer une règle de validation
  // eslint-disable-next-line complexity
  private async applyValidationRule(
    data: unknown,
    rule: ValidationRule
  ): Promise<{ valid: boolean; error: string }> {
    try {
      switch (rule.type) {
        case 'required': {
          if (!this.getFieldValue(data, rule.field)) {
            return {
              valid: false,
              error: rule.errorMessage || `Field ${rule.field} is required`
            };
          }
          break;
        }

        case 'format': {
          const value = this.getFieldValue(data, rule.field);
          if (value && rule.parameters.pattern) {
            const regex = new RegExp(rule.parameters.pattern);
            if (!regex.test(value.toString())) {
              return {
                valid: false,
                error: rule.errorMessage || `Field ${rule.field} format is invalid`
              };
            }
          }
          break;
        }

        case 'range': {
          const raw = this.getFieldValue(data, rule.field);
          const numValue = parseFloat(typeof raw === 'string' ? raw : String(raw));
          if (!isNaN(numValue)) {
            const min = rule.parameters.min;
            const max = rule.parameters.max;
            if ((min !== undefined && numValue < min) || (max !== undefined && numValue > max)) {
              return {
                valid: false,
                error: rule.errorMessage || `Field ${rule.field} is out of range`
              };
            }
          }
          break;
        }

        case 'custom': {
          // Validation personnalisée
          const customResult = await this.applyCustomValidation(data, rule);
          if (!customResult.valid) {
            return customResult;
          }
          break;
        }
      }

      return { valid: true, error: '' };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return {
        valid: false,
        error: `Validation error: ${msg}`
      };
    }
  }

  // Validation personnalisée
  private async applyCustomValidation(
    _data: unknown,
    _rule: ValidationRule
  ): Promise<{ valid: boolean; error: string }> {
    // Implémentation des validations personnalisées selon les besoins
    return { valid: true, error: '' };
  }

  // Transformer les données selon le format
  private async transformData(
    data: unknown,
    format: ExportFormat
  ): Promise<Record<string, unknown>[]> {
    // Pour chaque transaction/entrée, appliquer les mappings
    type ExportData = { transactions?: Array<Record<string, unknown>>; entries?: Array<Record<string, unknown>> };
    const d = (data || {}) as ExportData;
    const items = Array.isArray(d.transactions) ? d.transactions : (Array.isArray(d.entries) ? d.entries : []);

    const transformedData = await Promise.all(
      items.map(async (item: unknown) => {
        const transformedItem: Record<string, unknown> = {};

        await Promise.all(
          format.mapping.map(async mapping => {
            try {
              let value = this.getFieldValue(item, mapping.sourceField);

              // Appliquer les transformations
              if (mapping.transformation) {
                value = await this.applyTransformation(value, mapping.transformation);
              }

              // Utiliser la valeur par défaut si nécessaire
              if (value === undefined || value === null) {
                value = mapping.defaultValue || '';
              }

              transformedItem[mapping.targetField] = value as unknown;
            } catch (error) {
              if (mapping.required) {
                throw new Error(
                  `Failed to map required field ${mapping.sourceField}: ${(error as Error).message}`
                );
              }
              transformedItem[mapping.targetField] = mapping.defaultValue || '';
            }
          })
        );

  return transformedItem; // final shape depends on mapping
      })
    );

    return transformedData;
  }

  // Appliquer une transformation de champ
  // eslint-disable-next-line complexity
  private async applyTransformation(
    value: unknown,
    transformation: FieldMapping['transformation']
  ): Promise<unknown> {
    if (!transformation) return value;

    try {
      switch (transformation.type) {
        case 'format_date': {
          if (value) {
            const date = new Date(value as string | number | Date);
            const format = transformation.parameters.format || 'yyyy-MM-dd';
            return this.formatDate(date, format);
          }
          break;
        }

        case 'format_currency': {
          if (typeof value === 'number') {
            const decimals = transformation.parameters.decimals || 2;
            const separator = transformation.parameters.separator || '.';
            return value.toFixed(decimals).replace('.', separator);
          }
          break;
        }

        case 'truncate': {
          if (typeof value === 'string') {
            const maxLength = transformation.parameters.maxLength || 50;
            return value.substring(0, maxLength);
          }
          break;
        }

        case 'uppercase': {
          if (typeof value === 'string') {
            return value.toUpperCase();
          }
          break;
        }

        case 'lowercase': {
          if (typeof value === 'string') {
            return value.toLowerCase();
          }
          break;
        }

        case 'regex_replace': {
          if (typeof value === 'string') {
            const pattern = new RegExp(transformation.parameters.pattern, transformation.parameters.flags || 'g');
            return value.replace(pattern, transformation.parameters.replacement || '');
          }
          break;
        }

        case 'lookup': {
          const lookupTable: Record<string | number, unknown> = transformation.parameters.table || {};
          const key = (typeof value === 'string' || typeof value === 'number') ? value : String(value ?? '');
          return lookupTable[key] ?? transformation.parameters.defaultValue ?? value;
        }

        default:
          return value;
      }

      return value;
    } catch (error) {
      console.error('Transformation error:', error);
      return value;
    }
  }

  // Générer le fichier d'export
  private async generateExportFile(
    data: Array<Record<string, unknown>>,
    format: ExportFormat
  ): Promise<{ content: string; filename: string; mimeType: string }> {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `export_${format.software}_${timestamp}.${format.fileFormat}`;

    let content: string;
    let mimeType: string;

    switch (format.fileFormat) {
      case 'csv':
        content = this.generateCSV(data);
        mimeType = 'text/csv';
        break;

      case 'xml':
        content = this.generateXML(data, format);
        mimeType = 'application/xml';
        break;

      case 'json':
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        break;

      case 'txt':
        content = this.generateFixedWidth(data, format);
        mimeType = 'text/plain';
        break;

      default:
        throw new Error(`Unsupported file format: ${format.fileFormat}`);
    }

    return {
      content,
      filename,
      mimeType
    };
  }

  // Génération CSV
  private generateCSV(data: Array<Record<string, unknown>>): string {
    if (data.length === 0) return '';

    // En-têtes
    const headers = Object.keys(data[0]);
    let csv = `${headers.join(',')  }\n`;

    // Données
    for (const item of data) {
      const row = headers.map(header => {
        const value = item[header]?.toString() || '';
        // Échapper les guillemets et entourer de guillemets si nécessaire
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csv += `${row.join(',')  }\n`;
    }

    return csv;
  }

  // Génération XML
  private generateXML(data: Array<Record<string, unknown>>, format: ExportFormat): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<export software="${format.software}" version="${format.version || '1.0'}">\n`;

    for (const item of data) {
      xml += '  <record>\n';
      for (const [key, value] of Object.entries(item)) {
        xml += `    <${key}>${this.escapeXML(value?.toString() || '')}</${key}>\n`;
      }
      xml += '  </record>\n';
    }

    xml += '</export>';
    return xml;
  }

  // Génération format fixe
  private generateFixedWidth(data: Array<Record<string, unknown>>, format: ExportFormat): string {
    let content = '';

    // Configuration des largeurs de champs (à définir dans les paramètres du format)
    const fieldWidths = format.mapping.reduce((widths, mapping) => {
      widths[mapping.targetField] = mapping.transformation?.parameters?.width || 20;
      return widths;
    }, {} as Record<string, number>);

    for (const item of data) {
      let line = '';
      for (const mapping of format.mapping) {
        const value = item[mapping.targetField]?.toString() || '';
        const width = fieldWidths[mapping.targetField];
        line += value.padEnd(width).substring(0, width);
      }
      content += `${line  }\n`;
    }

    return content;
  }

  // Sauvegarder le fichier d'export
  private async saveExportFile(
    exportedFile: { content: string; filename: string; mimeType: string },
    _jobId: string,
    _format: ExportFormat
  ): Promise<string> {
    try {
      // En production, sauvegarder sur un service de stockage (S3, Google Cloud Storage, etc.)
      const blob = new Blob([exportedFile.content], { type: exportedFile.mimeType });
      const url = URL.createObjectURL(blob);

      // Simuler la sauvegarde
  console.warn(`Export file saved: ${exportedFile.filename}`);

      return url;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to save export file: ${msg}`);
    }
  }

  // Méthodes utilitaires
  private getFieldValue(object: unknown, fieldPath: string): unknown {
    type Indexable = { [key: string]: unknown };
    let current: unknown = object;
    for (const key of fieldPath.split('.')) {
      if (current && typeof current === 'object' && (current as Indexable)[key] !== undefined) {
        current = (current as Indexable)[key];
      } else {
        return undefined;
      }
    }
    return current;
  }

  private formatDate(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return format
      .replace('yyyy', year.toString())
      .replace('MM', month)
      .replace('dd', day);
  }

  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // Helper to update job fields safely (avoids require-atomic-updates warnings)
  private updateJob(job: ExportJob, patch: Partial<ExportJob>): void {
    Object.assign(job, patch);
    job.updatedAt = new Date();
  }

  // API publique
  async getExportJob(jobId: string): Promise<OpenBankingResponse<ExportJob>> {
    const job = this.activeJobs.get(jobId);
    
    if (!job) {
      return {
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: `Export job ${jobId} not found`
        }
      };
    }

    return {
      success: true,
      data: job
    };
  }

  async getAllExportJobs(userId: string): Promise<OpenBankingResponse<ExportJob[]>> {
    const userJobs = Array.from(this.activeJobs.values())
      .filter(job => job.userId === userId);

    return {
      success: true,
      data: userJobs
    };
  }

  async cancelExportJob(jobId: string): Promise<OpenBankingResponse<void>> {
    const job = this.activeJobs.get(jobId);

    if (!job) {
      return {
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: `Export job ${jobId} not found`
        }
      };
    }

    if (job.status === 'completed') {
      return {
        success: false,
        error: {
          code: 'JOB_ALREADY_COMPLETED',
          message: 'Cannot cancel completed job'
        }
      };
    }

  this.updateJob(job, { status: 'failed', errorMessage: 'Cancelled by user' });

    return {
      success: true,
      data: undefined
    };
  }

  // Gestion des formats d'export
  async addExportFormat(format: ExportFormat): Promise<void> {
    this.exportFormats.set(format.id, format);
  }

  async updateExportFormat(formatId: string, updates: Partial<ExportFormat>): Promise<void> {
    const existingFormat = this.exportFormats.get(formatId);
    if (existingFormat) {
      this.exportFormats.set(formatId, { ...existingFormat, ...updates });
    }
  }

  async getExportFormats(): Promise<ExportFormat[]> {
    return Array.from(this.exportFormats.values()).filter(f => f.isActive);
  }

  async getExportFormat(formatId: string): Promise<ExportFormat | undefined> {
    return this.exportFormats.get(formatId);
  }

  // Nettoyer les anciens jobs
  async cleanupOldJobs(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    const cutoffTime = new Date(Date.now() - maxAgeMs);
    
  for (const [_jobId, job] of this.activeJobs) {
      if (job.createdAt < cutoffTime && job.status === 'completed') {
        this.activeJobs.delete(_jobId);
        
        // Nettoyer les fichiers si nécessaire
        if (job.resultUrl) {
          URL.revokeObjectURL(job.resultUrl);
        }
      }
    }
  }

  get initialized(): boolean {
    return this.isInitialized;
  }

  dispose(): void {
    // Nettoyer les jobs actifs
  for (const [_jobId, job] of this.activeJobs) {
      if (job.resultUrl) {
        URL.revokeObjectURL(job.resultUrl);
      }
    }

    this.activeJobs.clear();
    this.exportFormats.clear();
    this.isInitialized = false;
  }
}

// Factory pour créer des formats d'export prédéfinis
export class ExportFormatFactory {
  // Format Sage
  static createSageFormat(): ExportFormat {
    return {
      id: 'sage-standard',
      name: 'Sage Standard',
      displayName: 'Export Sage Comptabilité',
      software: 'sage',
      version: '1.0',
      fileFormat: 'csv',
      mapping: [
        { sourceField: 'date', targetField: 'Date', required: true },
        { sourceField: 'reference', targetField: 'Numéro de pièce', required: true },
        { sourceField: 'debitAccount', targetField: 'Compte de débit', required: true },
        { sourceField: 'creditAccount', targetField: 'Compte de crédit', required: true },
        { sourceField: 'amount', targetField: 'Montant', required: true, transformation: { type: 'format_currency', parameters: { decimals: 2 } } },
        { sourceField: 'description', targetField: 'Libellé', required: true, transformation: { type: 'truncate', parameters: { maxLength: 50 } } }
      ],
      validation: [
        { field: 'Date', type: 'required', parameters: {}, errorMessage: 'La date est obligatoire' },
        { field: 'Montant', type: 'range', parameters: { min: 0 }, errorMessage: 'Le montant doit être positif' }
      ],
      isActive: true
    };
  }

  // Format QuickBooks
  static createQuickBooksFormat(): ExportFormat {
    return {
      id: 'quickbooks-iif',
      name: 'QuickBooks IIF',
      displayName: 'Export QuickBooks (IIF)',
      software: 'quickbooks',
      version: '2023',
      fileFormat: 'txt',
      mapping: [
        { sourceField: 'type', targetField: 'TRNS', required: true, defaultValue: 'GENERAL JOURNAL' },
        { sourceField: 'date', targetField: 'DATE', required: true, transformation: { type: 'format_date', parameters: { format: 'MM/dd/yyyy' } } },
        { sourceField: 'reference', targetField: 'NUM', required: true },
        { sourceField: 'description', targetField: 'MEMO', required: false },
        { sourceField: 'debitAccount', targetField: 'ACCNT', required: true },
        { sourceField: 'amount', targetField: 'AMOUNT', required: true, transformation: { type: 'format_currency', parameters: { decimals: 2, separator: '.' } } }
      ],
      validation: [
        { field: 'DATE', type: 'required', parameters: {}, errorMessage: 'Date is required' },
        { field: 'ACCNT', type: 'required', parameters: {}, errorMessage: 'Account is required' }
      ],
      isActive: true
    };
  }

  // Format Cegid
  static createCegidFormat(): ExportFormat {
    return {
      id: 'cegid-xml',
      name: 'Cegid XML',
      displayName: 'Export Cegid (XML)',
      software: 'cegid',
      version: '3.0',
      fileFormat: 'xml',
      mapping: [
        { sourceField: 'entryNumber', targetField: 'NumeroEcriture', required: true },
        { sourceField: 'date', targetField: 'DateEcriture', required: true, transformation: { type: 'format_date', parameters: { format: 'yyyy-MM-dd' } } },
        { sourceField: 'debitAccount', targetField: 'CompteDebit', required: true },
        { sourceField: 'creditAccount', targetField: 'CompteCredit', required: true },
        { sourceField: 'amount', targetField: 'Montant', required: true, transformation: { type: 'format_currency', parameters: { decimals: 2 } } },
        { sourceField: 'description', targetField: 'Libelle', required: true }
      ],
      validation: [
        { field: 'DateEcriture', type: 'required', parameters: {}, errorMessage: 'La date d\'écriture est obligatoire' },
        { field: 'CompteDebit', type: 'format', parameters: { pattern: '^[0-9]{6,8}$' }, errorMessage: 'Le compte de débit doit contenir 6 à 8 chiffres' }
      ],
      isActive: true
    };
  }
}