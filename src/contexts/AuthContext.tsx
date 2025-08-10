import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, getUserCompanies, getCurrentCompany } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

// Types
interface AuthError {
  message: string;
}

interface AuthResponse {
  data: {
    user: User | null;
    session: Session | null;
  };
  error: AuthError | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (credentials: { email: string; password: string }) => Promise<AuthResponse>;
  signUp: (credentials: { email: string; password: string; options?: any }) => Promise<AuthResponse>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  completeOnboarding: (companyData: any, selectedModules?: any) => Promise<{ success: boolean; company?: any; trialCreated?: boolean }>;
  hasPermission: (permission: string) => boolean;
  currentEnterpriseId: string | null;
  currentCompanySubscription: any;
  userCompanies: any[];
  currentCompany: any;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userCompanies, setUserCompanies] = useState<any[]>([]);
  const [currentCompany, setCurrentCompany] = useState<any>(null);

  // Load user companies when user changes
  const loadUserCompanies = async () => {
    if (user) {
      try {
        const companies = await getUserCompanies();
        setUserCompanies(companies);
        
        const defaultCompany = await getCurrentCompany();
        setCurrentCompany(defaultCompany);
      } catch (error) {
        console.error('Error loading user companies:', error);
      }
    } else {
      setUserCompanies([]);
      setCurrentCompany(null);
    }
  };

  useEffect(() => {
    loadUserCompanies();
  }, [user]);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Unexpected error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event, currentSession?.user?.email);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in function
  const signIn = async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword(credentials);
      
      if (error) {
        return {
          data: { user: null, session: null },
          error: { message: error.message }
        };
      }

      return {
        data: { user: data.user, session: data.session },
        error: null
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        data: { user: null, session: null },
        error: { message: 'An unexpected error occurred during sign in.' }
      };
    }
  };

  // Sign up function
  const signUp = async (credentials: { email: string; password: string; options?: any }): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: credentials.options,
      });

      if (error) {
        return {
          data: { user: null, session: null },
          error: { message: error.message }
        };
      }

      return {
        data: { user: data.user, session: data.session },
        error: null
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        data: { user: null, session: null },
        error: { message: 'An unexpected error occurred during sign up.' }
      };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error ? { message: error.message } : null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: { message: 'An unexpected error occurred during sign out.' } };
    }
  };

  // Complete onboarding function
  const completeOnboarding = async (companyData: any, selectedModules?: any) => {
    if (!user) {
      return { success: false };
    }

    try {
      // Create the company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyData.name,
          country: companyData.country || 'FR',
          default_currency: companyData.currency || 'EUR',
          default_locale: companyData.locale || 'fr',
          sector: companyData.sector || '',
          siret: companyData.siret || '',
          vat_number: companyData.vatNumber || '',
          address: companyData.address || '',
          city: companyData.city || '',
          postal_code: companyData.postalCode || '',
          phone: companyData.phone || '',
          email: companyData.email || '',
          website: companyData.website || '',
          fiscal_year_start: companyData.fiscalYearStart || 1,
          fiscal_year_end: companyData.fiscalYearEnd || '12-31',
          share_capital: companyData.shareCapital || '',
          ceo_name: companyData.ceoName || '',
          ceo_title: companyData.ceoTitle || 'Gérant',
          accounting_standard: companyData.accountingStandard || 'PCG'
        })
        .select()
        .single();

      if (companyError) {
        console.error('Error creating company:', companyError);
        return { success: false };
      }

      // Associate user with company
      const { error: userCompanyError } = await supabase
        .from('user_companies')
        .insert({
          user_id: user.id,
          company_id: company.id,
          is_default: true,
          role: 'admin'
        });

      if (userCompanyError) {
        console.error('Error associating user with company:', userCompanyError);
        return { success: false };
      }

      // Save selected modules to localStorage for now
      if (selectedModules) {
        // Merge with default modules, preserving global ones
        const defaultModules = {
          dashboard: true,
          settings: true,
          security: true
        };
        
        const finalModules = { ...defaultModules, ...selectedModules };
        localStorage.setItem('casskai_modules', JSON.stringify(finalModules));
        console.log('✅ Modules saved:', finalModules);
      }

      // Create trial subscription automatically using auth.uid()
      const { data: subscriptionId, error: trialError } = await supabase
        .rpc('create_trial_subscription', {
          p_user_id: user.id,  // user.id est déjà l'auth.uid()
          p_company_id: company.id
        });

      if (trialError) {
        console.error('Error creating trial subscription:', trialError);
        // Continue anyway as basic setup is done
      } else {
        console.log('✅ Trial subscription created:', subscriptionId);
      }

      // Complete company setup (accounts, journals, etc.)
      const { error: setupError } = await supabase.rpc('complete_company_onboarding', {
        p_company_id: company.id,
        p_user_id: user.id
      });

      if (setupError) {
        console.error('Error completing company setup:', setupError);
        // Continue anyway as basic setup is done
      }

      // Update user metadata to mark onboarding as completed
      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          onboarding_completed: true,
          company_id: company.id
        }
      });

      if (updateError) {
        console.error('Error updating user metadata:', updateError);
      }

      // Reload user companies
      await loadUserCompanies();

      return { success: true, company, trialCreated: !trialError };
    } catch (error) {
      console.error('Error completing onboarding:', error);
      return { success: false };
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error: error ? { message: error.message } : null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: { message: 'An unexpected error occurred.' } };
    }
  };

  // Permission checking function
  const hasPermission = (permission: string): boolean => {
    // For now, return true if user is authenticated
    // In production, check user role and permissions from database
    if (!user || !currentCompany) return false;
    
    // Admin has all permissions
    const userCompany = userCompanies.find(uc => uc.company_id === currentCompany.id);
    if (userCompany?.role === 'admin') return true;
    
    // Add more specific permission logic here
    return true;
  };

  // Current enterprise data
  const currentEnterpriseId = currentCompany?.id || null;
  const currentCompanySubscription = {
    status: 'active',
    plan: 'premium',
    features: ['all_modules', 'advanced_reports', 'api_access']
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    completeOnboarding,
    hasPermission,
    currentEnterpriseId,
    currentCompanySubscription,
    userCompanies,
    currentCompany,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export default AuthContext;
