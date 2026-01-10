import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { unifiedThirdPartiesService } from '@/services/unifiedThirdPartiesService';
import { Users, Building2 } from 'lucide-react';
import { logger } from '@/lib/logger';
interface ThirdPartyFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companyId: string;
  defaultType?: 'customer' | 'supplier';
}
export function ThirdPartyFormDialog({
  open,
  onClose,
  onSuccess,
  companyId,
  defaultType = 'customer'
}: ThirdPartyFormDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: defaultType,
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
    currency: 'EUR',
    notes: ''
  });
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
      // Reset form
      setFormData({
        type: defaultType,
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
        currency: 'EUR',
        notes: ''
      });
      onSuccess();
      onClose();
    } catch (error) {
      logger.error('ThirdPartyFormDialog', 'Error creating third party:', error instanceof Error ? error.message : String(error));
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le tiers',
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
            <span>Nouveau {formData.type === 'customer' ? 'Client' : 'Fournisseur'}</span>
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
                <Select
                  value={formData.billing_country}
                  onValueChange={(value) => setFormData({ ...formData, billing_country: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FR">France</SelectItem>
                    <SelectItem value="BE">Belgique</SelectItem>
                    <SelectItem value="CH">Suisse</SelectItem>
                    <SelectItem value="LU">Luxembourg</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="US">États-Unis</SelectItem>
                  </SelectContent>
                </Select>
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
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="USD">USD - Dollar</SelectItem>
                    <SelectItem value="GBP">GBP - Livre</SelectItem>
                    <SelectItem value="CHF">CHF - Franc suisse</SelectItem>
                    <SelectItem value="CAD">CAD - Dollar canadien</SelectItem>
                  </SelectContent>
                </Select>
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
              {loading ? 'Création en cours...' : 'Créer le tiers'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}