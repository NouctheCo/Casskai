import { supabase } from '../lib/supabase';
import {
  ForecastData,
  ForecastScenario,
  ForecastPeriod,
  ForecastFormData,
  ScenarioFormData,
  ForecastFilters,
  ForecastServiceResponse,
  ForecastDashboardData,
  WhatIfAnalysis,
  ForecastComparison,
  ForecastChart,
  ChartDataPoint,
  RevenueLineItem,
  ExpenseLineItem,
  CashFlowItem
} from '../types/forecasts.types';

export class ForecastsService {
  // Scenarios
  async getScenarios(companyId: string): Promise<ForecastServiceResponse<ForecastScenario[]>> {
    try {
      const { data, error } = await supabase
        .from('forecast_scenarios')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const scenarios: ForecastScenario[] = data?.map(scenario => ({
        id: scenario.id,
        name: scenario.name,
        description: scenario.description,
        type: scenario.type,
        growth_rate: scenario.growth_rate,
        market_conditions: scenario.market_conditions,
        created_at: scenario.created_at,
        updated_at: scenario.updated_at
      })) || [];

      return { data: scenarios };
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      return {
        data: [],
        error: { message: 'Erreur lors de la récupération des scénarios' }
      };
    }
  }

  async createScenario(companyId: string, formData: ScenarioFormData): Promise<ForecastServiceResponse<ForecastScenario>> {
    try {
      const scenarioPayload = {
        company_id: companyId,
        name: formData.name,
        description: formData.description,
        type: formData.type,
        growth_rate: formData.growth_rate,
        market_conditions: formData.market_conditions
      };

      const { data: scenario, error } = await supabase
        .from('forecast_scenarios')
        .insert([scenarioPayload])
        .select()
        .single();

      if (error) throw error;

      const result: ForecastScenario = {
        id: scenario.id,
        name: scenario.name,
        description: scenario.description,
        type: scenario.type,
        growth_rate: scenario.growth_rate,
        market_conditions: scenario.market_conditions,
        created_at: scenario.created_at,
        updated_at: scenario.updated_at
      };

      return { data: result };
    } catch (error) {
      console.error('Error creating scenario:', error);
      return {
        data: {} as ForecastScenario,
        error: { message: 'Erreur lors de la création du scénario' }
      };
    }
  }

  async updateScenario(id: string, formData: Partial<ScenarioFormData>): Promise<ForecastServiceResponse<ForecastScenario>> {
    try {
      const updatePayload: Record<string, any> = {};
      if (formData.name) updatePayload.name = formData.name;
      if (formData.description !== undefined) updatePayload.description = formData.description;
      if (formData.type) updatePayload.type = formData.type;
      if (formData.growth_rate !== undefined) updatePayload.growth_rate = formData.growth_rate;
      if (formData.market_conditions) updatePayload.market_conditions = formData.market_conditions;

      const { data: scenario, error } = await supabase
        .from('forecast_scenarios')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const result: ForecastScenario = {
        id: scenario.id,
        name: scenario.name,
        description: scenario.description,
        type: scenario.type,
        growth_rate: scenario.growth_rate,
        market_conditions: scenario.market_conditions,
        created_at: scenario.created_at,
        updated_at: scenario.updated_at
      };

      return { data: result };
    } catch (error) {
      console.error('Error updating scenario:', error);
      return {
        data: {} as ForecastScenario,
        error: { message: 'Erreur lors de la mise à jour du scénario' }
      };
    }
  }

  async deleteScenario(id: string): Promise<ForecastServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('forecast_scenarios')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { data: true };
    } catch (error) {
      console.error('Error deleting scenario:', error);
      return {
        data: false,
        error: { message: 'Erreur lors de la suppression du scénario' }
      };
    }
  }

  // Periods
  async getPeriods(companyId: string): Promise<ForecastServiceResponse<ForecastPeriod[]>> {
    try {
      const { data, error } = await supabase
        .from('forecast_periods')
        .select('*')
        .eq('company_id', companyId)
        .order('start_date', { ascending: false });

      if (error) throw error;

      const periods: ForecastPeriod[] = data?.map(period => ({
        id: period.id,
        name: period.name,
        start_date: period.start_date,
        end_date: period.end_date,
        period_type: period.period_type,
        enterprise_id: period.company_id, // Map company_id to enterprise_id for compatibility
        created_at: period.created_at
      })) || [];

      return { data: periods };
    } catch (error) {
      console.error('Error fetching periods:', error);
      return {
        data: [],
        error: { message: 'Erreur lors de la récupération des périodes' }
      };
    }
  }

  async createPeriod(companyId: string, periodData: Omit<ForecastPeriod, 'id' | 'created_at'>): Promise<ForecastServiceResponse<ForecastPeriod>> {
    try {
      const periodPayload = {
        company_id: companyId,
        name: periodData.name,
        start_date: periodData.start_date,
        end_date: periodData.end_date,
        period_type: periodData.period_type
      };

      const { data: period, error } = await supabase
        .from('forecast_periods')
        .insert([periodPayload])
        .select()
        .single();

      if (error) throw error;

      const result: ForecastPeriod = {
        id: period.id,
        name: period.name,
        start_date: period.start_date,
        end_date: period.end_date,
        period_type: period.period_type,
        enterprise_id: period.company_id,
        created_at: period.created_at
      };

      return { data: result };
    } catch (error) {
      console.error('Error creating period:', error);
      return {
        data: {} as ForecastPeriod,
        error: { message: 'Erreur lors de la création de la période' }
      };
    }
  }

  // Forecasts
  async getForecasts(companyId: string, filters?: ForecastFilters): Promise<ForecastServiceResponse<ForecastData[]>> {
    try {
      let query = supabase
        .from('forecasts')
        .select(`
          *,
          forecast_scenarios (
            id,
            name,
            description,
            type,
            growth_rate,
            market_conditions
          ),
          forecast_periods (
            id,
            name,
            start_date,
            end_date,
            period_type
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters) {
        if (filters.search) {
          query = query.ilike('name', `%${filters.search}%`);
        }

        if (filters.scenario_id) {
          query = query.eq('scenario_id', filters.scenario_id);
        }

        if (filters.status) {
          query = query.eq('status', filters.status);
        }

        if (filters.period_id) {
          query = query.eq('period_id', filters.period_id);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to match expected format
      const forecasts: ForecastData[] = data?.map(forecast => ({
        id: forecast.id,
        name: forecast.name,
        period_id: forecast.period_id,
        scenario_id: forecast.scenario_id,
        enterprise_id: forecast.company_id,
        revenue_items: forecast.revenue_items || [],
        total_revenue: forecast.total_revenue || 0,
        expense_items: forecast.expense_items || [],
        total_expenses: forecast.total_expenses || 0,
        cash_flow_items: forecast.cash_flow_items || [],
        net_cash_flow: forecast.net_cash_flow || 0,
        gross_margin: forecast.gross_margin || 0,
        net_margin: forecast.net_margin || 0,
        break_even_point: forecast.break_even_point || 0,
        status: forecast.status,
        created_by: forecast.created_by,
        created_at: forecast.created_at,
        updated_at: forecast.updated_at,
        key_assumptions: forecast.key_assumptions || [],
        risk_factors: forecast.risk_factors || [],
        opportunities: forecast.opportunities || []
      })) || [];

      return { data: forecasts };
    } catch (error) {
      console.error('Error fetching forecasts:', error);
      return {
        data: [],
        error: { message: 'Erreur lors de la récupération des prévisions' }
      };
    }
  }

  async getForecastById(id: string): Promise<ForecastServiceResponse<ForecastData>> {
    try {
      const { data, error } = await supabase
        .from('forecasts')
        .select(`
          *,
          forecast_scenarios (
            id,
            name,
            description,
            type,
            growth_rate,
            market_conditions
          ),
          forecast_periods (
            id,
            name,
            start_date,
            end_date,
            period_type
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        return {
          data: {} as ForecastData,
          error: { message: 'Prévision non trouvée' }
        };
      }

      const forecast: ForecastData = {
        id: data.id,
        name: data.name,
        period_id: data.period_id,
        scenario_id: data.scenario_id,
        enterprise_id: data.company_id,
        revenue_items: data.revenue_items || [],
        total_revenue: data.total_revenue || 0,
        expense_items: data.expense_items || [],
        total_expenses: data.total_expenses || 0,
        cash_flow_items: data.cash_flow_items || [],
        net_cash_flow: data.net_cash_flow || 0,
        gross_margin: data.gross_margin || 0,
        net_margin: data.net_margin || 0,
        break_even_point: data.break_even_point || 0,
        status: data.status,
        created_by: data.created_by,
        created_at: data.created_at,
        updated_at: data.updated_at,
        key_assumptions: data.key_assumptions || [],
        risk_factors: data.risk_factors || [],
        opportunities: data.opportunities || []
      };

      return { data: forecast };
    } catch (error) {
      console.error('Error fetching forecast by ID:', error);
      return {
        data: {} as ForecastData,
        error: { message: 'Erreur lors de la récupération de la prévision' }
      };
    }
  }

  async createForecast(companyId: string, formData: ForecastFormData, userId: string): Promise<ForecastServiceResponse<ForecastData>> {
    try {
      // Calculate totals
      const totalRevenue = formData.revenue_items?.reduce((sum, item) => sum + item.amount, 0) || 0;
      const totalExpenses = formData.expense_items?.reduce((sum, item) => sum + item.amount, 0) || 0;
      const netCashFlow = formData.cash_flow_items?.reduce((sum, item) => sum + item.amount, 0) || 0;
      const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;
      const netMargin = totalRevenue > 0 ? (netCashFlow / totalRevenue) * 100 : 0;
      const breakEvenPoint = totalExpenses; // Simplified calculation

      const forecastPayload = {
        company_id: companyId,
        name: formData.name,
        period_id: formData.period_id,
        scenario_id: formData.scenario_id,
        revenue_items: formData.revenue_items || [],
        total_revenue: totalRevenue,
        expense_items: formData.expense_items || [],
        total_expenses: totalExpenses,
        cash_flow_items: formData.cash_flow_items || [],
        net_cash_flow: netCashFlow,
        gross_margin: grossMargin,
        net_margin: netMargin,
        break_even_point: breakEvenPoint,
        status: 'draft',
        created_by: userId,
        key_assumptions: formData.key_assumptions || [],
        risk_factors: formData.risk_factors || [],
        opportunities: formData.opportunities || []
      };

      const { data: forecast, error } = await supabase
        .from('forecasts')
        .insert([forecastPayload])
        .select()
        .single();

      if (error) throw error;

      const result: ForecastData = {
        id: forecast.id,
        name: forecast.name,
        period_id: forecast.period_id,
        scenario_id: forecast.scenario_id,
        enterprise_id: forecast.company_id,
        revenue_items: forecast.revenue_items || [],
        total_revenue: forecast.total_revenue || 0,
        expense_items: forecast.expense_items || [],
        total_expenses: forecast.total_expenses || 0,
        cash_flow_items: forecast.cash_flow_items || [],
        net_cash_flow: forecast.net_cash_flow || 0,
        gross_margin: forecast.gross_margin || 0,
        net_margin: forecast.net_margin || 0,
        break_even_point: forecast.break_even_point || 0,
        status: forecast.status,
        created_by: forecast.created_by,
        created_at: forecast.created_at,
        updated_at: forecast.updated_at,
        key_assumptions: forecast.key_assumptions || [],
        risk_factors: forecast.risk_factors || [],
        opportunities: forecast.opportunities || []
      };

      return { data: result };
    } catch (error) {
      console.error('Error creating forecast:', error);
      return {
        data: {} as ForecastData,
        error: { message: 'Erreur lors de la création de la prévision' }
      };
    }
  }

  async updateForecast(id: string, formData: Partial<ForecastFormData>): Promise<ForecastServiceResponse<ForecastData>> {
    try {
      const updatePayload: Record<string, any> = {};

      if (formData.name) updatePayload.name = formData.name;
      if (formData.period_id) updatePayload.period_id = formData.period_id;
      if (formData.scenario_id) updatePayload.scenario_id = formData.scenario_id;

      // Recalculate totals if items changed
      if (formData.revenue_items || formData.expense_items || formData.cash_flow_items) {
        const { data: currentForecast } = await supabase
          .from('forecasts')
          .select('revenue_items, expense_items, cash_flow_items')
          .eq('id', id)
          .single();

        if (currentForecast) {
          const revenueItems = formData.revenue_items || currentForecast.revenue_items || [];
          const expenseItems = formData.expense_items || currentForecast.expense_items || [];
          const cashFlowItems = formData.cash_flow_items || currentForecast.cash_flow_items || [];

          const totalRevenue = revenueItems.reduce((sum, item) => sum + item.amount, 0);
          const totalExpenses = expenseItems.reduce((sum, item) => sum + item.amount, 0);
          const netCashFlow = cashFlowItems.reduce((sum, item) => sum + item.amount, 0);
          const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;
          const netMargin = totalRevenue > 0 ? (netCashFlow / totalRevenue) * 100 : 0;

          updatePayload.revenue_items = revenueItems;
          updatePayload.total_revenue = totalRevenue;
          updatePayload.expense_items = expenseItems;
          updatePayload.total_expenses = totalExpenses;
          updatePayload.cash_flow_items = cashFlowItems;
          updatePayload.net_cash_flow = netCashFlow;
          updatePayload.gross_margin = grossMargin;
          updatePayload.net_margin = netMargin;
          updatePayload.break_even_point = totalExpenses;
        }
      }

      if (formData.key_assumptions) updatePayload.key_assumptions = formData.key_assumptions;
      if (formData.risk_factors) updatePayload.risk_factors = formData.risk_factors;
      if (formData.opportunities) updatePayload.opportunities = formData.opportunities;

      const { data: forecast, error } = await supabase
        .from('forecasts')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const result: ForecastData = {
        id: forecast.id,
        name: forecast.name,
        period_id: forecast.period_id,
        scenario_id: forecast.scenario_id,
        enterprise_id: forecast.company_id,
        revenue_items: forecast.revenue_items || [],
        total_revenue: forecast.total_revenue || 0,
        expense_items: forecast.expense_items || [],
        total_expenses: forecast.total_expenses || 0,
        cash_flow_items: forecast.cash_flow_items || [],
        net_cash_flow: forecast.net_cash_flow || 0,
        gross_margin: forecast.gross_margin || 0,
        net_margin: forecast.net_margin || 0,
        break_even_point: forecast.break_even_point || 0,
        status: forecast.status,
        created_by: forecast.created_by,
        created_at: forecast.created_at,
        updated_at: forecast.updated_at,
        key_assumptions: forecast.key_assumptions || [],
        risk_factors: forecast.risk_factors || [],
        opportunities: forecast.opportunities || []
      };

      return { data: result };
    } catch (error) {
      console.error('Error updating forecast:', error);
      return {
        data: {} as ForecastData,
        error: { message: 'Erreur lors de la mise à jour de la prévision' }
      };
    }
  }

  async deleteForecast(id: string): Promise<ForecastServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('forecasts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { data: true };
    } catch (error) {
      console.error('Error deleting forecast:', error);
      return {
        data: false,
        error: { message: 'Erreur lors de la suppression de la prévision' }
      };
    }
  }

  // Dashboard data
  async getDashboardData(companyId: string): Promise<ForecastServiceResponse<ForecastDashboardData>> {
    try {
      // Get latest forecasts
      const { data: forecasts, error: forecastsError } = await supabase
        .from('forecasts')
        .select(`
          *,
          forecast_scenarios (name, type),
          forecast_periods (name, period_type)
        `)
        .eq('company_id', companyId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(5);

      if (forecastsError) throw forecastsError;

      // Get scenarios count
      const { count: scenariosCount, error: scenariosError } = await supabase
        .from('forecast_scenarios')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      if (scenariosError) throw scenariosError;

      // Calculate totals
      const totalRevenue = forecasts?.reduce((sum, f) => sum + (f.total_revenue || 0), 0) || 0;
      const totalExpenses = forecasts?.reduce((sum, f) => sum + (f.total_expenses || 0), 0) || 0;
      const totalCashFlow = forecasts?.reduce((sum, f) => sum + (f.net_cash_flow || 0), 0) || 0;

      const dashboardData: ForecastDashboardData = {
        summary: {
          total_forecasts: forecasts?.length || 0,
          active_scenarios: scenariosCount || 0,
          avg_accuracy: 85, // TODO: Calculate from actual data
          next_review_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        recent_forecasts: forecasts || [],
        scenario_performance: [],
        upcoming_reviews: [],
        key_metrics: {
          revenue_trend: 0,
          expense_trend: 0,
          cash_flow_trend: 0,
          profitability_trend: 0
        }
      };

      return { data: dashboardData };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return {
        data: {} as ForecastDashboardData,
        error: { message: 'Erreur lors de la récupération des données du tableau de bord' }
      };
    }
  }

  // What-if analysis
  async performWhatIfAnalysis(forecastId: string, changes: Record<string, number>): Promise<ForecastServiceResponse<WhatIfAnalysis>> {
    try {
      const { data: forecast, error } = await supabase
        .from('forecasts')
        .select('*')
        .eq('id', forecastId)
        .single();

      if (error) throw error;

      if (!forecast) {
        return {
          data: {} as WhatIfAnalysis,
          error: { message: 'Prévision non trouvée' }
        };
      }

      // Apply changes and recalculate
      const newRevenue = (forecast.total_revenue || 0) * (1 + (changes.revenue_change || 0) / 100);
      const newExpenses = (forecast.total_expenses || 0) * (1 + (changes.expense_change || 0) / 100);
      const newCashFlow = newRevenue - newExpenses;

      const analysis: WhatIfAnalysis = {
        base_scenario: forecast.name,
        variables: [
          {
            name: 'revenue_change',
            current_value: forecast.total_revenue || 0,
            test_values: [changes.revenue_change || 0]
          },
          {
            name: 'expense_change',
            current_value: forecast.total_expenses || 0,
            test_values: [changes.expense_change || 0]
          }
        ],
        results: [
          {
            variable_combination: changes,
            impact_on_revenue: newRevenue - (forecast.total_revenue || 0),
            impact_on_expenses: newExpenses - (forecast.total_expenses || 0),
            impact_on_cash_flow: newCashFlow - (forecast.net_cash_flow || 0),
            impact_on_profitability: (newRevenue > 0 ? ((newRevenue - newExpenses) / newRevenue) * 100 : 0) - (forecast.gross_margin || 0)
          }
        ]
      };

      return { data: analysis };
    } catch (error) {
      console.error('Error performing what-if analysis:', error);
      return {
        data: {} as WhatIfAnalysis,
        error: { message: 'Erreur lors de l\'analyse what-if' }
      };
    }
  }

  // Export functions
  exportForecastsToCSV(forecasts: ForecastData[], filename: string = 'previsions') {
    const headers = [
      'Nom',
      'Période',
      'Scénario',
      'Revenus totaux',
      'Dépenses totales',
      'Marge brute',
      'Flux de trésorerie net',
      'Statut',
      'Date de création'
    ];

    const csvContent = [
      headers.join(','),
      ...forecasts.map(forecast => [
        `"${forecast.name}"`,
        forecast.period_id,
        forecast.scenario_id,
        forecast.total_revenue,
        forecast.total_expenses,
        `${forecast.gross_margin.toFixed(2)}%`,
        forecast.net_cash_flow,
        `"${forecast.status}"`,
        new Date(forecast.created_at).toLocaleDateString('fr-FR')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  generatePDFReport(forecast: ForecastData): void {
    // Mock PDF generation - in real implementation, use a PDF library
    console.log(`Génération du rapport PDF pour: ${forecast.name}`);
    // Implementation would use jsPDF or similar library
  }
}

export const forecastsService = new ForecastsService();