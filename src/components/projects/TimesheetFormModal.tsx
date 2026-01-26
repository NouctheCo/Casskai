/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { timesheetsService, type CreateTimesheetInput } from '@/services/timesheetsService';
import { projectTasksService } from '@/services/projectTasksService';
import { logger } from '@/lib/logger';
import { formatCurrency } from '@/lib/utils';
export interface TimesheetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projects: Array<{ id: string; name: string }>;
}
interface TimesheetFormData {
  project_id: string;
  task_id: string;
  user_id: string;
  date: string;
  hours: number;
  description: string;
  is_billable: boolean;
  hourly_rate: number;
  status: 'draft' | 'submitted';
}
const TimesheetFormModal: React.FC<TimesheetFormModalProps> = ({ isOpen, onClose, onSuccess, projects }) => {
  const { t } = useTranslation();
  const { currentCompany, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTasks, setAvailableTasks] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [formData, setFormData] = useState<TimesheetFormData>({
    project_id: '',
    task_id: '',
    user_id: user?.id || '',
    date: new Date().toISOString().split('T')[0],
    hours: 1,
    description: '',
    is_billable: true,
    hourly_rate: 0,
    status: 'draft'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Charger les tâches quand le projet change
  useEffect(() => {
    if (formData.project_id) {
      loadTasksForProject(formData.project_id);
    } else {
      setAvailableTasks([]);
      setFormData(prev => ({ ...prev, task_id: '' }));
    }
  }, [formData.project_id]);
  const loadTasksForProject = async (projectId: string) => {
    setLoadingTasks(true);
    try {
      const tasks = await projectTasksService.getTasksByProject(projectId);
      setAvailableTasks(tasks.map(task => ({
        id: task.id,
        name: task.name
      })));
    } catch (error) {
      logger.error('TimesheetFormModal', 'Error loading tasks:', error);
    } finally {
      setLoadingTasks(false);
    }
  };
  const handleInputChange = (field: keyof TimesheetFormData, value: any) => {
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
      newErrors.project_id = t('projects.timesheetModal.errorProject', 'Le projet est requis');
    }
    if (!formData.date) {
      newErrors.date = t('projects.timesheetModal.errorDate', 'La date est requise');
    }
    if (formData.hours <= 0) {
      newErrors.hours = t('projects.timesheetModal.errorHours', 'Les heures doivent être supérieures à 0');
    }
    if (formData.is_billable && formData.hourly_rate <= 0) {
      newErrors.hourly_rate = t('projects.timesheetModal.errorRate', 'Le taux horaire est requis pour les heures facturables');
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
      const timesheetData: CreateTimesheetInput = {
        project_id: formData.project_id,
        task_id: formData.task_id || undefined,
        user_id: formData.user_id,
        date: formData.date,
        hours: formData.hours,
        description: formData.description || undefined,
        is_billable: formData.is_billable,
        hourly_rate: formData.is_billable ? formData.hourly_rate : undefined,
        status: formData.status
      };
      await timesheetsService.createTimesheet(currentCompany.id, timesheetData);
      // Réinitialiser le formulaire
      setFormData({
        project_id: '',
        task_id: '',
        user_id: user?.id || '',
        date: new Date().toISOString().split('T')[0],
        hours: 1,
        description: '',
        is_billable: true,
        hourly_rate: 0,
        status: 'draft'
      });
      onSuccess();
      onClose();
    } catch (err) {
      logger.error('TimesheetFormModal', 'Error creating timesheet:', err);
      setError(t('projects.timesheetModal.errorCreating', 'Erreur lors de la création du timesheet'));
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('projects.timesheetModal.title', 'Nouvelle entrée de temps')}</DialogTitle>
          <DialogDescription>
            {t('projects.timesheetModal.description', 'Enregistrer une entrée de temps pour un projet')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Projet */}
          <div className="space-y-2">
            <Label htmlFor="project_id">
              {t('projects.timesheetModal.project', 'Projet')} <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.project_id} onValueChange={(value) => handleInputChange('project_id', value)}>
              <SelectTrigger className={errors.project_id ? 'border-red-500' : ''}>
                <SelectValue placeholder={t('projects.timesheetModal.projectPlaceholder', 'Sélectionner un projet')} />
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
          {/* Tâche (optionnelle) */}
          <div className="space-y-2">
            <Label htmlFor="task_id">
              {t('projects.timesheetModal.task', 'Tâche')} {t('common.optional', '(optionnel)')}
            </Label>
            <Select
              value={formData.task_id}
              onValueChange={(value) => handleInputChange('task_id', value)}
              disabled={!formData.project_id || loadingTasks}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  loadingTasks
                    ? t('projects.timesheetModal.loadingTasks', 'Chargement des tâches...')
                    : !formData.project_id
                    ? t('projects.timesheetModal.selectProjectFirst', 'Sélectionner d\'abord un projet')
                    : t('projects.timesheetModal.taskPlaceholder', 'Sélectionner une tâche')
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('projects.timesheetModal.noTask', 'Aucune tâche')}</SelectItem>
                {availableTasks.map(task => (
                  <SelectItem key={task.id} value={task.id}>{task.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Date et Heures */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">
                {t('projects.timesheetModal.date', 'Date')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={errors.date ? 'border-red-500' : ''}
              />
              {errors.date && (
                <p className="text-sm text-red-600">{errors.date}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours">
                {t('projects.timesheetModal.hours', 'Heures')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                min="0"
                value={formData.hours}
                onChange={(e) => handleInputChange('hours', parseFloat(e.target.value))}
                placeholder={t('projects.timesheetModal.hoursPlaceholder', '8.0')}
                className={errors.hours ? 'border-red-500' : ''}
              />
              {errors.hours && (
                <p className="text-sm text-red-600">{errors.hours}</p>
              )}
            </div>
          </div>
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {t('projects.timesheetModal.description', 'Description')} {t('common.optional', '(optionnel)')}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder={t('projects.timesheetModal.descriptionPlaceholder', 'Description du travail effectué')}
              rows={3}
            />
          </div>
          {/* Facturable */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_billable"
              checked={formData.is_billable}
              onCheckedChange={(checked) => handleInputChange('is_billable', checked)}
            />
            <Label htmlFor="is_billable" className="cursor-pointer">
              {t('projects.timesheetModal.billable', 'Temps facturable')}
            </Label>
          </div>
          {/* Taux horaire (si facturable) */}
          {formData.is_billable && (
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">
                {t('projects.timesheetModal.hourlyRate', 'Taux horaire')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="hourly_rate"
                type="number"
                step="0.01"
                min="0"
                value={formData.hourly_rate}
                onChange={(e) => handleInputChange('hourly_rate', parseFloat(e.target.value))}
                placeholder={t('projects.timesheetModal.hourlyRatePlaceholder', '50.00')}
                className={errors.hourly_rate ? 'border-red-500' : ''}
              />
              {errors.hourly_rate && (
                <p className="text-sm text-red-600">{errors.hourly_rate}</p>
              )}
              {formData.hourly_rate > 0 && (
                <p className="text-sm text-muted-foreground">
                  {t('projects.timesheetModal.totalAmount', 'Montant total')} : {formatCurrency(formData.hours * formData.hourly_rate)}
                </p>
              )}
            </div>
          )}
          {/* Statut */}
          <div className="space-y-2">
            <Label htmlFor="status">
              {t('projects.timesheetModal.status', 'Statut')}
            </Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value as 'draft' | 'submitted')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{t('projects.timesheetModal.statusDraft', 'Brouillon')}</SelectItem>
                <SelectItem value="submitted">{t('projects.timesheetModal.statusSubmitted', 'Soumettre pour approbation')}</SelectItem>
              </SelectContent>
            </Select>
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
              {t('projects.timesheetModal.create', 'Créer l\'entrée')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
export default TimesheetFormModal;