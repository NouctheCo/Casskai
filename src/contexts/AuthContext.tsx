/* eslint-disable max-lines-per-function, complexity, max-lines, react-refresh/only-export-components */
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
  signUp: (credentials: { email: string; password: string; options?: Record<string, unknown> }) => Promise<AuthResponse>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  completeOnboarding: (companyData: Record<string, unknown>, selectedModules?: Record<string, boolean>) => Promise<{ success: boolean; company?: unknown; trialCreated?: boolean }>;
  hasPermission: (permission: string) => boolean;
  currentEnterpriseId: string | null;
  currentCompanySubscription: Record<string, unknown>;
  userCompanies: Array<Record<string, unknown>>;
  currentCompany: Record<string, unknown> | null;
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
  const [userCompanies, setUserCompanies] = useState<Array<Record<string, unknown>>>([]);
  const [currentCompany, setCurrentCompany] = useState<Record<string, unknown> | null>(null);

  // Load user companies when user changes
  const loadUserCompanies = React.useCallback(async () => {
    if (!user) {
      setUserCompanies([]);
      setCurrentCompany(null);
      return;
    }
    try {
      const companies = await getUserCompanies();
      setUserCompanies(companies as Array<Record<string, unknown>>);
      const defaultCompany = await getCurrentCompany();
      setCurrentCompany((defaultCompany as unknown) as Record<string, unknown>);
    } catch (error) {
      console.error('Error loading user companies:', error);
    }
  }, [user]);

  useEffect(() => {
    void loadUserCompanies();
  }, [loadUserCompanies]);

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
      console.error('Sign in error:', error);
      return {
        data: { user: null, session: null },
        error: { message: 'An unexpected error occurred during sign in.' }
      };
    }
  };

  // Sign up function
  const signUp = async (credentials: { email: string; password: string; options?: Record<string, unknown> }): Promise<AuthResponse> => {
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

  // Helper function for retry logic
  const retryOperation = async <T,>(
    operation: () => Promise<T>, 
    maxRetries: number = 2, 
    delay: number = 1000
  ): Promise<T> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
  // eslint-disable-next-line no-await-in-loop
  return await operation();
      } catch (error) {
        console.warn(`⚠️ Tentative ${attempt} échouée:`, error);
        
        if (attempt === maxRetries) {
          throw error; // Re-throw after last attempt
        }
        
        // Wait before retry
  // eslint-disable-next-line no-await-in-loop
  await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Retry logic error'); // Should never reach here
  };

  // Complete onboarding function
  type CompanyRow = {
    id: string;
    name: string;
    legal_name?: string;
    country?: string;
    default_currency?: string;
    accounting_standard?: string;
    siret?: string;
    vat_number?: string;
    address?: string;
    postal_code?: string;
    city?: string;
    phone?: string;
    email?: string;
    website?: string;
    fiscal_year_start?: number;
    fiscal_year_end?: number;
    created_at?: string;
    updated_at?: string;
  };

  type OnboardingData = {
    name: string;
    country?: string;
    currency?: string;
    accountingStandard?: string | null;
    locale?: string;
    sector?: unknown;
    siret?: unknown;
    vatNumber?: unknown;
    address?: unknown;
    city?: unknown;
    postalCode?: unknown;
    phone?: unknown;
    email?: unknown;
    website?: unknown;
    fiscalYearStart?: unknown;
    ceoName?: string | null;
    ceoTitle?: string | null;
    shareCapital?: string;
    settings?: Record<string, unknown>;
    taxRegime?: Record<string, unknown>;
  };

  const completeOnboarding = async (companyData: Record<string, unknown>, selectedModules?: Record<string, boolean>) => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      const cd = companyData as OnboardingData;
  console.warn('🚀 Starting onboarding completion with data:', { 
        companyData: cd, 
        selectedModules,
        userId: user.id 
      });

      // Validate required company data
  if (!cd.name) {
        throw new Error('Le nom de l\'entreprise est requis');
      }

      // Créer/récupérer l'entreprise avec retry automatique
  console.warn('🏢 Création/récupération de l\'entreprise via RPC avec retry...');
    const companyId = await retryOperation(async () => {
        const { data, error } = await supabase.rpc('create_company_with_setup', {
      company_name: cd.name,
          user_uuid: user.id,
      country_code: cd.country || 'FR',
      currency_code: cd.currency || 'EUR',
      accounting_standard_param: cd.accountingStandard || null,
        });

        if (error) {
          throw new Error(`Erreur RPC: ${error.message}`);
        }

        if (!data) {
          throw new Error('Aucun ID d\'entreprise retourné par la base de données');
        }

        return data as string;
      });

  console.warn('✅ Entreprise créée/récupérée avec ID:', companyId);

      // Sauvegarder l'ID localement pour référence rapide
      const localKey = `casskai_onboarding_company_${user.id}`;
      localStorage.setItem(localKey, companyId);

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
      // Build update payload with only defined fields to reduce 400s from invalid types
  const updatePayload: Record<string, unknown> = {};
  if (cd.locale) updatePayload.default_locale = cd.locale;
  if (cd.sector !== undefined) updatePayload.sector = String(cd.sector ?? '');
  if (cd.siret !== undefined) updatePayload.siret = String(cd.siret ?? '');
  if (cd.vatNumber !== undefined) updatePayload.vat_number = String(cd.vatNumber ?? '');
  if (cd.address !== undefined) updatePayload.address = String(cd.address ?? '');
  if (cd.city !== undefined) updatePayload.city = String(cd.city ?? '');
  if (cd.postalCode !== undefined) updatePayload.postal_code = String(cd.postalCode ?? '');
  if (cd.phone !== undefined) updatePayload.phone = String(cd.phone ?? '');
  if (cd.email !== undefined) updatePayload.email = String(cd.email ?? '');
  if (cd.website !== undefined) updatePayload.website = String(cd.website ?? '');
  if (cd.fiscalYearStart !== undefined) updatePayload.fiscal_year_start = Number(cd.fiscalYearStart ?? 1);
  if (cd.ceoName !== undefined) updatePayload.ceo_name = cd.ceoName ?? null;
  if (cd.ceoTitle !== undefined) updatePayload.ceo_title = cd.ceoTitle ?? null;

  const { error: updateError } = await supabase
        .from('companies')
        .update(updatePayload)
        .eq('id', companyId);

      if (updateError) {
        console.warn('⚠️ Warning updating company details:', updateError);
      }

  console.warn('✅ Company created with accounting chart:', company);

      // Save selected modules to database and localStorage
  if (selectedModules) {
        // Merge with default modules, preserving global ones
        const defaultModules = {
          dashboard: true,
          settings: true,
          security: true
        };
        
        const finalModules = { ...defaultModules, ...selectedModules };
        
        // Sauvegarder en base de données dans la table companies
        try {
          const modulesJson = finalModules && typeof finalModules === 'object' 
            ? JSON.stringify(finalModules) 
            : JSON.stringify({});
          const { error: modulesError } = await supabase
            .from('companies')
            .update({ active_modules: modulesJson })
            .eq('id', companyId);
            
          if (modulesError) {
            console.warn('⚠️ Erreur sauvegarde modules en base (non critique):', modulesError);
          } else {
            console.warn('✅ Modules sauvegardés en base de données:', finalModules);
          }
        } catch (dbError) {
          console.warn('⚠️ Base non disponible pour modules, utilisation localStorage:', dbError);
        }
        
        // Backup dans localStorage pour compatibilité et migration
        localStorage.setItem('casskai_modules', JSON.stringify(finalModules));
  console.warn('✅ Modules sauvegardés (localStorage backup):', finalModules);
      }

      // Create trial subscription automatically using auth.uid()
    const { data: subscriptionId, error: trialError } = await supabase
        .rpc('create_trial_subscription', {
          p_user_id: user.id,  // user.id est déjà l'auth.uid()
      p_company_id: (company as CompanyRow).id
        });

      if (trialError) {
        console.error('⚠️ Error creating trial subscription (non-critical):', trialError);
        // Continue anyway as basic setup is done
      } else {
  console.warn('✅ Trial subscription created:', subscriptionId);
      }

      // Complete company setup (accounts, journals, etc.)
      const { error: setupError } = await supabase.rpc('complete_company_onboarding', {
        p_company_id: (company as CompanyRow).id,
        p_user_id: user.id
      });

      if (setupError) {
        console.error('⚠️ Error completing company setup (non-critical):', setupError);
        // Continue anyway as basic setup is done
      } else {
  console.warn('✅ Company setup completed');
      }

      // Update user metadata to mark onboarding as completed
      const { error: userUpdateError } = await supabase.auth.updateUser({
        data: { 
          onboarding_completed: true,
          company_id: company.id
        }
      });

      if (userUpdateError) {
        console.error('❌ Error updating user metadata:', userUpdateError);
        throw new Error(`Erreur lors de la mise à jour du profil utilisateur: ${userUpdateError.message}`);
      }

      // Update local user state immediately so UI reacts without waiting for session refresh
      try {
        setUser(prev => {
          if (!prev) return prev;
          const updatedUser = {
            ...prev,
            user_metadata: {
              ...(prev.user_metadata as Record<string, unknown>),
              onboarding_completed: true,
              company_id: (company as CompanyRow).id,
            },
          } as User;
          return updatedUser;
        });
      } catch (e) {
        console.warn('⚠️ Warning updating local user metadata state:', e);
      }

    console.warn('✅ User metadata updated - onboarding marked as completed');

      // Reload user companies to refresh the context
      await loadUserCompanies();
  console.warn('✅ User companies reloaded');

      // Déclencher la synchronisation EnterpriseContext
      // Note: Nous utilisons un event personnalisé pour éviter les dépendances circulaires
      window.dispatchEvent(new CustomEvent('enterprise-sync-needed', { 
        detail: { companyId: (company as CompanyRow).id } 
      }));
      console.warn('📡 Signal de synchronisation EnterpriseContext envoyé');

      // Synchroniser avec EnterpriseContext pour éviter l'erreur dashboard
      // Suppression de la déclaration locale de l'interface Enterprise (inutile ici)
      try {
        const c = company as CompanyRow;
        const enterpriseData = {
          id: c.id,
          name: c.name,
          legalName: c.legal_name || c.name,
          countryCode: c.country,
          currency: c.default_currency,
          accountingStandard: c.accounting_standard || 'PCG',
          registrationNumber: c.siret || '',
          vatNumber: c.vat_number || '',
          address: {
            street: c.address || '',
            postalCode: c.postal_code || '',
            city: c.city || '',
            country: c.country || '',
          },
          phone: c.phone || '',
          email: c.email || '',
          website: c.website || '',
          shareCapital: cd?.shareCapital || '10000',
          ceoName: cd?.ceoName || '',
          sector: (cd?.sector as string) || 'tech',
          fiscalYearStart: c.fiscal_year_start || 1,
          fiscalYearEnd: c.fiscal_year_end || 12,
          isSetupCompleted: true,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
          settings: cd?.settings || {},
          taxRegime: cd?.taxRegime || {},
          isActive: true,
        };

        const existingEnterprises = JSON.parse(localStorage.getItem('casskai_enterprises') || '[]') as Array<{ id: string }>;
        const updatedEnterprises = [enterpriseData, ...existingEnterprises.filter((e) => e.id !== c.id)];
        localStorage.setItem('casskai_enterprises', JSON.stringify(updatedEnterprises));
        localStorage.setItem('casskai_current_enterprise', c.id);
        console.warn('✅ Enterprise synchronized with localStorage');
      } catch (syncError) {
        console.warn('⚠️ Warning syncing enterprise data:', syncError);
      }

      // Déclencher la création des dashboards par défaut
      try {
        console.warn('📊 Déclenchement de la création des dashboards...');
        window.dispatchEvent(new CustomEvent('initialize-user-dashboard', { 
          detail: { companyId: (company as CompanyRow).id, userId: user.id } 
        }));
        console.warn('✅ Signal de création dashboard envoyé');
      } catch (dashboardError) {
        console.warn('⚠️ Warning triggering dashboard creation:', dashboardError);
      }

      console.warn('🎉 Onboarding completion successful!');
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
  const hasPermission = (_permission: string): boolean => {
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
  const currentEnterpriseId: string | null = (() => {
    const id = (currentCompany as { id?: unknown } | null)?.id;
    return typeof id === 'string' ? id : null;
  })();
  const currentCompanySubscription: Record<string, unknown> = {
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
