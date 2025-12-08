/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

import { useState, useEffect } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { exportAccountingFile, downloadExportFile, type FecExportResult } from '@/utils/fecExporter';

interface ExportFecModalProps {
  open: boolean;
  onClose: () => void;
}

export const ExportFecModal: React.FC<ExportFecModalProps> = ({ open, onClose }) => {
  const { t } = useLocale();
  const { currentCompany } = useAuth();

  const currentYear = new Date().getFullYear();

  // État du formulaire
  const [fiscalYear, setFiscalYear] = useState(currentYear - 1);
  const [startDate, setStartDate] = useState(`${currentYear - 1}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear - 1}-12-31`);
  const [format, setFormat] = useState<'FEC' | 'SYSCOHADA' | 'IFRS' | 'SCF' | 'CSV'>('FEC');
  const [includeUnvalidated, setIncludeUnvalidated] = useState(false);
  const [encoding, setEncoding] = useState<'UTF-8' | 'ISO-8859-1'>('UTF-8');

  // État de l'export
  const [isExporting, setIsExporting] = useState(false);
  const [result, setResult] = useState<FecExportResult | null>(null);

  // Mettre à jour les dates quand l'année change
  const handleYearChange = (year: number) => {
    setFiscalYear(year);
    setStartDate(`${year}-01-01`);
    setEndDate(`${year}-12-31`);
  };

  // Format par défaut selon le standard comptable de l'entreprise
  useEffect(() => {
    if (currentCompany?.accounting_standard) {
      switch (currentCompany.accounting_standard) {
        case 'PCG':
          setFormat('FEC');
          break;
        case 'SYSCOHADA':
          setFormat('SYSCOHADA');
          break;
        case 'IFRS':
          setFormat('IFRS');
          break;
        case 'SCF':
          setFormat('SCF');
          break;
        default:
          setFormat('CSV');
      }
    }
  }, [currentCompany]);

  // Reset quand on ferme
  useEffect(() => {
    if (!open) {
      setResult(null);
    }
  }, [open]);

  // Lancer l'export
  const handleExport = async () => {
    if (!currentCompany?.id) return;

    setIsExporting(true);
    setResult(null);

    try {
      const exportResult = await exportAccountingFile({
        companyId: currentCompany.id,
        fiscalYear,
        startDate,
        endDate,
        format,
        includeUnvalidated,
        separator: format === 'FEC' || format === 'SCF' ? '|' : format === 'IFRS' || format === 'CSV' ? ',' : ';',
        decimalSeparator: format === 'IFRS' || format === 'CSV' ? '.' : ',',
        encoding,
      });

      setResult(exportResult);

      if (exportResult.success) {
        downloadExportFile(exportResult, encoding);
      }
    } catch (error) {
      setResult({
        success: false,
        content: '',
        filename: '',
        stats: {
          totalEntries: 0,
          totalLines: 0,
          totalDebit: 0,
          totalCredit: 0,
          balance: 0,
          journals: [],
          period: { start: startDate, end: endDate },
        },
        errors: [error instanceof Error ? error.message : 'Erreur inconnue'],
        warnings: [],
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Retélécharger
  const handleRedownload = () => {
    if (result?.success) {
      downloadExportFile(result, encoding);
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('accounting.export.title', { defaultValue: 'Export comptable' })}
          </DialogTitle>
          <DialogDescription>
            {t('accounting.export.description', {
              defaultValue: 'Générer un fichier d\'export de vos écritures comptables (FEC, SYSCOHADA, etc.)'
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Exercice fiscal */}
          <div className="space-y-2">
            <Label>{t('accounting.export.fiscal_year', { defaultValue: 'Exercice fiscal' })}</Label>
            <Select
              value={String(fiscalYear)}
              onValueChange={(v) => handleYearChange(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[...Array(6)].map((_, i) => {
                  const year = currentYear - i;
                  return (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Période personnalisée */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('accounting.export.start_date', { defaultValue: 'Date début' })}</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('accounting.export.end_date', { defaultValue: 'Date fin' })}</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Format d'export */}
          <div className="space-y-2">
            <Label>{t('accounting.export.format', { defaultValue: 'Format d\'export' })}</Label>
            <Select value={format} onValueChange={(v: any) => setFormat(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FEC">🇫🇷 FEC (France - PCG)</SelectItem>
                <SelectItem value="SYSCOHADA">🌍 SYSCOHADA (Afrique OHADA)</SelectItem>
                <SelectItem value="SCF">🇲🇦 SCF (Maghreb)</SelectItem>
                <SelectItem value="IFRS">🌐 IFRS (International)</SelectItem>
                <SelectItem value="CSV">📊 CSV générique</SelectItem>
              </SelectContent>
            </Select>

            {/* Info format */}
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-3 pb-3">
                <div className="text-sm space-y-1">
                  {format === 'FEC' && (
                    <>
                      <p className="font-semibold text-blue-900 dark:text-blue-100">
                        Format FEC (Fichier des Écritures Comptables)
                      </p>
                      <p className="text-blue-700 dark:text-blue-300">
                        Format officiel DGFiP • 18 colonnes • Séparateur: | • Décimale: ,
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        Nom: SIRENFEC{endDate.replace(/-/g, '')}.txt
                      </p>
                    </>
                  )}
                  {format === 'SYSCOHADA' && (
                    <>
                      <p className="font-semibold text-blue-900 dark:text-blue-100">
                        Format SYSCOHADA (OHADA)
                      </p>
                      <p className="text-blue-700 dark:text-blue-300">
                        Afrique francophone • FCFA • Séparateur: ; • Décimale: ,
                      </p>
                    </>
                  )}
                  {format === 'SCF' && (
                    <>
                      <p className="font-semibold text-blue-900 dark:text-blue-100">
                        Format SCF (Système Comptable Financier)
                      </p>
                      <p className="text-blue-700 dark:text-blue-300">
                        Maghreb (Maroc, Algérie, Tunisie) • Séparateur: | • Décimale: ,
                      </p>
                    </>
                  )}
                  {format === 'IFRS' && (
                    <>
                      <p className="font-semibold text-blue-900 dark:text-blue-100">
                        Format IFRS (International)
                      </p>
                      <p className="text-blue-700 dark:text-blue-300">
                        Standards internationaux • Séparateur: , • Décimale: .
                      </p>
                    </>
                  )}
                  {format === 'CSV' && (
                    <>
                      <p className="font-semibold text-blue-900 dark:text-blue-100">
                        Format CSV générique
                      </p>
                      <p className="text-blue-700 dark:text-blue-300">
                        Compatible Excel • Séparateur: , • Décimale: .
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Encodage */}
          <div className="space-y-2">
            <Label>{t('accounting.export.encoding', { defaultValue: 'Encodage' })}</Label>
            <Select value={encoding} onValueChange={(v: any) => setEncoding(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTF-8">UTF-8 (recommandé)</SelectItem>
                <SelectItem value="ISO-8859-1">ISO-8859-1 (anciens logiciels)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Option écritures non validées */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeUnvalidated"
              checked={includeUnvalidated}
              onCheckedChange={(checked) => setIncludeUnvalidated(checked as boolean)}
            />
            <Label htmlFor="includeUnvalidated" className="text-sm cursor-pointer">
              {t('accounting.export.include_unvalidated', { defaultValue: 'Inclure les écritures non validées' })}
            </Label>
          </div>

          {/* Résultat de l'export */}
          {result && (
            <div className="space-y-3">
              {result.success ? (
                <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <div className="space-y-3">
                      <div>
                        <div className="font-semibold mb-1">✅ Export réussi</div>
                        <Badge variant="outline" className="text-xs">{result.filename}</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <Card>
                          <CardContent className="pt-3 pb-3">
                            <div className="text-muted-foreground text-xs">Écritures</div>
                            <div className="font-bold text-lg">{result.stats.totalEntries}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-3 pb-3">
                            <div className="text-muted-foreground text-xs">Lignes</div>
                            <div className="font-bold text-lg">{result.stats.totalLines}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-3 pb-3">
                            <div className="text-muted-foreground text-xs">Total Débit</div>
                            <div className="font-semibold">{formatNumber(result.stats.totalDebit)}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-3 pb-3">
                            <div className="text-muted-foreground text-xs">Total Crédit</div>
                            <div className="font-semibold">{formatNumber(result.stats.totalCredit)}</div>
                          </CardContent>
                        </Card>
                      </div>

                      {result.stats.journals.length > 0 && (
                        <div>
                          <div className="text-xs font-medium mb-1">Journaux exportés ({result.stats.journals.length})</div>
                          <div className="flex flex-wrap gap-1">
                            {result.stats.journals.map((j) => (
                              <Badge key={j} variant="secondary" className="text-xs">{j}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {Math.abs(result.stats.balance) > 0.01 && (
                        <Alert variant="warning" className="mt-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            ⚠️ Déséquilibre détecté: {formatNumber(result.stats.balance)}
                          </AlertDescription>
                        </Alert>
                      )}

                      {result.warnings.length > 0 && (
                        <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                          {result.warnings.map((w, i) => (
                            <div key={i}>{w}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {result.errors.map((e, i) => (
                      <div key={i}>{e}</div>
                    ))}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            {t('common.close', { defaultValue: 'Fermer' })}
          </Button>

          {result?.success && (
            <Button variant="secondary" onClick={handleRedownload}>
              <Download className="h-4 w-4 mr-2" />
              {t('accounting.export.redownload', { defaultValue: 'Retélécharger' })}
            </Button>
          )}

          <Button onClick={handleExport} disabled={isExporting || !currentCompany}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('accounting.export.exporting', { defaultValue: 'Export en cours...' })}
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                {t('accounting.export.generate', { defaultValue: 'Générer l\'export' })}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportFecModal;
