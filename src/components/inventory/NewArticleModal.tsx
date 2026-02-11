/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 *
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 *
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Plus } from 'lucide-react';
import articlesService, { type CreateArticleInput } from '@/services/articlesService';
import { ThirdPartyFormDialog } from '@/components/third-parties/ThirdPartyFormDialog';
import { thirdPartiesService } from '@/services/thirdPartiesService';
import warehousesService, { type Warehouse } from '@/services/warehousesService';
import { ChartOfAccountsService } from '@/services/chartOfAccountsService';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';
import { buildVatRateOptions, getDefaultVatRate, resolveCompanyCountryCode } from '@/utils/vatRateUtils';
import { getCurrencySymbol } from '@/lib/utils';

export interface NewArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (articleId: string) => void | Promise<void>;
}

interface Account {
  id: string;
  account_number: string;
  account_name: string;
  account_type: string;
}

interface ArticleFormData {
  reference: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  purchase_price: string;
  selling_price: string;
  tva_rate: string;
  stock_quantity: string;
  stock_min: string;
  stock_max: string;
  warehouse_id: string;
  supplier_id: string;
  supplier_reference: string;
  purchase_account_id: string;
  sales_account_id: string;
  barcode: string;
}

const INITIAL_FORM_DATA: ArticleFormData = {
  reference: '',
  name: '',
  description: '',
  category: '',
  unit: 'pièce',
  purchase_price: '0',
  selling_price: '0',
  tva_rate: '20',
  stock_quantity: '0',
  stock_min: '0',
  stock_max: '0',
  warehouse_id: '',
  supplier_id: '',
  supplier_reference: '',
  purchase_account_id: '',
  sales_account_id: '',
  barcode: ''
};

const CATEGORIES = [
  'matiere_premiere',
  'produit_fini',
  'service',
  'consommable',
  'equipement',
  'autre'
];

const UNITS = [
  'pièce',
  'kg',
  'litre',
  'mètre',
  'heure',
  'jour',
  'lot',
  'boîte',
  'carton',
  'palette'
];

// ✅ Mapping statique pour éviter les re-renders en boucle
const UNIT_LABELS: Record<string, string> = {
  'unité': 'Unité',
  'pièce': 'Pièce',
  'kg': 'Kilogramme',
  'g': 'Gramme',
  'l': 'Litre',
  'litre': 'Litre',
  'ml': 'Millilitre',
  'm': 'Mètre',
  'mètre': 'Mètre',
  'cm': 'Centimètre',
  'boîte': 'Boîte',
  'boite': 'Boîte',
  'carton': 'Carton',
  'palette': 'Palette',
  'heure': 'Heure',
  'jour': 'Jour',
  'lot': 'Lot',
  'forfait': 'Forfait'
};

const NewArticleModal: React.FC<NewArticleModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { t } = useTranslation();
  const { currentCompany } = useAuth();
  const { showToast } = useToast();
  const countryCode = useMemo(
    () => resolveCompanyCountryCode({ currentCompany }),
    [currentCompany]
  );
  const vatRateOptions = useMemo(
    () => buildVatRateOptions(countryCode),
    [countryCode]
  );
  const defaultVatRate = useMemo(
    () => getDefaultVatRate(countryCode),
    [countryCode]
  );
  const [formData, setFormData] = useState<ArticleFormData>({
    ...INITIAL_FORM_DATA,
    tva_rate: defaultVatRate.toString()
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewSupplierForm, setShowNewSupplierForm] = useState(false);

  // State pour les données chargées
  const [localSuppliers, setLocalSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [purchaseAccounts, setPurchaseAccounts] = useState<Account[]>([]);
  const [salesAccounts, setSalesAccounts] = useState<Account[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // ✅ Fonction helper pour récupérer le label d'une unité (évite les re-renders)
  const getUnitLabel = (unit: string): string => UNIT_LABELS[unit] || unit;

  // ✅ Mémoriser les options d'unités pour éviter les re-calculs
  const unitOptions = useMemo(() =>
    UNITS.map(u => ({ value: u, label: getUnitLabel(u) }))
  , []);

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        tva_rate: prev.tva_rate || defaultVatRate.toString()
      }));
    }
  }, [isOpen, defaultVatRate]);

  // Charger les données quand le modal s'ouvre
  useEffect(() => {
    // ✅ Ne rien faire si le modal est fermé ou pas de company
    if (!isOpen || !currentCompany) return;

    let cancelled = false;

    async function loadFormData() {
      if (!currentCompany) return;
      setDataLoading(true);
      logger.debug('NewArticleModal', '📦 Chargement des données du formulaire...');

      try {
        const chartService = ChartOfAccountsService.getInstance();

        // Charger toutes les données en parallèle
        const [suppliersData, warehousesData, allAccounts] = await Promise.all([
          thirdPartiesService.getThirdParties(currentCompany.id, 'supplier'),
          warehousesService.getWarehouses(currentCompany.id),
          chartService.getAccounts(currentCompany.id, { isActive: true })
        ]);

        // ✅ Ne pas mettre à jour le state si le composant est démonté
        if (cancelled) return;

        // Formater les fournisseurs
        const formattedSuppliers = suppliersData.map(s => ({
          id: s.id,
          name: s.name || s.display_name || s.legal_name || 'Sans nom'
        }));

        // Filtrer les comptes par type
        const purchase = allAccounts.filter(acc =>
          acc.account_number.startsWith('6') || // Classe 6 = Charges (achats)
          acc.account_type === 'expense'
        );
        const sales = allAccounts.filter(acc =>
          acc.account_number.startsWith('7') || // Classe 7 = Produits (ventes)
          acc.account_type === 'revenue'
        );

        setLocalSuppliers(formattedSuppliers);
        setWarehouses(warehousesData);
        setPurchaseAccounts(purchase);
        setSalesAccounts(sales);

        logger.info('NewArticleModal', '✅ Données chargées:', {
          suppliers: formattedSuppliers.length,
          warehouses: warehousesData.length,
          purchaseAccounts: purchase.length,
          salesAccounts: sales.length
        });
      } catch (err) {
        if (cancelled) return;
        logger.error('NewArticleModal', '❌ Erreur chargement données:', err);
        // ✅ Ne pas appeler showToast pour éviter les re-renders
        // Le message d'erreur sera visible dans les logs
      } finally {
        if (!cancelled) {
          setDataLoading(false);
        }
      }
    }

    loadFormData();

    // ✅ Cleanup: annuler les mises à jour si le composant se démonte
    return () => {
      cancelled = true;
    };
  }, [isOpen, currentCompany?.id]); // ✅ Dépendances STABLES uniquement

  const handleInputChange = (field: keyof ArticleFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const calculateMargin = () => {
    const purchase = parseFloat(formData.purchase_price) || 0;
    const selling = parseFloat(formData.selling_price) || 0;
    if (purchase === 0) return '0';
    const margin = ((selling - purchase) / purchase) * 100;
    return margin.toFixed(2);
  };

  const handleSupplierCreated = async () => {
    if (!currentCompany) return;

    try {
      // Recharger la liste des fournisseurs
      const updatedSuppliers = await thirdPartiesService.getThirdParties(currentCompany.id, 'supplier');
      const formattedSuppliers = updatedSuppliers.map(s => ({
        id: s.id,
        name: s.name || s.display_name || s.legal_name || 'Sans nom'
      }));
      setLocalSuppliers(formattedSuppliers);

      logger.info('NewArticleModal', '✅ Fournisseurs rechargés:', formattedSuppliers.length);

      // Fermer le dialog
      setShowNewSupplierForm(false);

      // Notification
      showToast(
        t('inventory.articleModal.supplierCreatedSuccess', "Le fournisseur a été ajouté avec succès"),
        'success'
      );
    } catch (err) {
      logger.error('NewArticleModal', '❌ Erreur rechargement fournisseurs:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentCompany) {
      setError(t('inventory.articleModal.errorNoCompany', 'Aucune entreprise sélectionnée'));
      return;
    }

    if (!formData.name.trim()) {
      setError(t('inventory.articleModal.errorNameRequired', 'Le nom de l\'article est requis'));
      return;
    }

    if (!formData.reference.trim()) {
      setError(t('inventory.articleModal.errorReferenceRequired', 'La référence est requise'));
      return;
    }

    if (!formData.warehouse_id) {
      setError(t('inventory.articleModal.errorWarehouseRequired', 'L\'entrepôt est requis'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const articleInput: CreateArticleInput = {
        reference: formData.reference.trim(),
        name: formData.name.trim(),
        description: formData.description || undefined,
        category: formData.category,
        unit: formData.unit,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        selling_price: parseFloat(formData.selling_price) || 0,
        tva_rate: parseFloat(formData.tva_rate) || 0,
        stock_quantity: parseFloat(formData.stock_quantity) || 0,
        stock_min: parseFloat(formData.stock_min) || 0,
        stock_max: formData.stock_max ? parseFloat(formData.stock_max) : undefined,
        warehouse_id: formData.warehouse_id,
        supplier_id: formData.supplier_id || undefined,
        supplier_reference: formData.supplier_reference || undefined,
        purchase_account_id: formData.purchase_account_id || undefined,
        sales_account_id: formData.sales_account_id || undefined,
        barcode: formData.barcode || undefined
      };

      const article = await articlesService.createArticle(currentCompany.id, articleInput);

      setFormData({
        ...INITIAL_FORM_DATA,
        tva_rate: defaultVatRate.toString()
      });
      onSuccess(article.id);
      onClose();
    } catch (err) {
      logger.error('NewArticleModal', 'Error creating article:', err);
      const errorMessage = err instanceof Error ? err.message : t('inventory.articleModal.errorCreating', 'Erreur lors de la création de l\'article');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('inventory.articleModal.title', 'Nouvel article')}</DialogTitle>
          <DialogDescription>
            {t('inventory.articleModal.description', 'Créer un nouvel article pour la gestion de l\'inventaire')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Informations générales */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t('inventory.articleModal.sectionGeneral', 'Informations générales')}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reference">
                  {t('inventory.articleModal.reference', 'Référence')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => handleInputChange('reference', e.target.value)}
                  placeholder={t('inventory.articleModal.referencePlaceholder', 'Ex: ART-001')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">
                  {t('inventory.articleModal.barcode', 'Code-barres')}
                </Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                  placeholder={t('inventory.articleModal.barcodePlaceholder', 'Ex: 3700123456789')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                {t('inventory.articleModal.name', 'Nom de l\'article')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={t('inventory.articleModal.namePlaceholder', 'Ex: Ordinateur portable Dell')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                {t('inventory.articleModal.description', 'Description')}
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={t('inventory.articleModal.descriptionPlaceholder', 'Description détaillée de l\'article')}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">
                  {t('inventory.articleModal.category', 'Catégorie')}
                </Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder={t('inventory.articleModal.categoryPlaceholder', 'Sélectionner une catégorie')} />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {t(`inventory.categories.${cat}`, cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">
                  {t('inventory.articleModal.unit', 'Unité')}
                </Label>
                <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
                  <SelectTrigger id="unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section: Prix et TVA */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t('inventory.articleModal.sectionPricing', 'Prix et TVA')}
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase_price">
                  {t('inventory.articleModal.purchasePrice', `Prix d'achat (${getCurrencySymbol()})`)}
                </Label>
                <Input
                  id="purchase_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.purchase_price}
                  onChange={(e) => handleInputChange('purchase_price', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="selling_price">
                  {t('inventory.articleModal.sellingPrice', `Prix de vente (${getCurrencySymbol()})`)}
                </Label>
                <Input
                  id="selling_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.selling_price}
                  onChange={(e) => handleInputChange('selling_price', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="margin">
                  {t('inventory.articleModal.margin', 'Marge (%)')}
                </Label>
                <Input
                  id="margin"
                  type="text"
                  value={calculateMargin()}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tva_rate">
                {t('inventory.articleModal.tvaRate', 'Taux de TVA (%)')}
              </Label>
              <Select value={formData.tva_rate} onValueChange={(value) => handleInputChange('tva_rate', value)}>
                <SelectTrigger id="tva_rate">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(
                    new Set([
                      ...vatRateOptions,
                      Number.isFinite(Number(formData.tva_rate))
                        ? Number(formData.tva_rate)
                        : defaultVatRate
                    ])
                  )
                    .sort((a, b) => a - b)
                    .map((rate) => (
                      <SelectItem key={rate} value={rate.toString()}>
                        {rate}%
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Input
                id="tva_rate_manual"
                type="number"
                placeholder="Taux manuel (%)"
                min="0"
                step="0.01"
                value={formData.tva_rate}
                onChange={(e) => handleInputChange('tva_rate', e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <Separator />

          {/* Section: Stock */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t('inventory.articleModal.sectionStock', 'Gestion du stock')}
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock_quantity">
                  {t('inventory.articleModal.stockQuantity', 'Stock initial')}
                </Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock_min">
                  {t('inventory.articleModal.stockMin', 'Stock minimum')}
                </Label>
                <Input
                  id="stock_min"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.stock_min}
                  onChange={(e) => handleInputChange('stock_min', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock_max">
                  {t('inventory.articleModal.stockMax', 'Stock maximum')}
                </Label>
                <Input
                  id="stock_max"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.stock_max}
                  onChange={(e) => handleInputChange('stock_max', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse_id">
                {t('inventory.articleModal.warehouse', 'Entrepôt')} <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.warehouse_id} onValueChange={(value) => handleInputChange('warehouse_id', value)}>
                <SelectTrigger id="warehouse_id">
                  <SelectValue placeholder={t('inventory.articleModal.warehousePlaceholder', 'Sélectionner un entrepôt')} />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.length > 0 ? (
                    warehouses.map(warehouse => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="default" disabled>
                      {t('inventory.articleModal.noWarehouse', 'Aucun entrepôt disponible')}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Section: Fournisseur */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t('inventory.articleModal.sectionSupplier', 'Fournisseur')}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier_id">
                  {t('inventory.articleModal.supplier', 'Fournisseur par défaut')}
                </Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={(value) => {
                    if (value === '__new__') {
                      setShowNewSupplierForm(true);
                    } else {
                      handleInputChange('supplier_id', value);
                    }
                  }}
                >
                  <SelectTrigger id="supplier_id">
                    <SelectValue placeholder={t('inventory.articleModal.supplierPlaceholder', 'Sélectionner un fournisseur')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__new__">
                      <div className="flex items-center text-blue-600 font-medium">
                        <Plus className="w-4 h-4 mr-2" />
                        {t('inventory.articleModal.createSupplier', 'Créer un nouveau fournisseur')}
                      </div>
                    </SelectItem>
                    {localSuppliers.length > 0 && <div className="border-t my-1"></div>}
                    {localSuppliers.length === 0 ? (
                      <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                        {t('inventory.articleModal.noSupplier', 'Aucun fournisseur. Créez-en un ci-dessus.')}
                      </div>
                    ) : (
                      localSuppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier_reference">
                  {t('inventory.articleModal.supplierReference', 'Référence fournisseur')}
                </Label>
                <Input
                  id="supplier_reference"
                  value={formData.supplier_reference}
                  onChange={(e) => handleInputChange('supplier_reference', e.target.value)}
                  placeholder={t('inventory.articleModal.supplierReferencePlaceholder', 'Ex: SUP-REF-001')}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Section: Comptabilité */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t('inventory.articleModal.sectionAccounting', 'Liaison comptable')}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase_account_id">
                  {t('inventory.articleModal.purchaseAccount', 'Compte d\'achat')}
                </Label>
                <Select value={formData.purchase_account_id} onValueChange={(value) => handleInputChange('purchase_account_id', value)}>
                  <SelectTrigger id="purchase_account_id">
                    <SelectValue placeholder={t('inventory.articleModal.purchaseAccountPlaceholder', 'Sélectionner un compte')} />
                  </SelectTrigger>
                  <SelectContent>
                    {purchaseAccounts.length > 0 ? (
                      purchaseAccounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.account_number} - {account.account_name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        {t('inventory.articleModal.noAccount', 'Aucun compte disponible')}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sales_account_id">
                  {t('inventory.articleModal.salesAccount', 'Compte de vente')}
                </Label>
                <Select value={formData.sales_account_id} onValueChange={(value) => handleInputChange('sales_account_id', value)}>
                  <SelectTrigger id="sales_account_id">
                    <SelectValue placeholder={t('inventory.articleModal.salesAccountPlaceholder', 'Sélectionner un compte')} />
                  </SelectTrigger>
                  <SelectContent>
                    {salesAccounts.length > 0 ? (
                      salesAccounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.account_number} - {account.account_name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        {t('inventory.articleModal.noAccount', 'Aucun compte disponible')}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading || dataLoading}>
              {t('common.cancel', 'Annuler')}
            </Button>
            <Button type="submit" disabled={loading || dataLoading}>
              {(loading || dataLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dataLoading ? t('common.loading', 'Chargement...') : t('inventory.articleModal.create', 'Créer l\'article')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Modal de création de tiers (fournisseur) unifié */}
      {currentCompany && (
        <ThirdPartyFormDialog
          open={showNewSupplierForm}
          onClose={() => setShowNewSupplierForm(false)}
          onSuccess={handleSupplierCreated}
          companyId={currentCompany.id}
          defaultType="supplier"
        />
      )}
    </Dialog>
  );
};

export default NewArticleModal;
