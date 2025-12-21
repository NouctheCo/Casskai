import React, { useState, useCallback } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { FileUp, FileText, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ParseResult } from '@/utils/accountingFileParser';

interface FECImportDropzoneProps {
  onFileSelected: (file: File) => void;
  isProcessing: boolean;
  parseResult?: ParseResult | null;
}

const FECImportDropzone: React.FC<FECImportDropzoneProps> = ({ onFileSelected, isProcessing, parseResult }) => {
  const { t } = useLocale();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  }, []);

  const validateAndProcessFile = (file: File) => {
    setError(null);

    // Accepter tous les formats de fichiers comptables
    const validExtensions = /\.(txt|csv|tsv|dat|fec|iif|xlsx?)$/i;
    if (!file.name.match(validExtensions) && file.name.indexOf('.') !== -1) {
      setError(t('fecImport.error.fileType', {
        defaultValue: 'Format de fichier non supporté. Formats acceptés: .txt, .csv, .tsv, .dat, .fec, .iif, .xls, .xlsx'
      }));
      return;
    }

    // Validate file size (max 50MB pour supporter de gros fichiers)
    if (file.size > 50 * 1024 * 1024) {
      setError(t('fecImport.error.fileSize', { defaultValue: 'Fichier trop volumineux. Taille maximale: 50MB.' }));
      return;
    }

    onFileSelected(file);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

  const getFormatBadgeColor = (format: string): string => {
    switch (format) {
      case 'FEC': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'SYSCOHADA': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'IFRS_CSV': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'SCF': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'QUICKBOOKS': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'SAGE': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'XERO': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="w-full space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {parseResult && parseResult.warnings.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Informations de détection</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {parseResult.warnings.map((warning, idx) => (
                <li key={idx} className="text-sm">{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {parseResult && parseResult.success && (
        <div className="space-y-4">
          {/* Infos détectées */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Format</div>
                <Badge className={`mt-1 ${getFormatBadgeColor(parseResult.format)}`}>
                  {parseResult.format}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Standard</div>
                <div className="font-semibold">{parseResult.standard || 'Non détecté'}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Devises</div>
                <div className="font-semibold">{parseResult.stats.currencies.join(', ')}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Période</div>
                <div className="text-xs font-semibold">
                  {parseResult.stats.dateRange
                    ? `${parseResult.stats.dateRange.start} → ${parseResult.stats.dateRange.end}`
                    : '-'
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{parseResult.stats.validLines}</div>
              <div className="text-sm text-green-700 dark:text-green-300">Lignes valides</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatNumber(parseResult.stats.totalDebit)}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Total Débit</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{formatNumber(parseResult.stats.totalCredit)}</div>
              <div className="text-sm text-purple-700 dark:text-purple-300">Total Crédit</div>
            </div>
            <div className="text-center p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{formatNumber(Math.abs(parseResult.stats.balance))}</div>
              <div className="text-sm text-amber-700 dark:text-amber-300">
                {Math.abs(parseResult.stats.balance) < 0.01 ? '✓ Équilibré' : '⚠ Écart'}
              </div>
            </div>
          </div>

          {/* Journaux détectés */}
          {parseResult.stats.journals.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm font-medium mb-2">Journaux détectés ({parseResult.stats.journals.length})</div>
                <div className="flex flex-wrap gap-2">
                  {parseResult.stats.journals.map((journal, idx) => (
                    <Badge key={idx} variant="outline">{journal}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Erreurs */}
          {parseResult.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreurs détectées ({parseResult.errors.length})</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2 max-h-40 overflow-y-auto">
                  {parseResult.errors.slice(0, 10).map((err, idx) => (
                    <li key={idx} className="text-sm">
                      Ligne {err.line}: {err.message}
                    </li>
                  ))}
                  {parseResult.errors.length > 10 && (
                    <li className="text-sm font-semibold">... et {parseResult.errors.length - 10} autres erreurs</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div
        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive ? 'border-blue-600 bg-blue-600/5' : 'border-gray-300 dark:border-gray-600'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <FileUp className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-300">
          <span className="font-semibold">{t('fecImport.dropzone.clickToUpload', { defaultValue: 'Cliquer pour importer' })}</span> {t('fecImport.dropzone.orDragAndDrop', { defaultValue: 'ou glisser-déposer' })}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-300 text-center">
          {t('fecImport.dropzone.fileTypes', {
            defaultValue: 'Formats supportés: FEC, SYSCOHADA, IFRS, SCF, QuickBooks, Sage, Xero'
          })}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-400 text-center mt-1">
          .txt, .csv, .tsv, .dat, .fec, .iif, .xls, .xlsx
        </p>
        <input
          id="dropzone-file"
          type="file"
          className="hidden"
          aria-label="Sélectionner un fichier FEC à importer"
          accept=".txt,.csv,.tsv,.dat,.fec,.iif,.xls,.xlsx"
          onChange={handleFileChange}
          disabled={isProcessing}
        />
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => document.getElementById('dropzone-file')?.click()}
          disabled={isProcessing}
        >
          <FileText className="mr-2 h-4 w-4" />
          {t('fecImport.dropzone.selectFile', { defaultValue: 'Sélectionner un fichier' })}
        </Button>
      </div>
    </div>
  );
};

export default FECImportDropzone;
