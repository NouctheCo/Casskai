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
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Briefcase, KanbanSquare } from 'lucide-react';
import { ProjectFilters } from './ProjectFilters';

export interface Project {
  id: string;
  name: string;
  description: string;
  client: string;
  status: string;
  priority: string;
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
  profit?: number;
}

interface ProjectListProps {
  projects: Project[];
  onProjectSelect: (project: Project) => void;
}

export function ProjectList({ projects, onProjectSelect }: ProjectListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <CardTitle>Liste des Projets</CardTitle>
            <CardDescription>Gestion de tous vos projets</CardDescription>
          </div>
          <ProjectFilters />
        </div>
      </CardHeader>
      <CardContent>
        {projects.length > 0 ? (
          <div className="space-y-4">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onProjectSelect(project)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold ${
                    project.status === 'in_progress' ? 'bg-blue-500' :
                    project.status === 'completed' ? 'bg-green-500' :
                    project.status === 'on_hold' ? 'bg-orange-500' : 'bg-gray-500'
                  }`}>
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{project.name}</h3>
                    <p className="text-sm text-muted-foreground">{project.client} • {project.category}</p>
                    <p className="text-xs text-muted-foreground">Chef de projet: {project.manager}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-2">
                    <Progress value={project.progress} className="w-20 h-2" />
                    <span className="text-sm font-medium">{project.progress}%</span>
                  </div>
                  <p className="text-sm font-medium">{formatCurrency(project.budget)}</p>
                  <p className="text-xs text-muted-foreground">Budget total</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={project.status === 'in_progress' ? 'default' : project.status === 'completed' ? 'secondary' : 'outline'}>
                    {project.status === 'in_progress' ? 'En cours' :
                     project.status === 'completed' ? 'Terminé' :
                     project.status === 'on_hold' ? 'Pause' : 'Planifié'}
                  </Badge>
                  <Badge variant={project.priority === 'high' ? 'destructive' : project.priority === 'medium' ? 'secondary' : 'outline'}>
                    {project.priority === 'high' ? 'Haute' : project.priority === 'medium' ? 'Moyenne' : 'Basse'}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <KanbanSquare className="mx-auto h-16 w-16 text-primary/50" />
            <p className="mt-4 text-lg text-muted-foreground">Aucun projet pour le moment</p>
            <p className="text-sm text-muted-foreground mb-4">Commencez par créer votre premier projet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
