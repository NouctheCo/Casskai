// Service de Forecast Budgétaire pour CassKai
// Implémente le système de forecast avec réel YTD + prorata + budget restant

import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

// ============================================================================
// Types
// ============================================================================

export interface BudgetForecastLine {
  year: number;
  month: number;
  category_id: string;
  category_code: string;
  category_name: string;
  category_type: 'revenue' | 'expense' | 'capex';
  amount_actual: number;
  amount_budget: number;
  amount_forecast: number;
  variance_amount: number;
  variance_percentage: number;
}

export interface BudgetForecastKPI {
  total_actual_ytd: number;
  total_budget_annual: number;
  total_forecast_eoy: number;
  variance_vs_budget: number;
  variance_percentage: number;
  absorption_rate: number;
}

export interface UnmappedEntry {
  account_code: string;
  total_amount: number;
  entry_count: number;
}

export interface BudgetForecastData {
  kpi: BudgetForecastKPI;
  lines: BudgetForecastLine[];
  totals_by_type: {
    revenue: BudgetForecastSummary;
    expense: BudgetForecastSummary;
    capex: BudgetForecastSummary;
    net: BudgetForecastSummary;
  };
  by_category: CategoryForecast[];
  by_month: MonthlyForecast[];
  unmapped_entries: UnmappedEntry[];
}

export interface BudgetForecastSummary {
  actual_ytd: number;
  budget_annual: number;
  forecast_eoy: number;
  variance: number;
  variance_percentage: number;
}

export interface CategoryForecast {
  category_id: string;
  category_code: string;
  category_name: string;
  category_type: 'revenue' | 'expense' | 'capex';
  actual_ytd: number;
  budget_annual: number;
  forecast_eoy: number;
  variance: number;
  variance_percentage: number;
}

export interface MonthlyForecast {
  month: number;
  month_name: string;
  actual: number;
  budget: number;
  forecast: number;
  variance: number;
  is_past: boolean;
  is_current: boolean;
}

// ============================================================================
// Service
// ============================================================================

class BudgetForecastService {
  /**
   * Récupère le forecast complet pour un budget et une date donnée
   */
  async getForecast(
    companyId: string,
    budgetId: string,
    asOfDate: Date = new Date(),
    mode: 'prorata' | 'run_rate' = 'prorata'
  ): Promise<{ data: BudgetForecastData | null; error: Error | null }> {
    try {
      // 1. Appel à la fonction RPC pour les lignes de forecast
      const { data: lines, error: linesError } = await supabase.rpc(
        'get_budget_forecast',
        {
          p_company_id: companyId,
          p_budget_id: budgetId,
          p_as_of_date: asOfDate.toISOString().split('T')[0],
          p_mode: mode
        }
      );

      if (linesError) {
        logger.error('Error fetching forecast lines:', linesError);
        return { data: null, error: linesError };
      }

      // 2. Appel à la fonction RPC pour les KPI
      const { data: kpiData, error: kpiError } = await supabase.rpc(
        'get_budget_forecast_kpi',
        {
          p_company_id: companyId,
          p_budget_id: budgetId,
          p_as_of_date: asOfDate.toISOString().split('T')[0]
        }
      );

      if (kpiError) {
        logger.error('Error fetching forecast KPI:', kpiError);
        return { data: null, error: kpiError };
      }

      const kpi: BudgetForecastKPI = kpiData[0] || {
        total_actual_ytd: 0,
        total_budget_annual: 0,
        total_forecast_eoy: 0,
        variance_vs_budget: 0,
        variance_percentage: 0,
        absorption_rate: 0
      };

      // 3. Récupérer les écritures non mappées
      const currentYear = asOfDate.getFullYear();
      const { data: unmappedData, error: unmappedError } = await supabase.rpc(
        'get_unmapped_journal_entries',
        {
          p_company_id: companyId,
          p_year: currentYear
        }
      );

      const unmapped_entries: UnmappedEntry[] = unmappedError ? [] : (unmappedData || []);

      // 4. Calculer les totaux par type
      const totals_by_type = this.calculateTotalsByType(lines || []);

      // 5. Agréger par catégorie
      const by_category = this.aggregateByCategory(lines || []);

      // 6. Agréger par mois
      const by_month = this.aggregateByMonth(lines || [], asOfDate);

      const forecastData: BudgetForecastData = {
        kpi,
        lines: lines || [],
        totals_by_type,
        by_category,
        by_month,
        unmapped_entries
      };

      return { data: forecastData, error: null };
    } catch (error) {
      logger.error('Error in getForecast:', error);
      return { data: null, error };
    }
  }

  /**
   * Calcule les totaux par type (revenue, expense, capex, net)
   */
  private calculateTotalsByType(lines: BudgetForecastLine[]): {
    revenue: BudgetForecastSummary;
    expense: BudgetForecastSummary;
    capex: BudgetForecastSummary;
    net: BudgetForecastSummary;
  } {
    const revenue = this.aggregateByType(lines, 'revenue');
    const expense = this.aggregateByType(lines, 'expense');
    const capex = this.aggregateByType(lines, 'capex');

    const net: BudgetForecastSummary = {
      actual_ytd: revenue.actual_ytd - expense.actual_ytd - capex.actual_ytd,
      budget_annual: revenue.budget_annual - expense.budget_annual - capex.budget_annual,
      forecast_eoy: revenue.forecast_eoy - expense.forecast_eoy - capex.forecast_eoy,
      variance: revenue.variance - expense.variance - capex.variance,
      variance_percentage: 0
    };

    if (net.budget_annual !== 0) {
      net.variance_percentage = (net.variance / Math.abs(net.budget_annual)) * 100;
    }

    return { revenue, expense, capex, net };
  }

  /**
   * Agrège les lignes par type
   */
  private aggregateByType(
    lines: BudgetForecastLine[],
    type: 'revenue' | 'expense' | 'capex'
  ): BudgetForecastSummary {
    const filtered = lines.filter(l => l.category_type === type);

    const actual_ytd = filtered.reduce((sum, l) => sum + (l.amount_actual || 0), 0);
    const budget_annual = filtered.reduce((sum, l) => sum + (l.amount_budget || 0), 0);
    const forecast_eoy = filtered.reduce((sum, l) => sum + (l.amount_forecast || 0), 0);
    const variance = forecast_eoy - budget_annual;
    const variance_percentage = budget_annual !== 0 ? (variance / budget_annual) * 100 : 0;

    return {
      actual_ytd,
      budget_annual,
      forecast_eoy,
      variance,
      variance_percentage
    };
  }

  /**
   * Agrège par catégorie
   */
  private aggregateByCategory(lines: BudgetForecastLine[]): CategoryForecast[] {
    const categoryMap = new Map<string, CategoryForecast>();

    lines.forEach(line => {
      const key = line.category_id;
      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          category_id: line.category_id,
          category_code: line.category_code,
          category_name: line.category_name,
          category_type: line.category_type,
          actual_ytd: 0,
          budget_annual: 0,
          forecast_eoy: 0,
          variance: 0,
          variance_percentage: 0
        });
      }

      const cat = categoryMap.get(key)!;
      cat.actual_ytd += line.amount_actual || 0;
      cat.budget_annual += line.amount_budget || 0;
      cat.forecast_eoy += line.amount_forecast || 0;
    });

    // Calculer les variances
    categoryMap.forEach(cat => {
      cat.variance = cat.forecast_eoy - cat.budget_annual;
      cat.variance_percentage = cat.budget_annual !== 0
        ? (cat.variance / Math.abs(cat.budget_annual)) * 100
        : 0;
    });

    return Array.from(categoryMap.values()).sort((a, b) => {
      if (a.category_type !== b.category_type) {
        const order = { revenue: 0, expense: 1, capex: 2 };
        return order[a.category_type] - order[b.category_type];
      }
      return a.category_code.localeCompare(b.category_code);
    });
  }

  /**
   * Agrège par mois
   */
  private aggregateByMonth(lines: BudgetForecastLine[], asOfDate: Date): MonthlyForecast[] {
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const currentMonth = asOfDate.getMonth() + 1;
    const monthlyData: MonthlyForecast[] = [];

    for (let month = 1; month <= 12; month++) {
      const monthLines = lines.filter(l => l.month === month);

      const actual = monthLines.reduce((sum, l) => sum + (l.amount_actual || 0), 0);
      const budget = monthLines.reduce((sum, l) => sum + (l.amount_budget || 0), 0);
      const forecast = monthLines.reduce((sum, l) => sum + (l.amount_forecast || 0), 0);

      monthlyData.push({
        month,
        month_name: monthNames[month - 1],
        actual,
        budget,
        forecast,
        variance: forecast - budget,
        is_past: month < currentMonth,
        is_current: month === currentMonth
      });
    }

    return monthlyData;
  }

  /**
   * Export du forecast en CSV
   */
  exportToCSV(data: BudgetForecastData, filename: string = 'forecast'): void {
    const headers = [
      'Catégorie',
      'Type',
      'Réel YTD',
      'Budget Annuel',
      'Forecast EOY',
      'Écart',
      'Écart %'
    ];

    const rows = data.by_category.map(cat => [
      cat.category_name,
      cat.category_type === 'revenue' ? 'Revenus' : cat.category_type === 'expense' ? 'Charges' : 'Investissements',
      cat.actual_ytd.toFixed(2),
      cat.budget_annual.toFixed(2),
      cat.forecast_eoy.toFixed(2),
      cat.variance.toFixed(2),
      `${cat.variance_percentage.toFixed(2)  }%`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
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
}

export const budgetForecastService = new BudgetForecastService();
