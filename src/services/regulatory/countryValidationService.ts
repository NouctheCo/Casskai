/**
 * CassKai - Country-Specific Validation Service
 * PHASE 3: Dynamic validation rules by country
 * 
 * Validates:
 * - Financial statement completeness
 * - Country-specific tax requirements
 * - Accounting standard compliance
 * - Warning thresholds (ratios, amounts, etc.)
 */

import { COUNTRY_WORKFLOWS, FINANCIAL_RATIOS } from '@/constants/countryWorkflows';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  info: ValidationInfo[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'critical' | 'error';
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  suggestedAction?: string;
}

export interface ValidationInfo {
  code: string;
  message: string;
  type: 'info' | 'success';
}

export interface FinancialData {
  [key: string]: number;
}

// ============================================================================
// COUNTRY-SPECIFIC VALIDATION SERVICE
// ============================================================================

export class CountryValidationService {
  /**
   * Validate document against country-specific rules
   */
  static validateDocument(
    documentData: FinancialData,
    documentType: string,
    country: string,
    accountingStandard: string
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      info: [],
    };

    const workflow = COUNTRY_WORKFLOWS[country as keyof typeof COUNTRY_WORKFLOWS];
    if (!workflow) {
      result.errors.push({
        code: 'UNKNOWN_COUNTRY',
        message: `Country ${country} not configured`,
        severity: 'error',
      });
      return result;
    }

    // Run type-specific validations
    if (documentType === 'balance_sheet') {
      this.validateBalanceSheet(documentData, workflow, result);
    } else if (documentType === 'income_statement') {
      this.validateIncomeStatement(documentData, workflow, result);
    } else if (documentType === 'cash_flow') {
      this.validateCashFlow(documentData, workflow, result);
    }

    // Run tax-specific validations
    if (country === 'FR') {
      this.validateFRTaxRules(documentData, result);
    } else if (['SN', 'CI', 'CM'].includes(country)) {
      this.validateSYSCOHADATaxRules(documentData, country, result);
    } else if (['KE', 'NG'].includes(country)) {
      this.validateIFRSTaxRules(documentData, country, result);
    }

    result.isValid = result.errors.filter(e => e.severity === 'critical').length === 0;
    return result;
  }

  /**
   * Validate Balance Sheet structure and completeness
   */
  private static validateBalanceSheet(
    data: FinancialData,
    workflow: (typeof COUNTRY_WORKFLOWS)[keyof typeof COUNTRY_WORKFLOWS],
    result: ValidationResult
  ): void {
    const validations = (workflow.validations as any).balanceSheet;
    if (!validations) return;

    // Check required fields
    // If totals are present, missing detail fields are warnings, not errors
    const hasTotals = data.total_assets !== undefined && data.total_liabilities_equity !== undefined;

    if (validations.requiredFields) {
      for (const field of validations.requiredFields) {
        if (data[field] === undefined || data[field] === null) {
          if (hasTotals) {
            // Totals are present, so missing details are just warnings
            result.warnings.push({
              code: 'MISSING_DETAIL_FIELD',
              message: `Detail field missing (but totals are provided): ${field}`,
              field,
              suggestedAction: 'Provide detailed breakdown for better analysis',
            });
          } else {
            // No totals, missing fields are critical
            result.errors.push({
              code: 'MISSING_REQUIRED_FIELD',
              message: `Required field missing: ${field}`,
              field,
              severity: 'critical',
            });
          }
        }
      }
    }

    // Check balance equation: Assets = Liabilities + Equity
    if (data.total_assets && data.total_liabilities_equity) {
      const difference = Math.abs(data.total_assets - data.total_liabilities_equity);
      const tolerance = validations.equalityTolerance || 0.01;
      const threshold = data.total_assets * tolerance;

      if (difference > threshold) {
        result.errors.push({
          code: 'BALANCE_NOT_EQUAL',
          message: `Balance sheet does not balance. Difference: ${difference.toFixed(2)}`,
          severity: 'critical',
        });
      } else if (difference > 0) {
        result.warnings.push({
          code: 'BALANCE_SMALL_DIFFERENCE',
          message: `Minor rounding difference in balance: ${difference.toFixed(2)}`,
          suggestedAction: 'Review and adjust if necessary',
        });
      }
    }

    // Check equity ratio
    if (data.total_equity && data.total_assets && validations.minEquityRatio) {
      const equityRatio = data.total_equity / data.total_assets;
      if (equityRatio < validations.minEquityRatio) {
        result.warnings.push({
          code: 'LOW_EQUITY_RATIO',
          message: `Equity ratio (${(equityRatio * 100).toFixed(1)}%) below recommended minimum (${(validations.minEquityRatio * 100).toFixed(1)}%)`,
          suggestedAction: 'Review capital structure and solvency',
        });
      }
    }

    // Check asset composition
    if (
      data.current_assets &&
      data.total_assets &&
      validations.assetTurnaroundWarning
    ) {
      const currentAssetRatio = data.current_assets / data.total_assets;
      if (currentAssetRatio < validations.assetTurnaroundWarning) {
        result.warnings.push({
          code: 'LOW_CURRENT_ASSET_RATIO',
          message: `Current assets are only ${(currentAssetRatio * 100).toFixed(1)}% of total assets`,
          suggestedAction: 'Review working capital management',
        });
      }
    }

    result.info.push({
      code: 'BALANCE_SHEET_VALIDATED',
      message: 'Balance sheet structure is valid',
      type: 'success',
    });
  }

  /**
   * Validate Income Statement structure and completeness
   */
  private static validateIncomeStatement(
    data: FinancialData,
    workflow: (typeof COUNTRY_WORKFLOWS)[keyof typeof COUNTRY_WORKFLOWS],
    result: ValidationResult
  ): void {
    const validations = (workflow.validations as any).incomeStatement;

    // If no income statement validations defined, skip
    if (!validations) {
      return;
    }

    // Check required fields
    // If key fields (sales_revenue and net_income) are present, missing detail fields are warnings
    const hasKeyFields = data.sales_revenue !== undefined && data.net_income !== undefined;

    if (validations.requiredFields) {
      for (const field of validations.requiredFields) {
        if (data[field] === undefined || data[field] === null) {
          if (hasKeyFields && field === 'total_expenses') {
            // total_expenses can be derived if we have revenue and net_income
            result.warnings.push({
              code: 'MISSING_DETAIL_FIELD',
              message: `Detail field missing (but can be derived): ${field}`,
              field,
              suggestedAction: 'Provide expense breakdown for better analysis',
            });
          } else if (hasKeyFields) {
            // Other missing fields are warnings if key fields present
            result.warnings.push({
              code: 'MISSING_DETAIL_FIELD',
              message: `Detail field missing: ${field}`,
              field,
              suggestedAction: 'Provide detailed breakdown',
            });
          } else {
            // Key fields missing, this is critical
            result.errors.push({
              code: 'MISSING_INCOME_FIELD',
              message: `Required income statement field missing: ${field}`,
              field,
              severity: 'critical',
            });
          }
        }
      }
    }

    // Check profit margin
    if (data.net_income !== undefined && data.sales_revenue && data.sales_revenue !== 0) {
      const profitMargin = data.net_income / data.sales_revenue;
      if (profitMargin <= validations.profitMarginThresholdWarning) {
        result.warnings.push({
          code: 'LOW_PROFIT_MARGIN',
          message: `Profit margin (${(profitMargin * 100).toFixed(1)}%) is negative or very low`,
          suggestedAction: 'Review pricing and cost structure',
        });
      }
    }

    // Check depreciation ratio
    if (
      data.depreciation &&
      data.fixed_assets &&
      data.fixed_assets !== 0 &&
      validations.depreciationWarning
    ) {
      const depreciationRatio = data.depreciation / data.fixed_assets;
      if (depreciationRatio > validations.depreciationWarning) {
        result.warnings.push({
          code: 'HIGH_DEPRECIATION',
          message: `Depreciation (${(depreciationRatio * 100).toFixed(1)}%) is higher than typical (${(validations.depreciationWarning * 100).toFixed(1)}%)`,
          suggestedAction: 'Verify asset useful lives and depreciation methods',
        });
      }
    }

    result.info.push({
      code: 'INCOME_STATEMENT_VALIDATED',
      message: 'Income statement structure is valid',
      type: 'success',
    });
  }

  /**
   * Validate Cash Flow statement
   */
  private static validateCashFlow(
    data: FinancialData,
    workflow: (typeof COUNTRY_WORKFLOWS)[keyof typeof COUNTRY_WORKFLOWS],
    result: ValidationResult
  ): void {
    // Basic structure validation
    if (
      !data.operating_cash_flow &&
      !data.investing_cash_flow &&
      !data.financing_cash_flow
    ) {
      result.warnings.push({
        code: 'MISSING_CASH_FLOW_COMPONENTS',
        message: 'Cash flow statement missing standard components',
      });
    }

    result.info.push({
      code: 'CASH_FLOW_VALIDATED',
      message: 'Cash flow statement structure is valid',
      type: 'success',
    });
  }

  /**
   * Validate France-specific tax rules (TVA, corporate tax)
   */
  private static validateFRTaxRules(data: FinancialData, result: ValidationResult): void {
    const fr = COUNTRY_WORKFLOWS.FR.validations;

    // TVA threshold check
    if (data.total_revenue && data.total_revenue > fr.vat.thresholdForVATRegistration) {
      result.info.push({
        code: 'VAT_REGISTRATION_REQUIRED',
        message: `Revenue (${data.total_revenue.toFixed(2)} EUR) exceeds VAT registration threshold (${fr.vat.thresholdForVATRegistration} EUR)`,
        type: 'info',
      });
    }

    // Intracom threshold
    if (data.intracom_sales && data.intracom_sales > fr.vat.thresholdForIntracommunitySales) {
      result.warnings.push({
        code: 'INTRACOM_THRESHOLD_EXCEEDED',
        message: 'Intracom sales exceed reporting threshold',
        suggestedAction: 'Ensure EC Sales List (ESL) reporting',
      });
    }
  }

  /**
   * Validate SYSCOHADA-specific rules (Senegal, Côte d'Ivoire, Cameroon)
   */
  private static validateSYSCOHADATaxRules(
    data: FinancialData,
    country: string,
    result: ValidationResult
  ): void {
    const workflow = COUNTRY_WORKFLOWS[country as keyof typeof COUNTRY_WORKFLOWS];
    if (!workflow) return;

    const validations = workflow.validations;

    // Check for SCAAN threshold (Senegal)
    if (country === 'SN' && 'scaan' in validations) {
      const scaanThreshold = (validations as any).scaan?.mandatoryForCompaniesOver;
      if (scaanThreshold && data.total_revenue > scaanThreshold) {
        result.info.push({
          code: 'SCAAN_MANDATORY',
          message: `Company exceeds SCAAN threshold (${scaanThreshold.toLocaleString()} CFA). Audit is mandatory.`,
          type: 'info',
        });
      }
    }
  }

  /**
   * Validate IFRS-specific rules (Kenya, Nigeria)
   */
  private static validateIFRSTaxRules(
    data: FinancialData,
    country: string,
    result: ValidationResult
  ): void {
    const workflow = COUNTRY_WORKFLOWS[country as keyof typeof COUNTRY_WORKFLOWS];
    if (!workflow) return;

    // IFRS for SMEs specific checks
    const validations = workflow.validations;

    if ('ifrs' in validations && (validations as any).ifrs?.impairmentTesting) {
      result.info.push({
        code: 'IMPAIRMENT_TESTING_REQUIRED',
        message: 'IFRS for SMEs requires annual impairment testing of assets',
        type: 'info',
      });
    }
  }

  /**
   * Calculate financial ratios for a document
   */
  static calculateFinancialRatios(documentData: FinancialData): {
    [key: string]: {
      value: number;
      status: 'optimal' | 'warning' | 'critical' | 'info';
      message: string;
    };
  } {
    const results: {
      [key: string]: {
        value: number;
        status: 'optimal' | 'warning' | 'critical' | 'info';
        message: string;
      };
    } = {};

    // Current Ratio
    if (documentData.current_assets && documentData.current_liabilities) {
      const ratio = documentData.current_assets / documentData.current_liabilities;
      const current = FINANCIAL_RATIOS.currentRatio;
      results.currentRatio = {
        value: ratio,
        status:
          ratio < current.warningThreshold
            ? 'critical'
            : ratio < current.optimalRange.min
              ? 'warning'
              : ratio > current.optimalRange.max
                ? 'warning'
                : 'optimal',
        message: `Current Ratio: ${ratio.toFixed(2)} (optimal: ${current.optimalRange.min}-${current.optimalRange.max})`,
      };
    }

    // Debt to Equity Ratio
    if (documentData.total_debt && documentData.total_equity) {
      const ratio = documentData.total_debt / documentData.total_equity;
      const debtToEquity = FINANCIAL_RATIOS.debtToEquity;
      results.debtToEquity = {
        value: ratio,
        status:
          ratio > debtToEquity.warningThreshold
            ? 'critical'
            : ratio > debtToEquity.optimalRange.max
              ? 'warning'
              : 'optimal',
        message: `Debt-to-Equity: ${ratio.toFixed(2)} (optimal: ${debtToEquity.optimalRange.min}-${debtToEquity.optimalRange.max})`,
      };
    }

    // Net Profit Margin
    if (documentData.net_income && documentData.sales_revenue) {
      const ratio = documentData.net_income / documentData.sales_revenue;
      const npm = FINANCIAL_RATIOS.netProfitMargin;
      results.netProfitMargin = {
        value: ratio,
        status:
          ratio < npm.warningThreshold
            ? 'warning'
            : ratio < npm.optimalRange.min
              ? 'info'
              : ratio > npm.optimalRange.max
                ? 'info'
                : 'optimal',
        message: `Net Profit Margin: ${(ratio * 100).toFixed(1)}% (optimal: ${(npm.optimalRange.min * 100).toFixed(1)}-${(npm.optimalRange.max * 100).toFixed(1)}%)`,
      };
    }

    // Return on Assets (ROA)
    if (documentData.net_income && documentData.total_assets) {
      const ratio = documentData.net_income / documentData.total_assets;
      const roa = FINANCIAL_RATIOS.returnOnAssets;
      results.returnOnAssets = {
        value: ratio,
        status:
          ratio < roa.optimalRange.min ? 'warning' : ratio > roa.optimalRange.max ? 'info' : 'optimal',
        message: `ROA: ${(ratio * 100).toFixed(1)}% (optimal: ${(roa.optimalRange.min * 100).toFixed(1)}-${(roa.optimalRange.max * 100).toFixed(1)}%)`,
      };
    }

    // Return on Equity (ROE)
    if (documentData.net_income && documentData.total_equity) {
      const ratio = documentData.net_income / documentData.total_equity;
      const roe = FINANCIAL_RATIOS.returnOnEquity;
      results.returnOnEquity = {
        value: ratio,
        status:
          ratio < roe.optimalRange.min ? 'warning' : ratio > roe.optimalRange.max ? 'info' : 'optimal',
        message: `ROE: ${(ratio * 100).toFixed(1)}% (optimal: ${(roe.optimalRange.min * 100).toFixed(1)}-${(roe.optimalRange.max * 100).toFixed(1)}%)`,
      };
    }

    // Asset Turnover
    if (documentData.sales_revenue && documentData.total_assets) {
      const ratio = documentData.sales_revenue / documentData.total_assets;
      const assetTurnover = FINANCIAL_RATIOS.assetTurnover;
      results.assetTurnover = {
        value: ratio,
        status:
          ratio < assetTurnover.optimalRange.min
            ? 'warning'
            : ratio > assetTurnover.optimalRange.max
              ? 'info'
              : 'optimal',
        message: `Asset Turnover: ${ratio.toFixed(2)}x (optimal: ${assetTurnover.optimalRange.min}-${assetTurnover.optimalRange.max})`,
      };
    }

    return results;
  }

  /**
   * Get country-specific filing requirements and deadlines
   */
  static getFilingRequirements(country: string, fiscalYearEnd: Date): any {
    const workflow = COUNTRY_WORKFLOWS[country as keyof typeof COUNTRY_WORKFLOWS];
    if (!workflow) return null;

    const filingReqs = (workflow.validations as any).filingRequirements;
    return {
      country,
      taxAuthority: workflow.taxAuthority,
      requirements: filingReqs,
      fiscalYearEnd,
      nextFilingDeadline: this.calculateFilingDeadline(country, fiscalYearEnd),
    };
  }

  /**
   * Calculate next filing deadline based on country and fiscal year
   */
  private static calculateFilingDeadline(country: string, fiscalYearEnd: Date): Date {
    const deadlineDays: { [key: string]: number } = {
      FR: 150, // 5 months after fiscal year end
      SN: 120, // ~4 months (March 31st typically)
      CI: 120,
      CM: 120,
      KE: 210, // 7 months (June 30th)
      NG: 90, // 90 days
      DZ: 105, // ~3.5 months (April 15th)
      TN: 90, // ~3 months (March 31st)
      MA: 90, // ~3 months (March 31st)
    };

    const days = deadlineDays[country] || 120;
    const deadline = new Date(fiscalYearEnd);
    deadline.setDate(deadline.getDate() + days);
    return deadline;
  }
}
