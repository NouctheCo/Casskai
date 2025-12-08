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

 * useCRMAnalytics Hook

 * React hook for CRM analytics and advanced reporting

 * Integrates crmAnalyticsService and crmExportService into React components

 */



import { useCallback, useMemo } from 'react';

import { useAuth } from '@/contexts/AuthContext';

import { Client, Opportunity, CommercialAction } from '@/types/crm.types';

import crmAnalyticsService, {

  ConversionMetrics,

  SalesCycleMetrics,

  ForecastData,

  PerformanceMetrics,

  ActivityMetrics,

  ClientHealthScore

} from '@/services/crmAnalyticsService';

import crmExportService from '@/services/crmExportService';



export interface UseCRMAnalyticsParams {

  clients: Client[];

  opportunities: Opportunity[];

  actions: CommercialAction[];

}



export interface UseCRMAnalyticsReturn {

  // Analytics calculations

  conversionMetrics: ConversionMetrics;

  salesCycleMetrics: SalesCycleMetrics;

  forecastData: ForecastData[];

  performanceMetrics: PerformanceMetrics;

  activityMetrics: ActivityMetrics;

  clientHealthScores: ClientHealthScore[];



  // Export functions

  exportClientsCSV: () => void;

  exportClientsExcel: () => void;

  exportContactsCSV: () => void;

  exportOpportunitiesCSV: () => void;

  exportOpportunitiesExcel: () => void;

  exportActionsCSV: () => void;

  exportPipelineReport: () => void;

  exportForecastReport: () => void;

  exportSalesCycleReport: () => void;

  exportClientHealthReport: () => void;

  exportDashboardReport: () => void;



  // Utility functions

  generateForecast: (months: number) => ForecastData[];

  getClientHealthScore: (clientId: string) => ClientHealthScore | undefined;

  getTopOpportunities: (limit: number) => Opportunity[];

  getTopClients: (limit: number) => Client[];

}



export function useCRMAnalytics({

  clients,

  opportunities,

  actions

}: UseCRMAnalyticsParams): UseCRMAnalyticsReturn {

  const { currentCompany: _currentCompany } = useAuth();



  // Calculate conversion metrics

  const conversionMetrics = useMemo((): ConversionMetrics => {

    if (opportunities.length === 0) {

      return {

        total_opportunities: 0,

        won_opportunities: 0,

        lost_opportunities: 0,

        conversion_rate: 0,

        win_rate_by_stage: {},

        average_deal_size: 0,

        total_pipeline_value: 0,

        weighted_pipeline_value: 0

      };

    }

    return crmAnalyticsService.calculateConversionMetrics(opportunities);

  }, [opportunities]);



  // Calculate sales cycle metrics

  const salesCycleMetrics = useMemo((): SalesCycleMetrics => {

    if (opportunities.length === 0) {

      return {

        average_days_to_close: 0,

        median_days_to_close: 0,

        fastest_deal_days: 0,

        slowest_deal_days: 0,

        average_by_stage: {},

        velocity_per_month: 0

      };

    }

    return crmAnalyticsService.calculateSalesCycleMetrics(opportunities);

  }, [opportunities]);



  // Generate 3-month forecast

  const forecastData = useMemo((): ForecastData[] => {

    if (opportunities.length === 0) return [];

    return crmAnalyticsService.generateForecast(opportunities, 3);

  }, [opportunities]);



  // Calculate performance metrics (12 months)

  const performanceMetrics = useMemo((): PerformanceMetrics => {

    if (opportunities.length === 0) {

      return {

        monthly_revenue: [],

        monthly_deals_won: [],

        monthly_deals_created: [],

        growth_rate: 0,

        year_over_year_growth: 0,

        quarter_over_quarter_growth: 0

      };

    }

    return crmAnalyticsService.calculatePerformanceMetrics(opportunities, 12);

  }, [opportunities]);



  // Calculate activity metrics

  const activityMetrics = useMemo((): ActivityMetrics => {

    if (actions.length === 0) {

      return {

        total_actions: 0,

        completed_actions: 0,

        completion_rate: 0,

        actions_by_type: {},

        actions_by_outcome: {},

        average_actions_per_opportunity: 0,

        most_effective_action_type: 'meeting'

      };

    }

    return crmAnalyticsService.calculateActivityMetrics(actions, opportunities);

  }, [actions, opportunities]);



  // Calculate client health scores

  const clientHealthScores = useMemo((): ClientHealthScore[] => {

    if (clients.length === 0) return [];

    return crmAnalyticsService.calculateClientHealthScores(clients, opportunities, actions);

  }, [clients, opportunities, actions]);



  // Export functions



  const exportClientsCSV = useCallback(() => {

    crmExportService.exportClientsToCSV(clients);

  }, [clients]);



  const exportClientsExcel = useCallback(() => {

    crmExportService.exportClientsToExcel(clients);

  }, [clients]);



  const exportContactsCSV = useCallback(() => {

    // Flatten contacts from clients

    const allContacts = clients

      .filter(c => c.contacts && c.contacts.length > 0)

      .flatMap(c => c.contacts || []);

    crmExportService.exportContactsToCSV(allContacts);

  }, [clients]);



  const exportOpportunitiesCSV = useCallback(() => {

    crmExportService.exportOpportunitiesToCSV(opportunities);

  }, [opportunities]);



  const exportOpportunitiesExcel = useCallback(() => {

    crmExportService.exportOpportunitiesToExcel(opportunities);

  }, [opportunities]);



  const exportActionsCSV = useCallback(() => {

    crmExportService.exportActionsToCSV(actions);

  }, [actions]);



  const exportPipelineReport = useCallback(() => {

    // Calculate pipeline stats

    const activeOpps = opportunities.filter(o => !['won', 'lost'].includes(o.stage));

    const stages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closing'];



    const pipelineStats = stages.map(stage => {

      const stageOpps = activeOpps.filter(o => o.stage === stage);

      const totalValue = stageOpps.reduce((sum, o) => sum + o.value, 0);

      const avgDealSize = stageOpps.length > 0 ? totalValue / stageOpps.length : 0;



      return {

        stage,

        count: stageOpps.length,

        value: totalValue,

        avg_deal_size: avgDealSize

      };

    });



    crmExportService.exportPipelineReport(activeOpps, pipelineStats, conversionMetrics);

  }, [opportunities, conversionMetrics]);



  const exportForecastReport = useCallback(() => {

    if (forecastData.length > 0) {

      crmExportService.exportForecastReport(forecastData);

    }

  }, [forecastData]);



  const exportSalesCycleReport = useCallback(() => {

    crmExportService.exportSalesCycleReport(salesCycleMetrics, opportunities);

  }, [salesCycleMetrics, opportunities]);



  const exportClientHealthReport = useCallback(() => {

    if (clientHealthScores.length > 0) {

      crmExportService.exportClientHealthReport(clientHealthScores);

    }

  }, [clientHealthScores]);



  const exportDashboardReport = useCallback(() => {

    // Build CrmStats from data

    const stats = {

      total_clients: clients.length,

      active_clients: clients.filter(c => c.status === 'active').length,

      prospects: clients.filter(c => c.status === 'prospect').length,

      total_opportunities: opportunities.length,

      opportunities_value: opportunities.reduce((sum, o) => sum + o.value, 0),

      won_opportunities: opportunities.filter(o => o.stage === 'won').length,

      won_value: opportunities.filter(o => o.stage === 'won').reduce((sum, o) => sum + o.value, 0),

      conversion_rate: conversionMetrics.conversion_rate,

      pending_actions: actions.filter(a => a.status === 'planned').length,

      overdue_actions: actions.filter(a => {

        if (!a.due_date) return false;

        return new Date(a.due_date) < new Date() && a.status !== 'completed';

      }).length,

      monthly_revenue: performanceMetrics.monthly_revenue[performanceMetrics.monthly_revenue.length - 1] || 0,

      revenue_growth: performanceMetrics.growth_rate

    };



    crmExportService.exportDashboardReport(

      clients,

      opportunities,

      actions,

      stats,

      conversionMetrics

    );

  }, [clients, opportunities, actions, conversionMetrics, performanceMetrics]);



  // Utility functions



  const generateForecast = useCallback((months: number): ForecastData[] => {

    return crmAnalyticsService.generateForecast(opportunities, months);

  }, [opportunities]);



  const getClientHealthScore = useCallback((clientId: string): ClientHealthScore | undefined => {

    return clientHealthScores.find(score => score.client_id === clientId);

  }, [clientHealthScores]);



  const getTopOpportunities = useCallback((limit: number = 10): Opportunity[] => {

    return [...opportunities]

      .filter(o => !['won', 'lost'].includes(o.stage))

      .sort((a, b) => b.value - a.value)

      .slice(0, limit);

  }, [opportunities]);



  const getTopClients = useCallback((limit: number = 10): Client[] => {

    return [...clients]

      .sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))

      .slice(0, limit);

  }, [clients]);



  return {

    // Analytics

    conversionMetrics,

    salesCycleMetrics,

    forecastData,

    performanceMetrics,

    activityMetrics,

    clientHealthScores,



    // Exports

    exportClientsCSV,

    exportClientsExcel,

    exportContactsCSV,

    exportOpportunitiesCSV,

    exportOpportunitiesExcel,

    exportActionsCSV,

    exportPipelineReport,

    exportForecastReport,

    exportSalesCycleReport,

    exportClientHealthReport,

    exportDashboardReport,



    // Utilities

    generateForecast,

    getClientHealthScore,

    getTopOpportunities,

    getTopClients

  };

}



export default useCRMAnalytics;
