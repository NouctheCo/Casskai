/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

import { getTaxConfiguration, getCorporateTaxRate } from '@/data/taxConfigurations';
import { getCurrentCompanyCurrency } from '@/lib/utils';

// Types pour le simulateur IS/IR
export interface TaxSimulationInput {
  countryCode: string;
  revenue: number; // Chiffre d'affaires
  expenses: number; // Charges déductibles
  companyType: 'EURL' | 'SASU' | 'SARL' | 'SAS' | 'SA' | 'SNC' | 'MICRO' | 'EI';
  hasEmployees: boolean;
  numberOfEmployees?: number;
  totalSalaries?: number;
}

export interface TaxSimulationResult {
  // Résultat comptable
  revenue: number;
  expenses: number;
  accountingProfit: number;

  // Résultat fiscal
  fiscalProfit: number;
  reintegrations: number;
  deductions: number;

  // Impôt sur les sociétés (IS)
  corporateTaxBase: number;
  corporateTaxRate: number;
  corporateTaxAmount: number;
  corporateTaxBreakdown?: Array<{
    range: string;
    rate: number;
    amount: number;
  }>;

  // Impôt sur le revenu (IR) pour comparaison
  irTaxAmount?: number;
  irTaxRate?: number;

  // Charges sociales
  socialContributions: number;
  socialContributionsRate: number;

  // Nette après impôts
  netProfit: number;
  netAfterTax: number;
  effectiveTaxRate: number;

  // Comparaison IS vs IR
  comparison?: {
    isSaving: number;
    irSaving: number;
    recommendation: 'IS' | 'IR';
    reasonsIS: string[];
    reasonsIR: string[];
  };

  // Optimisations suggérées
  optimizations: Array<{
    title: string;
    description: string;
    potentialSaving: number;
    category: 'deduction' | 'timing' | 'structure';
  }>;
}

export class TaxSimulationService {
  private static instance: TaxSimulationService;

  static getInstance(): TaxSimulationService {
    if (!this.instance) {
      this.instance = new TaxSimulationService();
    }
    return this.instance;
  }

  /**
   * Simule l'IS (Impôt sur les Sociétés)
   */
  simulateCorporateTax(input: TaxSimulationInput): TaxSimulationResult {
    // Calcul du résultat comptable
    const accountingProfit = input.revenue - input.expenses;

    // Calcul du résultat fiscal (réintégrations / déductions)
    const { fiscalProfit, reintegrations, deductions } = this.calculateFiscalProfit(input, accountingProfit);

    // Calcul de l'IS
    const { taxAmount, taxRate, breakdown } = this.calculateCorporateTax(input.countryCode, fiscalProfit);

    // Calcul des charges sociales
    const { socialContributions, socialContributionsRate } = this.calculateSocialContributions(input);

    // Calcul du net après impôts
    const totalTaxes = taxAmount + socialContributions;
    const netAfterTax = fiscalProfit - totalTaxes;
    const effectiveTaxRate = (totalTaxes / fiscalProfit) * 100;

    // Générer les optimisations
    const optimizations = this.generateOptimizations(input, fiscalProfit);

    return {
      revenue: input.revenue,
      expenses: input.expenses,
      accountingProfit,
      fiscalProfit,
      reintegrations,
      deductions,
      corporateTaxBase: fiscalProfit,
      corporateTaxRate: taxRate,
      corporateTaxAmount: taxAmount,
      corporateTaxBreakdown: breakdown,
      socialContributions,
      socialContributionsRate,
      netProfit: accountingProfit,
      netAfterTax,
      effectiveTaxRate,
      optimizations
    };
  }

  /**
   * Compare IS vs IR pour aider à la décision
   */
  compareISvsIR(input: TaxSimulationInput): TaxSimulationResult {
    // Simuler IS
    const isResult = this.simulateCorporateTax(input);

    // Simuler IR (uniquement pour France actuellement)
    const irResult = this.simulateIncomeTax(input);

    // Comparaison
    const isTotalCost = isResult.corporateTaxAmount + isResult.socialContributions;
    const irTotalCost = irResult.taxAmount + irResult.socialContributions;

    const comparison = {
      isSaving: irTotalCost - isTotalCost,
      irSaving: isTotalCost - irTotalCost,
      recommendation: (isTotalCost < irTotalCost ? 'IS' : 'IR') as 'IS' | 'IR',
      reasonsIS: this.getReasonsForIS(input, isTotalCost, irTotalCost),
      reasonsIR: this.getReasonsForIR(input, isTotalCost, irTotalCost)
    };

    return {
      ...isResult,
      irTaxAmount: irResult.taxAmount,
      irTaxRate: irResult.taxRate,
      comparison
    };
  }

  /**
   * Calcule le résultat fiscal (réintégrations et déductions)
   */
  private calculateFiscalProfit(input: TaxSimulationInput, accountingProfit: number): {
    fiscalProfit: number;
    reintegrations: number;
    deductions: number;
  } {
    let reintegrations = 0;
    let deductions = 0;

    // France : Réintégrations courantes
    if (input.countryCode === 'FR') {
      // Amende et pénalités (non déductibles)
      // TVS (Taxe sur les Véhicules de Société)
      // Quote-part frais et charges (5% des dividendes)
      reintegrations += accountingProfit * 0.01; // Estimation 1%

      // Déductions courantes
      // Quote-part de frais et charges sur plus-values
      // Déficits reportables
      deductions += accountingProfit * 0.005; // Estimation 0.5%
    }

    const fiscalProfit = Math.max(0, accountingProfit + reintegrations - deductions);

    return { fiscalProfit, reintegrations, deductions };
  }

  /**
   * Calcule l'IS selon le pays et les seuils
   */
  private calculateCorporateTax(countryCode: string, fiscalProfit: number): {
    taxAmount: number;
    taxRate: number;
    breakdown?: Array<{
      range: string;
      rate: number;
      amount: number;
    }>;
  } {
    const taxConfig = getTaxConfiguration(countryCode);
    if (!taxConfig) {
      return { taxAmount: 0, taxRate: 0 };
    }

    const breakdown: Array<{ range: string; rate: number; amount: number }> = [];
    let totalTax = 0;

    // France : Taux progressif IS
    if (countryCode === 'FR') {
      // Taux réduit 15% jusqu'à 42 500€
      if (fiscalProfit <= 42500) {
        const amount = fiscalProfit * 0.15;
        breakdown.push({ range: '0 - 42 500 EUR', rate: 15, amount });
        totalTax += amount;
      } else {
        // 15% sur les premiers 42 500€
        const firstBracket = 42500 * 0.15;
        breakdown.push({ range: '0 - 42 500 EUR', rate: 15, amount: firstBracket });
        totalTax += firstBracket;

        // 25% au-delà
        const secondBracket = (fiscalProfit - 42500) * 0.25;
        breakdown.push({ range: '> 42 500 EUR', rate: 25, amount: secondBracket });
        totalTax += secondBracket;
      }

      const effectiveRate = (totalTax / fiscalProfit) * 100;
      return { taxAmount: totalTax, taxRate: effectiveRate, breakdown };
    }

    // Autres pays : Taux unique ou progressif
    const standardRate = getCorporateTaxRate(countryCode, fiscalProfit) || taxConfig.corporateTax.standardRate;
    const taxAmount = fiscalProfit * (standardRate / 100);

    breakdown.push({
      range: `Tout le bénéfice`,
      rate: standardRate,
      amount: taxAmount
    });

    return { taxAmount, taxRate: standardRate, breakdown };
  }

  /**
   * Simule l'IR (Impôt sur le Revenu) - France uniquement
   */
  private simulateIncomeTax(input: TaxSimulationInput): {
    taxAmount: number;
    taxRate: number;
    socialContributions: number;
  } {
    if (input.countryCode !== 'FR') {
      return { taxAmount: 0, taxRate: 0, socialContributions: 0 };
    }

    const accountingProfit = input.revenue - input.expenses;

    // Barème IR 2025 (parts fiscales = 1 pour simplifier)
    let taxAmount = 0;
    const brackets = [
      { limit: 11294, rate: 0 },
      { limit: 28797, rate: 11 },
      { limit: 82341, rate: 30 },
      { limit: 177106, rate: 41 },
      { limit: Infinity, rate: 45 }
    ];

    let remaining = accountingProfit;
    for (let i = 0; i < brackets.length; i++) {
      const bracket = brackets[i];
      const previousLimit = i > 0 ? brackets[i - 1].limit : 0;
      const taxableInBracket = Math.min(remaining, bracket.limit - previousLimit);

      if (taxableInBracket > 0) {
        taxAmount += taxableInBracket * (bracket.rate / 100);
        remaining -= taxableInBracket;
      }

      if (remaining <= 0) break;
    }

    // Prélèvements sociaux 17.2%
    const socialContributions = accountingProfit * 0.172;

    const effectiveRate = (taxAmount / accountingProfit) * 100;

    return { taxAmount, taxRate: effectiveRate, socialContributions };
  }

  /**
   * Calcule les charges sociales
   */
  private calculateSocialContributions(input: TaxSimulationInput): {
    socialContributions: number;
    socialContributionsRate: number;
  } {
    const accountingProfit = input.revenue - input.expenses;

    // France : Charges patronales et salariales
    if (input.countryCode === 'FR') {
      if (input.hasEmployees && input.totalSalaries) {
        // Charges patronales ~42%
        const employerContributions = input.totalSalaries * 0.42;

        // Cotisations du dirigeant
        const managerContributions = accountingProfit * 0.15; // Estimation

        const total = employerContributions + managerContributions;
        const rate = (total / accountingProfit) * 100;

        return { socialContributions: total, socialContributionsRate: rate };
      } else {
        // Pas de salariés : cotisations TNS (Travailleur Non Salarié)
        const tnsRate = 0.45; // ~45% du bénéfice
        const contributions = accountingProfit * tnsRate;

        return { socialContributions: contributions, socialContributionsRate: tnsRate * 100 };
      }
    }

    // Autres pays : estimation basique
    const rate = input.hasEmployees ? 0.30 : 0.20;
    const contributions = accountingProfit * rate;

    return { socialContributions: contributions, socialContributionsRate: rate * 100 };
  }

  /**
   * Génère des optimisations fiscales suggérées
   */
  private generateOptimizations(input: TaxSimulationInput, fiscalProfit: number): Array<{
    title: string;
    description: string;
    potentialSaving: number;
    category: 'deduction' | 'timing' | 'structure';
  }> {
    const optimizations: Array<any> = [];

    // France uniquement pour l'instant
    if (input.countryCode !== 'FR') {
      return optimizations;
    }

    // Optimisation 1 : Déduction pour frais professionnels
    if (input.revenue > 50000 && !input.hasEmployees) {
      optimizations.push({
        title: 'Frais de véhicule professionnels',
        description: 'Déduire les frais réels de véhicule professionnel au lieu du forfait kilométrique peut augmenter vos déductions.',
        potentialSaving: input.revenue * 0.02, // 2% du CA
        category: 'deduction'
      });
    }

    // Optimisation 2 : Timing des factures
    if (fiscalProfit > 100000) {
      optimizations.push({
        title: 'Optimisation de la clôture d\'exercice',
        description: 'Reporter certaines factures fournisseurs sur l\'exercice N et décaler les factures clients sur N+1 pour lisser le résultat fiscal.',
        potentialSaving: fiscalProfit * 0.05, // 5% du bénéfice
        category: 'timing'
      });
    }

    // Optimisation 3 : Structure juridique
    if (input.companyType === 'EI' && fiscalProfit > 80000) {
      optimizations.push({
        title: 'Passage en société (EURL/SASU)',
        description: 'Au-delà de 80k€ de bénéfice, l\'IS devient souvent plus avantageux que l\'IR. Considérez la création d\'une société.',
        potentialSaving: fiscalProfit * 0.10, // 10% du bénéfice
        category: 'structure'
      });
    }

    // Optimisation 4 : Amortissements accélérés
    if (input.revenue > 200000) {
      optimizations.push({
        title: 'Amortissements exceptionnels',
        description: 'Profiter des dispositifs d\'amortissement exceptionnel (matériel informatique, véhicules électriques) pour réduire le résultat fiscal.',
        potentialSaving: fiscalProfit * 0.03, // 3% du bénéfice
        category: 'deduction'
      });
    }

    // Optimisation 5 : Micro-entreprise si éligible
    if (input.revenue < 77700 && input.companyType !== 'MICRO') {
      const microTax = input.revenue * 0.22; // Abattement 34% + charges sociales
      const currentTax = fiscalProfit * 0.25; // IS 25%
      if (microTax < currentTax) {
        optimizations.push({
          title: 'Régime micro-entrepreneur',
          description: 'Sous 77 700€ de CA (services), le régime micro peut être plus avantageux avec un abattement forfaitaire de 34%.',
          potentialSaving: currentTax - microTax,
          category: 'structure'
        });
      }
    }

    return optimizations;
  }

  /**
   * Raisons de choisir l'IS
   */
  private getReasonsForIS(input: TaxSimulationInput, isCost: number, irCost: number): string[] {
    const reasons: string[] = [];

    if (isCost < irCost) {
      reasons.push(`Économie de ${this.formatCurrency(irCost - isCost)} par rapport à l'IR`);
    }

    if (input.revenue > 100000) {
      reasons.push('Taux d\'imposition plafonné à 25% (vs progressif IR jusqu\'à 45%)');
    }

    if (input.hasEmployees) {
      reasons.push('Déduction des rémunérations du dirigeant');
    }

    reasons.push('Possibilité de lisser les résultats avec reports déficitaires illimités');
    reasons.push('Déduction des charges sociales du dirigeant');

    return reasons;
  }

  /**
   * Raisons de choisir l'IR
   */
  private getReasonsForIR(input: TaxSimulationInput, isCost: number, irCost: number): string[] {
    const reasons: string[] = [];

    if (irCost < isCost) {
      reasons.push(`Économie de ${this.formatCurrency(isCost - irCost)} par rapport à l'IS`);
    }

    if (input.revenue < 50000) {
      reasons.push('Simplification administrative (pas de comptabilité commerciale)');
    }

    reasons.push('Pas de double imposition (bénéfices + dividendes)');

    if (input.companyType === 'MICRO') {
      reasons.push('Abattement forfaitaire de 34% (services) ou 71% (ventes)');
    }

    reasons.push('Imputation directe des déficits sur le revenu global');

    return reasons;
  }

  /**
   * Formatte une valeur monétaire
   */
  private formatCurrency(amount: number): string {
    const currency = getCurrentCompanyCurrency() || 'EUR';
    const isZero = currency === 'XOF' || currency === 'XAF';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: isZero ? 0 : 2,
      maximumFractionDigits: isZero ? 0 : 2
    }).format(amount).replace(/\u00A0/g, ' '); // Remplacer espace insecable
  }
}

export const taxSimulationService = TaxSimulationService.getInstance();
