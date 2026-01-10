/**
 * CassKai - Automatic Financial Calculations Service
 * PHASE 3: Auto-calculate derived fields and financial metrics
 * 
 * Calculates:
 * - Balance sheet totals and sub-totals
 * - Income statement derivations
 * - Cash flow statements
 * - Financial ratios
 * - Tax calculations
 */

export interface CalculationContext {
  documentType: string;
  country: string;
  accountingStandard: string;
  fiscalYear: number;
  fiscalPeriod: string;
}

export interface CalculatedField {
  fieldId: string;
  value: number;
  formula: string;
  lastCalculated: Date;
  dependsOn: string[];
}

// ============================================================================
// AUTOMATIC CALCULATION ENGINE
// ============================================================================

export class AutomaticCalculationService {
  /**
   * Calculate all derived fields in a document
   */
  static calculateAllDerivedFields(
    documentData: any,
    context: CalculationContext
  ): {
    data: any;
    calculations: CalculatedField[];
  } {
    const calculations: CalculatedField[] = [];

    // Clone data to avoid mutations
    const calculatedData = { ...documentData };

    if (context.documentType === 'balance_sheet') {
      this.calculateBalanceSheetFields(calculatedData, calculations);
    } else if (context.documentType === 'income_statement') {
      this.calculateIncomeStatementFields(calculatedData, calculations);
    } else if (context.documentType === 'cash_flow') {
      this.calculateCashFlowFields(calculatedData, calculations);
    }

    return { data: calculatedData, calculations };
  }

  /**
   * Calculate Balance Sheet derived fields
   */
  private static calculateBalanceSheetFields(data: any, calculations: CalculatedField[]): void {
    // Assets Section
    if (data.fixed_assets !== undefined && data.accumulated_depreciation !== undefined) {
      data.net_fixed_assets = data.fixed_assets - data.accumulated_depreciation;
      calculations.push({
        fieldId: 'net_fixed_assets',
        value: data.net_fixed_assets,
        formula: 'fixed_assets - accumulated_depreciation',
        lastCalculated: new Date(),
        dependsOn: ['fixed_assets', 'accumulated_depreciation'],
      });
    }

    // Current Assets Total
    const currentAssetFields = ['inventories', 'accounts_receivable', 'cash', 'prepaid_expenses'];
    if (currentAssetFields.some(f => data[f] !== undefined)) {
      data.total_current_assets = currentAssetFields.reduce((sum, field) => sum + (data[field] || 0), 0);
      calculations.push({
        fieldId: 'total_current_assets',
        value: data.total_current_assets,
        formula: 'SUM(inventories, accounts_receivable, cash, prepaid_expenses)',
        lastCalculated: new Date(),
        dependsOn: currentAssetFields,
      });
    }

    // Total Assets
    if (data.net_fixed_assets !== undefined && data.total_current_assets !== undefined) {
      data.total_assets = data.net_fixed_assets + data.total_current_assets;
      calculations.push({
        fieldId: 'total_assets',
        value: data.total_assets,
        formula: 'net_fixed_assets + total_current_assets',
        lastCalculated: new Date(),
        dependsOn: ['net_fixed_assets', 'total_current_assets'],
      });
    }

    // Liabilities Section
    const currentLiabilityFields = [
      'accounts_payable',
      'short_term_debt',
      'current_portion_long_term_debt',
      'accrued_expenses',
    ];
    if (currentLiabilityFields.some(f => data[f] !== undefined)) {
      data.total_current_liabilities = currentLiabilityFields.reduce((sum, field) => sum + (data[field] || 0), 0);
      calculations.push({
        fieldId: 'total_current_liabilities',
        value: data.total_current_liabilities,
        formula: 'SUM(accounts_payable, short_term_debt, current_portion_long_term_debt, accrued_expenses)',
        lastCalculated: new Date(),
        dependsOn: currentLiabilityFields,
      });
    }

    // Total Liabilities
    if (
      data.total_current_liabilities !== undefined &&
      data.long_term_debt !== undefined
    ) {
      data.total_liabilities =
        data.total_current_liabilities + (data.long_term_debt || 0);
      calculations.push({
        fieldId: 'total_liabilities',
        value: data.total_liabilities,
        formula: 'total_current_liabilities + long_term_debt',
        lastCalculated: new Date(),
        dependsOn: ['total_current_liabilities', 'long_term_debt'],
      });
    }

    // Equity Section
    const equityFields = ['share_capital', 'retained_earnings', 'current_year_profit'];
    if (equityFields.some(f => data[f] !== undefined)) {
      data.total_equity = equityFields.reduce((sum, field) => sum + (data[field] || 0), 0);
      calculations.push({
        fieldId: 'total_equity',
        value: data.total_equity,
        formula: 'SUM(share_capital, retained_earnings, current_year_profit)',
        lastCalculated: new Date(),
        dependsOn: equityFields,
      });
    }

    // Total Liabilities + Equity
    if (data.total_liabilities !== undefined && data.total_equity !== undefined) {
      data.total_liabilities_and_equity = data.total_liabilities + data.total_equity;
      calculations.push({
        fieldId: 'total_liabilities_and_equity',
        value: data.total_liabilities_and_equity,
        formula: 'total_liabilities + total_equity',
        lastCalculated: new Date(),
        dependsOn: ['total_liabilities', 'total_equity'],
      });
    }

    // Working Capital
    const currentAssets = data.total_current_assets ?? data.current_assets;
    const currentLiabilities = data.total_current_liabilities ?? data.current_liabilities;

    if (currentAssets !== undefined && currentLiabilities !== undefined) {
      data.working_capital = currentAssets - currentLiabilities;
      calculations.push({
        fieldId: 'working_capital',
        value: data.working_capital,
        formula: 'current_assets - current_liabilities',
        lastCalculated: new Date(),
        dependsOn: ['current_assets', 'current_liabilities'],
      });
    }

    // Balance Check Difference
    if (data.total_assets !== undefined && data.total_liabilities_and_equity !== undefined) {
      data.balance_difference = Math.abs(data.total_assets - data.total_liabilities_and_equity);
      calculations.push({
        fieldId: 'balance_difference',
        value: data.balance_difference,
        formula: 'ABS(total_assets - total_liabilities_and_equity)',
        lastCalculated: new Date(),
        dependsOn: ['total_assets', 'total_liabilities_and_equity'],
      });
    }
  }

  /**
   * Calculate Income Statement derived fields
   */
  private static calculateIncomeStatementFields(
    data: any,
    calculations: CalculatedField[]
  ): void {
    // Cost of Goods Sold
    if (
      data.beginning_inventory !== undefined &&
      data.purchases !== undefined &&
      data.ending_inventory !== undefined
    ) {
      data.cost_of_goods_sold =
        data.beginning_inventory + data.purchases - data.ending_inventory;
      calculations.push({
        fieldId: 'cost_of_goods_sold',
        value: data.cost_of_goods_sold,
        formula:
          'beginning_inventory + purchases - ending_inventory',
        lastCalculated: new Date(),
        dependsOn: [
          'beginning_inventory',
          'purchases',
          'ending_inventory',
        ],
      });
    }

    // Gross Profit
    if (
      data.sales_revenue !== undefined &&
      (data.cost_of_goods_sold !== undefined || data.cost_of_sales !== undefined)
    ) {
      const cogs = data.cost_of_goods_sold || data.cost_of_sales;
      data.gross_profit = data.sales_revenue - cogs;
      calculations.push({
        fieldId: 'gross_profit',
        value: data.gross_profit,
        formula: 'sales_revenue - cost_of_goods_sold',
        lastCalculated: new Date(),
        dependsOn: ['sales_revenue', 'cost_of_goods_sold'],
      });
    }

    // Operating Expenses
    const operatingExpenseFields = [
      'salaries_and_wages',
      'depreciation',
      'amortization',
      'rent_and_utilities',
      'advertising',
      'office_supplies',
      'other_operating_expenses',
    ];
    if (operatingExpenseFields.some(f => data[f] !== undefined)) {
      data.total_operating_expenses = operatingExpenseFields.reduce(
        (sum, field) => sum + (data[field] || 0),
        0
      );
      calculations.push({
        fieldId: 'total_operating_expenses',
        value: data.total_operating_expenses,
        formula: `SUM(${operatingExpenseFields.join(', ')})`,
        lastCalculated: new Date(),
        dependsOn: operatingExpenseFields,
      });
    }

    // Operating Income (EBIT)
    if (
      data.gross_profit !== undefined &&
      data.total_operating_expenses !== undefined
    ) {
      data.operating_income = data.gross_profit - data.total_operating_expenses;
      calculations.push({
        fieldId: 'operating_income',
        value: data.operating_income,
        formula: 'gross_profit - total_operating_expenses',
        lastCalculated: new Date(),
        dependsOn: ['gross_profit', 'total_operating_expenses'],
      });
    }

    // EBITDA
    if (
      data.operating_income !== undefined &&
      data.depreciation !== undefined &&
      data.amortization !== undefined
    ) {
      data.ebitda =
        data.operating_income + (data.depreciation || 0) + (data.amortization || 0);
      calculations.push({
        fieldId: 'ebitda',
        value: data.ebitda,
        formula: 'operating_income + depreciation + amortization',
        lastCalculated: new Date(),
        dependsOn: ['operating_income', 'depreciation', 'amortization'],
      });
    }

    // Other Income/Expenses
    const otherExpenseFields = ['interest_expense', 'other_expenses', 'losses_on_investments'];
    if (otherExpenseFields.some(f => data[f] !== undefined)) {
      data.total_other_expenses = otherExpenseFields.reduce(
        (sum, field) => sum + (data[field] || 0),
        0
      );
      calculations.push({
        fieldId: 'total_other_expenses',
        value: data.total_other_expenses,
        formula: `SUM(${otherExpenseFields.join(', ')})`,
        lastCalculated: new Date(),
        dependsOn: otherExpenseFields,
      });
    }

    // Income Before Tax
    if (
      data.operating_income !== undefined &&
      data.total_other_expenses !== undefined
    ) {
      data.income_before_tax = data.operating_income - data.total_other_expenses;
      calculations.push({
        fieldId: 'income_before_tax',
        value: data.income_before_tax,
        formula: 'operating_income - total_other_expenses',
        lastCalculated: new Date(),
        dependsOn: ['operating_income', 'total_other_expenses'],
      });
    }

    // Income Tax Expense
    if (data.income_before_tax !== undefined && data.tax_rate === undefined) {
      // Use country default tax rate if not provided
      const defaultTaxRates: { [key: string]: number } = {
        FR: 0.28,
        SN: 0.30,
        CI: 0.25,
        CM: 0.30,
        KE: 0.30,
        NG: 0.30,
        DZ: 0.26,
        TN: 0.25,
        MA: 0.30,
      };
      const taxRate = defaultTaxRates[data.country] || 0.25;
      data.income_tax_expense = Math.max(0, data.income_before_tax * taxRate);
      calculations.push({
        fieldId: 'income_tax_expense',
        value: data.income_tax_expense,
        formula: `income_before_tax * ${taxRate}`,
        lastCalculated: new Date(),
        dependsOn: ['income_before_tax'],
      });
    }

    // Net Income
    if (
      data.income_before_tax !== undefined &&
      data.income_tax_expense !== undefined
    ) {
      data.net_income = data.income_before_tax - data.income_tax_expense;
      calculations.push({
        fieldId: 'net_income',
        value: data.net_income,
        formula: 'income_before_tax - income_tax_expense',
        lastCalculated: new Date(),
        dependsOn: ['income_before_tax', 'income_tax_expense'],
      });
    }

    // Calculate Profit Margins
    if (data.sales_revenue && data.sales_revenue !== 0) {
      data.gross_profit_margin = (data.gross_profit || 0) / data.sales_revenue;
      calculations.push({
        fieldId: 'gross_profit_margin',
        value: data.gross_profit_margin,
        formula: 'gross_profit / sales_revenue',
        lastCalculated: new Date(),
        dependsOn: ['gross_profit', 'sales_revenue'],
      });

      data.operating_profit_margin = (data.operating_income || 0) / data.sales_revenue;
      calculations.push({
        fieldId: 'operating_profit_margin',
        value: data.operating_profit_margin,
        formula: 'operating_income / sales_revenue',
        lastCalculated: new Date(),
        dependsOn: ['operating_income', 'sales_revenue'],
      });

      data.net_profit_margin = (data.net_income || 0) / data.sales_revenue;
      calculations.push({
        fieldId: 'net_profit_margin',
        value: data.net_profit_margin,
        formula: 'net_income / sales_revenue',
        lastCalculated: new Date(),
        dependsOn: ['net_income', 'sales_revenue'],
      });
    }
  }

  /**
   * Calculate Cash Flow Statement fields
   */
  private static calculateCashFlowFields(data: any, calculations: CalculatedField[]): void {
    // Net Cash from Operating Activities
    const operatingActivityFields = [
      'net_income',
      'depreciation',
      'amortization',
      'change_in_accounts_receivable',
      'change_in_inventory',
      'change_in_accounts_payable',
    ];
    if (operatingActivityFields.some(f => data[f] !== undefined)) {
      data.operating_cash_flow = operatingActivityFields.reduce(
        (sum, field) => sum + (data[field] || 0),
        0
      );
      calculations.push({
        fieldId: 'operating_cash_flow',
        value: data.operating_cash_flow,
        formula: `SUM(${operatingActivityFields.join(', ')})`,
        lastCalculated: new Date(),
        dependsOn: operatingActivityFields,
      });
    }

    // Net Cash from Investing Activities
    const investingActivityFields = [
      'capital_expenditures',
      'proceeds_from_sale_of_assets',
      'investments_purchased',
    ];
    if (investingActivityFields.some(f => data[f] !== undefined)) {
      data.investing_cash_flow = investingActivityFields.reduce(
        (sum, field) => sum + (data[field] || 0),
        0
      );
      calculations.push({
        fieldId: 'investing_cash_flow',
        value: data.investing_cash_flow,
        formula: `SUM(${investingActivityFields.join(', ')})`,
        lastCalculated: new Date(),
        dependsOn: investingActivityFields,
      });
    }

    // Net Cash from Financing Activities
    const financingActivityFields = [
      'proceeds_from_debt',
      'debt_repayment',
      'dividend_payments',
      'equity_issuance',
    ];
    if (financingActivityFields.some(f => data[f] !== undefined)) {
      data.financing_cash_flow = financingActivityFields.reduce(
        (sum, field) => sum + (data[field] || 0),
        0
      );
      calculations.push({
        fieldId: 'financing_cash_flow',
        value: data.financing_cash_flow,
        formula: `SUM(${financingActivityFields.join(', ')})`,
        lastCalculated: new Date(),
        dependsOn: financingActivityFields,
      });
    }

    // Net Change in Cash
    if (
      data.operating_cash_flow !== undefined &&
      data.investing_cash_flow !== undefined &&
      data.financing_cash_flow !== undefined
    ) {
      data.net_change_in_cash =
        data.operating_cash_flow +
        data.investing_cash_flow +
        data.financing_cash_flow;
      calculations.push({
        fieldId: 'net_change_in_cash',
        value: data.net_change_in_cash,
        formula:
          'operating_cash_flow + investing_cash_flow + financing_cash_flow',
        lastCalculated: new Date(),
        dependsOn: [
          'operating_cash_flow',
          'investing_cash_flow',
          'financing_cash_flow',
        ],
      });
    }

    // Ending Cash Balance
    if (
      data.beginning_cash !== undefined &&
      data.net_change_in_cash !== undefined
    ) {
      data.ending_cash = data.beginning_cash + data.net_change_in_cash;
      calculations.push({
        fieldId: 'ending_cash',
        value: data.ending_cash,
        formula: 'beginning_cash + net_change_in_cash',
        lastCalculated: new Date(),
        dependsOn: ['beginning_cash', 'net_change_in_cash'],
      });
    }
  }

  /**
   * Recalculate specific field and all dependent fields
   */
  static recalculateField(
    fieldId: string,
    documentData: any,
    context: CalculationContext
  ): any {
    // Re-run all calculations
    const { data } = this.calculateAllDerivedFields(documentData, context);
    return data;
  }

  /**
   * Get calculation metadata for a field
   */
  static getCalculationMetadata(
    fieldId: string,
    documentType: string
  ): CalculatedField | null {
    const calculations: CalculatedField[] = [];
    const dummyData = {};
    const dummyContext: CalculationContext = {
      documentType,
      country: 'FR',
      accountingStandard: 'PCG',
      fiscalYear: 2024,
      fiscalPeriod: 'ANNUAL',
    };

    const { calculations: allCalcs } = this.calculateAllDerivedFields(
      dummyData,
      dummyContext
    );

    return allCalcs.find(c => c.fieldId === fieldId) || null;
  }
}
