// Types pour les instances et l'état des modules

import type { ModuleDefinition } from './module-definition.types'
import type { ModuleError } from './module-utils.types'

// Instance d'un module actif
export interface ModuleInstance {
  definition: ModuleDefinition;
  state: ModuleState;
  config: Record<string, unknown>;
  isActive: boolean;
  activatedAt?: string;
  activatedBy?: string;
  lastUsed?: string;
  usageStats?: ModuleUsageStats;
}

export interface ModuleState {
  status: ModuleStatus;
  error?: ModuleError;
  loading: boolean;
  initialized: boolean;
  data?: Record<string, unknown>;
  lastUpdate: string;
}

export type ModuleStatus = 
  | 'inactive' 
  | 'activating' 
  | 'active' 
  | 'deactivating' 
  | 'error' 
  | 'updating' 
  | 'installing'

export interface ModuleActivation {
  moduleId: string;
  userId: string;
  companyId: string;
  config?: Record<string, unknown>;
  activatedAt: string;
  activatedBy: string;
}

export interface ModuleRegistry {
  modules: Map<string, ModuleInstance>;
  activeModules: string[];
  availableModules: ModuleDefinition[];
  coreModules: string[];
  
  // Méthodes
  register: (module: ModuleDefinition) => void;
  activate: (moduleId: string, config?: Record<string, unknown>) => Promise<void>;
  deactivate: (moduleId: string) => Promise<void>;
  isActive: (moduleId: string) => boolean;
  getInstance: (moduleId: string) => ModuleInstance | undefined;
}

export interface ModuleUsageStats {
  moduleId: string;
  totalUsage: number;
  lastUsed: string;
  averageSessionDuration: number;
  featuresUsed: string[];
  userCount: number;
  errorCount: number;
  performance: {
    loadTime: number;
    responseTime: number;
    memoryUsage: number;
  };
}

// Context d'exécution des modules
export interface ModuleContext {
  tenantId?: string;
  userId?: string;
  companyId?: string;
  permissions?: string[];
  config?: Record<string, unknown>;
  environment?: 'development' | 'staging' | 'production';
}

// Alias pour la compatibilité - Module = ModuleInstance
export type Module = ModuleInstance;
