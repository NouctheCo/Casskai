import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
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

interface CompanyData {
  name: string;
  country?: string;
  currency?: string;
  accountingStandard?: string;
  locale?: string;
  sector?: string;
  siret?: string;
  vatNumber?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  fiscalYearStart?: number;
}

interface SelectedModules {
  [key: string]: boolean;
}

interface Company {
  id: string;
  name: string;
  country_code?: string;
  currency_code?: string;
  [key: string]: unknown;
}

interface Subscription {
  id?: string;
  status: string;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (credentials: { email: string; password: string }) => Promise<AuthResponse>;
  signUp: (credentials: { email: string; password: string; options?: { [key: string]: unknown } }) => Promise<AuthResponse>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  completeOnboarding: (companyData: CompanyData, selectedModules?: SelectedModules) => Promise<{ success: boolean; company?: Company; trialCreated?: boolean }>;
  hasPermission: (_permission: string) => boolean;
  currentEnterpriseId: string | null;
  currentCompanySubscription: Subscription | null;
  userCompanies: Company[];
  currentCompany: Company | null;
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
  const [userCompanies, setUserCompanies] = useState<Company[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);

  // Load user companies when user changes
  const loadUserCompanies = useCallback(async () => {
    if (user) {
      try {
        const companies = await getUserCompanies();
        setUserCompanies(companies || []);

        const defaultCompany = await getCurrentCompany();
        setCurrentCompany(defaultCompany);
      } catch (error) {
        console.error('❌ Error loading user companies:', error);
      }
    } else {
      setUserCompanies([]);
      setCurrentCompany(null);
    }
  }, [user]);

  useEffect(() => {
    loadUserCompanies();
  }, [user, loadUserCompanies]);

  // Log currentCompany changes
  useEffect(() => {
    console.warn('🏢 AuthContext: currentCompany state changed:', {
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
          console.error('❌ Error getting session:', error);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('❌ Unexpected error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.warn('Auth state changed:', event, currentSession?.user?.email);
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
      console.error('❌ Sign in error:', error);
      return {
        data: { user: null, session: null },
        error: { message: 'An unexpected error occurred during sign in.' }
      };
    }
  };

  // Sign up function
  const signUp = async (credentials: { email: string; password: string; options?: { [key: string]: unknown } }): Promise<AuthResponse> => {
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
      console.error('❌ Sign up error:', error);
      return {
        data: { user: null, session: null },
        error: { message: 'An unexpected error occurred during sign up.' }
      };
    }
  };

  // Sign out function
  const signOut = async (): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error ? { message: error.message } : null };
    } catch (error) {
      console.error('❌ Sign out error:', error);
      return { error: { message: 'An unexpected error occurred during sign out.' } };
    }
  };

  // Reset password function
  const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error: error ? { message: error.message } : null };
    } catch (error) {
      console.error('❌ Reset password error:', error);
      return { error: { message: 'An unexpected error occurred during password reset.' } };
    }
  };

  // Complete onboarding function
  const completeOnboarding = async (companyData: CompanyData, selectedModules?: SelectedModules) => {
    console.warn('🚀 completeOnboarding called with:', { companyData, selectedModules });

    if (!user) {
      console.error('❌ No user in context');
      throw new Error('Utilisateur non connecté');
    }

    try {
      // FIX: Vérifier et rafraîchir l'état de la session avant d'essayer de sauvegarder
      console.warn('🔍 Checking session before onboarding...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      console.warn('🔍 Session check result:', {
        hasSession: !!session,
        sessionError: sessionError?.message,
        userId: session?.user?.id,
        userFromContext: user.id,
        sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000) : null
      });

      // Si pas de session ou session expirée, essayer de la rafraîchir
      let currentSession = session;
      if (!currentSession || (currentSession.expires_at && currentSession.expires_at * 1000 < Date.now())) {
        console.warn('🔄 Session expired or missing, attempting refresh...');

        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError) {
          console.error('❌ Failed to refresh session:', refreshError);
          throw new Error('Session expirée - veuillez vous reconnecter');
        }

        if (refreshData.session) {
          currentSession = refreshData.session;
          setSession(currentSession);
          setUser(currentSession.user);
          console.warn('✅ Session refreshed successfully');
        } else {
          console.error('❌ Refresh failed - no session returned');
          throw new Error('Session expirée - veuillez vous reconnecter');
        }
      }

      if (!currentSession) {
        console.error('❌ Still no session after refresh attempt');
        throw new Error('Session expirée - veuillez vous reconnecter');
      }

      console.warn('✅ Session validated, proceeding with onboarding...');

      // Validate required company data
      if (!companyData.name || companyData.name.trim() === '') {
        console.error('❌ Company name is required');
        throw new Error('Le nom de l\'entreprise est requis');
      }

      console.warn('📋 Validating company data:', {
        name: companyData.name,
        country: companyData.country,
        currency: companyData.currency
      });

      // Vérifier si l'utilisateur a déjà une entreprise AVEC JOINTURE
      console.warn('🔍 Checking if user already has a company...');
      const { data: existingUserCompanies, error: checkError } = await supabase
        .from('user_companies')
        .select(`
          company_id,
          companies!inner (
            id,
            name
          )
        `)
        .eq('user_id', user.id);

      if (checkError) {
        console.error('❌ Error checking existing companies:', checkError);
        throw new Error(`Erreur lors de la vérification des entreprises: ${checkError.message}`);
      }

      console.warn('📋 Existing user-company associations found:', existingUserCompanies?.length || 0);

      // Transformer les données pour un format plus simple
      const existingCompanies = existingUserCompanies?.map((uc: { companies?: { id: string; name: string }[] }) => ({
        id: uc.companies?.[0]?.id,
        name: uc.companies?.[0]?.name
      })).filter((company: { id?: string; name?: string }) => company.id && company.name) || [];

      console.warn('📋 Existing companies found:', existingCompanies);

      let companyId: string;
      let companyDataResult: { id: string; name: string; [key: string]: unknown };

      if (existingCompanies && existingCompanies.length > 0) {
        // Utiliser l'entreprise existante
        companyId = existingCompanies[0].id;
        console.warn('✅ Using existing company:', existingCompanies[0]);

        // Récupérer les données complètes de l'entreprise existante
        const { data: existingCompany, error: fetchError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single();

        if (fetchError) {
          console.error('❌ Error fetching existing company:', fetchError);
          throw new Error(`Erreur lors de la récupération de l'entreprise: ${fetchError.message}`);
        }

        companyDataResult = existingCompany;
      } else {
        // Créer une nouvelle entreprise
        console.warn('📤 Creating new company...');
        const { data: newCompanyId, error: companyError } = await supabase.rpc(
          'create_company_with_setup',
          {
            company_name: companyData.name.trim(),
            user_uuid: user.id,
            country_code: companyData.country || 'FR',
            currency_code: companyData.currency || 'EUR',
            accounting_standard_param: companyData.accountingStandard || null,
          }
        );

        console.warn('📥 create_company_with_setup response:', {
          newCompanyId,
          companyError: companyError?.message,
          companyErrorCode: companyError?.code
        });

        if (companyError) {
          console.error('❌ Error creating company:', companyError);

          // Erreurs spécifiques de base de données
          if (companyError.code === '23503') {
            throw new Error('Erreur d\'intégrité des données - utilisateur non trouvé');
          } else if (companyError.code === '42501') {
            throw new Error('Permissions insuffisantes pour créer l\'entreprise');
          } else {
            throw new Error(`Erreur lors de la création de l'entreprise: ${companyError.message}`);
          }
        }

        if (!newCompanyId) {
          console.error('❌ No company ID returned from function');
          throw new Error('Erreur lors de la création de l\'entreprise: aucun ID retourné');
        }

        companyId = newCompanyId;
        console.warn('✅ Company created with ID:', companyId);

        // Récupérer les données de la nouvelle entreprise
        const { data: newCompany, error: fetchError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single();

        if (fetchError) {
          console.error('❌ Error fetching new company:', fetchError);
          throw new Error(`Erreur lors de la récupération de l'entreprise: ${fetchError.message}`);
        }

        companyDataResult = newCompany;
        console.warn('✅ New company data retrieved:', newCompany);
      }

      // Récupérer les données complètes de l'entreprise créée
      const company = companyDataResult;

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

      console.warn('✅ Company created with accounting chart:', company);

      // Save selected modules to localStorage for now
      if (selectedModules) {
        // Mapping between onboarding keys and system module IDs
        const moduleKeyMapping: Record<string, string> = {
          'crm': 'crm-sales',
          'projects': 'projects-management',
          // Note: 'hr' module doesn't exist in onboarding, so no mapping for it
          // Core services (accounting, invoicing, etc.) are always available, not module-based
        };

        // Merge with default modules, preserving global ones
        const defaultModules = {
          dashboard: true,
          settings: true,
          security: true
        };

        // Apply mapping to selected modules
        const mappedModules: Record<string, boolean> = {};
        Object.entries(selectedModules).forEach(([key, value]) => {
          const mappedKey = moduleKeyMapping[key] || key;
          mappedModules[mappedKey] = value;
        });

        const finalModules = { ...defaultModules, ...mappedModules };
        localStorage.setItem('casskai_modules', JSON.stringify(finalModules));
        console.warn('✅ Modules saved to localStorage with mapping:', finalModules);
      }

      // Create trial subscription automatically using auth.uid()
      const { data: subscriptionId, error: trialError } = await supabase
        .rpc('create_trial_subscription', {
          p_user_id: user.id,  // user.id est déjà l'auth.uid()
          p_company_id: company.id
        });

      if (trialError) {
        console.warn('⚠️ Warning creating trial subscription:', trialError);
      } else {
        console.warn('✅ Trial subscription created:', subscriptionId);
      }

      console.warn('✅ Company setup completed');

      // Update EnterpriseContext with new company
      const _updatedEnterprises = [company, ...userCompanies.filter((e: { name: string }) => e.name !== 'Mon Entreprise')];

      console.warn('✅ EnterpriseContext updated with new company:', company);

      // Set currentCompany directly with new company
      setCurrentCompany(company);
      console.warn('🔄 Setting currentCompany directly with new company:', company);

      // Update user metadata - onboarding marked as completed
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          onboarding_completed: true,
          current_company_id: company.id
        }
      });

      if (metadataError) {
        console.warn('⚠️ Warning updating user metadata:', metadataError);
      } else {
        console.warn('✅ User metadata updated - onboarding marked as completed');
      }

      // Reload user companies to get the updated list
      await loadUserCompanies();
      console.warn('✅ User companies reloaded');

      console.warn('🎉 Onboarding completion successful!');

      return {
        success: true,
        company,
        trialCreated: !trialError
      };

    } catch (error) {
      console.error('❌ Onboarding completion failed:', error);
      return {
        success: false,
        company: undefined,
        trialCreated: false
      };
    }
  };

  // Permission check function
  const hasPermission = (_permission: string): boolean => {
    // TODO: Implement proper permission checking
    return true;
  };

  // Mock subscription data
  const currentCompanySubscription: Subscription = {
    status: 'trial',
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
    currentEnterpriseId: currentCompany?.id || null,
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

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
