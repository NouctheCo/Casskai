/**
 * CassKai - Service de Mapping Automatique Multi-Référentiels
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 *
 * Ce service fait le pont entre différents référentiels comptables :
 * - PCG (France) : 411, 401, 607, 707, 44566, 44571
 * - SYSCOHADA (Afrique) : 411, 401, 607, 707, 4431, 4433
 * - IFRS (International) : Receivables, Payables, Revenue, Expenses
 * - US GAAP (USA) : Accounts Receivable, Accounts Payable, COGS, Sales
 *
 * Le système détecte automatiquement le référentiel et mappe les comptes.
 */
import { supabase } from '@/lib/supabase';
import { AccountingStandard } from './accountingRulesService';
import { logger } from '@/lib/logger';
/**
 * Typologie universelle des comptes (indépendante du référentiel)
 */
export enum UniversalAccountType {
  // ACTIF
  CUSTOMERS = 'customers',                  // Clients / Receivables
  BANK = 'bank',                           // Banque / Cash
  CASH = 'cash',                           // Caisse / Petty Cash
  FIXED_ASSETS = 'fixed_assets',           // Immobilisations / Fixed Assets
  INVENTORY = 'inventory',                 // Stocks / Inventory
  // PASSIF
  SUPPLIERS = 'suppliers',                 // Fournisseurs / Payables
  CAPITAL = 'capital',                     // Capital / Equity
  LOANS = 'loans',                         // Emprunts / Loans
  // CHARGES
  PURCHASES = 'purchases',                 // Achats / Purchases / COGS
  SALARIES = 'salaries',                   // Salaires / Salaries
  RENT = 'rent',                          // Loyer / Rent
  UTILITIES = 'utilities',                // Services / Utilities
  // PRODUITS
  SALES = 'sales',                        // Ventes / Revenue / Sales
  SERVICES = 'services',                  // Prestations / Services Revenue
  FINANCIAL_INCOME = 'financial_income',  // Produits financiers / Interest Income
  // TVA
  VAT_DEDUCTIBLE = 'vat_deductible',      // TVA déductible / VAT Receivable / Sales Tax Receivable
  VAT_COLLECTED = 'vat_collected',        // TVA collectée / VAT Payable / Sales Tax Payable
}
/**
 * Mapping par référentiel : Type Universel → Numéro de compte
 */
export const ACCOUNT_MAPPING = {
  [AccountingStandard.PCG]: {
    // France - Plan Comptable Général
    [UniversalAccountType.CUSTOMERS]: '411%',
    [UniversalAccountType.SUPPLIERS]: '401%',
    [UniversalAccountType.BANK]: '512%',
    [UniversalAccountType.CASH]: '53%',
    [UniversalAccountType.PURCHASES]: '607%',
    // Use '70%' to include 701..707 (all 70x sales accounts)
    [UniversalAccountType.SALES]: '70%',
    [UniversalAccountType.SERVICES]: '706%',
    [UniversalAccountType.VAT_DEDUCTIBLE]: '44566',
    [UniversalAccountType.VAT_COLLECTED]: '44571',
    [UniversalAccountType.CAPITAL]: '101%',
    [UniversalAccountType.LOANS]: '164%',
    [UniversalAccountType.FIXED_ASSETS]: '2%',
    [UniversalAccountType.INVENTORY]: '3%',
    [UniversalAccountType.SALARIES]: '641%',
    [UniversalAccountType.RENT]: '613%',
    [UniversalAccountType.UTILITIES]: '606%',
    [UniversalAccountType.FINANCIAL_INCOME]: '76%',
  },
  [AccountingStandard.SYSCOHADA]: {
    // Afrique - SYSCOHADA (très similaire au PCG)
    [UniversalAccountType.CUSTOMERS]: '411%',
    [UniversalAccountType.SUPPLIERS]: '401%',
    [UniversalAccountType.BANK]: '52%',      // Légèrement différent
    [UniversalAccountType.CASH]: '57%',      // Légèrement différent
    [UniversalAccountType.PURCHASES]: '60%',
    [UniversalAccountType.SALES]: '70%',
    [UniversalAccountType.SERVICES]: '706%',
    [UniversalAccountType.VAT_DEDUCTIBLE]: '4431', // Différent !
    [UniversalAccountType.VAT_COLLECTED]: '4433',  // Différent !
    [UniversalAccountType.CAPITAL]: '101%',
    [UniversalAccountType.LOANS]: '16%',
    [UniversalAccountType.FIXED_ASSETS]: '2%',
    [UniversalAccountType.INVENTORY]: '3%',
    [UniversalAccountType.SALARIES]: '66%',
    [UniversalAccountType.RENT]: '632%',
    [UniversalAccountType.UTILITIES]: '605%',
    [UniversalAccountType.FINANCIAL_INCOME]: '77%',
  },
  [AccountingStandard.IFRS]: {
    // International - IFRS (structure plus flexible)
    // On cherche par mots-clés dans les libellés
    [UniversalAccountType.CUSTOMERS]: '%receivable%',
    [UniversalAccountType.SUPPLIERS]: '%payable%',
    [UniversalAccountType.BANK]: '%bank%|%cash%',
    [UniversalAccountType.CASH]: '%petty cash%|%cash%',
    [UniversalAccountType.PURCHASES]: '%purchases%|%cogs%|%cost of sales%',
    [UniversalAccountType.SALES]: '%revenue%|%sales%',
    [UniversalAccountType.SERVICES]: '%service revenue%',
    [UniversalAccountType.VAT_DEDUCTIBLE]: '%vat receivable%|%input vat%',
    [UniversalAccountType.VAT_COLLECTED]: '%vat payable%|%output vat%',
    [UniversalAccountType.CAPITAL]: '%equity%|%capital%',
    [UniversalAccountType.LOANS]: '%loan%|%borrowing%',
    [UniversalAccountType.FIXED_ASSETS]: '%fixed asset%|%ppe%',
    [UniversalAccountType.INVENTORY]: '%inventory%|%stock%',
    [UniversalAccountType.SALARIES]: '%salary%|%wage%|%payroll%',
    [UniversalAccountType.RENT]: '%rent%',
    [UniversalAccountType.UTILITIES]: '%utilities%|%electricity%',
    [UniversalAccountType.FINANCIAL_INCOME]: '%interest income%|%financial income%',
  },
  [AccountingStandard.US_GAAP]: {
    // USA - US GAAP (similaire à IFRS mais avec conventions US)
    [UniversalAccountType.CUSTOMERS]: '%accounts receivable%',
    [UniversalAccountType.SUPPLIERS]: '%accounts payable%',
    [UniversalAccountType.BANK]: '%cash%|%checking%',
    [UniversalAccountType.CASH]: '%petty cash%',
    [UniversalAccountType.PURCHASES]: '%cost of goods sold%|%cogs%',
    [UniversalAccountType.SALES]: '%sales revenue%|%revenue%',
    [UniversalAccountType.SERVICES]: '%service revenue%',
    [UniversalAccountType.VAT_DEDUCTIBLE]: '%sales tax receivable%',
    [UniversalAccountType.VAT_COLLECTED]: '%sales tax payable%',
    [UniversalAccountType.CAPITAL]: '%equity%|%common stock%',
    [UniversalAccountType.LOANS]: '%notes payable%|%loan%',
    [UniversalAccountType.FIXED_ASSETS]: '%property plant equipment%|%ppe%',
    [UniversalAccountType.INVENTORY]: '%inventory%',
    [UniversalAccountType.SALARIES]: '%salaries expense%|%payroll%',
    [UniversalAccountType.RENT]: '%rent expense%',
    [UniversalAccountType.UTILITIES]: '%utilities expense%',
    [UniversalAccountType.FINANCIAL_INCOME]: '%interest income%',
  },
};
/**
 * Cache des comptes par entreprise
 */
const accountsCache = new Map<string, any[]>();
/**
 * Service de mapping automatique
 */
export class AccountMappingService {
  /**
   * Détecte automatiquement le référentiel comptable d'une entreprise
   * basé sur les comptes présents dans son plan comptable
   */
  static async detectAccountingStandard(companyId: string): Promise<AccountingStandard> {
    try {
      const { data: accounts } = await supabase
        .from('chart_of_accounts')
        .select('account_number, account_name')
        .eq('company_id', companyId)
        .limit(50);
      if (!accounts || accounts.length === 0) {
        return AccountingStandard.PCG; // Défaut
      }
      // Compter les signatures de chaque référentiel
      const scores = {
        [AccountingStandard.PCG]: 0,
        [AccountingStandard.SYSCOHADA]: 0,
        [AccountingStandard.IFRS]: 0,
        [AccountingStandard.US_GAAP]: 0,
      };
      for (const account of accounts) {
        const num = account.account_number || '';
        const name = (account.account_name || '').toLowerCase();
        // Signatures PCG/SYSCOHADA (numérotation française)
        if (/^[1-8]\d{2,}/.test(num)) {
          scores[AccountingStandard.PCG] += 2;
          scores[AccountingStandard.SYSCOHADA] += 2;
          // Différencier PCG vs SYSCOHADA par la TVA
          if (num.startsWith('4456')) scores[AccountingStandard.PCG] += 3;
          if (num.startsWith('443')) scores[AccountingStandard.SYSCOHADA] += 3;
        }
        // Signatures IFRS/US GAAP (libellés anglais)
        if (/receivable|payable|revenue|expense/i.test(name)) {
          scores[AccountingStandard.IFRS] += 2;
          scores[AccountingStandard.US_GAAP] += 2;
          // Différencier IFRS vs US GAAP
          if (/vat/i.test(name)) scores[AccountingStandard.IFRS] += 1;
          if (/sales tax|cogs/i.test(name)) scores[AccountingStandard.US_GAAP] += 1;
        }
      }
      // Retourner le référentiel avec le meilleur score
      const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
      return sorted[0][0] as AccountingStandard;
    } catch (error) {
      logger.error('AccountMapping', 'Error detecting accounting standard:', error);
      return AccountingStandard.PCG; // Défaut
    }
  }
  /**
   * Trouve un compte par son type universel
   * Adapte automatiquement selon le référentiel de l'entreprise
   */
  static async findAccountByType(
    companyId: string,
    accountType: UniversalAccountType
  ): Promise<any | null> {
    try {
      // Détecter le référentiel
      const standard = await this.detectAccountingStandard(companyId);
      // Récupérer le pattern de recherche
      const mapping = ACCOUNT_MAPPING[standard as keyof typeof ACCOUNT_MAPPING];
      if (!mapping) {
        logger.error('AccountMapping', 'No mapping found for standard:', standard);
        return null;
      }
      const pattern = mapping[accountType];
      if (!pattern) {
        logger.error('AccountMapping', 'No pattern found for account type:', accountType);
        return null;
      }
      // Charger les comptes depuis le cache ou la DB
      let accounts = accountsCache.get(companyId);
      if (!accounts) {
        const { data } = await supabase
          .from('chart_of_accounts')
          .select('*')
          .eq('company_id', companyId)
          .eq('is_active', true);
        accounts = data || [];
        accountsCache.set(companyId, accounts);
      }
      // Recherche selon le type de pattern
      if (standard === AccountingStandard.PCG || standard === AccountingStandard.SYSCOHADA) {
        // Recherche par numéro (avec wildcard %)
        const searchPattern = pattern.replace(/%/g, '');
        const account = accounts.find(acc =>
          acc.account_number?.startsWith(searchPattern)
        );
        return account || null;
      } else {
        // Recherche par libellé (IFRS/US GAAP)
        const patterns = pattern.toLowerCase().split('|');
        const account = accounts.find(acc => {
          const name = (acc.account_name || '').toLowerCase();
          return patterns.some((p: string) => {
            const cleanPattern = p.replace(/%/g, '');
            return name.includes(cleanPattern);
          });
        });
        return account || null;
      }
    } catch (error) {
      logger.error('AccountMapping', 'Error finding account by type:', error);
      return null;
    }
  }
  /**
   * Vide le cache (à appeler si le plan comptable change)
   */
  static clearCache(companyId?: string) {
    if (companyId) {
      accountsCache.delete(companyId);
    } else {
      accountsCache.clear();
    }
  }
  /**
   * Récupère les comptes principaux nécessaires pour les écritures courantes
   */
  static async getMainAccounts(companyId: string) {
    return {
      customers: await this.findAccountByType(companyId, UniversalAccountType.CUSTOMERS),
      suppliers: await this.findAccountByType(companyId, UniversalAccountType.SUPPLIERS),
      bank: await this.findAccountByType(companyId, UniversalAccountType.BANK),
      sales: await this.findAccountByType(companyId, UniversalAccountType.SALES),
      purchases: await this.findAccountByType(companyId, UniversalAccountType.PURCHASES),
      vatDeductible: await this.findAccountByType(companyId, UniversalAccountType.VAT_DEDUCTIBLE),
      vatCollected: await this.findAccountByType(companyId, UniversalAccountType.VAT_COLLECTED),
    };
  }
}
export default AccountMappingService;