import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, ComponentType, forwardRef, ForwardedRef } from 'react';
import ModuleManager from '@/services/moduleManager';
import { ModuleDefinition, ModuleContext, Module } from '@/types/modules.types';

// Définition de tous les modules disponibles
export const ALL_MODULES = [
  // FINANCE & COMPTABILITÉ
  {
    key: 'dashboard',
    name: 'Tableau de bord',
    description: 'Vue d\'ensemble de votre activité et indicateurs clés',
    category: 'FINANCE & COMPTABILITÉ',
    icon: 'Home',
    type: 'core' as const,
    path: '/dashboard',
    color: 'blue',
    isGlobal: true
  },
  {
    key: 'accounting',
    name: 'Comptabilité',
    description: 'Gestion complète de votre comptabilité générale',
    category: 'FINANCE & COMPTABILITÉ',
    icon: 'Briefcase',
    type: 'premium' as const,
    path: '/accounting',
    color: 'green',
    isGlobal: false
  },
  {
    key: 'banking',
    name: 'Banque',
    description: 'Synchronisation et rapprochement bancaire automatisé',
    category: 'FINANCE & COMPTABILITÉ',
    icon: 'Landmark',
    type: 'premium' as const,
    path: '/banks',
    color: 'emerald',
    isGlobal: false
  },
  {
    key: 'invoicing',
    name: 'Facturation',
    description: 'Création et gestion de vos factures clients',
    category: 'FINANCE & COMPTABILITÉ',
    icon: 'FileText',
    type: 'premium' as const,
    path: '/invoicing',
    color: 'purple',
    isGlobal: false
  },
  {
    key: 'tax',
    name: 'Fiscalité',
    description: 'Gestion fiscale et préparation des déclarations',
    category: 'FINANCE & COMPTABILITÉ',
    icon: 'Zap',
    type: 'premium' as const,
    path: '/tax',
    color: 'yellow',
    isGlobal: false
  },
  {
    key: 'reports',
    name: 'Rapports',
    description: 'Génération de rapports financiers détaillés',
    category: 'FINANCE & COMPTABILITÉ',
    icon: 'BarChart3',
    type: 'premium' as const,
    path: '/reports',
    color: 'indigo',
    isGlobal: false
  },

  // BUSINESS & VENTES
  {
    key: 'salesCrm',
    name: 'CRM & Ventes',
    description: 'Gestion complète de la relation client',
    category: 'BUSINESS & VENTES',
    icon: 'Users',
    type: 'premium' as const,
    path: '/sales-crm',
    color: 'rose',
    isGlobal: false
  },
  {
    key: 'purchases',
    name: 'Achats',
    description: 'Gestion des achats et des fournisseurs',
    category: 'BUSINESS & VENTES',
    icon: 'ShoppingCart',
    type: 'premium' as const,
    path: '/purchases',
    color: 'orange',
    isGlobal: false
  },
  {
    key: 'inventory',
    name: 'Stock & Inventaire',
    description: 'Suivi des stocks et gestion des inventaires',
    category: 'BUSINESS & VENTES',
    icon: 'Archive',
    type: 'premium' as const,
    path: '/inventory',
    color: 'teal',
    isGlobal: false
  },
  {
    key: 'contracts',
    name: 'Contrats',
    description: 'Gestion des contrats et documents légaux',
    category: 'BUSINESS & VENTES',
    icon: 'FileText',
    type: 'premium' as const,
    path: '/contracts',
    color: 'slate',
    isGlobal: false
  },
  {
    key: 'forecasts',
    name: 'Prévisions',
    description: 'Analyses prédictives et prévisions financières',
    category: 'BUSINESS & VENTES',
    icon: 'Sparkles',
    type: 'premium' as const,
    path: '/forecasts',
    color: 'cyan',
    isGlobal: false
  },

  // GESTION & PROJETS
  {
    key: 'projects',
    name: 'Projets',
    description: 'Gestion de projets et suivi des tâches',
    category: 'GESTION & PROJETS',
    icon: 'KanbanSquare',
    type: 'premium' as const,
    path: '/projects',
    color: 'blue',
    isGlobal: false
  },
  {
    key: 'humanResources',
    name: 'Ressources Humaines',
    description: 'Gestion RH complète et paie',
    category: 'GESTION & PROJETS',
    icon: 'Users2',
    type: 'premium' as const,
    path: '/hr',
    color: 'green',
    isGlobal: false
  },
  {
    key: 'thirdParties',
    name: 'Tiers',
    description: 'Gestion centralisée de tous vos contacts',
    category: 'GESTION & PROJETS',
    icon: 'UsersRound',
    type: 'premium' as const,
    path: '/third-parties',
    color: 'amber',
    isGlobal: false
  },

  // ADMINISTRATION
  {
    key: 'users',
    name: 'Utilisateurs',
    description: 'Gestion des utilisateurs et des permissions',
    category: 'ADMINISTRATION',
    icon: 'Users',
    type: 'core' as const,
    path: '/user-management',
    color: 'red',
    isGlobal: true
  },
  {
    key: 'security',
    name: 'Sécurité',
    description: 'Paramètres de sécurité et audit système',
    category: 'ADMINISTRATION',
    icon: 'Shield',
    type: 'core' as const,
    path: '/security',
    color: 'red',
    isGlobal: true
  },
  {
    key: 'settings',
    name: 'Paramètres',
    description: 'Configuration générale de l\'application',
    category: 'ADMINISTRATION',
    icon: 'Settings',
    type: 'core' as const,
    path: '/settings',
    color: 'gray',
    isGlobal: true
  }
];

// Convertir ALL_MODULES en ModuleDefinition complètes
const convertToModuleDefinitions = (modules: typeof ALL_MODULES): ModuleDefinition[] => {
  return modules.map(module => ({
    id: module.key,
    name: module.name,
    path: module.path,
    key: module.key,
    description: `${module.name} module for CassKai`,
    version: '1.0.0',
    category: module.isGlobal ? 'core' : 'business',
    icon: 'default-icon',
    status: 'available',
    isCore: module.isGlobal,
    isPremium: !module.isGlobal,
    config: {
      settings: {},
      defaultValues: {}
    },
    permissions: ['*'],
    dependencies: [],
    conflicts: [],
    pricing: module.isGlobal ? undefined : { 
      type: 'subscription' as const, 
      price: 0, 
      currency: 'EUR',
      features: [] 
    },
    author: 'CassKai',
    documentation: undefined,
    supportUrl: undefined,
    changelog: []
  }));
};

// Liste complète des modules disponibles
const ALL_MODULE_DEFINITIONS = convertToModuleDefinitions(ALL_MODULES);

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
  
  // État d\'initialisation
  isInitialized: boolean;
  
  // Fonctions utilitaires
  hasPermission: (permission: string) => boolean;
  canActivateModule: (moduleId: string) => { canActivate: boolean; reason?: string };
  canAccessModule: (moduleId: string) => boolean;
  refreshModules: () => Promise<void>;
  
  // Propriétés d\'abonnement
  currentPlan: string | null;
  isTrialUser: boolean;
  trialDaysRemaining: number;
  getAvailableModulesForPlan: (planId: string) => ModuleDefinition[];
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

// Hook sécurisé pour utiliser les modules (retourne des valeurs par défaut si pas de provider)
export const useModulesSafe = () => {
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
  const [_allModules, _setAllModules] = useState<ModuleDefinition[]>(ALL_MODULE_DEFINITIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const loadModules = useCallback(async () => {
    try {
      const available = moduleManager.getAvailableModules();
      const active = moduleManager.getActiveModules();
      
      setAvailableModules(available);
      setActiveModules(active);
    } catch (error) {
      console.error('[ModulesProvider] Erreur de chargement des modules:', error);
      throw error;
    }
  }, [moduleManager]);

  const loadDynamicModules = useCallback(async (importsPromises: Array<Promise<unknown>>) => {
    // Importer dynamiquement les modules
    const moduleImports = await Promise.allSettled(importsPromises);

    // Mettre à jour les modules avec leurs implémentations réelles
    moduleImports.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        // Seul le module CRM est chargé
        const moduleExport = (result.value as { crmModule?: Module; default?: Module })?.crmModule || (result.value as { crmModule?: Module; default?: Module })?.default || null;

        if (moduleExport) {
          try {
            // Réenregistrer avec l\'implémentation complète
            moduleManager.registerModule(moduleExport);
          } catch (error) {
            console.error(`[ModulesProvider] Erreur enregistrement module complet CRM:`, error);
          }
        }
      } else {
        console.error(`[ModulesProvider] Erreur import module ${index}:`, result.reason);
      }
    });
  }, [moduleManager]);

  const loadModulesFromGlob = useCallback(async (importsPromises: Array<Promise<unknown>>) => {
    try {
      // Utiliser import.meta.glob pour résoudre dynamiquement les modules sans dépendre de l\'alias `@` au runtime
      const glob: Record<string, () => Promise<unknown>> = import.meta.glob('/src/modules/**/crmModule.{js,ts,jsx,tsx}');
      const matches = Object.entries(glob);
      
      if (matches.length === 0) {
        return;
      }

      // Charger tous les matches (généralement un seul)
      for (const [path, loader] of matches) {
        try {
          importsPromises.push(loader());
        } catch (e) {
          console.error('[ModulesProvider] Erreur lors du push du loader pour', path, e);
        }
      }
    } catch (error) {
      console.error('[ModulesProvider] Erreur lors du chargement des modules via glob:', error);
    }
  }, []);

  const registerAvailableModules = useCallback(async () => {
    try {
      // Enregistrer d\'abord tous les modules disponibles avec leurs définitions de base
      ALL_MODULE_DEFINITIONS.forEach(moduleDef => {
        try {
          // Créer un module basique pour chaque définition
          const basicModule: Module = {
            definition: moduleDef,
            onInstall: undefined,
            onActivate: undefined,
            onDeactivate: undefined,
            getComponents: () => ({}),
            getRoutes: () => [],
            validateConfig: undefined
          };
          
          moduleManager.registerModule(basicModule);
        } catch (error) {
          console.error(`[ModulesProvider] Erreur enregistrement module de base ${moduleDef.id}:`, error);
        }
      });

      // En E2E minimal mode, ne charger AUCUN module pour éviter toute résolution Vite de sous-chemins absents
      const isE2EMinimal = (import.meta as unknown as { env: Record<string, string | undefined> }).env?.VITE_E2E_MINIMAL === 'true';
      const importsPromises: Array<Promise<unknown>> = [];

      if (!isE2EMinimal) {
        await loadModulesFromGlob(importsPromises);
      }

      await loadDynamicModules(importsPromises);

    } catch (error) {
      console.error('[ModulesProvider] Erreur d\'enregistrement des modules:', error);
      throw error;
    }
  }, [moduleManager, loadModulesFromGlob, loadDynamicModules]);

  const initializeModules = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const moduleContext: Partial<ModuleContext> = {
        userId,
        tenantId,
        permissions: userPermissions,
      };

      await moduleManager.initialize(moduleContext);
      await registerAvailableModules();
      await loadModules();

      setIsInitialized(true);
    } catch (err) {
      console.error('Erreur d\'initialisation des modules:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, [userId, tenantId, userPermissions, moduleManager, loadModules, registerAvailableModules]);

  useEffect(() => {
    const initModules = async () => {
      await initializeModules();
    };

    initModules();

    const handleModulesUpdated = (_event: CustomEvent) => {
      loadModules();
    };

    window.addEventListener('modulesUpdated', handleModulesUpdated as EventListener);

    return () => {
      window.removeEventListener('modulesUpdated', handleModulesUpdated as EventListener);
    };
  }, [initializeModules, loadModules]);

  const activateModule = async (moduleId: string, config: Record<string, unknown> = {}) => {
    try {
      setError(null);
      await moduleManager.activateModule(moduleId, userId, config);
      await loadModules(); // Recharger la liste
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

      // Mettre à jour l\'état local après la sauvegarde pour refléter les changements
      const updatedActiveModules = moduleManager.getActiveModules();
      setActiveModules(updatedActiveModules);

      console.warn(`[ModulesProvider] Configuration du module ${moduleId} mise à jour`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de mise à jour';
      setError(errorMessage);
      console.error(`[ModulesProvider] Erreur mise à jour config ${moduleId}:`, error);
      throw error;
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!userPermissions || !Array.isArray(userPermissions)) {
      return false;
    }
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
    const activeConflicts = module.conflicts.filter(conflictId => !isModuleActive(conflictId));
    if (activeConflicts.length > 0) {
      return { 
        canActivate: false, 
        reason: `Conflits avec modules actifs: ${activeConflicts.join(', ')}` 
      };
    }

    // Vérifier si module premium nécessite licence
    if (module.isPremium) {
      // TODO: Vérifier la licence premium
      // Pour l\'instant, on autorise
    }

    return { canActivate: true };
  };
  
  const canAccessModule = (moduleId: string): boolean => {
    return isModuleActive(moduleId);
  };

  const refreshModules = async () => {
    await loadModules();
  };
  
  const getModule = (moduleId: string): Module | undefined => {
    return moduleManager.getModule(moduleId);
  };

  const contextValue: ModulesContextType = {
    availableModules,
    activeModules,
    allModules: _allModules,
    isLoading,
    error,
    activateModule,
    deactivateModule,
    isModuleActive,
    getModuleConfig,
    updateModuleConfig,
    getModule,
    isInitialized,
    hasPermission,
    canActivateModule,
    canAccessModule,
    refreshModules,
    // Propriétés d\'abonnement (temporairement avec des valeurs par défaut)
    currentPlan: 'free', // TODO: Récupérer depuis Supabase
    isTrialUser: true, // TODO: Calculer depuis la date d\'inscription
    trialDaysRemaining: 14, // TODO: Calculer depuis la date d\'inscription
    getAvailableModulesForPlan: (planId: string) => {
      // TODO: Implémenter la logique selon le plan
      return _allModules.filter(module => 
        planId === 'free' ? !module.isPremium : true
      );
    },
  };

  return (
    <ModulesContext.Provider value={contextValue}>
      {children}
    </ModulesContext.Provider>
  );
};

// Hook pour vérifier si un module spécifique est actif
export const useModuleActive = (moduleId: string) => {
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
  const { isModuleActive, getModule } = useModulesSafe();
  const [components, setComponents] = useState<Record<string, ComponentType<any>>>({});
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
          const resolvedComponents: Record<string, ComponentType<any>> = {};
          
          for (const [name, importFn] of Object.entries(moduleComponents)) {
            try {
              const loaded = await (importFn as () => Promise<{ default: ComponentType<any> } | ComponentType<any>>)();
              resolvedComponents[name] = 'default' in loaded ? loaded.default : loaded;
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
  }, [moduleId, isModuleActive, getModule]);

  return { components, isLoading };
};

// HOC pour conditionner l'affichage d'un composant selon un module
export function withModuleCondition<P extends object>(
  Component: ComponentType<P>,
  moduleId: string,
  fallback: ComponentType<P> | null = null
) {
  const WrappedComponent = forwardRef<unknown, P>((props, ref) => {
    const { isModuleActive } = useModulesSafe();

    if (!isModuleActive(moduleId)) {
      if (fallback) {
        const FallbackComponent = fallback;
        return <FallbackComponent {...props as P} />;
      }
      return null;
    }

    return <Component {...props as P} ref={ref as ForwardedRef<any>} />;
  });
  WrappedComponent.displayName = `withModuleCondition(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

export default ModulesProvider;
