/**
 * CassKai - PHASE 4: Trend Charts Component
 * Interactive charts for financial trends and time-series analysis
 */

import React, { useState, useEffect } from 'react';
import { AnalyticsService } from '@/services/analytics/analyticsService';
import { VisualizationService } from '@/services/visualization/visualizationService';

interface TrendData {
  period: string;
  revenue: number;
  profit: number;
  margin: number;
  expenses: number;
}

interface TrendChartState {
  data: TrendData[];
  selectedMetrics: string[];
  loading: boolean;
  timeframe: 'quarterly' | 'annual';
}

const SAMPLE_TREND_DATA: TrendData[] = [
  {
    period: '2023-Q1',
    revenue: 750000,
    profit: 225000,
    margin: 0.3,
    expenses: 525000,
  },
  {
    period: '2023-Q2',
    revenue: 800000,
    profit: 272000,
    margin: 0.34,
    expenses: 528000,
  },
  {
    period: '2023-Q3',
    revenue: 850000,
    profit: 306000,
    margin: 0.36,
    expenses: 544000,
  },
  {
    period: '2023-Q4',
    revenue: 950000,
    profit: 380000,
    margin: 0.4,
    expenses: 570000,
  },
  {
    period: '2024-Q1',
    revenue: 800000,
    profit: 320000,
    margin: 0.4,
    expenses: 480000,
  },
  {
    period: '2024-Q2',
    revenue: 850000,
    profit: 340000,
    margin: 0.4,
    expenses: 510000,
  },
  {
    period: '2024-Q3',
    revenue: 900000,
    profit: 360000,
    margin: 0.4,
    expenses: 540000,
  },
  {
    period: '2024-Q4',
    revenue: 950000,
    profit: 380000,
    margin: 0.4,
    expenses: 570000,
  },
];

export const TrendChartsComponent: React.FC = () => {
  const [state, setState] = useState<TrendChartState>({
    data: SAMPLE_TREND_DATA,
    selectedMetrics: ['revenue', 'profit'],
    loading: false,
    timeframe: 'quarterly',
  });

  const toggleMetric = (metric: string) => {
    setState(prev => ({
      ...prev,
      selectedMetrics: prev.selectedMetrics.includes(metric)
        ? prev.selectedMetrics.filter(m => m !== metric)
        : [...prev.selectedMetrics, metric],
    }));
  };

  const calculateTrendStats = (metric: keyof TrendData) => {
    const values = state.data.map(d => d[metric] as number);
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const change = lastValue - firstValue;
    const percentChange = (change / firstValue) * 100;
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    return { change, percentChange, average, max, min, lastValue };
  };

  const getTrendIndicator = (percentChange: number) => {
    if (percentChange > 5) return '📈 Strong Up';
    if (percentChange > 0) return '📉 Slightly Up';
    if (percentChange < -5) return '📉 Strong Down';
    return '➡️ Stable';
  };

  const MetricSelector: React.FC = () => (
    <div className="metric-selector">
      <h3>Select Metrics</h3>
      <div className="metric-checkboxes">
        {['revenue', 'profit', 'margin', 'expenses'].map(metric => (
          <label key={metric} className="metric-checkbox">
            <input
              type="checkbox"
              checked={state.selectedMetrics.includes(metric)}
              onChange={() => toggleMetric(metric)}
            />
            <span>{metric.charAt(0).toUpperCase() + metric.slice(1)}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const TrendCard: React.FC<{ metric: string; stats: any }> = ({ metric, stats }) => (
    <div className="trend-card">
      <h4>{metric.charAt(0).toUpperCase() + metric.slice(1)}</h4>
      <div className="trend-stats">
        <div className="stat">
          <span className="label">Current Value:</span>
          <span className="value">
            {metric === 'margin'
              ? `${(stats.lastValue * 100).toFixed(1)}%`
              : `$${stats.lastValue.toLocaleString()}`}
          </span>
        </div>
        <div className="stat">
          <span className="label">Period Change:</span>
          <span className={`value ${stats.percentChange >= 0 ? 'positive' : 'negative'}`}>
            {stats.percentChange >= 0 ? '+' : ''}{stats.percentChange.toFixed(2)}%
          </span>
        </div>
        <div className="stat">
          <span className="label">Trend:</span>
          <span className="value">{getTrendIndicator(stats.percentChange)}</span>
        </div>
        <div className="stat">
          <span className="label">Average:</span>
          <span className="value">
            {metric === 'margin'
              ? `${(stats.average * 100).toFixed(1)}%`
              : `$${stats.average.toLocaleString()}`}
          </span>
        </div>
        <div className="stat">
          <span className="label">Range:</span>
          <span className="value">
            {metric === 'margin'
              ? `${(stats.min * 100).toFixed(1)}% - ${(stats.max * 100).toFixed(1)}%`
              : `$${stats.min.toLocaleString()} - $${stats.max.toLocaleString()}`}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="trend-charts">
      <div className="charts-header">
        <h1>Financial Trend Analysis</h1>
        <p>Track revenue, profit, margins, and expenses over time</p>
      </div>

      <div className="charts-layout">
        {/* Controls */}
        <div className="controls-panel">
          <MetricSelector />

          <div className="timeframe-selector">
            <h3>Timeframe</h3>
            <select
              value={state.timeframe}
              onChange={e =>
                setState(prev => ({
                  ...prev,
                  timeframe: e.target.value as 'quarterly' | 'annual',
                }))
              }
              className="timeframe-select"
            >
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
        </div>

        {/* Main Chart Area */}
        <div className="chart-area">
          <div className="chart-container">
            <h2>Multi-Metric Trend Line</h2>
            <div className="chart-placeholder">
              <p>Chart.js / Recharts visualization will be rendered here</p>
              <p style={{ fontSize: '12px', color: '#999' }}>
                Period: {state.data.length} quarters | Metrics: {state.selectedMetrics.length}
              </p>
            </div>
          </div>

          {/* Statistics */}
          <div className="statistics-section">
            <h2>Trend Statistics</h2>
            <div className="stats-grid">
              {state.selectedMetrics.map(metric => {
                const stats = calculateTrendStats(metric as keyof TrendData);
                return <TrendCard key={metric} metric={metric} stats={stats} />;
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Analysis */}
      <div className="additional-analysis">
        <div className="analysis-card">
          <h3>Key Insights</h3>
          <ul className="insights-list">
            <li>
              <span className="insight-icon">📈</span>
              <span>
                Revenue shows consistent growth trend with 6.25% quarterly growth rate
              </span>
            </li>
            <li>
              <span className="insight-icon">💰</span>
              <span>
                Profit margins have stabilized at 40%, indicating operational efficiency
              </span>
            </li>
            <li>
              <span className="insight-icon">📊</span>
              <span>
                Expenses growing slower than revenue, suggesting improved cost management
              </span>
            </li>
            <li>
              <span className="insight-icon">🎯</span>
              <span>All metrics showing positive trend with no volatility concerns</span>
            </li>
          </ul>
        </div>

        <div className="analysis-card">
          <h3>Comparison to Previous Period</h3>
          <div className="comparison-table">
            <div className="comparison-row header">
              <div className="col metric">Metric</div>
              <div className="col prev">Previous Period</div>
              <div className="col curr">Current Period</div>
              <div className="col change">Change</div>
            </div>
            {['revenue', 'profit', 'margin', 'expenses'].map(metric => {
              const stats = calculateTrendStats(metric as keyof TrendData);
              return (
                <div key={metric} className="comparison-row">
                  <div className="col metric">
                    {metric.charAt(0).toUpperCase() + metric.slice(1)}
                  </div>
                  <div className="col prev">
                    {metric === 'margin'
                      ? `${(Number(state.data[state.data.length - 5]?.[metric as keyof TrendData] ?? 0) * 100).toFixed(1)}%`
                      : `$${(Number(state.data[state.data.length - 5]?.[metric as keyof TrendData] ?? 0)).toLocaleString()}`}
                  </div>
                  <div className="col curr">
                    {metric === 'margin'
                      ? `${(Number(state.data[state.data.length - 1]?.[metric as keyof TrendData] ?? 0) * 100).toFixed(1)}%`
                      : `$${(Number(state.data[state.data.length - 1]?.[metric as keyof TrendData] ?? 0)).toLocaleString()}`}
                  </div>
                  <div className={`col change ${stats.percentChange >= 0 ? 'positive' : 'negative'}`}>
                    {stats.percentChange >= 0 ? '+' : ''}{stats.percentChange.toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .trend-charts {
          padding: 24px;
          background-color: #f8f9fa;
          min-height: 100vh;
        }

        .charts-header {
          background-color: white;
          padding: 24px;
          border-radius: 8px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .charts-header h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 600;
          color: #333;
        }

        .charts-header p {
          margin: 0;
          color: #666;
          font-size: 16px;
        }

        .charts-layout {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }

        .controls-panel {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          height: fit-content;
        }

        .metric-selector h3,
        .timeframe-selector h3 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .metric-checkboxes {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .metric-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
        }

        .metric-checkbox input {
          cursor: pointer;
        }

        .timeframe-select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .chart-area {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .chart-container {
          background-color: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .chart-container h2 {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .chart-placeholder {
          height: 400px;
          background-color: #f9f9f9;
          border: 1px dashed #ddd;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #999;
        }

        .statistics-section h2 {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .trend-card {
          background-color: white;
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .trend-card h4 {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
          border-bottom: 2px solid #007bff;
          padding-bottom: 8px;
        }

        .trend-stats {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .stat {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
        }

        .stat .label {
          color: #666;
          font-weight: 500;
        }

        .stat .value {
          color: #333;
          font-weight: 600;
        }

        .stat .value.positive {
          color: #28a745;
        }

        .stat .value.negative {
          color: #dc3545;
        }

        .additional-analysis {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
        }

        .analysis-card {
          background-color: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .analysis-card h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .insights-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .insights-list li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 14px;
          color: #666;
          line-height: 1.5;
        }

        .insight-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .comparison-table {
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
        }

        .comparison-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          border-bottom: 1px solid #ddd;
        }

        .comparison-row:last-child {
          border-bottom: none;
        }

        .comparison-row.header {
          background-color: #f9f9f9;
          font-weight: 600;
          color: #333;
        }

        .comparison-row .col {
          padding: 12px;
          font-size: 13px;
          display: flex;
          align-items: center;
        }

        .comparison-row .col.change {
          text-align: right;
          font-weight: 600;
        }

        .comparison-row .col.change.positive {
          color: #28a745;
        }

        .comparison-row .col.change.negative {
          color: #dc3545;
        }

        @media (max-width: 768px) {
          .charts-layout {
            grid-template-columns: 1fr;
          }

          .controls-panel {
            display: flex;
            gap: 24px;
          }

          .additional-analysis {
            grid-template-columns: 1fr;
          }

          .comparison-row {
            grid-template-columns: 1fr 1fr;
          }

          .comparison-row .col:nth-child(3),
          .comparison-row .col:nth-child(4) {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default TrendChartsComponent;
