import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserAccess } from '@/hooks/useUserAccess';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext();

// Helper function to clear Supabase auth data from localStorage
const clearSupabaseAuthData = () => {
  try {
    // Get the Supabase project reference from the URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
      if (projectRef) {
        // Clear the auth token from localStorage
        const authKey = `sb-${projectRef}-auth-token`;
        localStorage.removeItem(authKey);
      }
    }
    
    // Also clear any other potential Supabase auth keys
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
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const { toast } = useToast();

  // Initialize userAccess hook with null user ID initially
  const userAccessHookData = useUserAccess();

  useEffect(() => {
    if (!supabase) {
      console.warn("AuthContext: Supabase client is null. Skipping session and auth listener setup.");
      setUser(null);
      setLoadingAuth(false);
      return;
    }

    const getSession = async () => {
      setLoadingAuth(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("AuthContext: Error getting session:", error.message);
          if (error.message?.toLowerCase().includes('refresh token not found') || error.message?.toLowerCase().includes('invalid refresh token')) {
            setUser(null);
            clearSupabaseAuthData(); // Clear invalid tokens from localStorage
            await supabase.auth.signOut();
          }
        } else {
          setUser(session?.user ?? null);
        }
      } catch (e) {
        console.error("AuthContext: Exception in getSession:", e.message);
        setUser(null);
        // Clear auth data if it's a token-related error
        if (e.message?.toLowerCase().includes('refresh token') || e.message?.toLowerCase().includes('invalid')) {
          clearSupabaseAuthData();
        }
      } finally {
        setLoadingAuth(false);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoadingAuth(true);
        if (event === 'SIGNED_OUT') {
          setUser(null);
          userAccessHookData?.clearAccessData?.();
          clearSupabaseAuthData(); // Ensure clean logout
        } else if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
          setUser(session?.user ?? null);
        } else if (event === 'INITIAL_SESSION' && !session) {
          setUser(null);
        } else if (session?.user) {
          setUser(session.user);
        } else if (!session && user) {
          setUser(null);
          userAccessHookData?.clearAccessData?.();
        }

        if (!session && user && event !== 'SIGNED_OUT') {
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError?.message?.toLowerCase().includes('refresh token not found') || refreshError?.message?.toLowerCase().includes('invalid refresh token')) {
            setUser(null);
            userAccessHookData?.clearAccessData?.();
            clearSupabaseAuthData(); // Clear invalid tokens
            await supabase.auth.signOut();
          }
        }

        setLoadingAuth(false);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  // Mise à jour pour accepter un objet complet avec options
  const signUp = async (data) => {
    if (!supabase) return { error: { message: "Service d'authentification non disponible." } };
    
    try {
      // Vérifier si data est un objet avec email/password ou un objet complet
      if (typeof data === 'object' && 'email' in data && 'password' in data && 'options' in data) {
        // Format complet avec options
        return supabase.auth.signUp(data);
      } else if (typeof data === 'string' && arguments.length >= 2) {
        // Format ancien: email, password comme arguments séparés
        const email = data;
        const password = arguments[1];
        return supabase.auth.signUp({ email, password });
      } else {
        // Format simple: objet avec email et password
        return supabase.auth.signUp(data);
      }
    } catch (error) {
      console.error("SignUp error:", error);
      toast({
        variant: 'destructive',
        title: 'Erreur d\'inscription',
        description: error.message || "Une erreur s'est produite lors de l'inscription. Veuillez réessayer."
      });
      return { error };
    }
  };

  const signIn = async (data) => {
    if (!supabase) return { error: { message: "Service d'authentification non disponible." } };
    
    try {
      // Support pour différents formats d'appel
      if (typeof data === 'string' && arguments.length >= 2) {
        // Format ancien: email, password comme arguments séparés
        const email = data;
        const password = arguments[1];
        return supabase.auth.signInWithPassword({ email, password });
      } else {
        // Format objet
        return supabase.auth.signInWithPassword(data);
      }
    } catch (error) {
      console.error("SignIn error:", error);
      toast({
        variant: 'destructive',
        title: 'Erreur de connexion',
        description: error.message || "Une erreur s'est produite lors de la connexion. Veuillez réessayer."
      });
      return { error };
    }
  };

  const signOut = async () => {
    if (!supabase) {
      setUser(null);
      userAccessHookData?.clearAccessData?.();
      clearSupabaseAuthData(); // Clear auth data on manual sign out
      return;
    }
    try {
      await supabase.auth.signOut();
      clearSupabaseAuthData(); // Ensure clean sign out
    } catch (error) {
      console.error("SignOut error:", error);
      toast({
        variant: 'destructive',
        title: 'Erreur de déconnexion',
        description: error.message || "Une erreur s'est produite lors de la déconnexion."
      });
    }
  };

  const value = {
    user,
    loading: loadingAuth || (user ? userAccessHookData.loading : false),
    signUp,
    signIn,
    signOut,
    ...userAccessHookData,
    refreshUserAccess: userAccessHookData.refetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};