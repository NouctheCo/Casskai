/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  RotateCcw,
  Info
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { toastSuccess, toastError } from '@/lib/toast-helpers';
import { accountingImportService } from '@/services/accountingImportService';
import { logger } from '@/lib/logger';

interface ImportRow {
  date: string;
  journalCode: string;
  pieceNumber: string;
  accountNumber: string;
  label: string;
  debit: number;
  credit: number;
  isValid: boolean;
  errors: string[];
  rowIndex: number;
}

interface BalanceCheck {
  pieceNumber: string;
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
}

interface BulkJournalImportTabProps {
  companyId: string;
  defaultJournalCode?: string;
  onImportComplete?: () => void;
}

export const BulkJournalImportTab: React.FC<BulkJournalImportTabProps> = ({
  companyId,
  defaultJournalCode,
  onImportComplete
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [balanceChecks, setBalanceChecks] = useState<BalanceCheck[]>([]);
  const [importing, setImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStats, setImportStats] = useState({
    entriesCreated: 0,
    journalsCreated: 0,
    accountsCreated: 0,
    errors: 0
  });
  const [dragOver, setDragOver] = useState(false);

  const downloadTemplate = async () => {
    const journalCode = defaultJournalCode || 'OD';
    const templateData = [
      {
        date: '15/01/2025',
        journalCode,
        pieceNumber: 'FA-2025-001',
        accountNumber: '607100',
        label: 'Achat marchandises',
        debit: 1000.00,
        credit: 0
      },
      {
        date: '15/01/2025',
        journalCode,
        pieceNumber: 'FA-2025-001',
        accountNumber: '445660',
        label: 'TVA déductible 20%',
        debit: 200.00,
        credit: 0
      },
      {
        date: '15/01/2025',
        journalCode,
        pieceNumber: 'FA-2025-001',
        accountNumber: '401000',
        label: 'Fournisseur XYZ',
        debit: 0,
        credit: 1200.00
      }
    ];

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CassKai';
    const worksheet = workbook.addWorksheet('Écritures comptables');

    const headers = [
      t('bulkImport.columns.date', 'Date'),
      t('bulkImport.columns.journalCode', 'Code Journal'),
      t('bulkImport.columns.pieceNumber', 'N° Pièce'),
      t('bulkImport.columns.accountNumber', 'N° Compte'),
      t('bulkImport.columns.label', 'Libellé'),
      t('bulkImport.columns.debit', 'Débit'),
      t('bulkImport.columns.credit', 'Crédit')
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF1E40AF' } }
      };
    });

    templateData.forEach((row) => {
      const dataRow = worksheet.addRow([
        row.date,
        row.journalCode,
        row.pieceNumber,
        row.accountNumber,
        row.label,
        row.debit,
        row.credit
      ]);
      dataRow.getCell(6).numFmt = '#,##0.00';
      dataRow.getCell(7).numFmt = '#,##0.00';
    });

    worksheet.columns = [
      { width: 14 },
      { width: 14 },
      { width: 18 },
      { width: 14 },
      { width: 35 },
      { width: 14 },
      { width: 14 }
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `modele_import_ecritures_${journalCode.toLowerCase()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toastSuccess(t('bulkImport.templateDownloaded', 'Modèle téléchargé'));
  };

  const parseDate = (value: unknown): string | null => {
    if (!value) return null;

    if (value instanceof Date) {
      const y = value.getFullYear();
      const m = String(value.getMonth() + 1).padStart(2, '0');
      const d = String(value.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    const str = String(value).trim();

    // DD/MM/YYYY
    const dmyMatch = str.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      return `${dmyMatch[3]}-${month}-${day}`;
    }

    // YYYY-MM-DD
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }

    // YYYYMMDD
    const compactMatch = str.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (compactMatch) {
      return `${compactMatch[1]}-${compactMatch[2]}-${compactMatch[3]}`;
    }

    return null;
  };

  const parseAmount = (value: unknown): number => {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return Math.round(value * 100) / 100;
    const str = String(value).trim().replace(/\s/g, '');
    // Handle comma as decimal separator
    const normalized = str.replace(',', '.');
    const num = parseFloat(normalized);
    return isNaN(num) ? 0 : Math.round(num * 100) / 100;
  };

  const validateRows = (rows: ImportRow[]): ImportRow[] => {
    return rows.map((row) => {
      const errors: string[] = [];

      if (!row.date) {
        errors.push(t('bulkImport.validation.dateRequired', 'Date obligatoire'));
      }

      if (!row.journalCode) {
        errors.push(t('bulkImport.validation.journalRequired', 'Code journal obligatoire'));
      }

      if (!row.pieceNumber) {
        errors.push(t('bulkImport.validation.pieceRequired', 'N° pièce obligatoire'));
      }

      if (!row.accountNumber) {
        errors.push(t('bulkImport.validation.accountRequired', 'N° compte obligatoire'));
      } else if (!/^\d{3,10}$/.test(row.accountNumber)) {
        errors.push(t('bulkImport.validation.accountFormat', 'N° compte invalide (3 à 10 chiffres)'));
      }

      if (row.debit === 0 && row.credit === 0) {
        errors.push(t('bulkImport.validation.amountRequired', 'Un montant débit ou crédit est requis'));
      }

      if (row.debit > 0 && row.credit > 0) {
        errors.push(t('bulkImport.validation.bothAmounts', 'Une ligne ne peut pas avoir débit ET crédit'));
      }

      return { ...row, isValid: errors.length === 0, errors };
    });
  };

  const checkBalances = (rows: ImportRow[]): BalanceCheck[] => {
    const pieceMap = new Map<string, { debit: number; credit: number }>();
    rows.forEach((row) => {
      if (!row.pieceNumber) return;
      const existing = pieceMap.get(row.pieceNumber) || { debit: 0, credit: 0 };
      existing.debit += row.debit;
      existing.credit += row.credit;
      pieceMap.set(row.pieceNumber, existing);
    });

    return Array.from(pieceMap.entries()).map(([pieceNumber, totals]) => ({
      pieceNumber,
      totalDebit: Math.round(totals.debit * 100) / 100,
      totalCredit: Math.round(totals.credit * 100) / 100,
      balanced: Math.abs(totals.debit - totals.credit) < 0.01
    }));
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setImportComplete(false);
    setImportStats({ entriesCreated: 0, journalsCreated: 0, accountsCreated: 0, errors: 0 });

    try {
      const data = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(data);
      const sheet = workbook.worksheets[0];

      if (!sheet) {
        toastError(t('bulkImport.validation.noSheet', 'Feuille Excel introuvable'));
        return;
      }

      const rows: ImportRow[] = [];
      sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const values = row.values as Array<unknown>;
        const rawDate = values[1];
        const date = parseDate(rawDate);
        const journalCode = String(values[2] || defaultJournalCode || '').trim().toUpperCase();
        const pieceNumber = String(values[3] || '').trim();
        const accountNumber = String(values[4] || '').trim().replace(/\s/g, '');
        const label = String(values[5] || '').trim();
        const debit = parseAmount(values[6]);
        const credit = parseAmount(values[7]);

        // Skip completely empty rows
        if (!date && !journalCode && !pieceNumber && !accountNumber && !label && debit === 0 && credit === 0) {
          return;
        }

        rows.push({
          date: date || '',
          journalCode,
          pieceNumber,
          accountNumber,
          label,
          debit,
          credit,
          isValid: true,
          errors: [],
          rowIndex: rowNumber
        });
      });

      if (rows.length === 0) {
        toastError(t('bulkImport.validation.noData', 'Aucune donnée trouvée dans le fichier'));
        return;
      }

      const validatedRows = validateRows(rows);
      const balances = checkBalances(validatedRows);

      setImportData(validatedRows);
      setBalanceChecks(balances);

      const validCount = validatedRows.filter((r) => r.isValid).length;
      const invalidCount = validatedRows.length - validCount;
      const unbalanced = balances.filter((b) => !b.balanced).length;

      if (invalidCount > 0 || unbalanced > 0) {
        toastError(
          `${invalidCount} ligne(s) invalide(s), ${unbalanced} pièce(s) déséquilibrée(s)`
        );
      } else {
        toastSuccess(`${validCount} lignes valides prêtes à importer`);
      }
    } catch (error) {
      logger.error('BulkJournalImport', 'Erreur parsing fichier:', error);
      toastError(t('bulkImport.validation.parseError', 'Erreur lors de la lecture du fichier'));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleImport = async () => {
    const validRows = importData.filter((r) => r.isValid);
    const unbalancedPieces = new Set(
      balanceChecks.filter((b) => !b.balanced).map((b) => b.pieceNumber)
    );

    // Filter out rows belonging to unbalanced pieces
    const rowsToImport = validRows.filter((r) => !unbalancedPieces.has(r.pieceNumber));

    if (rowsToImport.length === 0) {
      toastError(t('bulkImport.validation.noValidData', 'Aucune ligne valide à importer'));
      return;
    }

    setImporting(true);
    setImportProgress(10);

    try {
      // Build content string in FEC-like format for the universal parser
      const header = 'JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcritureLet|DateLet|ValidDate|Montantdevise|Idevise';
      const lines = rowsToImport.map((row) => {
        const dateFormatted = row.date.replace(/-/g, '');
        return [
          row.journalCode,
          `Journal ${row.journalCode}`,
          row.pieceNumber,
          dateFormatted,
          row.accountNumber,
          row.label || `Compte ${row.accountNumber}`,
          '', // CompAuxNum
          '', // CompAuxLib
          row.pieceNumber,
          dateFormatted,
          row.label,
          row.debit > 0 ? row.debit.toFixed(2).replace('.', ',') : '0,00',
          row.credit > 0 ? row.credit.toFixed(2).replace('.', ',') : '0,00',
          '', '', '', '', ''
        ].join('|');
      });

      const content = [header, ...lines].join('\n');

      setImportProgress(30);

      // Create a virtual file for the import service
      const file = new File([content], 'import.txt', { type: 'text/plain' });

      setImportProgress(50);

      const result = await accountingImportService.parseAndImportFile(file, companyId);

      setImportProgress(90);

      if (result.success && result.summary) {
        setImportStats({
          entriesCreated: result.summary.entriesCreated,
          journalsCreated: result.summary.journalsCreated,
          accountsCreated: result.summary.accountsCreated,
          errors: result.summary.entriesWithErrors
        });
        setImportComplete(true);
        toastSuccess(
          `${result.summary.entriesCreated} écriture(s) importée(s) avec succès`
        );
        onImportComplete?.();
      } else {
        toastError(result.error || 'Erreur lors de l\'import');
        setImportStats((prev) => ({ ...prev, errors: 1 }));
        setImportComplete(true);
      }
    } catch (error) {
      logger.error('BulkJournalImport', 'Erreur import:', error);
      toastError(t('bulkImport.error', 'Erreur lors de l\'import'));
      setImportStats((prev) => ({ ...prev, errors: 1 }));
      setImportComplete(true);
    } finally {
      setImporting(false);
      setImportProgress(100);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImportData([]);
    setBalanceChecks([]);
    setImportComplete(false);
    setImportProgress(0);
    setImportStats({ entriesCreated: 0, journalsCreated: 0, accountsCreated: 0, errors: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validCount = importData.filter((r) => r.isValid).length;
  const invalidCount = importData.length - validCount;
  const unbalancedCount = balanceChecks.filter((b) => !b.balanced).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Upload className="h-6 w-6 text-blue-600" />
            {t('bulkImport.title', 'Import en masse d\'écritures comptables')}
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t(
              'bulkImport.description',
              'Importez vos écritures comptables depuis un fichier Excel. Téléchargez d\'abord le modèle, remplissez-le, puis importez-le.'
            )}
          </p>
        </CardHeader>
        <CardContent>
          {/* Step 1: Download Template */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">1</Badge>
              {t('bulkImport.step1', 'Télécharger le modèle')}
            </h3>
            <Button
              onClick={downloadTemplate}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {t('bulkImport.downloadTemplate', 'Télécharger le modèle Excel')}
            </Button>
          </div>

          {/* Step 2: Upload File */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">2</Badge>
              {t('bulkImport.step2', 'Charger votre fichier')}
            </h3>

            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                dragOver
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {t('bulkImport.dropzone', 'Glissez-déposez votre fichier ici ou cliquez pour sélectionner')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {t('bulkImport.formats', 'Format accepté : .xlsx')}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleInputChange}
                className="hidden"
                aria-label={t('bulkImport.selectFile', 'Sélectionner un fichier')}
              />
            </div>

            {selectedFile && (
              <div className="mt-3 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(selectedFile.size / 1024).toFixed(1)} Ko)
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validation Preview */}
      {importData.length > 0 && !importComplete && (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">3</Badge>
              {t('bulkImport.step3', 'Vérification et import')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{importData.length}</div>
                <div className="text-xs text-gray-500">{t('bulkImport.totalLines', 'Lignes totales')}</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">{validCount}</div>
                <div className="text-xs text-green-600 dark:text-green-400">{t('bulkImport.validLines', 'Lignes valides')}</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-700 dark:text-red-400">{invalidCount}</div>
                <div className="text-xs text-red-600 dark:text-red-400">{t('bulkImport.invalidLines', 'Lignes invalides')}</div>
              </div>
              <div className={`rounded-lg p-3 text-center ${unbalancedCount > 0 ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
                <div className={`text-2xl font-bold ${unbalancedCount > 0 ? 'text-orange-700 dark:text-orange-400' : 'text-green-700 dark:text-green-400'}`}>
                  {balanceChecks.length - unbalancedCount}/{balanceChecks.length}
                </div>
                <div className={`text-xs ${unbalancedCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                  {t('bulkImport.balancedPieces', 'Pièces équilibrées')}
                </div>
              </div>
            </div>

            {/* Unbalanced warnings */}
            {unbalancedCount > 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('bulkImport.unbalancedWarning', 'Les pièces suivantes sont déséquilibrées et ne seront pas importées :')}
                  {' '}
                  {balanceChecks
                    .filter((b) => !b.balanced)
                    .map((b) => `${b.pieceNumber} (D: ${b.totalDebit.toFixed(2)} / C: ${b.totalCredit.toFixed(2)})`)
                    .join(', ')}
                </AlertDescription>
              </Alert>
            )}

            {/* Data Preview Table */}
            <div className="overflow-x-auto max-h-96 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">#</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">{t('bulkImport.columns.date', 'Date')}</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">{t('bulkImport.columns.journalCode', 'Journal')}</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">{t('bulkImport.columns.pieceNumber', 'N° Pièce')}</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">{t('bulkImport.columns.accountNumber', 'Compte')}</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">{t('bulkImport.columns.label', 'Libellé')}</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">{t('bulkImport.columns.debit', 'Débit')}</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">{t('bulkImport.columns.credit', 'Crédit')}</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">{t('bulkImport.columns.status', 'Statut')}</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-gray-100 dark:border-gray-700 ${
                        !row.isValid ? 'bg-red-50 dark:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                      }`}
                    >
                      <td className="px-3 py-2 text-gray-500">{row.rowIndex}</td>
                      <td className="px-3 py-2">{row.date}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="text-xs">{row.journalCode}</Badge>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{row.pieceNumber}</td>
                      <td className="px-3 py-2 font-mono text-xs">{row.accountNumber}</td>
                      <td className="px-3 py-2 max-w-48 truncate">{row.label}</td>
                      <td className="px-3 py-2 text-right font-mono">
                        {row.debit > 0 ? row.debit.toFixed(2) : ''}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {row.credit > 0 ? row.credit.toFixed(2) : ''}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {row.isValid ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <div className="flex items-center gap-1 justify-center" title={row.errors.join(', ')}>
                            <XCircle className="h-4 w-4 text-red-500" />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Error details */}
            {invalidCount > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {t('bulkImport.errorDetails', 'Détail des erreurs :')}
                </p>
                {importData
                  .filter((r) => !r.isValid)
                  .slice(0, 10)
                  .map((row, idx) => (
                    <p key={idx} className="text-xs text-red-500 dark:text-red-400 ml-5">
                      Ligne {row.rowIndex}: {row.errors.join(' | ')}
                    </p>
                  ))}
                {importData.filter((r) => !r.isValid).length > 10 && (
                  <p className="text-xs text-gray-500 ml-5">
                    ... et {importData.filter((r) => !r.isValid).length - 10} autre(s)
                  </p>
                )}
              </div>
            )}

            {/* Import Progress */}
            {importing && (
              <div className="mt-4">
                <Progress value={importProgress} className="h-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                  {t('bulkImport.importing', 'Import en cours...')}
                </p>
              </div>
            )}

            {/* Import Button */}
            <div className="mt-4 flex items-center gap-3">
              <Button
                onClick={handleImport}
                disabled={importing || validCount === 0}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('bulkImport.importing', 'Import en cours...')}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {t('bulkImport.importButton', `Importer ${validCount} ligne(s)`)}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={importing}>
                <RotateCcw className="h-4 w-4 mr-2" />
                {t('bulkImport.reset', 'Réinitialiser')}
              </Button>

              {unbalancedCount > 0 && (
                <span className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {t('bulkImport.unbalancedSkipped', 'Les pièces déséquilibrées seront ignorées')}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importComplete && (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {importStats.errors === 0 ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <AlertCircle className="h-6 w-6 text-orange-500" />
              )}
              {t('bulkImport.results.title', 'Résultats de l\'import')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-700 dark:text-green-400">
                  {importStats.entriesCreated}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  {t('bulkImport.results.entriesCreated', 'Écritures créées')}
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                  {importStats.journalsCreated}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  {t('bulkImport.results.journalsCreated', 'Journaux créés')}
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                  {importStats.accountsCreated}
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400">
                  {t('bulkImport.results.accountsCreated', 'Comptes créés')}
                </div>
              </div>
              {importStats.errors > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-red-700 dark:text-red-400">
                    {importStats.errors}
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400">
                    {t('bulkImport.results.errors', 'Erreurs')}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleReset} variant="outline" className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                {t('bulkImport.newImport', 'Nouvel import')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Info */}
      {importData.length === 0 && !importComplete && (
        <Alert className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">{t('bulkImport.help.title', 'Format du fichier')}</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>{t('bulkImport.help.columns', 'Colonnes : Date, Code Journal, N° Pièce, N° Compte, Libellé, Débit, Crédit')}</li>
              <li>{t('bulkImport.help.date', 'Date au format JJ/MM/AAAA ou AAAA-MM-JJ')}</li>
              <li>{t('bulkImport.help.balance', 'Chaque pièce (même N° Pièce) doit être équilibrée (Total Débit = Total Crédit)')}</li>
              <li>{t('bulkImport.help.accounts', 'Les journaux et comptes manquants seront créés automatiquement')}</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default BulkJournalImportTab;
