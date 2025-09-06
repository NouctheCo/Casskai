import React, { createContext, useContext, useState, useEffect } from 'react';

interface AppConfig {
  company: {
    name: string;
    country: string;
    currency: string;
    timezone: string;
    fiscalYear: {
      start: number;
      end: number;
    };
  };
  setupCompleted: boolean;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigContextType {
  config: AppConfig | null;
  isLoading: boolean;
  isConfigured: boolean;
  error: string | null;
  updateConfig: (updates: Partial<AppConfig>) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const DEFAULT_CONFIG: AppConfig = {
  company: {
    name: 'Mon Entreprise',
    country: 'FR',
    currency: 'EUR',
    timezone: 'Europe/Paris',
    fiscalYear: {
      start: 1, // Janvier
      end: 12   // Décembre
    }
  },
  setupCompleted: true,
  version: '1.0.0',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.warn('🔧 Chargement de la configuration...');
    
    try {
      // Charger la configuration depuis localStorage
      const savedConfig = localStorage.getItem('casskai_config');
      
      if (savedConfig) {
        console.warn('📦 Configuration trouvée dans localStorage');
        setConfig(JSON.parse(savedConfig));
      } else {
        console.warn('📦 Utilisation de la configuration par défaut');
        setConfig(DEFAULT_CONFIG);
        localStorage.setItem('casskai_config', JSON.stringify(DEFAULT_CONFIG));
      }
    } catch (err) {
      console.error('❌ Erreur lors du chargement de la configuration:', err);
      setError('Erreur lors du chargement de la configuration');
      setConfig(DEFAULT_CONFIG);
    } finally {
      setIsLoading(false);
      console.warn('🏁 Configuration chargée');
    }
  }, []);

  const updateConfig = (updates: Partial<AppConfig>) => {
    if (!config) return;
    
    console.warn('🔄 Mise à jour de la configuration:', updates);
    
    const newConfig = {
      ...config,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    setConfig(newConfig);
    localStorage.setItem('casskai_config', JSON.stringify(newConfig));
    
    console.warn('✅ Configuration mise à jour');
  };

  const value: ConfigContextType = {
    config,
    isLoading,
    isConfigured: !!config && config.setupCompleted,
    error,
    updateConfig
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfigContext = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfigContext must be used within a ConfigProvider');
  }
  return context;
};