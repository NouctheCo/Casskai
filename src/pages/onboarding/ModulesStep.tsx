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

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useOnboarding } from '@/hooks/useOnboarding';
import {
  Building2,
  Calculator,
  FileText,
  TrendingUp,
  Users,
  Package,
  CreditCard,
  BarChart3,
  Settings,
  CheckCircle,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { moduleService } from '@/services/moduleService';

interface ModuleOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  recommended: boolean;
  estimatedSetupTime: number;
}

// Mapping des icônes pour les modules
const iconMap = {
  dashboard: <BarChart3 className="h-5 w-5" />,
  settings: <Settings className="h-5 w-5" />,
  accounting: <Calculator className="h-5 w-5" />,
  invoicing: <FileText className="h-5 w-5" />,
  banking: <CreditCard className="h-5 w-5" />,
  inventory: <Package className="h-5 w-5" />,
  crm: <Users className="h-5 w-5" />,
  reports: <TrendingUp className="h-5 w-5" />,
  users: <Users className="h-5 w-5" />,
  security: <Building2 className="h-5 w-5" />,
  salesCrm: <Users className="h-5 w-5" />,
  purchases: <FileText className="h-5 w-5" />,
  projects: <BarChart3 className="h-5 w-5" />,
  thirdParties: <Users className="h-5 w-5" />,
  humanResources: <Users className="h-5 w-5" />,
  tax: <Calculator className="h-5 w-5" />,
  forecasts: <TrendingUp className="h-5 w-5" />,
  contracts: <FileText className="h-5 w-5" />
};

// Générer les options de modules depuis le service centralisé
const availableModules: ModuleOption[] = moduleService.getAllModules().map(module => ({
  id: module.key,
  name: module.name,
  description: `Module ${module.name.toLowerCase()} pour CassKai`,
  icon: iconMap[module.key as keyof typeof iconMap] || <Settings className="h-5 w-5" />,
  category: module.category,
  recommended: module.required || ['dashboard', 'accounting', 'invoicing'].includes(module.key),
  estimatedSetupTime: module.required ? 5 : 10
}));

const ModulesStep: React.FC = () => {
  const { state, updateSelectedModules, goToNextStep, goToPreviousStep } = useOnboarding();
  const [selectedModules, setSelectedModules] = useState<string[]>(
    state.data?.selectedModules || []
  );

  const handleModuleToggle = (moduleId: string) => {
    setSelectedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleSelectRecommended = () => {
    const recommended = availableModules
      .filter(module => module.recommended)
      .map(module => module.id);
    setSelectedModules(recommended);
  };

  const handleSelectAll = () => {
    setSelectedModules(availableModules.map(module => module.id));
  };

  const handleContinue = () => {
    updateSelectedModules(selectedModules);
    goToNextStep();
  };

  const selectedCount = selectedModules.length;
  const totalEstimatedTime = availableModules
    .filter(module => selectedModules.includes(module.id))
    .reduce((total, module) => total + module.estimatedSetupTime, 0);

  const modulesByCategory = availableModules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, ModuleOption[]>);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      <Card className="glass-card">
        <ModulesHeader />
        <CardContent className="p-6 space-y-6">
          <ModulesSummary
            selectedCount={selectedCount}
            totalEstimatedTime={totalEstimatedTime}
            onSelectRecommended={handleSelectRecommended}
            onSelectAll={handleSelectAll}
          />
          <ModulesList
            modulesByCategory={modulesByCategory}
            selectedModules={selectedModules}
            onModuleToggle={handleModuleToggle}
          />
          <ModulesNavigation
            onPrevious={goToPreviousStep}
            onContinue={handleContinue}
            canGoPrevious={!!(state.currentStep && state.currentStep.order > 1)}
            canContinue={selectedCount > 0}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ModulesHeader: React.FC = () => (
  <CardHeader className="text-center pb-6">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
      className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
    >
      <Settings className="w-8 h-8 text-white" />
    </motion.div>
    
    <CardTitle className="text-2xl font-bold gradient-text mb-2">
      Sélection des Modules
    </CardTitle>
    <CardDescription className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
      Choisissez les fonctionnalités que vous souhaitez activer dans votre espace CassKai.
      Vous pourrez modifier ces choix plus tard dans les paramètres.
    </CardDescription>
  </CardHeader>
);

const ModulesSummary: React.FC<{
  selectedCount: number;
  totalEstimatedTime: number;
  onSelectRecommended: () => void;
  onSelectAll: () => void;
}> = ({ selectedCount, totalEstimatedTime, onSelectRecommended, onSelectAll }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3, duration: 0.5 }}
  >
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 dark:border-gray-700">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedCount} module{selectedCount !== 1 ? 's' : ''} sélectionné{selectedCount !== 1 ? 's' : ''}
            </div>
            <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
              ~{totalEstimatedTime} min de configuration
            </Badge>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectRecommended}
              className="border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900"
            >
              Recommandés
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectAll}
              className="border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900 dark:bg-blue-900/20"
            >
              Tout sélectionner
            </Button>
          </div>
        </div>
        <Progress 
          value={(selectedCount / availableModules.length) * 100} 
          className="h-2 bg-gray-200 dark:bg-gray-700"
        />
      </CardContent>
    </Card>
  </motion.div>
);

const ModulesList: React.FC<{
  modulesByCategory: Record<string, ModuleOption[]>;
  selectedModules: string[];
  onModuleToggle: (moduleId: string) => void;
}> = ({ modulesByCategory, selectedModules, onModuleToggle }) => (
  <div className="space-y-6">
    {Object.entries(modulesByCategory).map(([category, modules], index) => (
      <motion.div
        key={category}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
      >
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 dark:border-gray-700">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100 dark:text-white">
              {category === 'core' && <Settings className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
              {category === 'finance' && <Calculator className="h-5 w-5 text-green-600 dark:text-green-400" />}
              {category === 'operations' && <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
              {category === 'analytics' && <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
              <span className="capitalize font-semibold">
                {category === 'core' && 'Essentiel'}
                {category === 'finance' && 'Finance'}
                {category === 'operations' && 'Opérations'}
                {category === 'analytics' && 'Analytique'}
              </span>
              <Badge variant="outline" className="border-gray-300 dark:border-gray-600 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                {modules.length} module{modules.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {modules.map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  isSelected={selectedModules.includes(module.id)}
                  onToggle={() => onModuleToggle(module.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    ))}
  </div>
);

const ModulesNavigation: React.FC<{
  onPrevious: () => void;
  onContinue: () => void;
  canGoPrevious: boolean;
  canContinue: boolean;
}> = ({ onPrevious, onContinue, canGoPrevious, canContinue }) => (
  <div className="flex justify-between pt-6">
    <Button
      variant="outline"
      onClick={onPrevious}
      disabled={!canGoPrevious}
      className="flex items-center space-x-2"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Précédent</span>
    </Button>
    <Button
      onClick={onContinue}
      disabled={!canContinue}
      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white flex items-center space-x-2"
    >
      <span>Continuer</span>
      <ArrowRight className="w-4 h-4" />
    </Button>
  </div>
);

const ModuleCard: React.FC<{
  module: ModuleOption;
  isSelected: boolean;
  onToggle: () => void;
}> = ({ module, isSelected, onToggle }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
      isSelected
        ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-950 shadow-md'
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-sm'
    }`}
    onClick={onToggle}
  >
    <div className="flex items-start space-x-3">
      <Checkbox
        checked={isSelected}
        onChange={onToggle}
        className="mt-1"
      />
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-3">
          <div className={`p-2 rounded-lg transition-colors ${
            isSelected
              ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}>
            {module.icon}
          </div>
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white">
              {module.name}
            </h3>
            {module.recommended && (
              <Badge variant="secondary" className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
                Recommandé
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
          {module.description}
        </p>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-600 dark:border-gray-600 text-gray-600 dark:text-gray-400">
            ~{module.estimatedSetupTime} min
          </Badge>
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  </motion.div>
);

export default ModulesStep;
