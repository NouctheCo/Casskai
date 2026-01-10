/**
 * Bouton pour générer et télécharger l'export FEC (Fichier des Écritures Comptables)
 * Conforme à la réglementation DGFiP française
 */
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { useToast } from '../ui/use-toast';
import { downloadFECFile, previewFECExport } from '../../services/fecExportService';
import { FileDown, Loader2, CheckCircle, AlertTriangle, FileText, Download } from 'lucide-react';
import { Card } from '../ui/card';
import { logger } from '@/lib/logger';
interface FECExportButtonProps {
  companyId: string;
  companyName?: string;
}
export const FECExportButton: React.FC<FECExportButtonProps> = ({
  companyId,
  companyName = 'Entreprise'
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{
    validation: {
      is_valid: boolean;
      total_lines: number;
      total_debit: number;
      total_credit: number;
      balance_difference: number;
      errors: Array<{ type: string; message: string }>;
    };
    preview: any[];
  } | null>(null);
  // Période par défaut : année fiscale en cours (1er janvier → 31 décembre)
  const getDefaultPeriod = () => {
    const now = new Date();
    const year = now.getFullYear();
    return {
      start: `${year}-01-01`,
      end: `${year}-12-31`
    };
  };
  const [period, setPeriod] = useState(getDefaultPeriod());
  const handlePreview = async () => {
    setLoading(true);
    try {
      const result = await previewFECExport(companyId, period.start, period.end, 10);
      setPreview(result);
    } catch (error) {
      logger.error('FECExportButton', 'Erreur aperçu FEC:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de générer l\'aperçu FEC',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const handleDownload = async () => {
    setLoading(true);
    try {
      await downloadFECFile(companyId, period.start, period.end, companyName);
      toast({
        title: '✓ Export FEC téléchargé',
        description: `Fichier généré avec ${preview?.validation.total_lines || 0} lignes`,
      });
      setOpen(false);
    } catch (error) {
      logger.error('FECExportButton', 'Erreur téléchargement FEC:', error);
      toast({
        title: 'Erreur export FEC',
        description: error instanceof Error ? error.message : 'Impossible de télécharger le fichier FEC',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
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
        <FileDown className="w-4 h-4" />
        Export FEC
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Export FEC (Fichier des Écritures Comptables)
            </DialogTitle>
            <DialogDescription>
              Génère un fichier FEC conforme à la réglementation DGFiP pour contrôle fiscal
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Sélection période */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fec-period-start">Début de période</Label>
                <Input
                  id="fec-period-start"
                  type="date"
                  value={period.start}
                  onChange={(e) => setPeriod({ ...period, start: e.target.value })}
                  onBlur={handlePreview}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fec-period-end">Fin de période</Label>
                <Input
                  id="fec-period-end"
                  type="date"
                  value={period.end}
                  onChange={(e) => setPeriod({ ...period, end: e.target.value })}
                  onBlur={handlePreview}
                />
              </div>
            </div>
            {/* Aperçu validation */}
            {loading && !preview && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            )}
            {preview && (
              <Card className={`p-6 ${
                preview.validation.is_valid
                  ? 'bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-green-200 dark:border-green-800'
                  : 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {preview.validation.is_valid ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          Export FEC valide
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          Export FEC invalide
                        </>
                      )}
                    </h3>
                    <Badge variant={preview.validation.is_valid ? 'default' : 'destructive'}>
                      {preview.validation.total_lines} écritures
                    </Badge>
                  </div>
                  {/* Statistiques */}
                  <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Débit</p>
                      <p className="text-lg font-bold text-blue-600">
                        {preview.validation.total_debit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Crédit</p>
                      <p className="text-lg font-bold text-green-600">
                        {preview.validation.total_credit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Différence</p>
                      <p className={`text-lg font-bold ${
                        Math.abs(preview.validation.balance_difference) < 0.01
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {preview.validation.balance_difference.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                      </p>
                    </div>
                  </div>
                  {/* Erreurs de validation */}
                  {preview.validation.errors && preview.validation.errors.length > 0 && (
                    <div className="pt-3 border-t space-y-2">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">Erreurs détectées :</p>
                      {preview.validation.errors.map((error, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-sm">
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-800 dark:text-red-200">{error.type}</p>
                            <p className="text-red-700 dark:text-red-300">{error.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Info si aucune écriture */}
                  {preview.validation.total_lines === 0 && (
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Aucune écriture trouvée</p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                          Aucune écriture comptable validée sur cette période. Vérifiez vos dates ou validez vos écritures.
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Aperçu premières lignes */}
                  {preview.preview && preview.preview.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-sm font-medium mb-2">Aperçu (10 premières lignes) :</p>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-xs font-mono overflow-x-auto">
                        <p className="text-gray-600 dark:text-gray-400 mb-1">
                          JournalCode | CompteNum | EcritureLib | Débit | Crédit
                        </p>
                        {preview.preview.slice(0, 5).map((line, index) => (
                          <p key={index} className="text-gray-800 dark:text-gray-200">
                            {line.journalcode} | {line.comptenum} | {line.ecriturelib?.substring(0, 30)}... | {line.debit} | {line.credit}
                          </p>
                        ))}
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                          ... ({preview.validation.total_lines - 5} lignes supplémentaires)
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
              onClick={handleDownload}
              disabled={loading || !preview || !preview.validation.is_valid}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Télécharger FEC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};