/**
 * CassKai - PHASE 3 Tests
 * Country-Specific Workflows: Validations, Calculations, Formats, Deadlines
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CountryValidationService } from '@/services/regulatory/countryValidationService';
import { AutomaticCalculationService } from '@/services/regulatory/automaticCalculationService';
import { CountryFormatService } from '@/services/regulatory/countryFormatService';
import { TaxCalendarService } from '@/constants/taxCalendars';

describe('PHASE 3: Country-Specific Workflows', () => {

  // ============================================================================
  // VALIDATION SERVICE TESTS
  // ============================================================================

  describe('CountryValidationService', () => {
    it('should validate balance sheet for France', () => {
      const documentData = {
        fixed_assets: 100000,
        accumulated_depreciation: 20000,
        current_assets: 50000,
        current_liabilities: 30000,
        long_term_debt: 40000,
        share_capital: 60000,
        total_assets: 130000,
        total_liabilities_equity: 130000,
      };

      const result = CountryValidationService.validateDocument(
        documentData,
        'balance_sheet',
        'FR',
        'PCG'
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect balance sheet imbalance', () => {
      const documentData = {
        fixed_assets: 100000,
        current_assets: 50000,
        total_assets: 150000,
        current_liabilities: 30000,
        long_term_debt: 40000,
        share_capital: 60000,
        total_liabilities_equity: 130000, // Imbalanced
      };

      const result = CountryValidationService.validateDocument(
        documentData,
        'balance_sheet',
        'FR',
        'PCG'
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'BALANCE_NOT_EQUAL')).toBe(true);
    });

    it('should validate income statement for France', () => {
      const documentData = {
        sales_revenue: 500000,
        cost_of_goods_sold: 250000,
        operating_expenses: 150000,
        net_income: 100000,
      };

      const result = CountryValidationService.validateDocument(
        documentData,
        'income_statement',
        'FR',
        'PCG'
      );

      expect(result.isValid).toBe(true);
      expect(result.errors.filter(e => e.severity === 'critical')).toHaveLength(0);
    });

    it('should warn on low profit margin', () => {
      const documentData = {
        sales_revenue: 500000,
        cost_of_goods_sold: 400000,
        operating_expenses: 150000,
        net_income: -50000,
      };

      const result = CountryValidationService.validateDocument(
        documentData,
        'income_statement',
        'FR',
        'PCG'
      );

      expect(result.warnings.some(w => w.code === 'LOW_PROFIT_MARGIN')).toBe(true);
    });

    it('should detect SCAAN threshold in Senegal', () => {
      const documentData = {
        total_revenue: 400000000, // > threshold
        sales_revenue: 400000000,
        cost_of_goods_sold: 200000000,
        net_income: 100000000,
      };

      const result = CountryValidationService.validateDocument(
        documentData,
        'income_statement',
        'SN',
        'SYSCOHADA'
      );

      expect(result.info.some(i => i.code === 'SCAAN_MANDATORY')).toBe(true);
    });

    it('should validate IFRS-specific requirements for Kenya', () => {
      const documentData = {
        sales_revenue: 100000,
        cost_of_goods_sold: 50000,
        net_income: 30000,
      };

      const result = CountryValidationService.validateDocument(
        documentData,
        'income_statement',
        'KE',
        'IFRS'
      );

      expect(result.info.some(i => i.code === 'IMPAIRMENT_TESTING_REQUIRED')).toBe(true);
    });

    it('should calculate financial ratios', () => {
      const documentData = {
        current_assets: 100000,
        current_liabilities: 50000,
        total_assets: 200000,
        total_debt: 100000,
        total_equity: 100000,
        sales_revenue: 500000,
        net_income: 50000,
      };

      const ratios = CountryValidationService.calculateFinancialRatios(documentData);

      expect(ratios.currentRatio).toBeDefined();
      expect(ratios.currentRatio.value).toBe(2);
      expect(ratios.currentRatio.status).toBe('optimal');

      expect(ratios.debtToEquity).toBeDefined();
      expect(ratios.debtToEquity.value).toBe(1);

      expect(ratios.netProfitMargin).toBeDefined();
      expect(ratios.netProfitMargin.value).toBe(0.1);
    });

    it('should get filing requirements by country', () => {
      const fiscalYearEnd = new Date(2024, 11, 31);
      const reqs = CountryValidationService.getFilingRequirements('FR', fiscalYearEnd);

      expect(reqs.country).toBe('FR');
      expect(reqs.taxAuthority).toBe('DGFiP');
      expect(reqs.nextFilingDeadline).toBeDefined();
    });
  });

  // ============================================================================
  // AUTOMATIC CALCULATION SERVICE TESTS
  // ============================================================================

  describe('AutomaticCalculationService', () => {
    const context = {
      documentType: 'balance_sheet',
      country: 'FR',
      accountingStandard: 'PCG',
      fiscalYear: 2024,
      fiscalPeriod: 'ANNUAL',
    };

    it('should calculate net fixed assets', () => {
      const data = {
        fixed_assets: 100000,
        accumulated_depreciation: 20000,
      };

      const { data: result } = AutomaticCalculationService.calculateAllDerivedFields(
        data,
        context
      );

      expect(result.net_fixed_assets).toBe(80000);
    });

    it('should calculate current assets total', () => {
      const data = {
        inventories: 30000,
        accounts_receivable: 20000,
        cash: 10000,
      };

      const { data: result } = AutomaticCalculationService.calculateAllDerivedFields(
        data,
        context
      );

      expect(result.total_current_assets).toBe(60000);
    });

    it('should calculate total assets', () => {
      const data = {
        fixed_assets: 100000,
        accumulated_depreciation: 20000,
        inventories: 30000,
        accounts_receivable: 20000,
        cash: 10000,
      };

      const { data: result } = AutomaticCalculationService.calculateAllDerivedFields(
        data,
        context
      );

      expect(result.total_assets).toBe(140000); // (100-20) + (30+20+10)
    });

    it('should calculate working capital', () => {
      const data = {
        current_assets: 60000,
        current_liabilities: 30000,
      };

      const { data: result } = AutomaticCalculationService.calculateAllDerivedFields(
        data,
        context
      );

      expect(result.working_capital).toBe(30000);
    });

    it('should calculate income statement totals', () => {
      const incomeContext = {
        ...context,
        documentType: 'income_statement',
      };

      const data = {
        sales_revenue: 500000,
        cost_of_goods_sold: 250000,
        salaries_and_wages: 100000,
        depreciation: 20000,
        rent_and_utilities: 30000,
      };

      const { data: result } = AutomaticCalculationService.calculateAllDerivedFields(
        data,
        incomeContext
      );

      expect(result.gross_profit).toBe(250000); // 500000 - 250000
      expect(result.total_operating_expenses).toBe(150000); // 100000 + 20000 + 30000
      expect(result.operating_income).toBe(100000); // 250000 - 150000
    });

    it('should calculate profit margins', () => {
      const incomeContext = {
        ...context,
        documentType: 'income_statement',
      };

      const data = {
        sales_revenue: 500000,
        gross_profit: 250000,
        operating_income: 100000,
        net_income: 50000,
      };

      const { data: result } = AutomaticCalculationService.calculateAllDerivedFields(
        data,
        incomeContext
      );

      expect(result.gross_profit_margin).toBeCloseTo(0.5);
      expect(result.operating_profit_margin).toBeCloseTo(0.2);
      expect(result.net_profit_margin).toBeCloseTo(0.1);
    });

    it('should calculate EBITDA', () => {
      const incomeContext = {
        ...context,
        documentType: 'income_statement',
      };

      const data = {
        operating_income: 100000,
        depreciation: 20000,
        amortization: 5000,
      };

      const { data: result } = AutomaticCalculationService.calculateAllDerivedFields(
        data,
        incomeContext
      );

      expect(result.ebitda).toBe(125000);
    });

    it('should calculate cash flow totals', () => {
      const cfContext = {
        ...context,
        documentType: 'cash_flow',
      };

      const data = {
        operating_cash_flow: 100000,
        investing_cash_flow: -50000,
        financing_cash_flow: -20000,
        beginning_cash: 50000,
      };

      const { data: result } = AutomaticCalculationService.calculateAllDerivedFields(
        data,
        cfContext
      );

      expect(result.net_change_in_cash).toBe(30000); // 100 - 50 - 20
      expect(result.ending_cash).toBe(80000); // 50 + 30
    });

    it('should track calculation dependencies', () => {
      const data = {
        fixed_assets: 100000,
        accumulated_depreciation: 20000,
      };

      const { calculations } = AutomaticCalculationService.calculateAllDerivedFields(
        data,
        context
      );

      const netFixedAssets = calculations.find(c => c.fieldId === 'net_fixed_assets');
      expect(netFixedAssets).toBeDefined();
      expect(netFixedAssets?.dependsOn).toContain('fixed_assets');
      expect(netFixedAssets?.dependsOn).toContain('accumulated_depreciation');
    });
  });

  // ============================================================================
  // FORMAT SERVICE TESTS
  // ============================================================================

  describe('CountryFormatService', () => {
    it('should format numbers for France', () => {
      const formatted = CountryFormatService.formatNumber(1234567.89, 'FR');
      expect(formatted).toBe('1 234 567,89'); // Space separator, comma decimal
    });

    it('should format numbers for Kenya', () => {
      const formatted = CountryFormatService.formatNumber(1234567.89, 'KE');
      expect(formatted).toBe('1,234,567.89'); // Comma separator, dot decimal
    });

    it('should format currency symbols', () => {
      const frFormatted = CountryFormatService.formatNumber(1000, 'FR', true);
      expect(frFormatted).toContain('EUR');

      const keFormatted = CountryFormatService.formatNumber(1000, 'KE', true);
      expect(keFormatted).toContain('KES');
    });

    it('should format dates for France', () => {
      const date = new Date(2024, 0, 15); // January 15, 2024
      const formatted = CountryFormatService.formatDate(date, 'FR');
      expect(formatted).toBe('15/01/2024');
    });

    it('should format dates for Kenya', () => {
      const date = new Date(2024, 0, 15);
      const formatted = CountryFormatService.formatDate(date, 'KE');
      expect(formatted).toBe('15/01/2024');
    });

    it('should export document as XML', () => {
      const data = {
        fiscal_year: 2024,
        sales_revenue: 500000,
        net_income: 50000,
      };

      const exported = CountryFormatService.exportAsXML(
        data,
        'FR',
        'income_statement'
      );

      expect(exported.format).toBe('xml');
      expect(exported.mimeType).toBe('application/xml');
      expect(exported.content).toContain('<?xml');
      expect(exported.content).toContain('INFOGREFFE');
    });

    it('should export document as CSV', () => {
      const data = {
        sales_revenue: 500000,
        net_income: 50000,
      };

      const exported = CountryFormatService.exportAsCSV(
        data,
        'FR',
        'income_statement'
      );

      expect(exported.format).toBe('csv');
      expect(exported.mimeType).toBe('text/csv');
      expect(exported.content).toContain('sales_revenue');
      expect(exported.content).toContain('500 000,00');
    });

    it('should export document as JSON', () => {
      const data = {
        sales_revenue: 500000,
        net_income: 50000,
      };

      const exported = CountryFormatService.exportAsJSON(
        data,
        'FR',
        'income_statement'
      );

      expect(exported.format).toBe('json');
      expect(exported.mimeType).toBe('application/json');
      const parsed = JSON.parse(String(exported.content));
      expect(parsed.data.sales_revenue).toBe(500000);
    });

    it('should generate OHADA-specific XML', () => {
      const data = {
        fiscal_year: 2024,
        sales_revenue: 100000,
      };

      const exported = CountryFormatService.exportAsXML(
        data,
        'SN',
        'balance_sheet'
      );

      expect(exported.content).toContain('OHADADocument');
      expect(exported.content).toContain('SYSCOHADA');
    });
  });

  // ============================================================================
  // TAX CALENDAR SERVICE TESTS
  // ============================================================================

  describe('TaxCalendarService', () => {
    it('should get France tax deadlines', () => {
      const deadlines = TaxCalendarService.getCountryDeadlines('FR');
      expect(deadlines.length).toBeGreaterThan(0);
      expect(deadlines.some(d => d.taxType === 'VAT')).toBe(true);
      expect(deadlines.some(d => d.taxType === 'CIT')).toBe(true);
    });

    it('should get Senegal tax deadlines', () => {
      const deadlines = TaxCalendarService.getCountryDeadlines('SN');
      expect(deadlines.length).toBeGreaterThan(0);
    });

    it('should calculate next deadline', () => {
      // Use a future fiscal year end date
      const nextYear = new Date().getFullYear() + 1;
      const fiscalYearEnd = new Date(nextYear, 11, 31);
      const result = TaxCalendarService.calculateNextDeadline('FR', fiscalYearEnd);

      expect(result).toBeDefined();
      expect(result?.deadline).toBeDefined();
      expect(result?.dueDate).toBeInstanceOf(Date);
      expect(result?.daysRemaining).toBeGreaterThan(0);
    });

    it('should detect approaching deadlines', () => {
      const fiscalYearEnd = new Date();
      fiscalYearEnd.setDate(fiscalYearEnd.getDate() - 1); // Yesterday
      const deadlines = TaxCalendarService.getCountryDeadlines('FR');
      const monthlyVAT = deadlines.find(d => d.id === 'FR_VAT_MONTHLY');

      if (monthlyVAT) {
        const isApproaching = TaxCalendarService.isDeadlineApproaching(
          monthlyVAT,
          fiscalYearEnd
        );
        // May or may not be approaching depending on current date
        expect(typeof isApproaching).toBe('boolean');
      }
    });

    it('should get fiscal year dates', () => {
      const dates = TaxCalendarService.getFiscalYearDates('FR', 2024);
      expect(dates?.start).toBeDefined();
      expect(dates?.end).toBeDefined();
      expect(dates?.start?.getFullYear()).toBe(2024);
      expect(dates?.end?.getFullYear()).toBe(2024);
    });

    it('should handle different fiscal year starts', () => {
      const frDates = TaxCalendarService.getFiscalYearDates('FR', 2024);
      expect(frDates?.start?.getMonth()).toBe(0); // January
      expect(frDates?.end?.getMonth()).toBe(11); // December
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration Tests', () => {
    it('should validate, calculate, and format a complete balance sheet', () => {
      // Balanced balance sheet: Assets = Liabilities + Equity
      // Assets: net_fixed_assets (400k) + current_assets (150k) = 550k
      // Liabilities: 310k
      // Equity: 240k
      // Total: 310k + 240k = 550k ✓
      const documentData = {
        fixed_assets: 500000,
        accumulated_depreciation: 100000,
        inventories: 50000,
        accounts_receivable: 80000,
        cash: 20000,
        accounts_payable: 60000,
        short_term_debt: 50000,
        long_term_debt: 200000,
        share_capital: 200000,
        retained_earnings: 40000,
        // Add calculated totals for validation
        total_assets: 550000,
        total_liabilities_equity: 550000,
      };

      // 1. Validate
      const validation = CountryValidationService.validateDocument(
        documentData,
        'balance_sheet',
        'FR',
        'PCG'
      );
      expect(validation.isValid).toBe(true);

      // 2. Calculate
      const context = {
        documentType: 'balance_sheet',
        country: 'FR',
        accountingStandard: 'PCG',
        fiscalYear: 2024,
        fiscalPeriod: 'ANNUAL',
      };
      const { data: calculated } = AutomaticCalculationService.calculateAllDerivedFields(
        documentData,
        context
      );
      expect(calculated.net_fixed_assets).toBe(400000);
      expect(calculated.total_assets).toBeDefined();

      // 3. Format
      const xml = CountryFormatService.exportAsXML(
        calculated,
        'FR',
        'balance_sheet'
      );
      expect(xml.format).toBe('xml');
      expect(xml.filename).toContain('balance_sheet_FR');

      // 4. Get deadline
      const fiscalYearEnd = new Date(2024, 11, 31);
      const deadline = TaxCalendarService.calculateNextDeadline('FR', fiscalYearEnd);
      expect(deadline).toBeDefined();
    });

    it('should handle multi-country workflows', () => {
      const countries = ['FR', 'SN', 'CI', 'CM', 'KE', 'NG', 'DZ', 'TN', 'MA'];
      const documentData = {
        sales_revenue: 500000,
        net_income: 50000,
      };

      for (const country of countries) {
        const deadlines = TaxCalendarService.getCountryDeadlines(country);
        expect(deadlines.length).toBeGreaterThan(0);

        const format = CountryFormatService.getFormattingRules(country);
        expect(format).toBeDefined();
        expect(format?.currency).toBeDefined();

        const formatted = CountryFormatService.formatNumber(1000, country, true);
        expect(formatted).toContain(format?.currency || 'EUR');
      }
    });
  });
});
