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
    'humanResources': '/hr', // Correction: correspond à la route définie dans AppRouter
    'salesCrm': '/sales-crm', // Correction: correspond à la route définie dans AppRouter
    'banking': '/banks',
    'tax': '/taxes', // Correction: correspond à la route définie dans AppRouter
    'thirdParties': '/third-parties', // Route ajoutée dans AppRouter
    'budget': '/budget', // Correction: correspond à la route définie dans AppRouter
    // Ajouter d'autres mappings si nécessaire
  };

  return pathMap[moduleKey] || `/${moduleKey}`;
};

// Fonction pour déterminer le type de module selon le plan requis
const getModuleType = (moduleKey: string): 'starter' | 'pro' | 'enterprise' => {
  // Modules de base (plan Starter et plus)
  if (['dashboard', 'settings', 'users', 'security'].includes(moduleKey)) {
    return 'starter';
  }

  // Modules Starter
  if (['accounting', 'invoicing', 'banking', 'purchases', 'thirdParties'].includes(moduleKey)) {
    return 'starter';
  }

  // Modules Pro
  if (['reports', 'budget', 'humanResources', 'tax'].includes(moduleKey)) {
    return 'pro';
  }

  // Modules Enterprise
  if (['salesCrm', 'inventory', 'projects', 'contracts', 'automation'].includes(moduleKey)) {
    return 'enterprise';
  }

  return 'starter'; // Par défaut
};

// Fonction pour créer une description plus appropriée
const getModuleDescription = (module: any): string => {
  const descriptions: Record<string, string> = {
    dashboard: 'Vue d\'ensemble de votre activité et indicateurs clés',
    accounting: 'Gestion complète de votre comptabilité générale',
    invoicing: 'Création et gestion de vos factures clients',
    banking: 'Synchronisation et rapprochement bancaire automatisé',
    purchases: 'Gestion des achats et des fournisseurs',
    thirdParties: 'Gestion centralisée de tous vos contacts',
    reports: 'Génération de rapports financiers détaillés',
    budget: 'Création et suivi des budgets annuels avec analyses complètes',
    humanResources: 'Gestion RH complète et paie',
    tax: 'Gestion fiscale et préparation des déclarations',
    salesCrm: 'Gestion complète de la relation client',
    inventory: 'Suivi des stocks et gestion des inventaires',
    projects: 'Gestion de projets et suivi des tâches',
    contracts: 'Gestion des contrats et documents légaux',
    automation: 'Automatisation des processus métier et workflows intelligents',
    settings: 'Configuration générale de l\'application',
    users: 'Gestion des utilisateurs et des permissions',
    security: 'Paramètres de sécurité et audit système'
  };

  return descriptions[module.key] || `Module ${module.name.toLowerCase()} pour CassKai`;
};

// Définition de tous les modules disponibles - maintenant centralisée
export const ALL_MODULES = moduleService.getAllModules().map(module => ({
  key: module.key,
  name: module.name,
  description: getModuleDescription(module),
  category: module.category,
  icon: module.key, // Utiliser la clé comme nom d'icône
  type: getModuleType(module.key),
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
    description: module.description,
    version: '1.0.0',
    category: module.type,
    icon: 'default-icon',
    status: 'available',
    isCore: ['dashboard', 'settings', 'users', 'security'].includes(module.key),
    isPremium: !['dashboard', 'settings', 'users', 'security'].includes(module.key),
    config: {
      settings: {},
      defaultValues: {}
    },
    permissions: ['*'],
    dependencies: [],
    conflicts: [],
    pricing: ['dashboard', 'settings', 'users', 'security'].includes(module.key) ? undefined : {
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
