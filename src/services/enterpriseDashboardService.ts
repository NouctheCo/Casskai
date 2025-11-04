// Service pour le dashboard enterprise de CassKai
import { supabase } from '@/lib/supabase';
import type {
  EnterpriseDashboardData,
  BudgetData,
  DashboardMetric,
  CashFlowForecast,
  FinancialHealthScore,
  DashboardFilter,
  RealTimeUpdate
} from '@/types/enterprise-dashboard.types';

export class EnterpriseDashboardService {
  private static instance: EnterpriseDashboardService;
  private subscriptions: Map<string, { unsubscribe: () => void }> = new Map();

  static getInstance(): EnterpriseDashboardService {
    if (!EnterpriseDashboardService.instance) {
      EnterpriseDashboardService.instance = new EnterpriseDashboardService();
    }
    return EnterpriseDashboardService.instance;
  }

  /**
   * Récupère toutes les données du dashboard enterprise
   */
  async getDashboardData(
    companyId: string,
    filter: DashboardFilter
  ): Promise<{ data: EnterpriseDashboardData | null; error: unknown | null }> {
    try {
      // Appel de la fonction RPC qui agrège toutes les données
      const { data, error } = await supabase.rpc('get_enterprise_dashboard_data', {
        p_company_id: companyId,
        p_period: filter.period,
        p_start_date: filter.start_date,
        p_end_date: filter.end_date,
        p_comparison_period: filter.comparison,
        p_include_forecasts: filter.show_forecasts,
        p_include_benchmarks: filter.show_benchmarks,
        p_currency: filter.currency || 'EUR'
      });

      if (error) {
        console.error('Error fetching enterprise dashboard data:', error);
        return { data: null, error };
      }

      // Transformation des données pour correspondre aux types TypeScript
      const dashboardData: EnterpriseDashboardData = {
        company_id: companyId,
        period: filter.period,
        comparison_period: filter.comparison,
        generated_at: new Date().toISOString(),
        refresh_rate: 30, // 30 secondes par défaut

        executive_summary: {
          revenue_ytd: data.executive_summary?.revenue_ytd || 0,
          revenue_growth: data.executive_summary?.revenue_growth || 0,
          profit_margin: data.executive_summary?.profit_margin || 0,
          cash_runway_days: data.executive_summary?.cash_runway_days || 0,
          customer_satisfaction: data.executive_summary?.customer_satisfaction || 0,
          market_position: data.executive_summary?.market_position || 'Non défini',
          key_achievements: data.executive_summary?.key_achievements || [],
          strategic_priorities: data.executive_summary?.strategic_priorities || []
        },

        key_metrics: this.formatMetrics(data.key_metrics || []),
        charts: this.formatCharts(data.charts || []),
        financial_health: this.formatFinancialHealth(data.financial_health),
        cash_flow_forecast: data.cash_flow_forecast || [],
        budget_comparison: data.budget_comparison || [],
        period_comparisons: data.period_comparisons || [],
        alerts: this.formatAlerts(data.alerts || []),
        operational_kpis: data.operational_kpis || [],
        profitability_analysis: data.profitability_analysis || {}
      };

      return { data: dashboardData, error: null };

    } catch (error) {
      console.error('Error in getDashboardData:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }

  /**
   * Récupère les métriques en temps réel
   */
  async getRealTimeMetrics(companyId: string): Promise<{ data: DashboardMetric[] | null; error: unknown | null }> {
    try {
      const { data, error } = await supabase.rpc('get_realtime_metrics', {
        p_company_id: companyId
      });

      if (error) throw error;

      return { data: this.formatMetrics(data || []), error: null };
    } catch (error) {
      console.error('Error fetching real-time metrics:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }

  /**
   * Récupère les données budgétaires
   */
  async getBudgetData(companyId: string, year: number): Promise<{ data: BudgetData | null; error: unknown | null }> {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select(`
          *,
          budget_categories(*),
          budget_assumptions(*)
        `)
        .eq('company_id', companyId)
        .eq('year', year)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') { // Pas d'erreur si pas de résultat
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching budget data:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }

  /**
   * Calcule le score de santé financière
   */
  async calculateFinancialHealth(companyId: string): Promise<{ data: FinancialHealthScore | null; error: unknown | null }> {
    try {
      const { data, error } = await supabase.rpc('calculate_financial_health_score', {
        p_company_id: companyId
      });

      if (error) throw error;

      return { data: this.formatFinancialHealth(data), error: null };
    } catch (error) {
      console.error('Error calculating financial health:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }

  /**
   * Génère des prévisions de trésorerie
   */
  async generateCashFlowForecast(
    companyId: string,
    months: number = 12
  ): Promise<{ data: CashFlowForecast[] | null; error: unknown | null }> {
    try {
      const { data, error } = await supabase.rpc('generate_cash_flow_forecast', {
        p_company_id: companyId,
        p_months_ahead: months
      });

      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error generating cash flow forecast:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }

  /**
   * Compare les performances actuelles vs budget vs N-1
   */
  async getPerformanceComparison(
    companyId: string,
    period: string
  ): Promise<{ data: Record<string, unknown> | null; error: unknown | null }> {
    try {
      const { data, error } = await supabase.rpc('get_performance_comparison', {
        p_company_id: companyId,
        p_period: period
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching performance comparison:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }

  /**
   * Souscrit aux mises à jour en temps réel
   */
  subscribeToRealTimeUpdates(
    companyId: string,
    callback: (update: RealTimeUpdate) => void
  ): () => void {
    // Abonnement aux changements dans les tables clés
    const journalEntriesSubscription = supabase
      .channel(`dashboard_updates_${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'journal_entries',
          filter: `company_id=eq.${companyId}`
        },
        (payload) => {
          callback({
            type: 'data_refresh',
            timestamp: new Date().toISOString(),
            priority: 'medium'
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `company_id=eq.${companyId}`
        },
        (payload) => {
          callback({
            type: 'metric_update',
            metric_id: 'revenue',
            timestamp: new Date().toISOString(),
            priority: 'high'
          });
        }
      )
      .subscribe();

    this.subscriptions.set(companyId, journalEntriesSubscription);

    // Fonction de désabonnement
    return () => {
      const subscription = this.subscriptions.get(companyId);
      if (subscription) {
        subscription.unsubscribe();
        this.subscriptions.delete(companyId);
      }
    };
  }

  /**
   * Crée ou met à jour un budget
   */
  async saveBudgetData(budgetData: Partial<BudgetData>): Promise<{ data: BudgetData | null; error: unknown | null }> {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .upsert(budgetData, { onConflict: 'company_id,year' })
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error saving budget data:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }

  /**
   * Analyse les écarts budgétaires
   */
  async analyzeBudgetVariances(
    companyId: string,
    budgetId: string
  ): Promise<{ data: Record<string, unknown> | null; error: unknown | null }> {
    try {
      const { data, error } = await supabase.rpc('analyze_budget_variances', {
        p_company_id: companyId,
        p_budget_id: budgetId
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error analyzing budget variances:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }

  // Méthodes utilitaires privées
  private formatMetrics(rawMetrics: Array<Record<string, unknown>>): DashboardMetric[] {
    return rawMetrics.map(metric => ({
      id: (metric.id as string) || `metric_${Date.now()}`,
      title: metric.title as string,
      current_value: metric.current_value as number,
      target_value: metric.target_value as number | undefined,
      previous_period_value: metric.previous_period_value as number | undefined,
      budget_value: metric.budget_value as number | undefined,
      unit: (metric.unit as string) || 'number',
      trend_percentage: (metric.trend_percentage as number) || 0,
      vs_budget_percentage: metric.vs_budget_percentage as number | undefined,
      vs_previous_year_percentage: metric.vs_previous_year_percentage as number | undefined,
      color: (metric.color as string) || 'blue',
      category: (metric.category as DashboardMetric['category']) || 'financial',
      icon: (metric.icon as string) || 'TrendingUp'
    }));
  }

  private formatCharts(rawCharts: Array<Record<string, unknown>>) {
    return rawCharts.map(chart => ({
      ...chart,
      comparison_enabled: (chart.comparison_enabled as boolean) ?? true,
      drill_down_available: (chart.drill_down_available as boolean) ?? false
    }));
  }

  private formatFinancialHealth(rawHealth: unknown): FinancialHealthScore {
    if (!rawHealth) {
      return {
        overall_score: 0,
        liquidity_score: 0,
        profitability_score: 0,
        efficiency_score: 0,
        growth_score: 0,
        risk_score: 0,
        sustainability_score: 0,
        recommendations: [],
        critical_alerts: [],
        last_updated: new Date().toISOString()
      };
    }

    const health = rawHealth as Record<string, unknown>;
    return {
      ...health,
      recommendations: (health.recommendations as string[]) || [],
      critical_alerts: (health.critical_alerts as string[]) || [],
      last_updated: new Date().toISOString()
    } as FinancialHealthScore;
  }

  private formatAlerts(rawAlerts: Array<Record<string, unknown>>) {
    return rawAlerts.map(alert => ({
      ...alert,
      affected_metrics: (alert.affected_metrics as string[]) || [],
      estimated_impact: (alert.estimated_impact as string) || 'medium'
    }));
  }
}

// Export de l'instance singleton
export const enterpriseDashboardService = EnterpriseDashboardService.getInstance();
