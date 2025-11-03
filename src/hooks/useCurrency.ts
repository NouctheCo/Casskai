// src/hooks/useCurrency.ts - VERSION FINALE

import { useState, useEffect, useCallback } from 'react';
import { CurrencyService, Currency, CurrencyConversion, ExchangeRate } from '../services/currencyService';
import { useConfigContext } from '@/contexts/ConfigContext';

// Types d'erreurs spécifiques
export class CurrencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CurrencyError';
  }
}

export class ConversionError extends CurrencyError {
  constructor(
    message: string,
    public readonly fromCurrency: string,
    public readonly toCurrency: string,
    public readonly amount?: number
  ) {
    super(message);
    this.name = 'ConversionError';
  }
}

export class RateUpdateError extends CurrencyError {
  constructor(message: string, public readonly timestamp: Date) {
    super(message);
    this.name = 'RateUpdateError';
  }
}

// Types pour la validation
export type CurrencyCode = string;
export type AmountValue = number;

export interface CurrencyValidationRules {
  minAmount: number;
  maxAmount: number;
  allowedDecimals: number;
}

export interface CurrencyWithValidation extends Currency {
  validationRules: CurrencyValidationRules;
}

// Fonction de validation des montants
const validateAmount = (
  amount: AmountValue,
  currency: CurrencyWithValidation
): boolean => {
  const { validationRules } = currency;
  
  if (amount < validationRules.minAmount || amount > validationRules.maxAmount) {
    return false;
  }

  const decimalPlaces = (amount.toString().split('.')[1] || '').length;
  return decimalPlaces <= validationRules.allowedDecimals;
};

interface UseCurrencyReturn {
  // État de base (compatible avec votre hook existant)
  currentCurrency: string;
  setCurrentCurrency: (currency: string) => void;
  currencies: Currency[];
  africanCurrencies: Currency[];
  
  // État étendu
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;

  // Méthodes de formatage (compatibles avec votre hook existant)
  formatAmount: (amount: number, currency?: string) => string;
  
  // Méthodes de conversion (étendues)
  convertAmount: (amount: number, fromCurrency: string, toCurrency?: string) => Promise<CurrencyConversion>;
  convertAmountSync: (amount: number, fromCurrency: string, toCurrency?: string) => number;
  convertBatch: (conversions: Array<{amount: number; from: string; to: string}>) => Promise<CurrencyConversion[]>;
  
  // Nouvelles méthodes
  formatAmountWithConversion: (amount: number, from: string, to?: string) => Promise<string>;
  getExchangeRate: (from: string, to: string) => Promise<number>;
  getExchangeRateHistory: (from: string, to: string, days?: number) => Promise<ExchangeRate[]>;
  refreshRates: () => Promise<void>;
  getCurrency: (code: string) => Currency | undefined;
  needsConversion: (from: string, to?: string) => boolean;
  getSupportedCurrencies: () => Currency[];
  getGlobalCurrencies: () => Currency[];
}

export function useCurrency(defaultCurrency = 'XOF'): UseCurrencyReturn {
  const [currentCurrency, setCurrentCurrency] = useState(defaultCurrency);
  const [currencyService] = useState(() => CurrencyService.getInstance());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { config } = useConfigContext();

  const baseCurrency = config?.company?.currency || currentCurrency;

  // Méthodes utilitaires
  const getCurrency = useCallback((code: string): Currency | undefined => {
    return currencyService.getCurrency(code);
  }, [currencyService]);

  const validateAmount = useCallback((
    amount: AmountValue,
    currency: CurrencyWithValidation
  ): boolean => {
    const { validationRules } = currency;
    
    if (amount < validationRules.minAmount || amount > validationRules.maxAmount) {
      return false;
    }

    const decimalPlaces = (amount.toString().split('.')[1] || '').length;
    return decimalPlaces <= validationRules.allowedDecimals;
  }, []);

  const formatAmount = useCallback((
    amount: AmountValue, 
    currencyCode?: CurrencyCode
  ): string => {
    try {
      const targetCurrency = currencyCode || currentCurrency;
      const currency = getCurrency(targetCurrency);

      if (!currency) {
        throw new CurrencyError(`Devise non supportée: ${targetCurrency}`);
      }

      if ('validationRules' in currency) {
        const isValid = validateAmount(amount, currency as CurrencyWithValidation);
        if (!isValid) {
          throw new CurrencyError(`Montant invalide pour la devise ${targetCurrency}`);
        }
      }

      return currencyService.formatAmount(amount, targetCurrency);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.warn('Erreur formatage montant:', errorMessage);
      return amount.toString();
    }
  }, [currencyService, currentCurrency, getCurrency, validateAmount]);

  // Mise à jour des taux au chargement (votre logique existante + améliorations)
  useEffect(() => {
    const initializeRates = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Mettre à jour les taux de change
        await currencyService.updateExchangeRates();
        setLastUpdate(currencyService.getLastUpdate());
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.warn('Impossible de mettre à jour les taux:', errorMessage);
        // Ne pas bloquer l'application si les taux ne peuvent pas être mis à jour
      } finally {
        setIsLoading(false);
      }
    };

    initializeRates();
  }, [currencyService]);

  // Méthode convertAmount asynchrone avec meilleure gestion des erreurs
  const convertAmount = useCallback(async (
    amount: number, 
    fromCurrency: string, 
    toCurrency?: string
  ): Promise<CurrencyConversion> => {
    const targetCurrency = toCurrency || baseCurrency;
    
    try {
      setIsLoading(true);
      setError(null);
      
      if (!fromCurrency || !targetCurrency) {
        throw new ConversionError(
          'Devises source ou cible manquantes',
          fromCurrency,
          targetCurrency || '',
          amount
        );
      }

      if (amount < 0) {
        throw new ConversionError(
          'Le montant ne peut pas être négatif',
          fromCurrency,
          targetCurrency,
          amount
        );
      }

      const conversion = await currencyService.convertAmount(amount, fromCurrency, targetCurrency);
      return conversion;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de conversion inconnue';
      setError(errorMessage);
      
      if (err instanceof ConversionError) {
        throw err;
      }
      
      throw new ConversionError(
        errorMessage,
        fromCurrency,
        targetCurrency,
        amount
      );
    } finally {
      setIsLoading(false);
    }
  }, [currencyService, baseCurrency]);

  // Méthode convertAmount synchrone (compatible avec votre version existante)
  const convertAmountSync = useCallback((
    amount: number, 
    fromCurrency: string, 
    toCurrency?: string
  ): number => {
    try {
      return currencyService.convertAmountSync(amount, fromCurrency, toCurrency || baseCurrency);
    } catch (err) {
      console.warn('Erreur conversion synchrone:', err);
      return amount;
    }
  }, [currencyService, baseCurrency]);

  // Conversion en lot
  const convertBatch = useCallback(async (
    conversions: Array<{amount: number; from: string; to: string}>
  ): Promise<CurrencyConversion[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const results = await currencyService.convertBatch(conversions);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de conversion batch';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currencyService]);

  // Formatage avec conversion
  const formatAmountWithConversion = useCallback(async (
    amount: number, 
    from: string, 
    to?: string
  ): Promise<string> => {
    try {
      const conversion = await convertAmount(amount, from, to);
      return formatAmount(conversion.convertedAmount, conversion.to);
    } catch (err) {
      // En cas d'erreur, retourner le montant original
      return formatAmount(amount, from);
    }
  }, [convertAmount, formatAmount]);

  // Obtenir un taux de change
  const getExchangeRate = useCallback(async (from: string, to: string): Promise<number> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const rate = await currencyService.getExchangeRate(from, to);
      return rate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur récupération taux';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currencyService]);

  // Historique des taux (placeholder - à implémenter si base de données disponible)
  const getExchangeRateHistory = useCallback(async (): Promise<ExchangeRate[]> => {
    try {
      return []; // Placeholder pour l'historique des taux
    } catch (err) {
      console.warn('Historique des taux non disponible:', err);
      return [];
    }
  }, []);

  // Rafraîchir tous les taux avec meilleure gestion des erreurs
  const refreshRates = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await currencyService.refreshAllRates();
      const updateTime = new Date();
      setLastUpdate(updateTime);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de rafraîchissement des taux';
      setError(errorMessage);
      throw new RateUpdateError(errorMessage, new Date());
    } finally {
      setIsLoading(false);
    }
  }, [currencyService]);

  // Propriétés dérivées (compatibles avec votre hook existant)
  const currencies = currencyService.getAllCurrencies();
  const africanCurrencies = currencyService.getAfricanCurrencies();

  const needsConversion = useCallback((from: string, to?: string): boolean => {
    return currencyService.needsConversion(from, to);
  }, [currencyService]);

  const getSupportedCurrencies = useCallback((): Currency[] => {
    return currencyService.getSupportedCurrencies();
  }, [currencyService]);

  const getGlobalCurrencies = useCallback((): Currency[] => {
    return currencyService.getGlobalCurrencies();
  }, [currencyService]);

  return {
    currentCurrency,
    setCurrentCurrency,
    currencies: currencyService.getAllCurrencies(),
    africanCurrencies: currencyService.getAfricanCurrencies(),
    isLoading,
    error,
    lastUpdate,
    formatAmount,
    convertAmount,
    convertAmountSync,
    convertBatch,
    formatAmountWithConversion,
    getExchangeRate,
    getExchangeRateHistory,
    refreshRates,
    getCurrency,
    needsConversion,
    getSupportedCurrencies,
    getGlobalCurrencies
  };
}

// Hook spécialisé pour l'affichage de montants
export const useAmountDisplay = () => {
  const { formatAmount, formatAmountWithConversion, convertAmount } = useCurrency();

  return {
    formatAmount,
    formatAmountWithConversion,
    convertAmount
  };
};

// Hook pour la sélection de devise (nouveau)
export const useCurrencySelector = () => {
  const { currencies, currentCurrency, setCurrentCurrency } = useCurrency();
  const [selectedCurrency, setSelectedCurrency] = useState(currentCurrency);

  const currencyOptions = currencies.map(currency => ({
    value: currency.code,
    label: `${currency.code} - ${currency.name}`,
    symbol: currency.symbol,
    format: currency.format
  }));

  // Grouper les devises par région
  const currencyGroups = {
    african: currencies.filter(c => 
      ['XOF', 'XAF', 'NGN', 'GHS', 'MAD', 'TND'].includes(c.code)
    ).map(c => ({
      value: c.code,
      label: `${c.code} - ${c.name}`,
      symbol: c.symbol
    })),
    global: currencies.filter(c => 
      ['EUR', 'USD', 'GBP', 'CAD', 'CHF'].includes(c.code)
    ).map(c => ({
      value: c.code,
      label: `${c.code} - ${c.name}`,
      symbol: c.symbol
    }))
  };

  return {
    currencies,
    currencyOptions,
    currencyGroups,
    selectedCurrency,
    setSelectedCurrency: (currency: string) => {
      setSelectedCurrency(currency);
      setCurrentCurrency(currency);
    },
    currentCurrency
  };
};

// Hook pour les conversions rapides (nouveau)
export const useQuickConverter = () => {
  const { convertAmountSync, convertAmount, formatAmount } = useCurrency();

  const quickConvert = useCallback((
    amount: number, 
    from: string, 
    to: string
  ): string => {
    try {
      const converted = convertAmountSync(amount, from, to);
      return formatAmount(converted, to);
    } catch (error) {
      return formatAmount(amount, from);
    }
  }, [convertAmountSync, formatAmount]);

  const quickConvertAsync = useCallback(async (
    amount: number, 
    from: string, 
    to: string
  ): Promise<string> => {
    try {
      const conversion = await convertAmount(amount, from, to);
      return formatAmount(conversion.convertedAmount, to);
    } catch (error) {
      return formatAmount(amount, from);
    }
  }, [convertAmount, formatAmount]);

  return {
    quickConvert,
    quickConvertAsync
  };
};

// Hook pour les statistiques de devises (nouveau)
export const useCurrencyStats = () => {
  const { currencies, getExchangeRate } = useCurrency();
  const [stats, setStats] = useState<{
    totalCurrencies: number;
    africanCurrencies: number;
    globalCurrencies: number;
    popularRates: Array<{ from: string; to: string; rate: number; timestamp: number }>;
    lastUpdate: number;
  }>({
    totalCurrencies: 0,
    africanCurrencies: 0,
    globalCurrencies: 0,
    popularRates: [],
    lastUpdate: 0
  });

  // Constante pour la durée de validité du cache (15 minutes)
  const CACHE_DURATION = 15 * 60 * 1000;

  useEffect(() => {
    const african = currencies.filter(c => 
      ['XOF', 'XAF', 'NGN', 'GHS', 'MAD', 'TND'].includes(c.code)
    );
    const global = currencies.filter(c => 
      ['EUR', 'USD', 'GBP', 'CAD', 'CHF'].includes(c.code)
    );

    setStats(prev => ({
      ...prev,
      totalCurrencies: currencies.length,
      africanCurrencies: african.length,
      globalCurrencies: global.length
    }));
  }, [currencies]);

  const isCacheValid = useCallback((): boolean => {
    const now = Date.now();
    return (now - stats.lastUpdate) < CACHE_DURATION;
  }, [stats.lastUpdate]);

  const getPopularRates = useCallback(async (forceRefresh = false) => {
    try {
      // Vérifier si le cache est valide
      if (!forceRefresh && isCacheValid() && stats.popularRates.length > 0) {
        return stats.popularRates;
      }

      const popularPairs = [
        { from: 'EUR', to: 'XOF' },
        { from: 'USD', to: 'EUR' },
        { from: 'XOF', to: 'EUR' },
        { from: 'EUR', to: 'XAF' }
      ];

      const rates = await Promise.all(
        popularPairs.map(async (pair) => {
          try {
            const rate = await getExchangeRate(pair.from, pair.to);
            return { 
              ...pair, 
              rate,
              timestamp: Date.now()
            };
          } catch {
            return { 
              ...pair, 
              rate: 0,
              timestamp: Date.now()
            };
          }
        })
      );

      setStats(prev => ({ 
        ...prev, 
        popularRates: rates,
        lastUpdate: Date.now()
      }));

      return rates;
    } catch (error) {
      console.warn('Impossible de récupérer les taux populaires:', error);
      return stats.popularRates;
    }
  }, [getExchangeRate, isCacheValid, stats.popularRates]);

  return {
    stats,
    getPopularRates,
    isCacheValid
  };
};

// Export du hook principal avec rétrocompatibilité
export default useCurrency;

// Types pour la compatibilité
export type { Currency, CurrencyConversion, ExchangeRate } from '../services/currencyService';
export { AmountDisplay } from '../components/currency/AmountDisplay';
