// services/currencyService.ts
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  format: 'before' | 'after'; // Position du symbole
  separator: {
    thousands: string;
    decimal: string;
  };
  countries: string[];
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: Date;
}

export const AFRICAN_CURRENCIES: Currency[] = [
  {
    code: 'XOF',
    name: 'Franc CFA BCEAO',
    symbol: 'F CFA',
    decimals: 0,
    format: 'after',
    separator: { thousands: ' ', decimal: ',' },
    countries: ['BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG']
  },
  {
    code: 'XAF',
    name: 'Franc CFA BEAC',
    symbol: 'F CFA',
    decimals: 0,
    format: 'after',
    separator: { thousands: ' ', decimal: ',' },
    countries: ['CM', 'CF', 'TD', 'CG', 'GQ', 'GA']
  },
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
  }
];

export const GLOBAL_CURRENCIES: Currency[] = [
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    decimals: 2,
    format: 'after',
    separator: { thousands: ' ', decimal: ',' },
    countries: ['FR', 'DE', 'ES', 'IT']
  },
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
  }
];

export class CurrencyService {
  private static instance: CurrencyService;
  private currencies: Map<string, Currency> = new Map();
  private exchangeRates: Map<string, ExchangeRate> = new Map();

  constructor() {
    // Charger toutes les devises
    [...AFRICAN_CURRENCIES, ...GLOBAL_CURRENCIES].forEach(currency => {
      this.currencies.set(currency.code, currency);
    });
  }

  static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService();
    }
    return CurrencyService.instance;
  }

  getCurrency(code: string): Currency | undefined {
    return this.currencies.get(code);
  }

  getAllCurrencies(): Currency[] {
    return Array.from(this.currencies.values());
  }

  getAfricanCurrencies(): Currency[] {
    return AFRICAN_CURRENCIES;
  }

  formatAmount(amount: number, currencyCode: string): string {
    const currency = this.getCurrency(currencyCode);
    if (!currency) return amount.toString();

    const formattedNumber = this.formatNumber(amount, currency);
    
    return currency.format === 'before' 
      ? `${currency.symbol}${formattedNumber}`
      : `${formattedNumber} ${currency.symbol}`;
  }

  private formatNumber(amount: number, currency: Currency): string {
    const rounded = Math.round(amount * Math.pow(10, currency.decimals)) / Math.pow(10, currency.decimals);
    const parts = rounded.toFixed(currency.decimals).split('.');
    
    // Formater les milliers
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currency.separator.thousands);
    
    if (currency.decimals > 0 && parts[1]) {
      return parts.join(currency.separator.decimal);
    }
    
    return parts[0];
  }

  async updateExchangeRates(): Promise<void> {
    try {
      // API pour les taux de change (ex: exchangerate-api.com)
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
      const data = await response.json();
      
      Object.entries(data.rates).forEach(([currency, rate]) => {
        this.exchangeRates.set(`EUR-${currency}`, {
          from: 'EUR',
          to: currency as string,
          rate: rate as number,
          lastUpdated: new Date()
        });
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des taux:', error);
    }
  }

  convertAmount(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return amount;
    
    const rateKey = `${fromCurrency}-${toCurrency}`;
    const rate = this.exchangeRates.get(rateKey);
    
    if (rate) {
      return amount * rate.rate;
    }
    
    // Conversion via EUR si pas de taux direct
    const eurFromRate = this.exchangeRates.get(`EUR-${fromCurrency}`);
    const eurToRate = this.exchangeRates.get(`EUR-${toCurrency}`);
    
    if (eurFromRate && eurToRate) {
      const eurAmount = amount / eurFromRate.rate;
      return eurAmount * eurToRate.rate;
    }
    
    return amount; // Fallback
  }
}

// hooks/useCurrency.ts
import { useState, useEffect } from 'react';

export function useCurrency(defaultCurrency = 'XOF') {
  const [currentCurrency, setCurrentCurrency] = useState(defaultCurrency);
  const [currencyService] = useState(() => CurrencyService.getInstance());

  useEffect(() => {
    // Mettre à jour les taux de change au chargement
    currencyService.updateExchangeRates();
  }, [currencyService]);

  const formatAmount = (amount: number, currency?: string) => {
    return currencyService.formatAmount(amount, currency || currentCurrency);
  };

  const convertAmount = (amount: number, fromCurrency: string, toCurrency?: string) => {
    return currencyService.convertAmount(amount, fromCurrency, toCurrency || currentCurrency);
  };

  return {
    currentCurrency,
    setCurrentCurrency,
    formatAmount,
    convertAmount,
    currencies: currencyService.getAllCurrencies(),
    africanCurrencies: currencyService.getAfricanCurrencies()
  };
}
