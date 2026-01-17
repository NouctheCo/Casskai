/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * 
 * Onglet d'import pour les contrats :
 * - Import CA (Chiffre d'Affaires) par contrat
 * - Import références produits
 * - Import listes RFA
 */
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  DollarSign,
  Package,
  Calculator,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toastSuccess, toastError } from '@/lib/toast-helpers';
import { logger } from '@/lib/logger';

// Types pour l'import CA
interface CAImportRow {
  contract_reference: string;
  client_name: string;
  period_start: string;
  period_end: string;
  turnover_amount: number;
  currency: string;
  isValid: boolean;
  errors: string[];
}

// Types pour l'import références produits
interface ProductRefImportRow {
  contract_reference: string;
  product_code: string;
  product_name: string;
  unit_price: number;
  currency: string;
  category?: string;
  isValid: boolean;
  errors: string[];
}

// Types pour l'import RFA
interface RFAImportRow {
  contract_reference: string;
  client_name: string;
  period_start: string;
  period_end: string;
  turnover_amount: number;
  rfa_rate: number;
  rfa_amount: number;
  currency: string;
  notes?: string;
  isValid: boolean;
  errors: string[];
}

interface ContractImportTabProps {
  companyId: string;
  contracts: Array<{ id: string; contract_name: string; client_name?: string }>;
  onImportComplete?: () => void;
}

type ImportType = 'ca' | 'products' | 'rfa';

export const ContractImportTab: React.FC<ContractImportTabProps> = ({
  companyId,
  contracts,
  onImportComplete
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [importType, setImportType] = useState<ImportType>('ca');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [importStats, setImportStats] = useState({ success: 0, errors: 0 });
  
  // Data states pour chaque type
  const [caData, setCAData] = useState<CAImportRow[]>([]);
  const [productData, setProductData] = useState<ProductRefImportRow[]>([]);
  const [rfaData, setRFAData] = useState<RFAImportRow[]>([]);

  // Reset state when changing import type
  const handleImportTypeChange = (type: ImportType) => {
    setImportType(type);
    setSelectedFile(null);
    setCAData([]);
    setProductData([]);
    setRFAData([]);
    setImportComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Téléchargement des modèles
  const downloadCATemplate = () => {
    const template = [
      {
        contract_reference: 'CONTRAT-001',
        client_name: 'Client Exemple SARL',
        period_start: '2024-01-01',
        period_end: '2024-03-31',
        turnover_amount: 50000,
        currency: 'EUR'
      },
      {
        contract_reference: 'CONTRAT-002',
        client_name: 'Autre Client SAS',
        period_start: '2024-01-01',
        period_end: '2024-03-31',
        turnover_amount: 75000,
        currency: 'EUR'
      }
    ];
    downloadTemplate(template, 'template_import_ca.xlsx', 'Chiffre Affaires');
    toastSuccess(t('contracts.import.template_downloaded', 'Modèle téléchargé'));
  };

  const downloadProductsTemplate = () => {
    const template = [
      {
        contract_reference: 'CONTRAT-001',
        product_code: 'PROD-001',
        product_name: 'Produit A',
        unit_price: 100,
        currency: 'EUR',
        category: 'Catégorie 1'
      },
      {
        contract_reference: 'CONTRAT-001',
        product_code: 'PROD-002',
        product_name: 'Service B',
        unit_price: 250,
        currency: 'EUR',
        category: 'Services'
      },
      {
        contract_reference: 'CONTRAT-002',
        product_code: 'PROD-003',
        product_name: 'Produit C',
        unit_price: 75.50,
        currency: 'EUR',
        category: 'Catégorie 2'
      }
    ];
    downloadTemplate(template, 'template_import_references_produits.xlsx', 'References Produits');
    toastSuccess(t('contracts.import.template_downloaded', 'Modèle téléchargé'));
  };

  const downloadRFATemplate = () => {
    const template = [
      {
        contract_reference: 'CONTRAT-001',
        client_name: 'Client Exemple SARL',
        period_start: '2024-01-01',
        period_end: '2024-12-31',
        turnover_amount: 200000,
        rfa_rate: 0.03,
        rfa_amount: 6000,
        currency: 'EUR',
        notes: 'RFA annuelle 2024'
      },
      {
        contract_reference: 'CONTRAT-002',
        client_name: 'Autre Client SAS',
        period_start: '2024-01-01',
        period_end: '2024-12-31',
        turnover_amount: 350000,
        rfa_rate: 0.05,
        rfa_amount: 17500,
        currency: 'EUR',
        notes: 'RFA avec paliers progressifs'
      }
    ];
    downloadTemplate(template, 'template_import_rfa.xlsx', 'Calculs RFA');
    toastSuccess(t('contracts.import.template_downloaded', 'Modèle téléchargé'));
  };

  const downloadTemplate = (data: object[], filename: string, sheetName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Ajuster la largeur des colonnes
    ws['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: 20 }));
    
    XLSX.writeFile(wb, filename);
  };

  // Gestion de la sélection de fichier
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setImportComplete(false);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

      switch (importType) {
        case 'ca':
          parseCAData(jsonData);
          break;
        case 'products':
          parseProductData(jsonData);
          break;
        case 'rfa':
          parseRFAData(jsonData);
          break;
      }

      toastSuccess(`${jsonData.length} ${t('contracts.import.lines_loaded', 'ligne(s) chargée(s)')}`);
    } catch (error) {
      logger.error('ContractImportTab', 'Erreur lecture fichier:', error);
      toastError(t('contracts.import.file_read_error', 'Impossible de lire le fichier'));
      setSelectedFile(null);
    }
  };

  const parseCAData = (jsonData: Record<string, unknown>[]) => {
    const contractRefs = new Set(contracts.map(c => c.contract_name.toLowerCase()));
    
    const rows: CAImportRow[] = jsonData.map(row => {
      const errors: string[] = [];
      const contractRef = String(row.contract_reference || '').trim();
      const turnover = Number(row.turnover_amount) || 0;
      const periodStart = String(row.period_start || '').trim();
      const periodEnd = String(row.period_end || '').trim();

      if (!contractRef) errors.push(t('contracts.import.errors.contract_ref_required', 'Référence contrat obligatoire'));
      if (!contractRefs.has(contractRef.toLowerCase()) && contracts.length > 0) {
        errors.push(t('contracts.import.errors.contract_not_found', 'Contrat non trouvé'));
      }
      if (turnover <= 0) errors.push(t('contracts.import.errors.turnover_positive', 'CA doit être positif'));
      if (!periodStart) errors.push(t('contracts.import.errors.period_start_required', 'Date début obligatoire'));
      if (!periodEnd) errors.push(t('contracts.import.errors.period_end_required', 'Date fin obligatoire'));

      return {
        contract_reference: contractRef,
        client_name: String(row.client_name || ''),
        period_start: periodStart,
        period_end: periodEnd,
        turnover_amount: turnover,
        currency: String(row.currency || 'EUR'),
        isValid: errors.length === 0,
        errors
      };
    });

    setCAData(rows);
  };

  const parseProductData = (jsonData: Record<string, unknown>[]) => {
    const contractRefs = new Set(contracts.map(c => c.contract_name.toLowerCase()));
    
    const rows: ProductRefImportRow[] = jsonData.map(row => {
      const errors: string[] = [];
      const contractRef = String(row.contract_reference || '').trim();
      const productCode = String(row.product_code || '').trim();
      const productName = String(row.product_name || '').trim();
      const unitPrice = Number(row.unit_price) || 0;

      if (!contractRef) errors.push(t('contracts.import.errors.contract_ref_required', 'Référence contrat obligatoire'));
      if (!contractRefs.has(contractRef.toLowerCase()) && contracts.length > 0) {
        errors.push(t('contracts.import.errors.contract_not_found', 'Contrat non trouvé'));
      }
      if (!productCode) errors.push(t('contracts.import.errors.product_code_required', 'Code produit obligatoire'));
      if (!productName) errors.push(t('contracts.import.errors.product_name_required', 'Nom produit obligatoire'));
      if (unitPrice < 0) errors.push(t('contracts.import.errors.price_positive', 'Prix doit être >= 0'));

      return {
        contract_reference: contractRef,
        product_code: productCode,
        product_name: productName,
        unit_price: unitPrice,
        currency: String(row.currency || 'EUR'),
        category: row.category ? String(row.category) : undefined,
        isValid: errors.length === 0,
        errors
      };
    });

    setProductData(rows);
  };

  const parseRFAData = (jsonData: Record<string, unknown>[]) => {
    const contractRefs = new Set(contracts.map(c => c.contract_name.toLowerCase()));
    
    const rows: RFAImportRow[] = jsonData.map(row => {
      const errors: string[] = [];
      const contractRef = String(row.contract_reference || '').trim();
      const turnover = Number(row.turnover_amount) || 0;
      const rfaRate = Number(row.rfa_rate) || 0;
      const rfaAmount = Number(row.rfa_amount) || 0;
      const periodStart = String(row.period_start || '').trim();
      const periodEnd = String(row.period_end || '').trim();

      if (!contractRef) errors.push(t('contracts.import.errors.contract_ref_required', 'Référence contrat obligatoire'));
      if (!contractRefs.has(contractRef.toLowerCase()) && contracts.length > 0) {
        errors.push(t('contracts.import.errors.contract_not_found', 'Contrat non trouvé'));
      }
      if (turnover <= 0) errors.push(t('contracts.import.errors.turnover_positive', 'CA doit être positif'));
      if (rfaRate < 0 || rfaRate > 1) errors.push(t('contracts.import.errors.rfa_rate_range', 'Taux RFA doit être entre 0 et 1'));
      if (rfaAmount < 0) errors.push(t('contracts.import.errors.rfa_amount_positive', 'Montant RFA doit être >= 0'));
      if (!periodStart) errors.push(t('contracts.import.errors.period_start_required', 'Date début obligatoire'));
      if (!periodEnd) errors.push(t('contracts.import.errors.period_end_required', 'Date fin obligatoire'));

      return {
        contract_reference: contractRef,
        client_name: String(row.client_name || ''),
        period_start: periodStart,
        period_end: periodEnd,
        turnover_amount: turnover,
        rfa_rate: rfaRate,
        rfa_amount: rfaAmount,
        currency: String(row.currency || 'EUR'),
        notes: row.notes ? String(row.notes) : undefined,
        isValid: errors.length === 0,
        errors
      };
    });

    setRFAData(rows);
  };

  // Import effectif
  const handleImport = async () => {
    if (!companyId) {
      toastError(t('contracts.import.company_required', 'Entreprise non définie'));
      return;
    }

    setImporting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      switch (importType) {
        case 'ca':
          ({ successCount, errorCount } = await importCAData());
          break;
        case 'products':
          ({ successCount, errorCount } = await importProductData());
          break;
        case 'rfa':
          ({ successCount, errorCount } = await importRFAData());
          break;
      }
    } finally {
      setImporting(false);
      setImportComplete(true);
      setImportStats({ success: successCount, errors: errorCount });

      if (successCount > 0) {
        toastSuccess(`${successCount} ${t('contracts.import.items_imported', 'élément(s) importé(s)')}`);
        onImportComplete?.();
      }
      if (errorCount > 0) {
        toastError(`${errorCount} ${t('contracts.import.errors_occurred', 'erreur(s)')}`);
      }
    }
  };

  const importCAData = async () => {
    const validRows = caData.filter(row => row.isValid);
    let successCount = 0;
    let errorCount = 0;

    for (const row of validRows) {
      try {
        // Trouver le contrat correspondant
        const contract = contracts.find(c => 
          c.contract_name.toLowerCase() === row.contract_reference.toLowerCase()
        );

        if (!contract) {
          errorCount++;
          continue;
        }

        // Insérer le CA dans contract_turnover_records
        const { error } = await supabase.from('contract_turnover_records').insert({
          contract_id: contract.id,
          company_id: companyId,
          period_start: row.period_start,
          period_end: row.period_end,
          turnover_amount: row.turnover_amount,
          currency: row.currency,
          source: 'import'
        });

        if (error) throw error;
        successCount++;
      } catch (error) {
        logger.error('ContractImportTab', 'Erreur import CA:', row.contract_reference, error);
        errorCount++;
      }
    }

    return { successCount, errorCount };
  };

  const importProductData = async () => {
    const validRows = productData.filter(row => row.isValid);
    let successCount = 0;
    let errorCount = 0;

    for (const row of validRows) {
      try {
        const contract = contracts.find(c => 
          c.contract_name.toLowerCase() === row.contract_reference.toLowerCase()
        );

        if (!contract) {
          errorCount++;
          continue;
        }

        // Insérer dans contract_product_references
        const { error } = await supabase.from('contract_product_references').insert({
          contract_id: contract.id,
          company_id: companyId,
          product_code: row.product_code,
          product_name: row.product_name,
          unit_price: row.unit_price,
          currency: row.currency,
          category: row.category || null,
          is_active: true
        });

        if (error) throw error;
        successCount++;
      } catch (error) {
        logger.error('ContractImportTab', 'Erreur import produit:', row.product_code, error);
        errorCount++;
      }
    }

    return { successCount, errorCount };
  };

  const importRFAData = async () => {
    const validRows = rfaData.filter(row => row.isValid);
    let successCount = 0;
    let errorCount = 0;

    for (const row of validRows) {
      try {
        const contract = contracts.find(c => 
          c.contract_name.toLowerCase() === row.contract_reference.toLowerCase()
        );

        if (!contract) {
          errorCount++;
          continue;
        }

        // Insérer dans rfa_calculations
        const { error } = await supabase.from('rfa_calculations').insert({
          contract_id: contract.id,
          company_id: companyId,
          period_start: row.period_start,
          period_end: row.period_end,
          turnover_amount: row.turnover_amount,
          rfa_rate: row.rfa_rate,
          rfa_amount: row.rfa_amount,
          currency: row.currency,
          notes: row.notes || null,
          status: 'imported',
          source: 'import'
        });

        if (error) throw error;
        successCount++;
      } catch (error) {
        logger.error('ContractImportTab', 'Erreur import RFA:', row.contract_reference, error);
        errorCount++;
      }
    }

    return { successCount, errorCount };
  };

  // Helpers
  const getCurrentData = () => {
    switch (importType) {
      case 'ca': return caData;
      case 'products': return productData;
      case 'rfa': return rfaData;
      default: return [];
    }
  };

  const getValidCount = () => getCurrentData().filter(row => row.isValid).length;
  const getInvalidCount = () => getCurrentData().length - getValidCount();

  const getDownloadFunction = () => {
    switch (importType) {
      case 'ca': return downloadCATemplate;
      case 'products': return downloadProductsTemplate;
      case 'rfa': return downloadRFATemplate;
    }
  };

  const getImportLabel = () => {
    switch (importType) {
      case 'ca': return t('contracts.import.types.ca', 'Chiffre d\'Affaires');
      case 'products': return t('contracts.import.types.products', 'Références Produits');
      case 'rfa': return t('contracts.import.types.rfa', 'Calculs RFA');
    }
  };

  // Reset pour nouveau fichier
  const resetImport = () => {
    setCAData([]);
    setProductData([]);
    setRFAData([]);
    setSelectedFile(null);
    setImportComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Sélection du type d'import */}
      <Tabs value={importType} onValueChange={(v) => handleImportTypeChange(v as ImportType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ca" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            {t('contracts.import.types.ca', 'CA')}
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {t('contracts.import.types.products', 'Produits')}
          </TabsTrigger>
          <TabsTrigger value="rfa" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            {t('contracts.import.types.rfa', 'RFA')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ca">
          <ImportInstructions
            title={t('contracts.import.ca_title', 'Import du Chiffre d\'Affaires')}
            description={t('contracts.import.ca_description', 'Importez les données de CA réalisé par contrat pour alimenter les calculs de RFA.')}
            columns={['contract_reference', 'client_name', 'period_start', 'period_end', 'turnover_amount', 'currency']}
          />
        </TabsContent>

        <TabsContent value="products">
          <ImportInstructions
            title={t('contracts.import.products_title', 'Import des Références Produits')}
            description={t('contracts.import.products_description', 'Importez la liste des références produits éligibles à chaque contrat.')}
            columns={['contract_reference', 'product_code', 'product_name', 'unit_price', 'currency', 'category']}
          />
        </TabsContent>

        <TabsContent value="rfa">
          <ImportInstructions
            title={t('contracts.import.rfa_title', 'Import des Calculs RFA')}
            description={t('contracts.import.rfa_description', 'Importez des calculs RFA historiques ou externes pour les intégrer au suivi.')}
            columns={['contract_reference', 'client_name', 'period_start', 'period_end', 'turnover_amount', 'rfa_rate', 'rfa_amount', 'currency', 'notes']}
          />
        </TabsContent>
      </Tabs>

      {/* Télécharger le modèle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t('contracts.import.step1', 'Étape 1 : Télécharger le modèle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={getDownloadFunction()} variant="outline">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {t('contracts.import.download_template', 'Télécharger le modèle Excel')} - {getImportLabel()}
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            {t('contracts.import.template_hint', 'Le modèle contient des exemples pour vous guider')}
          </p>
        </CardContent>
      </Card>

      {/* Charger le fichier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t('contracts.import.step2', 'Étape 2 : Charger votre fichier')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="flex-1"
              />
              {selectedFile && (
                <Badge variant="outline">
                  {selectedFile.name}
                </Badge>
              )}
            </div>

            {getCurrentData().length > 0 && (
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium">{getValidCount()} {t('contracts.import.valid_lines', 'ligne(s) valide(s)')}</span>
                  </div>
                  {getInvalidCount() > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {getInvalidCount()} {t('contracts.import.invalid_lines', 'ligne(s) invalide(s)')}
                      </span>
                    </div>
                  )}
                </div>
                {!importComplete && (
                  <Button
                    onClick={handleImport}
                    disabled={importing || getValidCount() === 0}
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('contracts.import.importing', 'Import en cours...')}
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        {t('contracts.import.import_button', 'Importer')} {getValidCount()} {getImportLabel()}
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Résultats de l'import */}
      {importComplete && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {t('contracts.import.complete', 'Import terminé')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded">
                <span className="font-medium text-green-700 dark:text-green-300">
                  {t('contracts.import.success_label', 'Éléments importés avec succès')}
                </span>
                <Badge variant="default" className="bg-green-600">
                  {importStats.success}
                </Badge>
              </div>
              {importStats.errors > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded">
                  <span className="font-medium text-red-700 dark:text-red-300">
                    {t('contracts.import.errors_label', 'Erreurs lors de l\'import')}
                  </span>
                  <Badge variant="destructive">{importStats.errors}</Badge>
                </div>
              )}
              <Button onClick={resetImport} variant="outline" className="w-full mt-4">
                {t('contracts.import.import_another', 'Importer un autre fichier')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prévisualisation des données */}
      {getCurrentData().length > 0 && !importComplete && (
        <Card>
          <CardHeader>
            <CardTitle>{t('contracts.import.preview', 'Prévisualisation des données')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <DataPreviewTable
                data={getCurrentData()}
                importType={importType}
              />
              {getCurrentData().length > 20 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  ... {t('contracts.import.more_lines', 'et')} {getCurrentData().length - 20} {t('contracts.import.other_lines', 'autre(s) ligne(s)')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Composant instructions
const ImportInstructions: React.FC<{
  title: string;
  description: string;
  columns: string[];
}> = ({ title, description, columns }) => {
  const { t } = useTranslation();
  
  return (
    <Alert className="mt-4">
      <Info className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-medium">{title}</p>
          <p className="text-sm">{description}</p>
          <p className="text-sm text-muted-foreground mt-2">
            <strong>{t('contracts.import.columns_label', 'Colonnes attendues')} :</strong>{' '}
            {columns.join(', ')}
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};

// Composant table de prévisualisation
const DataPreviewTable: React.FC<{
  data: (CAImportRow | ProductRefImportRow | RFAImportRow)[];
  importType: ImportType;
}> = ({ data, importType }) => {
  const getColumns = () => {
    switch (importType) {
      case 'ca':
        return ['Statut', 'Contrat', 'Client', 'Début', 'Fin', 'CA', 'Erreurs'];
      case 'products':
        return ['Statut', 'Contrat', 'Code', 'Nom', 'Prix', 'Catégorie', 'Erreurs'];
      case 'rfa':
        return ['Statut', 'Contrat', 'Client', 'Période', 'CA', 'RFA', 'Erreurs'];
    }
  };

  const renderRow = (row: CAImportRow | ProductRefImportRow | RFAImportRow, index: number) => {
    if (importType === 'ca') {
      const r = row as CAImportRow;
      return (
        <tr key={index} className={`border-b ${r.isValid ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
          <td className="py-2 px-3">
            {r.isValid ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
          </td>
          <td className="py-2 px-3 font-medium">{r.contract_reference}</td>
          <td className="py-2 px-3">{r.client_name || '-'}</td>
          <td className="py-2 px-3">{r.period_start}</td>
          <td className="py-2 px-3">{r.period_end}</td>
          <td className="py-2 px-3">{r.turnover_amount.toLocaleString()} {r.currency}</td>
          <td className="py-2 px-3">
            {r.errors.length > 0 ? (
              <div className="space-y-1">
                {r.errors.map((error, i) => (
                  <p key={i} className="text-xs text-red-600 dark:text-red-400">{error}</p>
                ))}
              </div>
            ) : (
              <span className="text-green-600 text-xs">OK</span>
            )}
          </td>
        </tr>
      );
    }

    if (importType === 'products') {
      const r = row as ProductRefImportRow;
      return (
        <tr key={index} className={`border-b ${r.isValid ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
          <td className="py-2 px-3">
            {r.isValid ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
          </td>
          <td className="py-2 px-3 font-medium">{r.contract_reference}</td>
          <td className="py-2 px-3">{r.product_code}</td>
          <td className="py-2 px-3">{r.product_name}</td>
          <td className="py-2 px-3">{r.unit_price.toLocaleString()} {r.currency}</td>
          <td className="py-2 px-3">{r.category || '-'}</td>
          <td className="py-2 px-3">
            {r.errors.length > 0 ? (
              <div className="space-y-1">
                {r.errors.map((error, i) => (
                  <p key={i} className="text-xs text-red-600 dark:text-red-400">{error}</p>
                ))}
              </div>
            ) : (
              <span className="text-green-600 text-xs">OK</span>
            )}
          </td>
        </tr>
      );
    }

    // RFA
    const r = row as RFAImportRow;
    return (
      <tr key={index} className={`border-b ${r.isValid ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
        <td className="py-2 px-3">
          {r.isValid ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
        </td>
        <td className="py-2 px-3 font-medium">{r.contract_reference}</td>
        <td className="py-2 px-3">{r.client_name || '-'}</td>
        <td className="py-2 px-3">{r.period_start} - {r.period_end}</td>
        <td className="py-2 px-3">{r.turnover_amount.toLocaleString()} {r.currency}</td>
        <td className="py-2 px-3">{r.rfa_amount.toLocaleString()} ({(r.rfa_rate * 100).toFixed(1)}%)</td>
        <td className="py-2 px-3">
          {r.errors.length > 0 ? (
            <div className="space-y-1">
              {r.errors.map((error, i) => (
                <p key={i} className="text-xs text-red-600 dark:text-red-400">{error}</p>
              ))}
            </div>
          ) : (
            <span className="text-green-600 text-xs">OK</span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b">
          {getColumns().map((col, i) => (
            <th key={i} className="text-left py-2 px-3 font-medium">{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.slice(0, 20).map((row, index) => renderRow(row, index))}
      </tbody>
    </table>
  );
};

export default ContractImportTab;
