/* eslint-disable react-refresh/only-export-components */
/* eslint-disable max-lines-per-function */
import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session, AuthResponse, AuthError } from '@supabase/supabase-js';
import { getCompanyDetails, getUserCompanies, getCompanyModules } from '../lib/company';
import { trialService } from '../services/trialService';

interface Company {
  id: string;
  name: string;
  country?: string;
  default_currency?: string;
  siret?: string;
  vat_number?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  fiscal_year_start?: number;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  onboardingCompleted: boolean;
  currentCompany: Company | null;
  userCompanies: Company[];
  isCheckingOnboarding: boolean; // Nouveau état pour gérer la transition
  signIn: (credentials: { email: string; password: string }) => Promise<AuthResponse>;
  signUp: (credentials: { email: string; password: string; options?: { [key: string]: unknown } }) => Promise<AuthResponse>;
  signOut: () => Promise<{ error: AuthError | null }>;
  switchCompany: (companyId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [userCompanies, setUserCompanies] = useState<Company[]>([]);
  const [onboardingCompleted, setOnboardingCompleted] = useState(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('onboarding_just_completed') === 'true') {
      return true;
    }
    return false;
  });
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);

  const signOut = useCallback(async (): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signOut();
    // State cleanup is handled by onAuthStateChange which triggers fetchUserSession(null)
    return { error };
  }, []);

  // Fonction pour s'assurer qu'un utilisateur a un abonnement d'essai
  const ensureTrialSubscription = useCallback(async (userId: string, companyId: string) => {
    try {
      // Vérifier si l'utilisateur peut créer un essai
      const canCreate = await trialService.canCreateTrial(userId);

      if (canCreate) {
        console.warn('🔄 Création automatique d\'un essai pour le nouvel utilisateur...');

        // Créer un abonnement d'essai automatiquement
        const result = await trialService.createTrialSubscription(userId, companyId);

        if (result.success) {
          console.warn('✅ Essai créé automatiquement pour l\'utilisateur');
        } else {
          console.error('❌ Échec de la création de l\'essai:', result.error);
        }
      } else {
        console.warn('ℹ️ Utilisateur déjà éligible ou a déjà un abonnement');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification/création de l\'abonnement:', error);
    }
  }, []);

  const switchCompany = useCallback(async (companyId: string) => {
    // Not setting loading here to avoid flicker when switching companies
    try {
      const companyDetails = await getCompanyDetails(companyId);
      if (companyDetails) {
        setCurrentCompany(companyDetails);
        localStorage.setItem('casskai_current_company_id', companyId);

        const modules = await getCompanyModules(companyId);
        localStorage.setItem('casskai_modules', JSON.stringify(modules));
        window.dispatchEvent(new CustomEvent('modulesUpdated', { detail: modules }));
        
        console.warn(`Entreprise changée: ${companyDetails.name}`);
      } else {
        throw new Error("Impossible de trouver les détails de l'entreprise.");
      }
    } catch (error) {
      console.error("AuthContext | Erreur lors du changement d'entreprise:", error);
      // Ne pas lancer une erreur fatale, juste logger
      setCurrentCompany(null);
    }
  }, []);

  const fetchUserSession = useCallback(async (currentUser: User | null) => {
    // This function is the single source of truth for user-related state.
    if (!currentUser) {
      setUser(null);
      setSession(null);
      setCurrentCompany(null);
      setUserCompanies([]);
      setIsAuthenticated(false);
      setOnboardingCompleted(false);
      setIsCheckingOnboarding(false);
      localStorage.removeItem('casskai_current_company_id');

      // Clear onboarding progress on logout to ensure a fresh start
      localStorage.removeItem('onboarding_current_step');
      localStorage.removeItem('onboarding_company_data');
      localStorage.removeItem('onboarding_modules');

      setLoading(false);
      return;
    }

    setUser(currentUser);
    setIsAuthenticated(true);
    setIsCheckingOnboarding(true); // Indique qu'on vérifie l'état d'onboarding

    try {
      const companies = await getUserCompanies(currentUser.id);
      setUserCompanies(companies || []);

      if (companies && companies.length > 0) {
        setOnboardingCompleted(true);
        localStorage.removeItem('onboarding_just_completed'); // Clean up the flag
        
        // Vérifier et créer automatiquement un abonnement d'essai si nécessaire
        await ensureTrialSubscription(currentUser.id, companies[0].id);
        
        const lastCompanyId = localStorage.getItem('casskai_current_company_id');
        const companyToLoad = companies.find(c => c.id === lastCompanyId) || companies[0];

        if (companyToLoad) {
          try {
            await switchCompany(companyToLoad.id);
          } catch (switchError) {
            console.error("AuthContext | Erreur lors du chargement de l'entreprise, tentative avec la première entreprise:", switchError);
            // Essayer avec la première entreprise si celle sélectionnée échoue
            if (companies[0] && companies[0].id !== companyToLoad.id) {
              try {
                await switchCompany(companies[0].id);
              } catch (fallbackError) {
                console.error("AuthContext | Échec du fallback vers la première entreprise:", fallbackError);
                setCurrentCompany(null);
              }
            } else {
              setCurrentCompany(null);
            }
          }
        } else {
          setCurrentCompany(null);
        }
      } else {
        setOnboardingCompleted(false);
        setCurrentCompany(null);
      }
    } catch (error) {
      console.error("AuthContext | Erreur lors de la récupération des données utilisateur:", error);
      // Ne pas déconnecter automatiquement, juste logger l'erreur
      setUserCompanies([]);
      setCurrentCompany(null);
      setOnboardingCompleted(false);
    } finally {
      setIsCheckingOnboarding(false); // Fin de la vérification
      setLoading(false);
    }
  }, [switchCompany, ensureTrialSubscription]);

  useEffect(() => {
    setLoading(true);

    // Handle URL hash authentication tokens (email confirmation, etc.)
    const handleAuthFromUrl = () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      
      if (accessToken && type === 'email_confirmation') {
        console.warn('📧 Email confirmation detected, cleaning URL...');
        // Clean URL by removing hash parameters
        window.history.replaceState(null, '', window.location.pathname);
        return true;
      }
      return false;
    };

    const isEmailConfirmation = handleAuthFromUrl();

    // Check for existing session on initial load
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('Session recovery failed, clearing auth data:', error);
        // Clear corrupted session data
        localStorage.removeItem('sb-smtdtgrymuzwvctattmx-auth-token');
        supabase.auth.signOut();
        setSession(null);
        fetchUserSession(null);
        return;
      }
      
      setSession(session);
      
      // If this is an email confirmation, mark for onboarding redirect
      if (isEmailConfirmation && session?.user) {
        console.warn('📧 Email confirmed, user will be redirected to onboarding');
      }
      
      fetchUserSession(session?.user ?? null);
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.warn('🔐 Auth state change:', event);
      
      setSession(session);
      
      // Special handling for email confirmation
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        if (hashParams.get('type') === 'email_confirmation') {
          console.warn('📧 Email confirmation event detected');
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
      
      fetchUserSession(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserSession]);

  const signIn = async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    return supabase.auth.signInWithPassword(credentials);
  };

  const signUp = async (credentials: { email: string; password: string; options?: { [key: string]: unknown } }): Promise<AuthResponse> => {
    return supabase.auth.signUp(credentials);
  };

  const value = {
    user,
    session,
    loading,
    isAuthenticated,
    onboardingCompleted,
    currentCompany,
    userCompanies,
    isCheckingOnboarding,
    signIn,
    signUp,
    signOut,
    switchCompany,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

