import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { rfaImportsService, type RFAImportType } from '@/services/rfa/rfaImportsService';
import { Download, Upload, AlertTriangle } from 'lucide-react';

type Props = {
  companyId: string;
};

export const RFAImportsPanel: React.FC<Props> = ({ companyId }) => {
  const { t } = useTranslation();
  const [importType, setImportType] = useState<RFAImportType>('product_groups');
  const [file, setFile] = useState<File | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastImportId, setLastImportId] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<{ success: number; errors: number; warnings: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const template = useMemo(() => {
    if (importType === 'product_groups') return { name: 'rfa_product_groups_template.csv', text: rfaImportsService.templates.product_groups_csv() };
    if (importType === 'product_group_items') return { name: 'rfa_product_group_items_template.csv', text: rfaImportsService.templates.product_group_items_csv() };
    if (importType === 'turnover_data') return { name: 'rfa_turnover_data_template.csv', text: rfaImportsService.templates.turnover_data_csv() };
    return { name: 'rfa_template.csv', text: 'not-supported' };
  }, [importType]);

  const onDownload = async () => {
    await rfaImportsService.downloadTemplate(template.text, template.name);
  };

  const onRun = async () => {
    setError(null);
    setResultSummary(null);
    setLastImportId(null);

    if (!file) {
      setError(t('contracts.rfaAdvanced.imports.selectFileError', 'Sélectionne un fichier CSV avant de lancer l’import.'));
      return;
    }

    setRunning(true);
    setProgress(10);

    try {
      const { importId, details } = await rfaImportsService.runImport({ companyId, importType, file });
      setLastImportId(importId);

      const success = details.filter(d => d.status === 'success').length;
      const errors = details.filter(d => d.status === 'error').length;
      const warnings = details.filter(d => d.status === 'warning').length;
      const skipped = details.filter(d => d.status === 'skipped').length;
      setResultSummary({ success, errors, warnings, skipped });
      setProgress(100);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de l’import');
      setProgress(100);
    } finally {
      setRunning(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('contracts.rfaAdvanced.imports.title', 'Imports RFA (CSV)')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-sm font-medium">{t('contracts.rfaAdvanced.imports.importTypeLabel', 'Type d’import')}</div>
              <Select value={importType} onValueChange={(v) => setImportType(v as RFAImportType)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('contracts.rfaAdvanced.imports.choosePlaceholder', 'Choisir')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product_groups">{t('contracts.rfaAdvanced.imports.types.product_groups', 'Groupes produits')}</SelectItem>
                  <SelectItem value="product_group_items">{t('contracts.rfaAdvanced.imports.types.product_group_items', 'Produits → Groupes')}</SelectItem>
                  <SelectItem value="turnover_data">{t('contracts.rfaAdvanced.imports.types.turnover_data', 'CA (turnover) importé')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="rfa-import-csv" className="text-sm font-medium">
                {t('contracts.rfaAdvanced.imports.fileLabel', 'Fichier CSV')}
              </label>
              <input
                id="rfa-import-csv"
                type="file"
                accept=".csv,text/csv"
                disabled={running}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onDownload} disabled={running}>
              <Download className="h-4 w-4 mr-2" />
              {t('contracts.rfaAdvanced.imports.downloadTemplate', 'Télécharger le template')}
            </Button>
            <Button onClick={onRun} disabled={running || !file}>
              <Upload className="h-4 w-4 mr-2" />
              {t('contracts.rfaAdvanced.imports.runImport', 'Lancer l’import')}
            </Button>
          </div>

          {running && (
            <div className="space-y-2">
              <Progress value={progress} />
              <div className="text-xs text-muted-foreground">{t('contracts.rfaAdvanced.imports.running', 'Import en cours…')}</div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t('contracts.rfaAdvanced.imports.failedTitle', 'Import échoué')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {resultSummary && (
            <Alert>
              <AlertTitle>{t('contracts.rfaAdvanced.imports.finishedTitle', 'Import terminé')}</AlertTitle>
              <AlertDescription>
                {t('contracts.rfaAdvanced.imports.summary', 'Succès: {{success}} — Erreurs: {{errors}} — Warnings: {{warnings}} — Skipped: {{skipped}}', {
                  success: resultSummary.success,
                  errors: resultSummary.errors,
                  warnings: resultSummary.warnings,
                  skipped: resultSummary.skipped
                })}
                {lastImportId ? (
                  <div className="text-xs text-muted-foreground mt-1">
                    {t('contracts.rfaAdvanced.imports.importId', 'Import ID: {{id}}', { id: lastImportId })}
                  </div>
                ) : null}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
