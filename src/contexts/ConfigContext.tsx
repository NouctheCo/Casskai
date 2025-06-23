import React, { createContext, useContext, useEffect, useState } from 'react';
import { useConfig } from '../hooks/useConfig';
import { useSupabase } from '../hooks/useSupabase';
import type { AppConfig, ConfigStatus } from '../types/config';

interface ConfigContextType {
  // État de configuration
  config: AppConfig | null;
  status: ConfigStatus;
  isConfigured: boolean;
  isLoading: boolean;
  error: string | null;

  // État Supabase
  isSupabaseReady: boolean;
  isAuthenticated: boolean;

  // Actions
  refreshConfig: () => Promise<void>;
  resetConfig: () => void;

  // Getters
  getCompanyInfo: () => { name: string; country: string; currency: string } | null;
  getSupabaseInfo: () => { url: string; isConnected: boolean } | null;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const useConfigContext = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfigContext must be used within a ConfigProvider');
  }
  return context;
};

interface ConfigProviderProps {
  children: React.ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  const configHook = useConfig();
  const supabaseHook = useSupabase();
  const [error, setError] = useState<string | null>(null);

  // Synchroniser les erreurs
  useEffect(() => {
    if (configHook.error) {
      setError(configHook.error.message);
    } else {
      setError(null);
    }
  }, [configHook.error]);

  // Actions
  const refreshConfig = async () => {
    try {
      setError(null);
      // Le hook useConfig se recharge automatiquement
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de rechargement');
    }
  };

  const resetConfig = () => {
    try {
      configHook.resetConfig();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de reset');
    }
  };

  // Getters
  const getCompanyInfo = () => {
    const company = configHook.getCompanyConfig();
    if (!company) return null;

    return {
      name: company.name,
      country: company.country,
      currency: company.currency
    };
  };

  const getSupabaseInfo = () => {
    const supabaseConfig = configHook.getSupabaseConfig();
    if (!supabaseConfig) return null;

    return {
      url: supabaseConfig.url,
      isConnected: supabaseHook.isClientReady
    };
  };

  const value: ConfigContextType = {
    // État de configuration
    config: configHook.config,
    status: configHook.status,
    isConfigured: configHook.isConfigured,
    isLoading: configHook.isLoading || supabaseHook.isLoading,
    error: error || (supabaseHook.user ? null : 'Non authentifié'),

    // État Supabase
    isSupabaseReady: supabaseHook.isClientReady,
    isAuthenticated: supabaseHook.isAuthenticated,

    // Actions
    refreshConfig,
    resetConfig,

    // Getters
    getCompanyInfo,
    getSupabaseInfo
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};
