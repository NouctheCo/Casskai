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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

import { projectResourcesService, type CreateResourceInput } from '@/services/projectResourcesService';

export interface ResourceAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projects: Array<{ id: string; name: string }>;
  users: Array<{ id: string; email: string; name?: string }>;
}

interface ResourceFormData {
  project_id: string;
  user_id: string;
  role: string;
  allocation_percentage: number;
  start_date: string;
  end_date: string;
  hourly_rate: number;
}

const ResourceAllocationModal: React.FC<ResourceAllocationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projects,
  users
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ResourceFormData>({
    project_id: '',
    user_id: '',
    role: '',
    allocation_percentage: 100,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    hourly_rate: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof ResourceFormData, value: any) => {
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

    if (!formData.project_id) {
      newErrors.project_id = t('projects.resourceModal.errorProject', 'Le projet est requis');
    }
    if (!formData.user_id) {
      newErrors.user_id = t('projects.resourceModal.errorUser', 'L\'utilisateur est requis');
    }
    if (formData.allocation_percentage < 1 || formData.allocation_percentage > 100) {
      newErrors.allocation_percentage = t('projects.resourceModal.errorAllocation', 'L\'allocation doit être entre 1 et 100%');
    }
    if (!formData.start_date) {
      newErrors.start_date = t('projects.resourceModal.errorStartDate', 'La date de début est requise');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const resourceData: CreateResourceInput = {
        project_id: formData.project_id,
        user_id: formData.user_id,
        role: formData.role || undefined,
        allocation_percentage: formData.allocation_percentage,
        start_date: formData.start_date,
        end_date: formData.end_date || undefined,
        hourly_rate: formData.hourly_rate > 0 ? formData.hourly_rate : undefined
      };

      await projectResourcesService.createResource(resourceData);

      // Réinitialiser le formulaire
      setFormData({
        project_id: '',
        user_id: '',
        role: '',
        allocation_percentage: 100,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        hourly_rate: 0
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating resource allocation:', err);
      if (err?.message?.includes('duplicate key')) {
        setError(t('projects.resourceModal.errorDuplicate', 'Cette ressource est déjà allouée à ce projet'));
      } else {
        setError(t('projects.resourceModal.errorCreating', 'Erreur lors de l\'allocation de la ressource'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('projects.resourceModal.title', 'Allouer une ressource')}</DialogTitle>
          <DialogDescription>
            {t('projects.resourceModal.description', 'Assigner un utilisateur à un projet avec un taux d\'allocation')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Projet */}
          <div className="space-y-2">
            <Label htmlFor="project_id">
              {t('projects.resourceModal.project', 'Projet')} <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.project_id} onValueChange={(value) => handleInputChange('project_id', value)}>
              <SelectTrigger className={errors.project_id ? 'border-red-500' : ''}>
                <SelectValue placeholder={t('projects.resourceModal.projectPlaceholder', 'Sélectionner un projet')} />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.project_id && (
              <p className="text-sm text-red-600">{errors.project_id}</p>
            )}
          </div>

          {/* Utilisateur */}
          <div className="space-y-2">
            <Label htmlFor="user_id">
              {t('projects.resourceModal.user', 'Utilisateur')} <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.user_id} onValueChange={(value) => handleInputChange('user_id', value)}>
              <SelectTrigger className={errors.user_id ? 'border-red-500' : ''}>
                <SelectValue placeholder={t('projects.resourceModal.userPlaceholder', 'Sélectionner un utilisateur')} />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.user_id && (
              <p className="text-sm text-red-600">{errors.user_id}</p>
            )}
          </div>

          {/* Rôle */}
          <div className="space-y-2">
            <Label htmlFor="role">
              {t('projects.resourceModal.role', 'Rôle')} {t('common.optional', '(optionnel)')}
            </Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              placeholder={t('projects.resourceModal.rolePlaceholder', 'Ex: Développeur, Chef de projet')}
            />
          </div>

          {/* Allocation et taux horaire */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="allocation_percentage">
                {t('projects.resourceModal.allocation', 'Allocation (%)')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="allocation_percentage"
                type="number"
                min="1"
                max="100"
                value={formData.allocation_percentage}
                onChange={(e) => handleInputChange('allocation_percentage', parseInt(e.target.value))}
                placeholder="100"
                className={errors.allocation_percentage ? 'border-red-500' : ''}
              />
              {errors.allocation_percentage && (
                <p className="text-sm text-red-600">{errors.allocation_percentage}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">
                {t('projects.resourceModal.hourlyRate', 'Taux horaire')} {t('common.optional', '(optionnel)')}
              </Label>
              <Input
                id="hourly_rate"
                type="number"
                step="0.01"
                min="0"
                value={formData.hourly_rate}
                onChange={(e) => handleInputChange('hourly_rate', parseFloat(e.target.value))}
                placeholder="50.00"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">
                {t('projects.resourceModal.startDate', 'Date de début')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                className={errors.start_date ? 'border-red-500' : ''}
              />
              {errors.start_date && (
                <p className="text-sm text-red-600">{errors.start_date}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">
                {t('projects.resourceModal.endDate', 'Date de fin')} {t('common.optional', '(optionnel)')}
              </Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
              />
            </div>
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
              {t('projects.resourceModal.allocate', 'Allouer la ressource')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ResourceAllocationModal;
