/**
 * CassKai - Service de gestion des taux de change
 * Gère les conversions entre devises avec mise en cache et historique
 */

import { supabase } from '@/lib/supabase';
import { devLogger } from '@/utils/devLogger';
import type { CurrencyCode } from '@/hooks/useCompanyCurrency';

export interface ExchangeRate {
  id: string;
  base_currency: CurrencyCode;
  target_currency: CurrencyCode;
  rate: number;
  date: string;
  source: 'manual' | 'api' | 'ecb' | 'bceao' | 'beac';
  created_at: string;
  updated_at: string;
}

export interface ConversionHistory {
  id: string;
  company_id: string;
  from_currency: CurrencyCode;
  to_currency: CurrencyCode;
  from_amount: number;
  to_amount: number;
  rate: number;
  date: string;
  reference?: string; // Référence transaction/facture
  created_at: string;
}

export interface CurrencyGainLoss {
  id: string;
  company_id: string;
  currency: CurrencyCode;
  realized_gain: number;
  unrealized_gain: number;
  fiscal_year: number;
  created_at: string;
  updated_at: string;
}

class ExchangeRateService {
  private static instance: ExchangeRateService;
  private rateCache: Map<string, { rate: number; timestamp: number }> = new Map();
  private cacheDuration = 3600000; // 1 heure

  private constructor() {}

  static getInstance(): ExchangeRateService {
    if (!ExchangeRateService.instance) {
      ExchangeRateService.instance = new ExchangeRateService();
    }
    return ExchangeRateService.instance;
  }

  /**
   * Obtenir le taux de change entre deux devises
   */
  async getExchangeRate(
    baseCurrency: CurrencyCode,
    targetCurrency: CurrencyCode,
    date?: string
  ): Promise<number> {
    // Même devise = taux 1
    if (baseCurrency === targetCurrency) {
      return 1;
    }

    // Vérifier le cache
    const cacheKey = `${baseCurrency}_${targetCurrency}_${date || 'latest'}`;
    const cached = this.rateCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.rate;
    }

    try {
      // Récupérer depuis la base de données
      const query = supabase
        .from('exchange_rates')
        .select('rate')
        .eq('base_currency', baseCurrency)
        .eq('target_currency', targetCurrency)
        .order('date', { ascending: false })
        .limit(1);

      if (date) {
        query.lte('date', date);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        const rate = data[0].rate;
        this.rateCache.set(cacheKey, { rate, timestamp: Date.now() });
        return rate;
      }

      // Taux par défaut si non trouvé
      devLogger.warn('ExchangeRateService', `Taux non trouvé pour ${baseCurrency}/${targetCurrency}, utilisation des taux fixes`);
      return this.getDefaultRate(baseCurrency, targetCurrency);
    } catch (error) {
      devLogger.error('ExchangeRateService', 'Erreur récupération taux:', error);
      return this.getDefaultRate(baseCurrency, targetCurrency);
    }
  }

  /**
   * Taux de change fixes par défaut (pour démarrage)
   */
  private getDefaultRate(baseCurrency: CurrencyCode, targetCurrency: CurrencyCode): number {
    const rates: Record<string, Record<string, number>> = {
      EUR: {
        XOF: 655.957,
        XAF: 655.957,
        USD: 1.10,
        MAD: 10.80,
        DZD: 147.50,
        TND: 3.40,
        NGN: 890.00,
        KES: 140.00,
        GHS: 13.50,
        ZAR: 20.00,
        EGP: 34.00
      },
      XOF: {
        EUR: 1 / 655.957,
        XAF: 1,
        USD: 1.10 / 655.957
      },
      XAF: {
        EUR: 1 / 655.957,
        XOF: 1,
        USD: 1.10 / 655.957
      },
      USD: {
        EUR: 1 / 1.10,
        XOF: 655.957 / 1.10,
        XAF: 655.957 / 1.10
      }
    };

    return rates[baseCurrency]?.[targetCurrency] || 1;
  }

  /**
   * Convertir un montant d'une devise à une autre
   */
  async convert(
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    date?: string
  ): Promise<{ amount: number; rate: number }> {
    const rate = await this.getExchangeRate(fromCurrency, toCurrency, date);
    const convertedAmount = amount * rate;

    return {
      amount: convertedAmount,
      rate
    };
  }

  /**
   * Enregistrer une conversion dans l'historique
   */
  async recordConversion(
    companyId: string,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    fromAmount: number,
    toAmount: number,
    rate: number,
    reference?: string
  ): Promise<void> {
    try {
      const { error } = await supabase.from('conversion_history').insert({
        company_id: companyId,
        from_currency: fromCurrency,
        to_currency: toCurrency,
        from_amount: fromAmount,
        to_amount: toAmount,
        rate,
        reference,
        date: new Date().toISOString().split('T')[0]
      });

      if (error) throw error;
      devLogger.info('ExchangeRateService', 'Conversion enregistrée:', { fromCurrency, toCurrency, fromAmount, toAmount });
    } catch (error) {
      devLogger.error('ExchangeRateService', 'Erreur enregistrement conversion:', error);
    }
  }

  /**
   * Obtenir l'historique des conversions
   */
  async getConversionHistory(
    companyId: string,
    filters?: {
      fromCurrency?: CurrencyCode;
      toCurrency?: CurrencyCode;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ConversionHistory[]> {
    try {
      let query = supabase
        .from('conversion_history')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (filters?.fromCurrency) {
        query = query.eq('from_currency', filters.fromCurrency);
      }
      if (filters?.toCurrency) {
        query = query.eq('to_currency', filters.toCurrency);
      }
      if (filters?.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('date', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data as ConversionHistory[]) || [];
    } catch (error) {
      devLogger.error('ExchangeRateService', 'Erreur récupération historique:', error);
      return [];
    }
  }

  /**
   * Mettre à jour les taux de change manuellement
   */
  async updateExchangeRate(
    baseCurrency: CurrencyCode,
    targetCurrency: CurrencyCode,
    rate: number,
    date?: string
  ): Promise<void> {
    try {
      const { error } = await supabase.from('exchange_rates').upsert({
        base_currency: baseCurrency,
        target_currency: targetCurrency,
        rate,
        date: date || new Date().toISOString().split('T')[0],
        source: 'manual',
        updated_at: new Date().toISOString()
      });

      if (error) throw error;

      // Invalider le cache
      const cacheKey = `${baseCurrency}_${targetCurrency}_${date || 'latest'}`;
      this.rateCache.delete(cacheKey);

      devLogger.info('ExchangeRateService', 'Taux de change mis à jour:', { baseCurrency, targetCurrency, rate });
    } catch (error) {
      devLogger.error('ExchangeRateService', 'Erreur mise à jour taux:', error);
      throw error;
    }
  }

  /**
   * Calculer les gains/pertes de change réalisés et non réalisés
   */
  async calculateCurrencyGainLoss(
    companyId: string,
    fiscalYear: number
  ): Promise<{ realized: number; unrealized: number }> {
    try {
      // Gains/pertes réalisés = somme des conversions effectuées
      const { data: conversions } = await supabase
        .from('conversion_history')
        .select('from_amount, to_amount, rate')
        .eq('company_id', companyId)
        .gte('date', `${fiscalYear}-01-01`)
        .lte('date', `${fiscalYear}-12-31`);

      let realizedGain = 0;
      if (conversions) {
        conversions.forEach((conv) => {
          const expectedAmount = conv.from_amount * conv.rate;
          const difference = conv.to_amount - expectedAmount;
          realizedGain += difference;
        });
      }

      // Gains/pertes non réalisés = différence entre valeur actuelle et valeur historique des créances/dettes en devises
      // TODO: Implémenter le calcul basé sur les factures en attente en devises étrangères
      const unrealizedGain = 0;

      // Enregistrer dans la base
      await supabase.from('currency_gain_loss').upsert({
        company_id: companyId,
        realized_gain: realizedGain,
        unrealized_gain: unrealizedGain,
        fiscal_year: fiscalYear,
        updated_at: new Date().toISOString()
      });

      return {
        realized: realizedGain,
        unrealized: unrealizedGain
      };
    } catch (error) {
      devLogger.error('ExchangeRateService', 'Erreur calcul gains/pertes:', error);
      return { realized: 0, unrealized: 0 };
    }
  }

  /**
   * Obtenir les gains/pertes de change d'une entreprise
   */
  async getCurrencyGainLoss(companyId: string, fiscalYear?: number): Promise<CurrencyGainLoss[]> {
    try {
      let query = supabase
        .from('currency_gain_loss')
        .select('*')
        .eq('company_id', companyId)
        .order('fiscal_year', { ascending: false });

      if (fiscalYear) {
        query = query.eq('fiscal_year', fiscalYear);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data as CurrencyGainLoss[]) || [];
    } catch (error) {
      devLogger.error('ExchangeRateService', 'Erreur récupération gains/pertes:', error);
      return [];
    }
  }

  /**
   * Vider le cache des taux
   */
  clearCache(): void {
    this.rateCache.clear();
    devLogger.info('ExchangeRateService', 'Cache des taux vidé');
  }
}

export const exchangeRateService = ExchangeRateService.getInstance();
export default exchangeRateService;
