import React, { createContext, useState, ReactNode } from 'react';
import { ModuleDefinition, Module } from '@/types/modules.types';
import { useSubscription } from './SubscriptionContext';
import { ALL_MODULE_DEFINITIONS, PLAN_MODULES } from '@/constants/modules.constants';

// Types pour le contexte des modules
export interface ModulesContextType {
  // État des modules
  availableModules: ModuleDefinition[];
  activeModules: ModuleDefinition[];
  allModules: ModuleDefinition[];
  isLoading: boolean;
  error: string | null;

  // Actions sur les modules
  activateModule: (moduleId: string, config?: Record<string, unknown>) => Promise<void>;
  deactivateModule: (moduleId: string) => Promise<void>;
  isModuleActive: (moduleId: string) => boolean;
  getModuleConfig: (moduleId: string) => Record<string, unknown> | null;
  updateModuleConfig: (moduleId: string, config: Record<string, unknown>) => Promise<void>;
  getModule: (moduleId: string) => Module | undefined;

  // État d'initialisation
  isInitialized: boolean;

  // Fonctions utilitaires
  hasPermission: (permission: string) => boolean;
  canActivateModule: (moduleId: string) => { canActivate: boolean; reason?: string };
  canAccessModule: (moduleId: string) => boolean;
  refreshModules: () => Promise<void>;

  // Propriétés d'abonnement
  currentPlan: string | null;
  isTrialUser: boolean;
  trialDaysRemaining: number;
  getAvailableModulesForPlan: (planId: string) => ModuleDefinition[];
}

const ModulesContext = createContext<ModulesContextType | null>(null);

export { ModulesContext };

// Provider basique pour la gestion des modules
interface ModulesProviderProps {
  children: ReactNode;
  userId: string;
  tenantId: string;
  userPermissions: string[];
}

export const ModulesProvider: React.FC<ModulesProviderProps> = ({
  children,
  userId,
  tenantId,
  userPermissions,
}) => {
  // État basique pour commencer
  const [availableModules] = useState<ModuleDefinition[]>(ALL_MODULE_DEFINITIONS);
  const [activeModules] = useState<ModuleDefinition[]>([]);
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const [isInitialized] = useState(true);
  const { subscriptionPlan } = useSubscription();

  // Valeurs par défaut pour le contexte
  const contextValue: ModulesContextType = {
    availableModules,
    activeModules,
    allModules: ALL_MODULE_DEFINITIONS,
    isLoading,
    error,
    activateModule: async () => {},
    deactivateModule: async () => {},
    isModuleActive: () => false,
    getModuleConfig: () => null,
    updateModuleConfig: async () => {},
    getModule: () => undefined,
    isInitialized,
    hasPermission: () => true,
    canActivateModule: () => ({ canActivate: true }),
    canAccessModule: () => true,
    refreshModules: async () => {},
    currentPlan: subscriptionPlan,
    isTrialUser: false,
    trialDaysRemaining: 0,
    getAvailableModulesForPlan: (planId: string) => {
      const allowedModules = PLAN_MODULES[planId] || [];
      return ALL_MODULE_DEFINITIONS.filter(module => allowedModules.includes(module.key));
    },
  };

  return (
    <ModulesContext.Provider value={contextValue}>
      {children}
    </ModulesContext.Provider>
  );
};

export default ModulesProvider;