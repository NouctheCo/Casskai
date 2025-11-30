/**
 * Modal de création/édition d'évaluation de performance
 */

import { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PerformanceReview } from '@/types/hr-performance.types';

interface ReviewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<boolean>;
  employees: Array<{ id: string; first_name: string; last_name: string; email?: string }>;
  review?: PerformanceReview | null;
}

const COMPETENCIES = [
  'leadership',
  'communication',
  'teamwork',
  'technical_skills',
  'problem_solving',
  'initiative',
  'adaptability',
  'time_management'
];

export function ReviewFormModal({
  isOpen,
  onClose,
  onSubmit,
  employees,
  review
}: ReviewFormModalProps) {
  const [formData, setFormData] = useState({
    employee_id: '',
    reviewer_id: '',
    review_type: 'manager' as 'self' | 'manager' | 'peer' | '360' | 'probation' | 'mid_year' | 'annual',
    review_date: new Date().toISOString().split('T')[0],
    review_period: '',
    overall_rating: 3,
    competency_ratings: {} as Record<string, number>,
    strengths: '',
    areas_for_improvement: '',
    development_plan: '',
    manager_comments: '',
    goals_achieved: '',
    goals_total: '',
    promotion_recommended: false,
    raise_recommended: false,
    pip_required: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (review) {
      setFormData({
        employee_id: review.employee_id,
        reviewer_id: review.reviewer_id,
        review_type: review.review_type,
        review_date: review.review_date,
        review_period: review.review_date, // Use review_date as review_period
        overall_rating: review.overall_rating || 3,
        competency_ratings: (review.competencies_ratings || {}) as any,
        strengths: review.strengths || '',
        areas_for_improvement: review.areas_for_improvement || '',
        development_plan: review.development_plan || '',
        manager_comments: review.manager_comments || '',
        goals_achieved: review.goals_achieved?.toString() || '',
        goals_total: review.goals_total?.toString() || '',
        promotion_recommended: review.promotion_recommended || false,
        raise_recommended: review.raise_recommended || false,
        pip_required: review.pip_required || false
      });
    }
  }, [review]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.employee_id) newErrors.employee_id = 'Employé requis';
    if (!formData.reviewer_id) newErrors.reviewer_id = 'Évaluateur requis';
    if (!formData.review_date) newErrors.review_date = 'Date requise';

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
        reviewer_id: formData.reviewer_id,
        review_type: formData.review_type,
        review_date: formData.review_date,
        review_period: formData.review_period || null,
        overall_rating: formData.overall_rating,
        competency_ratings: Object.keys(formData.competency_ratings).length > 0
          ? formData.competency_ratings
          : null,
        strengths: formData.strengths.trim() || null,
        areas_for_improvement: formData.areas_for_improvement.trim() || null,
        development_plan: formData.development_plan.trim() || null,
        manager_comments: formData.manager_comments.trim() || null,
        goals_achieved: formData.goals_achieved ? parseInt(formData.goals_achieved) : null,
        goals_total: formData.goals_total ? parseInt(formData.goals_total) : null,
        promotion_recommended: formData.promotion_recommended,
        raise_recommended: formData.raise_recommended,
        pip_required: formData.pip_required
      };

      const success = await onSubmit(submitData);
      if (success) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const setCompetencyRating = (competency: string, rating: number) => {
    setFormData({
      ...formData,
      competency_ratings: {
        ...formData.competency_ratings,
        [competency]: rating
      }
    });
  };

  const StarRating = ({ value, onChange }: { value: number; onChange: (rating: number) => void }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`w-6 h-6 ${
                rating <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {review ? 'Modifier l\'évaluation' : 'Nouvelle évaluation'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Employé et Évaluateur */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employee_id">Employé évalué *</Label>
              <select
                id="employee_id"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner</option>
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

            <div>
              <Label htmlFor="reviewer_id">Évaluateur *</Label>
              <select
                id="reviewer_id"
                value={formData.reviewer_id}
                onChange={(e) => setFormData({ ...formData, reviewer_id: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
              {errors.reviewer_id && (
                <p className="text-red-500 text-sm mt-1">{errors.reviewer_id}</p>
              )}
            </div>
          </div>

          {/* Type et Date */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="review_type">Type d'évaluation *</Label>
              <select
                id="review_type"
                value={formData.review_type}
                onChange={(e) => setFormData({ ...formData, review_type: e.target.value as any })}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="self">Auto-évaluation</option>
                <option value="manager">Manager</option>
                <option value="peer">Pair</option>
                <option value="360">360°</option>
                <option value="probation">Période d'essai</option>
                <option value="mid_year">Mi-année</option>
                <option value="annual">Annuelle</option>
              </select>
            </div>

            <div>
              <Label htmlFor="review_date">Date d'évaluation *</Label>
              <Input
                id="review_date"
                type="date"
                value={formData.review_date}
                onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="review_period">Période</Label>
              <Input
                id="review_period"
                value={formData.review_period}
                onChange={(e) => setFormData({ ...formData, review_period: e.target.value })}
                placeholder="Ex: Q1 2025"
              />
            </div>
          </div>

          {/* Note globale */}
          <div>
            <Label>Note globale *</Label>
            <div className="flex items-center gap-4 mt-2">
              <StarRating
                value={formData.overall_rating}
                onChange={(rating) => setFormData({ ...formData, overall_rating: rating })}
              />
              <span className="text-lg font-semibold">{formData.overall_rating}/5</span>
            </div>
          </div>

          {/* Compétences */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <Label className="mb-3 block">Évaluation par compétence</Label>
            <div className="grid grid-cols-2 gap-4">
              {COMPETENCIES.map((competency) => (
                <div key={competency} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <span className="text-sm capitalize">
                    {competency.replace('_', ' ')}
                  </span>
                  <StarRating
                    value={formData.competency_ratings[competency] || 0}
                    onChange={(rating) => setCompetencyRating(competency, rating)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Objectifs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="goals_achieved">Objectifs atteints</Label>
              <Input
                id="goals_achieved"
                type="number"
                min="0"
                value={formData.goals_achieved}
                onChange={(e) => setFormData({ ...formData, goals_achieved: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="goals_total">Objectifs totaux</Label>
              <Input
                id="goals_total"
                type="number"
                min="0"
                value={formData.goals_total}
                onChange={(e) => setFormData({ ...formData, goals_total: e.target.value })}
              />
            </div>
          </div>

          {/* Points forts */}
          <div>
            <Label htmlFor="strengths">Points forts</Label>
            <textarea
              id="strengths"
              value={formData.strengths}
              onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
              rows={3}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Décrivez les points forts de l'employé..."
            />
          </div>

          {/* Axes d'amélioration */}
          <div>
            <Label htmlFor="areas_for_improvement">Axes d'amélioration</Label>
            <textarea
              id="areas_for_improvement"
              value={formData.areas_for_improvement}
              onChange={(e) => setFormData({ ...formData, areas_for_improvement: e.target.value })}
              rows={3}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Décrivez les axes d'amélioration..."
            />
          </div>

          {/* Plan de développement */}
          <div>
            <Label htmlFor="development_plan">Plan de développement</Label>
            <textarea
              id="development_plan"
              value={formData.development_plan}
              onChange={(e) => setFormData({ ...formData, development_plan: e.target.value })}
              rows={3}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Décrivez le plan de développement..."
            />
          </div>

          {/* Commentaires */}
          <div>
            <Label htmlFor="manager_comments">Commentaires de l'évaluateur</Label>
            <textarea
              id="manager_comments"
              value={formData.manager_comments}
              onChange={(e) => setFormData({ ...formData, manager_comments: e.target.value })}
              rows={3}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Commentaires additionnels..."
            />
          </div>

          {/* Recommandations RH */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <Label className="mb-3 block">Recommandations RH</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.promotion_recommended}
                  onChange={(e) =>
                    setFormData({ ...formData, promotion_recommended: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-sm">Promotion recommandée</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.raise_recommended}
                  onChange={(e) =>
                    setFormData({ ...formData, raise_recommended: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-sm">Augmentation salariale recommandée</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.pip_required}
                  onChange={(e) =>
                    setFormData({ ...formData, pip_required: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-sm">Plan d'amélioration de la performance (PIP) requis</span>
              </label>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Enregistrement...' : review ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
