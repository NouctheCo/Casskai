// src/hooks/useSupabase.ts

import { useState, useEffect, useCallback } from 'react';
import { SupabaseClient, User, Session } from '@supabase/supabase-js';
import ConfigService from '../services/configService';
import { useConfig } from './useConfig';

interface UseSupabaseReturn {
  // Client Supabase
  client: SupabaseClient | null;
  isClientReady: boolean;

  // Authentification
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions d'authentification
  signUp: (email: string, password: string, userData?: any) => Promise<{ user: User | null; error: any }>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;

  // Utilitaires
  executeQuery: <T = any>(query: () => Promise<T>) => Promise<T>;
  isConnected: () => boolean;
}

export const useSupabase = (): UseSupabaseReturn => {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClientReady, setIsClientReady] = useState(false);

  const { isConfigured, getSupabaseConfig } = useConfig();
  const configService = ConfigService.getInstance();

  // Initialiser le client Supabase quand la config est prête
  useEffect(() => {
    const initializeClient = async () => {
      if (!isConfigured) {
        setIsClientReady(false);
        return;
      }

      try {
        setIsLoading(true);
        const supabaseClient = await configService.initializeSupabaseClient();
        setClient(supabaseClient);
        setIsClientReady(true);

        // Récupérer la session actuelle
        const { data: { session: currentSession } } = await supabaseClient.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user || null);

        // Écouter les changements d'authentification
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
          (event, session) => {
            setSession(session);
            setUser(session?.user || null);
            setIsLoading(false);
          }
        );

        // Cleanup
        return () => {
          subscription.unsubscribe();
        };

      } catch (error) {
        console.error('Erreur d\'initialisation Supabase:', error);
        setIsClientReady(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeClient();
  }, [isConfigured, configService]);

  // Inscription
  const signUp = useCallback(async (email: string, password: string, userData?: any) => {
    if (!client) {
      throw new Error('Client Supabase non initialisé');
    }

    try {
      setIsLoading(true);
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      return { user: data.user, error };
    } catch (error) {
      return { user: null, error };
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  // Connexion
  const signIn = useCallback(async (email: string, password: string) => {
    if (!client) {
      throw new Error('Client Supabase non initialisé');
    }

    try {
      setIsLoading(true);
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      });

      return { user: data.user, error };
    } catch (error) {
      return { user: null, error };
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  // Déconnexion
  const signOut = useCallback(async () => {
    if (!client) {
      throw new Error('Client Supabase non initialisé');
    }

    try {
      setIsLoading(true);
      const { error } = await client.auth.signOut();
      return { error };
    } catch (error) {
      return { error };
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  // Réinitialisation du mot de passe
  const resetPassword = useCallback(async (email: string) => {
    if (!client) {
      throw new Error('Client Supabase non initialisé');
    }

    try {
      const { error } = await client.auth.resetPasswordForEmail(email);
      return { error };
    } catch (error) {
      return { error };
    }
  }, [client]);

  // Exécuter une requête avec gestion d'erreur
  const executeQuery = useCallback(async <T = any>(query: () => Promise<T>): Promise<T> => {
    if (!client) {
      throw new Error('Client Supabase non initialisé');
    }

    try {
      return await query();
    } catch (error) {
      console.error('Erreur lors de l\'exécution de la requête:', error);
      throw error;
    }
  }, [client]);

  // Vérifier la connexion
  const isConnected = useCallback((): boolean => {
    return isClientReady && client !== null;
  }, [isClientReady, client]);

  return {
    // Client Supabase
    client,
    isClientReady,

    // Authentification
    user,
    session,
    isAuthenticated: !!user,
    isLoading,

    // Actions d'authentification
    signUp,
    signIn,
    signOut,
    resetPassword,

    // Utilitaires
    executeQuery,
    isConnected
  };
};
