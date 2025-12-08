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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Edit, Trash2, Calendar, Upload, FileText, History, XCircle, AlertCircle } from 'lucide-react';
import assetsService from '@/services/assetsService';
import type { Asset, AssetDepreciationScheduleLine, AssetDisposalFormData, DisposalMethod } from '@/types/assets.types';
import { formatCurrency } from '@/lib/utils';

interface AssetDetailDialogProps {
  open: boolean;
  onClose: () => void;
  assetId: string;
}

export const AssetDetailDialog: React.FC<AssetDetailDialogProps> = ({
  open,
  onClose,
  assetId,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [schedule, setSchedule] = useState<AssetDepreciationScheduleLine[]>([]);
  const [activeTab, setActiveTab] = useState('details');
  const [showDisposalForm, setShowDisposalForm] = useState(false);
  const [disposalData, setDisposalData] = useState<AssetDisposalFormData>({
    disposal_date: new Date().toISOString().split('T')[0],
    disposal_value: 0,
    disposal_method: 'sale',
    notes: '',
  });

  useEffect(() => {
    if (open && assetId) {
      loadAssetDetails();
    }
  }, [open, assetId]);

  const loadAssetDetails = async () => {
    setLoading(true);
    try {
      const [assetData, scheduleData] = await Promise.all([
        assetsService.getAssetById(assetId),
        assetsService.getDepreciationSchedule(assetId),
      ]);
      setAsset(assetData);
      setSchedule(scheduleData);
    } catch (error: any) {
      console.error('Error loading asset details:', error);
      toast.error(t('assets.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDispose = async () => {
    if (!asset) return;

    if (!confirm(t('assets.disposal.confirm'))) return;

    setLoading(true);
    try {
      await assetsService.disposeAsset(asset.id, disposalData);
      toast.success(t('assets.disposal.success'));
      onClose();
    } catch (error: any) {
      console.error('Error disposing asset:', error);
      toast.error(error.message || t('assets.errors.disposeFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // TODO: Implement file upload to Supabase Storage
    toast.info(t('assets.attachments.uploadingFiles', { count: files.length }));

    // Simuler l'upload pour la démo
    setTimeout(() => {
      toast.success(t('assets.attachments.uploadSuccess'));
      loadAssetDetails(); // Recharger pour afficher les nouveaux fichiers
    }, 1500);
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

  // Calculer plus/moins-value si cession
  const calculateDisposalGain = () => {
    return disposalData.disposal_value - asset.net_book_value;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{asset.name}</span>
            <div className="flex gap-2">
              {asset.status === 'active' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDisposalForm(!showDisposalForm)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {t('assets.actions.dispose')}
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">{t('assets.detail.tabs.details')}</TabsTrigger>
            <TabsTrigger value="attachments">{t('assets.detail.tabs.attachments')}</TabsTrigger>
            <TabsTrigger value="depreciation">{t('assets.detail.tabs.depreciation')}</TabsTrigger>
            <TabsTrigger value="history">{t('assets.detail.tabs.history')}</TabsTrigger>
          </TabsList>

          {/* Onglet Détails */}
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('assets.detail.generalInfo')}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('assets.form.assetNumber')}</p>
                    <p className="font-medium">{asset.asset_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('assets.table.status')}</p>
                    <Badge>{t(`assets.status.${asset.status}`)}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('assets.form.acquisitionDate')}</p>
                    <p className="font-medium">{new Date(asset.acquisition_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('assets.form.depreciationStartDate')}</p>
                    <p className="font-medium">{new Date(asset.depreciation_start_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('assets.form.location')}</p>
                    <p className="font-medium">{asset.location || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('assets.form.serialNumber')}</p>
                    <p className="font-medium">{asset.serial_number || '-'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('assets.detail.financial')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('assets.form.acquisitionValue')}</span>
                    <span className="font-medium">{formatCurrency(asset.acquisition_value, 'EUR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('assets.kpi.depreciation')}</span>
                    <span className="font-medium text-orange-600">{formatCurrency(asset.total_depreciation, 'EUR')}</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="font-medium">{t('assets.table.netBookValue')}</span>
                    <span className="font-bold text-green-600">{formatCurrency(asset.net_book_value, 'EUR')}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {asset.description && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('assets.form.description')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{asset.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Formulaire de cession */}
            {showDisposalForm && (
              <Card className="border-orange-500">
                <CardHeader>
                  <CardTitle className="text-orange-600 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {t('assets.disposal.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      {t('assets.disposal.description')}
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('assets.disposal.date')} *</Label>
                      <Input
                        type="date"
                        value={disposalData.disposal_date}
                        onChange={(e) => setDisposalData({ ...disposalData, disposal_date: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t('assets.disposal.method')} *</Label>
                      <Select
                        value={disposalData.disposal_method}
                        onValueChange={(value) => setDisposalData({ ...disposalData, disposal_method: value as DisposalMethod })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sale">{t('assets.disposal.methods.sale')}</SelectItem>
                          <SelectItem value="scrap">{t('assets.disposal.methods.scrap')}</SelectItem>
                          <SelectItem value="donation">{t('assets.disposal.methods.donation')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('assets.disposal.value')} (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={disposalData.disposal_value}
                        onChange={(e) => setDisposalData({ ...disposalData, disposal_value: parseFloat(e.target.value) || 0 })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t('assets.disposal.gain')}</Label>
                      <div className={`p-2 rounded border ${calculateDisposalGain() >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {formatCurrency(calculateDisposalGain(), 'EUR')}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('assets.form.notes')}</Label>
                    <Textarea
                      value={disposalData.notes}
                      onChange={(e) => setDisposalData({ ...disposalData, notes: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowDisposalForm(false)}>
                      {t('common.cancel')}
                    </Button>
                    <Button variant="destructive" onClick={handleDispose} disabled={loading}>
                      {loading ? t('common.saving') : t('assets.disposal.confirm')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Onglet Documents */}
          <TabsContent value="attachments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('assets.attachments.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Zone d'upload */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                          {t('assets.attachments.upload')}
                        </span>
                        <input
                          id="file-upload"
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        {t('assets.attachments.acceptedFormats')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Liste des fichiers */}
                {asset.attachments && asset.attachments.length > 0 ? (
                  <div className="space-y-2">
                    {asset.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/30 rounded">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="font-medium">{attachment.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(attachment.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            {t('common.download')}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t('assets.attachments.empty')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Amortissement */}
          <TabsContent value="depreciation">
            <Card>
              <CardHeader>
                <CardTitle>{t('assets.schedule.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {schedule.length} {t('assets.schedule.periods')}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('assets.schedule.viewFullSchedule')}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Historique */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  {t('assets.detail.history')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                    <div className="flex-1">
                      <p className="font-medium">{t('assets.history.created')}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(asset.created_at).toLocaleDateString()} - {new Date(asset.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-600 mt-2"></div>
                    <div className="flex-1">
                      <p className="font-medium">{t('assets.history.lastUpdate')}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(asset.updated_at).toLocaleDateString()} - {new Date(asset.updated_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {asset.last_depreciation_date && (
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-orange-600 mt-2"></div>
                      <div className="flex-1">
                        <p className="font-medium">{t('assets.history.lastDepreciation')}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(asset.last_depreciation_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
