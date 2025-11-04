import { BaseReportGenerator } from '../../../domain/reports/services/IReportGeneratorService';
import { Report, ReportParameters, ReportResult } from '../../../domain/reports/entities/Report';
import { FinancialStatementData, AssetCategory, LiabilityCategory } from '../../../domain/reports/entities/FinancialReport';
import { IReportRepository } from '../../../domain/reports/repositories/IReportRepository';

export class BalanceSheetGenerator extends BaseReportGenerator {
  constructor(private repository: IReportRepository) {
    super();
  }

  async generateReport(report: Report, parameters: ReportParameters): Promise<ReportResult> {
    const { result: balanceSheetData, duration } = await this.measureExecutionTime(async () => {
      return await this.generateBalanceSheetData(parameters);
    });

    const summary = this.generateSummary(balanceSheetData);

    return {
      data: balanceSheetData,
      metadata: {
        generatedAt: new Date(),
        dataPoints: this.countDataPoints(balanceSheetData),
        queryTime: duration,
        cacheHit: false
      },
      summary
    };
  }

  private async generateBalanceSheetData(parameters: ReportParameters): Promise<FinancialStatementData> {
    // Use Supabase RPC function for professional calculations
    const { supabase } = await import('../../../lib/supabase');

    const { data, error } = await supabase.rpc('get_balance_sheet_data', {
      p_company_id: parameters.companyId,
      p_date_from: parameters.dateFrom.toISOString().split('T')[0],
      p_date_to: parameters.dateTo.toISOString().split('T')[0]
    });

    if (error) {
      throw new Error(`Failed to generate balance sheet: ${error.message}`);
    }

    // Map the SQL result to our domain model
    return {
      assets: {
        current: data.assets.current || {},
        nonCurrent: data.assets.nonCurrent || {},
        total: data.assets.total || 0
      },
      liabilities: {
        current: data.liabilities.current || {},
        nonCurrent: data.liabilities.nonCurrent || {},
        total: data.liabilities.total || 0
      },
      equity: {
        share_capital: data.equity.share_capital || 0,
        retained_earnings: data.equity.retained_earnings || 0,
        current_year_result: data.equity.current_year_result || 0,
        total: data.equity.total || 0
      }
    };
  }


  private generateSummary(data: FinancialStatementData) {
    const totalAssets = data.assets.total;
    const totalLiabilities = data.liabilities.total;
    const totalEquity = data.equity.total;

    const debtToEquityRatio = totalEquity > 0 ? totalLiabilities / totalEquity : 0;

    // Calculate current ratio from the aggregated totals
    const currentAssets = Object.values(data.assets.current).reduce((sum, val) => sum + (val || 0), 0);
    const currentLiabilities = Object.values(data.liabilities.current).reduce((sum, val) => sum + (val || 0), 0);
    const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;

    return {
      keyMetrics: {
        total_assets: totalAssets,
        total_liabilities: totalLiabilities,
        total_equity: totalEquity,
        debt_to_equity_ratio: debtToEquityRatio,
        current_ratio: currentRatio
      },
      insights: [
        `Total des actifs: ${this.formatCurrency(totalAssets)}`,
        `Ratio d'endettement: ${(debtToEquityRatio * 100).toFixed(1)}%`,
        totalEquity > 0 ? 'Capitaux propres positifs' : 'Attention: Capitaux propres négatifs'
      ],
      recommendations: this.generateRecommendations(data)
    };
  }

  private generateRecommendations(data: FinancialStatementData): string[] {
    const recommendations: string[] = [];

    const currentRatio = data.liabilities.current.total > 0 ?
      (data.assets.current.total) / data.liabilities.current.total : 0;

    if (currentRatio < 1) {
      recommendations.push('Améliorer la liquidité à court terme');
    }

    if (data.equity.total < data.assets.total * 0.3) {
      recommendations.push('Renforcer la structure financière');
    }

  const cashAndEquivalents = data.assets.current?.cash_and_equivalents ?? 0;

  if (cashAndEquivalents < data.assets.total * 0.1) {
      recommendations.push('Optimiser la gestion de trésorerie');
    }

    return recommendations;
  }

  private countDataPoints(data: FinancialStatementData): number {
    return Object.keys(data.assets).length +
           Object.keys(data.liabilities).length +
           Object.keys(data.equity).length;
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }
}
