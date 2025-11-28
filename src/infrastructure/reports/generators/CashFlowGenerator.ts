import { BaseReportGenerator } from '../../../domain/reports/services/IReportGeneratorService';

import { Report, ReportParameters, ReportResult } from '../../../domain/reports/entities/Report';

import { IReportRepository } from '../../../domain/reports/repositories/IReportRepository';



interface CashFlowData {

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



export class CashFlowGenerator extends BaseReportGenerator {

  constructor(private repository: IReportRepository) {

    super();

  }



  async generateReport(report: Report, parameters: ReportParameters): Promise<ReportResult> {

    const { result: cashFlowData, duration } = await this.measureExecutionTime(async () => {

      return await this.generateCashFlowData(parameters);

    });



    const summary = this.generateSummary(cashFlowData);



    return {

      data: cashFlowData as unknown as Record<string, unknown>,

      metadata: {

        generatedAt: new Date(),

        dataPoints: this.countDataPoints(cashFlowData),

        queryTime: duration,

        cacheHit: false

      },

      summary

    };

  }



  private async generateCashFlowData(parameters: ReportParameters): Promise<CashFlowData> {

    // Use Supabase RPC function for professional calculations

    const { supabase } = await import('../../../lib/supabase');



    const { data, error } = await supabase.rpc('get_cash_flow_data', {

      p_company_id: parameters.companyId,

      p_date_from: parameters.dateFrom.toISOString().split('T')[0],

      p_date_to: parameters.dateTo.toISOString().split('T')[0]

    });



    if (error) {

      throw new Error(`Failed to generate cash flow: ${error.message}`);

    }



    // Map the SQL result to our domain model

    return data;

  }



  private generateSummary(data: CashFlowData) {

    const operatingCashFlow = data.operating_activities.total;

    const investingCashFlow = data.investing_activities.total;

    const financingCashFlow = data.financing_activities.total;

    const freeCashFlow = operatingCashFlow + investingCashFlow;



    return {

      keyMetrics: {

        operating_cash_flow: operatingCashFlow,

        investing_cash_flow: investingCashFlow,

        financing_cash_flow: financingCashFlow,

        free_cash_flow: freeCashFlow,

        net_cash_change: data.net_cash_change,

        beginning_cash: data.beginning_cash,

        ending_cash: data.ending_cash

      },

      insights: [

        `Flux de trésorerie opérationnel: ${this.formatCurrency(operatingCashFlow)}`,

        `Flux de trésorerie libre: ${this.formatCurrency(freeCashFlow)}`,

        `Variation nette de trésorerie: ${this.formatCurrency(data.net_cash_change)}`,

        operatingCashFlow > 0 ? 'Génération de trésorerie opérationnelle positive' : 'Attention: Flux opérationnel négatif'

      ],

      recommendations: this.generateRecommendations(data)

    };

  }



  private generateRecommendations(data: CashFlowData): string[] {

    const recommendations: string[] = [];



    // Operating cash flow analysis

    if (data.operating_activities.total < 0) {

      recommendations.push('Améliorer la génération de trésorerie opérationnelle');

    }



    // Working capital analysis

    if (data.operating_activities.working_capital_changes < -10000) {

      recommendations.push('Optimiser la gestion du besoin en fonds de roulement');

    }



    // Investment analysis

    if (data.investing_activities.capital_expenditures > data.operating_activities.total * 0.8) {

      recommendations.push('Évaluer l\'équilibre entre investissements et génération de trésorerie');

    }



    // Cash position analysis

    if (data.ending_cash < data.beginning_cash * 0.5) {

      recommendations.push('Surveiller la position de trésorerie et planifier le financement');

    }



    // Free cash flow analysis

    const freeCashFlow = data.operating_activities.total + data.investing_activities.total;

    if (freeCashFlow < 0) {

      recommendations.push('Améliorer la génération de flux de trésorerie disponibles');

    }



    return recommendations;

  }



  private countDataPoints(data: CashFlowData): number {

    return Object.keys(data.operating_activities).length +

           Object.keys(data.investing_activities).length +

           Object.keys(data.financing_activities).length + 3; // +3 for the totals

  }



  private formatCurrency(amount: number): string {

    return new Intl.NumberFormat('fr-FR', {

      style: 'currency',

      currency: 'EUR'

    }).format(amount);

  }

}
