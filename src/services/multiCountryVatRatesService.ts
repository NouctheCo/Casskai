/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 *
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 *
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

/**
 * Service de gestion des taux TVA multi-pays
 *
 * Supporte:
 * - France (PCG) : 20%, 10%, 5.5%, 2.1%
 * - OHADA (SYSCOHADA) : 18% général (17 pays)
 * - Maghreb (SCF) : 19-20%
 * - Europe : BE, LU, CH, etc.
 * - IFRS : pays anglophones (VAT/GST variables)
 *
 * @module multiCountryVatRatesService
 * @priority P0 - Compliance critique pour marchés OHADA
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { AccountingStandard, SYSCOHADA_COUNTRIES, SCF_COUNTRIES } from './accountingStandardAdapter';

// ============================================================================
// TYPES
// ============================================================================

export interface VATRateConfig {
  country: string;           // Code ISO pays (CI, FR, DZ, etc.)
  countryName: string;       // Nom du pays
  currency: string;          // Devise (XOF, EUR, DZD, etc.)
  standard: AccountingStandard;
  rates: {
    normal: number;          // Taux normal
    reduced?: number;        // Taux réduit (optionnel)
    super_reduced?: number;  // Taux super réduit (optionnel)
    special?: number;        // Taux spécial (optionnel)
    zero: number;            // Taux zéro (0%)
  };
  accountPrefix: string;     // Préfixe compte TVA (44571 pour PCG, etc.)
  labels: {
    normal: string;
    reduced?: string;
    super_reduced?: string;
    special?: string;
  };
}

// ============================================================================
// CONFIGURATION TAUX TVA PAR PAYS
// ============================================================================

/**
 * Taux TVA par pays - Base de données exhaustive
 */
export const COUNTRY_VAT_RATES: Record<string, VATRateConfig> = {
  // ==========================
  // FRANCE (PCG)
  // ==========================
  FR: {
    country: 'FR',
    countryName: 'France',
    currency: 'EUR',
    standard: 'PCG',
    rates: {
      normal: 20.0,
      reduced: 10.0,
      super_reduced: 5.5,
      special: 2.1,
      zero: 0.0,
    },
    accountPrefix: '44571',
    labels: {
      normal: 'TVA normale 20%',
      reduced: 'TVA réduite 10%',
      super_reduced: 'TVA réduite 5,5%',
      special: 'TVA particulière 2,1%',
    },
  },

  // ==========================
  // PAYS OHADA (SYSCOHADA) - 17 pays Zone FCFA
  // ==========================

  // Côte d'Ivoire
  CI: {
    country: 'CI',
    countryName: 'Côte d\'Ivoire',
    currency: 'XOF',
    standard: 'SYSCOHADA',
    rates: {
      normal: 18.0,
      zero: 0.0,
    },
    accountPrefix: '4431', // SYSCOHADA : 4431 TVA facturée
    labels: {
      normal: 'TVA 18%',
    },
  },

  // Sénégal
  SN: {
    country: 'SN',
    countryName: 'Sénégal',
    currency: 'XOF',
    standard: 'SYSCOHADA',
    rates: {
      normal: 18.0,
      zero: 0.0,
    },
    accountPrefix: '4431',
    labels: {
      normal: 'TVA 18%',
    },
  },

  // Mali
  ML: {
    country: 'ML',
    countryName: 'Mali',
    currency: 'XOF',
    standard: 'SYSCOHADA',
    rates: {
      normal: 18.0,
      zero: 0.0,
    },
    accountPrefix: '4431',
    labels: {
      normal: 'TVA 18%',
    },
  },

  // Burkina Faso
  BF: {
    country: 'BF',
    countryName: 'Burkina Faso',
    currency: 'XOF',
    standard: 'SYSCOHADA',
    rates: {
      normal: 18.0,
      zero: 0.0,
    },
    accountPrefix: '4431',
    labels: {
      normal: 'TVA 18%',
    },
  },

  // Bénin
  BJ: {
    country: 'BJ',
    countryName: 'Bénin',
    currency: 'XOF',
    standard: 'SYSCOHADA',
    rates: {
      normal: 18.0,
      zero: 0.0,
    },
    accountPrefix: '4431',
    labels: {
      normal: 'TVA 18%',
    },
  },

  // Togo
  TG: {
    country: 'TG',
    countryName: 'Togo',
    currency: 'XOF',
    standard: 'SYSCOHADA',
    rates: {
      normal: 18.0,
      zero: 0.0,
    },
    accountPrefix: '4431',
    labels: {
      normal: 'TVA 18%',
    },
  },

  // Niger
  NE: {
    country: 'NE',
    countryName: 'Niger',
    currency: 'XOF',
    standard: 'SYSCOHADA',
    rates: {
      normal: 19.0,
      zero: 0.0,
    },
    accountPrefix: '4431',
    labels: {
      normal: 'TVA 19%',
    },
  },

  // Guinée-Bissau
  GW: {
    country: 'GW',
    countryName: 'Guinée-Bissau',
    currency: 'XOF',
    standard: 'SYSCOHADA',
    rates: {
      normal: 15.0,
      zero: 0.0,
    },
    accountPrefix: '4431',
    labels: {
      normal: 'TVA 15%',
    },
  },

  // Cameroun
  CM: {
    country: 'CM',
    countryName: 'Cameroun',
    currency: 'XAF',
    standard: 'SYSCOHADA',
    rates: {
      normal: 19.25,
      zero: 0.0,
    },
    accountPrefix: '4431',
    labels: {
      normal: 'TVA 19,25%',
    },
  },

  // République Centrafricaine
  CF: {
    country: 'CF',
    countryName: 'République Centrafricaine',
    currency: 'XAF',
    standard: 'SYSCOHADA',
    rates: {
      normal: 19.0,
      zero: 0.0,
    },
    accountPrefix: '4431',
    labels: {
      normal: 'TVA 19%',
    },
  },

  // Tchad
  TD: {
    country: 'TD',
    countryName: 'Tchad',
    currency: 'XAF',
    standard: 'SYSCOHADA',
    rates: {
      normal: 18.0,
      zero: 0.0,
    },
    accountPrefix: '4431',
    labels: {
      normal: 'TVA 18%',
    },
  },

  // Congo-Brazzaville
  CG: {
    country: 'CG',
    countryName: 'Congo-Brazzaville',
    currency: 'XAF',
    standard: 'SYSCOHADA',
    rates: {
      normal: 18.0,
      zero: 0.0,
    },
    accountPrefix: '4431',
    labels: {
      normal: 'TVA 18%',
    },
  },

  // Gabon
  GA: {
    country: 'GA',
    countryName: 'Gabon',
    currency: 'XAF',
    standard: 'SYSCOHADA',
    rates: {
      normal: 18.0,
      zero: 0.0,
    },
    accountPrefix: '4431',
    labels: {
      normal: 'TVA 18%',
    },
  },

  // Guinée équatoriale
  GQ: {
    country: 'GQ',
    countryName: 'Guinée équatoriale',
    currency: 'XAF',
    standard: 'SYSCOHADA',
    rates: {
      normal: 15.0,
      zero: 0.0,
    },
    accountPrefix: '4431',
    labels: {
      normal: 'TVA 15%',
    },
  },

  // Guinée
  GN: {
    country: 'GN',
    countryName: 'Guinée',
    currency: 'GNF',
    standard: 'SYSCOHADA',
    rates: {
      normal: 18.0,
      zero: 0.0,
    },
    accountPrefix: '4431',
    labels: {
      normal: 'TVA 18%',
    },
  },

  // RD Congo
  CD: {
    country: 'CD',
    countryName: 'RD Congo',
    currency: 'CDF',
    standard: 'SYSCOHADA',
    rates: {
      normal: 16.0,
      zero: 0.0,
    },
    accountPrefix: '4431',
    labels: {
      normal: 'TVA 16%',
    },
  },

  // Comores
  KM: {
    country: 'KM',
    countryName: 'Comores',
    currency: 'KMF',
    standard: 'SYSCOHADA',
    rates: {
      normal: 10.0,
      zero: 0.0,
    },
    accountPrefix: '4431',
    labels: {
      normal: 'TVA 10%',
    },
  },

  // ==========================
  // MAGHREB (SCF)
  // ==========================

  // Algérie
  DZ: {
    country: 'DZ',
    countryName: 'Algérie',
    currency: 'DZD',
    standard: 'SCF',
    rates: {
      normal: 19.0,
      reduced: 9.0,
      zero: 0.0,
    },
    accountPrefix: '4456', // SCF Algérie
    labels: {
      normal: 'TVA 19%',
      reduced: 'TVA réduite 9%',
    },
  },

  // Maroc
  MA: {
    country: 'MA',
    countryName: 'Maroc',
    currency: 'MAD',
    standard: 'SCF',
    rates: {
      normal: 20.0,
      reduced: 14.0,
      super_reduced: 10.0,
      special: 7.0,
      zero: 0.0,
    },
    accountPrefix: '4456',
    labels: {
      normal: 'TVA 20%',
      reduced: 'TVA réduite 14%',
      super_reduced: 'TVA réduite 10%',
      special: 'TVA particulière 7%',
    },
  },

  // Tunisie
  TN: {
    country: 'TN',
    countryName: 'Tunisie',
    currency: 'TND',
    standard: 'SCF',
    rates: {
      normal: 19.0,
      reduced: 13.0,
      super_reduced: 7.0,
      zero: 0.0,
    },
    accountPrefix: '4456',
    labels: {
      normal: 'TVA 19%',
      reduced: 'TVA réduite 13%',
      super_reduced: 'TVA réduite 7%',
    },
  },

  // ==========================
  // EUROPE (PCG/IFRS)
  // ==========================

  // Belgique
  BE: {
    country: 'BE',
    countryName: 'Belgique',
    currency: 'EUR',
    standard: 'PCG',
    rates: {
      normal: 21.0,
      reduced: 12.0,
      super_reduced: 6.0,
      zero: 0.0,
    },
    accountPrefix: '44571',
    labels: {
      normal: 'TVA 21%',
      reduced: 'TVA réduite 12%',
      super_reduced: 'TVA réduite 6%',
    },
  },

  // Luxembourg
  LU: {
    country: 'LU',
    countryName: 'Luxembourg',
    currency: 'EUR',
    standard: 'PCG',
    rates: {
      normal: 17.0,
      reduced: 14.0,
      super_reduced: 8.0,
      special: 3.0,
      zero: 0.0,
    },
    accountPrefix: '44571',
    labels: {
      normal: 'TVA 17%',
      reduced: 'TVA réduite 14%',
      super_reduced: 'TVA réduite 8%',
      special: 'TVA particulière 3%',
    },
  },

  // Suisse
  CH: {
    country: 'CH',
    countryName: 'Suisse',
    currency: 'CHF',
    standard: 'IFRS',
    rates: {
      normal: 7.7,
      reduced: 2.5,
      special: 3.7,
      zero: 0.0,
    },
    accountPrefix: '2200', // Suisse IFRS
    labels: {
      normal: 'TVA 7,7%',
      reduced: 'TVA réduite 2,5%',
      special: 'TVA spéciale 3,7%',
    },
  },
};

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Obtenir configuration TVA pour un pays
 */
export function getVATRatesForCountry(countryCode: string): VATRateConfig | null {
  const config = COUNTRY_VAT_RATES[countryCode.toUpperCase()];
  if (!config) {
    logger.warn('MultiCountryVAT', `Taux TVA non définis pour pays: ${countryCode}`);
    return null;
  }
  return config;
}

/**
 * Obtenir configuration TVA depuis company settings
 */
export async function getCompanyVATRates(companyId: string): Promise<VATRateConfig> {
  try {
    // Récupérer pays de l'entreprise
    const { data: company, error } = await supabase
      .from('companies')
      .select('country, accounting_standard')
      .eq('id', companyId)
      .single();

    if (error || !company) {
      logger.error('MultiCountryVAT', 'Impossible de récupérer paramètres entreprise', error);
      // Défaut: France
      return COUNTRY_VAT_RATES.FR;
    }

    const countryCode = company.country || 'FR';
    const config = getVATRatesForCountry(countryCode);

    if (!config) {
      logger.warn('MultiCountryVAT', `Pays ${countryCode} non supporté, défaut France`);
      return COUNTRY_VAT_RATES.FR;
    }

    return config;
  } catch (error) {
    logger.error('MultiCountryVAT', 'Erreur getCompanyVATRates:', error);
    return COUNTRY_VAT_RATES.FR;
  }
}

/**
 * Obtenir taux normal pour un pays
 */
export function getNormalVATRate(countryCode: string): number {
  const config = getVATRatesForCountry(countryCode);
  return config?.rates.normal || 20.0; // Défaut 20% (France)
}

/**
 * Obtenir tous les taux disponibles pour un pays
 */
export function getAvailableVATRates(countryCode: string): Array<{ rate: number; label: string }> {
  const config = getVATRatesForCountry(countryCode);
  if (!config) return [{ rate: 20.0, label: 'TVA 20%' }];

  const rates: Array<{ rate: number; label: string }> = [];

  if (config.rates.normal) {
    rates.push({ rate: config.rates.normal, label: config.labels.normal });
  }
  if (config.rates.reduced) {
    rates.push({ rate: config.rates.reduced, label: config.labels.reduced || `TVA ${config.rates.reduced}%` });
  }
  if (config.rates.super_reduced) {
    rates.push({ rate: config.rates.super_reduced, label: config.labels.super_reduced || `TVA ${config.rates.super_reduced}%` });
  }
  if (config.rates.special) {
    rates.push({ rate: config.rates.special, label: config.labels.special || `TVA ${config.rates.special}%` });
  }
  rates.push({ rate: 0.0, label: 'Exonéré 0%' });

  return rates;
}

/**
 * Vérifier si un pays utilise SYSCOHADA
 */
export function isSYSCOHADACountry(countryCode: string): boolean {
  return SYSCOHADA_COUNTRIES.includes(countryCode.toUpperCase());
}

/**
 * Vérifier si un pays utilise SCF
 */
export function isSCFCountry(countryCode: string): boolean {
  return SCF_COUNTRIES.includes(countryCode.toUpperCase());
}

/**
 * Obtenir compte TVA pour un taux donné
 */
export function getVATAccountForRate(
  countryCode: string,
  rate: number,
  type: 'collected' | 'deductible'
): string {
  const config = getVATRatesForCountry(countryCode);
  if (!config) return type === 'collected' ? '44571' : '44566';

  const prefix = config.accountPrefix;

  // SYSCOHADA: 4431 (facturée) / 4432 (récupérable)
  if (isSYSCOHADACountry(countryCode)) {
    return type === 'collected' ? '4431' : '4432';
  }

  // PCG France/Europe: 44571 (collectée) / 44566 (déductible)
  // Suffixe par taux: -20, -10, -055, -021
  const suffix = rate === 0 ? '-0' :
                 rate === 20 ? '-20' :
                 rate === 10 ? '-10' :
                 rate === 5.5 ? '-055' :
                 rate === 2.1 ? '-021' :
                 rate === 18 ? '-18' :
                 rate === 19 ? '-19' :
                 `-${Math.round(rate * 10)}`;

  return type === 'collected' ? `${prefix}${suffix}` : `44566${suffix}`;
}

/**
 * Export singleton instance
 */
export const multiCountryVatRatesService = {
  getVATRatesForCountry,
  getCompanyVATRates,
  getNormalVATRate,
  getAvailableVATRates,
  isSYSCOHADACountry,
  isSCFCountry,
  getVATAccountForRate,
  COUNTRY_VAT_RATES,
};
