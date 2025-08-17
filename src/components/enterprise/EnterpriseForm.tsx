import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useEnterprise } from '@/hooks/useEnterpriseContext';
import { useLocale } from '@/contexts/LocaleContext';
import { Enterprise } from '@/types/enterprise.types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, MapPin, Landmark, Settings } from 'lucide-react';
import { GeneralTab, AddressTab, FiscalTab, SettingsTab } from './EnterpriseFormTabs';

interface EnterpriseFormProps {
  enterprise?: Enterprise;
  onSuccess: () => void;
  onCancel: () => void;
}

const getInitialFormData = (enterprise?: Enterprise) => ({
  name: enterprise?.name || '',
  registrationNumber: enterprise?.registrationNumber || '',
  vatNumber: enterprise?.vatNumber || '',
  countryCode: enterprise?.countryCode || 'FR',
  address: {
    street: enterprise?.address?.street || '',
    postalCode: enterprise?.address?.postalCode || '',
    city: enterprise?.address?.city || '',
    country: enterprise?.address?.country || 'France'
  },
  taxRegime: {
    type: enterprise?.taxRegime?.type || 'realNormal',
    vatPeriod: enterprise?.taxRegime?.vatPeriod || 'monthly'
  },
  fiscalYearStart: enterprise?.fiscalYearStart || 1,
  fiscalYearEnd: enterprise?.fiscalYearEnd || 12,
  currency: enterprise?.currency || 'EUR',
  settings: {
    defaultVATRate: enterprise?.settings?.defaultVATRate || '20',
    defaultPaymentTerms: enterprise?.settings?.defaultPaymentTerms || 30,
    taxReminderDays: enterprise?.settings?.taxReminderDays || 7,
    autoCalculateTax: enterprise?.settings?.autoCalculateTax ?? true,
    roundingRule: enterprise?.settings?.roundingRule || 'nearest',
    emailNotifications: enterprise?.settings?.emailNotifications ?? true,
    language: enterprise?.settings?.language || 'fr',
    timezone: enterprise?.settings?.timezone || 'Europe/Paris'
  }
});

export default function EnterpriseForm({ enterprise, onSuccess, onCancel }: EnterpriseFormProps) {
  const { addEnterprise, updateEnterprise } = useEnterprise();
  const { t } = useLocale();
  
  const [formData, setFormData] = useState(getInitialFormData(enterprise));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const validationRules = [
      { field: 'name', value: formData.name.trim(), key: 'enterprise.errors.nameRequired', defaultMsg: 'Le nom est requis' },
      { field: 'registrationNumber', value: formData.registrationNumber.trim(), key: 'enterprise.errors.registrationRequired', defaultMsg: 'Le numéro d\'immatriculation est requis' },
      { field: 'street', value: formData.address.street.trim(), key: 'enterprise.errors.streetRequired', defaultMsg: 'L\'adresse est requise' },
      { field: 'postalCode', value: formData.address.postalCode.trim(), key: 'enterprise.errors.postalCodeRequired', defaultMsg: 'Le code postal est requis' },
      { field: 'city', value: formData.address.city.trim(), key: 'enterprise.errors.cityRequired', defaultMsg: 'La ville est requise' }
    ];

    validationRules.forEach(rule => {
      if (!rule.value) {
        newErrors[rule.field] = t(rule.key, { defaultValue: rule.defaultMsg });
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildEnterpriseData = () => ({
    name: formData.name,
    registrationNumber: formData.registrationNumber,
    vatNumber: formData.vatNumber,
    countryCode: formData.countryCode,
    address: formData.address,
    taxRegime: {
      id: enterprise?.taxRegime?.id || Date.now().toString(),
      code: `${formData.countryCode}_${formData.taxRegime.type}`.toUpperCase(),
      name: getTaxRegimeName(formData.taxRegime.type),
      type: formData.taxRegime.type as 'realNormal' | 'realSimplified' | 'microEnterprise' | 'other',
      vatPeriod: formData.taxRegime.vatPeriod as 'none' | 'monthly' | 'quarterly' | 'yearly',
      corporateTaxRate: getCorporateTaxRate(formData.countryCode, formData.taxRegime.type),
      specialRules: []
    },
    fiscalYearStart: formData.fiscalYearStart,
    fiscalYearEnd: formData.fiscalYearEnd,
    currency: formData.currency,
    isActive: true,
    settings: formData.settings
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const enterpriseData = buildEnterpriseData();

      if (enterprise) {
        await updateEnterprise(enterprise.id, enterpriseData);
      } else {
        await addEnterprise(enterpriseData);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving enterprise:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getTaxRegimeName = (type: string) => {
    const names: Record<string, string> = {
      realNormal: 'Réel Normal',
      realSimplified: 'Réel Simplifié',
      microEnterprise: 'Micro-entreprise',
      other: 'Autre'
    };
    return names[type] || type;
  };

  const getCorporateTaxRate = (countryCode: string, regimeType: string) => {
    const rates: Record<string, Record<string, number>> = {
      FR: { realNormal: 25, realSimplified: 15, microEnterprise: 0 },
      BE: { realNormal: 25, realSimplified: 20, microEnterprise: 0 },
      CH: { realNormal: 14.6, realSimplified: 14.6, microEnterprise: 0 },
      LU: { realNormal: 17, realSimplified: 15, microEnterprise: 0 }
    };
    return rates[countryCode]?.[regimeType] || 25;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            {t('enterprise.tabs.general', { defaultValue: 'Général' })}
          </TabsTrigger>
          <TabsTrigger value="address" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {t('enterprise.tabs.address', { defaultValue: 'Adresse' })}
          </TabsTrigger>
          <TabsTrigger value="fiscal" className="flex items-center gap-2">
            <Landmark className="h-4 w-4" />
            {t('enterprise.tabs.fiscal', { defaultValue: 'Fiscal' })}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t('enterprise.tabs.settings', { defaultValue: 'Paramètres' })}
          </TabsTrigger>
        </TabsList>

        <GeneralTab formData={formData} errors={errors} handleInputChange={handleInputChange} t={t} />
        <AddressTab formData={formData} errors={errors} handleInputChange={handleInputChange} t={t} />
        <FiscalTab formData={formData} errors={errors} handleInputChange={handleInputChange} t={t} />
        <SettingsTab formData={formData} errors={errors} handleInputChange={handleInputChange} t={t} />
      </Tabs>

      <FormFooter 
        onCancel={onCancel}
        loading={loading}
        enterprise={enterprise}
        t={t}
      />
    </form>
  );
}

// Extract FormFooter component
interface FormFooterProps {
  onCancel: () => void;
  loading: boolean;
  enterprise?: Enterprise;
  t: (key: string, options?: { defaultValue: string }) => string;
}

function FormFooter({ onCancel, loading, enterprise, t }: FormFooterProps) {
  return (
    <div className="flex justify-end gap-4 pt-4 border-t">
      <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
        {t('common.cancel', { defaultValue: 'Annuler' })}
      </Button>
      <Button type="submit" disabled={loading}>
        {loading 
          ? t('common.saving', { defaultValue: 'Enregistrement...' }) 
          : enterprise 
            ? t('common.update', { defaultValue: 'Mettre à jour' }) 
            : t('common.create', { defaultValue: 'Créer' })
        }
      </Button>
    </div>
  );
}