/**
 * Service pour gérer l'état des modules (activation/désactivation)
 */

export interface ModuleState {
  [moduleKey: string]: boolean;
}

const STORAGE_KEY = 'casskai-module-states';

export class ModuleStateService {
  private static instance: ModuleStateService;

  static getInstance(): ModuleStateService {
    if (!ModuleStateService.instance) {
      ModuleStateService.instance = new ModuleStateService();
    }
    return ModuleStateService.instance;
  }

  /**
   * Obtenir l'état d'un module
   */
  getModuleState(moduleKey: string): boolean {
    const states = this.getAllModuleStates();
    return states[moduleKey] !== false; // Par défaut actif
  }

  /**
   * Obtenir tous les états des modules
   */
  getAllModuleStates(): ModuleState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Erreur lecture états modules:', error);
    }
    return {}; // État par défaut vide (tous actifs)
  }

  /**
   * Sauvegarder l'état d'un module
   */
  setModuleState(moduleKey: string, isActive: boolean): void {
    const currentStates = this.getAllModuleStates();
    const newStates = { ...currentStates, [moduleKey]: isActive };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newStates));
      
      // Émettre un événement pour notifier les autres composants
      const event = new CustomEvent('module-state-changed', {
        detail: { moduleKey, isActive, allStates: newStates }
      });
      window.dispatchEvent(event);
      
    } catch (error) {
      console.error('Erreur sauvegarde état module:', error);
    }
  }

  /**
   * Obtenir la liste des modules actifs
   */
  getActiveModules(): string[] {
    const states = this.getAllModuleStates();
    return Object.entries(states)
      .filter(([key, isActive]) => isActive !== false)
      .map(([key]) => key);
  }

  /**
   * Obtenir la liste des modules inactifs
   */
  getInactiveModules(): string[] {
    const states = this.getAllModuleStates();
    return Object.entries(states)
      .filter(([key, isActive]) => isActive === false)
      .map(([key]) => key);
  }

  /**
   * Réinitialiser tous les modules à l'état actif
   */
  resetToDefault(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      
      // Notifier le changement
      const event = new CustomEvent('module-states-reset');
      window.dispatchEvent(event);
      
    } catch (error) {
      console.error('Erreur reset états modules:', error);
    }
  }

  /**
   * Vérifier si un module est considéré comme "core" (non désactivable)
   */
  isCoreModule(moduleKey: string): boolean {
    // Modules vraiment essentiels qui ne peuvent PAS être désactivés
    const coreModules = [
      'dashboard',  // Toujours nécessaire
      'settings',   // Configuration essentielle
      'security',   // Sécurité essentielle
      'users'       // Gestion des utilisateurs essentielle
    ];
    return coreModules.includes(moduleKey);
  }

  /**
   * Activer un module avec vérifications
   */
  activateModule(moduleKey: string, checkPermissions = true): boolean {
    if (checkPermissions) {
      // TODO: Ajouter vérifications d'abonnement si nécessaire
    }

    this.setModuleState(moduleKey, true);
    return true;
  }

  /**
   * Désactiver un module avec vérifications
   */
  deactivateModule(moduleKey: string): boolean {
    if (this.isCoreModule(moduleKey)) {
      console.warn(`Le module ${moduleKey} ne peut pas être désactivé (module core)`);
      return false;
    }

    this.setModuleState(moduleKey, false);
    return true;
  }
}

// Export singleton
export const moduleStateService = ModuleStateService.getInstance();