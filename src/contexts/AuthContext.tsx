/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';

import { supabase } from '../lib/supabase';

import type { User, Session, AuthResponse, AuthError } from '@supabase/supabase-js';

import { getCompanyDetails, getUserCompanies, getCompanyModules } from '../lib/company';

import { trialService } from '../services/trialService';

import { trialExpirationService } from '../services/trialExpirationService';

import { auditService } from '../services/auditService';

import type { Company } from '../types/database/company.types';



// Interface pour le profil utilisateur depuis public.users

export interface UserProfile {

  id: string;

  email: string;

  full_name: string | null;

  avatar_url: string | null;

  phone: string | null;

  created_at: string;

  updated_at: string;

}



interface AuthContextType {

  user: User | null;

  userProfile: UserProfile | null; // Profil depuis public.users

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

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // Profil depuis public.users

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



  // Ref pour tracker si c'est le premier chargement

  const isInitialMount = useRef(true);

  const hasCompletedInitialCheck = useRef(false);



  const signOut = useCallback(async (): Promise<{ error: AuthError | null }> => {

    // Récupérer l'ID utilisateur avant déconnexion pour l'audit
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const userId = currentUser?.id;

    // Arrêter le service de vérification des essais

    trialExpirationService.stopPeriodicCheck();



    const { error } = await supabase.auth.signOut();

    // Audit trail - Logout
    if (userId) {
      auditService.logAuth('LOGOUT', userId, !error);
    }

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
    console.log('[AuthContext] switchCompany called with:', companyId);

    // Not setting loading here to avoid flicker when switching companies

    try {
      console.log('[AuthContext] Fetching company details...');
      const companyDetails = await getCompanyDetails(companyId);
      console.log('[AuthContext] Company details fetched:', companyDetails);

      if (companyDetails) {
        setCurrentCompany(companyDetails);
        console.log('[AuthContext] currentCompany state set to:', companyDetails.id, companyDetails.name);

        // Conserver les deux clés locales utilisées par les guards (legacy/new)
        localStorage.setItem('casskai_current_company_id', companyId);
        localStorage.setItem('casskai_current_enterprise', companyId);

        const modules = await getCompanyModules(companyId);

        localStorage.setItem('casskai_modules', JSON.stringify(modules));

        window.dispatchEvent(new CustomEvent('module-states-reset'));

        

        console.warn(`Entreprise changée: ${companyDetails.name}`);

      } else {

        throw new Error("Impossible de trouver les détails de l'entreprise.");

      }

    } catch (error) {

      console.error("[AuthContext] Error during switchCompany:", error);

      // Ne pas lancer une erreur fatale, juste logger

      setCurrentCompany(null);

    }

  }, []);



  const fetchUserSession = useCallback(async (currentUser: User | null) => {

    // This function is the single source of truth for user-related state.

    if (!currentUser) {

      setUser(null);

      setUserProfile(null); // Nettoyer le profil

      setSession(null);

      setCurrentCompany(null);

      setUserCompanies([]);

      setIsAuthenticated(false);

      setOnboardingCompleted(false);

      setIsCheckingOnboarding(false);

      localStorage.removeItem('casskai_current_company_id');
      localStorage.removeItem('casskai_current_enterprise');



      // Clear onboarding progress on logout to ensure a fresh start

      localStorage.removeItem('onboarding_current_step');

      localStorage.removeItem('onboarding_company_data');

      localStorage.removeItem('onboarding_modules');



      setLoading(false);

      hasCompletedInitialCheck.current = false;

      return;

    }



    // Guard: Si on a déjà une session valide et qu'on n'est pas au premier chargement,

    // ne pas refaire un check complet qui va mettre isCheckingOnboarding à true

    if (hasCompletedInitialCheck.current && currentCompany && onboardingCompleted) {

      console.log('✅ Session already valid, skipping full check to avoid reload');

      setUser(currentUser);

      setIsAuthenticated(true);

      return;

    }



    setUser(currentUser);

    setIsAuthenticated(true);



    // ✅ SÉCURITÉ: Charger le profil depuis public.users (pas auth.users)

    try {

      const { data: profile, error: profileError } = await supabase

        .from('users')

        .select('id, email, full_name, avatar_url, phone, created_at, updated_at')

        .eq('id', currentUser.id)

        .single();



      if (profileError) {

        console.error('⚠️  Erreur chargement profil public.users:', profileError);

        // Ne pas bloquer l'authentification si le profil n'existe pas encore

        setUserProfile(null);

      } else {

        setUserProfile(profile);

        console.log('✅ Profil utilisateur chargé depuis public.users');

      }

    } catch (error) {

      console.error('⚠️  Exception chargement profil:', error);

      setUserProfile(null);

    }



    // ✅ TOUJOURS mettre isCheckingOnboarding à true lors du chargement des données utilisateur
    // Cela empêche le AuthGuard de rediriger prématurément vers /onboarding
    setIsCheckingOnboarding(true);



    try {

      const companies = await getUserCompanies(currentUser.id);
      console.log('[AuthContext] getUserCompanies returned:', companies?.length || 0, 'companies');
      setUserCompanies((companies as Company[]) || []);



      if (companies && companies.length > 0) {
        // ============================================
        // ✅ LOGIQUE ULTRA SIMPLE : Si entreprise existe → onboarding complété
        // ============================================
        console.log('✅ Entreprise trouvée, onboarding marqué comme complété automatiquement');
        setOnboardingCompleted(true);
        localStorage.setItem(`onboarding_completed_${currentUser.id}`, 'true');
        localStorage.removeItem('onboarding_just_completed');



        // Vérifier et créer automatiquement un abonnement d'essai si nécessaire

        await ensureTrialSubscription(currentUser.id, companies[0].id);



        // Démarrer la vérification de l'expiration des essais

        trialExpirationService.startPeriodicCheck(60); // Vérifier toutes les heures



        // Vérifier l'état de l'utilisateur au démarrage

        await trialExpirationService.checkUserOnStartup(currentUser.id);

        

        const lastCompanyId = localStorage.getItem('casskai_current_company_id');

        const companyToLoad = companies.find(c => c.id === lastCompanyId) || companies[0];

        console.log('[AuthContext] companyToLoad:', companyToLoad?.id, companyToLoad?.name);


        if (companyToLoad) {

          try {

            console.log('[AuthContext] Calling switchCompany with:', companyToLoad.id);
            await switchCompany(companyToLoad.id);
            console.log('[AuthContext] switchCompany completed successfully');

            // Marquer le check initial comme complété après succès
            // eslint-disable-next-line require-atomic-updates
            hasCompletedInitialCheck.current = true;

          } catch (switchError) {

            console.error("AuthContext | Erreur lors du chargement de l'entreprise, tentative avec la première entreprise:", switchError);

            // Essayer avec la première entreprise si celle sélectionnée échoue

            if (companies[0] && companies[0].id !== companyToLoad.id) {

              try {

                console.log('[AuthContext] Retrying with first company:', companies[0].id);
                await switchCompany(companies[0].id);
                console.log('[AuthContext] Fallback switchCompany succeeded');

                // Marquer le check initial comme complété après succès du fallback
                // eslint-disable-next-line require-atomic-updates
                hasCompletedInitialCheck.current = true;

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



      // Gestion spéciale des erreurs RLS/500 - assumer que l'utilisateur doit faire l'onboarding

      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('500') || errorMessage.includes('RLS') || errorMessage.includes('policy')) {

        console.warn('🔄 Erreur RLS détectée - redirection vers onboarding');

        setOnboardingCompleted(false);

      }



      // Ne pas déconnecter automatiquement, juste logger l'erreur

      setUserCompanies([]);

      setCurrentCompany(null);

      setOnboardingCompleted(false);

    } finally {

      setIsCheckingOnboarding(false); // Fin de la vérification

      // Ne mettre setLoading(false) que si on est vraiment en loading

      // Évite les rechargements inutiles lors des navigations

      setLoading(false);

      // Marquer que ce n'est plus le premier chargement
      if (isInitialMount.current) {
        isInitialMount.current = false;
      }

    }

  }, [switchCompany, ensureTrialSubscription]);



  useEffect(() => {

    // Ne pas faire setLoading(true) ici pour éviter les rechargements à chaque navigation

    // Le loading initial est déjà géré par l'état useState(true)



    // Handle URL hash authentication tokens (email confirmation, etc.)

    const handleAuthFromUrl = () => {

      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      const accessToken = hashParams.get('access_token');

      const type = hashParams.get('type');



      if (accessToken && type === 'email_confirmation') {

        console.warn('📧 Email confirmation detected, cleaning URL...');

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



      // Update session for all events

      setSession(session);



      // Special handling for email confirmation

      if (event === 'SIGNED_IN') {

        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        if (hashParams.get('type') === 'email_confirmation') {

          console.warn('📧 Email confirmation event detected - redirecting to onboarding');

          window.history.replaceState(null, '', '/onboarding');

        }

      }



      // Only refetch user data for significant auth events, not for silent token refreshes

      // TOKEN_REFRESHED happens automatically when user returns to tab - should not trigger full session check

      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {

        console.warn(`🔄 Fetching user session due to ${event}`);

        fetchUserSession(session?.user ?? null);

      } else if (event === 'TOKEN_REFRESHED') {

        console.warn('♻️  Token refreshed silently - no session refetch needed');

        // Just update the session, don't refetch everything

      }

    });



    return () => {

      authListener.subscription.unsubscribe();

    };

  }, [fetchUserSession]);



  const signIn = async (credentials: { email: string; password: string }): Promise<AuthResponse> => {

    const response = await supabase.auth.signInWithPassword(credentials);

    // Audit trail - Login
    if (response.data.user) {
      auditService.logAuth('LOGIN', response.data.user.id, !response.error);

      // Immediately trigger fetchUserSession to load company data
      // This prevents the race condition where the user gets redirected to /onboarding
      // before fetchUserSession has had a chance to run
      if (!response.error) {
        // ⚠️ CRITICAL: Set checking flag IMMEDIATELY before calling fetchUserSession
        // Otherwise AuthGuard will redirect to /onboarding before the async function runs
        setIsCheckingOnboarding(true);
        fetchUserSession(response.data.user);
      }
    }

    return response;

  };



  const signUp = async (credentials: { email: string; password: string; options?: { [key: string]: unknown } }): Promise<AuthResponse> => {

    const response = await supabase.auth.signUp(credentials);

    // Audit trail - Signup
    if (response.data.user) {
      auditService.logAuth('SIGNUP', response.data.user.id, !response.error);
    }

    return response;

  };



  const value = {

    user,

    userProfile, // Profil depuis public.users

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
