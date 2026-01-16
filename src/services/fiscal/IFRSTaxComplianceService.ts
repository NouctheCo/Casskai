/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 *
 * Service de conformité fiscale IFRS for SMEs
 * Couvre 4 pays anglophones d'Afrique
 */

import { BaseFiscalService } from './BaseFiscalService';
import type {
  FiscalDeclaration,
  CountryConfig,
} from '../../types/fiscal.types';

/**
 * Configuration des 4 pays IFRS
 */
const IFRS_COUNTRIES: Record<string, CountryConfig> = {
  NG: {
    name: 'Nigeria',
    currency: 'NGN',
    vatRate: 7.5,
    vatReducedRates: [],
    corporateTaxRate: 30,
    fiscalYearEnd: '12-31',
    taxFilingDeadline: '06-30',
    taxAuthority: 'Federal Inland Revenue Service (FIRS)',
    onlinePortal: 'https://www.firs.gov.ng'
  },
  KE: {
    name: 'Kenya',
    currency: 'KES',
    vatRate: 16,
    vatReducedRates: [],
    corporateTaxRate: 30,
    fiscalYearEnd: '12-31',
    taxFilingDeadline: '06-30',
    taxAuthority: 'Kenya Revenue Authority (KRA)',
    onlinePortal: 'https://www.kra.go.ke'
  },
  GH: {
    name: 'Ghana',
    currency: 'GHS',
    vatRate: 12.5,
    vatReducedRates: [],
    corporateTaxRate: 25,
    fiscalYearEnd: '12-31',
    taxFilingDeadline: '04-30',
    taxAuthority: 'Ghana Revenue Authority (GRA)',
    onlinePortal: 'https://www.gra.gov.gh'
  },
  ZA: {
    name: 'South Africa',
    currency: 'ZAR',
    vatRate: 15,
    vatReducedRates: [],
    corporateTaxRate: 27,
    fiscalYearEnd: '02-28',
    taxFilingDeadline: '10-31',
    taxAuthority: 'South African Revenue Service (SARS)',
    onlinePortal: 'https://www.sars.gov.za'
  }
};

export class IFRSTaxComplianceService extends BaseFiscalService {
  constructor() {
    super('IFRS');

    // Charger les configurations pays
    for (const [code, config] of Object.entries(IFRS_COUNTRIES)) {
      this.countryConfigs.set(code, config);
    }
  }

  /**
   * Génère le Balance Sheet (Bilan IFRS)
   */
  async generateBalanceSheet(
    companyId: string,
    period: string,
    country: string
  ): Promise<FiscalDeclaration> {
    const [year] = period.split('-');
    const endDate = new Date(`${year}-12-31`);
    const startDate = new Date(`${year}-01-01`);

    // Récupérer tous les comptes IFRS (classes 1-5)
    const allAccounts: string[] = [];
    for (let i = 1; i <= 5; i++) {
      for (let j = 0; j <= 9; j++) {
        for (let k = 0; k <= 9; k++) {
          allAccounts.push(`${i}${j}${k}0`);
        }
      }
    }

    const balances = await this.getAccountBalances(
      companyId,
      allAccounts,
      startDate,
      endDate
    );

    // ASSETS - Structure IFRS

    // Class 1: NON-CURRENT ASSETS
    const propertyPlantEquipment = this.getClassBalance('11', balances); // 1100-1190
    const intangibleAssets = this.getClassBalance('12', balances); // 1200-1290
    const investments = this.getClassBalance('13', balances); // 1300-1390
    const deferredTaxAssets = this.getClassBalance('14', balances); // 1400
    const otherNonCurrentAssets = this.getClassBalance('19', balances); // 1900

    const totalNonCurrentAssets =
      propertyPlantEquipment +
      intangibleAssets +
      investments +
      deferredTaxAssets +
      otherNonCurrentAssets;

    // Class 2: CURRENT ASSETS
    const inventories = this.getClassBalance('21', balances); // 2100-2190
    const tradeReceivables = this.getClassBalance('22', balances); // 2200-2290
    const otherReceivables = this.getClassBalance('23', balances); // 2300-2390
    const cashAndCashEquivalents = this.getClassBalance('24', balances); // 2400-2490
    const otherCurrentAssets = this.getClassBalance('29', balances); // 2900

    const totalCurrentAssets =
      inventories +
      tradeReceivables +
      otherReceivables +
      cashAndCashEquivalents +
      otherCurrentAssets;

    const totalAssets = totalNonCurrentAssets + totalCurrentAssets;

    // EQUITY AND LIABILITIES - Structure IFRS

    // Class 3: EQUITY
    const shareCapital = this.getClassBalance('31', balances); // 3100
    const sharePremium = this.getClassBalance('32', balances); // 3200
    const reserves = this.getClassBalance('33', balances); // 3300
    const retainedEarnings = this.getClassBalance('34', balances); // 3400
    const currentYearProfit = this.getClassBalance('35', balances); // 3500

    const totalEquity =
      shareCapital +
      sharePremium +
      reserves +
      retainedEarnings +
      currentYearProfit;

    // Class 4: NON-CURRENT LIABILITIES
    const longTermBorrowings = this.getClassBalance('41', balances); // 4100
    const deferredTaxLiabilities = this.getClassBalance('42', balances); // 4200
    const longTermProvisions = this.getClassBalance('43', balances); // 4300
    const otherNonCurrentLiabilities = this.getClassBalance('49', balances); // 4900

    const totalNonCurrentLiabilities =
      longTermBorrowings +
      deferredTaxLiabilities +
      longTermProvisions +
      otherNonCurrentLiabilities;

    // Class 5: CURRENT LIABILITIES
    const tradePayables = this.getClassBalance('51', balances); // 5100
    const shortTermBorrowings = this.getClassBalance('52', balances); // 5200
    const taxPayables = this.getClassBalance('53', balances); // 5300
    const employeeBenefitsPayable = this.getClassBalance('54', balances); // 5400
    const otherCurrentLiabilities = this.getClassBalance('59', balances); // 5900

    const totalCurrentLiabilities =
      tradePayables +
      shortTermBorrowings +
      taxPayables +
      employeeBenefitsPayable +
      otherCurrentLiabilities;

    const totalLiabilities = totalNonCurrentLiabilities + totalCurrentLiabilities;

    const totalEquityAndLiabilities = totalEquity + totalLiabilities;

    // Validation de l'équation comptable
    const validation = this.validateBalanceEquation(totalAssets, totalLiabilities, totalEquity);

    const countryConfig = this.getCountryConfig(country);
    const dueDate = new Date(`${parseInt(year) + 1}-${countryConfig?.taxFilingDeadline || '06-30'}`);

    const balanceSheetData = {
      period,
      country,
      currency: countryConfig?.currency || 'NGN',
      assets: {
        nonCurrent: {
          propertyPlantEquipment,
          intangibleAssets,
          investments,
          deferredTaxAssets,
          otherNonCurrentAssets,
          total: totalNonCurrentAssets
        },
        current: {
          inventories,
          tradeReceivables,
          otherReceivables,
          cashAndCashEquivalents,
          otherCurrentAssets,
          total: totalCurrentAssets
        },
        total: totalAssets
      },
      equityAndLiabilities: {
        equity: {
          shareCapital,
          sharePremium,
          reserves,
          retainedEarnings,
          currentYearProfit,
          total: totalEquity
        },
        liabilities: {
          nonCurrent: {
            longTermBorrowings,
            deferredTaxLiabilities,
            longTermProvisions,
            otherNonCurrentLiabilities,
            total: totalNonCurrentLiabilities
          },
          current: {
            tradePayables,
            shortTermBorrowings,
            taxPayables,
            employeeBenefitsPayable,
            otherCurrentLiabilities,
            total: totalCurrentLiabilities
          },
          total: totalLiabilities
        },
        total: totalEquityAndLiabilities
      }
    };

    const declaration: Omit<FiscalDeclaration, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'BALANCE_SHEET_IFRS',
      standard: 'IFRS',
      country,
      period,
      dueDate,
      status: validation.isValid ? 'ready' : 'draft',
      companyId,
      data: balanceSheetData,
      validationErrors: validation.errors,
      warnings: validation.warnings
    };

    const id = await this.saveFiscalDeclaration(declaration);

    return {
      ...declaration,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Génère l'Income Statement (Compte de Résultat IFRS)
   */
  async generateIncomeStatement(
    companyId: string,
    period: string,
    country: string
  ): Promise<FiscalDeclaration> {
    const [year] = period.split('-');
    const endDate = new Date(`${year}-12-31`);
    const startDate = new Date(`${year}-01-01`);

    // Récupérer les comptes IFRS (classes 6 et 7)
    const allAccounts: string[] = [];
    for (let i = 6; i <= 7; i++) {
      for (let j = 0; j <= 9; j++) {
        for (let k = 0; k <= 9; k++) {
          allAccounts.push(`${i}${j}${k}0`);
        }
      }
    }

    const balances = await this.getAccountBalances(
      companyId,
      allAccounts,
      startDate,
      endDate
    );

    // REVENUE (Class 6)
    const salesOfGoods = this.getClassBalance('611', balances); // 6110
    const servicesRevenue = this.getClassBalance('612', balances); // 6120
    const otherOperatingIncome = this.getClassBalance('62', balances); // 6200
    const financeIncome = this.getClassBalance('63', balances); // 6300

    const revenue = salesOfGoods + servicesRevenue;
    const totalIncome = revenue + otherOperatingIncome + financeIncome;

    // EXPENSES (Class 7)
    const costOfSales = this.getClassBalance('71', balances); // 7100
    const employeeBenefits = this.getClassBalance('72', balances); // 7200
    const depreciationAmortisation = this.getClassBalance('73', balances); // 7300
    const otherOperatingExpenses = this.getClassBalance('74', balances); // 7400
    const financeCosts = this.getClassBalance('75', balances); // 7500
    const taxExpense = this.getClassBalance('76', balances); // 7600
    const otherExpenses = this.getClassBalance('77', balances); // 7700

    const operatingExpenses =
      costOfSales +
      employeeBenefits +
      depreciationAmortisation +
      otherOperatingExpenses;

    const totalExpenses =
      operatingExpenses +
      financeCosts +
      taxExpense +
      otherExpenses;

    // RESULTS
    const grossProfit = revenue - costOfSales;
    const operatingProfit = revenue + otherOperatingIncome - operatingExpenses;
    const profitBeforeTax = operatingProfit + financeIncome - financeCosts;
    const profitAfterTax = profitBeforeTax - taxExpense - otherExpenses;

    // Validation
    const validation = this.validateIncomeStatement(
      totalIncome,
      totalExpenses,
      profitAfterTax
    );

    const countryConfig = this.getCountryConfig(country);
    const dueDate = new Date(`${parseInt(year) + 1}-${countryConfig?.taxFilingDeadline || '06-30'}`);

    const incomeStatementData = {
      period,
      country,
      currency: countryConfig?.currency || 'NGN',
      revenue: {
        salesOfGoods,
        servicesRevenue,
        totalRevenue: revenue,
        otherOperatingIncome,
        financeIncome
      },
      expenses: {
        costOfSales,
        grossProfit,
        operatingExpenses: {
          employeeBenefits,
          depreciationAmortisation,
          otherOperatingExpenses,
          total: operatingExpenses - costOfSales
        },
        financeCosts,
        taxExpense,
        otherExpenses
      },
      results: {
        grossProfit,
        operatingProfit,
        profitBeforeTax,
        profitAfterTax
      }
    };

    const declaration: Omit<FiscalDeclaration, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'INCOME_STATEMENT_IFRS',
      standard: 'IFRS',
      country,
      period,
      dueDate,
      status: validation.isValid ? 'ready' : 'draft',
      companyId,
      data: incomeStatementData,
      validationErrors: validation.errors,
      warnings: validation.warnings
    };

    const id = await this.saveFiscalDeclaration(declaration);

    return {
      ...declaration,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Génère le Cash Flow Statement (Tableau des Flux de Trésorerie)
   */
  async generateCashFlowStatement(
    companyId: string,
    period: string,
    country: string
  ): Promise<FiscalDeclaration> {
    // Le Cash Flow Statement nécessite de comparer deux périodes
    // Pour simplifier, on génère un statement basique

    const [year] = period.split('-');
    const countryConfig = this.getCountryConfig(country);
    const dueDate = new Date(`${parseInt(year) + 1}-${countryConfig?.taxFilingDeadline || '06-30'}`);

    const cashFlowData = {
      period,
      country,
      currency: countryConfig?.currency || 'NGN',
      note: 'Complete Cash Flow Statement requires comparison of two periods',
      operatingActivities: {
        profitBeforeTax: 0,
        adjustments: {
          depreciation: 0,
          interestExpense: 0,
          changes: 0
        },
        cashFromOperations: 0
      },
      investingActivities: {
        purchaseOfAssets: 0,
        proceedsFromDisposal: 0,
        netCashInvesting: 0
      },
      financingActivities: {
        proceedsFromBorrowings: 0,
        repaymentOfBorrowings: 0,
        dividendsPaid: 0,
        netCashFinancing: 0
      },
      netChangeInCash: 0,
      cashBeginning: 0,
      cashEnding: 0
    };

    const declaration: Omit<FiscalDeclaration, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'CASH_FLOW_STATEMENT_IFRS',
      standard: 'IFRS',
      country,
      period,
      dueDate,
      status: 'draft',
      companyId,
      data: cashFlowData,
      validationErrors: [],
      warnings: ['Cash Flow Statement requires full implementation with period comparison']
    };

    const id = await this.saveFiscalDeclaration(declaration);

    return {
      ...declaration,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Génère la déclaration de VAT/TVA
   */
  async generateVATDeclaration(
    companyId: string,
    period: string,
    country: string
  ): Promise<FiscalDeclaration> {
    const [year, month] = period.split('-');
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(parseInt(year, 10), parseInt(month, 10), 0);

    // Récupérer les comptes de VAT (classe 53)
    const vatAccounts: string[] = [];
    for (let i = 5300; i <= 5399; i++) {
      vatAccounts.push(i.toString());
    }

    const balances = await this.getAccountBalances(
      companyId,
      vatAccounts,
      startDate,
      endDate
    );

    const countryConfig = this.getCountryConfig(country);
    const vatRate = countryConfig?.vatRate || 15;

    // VAT on Sales (Output VAT) - Créditeur
    const outputVAT = Math.abs(this.getClassBalance('5310', balances, false));

    // VAT on Purchases (Input VAT) - Débiteur
    const inputVATOnAssets = this.getClassBalance('5320', balances);
    const inputVATOnExpenses = this.getClassBalance('5330', balances);
    const inputVAT = inputVATOnAssets + inputVATOnExpenses;

    // Net VAT
    const netVAT = outputVAT - inputVAT;
    const vatPayable = netVAT > 0 ? netVAT : 0;
    const vatRefund = netVAT < 0 ? Math.abs(netVAT) : 0;

    // Deadline: 15th of next month for most countries
    const dueDate = new Date(parseInt(year, 10), parseInt(month, 10), 15);

    const vatData = {
      period,
      country,
      currency: countryConfig?.currency || 'NGN',
      rate: vatRate,
      outputVAT,
      inputVAT: {
        onAssets: inputVATOnAssets,
        onExpenses: inputVATOnExpenses,
        total: inputVAT
      },
      netVAT,
      vatPayable,
      vatRefund
    };

    const declaration: Omit<FiscalDeclaration, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'VAT_RETURN',
      standard: 'IFRS',
      country,
      period,
      dueDate,
      status: 'ready',
      companyId,
      data: vatData,
      validationErrors: [],
      warnings: vatRefund > 0 ? ['VAT refund to be claimed'] : []
    };

    const id = await this.saveFiscalDeclaration(declaration);

    return {
      ...declaration,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Génère la déclaration PAYE (Pay As You Earn - Retenue à la source sur salaires)
   */
  async generatePAYEReturn(
    companyId: string,
    period: string,
    country: string
  ): Promise<FiscalDeclaration> {
    const [year, month] = period.split('-');
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(parseInt(year, 10), parseInt(month, 10), 0);

    // Récupérer les comptes de charges sociales (classe 54)
    const payeAccounts: string[] = [];
    for (let i = 5400; i <= 5499; i++) {
      payeAccounts.push(i.toString());
    }

    const balances = await this.getAccountBalances(
      companyId,
      payeAccounts,
      startDate,
      endDate
    );

    const countryConfig = this.getCountryConfig(country);

    // PAYE withheld from employees
    const payeWithheld = Math.abs(this.getClassBalance('5410', balances, false));

    // Social security contributions
    const employerContributions = this.getClassBalance('5420', balances);
    const employeeContributions = this.getClassBalance('5430', balances);

    const totalPayable = payeWithheld + employerContributions + employeeContributions;

    // Deadline: 9th of next month for most countries
    const dueDate = new Date(parseInt(year, 10), parseInt(month, 10), 9);

    const payeData = {
      period,
      country,
      currency: countryConfig?.currency || 'NGN',
      payeWithheld,
      socialSecurity: {
        employerContributions,
        employeeContributions,
        total: employerContributions + employeeContributions
      },
      totalPayable
    };

    const declaration: Omit<FiscalDeclaration, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'PAYE_RETURN',
      standard: 'IFRS',
      country,
      period,
      dueDate,
      status: 'ready',
      companyId,
      data: payeData,
      validationErrors: [],
      warnings: []
    };

    const id = await this.saveFiscalDeclaration(declaration);

    return {
      ...declaration,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Génère la déclaration d'impôt sur les sociétés (Corporate Tax)
   */
  async generateCorporateTaxDeclaration(
    companyId: string,
    period: string,
    country: string
  ): Promise<FiscalDeclaration> {
    // Récupérer l'Income Statement pour calculer le Corporate Tax
    const incomeStatement = await this.generateIncomeStatement(companyId, period, country);

    const countryConfig = this.getCountryConfig(country);
    const corporateTaxRate = countryConfig?.corporateTaxRate || 30;

    const profitBeforeTax = incomeStatement.data.results.profitBeforeTax;
    const taxableIncome = profitBeforeTax; // Simplification (sans ajustements)

    const corporateTax = taxableIncome > 0 ? taxableIncome * (corporateTaxRate / 100) : 0;

    const [year] = period.split('-');
    const dueDate = new Date(`${parseInt(year) + 1}-${countryConfig?.taxFilingDeadline || '06-30'}`);

    const corporateTaxData = {
      period,
      country,
      currency: countryConfig?.currency || 'NGN',
      rate: corporateTaxRate,
      accountingProfit: profitBeforeTax,
      adjustments: {
        addBack: 0,
        deductions: 0,
        total: 0
      },
      taxableIncome,
      taxComputed: corporateTax,
      taxCredits: 0,
      taxPayable: corporateTax
    };

    const declaration: Omit<FiscalDeclaration, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'CORPORATE_TAX_RETURN',
      standard: 'IFRS',
      country,
      period,
      dueDate,
      status: 'ready',
      companyId,
      data: corporateTaxData,
      validationErrors: [],
      warnings: taxableIncome < 0 ? ['Tax loss carried forward'] : []
    };

    const id = await this.saveFiscalDeclaration(declaration);

    return {
      ...declaration,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}
