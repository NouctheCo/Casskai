/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

import React, { useState, useCallback } from 'react';
import { getCurrentCompanyCurrency } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { toastError, toastSuccess } from '@/lib/toast-helpers';

interface ProjectFormProps {
  onCancel: () => void;
  onSubmit: (data: ProjectFormData) => Promise<boolean>;
}

export interface ProjectFormData {
  name: string;
  description: string;
  client: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  progress: number;
  manager: string;
  team: string[];
  category: string;
  lastActivity: string;
  totalHours: number;
  billableHours: number;
  hourlyRate: number;
  revenue: number;
}

export function ProjectForm({ onCancel, onSubmit }: ProjectFormProps) {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectClient, setProjectClient] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectBudget, setProjectBudget] = useState('');
  const [projectManager, setProjectManager] = useState('');
  const [projectStatus, setProjectStatus] = useState('planning');

  const t = (key: string, options?: { defaultValue?: string }) => {
    return options?.defaultValue || key;
  };

  const handleSubmit = useCallback(async () => {
    if (!projectName.trim() || !projectClient.trim() || !projectBudget) {
      toastError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      const projectData: ProjectFormData = {
        name: projectName.trim(),
        description: projectDescription.trim(),
        client: projectClient.trim(),
        status: projectStatus as 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled',
        priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
        startDate: startDate ? startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: endDate ? endDate.toISOString().split('T')[0] : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        budget: parseFloat(projectBudget),
        spent: 0,
        progress: 0,
        manager: projectManager.trim() || 'Non assigné',
        team: [],
        category: 'Général',
        lastActivity: new Date().toISOString(),
        totalHours: 0,
        billableHours: 0,
        hourlyRate: 75,
        revenue: 0
      };

      const success = await onSubmit(projectData);

      if (success) {
        // Réinitialiser le formulaire
        setProjectName('');
        setProjectClient('');
        setProjectDescription('');
        setProjectBudget('');
        setProjectManager('');
        setProjectStatus('planning');
        setStartDate(null);
        setEndDate(null);

        toastSuccess("Projet créé avec succès");
      }
    } catch (_error) {
      toastError("Impossible de créer le projet");
    }
  }, [projectName, projectClient, projectDescription, projectBudget, projectManager, projectStatus, startDate, endDate, onSubmit]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('projectspage.nouveau_projet', { defaultValue: 'Nouveau Projet' })}</CardTitle>
        <CardDescription>{t('projectspage.crez_un_nouveau_projet', { defaultValue: 'Créez un nouveau projet' })}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="projectName" className="text-sm font-medium">{t('projectspage.nom_du_projet', { defaultValue: 'Nom du projet' })}</label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder={t('projectspage.refonte_site_web_client_abc', { defaultValue: 'Refonte site web client ABC' })}
            />
          </div>
          <div>
            <label htmlFor="projectClient" className="text-sm font-medium">{t('projectspage.client', { defaultValue: 'Client' })}</label>
            <Input
              id="projectClient"
              value={projectClient}
              onChange={(e) => setProjectClient(e.target.value)}
              placeholder={t('projectspage.slectionner_un_client', { defaultValue: 'Sélectionner un client' })}
            />
          </div>
        </div>

        <div>
          <label htmlFor="projectDescription" className="text-sm font-medium">{t('projectspage.description', { defaultValue: 'Description' })}</label>
          <textarea
            id="projectDescription"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
            rows={3}
            placeholder={`${t('projectspage.description', { defaultValue: 'Description' })  } détaillée du projet`}
          ></textarea>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="projectStartDate" className="text-sm font-medium">{t('projectspage.date_de_dbut', { defaultValue: 'Date de début' })}</label>
            <DatePicker
              value={startDate}
              onChange={(d) => setStartDate(d ?? null)}
              placeholder={t('projectspage.slectionnez_une_date', { defaultValue: 'Sélectionnez une date' })}
              className=""
            />
          </div>
          <div>
            <label htmlFor="projectEndDate" className="text-sm font-medium">{t('projectspage.date_de_fin_prvue', { defaultValue: 'Date de fin prévue' })}</label>
            <DatePicker
              value={endDate}
              onChange={(d) => setEndDate(d ?? null)}
              placeholder={t('projectspage.slectionnez_une_date', { defaultValue: 'Sélectionnez une date' })}
              className=""
            />
          </div>
          <div>
            <label htmlFor="projectBudget" className="text-sm font-medium">{t('projectspage.budget_', { defaultValue: `Budget (${getCurrentCompanyCurrency()})` })}</label>
            <Input
              id="projectBudget"
              value={projectBudget}
              onChange={(e) => setProjectBudget(e.target.value)}
              placeholder="25000"
              type="number"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="projectManager" className="text-sm font-medium">{t('projectspage.chef_de_projet', { defaultValue: 'Chef de projet' })}</label>
            <Input
              id="projectManager"
              value={projectManager}
              onChange={(e) => setProjectManager(e.target.value)}
              placeholder={t('projectspage.slectionner_un_responsable', { defaultValue: 'Sélectionner un responsable' })}
            />
          </div>
          <div>
            <label htmlFor="projectStatus" className="text-sm font-medium">{t('projectspage.statut', { defaultValue: 'Statut' })}</label>
            <select
              id="projectStatus"
              value={projectStatus}
              onChange={(e) => setProjectStatus(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-white dark:bg-gray-900 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="planning">{t('projectspage.en_prparation', { defaultValue: 'En préparation' })}</option>
              <option value="in_progress">{t('projectspage.en_cours', { defaultValue: 'En cours' })}</option>
              <option value="on_hold">{t('projectspage.en_pause', { defaultValue: 'En pause' })}</option>
              <option value="completed">{t('projectspage.termin', { defaultValue: 'Terminé' })}</option>
              <option value="cancelled">{t('projectspage.annul', { defaultValue: 'Annulé' })}</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={onCancel} variant="outline">{t('projectspage.annuler', { defaultValue: 'Annuler' })}</Button>
          <Button onClick={handleSubmit}>{t('projectspage.crer_le_projet', { defaultValue: 'Créer le projet' })}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
