/**
 * CassKai - Currency Registry
 * Point unique d'accès pour TOUTES les opérations de devises
 * Unifie: currencyService, exchangeRateService, pricingMultiCurrency
 * 
 * RAISON: Éviter la duplication et les incohérences de taux
 */

import { CurrencyService } from './currencyService';
import { exchangeRateService } from './exchangeRateService';
import type { CurrencyCode } from '@/hooks/useCompanyCurrency';
import { logger } from '@/lib/logger';

export class CurrencyRegistry {
  private static instance: CurrencyRegistry;
  private currencyService = CurrencyService.getInstance();

  private constructor() {}

  static getInstance(): CurrencyRegistry {
    if (!CurrencyRegistry.instance) {
      CurrencyRegistry.instance = new CurrencyRegistry();
    }
    return CurrencyRegistry.instance;
  }

  /**
   * Convertir une montant d'une devise à une autre
   * UTILISE: currencyService en priorité (taux live via API)
   * FALLBACK: exchangeRateService si currencyService échoue
   */
  async convertAmount(
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode
  ): Promise<number> {
    try {
      // Priorité 1: currencyService (live rates + cache)
      const conversion = await this.currencyService.convertAmount(amount, fromCurrency, toCurrency);
      return conversion.convertedAmount || amount;
    } catch (error) {
      logger.warn('CurrencyRegistry', 'currencyService fallback, using exchangeRateService', error);
      
      // Priorité 2: exchangeRateService (DB cache)
      try {
        const rate = await exchangeRateService.getExchangeRate(fromCurrency, toCurrency);
        return amount * rate;
      } catch (fallbackError) {
        logger.error('CurrencyRegistry', 'All conversion attempts failed', fallbackError);
        // Fallback ultime: retourner le montant unchanged
        return amount;
      }
    }
  }

  /**
   * Obtenir un taux de change
   * UTILISE: currencyService (live API avec cache)
   */
  async getExchangeRate(fromCurrency: CurrencyCode, toCurrency: CurrencyCode): Promise<number> {
    try {
      return await this.currencyService.getExchangeRate(fromCurrency, toCurrency);
    } catch (error) {
      logger.warn('CurrencyRegistry', 'getExchangeRate fallback', error);
      
      // Fallback: exchangeRateService
      return await exchangeRateService.getExchangeRate(fromCurrency, toCurrency);
    }
  }

  /**
   * Convertir un prix EUR vers une devise cible
   * Utile pour les prix de pricing/landing page
   */
  async convertPriceFromEUR(priceEUR: number, targetCurrency: CurrencyCode): Promise<number> {
    return this.convertAmount(priceEUR, 'EUR' as CurrencyCode, targetCurrency);
  }

  /**
   * Obtenir tous les taux de change supportés
   */
  getSupportedCurrencies() {
    return this.currencyService.getSupportedCurrencies();
  }

  /**
   * Enregistrer une conversion historique
   * UTILISE: exchangeRateService (pour l'audit et les gains/pertes)
   */
  async recordConversion(
    companyId: string,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    fromAmount: number,
    toAmount: number,
    reference?: string
  ): Promise<void> {
    try {
      const rate = fromAmount > 0 ? toAmount / fromAmount : 1;
      await exchangeRateService.recordConversion(
        companyId,
        fromCurrency,
        toCurrency,
        fromAmount,
        toAmount,
        rate,
        reference
      );
    } catch (error) {
      logger.error('CurrencyRegistry', 'Failed to record conversion', error);
      // Non-blocking - conversion réussit même si enregistrement échoue
    }
  }

  /**
   * Calculer les gains/pertes de change
   * UTILISE: exchangeRateService (qui a l'historique)
   */
  async calculateCurrencyGainLoss(companyId: string, fiscalYear: number) {
    try {
      return await exchangeRateService.calculateCurrencyGainLoss(companyId, fiscalYear);
    } catch (error) {
      logger.error('CurrencyRegistry', 'Failed to calculate currency gain/loss', error);
      return [];
    }
  }

  /**
   * Obtenir l'historique des conversions
   * UTILISE: exchangeRateService
   */
  async getConversionHistory(companyId: string, filters?: { fromCurrency?: CurrencyCode; toCurrency?: CurrencyCode; startDate?: string; endDate?: string }) {
    try {
      return await exchangeRateService.getConversionHistory(companyId, filters);
    } catch (error) {
      logger.error('CurrencyRegistry', 'Failed to get conversion history', error);
      return [];
    }
  }
}

export const currencyRegistry = CurrencyRegistry.getInstance();
