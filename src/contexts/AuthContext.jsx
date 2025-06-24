// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext();

// Helper function to clear Supabase auth data from localStorage
const clearSupabaseAuthData = () => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
      if (projectRef) {
        const authKey = `sb-${projectRef}-auth-token`;
        localStorage.removeItem(authKey);
      }
    }
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') && key.includes('auth')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Failed to clear Supabase auth data from localStorage:', error);
  }
};

export const AuthProvider = ({ children }) => {
  // États d'authentification
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // États d'entreprise
  const [currentEnterpriseId, setCurrentEnterpriseId] = useState(null);
  const [currentEnterpriseName, setCurrentEnterpriseName] = useState(null);
  const [userCompanies, setUserCompanies] = useState([]);
  
  const { toast } = useToast();

  // Récupérer les entreprises de l'utilisateur
  const fetchUserCompanies = useCallback(async (userId) => {
    if (!userId) {
      setUserCompanies([]);
      setCurrentEnterpriseId(null);
      setCurrentEnterpriseName(null);
      return;
    }

    try {
      const { data: companies, error } = await supabase
  .from('user_companies')
  .select(`
    company_id,
    is_default,
    companies (
      id,
      name,
      country,
      default_currency
    )
  `)
  .eq('user_id', userId);

      if (error) {
        console.error('Erreur récupération entreprises:', error);
        return;
      }

      setUserCompanies(companies || []);

      // Définir l'entreprise par défaut
      if (companies && companies.length > 0) {
        const defaultCompany = companies.find(uc => uc.is_default) || companies[0];
        setCurrentEnterpriseId(defaultCompany.company_id);
        setCurrentEnterpriseName(defaultCompany.companies.name);
      } else {
        setCurrentEnterpriseId(null);
        setCurrentEnterpriseName(null);
      }

    } catch (error) {
      console.error('Erreur fetchUserCompanies:', error);
    }
  }, []);

  // Changer d'entreprise
  const switchEnterprise = useCallback((companyId) => {
    const company = userCompanies.find(uc => uc.company_id === companyId);
    if (company) {
      setCurrentEnterpriseId(company.company_id);
      setCurrentEnterpriseName(company.companies.name);
    }
  }, [userCompanies]);

  // Nettoyer les données
  const clearUserData = useCallback(() => {
    setUser(null);
    setUserCompanies([]);
    setCurrentEnterpriseId(null);
    setCurrentEnterpriseName(null);
  }, []);

  // Gestion de la session et authentification
  useEffect(() => {
    if (!supabase) {
      console.warn("AuthContext: Supabase client is null");
      setUser(null);
      setLoading(false);
      return;
    }

    const getSession = async () => {
      setLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("AuthContext: Error getting session:", error.message);
          if (error.message?.toLowerCase().includes('refresh token not found') || 
              error.message?.toLowerCase().includes('invalid refresh token')) {
            clearUserData();
            clearSupabaseAuthData();
            await supabase.auth.signOut();
          }
        } else if (session?.user) {
          setUser(session.user);
          await fetchUserCompanies(session.user.id);
        } else {
          clearUserData();
        }
      } catch (e) {
        console.error("AuthContext: Exception in getSession:", e.message);
        clearUserData();
        if (e.message?.toLowerCase().includes('refresh token') || 
            e.message?.toLowerCase().includes('invalid')) {
          clearSupabaseAuthData();
        }
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Écouter les changements d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);
        
        if (event === 'SIGNED_OUT') {
          clearUserData();
          clearSupabaseAuthData();
        } else if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
          if (session?.user) {
            setUser(session.user);
            await fetchUserCompanies(session.user.id);
          }
        } else if (event === 'INITIAL_SESSION' && !session) {
          clearUserData();
        } else if (session?.user) {
          setUser(session.user);
          await fetchUserCompanies(session.user.id);
        } else if (!session && user) {
          clearUserData();
        }

        // Gestion des tokens expirés
        if (!session && user && event !== 'SIGNED_OUT') {
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError?.message?.toLowerCase().includes('refresh token not found') || 
              refreshError?.message?.toLowerCase().includes('invalid refresh token')) {
            clearUserData();
            clearSupabaseAuthData();
            await supabase.auth.signOut();
          }
        }

        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe?.();
    };
  }, [fetchUserCompanies, user, clearUserData]);

  // Fonction d'inscription
  const signUp = async (data) => {
    if (!supabase) return { error: { message: "Service d'authentification non disponible." } };
    
    try {
      if (typeof data === 'object' && 'email' in data && 'password' in data && 'options' in data) {
        return supabase.auth.signUp(data);
      } else if (typeof data === 'string' && arguments.length >= 2) {
        const email = data;
        const password = arguments[1];
        return supabase.auth.signUp({ email, password });
      } else {
        return supabase.auth.signUp(data);
      }
    } catch (error) {
      console.error("SignUp error:", error);
      toast({
        variant: 'destructive',
        title: 'Erreur d\'inscription',
        description: error.message || "Une erreur s'est produite lors de l'inscription."
      });
      return { error };
    }
  };

  // Fonction de connexion
  const signIn = async (data) => {
    if (!supabase) return { error: { message: "Service d'authentification non disponible." } };
    
    try {
      if (typeof data === 'string' && arguments.length >= 2) {
        const email = data;
        const password = arguments[1];
        return supabase.auth.signInWithPassword({ email, password });
      } else {
        return supabase.auth.signInWithPassword(data);
      }
    } catch (error) {
      console.error("SignIn error:", error);
      toast({
        variant: 'destructive',
        title: 'Erreur de connexion',
        description: error.message || "Une erreur s'est produite lors de la connexion."
      });
      return { error };
    }
  };

  // Fonction de déconnexion
  const signOut = async () => {
    if (!supabase) {
      clearUserData();
      clearSupabaseAuthData();
      return;
    }
    
    try {
      await supabase.auth.signOut();
      clearSupabaseAuthData();
    } catch (error) {
      console.error("SignOut error:", error);
      toast({
        variant: 'destructive',
        title: 'Erreur de déconnexion',
        description: error.message || "Une erreur s'est produite lors de la déconnexion."
      });
    }
  };

  // Rafraîchir les données utilisateur
  const refreshUserAccess = useCallback(() => {
    if (user?.id) {
      fetchUserCompanies(user.id);
    }
  }, [user?.id, fetchUserCompanies]);

  const value = {
    // États d'authentification
    user,
    loading,
    
    // États d'entreprise
    currentEnterpriseId,
    currentEnterpriseName,
    userCompanies,
    
    // Fonctions d'authentification
    signUp,
    signIn,
    signOut,
    
    // Fonctions de gestion des entreprises
    switchEnterprise,
    refreshUserAccess,
    
    // Fonctions utilitaires
    clearAccessData: clearUserData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
