// Types pour l'architecture modulaire de CassKai

// Définition d'un module
export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  category: 'core' | 'business' | 'hr' | 'project' | 'integration' | 'marketplace';
  icon: string;
  
  // Statut et availability
  status: 'available' | 'beta' | 'coming_soon' | 'deprecated';
  isCore: boolean; // Si true, module toujours activé
  isPremium: boolean;
  
  // Configuration
  config?: ModuleConfig;
  permissions: string[];
  dependencies: string[]; // IDs des modules requis
  conflicts: string[]; // IDs des modules incompatibles
  
  // Pricing
  pricing?: ModulePricing;
  
  // Metadata
  author: string;
  documentation?: string;
  supportUrl?: string;
  changelog?: ModuleChangelogEntry[];
}

export interface ModuleConfig {
  settings: Record<string, ModuleSetting>;
  defaultValues: Record<string, any>;
  validation?: Record<string, ValidationRule>;
}

export interface ModuleSetting {
  type: 'boolean' | 'string' | 'number' | 'select' | 'multiselect' | 'json';
  label: string;
  description?: string;
  required?: boolean;
  options?: Array<{ value: any; label: string }>;
  min?: number;
  max?: number;
  validation?: ValidationRule;
}

export interface ValidationRule {
  pattern?: string;
  min?: number;
  max?: number;
  required?: boolean;
  custom?: (value: any) => boolean | string;
}

export interface ModulePricing {
  type: 'free' | 'one_time' | 'subscription';
  price?: number;
  currency: string;
  billingPeriod?: 'monthly' | 'yearly';
  trialDays?: number;
  features: string[];
}

export interface ModuleChangelogEntry {
  version: string;
  date: string;
  type: 'feature' | 'fix' | 'breaking' | 'security';
  description: string;
}

// État d'activation d'un module
export interface ModuleActivation {
  moduleId: string;
  isActive: boolean;
  activatedAt?: Date;
  activatedBy: string;
  configuration: Record<string, any>;
  licenseInfo?: ModuleLicense;
}

export interface ModuleLicense {
  key: string;
  type: 'trial' | 'subscription' | 'lifetime';
  expiresAt?: Date;
  features: string[];
  limits?: Record<string, number>;
}

// Contexte d'exécution pour un module
export interface ModuleContext {
  moduleId: string;
  userId: string;
  tenantId: string;
  permissions: string[];
  config: Record<string, any>;
  services: ModuleServices;
}

export interface ModuleServices {
  database: any; // Service de base de données
  storage: any; // Service de stockage fichiers
  notifications: any; // Service de notifications
  integrations: any; // Service d'intégrations
  analytics: any; // Service d'analytics
  ai: any; // Service IA
}

// Handlers
export type ModuleEndpointHandler = (context: ModuleContext, payload?: unknown) => unknown | Promise<unknown>;
export type ModuleTaskHandler = (context: ModuleContext) => void | Promise<void>;

// Interface que doit implémenter chaque module
export interface Module {
  definition: ModuleDefinition;
  
  // Lifecycle hooks
  onInstall?(context: ModuleContext): Promise<void>;
  onActivate?(context: ModuleContext): Promise<void>;
  onDeactivate?(context: ModuleContext): Promise<void>;
  onUninstall?(context: ModuleContext): Promise<void>;
  onUpgrade?(context: ModuleContext, fromVersion: string): Promise<void>;
  
  // Configuration
  validateConfig?(config: Record<string, any>): boolean | string;
  getDefaultConfig?(): Record<string, any>;
  
  // Composants React
  getComponents?(): Record<string, React.ComponentType>;
  getRoutes?(): Array<{
    path: string;
    component: React.ComponentType;
    permissions?: string[];
  }>;
  
  // Intégrations
  getAPIEndpoints?(): Array<{
    method: string;
    path: string;
  handler: ModuleEndpointHandler;
    permissions?: string[];
  }>;
  
  // Tâches automatisées
  getScheduledTasks?(): Array<{
    name: string;
    schedule: string; // Cron expression
  handler: ModuleTaskHandler;
  }>;
}

// Types spécifiques aux modules

// MODULE CRM
export interface CRMContact {
  id: string;
  type: 'prospect' | 'client' | 'partner';
  company: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: Address;
  tags: string[];
  customFields: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  source?: string;
  notes: CRMNote[];
}

export interface CRMPipeline {
  id: string;
  name: string;
  stages: CRMStage[];
  isDefault: boolean;
  createdAt: Date;
}

export interface CRMStage {
  id: string;
  name: string;
  order: number;
  probability: number; // 0-100
  color: string;
  isClosedWon: boolean;
  isClosedLost: boolean;
}

export interface CRMDeal {
  id: string;
  title: string;
  description?: string;
  contactId: string;
  pipelineId: string;
  stageId: string;
  value: number;
  currency: string;
  probability: number;
  expectedCloseDate?: Date;
  actualCloseDate?: Date;
  assignedTo: string;
  tags: string[];
  customFields: Record<string, any>;
  activities: CRMActivity[];
  documents: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CRMActivity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'task' | 'note';
  title: string;
  description?: string;
  scheduledAt?: Date;
  completedAt?: Date;
  assignedTo: string;
  relatedTo: {
    type: 'contact' | 'deal';
    id: string;
  };
  createdAt: Date;
}

export interface CRMNote {
  id: string;
  content: string;
  author: string;
  isPrivate: boolean;
  createdAt: Date;
}

// MODULE RH
export interface HREmployee {
  id: string;
  employeeNumber: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: Date;
    address: Address;
    socialSecurityNumber: string;
  };
  contractInfo: {
    startDate: Date;
    endDate?: Date;
    contractType: 'cdi' | 'cdd' | 'stage' | 'freelance';
    position: string;
    department: string;
    manager?: string;
    salary: number;
    currency: string;
  };
  status: 'active' | 'inactive' | 'terminated';
  createdAt: Date;
  updatedAt: Date;
}

export interface HRLeaveRequest {
  id: string;
  employeeId: string;
  type: 'vacation' | 'sick' | 'personal' | 'parental' | 'unpaid';
  startDate: Date;
  endDate: Date;
  days: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  comments?: string;
  createdAt: Date;
}

export interface HRExpenseReport {
  id: string;
  employeeId: string;
  title: string;
  description?: string;
  totalAmount: number;
  currency: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
  expenses: HRExpenseItem[];
  receipts: string[];
  approvedBy?: string;
  approvedAt?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface HRExpenseItem {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: Date;
  receipt?: string;
  ocrData?: OCRData;
}

export interface OCRData {
  vendor?: string;
  date?: Date;
  amount?: number;
  category?: string;
  confidence: number;
  rawText: string;
}

// MODULE PROJETS
export interface ProjectDefinition {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  managerId: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Dates
  startDate: Date;
  endDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  
  // Budget
  budget?: number;
  currency: string;
  billingType: 'fixed_price' | 'time_and_material' | 'milestone';
  hourlyRate?: number;
  
  // Configuration
  settings: {
    trackTime: boolean;
    requireTaskApproval: boolean;
    allowClientAccess: boolean;
    autoInvoicing: boolean;
  };
  
  // Équipe
  team: ProjectMember[];
  
  // Metadata
  tags: string[];
  customFields: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectMember {
  userId: string;
  role: 'manager' | 'member' | 'observer';
  hourlyRate?: number;
  joinedAt: Date;
  permissions: string[];
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Assignment
  assignedTo?: string;
  assignedBy: string;
  
  // Timing
  estimatedHours?: number;
  actualHours?: number;
  startDate?: Date;
  dueDate?: Date;
  completedAt?: Date;
  
  // Dependencies
  dependencies: string[];
  
  // Metadata
  tags: string[];
  attachments: string[];
  comments: TaskComment[];
  timeEntries: TimeEntry[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  taskId?: string;
  userId: string;
  description: string;
  date: Date;
  hours: number;
  billable: boolean;
  invoiced: boolean;
  hourlyRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskComment {
  id: string;
  userId: string;
  content: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// MARKETPLACE
export interface MarketplaceItem {
  id: string;
  type: 'template' | 'connector' | 'plugin' | 'theme';
  name: string;
  description: string;
  longDescription?: string;
  category: string;
  subcategory?: string;
  
  // Media
  icon: string;
  screenshots: string[];
  video?: string;
  
  // Versioning
  version: string;
  changelog: ModuleChangelogEntry[];
  
  // Author
  author: {
    name: string;
    email: string;
    website?: string;
    verified: boolean;
  };
  
  // Ratings & Reviews
  rating: number;
  reviewCount: number;
  downloads: number;
  
  // Pricing
  pricing: ModulePricing;
  
  // Technical
  compatibility: string[];
  requirements: string[];
  size: number; // bytes
  
  // Content
  content?: {
    templates?: any[];
    configurations?: any[];
    scripts?: string[];
    assets?: string[];
  };
  
  // Status
  status: 'published' | 'review' | 'rejected' | 'deprecated';
  publishedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceReview {
  id: string;
  itemId: string;
  userId: string;
  rating: number; // 1-5
  title: string;
  content: string;
  pros?: string[];
  cons?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Utilitaires
export interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  state?: string;
}

// Erreurs spécifiques aux modules
export class ModuleError extends Error {
  constructor(
    message: string,
    public moduleId: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ModuleError';
  }
}

export class ModuleDependencyError extends ModuleError {
  constructor(moduleId: string, missingDependencies: string[]) {
    super(
      `Module ${moduleId} requires missing dependencies: ${missingDependencies.join(', ')}`,
      moduleId,
      'MISSING_DEPENDENCIES',
      { missingDependencies }
    );
  }
}

export class ModuleConflictError extends ModuleError {
  constructor(moduleId: string, conflictingModules: string[]) {
    super(
      `Module ${moduleId} conflicts with active modules: ${conflictingModules.join(', ')}`,
      moduleId,
      'MODULE_CONFLICT',
      { conflictingModules }
    );
  }
}