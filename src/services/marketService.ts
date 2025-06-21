// services/marketService.ts
export class MarketService {
  private static instance: MarketService;
  private currentMarket: MarketConfig | null = null;

  static getInstance(): MarketService {
    if (!MarketService.instance) {
      MarketService.instance = new MarketService();
    }
    return MarketService.instance;
  }

  detectMarketFromCountry(countryCode: string): MarketConfig | null {
    return MARKET_CONFIGS.find(market => 
      market.countries.includes(countryCode.toUpperCase())
    ) || null;
  }

  detectMarketFromIP(): Promise<MarketConfig | null> {
    // Utiliser un service de géolocalisation IP
    return fetch('https://ipapi.co/json/')
      .then(response => response.json())
      .then(data => this.detectMarketFromCountry(data.country_code))
      .catch(() => MARKET_CONFIGS.find(m => m.id === 'france')); // Fallback France
  }

  setCurrentMarket(marketId: string): boolean {
    const market = MARKET_CONFIGS.find(m => m.id === marketId);
    if (market) {
      this.currentMarket = market;
      this.applyMarketConfiguration(market);
      return true;
    }
    return false;
  }

  getCurrentMarket(): MarketConfig | null {
    return this.currentMarket;
  }

  getAvailableMarkets(): MarketConfig[] {
    return MARKET_CONFIGS;
  }

  getMarketsByRegion(region: 'europe' | 'africa' | 'americas'): MarketConfig[] {
    return MARKET_CONFIGS.filter(market => market.region === region);
  }

  private applyMarketConfiguration(market: MarketConfig): void {
    // 1. Configurer la devise par défaut
    const currencyService = require('./currencyService').CurrencyService.getInstance();
    // currencyService.setDefaultCurrency(market.defaultCurrency);

    // 2. Configurer le plan comptable
    const accountingService = require('./accountingService').AccountingService.getInstance();
    if (market.accountingStandard === 'SYSCOHADA') {
      const { SYSCOHADA_PLAN } = require('../data/syscohada');
      accountingService.setAccountPlan(SYSCOHADA_PLAN);
    } else if (market.accountingStandard === 'PCG') {
      const { PCG_PLAN } = require('../data/pcg');
      accountingService.setAccountPlan(PCG_PLAN);
    }

    // 3. Configurer la localisation
    this.applyLocalization(market.localization);

    // 4. Stocker les préférences du marché
    localStorage.setItem('casskai_market', market.id);
  }

  private applyLocalization(localization: MarketLocalization): void {
    // Configuration des formats de date et nombre
    document.documentElement.lang = localization.language;
    
    // Configuration du fuseau horaire
    // Peut être utilisé par les bibliothèques de date
    (window as any).CASSKAI_TIMEZONE = localization.timezone;
  }

  getMarketPricing(marketId: string): MarketPricing | null {
    const market = MARKET_CONFIGS.find(m => m.id === marketId);
    return market?.pricing || null;
  }

  calculateLocalizedPrice(basePrice: number, fromMarket: string, toMarket: string): number {
    const fromMarketConfig = MARKET_CONFIGS.find(m => m.id === fromMarket);
    const toMarketConfig = MARKET_CONFIGS.find(m => m.id === toMarket);
    
    if (!fromMarketConfig || !toMarketConfig) return basePrice;

    // Conversion de devise (simplifiée)
    const currencyRates: { [key: string]: number } = {
      'EUR': 1,
      'XOF': 655.957, // Taux fixe EUR/XOF
      'CAD': 1.47,
      'USD': 1.08
    };

    const fromRate = currencyRates[fromMarketConfig.defaultCurrency] || 1;
    const toRate = currencyRates[toMarketConfig.defaultCurrency] || 1;

    const convertedPrice = (basePrice / fromRate) * toRate;

    // Ajustement selon le pouvoir d'achat local
    const purchasingPowerAdjustment: { [key: string]: number } = {
      'france': 1,
      'belgium': 0.95,
      'benin': 0.3,
      'ivory_coast': 0.35,
      'canada': 1.1
    };

    const adjustment = purchasingPowerAdjustment[toMarket] || 1;
    return Math.round(convertedPrice * adjustment);
  }

  getComplianceRequirements(marketId: string): string[] {
    const market = MARKET_CONFIGS.find(m => m.id === marketId);
    return market?.features.compliance || [];
  }

  getBankingOptions(marketId: string): string[] {
    const market = MARKET_CONFIGS.find(m => m.id === marketId);
    return market?.features.bankingIntegration || [];
  }

  validateTaxNumber(taxNumber: string, marketId: string): boolean {
    const market = MARKET_CONFIGS.find(m => m.id === marketId);
    if (!market) return false;

    const patterns: { [key: string]: RegExp } = {
      'france': /^FR[0-9A-Z]{2}[0-9]{9}$/,
      'belgium': /^BE[0-9]{10}$/,
      'benin': /^BJ[0-9]{13}$/,
      'ivory_coast': /^CI[0-9]{13}$/,
      'canada': /^[0-9]{9}RT[0-9]{4}$/
    };

    const pattern = patterns[marketId];
    return pattern ? pattern.test(taxNumber) : true;
  }
}
