import { BaseReportGenerator } from '../../../domain/reports/services/IReportGeneratorService';

import { Report, ReportParameters, ReportResult } from '../../../domain/reports/entities/Report';

import { IncomeStatementData } from '../../../domain/reports/entities/FinancialReport';

import { IReportRepository } from '../../../domain/reports/repositories/IReportRepository';



export class IncomeStatementGenerator extends BaseReportGenerator {

  constructor(private repository: IReportRepository) {

    super();

  }



  async generateReport(report: Report, parameters: ReportParameters): Promise<ReportResult> {

    const { result: incomeStatementData, duration } = await this.measureExecutionTime(async () => {

      return await this.generateIncomeStatementData(parameters);

    });



    const summary = this.generateSummary(incomeStatementData);



    return {

      data: incomeStatementData as unknown as Record<string, unknown>,

      metadata: {

        generatedAt: new Date(),

        dataPoints: this.countDataPoints(incomeStatementData),

        queryTime: duration,

        cacheHit: false

      },

      summary

    };

  }



  private async generateIncomeStatementData(parameters: ReportParameters): Promise<IncomeStatementData> {

    // Use Supabase RPC function for professional calculations

    const { supabase } = await import('../../../lib/supabase');



    const { data, error } = await supabase.rpc('get_income_statement_data', {

      p_company_id: parameters.companyId,

      p_date_from: parameters.dateFrom.toISOString().split('T')[0],

      p_date_to: parameters.dateTo.toISOString().split('T')[0]

    });



    if (error) {

      throw new Error(`Failed to generate income statement: ${error.message}`);

    }



    // Map the SQL result to our domain model

    return {

      revenue: data.revenue || {},

      expenses: data.expenses || {},

      margins: data.margins || {},

      net_income: data.net_income || 0

    };

  }





  private generateSummary(data: IncomeStatementData) {

    const totalRevenue = data.revenue.total || Object.values(data.revenue).reduce((sum, val) => sum + (val || 0), 0);

    const totalExpenses = data.expenses.total || Object.values(data.expenses).reduce((sum, val) => sum + (val || 0), 0);



    const grossMarginPercent = totalRevenue > 0 ? (data.margins.gross_margin / totalRevenue) * 100 : 0;

    const operatingMarginPercent = totalRevenue > 0 ? (data.margins.operating_margin / totalRevenue) * 100 : 0;

    const netMarginPercent = totalRevenue > 0 ? (data.margins.net_margin / totalRevenue) * 100 : 0;



    return {

      totalRevenue,

      totalExpenses,

      netIncome: data.net_income,

      grossMargin: grossMarginPercent,

      keyMetrics: {

        revenue: totalRevenue,

        gross_margin_percent: grossMarginPercent,

        operating_margin_percent: operatingMarginPercent,

        net_margin_percent: netMarginPercent,

        ebitda: data.margins.operating_margin + data.expenses.depreciation

      },

      insights: [

        `Chiffre d'affaires: ${this.formatCurrency(data.revenue.total)}`,

        `Marge brute: ${grossMarginPercent.toFixed(1)}%`,

        `Résultat net: ${this.formatCurrency(data.net_income)}`,

        data.net_income > 0 ? 'Exercice bénéficiaire' : 'Exercice déficitaire'

      ],

      recommendations: this.generateRecommendations(data)

    };

  }



  private generateRecommendations(data: IncomeStatementData): string[] {

    const recommendations: string[] = [];



    const grossMarginPercent = data.revenue.total > 0 ? (data.margins.gross_margin / data.revenue.total) * 100 : 0;

    const operatingMarginPercent = data.revenue.total > 0 ? (data.margins.operating_margin / data.revenue.total) * 100 : 0;



    if (grossMarginPercent < 30) {

      recommendations.push('Optimiser la marge brute - revoir les coûts d\'achat ou les prix de vente');

    }



    if (operatingMarginPercent < 10) {

      recommendations.push('Réduire les charges opérationnelles pour améliorer la rentabilité');

    }



    if (data.net_income < 0) {

      recommendations.push('Revoir la stratégie commerciale et contrôler les coûts');

    }



    const expenseToRevenueRatio = data.revenue.total > 0 ? (data.expenses.operating_expenses / data.revenue.total) * 100 : 0;

    if (expenseToRevenueRatio > 25) {

      recommendations.push('Analyser et optimiser les charges de fonctionnement');

    }



    return recommendations;

  }



  private countDataPoints(data: IncomeStatementData): number {

    return Object.keys(data.revenue).length +

           Object.keys(data.expenses).length +

           Object.keys(data.margins).length + 1; // +1 for net_income

  }



  private formatCurrency(amount: number): string {

    return new Intl.NumberFormat('fr-FR', {

      style: 'currency',

      currency: 'EUR'

    }).format(amount);

  }

}
