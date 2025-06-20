import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useLocale } from '@/contexts/LocaleContext';
import { useLocaleFormatter } from '@/hooks/useLocaleFormatter';
import { thirdPartiesService } from '@/services/thirdPartiesService';
import { countries } from '@/lib/formData';
import { Loader2 } from 'lucide-react';

const initialThirdPartyData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postal_code: '',
  country: 'FR',
  tax_number: '',
  is_active: true,
  type: 'CLIENT',
  notes: '',
  default_payment_terms: '',
  default_currency: 'EUR',
  website: '',
  contact_name: '',
};

export const ThirdPartyForm = ({ open, onOpenChange, thirdPartyData, currentEnterpriseId, type, onSave }) => {
  const { t } = useLocale();
  const { toast } = useToast();
  const [formData, setFormData] = useState(initialThirdPartyData);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { companyCurrency } = useLocaleFormatter();

  useEffect(() => {
    if (thirdPartyData) {
      setFormData({ 
        ...initialThirdPartyData, 
        ...thirdPartyData, 
        type: thirdPartyData.type || type,
        // Conversion explicite en booléen
        is_active: Boolean(thirdPartyData.is_active !== undefined ? thirdPartyData.is_active : true)
      });
    } else {
      setFormData({ 
        ...initialThirdPartyData, 
        type, 
        default_currency: companyCurrency || 'EUR',
        is_active: true // Valeur par défaut explicite
      });
    }
    setErrors({});
  }, [thirdPartyData, open, type, companyCurrency]);

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: inputType === 'checkbox' ? checked : value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleActiveStatusChange = (checked) => {
    console.log("Active status changed to:", checked);
    setFormData(prev => ({ 
      ...prev, 
      is_active: checked 
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('thirdParties.validation.nameRequired');
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('thirdParties.validation.emailInvalid');
    }
    if (formData.website && !/^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/.test(formData.website)) {
      newErrors.website = t('thirdParties.validation.websiteInvalid', { defaultValue: 'Format de site web invalide' });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      let result;
      const dataToSave = { ...formData };
      
      console.log("Saving third party with data:", dataToSave);
      
      if (formData.id) {
        result = await thirdPartiesService.updateThirdParty(formData.id, dataToSave);
      } else {
        result = await thirdPartiesService.createThirdParty(currentEnterpriseId, dataToSave);
      }
      
      if (result.error) throw result.error;
      
      toast({ 
        title: t('success'), 
        description: formData.id ? t('thirdParties.updateSuccess') : t('thirdParties.createSuccess') 
      });
      
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving third party:", error);
      toast({ 
        variant: 'destructive', 
        title: t('error'), 
        description: error.message || t('thirdParties.saveError') 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formData.id ? t('thirdParties.editTitle') : t('thirdParties.createTitle')} ({t(type === 'CLIENT' ? 'client' : 'supplier')})</DialogTitle>
          <DialogDescription>{t('thirdParties.formDescription')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">{t('thirdParties.name')}</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="email">{t('thirdParties.email')}</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">{t('thirdParties.phone')}</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="website">Site web</Label>
              <Input id="website" name="website" value={formData.website} onChange={handleChange} placeholder="https://example.com" />
              {errors.website && <p className="text-sm text-destructive mt-1">{errors.website}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_name">Contact principal</Label>
              <Input id="contact_name" name="contact_name" value={formData.contact_name} onChange={handleChange} placeholder="Nom du contact principal" />
            </div>
            <div>
              <Label htmlFor="tax_number">{t('thirdParties.taxNumber')}</Label>
              <Input id="tax_number" name="tax_number" value={formData.tax_number} onChange={handleChange} />
            </div>
          </div>
          <div>
            <Label htmlFor="address">{t('thirdParties.address')}</Label>
            <Input id="address" name="address" value={formData.address} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">{t('thirdParties.city')}</Label>
              <Input id="city" name="city" value={formData.city} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="postal_code">{t('thirdParties.postalCode')}</Label>
              <Input id="postal_code" name="postal_code" value={formData.postal_code} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="country">{t('thirdParties.country')}</Label>
              <Select name="country" value={formData.country} onValueChange={(value) => handleSelectChange('country', value)}>
                <SelectTrigger><SelectValue placeholder={t('thirdParties.selectCountry')} /></SelectTrigger>
                <SelectContent>
                  {countries.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="default_payment_terms">{t('thirdParties.paymentTerms')}</Label>
              <Select 
                value={formData.default_payment_terms} 
                onValueChange={(value) => handleSelectChange('default_payment_terms', value)}
              >
                <SelectTrigger id="default_payment_terms">
                  <SelectValue placeholder={t('thirdParties.paymentTermsPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15 jours">15 jours</SelectItem>
                  <SelectItem value="30 jours">30 jours</SelectItem>
                  <SelectItem value="45 jours">45 jours</SelectItem>
                  <SelectItem value="60 jours">60 jours</SelectItem>
                  <SelectItem value="30 jours fin de mois">30 jours fin de mois</SelectItem>
                  <SelectItem value="60 jours fin de mois">60 jours fin de mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="default_currency">{t('thirdParties.defaultCurrency')}</Label>
              <Select 
                value={formData.default_currency} 
                onValueChange={(value) => handleSelectChange('default_currency', value)}
              >
                <SelectTrigger id="default_currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="USD">USD - Dollar américain</SelectItem>
                  <SelectItem value="GBP">GBP - Livre sterling</SelectItem>
                  <SelectItem value="CHF">CHF - Franc suisse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="notes">{t('thirdParties.notes')}</Label>
            <Textarea 
              id="notes" 
              name="notes" 
              value={formData.notes} 
              onChange={handleChange} 
              placeholder={t('thirdParties.notesPlaceholder')}
              className="min-h-[100px]"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              id="is_active" 
              checked={formData.is_active}
              onCheckedChange={handleActiveStatusChange}
            />
            <Label htmlFor="is_active">
              {t('status')} {formData.is_active ? '(Actif)' : '(Inactif)'}
            </Label>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">{t('cancel')}</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};