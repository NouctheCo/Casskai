/**
 * Modal de création/édition de formation
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { TrainingCatalog, TrainingCategory } from '@/types/hr-training.types';

interface TrainingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<boolean>;
  training?: TrainingCatalog | null;
}

export function TrainingFormModal({
  isOpen,
  onClose,
  onSubmit,
  training
}: TrainingFormModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'technical' as TrainingCategory,
    duration_hours: '',
    cost_per_participant: '',
    currency: 'EUR',
    max_participants: '',
    prerequisites: '',
    objectives: '',
    provider: '',
    is_mandatory: false,
    is_internal: true,
    is_certified: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (training) {
      setFormData({
        title: training.title,
        description: training.description || '',
        category: training.category,
        duration_hours: training.duration_hours?.toString() || '',
        cost_per_participant: training.cost_per_participant?.toString() || '',
        currency: training.currency || 'EUR',
        max_participants: training.max_participants?.toString() || '',
        prerequisites: training.prerequisites || '',
        objectives: Array.isArray(training.objectives) ? training.objectives.join(', ') : (training.objectives || ''),
        provider: training.provider || '',
        is_mandatory: training.is_mandatory || false,
        is_internal: training.is_internal ?? true,
        is_certified: training.is_certified || false
      });
    }
  }, [training]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Titre requis';
    if (!formData.duration_hours) newErrors.duration_hours = 'Durée requise';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        duration_hours: parseFloat(formData.duration_hours),
        cost_per_participant: formData.cost_per_participant ? parseFloat(formData.cost_per_participant) : null,
        currency: formData.currency,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        prerequisites: formData.prerequisites.trim() || null,
        objectives: formData.objectives.trim() || null,
        provider: formData.provider.trim() || null,
        is_mandatory: formData.is_mandatory,
        is_internal: formData.is_internal,
        is_certified: formData.is_certified
      };

      const success = await onSubmit(submitData);
      if (success) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 dark:text-gray-100">
            {training ? 'Modifier la formation' : 'Nouvelle formation'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Titre */}
          <div>
            <Label htmlFor="title">Titre de la formation *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Formation React Avancée"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Description de la formation..."
            />
          </div>

          {/* Catégorie et Durée */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Catégorie *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as TrainingCategory })}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technique</SelectItem>
                  <SelectItem value="soft_skills">Soft Skills</SelectItem>
                  <SelectItem value="leadership">Leadership</SelectItem>
                  <SelectItem value="compliance">Conformité</SelectItem>
                  <SelectItem value="sales">Vente</SelectItem>
                  <SelectItem value="management">Management</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration_hours">Durée (heures) *</Label>
              <Input
                id="duration_hours"
                type="number"
                step="0.5"
                min="0"
                value={formData.duration_hours}
                onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                placeholder="Ex: 8"
                className={errors.duration_hours ? 'border-red-500' : ''}
              />
              {errors.duration_hours && (
                <p className="text-red-500 text-sm mt-1">{errors.duration_hours}</p>
              )}
            </div>
          </div>

          {/* Coût et Participants */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cost_per_participant">Coût par participant</Label>
              <div className="flex gap-2">
                <Input
                  id="cost_per_participant"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_per_participant}
                  onChange={(e) => setFormData({ ...formData, cost_per_participant: e.target.value })}
                  placeholder="Ex: 500"
                  className="flex-1"
                />
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="max_participants">Nombre max. de participants</Label>
              <Input
                id="max_participants"
                type="number"
                min="1"
                value={formData.max_participants}
                onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                placeholder="Ex: 12"
              />
            </div>
          </div>

          {/* Fournisseur */}
          <div>
            <Label htmlFor="provider">Organisme de formation</Label>
            <Input
              id="provider"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              placeholder="Nom du prestataire externe"
            />
          </div>

          {/* Prérequis */}
          <div>
            <Label htmlFor="prerequisites">Prérequis</Label>
            <Textarea
              id="prerequisites"
              value={formData.prerequisites}
              onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
              rows={2}
              placeholder="Connaissances ou compétences requises..."
            />
          </div>

          {/* Objectifs */}
          <div>
            <Label htmlFor="objectives">Objectifs pédagogiques</Label>
            <Textarea
              id="objectives"
              value={formData.objectives}
              onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
              rows={3}
              placeholder="Ce que les participants apprendront..."
            />
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_mandatory"
                checked={formData.is_mandatory}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_mandatory: checked as boolean })
                }
              />
              <Label htmlFor="is_mandatory" className="cursor-pointer font-normal">
                Formation obligatoire
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_internal"
                checked={formData.is_internal}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_internal: checked as boolean })
                }
              />
              <Label htmlFor="is_internal" className="cursor-pointer font-normal">
                Formation interne (en interne à l'entreprise)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_certified"
                checked={formData.is_certified}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_certified: checked as boolean })
                }
              />
              <Label htmlFor="is_certified" className="cursor-pointer font-normal">
                Délivre une certification
              </Label>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Enregistrement...' : training ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
