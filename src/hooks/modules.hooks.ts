import { useContext, useState, useEffect, useCallback, ComponentType } from 'react';
import { Module } from '@/types/modules.types';
import { ModulesContext, ModulesContextType } from '../contexts/ModulesContext';
import { logger } from '@/utils/logger';

// Hook pour utiliser le contexte des modules
export const useModules = (): ModulesContextType => {
  const context = useContext(ModulesContext);
  if (!context) {
    throw new Error('useModules must be used within a ModulesProvider');
  }
  return context;
};

// Hook sécurisé pour utiliser les modules (retourne des valeurs par défaut si pas de provider)
export const useModulesSafe = (): ModulesContextType => {
  const context = useContext(ModulesContext);
  if (!context) {
    return {
      availableModules: [],
      activeModules: [],
      allModules: [],
      isLoading: false,
      error: null,
      activateModule: async () => {},
      deactivateModule: async () => {},
      isModuleActive: () => false,
      getModuleConfig: () => null,
      updateModuleConfig: async () => {},
      getModule: () => undefined,
      isInitialized: false,
      hasPermission: () => false,
      canActivateModule: () => ({ canActivate: false, reason: 'ModulesProvider not available' }),
      canAccessModule: () => false,
      refreshModules: async () => {},
      currentPlan: null,
      isTrialUser: false,
      trialDaysRemaining: 0,
      getAvailableModulesForPlan: () => [],
    } as ModulesContextType;
  }
  return context;
};

// Hook pour vérifier si un module spécifique est actif
export const useModuleActive = (moduleId: string): boolean => {
  const { isModuleActive } = useModulesSafe();
  return isModuleActive(moduleId);
};

// Hook pour obtenir la configuration d'un module
export const useModuleConfig = (moduleId: string) => {
  const { getModuleConfig, updateModuleConfig } = useModulesSafe();
  const [config, setConfig] = useState(() => getModuleConfig(moduleId));

  const updateConfig = async (newConfig: Record<string, unknown>) => {
    await updateModuleConfig(moduleId, newConfig);
    setConfig(getModuleConfig(moduleId));
  };

  return { config, updateConfig };
};

// Hook pour les actions conditionnelles basées sur les modules
export const useConditionalFeature = (moduleId: string, feature?: string) => {
  const { isModuleActive, getModuleConfig } = useModulesSafe();

  const isEnabled = isModuleActive(moduleId);
  const config = getModuleConfig(moduleId);

  // Si une feature spécifique est demandée, vérifier dans la config
  if (feature && config && typeof config === 'object') {
    return {
      isEnabled: isEnabled && (config as Record<string, unknown>)[feature] === true,
      config
    };
  }

  return { isEnabled, config };
};

// Hook pour charger dynamiquement les composants d'un module
export const useModuleComponents = (moduleId: string) => {
  const { isModuleActive, getModule } = useModulesSafe();
  const [components, setComponents] = useState<Record<string, ComponentType<unknown>>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isModuleActive(moduleId)) {
      setComponents({});
      return;
    }

    const loadComponents = async () => {
      setIsLoading(true);
      try {
        const module = getModule(moduleId);
        if (module && module.getComponents) {
          const moduleComponents = module.getComponents();
          const resolvedComponents: Record<string, ComponentType<unknown>> = {};

          // Charger les composants en parallèle pour éviter await dans une boucle
          const componentPromises = Object.entries(moduleComponents).map(async ([name, importFn]) => {
            try {
              const loaded = await (importFn as () => Promise<{ default: ComponentType<unknown> } | ComponentType<unknown>>)();
              return { name, component: 'default' in loaded ? loaded.default : loaded };
            } catch (error) {
              logger.error(`[useModuleComponents] Erreur chargement composant ${name}:`, error);
              return null;
            }
          });

          const results = await Promise.all(componentPromises);
          results.forEach(result => {
            if (result) {
              resolvedComponents[result.name] = result.component;
            }
          });

          setComponents(resolvedComponents);
        }
      } catch (error) {
        logger.error(`[useModuleComponents] Erreur chargement composants ${moduleId}:`, error)
      } finally {
        setIsLoading(false);
      }
    };

    loadComponents();
  }, [moduleId, isModuleActive, getModule]);

  return { components, isLoading };
};