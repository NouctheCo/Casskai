import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { crmService } from '../../services/crmService';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '@/lib/logger';
interface NewSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (supplierId: string) => void;
}
interface SupplierFormData {
  company_name: string;
  industry: string;
  size: 'small' | 'medium' | 'large' | '';
  address: string;
  city: string;
  postal_code: string;
  country: string;
  website: string;
  notes: string;
}
const NewSupplierModal: React.FC<NewSupplierModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { currentCompany } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>({
    company_name: '',
    industry: '',
    size: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'FR',
    website: '',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.company_name.trim()) {
      newErrors.company_name = t('purchases.supplierModal.validation.nameRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateForm() || !currentCompany) {
      return;
    }
    setLoading(true);
    try {
      // Utiliser le service CRM pour créer un fournisseur (type = supplier)
      const response = await crmService.createSupplier(currentCompany.id, {
        company_name: formData.company_name,
        industry: formData.industry,
        size: formData.size || undefined,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postal_code,
        country: formData.country,
        website: formData.website,
        notes: formData.notes,
        status: 'active'
      });
      if (response.success && response.data) {
        onSuccess(response.data.id);
        onClose();
        // Reset form
        setFormData({
          company_name: '',
          industry: '',
          size: '',
          address: '',
          city: '',
          postal_code: '',
          country: 'FR',
          website: '',
          notes: ''
        });
      } else {
        const errorMessage = typeof response.error === 'string'
          ? response.error
          : response.error?.message || t('purchases.supplierModal.errorCreating');
        setError(errorMessage);
      }
    } catch (err) {
      logger.error('NewSupplierModal', 'Error creating supplier:', err);
      setError(t('purchases.supplierModal.errorCreating'));
    } finally {
      setLoading(false);
    }
  };
  const handleInputChange = (field: keyof SupplierFormData, value: string) => {
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
  const handleClose = () => {
    if (!loading) {
      onClose();
      setError(null);
      setErrors({});
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('purchases.supplierModal.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="supplier_name">
              {t('purchases.supplierModal.companyName')} *
            </Label>
            <Input
              id="supplier_name"
              value={formData.company_name}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              placeholder={t('purchases.supplierModal.companyNamePlaceholder')}
              className={errors.company_name ? 'border-red-500' : ''}
              disabled={loading}
            />
            {errors.company_name && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.company_name}</p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Industry */}
            <div className="space-y-2">
              <Label htmlFor="supplier_industry">
                {t('purchases.supplierModal.industry')}
              </Label>
              <Input
                id="supplier_industry"
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                placeholder={t('purchases.supplierModal.industryPlaceholder')}
                disabled={loading}
              />
            </div>
            {/* Size */}
            <div className="space-y-2">
              <Label htmlFor="supplier_size">
                {t('purchases.supplierModal.size')}
              </Label>
              <Select
                value={formData.size}
                onValueChange={(value) => handleInputChange('size', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('purchases.supplierModal.selectSize')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">{t('purchases.supplierModal.sizeSmall')}</SelectItem>
                  <SelectItem value="medium">{t('purchases.supplierModal.sizeMedium')}</SelectItem>
                  <SelectItem value="large">{t('purchases.supplierModal.sizeLarge')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="supplier_address">
              {t('purchases.supplierModal.address')}
            </Label>
            <Input
              id="supplier_address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder={t('purchases.supplierModal.addressPlaceholder')}
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="supplier_city">
                {t('purchases.supplierModal.city')}
              </Label>
              <Input
                id="supplier_city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder={t('purchases.supplierModal.cityPlaceholder')}
                disabled={loading}
              />
            </div>
            {/* Postal Code */}
            <div className="space-y-2">
              <Label htmlFor="supplier_postal">
                {t('purchases.supplierModal.postalCode')}
              </Label>
              <Input
                id="supplier_postal"
                value={formData.postal_code}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                placeholder={t('purchases.supplierModal.postalCodePlaceholder')}
                disabled={loading}
              />
            </div>
            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="supplier_country">
                {t('purchases.supplierModal.country')}
              </Label>
              <Input
                id="supplier_country"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="FR"
                disabled={loading}
              />
            </div>
          </div>
          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="supplier_website">
              {t('purchases.supplierModal.website')}
            </Label>
            <Input
              id="supplier_website"
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://example.com"
              disabled={loading}
            />
          </div>
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="supplier_notes">
              {t('purchases.supplierModal.notes')}
            </Label>
            <Textarea
              id="supplier_notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder={t('purchases.supplierModal.notesPlaceholder')}
              rows={3}
              disabled={loading}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
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
              <span>{t('common.create')}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
export default NewSupplierModal;