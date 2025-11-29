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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocale } from '@/contexts/LocaleContext';

interface ProjectHeaderProps {
  onNewProject: () => void;
  itemVariants?: Record<string, unknown>;
}

export function ProjectHeader({ onNewProject, itemVariants }: ProjectHeaderProps) {
  const { t } = useLocale();

  return (
    <motion.div
      className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0"
      variants={itemVariants as any}
    >
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('projects')}
          </h1>
          <Sparkles className="h-6 w-6 text-yellow-500" />
        </div>
        <div className="flex items-center space-x-2">
          <p className="text-gray-600 dark:text-gray-400">
            {t('projectspage.suivez_vos_projets_internes_et_clients', { defaultValue: 'Suivez vos projets internes et clients.' })}
          </p>
          <Badge variant="secondary" className="text-xs">
            En temps réel
          </Badge>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={onNewProject}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            {t('projectspage.nouveau_projet', { defaultValue: 'Nouveau Projet' })}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
