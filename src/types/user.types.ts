export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  department?: string;
  position?: string;
  status: UserStatus;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  companyId: string;
  invitedBy?: string;
  phoneNumber?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  level: number; // 1=Admin, 2=Manager, 3=Employee, 4=Viewer
  isSystemRole: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  module: string;
  action: PermissionAction;
  resource?: string;
  conditions?: PermissionCondition[];
}

export type PermissionAction = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete' 
  | 'manage' 
  | 'approve' 
  | 'export' 
  | 'import'
  | 'admin';

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: unknown;
}

export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export interface UserInvitation {
  id: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  companyId: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  token: string;
  expiresAt: string;
  createdAt: string;
  message?: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface UserPreferences {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
    emailTypes: string[];
  };
  dashboard: {
    widgets: string[];
    layout: 'grid' | 'list';
  };
}

// Predefined system roles
export const SYSTEM_ROLES = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    description: 'Accès complet à toutes les fonctionnalités',
    level: 1,
    permissions: ['*:*'] // Tous les permissions
  },
  ADMIN: {
    name: 'Administrateur',
    description: 'Gestion complète de l\'entreprise',
    level: 1,
    permissions: [
      'users:manage', 'roles:manage', 'company:manage',
      'accounting:manage', 'invoicing:manage', 'projects:manage',
      'hr:manage', 'banks:manage', 'reports:read', 'settings:manage'
    ]
  },
  MANAGER: {
    name: 'Manager',
    description: 'Gestion d\'équipe et supervision',
    level: 2,
    permissions: [
      'users:read', 'users:update',
      'accounting:read', 'accounting:create', 'accounting:update',
      'invoicing:read', 'invoicing:create', 'invoicing:update',
      'projects:manage', 'hr:read', 'hr:update',
      'reports:read', 'banks:read'
    ]
  },
  EMPLOYEE: {
    name: 'Employé',
    description: 'Accès standard aux fonctionnalités',
    level: 3,
    permissions: [
      'accounting:read', 'accounting:create',
      'invoicing:read', 'invoicing:create',
      'projects:read', 'projects:update',
      'hr:read', 'reports:read'
    ]
  },
  VIEWER: {
    name: 'Observateur',
    description: 'Accès en lecture seule',
    level: 4,
    permissions: [
      'accounting:read', 'invoicing:read',
      'projects:read', 'hr:read', 'reports:read'
    ]
  }
} as const;

// Permission modules
export const PERMISSION_MODULES = {
  USERS: 'users',
  ROLES: 'roles',
  COMPANY: 'company',
  ACCOUNTING: 'accounting',
  INVOICING: 'invoicing',
  PROJECTS: 'projects',
  HR: 'hr',
  BANKS: 'banks',
  REPORTS: 'reports',
  SETTINGS: 'settings',
  DASHBOARD: 'dashboard'
} as const;
