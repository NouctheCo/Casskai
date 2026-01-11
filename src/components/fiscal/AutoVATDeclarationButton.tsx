/**
 * Bouton pour générer automatiquement une déclaration TVA depuis les écritures comptables
 */
import React, { useState } from 'react';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { Button } from '../ui/button';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { Input } from '../ui/input';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { Label } from '../ui/label';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { Badge } from '../ui/badge';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { useToast } from '../ui/use-toast';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { createVATDeclaration, previewVATAmount } from '../../services/vatDeclarationService';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { Sparkles, Loader2, CheckCircle, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { Card } from '../ui/card';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { logger } from '@/lib/logger';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
interface AutoVATDeclarationButtonProps {
  companyId: string;
  onSuccess?: () => void;
}
export const AutoVATDeclarationButton: React.FC<AutoVATDeclarationButtonProps> = ({
  companyId,
  onSuccess
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{
    collected: number;
    deductible: number;
    toPay: number;
  } | null>(null);
  // Calcul automatique du trimestre en cours (défaut : trimestre précédent)
  const getDefaultPeriod = () => {
    const now = new Date();
    const quarter = Math.floor((now.getMonth()) / 3); // Trimestre précédent
    const year = quarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const actualQuarter = quarter === 0 ? 4 : quarter;
    const startMonth = (actualQuarter - 1) * 3 + 1;
    const endMonth = actualQuarter * 3;
    return {
      start: `${year}-${String(startMonth).padStart(2, '0')}-01`,
      end: `${year}-${String(endMonth).padStart(2, '0')}-${new Date(year, endMonth, 0).getDate()}`
    };
  };
  const [period, setPeriod] = useState(getDefaultPeriod());
  const handlePreview = async () => {
    setLoading(true);
    try {
      const result = await previewVATAmount(companyId, period.start, period.end);
      setPreview(result);
    } catch (error) {
      logger.error('AutoVATDeclarationButton', 'Erreur aperçu TVA:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de calculer l\'aperçu TVA',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await createVATDeclaration(
        companyId,
        period.start,
        period.end,
        'CA3'
      );
      toast({
        title: '✓ Déclaration TVA créée',
        description: `Montant à payer: $<CurrencyAmount amount={result.data.vat_to_pay} />`,
      });
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      logger.error('AutoVATDeclarationButton', 'Erreur génération déclaration TVA:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de générer la déclaration TVA',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  // Ouvrir le dialog et charger l'aperçu automatiquement
  const handleOpen = () => {
    setOpen(true);
    handlePreview();
  };
  return (
    <>
      <Button
        onClick={handleOpen}
        variant="outline"
        className="gap-2"
      >
        <Sparkles className="w-4 h-4" />
        Générer TVA auto
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Générer une déclaration TVA automatiquement
            </DialogTitle>
            <DialogDescription>
              Calcule automatiquement votre TVA depuis vos écritures comptables (comptes 44571 et 44566)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Sélection période */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="period-start">Début de période</Label>
                <Input
                  id="period-start"
                  type="date"
                  value={period.start}
                  onChange={(e) => setPeriod({ ...period, start: e.target.value })}
                  onBlur={handlePreview}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="period-end">Fin de période</Label>
                <Input
                  id="period-end"
                  type="date"
                  value={period.end}
                  onChange={(e) => setPeriod({ ...period, end: e.target.value })}
                  onBlur={handlePreview}
                />
              </div>
            </div>
            {/* Aperçu calculs */}
            {loading && !preview && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            )}
            {preview && (
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Aperçu de la déclaration
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {/* TVA collectée */}
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">TVA collectée</p>
                      <p className="text-2xl font-bold text-green-600 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        <CurrencyAmount amount={preview.collected} />
                      </p>
                    </div>
                    {/* TVA déductible */}
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">TVA déductible</p>
                      <p className="text-2xl font-bold text-orange-600 flex items-center gap-1">
                        <TrendingDown className="w-4 h-4" />
                        <CurrencyAmount amount={preview.deductible} />
                      </p>
                    </div>
                    {/* À payer */}
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">À payer</p>
                      <p className={`text-2xl font-bold ${
                        preview.toPay > 0
                          ? 'text-red-600'
                          : preview.toPay < 0
                          ? 'text-blue-600'
                          : 'text-gray-600'
                      }`}>
                        <CurrencyAmount amount={preview.toPay} />
                      </p>
                    </div>
                  </div>
                  {/* Statut */}
                  <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
                    <Badge variant={preview.toPay > 0 ? 'destructive' : preview.toPay < 0 ? 'default' : 'secondary'}>
                      {preview.toPay > 0 && '⚠ TVA à payer'}
                      {preview.toPay < 0 && '💰 Crédit de TVA'}
                      {preview.toPay === 0 && '✓ Équilibré'}
                    </Badge>
                  </div>
                  {preview.toPay === 0 && preview.collected === 0 && (
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Aucune TVA détectée</p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                          Aucune écriture comptable avec TVA trouvée sur cette période. Vérifiez que vos factures ont bien généré leurs écritures comptables.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Annuler
            </Button>
            <Button onClick={handlePreview} variant="secondary" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Recalculer'}
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={loading || !preview}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Créer la déclaration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
