// Service corrigé pour le dashboard enterprise de CassKai
// Utilise des calculs dynamiques au lieu de fonctions RPC inexistantes
import { supabase } from '@/lib/supabase';
import { financialHealthService } from './financialHealthService';
import type {
  EnterpriseDashboardData,
  BudgetData,
  DashboardMetric,
  CashFlowForecast,
  FinancialHealthScore,
  DashboardFilter,
  RealTimeUpdate
} from '@/types/enterprise-dashboard.types';

export class EnterpriseDashboardServiceFixed {
  private static instance: EnterpriseDashboardServiceFixed;
  private subscriptions: Map<string, { unsubscribe: () => void }> = new Map();

  static getInstance(): EnterpriseDashboardServiceFixed {
    if (!EnterpriseDashboardServiceFixed.instance) {
      EnterpriseDashboardServiceFixed.instance = new EnterpriseDashboardServiceFixed();
    }
    return EnterpriseDashboardServiceFixed.instance;
  }

  /**
   * Récupère toutes les données du dashboard enterprise
   */
  async getDashboardData(
    companyId: string,
    filter: DashboardFilter
  ): Promise<{ data: EnterpriseDashboardData | null; error: unknown | null }> {
    try {
      // Calculer le score de santé financière avec le service TypeScript
      const financialHealth = await financialHealthService.calculateHealthScore(companyId);

      // Si pas de santé financière calculée, cela signifie qu'il n'y a pas de données
      if (!financialHealth) {
        console.log('No financial data available for company:', companyId);
        return { data: null, error: 'No financial data available' };
      }

      // Transformation des données pour correspondre aux types TypeScript
      const dashboardData: EnterpriseDashboardData = {
        company_id: companyId,
        period: filter.period,
        comparison_period: filter.comparison,
        generated_at: new Date().toISOString(),
        refresh_rate: 30,

        executive_summary: {
          revenue_ytd: 0,
          revenue_growth: 0,
          profit_margin: 0,
          cash_runway_days: 0,
          customer_satisfaction: 0, // À calculer plus tard
          market_position: 'Non défini',
          key_achievements: [],
          strategic_priorities: []
        },

        key_metrics: [],
        charts: [],
        financial_health: financialHealth,
        cash_flow_forecast: [],
        budget_comparison: [],
        period_comparisons: [],
        alerts: [],
        operational_kpis: [],
        profitability_analysis: {}
      };

      return { data: dashboardData, error: null };

    } catch (error) {
      console.error('Error in getDashboardData:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }

  /**
   * Calcule le score de santé financière
   */
  async calculateFinancialHealth(companyId: string): Promise<{ data: FinancialHealthScore | null; error: unknown | null }> {
    try {
      const healthScore = await financialHealthService.calculateHealthScore(companyId);
      return { data: healthScore, error: null };
    } catch (error) {
      console.error('Error calculating financial health:', error instanceof Error ? error.message : String(error));
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
      .subscribe();

    this.subscriptions.set(companyId, journalEntriesSubscription);

    return () => {
      const subscription = this.subscriptions.get(companyId);
      if (subscription) {
        subscription.unsubscribe();
        this.subscriptions.delete(companyId);
      }
    };
  }
}

// Export de l'instance singleton
export const enterpriseDashboardServiceFixed = EnterpriseDashboardServiceFixed.getInstance();
