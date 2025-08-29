import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useEnterprise } from '@/contexts/EnterpriseContext';
import { useLocale } from '@/contexts/LocaleContext';
import { Enterprise } from '@/types/enterprise.types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, MapPin, Landmark, Settings } from 'lucide-react';

interface EnterpriseFormProps {
  enterprise?: Enterprise;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EnterpriseForm({ enterprise, onSuccess, onCancel }: EnterpriseFormProps) {
  const { addEnterprise, updateEnterprise } = useEnterprise();
  const { t } = useLocale();
  
  const [formData, setFormData] = useState({
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

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('enterprise.errors.nameRequired', { defaultValue: 'Le nom est requis' });
    }
    if (!formData.registrationNumber.trim()) {
      newErrors.registrationNumber = t('enterprise.errors.registrationRequired', { defaultValue: 'Le numéro d\'immatriculation est requis' });
    }
    if (!formData.address.street.trim()) {
      newErrors.street = t('enterprise.errors.streetRequired', { defaultValue: 'L\'adresse est requise' });
    }
    if (!formData.address.postalCode.trim()) {
      newErrors.postalCode = t('enterprise.errors.postalCodeRequired', { defaultValue: 'Le code postal est requis' });
    }
    if (!formData.address.city.trim()) {
      newErrors.city = t('enterprise.errors.cityRequired', { defaultValue: 'La ville est requise' });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const enterpriseData = {
        name: formData.name,
        registrationNumber: formData.registrationNumber,
        vatNumber: formData.vatNumber,
        countryCode: formData.countryCode,
        address: formData.address,
        taxRegime: {
          id: enterprise?.taxRegime?.id || Date.now().toString(),
          code: `${formData.countryCode}_${formData.taxRegime.type}`.toUpperCase(),
          name: getTaxRegimeName(formData.taxRegime.type),
          type: formData.taxRegime.type as any,
          vatPeriod: formData.taxRegime.vatPeriod as any,
          corporateTaxRate: getCorporateTaxRate(formData.countryCode, formData.taxRegime.type),
          specialRules: []
        },
        fiscalYearStart: formData.fiscalYearStart,
        fiscalYearEnd: formData.fiscalYearEnd,
        currency: formData.currency,
        isActive: true,
        settings: formData.settings
      };

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

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
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
    const names = {
      realNormal: 'Réel Normal',
      realSimplified: 'Réel Simplifié',
      microEnterprise: 'Micro-entreprise',
      other: 'Autre'
    };
    return names[type] || type;
  };

  const getCorporateTaxRate = (countryCode: string, regimeType: string) => {
    const rates = {
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

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('enterprise.generalInfo', { defaultValue: 'Informations générales' })}</CardTitle>
              <CardDescription>
                {t('enterprise.generalInfoDesc', { defaultValue: 'Informations de base de votre entreprise' })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">{t('enterprise.name', { defaultValue: 'Nom de l\'entreprise' })} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="registrationNumber">{t('enterprise.registrationNumber', { defaultValue: 'N° d\'immatriculation' })} *</Label>
                  <Input
                    id="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                    placeholder="SIRET, numéro d'entreprise..."
                    className={errors.registrationNumber ? 'border-destructive' : ''}
                  />
                  {errors.registrationNumber && <p className="text-sm text-destructive mt-1">{errors.registrationNumber}</p>}
                </div>
                <div>
                  <Label htmlFor="vatNumber">{t('enterprise.vatNumber', { defaultValue: 'N° TVA intracommunautaire' })}</Label>
                  <Input
                    id="vatNumber"
                    value={formData.vatNumber}
                    onChange={(e) => handleInputChange('vatNumber', e.target.value)}
                    placeholder="FR12345678901"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country">{t('enterprise.country', { defaultValue: 'Pays' })} *</Label>
                  <Select value={formData.countryCode} onValueChange={(value) => handleInputChange('countryCode', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FR">🇫🇷 France</SelectItem>
                      <SelectItem value="BE">🇧🇪 Belgique</SelectItem>
                      <SelectItem value="CH">🇨🇭 Suisse</SelectItem>
                      <SelectItem value="LU">🇱🇺 Luxembourg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currency">{t('enterprise.currency', { defaultValue: 'Devise' })}</Label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="CHF">CHF (Fr.)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="address" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('enterprise.addressInfo', { defaultValue: 'Adresse' })}</CardTitle>
              <CardDescription>
                {t('enterprise.addressInfoDesc', { defaultValue: 'Adresse du siège social' })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="street">{t('enterprise.street', { defaultValue: 'Rue' })} *</Label>
                <Input
                  id="street"
                  value={formData.address.street}
                  onChange={(e) => handleInputChange('address.street', e.target.value)}
                  className={errors.street ? 'border-destructive' : ''}
                />
                {errors.street && <p className="text-sm text-destructive mt-1">{errors.street}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postalCode">{t('enterprise.postalCode', { defaultValue: 'Code postal' })} *</Label>
                  <Input
                    id="postalCode"
                    value={formData.address.postalCode}
                    onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
                    className={errors.postalCode ? 'border-destructive' : ''}
                  />
                  {errors.postalCode && <p className="text-sm text-destructive mt-1">{errors.postalCode}</p>}
                </div>
                <div>
                  <Label htmlFor="city">{t('enterprise.city', { defaultValue: 'Ville' })} *</Label>
                  <Input
                    id="city"
                    value={formData.address.city}
                    onChange={(e) => handleInputChange('address.city', e.target.value)}
                    className={errors.city ? 'border-destructive' : ''}
                  />
                  {errors.city && <p className="text-sm text-destructive mt-1">{errors.city}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="addressCountry">{t('enterprise.country', { defaultValue: 'Pays' })}</Label>
                <Input
                  id="addressCountry"
                  value={formData.address.country}
                  onChange={(e) => handleInputChange('address.country', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fiscal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('enterprise.fiscalInfo', { defaultValue: 'Informations fiscales' })}</CardTitle>
              <CardDescription>
                {t('enterprise.fiscalInfoDesc', { defaultValue: 'Régime fiscal et année comptable' })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="taxRegime">{t('enterprise.taxRegime', { defaultValue: 'Régime fiscal' })}</Label>
                <Select 
                  value={formData.taxRegime.type} 
                  onValueChange={(value) => handleInputChange('taxRegime.type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realNormal">{t('enterprise.regimes.realNormal', { defaultValue: 'Réel Normal' })}</SelectItem>
                    <SelectItem value="realSimplified">{t('enterprise.regimes.realSimplified', { defaultValue: 'Réel Simplifié' })}</SelectItem>
                    <SelectItem value="microEnterprise">{t('enterprise.regimes.microEnterprise', { defaultValue: 'Micro-entreprise' })}</SelectItem>
                    <SelectItem value="other">{t('enterprise.regimes.other', { defaultValue: 'Autre' })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="vatPeriod">{t('enterprise.vatPeriod', { defaultValue: 'Périodicité TVA' })}</Label>
                <Select 
                  value={formData.taxRegime.vatPeriod} 
                  onValueChange={(value) => handleInputChange('taxRegime.vatPeriod', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">{t('enterprise.periods.monthly', { defaultValue: 'Mensuelle' })}</SelectItem>
                    <SelectItem value="quarterly">{t('enterprise.periods.quarterly', { defaultValue: 'Trimestrielle' })}</SelectItem>
                    <SelectItem value="yearly">{t('enterprise.periods.yearly', { defaultValue: 'Annuelle' })}</SelectItem>
                    <SelectItem value="none">{t('enterprise.periods.none', { defaultValue: 'Non assujetti' })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fiscalYearStart">{t('enterprise.fiscalYearStart', { defaultValue: 'Début exercice fiscal' })}</Label>
                  <Select 
                    value={formData.fiscalYearStart.toString()} 
                    onValueChange={(value) => handleInputChange('fiscalYearStart', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <SelectItem key={month} value={month.toString()}>
                          {new Date(2000, month - 1).toLocaleString('fr', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fiscalYearEnd">{t('enterprise.fiscalYearEnd', { defaultValue: 'Fin exercice fiscal' })}</Label>
                  <Select 
                    value={formData.fiscalYearEnd.toString()} 
                    onValueChange={(value) => handleInputChange('fiscalYearEnd', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <SelectItem key={month} value={month.toString()}>
                          {new Date(2000, month - 1).toLocaleString('fr', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('enterprise.settings', { defaultValue: 'Paramètres' })}</CardTitle>
              <CardDescription>
                {t('enterprise.settingsDesc', { defaultValue: 'Préférences et configuration' })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="defaultVATRate">{t('enterprise.defaultVATRate', { defaultValue: 'Taux TVA par défaut' })}</Label>
                  <Input
                    id="defaultVATRate"
                    type="number"
                    step="0.1"
                    value={formData.settings.defaultVATRate}
                    onChange={(e) => handleInputChange('settings.defaultVATRate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="defaultPaymentTerms">{t('enterprise.defaultPaymentTerms', { defaultValue: 'Délai de paiement (jours)' })}</Label>
                  <Input
                    id="defaultPaymentTerms"
                    type="number"
                    value={formData.settings.defaultPaymentTerms}
                    onChange={(e) => handleInputChange('settings.defaultPaymentTerms', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="taxReminderDays">{t('enterprise.taxReminderDays', { defaultValue: 'Rappel échéances fiscales (jours avant)' })}</Label>
                <Input
                  id="taxReminderDays"
                  type="number"
                  value={formData.settings.taxReminderDays}
                  onChange={(e) => handleInputChange('settings.taxReminderDays', parseInt(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="roundingRule">{t('enterprise.roundingRule', { defaultValue: 'Règle d\'arrondi' })}</Label>
                <Select 
                  value={formData.settings.roundingRule} 
                  onValueChange={(value) => handleInputChange('settings.roundingRule', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="up">{t('enterprise.rounding.up', { defaultValue: 'Arrondir au supérieur' })}</SelectItem>
                    <SelectItem value="down">{t('enterprise.rounding.down', { defaultValue: 'Arrondir à l\'inférieur' })}</SelectItem>
                    <SelectItem value="nearest">{t('enterprise.rounding.nearest', { defaultValue: 'Au plus proche' })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('enterprise.autoCalculateTax', { defaultValue: 'Calcul automatique des taxes' })}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('enterprise.autoCalculateTaxDesc', { defaultValue: 'Calculer automatiquement les taxes sur les factures' })}
                    </p>
                  </div>
                  <Switch
                    checked={formData.settings.autoCalculateTax}
                    onCheckedChange={(checked) => handleInputChange('settings.autoCalculateTax', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('enterprise.emailNotifications', { defaultValue: 'Notifications par email' })}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('enterprise.emailNotificationsDesc', { defaultValue: 'Recevoir des rappels pour les échéances fiscales' })}
                    </p>
                  </div>
                  <Switch
                    checked={formData.settings.emailNotifications}
                    onCheckedChange={(checked) => handleInputChange('settings.emailNotifications', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {t('common.cancel', { defaultValue: 'Annuler' })}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? t('common.saving', { defaultValue: 'Enregistrement...' }) : (enterprise ? t('common.update', { defaultValue: 'Mettre à jour' }) : t('common.create', { defaultValue: 'Créer' }))}
        </Button>
      </div>
    </form>
  );
}