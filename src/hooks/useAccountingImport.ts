import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { FECParser } from '../services/fecParser';
import { CSVImportService } from '../services/csvImportService';
import { AccountingValidationService } from '../services/accountingValidationService';
import { VATCalculationService } from '../services/vatCalculationService';
import { AutomaticLetterageService } from '../services/automaticLetterageService';

import { 
  ImportResult, 
  ImportSession, 
  CSVMapping, 
  FileParserOptions 
} from '../types/accounting-import.types';

// Schéma de validation pour la configuration d'import
const ImportConfigSchema = z.object({
  file: z.instanceof(File, { message: 'Fichier requis' }),
  format: z.enum(['auto', 'FEC', 'CSV', 'Excel'], { message: 'Format invalide' }),
  encoding: z.enum(['UTF-8', 'ISO-8859-1', 'Windows-1252']).optional(),
  delimiter: z.string().optional(),
  skipFirstRow: z.boolean().default(true),
  skipEmptyLines: z.boolean().default(true),
  validateBeforeImport: z.boolean().default(true),
  autoLetterage: z.boolean().default(false),
  journalId: z.string().uuid('ID journal invalide'),
});

export type ImportConfig = z.infer<typeof ImportConfigSchema>;

interface UseAccountingImportOptions {
  companyId: string;
  onImportComplete?: (result: ImportResult) => void;
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;
}

export function useAccountingImport({
  companyId,
  onImportComplete,
  onProgress,
  onError
}: UseAccountingImportOptions) {
  // États
  const [importSession, setImportSession] = useState<ImportSession | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [csvMapping, setCsvMapping] = useState<CSVMapping[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [fileAnalysis, setFileAnalysis] = useState<any>(null);

  // Form pour la configuration d'import
  const form = useForm({
    resolver: zodResolver(ImportConfigSchema),
    defaultValues: {
      format: 'auto',
      encoding: 'UTF-8',
      skipFirstRow: true,
      skipEmptyLines: true,
      validateBeforeImport: true,
      autoLetterage: false,
    }
  });

  // Met à jour le progrès
  const updateProgress = useCallback((newProgress: number) => {
    setProgress(newProgress);
    onProgress?.(newProgress);
  }, [onProgress]);

  // Gestion des erreurs
  const handleError = useCallback((error: string) => {
    console.error('Import error:', error);
    onError?.(error);
    setIsImporting(false);
    setImportSession(prev => prev ? { ...prev, status: 'failed' } : null);
  }, [onError]);

  // Analyse automatique du fichier
  const analyzeFile = useCallback(async (file: File) => {
    try {
      const analysis = await CSVImportService.analyzeFile(file);
      
      setFileAnalysis(analysis);
      setPreviewData(analysis.preview || []);
      setCsvMapping(analysis.suggestedMapping || []);

      // Mise à jour automatique du formulaire
      form.setValue('file', file);
      
      if (analysis.format === 'Excel') {
        form.setValue('format', 'Excel');
      } else if (analysis.format === 'CSV') {
        form.setValue('format', 'CSV');
        if (analysis.delimiter) {
          form.setValue('delimiter', analysis.delimiter);
        }
      }
      
      if (analysis.encoding) {
        form.setValue('encoding', analysis.encoding as any);
      }

      return analysis;
    } catch (error) {
      handleError(`Erreur analyse fichier: ${error.message}`);
      throw error;
    }
  }, [form, handleError]);

  // Import principal
  const performImport = useCallback(async (config: ImportConfig) => {
    if (!config.file || isImporting) return;

    setIsImporting(true);
    setProgress(0);

    try {
      // Création de la session d'import
      const session: ImportSession = {
        id: crypto.randomUUID(),
        filename: config.file.name,
        format: config.format === 'auto' ? 
          detectFileFormat(config.file) : 
          config.format as any,
        status: 'parsing',
        totalRows: 0,
        validRows: 0,
        errors: 0,
        warnings: 0,
        mapping: csvMapping,
        createdAt: new Date().toISOString()
      };

      setImportSession(session);
      updateProgress(5);

      // ÉTAPE 1: Parsing du fichier
      let parseResult: ImportResult;
      
      if (session.format === 'FEC') {
        parseResult = await parseFECFile(config);
      } else {
        parseResult = await parseCSVFile(config);
      }

      updateProgress(30);

      // ÉTAPE 2: Validation des données
      if (config.validateBeforeImport) {
        session.status = 'validating';
        setImportSession({ ...session });

        parseResult = await validateEntries(parseResult);
        updateProgress(60);
      }

      // ÉTAPE 3: Sauvegarde en base
      session.status = 'importing';
      setImportSession({ ...session });

      const savedResult = await saveEntriesToDatabase(parseResult);
      updateProgress(85);

      // ÉTAPE 4: Lettrage automatique optionnel
      if (config.autoLetterage && savedResult.validRows > 0) {
        await performAutoLetterage();
        updateProgress(95);
      }

      // ÉTAPE 5: Finalisation
      const finalResult = {
        ...savedResult,
        totalRows: parseResult.totalRows,
        validRows: savedResult.validRows
      };

      session.status = 'completed';
      session.completedAt = new Date().toISOString();
      session.result = finalResult;
      session.totalRows = finalResult.totalRows;
      session.validRows = finalResult.validRows;
      session.errors = finalResult.errors.length;
      session.warnings = finalResult.warnings.length;

      setImportSession(session);
      updateProgress(100);
      
      onImportComplete?.(finalResult);
      return finalResult;

    } catch (error) {
      handleError(`Erreur import: ${error.message}`);
      throw error;
    } finally {
      setIsImporting(false);
    }
  }, [
    isImporting, 
    csvMapping, 
    companyId, 
    updateProgress, 
    handleError, 
    onImportComplete
  ]);

  // Parse fichier FEC
  const parseFECFile = useCallback(async (config: ImportConfig): Promise<ImportResult> => {
    const options: FileParserOptions = {
      encoding: config.encoding,
      skipFirstRow: config.skipFirstRow,
      skipEmptyLines: config.skipEmptyLines
    };

    return await FECParser.parseFEC(config.file, options);
  }, []);

  // Parse fichier CSV/Excel
  const parseCSVFile = useCallback(async (config: ImportConfig): Promise<ImportResult> => {
    const options: FileParserOptions = {
      encoding: config.encoding,
      delimiter: config.delimiter,
      skipFirstRow: config.skipFirstRow,
      skipEmptyLines: config.skipEmptyLines
    };

    return await CSVImportService.importWithMapping(config.file, csvMapping, options);
  }, [csvMapping]);

  // Validation des écritures
  const validateEntries = useCallback(async (result: ImportResult): Promise<ImportResult> => {
    const validation = await AccountingValidationService.validateBatch(
      result.entries, 
      companyId
    );

    return {
      ...result,
      entries: validation.valid,
      errors: [...result.errors, ...validation.invalid.flatMap(inv => inv.errors)],
      warnings: [...result.warnings, ...validation.warnings],
      validRows: validation.valid.length
    };
  }, [companyId]);

  // Sauvegarde en base (simulation pour l'exemple)
  const saveEntriesToDatabase = useCallback(async (result: ImportResult): Promise<ImportResult> => {
    // TODO: Implémentation réelle de la sauvegarde avec Supabase
    
    // Simulation du processus de sauvegarde
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Pour l'instant, retourne le résultat tel quel
    return result;
  }, []);

  // Lettrage automatique
  const performAutoLetterage = useCallback(async () => {
    try {
      await AutomaticLetterageService.performAutoLetterage(companyId);
    } catch (error) {
      console.warn('Erreur lettrage automatique:', error);
      // N'interrompt pas l'import si le lettrage échoue
    }
  }, [companyId]);

  // Détection du format de fichier
  const detectFileFormat = (file: File): 'FEC' | 'CSV' | 'Excel' => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const excelExtensions = ['xlsx', 'xls', 'xlsm'];
    
    if (excelExtensions.includes(extension || '')) return 'Excel';
    if (extension === 'txt' || file.name.toLowerCase().includes('fec')) return 'FEC';
    return 'CSV';
  };

  // Mise à jour du mapping CSV
  const updateCSVMapping = useCallback((mapping: CSVMapping[]) => {
    setCsvMapping(mapping);
  }, []);

  // Reset de l'import
  const resetImport = useCallback(() => {
    setImportSession(null);
    setProgress(0);
    setIsImporting(false);
    setCsvMapping([]);
    setPreviewData([]);
    setFileAnalysis(null);
    form.reset();
  }, [form]);

  // Validation d'une écriture individuelle
  const validateSingleEntry = useCallback(async (entry: any) => {
    try {
      return await AccountingValidationService.validateJournalEntry(entry, companyId);
    } catch (error) {
      handleError(`Erreur validation: ${error.message}`);
      throw error;
    }
  }, [companyId, handleError]);

  // Calcul TVA pour une écriture
  const calculateVAT = useCallback((params: {
    amountHT: number;
    vatRate: number;
    regime?: string;
    territory?: string;
  }) => {
    try {
      return VATCalculationService.calculateVAT(params);
    } catch (error) {
      handleError(`Erreur calcul TVA: ${error.message}`);
      throw error;
    }
  }, [handleError]);

  // Génération des écritures TVA
  const generateVATEntries = useCallback(async (params: {
    invoiceLines: Array<{
      amountHT: number;
      vatRate: number;
      productType?: string;
      isDeductible?: boolean;
    }>;
    regime?: string;
    territory?: string;
  }) => {
    try {
      return await VATCalculationService.generateVATEntries({
        ...params,
        companyId
      });
    } catch (error) {
      handleError(`Erreur génération TVA: ${error.message}`);
      throw error;
    }
  }, [companyId, handleError]);

  // Vérification des doublons
  const checkDuplicates = useCallback(async (entries: any[]) => {
    try {
      return await AccountingValidationService.detectDuplicates(entries, companyId);
    } catch (error) {
      handleError(`Erreur détection doublons: ${error.message}`);
      throw error;
    }
  }, [companyId, handleError]);

  return {
    // États
    importSession,
    isImporting,
    progress,
    csvMapping,
    previewData,
    fileAnalysis,

    // Form
    form,
    formErrors: form.formState.errors,
    isFormValid: form.formState.isValid,

    // Actions principales
    analyzeFile,
    performImport: form.handleSubmit(performImport),
    resetImport,

    // Utilitaires
    updateCSVMapping,
    validateSingleEntry,
    calculateVAT,
    generateVATEntries,
    checkDuplicates,

    // États dérivés
    canImport: !isImporting && form.watch('file') !== undefined,
    hasPreview: previewData.length > 0,
    hasMapping: csvMapping.length > 0,
    isCompleted: importSession?.status === 'completed',
    isFailed: importSession?.status === 'failed'
  };
}

export default useAccountingImport;