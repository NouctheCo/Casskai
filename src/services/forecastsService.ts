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
import * as ForecastImpl from './forecastsServiceImplementations';



class ForecastsService {
  // Scenarios
  async getScenarios(): Promise<ForecastServiceResponse<ForecastScenario[]>> {
    return ForecastImpl.getScenarios();
  }

  async createScenario(formData: ScenarioFormData): Promise<ForecastServiceResponse<ForecastScenario>> {
    // Get enterpriseId from context or default
    const enterpriseId = 'company-1'; // TODO: Get from auth context
    return ForecastImpl.createScenario(enterpriseId, formData);
  }

  // Periods
  async getPeriods(enterpriseId: string): Promise<ForecastServiceResponse<ForecastPeriod[]>> {
    return ForecastImpl.getPeriods(enterpriseId);
  }

  // Forecasts
  async getForecasts(enterpriseId: string, filters?: ForecastFilters): Promise<ForecastServiceResponse<ForecastData[]>> {
    return ForecastImpl.getForecasts(enterpriseId, filters);
  }

  async createForecast(enterpriseId: string, formData: ForecastFormData): Promise<ForecastServiceResponse<ForecastData>> {
    return ForecastImpl.createForecast(enterpriseId, formData);
  }

  async updateForecast(forecastId: string, formData: Partial<ForecastFormData>): Promise<ForecastServiceResponse<ForecastData>> {
    return ForecastImpl.updateForecast(forecastId, formData);
  }

  async deleteForecast(forecastId: string): Promise<ForecastServiceResponse<boolean>> {
    return ForecastImpl.deleteForecast(forecastId);
  }

  // Dashboard
  async getDashboardData(enterpriseId: string): Promise<ForecastServiceResponse<ForecastDashboardData>> {
    return ForecastImpl.getDashboardData(enterpriseId);
  }

  // What-if Analysis
  async performWhatIfAnalysis(forecastId: string, variables: {name: string, test_values: number[]}[]): Promise<ForecastServiceResponse<WhatIfAnalysis>> {
    return ForecastImpl.performWhatIfAnalysis(forecastId, variables);
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
    // Mock PDF generation
    console.warn(`Génération du rapport PDF pour: ${forecast.name}`);
    // In a real implementation, you would use a library like jsPDF or call a backend service
  }
}



export const forecastsService = new ForecastsService();
