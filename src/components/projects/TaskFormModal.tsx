/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { X } from 'lucide-react';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: any) => Promise<void>;
  projects: Array<{ id: string; name: string }>;
  employees?: Array<{ id: string; name: string }>;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  projects,
  employees = []
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    assignee: '',
    startDate: null as Date | null,
    dueDate: null as Date | null,
    estimatedHours: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    status: 'todo' as 'todo' | 'in_progress' | 'completed' | 'cancelled',
    progress: 0
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.project_id) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        startDate: formData.startDate?.toISOString().split('T')[0],
        dueDate: formData.dueDate?.toISOString().split('T')[0],
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        project_id: '',
        assignee: '',
        startDate: null,
        dueDate: null,
        estimatedHours: '',
        priority: 'medium',
        status: 'todo',
        progress: 0
      });

      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Nouvelle tâche</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-gray-700 dark:text-gray-300">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Nom de la tâche"
              required
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description détaillée de la tâche"
              rows={3}
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="project" className="text-gray-700 dark:text-gray-300">Projet *</Label>
              <Select
                value={formData.project_id}
                onValueChange={(value) => setFormData({ ...formData, project_id: value })}
              >
                <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                  <SelectValue placeholder="Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id} className="text-gray-900 dark:text-gray-100">
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assignee" className="text-gray-700 dark:text-gray-300">Assigné à</Label>
              <Select
                value={formData.assignee || 'unassigned'}
                onValueChange={(value) => setFormData({ ...formData, assignee: value === 'unassigned' ? '' : value })}
              >
                <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                  <SelectValue placeholder="Non assigné" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectItem value="unassigned" className="text-gray-900 dark:text-gray-100">Non assigné</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id} className="text-gray-900 dark:text-gray-100">
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Date début</Label>
              <DatePicker
                value={formData.startDate}
                onChange={(date: any) => setFormData({ ...formData, startDate: date })}
                placeholder="Sélectionner une date"
                className=""
              />
            </div>

            <div>
              <Label className="text-gray-700 dark:text-gray-300">Date fin</Label>
              <DatePicker
                value={formData.dueDate}
                onChange={(date: any) => setFormData({ ...formData, dueDate: date })}
                placeholder="Sélectionner une date"
                className=""
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="priority" className="text-gray-700 dark:text-gray-300">Priorité</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectItem value="low" className="text-gray-900 dark:text-gray-100">Basse</SelectItem>
                  <SelectItem value="medium" className="text-gray-900 dark:text-gray-100">Moyenne</SelectItem>
                  <SelectItem value="high" className="text-gray-900 dark:text-gray-100">Haute</SelectItem>
                  <SelectItem value="critical" className="text-gray-900 dark:text-gray-100">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status" className="text-gray-700 dark:text-gray-300">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectItem value="todo" className="text-gray-900 dark:text-gray-100">À faire</SelectItem>
                  <SelectItem value="in_progress" className="text-gray-900 dark:text-gray-100">En cours</SelectItem>
                  <SelectItem value="completed" className="text-gray-900 dark:text-gray-100">Terminé</SelectItem>
                  <SelectItem value="cancelled" className="text-gray-900 dark:text-gray-100">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="estimatedHours" className="text-gray-700 dark:text-gray-300">Heures estimées</Label>
              <Input
                id="estimatedHours"
                type="number"
                step="0.5"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                placeholder="0"
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting || !formData.title.trim() || !formData.project_id}>
              {submitting ? 'Création...' : 'Créer la tâche'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


