/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */
import React, { useState } from 'react';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import assetsService from '@/services/assetsService';
import { logger } from '@/lib/logger';
interface GenerateEntriesDialogProps {
  open: boolean;
  onClose: () => void;
}
export const GenerateEntriesDialog: React.FC<GenerateEntriesDialogProps> = ({
  open,
  onClose,
}) => {
  const { t } = useTranslation();
  const { currentCompany } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [periodNumber, setPeriodNumber] = useState<number | undefined>(undefined);
  const [result, setResult] = useState<any>(null);
  const handleGenerate = async () => {
    if (!currentCompany?.id) {
      toast.error(t('common.errors.noCompany'));
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const response = await assetsService.generateDepreciationEntries(
        currentCompany.id,
        fiscalYear,
        periodNumber
      );
      setResult(response);
      if (response.success) {
        toast.success(
          t('assets.entries.success', {
            count: response.entries_created,
            amount: response.total_amount.toFixed(2)
          })
        );
      } else {
        toast.warning(t('assets.entries.partialSuccess'));
      }
    } catch (error: any) {
      logger.error('GenerateEntriesDialog', 'Error generating entries:', error);
      toast.error(error.message || t('assets.errors.generateFailed'));
    } finally {
      setLoading(false);
    }
  };
  const handleClose = () => {
    setResult(null);
    setPeriodNumber(undefined);
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t('assets.actions.generateEntries')}
          </DialogTitle>
          <DialogDescription>
            {t('assets.entries.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Formulaire de sélection */}
          {!result && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fiscal_year">
                    {t('assets.entries.fiscalYear')} *
                  </Label>
                  <Input
                    id="fiscal_year"
                    type="number"
                    min="2000"
                    max="2100"
                    value={fiscalYear}
                    onChange={(e) => setFiscalYear(parseInt(e.target.value) || new Date().getFullYear())}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period">
                    {t('assets.entries.period')}
                  </Label>
                  <Input
                    id="period"
                    type="number"
                    min="1"
                    max="12"
                    value={periodNumber || ''}
                    onChange={(e) => setPeriodNumber(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder={t('assets.entries.allPeriods')}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('assets.entries.periodHint')}
                  </p>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t('assets.entries.warning')}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
          {/* Résultat */}
          {result && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  )}
                  <h3 className="font-semibold text-lg">
                    {result.success ? t('assets.entries.successTitle') : t('assets.entries.partialTitle')}
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('assets.entries.entriesCreated')}</p>
                    <p className="text-2xl font-bold">{result.entries_created}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('assets.entries.totalAmount')}</p>
                    <p className="text-2xl font-bold"><CurrencyAmount amount={result.total_amount} /></p>
                  </div>
                </div>
                {result.errors && result.errors.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-medium text-red-600">
                      {t('assets.entries.errors')} ({result.errors.length})
                    </p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {result.errors.map((err: any, index: number) => (
                        <div key={index} className="text-sm p-2 bg-red-50 dark:bg-red-950/20 rounded">
                          <p className="font-medium">{err.asset_name}</p>
                          <p className="text-xs text-red-600">{err.error_message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="text-sm text-muted-foreground border-t pt-4">
                  <p>
                    {t('assets.entries.period')}: {result.period_start} → {result.period_end}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              {result ? t('common.close') : t('common.cancel')}
            </Button>
            {!result && (
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('assets.entries.generating')}
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    {t('assets.actions.generate')}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
