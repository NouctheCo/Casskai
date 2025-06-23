// src/services/currencyService.ts - VERSION FINALE

import ConfigService from './configService';

// Types principaux (fusion de votre interface existante + nouvelles fonctionnalités)
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
  // Nouveaux champs pour la compatibilité
  decimal_places?: number; // Alias pour decimals
  is_active?: boolean;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: Date;
  // Nouveaux champs pour la base de données
  id?: string;
  date?: string;
  source?: string;
  is_fixed?: boolean;
  created_at?: string;
}

export interface CurrencyConversion {
  from: string;
  to: string;
  amount: number;
  convertedAmount: number;
  rate: number;
  date: string;
}

// Devises africaines (votre liste existante + améliorations)
export const AFRICAN_CURRENCIES: Currency[] = [
  {
    code: 'XOF',
    name: 'Franc CFA BCEAO',
    symbol: 'F CFA',
    decimals: 0,
    format: 'after',
    separator: { thousands: ' ', decimal: ',' },
    countries: ['BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG'],
    decimal_places: 0,
    is_active: true
  },
  {
    code: 'XAF',
    name: 'Franc CFA BEAC',
    symbol: 'F CFA',
    decimals: 0,
    format: 'after',
    separator: { thousands: ' ', decimal: ',' },
    countries: ['CM', 'CF', 'TD', 'CG', 'GQ', 'GA'],
    decimal_places: 0,
    is_active: true
  },
  {
    code: 'NGN',
    name: 'Naira Nigérian',
    symbol: '₦',
    decimals: 2,
    format: 'before',
    separator: { thousands: ',', decimal: '.' },
    countries: ['NG'],
    decimal_places: 2,
    is_active: true
  },
  {
    code: 'GHS',
    name: 'Cedi Ghanéen',
    symbol: '₵',
    decimals: 2,
    format: 'before',
    separator: { thousands: ',', decimal: '.' },
    countries: ['GH'],
    decimal_places: 2,
    is_active: true
  },
  {
    code: 'MAD',
    name: 'Dirham Marocain',
    symbol: 'MAD',
    decimals: 2,
    format: 'after',
    separator: { thousands: ' ', decimal: ',' },
    countries: ['MA'],
    decimal_places: 2,
    is_active: true
  },
  {
    code: 'TND',
    name: 'Dinar Tunisien',
    symbol: 'TND',
    decimals: 3,
    format: 'after',
    separator: { thousands: ' ', decimal: ',' },
    countries: ['TN'],
    decimal_places: 3,
    is_active: true
  }
];

// Devises globales (votre liste existante + améliorations)
export const GLOBAL_CURRENCIES: Currency[] = [
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    decimals: 2,
    format: 'after',
    separator: { thousands: ' ', decimal: ',' },
    countries: ['FR', 'DE', 'ES', 'IT', 'BE', 'NL', 'AT', 'PT'],
    decimal_places: 2,
    is_active: true
  },
  {
    code: 'USD',
    name: 'Dollar Américain',
    symbol: '$',
    decimals: 2,
    format: 'before',
    separator: { thousands: ',', decimal: '.' },
    countries: ['US'],
    decimal_places: 2,
    is_active: true
  },
  {
    code: 'CAD',
    name: 'Dollar Canadien',
    symbol: 'CA$',
    decimals: 2,
    format: 'before',
    separator: { thousands: ',', decimal: '.' },
    countries: ['CA'],
    decimal_places: 2,
    is_active: true
  },
  {
    code: 'GBP',
    name: 'Livre Sterling',
    symbol: '£',
    decimals: 2,
    format: 'before',
    separator: { thousands: ',', decimal: '.' },
    countries: ['GB'],
    decimal_places: 2,
    is_active: true
  },
  {
    code: 'CHF',
    name: 'Franc Suisse',
    symbol: 'CHF',
    decimals: 2,
    format: 'after',
    separator: { thousands: "'", decimal: '.' },
    countries: ['CH'],
    decimal_places: 2,
    is_active: true
  }
];

// Tous les devises supportées
export const ALL_CURRENCIES = [...AFRICAN_CURRENCIES, ...GLOBAL_CURRENCIES];

export class CurrencyService {
  private static instance: CurrencyService;
  private currencies: Map<string, Currency> = new Map();
  private exchangeRates: Map<string, ExchangeRate> = new Map();
  private configService = ConfigService.getInstance();
  private lastUpdate: Date | null = null;

  // Providers d'APIs de taux de change
  private exchangeProviders = [
    {
      name: 'ExchangeRate-API',
      url: 'https://api.exchangerate-api.com/v4/latest/',
      priority: 1,
      isActive: true
    },
    {
      name: 'Fixer.io',
      url: 'https://api.fixer.io/latest',
      priority: 2,
      isActive: true
    }
  ];

  constructor() {
    this.initializeCurrencies();
    this.initializeFixedRates();
  }

  static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService();
    }
    return CurrencyService.instance;
  }

  private initializeCurrencies(): void {
    // Charger toutes les devises (votre logique existante + nouvelles)
    ALL_CURRENCIES.forEach(currency => {
      this.currencies.set(currency.code, currency);
    });
  }

  private initializeFixedRates(): void {
    // Taux fixes (XOF/EUR, XAF/EUR, etc.)
    const fixedRates = [
      {
        from: 'XOF',
        to: 'EUR',
        rate: 0.001524, // 1 XOF = 0.001524 EUR
        lastUpdated: new Date(),
        source: 'BCEAO_FIXED',
        is_fixed: true
      },
      {
        from: 'EUR',
        to: 'XOF',
        rate: 655.957, // 1 EUR = 655.957 XOF
        lastUpdated: new Date(),
        source: 'BCEAO_FIXED',
        is_fixed: true
      },
      {
        from: 'XAF',
        to: 'EUR',
        rate: 0.001524, // 1 XAF = 0.001524 EUR
        lastUpdated: new Date(),
        source: 'BEAC_FIXED',
        is_fixed: true
      },
      {
        from: 'EUR',
        to: 'XAF',
        rate: 655.957, // 1 EUR = 655.957 XAF
        lastUpdated: new Date(),
        source: 'BEAC_FIXED',
        is_fixed: true
      }
    ];

    fixedRates.forEach(rate => {
      const key = `${rate.from}-${rate.to}`;
      this.exchangeRates.set(key, rate);
    });
  }

  // Méthodes de votre service existant (conservées)
  getCurrency(code: string): Currency | undefined {
    return this.currencies.get(code);
  }

  getAllCurrencies(): Currency[] {
    return Array.from(this.currencies.values());
  }

  getAfricanCurrencies(): Currency[] {
    return AFRICAN_CURRENCIES;
  }

  getGlobalCurrencies(): Currency[] {
    return GLOBAL_CURRENCIES;
  }

  // Votre méthode formatAmount existante (améliorée)
  formatAmount(amount: number, currencyCode: string, locale?: string): string {
    const currency = this.getCurrency(currencyCode);
    if (!currency) return amount.toString();

    const formattedNumber = this.formatNumber(amount, currency);
    
    return currency.format === 'before' 
      ? `${currency.symbol}${formattedNumber}`
      : `${formattedNumber} ${currency.symbol}`;
  }

  // Votre méthode formatNumber existante (conservée)
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

  // Nouvelle méthode de conversion améliorée
  async convertAmount(amount: number, fromCurrency: string, toCurrency?: string): Promise<CurrencyConversion> {
    const targetCurrency = toCurrency || this.getBaseCurrency();
    
    // Cas simple : même devise
    if (fromCurrency === targetCurrency) {
      return {
        from: fromCurrency,
        to: targetCurrency,
        amount,
        convertedAmount: amount,
        rate: 1,
        date: new Date().toISOString().split('T')[0]
      };
    }

    // Obtenir le taux de change
    const rate = await this.getExchangeRate(fromCurrency, targetCurrency);
    const convertedAmount = this.roundAmount(amount * rate, targetCurrency);

    return {
      from: fromCurrency,
      to: targetCurrency,
      amount,
      convertedAmount,
      rate,
      date: new Date().toISOString().split('T')[0]
    };
  }

  // Méthode de conversion synchrone (votre logique existante améliorée)
  convertAmountSync(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return amount;
    
    // Vérifier les taux en cache
    const rateKey = `${fromCurrency}-${toCurrency}`;
    const directRate = this.exchangeRates.get(rateKey);
    
    if (directRate) {
      return this.roundAmount(amount * directRate.rate, toCurrency);
    }
    
    // Taux inverse
    const inverseKey = `${toCurrency}-${fromCurrency}`;
    const inverseRate = this.exchangeRates.get(inverseKey);
    
    if (inverseRate) {
      return this.roundAmount(amount / inverseRate.rate, toCurrency);
    }
    
    // Conversion via EUR (votre logique existante)
    const eurFromRate = this.exchangeRates.get(`EUR-${fromCurrency}`);
    const eurToRate = this.exchangeRates.get(`EUR-${toCurrency}`);
    
    if (eurFromRate && eurToRate) {
      const eurAmount = amount / eurFromRate.rate;
      return this.roundAmount(eurAmount * eurToRate.rate, toCurrency);
    }
    
    return amount; // Fallback
  }

  // Obtenir un taux de change (avec cache et APIs)
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    const key = `${fromCurrency}-${toCurrency}`;
    
    // Vérifier le cache local
    const cachedRate = this.exchangeRates.get(key);
    if (cachedRate && this.isRateValid(cachedRate)) {
      return cachedRate.rate;
    }

    // Vérifier le taux inverse
    const inverseKey = `${toCurrency}-${fromCurrency}`;
    const inverseRate = this.exchangeRates.get(inverseKey);
    if (inverseRate && this.isRateValid(inverseRate)) {
      const rate = 1 / inverseRate.rate;
      this.exchangeRates.set(key, {
        from: fromCurrency,
        to: toCurrency,
        rate,
        lastUpdated: new Date()
      });
      return rate;
    }

    // Récupérer depuis les APIs externes
    try {
      const newRate = await this.fetchExchangeRateFromAPI(fromCurrency, toCurrency);
      this.exchangeRates.set(key, newRate);
      
      // Sauvegarder en base si possible
      try {
        await this.saveExchangeRateToDB(newRate);
      } catch (error) {
        console.warn('Impossible de sauvegarder en DB:', error);
      }
      
      return newRate.rate;
    } catch (error) {
      console.error('Impossible de récupérer le taux de change:', error);
      throw new Error(`Taux de change indisponible pour ${fromCurrency}/${toCurrency}`);
    }
  }

  // Votre méthode updateExchangeRates existante (améliorée)
  async updateExchangeRates(): Promise<void> {
    try {
      console.log('🔄 Mise à jour des taux de change...');
      
      for (const provider of this.exchangeProviders.filter(p => p.isActive)) {
        try {
          await this.updateFromProvider(provider);
          break; // Succès avec ce provider, pas besoin des autres
        } catch (error) {
          console.warn(`Erreur avec ${provider.name}:`, error);
          continue;
        }
      }
      
      this.lastUpdate = new Date();
      console.log('✅ Taux de change mis à jour');
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des taux:', error);
    }
  }

  private async updateFromProvider(provider: any): Promise<void> {
    const response = await fetch(`${provider.url}EUR`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    Object.entries(data.rates).forEach(([currency, rate]) => {
      const key = `EUR-${currency}`;
      this.exchangeRates.set(key, {
        from: 'EUR',
        to: currency as string,
        rate: rate as number,
        lastUpdated: new Date(),
        source: provider.name
      });
    });
  }

  private async fetchExchangeRateFromAPI(fromCurrency: string, toCurrency: string): Promise<ExchangeRate> {
    // Utiliser EUR comme devise pivot si nécessaire
    if (fromCurrency !== 'EUR' && toCurrency !== 'EUR') {
      const eurFromRate = await this.getExchangeRate('EUR', fromCurrency);
      const eurToRate = await this.getExchangeRate('EUR', toCurrency);
      const rate = eurToRate / eurFromRate;
      
      return {
        from: fromCurrency,
        to: toCurrency,
        rate,
        lastUpdated: new Date(),
        source: 'CALCULATED_VIA_EUR'
      };
    }

    // Requête directe pour les taux avec EUR
    const baseCurrency = fromCurrency === 'EUR' ? fromCurrency : toCurrency;
    const targetCurrency = fromCurrency === 'EUR' ? toCurrency : fromCurrency;
    
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    let rate = data.rates[targetCurrency];
    
    if (!rate) {
      throw new Error(`Taux non trouvé pour ${targetCurrency}`);
    }

    // Inverser le taux si nécessaire
    if (fromCurrency !== baseCurrency) {
      rate = 1 / rate;
    }

    return {
      from: fromCurrency,
      to: toCurrency,
      rate,
      lastUpdated: new Date(),
      source: 'ExchangeRate-API'
    };
  }

  private isRateValid(rate: ExchangeRate): boolean {
    const now = new Date();
    const rateAge = now.getTime() - rate.lastUpdated.getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 heures
    
    // Les taux fixes sont toujours valides
    if (rate.source?.includes('FIXED')) {
      return true;
    }
    
    return rateAge < maxAge;
  }

  private async saveExchangeRateToDB(rate: ExchangeRate): Promise<void> {
    try {
      const client = this.configService.getSupabaseClient();
      const { error } = await client
        .from('exchange_rates')
        .insert([{
          from_currency: rate.from,
          to_currency: rate.to,
          rate: rate.rate,
          date: new Date().toISOString().split('T')[0],
          source: rate.source || 'API',
          is_fixed: rate.source?.includes('FIXED') || false,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.warn('Erreur sauvegarde taux:', error);
      }
    } catch (error) {
      // Ignorer les erreurs de DB si pas de configuration
    }
  }

  private roundAmount(amount: number, currencyCode: string): number {
    const currency = this.getCurrency(currencyCode);
    const decimals = currency?.decimals || 2;
    return Math.round(amount * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  private getBaseCurrency(): string {
    try {
      const config = this.configService.getConfig();
      return config?.company?.currency || 'EUR';
    } catch {
      return 'EUR';
    }
  }

  // Nouvelles méthodes utilitaires
  needsConversion(fromCurrency: string, toCurrency?: string): boolean {
    const targetCurrency = toCurrency || this.getBaseCurrency();
    return fromCurrency !== targetCurrency;
  }

  getSupportedCurrencies(): Currency[] {
    return this.getAllCurrencies();
  }

  async refreshAllRates(): Promise<void> {
    await this.updateExchangeRates();
  }

  getLastUpdate(): Date | null {
    return this.lastUpdate;
  }

  // Conversion en lot
  async convertBatch(conversions: Array<{
    amount: number;
    from: string;
    to: string;
  }>): Promise<CurrencyConversion[]> {
    const promises = conversions.map(conv => 
      this.convertAmount(conv.amount, conv.from, conv.to)
    );
    
    return Promise.all(promises);
  }
}
