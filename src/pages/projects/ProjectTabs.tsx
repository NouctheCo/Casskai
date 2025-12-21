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

import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProjectTabsProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function ProjectTabs({ activeView, onViewChange }: ProjectTabsProps) {
  return (
    <Tabs value={activeView} onValueChange={onViewChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
        <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
        <TabsTrigger value="projects">Projets</TabsTrigger>
        <TabsTrigger value="tasks">Tâches</TabsTrigger>
        <TabsTrigger value="resources">Ressources</TabsTrigger>
        <TabsTrigger value="timesheets">Temps</TabsTrigger>
        <TabsTrigger value="billing">Facturation</TabsTrigger>
        <TabsTrigger value="gantt">Gantt</TabsTrigger>
        <TabsTrigger value="reports">Rapports</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
