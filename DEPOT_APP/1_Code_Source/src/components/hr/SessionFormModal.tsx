/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TrainingSession, SessionStatus } from '@/types/hr-training.types';

interface SessionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<boolean>;
  session?: TrainingSession | null;
  trainingCatalog: Array<{ id: string; title: string }>;
}

export function SessionFormModal({
  isOpen,
  onClose,
  onSubmit,
  session,
  trainingCatalog
}: SessionFormModalProps) {
  const [formData, setFormData] = useState({
    training_id: '',
    session_name: '',
    start_date: '',
    end_date: '',
    location: '',
    trainer_name: '',
    max_participants: '',
    status: 'planned' as SessionStatus
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      setFormData({
        training_id: session.training_id,
        session_name: session.session_name || '',
        start_date: session.start_date || '',
        end_date: session.end_date || '',
        location: session.location || '',
        trainer_name: session.trainer_name || '',
        max_participants: session.max_participants?.toString() || '',
        status: session.status
      });
    }
  }, [session]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.training_id) newErrors.training_id = 'Formation requise';
    if (!formData.session_name.trim()) newErrors.session_name = 'Nom de la session requis';
    if (!formData.start_date) newErrors.start_date = 'Date de début requise';
    if (!formData.end_date) newErrors.end_date = 'Date de fin requise';
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      newErrors.end_date = 'La date de fin doit être après la date de début';
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
        session_name: formData.session_name.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date,
        location: formData.location.trim() || undefined,
        trainer_name: formData.trainer_name.trim() || undefined,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : undefined
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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {session ? 'Modifier la session' : 'Nouvelle session de formation'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            aria-label="Fermer"
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
                {trainingCatalog.map((training) => (
                  <SelectItem key={training.id} value={training.id}>
                    {training.title}
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
            <Label htmlFor="session_name">Nom de la session *</Label>
            <Input
              id="session_name"
              value={formData.session_name}
              onChange={(e) => setFormData({ ...formData, session_name: e.target.value })}
              placeholder="Ex: Session Formation React - Janvier 2025"
              className={errors.session_name ? 'border-red-500' : ''}
            />
            {errors.session_name && (
              <p className="text-red-500 text-sm mt-1">{errors.session_name}</p>
            )}
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

          {/* Lieu */}
          <div>
            <Label htmlFor="location">Lieu</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Salle de réunion A, En ligne, etc."
            />
          </div>

          {/* Formateur */}
          <div>
            <Label htmlFor="trainer_name">Nom du formateur</Label>
            <Input
              id="trainer_name"
              value={formData.trainer_name}
              onChange={(e) => setFormData({ ...formData, trainer_name: e.target.value })}
              placeholder="Nom du formateur ou intervenant"
            />
          </div>

          {/* Participants max et Statut */}
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
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as SessionStatus })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planifiée</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminée</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
