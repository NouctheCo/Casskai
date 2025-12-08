/**
 * Modal pour créer un nouveau client/tiers dans le CRM
 * Intégré avec la table third_parties de Supabase
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { toastSuccess, toastError } from '@/lib/toast-helpers';
import { Building2, Mail, MapPin, FileText } from 'lucide-react';
import { devLogger } from '@/utils/devLogger';

interface NewClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ClientFormData {
  company_name: string;
  type: 'client' | 'prospect' | 'supplier' | 'other';
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  siret?: string;
  vat_number?: string;
  notes?: string;
}

export const NewClientModal: React.FC<NewClientModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { currentCompany } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<ClientFormData>({
    company_name: '',
    type: 'prospect',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'France',
    siret: '',
    vat_number: '',
    notes: '',
  });

  const handleChange = (field: keyof ClientFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      type: 'prospect',
      email: '',
      phone: '',
      address: '',
      city: '',
      postal_code: '',
      country: 'France',
      siret: '',
      vat_number: '',
      notes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentCompany?.id) {
      toastError(t('common.errors.noCompany'));
      return;
    }

    if (!formData.company_name.trim()) {
      toastError(t('crm.client.validation.nameRequired'));
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('third_parties').insert({
        company_id: currentCompany.id,
        name: formData.company_name.trim(),
        type: formData.type,
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        address_line1: formData.address?.trim() || null,
        city: formData.city?.trim() || null,
        postal_code: formData.postal_code?.trim() || null,
        country: formData.country?.trim() || null,
        siret: formData.siret?.trim() || null,
        vat_number: formData.vat_number?.trim() || null,
        notes: formData.notes?.trim() || null,
        is_active: true,
      });

      if (error) throw error;

      toastSuccess(t('crm.client.created'));
      resetForm();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      devLogger.error('Error creating client:', error);
      toastError(t('crm.client.errors.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {t('crm.client.new')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('crm.client.sections.basicInfo')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="company_name">
                  {t('crm.client.fields.companyName')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  placeholder={t('crm.client.placeholders.companyName')}
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">{t('crm.client.fields.type')}</Label>
                <Select value={formData.type} onValueChange={(value) => handleChange('type', value as ClientFormData['type'])}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospect">{t('crm.client.types.prospect')}</SelectItem>
                    <SelectItem value="client">{t('crm.client.types.client')}</SelectItem>
                    <SelectItem value="supplier">{t('crm.client.types.supplier')}</SelectItem>
                    <SelectItem value="other">{t('crm.client.types.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {t('crm.client.sections.contact')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">{t('crm.client.fields.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder={t('crm.client.placeholders.email')}
                />
              </div>

              <div>
                <Label htmlFor="phone">{t('crm.client.fields.phone')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder={t('crm.client.placeholders.phone')}
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {t('crm.client.sections.address')}
            </h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="address">{t('crm.client.fields.address')}</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder={t('crm.client.placeholders.address')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="postal_code">{t('crm.client.fields.postalCode')}</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => handleChange('postal_code', e.target.value)}
                    placeholder={t('crm.client.placeholders.postalCode')}
                  />
                </div>

                <div>
                  <Label htmlFor="city">{t('crm.client.fields.city')}</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder={t('crm.client.placeholders.city')}
                  />
                </div>

                <div>
                  <Label htmlFor="country">{t('crm.client.fields.country')}</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    placeholder={t('crm.client.placeholders.country')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Legal Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t('crm.client.sections.legal')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="siret">{t('crm.client.fields.siret')}</Label>
                <Input
                  id="siret"
                  value={formData.siret}
                  onChange={(e) => handleChange('siret', e.target.value)}
                  placeholder={t('crm.client.placeholders.siret')}
                />
              </div>

              <div>
                <Label htmlFor="vat_number">{t('crm.client.fields.vatNumber')}</Label>
                <Input
                  id="vat_number"
                  value={formData.vat_number}
                  onChange={(e) => handleChange('vat_number', e.target.value)}
                  placeholder={t('crm.client.placeholders.vatNumber')}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">{t('crm.client.fields.notes')}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder={t('crm.client.placeholders.notes')}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t('common.action.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('common.action.saving') : t('common.action.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
