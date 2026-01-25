import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useLocale } from '@/contexts/LocaleContext';
import { accountingImportService } from '@/services/accountingImportService';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import FECImportDropzone from './FECImportDropzone';
import type { ParseResult } from '@/utils/accountingFileParser';
import { logger } from '@/lib/logger';
import { getCurrentCompanyCurrency } from '@/lib/utils';
interface FECImportProps {
  currentEnterpriseId?: string;
  onImportSuccess?: () => void;
}
interface ImportResult {
  success: boolean;
  summary?: {
    journalsCreated: number;
    journalsExisting: number;
    accountsCreated: number;
    accountsExisting: number;
    entriesCreated: number;
    entriesWithErrors: number;
    errors: any[];
    format: string;
    standard: string | null;
  };
  error?: string;
}
const FECImport: React.FC<FECImportProps> = ({ currentEnterpriseId, onImportSuccess }) => {
  const { t } = useLocale();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const handleFileSelected = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setParsing(true);
    setParseResult(null);
    setImportResult(null);
    try {
      // Lire le contenu du fichier
      const content = await accountingImportService.readFileContent(selectedFile);
      // Parser avec le parser universel
      const result = await import('@/utils/accountingFileParser').then(module =>
        module.parseAccountingFile(content, {
          defaultCurrency: getCurrentCompanyCurrency()
        })
      );
      setParseResult(result);
      if (!result.success) {
        toast({
          variant: 'destructive',
          title: t('error'),
          description: result.errors.length > 0
            ? result.errors[0].message
            : t('fecImport.error.parsingFailed', { defaultValue: 'Échec du parsing du fichier' })
        });
      }
    } catch (error) {
      logger.error('FECImport', 'Erreur lors du parsing:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: error instanceof Error ? error.message : t('fecImport.error.parsingFailed', { defaultValue: 'Échec du parsing du fichier' })
      });
    } finally {
      setParsing(false);
    }
  }, [t, toast]);
  const handleImport = async () => {
    if (!file || !parseResult || !currentEnterpriseId) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('fecImport.error.noDataOrCompany', { defaultValue: 'Aucune donnée à importer ou aucune entreprise sélectionnée' })
      });
      return;
    }
    if (!parseResult.success || parseResult.lines.length === 0) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('fecImport.error.cannotImportWithErrors', { defaultValue: 'Impossible d\'importer des données avec des erreurs et aucune entrée valide' })
      });
      return;
    }
    logger.debug('FECImport', '🔧 Import pour l\'entreprise:', currentEnterpriseId);
    logger.debug('FECImport', '📄 Fichier:', file.name);
    logger.debug('FECImport', '📊 Format détecté:', parseResult.format);
    logger.debug('FECImport', '📊 Standard:', parseResult.standard);
    setImporting(true);
    setImportProgress(10);
    try {
      // Simuler une progression
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
      // Importer les données avec le nouveau service
      const result = await accountingImportService.parseAndImportFile(file, currentEnterpriseId, {
        defaultCurrency: getCurrentCompanyCurrency()
      });
      clearInterval(progressInterval);
      setImportProgress(100);
      if (result.success && result.summary) {
        toast({
          title: t('success'),
          description: t('fecImport.import.success', {
            defaultValue: `Import réussi: ${result.summary.entriesCreated} écritures, ${result.summary.accountsCreated} comptes, ${result.summary.journalsCreated} journaux créés`
          })
        });
        setImportResult(result);
        // Rafraîchir les données
        if (onImportSuccess) {
          setTimeout(() => onImportSuccess(), 1500);
        }
      } else {
        toast({
          variant: 'destructive',
          title: t('error'),
          description: result.error || t('fecImport.import.failed', { defaultValue: 'Échec de l\'import' })
        });
      }
    } catch (error) {
      logger.error('FECImport', 'Erreur lors de l\'import:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: error instanceof Error ? error.message : t('fecImport.import.failed', { defaultValue: 'Échec de l\'import' })
      });
    } finally {
      setImporting(false);
    }
  };
  const resetState = () => {
    setFile(null);
    setParseResult(null);
    setImportResult(null);
    setImportProgress(0);
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('fec', { defaultValue: 'Import comptable universel' })}</CardTitle>
        <CardDescription>
          {t('fecImport.description', {
            defaultValue: 'Importez vos fichiers comptables (FEC, SYSCOHADA, IFRS, SCF, QuickBooks, Sage, Xero) pour créer automatiquement les écritures, comptes et journaux.'
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!file && (
          <FECImportDropzone
            onFileSelected={handleFileSelected}
            isProcessing={parsing}
            parseResult={parseResult}
          />
        )}
        {parsing && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span>{t('fecImport.parsing', { defaultValue: 'Analyse du fichier en cours...' })}</span>
          </div>
        )}
        {importing && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span>{t('fecImport.importing', { defaultValue: 'Import des données en cours...' })}</span>
            <Progress value={importProgress} className="w-full max-w-md" />
          </div>
        )}
        {file && !parsing && !importing && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-600/10 rounded-full">
                  <div className="w-6 h-6 text-primary text-xs font-bold flex items-center justify-center">
                    {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                  </div>
                </div>
                <div>
                  <p className="font-semibold">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                  {parseResult && (
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{parseResult.format}</Badge>
                      {parseResult.standard && (
                        <Badge variant="outline" className="text-xs">{parseResult.standard}</Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={resetState} disabled={parsing || importing}>
                {t('fecImport.button.clearFile', { defaultValue: "Effacer" })}
              </Button>
            </div>
            {parseResult && (
              <FECImportDropzone
                onFileSelected={handleFileSelected}
                isProcessing={false}
                parseResult={parseResult}
              />
            )}
            {parseResult && parseResult.success && parseResult.lines.length > 0 && (
              <Button
                onClick={handleImport}
                disabled={importing}
                className="w-full"
                size="lg"
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t('fecImport.button.importing', { defaultValue: "Import en cours..." })}
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    {t('fecImport.button.startImport', { defaultValue: "Démarrer l'import" })}
                  </>
                )}
              </Button>
            )}
          </div>
        )}
        {importResult && (
          <Alert variant={importResult.success ? "default" : "destructive"}>
            {importResult.success ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4" />}
            <AlertTitle>
              {importResult.success
                ? t('fecImport.import.successTitle', { defaultValue: 'Import réussi' })
                : t('fecImport.import.errorTitle', { defaultValue: 'Échec de l\'import' })}
            </AlertTitle>
            <AlertDescription>
              {importResult.success && importResult.summary ? (
                <div className="space-y-2">
                  <p>{t('fecImport.import.successDescription', { defaultValue: 'Les données ont été importées avec succès.' })}</p>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>Format: <strong>{importResult.summary.format}</strong></li>
                    <li>Standard: <strong>{importResult.summary.standard || 'Auto-détecté'}</strong></li>
                    <li>{importResult.summary.accountsCreated} comptes créés ({importResult.summary.accountsExisting} existants)</li>
                    <li>{importResult.summary.journalsCreated} journaux créés ({importResult.summary.journalsExisting} existants)</li>
                    <li>{importResult.summary.entriesCreated} écritures créées</li>
                    {importResult.summary.entriesWithErrors > 0 && (
                      <li className="text-amber-600">{importResult.summary.entriesWithErrors} écritures avec erreurs</li>
                    )}
                  </ul>
                </div>
              ) : (
                importResult.error
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={resetState} disabled={parsing || importing}>
          {t('fecImport.button.reset', { defaultValue: "Réinitialiser" })}
        </Button>
        {parseResult && !parsing && !importing && !importResult && parseResult.lines.length > 0 && (
          <Button onClick={handleImport}>
            {t('fecImport.button.startImport', { defaultValue: "Démarrer l'import" })}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
export default FECImport;