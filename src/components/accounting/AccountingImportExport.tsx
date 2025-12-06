import React, { useState, useCallback, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Settings,
  Play,
  RotateCcw
} from 'lucide-react';

import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';

import { FECParser } from '../../services/fecParser';
import { CSVImportService } from '../../services/csvImportService';
import { AccountingValidationService } from '../../services/accountingValidationService';
import { EntryTemplatesService } from '../../services/entryTemplatesService';
// import { VATCalculationService } from '../../services/vatCalculationService';
import { AutomaticLetterageService } from '../../services/automaticLetterageService';

import { 
  ImportSession, 
  ImportResult, 
  CSVMapping,
  EntryTemplate 
} from '../../types/accounting-import.types';

// Schémas de validation
const ImportConfigSchema = z.object({
  file: z.instanceof(File).optional(),
  format: z.string().default('auto'),
  encoding: z.string().default('UTF-8'),
  delimiter: z.string().optional(),
  skipFirstRow: z.boolean().default(true),
  skipEmptyLines: z.boolean().default(true),
  dateFormat: z.string().optional(),
  journalId: z.string().optional(),
  validateBeforeImport: z.boolean().default(true),
  autoLetterage: z.boolean().default(false)
});

const TemplateConfigSchema = z.object({
  templateId: z.string().optional(),
  variables: z.record(z.any()).default({}),
  journalId: z.string().optional(),
  generateRecurring: z.boolean().default(false)
});

type ImportConfigType = z.infer<typeof ImportConfigSchema>;
type TemplateConfigType = z.infer<typeof TemplateConfigSchema>;

interface AccountingImportExportProps {
  companyId: string;
  onImportComplete?: (result: ImportResult) => void;
  onError?: (error: string) => void;
}

export const AccountingImportExport: React.FC<AccountingImportExportProps> = ({
  companyId,
  onImportComplete,
  onError
}) => {
  // États
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'templates' | 'letterage'>('import');
  const [importSession, setImportSession] = useState<ImportSession | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [csvMapping, setCsvMapping] = useState<CSVMapping[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [templates, setTemplates] = useState<EntryTemplate[]>([]);
  
  // Forms
  const importForm = useForm<ImportConfigType>({
    resolver: zodResolver(ImportConfigSchema),
    defaultValues: {
      format: 'auto',
      encoding: 'UTF-8',
      delimiter: undefined,
      skipFirstRow: true,
      skipEmptyLines: true,
      validateBeforeImport: true,
      autoLetterage: false,
      file: undefined,
      journalId: undefined,
      dateFormat: undefined
    }
  });

  const templateForm = useForm<TemplateConfigType>({
    resolver: zodResolver(TemplateConfigSchema),
    defaultValues: {
      templateId: undefined,
      variables: {},
      generateRecurring: false,
      journalId: undefined
    }
  });

  // Chargement initial
  useEffect(() => {
    loadTemplates();
  }, [companyId]);

  const loadTemplates = async () => {
    try {
      const loadedTemplates = await EntryTemplatesService.getAllTemplates(companyId);
      setTemplates(loadedTemplates);
    } catch (error) {
      if (error instanceof Error) {
        onError?.(`Erreur chargement templates: ${error.message}`);
      } else {
        onError?.(`Erreur chargement templates: ${String(error)}`);
      }
    }
  };

  // Gestionnaires d'import
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    importForm.setValue('file', file as any);
    
    try {
      // Analyse automatique du fichier
      const analysis = await CSVImportService.analyzeFile(file);
      
      // Mise à jour du formulaire avec les détections
      if (analysis.format === 'Excel') {
        importForm.setValue('format', 'Excel');
      } else {
        importForm.setValue('format', 'CSV');
        if (analysis.delimiter) {
          importForm.setValue('delimiter', analysis.delimiter);
        }
      }
      
      if (analysis.encoding) {
        importForm.setValue('encoding', analysis.encoding as any);
      }

      // Stockage des données de prévisualisation
      setPreviewData(analysis.preview || []);
      setCsvMapping(analysis.suggestedMapping || []);
      
    } catch (error) {
      if (error instanceof Error) {
        onError?.(`Erreur analyse fichier: ${error.message}`);
      } else {
        onError?.(`Erreur analyse fichier: ${String(error)}`);
      }
    }
  }, [importForm, onError]);

  const onImportSubmit: SubmitHandler<ImportConfigType> = async (data) => {
    if (!data.file) return;

    setImportProgress(0);
    
    try {
      // Création de la session d'import
      const session: ImportSession = {
        id: crypto.randomUUID(),
        filename: data.file.name,
        format: data.format === 'auto' ? 
          (data.file.name.toLowerCase().endsWith('.csv') ? 'CSV' : 
           data.file.name.toLowerCase().includes('.xls') ? 'Excel' : 'FEC') : 
          data.format as any,
        status: 'parsing',
        totalRows: 0,
        validRows: 0,
        errors: 0,
        warnings: 0,
        mapping: csvMapping,
        createdAt: new Date().toISOString()
      };

      setImportSession(session);
      setImportProgress(10);

      let result: ImportResult;

      // Parsing selon le format
      if (session.format === 'FEC') {
        result = await FECParser.parseFEC(data.file, {
          encoding: data.encoding,
          skipFirstRow: data.skipFirstRow,
          skipEmptyLines: data.skipEmptyLines
        });
      } else {
        result = await CSVImportService.importWithMapping(data.file, csvMapping, {
          encoding: data.encoding,
          delimiter: data.delimiter,
          skipFirstRow: data.skipFirstRow,
          skipEmptyLines: data.skipEmptyLines
        });
      }

      setImportProgress(50);

      // Validation si demandée
      if (data.validateBeforeImport) {
        session.status = 'validating';
        setImportSession({ ...session });

        const validation = await AccountingValidationService.validateBatch(
          result.entries, 
          companyId
        );

        // result.entries = validation.valid;
        result.errors.push(...validation.invalid.flatMap(inv => inv.errors));
        result.warnings.push(...validation.warnings);
      }

      setImportProgress(80);

      // Import en base
      session.status = 'importing';
      setImportSession({ ...session });

      // TODO: Implémentation sauvegarde en base
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation

      // Lettrage automatique si demandé
      if (data.autoLetterage && result.entries.length > 0) {
        session.status = 'completed';
        setImportSession({ ...session });
        
        await AutomaticLetterageService.performAutoLetterage(companyId);
      }

      setImportProgress(100);
      session.status = 'completed';
      session.completedAt = new Date().toISOString();
      session.result = result;
      
      setImportSession({ ...session });
      onImportComplete?.(result);

    } catch (error) {
      setImportSession(prev => prev ? { ...prev, status: 'failed' } : null);
      if (error instanceof Error) {
        onError?.(`Erreur import: ${error.message}`);
      } else {
        onError?.(`Erreur import: ${String(error)}`);
      }
    }
  };

  // Gestionnaire de templates
  const onTemplateSubmit: SubmitHandler<TemplateConfigType> = async (data) => {
    try {
      const entry = await EntryTemplatesService.applyTemplate(
        data.templateId,
        data.variables,
        companyId,
        data.journalId
      );

      // TODO: Sauvegarde de l'écriture générée
      console.warn('Écriture générée:', entry);
      
      if (data.generateRecurring) {
        await EntryTemplatesService.processRecurringEntries(companyId);
      }

    } catch (error) {
      if (error instanceof Error) {
        onError?.(`Erreur application template: ${error.message}`);
      } else {
        onError?.(`Erreur application template: ${String(error)}`);
      }
    }
  };

  // Gestionnaires de lettrage
  const handleAutoLetterage = async () => {
    try {
      const result = await AutomaticLetterageService.performAutoLetterage(companyId);
      console.warn('Résultat lettrage:', result);
    } catch (error) {
      if (error instanceof Error) {
        onError?.(`Erreur lettrage: ${error.message}`);
      } else {
        onError?.(`Erreur lettrage: ${String(error)}`);
      }
    }
  };

  // Composants de rendu
  const renderImportTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import de fichier comptable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={importForm.handleSubmit(onImportSubmit)} className="space-y-4">
            {/* Sélection de fichier */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Fichier à importer
              </label>
              <input
                type="file"
                accept=".csv,.xls,.xlsx,.txt"
                onChange={handleFileSelect}
                className="w-full"
              />
              {importForm.formState.errors.file && (
                <p className="text-red-500 text-sm mt-1">
                  {String(importForm.formState.errors.file?.message || 'Erreur fichier')}
                </p>
              )}
            </div>

            {/* Configuration d'import */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Format</label>
                <select 
                  {...importForm.register('format')}
                  className="w-full p-2 border rounded"
                >
                  <option value="auto">Détection automatique</option>
                  <option value="FEC">FEC (Fichier Écritures Comptables)</option>
                  <option value="CSV">CSV</option>
                  <option value="Excel">Excel</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Encodage</label>
                <select 
                  {...importForm.register('encoding')}
                  className="w-full p-2 border rounded"
                >
                  <option value="UTF-8">UTF-8</option>
                  <option value="ISO-8859-1">ISO-8859-1</option>
                  <option value="Windows-1252">Windows-1252</option>
                </select>
              </div>
            </div>

            {/* Options */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  {...importForm.register('skipFirstRow')}
                />
                Ignorer la première ligne
              </label>

              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  {...importForm.register('validateBeforeImport')}
                />
                Valider avant import
              </label>

              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  {...importForm.register('autoLetterage')}
                />
                Lettrage automatique
              </label>
            </div>

            <Button type="submit" disabled={!importForm.getValues('file') || importProgress > 0}>
              {importProgress > 0 ? 'Import en cours...' : 'Lancer l\'import'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Prévisualisation */}
      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prévisualisation des données</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                <thead>
                  <tr>
                    {Object.keys(previewData[0] || {}).map(header => (
                      <th key={header} className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 5).map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((cell: any, cellIndex) => (
                        <td key={cellIndex} className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                          {cell != null ? String(cell) : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mapping des colonnes */}
      {csvMapping.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mapping des colonnes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {csvMapping.map((mapping, index) => (
                <div key={index} className="flex items-center gap-4 p-2 bg-gray-50 rounded dark:bg-gray-900/30">
                  <div className="w-1/3">
                    <span className="font-medium">{mapping.columnName}</span>
                  </div>
                  <div className="w-1/3">
                    <Badge variant={mapping.isRequired ? 'default' : 'secondary'}>
                      {mapping.fieldName}
                    </Badge>
                  </div>
                  <div className="w-1/3 text-sm text-gray-600 dark:text-gray-400">
                    {mapping.dataType}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progression d'import */}
      {importSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importSession.status === 'completed' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : importSession.status === 'failed' ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <Settings className="h-5 w-5 animate-spin" />
              )}
              Import: {importSession.filename}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={importProgress} className="w-full" />
              
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Statut</div>
                  <div className="font-medium">{importSession.status}</div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Lignes traitées</div>
                  <div className="font-medium">{importSession.totalRows}</div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Valides</div>
                  <div className="font-medium text-green-600">{importSession.validRows}</div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Erreurs</div>
                  <div className="font-medium text-red-600 dark:text-red-400">{importSession.errors}</div>
                </div>
              </div>

              {importSession.result && (
                <div className="mt-4">
                  {importSession.result.errors.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {importSession.result.errors.length} erreur(s) détectée(s)
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderTemplatesTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Templates d\'écritures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={templateForm.handleSubmit(onTemplateSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Template</label>
              <select 
                {...templateForm.register('templateId' as any)}
                className="w-full p-2 border rounded"
              >
                <option value="">Sélectionner un template</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Variables dynamiques selon le template sélectionné */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Montant HT</label>
                <input 
                  type="number" 
                  step="0.01"
                  {...templateForm.register('variables.amountHT' as any, { valueAsNumber: true })}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Référence</label>
                <input 
                  type="text"
                  {...templateForm.register('variables.reference' as any)}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  {...templateForm.register('generateRecurring')}
                />
                Générer les écritures récurrentes
              </label>
            </div>

            <Button type="submit">
              Appliquer le template
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Liste des templates disponibles */}
      <Card>
        <CardHeader>
          <CardTitle>Templates disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(template => (
              <div key={template.id} className="p-4 border rounded-lg">
                <h4 className="font-medium">{template.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{template.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{template.category}</Badge>
                  {template.isRecurring && (
                    <Badge variant="secondary">Récurrent</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderLetterageTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Lettrage automatique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Le lettrage automatique permet de rapprocher les écritures débitrices et créditrices 
              des comptes de tiers (clients, fournisseurs).
            </p>

            <div className="flex gap-2">
              <Button onClick={handleAutoLetterage}>
                <Play className="h-4 w-4 mr-2" />
                Lancer le lettrage automatique
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Import/Export Comptable</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestion avancée des imports de fichiers comptables, templates d\'écritures et lettrage automatique.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="letterage">Lettrage</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="mt-6">
          {renderImportTab()}
        </TabsContent>

        <TabsContent value="export" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export des données
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">Fonctionnalité d\'export à implémenter...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          {renderTemplatesTab()}
        </TabsContent>

        <TabsContent value="letterage" className="mt-6">
          {renderLetterageTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
};
