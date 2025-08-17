/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import ModuleManager from '@/services/moduleManager';
import { ModuleDefinition, ModuleContext, Module } from '@/types/modules.types';

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
  activateModule: (moduleId: string, config?: Record<string, unknown>) => Promise<void>;
  deactivateModule: (moduleId: string) => Promise<void>;
  isModuleActive: (moduleId: string) => boolean;
  getModuleConfig: (moduleId: string) => Record<string, unknown> | null;
  updateModuleConfig: (moduleId: string, config: Record<string, unknown>) => Promise<void>;
  
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

/* eslint-disable max-lines-per-function */
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

  // Callbacks declared first to be used by initializeModules

  // Active les modules choisis pendant l'onboarding (stockés dans casskai_modules)
  const migrateOnboardingSelections = useCallback(async () => {
    try {
      const migrationFlagKey = `casskai-modules-migrated-${tenantId}`;
      const alreadyMigrated = localStorage.getItem(migrationFlagKey);
      const storedSelections = localStorage.getItem('casskai_modules');
      if (alreadyMigrated || !storedSelections) return;

      const selections = JSON.parse(storedSelections) as Record<string, boolean>;
      const moduleIds = Object.keys(selections).filter(k => selections[k]);

  const tasks = moduleIds.map(async (moduleId) => {
        try {
          const available = moduleManager.getAvailableModules().some(m => m.id === moduleId);
          if (available && !moduleManager.isModuleActive(moduleId)) {
            await moduleManager.activateModule(moduleId, userId, {});
          }
        } catch (e) {
          console.warn(`[ModulesProvider] Impossible d'activer le module '${moduleId}' depuis l'onboarding:`, e);
        }
      });

      await Promise.allSettled(tasks);

      // Marquer la migration comme effectuée pour ce tenant
      localStorage.setItem(migrationFlagKey, '1');
    } catch (e) {
      console.warn('[ModulesProvider] Migration des modules onboarding échouée (non bloquant):', e);
    }
  }, [moduleManager, tenantId, userId]);

  const registerAvailableModules = useCallback(async () => {
    try {
      // Importer dynamiquement tous les modules
      const [crmRes, hrRes, projectsRes, marketplaceRes] = await Promise.allSettled([
        import('@/modules/crm/crmModule'),
        import('@/modules/hr/hrModule'),
        import('@/modules/projects/projectsModule'),
        import('@/modules/marketplace/marketplaceModule'),
      ]);

      const entries: Array<{ name: string; mod?: Module; reason?: unknown }> = [];
      if (crmRes.status === 'fulfilled') entries.push({ name: 'crmModule', mod: crmRes.value.crmModule as unknown as Module }); else entries.push({ name: 'crmModule', reason: crmRes.reason });
      if (hrRes.status === 'fulfilled') entries.push({ name: 'hrModule', mod: hrRes.value.hrModule as unknown as Module }); else entries.push({ name: 'hrModule', reason: hrRes.reason });
      if (projectsRes.status === 'fulfilled') entries.push({ name: 'projectsModule', mod: projectsRes.value.projectsModule as unknown as Module }); else entries.push({ name: 'projectsModule', reason: projectsRes.reason });
      if (marketplaceRes.status === 'fulfilled') entries.push({ name: 'marketplaceModule', mod: marketplaceRes.value.marketplaceModule as unknown as Module }); else entries.push({ name: 'marketplaceModule', reason: marketplaceRes.reason });

      for (const { name, mod, reason } of entries) {
        if (!mod) {
          if (reason) console.error(`[ModulesProvider] Erreur import module ${name}:`, reason);
          continue;
        }
        try {
          const modId = mod.definition?.id;
          if (modId && !moduleManager.getModule(modId)) {
            moduleManager.registerModule(mod);
            console.warn(`[ModulesProvider] Module ${modId} enregistré`);
          } else {
            console.warn(`[ModulesProvider] Module ${modId} déjà enregistré, on saute`);
          }
        } catch (error) {
          console.error(`[ModulesProvider] Erreur enregistrement ${name}:`, error);
        }
      }

    } catch (error) {
      console.error('[ModulesProvider] Erreur d\'enregistrement des modules:', error);
      throw error;
    }
  }, [moduleManager]);

  const loadModules = useCallback(async () => {
    try {
      const available = moduleManager.getAvailableModules();
      const active = moduleManager.getActiveModules();
      
      setAvailableModules(available);
      setActiveModules(active);
      
  console.warn(`[ModulesProvider] Chargé ${available.length} modules disponibles, ${active.length} actifs`);
    } catch (error) {
      console.error('[ModulesProvider] Erreur de chargement des modules:', error);
      throw error;
    }
  }, [moduleManager]);

  // Initialisation du gestionnaire de modules
  const initializeModules = useCallback(async () => {
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

      // Migration one-shot: activer les modules choisis durant l'onboarding
      await migrateOnboardingSelections();

      // Charger les modules actifs
      await loadModules();

      setIsInitialized(true);
    } catch (err) {
      console.error('Erreur d\'initialisation des modules:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, [moduleManager, tenantId, userId, userPermissions, registerAvailableModules, migrateOnboardingSelections, loadModules]);

  // Initialisation du gestionnaire de modules
  useEffect(() => {
    void initializeModules();
  }, [initializeModules]);

  const activateModule = async (moduleId: string, config: Record<string, unknown> = {}) => {
    try {
      setError(null);
      await moduleManager.activateModule(moduleId, userId, config);
      await loadModules(); // Recharger la liste
      
  console.warn(`[ModulesProvider] Module ${moduleId} activé avec succès`);
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
      
  console.warn(`[ModulesProvider] Module ${moduleId} désactivé avec succès`);
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

  const getModuleConfig = (moduleId: string): Record<string, unknown> | null => {
    return moduleManager.getModuleConfig(moduleId);
  };

  const updateModuleConfig = async (moduleId: string, config: Record<string, unknown>) => {
    try {
      setError(null);
      await moduleManager.updateModuleConfig(moduleId, config, userId);
      
  console.warn(`[ModulesProvider] Configuration du module ${moduleId} mise à jour`);
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

  const updateConfig = async (newConfig: Record<string, unknown>) => {
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
  const { isModuleActive } = useModules();
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
      // Utilise directement les composants fournis par le module
      setComponents(moduleComponents as unknown as Record<string, React.ComponentType>);
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
  return (props: P) => {
    const { isModuleActive } = useModules();

    if (!isModuleActive(moduleId)) {
      if (fallback) {
        const FallbackComponent = fallback;
        return <FallbackComponent {...props} />;
      }
      return null;
    }

    return <Component {...props} />;
  };
}

export default ModulesProvider;