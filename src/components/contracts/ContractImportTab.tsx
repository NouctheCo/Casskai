/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * 
 * Onglet d'import pour les contrats RFA :
 * - Import CA (Chiffre d'Affaires) → rfa_turnover_entries
 * - Import groupes/références produits → rfa_product_groups + rfa_product_group_items
 * - Import calculs RFA → rfa_calculations
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
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
import ExcelJS from 'exceljs';
import { toastSuccess, toastError } from '@/lib/toast-helpers';
import { logger } from '@/lib/logger';
import { getCurrentCompanyCurrency } from '@/lib/utils';

// Types pour l'import CA (rfa_turnover_entries)
interface CAImportRow {
  third_party_name: string;
  product_group_code?: string;
  period_start: string;
  period_end: string;
  amount_excl_tax: number;
  amount_incl_tax: number;
  isValid: boolean;
  errors: string[];
  // IDs résolus
  third_party_id?: string;
  rfa_product_group_id?: string;
}

// Types pour l'import groupes de produits (rfa_product_groups + rfa_product_group_items)
interface ProductGroupImportRow {
  group_code: string;
  group_name: string;
  group_description?: string;
  group_color?: string;
  product_reference: string;
  product_name: string;
  isValid: boolean;
  errors: string[];
}

// Types pour l'import RFA (rfa_calculations)
interface RFAImportRow {
  contract_name: string;
  calculation_period: string;
  period_start: string;
  period_end: string;
  turnover_amount: number;
  rfa_percentage: number;
  rfa_amount: number;
  currency: string;
  calculation_method: string;
  notes?: string;
  isValid: boolean;
  errors: string[];
  // ID résolu
  contract_id?: string;
}

// Types de référence pour la validation
interface ThirdParty {
  id: string;
  name: string;
}

interface ProductGroup {
  id: string;
  code: string;
  name: string;
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
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [importType, setImportType] = useState<ImportType>('ca');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [importStats, setImportStats] = useState({ success: 0, errors: 0 });
  
  // Reference data for validation
  const [thirdParties, setThirdParties] = useState<ThirdParty[]>([]);
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  
  // Data states pour chaque type
  const [caData, setCAData] = useState<CAImportRow[]>([]);
  const [productData, setProductData] = useState<ProductGroupImportRow[]>([]);
  const [rfaData, setRFAData] = useState<RFAImportRow[]>([]);

  // Load reference data
  const loadReferenceData = useCallback(async () => {
    if (!companyId) return;

    try {
      // Load third parties
      const { data: parties } = await supabase
        .from('third_parties')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('is_active', true);
      
      if (parties) {
        setThirdParties(parties);
      }

      // Load product groups
      const { data: groups } = await supabase
        .from('rfa_product_groups')
        .select('id, code, name')
        .eq('company_id', companyId)
        .eq('is_active', true);
      
      if (groups) {
        setProductGroups(groups);
      }
    } catch (error) {
      logger.error('ContractImportTab', 'Error loading reference data:', error);
    }
  }, [companyId]);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

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

  // ========================================
  // TEMPLATES DOWNLOAD
  // ========================================
  
  const downloadCATemplate = () => {
    const template = [
      {
        third_party_name: 'Client Exemple SARL',
        product_group_code: 'GRP-001',
        period_start: '2024-01-01',
        period_end: '2024-03-31',
        amount_excl_tax: 50000,
        amount_incl_tax: 60000
      },
      {
        third_party_name: 'Autre Client SAS',
        product_group_code: '',
        period_start: '2024-01-01',
        period_end: '2024-03-31',
        amount_excl_tax: 75000,
        amount_incl_tax: 90000
      }
    ];
    void downloadTemplate(template, 'template_import_ca_rfa.xlsx', 'CA RFA');
    toastSuccess(t('contracts.import.template_downloaded', 'Modèle téléchargé'));
  };

  const downloadProductsTemplate = () => {
    const template = [
      {
        group_code: 'GRP-001',
        group_name: 'Groupe Produits A',
        group_description: 'Famille de produits A pour RFA',
        group_color: '#3B82F6',
        product_reference: 'PROD-001',
        product_name: 'Produit Alpha'
      },
      {
        group_code: 'GRP-001',
        group_name: 'Groupe Produits A',
        group_description: 'Famille de produits A pour RFA',
        group_color: '#3B82F6',
        product_reference: 'PROD-002',
        product_name: 'Produit Beta'
      },
      {
        group_code: 'GRP-002',
        group_name: 'Groupe Services',
        group_description: 'Services éligibles RFA',
        group_color: '#10B981',
        product_reference: 'SRV-001',
        product_name: 'Service Premium'
      }
    ];
    void downloadTemplate(template, 'template_import_groupes_produits.xlsx', 'Groupes Produits');
    toastSuccess(t('contracts.import.template_downloaded', 'Modèle téléchargé'));
  };

  const downloadRFATemplate = () => {
    const template = [
      {
        contract_name: 'Contrat Client A 2024',
        calculation_period: '2024-Q1',
        period_start: '2024-01-01',
        period_end: '2024-03-31',
        turnover_amount: 200000,
        rfa_percentage: 3.00,
        rfa_amount: 6000,
        currency: getCurrentCompanyCurrency(),
        calculation_method: 'progressive',
        notes: 'RFA T1 2024'
      },
      {
        contract_name: 'Contrat Client B 2024',
        calculation_period: '2024-Q1',
        period_start: '2024-01-01',
        period_end: '2024-03-31',
        turnover_amount: 350000,
        rfa_percentage: 5.00,
        rfa_amount: 17500,
        currency: getCurrentCompanyCurrency(),
        calculation_method: 'fixed',
        notes: 'RFA taux fixe'
      }
    ];
    void downloadTemplate(template, 'template_import_calculs_rfa.xlsx', 'Calculs RFA');
    toastSuccess(t('contracts.import.template_downloaded', 'Modèle téléchargé'));
  };

  const downloadTemplate = async (data: object[], filename: string, sheetName: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);
    const headers = Object.keys(data[0] || {});
    worksheet.addRow(headers);
    data.forEach((row) => worksheet.addRow(headers.map((key) => (row as any)[key])));
    worksheet.columns = headers.map(() => ({ width: 22 }));
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ========================================
  // FILE PARSING
  // ========================================

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setImportComplete(false);

    try {
      const data = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(data);
      const sheet = workbook.worksheets[0];
      if (!sheet) {
        throw new Error('Feuille Excel introuvable');
      }
      const headers = (sheet.getRow(1).values as Array<string | number | null | undefined>)
        .slice(1)
        .map((header) => String(header || '').trim());
      const jsonData: Record<string, unknown>[] = [];
      sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;
        const rowValues = row.values as Array<string | number | null | undefined>;
        const record: Record<string, unknown> = {};
        headers.forEach((header, index) => {
          record[header] = rowValues[index + 1];
        });
        const hasValues = Object.values(record).some((value) => value !== undefined && value !== null && String(value).trim() !== '');
        if (hasValues) jsonData.push(record);
      });

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
    const thirdPartyMap = new Map(thirdParties.map(tp => [tp.name.toLowerCase(), tp.id]));
    const productGroupMap = new Map(productGroups.map(pg => [pg.code?.toLowerCase(), pg.id]));
    
    const rows: CAImportRow[] = jsonData.map(row => {
      const errors: string[] = [];
      const thirdPartyName = String(row.third_party_name || '').trim();
      const productGroupCode = String(row.product_group_code || '').trim();
      const periodStart = String(row.period_start || '').trim();
      const periodEnd = String(row.period_end || '').trim();
      const amountExclTax = Number(row.amount_excl_tax) || 0;
      const amountInclTax = Number(row.amount_incl_tax) || 0;

      // Validation
      if (!thirdPartyName) {
        errors.push(t('contracts.import.errors.third_party_required', 'Nom du tiers obligatoire'));
      }
      
      const thirdPartyId = thirdPartyMap.get(thirdPartyName.toLowerCase());
      if (thirdPartyName && !thirdPartyId) {
        errors.push(t('contracts.import.errors.third_party_not_found', 'Tiers non trouvé'));
      }

      let productGroupId: string | undefined;
      if (productGroupCode) {
        productGroupId = productGroupMap.get(productGroupCode.toLowerCase());
        if (!productGroupId) {
          errors.push(t('contracts.import.errors.product_group_not_found', 'Groupe produit non trouvé'));
        }
      }

      if (!periodStart) errors.push(t('contracts.import.errors.period_start_required', 'Date début obligatoire'));
      if (!periodEnd) errors.push(t('contracts.import.errors.period_end_required', 'Date fin obligatoire'));
      if (amountExclTax < 0) errors.push(t('contracts.import.errors.amount_positive', 'Montant HT doit être >= 0'));

      return {
        third_party_name: thirdPartyName,
        product_group_code: productGroupCode || undefined,
        period_start: periodStart,
        period_end: periodEnd,
        amount_excl_tax: amountExclTax,
        amount_incl_tax: amountInclTax || amountExclTax * 1.2,
        third_party_id: thirdPartyId,
        rfa_product_group_id: productGroupId,
        isValid: errors.length === 0,
        errors
      };
    });

    setCAData(rows);
  };

  const parseProductData = (jsonData: Record<string, unknown>[]) => {
    const rows: ProductGroupImportRow[] = jsonData.map(row => {
      const errors: string[] = [];
      const groupCode = String(row.group_code || '').trim();
      const groupName = String(row.group_name || '').trim();
      const productReference = String(row.product_reference || '').trim();
      const productName = String(row.product_name || '').trim();

      if (!groupCode) errors.push(t('contracts.import.errors.group_code_required', 'Code groupe obligatoire'));
      if (!groupName) errors.push(t('contracts.import.errors.group_name_required', 'Nom groupe obligatoire'));
      if (!productReference) errors.push(t('contracts.import.errors.product_ref_required', 'Référence produit obligatoire'));
      if (!productName) errors.push(t('contracts.import.errors.product_name_required', 'Nom produit obligatoire'));

      return {
        group_code: groupCode,
        group_name: groupName,
        group_description: row.group_description ? String(row.group_description) : undefined,
        group_color: row.group_color ? String(row.group_color) : '#3B82F6',
        product_reference: productReference,
        product_name: productName,
        isValid: errors.length === 0,
        errors
      };
    });

    setProductData(rows);
  };

  const parseRFAData = (jsonData: Record<string, unknown>[]) => {
    const contractMap = new Map(contracts.map(c => [c.contract_name.toLowerCase(), c.id]));
    
    const rows: RFAImportRow[] = jsonData.map(row => {
      const errors: string[] = [];
      const contractName = String(row.contract_name || '').trim();
      const calculationPeriod = String(row.calculation_period || '').trim();
      const periodStart = String(row.period_start || '').trim();
      const periodEnd = String(row.period_end || '').trim();
      const turnoverAmount = Number(row.turnover_amount) || 0;
      const rfaPercentage = Number(row.rfa_percentage) || 0;
      const rfaAmount = Number(row.rfa_amount) || 0;
      const currency = String(row.currency || getCurrentCompanyCurrency()).trim();
      const calculationMethod = String(row.calculation_method || 'progressive').trim();

      // Validation
      if (!contractName) {
        errors.push(t('contracts.import.errors.contract_name_required', 'Nom du contrat obligatoire'));
      }
      
      const contractId = contractMap.get(contractName.toLowerCase());
      if (contractName && !contractId) {
        errors.push(t('contracts.import.errors.contract_not_found', 'Contrat non trouvé'));
      }

      if (!calculationPeriod) errors.push(t('contracts.import.errors.calc_period_required', 'Période de calcul obligatoire'));
      if (!periodStart) errors.push(t('contracts.import.errors.period_start_required', 'Date début obligatoire'));
      if (!periodEnd) errors.push(t('contracts.import.errors.period_end_required', 'Date fin obligatoire'));
      if (turnoverAmount < 0) errors.push(t('contracts.import.errors.turnover_positive', 'CA doit être >= 0'));
      if (rfaPercentage < 0 || rfaPercentage > 100) errors.push(t('contracts.import.errors.rfa_rate_range', 'Taux RFA doit être entre 0 et 100'));
      if (rfaAmount < 0) errors.push(t('contracts.import.errors.rfa_amount_positive', 'Montant RFA doit être >= 0'));
      if (!['progressive', 'fixed', 'custom'].includes(calculationMethod)) {
        errors.push(t('contracts.import.errors.invalid_calc_method', 'Méthode de calcul invalide (progressive/fixed/custom)'));
      }

      return {
        contract_name: contractName,
        calculation_period: calculationPeriod,
        period_start: periodStart,
        period_end: periodEnd,
        turnover_amount: turnoverAmount,
        rfa_percentage: rfaPercentage,
        rfa_amount: rfaAmount,
        currency,
        calculation_method: calculationMethod,
        notes: row.notes ? String(row.notes) : undefined,
        contract_id: contractId,
        isValid: errors.length === 0,
        errors
      };
    });

    setRFAData(rows);
  };

  // ========================================
  // IMPORT FUNCTIONS
  // ========================================

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
        loadReferenceData(); // Reload reference data
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
        const { error } = await supabase.from('rfa_turnover_entries').insert({
          company_id: companyId,
          third_party_id: row.third_party_id,
          rfa_product_group_id: row.rfa_product_group_id || null,
          period_start: row.period_start,
          period_end: row.period_end,
          amount_excl_tax: row.amount_excl_tax,
          amount_incl_tax: row.amount_incl_tax,
          created_by: user?.id
        });

        if (error) throw error;
        successCount++;
      } catch (error) {
        logger.error('ContractImportTab', 'Erreur import CA:', row.third_party_name, error);
        errorCount++;
      }
    }

    return { successCount, errorCount };
  };

  const importProductData = async () => {
    const validRows = productData.filter(row => row.isValid);
    let successCount = 0;
    let errorCount = 0;

    // Group items by group_code to create groups first
    const groupedByCode = new Map<string, ProductGroupImportRow[]>();
    for (const row of validRows) {
      const existing = groupedByCode.get(row.group_code) || [];
      existing.push(row);
      groupedByCode.set(row.group_code, existing);
    }

    for (const [groupCode, items] of groupedByCode) {
      try {
        const firstItem = items[0];
        
        // Check if group already exists
        const { data: existingGroup } = await supabase
          .from('rfa_product_groups')
          .select('id')
          .eq('company_id', companyId)
          .eq('code', groupCode)
          .single();

        let groupId: string;

        if (existingGroup) {
          groupId = existingGroup.id;
        } else {
          // Create the group
          const { data: newGroup, error: groupError } = await supabase
            .from('rfa_product_groups')
            .insert({
              company_id: companyId,
              code: groupCode,
              name: firstItem.group_name,
              description: firstItem.group_description || null,
              color: firstItem.group_color || '#3B82F6',
              is_active: true,
              created_by: user?.id
            })
            .select('id')
            .single();

          if (groupError) throw groupError;
          groupId = newGroup.id;
        }

        // Insert all items for this group
        for (const item of items) {
          try {
            const { error: itemError } = await supabase
              .from('rfa_product_group_items')
              .insert({
                product_group_id: groupId,
                product_reference: item.product_reference,
                product_name: item.product_name
              });

            if (itemError) {
              // Ignore duplicate errors (unique constraint)
              if (!itemError.message?.includes('unique')) {
                throw itemError;
              }
            } else {
              successCount++;
            }
          } catch (itemErr) {
            logger.error('ContractImportTab', 'Erreur import item:', item.product_reference, itemErr);
            errorCount++;
          }
        }
      } catch (groupErr) {
        logger.error('ContractImportTab', 'Erreur import groupe:', groupCode, groupErr);
        errorCount += items.length;
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
        const { error } = await supabase.from('rfa_calculations').insert({
          contract_id: row.contract_id,
          company_id: companyId,
          calculation_period: row.calculation_period,
          period_start: row.period_start,
          period_end: row.period_end,
          turnover_amount: row.turnover_amount,
          rfa_percentage: row.rfa_percentage,
          rfa_amount: row.rfa_amount,
          currency: row.currency,
          calculation_method: row.calculation_method,
          calculation_notes: row.notes || null,
          status: 'calculated'
        });

        if (error) throw error;
        successCount++;
      } catch (error) {
        logger.error('ContractImportTab', 'Erreur import RFA:', row.contract_name, error);
        errorCount++;
      }
    }

    return { successCount, errorCount };
  };

  // ========================================
  // HELPERS
  // ========================================

  const getCurrentData = (): (CAImportRow | ProductGroupImportRow | RFAImportRow)[] => {
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
      case 'products': return t('contracts.import.types.products', 'Groupes Produits');
      case 'rfa': return t('contracts.import.types.rfa', 'Calculs RFA');
    }
  };

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

  // ========================================
  // RENDER
  // ========================================

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
            description={t('contracts.import.ca_description', 'Importez les données de CA réalisé par tiers et période pour alimenter les calculs de RFA.')}
            columns={['third_party_name', 'product_group_code', 'period_start', 'period_end', 'amount_excl_tax', 'amount_incl_tax']}
          />
        </TabsContent>

        <TabsContent value="products">
          <ImportInstructions
            title={t('contracts.import.products_title', 'Import des Groupes de Produits')}
            description={t('contracts.import.products_description', 'Importez les groupes de produits et leurs références pour le suivi RFA.')}
            columns={['group_code', 'group_name', 'group_description', 'group_color', 'product_reference', 'product_name']}
          />
        </TabsContent>

        <TabsContent value="rfa">
          <ImportInstructions
            title={t('contracts.import.rfa_title', 'Import des Calculs RFA')}
            description={t('contracts.import.rfa_description', 'Importez des calculs RFA historiques ou externes pour les intégrer au suivi.')}
            columns={['contract_name', 'calculation_period', 'period_start', 'period_end', 'turnover_amount', 'rfa_percentage', 'rfa_amount', 'currency', 'calculation_method', 'notes']}
          />
        </TabsContent>
      </Tabs>

      {/* Info sur les données de référence */}
      {importType === 'ca' && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <p className="text-sm">
              <strong>{t('contracts.import.available_third_parties', 'Tiers disponibles')}:</strong> {thirdParties.length} | 
              <strong className="ml-2">{t('contracts.import.available_product_groups', 'Groupes produits')}:</strong> {productGroups.length}
            </p>
          </AlertDescription>
        </Alert>
      )}

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

// ========================================
// SUB-COMPONENTS
// ========================================

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

const DataPreviewTable: React.FC<{
  data: (CAImportRow | ProductGroupImportRow | RFAImportRow)[];
  importType: ImportType;
}> = ({ data, importType }) => {
  const getColumns = () => {
    switch (importType) {
      case 'ca':
        return ['Statut', 'Tiers', 'Groupe', 'Période', 'Montant HT', 'Erreurs'];
      case 'products':
        return ['Statut', 'Code Groupe', 'Nom Groupe', 'Réf. Produit', 'Nom Produit', 'Erreurs'];
      case 'rfa':
        return ['Statut', 'Contrat', 'Période', 'CA', 'Taux', 'RFA', 'Erreurs'];
    }
  };

  const renderRow = (row: CAImportRow | ProductGroupImportRow | RFAImportRow, index: number) => {
    if (importType === 'ca') {
      const r = row as CAImportRow;
      return (
        <tr key={index} className={`border-b ${r.isValid ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
          <td className="py-2 px-3">
            {r.isValid ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
          </td>
          <td className="py-2 px-3 font-medium">{r.third_party_name}</td>
          <td className="py-2 px-3">{r.product_group_code || '-'}</td>
          <td className="py-2 px-3">{r.period_start} - {r.period_end}</td>
          <td className="py-2 px-3">{r.amount_excl_tax.toLocaleString('fr-FR')} €</td>
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
      const r = row as ProductGroupImportRow;
      return (
        <tr key={index} className={`border-b ${r.isValid ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
          <td className="py-2 px-3">
            {r.isValid ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
          </td>
          <td className="py-2 px-3 font-medium">{r.group_code}</td>
          <td className="py-2 px-3">{r.group_name}</td>
          <td className="py-2 px-3">{r.product_reference}</td>
          <td className="py-2 px-3">{r.product_name}</td>
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
        <td className="py-2 px-3 font-medium">{r.contract_name}</td>
        <td className="py-2 px-3">{r.calculation_period}</td>
        <td className="py-2 px-3">{r.turnover_amount.toLocaleString('fr-FR')} {r.currency}</td>
        <td className="py-2 px-3">{r.rfa_percentage.toFixed(2)}%</td>
        <td className="py-2 px-3">{r.rfa_amount.toLocaleString('fr-FR')} {r.currency}</td>
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
