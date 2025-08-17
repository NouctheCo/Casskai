import { supabase } from './supabase';
import type { Database, UserRole } from '@/types/database.types';

// Enhanced authentication utilities with role-based access control

export type AuthUser = Database['public']['Tables']['user_profiles']['Row'] & {
  companies: Array<{
    company_id: string;
    company_name: string;
    role: UserRole;
    is_default: boolean;
    permissions: Record<string, boolean>;
  }>;
};

export interface AuthSession {
  user: AuthUser | null;
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}

export class AuthService {
  private static instance: AuthService;
  private currentUser: AuthUser | null = null;
  private listeners: ((user: AuthUser | null) => void)[] = [];

  private constructor() {
    this.initializeAuth();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async initializeAuth() {
    // Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await this.loadUserProfile(session.user.id);
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (session?.user) {
        await this.loadUserProfile(session.user.id);
      } else {
        this.setCurrentUser(null);
      }
    });
  }

  private async loadUserProfile(userId: string) {
    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Fetch user companies with roles
      const { data: userCompanies, error: companiesError } = await supabase
        .from('user_companies')
        .select(`
          company_id,
          role,
          is_default,
          permissions,
          companies (
            name
          )
        `)
        .eq('user_id', userId);

      if (companiesError) throw companiesError;

      const authUser: AuthUser = {
        ...profile,
        companies: (userCompanies || []).map(uc => ({
          company_id: uc.company_id,
          company_name: (uc as any).companies.name,
          role: uc.role,
          is_default: uc.is_default,
          permissions: uc.permissions as Record<string, boolean> || {},
        })),
      };

      this.setCurrentUser(authUser);
    } catch (error) {
      console.error('Error loading user profile:', error);
      this.setCurrentUser(null);
    }
  }

  private setCurrentUser(user: AuthUser | null) {
    this.currentUser = user;
    this.listeners.forEach(listener => listener(user));
  }

  // Public methods

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async signUp(email: string, password: string, userData: {
    first_name: string;
    last_name: string;
  }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });

    if (error) throw error;

    // Create user profile if user was created
    if (data.user && !error) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          first_name: userData.first_name,
          last_name: userData.last_name,
        });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
      }
    }

    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    this.setCurrentUser(null);
  }

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  }

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  }

  // Role and permission methods

  hasRole(companyId: string, requiredRoles: UserRole[]): boolean {
    if (!this.currentUser) return false;

    const company = this.currentUser.companies.find(c => c.company_id === companyId);
    return company ? requiredRoles.includes(company.role) : false;
  }

  hasPermission(companyId: string, permission: string): boolean {
    if (!this.currentUser) return false;

    const company = this.currentUser.companies.find(c => c.company_id === companyId);
    if (!company) return false;

    // Owner and admin have all permissions
    if (['owner', 'admin'].includes(company.role)) {
      return true;
    }

    // Check specific permission
    return company.permissions[permission] === true;
  }

  getUserRole(companyId: string): UserRole | null {
    if (!this.currentUser) return null;

    const company = this.currentUser.companies.find(c => c.company_id === companyId);
    return company?.role || null;
  }

  getDefaultCompany(): { company_id: string; company_name: string; role: UserRole } | null {
    if (!this.currentUser) return null;

    const defaultCompany = this.currentUser.companies.find(c => c.is_default);
    if (defaultCompany) {
      return {
        company_id: defaultCompany.company_id,
        company_name: defaultCompany.company_name,
        role: defaultCompany.role,
      };
    }

    // Return first company if no default set
    if (this.currentUser.companies.length > 0) {
      const firstCompany = this.currentUser.companies[0];
      return {
        company_id: firstCompany.company_id,
        company_name: firstCompany.company_name,
        role: firstCompany.role,
      };
    }

    return null;
  }

  async setDefaultCompany(companyId: string): Promise<void> {
    if (!this.currentUser) throw new Error('No user authenticated');

    // Update database
    await supabase.rpc('set_default_company', {
      p_user_id: this.currentUser.id,
      p_company_id: companyId,
    });

    // Reload user profile to get updated data
    await this.loadUserProfile(this.currentUser.id);
  }

  // Permission constants for easier maintenance
  static readonly PERMISSIONS = {
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

  // Default permissions by role
  static readonly ROLE_PERMISSIONS: Record<UserRole, string[]> = {
    owner: Object.values(AuthService.PERMISSIONS),
    admin: [
      AuthService.PERMISSIONS.VIEW_COMPANY,
      AuthService.PERMISSIONS.MANAGE_USERS,
      AuthService.PERMISSIONS.INVITE_USERS,
      AuthService.PERMISSIONS.VIEW_USERS,
      AuthService.PERMISSIONS.MANAGE_ACCOUNTS,
      AuthService.PERMISSIONS.CREATE_JOURNAL_ENTRIES,
      AuthService.PERMISSIONS.POST_JOURNAL_ENTRIES,
      AuthService.PERMISSIONS.VIEW_REPORTS,
      AuthService.PERMISSIONS.GENERATE_REPORTS,
      AuthService.PERMISSIONS.MANAGE_TRANSACTIONS,
      AuthService.PERMISSIONS.RECONCILE_TRANSACTIONS,
      AuthService.PERMISSIONS.VIEW_TRANSACTIONS,
      AuthService.PERMISSIONS.MANAGE_INVOICES,
      AuthService.PERMISSIONS.SEND_INVOICES,
      AuthService.PERMISSIONS.VIEW_INVOICES,
      AuthService.PERMISSIONS.MANAGE_THIRD_PARTIES,
      AuthService.PERMISSIONS.VIEW_THIRD_PARTIES,
      AuthService.PERMISSIONS.MANAGE_BANK_ACCOUNTS,
      AuthService.PERMISSIONS.VIEW_BANK_ACCOUNTS,
      AuthService.PERMISSIONS.VIEW_SETTINGS,
    ],
    accountant: [
      AuthService.PERMISSIONS.VIEW_COMPANY,
      AuthService.PERMISSIONS.VIEW_USERS,
      AuthService.PERMISSIONS.MANAGE_ACCOUNTS,
      AuthService.PERMISSIONS.CREATE_JOURNAL_ENTRIES,
      AuthService.PERMISSIONS.POST_JOURNAL_ENTRIES,
      AuthService.PERMISSIONS.VIEW_REPORTS,
      AuthService.PERMISSIONS.GENERATE_REPORTS,
      AuthService.PERMISSIONS.MANAGE_TRANSACTIONS,
      AuthService.PERMISSIONS.RECONCILE_TRANSACTIONS,
      AuthService.PERMISSIONS.VIEW_TRANSACTIONS,
      AuthService.PERMISSIONS.MANAGE_INVOICES,
      AuthService.PERMISSIONS.VIEW_INVOICES,
      AuthService.PERMISSIONS.MANAGE_THIRD_PARTIES,
      AuthService.PERMISSIONS.VIEW_THIRD_PARTIES,
      AuthService.PERMISSIONS.VIEW_BANK_ACCOUNTS,
    ],
    employee: [
      AuthService.PERMISSIONS.VIEW_COMPANY,
      AuthService.PERMISSIONS.VIEW_USERS,
      AuthService.PERMISSIONS.VIEW_REPORTS,
      AuthService.PERMISSIONS.VIEW_TRANSACTIONS,
      AuthService.PERMISSIONS.VIEW_INVOICES,
      AuthService.PERMISSIONS.VIEW_THIRD_PARTIES,
      AuthService.PERMISSIONS.VIEW_BANK_ACCOUNTS,
    ],
    viewer: [
      AuthService.PERMISSIONS.VIEW_COMPANY,
      AuthService.PERMISSIONS.VIEW_REPORTS,
      AuthService.PERMISSIONS.VIEW_TRANSACTIONS,
      AuthService.PERMISSIONS.VIEW_INVOICES,
      AuthService.PERMISSIONS.VIEW_THIRD_PARTIES,
    ],
  };
}

// Export singleton instance
export const authService = AuthService.getInstance();

// Hook for React components
export function useAuthService() {
  const [user, setUser] = React.useState<AuthUser | null>(authService.getCurrentUser());

  React.useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(setUser);
    return unsubscribe;
  }, []);

  return {
    user,
    signIn: authService.signIn.bind(authService),
    signUp: authService.signUp.bind(authService),
    signOut: authService.signOut.bind(authService),
    resetPassword: authService.resetPassword.bind(authService),
    updatePassword: authService.updatePassword.bind(authService),
    hasRole: authService.hasRole.bind(authService),
    hasPermission: authService.hasPermission.bind(authService),
    getUserRole: authService.getUserRole.bind(authService),
    getDefaultCompany: authService.getDefaultCompany.bind(authService),
    setDefaultCompany: authService.setDefaultCompany.bind(authService),
  };
}