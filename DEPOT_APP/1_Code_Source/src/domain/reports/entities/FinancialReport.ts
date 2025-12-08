import { Report, ReportMetadata } from './Report';



export interface FinancialStatementData {

  assets: {

    current: AssetCategory;

    nonCurrent: AssetCategory;

    total: number;

  };

  liabilities: {

    current: LiabilityCategory;

    nonCurrent: LiabilityCategory;

    total: number;

  };

  equity: {

    share_capital: number;

    retained_earnings: number;

    current_year_result: number;

    total: number;

  };

}



export interface AssetCategory {

  cash_and_equivalents: number;

  accounts_receivable: number;

  inventory: number;

  prepaid_expenses: number;

  fixed_assets: number;

  intangible_assets: number;

  investments: number;

  other: number;

  total: number;

}



export interface LiabilityCategory {

  accounts_payable: number;

  short_term_debt: number;

  accrued_expenses: number;

  long_term_debt: number;

  deferred_revenue: number;

  other: number;

  total: number;

}



export interface IncomeStatementData {

  revenue: {

    operating_revenue: number;

    other_revenue: number;

    total: number;

  };

  expenses: {

    cost_of_goods_sold: number;

    operating_expenses: number;

    depreciation: number;

    interest_expense: number;

    tax_expense: number;

    other_expenses: number;

    total: number;

  };

  margins: {

    gross_margin: number;

    operating_margin: number;

    net_margin: number;

  };

  net_income: number;

}



export interface CashFlowData {

  operating_activities: {

    net_income: number;

    depreciation: number;

    working_capital_changes: number;

    other_adjustments: number;

    total: number;

  };

  investing_activities: {

    capital_expenditures: number;

    acquisitions: number;

    asset_sales: number;

    investments: number;

    total: number;

  };

  financing_activities: {

    debt_changes: number;

    equity_changes: number;

    dividends: number;

    other: number;

    total: number;

  };

  net_cash_change: number;

  beginning_cash: number;

  ending_cash: number;

}



export interface FinancialRatios {

  liquidity: {

    current_ratio: number;

    quick_ratio: number;

    cash_ratio: number;

  };

  profitability: {

    gross_margin: number;

    operating_margin: number;

    net_margin: number;

    roa: number;

    roe: number;

  };

  leverage: {

    debt_to_equity: number;

    debt_to_assets: number;

    interest_coverage: number;

  };

  efficiency: {

    asset_turnover: number;

    inventory_turnover: number;

    receivables_turnover: number;

  };

}



export class FinancialReport extends Report {

  constructor(

    metadata: ReportMetadata,

    public readonly financialData?: FinancialStatementData | IncomeStatementData | CashFlowData

  ) {

    super(metadata);

  }



  validateData(): ValidationResult {

    if (!this.financialData) {

      return { isValid: false, errors: ['No financial data provided'] };

    }



    const errors: string[] = [];



    // Validate balance sheet equilibrium

    if ('assets' in this.financialData) {

      const balanceSheet = this.financialData as FinancialStatementData;

      const assetsTotal = balanceSheet.assets.total;

      const liabilitiesAndEquity = balanceSheet.liabilities.total + balanceSheet.equity.total;



      if (Math.abs(assetsTotal - liabilitiesAndEquity) > 0.01) {

        errors.push('Balance sheet does not balance');

      }

    }



    return { isValid: errors.length === 0, errors };

  }



  calculateKPIs(): Record<string, number> {

    if (!this.financialData) return {};



    const kpis: Record<string, number> = {};



    if ('revenue' in this.financialData) {

      const incomeStatement = this.financialData as IncomeStatementData;

      kpis.gross_margin_percent = (incomeStatement.margins.gross_margin / incomeStatement.revenue.total) * 100;

      kpis.net_margin_percent = (incomeStatement.margins.net_margin / incomeStatement.revenue.total) * 100;

    }



    return kpis;

  }

}



interface ValidationResult {

  isValid: boolean;

  errors: string[];

}
