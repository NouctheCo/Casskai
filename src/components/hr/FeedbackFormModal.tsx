/**
 * Modal de création de feedback
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FeedbackFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<boolean>;
  employees: Array<{ id: string; first_name: string; last_name: string }>;
}

export function FeedbackFormModal({
  isOpen,
  onClose,
  onSubmit,
  employees
}: FeedbackFormModalProps) {
  const [formData, setFormData] = useState({
    employee_id: '',
    from_employee_id: '',
    feedback_type: 'praise' as 'praise' | 'constructive' | 'suggestion' | 'concern' | 'recognition' | 'request',
    message: '',
    is_anonymous: false,
    is_private: false,
    visibility: 'manager' as 'employee_only' | 'manager' | 'both' | 'team'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.employee_id) newErrors.employee_id = 'Employé requis';
    if (!formData.from_employee_id && !formData.is_anonymous) {
      newErrors.from_employee_id = 'Auteur requis (ou cocher anonyme)';
    }
    if (!formData.message.trim()) newErrors.message = 'Message requis';

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
        from_employee_id: formData.is_anonymous ? null : formData.from_employee_id || null,
        feedback_type: formData.feedback_type,
        message: formData.message.trim(),
        is_anonymous: formData.is_anonymous,
        is_private: formData.is_private,
        visibility: formData.visibility
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Nouveau feedback</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Employé concerné */}
          <div>
            <Label htmlFor="employee_id">Pour (employé) *</Label>
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

          {/* Anonyme */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_anonymous}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    is_anonymous: e.target.checked,
                    from_employee_id: e.target.checked ? '' : formData.from_employee_id
                  });
                }}
                className="rounded"
              />
              <span className="text-sm font-medium">Feedback anonyme</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 ml-6">
              Votre identité ne sera pas révélée à l'employé
            </p>
          </div>

          {/* Auteur (si non anonyme) */}
          {!formData.is_anonymous && (
            <div>
              <Label htmlFor="from_employee_id">De (auteur) *</Label>
              <select
                id="from_employee_id"
                value={formData.from_employee_id}
                onChange={(e) => setFormData({ ...formData, from_employee_id: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
              {errors.from_employee_id && (
                <p className="text-red-500 text-sm mt-1">{errors.from_employee_id}</p>
              )}
            </div>
          )}

          {/* Type de feedback */}
          <div>
            <Label htmlFor="feedback_type">Type de feedback *</Label>
            <select
              id="feedback_type"
              value={formData.feedback_type}
              onChange={(e) => setFormData({ ...formData, feedback_type: e.target.value as any })}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="praise">Éloge</option>
              <option value="constructive">Constructif</option>
              <option value="suggestion">Suggestion</option>
              <option value="concern">Préoccupation</option>
              <option value="recognition">Reconnaissance</option>
              <option value="request">Demande</option>
            </select>
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">Message *</Label>
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={6}
              className={`w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.message ? 'border-red-500' : ''
              }`}
              placeholder="Écrivez votre feedback..."
            />
            {errors.message && (
              <p className="text-red-500 text-sm mt-1">{errors.message}</p>
            )}
          </div>

          {/* Visibilité */}
          <div>
            <Label htmlFor="visibility">Visibilité</Label>
            <select
              id="visibility"
              value={formData.visibility}
              onChange={(e) => setFormData({ ...formData, visibility: e.target.value as any })}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="employee_only">Employé uniquement</option>
              <option value="manager">Manager uniquement</option>
              <option value="both">Employé et manager</option>
              <option value="team">Toute l'équipe</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">
              Qui peut voir ce feedback
            </p>
          </div>

          {/* Privé */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_private}
                onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium">Feedback privé</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 ml-6">
              Visible uniquement par les RH et managers
            </p>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Envoi...' : 'Envoyer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
