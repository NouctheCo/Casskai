import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanies } from '@/hooks/useCompanies';
import type { UserRole } from '@/types/database.types';

interface PermissionGuardProps {
  children: React.ReactNode;
  roles?: UserRole[];
  permissions?: string[];
  companyId?: string;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

/**
 * Component to conditionally render content based on user roles and permissions
 * 
 * @param roles - Required roles (any of them grants access)
 * @param permissions - Required permissions (all must be granted)
 * @param companyId - Company context for permission check (uses current company if not provided)
 * @param fallback - Content to show when access is denied
 * @param showFallback - Whether to show fallback content or render nothing
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  roles = [],
  permissions = [],
  companyId,
  fallback = null,
  showFallback = true,
}) => {
  const { user } = useAuth();
  const { currentCompany, hasPermission, getUserRole } = useCompanies();
  
  // Use provided companyId or current company
  const targetCompanyId = companyId || currentCompany?.id;
  
  // No access if user not authenticated or no company selected
  if (!user || !targetCompanyId) {
    return showFallback ? <>{fallback}</> : null;
  }

  // Check role requirements
  if (roles.length > 0) {
    const userRole = getUserRole(targetCompanyId);
    if (!userRole || !roles.includes(userRole)) {
      return showFallback ? <>{fallback}</> : null;
    }
  }

  // Check permission requirements
  if (permissions.length > 0) {
    const hasAllPermissions = permissions.every(permission =>
      hasPermission(targetCompanyId, permission)
    );
    
    if (!hasAllPermissions) {
      return showFallback ? <>{fallback}</> : null;
    }
  }

  // All checks passed, render children
  return <>{children}</>;
};

/**
 * Higher-order component version of PermissionGuard
 */
export function withPermissionGuard<T extends object>(
  Component: React.ComponentType<T>,
  guardProps: Omit<PermissionGuardProps, 'children'>
) {
  return function PermissionGuardedComponent(props: T) {
    return (
      <PermissionGuard {...guardProps}>
        <Component {...props} />
      </PermissionGuard>
    );
  };
}

/**
 * Hook to check permissions programmatically
 */
export function usePermissions() {
  const { user } = useAuth();
  const { currentCompany, hasPermission: _hasPermission, getUserRole } = useCompanies();

  const hasRole = (roles: UserRole[], companyId?: string): boolean => {
    if (!user) return false;
    
    const targetCompanyId = companyId || currentCompany?.id;
    if (!targetCompanyId) return false;
    
    const userRole = getUserRole(targetCompanyId);
    return userRole ? roles.includes(userRole) : false;
  };

  const hasPermission = (permission: string | string[], companyId?: string): boolean => {
    if (!user) return false;
    
    const targetCompanyId = companyId || currentCompany?.id;
    if (!targetCompanyId) return false;
    
    if (typeof permission === 'string') {
      return _hasPermission(targetCompanyId, permission);
    }
    
    return permission.every(p => _hasPermission(targetCompanyId, p));
  };

  const hasAnyPermission = (permissions: string[], companyId?: string): boolean => {
    if (!user) return false;
    
    const targetCompanyId = companyId || currentCompany?.id;
    if (!targetCompanyId) return false;
    
    return permissions.some(permission => _hasPermission(targetCompanyId, permission));
  };

  const canAccess = (
    roles: UserRole[] = [],
    permissions: string[] = [],
    companyId?: string
  ): boolean => {
    // Check roles first (any role grants access)
    if (roles.length > 0 && !hasRole(roles, companyId)) {
      return false;
    }

    // Check permissions (all must be granted)
    if (permissions.length > 0 && !hasPermission(permissions, companyId)) {
      return false;
    }

    return true;
  };

  return {
    user,
    currentCompany,
    hasRole,
    hasPermission,
    hasAnyPermission,
    canAccess,
    getUserRole: (companyId?: string) => getUserRole(companyId || currentCompany?.id || ''),
  };
}

/**
 * Permission constants for consistent usage across the app
 */
export const PERMISSIONS = {
  // Company management
  MANAGE_COMPANY: 'manage_company',
  VIEW_COMPANY: 'view_company',
  
  // User management
  MANAGE_USERS: 'manage_users',
  INVITE_USERS: 'invite_users',
  VIEW_USERS: 'view_users',
  
  // Accounting
  MANAGE_ACCOUNTS: 'manage_accounts',
  CREATE_JOURNAL_ENTRIES: 'create_journal_entries',
  POST_JOURNAL_ENTRIES: 'post_journal_entries',
  VIEW_REPORTS: 'view_reports',
  GENERATE_REPORTS: 'generate_reports',
  
  // Transactions
  MANAGE_TRANSACTIONS: 'manage_transactions',
  RECONCILE_TRANSACTIONS: 'reconcile_transactions',
  VIEW_TRANSACTIONS: 'view_transactions',
  
  // Invoicing
  MANAGE_INVOICES: 'manage_invoices',
  SEND_INVOICES: 'send_invoices',
  VIEW_INVOICES: 'view_invoices',
  
  // Third parties
  MANAGE_THIRD_PARTIES: 'manage_third_parties',
  VIEW_THIRD_PARTIES: 'view_third_parties',
  
  // Banks
  MANAGE_BANK_ACCOUNTS: 'manage_bank_accounts',
  VIEW_BANK_ACCOUNTS: 'view_bank_accounts',
  
  // Settings
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_SETTINGS: 'view_settings',
} as const;

/**
 * Role hierarchy for easier role checks
 */
export const ROLES: Record<string, UserRole[]> = {
  OWNER_ONLY: ['owner'],
  ADMIN_AND_ABOVE: ['owner', 'admin'],
  ACCOUNTANT_AND_ABOVE: ['owner', 'admin', 'accountant'],
  EMPLOYEE_AND_ABOVE: ['owner', 'admin', 'accountant', 'employee'],
  ALL_ROLES: ['owner', 'admin', 'accountant', 'employee', 'viewer'],
};

// Example usage components

/**
 * Button that's only visible to users with specific roles
 */
export const AdminButton: React.FC<{ 
  children: React.ReactNode;
  onClick: () => void;
  companyId?: string;
}> = ({ children, onClick, companyId }) => (
  <PermissionGuard roles={ROLES.ADMIN_AND_ABOVE} companyId={companyId} showFallback={false}>
    <button onClick={onClick} className="btn btn-primary">
      {children}
    </button>
  </PermissionGuard>
);

/**
 * Section that requires specific permissions
 */
export const AccountingSection: React.FC<{ 
  children: React.ReactNode;
  companyId?: string;
}> = ({ children, companyId }) => (
  <PermissionGuard 
    permissions={[PERMISSIONS.VIEW_REPORTS]} 
    companyId={companyId}
    fallback={
      <div className="p-4 text-center text-gray-500">
        You don't have permission to view accounting data.
      </div>
    }
  >
    {children}
  </PermissionGuard>
);