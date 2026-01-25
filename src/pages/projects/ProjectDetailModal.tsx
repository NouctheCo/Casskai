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
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Briefcase,
  XCircle,
  Edit,
  Users,
  FileText,
  Download
} from 'lucide-react';
import { Project } from './ProjectList';

interface ProjectDetailModalProps {
  project: Project;
  onClose: () => void;
}

export function ProjectDetailModal({ project, onClose }: ProjectDetailModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl ${
                project.status === 'in_progress' ? 'bg-blue-500' :
                project.status === 'completed' ? 'bg-green-500' :
                project.status === 'on_hold' ? 'bg-orange-500' : 'bg-gray-500'
              }`}>
                <Briefcase className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{project.name}</h2>
                <p className="text-muted-foreground">{project.client} • {project.category}</p>
                <p className="text-sm text-muted-foreground">Chef de projet: {project.manager}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <XCircle className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Description:</span>
                  <span className="text-sm max-w-[200px] text-right">{project.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Date de début:</span>
                  <span className="text-sm">{project.startDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Date de fin:</span>
                  <span className="text-sm">{project.endDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Priorité:</span>
                  <Badge variant={project.priority === 'high' ? 'destructive' : project.priority === 'medium' ? 'secondary' : 'outline'}>
                    {project.priority === 'high' ? 'Haute' : project.priority === 'medium' ? 'Moyenne' : 'Basse'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Statut:</span>
                  <Badge variant={project.status === 'in_progress' ? 'default' : project.status === 'completed' ? 'secondary' : 'outline'}>
                    {project.status === 'in_progress' ? 'En cours' :
                     project.status === 'completed' ? 'Terminé' :
                     project.status === 'on_hold' ? 'Pause' : 'Planifié'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Budget et finances</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Budget total:</span>
                  <span className="text-sm font-medium">{formatCurrency(project.budget)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Dépensé:</span>
                  <span className="text-sm font-medium">{formatCurrency(project.spent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Revenus:</span>
                  <span className="text-sm font-medium text-green-600">{formatCurrency(project.revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Profit:</span>
                  <span className={`text-sm font-medium ${(project.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(project.profit || 0)}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Progression:</span>
                    <span className="text-sm">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Équipe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold dark:bg-blue-900/20">
                      {project.manager.split(' ').map(n => n.charAt(0)).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{project.manager}</p>
                      <p className="text-xs text-muted-foreground">Chef de projet</p>
                    </div>
                  </div>
                  {project.team.map((member, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold dark:bg-gray-900/30">
                        {member.split(' ').map(n => n.charAt(0)).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{member}</p>
                        <p className="text-xs text-muted-foreground">Équipier</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier le projet
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Gérer l'équipe
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Générer facture
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Rapport détaillé
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
