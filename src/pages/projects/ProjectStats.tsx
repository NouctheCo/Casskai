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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Briefcase, DollarSign, Target, Calculator } from 'lucide-react';

interface ProjectMetrics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  totalRevenue: number;
  totalBudget: number;
  totalSpent: number;
  averageProgress: number;
  profitMargin: number;
}

interface Project {
  id: string;
  name: string;
  client: string;
  status: string;
  progress: number;
}

interface ProjectStatsProps {
  metrics: ProjectMetrics;
  projects: Project[];
}

export function ProjectStats({ metrics, projects }: ProjectStatsProps) {
  return (
    <>
      {/* Métriques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Projets total</span>
            </div>
            <div className="text-2xl font-bold">{metrics.totalProjects}</div>
            <p className="text-xs text-muted-foreground">{metrics.activeProjects} actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Revenus</span>
            </div>
            <div className="text-2xl font-bold">€{metrics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Marge: {metrics.profitMargin.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Progression</span>
            </div>
            <div className="text-2xl font-bold">{metrics.averageProgress.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Moyenne projets</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calculator className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Budget utilisé</span>
            </div>
            <div className="text-2xl font-bold">{((metrics.totalSpent / metrics.totalBudget) * 100).toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">€{metrics.totalSpent.toLocaleString()} / €{metrics.totalBudget.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques et projets récents */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Projets par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { status: 'En cours', count: metrics.activeProjects, color: 'bg-blue-500' },
                { status: 'Terminés', count: metrics.completedProjects, color: 'bg-green-500' },
                { status: 'En pause', count: metrics.onHoldProjects, color: 'bg-orange-500' },
                { status: 'Planifiés', count: projects.filter(p => p.status === 'planning').length, color: 'bg-gray-500' }
              ].map((item) => {
                const percentage = metrics.totalProjects > 0 ? (item.count / metrics.totalProjects) * 100 : 0;
                return (
                  <div key={item.status} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.status}</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <Progress value={percentage} className="w-20 h-2" />
                      <span className="text-sm text-muted-foreground">{item.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(projects || []).slice(0, 4).map((project) => (
                <div key={project.id} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    project.status === 'in_progress' ? 'bg-blue-500' :
                    project.status === 'completed' ? 'bg-green-500' :
                    project.status === 'on_hold' ? 'bg-orange-500' : 'bg-gray-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{project.name}</p>
                    <p className="text-xs text-muted-foreground">{project.client} • {project.progress}%</p>
                  </div>
                  <Badge variant={project.status === 'in_progress' ? 'default' : project.status === 'completed' ? 'secondary' : 'outline'}>
                    {project.status === 'in_progress' ? 'En cours' :
                     project.status === 'completed' ? 'Terminé' :
                     project.status === 'on_hold' ? 'Pause' : 'Planifié'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
