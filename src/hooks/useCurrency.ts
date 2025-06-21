// src/hooks/useCurrency.ts
import { useState, useEffect, useCallback } from 'react';
import type { Currency, ExchangeRate, CurrencyFormatOptions, MonetaryAmount } from '../types/currency';

// Données des devises (vous pourrez les déplacer dans un fichier séparé plus tard)
const CURRENCIES: Currency[] = [
  // Devises européennes
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    decimals: 2,
    format: 'after',
    separator: { thousands: ' ', decimal: ',' },
    countries: ['FR', 'DE', 'ES', 'IT', 'BE', 'NL', 'AT', 'IE', 'PT', 'FI']
  },
  {
    code: 'CHF',
    name: 'Franc Suisse',
    symbol: 'CHF',
    decimals: 2,
    format: 'after',
    separator: { thousands: "'", decimal: '.' },
    countries: ['CH']
  },
  {
    code: 'GBP',
    name: 'Livre Sterling',
    symbol: '£',
    decimals: 2,
    format: 'before',
    separator: { thousands: ',', decimal: '.' },
    countries: ['GB']
  },

  // Devises américaines
  {
    code: 'USD',
    name: 'Dollar Américain',
    symbol: '$',
    decimals: 2,
    format: 'before',
    separator: { thousands: ',', decimal: '.' },
    countries: ['US']
  },
  {
    code: 'CAD',
    name: 'Dollar Canadien',
    symbol: 'CA$',
    decimals: 2,
    format: 'before',
    separator: { thousands: ',', decimal: '.' },
    countries: ['CA']
  },

  // Devises africaines - UEMOA (Union Économique et Monétaire Ouest Africaine)
  {
    code: 'XOF',
    name: 'Franc CFA BCEAO',
    symbol: 'F CFA',
    decimals: 0,
    format: 'after',
    separator: { thousands: ' ', decimal: ',' },
    countries: ['BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG']
  },
  
  // Devises africaines - CEMAC (Communauté Économique et Monétaire d'Afrique Centrale)
  {
    code: 'XAF',
    name: 'Franc CFA BEAC',
    symbol: 'F CFA',
    decimals: 0,
    format: 'after',
    separator: { thousands: ' ', decimal: ',' },
    countries: ['CM', 'CF', 'TD', 'CG', 'GQ', 'GA']
  },

  // Autres devises africaines
  {
    code: 'NGN',
    name: 'Naira Nigérian',
    symbol: '₦',
    decimals: 2,
    format: 'before',
    separator: { thousands: ',', decimal: '.' },
    countries: ['NG']
  },
  {
    code: 'GHS',
    name: 'Cedi Ghanéen',
    symbol: '₵',
    decimals: 2,
    format: 'before',
    separator: { thousands: ',', decimal: '.' },
    countries: ['GH']
  },
  {
    code: 'MAD',
    name: 'Dirham Marocain',
    symbol: 'DH',
    decimals: 2,
    format: 'after',
    separator: { thousands: ' ', decimal: ',' },
    countries: ['MA']
  },
  {
    code: 'TND',
    name: 'Dinar Tunisien',
    symbol: 'DT',
    decimals: 3,
    format: 'after',
    separator: { thousands: ' ', decimal: ',' },
    countries: ['TN']
  }
];

export function useCurrency(defaultCurrency: string = 'EUR') {
  const [currentCurrency, setCurrentCurrency] = useState<string>(defaultCurrency);
  const [exchangeRates, setExchangeRates] = useState<Map<string, ExchangeRate>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Charger les taux de change au démarrage
  useEffect(() => {
    loadExchangeRates();
  }, []);

  const loadExchangeRates = async () => {
    setIsLoading(true);
    try {
      // Dans un vrai environnement, vous utiliseriez une API comme :
      // - exchangerate-api.com
      // - fixer.io
      // - openexchangerates.org
      
      // Pour l'instant, simulation avec des taux fixes
      const mockRates = new Map<string, ExchangeRate>([
        // Taux fixes EUR comme base
        ['EUR-USD', { from: 'EUR', to: 'USD', rate: 1.08, lastUpdated: new Date() }],
        ['EUR-CAD', { from: 'EUR', to: 'CAD', rate: 1.47, lastUpdated: new Date() }],
        ['EUR-CHF', { from: 'EUR', to: 'CHF', rate: 0.97, lastUpdated: new Date() }],
        ['EUR-GBP', { from: 'EUR', to: 'GBP', rate: 0.86, lastUpdated: new Date() }],
        
        // Taux fixes CFA (taux officiel fixe)
        ['EUR-XOF', { from: 'EUR', to: 'XOF', rate: 655.957, lastUpdated: new Date() }],
        ['EUR-XAF', { from: 'EUR', to: 'XAF', rate: 655.957, lastUpdated: new Date() }],
        
        // Autres devises africaines (approximatifs)
        ['EUR-NGN', { from: 'EUR', to: 'NGN', rate: 850, lastUpdated: new Date() }],
        ['EUR-GHS', { from: 'EUR', to: 'GHS', rate: 13, lastUpdated: new Date() }],
        ['EUR-MAD', { from: 'EUR', to: 'MAD', rate: 11, lastUpdated: new Date() }],
        ['EUR-TND', { from: 'EUR', to: 'TND', rate: 3.3, lastUpdated: new Date() }],
      ]);

      setExchangeRates(mockRates);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erreur lors du chargement des taux de change:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrency = useCallback((code: string): Currency | undefined => {
    return CURRENCIES.find(c => c.code === code);
  }, []);

  const getAllCurrencies = useCallback((): Currency[] => {
    return CURRENCIES;
  }, []);

  const getCurrenciesByRegion = useCallback((countries: string[]): Currency[] => {
    return CURRENCIES.filter(currency => 
      currency.countries.some(country => countries.includes(country))
    );
  }, []);

  const formatAmount = useCallback((
    amount: number, 
    currencyCode?: string, 
    options?: CurrencyFormatOptions
  ): string => {
    const currency = getCurrency(currencyCode || currentCurrency);
    if (!currency) return amount.toString();

    const precision = options?.precision ?? currency.decimals;
    const showSymbol = options?.showSymbol ?? true;
    const showCode = options?.showCode ?? false;

    // Arrondir selon la précision de la devise
    const rounded = Math.round(amount * Math.pow(10, precision)) / Math.pow(10, precision);
    
    // Formater le nombre
    const parts = rounded.toFixed(precision).split('.');
    
    // Ajouter les séparateurs de milliers
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currency.separator.thousands);
    
    // Rejoindre avec le séparateur décimal
    let formatted = precision > 0 && parts[1] ? 
      parts.join(currency.separator.decimal) : 
      parts[0];

    // Ajouter le symbole/code
    if (showSymbol) {
      formatted = currency.format === 'before' 
        ? `${currency.symbol}${formatted}`
        : `${formatted} ${currency.symbol}`;
    }

    if (showCode) {
      formatted += ` ${currency.code}`;
    }

    return formatted;
  }, [currentCurrency, getCurrency]);

  const convertAmount = useCallback((
    amount: number,
    fromCurrency: string,
    toCurrency?: string
  ): number => {
    const targetCurrency = toCurrency || currentCurrency;
    
    if (fromCurrency === targetCurrency) {
      return amount;
    }

    // Chercher le taux direct
    const directRate = exchangeRates.get(`${fromCurrency}-${targetCurrency}`);
    if (directRate) {
      return amount * directRate.rate;
    }

    // Chercher le taux inverse
    const inverseRate = exchangeRates.get(`${targetCurrency}-${fromCurrency}`);
    if (inverseRate) {
      return amount / inverseRate.rate;
    }

    // Conversion via EUR comme devise pivot
    const fromEurRate = exchangeRates.get(`EUR-${fromCurrency}`);
    const toEurRate = exchangeRates.get(`EUR-${targetCurrency}`);
    
    if (fromEurRate && toEurRate) {
      const eurAmount = amount / fromEurRate.rate;
      return eurAmount * toEurRate.rate;
    }

    console.warn(`Taux de change non trouvé pour ${fromCurrency} -> ${targetCurrency}`);
    return amount; // Fallback
  }, [currentCurrency, exchangeRates]);

  const createMonetaryAmount = useCallback((
    amount: number,
    currencyCode?: string
  ): MonetaryAmount => {
    const currency = currencyCode || currentCurrency;
    return {
      amount,
      currency,
      formatted: formatAmount(amount, currency)
    };
  }, [currentCurrency, formatAmount]);

  const getExchangeRate = useCallback((
    fromCurrency: string,
    toCurrency: string
  ): ExchangeRate | null => {
    const key = `${fromCurrency}-${toCurrency}`;
    return exchangeRates.get(key) || null;
  }, [exchangeRates]);

  // Devises spécialisées
  const getAfricanCurrencies = useCallback((): Currency[] => {
    return CURRENCIES.filter(currency => 
      ['XOF', 'XAF', 'NGN', 'GHS', 'MAD', 'TND'].includes(currency.code)
    );
  }, []);

  const getEuropeanCurrencies = useCallback((): Currency[] => {
    return CURRENCIES.filter(currency => 
      ['EUR', 'CHF', 'GBP'].includes(currency.code)
    );
  }, []);

  const isCFAFranc = useCallback((currencyCode: string): boolean => {
    return ['XOF', 'XAF'].includes(currencyCode);
  }, []);

  return {
    // État
    currentCurrency,
    setCurrentCurrency,
    isLoading,
    lastUpdate,

    // Données
    getAllCurrencies,
    getCurrency,
    getCurrenciesByRegion,
    getAfricanCurrencies,
    getEuropeanCurrencies,

    // Formatage
    formatAmount,
    createMonetaryAmount,

    // Conversion
    convertAmount,
    getExchangeRate,

    // Utilitaires
    isCFAFranc,
    
    // Actions
    refreshRates: loadExchangeRates
  };
}
