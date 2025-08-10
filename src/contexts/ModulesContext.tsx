import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import ModuleManager from '@/services/moduleManager';
import { ModuleDefinition, ModuleActivation, ModuleContext } from '@/types/modules.types';

// Export the modules list for onboarding
export const ALL_MODULES = [
  { key: 'crm', name: 'CRM', isGlobal: false },
  { key: 'hr', name: 'Human Resources', isGlobal: false },
  { key: 'projects', name: 'Projects', isGlobal: false },
  { key: 'marketplace', name: 'Marketplace', isGlobal: false },
  { key: 'accounting', name: 'Accounting', isGlobal: true },
  { key: 'invoicing', name: 'Invoicing', isGlobal: true },
  { key: 'reports', name: 'Reports', isGlobal: true }
];

// Types pour le contexte des modules
interface ModulesContextType {
  // État des modules
  availableModules: ModuleDefinition[];
  activeModules: ModuleDefinition[];
  isLoading: boolean;
  error: string | null;
  
  // Actions sur les modules
  activateModule: (moduleId: string, config?: Record<string, any>) => Promise<void>;
  deactivateModule: (moduleId: string) => Promise<void>;
  isModuleActive: (moduleId: string) => boolean;
  getModuleConfig: (moduleId: string) => Record<string, any> | null;
  updateModuleConfig: (moduleId: string, config: Record<string, any>) => Promise<void>;
  
  // État d'initialisation
  isInitialized: boolean;
  
  // Fonctions utilitaires
  hasPermission: (permission: string) => boolean;
  canActivateModule: (moduleId: string) => { canActivate: boolean; reason?: string };
  refreshModules: () => Promise<void>;
}

const ModulesContext = createContext<ModulesContextType | null>(null);

// Hook pour utiliser le contexte des modules
export const useModules = () => {
  const context = useContext(ModulesContext);
  if (!context) {
    throw new Error('useModules must be used within a ModulesProvider');
  }
  return context;
};

// Provider pour la gestion des modules
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
  const [moduleManager] = useState(() => ModuleManager.getInstance());
  const [availableModules, setAvailableModules] = useState<ModuleDefinition[]>([]);
  const [activeModules, setActiveModules] = useState<ModuleDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialisation du gestionnaire de modules
  useEffect(() => {
    initializeModules();
  }, [userId, tenantId]);

  const initializeModules = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Créer le contexte de module
      const moduleContext: Partial<ModuleContext> = {
        userId,
        tenantId,
        permissions: userPermissions,
      };

      // Initialiser le gestionnaire de modules
      await moduleManager.initialize(moduleContext);

      // Enregistrer les modules disponibles
      await registerAvailableModules();

      // Charger les modules actifs
      await loadModules();

      setIsInitialized(true);
    } catch (err) {
      console.error('Erreur d\'initialisation des modules:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const registerAvailableModules = async () => {
    try {
      // Importer dynamiquement tous les modules
      const moduleImports = await Promise.allSettled([
        import('@/modules/crm/crmModule'),
        import('@/modules/hr/hrModule'),
        import('@/modules/projects/projectsModule'),
        import('@/modules/marketplace/marketplaceModule'),
      ]);

      // Enregistrer chaque module importé avec succès
      moduleImports.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const moduleNames = ['crmModule', 'hrModule', 'projectsModule', 'marketplaceModule'];
          const moduleName = moduleNames[index];
          const moduleExport = result.value[moduleName];
          
          if (moduleExport) {
            try {
              moduleManager.registerModule(moduleExport);
              console.log(`[ModulesProvider] Module ${moduleExport.definition.id} enregistré`);
            } catch (error) {
              console.error(`[ModulesProvider] Erreur enregistrement ${moduleName}:`, error);
            }
          }
        } else {
          console.error(`[ModulesProvider] Erreur import module ${index}:`, result.reason);
        }
      });

    } catch (error) {
      console.error('[ModulesProvider] Erreur d\'enregistrement des modules:', error);
      throw error;
    }
  };

  const loadModules = async () => {
    try {
      const available = moduleManager.getAvailableModules();
      const active = moduleManager.getActiveModules();
      
      setAvailableModules(available);
      setActiveModules(active);
      
      console.log(`[ModulesProvider] Chargé ${available.length} modules disponibles, ${active.length} actifs`);
    } catch (error) {
      console.error('[ModulesProvider] Erreur de chargement des modules:', error);
      throw error;
    }
  };

  const activateModule = async (moduleId: string, config: Record<string, any> = {}) => {
    try {
      setError(null);
      await moduleManager.activateModule(moduleId, userId, config);
      await loadModules(); // Recharger la liste
      
      console.log(`[ModulesProvider] Module ${moduleId} activé avec succès`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur d\'activation';
      setError(errorMessage);
      console.error(`[ModulesProvider] Erreur activation ${moduleId}:`, error);
      throw error;
    }
  };

  const deactivateModule = async (moduleId: string) => {
    try {
      setError(null);
      await moduleManager.deactivateModule(moduleId, userId);
      await loadModules(); // Recharger la liste
      
      console.log(`[ModulesProvider] Module ${moduleId} désactivé avec succès`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de désactivation';
      setError(errorMessage);
      console.error(`[ModulesProvider] Erreur désactivation ${moduleId}:`, error);
      throw error;
    }
  };

  const isModuleActive = (moduleId: string): boolean => {
    return moduleManager.isModuleActive(moduleId);
  };

  const getModuleConfig = (moduleId: string): Record<string, any> | null => {
    return moduleManager.getModuleConfig(moduleId);
  };

  const updateModuleConfig = async (moduleId: string, config: Record<string, any>) => {
    try {
      setError(null);
      await moduleManager.updateModuleConfig(moduleId, config, userId);
      
      console.log(`[ModulesProvider] Configuration du module ${moduleId} mise à jour`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de mise à jour';
      setError(errorMessage);
      console.error(`[ModulesProvider] Erreur mise à jour config ${moduleId}:`, error);
      throw error;
    }
  };

  const hasPermission = (permission: string): boolean => {
    return userPermissions.includes('*') || userPermissions.includes(permission);
  };

  const canActivateModule = (moduleId: string): { canActivate: boolean; reason?: string } => {
    const module = availableModules.find(m => m.id === moduleId);
    if (!module) {
      return { canActivate: false, reason: 'Module introuvable' };
    }

    // Vérifier si déjà actif
    if (isModuleActive(moduleId)) {
      return { canActivate: false, reason: 'Module déjà actif' };
    }

    // Vérifier les permissions
    const hasRequiredPermissions = module.permissions.every(perm => hasPermission(perm));
    if (!hasRequiredPermissions) {
      return { canActivate: false, reason: 'Permissions insuffisantes' };
    }

    // Vérifier les dépendances
    const missingDependencies = module.dependencies.filter(depId => !isModuleActive(depId));
    if (missingDependencies.length > 0) {
      return { 
        canActivate: false, 
        reason: `Dépendances manquantes: ${missingDependencies.join(', ')}` 
      };
    }

    // Vérifier les conflits
    const activeConflicts = module.conflicts.filter(conflictId => isModuleActive(conflictId));
    if (activeConflicts.length > 0) {
      return { 
        canActivate: false, 
        reason: `Conflits avec modules actifs: ${activeConflicts.join(', ')}` 
      };
    }

    // Vérifier si module premium nécessite licence
    if (module.isPremium) {
      // TODO: Vérifier la licence premium
      // Pour l'instant, on autorise
    }

    return { canActivate: true };
  };

  const refreshModules = async () => {
    await loadModules();
  };

  const contextValue: ModulesContextType = {
    availableModules,
    activeModules,
    isLoading,
    error,
    activateModule,
    deactivateModule,
    isModuleActive,
    getModuleConfig,
    updateModuleConfig,
    isInitialized,
    hasPermission,
    canActivateModule,
    refreshModules,
  };

  return (
    <ModulesContext.Provider value={contextValue}>
      {children}
    </ModulesContext.Provider>
  );
};

// Hook pour vérifier si un module spécifique est actif
export const useModuleActive = (moduleId: string) => {
  const { isModuleActive } = useModules();
  return isModuleActive(moduleId);
};

// Hook pour obtenir la configuration d'un module
export const useModuleConfig = (moduleId: string) => {
  const { getModuleConfig, updateModuleConfig } = useModules();
  const [config, setConfig] = useState(() => getModuleConfig(moduleId));

  const updateConfig = async (newConfig: Record<string, any>) => {
    await updateModuleConfig(moduleId, newConfig);
    setConfig(getModuleConfig(moduleId));
  };

  return { config, updateConfig };
};

// Hook pour les actions conditionnelles basées sur les modules
export const useConditionalFeature = (moduleId: string, feature?: string) => {
  const { isModuleActive, getModuleConfig } = useModules();
  
  const isFeatureEnabled = () => {
    if (!isModuleActive(moduleId)) return false;
    
    if (feature) {
      const config = getModuleConfig(moduleId);
      return config?.[feature] !== false; // Par défaut activé sauf si explicitement false
    }
    
    return true;
  };

  return {
    isEnabled: isFeatureEnabled(),
    isModuleActive: isModuleActive(moduleId),
  };
};

// Hook pour charger dynamiquement les composants d'un module
export const useModuleComponents = (moduleId: string) => {
  const { isModuleActive, getModule } = useModules();
  const [components, setComponents] = useState<Record<string, React.ComponentType> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isModuleActive(moduleId)) {
      setComponents(null);
      return;
    }

    const loadComponents = async () => {
      setIsLoading(true);
      try {
        // Récupérer les composants du module via le gestionnaire
        const module = ModuleManager.getInstance().getModule(moduleId);
        if (module && module.getComponents) {
          const moduleComponents = module.getComponents();
          
          // Résoudre les imports dynamiques
          const resolvedComponents: Record<string, React.ComponentType> = {};
          
          for (const [name, importFn] of Object.entries(moduleComponents)) {
            try {
              const component = await importFn();
              resolvedComponents[name] = component.default || component;
            } catch (error) {
              console.error(`[useModuleComponents] Erreur chargement composant ${name}:`, error);
            }
          }
          
          setComponents(resolvedComponents);
        }
      } catch (error) {
        console.error(`[useModuleComponents] Erreur chargement composants ${moduleId}:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    loadComponents();
  }, [moduleId, isModuleActive]);

  return { components, isLoading };
};

// HOC pour conditionner l'affichage d'un composant selon un module
export function withModuleCondition<P extends object>(
  Component: React.ComponentType<P>,
  moduleId: string,
  fallback?: React.ComponentType<P> | null
) {
  return React.forwardRef<any, P>((props, ref) => {
    const { isModuleActive } = useModules();

    if (!isModuleActive(moduleId)) {
      if (fallback) {
        const FallbackComponent = fallback;
        return <FallbackComponent {...props} ref={ref} />;
      }
      return null;
    }

    return <Component {...props} ref={ref} />;
  });
}

export default ModulesProvider;