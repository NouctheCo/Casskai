/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import assetsService from '@/services/assetsService';
import type { AssetCategory, AssetCategoryFormData, DepreciationMethod } from '@/types/assets.types';

interface CategoryManagementDialogProps {
  open: boolean;
  onClose: () => void;
}

export const CategoryManagementDialog: React.FC<CategoryManagementDialogProps> = ({
  open,
  onClose,
}) => {
  const { t } = useTranslation();
  const { currentCompany } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState<AssetCategoryFormData>({
    name: '',
    code: '',
    description: '',
    account_asset: '',
    account_depreciation: '',
    account_expense: '',
    default_depreciation_method: 'linear',
    default_duration_years: 5,
    default_declining_rate: undefined,
    default_residual_value: 0,
  });

  useEffect(() => {
    if (open && currentCompany?.id) {
      loadCategories();
    }
  }, [open, currentCompany?.id]);

  const loadCategories = async () => {
    if (!currentCompany?.id) return;

    setLoading(true);
    try {
      const data = await assetsService.getAssetCategories(currentCompany.id);
      setCategories(data);
    } catch (error: any) {
      console.error('Error loading categories:', error);
      toast.error(t('assets.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      account_asset: '',
      account_depreciation: '',
      account_expense: '',
      default_depreciation_method: 'linear',
      default_duration_years: 5,
      default_declining_rate: undefined,
      default_residual_value: 0,
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleEdit = (category: AssetCategory) => {
    setFormData({
      name: category.name,
      code: category.code || '',
      description: category.description || '',
      account_asset: category.account_asset || '',
      account_depreciation: category.account_depreciation || '',
      account_expense: category.account_expense || '',
      default_depreciation_method: category.default_depreciation_method,
      default_duration_years: category.default_duration_years,
      default_declining_rate: category.default_declining_rate,
      default_residual_value: category.default_residual_value || 0,
    });
    setEditingId(category.id);
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentCompany?.id) {
      toast.error(t('common.errors.noCompany'));
      return;
    }

    if (!formData.name.trim()) {
      toast.error(t('assets.categories.errors.nameRequired'));
      return;
    }

    setLoading(true);

    try {
      if (editingId) {
        await assetsService.updateAssetCategory(editingId, formData);
        toast.success(t('assets.categories.success.updated'));
      } else {
        await assetsService.createAssetCategory(currentCompany.id, formData);
        toast.success(t('assets.categories.success.created'));
      }

      await loadCategories();
      resetForm();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error(error.message || t('assets.errors.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm(t('assets.categories.confirmDelete'))) return;

    setLoading(true);
    try {
      await assetsService.deleteAssetCategory(categoryId);
      toast.success(t('assets.categories.success.deleted'));
      await loadCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(error.message || t('assets.errors.deleteFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('assets.categories.manage')}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Liste des catégories */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('assets.categories.list')}</CardTitle>
                <Button
                  size="sm"
                  onClick={() => {
                    resetForm();
                    setShowAddForm(true);
                  }}
                  disabled={showAddForm}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('assets.categories.add')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading && !showAddForm ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t('assets.categories.empty')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('assets.categories.name')}</TableHead>
                      <TableHead>{t('assets.categories.code')}</TableHead>
                      <TableHead>{t('assets.categories.method')}</TableHead>
                      <TableHead>{t('assets.categories.duration')}</TableHead>
                      <TableHead className="text-right">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>
                          {category.code ? (
                            <Badge variant="outline">{category.code}</Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {t(`assets.depreciationMethod.${category.default_depreciation_method}`)}
                        </TableCell>
                        <TableCell>{category.default_duration_years} ans</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(category)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(category.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Formulaire d'ajout/édition */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingId ? t('assets.categories.edit') : t('assets.categories.add')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Informations générales */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('assets.categories.name')} *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={t('assets.categories.namePlaceholder')}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="code">{t('assets.categories.code')}</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="Ex: 2183"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">{t('assets.form.description')}</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Comptes comptables */}
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium">{t('assets.categories.accounts')}</h4>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="account_asset">{t('assets.categories.accountAsset')}</Label>
                        <Input
                          id="account_asset"
                          value={formData.account_asset}
                          onChange={(e) => setFormData({ ...formData, account_asset: e.target.value })}
                          placeholder="Ex: 2183"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="account_depreciation">{t('assets.categories.accountDepreciation')}</Label>
                        <Input
                          id="account_depreciation"
                          value={formData.account_depreciation}
                          onChange={(e) => setFormData({ ...formData, account_depreciation: e.target.value })}
                          placeholder="Ex: 28183"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="account_expense">{t('assets.categories.accountExpense')}</Label>
                        <Input
                          id="account_expense"
                          value={formData.account_expense}
                          onChange={(e) => setFormData({ ...formData, account_expense: e.target.value })}
                          placeholder="Ex: 68112"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Paramètres d'amortissement */}
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium">{t('assets.categories.defaultSettings')}</h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="method">{t('assets.form.depreciationMethod')}</Label>
                        <Select
                          value={formData.default_depreciation_method}
                          onValueChange={(value) => setFormData({ ...formData, default_depreciation_method: value as DepreciationMethod })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="linear">{t('assets.depreciationMethod.linear')}</SelectItem>
                            <SelectItem value="declining_balance">{t('assets.depreciationMethod.decliningBalance')}</SelectItem>
                            <SelectItem value="units_of_production">{t('assets.depreciationMethod.unitsOfProduction')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="duration">{t('assets.form.durationYears')}</Label>
                        <Input
                          id="duration"
                          type="number"
                          min="1"
                          value={formData.default_duration_years}
                          onChange={(e) => setFormData({ ...formData, default_duration_years: parseInt(e.target.value) || 1 })}
                        />
                      </div>

                      {formData.default_depreciation_method === 'declining_balance' && (
                        <div className="space-y-2">
                          <Label htmlFor="rate">{t('assets.form.decliningRate')}</Label>
                          <Select
                            value={formData.default_declining_rate?.toString()}
                            onValueChange={(value) => setFormData({ ...formData, default_declining_rate: parseFloat(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1.25">1.25 (3-4 ans)</SelectItem>
                              <SelectItem value="1.75">1.75 (5-6 ans)</SelectItem>
                              <SelectItem value="2.25">2.25 (&gt;6 ans)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="residual">{t('assets.form.residualValue')} (€)</Label>
                        <Input
                          id="residual"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.default_residual_value}
                          onChange={(e) => setFormData({ ...formData, default_residual_value: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      <X className="w-4 h-4 mr-2" />
                      {t('common.cancel')}
                    </Button>
                    <Button type="submit" disabled={loading}>
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? t('common.saving') : t('common.save')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
