/* eslint-disable react-refresh/only-export-components */
/* eslint-disable max-lines-per-function */
import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session, AuthResponse, AuthError } from '@supabase/supabase-js';
import { getCompanyDetails, getUserCompanies, getCompanyModules } from '../lib/company';
import { trialService } from '../services/trialService';
import { trialExpirationService } from '../services/trialExpirationService';
import { STORAGE_KEYS, readUserScopedItem, writeUserScopedItem, removeUserScopedItem, purgeUserEnterpriseCache } from '@/utils/userStorage';
import { logger } from '@/utils/logger';

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
  shouldShowExperience: boolean;
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
  const [shouldShowExperience, setShouldShowExperience] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const signOut = useCallback(async (): Promise<{ error: AuthError | null }> => {
    trialExpirationService.stopPeriodicCheck();

    const previousUserId = user?.id ?? null;
    const { error } = await supabase.auth.signOut();

    if (previousUserId) {
      purgeUserEnterpriseCache(previousUserId);
      removeUserScopedItem(STORAGE_KEYS.CURRENT_COMPANY_ID, previousUserId);
    }

    return { error };
  }, [user]);

  // Fonction pour s'assurer qu'un utilisateur a un abonnement d'essai.
  // Dépendances vides pour conserver la référence stable et éviter de recréer l'écouteur Supabase en boucle.
  const ensureTrialSubscription = useCallback(async (userId: string, companyId: string) => {
    try {
      // Vérifier si l'utilisateur peut créer un essai
      const canCreate = await trialService.canCreateTrial(userId);

      if (canCreate) {
        logger.warn('🔄 Création automatique d\'un essai pour le nouvel utilisateur...');

        // Créer un abonnement d'essai automatiquement
        const result = await trialService.createTrialSubscription(userId, companyId);

        if (result.success) {
          logger.warn('✅ Essai créé automatiquement pour l\'utilisateur')
        } else {
          logger.error('❌ Échec de la création de l\'essai:', result.error)
        }
      } else {
        logger.warn('ℹ️ Utilisateur déjà éligible ou a déjà un abonnement')
      }
    } catch (error) {
      logger.error('Erreur lors de la vérification/création de l\'abonnement:', error)
    }
  }, []);

  const switchCompany = useCallback(async (companyId: string) => {
    // Not setting loading here to avoid flicker when switching companies
    try {
      const companyDetails = await getCompanyDetails(companyId);
      if (companyDetails) {
        setCurrentCompany(companyDetails);
        if (user?.id) {
          writeUserScopedItem(STORAGE_KEYS.CURRENT_COMPANY_ID, user.id, companyId);
        }

        const modules = await getCompanyModules(companyId);
        localStorage.setItem('casskai_modules', JSON.stringify(modules));
        window.dispatchEvent(new CustomEvent('module-states-reset'));
        
        logger.warn(`Entreprise changée: ${companyDetails.name}`)
      } else {
        throw new Error("Impossible de trouver les détails de l'entreprise.");
      }
    } catch (error) {
      logger.error("AuthContext | Erreur lors du changement d'entreprise:", error);
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
      if (currentUserId) {
        purgeUserEnterpriseCache(currentUserId);
        removeUserScopedItem(STORAGE_KEYS.CURRENT_COMPANY_ID, currentUserId);
      }
      setCurrentUserId(null);

      // Clear onboarding progress on logout to ensure a fresh start
      localStorage.removeItem('onboarding_current_step');
      localStorage.removeItem('onboarding_company_data');
      localStorage.removeItem('onboarding_modules');

      setLoading(false);
      return;
    }

    setUser(currentUser);
    setIsAuthenticated(true);
    setIsCheckingOnboarding(true);
    setCurrentUserId(currentUser.id); // Indique qu'on vérifie l'état d'onboarding

    try {
      const companies = await getUserCompanies(currentUser.id);
      setUserCompanies(companies || []);

      // Check user metadata for experience flag (fallback to localStorage)
      try {
        const { data: userMetaResponse, error: userMetaError } = await supabase.auth.getUser();
        if (!userMetaError && userMetaResponse?.user) {
          const seen = (userMetaResponse.user.user_metadata as any)?.seen_experience;
          if (!seen) {
            setShouldShowExperience(true);
            if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('show-experience'));
          } else {
            setShouldShowExperience(false);
          }
        }
      } catch (metaErr) {
        // fallback to client localStorage when metadata read fails
        const seenLocal = typeof window !== 'undefined' && localStorage.getItem('seen_experience') === 'true';
  setShouldShowExperience(!seenLocal);
  if (!seenLocal && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('show-experience'));
      }

      if (companies && companies.length > 0) {
        setOnboardingCompleted(true);
        localStorage.removeItem('onboarding_just_completed'); // Clean up the flag
        
        // Vérifier et créer automatiquement un abonnement d'essai si nécessaire
        await ensureTrialSubscription(currentUser.id, companies[0].id);

        // Démarrer la vérification de l'expiration des essais
        trialExpirationService.startPeriodicCheck(60); // Vérifier toutes les heures

        // Vérifier l'état de l'utilisateur au démarrage
        await trialExpirationService.checkUserOnStartup(currentUser.id);
        
        const lastCompanyId = readUserScopedItem(STORAGE_KEYS.CURRENT_COMPANY_ID, currentUser.id);
        const companyToLoad = companies.find(c => c.id === lastCompanyId) || companies[0];

        if (companyToLoad) {
          try {
            await switchCompany(companyToLoad.id);
          } catch (switchError) {
            logger.error("AuthContext | Erreur lors du chargement de l'entreprise, tentative avec la première entreprise:", switchError);
            // Essayer avec la première entreprise si celle sélectionnée échoue
            if (companies[0] && companies[0].id !== companyToLoad.id) {
              try {
                await switchCompany(companies[0].id);
              } catch (fallbackError) {
                logger.error("AuthContext | Échec du fallback vers la première entreprise:", fallbackError);
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
  // no companies means new user, also show experience
  setShouldShowExperience(true);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('show-experience'));
        setCurrentCompany(null);
      }
    } catch (error) {
      logger.error("AuthContext | Erreur lors de la récupération des données utilisateur:", error);

      // Gestion spéciale des erreurs RLS/500 - assumer que l'utilisateur doit faire l'onboarding
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('500') || errorMessage.includes('RLS') || errorMessage.includes('policy')) {
        logger.warn('🔄 Erreur RLS détectée - redirection vers onboarding');
        setOnboardingCompleted(false);
      }

      // Ne pas déconnecter automatiquement, juste logger l'erreur
      setUserCompanies([]);
      setCurrentCompany(null);
      setOnboardingCompleted(false);
  setShouldShowExperience(true);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('show-experience'));
    } finally {
      setIsCheckingOnboarding(false); // Fin de la vérification
      setLoading(false);
    }
  }, [switchCompany, ensureTrialSubscription, currentUserId]);

  useEffect(() => {
    setLoading(true);

    // Handle URL hash authentication tokens (email confirmation, etc.)
    const handleAuthFromUrl = () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');

      if (accessToken && type === 'email_confirmation') {
        logger.warn('📧 Email confirmation detected, cleaning URL...');
        // Clean URL by removing hash parameters
        window.history.replaceState(null, '', '/onboarding');
        return true;
      }
      return false;
    };

    const isEmailConfirmation = handleAuthFromUrl();

    // Check for existing session on initial load
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        logger.warn('Session recovery failed, clearing auth data:', error);
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
        logger.warn('📧 Email confirmed, user will be redirected to onboarding')
      }
      
      fetchUserSession(session?.user ?? null);
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      logger.warn('🔐 Auth state change:', event);

      setSession(session);

      // Special handling for email confirmation
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        if (hashParams.get('type') === 'email_confirmation') {
          logger.warn('📧 Email confirmation event detected - redirecting to onboarding');
          window.history.replaceState(null, '', '/onboarding');
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
    shouldShowExperience,
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


