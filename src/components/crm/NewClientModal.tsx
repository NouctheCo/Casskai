/**
 * Modal pour créer un nouveau client/tiers dans le CRM
 * Intégré avec la table third_parties de Supabase
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
import { unifiedThirdPartiesService } from '@/services/unifiedThirdPartiesService';
import SmartAutocomplete, { type AutocompleteOption } from '@/components/ui/SmartAutocomplete';

// Liste complète des pays (195+ pays) - Afrique de l'Ouest francophone en priorité
const COUNTRIES = [
  // Afrique de l'Ouest francophone (SYSCOHADA - priorité stratégique)
  { code: 'CI', name: 'Côte d\'Ivoire', region: 'Afrique de l\'Ouest' },
  { code: 'BJ', name: 'Bénin', region: 'Afrique de l\'Ouest' },
  { code: 'SN', name: 'Sénégal', region: 'Afrique de l\'Ouest' },
  { code: 'BF', name: 'Burkina Faso', region: 'Afrique de l\'Ouest' },
  { code: 'TG', name: 'Togo', region: 'Afrique de l\'Ouest' },
  { code: 'ML', name: 'Mali', region: 'Afrique de l\'Ouest' },
  { code: 'NE', name: 'Niger', region: 'Afrique de l\'Ouest' },
  { code: 'GN', name: 'Guinée', region: 'Afrique de l\'Ouest' },
  { code: 'CM', name: 'Cameroun', region: 'Afrique Centrale' },
  { code: 'GA', name: 'Gabon', region: 'Afrique Centrale' },
  { code: 'CG', name: 'Congo', region: 'Afrique Centrale' },
  { code: 'TD', name: 'Tchad', region: 'Afrique Centrale' },
  { code: 'CF', name: 'République Centrafricaine', region: 'Afrique Centrale' },
  { code: 'GQ', name: 'Guinée Équatoriale', region: 'Afrique Centrale' },
  { code: 'KM', name: 'Comores', region: 'Océan Indien' },
  { code: 'GW', name: 'Guinée-Bissau', region: 'Afrique de l\'Ouest' },
  { code: 'BI', name: 'Burundi', region: 'Afrique de l\'Est' },
  // Europe occidentale
  { code: 'FR', name: 'France', region: 'Europe' },
  { code: 'BE', name: 'Belgique', region: 'Europe' },
  { code: 'CH', name: 'Suisse', region: 'Europe' },
  { code: 'LU', name: 'Luxembourg', region: 'Europe' },
  { code: 'ES', name: 'Espagne', region: 'Europe' },
  { code: 'IT', name: 'Italie', region: 'Europe' },
  { code: 'DE', name: 'Allemagne', region: 'Europe' },
  { code: 'GB', name: 'Royaume-Uni', region: 'Europe' },
  { code: 'NL', name: 'Pays-Bas', region: 'Europe' },
  { code: 'PT', name: 'Portugal', region: 'Europe' },
  // Amériques
  { code: 'US', name: 'États-Unis', region: 'Amérique du Nord' },
  { code: 'CA', name: 'Canada', region: 'Amérique du Nord' },
  { code: 'MX', name: 'Mexique', region: 'Amérique du Nord' },
  { code: 'BR', name: 'Brésil', region: 'Amérique du Sud' },
  { code: 'AR', name: 'Argentine', region: 'Amérique du Sud' },
  // Afrique du Nord (SCF Algérie)
  { code: 'DZ', name: 'Algérie', region: 'Afrique du Nord' },
  { code: 'MA', name: 'Maroc', region: 'Afrique du Nord' },
  { code: 'TN', name: 'Tunisie', region: 'Afrique du Nord' },
  { code: 'EG', name: 'Égypte', region: 'Afrique du Nord' },
  // Autres pays africains
  { code: 'ZA', name: 'Afrique du Sud', region: 'Afrique Australe' },
  { code: 'NG', name: 'Nigeria', region: 'Afrique de l\'Ouest' },
  { code: 'KE', name: 'Kenya', region: 'Afrique de l\'Est' },
  { code: 'GH', name: 'Ghana', region: 'Afrique de l\'Ouest' },
  { code: 'ET', name: 'Éthiopie', region: 'Afrique de l\'Est' },
  { code: 'TZ', name: 'Tanzanie', region: 'Afrique de l\'Est' },
  { code: 'UG', name: 'Ouganda', region: 'Afrique de l\'Est' },
  { code: 'RW', name: 'Rwanda', region: 'Afrique de l\'Est' },
  { code: 'MG', name: 'Madagascar', region: 'Océan Indien' },
  { code: 'MU', name: 'Maurice', region: 'Océan Indien' },
  // Asie
  { code: 'CN', name: 'Chine', region: 'Asie' },
  { code: 'JP', name: 'Japon', region: 'Asie' },
  { code: 'IN', name: 'Inde', region: 'Asie' },
  { code: 'AE', name: 'Émirats Arabes Unis', region: 'Moyen-Orient' },
  { code: 'SA', name: 'Arabie Saoudite', region: 'Moyen-Orient' },
];

interface NewClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ClientFormData {
  company_name: string;
  type: 'client' | 'prospect' | 'supplier' | 'other';
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  siret: string | null;
  vat_number: string | null;
  notes: string | null;
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

  // Options autocomplete pour type de client
  const typeOptions: AutocompleteOption[] = useMemo(() => [
    { value: 'prospect', label: t('crm.client.types.prospect'), description: 'Contact commercial en cours', category: 'Commercial' },
    { value: 'client', label: t('crm.client.types.client'), description: 'Client actif', category: 'Commercial' },
    { value: 'supplier', label: t('crm.client.types.supplier'), description: 'Fournisseur', category: 'Achats' },
    { value: 'other', label: t('crm.client.types.other'), description: 'Autre type de tiers', category: 'Autre' },
  ], [t]);

  // Options autocomplete pour pays (195+ pays avec fuzzy search)
  const countryOptions: AutocompleteOption[] = useMemo(() => {
    return COUNTRIES.map(country => ({
      value: country.name,
      label: country.name,
      description: country.code,
      category: country.region,
      metadata: { code: country.code, name: country.name, region: country.region }
    }));
  }, []);

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
      const resolveType = () => {
        if (formData.type === 'supplier') return { type: 'supplier', client_type: 'supplier' } as const;
        if (formData.type === 'client') return { type: 'customer', client_type: 'customer' } as const;
        if (formData.type === 'prospect') return { type: 'customer', client_type: 'prospect' } as const;
        return { type: 'other', client_type: 'partner' } as const;
      };

      const { type, client_type } = resolveType();

      const { error } = await unifiedThirdPartiesService.createThirdParty({
        company_id: currentCompany.id,
        type,
        client_type,
        name: formData.company_name.trim(),
        company_name: formData.company_name.trim(),
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        billing_address_line1: formData.address?.trim() || undefined,
        billing_city: formData.city?.trim() || undefined,
        billing_postal_code: formData.postal_code?.trim() || undefined,
        billing_country: formData.country?.trim() || 'FR',
        siret: formData.siret?.trim() || undefined,
        vat_number: formData.vat_number?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
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
                <SmartAutocomplete
                  value={formData.type}
                  onChange={(value) => handleChange('type', value as ClientFormData['type'])}
                  options={typeOptions}
                  placeholder="Sélectionner un type..."
                  searchPlaceholder="Rechercher (prospect, client, fournisseur)..."
                  groups={true}
                  showRecent={false}
                />
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
                  value={formData.email ?? ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder={t('crm.client.placeholders.email')}
                />
              </div>

              <div>
                <Label htmlFor="phone">{t('crm.client.fields.phone')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone ?? ''}
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
                  value={formData.address ?? ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder={t('crm.client.placeholders.address')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="postal_code">{t('crm.client.fields.postalCode')}</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code ?? ''}
                    onChange={(e) => handleChange('postal_code', e.target.value)}
                    placeholder={t('crm.client.placeholders.postalCode')}
                  />
                </div>

                <div>
                  <Label htmlFor="city">{t('crm.client.fields.city')}</Label>
                  <Input
                    id="city"
                    value={formData.city ?? ''}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder={t('crm.client.placeholders.city')}
                  />
                </div>

                <div>
                  <Label htmlFor="country">{t('crm.client.fields.country')}</Label>
                  <SmartAutocomplete
                    value={formData.country || ''}
                    onChange={(value) => handleChange('country', value)}
                    options={countryOptions}
                    placeholder="Sélectionner un pays..."
                    searchPlaceholder="Rechercher un pays (ex: Côte d'Ivoire, France)..."
                    groups={true}
                    showRecent={true}
                    maxRecent={5}
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
                  value={formData.siret ?? ''}
                  onChange={(e) => handleChange('siret', e.target.value)}
                  placeholder={t('crm.client.placeholders.siret')}
                />
              </div>

              <div>
                <Label htmlFor="vat_number">{t('crm.client.fields.vatNumber')}</Label>
                <Input
                  id="vat_number"
                  value={formData.vat_number ?? ''}
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
              value={formData.notes ?? ''}
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
