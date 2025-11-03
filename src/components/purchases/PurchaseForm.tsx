import React, { useState, useEffect } from 'react';
import { PurchaseFormData, Purchase, Supplier } from '../../types/purchase.types';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Card, CardContent } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Upload, X, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PurchaseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PurchaseFormData) => Promise<void>;
  purchase?: Purchase | null;
  suppliers: Supplier[];
  loading: boolean;
}

const PurchaseForm: React.FC<PurchaseFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  purchase,
  suppliers,
  loading
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<PurchaseFormData>({
    invoice_number: '',
    purchase_date: new Date().toISOString().split('T')[0],
    supplier_id: '',
    description: '',
    amount_ht: 0,
    tva_rate: 20,
    due_date: '',
    attachments: []
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calculatedAmounts, setCalculatedAmounts] = useState({
    tva_amount: 0,
    amount_ttc: 0
  });

  // Initialize form when purchase changes
  useEffect(() => {
    if (purchase) {
      setFormData({
        invoice_number: purchase.invoice_number,
        purchase_date: purchase.purchase_date,
        supplier_id: purchase.supplier_id,
        description: purchase.description,
        amount_ht: purchase.amount_ht,
        tva_rate: purchase.tva_rate,
        due_date: purchase.due_date,
        attachments: []
      });
    } else {
      setFormData({
        invoice_number: '',
        purchase_date: new Date().toISOString().split('T')[0],
        supplier_id: '',
        description: '',
        amount_ht: 0,
        tva_rate: 20,
        due_date: '',
        attachments: []
      });
    }
    setErrors({});
  }, [purchase]);

  // Calculate amounts when amount_ht or tva_rate changes
  useEffect(() => {
    const tvaAmount = formData.amount_ht * (formData.tva_rate / 100);
    const amountTTC = formData.amount_ht + tvaAmount;
    
    setCalculatedAmounts({
      tva_amount: tvaAmount,
      amount_ttc: amountTTC
    });
  }, [formData.amount_ht, formData.tva_rate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.invoice_number.trim()) {
      newErrors.invoice_number = t('purchases.form.validation.invoiceNumberRequired');
    }

    if (!formData.purchase_date) {
      newErrors.purchase_date = t('purchases.form.validation.purchaseDateRequired');
    }

    if (!formData.supplier_id) {
      newErrors.supplier_id = t('purchases.form.validation.supplierRequired');
    }

    if (!formData.description.trim()) {
      newErrors.description = t('purchases.form.validation.descriptionRequired');
    }

    if (formData.amount_ht <= 0) {
      newErrors.amount_ht = t('purchases.form.validation.amountRequired');
    }

    if (!formData.due_date) {
      newErrors.due_date = t('purchases.form.validation.dueDateRequired');
    } else if (new Date(formData.due_date) < new Date(formData.purchase_date)) {
      newErrors.due_date = t('purchases.form.validation.dueDateInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error submitting form:', error instanceof Error ? error.message : String(error));
    }
  };

  const handleInputChange = (field: keyof PurchaseFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...files]
    }));
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments?.filter((_, i) => i !== index) || []
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {purchase ? t('purchases.form.editTitle') : t('purchases.form.createTitle')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Invoice Number */}
            <div className="space-y-2">
              <Label htmlFor="invoice_number">
                {t('purchases.form.invoiceNumber')} *
              </Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => handleInputChange('invoice_number', e.target.value)}
                placeholder={t('purchases.form.invoiceNumberPlaceholder')}
                className={errors.invoice_number ? 'border-red-500' : ''}
              />
              {errors.invoice_number && (
                <p className="text-sm text-red-600">{errors.invoice_number}</p>
              )}
            </div>

            {/* Purchase Date */}
            <div className="space-y-2">
              <Label htmlFor="purchase_date">
                {t('purchases.form.purchaseDate')} *
              </Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => handleInputChange('purchase_date', e.target.value)}
                className={errors.purchase_date ? 'border-red-500' : ''}
              />
              {errors.purchase_date && (
                <p className="text-sm text-red-600">{errors.purchase_date}</p>
              )}
            </div>

            {/* Supplier */}
            <div className="space-y-2">
              <Label htmlFor="supplier_id">
                {t('purchases.form.supplier')} *
              </Label>
              <Select
                value={formData.supplier_id}
                onValueChange={(value) => handleInputChange('supplier_id', value)}
              >
                <SelectTrigger className={errors.supplier_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder={t('purchases.form.selectSupplier')} />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.supplier_id && (
                <p className="text-sm text-red-600">{errors.supplier_id}</p>
              )}
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="due_date">
                {t('purchases.form.dueDate')} *
              </Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
                className={errors.due_date ? 'border-red-500' : ''}
              />
              {errors.due_date && (
                <p className="text-sm text-red-600">{errors.due_date}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {t('purchases.form.description')} *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder={t('purchases.form.descriptionPlaceholder')}
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Amounts */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h4 className="font-medium text-gray-900">{t('purchases.form.amounts')}</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Amount HT */}
                <div className="space-y-2">
                  <Label htmlFor="amount_ht">
                    {t('purchases.form.amountHT')} * (€)
                  </Label>
                  <Input
                    id="amount_ht"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount_ht || ''}
                    onChange={(e) => handleInputChange('amount_ht', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className={errors.amount_ht ? 'border-red-500' : ''}
                  />
                  {errors.amount_ht && (
                    <p className="text-sm text-red-600">{errors.amount_ht}</p>
                  )}
                </div>

                {/* TVA Rate */}
                <div className="space-y-2">
                  <Label htmlFor="tva_rate">
                    {t('purchases.form.tvaRate')} (%)
                  </Label>
                  <Select
                    value={formData.tva_rate.toString()}
                    onValueChange={(value) => handleInputChange('tva_rate', parseFloat(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="5.5">5,5%</SelectItem>
                      <SelectItem value="10">10%</SelectItem>
                      <SelectItem value="20">20%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Calculated amounts display */}
                <div className="space-y-2">
                  <Label>{t('purchases.form.calculatedAmounts')}</Label>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{t('purchases.form.tvaAmount')}:</span>
                      <span className="font-medium">{formatCurrency(calculatedAmounts.tva_amount)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span className="font-medium">{t('purchases.form.amountTTC')}:</span>
                      <span className="font-bold">{formatCurrency(calculatedAmounts.amount_ttc)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <div className="space-y-2">
            <Label>{t('purchases.form.attachments')}</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <div className="mt-2">
                  <label htmlFor="attachments" className="cursor-pointer">
                    <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                      {t('purchases.form.uploadFiles')}
                    </span>
                    <input
                      id="attachments"
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('purchases.form.acceptedFormats')}
                  </p>
                </div>
              </div>
              
              {/* Display uploaded files */}
              {formData.attachments && formData.attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {formData.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form validation summary */}
          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                {t('purchases.form.validation.formErrors')}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {purchase ? t('common.update') : t('common.create')}
              </span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseForm;