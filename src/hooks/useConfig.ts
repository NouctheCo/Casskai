// src/hooks/useConfig.ts

import { useState, useEffect, useCallback } from 'react';
import ConfigService from '../services/configService';
import type { 
  AppConfig, 
  ConfigStatus, 
  ConfigError, 
  SupabaseConfig, 
  CompanyConfig,
  ConfigValidation
} from '../types/config';
import { ERROR_CODES, ERROR_MESSAGES } from '../utils/constants';

interface UseConfigReturn {
  // État
  config: AppConfig | null;
  status: ConfigStatus;
  isConfigured: boolean;
  isLoading: boolean;
  error: ConfigError | null;

  // Actions
  saveConfig: (config: AppConfig) => Promise<void>;
  validateSupabaseConfig: (url: string, anonKey: string) => Promise<boolean>;
  initializeDatabase: () => Promise<void>;
  resetConfig: () => void;
  exportConfig: () => string | null;

  // Validation
  validateConfig: (config: Partial<AppConfig>) => ConfigValidation;

  // Getters
  getSupabaseConfig: () => SupabaseConfig | null;
  getCompanyConfig: () => CompanyConfig | null;
}

export const useConfig = (): UseConfigReturn => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [status, setStatus] = useState<ConfigStatus>('not_configured');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ConfigError | null>(null);

  const configService = ConfigService.getInstance();

  // Charger la configuration au montage
  useEffect(() => {
    loadConfig();
  }, []);

  // Charger la configuration depuis le service
  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const savedConfig = configService.getConfig();
      
      if (savedConfig) {
        setConfig(savedConfig);
        setStatus(savedConfig.setupCompleted ? 'configured' : 'configuring');
        
        // Tenter d'initialiser Supabase si la config est complète
        if (savedConfig.setupCompleted && savedConfig.supabase.validated) {
          try {
            await configService.initializeSupabaseClient();
          } catch (err) {
            console.warn('Impossible d\'initialiser Supabase:', err);
          }
        }
      } else {
        setStatus('not_configured');
      }
    } catch (err) {
      const configError: ConfigError = {
        code: ERROR_CODES.CONFIG_NOT_FOUND,
        message: ERROR_MESSAGES[ERROR_CODES.CONFIG_NOT_FOUND],
        details: err,
        timestamp: new Date().toISOString()
      };
      setError(configError);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, [configService]);

  // Sauvegarder la configuration
  const saveConfig = useCallback(async (newConfig: AppConfig): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      setStatus('configuring');

      // Valider la configuration avant sauvegarde
      const validation = validateConfig(newConfig);
      if (!validation.isValid) {
        throw new Error(`Configuration invalide: ${validation.errors.join(', ')}`);
      }

      // Sauvegarder via le service
      await configService.saveConfig(newConfig);
      
      // Mettre à jour l'état local
      setConfig(newConfig);
      setStatus(newConfig.setupCompleted ? 'configured' : 'configuring');

    } catch (err) {
      const configError: ConfigError = {
        code: ERROR_CODES.CONFIG_NOT_FOUND,
        message: err instanceof Error ? err.message : 'Erreur de sauvegarde',
        details: err,
        timestamp: new Date().toISOString()
      };
      setError(configError);
      setStatus('error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [configService]);

  // Valider la configuration Supabase
  const validateSupabaseConfig = useCallback(async (url: string, anonKey: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const isValid = await configService.validateSupabaseConfig(url, anonKey);
      
      if (!isValid) {
        const configError: ConfigError = {
          code: ERROR_CODES.SUPABASE_CONNECTION_FAILED,
          message: ERROR_MESSAGES[ERROR_CODES.SUPABASE_CONNECTION_FAILED],
          timestamp: new Date().toISOString()
        };
        setError(configError);
      }

      return isValid;
    } catch (err) {
      const configError: ConfigError = {
        code: ERROR_CODES.SUPABASE_CONNECTION_FAILED,
        message: err instanceof Error ? err.message : ERROR_MESSAGES[ERROR_CODES.SUPABASE_CONNECTION_FAILED],
        details: err,
        timestamp: new Date().toISOString()
      };
      setError(configError);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [configService]);

  // Initialiser la base de données
  const initializeDatabase = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      await configService.initializeDatabase();

    } catch (err) {
      const configError: ConfigError = {
        code: ERROR_CODES.DATABASE_INIT_FAILED,
        message: ERROR_MESSAGES[ERROR_CODES.DATABASE_INIT_FAILED],
        details: err,
        timestamp: new Date().toISOString()
      };
      setError(configError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [configService]);

  // Réinitialiser la configuration
  const resetConfig = useCallback((): void => {
    try {
      configService.resetConfig();
      setConfig(null);
      setStatus('not_configured');
      setError(null);
    } catch (err) {
      const configError: ConfigError = {
        code: 'RESET_FAILED',
        message: 'Impossible de réinitialiser la configuration',
        details: err,
        timestamp: new Date().toISOString()
      };
      setError(configError);
    }
  }, [configService]);

  // Exporter la configuration
  const exportConfig = useCallback((): string | null => {
    try {
      return configService.exportConfig();
    } catch (err) {
      const configError: ConfigError = {
        code: 'EXPORT_FAILED',
        message: 'Impossible d\'exporter la configuration',
        details: err,
        timestamp: new Date().toISOString()
      };
      setError(configError);
      return null;
    }
  }, [configService]);

  // Valider une configuration
  const validateConfig = useCallback((configToValidate: Partial<AppConfig>): ConfigValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validation Supabase
    if (configToValidate.supabase) {
      const { url, anonKey } = configToValidate.supabase;
      
      if (!url) {
        errors.push('URL Supabase requise');
      } else if (!/^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/.test(url)) {
        errors.push('Format URL Supabase invalide');
      }

      if (!anonKey) {
        errors.push('Clé anonyme Supabase requise');
      } else if (anonKey.length < 100) {
        warnings.push('La clé anonyme semble courte');
      }
    }

    // Validation Entreprise
    if (configToValidate.company) {
      const { name, country, currency } = configToValidate.company;
      
      if (!name || name.trim().length < 2) {
        errors.push('Nom d\'entreprise requis (minimum 2 caractères)');
      }

      if (!country) {
        errors.push('Pays requis');
      }

      if (!currency) {
        errors.push('Devise requise');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, []);

  // Getters
  const getSupabaseConfig = useCallback((): SupabaseConfig | null => {
    return config?.supabase || null;
  }, [config]);

  const getCompanyConfig = useCallback((): CompanyConfig | null => {
    return config?.company || null;
  }, [config]);

  return {
    // État
    config,
    status,
    isConfigured: status === 'configured',
    isLoading,
    error,

    // Actions
    saveConfig,
    validateSupabaseConfig,
    initializeDatabase,
    resetConfig,
    exportConfig,

    // Validation
    validateConfig,

    // Getters
    getSupabaseConfig,
    getCompanyConfig
  };
};
