/* eslint-disable react-refresh/only-export-components */
/* eslint-disable max-lines-per-function */
import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session, AuthResponse, AuthError } from '@supabase/supabase-js';
import { getCompanyDetails, getUserCompanies, getCompanyModules } from '../lib/company';

interface Company {
  id: string;
  name: string;
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
        
        const lastCompanyId = localStorage.getItem('casskai_current_company_id');
        const companyToLoad = companies.find(c => c.id === lastCompanyId) || companies[0];

        if (companyToLoad) {
          await switchCompany(companyToLoad.id);
        } else {
          setCurrentCompany(null);
        }
      } else {
        setOnboardingCompleted(false);
        setCurrentCompany(null);
      }
    } catch (error) {
      console.error("AuthContext | Erreur critique lors de la récupération des données utilisateur:", error);
      await signOut(); // Log out on critical error to ensure a clean state
    } finally {
      setIsCheckingOnboarding(false); // Fin de la vérification
      setLoading(false);
    }
  }, [switchCompany, signOut]);

  useEffect(() => {
    setLoading(true);

    // Check for existing session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      fetchUserSession(session?.user ?? null);
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
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

