
import React, { createContext, useState, useMemo, useEffect, useCallback, useRef, ReactNode } from 'react';
import { ModuleDefinition, Module } from '@/types/modules.types';
import { supabase } from '@/lib/supabase';
import { useSubscription } from './SubscriptionContext';
import { ALL_MODULE_DEFINITIONS } from '@/constants/modules.constants';
import { getModulesForPlan } from '@/types/subscription.types';

const CORE_MODULES = ['dashboard', 'settings', 'security', 'users'];

export interface ModulesContextType {
  availableModules: ModuleDefinition[];
  activeModules: ModuleDefinition[];
  allModules: ModuleDefinition[];
  isLoading: boolean;
  error: string | null;
  activateModule: (moduleId: string, config?: Record<string, unknown>) => Promise<void>;
  deactivateModule: (moduleId: string) => Promise<void>;
  isModuleActive: (moduleId: string) => boolean;
  getModuleConfig: (moduleId: string) => Record<string, unknown> | null;
  updateModuleConfig: (moduleId: string, config: Record<string, unknown>) => Promise<void>;
  getModule: (moduleId: string) => Module | undefined;
  isInitialized: boolean;
  hasPermission: (permission: string) => boolean;
  canActivateModule: (moduleId: string) => { canActivate: boolean; reason?: string };
  canAccessModule: (moduleId: string) => boolean;
  refreshModules: () => Promise<void>;
  currentPlan: string | null;
  isTrialUser: boolean;
  trialDaysRemaining: number;
  getAvailableModulesForPlan: (planId?: string) => ModuleDefinition[];
}

const ModulesContext = createContext<ModulesContextType | null>(null);

export { ModulesContext };

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
  const [availableModules] = useState<ModuleDefinition[]>(ALL_MODULE_DEFINITIONS);
  const [activeModuleIds, setActiveModuleIds] = useState<Set<string>>(new Set(CORE_MODULES));
  const [moduleConfigs, setModuleConfigs] = useState<Record<string, Record<string, unknown>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const skipPersistRef = useRef<Set<string>>(new Set());
  const pendingConfigRef = useRef<Map<string, Record<string, unknown>>>(new Map());
  const moduleConfigsRef = useRef<Record<string, Record<string, unknown>>>({});
  const activeModulesRef = useRef<Set<string>>(new Set(CORE_MODULES));

  const { subscriptionPlan, isTrialing, daysUntilRenewal } = useSubscription();

  useEffect(() => {
    moduleConfigsRef.current = moduleConfigs;
  }, [moduleConfigs]);

  useEffect(() => {
    activeModulesRef.current = activeModuleIds;
  }, [activeModuleIds]);

  const syncFromStateMap = useCallback((states: Record<string, boolean>) => {
    const effectiveStates: Record<string, boolean> = { ...states };
    CORE_MODULES.forEach(core => {
      effectiveStates[core] = true;
    });

    const nextActive = new Set<string>();
    Object.entries(effectiveStates).forEach(([key, value]) => {
      if (value !== false) {
        nextActive.add(key);
      }
    });

    if (!nextActive.size) {
      CORE_MODULES.forEach(core => nextActive.add(core));
    }

    activeModulesRef.current = nextActive;
    setActiveModuleIds(nextActive);

    const simpleRecord = Array.from(nextActive).reduce<Record<string, boolean>>((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});

    try {
      localStorage.setItem('casskai_modules', JSON.stringify(simpleRecord));
      localStorage.setItem('casskai-module-states', JSON.stringify(effectiveStates));
    } catch (storageError) {
      console.warn("[ModulesProvider] Impossible de persister l'état des modules dans localStorage:", storageError);
    }
  }, []);

  const persistModuleState = useCallback(async (
    moduleId: string,
    isActive: boolean,
    config?: Record<string, unknown>,
  ) => {
    if (!tenantId) return;

    try {
      const moduleDefinition = availableModules.find(m => m.key === moduleId);
      const payload: Record<string, unknown> = {
        company_id: tenantId,
        module_key: moduleId,
        module_name: moduleDefinition?.name ?? moduleId,
        is_enabled: isActive,
        updated_at: new Date().toISOString(),
      };

      const finalConfig = config ?? moduleConfigsRef.current[moduleId];
      if (finalConfig && Object.keys(finalConfig).length > 0) {
        payload.configuration = finalConfig;
      }

      const { error: upsertError } = await supabase
        .from('company_modules')
        .upsert(payload, { onConflict: 'company_id,module_key' });

      if (upsertError) {
        console.error('[ModulesProvider] Erreur persistance module:', upsertError);
        setError(upsertError.message ?? 'Erreur lors de la mise à jour des modules');
      }
    } catch (persistError) {
      console.error('[ModulesProvider] Erreur inattendue persistance module:', persistError);
      setError(persistError instanceof Error ? persistError.message : 'Erreur lors de la mise à jour des modules');
    }
  }, [tenantId, availableModules]);

  const loadModules = useCallback(async () => {
    if (!tenantId) {
      setIsLoading(false);
      const storedStates = localStorage.getItem('casskai-module-states');
      const states = storedStates ? JSON.parse(storedStates) : {};
      syncFromStateMap(states);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('company_modules')
        .select('module_key, is_enabled')
        .eq('company_id', tenantId);

      if (fetchError) {
        throw fetchError;
      }

      if (data && data.length > 0) {
        const stateMap: Record<string, boolean> = {};
        const configs: Record<string, Record<string, unknown>> = {};

        data.forEach(entry => {
          stateMap[entry.module_key] = entry.is_enabled !== false;
          // Configuration sera ajoutée plus tard si nécessaire
          // if (entry.configuration) {
          //   configs[entry.module_key] = entry.configuration as Record<string, unknown>;
          // }
        });

        CORE_MODULES.forEach(core => {
          stateMap[core] = true;
        });

        setModuleConfigs(configs);
        pendingConfigRef.current.clear();
        syncFromStateMap(stateMap);
        setError(null);
      } else {
        const storedStatesStr = localStorage.getItem('casskai-module-states');
        const storedStates = storedStatesStr ? JSON.parse(storedStatesStr) : {};
        if (Object.keys(storedStates).length > 0) {
          syncFromStateMap(storedStates);
        } else {
          const simple = localStorage.getItem('casskai_modules');
          if (simple) {
            try {
              const parsed = JSON.parse(simple) as Record<string, boolean>;
              const stateMap = Object.entries(parsed).reduce<Record<string, boolean>>((acc, [key, value]) => {
                acc[key] = value !== false;
                return acc;
              }, {});
              CORE_MODULES.forEach(core => {
                stateMap[core] = true;
              });
              syncFromStateMap(stateMap);
            } catch (parseError) {
              console.warn('[ModulesProvider] Impossible de parser casskai_modules:', parseError);
              syncFromStateMap({});
            }
          } else {
            syncFromStateMap({});
          }
        }
        setError(null);
      }
    } catch (loadError) {
      console.error('[ModulesProvider] Erreur chargement modules:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Erreur lors du chargement des modules');
      const fallbackStates = localStorage.getItem('casskai-module-states');
      const states = fallbackStates ? JSON.parse(fallbackStates) : {};
      syncFromStateMap(states);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, syncFromStateMap]);

  useEffect(() => {
    loadModules();
  }, [loadModules, userId]);

  useEffect(() => {
    const handleModuleStateChange = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail as { moduleKey?: string; isActive?: boolean; allStates?: Record<string, boolean> } | undefined;
      if (!detail) {
        return;
      }

      const { moduleKey, isActive, allStates } = detail;

      if (moduleKey && typeof isActive === 'boolean') {
        if (skipPersistRef.current.has(moduleKey)) {
          skipPersistRef.current.delete(moduleKey);
        } else {
          const pendingConfig = pendingConfigRef.current.get(moduleKey);
          await persistModuleState(moduleKey, isActive, pendingConfig);
          if (pendingConfig && isActive) {
            pendingConfigRef.current.delete(moduleKey);
          }
        }

        if (!isActive) {
          setModuleConfigs(prev => {
            if (!(moduleKey in prev)) {
              return prev;
            }
            const next = { ...prev };
            delete next[moduleKey];
            return next;
          });
          pendingConfigRef.current.delete(moduleKey);
        }
      }

      if (allStates) {
        syncFromStateMap(allStates);
      } else {
        const storedStates = localStorage.getItem('casskai-module-states');
        const states = storedStates ? JSON.parse(storedStates) : {};
        syncFromStateMap(states);
      }
    };

    const handleModuleStatesReset = () => {
      const storedStates = localStorage.getItem('casskai-module-states');
      const states = storedStates ? JSON.parse(storedStates) : {};
      syncFromStateMap(states);
    };

    const handleSubscriptionChange = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail as { userId?: string; newPlanId?: string } | undefined;
      
      console.log('[ModulesProvider] Subscription changed:', detail);
      
      // Recharger les modules pour mettre à jour allowedModuleKeys
      await loadModules();
      
      // Désactiver les modules qui ne sont plus disponibles dans le nouveau plan
      if (detail?.newPlanId) {
        const newPlanModules = getModulesForPlan(detail.newPlanId) || [];
        const newAllowedModules = Array.from(new Set([...CORE_MODULES, ...newPlanModules]));
        
        const currentStates = localStorage.getItem('casskai-module-states');
        const states = currentStates ? JSON.parse(currentStates) : {};
        
        // Désactiver les modules non autorisés
        Object.keys(states).forEach(moduleKey => {
          if (!newAllowedModules.includes(moduleKey)) {
            console.log(`[ModulesProvider] Deactivating module ${moduleKey} (not in new plan)`);
            states[moduleKey] = false;
          }
        });
        
        localStorage.setItem('casskai-module-states', JSON.stringify(states));
        syncFromStateMap(states);
      }
    };

    window.addEventListener('module-state-changed', handleModuleStateChange as EventListener);
    window.addEventListener('module-states-reset', handleModuleStatesReset);
    window.addEventListener('subscription-changed', handleSubscriptionChange as EventListener);

    return () => {
      window.removeEventListener('module-state-changed', handleModuleStateChange as EventListener);
      window.removeEventListener('module-states-reset', handleModuleStatesReset);
      window.removeEventListener('subscription-changed', handleSubscriptionChange as EventListener);
    };
  }, [persistModuleState, syncFromStateMap, loadModules]);

  const currentPlanId = subscriptionPlan || (isTrialing ? 'trial' : 'starter');
  const isTrialUser = Boolean(isTrialing || currentPlanId === 'trial');
  const trialDaysRemaining = Math.max(0, daysUntilRenewal ?? 0);

  const allowedModuleKeys = useMemo(() => {
    if (isTrialUser) {
      return availableModules.map(module => module.key);
    }
    const planModules = getModulesForPlan(currentPlanId) || [];
    return Array.from(new Set([...CORE_MODULES, ...planModules]));
  }, [availableModules, currentPlanId, isTrialUser]);

  const hasPermission = useCallback((permission: string) => {
    if (!permission) return true;
    const normalized = userPermissions || [];
    if (normalized.includes('*')) return true;
    return normalized.includes(permission);
  }, [userPermissions]);

  const canAccessModule = useCallback((moduleId: string) => {
    if (CORE_MODULES.includes(moduleId)) return true;
    return allowedModuleKeys.includes(moduleId);
  }, [allowedModuleKeys]);

  const canActivateModule = useCallback((moduleId: string) => {
    if (!canAccessModule(moduleId) && !isTrialUser) {
      return { canActivate: false, reason: 'Module non inclus dans votre abonnement actuel' };
    }

    if (!hasPermission('module:activate')) {
      return { canActivate: false, reason: 'Permission insuffisante pour activer ce module' };
    }

    const moduleDefinition = availableModules.find(module => module.key === moduleId);
    if (moduleDefinition?.dependencies?.length) {
      const missing = moduleDefinition.dependencies.filter(dep => !activeModulesRef.current.has(dep));
      if (missing.length > 0) {
        return { canActivate: false, reason: `Dépendances manquantes: ${missing.join(', ')}` };
      }
    }

    return { canActivate: true };
  }, [availableModules, canAccessModule, hasPermission, isTrialUser]);

  const activateModule = useCallback(async (moduleId: string, config: Record<string, unknown> = {}) => {
    const access = canActivateModule(moduleId);
    if (!access.canActivate) {
      throw new Error(access.reason || "Impossible d'activer ce module");
    }

    if (Object.keys(config).length > 0) {
      pendingConfigRef.current.set(moduleId, config);
      setModuleConfigs(prev => ({ ...prev, [moduleId]: config }));
    }

    skipPersistRef.current.add(moduleId);

    // Activer le module directement dans localStorage
    const currentStates = localStorage.getItem('casskai-module-states');
    const states = currentStates ? JSON.parse(currentStates) : {};
    states[moduleId] = true;
    localStorage.setItem('casskai-module-states', JSON.stringify(states));

    // Ne pas attendre la persistance pour éviter les blocages
    persistModuleState(moduleId, true, config).catch(error => {
      console.error(`[ModulesProvider] Erreur persistance activation ${moduleId}:`, error);
    });

    syncFromStateMap(states);

    // Déclencher l'événement pour synchroniser l'UI
    window.dispatchEvent(new CustomEvent('module-state-changed', {
      detail: {
        moduleKey: moduleId,
        isActive: true,
        allStates: states
      }
    }));

    // Nettoyer la référence après que tout soit traité
    skipPersistRef.current.delete(moduleId);
  }, [canActivateModule, persistModuleState, syncFromStateMap]);

  const deactivateModule = useCallback(async (moduleId: string) => {
    if (CORE_MODULES.includes(moduleId)) {
      console.warn(`[ModulesProvider] Le module ${moduleId} est un module coeur et ne peut pas être désactivé.`);
      return;
    }

    skipPersistRef.current.add(moduleId);

    // Désactiver le module directement dans localStorage
    const currentStates = localStorage.getItem('casskai-module-states');
    const states = currentStates ? JSON.parse(currentStates) : {};
    states[moduleId] = false;
    localStorage.setItem('casskai-module-states', JSON.stringify(states));

    // Ne pas attendre la persistance pour éviter les blocages
    persistModuleState(moduleId, false).catch(error => {
      console.error(`[ModulesProvider] Erreur persistance désactivation ${moduleId}:`, error);
    });

    pendingConfigRef.current.delete(moduleId);
    skipPersistRef.current.delete(moduleId);
    syncFromStateMap(states);

    // Déclencher l'événement pour synchroniser l'UI
    window.dispatchEvent(new CustomEvent('module-state-changed', {
      detail: {
        moduleKey: moduleId,
        isActive: false,
        allStates: states
      }
    }));
  }, [persistModuleState, syncFromStateMap]);

  const getModuleConfig = useCallback((moduleId: string) => {
    return moduleConfigs[moduleId] ?? null;
  }, [moduleConfigs]);

  const updateModuleConfig = useCallback(async (moduleId: string, config: Record<string, unknown>) => {
    setModuleConfigs(prev => ({ ...prev, [moduleId]: config }));
    pendingConfigRef.current.set(moduleId, config);
    await persistModuleState(moduleId, activeModulesRef.current.has(moduleId), config);
    pendingConfigRef.current.delete(moduleId);
  }, [persistModuleState]);

  const isModuleActive = useCallback((moduleId: string) => {
    return activeModuleIds.has(moduleId) || CORE_MODULES.includes(moduleId);
  }, [activeModuleIds]);

  const getModule = useCallback((moduleId: string) => {
    const moduleDefinition = availableModules.find(module => module.key === moduleId);
    if (!moduleDefinition) {
      return undefined;
    }
    return ({ definition: moduleDefinition } as unknown) as Module;
  }, [availableModules]);

  const refreshModules = useCallback(async () => {
    await loadModules();
  }, [loadModules]);

  const activeModules = useMemo(() => {
    return availableModules.filter(module => activeModuleIds.has(module.key));
  }, [availableModules, activeModuleIds]);

  const getAvailableModulesForPlan = useCallback((planId?: string) => {
    const effectivePlanId = planId || currentPlanId;
    const isTrialPlan = isTrialUser || effectivePlanId === "trial";
    if (isTrialPlan) {
      return availableModules;
    }
    const keys = getModulesForPlan(effectivePlanId) || [];
    const set = new Set([...CORE_MODULES, ...keys]);
    return availableModules.filter(module => set.has(module.key));
  }, [availableModules, currentPlanId, isTrialUser]);
  const contextValue: ModulesContextType = {
    availableModules,
    activeModules,
    allModules: availableModules,
    isLoading,
    error,
    activateModule,
    deactivateModule,
    isModuleActive,
    getModuleConfig,
    updateModuleConfig,
    getModule,
    isInitialized: !isLoading,
    hasPermission,
    canActivateModule,
    canAccessModule,
    refreshModules,
    currentPlan: currentPlanId,
    isTrialUser,
    trialDaysRemaining,
    getAvailableModulesForPlan,
  };

  return (
    <ModulesContext.Provider value={contextValue}>
      {children}
    </ModulesContext.Provider>
  );
};

export { useModules, useModulesSafe, useModuleActive, useModuleConfig, useConditionalFeature, useModuleComponents } from '@/hooks/modules.hooks';

export default ModulesProvider;
