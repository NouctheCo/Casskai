/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Download, CheckCircle, Circle, Calendar } from 'lucide-react';
import assetsService from '@/services/assetsService';
import type { Asset, AssetDepreciationScheduleLine } from '@/types/assets.types';
import { formatCurrency } from '@/lib/utils';
import { logger } from '@/lib/logger';
interface DepreciationScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  assetId: string;
}
export const DepreciationScheduleDialog: React.FC<DepreciationScheduleDialogProps> = ({
  open,
  onClose,
  assetId,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [schedule, setSchedule] = useState<AssetDepreciationScheduleLine[]>([]);
  useEffect(() => {
    if (open && assetId) {
      loadSchedule();
    }
  }, [open, assetId]);
  const loadSchedule = async () => {
    setLoading(true);
    try {
      const [assetData, scheduleData] = await Promise.all([
        assetsService.getAssetById(assetId),
        assetsService.getDepreciationSchedule(assetId),
      ]);
      setAsset(assetData);
      setSchedule(scheduleData);
    } catch (error: any) {
      logger.error('DepreciationScheduleDialog', 'Error loading schedule:', error);
      toast.error(t('assets.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };
  const handleExportCSV = () => {
    if (!asset || schedule.length === 0) return;
    // Préparer les données CSV
    const headers = [
      'Exercice',
      'Période',
      'Date début',
      'Date fin',
      'VNC début',
      'Dotation',
      'Amortissements cumulés',
      'VNC fin',
      'Prorata (jours)',
      'Statut'
    ].join(';');
    const rows = schedule.map(line => [
      line.fiscal_year,
      line.period_number,
      new Date(line.period_start_date).toLocaleDateString('fr-FR'),
      new Date(line.period_end_date).toLocaleDateString('fr-FR'),
      line.opening_net_book_value.toFixed(2),
      line.depreciation_amount.toFixed(2),
      line.cumulative_depreciation.toFixed(2),
      line.closing_net_book_value.toFixed(2),
      line.prorata_days || '-',
      line.is_posted ? 'Passée' : 'En attente'
    ].join(';'));
    const csv = [headers, ...rows].join('\n');
    // Télécharger le fichier
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `amortissement_${asset.asset_number || asset.id}_${Date.now()}.csv`;
    link.click();
    toast.success(t('assets.schedule.exportSuccess'));
  };
  const getTotalDepreciation = () => {
    return schedule.reduce((sum, line) => sum + line.depreciation_amount, 0);
  };
  const getPostedCount = () => {
    return schedule.filter(line => line.is_posted).length;
  };
  if (loading || !asset) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>{t('assets.schedule.title')} - {asset.name}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={schedule.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              {t('assets.schedule.export')}
            </Button>
          </DialogTitle>
        </DialogHeader>
        {/* Résumé */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('assets.schedule.totalPeriods')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schedule.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('assets.schedule.totalDepreciation')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(getTotalDepreciation(), 'EUR')}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('assets.schedule.postedEntries')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {getPostedCount()} / {schedule.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('assets.schedule.remainingValue')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(asset.net_book_value, 'EUR')}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Tableau du plan */}
        {schedule.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{t('assets.schedule.noData')}</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">{t('assets.schedule.year')}</TableHead>
                  <TableHead className="w-20">{t('assets.schedule.period')}</TableHead>
                  <TableHead>{t('assets.schedule.startDate')}</TableHead>
                  <TableHead>{t('assets.schedule.endDate')}</TableHead>
                  <TableHead className="text-right">{t('assets.schedule.openingNBV')}</TableHead>
                  <TableHead className="text-right">{t('assets.schedule.depreciation')}</TableHead>
                  <TableHead className="text-right">{t('assets.schedule.cumulative')}</TableHead>
                  <TableHead className="text-right">{t('assets.schedule.closingNBV')}</TableHead>
                  <TableHead className="text-center">{t('assets.schedule.prorata')}</TableHead>
                  <TableHead className="text-center">{t('assets.schedule.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.map((line) => (
                  <TableRow key={line.id} className={line.is_posted ? 'bg-green-50 dark:bg-green-950/10' : ''}>
                    <TableCell className="font-medium">{line.fiscal_year}</TableCell>
                    <TableCell>{line.period_number}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(line.period_start_date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(line.period_end_date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(line.opening_net_book_value, 'EUR')}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium text-orange-600">
                      {formatCurrency(line.depreciation_amount, 'EUR')}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(line.cumulative_depreciation, 'EUR')}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium">
                      {formatCurrency(line.closing_net_book_value, 'EUR')}
                    </TableCell>
                    <TableCell className="text-center">
                      {line.prorata_days ? (
                        <Badge variant="outline" className="text-xs">
                          {line.prorata_days}j
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {line.is_posted ? (
                        <div className="flex items-center justify-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs">{t('assets.schedule.posted')}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1 text-muted-foreground">
                          <Circle className="w-4 h-4" />
                          <span className="text-xs">{t('assets.schedule.pending')}</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Ligne de total */}
                <TableRow className="bg-gray-100 dark:bg-gray-800 font-bold">
                  <TableCell colSpan={5} className="text-right">
                    {t('assets.schedule.total')}
                  </TableCell>
                  <TableCell className="text-right font-mono text-orange-600">
                    {formatCurrency(getTotalDepreciation(), 'EUR')}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(schedule[schedule.length - 1]?.cumulative_depreciation || 0, 'EUR')}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(schedule[schedule.length - 1]?.closing_net_book_value || 0, 'EUR')}
                  </TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
        {/* Légende */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground border-t pt-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>{t('assets.schedule.postedLegend')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="w-4 h-4" />
            <span>{t('assets.schedule.pendingLegend')}</span>
          </div>
          {schedule.some(l => l.prorata_days) && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">j</Badge>
              <span>{t('assets.schedule.prorataLegend')}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};