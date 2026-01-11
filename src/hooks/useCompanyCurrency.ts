/**
 * CassKai - Hook pour la gestion de la devise de l'entreprise
 * Récupère et formate les montants selon la devise configurée
 */

import { useMemo } from 'react';
import { useEnterprise } from '@/contexts/EnterpriseContext';

export type CurrencyCode = 'EUR' | 'XOF' | 'XAF' | 'USD' | 'MAD' | 'DZD' | 'TND' | 'NGN' | 'KES' | 'GHS' | 'ZAR' | 'EGP';

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
  decimals: number;
  position: 'before' | 'after';
}

// Configuration complète des devises
const CURRENCY_CONFIG: Record<string, CurrencyInfo> = {
  EUR: {
    code: 'EUR',
    symbol: ' EUR',
    name: 'Euro',
    locale: 'fr-FR',
    decimals: 2,
    position: 'after'
  },
  XOF: {
    code: 'XOF',
    symbol: 'FCFA',
    name: 'Franc CFA BCEAO',
    locale: 'fr-SN',
    decimals: 0,
    position: 'after'
  },
  XAF: {
    code: 'XAF',
    symbol: 'FCFA',
    name: 'Franc CFA BEAC',
    locale: 'fr-CM',
    decimals: 0,
    position: 'after'
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'Dollar américain',
    locale: 'en-US',
    decimals: 2,
    position: 'before'
  },
  MAD: {
    code: 'MAD',
    symbol: 'DH',
    name: 'Dirham marocain',
    locale: 'fr-MA',
    decimals: 2,
    position: 'after'
  },
  DZD: {
    code: 'DZD',
    symbol: 'DA',
    name: 'Dinar algérien',
    locale: 'fr-DZ',
    decimals: 2,
    position: 'after'
  },
  TND: {
    code: 'TND',
    symbol: 'DT',
    name: 'Dinar tunisien',
    locale: 'fr-TN',
    decimals: 3,
    position: 'after'
  },
  NGN: {
    code: 'NGN',
    symbol: '₦',
    name: 'Naira nigérian',
    locale: 'en-NG',
    decimals: 2,
    position: 'before'
  },
  KES: {
    code: 'KES',
    symbol: 'KSh',
    name: 'Shilling kenyan',
    locale: 'en-KE',
    decimals: 2,
    position: 'before'
  },
  GHS: {
    code: 'GHS',
    symbol: 'GH₵',
    name: 'Cedi ghanéen',
    locale: 'en-GH',
    decimals: 2,
    position: 'before'
  },
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    name: 'Rand sud-africain',
    locale: 'en-ZA',
    decimals: 2,
    position: 'before'
  },
  EGP: {
    code: 'EGP',
    symbol: 'E£',
    name: 'Livre égyptienne',
    locale: 'ar-EG',
    decimals: 2,
    position: 'before'
  }
};

// Mapping pays -> devise
const COUNTRY_CURRENCY_MAP: Record<string, CurrencyCode> = {
  // Europe
  FR: 'EUR',
  BE: 'EUR',
  LU: 'EUR',

  // OHADA - Zone BCEAO (XOF)
  SN: 'XOF', // Sénégal
  CI: 'XOF', // Côte d'Ivoire
  ML: 'XOF', // Mali
  BF: 'XOF', // Burkina Faso
  NE: 'XOF', // Niger
  TG: 'XOF', // Togo
  BJ: 'XOF', // Bénin
  GW: 'XOF', // Guinée-Bissau

  // OHADA - Zone BEAC (XAF)
  CM: 'XAF', // Cameroun
  GA: 'XAF', // Gabon
  CG: 'XAF', // Congo
  TD: 'XAF', // Tchad
  CF: 'XAF', // Centrafrique
  GQ: 'XAF', // Guinée Équatoriale

  // Autres OHADA
  CD: 'USD', // RD Congo (utilise souvent USD)
  KM: 'EUR', // Comores (Franc comorien lié à EUR)
  GN: 'USD', // Guinée (GNF mais souvent USD)

  // Maghreb
  MA: 'MAD',
  DZ: 'DZD',
  TN: 'TND',

  // Afrique anglophone
  NG: 'NGN',
  KE: 'KES',
  GH: 'GHS',
  ZA: 'ZAR',
  EG: 'EGP'
};

/**
 * Hook principal pour la devise de l'entreprise
 */
export function useCompanyCurrency() {
  const { currentEnterprise } = useEnterprise();

  // Déterminer la devise
  const currencyCode = useMemo(() => {
    // Priorité 1: Devise explicite de l'entreprise
    if (currentEnterprise?.currency) {
      return currentEnterprise.currency as CurrencyCode;
    }

    // Priorité 2: Devise du pays de l'entreprise
    if (currentEnterprise?.countryCode) {
      return COUNTRY_CURRENCY_MAP[currentEnterprise.countryCode] || 'EUR';
    }

    // Par défaut: EUR
    return 'EUR' as CurrencyCode;
  }, [currentEnterprise?.currency, currentEnterprise?.countryCode]);

  // Configuration de la devise
  const currencyInfo = useMemo(() => {
    return CURRENCY_CONFIG[currencyCode] || CURRENCY_CONFIG.EUR;
  }, [currencyCode]);

  /**
   * Formate un montant avec la devise de l'entreprise
   */
  const formatAmount = useMemo(() => {
    return (amount: number | null | undefined, options?: {
      showSymbol?: boolean;
      compact?: boolean;
      decimals?: number;
    }) => {
      const value = amount ?? 0;
      const {
        showSymbol = true,
        compact = false,
        decimals = currencyInfo.decimals
      } = options || {};

      // Formatage du nombre
      let formattedNumber: string;

      if (compact && Math.abs(value) >= 1000000) {
        formattedNumber = (value / 1000000).toFixed(1) + 'M';
      } else if (compact && Math.abs(value) >= 1000) {
        formattedNumber = (value / 1000).toFixed(1) + 'k';
      } else {
        formattedNumber = value.toLocaleString(currencyInfo.locale, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        });
      }

      if (!showSymbol) {
        return formattedNumber;
      }

      // Ajouter le symbole selon la position
      if (currencyInfo.position === 'before') {
        return `${currencyInfo.symbol}${formattedNumber}`;
      } else {
        return `${formattedNumber} ${currencyInfo.symbol}`;
      }
    };
  }, [currencyInfo]);

  /**
   * Retourne juste le symbole de la devise
   */
  const getCurrencySymbol = useMemo(() => {
    return () => currencyInfo.symbol;
  }, [currencyInfo]);

  /**
   * Parse un montant formaté en nombre
   */
  const parseAmount = useMemo(() => {
    return (formattedAmount: string): number => {
      // Retirer le symbole et les espaces
      const cleaned = formattedAmount
        .replace(currencyInfo.symbol, '')
        .replace(/\s/g, '')
        .replace(/,/g, '.');

      return parseFloat(cleaned) || 0;
    };
  }, [currencyInfo]);

  return {
    currencyCode,
    currencyInfo,
    formatAmount,
    getCurrencySymbol,
    parseAmount,
    symbol: currencyInfo.symbol
  };
}

/**
 * Hook utilitaire pour obtenir la devise d'un pays spécifique
 */
export function getCurrencyForCountry(countryCode: string): CurrencyInfo {
  const currencyCode = COUNTRY_CURRENCY_MAP[countryCode] || 'EUR';
  return CURRENCY_CONFIG[currencyCode] || CURRENCY_CONFIG.EUR;
}

/**
 * Fonction utilitaire pour formater un montant (sans hook)
 */
export function formatCurrency(
  amount: number,
  currencyCode: CurrencyCode = 'EUR',
  options?: { showSymbol?: boolean; compact?: boolean }
): string {
  const config = CURRENCY_CONFIG[currencyCode] || CURRENCY_CONFIG.EUR;
  const { showSymbol = true, compact = false } = options || {};

  let formattedNumber: string;

  if (compact && Math.abs(amount) >= 1000000) {
    formattedNumber = (amount / 1000000).toFixed(1) + 'M';
  } else if (compact && Math.abs(amount) >= 1000) {
    formattedNumber = (amount / 1000).toFixed(1) + 'k';
  } else {
    formattedNumber = amount.toLocaleString(config.locale, {
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals
    });
  }

  if (!showSymbol) {
    return formattedNumber;
  }

  if (config.position === 'before') {
    return `${config.symbol}${formattedNumber}`;
  } else {
    return `${formattedNumber} ${config.symbol}`;
  }
}

export default useCompanyCurrency;
