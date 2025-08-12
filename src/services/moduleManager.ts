// Service de gestion des modules - Architecture modulaire CassKai

import { 
  ModuleDefinition, 
  Module, 
  ModuleActivation, 
  ModuleContext, 
  ModuleError,
  ModuleDependencyError,
  ModuleConflictError
} from '@/types/modules.types';

// Service principal de gestion des modules
export class ModuleManager {
  private static instance: ModuleManager;
  private modules: Map<string, Module> = new Map();
  private activations: Map<string, ModuleActivation> = new Map();
  private dependencies: Map<string, string[]> = new Map();
  private isInitialized = false;
  private tenantId: string | null = null;

  private constructor() {}

  static getInstance(): ModuleManager {
    if (!ModuleManager.instance) {
      ModuleManager.instance = new ModuleManager();
    }
    return ModuleManager.instance;
  }

  // Initialisation du gestionnaire de modules
  async initialize(context: Partial<ModuleContext>): Promise<void> {
    try {
      this.tenantId = context.tenantId ?? 'default';
      // Charger les activations depuis la base de données
      await this.loadActivations(this.tenantId!);
      
      // Initialiser les modules core automatiquement
      await this.initializeCoreModules(context);
      
      this.isInitialized = true;
      console.log('[ModuleManager] Initialisé avec succès');
    } catch (error) {
      console.error('[ModuleManager] Erreur d\'initialisation:', error);
      throw error;
    }
  }

  // Enregistrer un module
  registerModule(module: Module): void {
    const { id } = module.definition;
    
    if (this.modules.has(id)) {
      throw new ModuleError(`Module ${id} already registered`, id, 'DUPLICATE_REGISTRATION');
    }

    // Valider la définition du module
    this.validateModuleDefinition(module.definition);
    
    this.modules.set(id, module);
    this.dependencies.set(id, module.definition.dependencies);
    
    console.log(`[ModuleManager] Module ${id} enregistré`);
  }

  // Activer un module
  async activateModule(moduleId: string, userId: string, config: Record<string, any> = {}): Promise<void> {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new ModuleError(`Module ${moduleId} not found`, moduleId, 'MODULE_NOT_FOUND');
    }

    // Vérifier si déjà activé
    if (this.isModuleActive(moduleId)) {
      throw new ModuleError(`Module ${moduleId} already active`, moduleId, 'ALREADY_ACTIVE');
    }

    // Vérifier les dépendances
    await this.checkDependencies(moduleId);

    // Vérifier les conflits
    this.checkConflicts(moduleId);

    // Valider la configuration
    if (module.validateConfig) {
      const isValid = module.validateConfig(config);
      if (isValid !== true) {
        throw new ModuleError(`Invalid configuration: ${isValid}`, moduleId, 'INVALID_CONFIG');
      }
    }

    try {
      // Créer le contexte d'exécution
      const context = await this.createModuleContext(moduleId, userId, config);

      // Installer le module si nécessaire
      if (module.onInstall && !this.activations.has(moduleId)) {
        await module.onInstall(context);
      }

      // Activer le module
      if (module.onActivate) {
        await module.onActivate(context);
      }

      // Enregistrer l'activation
      const activation: ModuleActivation = {
        moduleId,
        isActive: true,
        activatedAt: new Date(),
        activatedBy: userId,
        configuration: config,
      };

      this.activations.set(moduleId, activation);
      await this.saveActivation(activation);

      console.log(`[ModuleManager] Module ${moduleId} activé avec succès`);
    } catch (error) {
      const err = error as any;
      console.error(`[ModuleManager] Erreur lors de l'activation de ${moduleId}:`, err);
      throw new ModuleError(`Failed to activate module: ${err?.message || String(err)}`, moduleId, 'ACTIVATION_FAILED', err);
    }
  }

  // Désactiver un module
  async deactivateModule(moduleId: string, userId: string): Promise<void> {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new ModuleError(`Module ${moduleId} not found`, moduleId, 'MODULE_NOT_FOUND');
    }

    if (!this.isModuleActive(moduleId)) {
      throw new ModuleError(`Module ${moduleId} not active`, moduleId, 'NOT_ACTIVE');
    }

    // Vérifier si d'autres modules dépendent de celui-ci
    const dependentModules = this.getDependentModules(moduleId);
    const activeDependents = dependentModules.filter(id => this.isModuleActive(id));
    
    if (activeDependents.length > 0) {
      throw new ModuleError(
        `Cannot deactivate ${moduleId}: modules ${activeDependents.join(', ')} depend on it`,
        moduleId,
        'HAS_ACTIVE_DEPENDENTS',
        { dependentModules: activeDependents }
      );
    }

    try {
      const activation = this.activations.get(moduleId)!;
      const context = await this.createModuleContext(moduleId, userId, activation.configuration);

      // Désactiver le module
      if (module.onDeactivate) {
        await module.onDeactivate(context);
      }

      // Mettre à jour l'activation
      activation.isActive = false;
      this.activations.set(moduleId, activation);
      await this.saveActivation(activation);

      console.log(`[ModuleManager] Module ${moduleId} désactivé avec succès`);
    } catch (error) {
      const err = error as any;
      console.error(`[ModuleManager] Erreur lors de la désactivation de ${moduleId}:`, err);
      throw new ModuleError(`Failed to deactivate module: ${err?.message || String(err)}`, moduleId, 'DEACTIVATION_FAILED', err);
    }
  }

  // Vérifier si un module est actif
  isModuleActive(moduleId: string): boolean {
    const activation = this.activations.get(moduleId);
    return activation?.isActive ?? false;
  }

  // Obtenir la liste des modules disponibles
  getAvailableModules(): ModuleDefinition[] {
    return Array.from(this.modules.values()).map(module => module.definition);
  }

  // Obtenir la liste des modules actifs
  getActiveModules(): ModuleDefinition[] {
    return Array.from(this.modules.values())
      .filter(module => this.isModuleActive(module.definition.id))
      .map(module => module.definition);
  }

  // Obtenir un module spécifique
  getModule(moduleId: string): Module | undefined {
    return this.modules.get(moduleId);
  }

  // Obtenir la configuration d'un module actif
  getModuleConfig(moduleId: string): Record<string, any> | null {
    const activation = this.activations.get(moduleId);
    return activation?.isActive ? activation.configuration : null;
  }

  // Mettre à jour la configuration d'un module
  async updateModuleConfig(moduleId: string, config: Record<string, any>, _userId: string): Promise<void> {
    const module = this.modules.get(moduleId);
    const activation = this.activations.get(moduleId);

    if (!module || !activation || !activation.isActive) {
      throw new ModuleError(`Module ${moduleId} not found or not active`, moduleId, 'MODULE_NOT_ACTIVE');
    }

    // Valider la nouvelle configuration
    if (module.validateConfig) {
      const isValid = module.validateConfig(config);
      if (isValid !== true) {
        throw new ModuleError(`Invalid configuration: ${isValid}`, moduleId, 'INVALID_CONFIG');
      }
    }

    // Mettre à jour la configuration
    activation.configuration = { ...activation.configuration, ...config };
    this.activations.set(moduleId, activation);
    await this.saveActivation(activation);

    console.log(`[ModuleManager] Configuration du module ${moduleId} mise à jour`);
  }

  // Vérification des dépendances
  private async checkDependencies(moduleId: string): Promise<void> {
    const dependencies = this.dependencies.get(moduleId) || [];
    const missingDependencies: string[] = [];

    for (const depId of dependencies) {
      if (!this.isModuleActive(depId)) {
        // Essayer d'activer automatiquement la dépendance si elle existe
        if (this.modules.has(depId)) {
          try {
            await this.activateModule(depId, 'system', {});
          } catch (error) {
            missingDependencies.push(depId);
          }
        } else {
          missingDependencies.push(depId);
        }
      }
    }

    if (missingDependencies.length > 0) {
      throw new ModuleDependencyError(moduleId, missingDependencies);
    }
  }

  // Vérification des conflits
  private checkConflicts(moduleId: string): void {
    const module = this.modules.get(moduleId);
    if (!module) return;

    const conflicts = module.definition.conflicts || [];
    const activeConflicts = conflicts.filter(conflictId => this.isModuleActive(conflictId));

    if (activeConflicts.length > 0) {
      throw new ModuleConflictError(moduleId, activeConflicts);
    }
  }

  // Obtenir les modules dépendants
  private getDependentModules(moduleId: string): string[] {
    const dependents: string[] = [];

    for (const [otherId, dependencies] of this.dependencies.entries()) {
      if (dependencies.includes(moduleId)) {
        dependents.push(otherId);
      }
    }

    return dependents;
  }

  // Créer le contexte d'exécution pour un module
  private async createModuleContext(moduleId: string, userId: string, config: Record<string, any>): Promise<ModuleContext> {
    return {
      moduleId,
      userId,
  tenantId: this.tenantId ?? 'default',
  permissions: await this.getUserPermissions(userId),
  config,
      services: await this.createModuleServices(),
    };
  }

  // Créer les services disponibles pour les modules
  private async createModuleServices(): Promise<any> {
    return {
      database: {}, // Service de base de données
      storage: {}, // Service de stockage
      notifications: {}, // Service de notifications
      integrations: {}, // Service d'intégrations
      analytics: {}, // Service d'analytics
      ai: {}, // Service IA
    };
  }

  // Obtenir les permissions d'un utilisateur
  private async getUserPermissions(_userId: string): Promise<string[]> {
    // À implémenter selon le système de permissions
    return ['*']; // Temporaire: toutes les permissions
  }

  // Valider la définition d'un module
  private validateModuleDefinition(definition: ModuleDefinition): void {
    const required = ['id', 'name', 'version', 'category'];
    const missing = required.filter(field => !definition[field as keyof ModuleDefinition]);

    if (missing.length > 0) {
      throw new ModuleError(`Missing required fields: ${missing.join(', ')}`, definition.id, 'INVALID_DEFINITION');
    }

    // Valider la version (format semver)
    const versionRegex = /^\d+\.\d+\.\d+(-[\w\.-]+)?$/;
    if (!versionRegex.test(definition.version)) {
      throw new ModuleError(`Invalid version format: ${definition.version}`, definition.id, 'INVALID_VERSION');
    }
  }

  // Initialiser les modules core
  private async initializeCoreModules(_context: Partial<ModuleContext>): Promise<void> {
    const coreModules = Array.from(this.modules.values())
      .filter(module => module.definition.isCore)
      .sort((a, b) => a.definition.name.localeCompare(b.definition.name));

    for (const module of coreModules) {
      if (!this.isModuleActive(module.definition.id)) {
        try {
          await this.activateModule(module.definition.id, 'system', {});
        } catch (error) {
          console.error(`[ModuleManager] Erreur activation module core ${module.definition.id}:`, error);
        }
      }
    }
  }

  // Persistence des activations
  private async loadActivations(tenantId: string): Promise<void> {
    try {
      // Charger depuis la base de données
      // const activations = await db.moduleActivations.findByTenant(tenantId);
      
      // Simulation temporaire
      const stored = localStorage.getItem(`casskai-modules-${tenantId}`);
      if (stored) {
        const activations = JSON.parse(stored) as ModuleActivation[];
        activations.forEach(activation => {
          this.activations.set(activation.moduleId, activation);
        });
      }
    } catch (error) {
      console.error('[ModuleManager] Erreur chargement activations:', error);
    }
  }

  private async saveActivation(_activation: ModuleActivation): Promise<void> {
    try {
      // Sauvegarder en base de données
      // await db.moduleActivations.save(activation);
      
      // Simulation temporaire
  const tenantId = this.tenantId ?? 'default';
      const allActivations = Array.from(this.activations.values());
      localStorage.setItem(`casskai-modules-${tenantId}`, JSON.stringify(allActivations));
    } catch (error) {
      console.error('[ModuleManager] Erreur sauvegarde activation:', error);
    }
  }

  // Debugging et monitoring
  getDebugInfo(): any {
    return {
      isInitialized: this.isInitialized,
      totalModules: this.modules.size,
      activeModules: Array.from(this.activations.values()).filter(a => a.isActive).length,
      registeredModules: Array.from(this.modules.keys()),
      activeModuleIds: Array.from(this.activations.entries())
        .filter(([_, activation]) => activation.isActive)
        .map(([id]) => id),
    };
  }
}

// Service utilitaire pour les permissions des modules
export class ModulePermissionService {
  static readonly PERMISSIONS = {
    // Permissions générales
    MODULE_ACTIVATE: 'module:activate',
    MODULE_DEACTIVATE: 'module:deactivate',
    MODULE_CONFIGURE: 'module:configure',
    MODULE_VIEW: 'module:view',
    
    // Permissions CRM
    CRM_VIEW: 'crm:view',
    CRM_MANAGE_CONTACTS: 'crm:manage_contacts',
    CRM_MANAGE_DEALS: 'crm:manage_deals',
    CRM_EXPORT_DATA: 'crm:export_data',
    
    // Permissions RH
    HR_VIEW: 'hr:view',
    HR_MANAGE_EMPLOYEES: 'hr:manage_employees',
    HR_APPROVE_LEAVES: 'hr:approve_leaves',
    HR_VIEW_PAYROLL: 'hr:view_payroll',
    
    // Permissions Projets
    PROJECT_VIEW: 'project:view',
    PROJECT_MANAGE: 'project:manage',
    PROJECT_TRACK_TIME: 'project:track_time',
    PROJECT_BILLING: 'project:billing',
    
    // Permissions Marketplace
    MARKETPLACE_BROWSE: 'marketplace:browse',
    MARKETPLACE_INSTALL: 'marketplace:install',
    MARKETPLACE_PUBLISH: 'marketplace:publish',
  };

  static hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    return userPermissions.includes('*') || userPermissions.includes(requiredPermission);
  }

  static hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.some(perm => this.hasPermission(userPermissions, perm));
  }

  static hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.every(perm => this.hasPermission(userPermissions, perm));
  }
}

export default ModuleManager;