/**
 * Modal de création/édition d'objectif
 */

import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Objective, KeyResult } from '@/types/hr-performance.types';

interface ObjectiveFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<boolean>;
  employees: Array<{ id: string; first_name: string; last_name: string }>;
  objective?: Objective | null;
}

export function ObjectiveFormModal({
  isOpen,
  onClose,
  onSubmit,
  employees,
  objective
}: ObjectiveFormModalProps) {
  const [formData, setFormData] = useState({
    employee_id: '',
    title: '',
    description: '',
    type: 'smart' as 'okr' | 'smart' | 'kpi' | 'project',
    start_date: '',
    due_date: '',
    target_value: '',
    unit: '',
    weight: '100',
    key_results: [] as KeyResult[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (objective) {
      setFormData({
        employee_id: objective.employee_id,
        title: objective.title,
        description: objective.description || '',
        type: objective.type,
        start_date: objective.start_date,
        due_date: objective.due_date,
        target_value: objective.target_value?.toString() || '',
        unit: objective.unit || '',
        weight: objective.weight?.toString() || '100',
        key_results: objective.key_results || []
      });
    }
  }, [objective]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.employee_id) newErrors.employee_id = 'Employé requis';
    if (!formData.title.trim()) newErrors.title = 'Titre requis';
    if (!formData.start_date) newErrors.start_date = 'Date de début requise';
    if (!formData.due_date) newErrors.due_date = 'Date d\'échéance requise';
    if (formData.start_date && formData.due_date && formData.start_date > formData.due_date) {
      newErrors.due_date = 'La date d\'échéance doit être après la date de début';
    }

    if (formData.type !== 'okr' && !formData.target_value) {
      newErrors.target_value = 'Valeur cible requise';
    }

    if (formData.type === 'okr' && formData.key_results.length === 0) {
      newErrors.key_results = 'Au moins un Key Result requis pour un OKR';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const submitData: any = {
        employee_id: formData.employee_id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        type: formData.type,
        start_date: formData.start_date,
        due_date: formData.due_date,
        weight: parseInt(formData.weight) || 100
      };

      if (formData.type === 'okr') {
        submitData.key_results = formData.key_results;
      } else {
        submitData.target_value = parseFloat(formData.target_value) || 0;
        submitData.unit = formData.unit || null;
      }

      const success = await onSubmit(submitData);
      if (success) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const addKeyResult = () => {
    setFormData({
      ...formData,
      key_results: [
        ...formData.key_results,
        { title: '', target: 0, current: 0, unit: '' }
      ]
    });
  };

  const updateKeyResult = (index: number, field: keyof KeyResult, value: any) => {
    const newKeyResults = [...formData.key_results];
    newKeyResults[index] = { ...newKeyResults[index], [field]: value };
    setFormData({ ...formData, key_results: newKeyResults });
  };

  const removeKeyResult = (index: number) => {
    setFormData({
      ...formData,
      key_results: formData.key_results.filter((_, i) => i !== index)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {objective ? 'Modifier l\'objectif' : 'Nouvel objectif'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Employé */}
          <div>
            <Label htmlFor="employee_id">Employé *</Label>
            <select
              id="employee_id"
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner un employé</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
            {errors.employee_id && (
              <p className="text-red-500 text-sm mt-1">{errors.employee_id}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <Label htmlFor="type">Type d'objectif *</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="smart">SMART</option>
              <option value="okr">OKR</option>
              <option value="kpi">KPI</option>
              <option value="project">Projet</option>
            </select>
          </div>

          {/* Titre */}
          <div>
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Augmenter les ventes de 20%"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Détails sur l'objectif..."
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Date de début *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className={errors.start_date ? 'border-red-500' : ''}
              />
              {errors.start_date && (
                <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>
              )}
            </div>

            <div>
              <Label htmlFor="due_date">Date d'échéance *</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className={errors.due_date ? 'border-red-500' : ''}
              />
              {errors.due_date && (
                <p className="text-red-500 text-sm mt-1">{errors.due_date}</p>
              )}
            </div>
          </div>

          {/* OKR - Key Results */}
          {formData.type === 'okr' && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <Label>Key Results *</Label>
                <Button type="button" onClick={addKeyResult} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
              </div>

              {formData.key_results.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 text-center py-4">
                  Aucun Key Result. Cliquez sur "Ajouter" pour en créer.
                </p>
              ) : (
                <div className="space-y-3">
                  {formData.key_results.map((kr, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded border">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-2">
                          <Input
                            placeholder="Titre du Key Result"
                            value={kr.title}
                            onChange={(e) => updateKeyResult(index, 'title', e.target.value)}
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <Input
                              type="number"
                              placeholder="Cible"
                              value={kr.target || ''}
                              onChange={(e) => updateKeyResult(index, 'target', parseFloat(e.target.value) || 0)}
                            />
                            <Input
                              type="number"
                              placeholder="Actuel"
                              value={kr.current || ''}
                              onChange={(e) => updateKeyResult(index, 'current', parseFloat(e.target.value) || 0)}
                            />
                            <Input
                              placeholder="Unité"
                              value={kr.unit}
                              onChange={(e) => updateKeyResult(index, 'unit', e.target.value)}
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeKeyResult(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {errors.key_results && (
                <p className="text-red-500 text-sm mt-2">{errors.key_results}</p>
              )}
            </div>
          )}

          {/* Valeur cible (non-OKR) */}
          {formData.type !== 'okr' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="target_value">Valeur cible *</Label>
                <Input
                  id="target_value"
                  type="number"
                  step="0.01"
                  value={formData.target_value}
                  onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                  placeholder="Ex: 100"
                  className={errors.target_value ? 'border-red-500' : ''}
                />
                {errors.target_value && (
                  <p className="text-red-500 text-sm mt-1">{errors.target_value}</p>
                )}
              </div>

              <div>
                <Label htmlFor="unit">Unité</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="Ex: %, €, ventes"
                />
              </div>
            </div>
          )}

          {/* Poids */}
          <div>
            <Label htmlFor="weight">Poids (%)</Label>
            <Input
              id="weight"
              type="number"
              min="0"
              max="100"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">
              Importance relative de cet objectif (0-100%)
            </p>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Enregistrement...' : objective ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
