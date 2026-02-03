/**
 * CassKai - Service de Conditions de Paiement Conformes par Devise
 * Gère les conditions légales adaptées à chaque pays/devise
 */

import { logger } from '@/lib/logger';

export interface PaymentTermsCompliance {
  lateFeeTerms: string;
  recoveryFeeTerms: string;
  discountTerms: string;
  countryCode: string;
  currency: string;
}

/**
 * Conditions légales de paiement par devise/pays
 * Sources: Législations locales, normes internationales
 */
const PAYMENT_TERMS_BY_CURRENCY: Record<string, PaymentTermsCompliance> = {
  // ========== ZONE EURO ==========
  EUR: {
    countryCode: 'FR',
    currency: 'EUR',
    // France: Directive 2011/7/UE + Code monétaire et financier
    lateFeeTerms:
      'Pénalités de retard: taux directeur BCE en vigueur + 10 points (minimum légal applicable).',
    recoveryFeeTerms:
      'Indemnité forfaitaire pour frais de recouvrement: 40€ (art. L441-10 CMF).',
    discountTerms: 'Escompte pour paiement anticipé: aucun (0%) sauf stipulation contraire.',
  },

  // ========== AFRIQUE FRANCOPHONE (ZONE FRANC CFA) ==========
  XOF: {
    // Franc CFA BCEAO (Bénin, Burkina Faso, Côte d'Ivoire, Guinée-Bissau, Mali, Niger, Sénégal, Togo)
    countryCode: 'CI', // Côte d'Ivoire (par défaut)
    currency: 'XOF',
    lateFeeTerms:
      'Pénalités de retard: 3% par mois de retard (5% minimum par an selon SYSCOHADA).',
    recoveryFeeTerms:
      'Frais de recouvrement: à négocier entre les parties (pas de tarif légal fixe).',
    discountTerms: 'Escompte pour paiement anticipé: selon modalités commerciales convenues.',
  },

  XAF: {
    // Franc CFA BEAC (Cameroun, Gabon, Congo, Guinée équatoriale, Tchad, RCA)
    countryCode: 'CM', // Cameroun (par défaut)
    currency: 'XAF',
    lateFeeTerms:
      'Pénalités de retard: 3% par mois de retard (5% minimum par an selon SYSCOHADA).',
    recoveryFeeTerms:
      'Frais de recouvrement: à négocier entre les parties (pas de tarif légal fixe).',
    discountTerms: 'Escompte pour paiement anticipé: selon modalités commerciales convenues.',
  },

  // ========== MAGHREB & MOYEN-ORIENT ==========
  MAD: {
    // Maroc
    countryCode: 'MA',
    currency: 'MAD',
    lateFeeTerms:
      'Pénalités de retard: 1.5% par mois (18% par an) selon le code de commerce marocain.',
    recoveryFeeTerms:
      'Frais de recouvrement: à définir contractuellement (pas de montant légal fixe).',
    discountTerms: 'Escompte pour paiement anticipé: selon conditions commerciales.',
  },

  TND: {
    // Tunisie
    countryCode: 'TN',
    currency: 'TND',
    lateFeeTerms:
      'Pénalités de retard: taux légal selon Banque centrale de Tunisie (actuellement ~3% par an).',
    recoveryFeeTerms:
      'Frais de recouvrement: à convenir entre parties selon loi des obligations et contrats.',
    discountTerms: 'Escompte pour paiement anticipé: selon conditions commerciales convenues.',
  },

  JOD: {
    // Jordanie
    countryCode: 'JO',
    currency: 'JOD',
    lateFeeTerms:
      'Pénalités de retard: taux légal selon Banque centrale de Jordanie + 3% (selon loi commerciale).',
    recoveryFeeTerms:
      'Frais de recouvrement: à stipuler au contrat (loi commerciale jordanienne).',
    discountTerms: 'Escompte pour paiement anticipé: selon conditions commerciales convenues.',
  },

  AED: {
    // Émirats Arabes Unis
    countryCode: 'AE',
    currency: 'AED',
    lateFeeTerms:
      'Pénalités de retard: 2% par an selon loi fédérale des EAU (Law No. 5 of 1985).',
    recoveryFeeTerms:
      'Frais de recouvrement: à convenir selon contrat commercial (pas de tarif légal fixe).',
    discountTerms: 'Escompte pour paiement anticipé: selon conditions commerciales convenues.',
  },

  SAR: {
    // Arabie Saoudite
    countryCode: 'SA',
    currency: 'SAR',
    lateFeeTerms:
      'Pénalités de retard: selon loi commerciale saoudienne (contrat primordial).',
    recoveryFeeTerms:
      'Frais de recouvrement: à stipuler au contrat (pas de montant légal fixe).',
    discountTerms: 'Escompte pour paiement anticipé: selon conditions commerciales convenues.',
  },

  // ========== AFRIQUE ANGLOPHONE ==========
  NGN: {
    // Nigeria
    countryCode: 'NG',
    currency: 'NGN',
    lateFeeTerms:
      'Pénalités de retard: 3% par mois (36% par an) selon loi commerciale nigériane.',
    recoveryFeeTerms:
      'Frais de recouvrement: à convenir selon contrat commercial.',
    discountTerms: 'Escompte pour paiement anticipé: selon conditions commerciales convenues.',
  },

  GHS: {
    // Ghana
    countryCode: 'GH',
    currency: 'GHS',
    lateFeeTerms:
      'Pénalités de retard: 3% par mois selon loi commerciale ghanéenne.',
    recoveryFeeTerms:
      'Frais de recouvrement: à convenir entre les parties.',
    discountTerms: 'Escompte pour paiement anticipé: selon conditions commerciales convenues.',
  },

  KES: {
    // Kenya
    countryCode: 'KE',
    currency: 'KES',
    lateFeeTerms:
      'Pénalités de retard: 2% par mois (24% par an) selon loi commerciale kenyane.',
    recoveryFeeTerms:
      'Frais de recouvrement: à stipuler au contrat.',
    discountTerms: 'Escompte pour paiement anticipé: selon conditions commerciales convenues.',
  },

  ZAR: {
    // Afrique du Sud
    countryCode: 'ZA',
    currency: 'ZAR',
    lateFeeTerms:
      'Pénalités de retard: taux repo SARB + 4% selon loi sud-africaine (Prescribed Rate of Interest).',
    recoveryFeeTerms:
      'Frais de recouvrement: à convenir selon contrat.',
    discountTerms: 'Escompte pour paiement anticipé: selon conditions commerciales convenues.',
  },

  // ========== EUROPE ==========
  GBP: {
    // Royaume-Uni
    countryCode: 'GB',
    currency: 'GBP',
    lateFeeTerms:
      'Pénalités de retard: Late Payment of Commercial Debts (Interest) Act 1998 - Bank of England base rate + 8% (minimum 8%).',
    recoveryFeeTerms:
      'Frais de recouvrement: récupération raisonnable des frais selon Small Business, Enterprise and Employment Act 2015.',
    discountTerms: 'Escompte pour paiement anticipé: selon conditions commerciales convenues.',
  },

  CHF: {
    // Suisse
    countryCode: 'CH',
    currency: 'CHF',
    lateFeeTerms:
      'Pénalités de retard: taux de moratoire selon art. 104 CO (Code des obligations) - taux légal SNB + 5%.',
    recoveryFeeTerms:
      'Frais de recouvrement: à définir contractuellement ou par arrangement.',
    discountTerms: 'Escompte pour paiement anticipé: selon conditions commerciales convenues.',
  },

  SEK: {
    // Suède
    countryCode: 'SE',
    currency: 'SEK',
    lateFeeTerms:
      'Pénalités de retard: Riksbank repo rate + 8% selon Lag (1990:932) om dröjsmål med betalning.',
    recoveryFeeTerms:
      'Frais de recouvrement: à convenir selon contrat suédois.',
    discountTerms: 'Escompte pour paiement anticipé: selon conditions commerciales convenues.',
  },

  NOK: {
    // Norvège
    countryCode: 'NO',
    currency: 'NOK',
    lateFeeTerms:
      'Pénalités de retard: Norges Bank key rate + 8% selon loi norvégienne.',
    recoveryFeeTerms:
      'Frais de recouvrement: à stipuler au contrat.',
    discountTerms: 'Escompte pour paiement anticipé: selon conditions commerciales convenues.',
  },

  // ========== AMÉRIQUE DU NORD ==========
  USD: {
    // États-Unis
    countryCode: 'US',
    currency: 'USD',
    lateFeeTerms:
      'Pénalités de retard: à définir contractuellement (pas de taux légal fédéral standard - varie par État et contrat).',
    recoveryFeeTerms:
      'Frais de recouvrement: à stipuler au contrat (intérêts composés généralement applicables à partir de 30 jours).',
    discountTerms: 'Escompte pour paiement anticipé: selon conditions commerciales convenues (ex: 2/10, net 30).',
  },

  CAD: {
    // Canada
    countryCode: 'CA',
    currency: 'CAD',
    lateFeeTerms:
      'Pénalités de retard: taux légal selon province (généralement 5-7% par an) ou selon contrat.',
    recoveryFeeTerms:
      'Frais de recouvrement: à définir contractuellement.',
    discountTerms: 'Escompte pour paiement anticipé: selon conditions commerciales convenues.',
  },

  MXN: {
    // Mexique
    countryCode: 'MX',
    currency: 'MXN',
    lateFeeTerms:
      'Pénalités de retard: Banxico rate + 3% selon loi commerciale mexicaine.',
    recoveryFeeTerms:
      'Frais de recouvrement: à stipuler au contrat.',
    discountTerms: 'Escompte pour paiement anticipé: selon conditions commerciales convenues.',
  },

  // ========== AMÉRIQUE LATINE ==========
  BRL: {
    // Brésil
    countryCode: 'BR',
    currency: 'BRL',
    lateFeeTerms:
      'Pénalités de retard: 1% par mois (12% par an) + variation du taux Selic selon loi brésilienne.',
    recoveryFeeTerms:
      'Frais de recouvrement: à convenir selon contrat brésilien.',
    discountTerms: 'Escompte pour paiement anticipé: selon conditions commerciales convenues.',
  },

  // ========== ASIE-PACIFIQUE ==========
  JPY: {
    // Japon
    countryCode: 'JP',
    currency: 'JPY',
    lateFeeTerms:
      'Pénalités de retard: taux légal selon Commercial Code du Japon (généralement ~6% par an).',
    recoveryFeeTerms:
      'Frais de recouvrement: à stipuler au contrat.',
    discountTerms: 'Escompte pour paiement anticipé: selon conditions commerciales convenues.',
  },

  CNY: {
    // Chine
    countryCode: 'CN',
    currency: 'CNY',
    lateFeeTerms:
      'Pénalités de retard: selon contrat (loi commerciale chinoise exige un accord explicite).',
    recoveryFeeTerms:
      'Frais de recouvrement: à définir contractuellement.',
    discountTerms: 'Escompte pour paiement anticipé: selon conditions commerciales convenues.',
  },

  INR: {
    // Inde
    countryCode: 'IN',
    currency: 'INR',
    lateFeeTerms:
      'Pénalités de retard: 8% par an selon MSME (Micro, Small and Medium Enterprises) Development Act.',
    recoveryFeeTerms:
      'Frais de recouvrement: à stipuler au contrat.',
    discountTerms: 'Escompte pour paiement anticipé: selon conditions commerciales convenues.',
  },

  SGD: {
    // Singapour
    countryCode: 'SG',
    currency: 'SGD',
    lateFeeTerms:
      'Pénalités de retard: selon contrat (Singapore Monetary Authority rate + 4%).',
    recoveryFeeTerms:
      'Frais de recouvrement: à convenir selon contrat.',
    discountTerms: 'Escompte pour paiement anticipé: selon conditions commerciales convenues.',
  },

  AUD: {
    // Australie
    countryCode: 'AU',
    currency: 'AUD',
    lateFeeTerms:
      'Pénalités de retard: RBA cash rate + 10% selon loi commerciale australienne.',
    recoveryFeeTerms:
      'Frais de recouvrement: à stipuler au contrat.',
    discountTerms: 'Escompte pour paiement anticipé: selon conditions commerciales convenues.',
  },

  NZD: {
    // Nouvelle-Zélande
    countryCode: 'NZ',
    currency: 'NZD',
    lateFeeTerms:
      'Pénalités de retard: RBNZ official cash rate + 10% selon loi néo-zélandaise.',
    recoveryFeeTerms:
      'Frais de recouvrement: à convenir selon contrat.',
    discountTerms: 'Escompte pour paiement anticipé: selon conditions commerciales convenues.',
  },
};

/**
 * Récupère les conditions de paiement conformes à la devise
 */
export function getPaymentTermsForCurrency(
  currency: string,
  countryCode?: string
): PaymentTermsCompliance {
  let terms = PAYMENT_TERMS_BY_CURRENCY[currency];

  if (!terms) {
    logger.warn(
      'PaymentTermsCompliance',
      `Devise ${currency} non reconnue, utilisation de l'EUR par défaut`
    );
    terms = PAYMENT_TERMS_BY_CURRENCY['EUR'];
  }

  // Si un code pays est fourni, on peut l'utiliser pour contextualiser
  if (countryCode && countryCode !== terms.countryCode) {
    logger.info(
      'PaymentTermsCompliance',
      `Code pays ${countryCode} fourni pour devise ${currency} (défaut: ${terms.countryCode})`
    );
  }

  return terms;
}

/**
 * Construit le texte complet des conditions de paiement
 */
export function buildPaymentTermsText(
  currency: string,
  customTerms?: string,
  countryCode?: string
): string[] {
  const compliance = getPaymentTermsForCurrency(currency, countryCode);
  const terms: string[] = [];

  // Ajouter les termes légaux
  if (compliance.lateFeeTerms) {
    terms.push(compliance.lateFeeTerms);
  }
  if (compliance.recoveryFeeTerms) {
    terms.push(compliance.recoveryFeeTerms);
  }
  if (compliance.discountTerms) {
    terms.push(compliance.discountTerms);
  }

  // Ajouter les conditions personnalisées
  if (customTerms && customTerms.trim()) {
    terms.push(customTerms);
  }

  return terms;
}

/**
 * Récupère uniquement le taux de pénalité pour utilisation dans les calculateurs
 */
export function getLateFeeInfo(
  currency: string,
  countryCode?: string
): { term: string; ratePercentage?: number; rateDescription: string } {
  const compliance = getPaymentTermsForCurrency(currency, countryCode);

  // Parser du taux depuis la description
  const rateMap: Record<string, number | undefined> = {
    EUR: 10, // 10 points au-dessus du taux directeur BCE (minimum légal)
    XOF: 3,  // 3% par mois = 36% par an
    XAF: 3,
    MAD: 1.5, // 1.5% par mois = 18% par an
    TND: undefined, // Variable selon BCT
    GBP: 8,  // 8% minimum
    CHF: undefined, // Variable selon SNB
    USD: undefined, // À négocier
    CAD: 6,  // Moyenne des provinces
  };

  return {
    term: compliance.lateFeeTerms,
    ratePercentage: rateMap[currency],
    rateDescription: compliance.countryCode,
  };
}

/**
 * Audit: Vérifie les conditions de paiement sur un document
 */
export function auditPaymentTerms(
  currency: string,
  textContent: string,
  countryCode?: string
): { compliant: boolean; warnings: string[] } {
  const compliance = getPaymentTermsForCurrency(currency, countryCode);
  const warnings: string[] = [];
  let compliant = true;

  // Vérifier si les conditions légales sont mentionnées
  if (
    currency === 'EUR' &&
    !textContent.includes('pénalité') &&
    !textContent.includes('retard')
  ) {
    warnings.push(
      '⚠️ Conditions de pénalité manquantes pour EUR (obligatoire en France)'
    );
    compliant = false;
  }

  if (
    (currency === 'XOF' || currency === 'XAF') &&
    !textContent.includes('pénalité') &&
    !textContent.includes('3%')
  ) {
    warnings.push(
      `⚠️ Conditions SYSCOHADA manquantes pour ${currency} (recommandé pour conformité)`
    );
  }

  // Vérifier que les anciennes conditions FR ne sont pas présentes
  if (currency !== 'EUR' && textContent.includes('BCE en vigueur')) {
    warnings.push(
      `❌ Conditions française (BCE) détectées sur devise ${currency} - À corriger!`
    );
    compliant = false;
  }

  if (currency !== 'EUR' && textContent.includes('L441-10 CMF')) {
    warnings.push(
      `❌ Loi française (L441-10 CMF) détectée sur devise ${currency} - À corriger!`
    );
    compliant = false;
  }

  if (currency !== 'EUR' && textContent.match(/\d+€/)) {
    warnings.push(
      `❌ Montant en euros détecté sur devise ${currency} - À corriger!`
    );
    compliant = false;
  }

  return { compliant, warnings };
}

export const paymentTermsComplianceService = {
  getPaymentTermsForCurrency,
  buildPaymentTermsText,
  getLateFeeInfo,
  auditPaymentTerms,
};
