/**
 * Modal de création/édition de session de formation
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TrainingSession, TrainingCatalog, SessionStatus } from '@/types/hr-training.types';

interface TrainingSessionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<boolean>;
  session?: TrainingSession | null;
  trainings: TrainingCatalog[];
}

export function TrainingSessionFormModal({
  isOpen,
  onClose,
  onSubmit,
  session,
  trainings
}: TrainingSessionFormModalProps) {
  const [formData, setFormData] = useState({
    training_id: '',
    session_name: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    trainer_name: '',
    trainer_email: '',
    max_participants: '',
    registration_deadline: '',
    status: 'registration_open' as SessionStatus,
    is_virtual: false,
    meeting_link: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      setFormData({
        training_id: session.training_id,
        session_name: session.session_name || '',
        description: session.description || '',
        start_date: session.start_date?.split('T')[0] || '',
        end_date: session.end_date?.split('T')[0] || '',
        location: session.location || '',
        trainer_name: session.trainer_name || '',
        trainer_email: session.trainer_email || '',
        max_participants: session.max_participants?.toString() || '',
        registration_deadline: session.registration_deadline?.split('T')[0] || '',
        status: session.status || 'registration_open',
        is_virtual: session.is_virtual || false,
        meeting_link: session.meeting_link || '',
        notes: session.notes || ''
      });
    }
  }, [session]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.training_id) newErrors.training_id = 'Formation requise';
    if (!formData.start_date) newErrors.start_date = 'Date de début requise';
    if (!formData.end_date) newErrors.end_date = 'Date de fin requise';
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      newErrors.end_date = 'La date de fin doit être après la date de début';
    }
    if (!formData.location.trim() && !formData.is_virtual) {
      newErrors.location = 'Lieu requis pour formation en présentiel';
    }
    if (formData.is_virtual && !formData.meeting_link.trim()) {
      newErrors.meeting_link = 'Lien de réunion requis pour formation virtuelle';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const submitData = {
        training_id: formData.training_id,
        session_name: formData.session_name.trim() || null,
        description: formData.description.trim() || null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        location: formData.location.trim() || null,
        trainer_name: formData.trainer_name.trim() || null,
        trainer_email: formData.trainer_email.trim() || null,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        registration_deadline: formData.registration_deadline || null,
        status: formData.status,
        is_virtual: formData.is_virtual,
        meeting_link: formData.meeting_link.trim() || null,
        notes: formData.notes.trim() || null
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
            {session ? 'Modifier la session' : 'Nouvelle session de formation'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Formation */}
          <div>
            <Label htmlFor="training_id">Formation *</Label>
            <Select
              value={formData.training_id}
              onValueChange={(value) => setFormData({ ...formData, training_id: value })}
            >
              <SelectTrigger id="training_id" className={errors.training_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Sélectionner une formation" />
              </SelectTrigger>
              <SelectContent>
                {trainings.map((training) => (
                  <SelectItem key={training.id} value={training.id}>
                    {training.title} ({training.duration_hours}h)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.training_id && (
              <p className="text-red-500 text-sm mt-1">{errors.training_id}</p>
            )}
          </div>

          {/* Nom de la session */}
          <div>
            <Label htmlFor="session_name">Nom de la session (optionnel)</Label>
            <Input
              id="session_name"
              value={formData.session_name}
              onChange={(e) => setFormData({ ...formData, session_name: e.target.value })}
              placeholder="Ex: Session Printemps 2025"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Informations complémentaires sur cette session..."
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
              <Label htmlFor="end_date">Date de fin *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className={errors.end_date ? 'border-red-500' : ''}
              />
              {errors.end_date && (
                <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>
              )}
            </div>
          </div>

          {/* Formation virtuelle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_virtual"
              checked={formData.is_virtual}
              onChange={(e) => setFormData({ ...formData, is_virtual: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <Label htmlFor="is_virtual" className="cursor-pointer font-normal">
              Formation en ligne (virtuelle)
            </Label>
          </div>

          {/* Lieu ou Lien */}
          {formData.is_virtual ? (
            <div>
              <Label htmlFor="meeting_link">Lien de réunion *</Label>
              <Input
                id="meeting_link"
                type="url"
                value={formData.meeting_link}
                onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                placeholder="https://zoom.us/j/..."
                className={errors.meeting_link ? 'border-red-500' : ''}
              />
              {errors.meeting_link && (
                <p className="text-red-500 text-sm mt-1">{errors.meeting_link}</p>
              )}
            </div>
          ) : (
            <div>
              <Label htmlFor="location">Lieu *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Salle de conférence A, Bureau Paris..."
                className={errors.location ? 'border-red-500' : ''}
              />
              {errors.location && (
                <p className="text-red-500 text-sm mt-1">{errors.location}</p>
              )}
            </div>
          )}

          {/* Formateur */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="trainer_name">Nom du formateur</Label>
              <Input
                id="trainer_name"
                value={formData.trainer_name}
                onChange={(e) => setFormData({ ...formData, trainer_name: e.target.value })}
                placeholder="Jean Dupont"
              />
            </div>

            <div>
              <Label htmlFor="trainer_email">Email du formateur</Label>
              <Input
                id="trainer_email"
                type="email"
                value={formData.trainer_email}
                onChange={(e) => setFormData({ ...formData, trainer_email: e.target.value })}
                placeholder="formateur@exemple.com"
              />
            </div>
          </div>

          {/* Participants et deadline */}
          <div className="grid grid-cols-2 gap-4">
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

            <div>
              <Label htmlFor="registration_deadline">Date limite d'inscription</Label>
              <Input
                id="registration_deadline"
                type="date"
                value={formData.registration_deadline}
                onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
              />
            </div>
          </div>

          {/* Statut */}
          <div>
            <Label htmlFor="status">Statut</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as SessionStatus })}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="registration_open">Inscriptions ouvertes</SelectItem>
                <SelectItem value="registration_closed">Inscriptions fermées</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes internes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              placeholder="Notes privées sur cette session..."
            />
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Enregistrement...' : session ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
