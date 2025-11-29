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

/**
 * CRM Analytics Service
 * Advanced analytics and forecasting for CRM data
 * Calculates conversion rates, sales cycles, forecasting, and advanced metrics
 */

import { Opportunity, CommercialAction, Client } from '@/types/crm.types';

export interface ConversionMetrics {
  total_opportunities: number;
  won_opportunities: number;
  lost_opportunities: number;
  conversion_rate: number;
  win_rate_by_stage: Record<string, number>;
  average_deal_size: number;
  total_pipeline_value: number;
  weighted_pipeline_value: number;
}

export interface SalesCycleMetrics {
  average_days_to_close: number;
  median_days_to_close: number;
  fastest_deal_days: number;
  slowest_deal_days: number;
  average_by_stage: Record<string, number>;
  velocity_per_month: number;
}

export interface ForecastData {
  month: string;
  committed_revenue: number; // >80% probability
  best_case_revenue: number; // >50% probability
  pipeline_revenue: number; // All active opportunities
  confidence_level: 'low' | 'medium' | 'high';
}

export interface PerformanceMetrics {
  monthly_revenue: number[];
  monthly_deals_won: number[];
  monthly_deals_created: number[];
  growth_rate: number;
  year_over_year_growth: number;
  quarter_over_quarter_growth: number;
}

export interface ActivityMetrics {
  total_actions: number;
  completed_actions: number;
  completion_rate: number;
  actions_by_type: Record<string, number>;
  actions_by_outcome: Record<string, number>;
  average_actions_per_opportunity: number;
  most_effective_action_type: string;
}

export interface ClientHealthScore {
  client_id: string;
  client_name: string;
  score: number; // 0-100
  factors: {
    revenue_contribution: number;
    opportunity_count: number;
    last_interaction_days: number;
    win_rate: number;
  };
  risk_level: 'low' | 'medium' | 'high';
  recommendations: string[];
}

class CRMAnalyticsService {
  private static instance: CRMAnalyticsService;

  private constructor() {}

  public static getInstance(): CRMAnalyticsService {
    if (!CRMAnalyticsService.instance) {
      CRMAnalyticsService.instance = new CRMAnalyticsService();
    }
    return CRMAnalyticsService.instance;
  }

  /**
   * Calculate conversion metrics
   */
  calculateConversionMetrics(opportunities: Opportunity[]): ConversionMetrics {
    const total = opportunities.length;
    const won = opportunities.filter(o => o.stage === 'won').length;
    const lost = opportunities.filter(o => o.stage === 'lost').length;
    const active = opportunities.filter(o => !['won', 'lost'].includes(o.stage));

    // Win rate by stage
    const stageGroups = this.groupByStage(opportunities);
    const winRateByStage: Record<string, number> = {};

    Object.keys(stageGroups).forEach(stage => {
      const stageOpps = stageGroups[stage];
      const stageWon = stageOpps.filter(o => o.stage === 'won').length;
      winRateByStage[stage] = stageOpps.length > 0 ? (stageWon / stageOpps.length) * 100 : 0;
    });

    // Deal sizes
    const wonOpportunities = opportunities.filter(o => o.stage === 'won');
    const averageDealSize = wonOpportunities.length > 0
      ? wonOpportunities.reduce((sum, o) => sum + o.value, 0) / wonOpportunities.length
      : 0;

    // Pipeline values
    const totalPipelineValue = active.reduce((sum, o) => sum + o.value, 0);
    const weightedPipelineValue = active.reduce((sum, o) => sum + (o.value * o.probability / 100), 0);

    return {
      total_opportunities: total,
      won_opportunities: won,
      lost_opportunities: lost,
      conversion_rate: total > 0 ? (won / (won + lost)) * 100 : 0,
      win_rate_by_stage: winRateByStage,
      average_deal_size: averageDealSize,
      total_pipeline_value: totalPipelineValue,
      weighted_pipeline_value: weightedPipelineValue
    };
  }

  /**
   * Calculate sales cycle metrics
   */
  calculateSalesCycleMetrics(opportunities: Opportunity[]): SalesCycleMetrics {
    const closedOpportunities = opportunities.filter(
      o => (o.stage === 'won' || o.stage === 'lost') && o.actual_close_date
    );

    if (closedOpportunities.length === 0) {
      return {
        average_days_to_close: 0,
        median_days_to_close: 0,
        fastest_deal_days: 0,
        slowest_deal_days: 0,
        average_by_stage: {},
        velocity_per_month: 0
      };
    }

    // Calculate days to close for each opportunity
    const daysToClose = closedOpportunities.map(opp => {
      const created = new Date(opp.created_at);
      const closed = new Date(opp.actual_close_date!);
      return Math.floor((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    }).sort((a, b) => a - b);

    const average = daysToClose.reduce((sum, days) => sum + days, 0) / daysToClose.length;
    const median = daysToClose[Math.floor(daysToClose.length / 2)];
    const fastest = daysToClose[0];
    const slowest = daysToClose[daysToClose.length - 1];

    // Average by stage
    const stageGroups = this.groupByStage(closedOpportunities);
    const averageByStage: Record<string, number> = {};

    Object.keys(stageGroups).forEach(stage => {
      const stageOpps = stageGroups[stage];
      const stageDays = stageOpps
        .filter(o => o.actual_close_date)
        .map(o => {
          const created = new Date(o.created_at);
          const closed = new Date(o.actual_close_date!);
          return Math.floor((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        });

      averageByStage[stage] = stageDays.length > 0
        ? stageDays.reduce((sum, days) => sum + days, 0) / stageDays.length
        : 0;
    });

    // Velocity (deals closed per month)
    const velocityPerMonth = closedOpportunities.length > 0
      ? (closedOpportunities.length / (average / 30)) || 0
      : 0;

    return {
      average_days_to_close: Math.round(average),
      median_days_to_close: Math.round(median),
      fastest_deal_days: fastest,
      slowest_deal_days: slowest,
      average_by_stage: averageByStage,
      velocity_per_month: Math.round(velocityPerMonth * 10) / 10
    };
  }

  /**
   * Generate revenue forecast for next 3-6 months
   */
  generateForecast(opportunities: Opportunity[], months: number = 3): ForecastData[] {
    const forecast: ForecastData[] = [];
    const today = new Date();

    for (let i = 0; i < months; i++) {
      const targetMonth = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
      const monthEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);

      // Filter opportunities expected to close in this month
      const monthOpportunities = opportunities.filter(opp => {
        if (opp.stage === 'won' || opp.stage === 'lost') return false;
        const closeDate = new Date(opp.expected_close_date);
        return closeDate >= monthStart && closeDate <= monthEnd;
      });

      // Calculate different revenue scenarios
      const committedRevenue = monthOpportunities
        .filter(o => o.probability >= 80)
        .reduce((sum, o) => sum + o.value, 0);

      const bestCaseRevenue = monthOpportunities
        .filter(o => o.probability >= 50)
        .reduce((sum, o) => sum + o.value, 0);

      const pipelineRevenue = monthOpportunities
        .reduce((sum, o) => sum + (o.value * o.probability / 100), 0);

      // Determine confidence level based on data quality
      const confidenceLevel = this.calculateConfidenceLevel(monthOpportunities);

      forecast.push({
        month: targetMonth.toISOString().substring(0, 7),
        committed_revenue: Math.round(committedRevenue),
        best_case_revenue: Math.round(bestCaseRevenue),
        pipeline_revenue: Math.round(pipelineRevenue),
        confidence_level: confidenceLevel
      });
    }

    return forecast;
  }

  /**
   * Calculate performance metrics over time
   */
  calculatePerformanceMetrics(
    opportunities: Opportunity[],
    monthsBack: number = 12
  ): PerformanceMetrics {
    const today = new Date();
    const monthlyRevenue: number[] = [];
    const monthlyDealsWon: number[] = [];
    const monthlyDealsCreated: number[] = [];

    for (let i = monthsBack - 1; i >= 0; i--) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);

      // Won deals in this month
      const wonThisMonth = opportunities.filter(opp => {
        if (opp.stage !== 'won' || !opp.actual_close_date) return false;
        const closeDate = new Date(opp.actual_close_date);
        return closeDate >= monthStart && closeDate <= monthEnd;
      });

      // Created deals in this month
      const createdThisMonth = opportunities.filter(opp => {
        const createdDate = new Date(opp.created_at);
        return createdDate >= monthStart && createdDate <= monthEnd;
      });

      monthlyRevenue.push(wonThisMonth.reduce((sum, o) => sum + o.value, 0));
      monthlyDealsWon.push(wonThisMonth.length);
      monthlyDealsCreated.push(createdThisMonth.length);
    }

    // Calculate growth rates
    const currentRevenue = monthlyRevenue[monthlyRevenue.length - 1] || 0;
    const previousRevenue = monthlyRevenue[monthlyRevenue.length - 2] || 0;
    const growthRate = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    // Year over year (current month vs same month last year)
    const currentMonthRevenue = monthlyRevenue[monthlyRevenue.length - 1] || 0;
    const lastYearRevenue = monthlyRevenue[0] || 0;
    const yoyGrowth = lastYearRevenue > 0
      ? ((currentMonthRevenue - lastYearRevenue) / lastYearRevenue) * 100
      : 0;

    // Quarter over quarter
    const currentQuarter = monthlyRevenue.slice(-3).reduce((sum, r) => sum + r, 0);
    const previousQuarter = monthlyRevenue.slice(-6, -3).reduce((sum, r) => sum + r, 0);
    const qoqGrowth = previousQuarter > 0
      ? ((currentQuarter - previousQuarter) / previousQuarter) * 100
      : 0;

    return {
      monthly_revenue: monthlyRevenue,
      monthly_deals_won: monthlyDealsWon,
      monthly_deals_created: monthlyDealsCreated,
      growth_rate: Math.round(growthRate * 10) / 10,
      year_over_year_growth: Math.round(yoyGrowth * 10) / 10,
      quarter_over_quarter_growth: Math.round(qoqGrowth * 10) / 10
    };
  }

  /**
   * Calculate activity metrics
   */
  calculateActivityMetrics(
    actions: CommercialAction[],
    opportunities: Opportunity[]
  ): ActivityMetrics {
    const total = actions.length;
    const completed = actions.filter(a => a.status === 'completed').length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    // Group by type
    const actionsByType: Record<string, number> = {};
    actions.forEach(action => {
      actionsByType[action.type] = (actionsByType[action.type] || 0) + 1;
    });

    // Group by outcome
    const actionsByOutcome: Record<string, number> = {};
    actions
      .filter(a => a.outcome)
      .forEach(action => {
        const outcome = action.outcome || 'unknown';
        actionsByOutcome[outcome] = (actionsByOutcome[outcome] || 0) + 1;
      });

    // Actions per opportunity
    const opportunityIds = new Set(actions.map(a => a.opportunity_id).filter(Boolean));
    const avgActionsPerOpportunity = opportunityIds.size > 0
      ? actions.filter(a => a.opportunity_id).length / opportunityIds.size
      : 0;

    // Find most effective action type (highest win rate)
    const mostEffective = this.findMostEffectiveActionType(actions, opportunities);

    return {
      total_actions: total,
      completed_actions: completed,
      completion_rate: Math.round(completionRate * 10) / 10,
      actions_by_type: actionsByType,
      actions_by_outcome: actionsByOutcome,
      average_actions_per_opportunity: Math.round(avgActionsPerOpportunity * 10) / 10,
      most_effective_action_type: mostEffective
    };
  }

  /**
   * Calculate client health scores
   */
  calculateClientHealthScores(
    clients: Client[],
    opportunities: Opportunity[],
    actions: CommercialAction[]
  ): ClientHealthScore[] {
    return clients.map(client => {
      const clientOpportunities = opportunities.filter(o => o.client_id === client.id);
      const clientActions = actions.filter(a => a.client_id === client.id);

      // Revenue contribution
      const totalRevenue = client.total_revenue || 0;
      const revenueScore = Math.min(totalRevenue / 10000, 30); // Max 30 points

      // Opportunity count
      const oppScore = Math.min(clientOpportunities.length * 5, 20); // Max 20 points

      // Last interaction
      const lastInteraction = client.last_interaction
        ? new Date(client.last_interaction)
        : null;
      const daysSinceInteraction = lastInteraction
        ? Math.floor((Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      const interactionScore = Math.max(30 - daysSinceInteraction / 3, 0); // Max 30 points

      // Win rate
      const wonOpps = clientOpportunities.filter(o => o.stage === 'won').length;
      const closedOpps = clientOpportunities.filter(o => ['won', 'lost'].includes(o.stage)).length;
      const winRate = closedOpps > 0 ? (wonOpps / closedOpps) * 100 : 0;
      const winRateScore = winRate / 5; // Max 20 points

      // Total score (0-100)
      const score = Math.min(revenueScore + oppScore + interactionScore + winRateScore, 100);

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (score < 40) riskLevel = 'high';
      else if (score < 70) riskLevel = 'medium';

      // Generate recommendations
      const recommendations: string[] = [];
      if (daysSinceInteraction > 30) {
        recommendations.push('Schedule follow-up - No interaction in 30+ days');
      }
      if (clientOpportunities.length === 0) {
        recommendations.push('Identify new opportunities');
      }
      if (winRate < 30 && closedOpps > 0) {
        recommendations.push('Review sales approach - Low win rate');
      }
      if (totalRevenue < 5000) {
        recommendations.push('Explore upsell opportunities');
      }

      return {
        client_id: client.id,
        client_name: client.company_name,
        score: Math.round(score),
        factors: {
          revenue_contribution: Math.round(revenueScore),
          opportunity_count: clientOpportunities.length,
          last_interaction_days: daysSinceInteraction,
          win_rate: Math.round(winRate * 10) / 10
        },
        risk_level: riskLevel,
        recommendations
      };
    }).sort((a, b) => b.score - a.score);
  }

  // Helper methods

  private groupByStage(opportunities: Opportunity[]): Record<string, Opportunity[]> {
    return opportunities.reduce((groups, opp) => {
      const stage = opp.stage;
      if (!groups[stage]) groups[stage] = [];
      groups[stage].push(opp);
      return groups;
    }, {} as Record<string, Opportunity[]>);
  }

  private calculateConfidenceLevel(opportunities: Opportunity[]): 'low' | 'medium' | 'high' {
    if (opportunities.length === 0) return 'low';

    const highProbability = opportunities.filter(o => o.probability >= 70).length;
    const percentage = (highProbability / opportunities.length) * 100;

    if (percentage >= 60) return 'high';
    if (percentage >= 30) return 'medium';
    return 'low';
  }

  private findMostEffectiveActionType(
    actions: CommercialAction[],
    opportunities: Opportunity[]
  ): string {
    const actionTypes = ['call', 'email', 'meeting', 'demo', 'proposal', 'follow_up'];
    let maxWinRate = 0;
    let mostEffective = 'meeting';

    actionTypes.forEach(type => {
      const typeActions = actions.filter(a => a.type === type && a.opportunity_id);
      const uniqueOpportunityIds = new Set(typeActions.map(a => a.opportunity_id));

      const wonOpportunities = opportunities.filter(
        o => o.stage === 'won' && uniqueOpportunityIds.has(o.id)
      ).length;

      const winRate = uniqueOpportunityIds.size > 0
        ? (wonOpportunities / uniqueOpportunityIds.size) * 100
        : 0;

      if (winRate > maxWinRate) {
        maxWinRate = winRate;
        mostEffective = type;
      }
    });

    return mostEffective;
  }
}

// Export singleton instance
export const crmAnalyticsService = CRMAnalyticsService.getInstance();
export default crmAnalyticsService;
