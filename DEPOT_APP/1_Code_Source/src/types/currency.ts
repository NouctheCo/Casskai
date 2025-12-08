// src/types/currency.ts

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
  source?: string;
}

export interface CurrencyConversion {
  fromCurrency: string;
  toCurrency: string;
  originalAmount: number;
  convertedAmount: number;
  rate: number;
  timestamp: Date;
}

export interface CurrencyFormatOptions {
  showSymbol?: boolean;
  showCode?: boolean;
  precision?: number;
  locale?: string;
}

// Devises prédéfinies
export type SupportedCurrency = 
  | 'EUR'  // Euro
  | 'USD'  // Dollar américain
  | 'CAD'  // Dollar canadien
  | 'CHF'  // Franc suisse
  | 'GBP'  // Livre sterling
  | 'XOF'  // Franc CFA BCEAO (Afrique de l'Ouest)
  | 'XAF'  // Franc CFA BEAC (Afrique Centrale)
  | 'MAD'  // Dirham marocain
  | 'TND'  // Dinar tunisien
  | 'NGN'  // Naira nigérian
  | 'GHS'  // Cedi ghanéen
  | 'KES'  // Shilling kényan
  | 'ZAR'; // Rand sud-africain

export interface CurrencyRegion {
  region: string;
  name: string;
  currencies: Currency[];
  defaultCurrency: string;
}

export interface MonetaryAmount {
  amount: number;
  currency: string;
  formatted?: string;
}
