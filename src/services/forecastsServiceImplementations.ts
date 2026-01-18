/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */
import { supabase } from '../lib/supabase';
import { logger } from '@/lib/logger';
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
  RevenueLineItem,
  ExpenseLineItem,
  CashFlowItem
} from '../types/forecasts.types';
/**
 * Get all scenarios (with optional company filtering)
 */
export async function getScenarios(enterpriseId?: string): Promise<ForecastServiceResponse<ForecastScenario[]>> {
  try {
    let query = supabase
      .from('forecast_scenarios')
      .select('*')
      .order('created_at', { ascending: false });
    if (enterpriseId) {
      query = query.eq('company_id', enterpriseId);
    }
    const { data, error } = await query;
    if (error) throw error;
    const scenarios: ForecastScenario[] = (data || []).map(s => ({
      id: s.id,
      name: s.name,
      description: s.description || undefined,
      type: s.type as any,
      growth_rate: Number(s.growth_rate) || 0,
      market_conditions: s.market_conditions || undefined,
      created_at: s.created_at,
      updated_at: s.updated_at
    }));
    return { data: scenarios };
  } catch (error) {
    logger.error('ForecastsServiceImplementations', 'Error fetching scenarios:', error);
    return {
      data: [],
      error: { message: 'Erreur lors de la récupération des scénarios' }
    };
  }
}
/**
 * Create a new scenario
 */
export async function createScenario(
  enterpriseId: string,
  formData: ScenarioFormData
): Promise<ForecastServiceResponse<ForecastScenario>> {
  try {
    const { data, error } = await supabase
      .from('forecast_scenarios')
      .insert({
        company_id: enterpriseId,
        name: formData.name,
        description: formData.description,
        type: formData.type,
        growth_rate: formData.growth_rate,
        market_conditions: formData.market_conditions
      })
      .select()
      .single();
    if (error) throw error;
    const scenario: ForecastScenario = {
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      type: data.type as any,
      growth_rate: Number(data.growth_rate) || 0,
      market_conditions: data.market_conditions || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
    return { data: scenario };
  } catch (error) {
    logger.error('ForecastsServiceImplementations', 'Error creating scenario:', error);
    return {
      data: {} as ForecastScenario,
      error: { message: 'Erreur lors de la création du scénario' }
    };
  }
}
/**
 * Get periods for a company
 */
export async function getPeriods(enterpriseId: string): Promise<ForecastServiceResponse<ForecastPeriod[]>> {
  try {
    const { data, error } = await supabase
      .from('forecast_periods')
      .select('*')
      .eq('company_id', enterpriseId)
      .order('start_date', { ascending: false });
    if (error) throw error;
    const periods: ForecastPeriod[] = (data || []).map(p => ({
      id: p.id,
      name: p.name,
      start_date: p.start_date,
      end_date: p.end_date,
      period_type: p.period_type as any,
      enterprise_id: p.company_id,
      created_at: p.created_at
    }));
    return { data: periods };
  } catch (error) {
    logger.error('ForecastsServiceImplementations', 'Error fetching periods:', error);
    return {
      data: [],
      error: { message: 'Erreur lors de la récupération des périodes' }
    };
  }
}
/**
 * Get forecasts with optional filters
 */
export async function getForecasts(
  enterpriseId: string,
  filters?: ForecastFilters
): Promise<ForecastServiceResponse<ForecastData[]>> {
  try {
    let query = supabase
      .from('forecasts')
      .select(`
        *,
        period:forecast_periods(id, name, start_date, end_date),
        scenario:forecast_scenarios(id, name, type)
      `)
      .eq('company_id', enterpriseId);
    // Apply filters
    if (filters?.scenario_id) {
      query = query.eq('scenario_id', filters.scenario_id);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.period_id) {
      query = query.eq('period_id', filters.period_id);
    }
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }
    const { data: forecastsData, error: forecastsError } = await query.order('created_at', { ascending: false });
    if (forecastsError) throw forecastsError;
    // For each forecast, fetch its line items
    const forecasts: ForecastData[] = [];
    for (const forecast of forecastsData || []) {
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('forecast_line_items')
        .select('*')
        .eq('forecast_id', forecast.id);
      if (lineItemsError) {
        logger.error('ForecastsServiceImplementations', 'Error fetching line items:', lineItemsError);
        continue;
      }
      // Separate line items by type
      const revenueItems: RevenueLineItem[] = (lineItems || [])
        .filter(item => item.item_type === 'revenue')
        .map(item => ({
          id: item.id,
          category: item.category,
          subcategory: item.subcategory || undefined,
          description: item.description || undefined,
          amount: Number(item.amount) || 0,
          growth_rate: item.growth_rate ? Number(item.growth_rate) : undefined,
          seasonality_factor: item.seasonality_factor ? Number(item.seasonality_factor) : undefined,
          confidence_level: item.confidence_level as any
        }));
      const expenseItems: ExpenseLineItem[] = (lineItems || [])
        .filter(item => item.item_type === 'expense')
        .map(item => ({
          id: item.id,
          category: item.category as any,
          subcategory: item.subcategory || undefined,
          description: item.description || undefined,
          amount: Number(item.amount) || 0,
          growth_rate: item.growth_rate ? Number(item.growth_rate) : undefined,
          is_recurring: item.is_recurring || false,
          confidence_level: item.confidence_level as any
        }));
      const cashFlowItems: CashFlowItem[] = (lineItems || [])
        .filter(item => item.item_type === 'cash_flow')
        .map(item => ({
          id: item.id,
          type: item.cash_flow_type as any,
          category: item.category,
          description: item.description || undefined,
          amount: Number(item.amount) || 0,
          timing: item.timing || undefined,
          probability: item.probability || undefined
        }));
      forecasts.push({
        id: forecast.id,
        name: forecast.name,
        period_id: forecast.period_id,
        scenario_id: forecast.scenario_id,
        enterprise_id: forecast.company_id,
        revenue_items: revenueItems,
        total_revenue: Number(forecast.total_revenue) || 0,
        expense_items: expenseItems,
        total_expenses: Number(forecast.total_expenses) || 0,
        cash_flow_items: cashFlowItems,
        net_cash_flow: Number(forecast.net_cash_flow) || 0,
        gross_margin: Number(forecast.gross_margin) || 0,
        net_margin: Number(forecast.net_margin) || 0,
        break_even_point: Number(forecast.break_even_point) || 0,
        status: forecast.status as any,
        created_by: forecast.created_by || undefined,
        approved_by: forecast.approved_by || undefined,
        created_at: forecast.created_at,
        updated_at: forecast.updated_at,
        key_assumptions: forecast.key_assumptions || [],
        risk_factors: forecast.risk_factors || [],
        opportunities: forecast.opportunities || []
      });
    }
    return { data: forecasts };
  } catch (error) {
    logger.error('ForecastsServiceImplementations', 'Error fetching forecasts:', error);
    return {
      data: [],
      error: { message: 'Erreur lors de la récupération des prévisions' }
    };
  }
}
/**
 * Create a new forecast with line items
 */
export async function createForecast(
  enterpriseId: string,
  formData: ForecastFormData
): Promise<ForecastServiceResponse<ForecastData>> {
  try {
    // Calculate totals
    const totalRevenue = formData.revenue_items.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = formData.expense_items.reduce((sum, item) => sum + item.amount, 0);
    const netCashFlow = formData.cash_flow_items.reduce((sum, item) =>
      sum + (item.type === 'inflow' ? item.amount : -item.amount), 0
    );
    const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;
    const netMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;
    const breakEvenPoint = totalExpenses;
    // Insert forecast
    const { data: forecastData, error: forecastError } = await supabase
      .from('forecasts')
      .insert({
        company_id: enterpriseId,
        name: formData.name,
        period_id: formData.period_id,
        scenario_id: formData.scenario_id,
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        net_cash_flow: netCashFlow,
        gross_margin: grossMargin,
        net_margin: netMargin,
        break_even_point: breakEvenPoint,
        status: 'draft',
        key_assumptions: formData.key_assumptions || [],
        risk_factors: formData.risk_factors || [],
        opportunities: formData.opportunities || []
      })
      .select()
      .single();
    if (forecastError) throw forecastError;
    // Insert revenue line items
    if (formData.revenue_items.length > 0) {
      const revenueLineItems = formData.revenue_items.map(item => ({
        forecast_id: forecastData.id,
        item_type: 'revenue',
        category: item.category,
        subcategory: item.subcategory,
        description: item.description,
        amount: item.amount,
        growth_rate: item.growth_rate,
        seasonality_factor: item.seasonality_factor,
        confidence_level: item.confidence_level
      }));
      const { error: revenueError } = await supabase
        .from('forecast_line_items')
        .insert(revenueLineItems);
      if (revenueError) throw revenueError;
    }
    // Insert expense line items
    if (formData.expense_items.length > 0) {
      const expenseLineItems = formData.expense_items.map(item => ({
        forecast_id: forecastData.id,
        item_type: 'expense',
        category: item.category,
        subcategory: item.subcategory,
        description: item.description,
        amount: item.amount,
        growth_rate: item.growth_rate,
        is_recurring: item.is_recurring,
        confidence_level: item.confidence_level
      }));
      const { error: expenseError } = await supabase
        .from('forecast_line_items')
        .insert(expenseLineItems);
      if (expenseError) throw expenseError;
    }
    // Insert cash flow line items
    if (formData.cash_flow_items.length > 0) {
      const cashFlowLineItems = formData.cash_flow_items.map(item => ({
        forecast_id: forecastData.id,
        item_type: 'cash_flow',
        category: item.category,
        description: item.description,
        amount: item.amount,
        cash_flow_type: item.type,
        timing: item.timing,
        probability: item.probability
      }));
      const { error: cashFlowError } = await supabase
        .from('forecast_line_items')
        .insert(cashFlowLineItems);
      if (cashFlowError) throw cashFlowError;
    }
    // Fetch created forecast with items
    const result = await getForecasts(enterpriseId, { search: forecastData.name });
    const createdForecast = result.data?.[0];
    if (!createdForecast) {
      throw new Error('Failed to retrieve created forecast');
    }
    return { data: createdForecast };
  } catch (error) {
    logger.error('ForecastsServiceImplementations', 'Error creating forecast:', error);
    return {
      data: {} as ForecastData,
      error: { message: 'Erreur lors de la création de la prévision' }
    };
  }
}
/**
 * Update an existing forecast
 */
export async function updateForecast(
  forecastId: string,
  formData: Partial<ForecastFormData>
): Promise<ForecastServiceResponse<ForecastData>> {
  try {
    // Fetch existing forecast to get company_id
    const { data: existingForecast, error: fetchError } = await supabase
      .from('forecasts')
      .select('company_id')
      .eq('id', forecastId)
      .single();
    if (fetchError) throw fetchError;
    if (!existingForecast) {
      return {
        data: {} as ForecastData,
        error: { message: 'Prévision non trouvée' }
      };
    }
    // Calculate totals if items are provided
    const updateData: any = {};
    if (formData.name) updateData.name = formData.name;
    if (formData.period_id) updateData.period_id = formData.period_id;
    if (formData.scenario_id) updateData.scenario_id = formData.scenario_id;
    if (formData.key_assumptions) updateData.key_assumptions = formData.key_assumptions;
    if (formData.risk_factors) updateData.risk_factors = formData.risk_factors;
    if (formData.opportunities) updateData.opportunities = formData.opportunities;
    // If line items are being updated, delete old ones and insert new ones
    if (formData.revenue_items || formData.expense_items || formData.cash_flow_items) {
      // Delete existing line items
      const { error: deleteError } = await supabase
        .from('forecast_line_items')
        .delete()
        .eq('forecast_id', forecastId);
      if (deleteError) throw deleteError;
      // Insert new revenue items
      if (formData.revenue_items && formData.revenue_items.length > 0) {
        const revenueLineItems = formData.revenue_items.map(item => ({
          forecast_id: forecastId,
          item_type: 'revenue',
          category: item.category,
          subcategory: item.subcategory,
          description: item.description,
          amount: item.amount,
          growth_rate: item.growth_rate,
          seasonality_factor: item.seasonality_factor,
          confidence_level: item.confidence_level
        }));
        const { error: revenueError } = await supabase
          .from('forecast_line_items')
          .insert(revenueLineItems);
        if (revenueError) throw revenueError;
      }
      // Insert new expense items
      if (formData.expense_items && formData.expense_items.length > 0) {
        const expenseLineItems = formData.expense_items.map(item => ({
          forecast_id: forecastId,
          item_type: 'expense',
          category: item.category,
          subcategory: item.subcategory,
          description: item.description,
          amount: item.amount,
          growth_rate: item.growth_rate,
          is_recurring: item.is_recurring,
          confidence_level: item.confidence_level
        }));
        const { error: expenseError } = await supabase
          .from('forecast_line_items')
          .insert(expenseLineItems);
        if (expenseError) throw expenseError;
      }
      // Insert new cash flow items
      if (formData.cash_flow_items && formData.cash_flow_items.length > 0) {
        const cashFlowLineItems = formData.cash_flow_items.map(item => ({
          forecast_id: forecastId,
          item_type: 'cash_flow',
          category: item.category,
          description: item.description,
          amount: item.amount,
          cash_flow_type: item.type,
          timing: item.timing,
          probability: item.probability
        }));
        const { error: cashFlowError } = await supabase
          .from('forecast_line_items')
          .insert(cashFlowLineItems);
        if (cashFlowError) throw cashFlowError;
      }
      // Trigger will automatically recalculate totals
    }
    // Update forecast metadata
    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('forecasts')
        .update(updateData)
        .eq('id', forecastId);
      if (updateError) throw updateError;
    }
    // Fetch updated forecast
    const result = await getForecasts(existingForecast.company_id);
    const updatedForecast = result.data?.find(f => f.id === forecastId);
    if (!updatedForecast) {
      throw new Error('Failed to retrieve updated forecast');
    }
    return { data: updatedForecast };
  } catch (error) {
    logger.error('ForecastsServiceImplementations', 'Error updating forecast:', error);
    return {
      data: {} as ForecastData,
      error: { message: 'Erreur lors de la mise à jour de la prévision' }
    };
  }
}
/**
 * Delete a forecast
 */
export async function deleteForecast(forecastId: string): Promise<ForecastServiceResponse<boolean>> {
  try {
    const { error } = await supabase
      .from('forecasts')
      .delete()
      .eq('id', forecastId);
    if (error) throw error;
    return { data: true };
  } catch (error) {
    logger.error('ForecastsServiceImplementations', 'Error deleting forecast:', error);
    return {
      data: false,
      error: { message: 'Erreur lors de la suppression de la prévision' }
    };
  }
}
/**
 * Get dashboard data for forecasts module
 */
export async function getDashboardData(
  enterpriseId: string
): Promise<ForecastServiceResponse<ForecastDashboardData>> {
  try {
    // Fetch all forecasts
    const forecastsResult = await getForecasts(enterpriseId);
    const forecasts = forecastsResult.data || [];
    // Fetch scenarios
    const scenariosResult = await getScenarios(enterpriseId);
    const scenarios = scenariosResult.data || [];

    // Calculate accuracy based on validated forecasts vs actual data
    const validatedForecasts = forecasts.filter(f => f.status === 'validated');
    let avgAccuracy = 0;
    if (validatedForecasts.length > 0) {
      // Calculate accuracy for each forecast that has actual data
      const accuracies = validatedForecasts.map(forecast => {
        const actualRevenue = (forecast as any).actual_revenue || 0;
        const forecastedRevenue = forecast.total_revenue || 0;
        if (forecastedRevenue > 0 && actualRevenue > 0) {
          const variance = Math.abs(actualRevenue - forecastedRevenue) / forecastedRevenue;
          return Math.max(0, (1 - variance) * 100); // Convert to percentage
        }
        return 85; // Default accuracy if no actual data
      });
      avgAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
    } else if (forecasts.length > 0) {
      avgAccuracy = 85; // Default baseline accuracy
    }

    // Calculate next review date based on draft/published forecasts
    const pendingReviewForecasts = forecasts
      .filter(f => f.status === 'draft' || f.status === 'published')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    let nextReviewDate = '';
    if (pendingReviewForecasts.length > 0) {
      // Next review is the oldest pending forecast + 30 days or end of current period
      const oldestPending = pendingReviewForecasts[0];
      const createdDate = new Date(oldestPending.created_at);
      const reviewDate = new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      nextReviewDate = reviewDate.toISOString().split('T')[0];
    } else if (forecasts.length > 0) {
      // If all forecasts are validated, next review is in 30 days
      const nextReview = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      nextReviewDate = nextReview.toISOString().split('T')[0];
    }

    // Calculate summary stats
    const summary = {
      total_forecasts: forecasts.length,
      active_scenarios: scenarios.length,
      avg_accuracy: Math.round(avgAccuracy * 100) / 100, // Round to 2 decimals
      next_review_date: nextReviewDate
    };

    // Calculate scenario performance based on historical accuracy
    const scenarioPerformance = scenarios.map(scenario => {
      // Find forecasts for this scenario
      const scenarioForecasts = forecasts.filter(f => f.scenario_id === scenario.id);
      const validatedScenarioForecasts = scenarioForecasts.filter(f => f.status === 'validated');

      let accuracy = 85; // Default
      if (validatedScenarioForecasts.length > 0) {
        const accuracies = validatedScenarioForecasts.map(f => {
          const actual = (f as any).actual_revenue || 0;
          const forecasted = f.total_revenue || 0;
          if (forecasted > 0 && actual > 0) {
            const variance = Math.abs(actual - forecasted) / forecasted;
            return Math.max(0, (1 - variance) * 100);
          }
          return 85;
        });
        accuracy = accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length;
      }

      return {
        scenario_name: scenario.name,
        accuracy: Math.round(accuracy * 100) / 100,
        last_updated: scenario.updated_at
      };
    });
    // Get upcoming reviews (forecasts that need review)
    const upcomingReviews = forecasts
      .filter(f => f.status === 'draft' || f.status === 'published')
      .slice(0, 5)
      .map(f => ({
        forecast_name: f.name,
        review_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Mock: 7 days from now
        status: f.status === 'draft' ? 'pending' : 'scheduled'
      }));
    // Calculate key metrics trends
    const keyMetrics = {
      revenue_trend: forecasts.reduce((sum, f) => sum + f.total_revenue, 0) / (forecasts.length || 1),
      expense_trend: forecasts.reduce((sum, f) => sum + f.total_expenses, 0) / (forecasts.length || 1),
      cash_flow_trend: forecasts.reduce((sum, f) => sum + f.net_cash_flow, 0) / (forecasts.length || 1),
      profitability_trend: forecasts.reduce((sum, f) => sum + f.net_margin, 0) / (forecasts.length || 1)
    };
    const dashboardData: ForecastDashboardData = {
      summary,
      recent_forecasts: forecasts.slice(0, 5),
      scenario_performance: scenarioPerformance,
      upcoming_reviews: upcomingReviews,
      key_metrics: keyMetrics
    };
    return { data: dashboardData };
  } catch (error) {
    logger.error('ForecastsServiceImplementations', 'Error fetching dashboard data:', error);
    return {
      data: {} as ForecastDashboardData,
      error: { message: 'Erreur lors de la récupération des données du tableau de bord' }
    };
  }
}
/**
 * Perform what-if analysis on a forecast
 */
export async function performWhatIfAnalysis(
  forecastId: string,
  variables: { name: string; test_values: number[] }[]
): Promise<ForecastServiceResponse<WhatIfAnalysis>> {
  try {
    // Fetch the forecast
    const { data: forecast, error: fetchError } = await supabase
      .from('forecasts')
      .select(`
        *,
        scenario:forecast_scenarios(name)
      `)
      .eq('id', forecastId)
      .single();
    if (fetchError) throw fetchError;
    if (!forecast) {
      return {
        data: {} as WhatIfAnalysis,
        error: { message: 'Prévision non trouvée' }
      };
    }
    const baseScenario = (forecast.scenario as any)?.name || 'Base';
    const totalRevenue = Number(forecast.total_revenue) || 0;
    const totalExpenses = Number(forecast.total_expenses) || 0;
    const netCashFlow = Number(forecast.net_cash_flow) || 0;
    // Calculate what-if scenarios
    const results = variables.flatMap(variable =>
      variable.test_values.map(value => {
        // Calculate impact based on variable value
        const impactMultiplier = (value - 100) / 100; // e.g., 110 -> 0.10 (10% increase)
        return {
          variable_combination: { [variable.name]: value },
          impact_on_revenue: totalRevenue * impactMultiplier,
          impact_on_expenses: totalExpenses * impactMultiplier * 0.5, // Expenses grow slower
          impact_on_cash_flow: netCashFlow * impactMultiplier * 1.2, // Cash flow more sensitive
          impact_on_profitability: (totalRevenue - totalExpenses) * impactMultiplier
        };
      })
    );
    const analysis: WhatIfAnalysis = {
      base_scenario: baseScenario,
      variables: variables.map(v => ({
        name: v.name,
        current_value: 100,
        test_values: v.test_values
      })),
      results
    };
    return { data: analysis };
  } catch (error) {
    logger.error('ForecastsServiceImplementations', 'Error performing what-if analysis:', error);
    return {
      data: {} as WhatIfAnalysis,
      error: { message: "Erreur lors de l'analyse what-if" }
    };
  }
}