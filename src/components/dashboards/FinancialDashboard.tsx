/**
 * CassKai - PHASE 4: Financial Dashboard Component
 * Main dashboard displaying key financial metrics and KPIs
 */

import React, { useState, useEffect } from 'react';
import { AnalyticsService } from '@/services/analytics/analyticsService';
import { VisualizationService } from '@/services/visualization/visualizationService';

interface FinancialMetric {
  label: string;
  value: string | number;
  change: number;
  status: 'positive' | 'negative' | 'neutral';
  icon: string;
}

interface DashboardState {
  metrics: FinancialMetric[];
  loading: boolean;
  error: string | null;
  selectedPeriod: 'monthly' | 'quarterly' | 'annual';
}

export const FinancialDashboard: React.FC = () => {
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    metrics: [],
    loading: true,
    error: null,
    selectedPeriod: 'quarterly',
  });

  useEffect(() => {
    loadDashboardData();
  }, [dashboardState.selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setDashboardState(prev => ({ ...prev, loading: true, error: null }));

      // Sample data - in production, fetch from API
      const metrics: FinancialMetric[] = [
        {
          label: 'Total Revenue',
          value: '$1,000,000',
          change: 6.25,
          status: 'positive',
          icon: '📈',
        },
        {
          label: 'Net Profit',
          value: '$400,000',
          change: 6.25,
          status: 'positive',
          icon: '💰',
        },
        {
          label: 'Profit Margin',
          value: '40%',
          change: 0,
          status: 'neutral',
          icon: '📊',
        },
        {
          label: 'Current Ratio',
          value: '2.5',
          change: 0.1,
          status: 'positive',
          icon: '✅',
        },
        {
          label: 'Debt to Equity',
          value: '0.67',
          change: -0.05,
          status: 'positive',
          icon: '📉',
        },
        {
          label: 'ROE',
          value: '27%',
          change: 2.0,
          status: 'positive',
          icon: '🎯',
        },
      ];

      setDashboardState(prev => ({
        ...prev,
        metrics,
        loading: false,
      }));
    } catch (error) {
      setDashboardState(prev => ({
        ...prev,
        error: 'Failed to load dashboard data',
        loading: false,
      }));
    }
  };

  const MetricCard: React.FC<{ metric: FinancialMetric }> = ({ metric }) => (
    <div className="metric-card">
      <div className="metric-header">
        <span className="metric-icon">{metric.icon}</span>
        <h3 className="metric-label">{metric.label}</h3>
      </div>
      <div className="metric-value">{metric.value}</div>
      <div className={`metric-change ${metric.status}`}>
        <span className="change-icon">
          {metric.change > 0 ? '📈' : metric.change < 0 ? '📉' : '➡️'}
        </span>
        <span className="change-value">
          {metric.change > 0 ? '+' : ''}{metric.change}%
        </span>
      </div>
    </div>
  );

  if (dashboardState.loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="financial-dashboard">
      <div className="dashboard-header">
        <h1>Financial Dashboard</h1>
        <div className="period-selector">
          {(['monthly', 'quarterly', 'annual'] as const).map(period => (
            <button
              key={period}
              className={`period-btn ${dashboardState.selectedPeriod === period ? 'active' : ''}`}
              onClick={() =>
                setDashboardState(prev => ({ ...prev, selectedPeriod: period }))
              }
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {dashboardState.error && (
        <div className="dashboard-error">{dashboardState.error}</div>
      )}

      <div className="metrics-grid">
        {dashboardState.metrics.map((metric, idx) => (
          <MetricCard key={idx} metric={metric} />
        ))}
      </div>

      <div className="dashboard-charts">
        <div className="chart-container">
          <h2>Revenue Trend</h2>
          <p className="chart-description">Monthly revenue over the last 12 months</p>
          {/* Chart will be rendered here */}
        </div>

        <div className="chart-container">
          <h2>Profitability Analysis</h2>
          <p className="chart-description">Gross, Operating, and Net Margins</p>
          {/* Chart will be rendered here */}
        </div>

        <div className="chart-container">
          <h2>Balance Sheet Distribution</h2>
          <p className="chart-description">Assets, Liabilities, and Equity composition</p>
          {/* Chart will be rendered here */}
        </div>

        <div className="chart-container">
          <h2>Key Ratios</h2>
          <p className="chart-description">Liquidity, Solvency, and Profitability ratios</p>
          {/* Chart will be rendered here */}
        </div>
      </div>

      <style>{`
        .financial-dashboard {
          padding: 24px;
          background-color: #f8f9fa;
          min-height: 100vh;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .dashboard-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
          color: #333;
        }

        .period-selector {
          display: flex;
          gap: 8px;
        }

        .period-btn {
          padding: 8px 16px;
          border: 1px solid #ddd;
          background-color: white;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .period-btn:hover {
          border-color: #007bff;
          color: #007bff;
        }

        .period-btn.active {
          background-color: #007bff;
          color: white;
          border-color: #007bff;
        }

        .dashboard-error {
          background-color: #f8d7da;
          color: #721c24;
          padding: 16px;
          border-radius: 4px;
          margin-bottom: 24px;
          border-left: 4px solid #dc3545;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .metric-card {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .metric-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .metric-icon {
          font-size: 24px;
        }

        .metric-label {
          margin: 0;
          font-size: 14px;
          font-weight: 500;
          color: #666;
        }

        .metric-value {
          font-size: 28px;
          font-weight: 700;
          color: #333;
          margin-bottom: 12px;
        }

        .metric-change {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 500;
        }

        .metric-change.positive {
          color: #28a745;
        }

        .metric-change.negative {
          color: #dc3545;
        }

        .metric-change.neutral {
          color: #6c757d;
        }

        .change-icon {
          font-size: 16px;
        }

        .dashboard-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          font-size: 18px;
          color: #666;
        }

        .dashboard-charts {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
        }

        .chart-container {
          background-color: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .chart-container h2 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .chart-description {
          margin: 0;
          font-size: 13px;
          color: #999;
          margin-bottom: 16px;
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          }

          .dashboard-charts {
            grid-template-columns: 1fr;
          }

          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default FinancialDashboard;
