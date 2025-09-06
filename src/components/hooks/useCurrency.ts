// Hook pour la gestion des devises
import { useState, useEffect } from 'react';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export const useCurrency = () => {
  const [currency, setCurrency] = useState<Currency>({
    code: 'EUR',
    name: 'Euro',
    symbol: '€'
  });
  const [baseCurrency, setBaseCurrency] = useState<Currency>(currency);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currencyOptions] = useState<Currency[]>([
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'USD', name: 'Dollar', symbol: '$' },
    { code: 'GBP', name: 'Pound', symbol: '£' }
  ]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.code
    }).format(amount);
  };

  const formatAmountWithConversion = (amount: number, currency: Currency) => {
    return formatAmount(amount);
  };

  const convertAmount = (amount: number, from: string, to: string) => {
    return amount;
  };

  const getExchangeRate = (from: string, to: string) => {
    return 1;
  };

  const refreshRates = () => {
    setIsLoading(false);
  };

  return {
    currency,
    setCurrency,
    baseCurrency,
    currencyOptions,
    formatAmount,
    formatAmountWithConversion,
    convertAmount,
    getExchangeRate,
    refreshRates,
    isLoading,
    error
  };
};

export const useCurrencySelector = () => {
  return useCurrency();
};