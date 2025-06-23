// src/hooks/useCurrency.ts - VERSION FINALE

import { useState, useEffect, useCallback } from 'react';
import { CurrencyService, Currency, CurrencyConversion, ExchangeRate } from '../services/currencyService';
import { useConfig } from './useConfig';

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
  // État de base (compatible avec votre hook existant)
  const [currentCurrency, setCurrentCurrency] = useState(defaultCurrency);
  const [currencyService] = useState(() => CurrencyService.getInstance());
  
  // État étendu
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { getCompanyConfig } = useConfig();

  // Obtenir la devise de base de l'entreprise
  const baseCurrency = getCompanyConfig()?.currency || currentCurrency;

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
        console.warn('Impossible de mettre à jour les taux:', err);
        // Ne pas bloquer l'application si les taux ne peuvent pas être mis à jour
      } finally {
        setIsLoading(false);
      }
    };

    initializeRates();
  }, [currencyService]);

  // Méthode formatAmount (compatible avec votre version existante)
  const formatAmount = useCallback((amount: number, currency?: string): string => {
    try {
      return currencyService.formatAmount(amount, currency || currentCurrency);
    } catch (err) {
      console.warn('Erreur formatage montant:', err);
      return amount.toString();
    }
  }, [currencyService, currentCurrency]);

  // Méthode convertAmount asynchrone (nouvelle)
  const convertAmount = useCallback(async (
    amount: number, 
    fromCurrency: string, 
    toCurrency?: string
  ): Promise<CurrencyConversion> => {
    const targetCurrency = toCurrency || baseCurrency;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const conversion = await currencyService.convertAmount(amount, fromCurrency, targetCurrency);
      return conversion;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de conversion';
      setError(errorMessage);
      throw err;
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
  const getExchangeRateHistory = useCallback(async (
    from: string, 
    to: string, 
    days: number = 30
  ): Promise<ExchangeRate[]> => {
    try {
      // Cette méthode nécessite une base de données
      // Pour l'instant, retourner un tableau vide
      return [];
    } catch (err) {
      console.warn('Historique des taux non disponible:', err);
      return [];
    }
  }, []);

  // Rafraîchir tous les taux
  const refreshRates = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await currencyService.refreshAllRates();
      setLastUpdate(currencyService.getLastUpdate());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur rafraîchissement taux';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currencyService]);

  // Méthodes utilitaires
  const getCurrency = useCallback((code: string): Currency | undefined => {
    return currencyService.getCurrency(code);
  }, [currencyService]);

  const needsConversion = useCallback((from: string, to?: string): boolean => {
    return currencyService.needsConversion(from, to);
  }, [currencyService]);

  const getSupportedCurrencies = useCallback((): Currency[] => {
    return currencyService.getSupportedCurrencies();
  }, [currencyService]);

  const getGlobalCurrencies = useCallback((): Currency[] => {
    return currencyService.getGlobalCurrencies();
  }, [currencyService]);

  // Propriétés dérivées (compatibles avec votre hook existant)
  const currencies = currencyService.getAllCurrencies();
  const africanCurrencies = currencyService.getAfricanCurrencies();

  return {
    // État de base (compatible)
    currentCurrency,
    setCurrentCurrency,
    currencies,
    africanCurrencies,

    // État étendu
    isLoading,
    error,
    lastUpdate,

    // Méthodes de formatage (compatibles)
    formatAmount,

    // Méthodes de conversion (étendues)
    convertAmount,
    convertAmountSync,
    convertBatch,

    // Nouvelles méthodes
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

// Hook spécialisé pour l'affichage de montants (nouveau)
export const useAmountDisplay = () => {
  const { formatAmount, formatAmountWithConversion, convertAmount, currentCurrency } = useCurrency();

  const AmountDisplay = ({ 
    amount, 
    currency, 
    showConverted = false, 
    className = '' 
  }: {
    amount: number;
    currency: string;
    showConverted?: boolean;
    className?: string;
  }) => {
    const [convertedAmount, setConvertedAmount] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      if (showConverted && currency !== currentCurrency) {
        setIsLoading(true);
        formatAmountWithConversion(amount, currency)
          .then(setConvertedAmount)
          .finally(() => setIsLoading(false));
      }
    }, [amount, currency, showConverted]);

    const originalAmount = formatAmount(amount, currency);

    if (showConverted && convertedAmount && currency !== currentCurrency) {
      return (
        <span className={className}>
          <span className="font-medium">{originalAmount}</span>
          {isLoading ? (
            <span className="text-sm text-gray-500 ml-2">
              <span className="animate-spin">⟳</span>
            </span>
          ) : (
            <span className="text-sm text-gray-500 ml-2">
              (≈ {convertedAmount})
            </span>
          )}
        </span>
      );
    }

    return <span className={className}>{originalAmount}</span>;
  };

  return {
    AmountDisplay,
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
    popularRates: Array<{ from: string; to: string; rate: number }>;
  }>({
    totalCurrencies: 0,
    africanCurrencies: 0,
    globalCurrencies: 0,
    popularRates: []
  });

  useEffect(() => {
    const african = currencies.filter(c => 
      ['XOF', 'XAF', 'NGN', 'GHS', 'MAD', 'TND'].includes(c.code)
    );
    const global = currencies.filter(c => 
      ['EUR', 'USD', 'GBP', 'CAD', 'CHF'].includes(c.code)
    );

    setStats({
      totalCurrencies: currencies.length,
      africanCurrencies: african.length,
      globalCurrencies: global.length,
      popularRates: []
    });
  }, [currencies]);

  const getPopularRates = useCallback(async () => {
    try {
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
            return { ...pair, rate };
          } catch {
            return { ...pair, rate: 0 };
          }
        })
      );

      setStats(prev => ({ ...prev, popularRates: rates }));
    } catch (error) {
      console.warn('Impossible de récupérer les taux populaires:', error);
    }
  }, [getExchangeRate]);

  return {
    stats,
    getPopularRates
  };
};

// Export du hook principal avec rétrocompatibilité
export default useCurrency;

// Types pour la compatibilité
export type { Currency, CurrencyConversion, ExchangeRate } from '../services/currencyService';
