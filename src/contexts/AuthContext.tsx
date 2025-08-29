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
    console.log('🔄 AuthContext: loadUserCompanies called', { hasUser: !!user, userId: user?.id });
    
    if (user) {
      try {
        const companies = await getUserCompanies();
        console.log('📋 AuthContext: getUserCompanies returned:', companies);
        setUserCompanies(companies);
        
        const defaultCompany = await getCurrentCompany();
        console.log('🏢 AuthContext: getCurrentCompany returned:', defaultCompany);
        setCurrentCompany(defaultCompany);
        
        console.log('✅ AuthContext: loadUserCompanies completed successfully');
      } catch (error) {
        console.error('❌ AuthContext: Error loading user companies:', error);
      }
    } else {
      console.log('👤 AuthContext: No user, clearing companies');
      setUserCompanies([]);
      setCurrentCompany(null);
    }
  };

  useEffect(() => {
    console.log('👤 AuthContext: User state changed, reloading companies', { 
      hasUser: !!user, 
      userId: user?.id, 
      onboardingCompleted: user?.user_metadata?.onboarding_completed 
    });
    loadUserCompanies();
  }, [user]);

  // Log currentCompany changes
  useEffect(() => {
    console.log('🏢 AuthContext: currentCompany state changed:', {
      hasCurrentCompany: !!currentCompany,
      companyId: currentCompany?.id,
      companyName: currentCompany?.name
    });
  }, [currentCompany]);

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
      throw new Error('Utilisateur non connecté');
    }

    try {
      // FIX: Vérifier l'état de la session avant d'essayer de sauvegarder
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔍 Session check before onboarding:', {
        hasSession: !!session,
        userId: session?.user?.id,
        sessionError,
        userFromContext: user.id
      });

      if (!session) {
        throw new Error('Session expirée - veuillez vous reconnecter');
      }

      console.log('🚀 Starting onboarding completion with data:', { 
        companyData, 
        selectedModules,
        userId: user.id 
      });

      // Validate required company data
      if (!companyData.name) {
        throw new Error('Le nom de l\'entreprise est requis');
      }

      // Create the company
      // Utiliser la fonction RPC améliorée pour créer l'entreprise avec plan comptable
      console.log('📤 Calling create_company_with_setup with:', {
        company_name: companyData.name,
        user_uuid: user.id,
        country_code: companyData.country || 'FR',
        currency_code: companyData.currency || 'EUR',
        accounting_standard_param: companyData.accountingStandard || null,
      });

      const { data: companyId, error: companyError } = await supabase.rpc(
        'create_company_with_setup',
        {
          company_name: companyData.name,
          user_uuid: user.id,
          country_code: companyData.country || 'FR',
          currency_code: companyData.currency || 'EUR',
          accounting_standard_param: companyData.accountingStandard || null,
        }
      );

      console.log('📥 create_company_with_setup response:', { companyId, companyError });

      if (companyError) {
        console.error('❌ Error creating company:', companyError);
        throw new Error(`Erreur lors de la création de l'entreprise: ${companyError.message}`);
      }

      // Récupérer les données complètes de l'entreprise créée
      const { data: company, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching created company:', fetchError);
        throw new Error(`Erreur lors de la récupération de l'entreprise: ${fetchError.message}`);
      }

      // Mettre à jour les informations supplémentaires de l'entreprise
      const { error: updateError } = await supabase
        .from('companies')
        .update({
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
          fiscal_year_start: companyData.fiscalYearStart || 1
        })
        .eq('id', companyId);

      if (updateError) {
        console.warn('⚠️ Warning updating company details:', updateError);
      }

      console.log('✅ Company created with accounting chart:', company);

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
        console.log('✅ Modules saved to localStorage:', finalModules);
      }

      // Create trial subscription automatically using auth.uid()
      const { data: subscriptionId, error: trialError } = await supabase
        .rpc('create_trial_subscription', {
          p_user_id: user.id,  // user.id est déjà l'auth.uid()
          p_company_id: company.id
        });

      if (trialError) {
        console.error('⚠️ Error creating trial subscription (non-critical):', trialError);
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
        console.error('⚠️ Error completing company setup (non-critical):', setupError);
        // Continue anyway as basic setup is done
      } else {
        console.log('✅ Company setup completed');
      }

      // Update user metadata to mark onboarding as completed
      const { error: userUpdateError } = await supabase.auth.updateUser({
        data: { 
          onboarding_completed: true,
          company_id: company.id
        }
      });

      // FIX: Sauvegarder également l'état d'onboarding dans localStorage pour persistance immédiate
      localStorage.setItem('casskai_onboarding_completed', 'true');

      if (userUpdateError) {
        console.error('❌ Error updating user metadata:', userUpdateError);
        throw new Error(`Erreur lors de la mise à jour du profil utilisateur: ${userUpdateError.message}`);
      }

      console.log('✅ User metadata updated - onboarding marked as completed');

      // Update local EnterpriseContext with the new company
      const newEnterprise = {
        id: company.id,
        name: company.name || companyData.name,
        legalName: company.name || companyData.name,
        country: company.country || companyData.country || 'FR',
        currency: company.currency || companyData.currency || 'EUR',
        accountingStandard: company.accounting_standard || companyData.accountingStandard || 'PCG',
        registrationNumber: company.siret || '',
        vatNumber: company.vat_number || '',
        street: company.address || '',
        postalCode: company.postal_code || '',
        city: company.city || '',
        phone: company.phone || '',
        email: company.email || '',
        website: company.website || '',
        shareCapital: '10000',
        ceoName: '',
        sector: company.sector || companyData.sector || 'tech',
        fiscalYearStart: company.fiscal_year_start || 1,
        fiscalYearEnd: 12,
        isSetupCompleted: true,
        createdAt: company.created_at || new Date().toISOString(),
        updatedAt: company.updated_at || new Date().toISOString()
      };

      // Update localStorage with the new enterprise
      const existingEnterprises = JSON.parse(localStorage.getItem('casskai_enterprises') || '[]');
      const updatedEnterprises = [newEnterprise, ...existingEnterprises.filter((e: any) => e.name !== 'Mon Entreprise')];
      localStorage.setItem('casskai_enterprises', JSON.stringify(updatedEnterprises));
      localStorage.setItem('casskai_current_enterprise', newEnterprise.id);

      console.log('✅ EnterpriseContext updated with new company:', newEnterprise);

      // Trigger a custom event to refresh EnterpriseContext
      window.dispatchEvent(new CustomEvent('enterpriseContextRefresh'));

      // OPTION A (Préférée): Mettre à jour directement currentCompany avec la nouvelle entreprise
      // avant de recharger les entreprises utilisateur
      console.log('🔄 Setting currentCompany directly with new company:', company);
      setCurrentCompany(company);
      
      // Ensuite recharger la liste des entreprises utilisateur
      await loadUserCompanies();
      console.log('✅ User companies reloaded');

      console.log('🎉 Onboarding completion successful!');
      return { success: true, company, trialCreated: !trialError };
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      throw error; // Re-throw to let CompleteStep handle it properly
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
