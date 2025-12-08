/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import assetsService from '@/services/assetsService';
import type { AssetCategory, AssetFormData, DepreciationMethod } from '@/types/assets.types';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

interface AssetFormDialogProps {
  open: boolean;
  onClose: () => void;
  categories: AssetCategory[];
  assetId?: string; // Pour édition
  onCategoryCreated?: () => void; // Callback pour rafraîchir les catégories
}

export const AssetFormDialog: React.FC<AssetFormDialogProps> = ({
  open,
  onClose,
  categories,
  assetId,
  onCategoryCreated,
}) => {
  const { t } = useTranslation();
  const { currentCompany } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // États pour les modals de création inline
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [showNewEmployeeModal, setShowNewEmployeeModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', code: '', default_duration_years: 5 });
  const [newEmployee, setNewEmployee] = useState({ first_name: '', last_name: '', email: '' });

  // Debug: Log catégories reçues en props
  useEffect(() => {
    console.log('[AssetForm] Catégories reçues:', categories);
    console.log('[AssetForm] Nombre de catégories:', categories.length);
  }, [categories]);

  const [formData, setFormData] = useState<AssetFormData>({
    name: '',
    description: '',
    asset_number: '',
    serial_number: '',
    acquisition_date: new Date().toISOString().split('T')[0],
    acquisition_value: 0,
    supplier_id: undefined,
    invoice_reference: '',
    location: '',
    responsible_person: '',
    depreciation_method: 'linear',
    depreciation_start_date: new Date().toISOString().split('T')[0],
    duration_years: 5,
    declining_rate: undefined,
    residual_value: 0,
    notes: '',
  });

  // Charger les employés au montage
  useEffect(() => {
    if (currentCompany?.id && open) {
      loadEmployees();
    }
  }, [currentCompany?.id, open]);

  // Charger les données si édition
  useEffect(() => {
    if (assetId) {
      loadAsset();
    }
  }, [assetId]);

  const loadEmployees = async () => {
    if (!currentCompany?.id) {
      console.log('[AssetForm] companyId non disponible pour charger les employés');
      return;
    }

    try {
      console.log('[AssetForm] Chargement des employés pour company:', currentCompany.id);
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('company_id', currentCompany.id)
        .eq('status', 'active')
        .order('last_name');

      if (error) throw error;
      console.log('[AssetForm] Employés chargés:', data);
      setEmployees(data || []);
    } catch (error: any) {
      console.error('[AssetForm] Error loading employees:', error);
      // Ne pas afficher d'erreur, liste vide acceptable
    }
  };

  // Mettre à jour les paramètres par défaut quand la catégorie change
  useEffect(() => {
    if (selectedCategory && !assetId) {
      setFormData((prev) => ({
        ...prev,
        depreciation_method: selectedCategory.default_depreciation_method,
        duration_years: selectedCategory.default_duration_years,
        declining_rate: selectedCategory.default_declining_rate || undefined,
        residual_value: selectedCategory.default_residual_value || 0,
        account_asset: selectedCategory.account_asset || undefined,
        account_depreciation: selectedCategory.account_depreciation || undefined,
        account_expense: selectedCategory.account_expense || undefined,
      }));
    }
  }, [selectedCategory, assetId]);

  const loadAsset = async () => {
    if (!assetId) return;

    try {
      const asset = await assetsService.getAssetById(assetId);
      setFormData({
        category_id: asset.category_id,
        name: asset.name,
        description: asset.description || '',
        asset_number: asset.asset_number || '',
        serial_number: asset.serial_number || '',
        acquisition_date: asset.acquisition_date,
        acquisition_value: asset.acquisition_value,
        supplier_id: asset.supplier_id,
        invoice_reference: asset.invoice_reference || '',
        location: asset.location || '',
        responsible_person: asset.responsible_person || '',
        depreciation_method: asset.depreciation_method,
        depreciation_start_date: asset.depreciation_start_date,
        duration_years: asset.duration_years,
        declining_rate: asset.declining_rate,
        residual_value: asset.residual_value,
        account_asset: asset.account_asset,
        account_depreciation: asset.account_depreciation,
        account_expense: asset.account_expense,
        total_units: asset.total_units,
        notes: asset.notes || '',
      });
    } catch (error: any) {
      console.error('Error loading asset:', error);
      toast.error(t('assets.errors.loadFailed'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentCompany?.id) {
      toast.error(t('common.errors.noCompany'));
      return;
    }

    // Validation
    if (!formData.name.trim()) {
      toast.error(t('assets.form.errors.nameRequired'));
      return;
    }

    if (formData.acquisition_value <= 0) {
      toast.error(t('assets.form.errors.acquisitionValueRequired'));
      return;
    }

    if (formData.duration_years <= 0) {
      toast.error(t('assets.form.errors.durationRequired'));
      return;
    }

    setLoading(true);

    try {
      if (assetId) {
        await assetsService.updateAsset(assetId, formData);
        toast.success(t('assets.success.updated'));
      } else {
        await assetsService.createAsset(currentCompany.id, formData);
        toast.success(t('assets.success.created'));
      }
      onClose();
    } catch (error: any) {
      console.error('Error saving asset:', error);
      toast.error(error.message || t('assets.errors.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setFormData((prev) => ({ ...prev, category_id: categoryId }));
    const category = categories.find((c) => c.id === categoryId);
    setSelectedCategory(category || null);
  };

  /**
   * Créer une nouvelle catégorie (compte plan comptable)
   */
  const handleCreateCategory = async () => {
    if (!currentCompany?.id) {
      toast.error(t('common.errors.noCompany'));
      return;
    }

    if (!newCategory.name.trim() || !newCategory.code.trim()) {
      toast.error('Le nom et le code sont requis');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .insert({
          company_id: currentCompany.id,
          account_number: newCategory.code,
          account_name: newCategory.name,
          account_type: 'asset',
        })
        .select()
        .single();

      if (error) throw error;

      if (data && onCategoryCreated) {
        onCategoryCreated(); // Rafraîchir la liste des catégories dans le parent
      }

      setShowNewCategoryModal(false);
      setNewCategory({ name: '', code: '', default_duration_years: 5 });
      toast.success('Catégorie créée avec succès');
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast.error(error.message || 'Erreur lors de la création de la catégorie');
    }
  };

  /**
   * Créer un nouvel employé
   */
  const handleCreateEmployee = async () => {
    if (!currentCompany?.id) {
      toast.error(t('common.errors.noCompany'));
      return;
    }

    if (!newEmployee.first_name.trim() || !newEmployee.last_name.trim()) {
      toast.error('Le prénom et le nom sont requis');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('employees')
        .insert({
          company_id: currentCompany.id,
          first_name: newEmployee.first_name,
          last_name: newEmployee.last_name,
          email: newEmployee.email || null,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setEmployees((prev) => [...prev, data]);
        setFormData((prev) => ({ ...prev, responsible_person: data.id }));
      }

      setShowNewEmployeeModal(false);
      setNewEmployee({ first_name: '', last_name: '', email: '' });
      toast.success('Employé créé avec succès');
    } catch (error: any) {
      console.error('Error creating employee:', error);
      toast.error(error.message || 'Erreur lors de la création de l\'employé');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {assetId ? t('assets.form.editTitle') : t('assets.form.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('assets.form.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section identification */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t('assets.form.sections.identification')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="category_id">{t('assets.form.category')}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewCategoryModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Nouvelle
                  </Button>
                </div>
                <Select
                  value={formData.category_id}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('assets.form.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name} {category.code && `(${category.code})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="asset_number">{t('assets.form.assetNumber')}</Label>
                <Input
                  id="asset_number"
                  value={formData.asset_number}
                  onChange={(e) => setFormData({ ...formData, asset_number: e.target.value })}
                  placeholder={t('assets.form.assetNumberPlaceholder')}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">{t('assets.form.name')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('assets.form.namePlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">{t('assets.form.description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('assets.form.descriptionPlaceholder')}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serial_number">{t('assets.form.serialNumber')}</Label>
                <Input
                  id="serial_number"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  placeholder={t('assets.form.serialNumberPlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">{t('assets.form.location')}</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder={t('assets.form.locationPlaceholder')}
                />
              </div>
            </div>
          </div>

          {/* Section acquisition */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t('assets.form.sections.acquisition')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="acquisition_date">{t('assets.form.acquisitionDate')} *</Label>
                <Input
                  id="acquisition_date"
                  type="date"
                  value={formData.acquisition_date}
                  onChange={(e) => setFormData({ ...formData, acquisition_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="acquisition_value">{t('assets.form.acquisitionValue')} * (€)</Label>
                <Input
                  id="acquisition_value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.acquisition_value}
                  onChange={(e) => setFormData({ ...formData, acquisition_value: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice_reference">{t('assets.form.invoiceReference')}</Label>
                <Input
                  id="invoice_reference"
                  value={formData.invoice_reference}
                  onChange={(e) => setFormData({ ...formData, invoice_reference: e.target.value })}
                  placeholder={t('assets.form.invoiceReferencePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="responsible_person">{t('assets.form.responsiblePerson')}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewEmployeeModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Nouveau
                  </Button>
                </div>
                <Select
                  value={formData.responsible_person}
                  onValueChange={(value) => setFormData({ ...formData, responsible_person: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('assets.form.selectResponsiblePerson')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('common.none')}</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.first_name} {employee.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section amortissement */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t('assets.form.sections.depreciation')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="depreciation_method">{t('assets.form.depreciationMethod')} *</Label>
                <Select
                  value={formData.depreciation_method}
                  onValueChange={(value) => setFormData({ ...formData, depreciation_method: value as DepreciationMethod })}
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
                <Label htmlFor="depreciation_start_date">{t('assets.form.depreciationStartDate')} *</Label>
                <Input
                  id="depreciation_start_date"
                  type="date"
                  value={formData.depreciation_start_date}
                  onChange={(e) => setFormData({ ...formData, depreciation_start_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_years">{t('assets.form.durationYears')} *</Label>
                <Input
                  id="duration_years"
                  type="number"
                  min="1"
                  value={formData.duration_years}
                  onChange={(e) => setFormData({ ...formData, duration_years: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>

              {formData.depreciation_method === 'declining_balance' && (
                <div className="space-y-2">
                  <Label htmlFor="declining_rate">{t('assets.form.decliningRate')}</Label>
                  <Select
                    value={formData.declining_rate?.toString()}
                    onValueChange={(value) => setFormData({ ...formData, declining_rate: parseFloat(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                <Label htmlFor="residual_value">{t('assets.form.residualValue')} (€)</Label>
                <Input
                  id="residual_value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.residual_value}
                  onChange={(e) => setFormData({ ...formData, residual_value: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          {/* Section notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">{t('assets.form.notes')}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t('assets.form.notesPlaceholder')}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('common.saving') : assetId ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Modal Nouvelle Catégorie */}
      <Dialog open={showNewCategoryModal} onOpenChange={setShowNewCategoryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle catégorie d'immobilisation</DialogTitle>
            <DialogDescription>
              Créer une nouvelle catégorie dans le plan comptable (classe 21x)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_category_code">Code comptable *</Label>
              <Input
                id="new_category_code"
                placeholder="ex: 2183"
                value={newCategory.code}
                onChange={(e) => setNewCategory({ ...newCategory, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_category_name">Nom *</Label>
              <Input
                id="new_category_name"
                placeholder="ex: Matériel de bureau et informatique"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_category_duration">Durée d'amortissement (années)</Label>
              <Input
                id="new_category_duration"
                type="number"
                min="1"
                value={newCategory.default_duration_years}
                onChange={(e) => setNewCategory({ ...newCategory, default_duration_years: parseInt(e.target.value) || 5 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCategoryModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateCategory}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Nouvel Employé */}
      <Dialog open={showNewEmployeeModal} onOpenChange={setShowNewEmployeeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel employé</DialogTitle>
            <DialogDescription>
              Créer un nouvel employé comme responsable de l'immobilisation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_employee_first_name">Prénom *</Label>
              <Input
                id="new_employee_first_name"
                placeholder="Prénom"
                value={newEmployee.first_name}
                onChange={(e) => setNewEmployee({ ...newEmployee, first_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_employee_last_name">Nom *</Label>
              <Input
                id="new_employee_last_name"
                placeholder="Nom"
                value={newEmployee.last_name}
                onChange={(e) => setNewEmployee({ ...newEmployee, last_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_employee_email">Email</Label>
              <Input
                id="new_employee_email"
                type="email"
                placeholder="email@exemple.com"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewEmployeeModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateEmployee}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
