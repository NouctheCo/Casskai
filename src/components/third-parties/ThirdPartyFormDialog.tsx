import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { unifiedThirdPartiesService } from '@/services/unifiedThirdPartiesService';
import { supabase } from '@/lib/supabase';
import { Users, Building2 } from 'lucide-react';
import { logger } from '@/lib/logger';
import { getCurrentCompanyCurrency } from '@/lib/utils';
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

// Devises principales groupées par zone
const CURRENCIES = [
  // Zone Euro
  { code: 'EUR', name: 'Euro', symbol: '€', region: 'Zone Euro' },
  // Afrique FCFA (priorité stratégique)
  { code: 'XOF', name: 'Franc CFA (BCEAO)', symbol: 'FCFA', region: 'Afrique de l\'Ouest' },
  { code: 'XAF', name: 'Franc CFA (BEAC)', symbol: 'FCFA', region: 'Afrique Centrale' },
  // Afrique autres
  { code: 'DZD', name: 'Dinar algérien', symbol: 'DA', region: 'Afrique du Nord' },
  { code: 'MAD', name: 'Dirham marocain', symbol: 'MAD', region: 'Afrique du Nord' },
  { code: 'ZAR', name: 'Rand sud-africain', symbol: 'R', region: 'Afrique Australe' },
  { code: 'NGN', name: 'Naira nigérian', symbol: '₦', region: 'Afrique de l\'Ouest' },
  { code: 'GHS', name: 'Cedi ghanéen', symbol: 'GH₵', region: 'Afrique de l\'Ouest' },
  { code: 'KES', name: 'Shilling kenyan', symbol: 'KSh', region: 'Afrique de l\'Est' },
  { code: 'EGP', name: 'Livre égyptienne', symbol: 'E£', region: 'Afrique du Nord' },
  // Amériques
  { code: 'USD', name: 'Dollar américain', symbol: '$', region: 'Amérique du Nord' },
  { code: 'CAD', name: 'Dollar canadien', symbol: 'CA$', region: 'Amérique du Nord' },
  { code: 'BRL', name: 'Real brésilien', symbol: 'R$', region: 'Amérique du Sud' },
  // Europe
  { code: 'GBP', name: 'Livre sterling', symbol: '£', region: 'Europe' },
  { code: 'CHF', name: 'Franc suisse', symbol: 'CHF', region: 'Europe' },
  // Asie & Moyen-Orient
  { code: 'CNY', name: 'Yuan chinois', symbol: '¥', region: 'Asie' },
  { code: 'JPY', name: 'Yen japonais', symbol: '¥', region: 'Asie' },
  { code: 'AED', name: 'Dirham des EAU', symbol: 'AED', region: 'Moyen-Orient' },
  { code: 'SAR', name: 'Riyal saoudien', symbol: 'SR', region: 'Moyen-Orient' },
];

interface ThirdPartyFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companyId: string;
  defaultType?: 'customer' | 'supplier';
  thirdParty?: { id: string; type: string; name: string; email?: string; phone?: string; company_name?: string; tax_number?: string; billing_address?: { street: string; city: string; postal_code: string; country: string }; payment_terms: number; currency: string; notes?: string } | null;
}

const emptyForm = (type: 'customer' | 'supplier') => ({
  type,
  name: '',
  email: '',
  phone: '',
  company_name: '',
  tax_number: '',
  billing_address_line1: '',
  billing_city: '',
  billing_postal_code: '',
  billing_country: 'FR',
  payment_terms: 30,
  currency: getCurrentCompanyCurrency(),
  notes: ''
});

export function ThirdPartyFormDialog({
  open,
  onClose,
  onSuccess,
  companyId,
  defaultType = 'customer',
  thirdParty
}: ThirdPartyFormDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const isEditMode = !!thirdParty;
  const [formData, setFormData] = useState(emptyForm(defaultType));

  useEffect(() => {
    if (thirdParty) {
      setFormData({
        type: (thirdParty.type as 'customer' | 'supplier') || defaultType,
        name: thirdParty.name || '',
        email: thirdParty.email || '',
        phone: thirdParty.phone || '',
        company_name: thirdParty.company_name || '',
        tax_number: thirdParty.tax_number || '',
        billing_address_line1: thirdParty.billing_address?.street || '',
        billing_city: thirdParty.billing_address?.city || '',
        billing_postal_code: thirdParty.billing_address?.postal_code || '',
        billing_country: thirdParty.billing_address?.country || 'FR',
        payment_terms: thirdParty.payment_terms || 30,
        currency: thirdParty.currency || getCurrentCompanyCurrency(),
        notes: thirdParty.notes || ''
      });
    } else {
      setFormData(emptyForm(defaultType));
    }
  }, [thirdParty, defaultType]);

  // Options autocomplete pour pays (195+ pays avec fuzzy search)
  const countryOptions: AutocompleteOption[] = useMemo(() => {
    return COUNTRIES.map(country => ({
      value: country.code,
      label: country.name,
      description: country.code,
      category: country.region,
      metadata: { code: country.code, name: country.name, region: country.region }
    }));
  }, []);

  // Options autocomplete pour devises (groupées par zone)
  const currencyOptions: AutocompleteOption[] = useMemo(() => {
    return CURRENCIES.map(currency => ({
      value: currency.code,
      label: `${currency.code} - ${currency.name}`,
      description: `${currency.symbol}`,
      category: currency.region,
      metadata: { code: currency.code, name: currency.name, symbol: currency.symbol, region: currency.region }
    }));
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom est obligatoire',
        variant: 'destructive'
      });
      return;
    }
    setLoading(true);
    try {
      if (isEditMode && thirdParty) {
        // Update existing third party
        const { error } = await supabase
          .from('third_parties')
          .update({
            name: formData.name.trim(),
            email: formData.email.trim() || null,
            phone: formData.phone.trim() || null,
            company_name: formData.company_name.trim() || null,
            tax_number: formData.tax_number.trim() || null,
            billing_address_line1: formData.billing_address_line1.trim() || null,
            billing_city: formData.billing_city.trim() || null,
            billing_postal_code: formData.billing_postal_code.trim() || null,
            billing_country: formData.billing_country,
            payment_terms: formData.payment_terms,
            currency: formData.currency,
            notes: formData.notes.trim() || null,
            type: formData.type,
            updated_at: new Date().toISOString()
          })
          .eq('id', thirdParty.id);
        if (error) throw error;
        toast({
          title: 'Succès',
          description: `${formData.type === 'customer' ? 'Client' : 'Fournisseur'} mis à jour avec succès`
        });
      } else {
        // Create new third party
        const data = {
          company_id: companyId,
          name: formData.name.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          company_name: formData.company_name.trim() || undefined,
          tax_number: formData.tax_number.trim() || undefined,
          billing_address_line1: formData.billing_address_line1.trim() || undefined,
          billing_city: formData.billing_city.trim() || undefined,
          billing_postal_code: formData.billing_postal_code.trim() || undefined,
          billing_country: formData.billing_country,
          payment_terms: formData.payment_terms,
          currency: formData.currency,
          notes: formData.notes.trim() || undefined
        };
        let result;
        if (formData.type === 'customer') {
          result = await unifiedThirdPartiesService.createCustomer(data);
        } else {
          result = await unifiedThirdPartiesService.createSupplier(data);
        }
        if (result.error) throw result.error;
        toast({
          title: 'Succès',
          description: `${formData.type === 'customer' ? 'Client' : 'Fournisseur'} créé avec succès`
        });
      }
      // Reset form
      setFormData(emptyForm(defaultType));
      onSuccess();
      onClose();
    } catch (error) {
      logger.error('ThirdPartyFormDialog', `Error ${isEditMode ? 'updating' : 'creating'} third party:`, error instanceof Error ? error.message : String(error));
      toast({
        title: 'Erreur',
        description: `Impossible de ${isEditMode ? 'modifier' : 'créer'} le tiers`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {formData.type === 'customer' ? (
              <Users className="w-5 h-5 text-blue-500" />
            ) : (
              <Building2 className="w-5 h-5 text-green-500" />
            )}
            <span>{isEditMode ? 'Modifier' : 'Nouveau'} {formData.type === 'customer' ? 'Client' : 'Fournisseur'}</span>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selection */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <Label htmlFor="type">Type de tiers *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'customer' | 'supplier') =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Client</span>
                  </div>
                </SelectItem>
                <SelectItem value="supplier">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span>Fournisseur</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
              Informations générales
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="name">Nom / Raison sociale *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Dupont SARL"
                  required
                  className="mt-1"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="company_name">Nom commercial</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Ex: Dupont & Fils"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+33 1 23 45 67 89"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="tax_number">Numéro de TVA</Label>
              <Input
                id="tax_number"
                value={formData.tax_number}
                onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                placeholder="FR12345678901"
                className="mt-1"
              />
            </div>
          </div>
          {/* Address */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
              Adresse de facturation
            </h3>
            <div>
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={formData.billing_address_line1}
                onChange={(e) => setFormData({ ...formData, billing_address_line1: e.target.value })}
                placeholder="123 Rue de la Paix"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={formData.billing_city}
                  onChange={(e) => setFormData({ ...formData, billing_city: e.target.value })}
                  placeholder="Paris"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="postal_code">Code postal</Label>
                <Input
                  id="postal_code"
                  value={formData.billing_postal_code}
                  onChange={(e) => setFormData({ ...formData, billing_postal_code: e.target.value })}
                  placeholder="75001"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="country">Pays</Label>
                <SmartAutocomplete
                  value={formData.billing_country}
                  onChange={(value) => setFormData({ ...formData, billing_country: value })}
                  options={countryOptions}
                  placeholder="Sélectionner un pays..."
                  searchPlaceholder="Rechercher un pays (ex: Côte d'Ivoire, France, Sénégal)..."
                  groups={true}
                  showRecent={true}
                  maxRecent={5}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          {/* Commercial Terms */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
              Conditions commerciales
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payment_terms">Délai de paiement (jours)</Label>
                <Input
                  id="payment_terms"
                  type="number"
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: parseInt(e.target.value) || 30 })}
                  min="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="currency">Devise</Label>
                <SmartAutocomplete
                  value={formData.currency}
                  onChange={(value) => setFormData({ ...formData, currency: value })}
                  options={currencyOptions}
                  placeholder="Sélectionner une devise..."
                  searchPlaceholder="Rechercher une devise (EUR, FCFA, USD)..."
                  groups={true}
                  showRecent={true}
                  maxRecent={3}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes internes..."
              rows={3}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim()}>
              {loading ? (isEditMode ? 'Mise à jour...' : 'Création en cours...') : (isEditMode ? 'Enregistrer' : 'Créer le tiers')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}