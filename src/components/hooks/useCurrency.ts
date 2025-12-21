// Hook pour la gestion des devises

import { useState } from 'react';



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

  const [baseCurrency, _setBaseCurrency] = useState<Currency>(currency);

  const [isLoading, setIsLoading] = useState(false);

  const [error, _setError] = useState<string | null>(null);

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



  const formatAmountWithConversion = (amount: number, _currency: Currency) => {

    return formatAmount(amount);

  };



  const convertAmount = (amount: number, _from: string, _to: string) => {

    return amount;

  };



  const getExchangeRate = (_from: string, _to: string) => {

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
