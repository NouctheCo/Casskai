// Configuration: Mapping modules vers capacités d'abonnement
// Ce fichier définit quelles capacités sont requises pour chaque module

// Types pour les capacités
export type PlanCapability =
  | 'billing'
  | 'accounting_basic'
  | 'accounting_advanced'
  | 'crm'
  | 'projects'
  | 'hr_basic'
  | 'hr_advanced'
  | 'bank_connections'
  | 'forecast'
  | 'audit_trail'
  | 'integrations'
  | 'api_access'
  | 'reports_unlimited';

export type PlanCode = 'starter' | 'pro' | 'enterprise';

// Mapping avec types stricts
export const CAPABILITY_BY_MODULE: Record<string, PlanCapability> = {
  // Modules core (toujours disponibles)
  dashboard: 'billing',
  accounting: 'accounting_basic',
  banking: 'billing',

  // Modules premium
  accounting_advanced: 'accounting_advanced',
  crm: 'crm',
  projects: 'projects',
  hr: 'hr_basic',
  hr_advanced: 'hr_advanced',
  bank_connections: 'bank_connections',
  forecast: 'forecast',
  audit_trail: 'audit_trail',
  integrations: 'integrations',
  api_access: 'api_access',
  reports_unlimited: 'reports_unlimited',

  // Modules spéciaux
  invoicing: 'billing',
  third_parties: 'billing',
  reports: 'billing',
  settings: 'billing'
};

// Capacités disponibles par plan
export const PLAN_CAPABILITIES: Record<PlanCode, PlanCapability[]> = {
  starter: [
    'billing',
    'accounting_basic'
  ],
  pro: [
    'billing',
    'accounting_basic',
    'accounting_advanced',
    'crm',
    'projects',
    'hr_basic',
    'api_access',
    'reports_unlimited'
  ],
  enterprise: [
    'billing',
    'accounting_basic',
    'accounting_advanced',
    'crm',
    'projects',
    'hr_basic',
    'hr_advanced',
    'bank_connections',
    'forecast',
    'audit_trail',
    'integrations',
    'api_access',
    'reports_unlimited'
  ]
};

// Fonction utilitaire pour vérifier si un module est disponible pour un plan
export function isModuleAvailableForPlan(moduleKey: string, planCode: PlanCode): boolean {
  const requiredCapability = CAPABILITY_BY_MODULE[moduleKey];
  if (!requiredCapability) return true; // Module core

  const planCapabilities = PLAN_CAPABILITIES[planCode];
  return planCapabilities?.includes(requiredCapability) ?? false;
}

// Fonction pour obtenir le plan minimum requis pour un module
export function getMinimumPlanForModule(moduleKey: string): PlanCode | null {
  const requiredCapability = CAPABILITY_BY_MODULE[moduleKey];
  if (!requiredCapability) return null; // Module core

  for (const [plan, capabilities] of Object.entries(PLAN_CAPABILITIES)) {
    if (capabilities.includes(requiredCapability)) {
      return plan as PlanCode;
    }
  }

  return 'enterprise'; // Par défaut
}
