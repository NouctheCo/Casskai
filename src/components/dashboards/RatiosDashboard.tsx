/**
 * CassKai - PHASE 4: Financial Ratios Dashboard Component
 * Comprehensive financial ratios analysis and visualization
 */

import React, { useState } from 'react';

interface RatioGroup {
  category: string;
  description: string;
  ratios: {
    name: string;
    value: number;
    status: 'optimal' | 'good' | 'fair' | 'poor';
    interpretation: string;
    benchmark?: number;
  }[];
}

interface RatioDashboardState {
  groups: RatioGroup[];
  loading: boolean;
  error: string | null;
  selectedCategory: string;
}

const RATIO_DATA: RatioGroup[] = [
  {
    category: 'Liquidity Ratios',
    description: 'Ability to meet short-term obligations',
    ratios: [
      {
        name: 'Current Ratio',
        value: 2.5,
        status: 'optimal',
        interpretation: 'For every $1 of current liabilities, company has $2.50 in current assets',
        benchmark: 2.0,
      },
      {
        name: 'Quick Ratio',
        value: 1.8,
        status: 'optimal',
        interpretation: 'Excludes inventory; shows ability to pay immediate obligations',
        benchmark: 1.0,
      },
      {
        name: 'Cash Ratio',
        value: 0.5,
        status: 'good',
        interpretation: 'Cash and equivalents can cover 50% of current liabilities',
        benchmark: 0.5,
      },
    ],
  },
  {
    category: 'Leverage Ratios',
    description: 'Financial structure and debt obligations',
    ratios: [
      {
        name: 'Debt-to-Equity Ratio',
        value: 0.67,
        status: 'optimal',
        interpretation: 'Company has $0.67 in debt for every $1 of equity',
        benchmark: 1.0,
      },
      {
        name: 'Debt-to-Assets Ratio',
        value: 0.4,
        status: 'optimal',
        interpretation: '40% of assets are financed by debt, 60% by equity',
        benchmark: 0.5,
      },
      {
        name: 'Equity Ratio',
        value: 0.6,
        status: 'optimal',
        interpretation: '60% of assets are financed by shareholders',
        benchmark: 0.5,
      },
      {
        name: 'Interest Coverage Ratio',
        value: 5.2,
        status: 'good',
        interpretation: 'Operating income covers interest expense 5.2 times',
        benchmark: 2.5,
      },
    ],
  },
  {
    category: 'Profitability Ratios',
    description: 'Ability to generate profit',
    ratios: [
      {
        name: 'Gross Margin',
        value: 0.4,
        status: 'optimal',
        interpretation: '40% of revenue remains as gross profit',
        benchmark: 0.35,
      },
      {
        name: 'Operating Margin',
        value: 0.25,
        status: 'optimal',
        interpretation: '25% of revenue remains as operating profit',
        benchmark: 0.15,
      },
      {
        name: 'Net Profit Margin',
        value: 0.4,
        status: 'optimal',
        interpretation: '40% of revenue becomes net profit',
        benchmark: 0.1,
      },
      {
        name: 'Return on Assets (ROA)',
        value: 0.16,
        status: 'optimal',
        interpretation: 'Company generates $0.16 in profit per $1 of assets',
        benchmark: 0.05,
      },
      {
        name: 'Return on Equity (ROE)',
        value: 0.27,
        status: 'optimal',
        interpretation: 'Company generates $0.27 in profit per $1 of equity',
        benchmark: 0.15,
      },
    ],
  },
  {
    category: 'Efficiency Ratios',
    description: 'Effectiveness of asset utilization',
    ratios: [
      {
        name: 'Asset Turnover Ratio',
        value: 0.4,
        status: 'fair',
        interpretation: 'Generates $0.40 in sales per $1 of assets',
        benchmark: 0.5,
      },
      {
        name: 'Receivables Turnover',
        value: 12,
        status: 'good',
        interpretation: 'Collects receivables approximately 12 times per year',
        benchmark: 10,
      },
      {
        name: 'Inventory Turnover',
        value: 6,
        status: 'good',
        interpretation: 'Sells and replaces inventory 6 times per year',
        benchmark: 5,
      },
      {
        name: 'Days Sales Outstanding',
        value: 30.4,
        status: 'good',
        interpretation: 'Takes approximately 30 days to collect payment',
        benchmark: 35,
      },
    ],
  },
  {
    category: 'Growth Ratios',
    description: 'Year-over-year growth metrics',
    ratios: [
      {
        name: 'Revenue Growth',
        value: 0.0625,
        status: 'good',
        interpretation: '6.25% growth per quarter',
        benchmark: 0.05,
      },
      {
        name: 'Profit Growth',
        value: 0.0625,
        status: 'good',
        interpretation: '6.25% growth in net profit per quarter',
        benchmark: 0.05,
      },
      {
        name: 'Asset Growth',
        value: 0.04,
        status: 'good',
        interpretation: '4% growth in total assets',
        benchmark: 0.03,
      },
    ],
  },
];

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'optimal':
      return '#28a745';
    case 'good':
      return '#17a2b8';
    case 'fair':
      return '#ffc107';
    case 'poor':
      return '#dc3545';
    default:
      return '#6c757d';
  }
};

const getStatusBadge = (status: string): string => {
  switch (status) {
    case 'optimal':
      return '✓';
    case 'good':
      return '→';
    case 'fair':
      return '!';
    case 'poor':
      return '✕';
    default:
      return '?';
  }
};

export const RatiosDashboard: React.FC = () => {
  const [state, setState] = useState<RatioDashboardState>({
    groups: RATIO_DATA,
    loading: false,
    error: null,
    selectedCategory: RATIO_DATA[0]?.category || '',
  });

  const selectedGroup = state.groups.find(g => g.category === state.selectedCategory);

  const RatioCard: React.FC<{
    ratio: RatioGroup['ratios'][0];
  }> = ({ ratio }) => (
    <div className="ratio-card">
      <div className="ratio-header">
        <div className="ratio-name">{ratio.name}</div>
        <div className="ratio-status" style={{ color: getStatusColor(ratio.status) }}>
          {getStatusBadge(ratio.status)} {ratio.status.toUpperCase()}
        </div>
      </div>

      <div className="ratio-values">
        <div className="ratio-value">
          <span className="label">Value:</span>
          <span className="value">
            {typeof ratio.value === 'number'
              ? ratio.value > 1
                ? ratio.value.toFixed(2)
                : ratio.value.toFixed(3)
              : ratio.value}
          </span>
        </div>
        {ratio.benchmark && (
          <div className="ratio-benchmark">
            <span className="label">Benchmark:</span>
            <span className="value">{ratio.benchmark.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="ratio-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${Math.min((ratio.value / (ratio.benchmark || 1)) * 100, 100)}%`,
              backgroundColor: getStatusColor(ratio.status),
            }}
          />
        </div>
      </div>

      <div className="ratio-interpretation">{ratio.interpretation}</div>
    </div>
  );

  return (
    <div className="ratios-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Financial Ratios Analysis</h1>
          <p>Comprehensive 15+ financial ratios with interpretations and benchmarks</p>
        </div>
      </div>

      <div className="ratios-container">
        {/* Category Navigation */}
        <div className="category-nav">
          {state.groups.map(group => (
            <button
              key={group.category}
              className={`category-btn ${
                state.selectedCategory === group.category ? 'active' : ''
              }`}
              onClick={() => setState(prev => ({ ...prev, selectedCategory: group.category }))}
            >
              {group.category}
              <span className="ratio-count">{group.ratios.length}</span>
            </button>
          ))}
        </div>

        {/* Ratios Display */}
        <div className="ratios-content">
          {selectedGroup && (
            <>
              <div className="category-header">
                <h2>{selectedGroup.category}</h2>
                <p>{selectedGroup.description}</p>
              </div>

              <div className="ratios-grid">
                {selectedGroup.ratios.map((ratio, idx) => (
                  <RatioCard key={idx} ratio={ratio} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Summary Section */}
      <div className="summary-section">
        <h3>Overall Financial Health</h3>
        <div className="health-metrics">
          <div className="health-item">
            <span className="health-label">Liquidity:</span>
            <div className="health-bar">
              <div className="health-fill" style={{ width: '90%', backgroundColor: '#28a745' }} />
            </div>
            <span className="health-value">Strong</span>
          </div>
          <div className="health-item">
            <span className="health-label">Solvency:</span>
            <div className="health-bar">
              <div className="health-fill" style={{ width: '85%', backgroundColor: '#28a745' }} />
            </div>
            <span className="health-value">Good</span>
          </div>
          <div className="health-item">
            <span className="health-label">Profitability:</span>
            <div className="health-bar">
              <div className="health-fill" style={{ width: '95%', backgroundColor: '#28a745' }} />
            </div>
            <span className="health-value">Excellent</span>
          </div>
          <div className="health-item">
            <span className="health-label">Efficiency:</span>
            <div className="health-bar">
              <div className="health-fill" style={{ width: '70%', backgroundColor: '#ffc107' }} />
            </div>
            <span className="health-value">Fair</span>
          </div>
        </div>
      </div>

      <style>{`
        .ratios-dashboard {
          padding: 24px;
          background-color: #f8f9fa;
          min-height: 100vh;
        }

        .dashboard-header {
          background-color: white;
          padding: 24px;
          border-radius: 8px;
          margin-bottom: 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .dashboard-header h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 600;
          color: #333;
        }

        .dashboard-header p {
          margin: 0;
          color: #666;
          font-size: 16px;
        }

        .ratios-container {
          display: flex;
          gap: 24px;
          margin-bottom: 32px;
        }

        .category-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 200px;
        }

        .category-btn {
          padding: 12px 16px;
          background-color: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          cursor: pointer;
          text-align: left;
          font-size: 14px;
          font-weight: 500;
          color: #333;
          transition: all 0.3s ease;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .category-btn:hover {
          border-color: #007bff;
          background-color: #f0f7ff;
        }

        .category-btn.active {
          background-color: #007bff;
          color: white;
          border-color: #007bff;
        }

        .ratio-count {
          font-size: 12px;
          opacity: 0.8;
        }

        .ratios-content {
          flex: 1;
        }

        .category-header {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .category-header h2 {
          margin: 0 0 8px 0;
          font-size: 22px;
          font-weight: 600;
          color: #333;
        }

        .category-header p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .ratios-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .ratio-card {
          background-color: white;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .ratio-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .ratio-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .ratio-name {
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .ratio-status {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 4px;
          background-color: #f0f0f0;
        }

        .ratio-values {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
        }

        .ratio-value,
        .ratio-benchmark {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .ratio-value .label,
        .ratio-benchmark .label {
          font-size: 12px;
          color: #999;
          font-weight: 500;
        }

        .ratio-value .value,
        .ratio-benchmark .value {
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .ratio-progress {
          margin-bottom: 12px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background-color: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .ratio-interpretation {
          font-size: 12px;
          color: #666;
          line-height: 1.5;
        }

        .summary-section {
          background-color: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .summary-section h3 {
          margin: 0 0 20px 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .health-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
        }

        .health-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .health-label {
          font-size: 13px;
          font-weight: 600;
          color: #666;
        }

        .health-bar {
          width: 100%;
          height: 24px;
          background-color: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
        }

        .health-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .health-value {
          font-size: 12px;
          font-weight: 500;
          color: #333;
        }

        @media (max-width: 768px) {
          .ratios-container {
            flex-direction: column;
          }

          .category-nav {
            min-width: auto;
            flex-direction: row;
            overflow-x: auto;
            gap: 8px;
          }

          .category-btn {
            flex-shrink: 0;
          }

          .ratios-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default RatiosDashboard;
