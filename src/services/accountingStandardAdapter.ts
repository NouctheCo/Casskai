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
// src/services/accountingStandardAdapter.ts
/**
 * Adaptateur pour gérer les différents standards comptables multi-pays
 * Supporte: PCG (France), SYSCOHADA (OHADA), IFRS (International), SCF (Maghreb)
 */
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { IFRS_ACCOUNTS } from '@/data/ifrs';
export type AccountingStandard = 'PCG' | 'SYSCOHADA' | 'IFRS' | 'SCF';
export interface StandardMapping {
  revenueClasses: string[];
  expenseClasses: string[];
  assetClasses: string[];
  liabilityClasses: string[];
  equityClasses: string[];
  haoClasses?: string[];  // Spécifique SYSCOHADA (Hors Activités Ordinaires)
}
/**
 * Mappings des classes de comptes par standard comptable
 */
export const STANDARD_MAPPINGS: Record<AccountingStandard, StandardMapping> = {
  PCG: {
    revenueClasses: ['7'],
    expenseClasses: ['6'],
    assetClasses: ['2', '3', '4', '5'],
    liabilityClasses: ['1', '4'],
    equityClasses: ['1']
  },
  SYSCOHADA: {
    revenueClasses: ['7'],
    expenseClasses: ['6'],
    assetClasses: ['2', '3', '4', '5'],
    liabilityClasses: ['1', '4'],
    equityClasses: ['1'],
    haoClasses: ['8']  // ✅ CLASSE 8 HAO - Hors Activités Ordinaires
  },
  IFRS: {
    // Structure IFRS for SMEs
    // Class 1 = Non-current Assets, Class 2 = Current Assets
    // Class 3 = Equity
    // Class 4 = Non-current Liabilities, Class 5 = Current Liabilities
    // Class 6 = Revenue, Class 7 = Expenses
    revenueClasses: ['6'],
    expenseClasses: ['7'],
    assetClasses: ['1', '2'],
    liabilityClasses: ['4', '5'],
    equityClasses: ['3']
  },
  SCF: {
    // Système Comptable Financier (Algérie) - similaire PCG
    revenueClasses: ['7'],
    expenseClasses: ['6'],
    assetClasses: ['2', '3', '4', '5'],
    liabilityClasses: ['1', '4'],
    equityClasses: ['1']
  }
};
/**
 * Pays membres OHADA utilisant SYSCOHADA
 */
export const SYSCOHADA_COUNTRIES = [
  'CI', // Côte d'Ivoire
  'SN', // Sénégal
  'ML', // Mali
  'BF', // Burkina Faso
  'BJ', // Bénin
  'TG', // Togo
  'NE', // Niger
  'GW', // Guinée-Bissau
  'CM', // Cameroun
  'CF', // République Centrafricaine
  'TD', // Tchad
  'CG', // Congo-Brazzaville
  'GA', // Gabon
  'GQ', // Guinée équatoriale
  'GN', // Guinée
  'CD', // RD Congo
  'KM'  // Comores
];
/**
 * Pays du Maghreb utilisant SCF (Algérie) ou systèmes similaires
 */
export const SCF_COUNTRIES = [
  'DZ', // Algérie
  'MA', // Maroc (Plan Comptable Marocain similaire)
  'TN'  // Tunisie (Plan Comptable Tunisien similaire)
];
/**
 * Pays anglophones africains utilisant IFRS
 */
export const IFRS_COUNTRIES = [
  'GB', // Royaume-Uni
  'NG', // Nigeria
  'KE', // Kenya
  'GH', // Ghana
  'ZA', // Afrique du Sud
  'UG', // Ouganda
  'TZ', // Tanzanie
  'RW', // Rwanda
  'ZM', // Zambie
  'ZW'  // Zimbabwe
];
/**
 * Classe singleton pour adapter les opérations comptables selon le standard
 */
export class AccountingStandardAdapter {
  /**
   * Récupère le mapping pour un standard donné
   */
  static getMapping(standard: AccountingStandard): StandardMapping {
    return STANDARD_MAPPINGS[standard] || STANDARD_MAPPINGS.PCG;
  }
  /**
   * Vérifie si un compte est un compte de produits/revenus
   */
  static isRevenue(accountNumber: string, standard: AccountingStandard): boolean {
    const mapping = this.getMapping(standard);
    return mapping.revenueClasses.some(cls => accountNumber.startsWith(cls));
  }
  /**
   * Vérifie si un compte est un compte de charges/expenses
   */
  static isExpense(accountNumber: string, standard: AccountingStandard): boolean {
    const mapping = this.getMapping(standard);
    return mapping.expenseClasses.some(cls => accountNumber.startsWith(cls));
  }
  /**
   * Vérifie si un compte est un compte d'actifs
   */
  static isAsset(accountNumber: string, standard: AccountingStandard): boolean {
    const mapping = this.getMapping(standard);
    return mapping.assetClasses.some(cls => accountNumber.startsWith(cls));
  }
  /**
   * Vérifie si un compte est un compte de passifs/dettes
   */
  static isLiability(accountNumber: string, standard: AccountingStandard): boolean {
    const mapping = this.getMapping(standard);
    return mapping.liabilityClasses.some(cls => accountNumber.startsWith(cls));
  }
  /**
   * Vérifie si un compte est un compte de capitaux propres
   */
  static isEquity(accountNumber: string, standard: AccountingStandard): boolean {
    const mapping = this.getMapping(standard);
    return mapping.equityClasses.some(cls => accountNumber.startsWith(cls));
  }
  /**
   * Vérifie si un compte appartient aux Hors Activités Ordinaires (HAO - classe 8 SYSCOHADA)
   */
  static isHAO(accountNumber: string, standard: AccountingStandard): boolean {
    if (standard !== 'SYSCOHADA') return false;
    const mapping = this.getMapping(standard);
    return mapping.haoClasses?.some(cls => accountNumber.startsWith(cls)) || false;
  }
  /**
   * Infère le standard comptable à partir du code pays
   */
  static inferStandardFromCountry(countryCode: string): AccountingStandard {
    if (SYSCOHADA_COUNTRIES.includes(countryCode)) {
      return 'SYSCOHADA';
    }
    if (SCF_COUNTRIES.includes(countryCode)) {
      return 'SCF';
    }
    if (IFRS_COUNTRIES.includes(countryCode)) {
      return 'IFRS';
    }
    return 'PCG';  // Par défaut (France et autres pays francophones)
  }
  /**
   * Récupère le standard comptable d'une entreprise depuis la base de données
   */
  static async getCompanyStandard(companyId: string): Promise<AccountingStandard> {
    try {
      // Essayer d'abord depuis la colonne accounting_standard si elle existe
      const { data: company, error } = await supabase
        .from('companies')
        .select('country, accounting_standard')
        .eq('id', companyId)
        .single();
      if (error || !company) {
        logger.warn('AccountingStandardAdapter', `Cannot fetch company ${companyId}, using default PCG`, error);
        return 'PCG';
      }
      // Si accounting_standard est défini, l'utiliser
      if (company.accounting_standard) {
        return company.accounting_standard as AccountingStandard;
      }
      // Sinon, inférer depuis le pays
      if (company.country) {
        return this.inferStandardFromCountry(company.country);
      }
      return 'PCG'; // Fallback par défaut
    } catch (error) {
      logger.error('AccountingStandardAdapter', 'Error fetching company standard:', error);
      return 'PCG';
    }
  }
  /**
   * Filtre les écritures comptables pour n'inclure que les revenus
   */
  static filterRevenueEntries<T extends { account_number: string }>(
    entries: T[],
    standard: AccountingStandard
  ): T[] {
    return entries.filter(entry => this.isRevenue(entry.account_number, standard));
  }
  /**
   * Filtre les écritures comptables pour n'inclure que les charges
   */
  static filterExpenseEntries<T extends { account_number: string }>(
    entries: T[],
    standard: AccountingStandard
  ): T[] {
    return entries.filter(entry => this.isExpense(entry.account_number, standard));
  }
  /**
   * Filtre les écritures HAO (SYSCOHADA uniquement)
   */
  static filterHAOEntries<T extends { account_number: string }>(
    entries: T[],
    standard: AccountingStandard
  ): T[] {
    if (standard !== 'SYSCOHADA') return [];
    return entries.filter(entry => this.isHAO(entry.account_number, standard));
  }
  /**
   * Sépare les charges HAO des charges d'exploitation (SYSCOHADA)
   */
  static splitExpenses<T extends { account_number: string }>(
    entries: T[],
    standard: AccountingStandard
  ): { exploitation: T[]; hao: T[] } {
    if (standard !== 'SYSCOHADA') {
      return { exploitation: this.filterExpenseEntries(entries, standard), hao: [] };
    }
    const exploitation = entries.filter(
      e => this.isExpense(e.account_number, standard) && !this.isHAO(e.account_number, standard)
    );
    const hao = entries.filter(e => this.isHAO(e.account_number, standard) && e.account_number.startsWith('8') && ['81', '83', '85', '87', '89'].some(c => e.account_number.startsWith(c)));
    return { exploitation, hao };
  }
  /**
   * Sépare les produits HAO des produits d'exploitation (SYSCOHADA)
   */
  static splitRevenues<T extends { account_number: string }>(
    entries: T[],
    standard: AccountingStandard
  ): { exploitation: T[]; hao: T[] } {
    if (standard !== 'SYSCOHADA') {
      return { exploitation: this.filterRevenueEntries(entries, standard), hao: [] };
    }
    const exploitation = entries.filter(
      e => this.isRevenue(e.account_number, standard) && !this.isHAO(e.account_number, standard)
    );
    const hao = entries.filter(e => this.isHAO(e.account_number, standard) && e.account_number.startsWith('8') && ['82', '84', '86', '88'].some(c => e.account_number.startsWith(c)));
    return { exploitation, hao };
  }
  /**
   * Obtient le nom du standard en texte complet
   */
  static getStandardName(standard: AccountingStandard): string {
    const names: Record<AccountingStandard, string> = {
      PCG: 'Plan Comptable Général (France)',
      SYSCOHADA: 'Système Comptable OHADA',
      IFRS: 'International Financial Reporting Standards',
      SCF: 'Système Comptable Financier (Algérie)'
    };
    return names[standard] || standard;
  }
  /**
   * Obtient les pays couverts par un standard
   */
  static getCountriesForStandard(standard: AccountingStandard): string[] {
    switch (standard) {
      case 'SYSCOHADA':
        return SYSCOHADA_COUNTRIES;
      case 'SCF':
        return SCF_COUNTRIES;
      case 'IFRS':
        return IFRS_COUNTRIES;
      case 'PCG':
      default:
        return ['FR', 'BE', 'LU']; // France, Belgique, Luxembourg
    }
  }
}
// Export par défaut
export default AccountingStandardAdapter;