import { AVAILABLE_MODULES, getModulesForPlan, isModuleAllowedForPlan } from '@/types/subscription.types';

/**
 * Service centralisé pour la gestion des modules
 */
export class ModuleService {
  private static instance: ModuleService;

  static getInstance(): ModuleService {
    if (!ModuleService.instance) {
      ModuleService.instance = new ModuleService();
    }
    return ModuleService.instance;
  }

  /**
   * Récupère tous les modules disponibles
   */
  getAllModules() {
    return AVAILABLE_MODULES;
  }

  /**
   * Récupère les modules autorisés pour un plan
   */
  getModulesForPlan(planId: string) {
    return getModulesForPlan(planId);
  }

  /**
   * Vérifie si un module est autorisé pour un plan
   */
  isModuleAllowedForPlan(moduleKey: string, planId: string): boolean {
    return isModuleAllowedForPlan(moduleKey, planId);
  }

  /**
   * Récupère les modules par catégorie
   */
  getModulesByCategory() {
    const categories: Record<string, typeof AVAILABLE_MODULES> = {};

    AVAILABLE_MODULES.forEach(module => {
      if (!categories[module.category]) {
        categories[module.category] = [];
      }
      categories[module.category].push(module);
    });

    return categories;
  }

  /**
   * Récupère les modules requis (toujours disponibles)
   */
  getRequiredModules() {
    return AVAILABLE_MODULES.filter(module => module.required);
  }

  /**
   * Récupère les modules optionnels
   */
  getOptionalModules() {
    return AVAILABLE_MODULES.filter(module => !module.required);
  }

  /**
   * Recherche un module par sa clé
   */
  getModuleByKey(key: string) {
    return AVAILABLE_MODULES.find(module => module.key === key);
  }
}

export const moduleService = ModuleService.getInstance();