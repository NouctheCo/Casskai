import { moduleService } from '@/services/moduleService';
import { ModuleDefinition } from '@/types/modules.types';

// Fonction utilitaire pour obtenir la couleur selon la catégorie
export const getColorForCategory = (category: string): string => {
  const colorMap: Record<string, string> = {
    'Core': 'blue',
    'Finance': 'green',
    'Opérations': 'purple',
    'Avancé': 'orange'
  };
  return colorMap[category] || 'gray';
};

// Fonction utilitaire pour obtenir le chemin d'un module
export const getModulePath = (moduleKey: string): string => {
  // Mapping des chemins spéciaux pour certains modules
  const pathMap: Record<string, string> = {
    'humanResources': '/hr',
    'salesCrm': '/sales-crm',
    // Ajouter d'autres mappings si nécessaire
  };

  return pathMap[moduleKey] || `/${moduleKey}`;
};

// Définition de tous les modules disponibles - maintenant centralisée
export const ALL_MODULES = moduleService.getAllModules().map(module => ({
  key: module.key,
  name: module.name,
  description: `Module ${module.name.toLowerCase()} pour CassKai`,
  category: module.category,
  icon: module.key, // Utiliser la clé comme nom d'icône
  type: module.required ? 'core' as const : 'premium' as const,
  path: getModulePath(module.key), // Utiliser une fonction pour gérer les chemins spéciaux
  color: getColorForCategory(module.category),
  isGlobal: module.required
}));

export const PLAN_MODULES = {
  free: ['dashboard', 'users', 'security', 'settings'],
  pro: ['dashboard', 'users', 'security', 'settings', 'accounting', 'banking', 'invoicing', 'reports', 'salesCrm', 'purchases', 'inventory', 'projects', 'thirdParties'],
  enterprise: ALL_MODULES.map(m => m.key),
};

// Convertir ALL_MODULES en ModuleDefinition complètes
export const convertToModuleDefinitions = (modules: typeof ALL_MODULES): ModuleDefinition[] => {
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
export const ALL_MODULE_DEFINITIONS = convertToModuleDefinitions(ALL_MODULES);