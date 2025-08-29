// Types utilitaires pour les modules

// Permissions des modules
export interface ModulePermission {
  id: string;
  name: string;
  description: string;
  category: string;
  required: boolean;
  dangerous: boolean;
}

// Classes d'erreurs spécifiques aux modules
export class ModuleError extends Error {
  public code: ModuleErrorCode;
  public moduleId: string;
  public timestamp: string;
  public context?: Record<string, unknown>;

  constructor(message: string, moduleId: string, code: ModuleErrorCode, details?: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'ModuleError';
    this.code = code;
    this.moduleId = moduleId;
    this.timestamp = new Date().toISOString();
    this.context = context;
    
    // Maintenir la pile d'appels appropriée
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ModuleError);
    }
  }
}

// Erreurs de dépendances de modules
export class ModuleDependencyError extends ModuleError {
  public dependencyId: string;
  public requiredVersion?: string;
  public availableVersion?: string;

  constructor(
    message: string, 
    moduleId: string, 
    dependencyId: string, 
    requiredVersion?: string, 
    availableVersion?: string,
    context?: Record<string, unknown>
  ) {
    super(message, moduleId, 'DEPENDENCY_MISSING', undefined, context);
    this.name = 'ModuleDependencyError';
    this.dependencyId = dependencyId;
    this.requiredVersion = requiredVersion;
    this.availableVersion = availableVersion;
  }
}

// Erreurs de conflits entre modules
export class ModuleConflictError extends ModuleError {
  public conflictingModuleId: string;
  public conflictType: 'incompatible_version' | 'resource_conflict' | 'api_conflict' | 'permission_conflict';

  constructor(
    message: string, 
    moduleId: string, 
    conflictingModuleId: string, 
    conflictType: 'incompatible_version' | 'resource_conflict' | 'api_conflict' | 'permission_conflict',
    context?: Record<string, unknown>
  ) {
    super(message, moduleId, 'CONFLICT_DETECTED', undefined, context);
    this.name = 'ModuleConflictError';
    this.conflictingModuleId = conflictingModuleId;
    this.conflictType = conflictType;
  }
}

export type ModuleErrorCode =
  | 'MODULE_NOT_FOUND'
  | 'MODULE_ALREADY_ACTIVE'
  | 'MODULE_NOT_ACTIVE'
  | 'DEPENDENCY_MISSING'
  | 'CONFLICT_DETECTED'
  | 'PERMISSION_DENIED'
  | 'CONFIG_INVALID'
  | 'INITIALIZATION_FAILED'
  | 'RUNTIME_ERROR'
  | 'UPDATE_FAILED'
  | 'INSTALLATION_FAILED'

// Métriques des modules
export interface ModuleMetrics {
  moduleId: string;
  companyId: string;
  period: {
    start: string;
    end: string;
  };
  
  // Usage
  activeUsers: number;
  totalSessions: number;
  averageSessionDuration: number;
  
  // Performance
  averageLoadTime: number;
  averageResponseTime: number;
  errorRate: number;
  
  // Features
  featuresUsed: Array<{
    featureId: string;
    usageCount: number;
    uniqueUsers: number;
  }>;
  
  // Ressources
  memoryUsage: number;
  cpuUsage: number;
  networkUsage: number;
  
  // Business
  businessImpact?: {
    revenue?: number;
    cost?: number;
    efficiency?: number;
    satisfaction?: number;
  };
}

// Configuration globale des modules
export interface ModuleSystemConfig {
  maxActiveModules?: number;
  allowExternalModules: boolean;
  autoUpdate: boolean;
  marketplace: {
    enabled: boolean;
    url?: string;
    apiKey?: string;
  };
  security: {
    strictMode: boolean;
    sandboxed: boolean;
    allowedPermissions: string[];
  };
  performance: {
    lazy: boolean;
    preload: string[];
    timeout: number;
  };
}

// Types pour la recherche et le filtrage
export interface ModuleFilter {
  category?: string[];
  status?: string[];
  isPremium?: boolean;
  isCore?: boolean;
  hasPermissions?: string[];
  search?: string;
}

export interface ModuleSort {
  field: 'name' | 'category' | 'version' | 'activatedAt' | 'lastUsed';
  direction: 'asc' | 'desc';
}

// Types pour les logs
export interface ModuleLog {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  moduleId: string;
  timestamp: string;
  context?: Record<string, unknown>;
  userId?: string;
  companyId?: string;
}