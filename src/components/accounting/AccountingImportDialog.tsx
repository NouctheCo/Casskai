/**
 * Accounting Import Dialog Component
 *
 * Advanced CSV/Excel import for:
 * - Journal entries (écritures comptables)
 * - Chart of accounts (plan comptable)
 *
 * Features:
 * - Drag & drop file upload
 * - Automatic column detection
 * - Preview before import
 * - Validation with error reporting
 * - Progress tracking
 */
import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  Eye,
  Table
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';
import {
  importJournalEntries,
  importChartOfAccounts,
  type ImportResult
} from '@/services/accounting/accountingImportService';
import Papa from 'papaparse';
import { logger } from '@/lib/logger';
interface AccountingImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onImportComplete?: () => void;
}
type ImportType = 'journal_entries' | 'chart_of_accounts';
interface ParsedData {
  headers: string[];
  rows: any[];
  rowCount: number;
}
export function AccountingImportDialog({
  open,
  onOpenChange,
  companyId,
  onImportComplete
}: AccountingImportDialogProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  // State
  const [importType, setImportType] = useState<ImportType>('journal_entries');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [importing, setImporting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [groupByEntry, setGroupByEntry] = useState(true);
  const [replaceExisting, setReplaceExisting] = useState(false);
  // Create default mapping from headers
  const createDefaultMapping = useCallback((): Record<string, string> => {
    if (!parsedData) return {};
    const mapping: Record<string, string> = {};
    parsedData.headers.forEach(header => {
      // Map headers to themselves (identity mapping)
      mapping[header] = header;
    });
    return mapping;
  }, [parsedData]);
  // Get or create period ID (using current fiscal year)
  const getPeriodId = useCallback(async (): Promise<string> => {
    // For now, return a placeholder - should be replaced with actual period selection
    const { data: periods } = await supabase
      .from('accounting_periods')
      .select('id')
      .eq('company_id', companyId)
      .eq('is_closed', false)
      .order('start_date', { ascending: false })
      .limit(1);
    return periods?.[0]?.id || '';
  }, [companyId]);
  // Reset state
  const resetState = useCallback(() => {
    setFile(null);
    setParsedData(null);
    setImporting(false);
    setValidating(false);
    setImportResult(null);
    setPreviewMode(false);
  }, []);
  // Handle file selection
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    // Validate file type
    const validTypes = ['.csv', '.txt', '.tsv'];
    const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
    if (!validTypes.includes(fileExtension)) {
      showToast(t('accounting.import.error.invalid_file_type', 'Invalid file type. Please upload a CSV file.'), 'error');
      return;
    }
    setFile(selectedFile);
    parseFile(selectedFile);
  }, [showToast, t]);
  // Parse CSV file
  const parseFile = useCallback((file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: '',
      complete: (results) => {
        if (results.errors.length > 0) {
          showToast(t('accounting.import.error.parse_failed', 'Failed to parse CSV file'), 'error');
          logger.error('AccountingImportDialog', 'CSV parse errors:', results.errors);
          return;
        }
        setParsedData({
          headers: results.meta.fields || [],
          rows: results.data,
          rowCount: results.data.length
        });
        showToast(
          t('accounting.import.file_parsed', `File parsed successfully: ${results.data.length} rows`),
          'success'
        );
      },
      error: (error) => {
        showToast(t('accounting.import.error.parse_failed', 'Failed to parse CSV file'), 'error');
        logger.error('AccountingImportDialog', 'CSV parse error:', error);
      }
    });
  }, [showToast, t]);
  // Validate import (preview mode)
  const handleValidate = useCallback(async () => {
    if (!parsedData) return;
    setValidating(true);
    setImportResult(null);
    try {
      let result: ImportResult;
      const mapping = createDefaultMapping();
      if (importType === 'journal_entries') {
        const periodId = await getPeriodId();
        result = await importJournalEntries(companyId, periodId, parsedData.rows, mapping, {
          validateOnly: true,
          groupByEntry
        });
      } else {
        result = await importChartOfAccounts(companyId, parsedData.rows, mapping, {
          validateOnly: true,
          replaceExisting: replaceExisting ? true : false
        });
      }
      setImportResult(result);
      setPreviewMode(true);
      if (result.success) {
        showToast(
          t('accounting.import.validation_success', `Validation successful: ${result.imported} rows ready to import`),
          'success'
        );
      } else {
        showToast(
          t('accounting.import.validation_errors', `Validation failed: ${result.failed} errors found`),
          'warning'
        );
      }
    } catch (error) {
      logger.error('AccountingImportDialog', 'Validation error:', error);
      showToast(t('accounting.import.error.validation_failed', 'Validation failed'), 'error');
    } finally {
      setValidating(false);
    }
  }, [parsedData, importType, companyId, groupByEntry, replaceExisting, showToast, t]);
  // Execute import
  const handleImport = useCallback(async () => {
    if (!parsedData) return;
    setImporting(true);
    setImportResult(null);
    try {
      let result: ImportResult;
      const mapping = createDefaultMapping();
      if (importType === 'journal_entries') {
        const periodId = await getPeriodId();
        result = await importJournalEntries(companyId, periodId, parsedData.rows, mapping, {
          validateOnly: false,
          groupByEntry
        });
      } else {
        result = await importChartOfAccounts(companyId, parsedData.rows, mapping, {
          validateOnly: false,
          replaceExisting: replaceExisting ? true : false
        });
      }
      setImportResult(result);
      if (result.success) {
        showToast(
          t('accounting.import.success', `Import successful: ${result.imported} rows imported`),
          'success'
        );
        // Close dialog after success
        setTimeout(() => {
          onImportComplete?.();
          onOpenChange(false);
          resetState();
        }, 2000);
      } else {
        showToast(
          t('accounting.import.partial_success', `Import completed with errors: ${result.imported} imported, ${result.failed} failed`),
          'warning'
        );
      }
    } catch (error) {
      logger.error('AccountingImportDialog', 'Import error:', error);
      showToast(t('accounting.import.error.import_failed', 'Import failed'), 'error');
    } finally {
      setImporting(false);
    }
  }, [parsedData, importType, companyId, groupByEntry, replaceExisting, showToast, t, onImportComplete, onOpenChange, resetState]);
  // Download error report
  const downloadErrorReport = useCallback(() => {
    if (!importResult?.errors || importResult.errors.length === 0) return;
    const csvContent = [
      ['Row', 'Column', 'Error', 'Value'].join(','),
      ...importResult.errors.map(err =>
        [err.row, err.column, err.error, err.value].join(',')
      )
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import_errors.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [importResult]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>{t('accounting.import.title', 'Import Accounting Data')}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Import Type Selection */}
          <div className="space-y-2">
            <Label>{t('accounting.import.type', 'Import Type')}</Label>
            <Select value={importType} onValueChange={(value) => setImportType(value as ImportType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="journal_entries">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>{t('accounting.import.journal_entries', 'Journal Entries')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="chart_of_accounts">
                  <div className="flex items-center space-x-2">
                    <Table className="w-4 h-4" />
                    <span>{t('accounting.import.chart_of_accounts', 'Chart of Accounts')}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* File Upload */}
          {!file && (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <input
                type="file"
                id="file-upload"
                accept=".csv,.txt,.tsv"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('accounting.import.drop_file', 'Drop your CSV file here or click to browse')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('accounting.import.supported_formats', 'Supported formats: CSV, TXT, TSV')}
                </p>
              </label>
            </div>
          )}
          {/* File Info */}
          {file && parsedData && (
            <Card className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {parsedData.rowCount} rows • {parsedData.headers.length} columns
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={resetState}>
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
              {/* Headers Preview */}
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">
                  {t('accounting.import.detected_columns', 'Detected Columns')}:
                </p>
                <div className="flex flex-wrap gap-2">
                  {parsedData.headers.map((header, idx) => (
                    <Badge key={idx} variant="secondary">
                      {header}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          )}
          {/* Options */}
          {parsedData && (
            <div className="space-y-3">
              {importType === 'journal_entries' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="group-by-entry"
                    checked={groupByEntry}
                    onCheckedChange={(checked) => setGroupByEntry(checked as boolean)}
                  />
                  <Label htmlFor="group-by-entry" className="text-sm cursor-pointer">
                    {t('accounting.import.group_by_entry', 'Group lines by journal entry')}
                  </Label>
                </div>
              )}
              {importType === 'chart_of_accounts' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="replace-existing"
                    checked={replaceExisting}
                    onCheckedChange={(checked) => setReplaceExisting(checked as boolean)}
                  />
                  <Label htmlFor="replace-existing" className="text-sm cursor-pointer">
                    {t('accounting.import.replace_existing', 'Replace existing chart of accounts')}
                  </Label>
                </div>
              )}
            </div>
          )}
          {/* Import Result */}
          {importResult && (
            <div className="space-y-4">
              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                      <p className="text-2xl font-bold">{importResult.total_rows}</p>
                    </div>
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {previewMode ? 'Valid' : 'Imported'}
                      </p>
                      <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Errors</p>
                      <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                </Card>
              </div>
              {/* Progress Bar */}
              {importResult.total_rows > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      {previewMode ? 'Validation' : 'Import'} Progress
                    </span>
                    <span>
                      {Math.round((importResult.imported / importResult.total_rows) * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={(importResult.imported / importResult.total_rows) * 100}
                  />
                </div>
              )}
              {/* Warnings */}
              {importResult.warnings && importResult.warnings.length > 0 && (
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">Warnings:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {importResult.warnings.map((warning, idx) => (
                        <li key={idx} className="text-sm">{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              {/* Errors */}
              {importResult.errors && importResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium mb-2">
                          {importResult.errors.length} errors found:
                        </p>
                        <ul className="list-disc list-inside space-y-1 max-h-40 overflow-y-auto">
                          {importResult.errors.slice(0, 10).map((error, idx) => (
                            <li key={idx} className="text-sm">
                              Row {error.row}: {error.error} (Column: {error.column})
                            </li>
                          ))}
                          {importResult.errors.length > 10 && (
                            <li className="text-sm font-medium">
                              ... and {importResult.errors.length - 10} more errors
                            </li>
                          )}
                        </ul>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadErrorReport}
                        className="ml-4"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          {/* Actions */}
          <div className="flex items-center justify-end space-x-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            {parsedData && !previewMode && (
              <Button
                onClick={handleValidate}
                disabled={validating}
                variant="secondary"
              >
                <Eye className="w-4 h-4 mr-2" />
                {validating ? t('accounting.import.validating', 'Validating...') : t('accounting.import.validate', 'Validate')}
              </Button>
            )}
            {parsedData && (
              <Button
                onClick={handleImport}
                disabled={importing || validating || (importResult && !importResult.success) || undefined}
              >
                <Upload className="w-4 h-4 mr-2" />
                {importing ? t('accounting.import.importing', 'Importing...') : t('accounting.import.import', 'Import')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}