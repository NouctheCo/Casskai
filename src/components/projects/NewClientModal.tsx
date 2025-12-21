/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { crmService } from '@/services/crmService';

export interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (clientId: string) => void;
}

interface ClientFormData {
  company_name: string;
  industry: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  website: string;
  notes: string;
}

const NewClientModal: React.FC<NewClientModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { currentCompany } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ClientFormData>({
    company_name: '',
    industry: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'FR',
    website: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.company_name.trim()) {
      newErrors.company_name = t('projects.clientModal.errorCompanyName', 'Le nom de l\'entreprise est requis');
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
      // Utiliser le service CRM pour créer un client (type = client)
      const response = await crmService.createClient(currentCompany.id, {
        company_name: formData.company_name,
        industry: formData.industry,
        size: undefined,
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
        setFormData({
          company_name: '',
          industry: '',
          address: '',
          city: '',
          postal_code: '',
          country: 'FR',
          website: '',
          notes: ''
        });
        onClose();
      } else {
        const errorMessage = typeof response.error === 'string'
          ? response.error
          : response.error?.message || t('projects.clientModal.errorCreating', 'Erreur lors de la création du client');
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error creating client:', err);
      setError(t('projects.clientModal.errorCreating', 'Erreur lors de la création du client'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('projects.clientModal.title', 'Nouveau client')}</DialogTitle>
          <DialogDescription>
            {t('projects.clientModal.description', 'Créer un nouveau client pour le projet')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom de l'entreprise */}
          <div className="space-y-2">
            <Label htmlFor="company_name">
              {t('projects.clientModal.companyName', 'Nom de l\'entreprise')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              placeholder={t('projects.clientModal.companyNamePlaceholder', 'Ex: Entreprise ABC')}
              className={errors.company_name ? 'border-red-500' : ''}
            />
            {errors.company_name && (
              <p className="text-sm text-red-600">{errors.company_name}</p>
            )}
          </div>

          {/* Secteur */}
          <div className="space-y-2">
            <Label htmlFor="industry">
              {t('projects.clientModal.industry', 'Secteur d\'activité')}
            </Label>
            <Input
              id="industry"
              value={formData.industry}
              onChange={(e) => handleInputChange('industry', e.target.value)}
              placeholder={t('projects.clientModal.industryPlaceholder', 'Ex: Technologie, Commerce, etc.')}
            />
          </div>

          {/* Adresse */}
          <div className="space-y-2">
            <Label htmlFor="address">
              {t('projects.clientModal.address', 'Adresse')}
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder={t('projects.clientModal.addressPlaceholder', '123 Rue de la Paix')}
            />
          </div>

          {/* Ville / Code postal */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">
                {t('projects.clientModal.city', 'Ville')}
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder={t('projects.clientModal.cityPlaceholder', 'Paris')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">
                {t('projects.clientModal.postalCode', 'Code postal')}
              </Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                placeholder={t('projects.clientModal.postalCodePlaceholder', '75001')}
              />
            </div>
          </div>

          {/* Site web */}
          <div className="space-y-2">
            <Label htmlFor="website">
              {t('projects.clientModal.website', 'Site web')}
            </Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder={t('projects.clientModal.websitePlaceholder', 'https://example.com')}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              {t('projects.clientModal.notes', 'Notes')}
            </Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder={t('projects.clientModal.notesPlaceholder', 'Informations complémentaires')}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {t('common.cancel', 'Annuler')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('projects.clientModal.create', 'Créer le client')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewClientModal;
