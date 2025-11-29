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

// src/hooks/useMarket.ts
import { useState, useEffect, useCallback } from 'react';

// Types pour le marché (vous pourrez les déplacer dans un fichier séparé)
export interface MarketConfig {
  id: string;
  name: string;
  region: 'europe' | 'africa' | 'americas' | 'asia';
  countries: string[];
  defaultCurrency: string;
  accountingStandard: 'PCG' | 'SYSCOHADA' | 'GAAP' | 'IFRS';
  language: string;
  timezone: string;
  taxSystem: {
    vatRate: number;
    vatNumber: string;
    fiscalYear: 'calendar' | 'april' | 'july';
  };
  features: {
    bankingIntegration: string[];
    paymentMethods: string[];
    reportingStandards: string[];
    compliance: string[];
  };
  pricing: {
    currency: string;
    starter: number;
    professional: number;
    enterprise: number;
    vatIncluded: boolean;
  };
  localization: {
    dateFormat: string;
    numberFormat: string;
    workingDays: number[];
  };
}

// Configuration des marchés
const MARKET_CONFIGS: MarketConfig[] = [
  {
    id: 'france',
    name: 'France',
    region: 'europe',
    countries: ['FR'],
    defaultCurrency: 'EUR',
    accountingStandard: 'PCG',
    language: 'fr-FR',
    timezone: 'Europe/Paris',
    taxSystem: {
      vatRate: 20,
      vatNumber: 'FR',
      fiscalYear: 'calendar'
    },
    features: {
      bankingIntegration: ['BNP Paribas', 'Crédit Agricole', 'Société Générale', 'LCL', 'Banque Populaire'],
      paymentMethods: ['SEPA', 'CB', 'Virement', 'Prélèvement'],
      reportingStandards: ['DGFiP', 'FEC', 'SIREN/SIRET'],
      compliance: ['RGPD', 'LPF', 'Code Commerce']
    },
    pricing: {
      currency: 'EUR',
      starter: 19,
      professional: 49,
      enterprise: 99,
      vatIncluded: true
    },
    localization: {
      dateFormat: 'DD/MM/YYYY',
      numberFormat: '1 234,56',
      workingDays: [1, 2, 3, 4, 5]
    }
  },
  {
    id: 'belgium',
    name: 'Belgique',
    region: 'europe',
    countries: ['BE'],
    defaultCurrency: 'EUR',
    accountingStandard: 'PCG',
    language: 'fr-BE',
    timezone: 'Europe/Brussels',
    taxSystem: {
      vatRate: 21,
      vatNumber: 'BE',
      fiscalYear: 'calendar'
    },
    features: {
      bankingIntegration: ['KBC', 'BNP Paribas Fortis', 'ING', 'Belfius'],
      paymentMethods: ['SEPA', 'Bancontact', 'Virement'],
      reportingStandards: ['BNB', 'SPF Finances'],
      compliance: ['RGPD', 'Code Sociétés']
    },
    pricing: {
      currency: 'EUR',
      starter: 19,
      professional: 49,
      enterprise: 99,
      vatIncluded: true
    },
    localization: {
      dateFormat: 'DD/MM/YYYY',
      numberFormat: '1.234,56',
      workingDays: [1, 2, 3, 4, 5]
    }
  },
  {
    id: 'benin',
    name: 'Bénin',
    region: 'africa',
    countries: ['BJ'],
    defaultCurrency: 'XOF',
    accountingStandard: 'SYSCOHADA',
    language: 'fr-BJ',
    timezone: 'Africa/Porto-Novo',
    taxSystem: {
      vatRate: 18,
      vatNumber: 'BJ',
      fiscalYear: 'calendar'
    },
    features: {
      bankingIntegration: ['Ecobank', 'BOA', 'UBA', 'BSIC'],
      paymentMethods: ['Mobile Money', 'MTN Money', 'Moov Money', 'Virement', 'Espèces'],
      reportingStandards: ['DGI Bénin', 'OHADA', 'CNSS'],
      compliance: ['Code OHADA', 'Loi Informatique et Libertés']
    },
    pricing: {
      currency: 'XOF',
      starter: 12000,
      professional: 30000,
      enterprise: 60000,
      vatIncluded: false
    },
    localization: {
      dateFormat: 'DD/MM/YYYY',
      numberFormat: '1 234',
      workingDays: [1, 2, 3, 4, 5]
    }
  },
  {
    id: 'ivory_coast',
    name: 'Côte d\'Ivoire',
    region: 'africa',
    countries: ['CI'],
    defaultCurrency: 'XOF',
    accountingStandard: 'SYSCOHADA',
    language: 'fr-CI',
    timezone: 'Africa/Abidjan',
    taxSystem: {
      vatRate: 18,
      vatNumber: 'CI',
      fiscalYear: 'calendar'
    },
    features: {
      bankingIntegration: ['SGBCI', 'BICICI', 'Ecobank', 'UBA'],
      paymentMethods: ['Mobile Money', 'Orange Money', 'MTN Money', 'Wave', 'Virement'],
      reportingStandards: ['DGI Côte d\'Ivoire', 'OHADA', 'CNPS'],
      compliance: ['Code OHADA', 'Protection Données Personnelles']
    },
    pricing: {
      currency: 'XOF',
      starter: 12000,
      professional: 30000,
      enterprise: 60000,
      vatIncluded: false
    },
    localization: {
      dateFormat: 'DD/MM/YYYY',
      numberFormat: '1 234',
      workingDays: [1, 2, 3, 4, 5]
    }
  },
  {
    id: 'canada',
    name: 'Canada (Québec)',
    region: 'americas',
    countries: ['CA'],
    defaultCurrency: 'CAD',
    accountingStandard: 'GAAP',
    language: 'fr-CA',
    timezone: 'America/Montreal',
    taxSystem: {
      vatRate: 14.975, // TPS + TVQ
      vatNumber: 'CA',
      fiscalYear: 'calendar'
    },
    features: {
      bankingIntegration: ['RBC', 'TD', 'BMO', 'Banque Nationale', 'Desjardins'],
      paymentMethods: ['Interac', 'Virement', 'Chèque'],
      reportingStandards: ['ARC', 'Revenu Québec', 'ASFC'],
      compliance: ['PIPEDA', 'Loi 25 Québec']
    },
    pricing: {
      currency: 'CAD',
      starter: 25,
      professional: 65,
      enterprise: 129,
      vatIncluded: false
    },
    localization: {
      dateFormat: 'YYYY-MM-DD',
      numberFormat: '1,234.56',
      workingDays: [1, 2, 3, 4, 5]
    }
  }
];

export function useMarket() {
  const [currentMarket, setCurrentMarket] = useState<MarketConfig | null>(null);
  const [detectedMarket, setDetectedMarket] = useState<MarketConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Détecter le marché automatiquement au chargement
  useEffect(() => {
    detectMarket();
  }, []);

  const detectMarket = async () => {
    setIsLoading(true);
    try {
      // Essayer de détecter via l'IP (simulation)
      const detected = await detectMarketFromIP();
      setDetectedMarket(detected);
      
      // Si pas de marché configuré, utiliser le marché détecté
      if (!currentMarket) {
        setCurrentMarket(detected);
      }
    } catch (error) {
      console.error('Erreur détection marché:', error);
      // Fallback sur France
      const fallback = getMarketByID('france');
      setDetectedMarket(fallback);
      if (!currentMarket) {
        setCurrentMarket(fallback);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const detectMarketFromIP = async (): Promise<MarketConfig | null> => {
    try {
      // Dans un vrai environnement, utilisez un service comme ipapi.co
      // const response = await fetch('https://ipapi.co/json/');
      // const data = await response.json();
      
      // Simulation pour le développement
      const mockCountryCode = 'FR'; // Vous pouvez changer ceci pour tester
      
      const market = MARKET_CONFIGS.find(m => 
        m.countries.includes(mockCountryCode)
      );
      
      return market || getMarketByID('france');
    } catch (error) {
      return getMarketByID('france');
    }
  };

  const getMarketByID = useCallback((marketId: string): MarketConfig | null => {
    return MARKET_CONFIGS.find(m => m.id === marketId) || null;
  }, []);

  const getMarketByCountry = useCallback((countryCode: string): MarketConfig | null => {
    return MARKET_CONFIGS.find(m => 
      m.countries.includes(countryCode.toUpperCase())
    ) || null;
  }, []);

  const getAllMarkets = useCallback((): MarketConfig[] => {
    return MARKET_CONFIGS;
  }, []);

  const getMarketsByRegion = useCallback((region: string): MarketConfig[] => {
    return MARKET_CONFIGS.filter(m => m.region === region);
  }, []);

  const selectMarket = useCallback((marketId: string) => {
    const market = getMarketByID(marketId);
    if (market) {
      setCurrentMarket(market);
      
      // Stocker la préférence
      localStorage.setItem('casskai_market', marketId);
      
      // Appliquer la configuration du marché
      applyMarketConfiguration(market);
    }
  }, [getMarketByID]);

  const applyMarketConfiguration = (market: MarketConfig) => {
    // Configuration de la langue
    document.documentElement.lang = market.language;
    
    // Configuration du titre
    document.title = `Casskai - ${market.name}`;
    
    // Stocker les informations du marché pour les autres composants
    (window as any).CASSKAI_MARKET = market;
  };

  // Fonctions utilitaires
  const isEuropeanMarket = useCallback((): boolean => {
    return currentMarket?.region === 'europe';
  }, [currentMarket]);

  const isAfricanMarket = useCallback((): boolean => {
    return currentMarket?.region === 'africa';
  }, [currentMarket]);

  const isSYSCOHADAMarket = useCallback((): boolean => {
    return currentMarket?.accountingStandard === 'SYSCOHADA';
  }, [currentMarket]);

  const isCFAMarket = useCallback((): boolean => {
    return ['XOF', 'XAF'].includes(currentMarket?.defaultCurrency || '');
  }, [currentMarket]);

  const getCurrentVATRate = useCallback((): number => {
    return currentMarket?.taxSystem.vatRate || 0;
  }, [currentMarket]);

  const getMarketPricing = useCallback(() => {
    return currentMarket?.pricing || null;
  }, [currentMarket]);

  const getBankingOptions = useCallback((): string[] => {
    return currentMarket?.features.bankingIntegration || [];
  }, [currentMarket]);

  const getPaymentMethods = useCallback((): string[] => {
    return currentMarket?.features.paymentMethods || [];
  }, [currentMarket]);

  const validateTaxNumber = useCallback((taxNumber: string): boolean => {
    if (!currentMarket || !taxNumber) return false;

    const patterns: { [key: string]: RegExp } = {
      'france': /^FR[0-9A-Z]{2}[0-9]{9}$/,
      'belgium': /^BE[0-9]{10}$/,
      'benin': /^BJ[0-9]{13}$/,
      'ivory_coast': /^CI[0-9]{13}$/,
      'canada': /^[0-9]{9}RT[0-9]{4}$/
    };

    const pattern = patterns[currentMarket.id];
    return pattern ? pattern.test(taxNumber) : true;
  }, [currentMarket]);

  return {
    // État
    currentMarket,
    detectedMarket,
    isLoading,

    // Actions
    selectMarket,
    detectMarket,

    // Données
    getAllMarkets,
    getMarketsByRegion,
    getMarketByID,
    getMarketByCountry,

    // Informations du marché actuel
    isEuropeanMarket,
    isAfricanMarket,
    isSYSCOHADAMarket,
    isCFAMarket,
    getCurrentVATRate,
    getMarketPricing,
    getBankingOptions,
    getPaymentMethods,

    // Validation
    validateTaxNumber
  };
}
