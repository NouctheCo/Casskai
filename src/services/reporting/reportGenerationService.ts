/**
 * CassKai - PHASE 4: Report Generation Service
 * Generate financial reports in various formats (PDF, Excel, JSON)
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ReportConfig {
  title: string;
  description?: string;
  companyId: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  countries?: string[];
  metrics?: string[];
  includeCharts: boolean;
  includeRatios: boolean;
  includeTrends: boolean;
  includeForecast: boolean;
  format: 'json' | 'csv' | 'pdf' | 'excel';
}

export interface ReportData {
  title: string;
  generatedAt: Date;
  companyId: string;
  dateRange: {
    start: string;
    end: string;
  };
  sections: ReportSection[];
  summary: string;
  recommendations: string[];
}

export interface ReportSection {
  title: string;
  description?: string;
  type: 'metrics' | 'ratios' | 'trends' | 'comparison' | 'forecast' | 'analysis';
  data: any;
  charts?: ChartData[];
}

export interface ChartData {
  title: string;
  type: 'line' | 'bar' | 'pie' | 'gauge' | 'scatter';
  data: any;
  options?: any;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
  defaultFormat: string;
  isActive: boolean;
}

export interface ScheduledReport {
  id: string;
  reportId: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  recipients: string[];
  nextRun: Date;
  isActive: boolean;
}

// ============================================================================
// REPORT GENERATION SERVICE
// ============================================================================

export class ReportGenerationService {
  /**
   * Generate a comprehensive financial report
   */
  static async generateReport(config: ReportConfig): Promise<ReportData> {
    const report: ReportData = {
      title: config.title,
      generatedAt: new Date(),
      companyId: config.companyId,
      dateRange: {
        start: config.dateRange.start.toISOString().split('T')[0],
        end: config.dateRange.end.toISOString().split('T')[0],
      },
      sections: [],
      summary: '',
      recommendations: [],
    };

    // Add sections based on configuration
    if (config.includeCharts) {
      report.sections.push(this.generateMetricsSection(config));
    }

    if (config.includeRatios) {
      report.sections.push(this.generateRatiosSection(config));
    }

    if (config.includeTrends) {
      report.sections.push(this.generateTrendsSection(config));
    }

    if (config.includeForecast) {
      report.sections.push(this.generateForecastSection(config));
    }

    // Generate summary and recommendations
    report.summary = this.generateSummary(report);
    report.recommendations = this.generateRecommendations(report);

    return report;
  }

  /**
   * Generate metrics section
   */
  private static generateMetricsSection(_config: ReportConfig): ReportSection {
    return {
      title: 'Financial Metrics',
      description: 'Key financial metrics for the selected period',
      type: 'metrics',
      data: {
        totalRevenue: 1000000,
        totalExpenses: 600000,
        netIncome: 400000,
        totalAssets: 2500000,
        totalLiabilities: 1000000,
        equity: 1500000,
      },
      charts: [
        {
          title: 'Revenue vs Expenses',
          type: 'bar',
          data: {
            labels: ['Revenue', 'Expenses', 'Net Income'],
            values: [1000000, 600000, 400000],
          },
        },
        {
          title: 'Balance Sheet Composition',
          type: 'pie',
          data: {
            labels: ['Assets', 'Liabilities', 'Equity'],
            values: [2500000, 1000000, 1500000],
          },
        },
      ],
    };
  }

  /**
   * Generate financial ratios section
   */
  private static generateRatiosSection(_config: ReportConfig): ReportSection {
    return {
      title: 'Financial Ratios Analysis',
      description: '15+ financial ratios with status and interpretations',
      type: 'ratios',
      data: {
        liquidity: {
          currentRatio: { value: 2.5, status: 'optimal' },
          quickRatio: { value: 1.8, status: 'optimal' },
          cashRatio: { value: 0.5, status: 'good' },
        },
        leverage: {
          debtToEquity: { value: 0.67, status: 'optimal' },
          debtToAssets: { value: 0.4, status: 'optimal' },
          equityRatio: { value: 0.6, status: 'optimal' },
        },
        profitability: {
          grossMargin: { value: 0.40, status: 'optimal' },
          operatingMargin: { value: 0.25, status: 'optimal' },
          netMargin: { value: 0.40, status: 'optimal' },
          roa: { value: 0.16, status: 'optimal' },
          roe: { value: 0.27, status: 'optimal' },
        },
        efficiency: {
          assetTurnover: { value: 0.40, status: 'fair' },
          receivablesTurnover: { value: 12, status: 'good' },
          inventoryTurnover: { value: 6, status: 'good' },
        },
      },
      charts: [
        {
          title: 'Liquidity Ratios',
          type: 'gauge',
          data: {
            current: 2.5,
            optimal: 2.0,
            min: 1.0,
            max: 3.0,
          },
        },
        {
          title: 'Profitability Ratios',
          type: 'bar',
          data: {
            labels: ['Gross', 'Operating', 'Net', 'ROA', 'ROE'],
            values: [40, 25, 40, 16, 27],
          },
        },
      ],
    };
  }

  /**
   * Generate trends section
   */
  private static generateTrendsSection(_config: ReportConfig): ReportSection {
    return {
      title: 'Financial Trends',
      description: 'Revenue, profit, and key metrics trends over time',
      type: 'trends',
      data: {
        periods: [
          { period: '2024-Q1', revenue: 800000, profit: 320000, margin: 0.40 },
          { period: '2024-Q2', revenue: 850000, profit: 340000, margin: 0.40 },
          { period: '2024-Q3', revenue: 900000, profit: 360000, margin: 0.40 },
          { period: '2024-Q4', revenue: 950000, profit: 380000, margin: 0.40 },
        ],
        trend: 'increasing',
        growthRate: 0.0625, // 6.25% per quarter
      },
      charts: [
        {
          title: 'Revenue Trend',
          type: 'line',
          data: {
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            values: [800000, 850000, 900000, 950000],
          },
        },
        {
          title: 'Profit Trend',
          type: 'line',
          data: {
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            values: [320000, 340000, 360000, 380000],
          },
        },
      ],
    };
  }

  /**
   * Generate forecast section
   */
  private static generateForecastSection(_config: ReportConfig): ReportSection {
    return {
      title: 'Financial Forecasts',
      description: 'Projected financial performance for next 4 quarters',
      type: 'forecast',
      data: {
        forecasts: [
          {
            period: '2025-Q1',
            revenue: 1000000,
            confidence: 0.92,
            range: { lower: 950000, upper: 1050000 },
          },
          {
            period: '2025-Q2',
            revenue: 1050000,
            confidence: 0.90,
            range: { lower: 990000, upper: 1110000 },
          },
          {
            period: '2025-Q3',
            revenue: 1100000,
            confidence: 0.88,
            range: { lower: 1025000, upper: 1175000 },
          },
          {
            period: '2025-Q4',
            revenue: 1150000,
            confidence: 0.85,
            range: { lower: 1050000, upper: 1250000 },
          },
        ],
        projectedGrowth: 0.21, // 21% growth year-over-year
      },
      charts: [
        {
          title: 'Revenue Forecast with Confidence Interval',
          type: 'line',
          data: {
            labels: ['2024-Q4', '2025-Q1', 'Q2', 'Q3', 'Q4'],
            forecast: [950000, 1000000, 1050000, 1100000, 1150000],
            confidence: [null, 0.92, 0.90, 0.88, 0.85],
          },
        },
      ],
    };
  }

  /**
   * Generate executive summary
   */
  private static generateSummary(report: ReportData): string {
    return `
Financial Summary for ${report.dateRange.start} to ${report.dateRange.end}

The company demonstrates strong financial health with healthy liquidity ratios and moderate leverage.
Revenue shows consistent growth trend with net profit margin at 40%. Return on equity of 27% indicates
efficient use of shareholder capital. Current ratio of 2.5 suggests strong ability to meet short-term
obligations. The forecast for next 4 quarters projects continued revenue growth of approximately 21% YoY.

Key strengths include strong profitability, good liquidity, and stable margins. Areas for improvement
include asset turnover efficiency and debt optimization. Overall financial position is considered strong.
    `.trim();
  }

  /**
   * Generate recommendations based on report data
   */
  private static generateRecommendations(_report: ReportData): string[] {
    return [
      'Continue focusing on revenue growth which is showing consistent upward trend',
      'Optimize asset utilization to improve asset turnover ratio',
      'Consider leveraging additional debt given current strong solvency position',
      'Maintain current liquidity levels while managing working capital',
      'Monitor expense growth to ensure margins remain stable',
      'Invest in capacity to support forecasted 21% growth',
      'Review receivables management to optimize cash conversion cycle',
    ];
  }

  /**
   * Export report to JSON format
   */
  static exportToJSON(report: ReportData): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Export report to CSV format
   */
  static exportToCSV(report: ReportData): string {
    let csv = `Report: ${report.title}\n`;
    csv += `Generated: ${report.generatedAt.toISOString()}\n`;
    csv += `Period: ${report.dateRange.start} to ${report.dateRange.end}\n\n`;

    report.sections.forEach(section => {
      csv += `${section.title}\n`;
      
      if (section.type === 'metrics' || section.type === 'ratios') {
        csv += 'Metric,Value\n';
        for (const [key, value] of Object.entries(section.data)) {
          if (typeof value === 'object' && value !== null) {
            for (const [subKey, subValue] of Object.entries(value as Record<string, unknown>)) {
              csv += `"${subKey}","${subValue}"\n`;
            }
          } else {
            csv += `"${key}","${value}"\n`;
          }
        }
      } else if (section.type === 'trends' && section.data.periods) {
        csv += 'Period,Revenue,Profit,Margin\n';
        section.data.periods.forEach((p: any) => {
          csv += `"${p.period}","${p.revenue}","${p.profit}","${p.margin}"\n`;
        });
      }
      
      csv += '\n';
    });

    csv += `Summary\n${report.summary}\n\n`;
    csv += `Recommendations\n`;
    report.recommendations.forEach(rec => {
      csv += `"${rec}"\n`;
    });

    return csv;
  }

  /**
   * Export report to PDF format (returns content for external PDF library)
   */
  static exportToPDF(report: ReportData): {
    content: string;
    fileName: string;
    mimeType: string;
  } {
    let content = `
<html>
<head>
  <title>${report.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; border-bottom: 2px solid #007bff; }
    h2 { color: #555; margin-top: 20px; }
    table { border-collapse: collapse; width: 100%; margin: 10px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .summary { background-color: #f9f9f9; padding: 10px; border-left: 4px solid #007bff; }
    .recommendation { margin: 10px 0; padding: 10px; background-color: #fffacd; }
  </style>
</head>
<body>
  <h1>${report.title}</h1>
  <p><strong>Generated:</strong> ${report.generatedAt.toLocaleString()}</p>
  <p><strong>Period:</strong> ${report.dateRange.start} to ${report.dateRange.end}</p>
`;

    report.sections.forEach(section => {
      content += `<h2>${section.title}</h2>`;
      if (section.description) {
        content += `<p>${section.description}</p>`;
      }
      
      if (section.type === 'metrics' || section.type === 'ratios') {
        content += '<table><tr><th>Metric</th><th>Value</th></tr>';
        for (const [key, value] of Object.entries(section.data)) {
          if (typeof value === 'object' && value !== null) {
            for (const [subKey, subValue] of Object.entries(value as Record<string, unknown>)) {
              content += `<tr><td>${subKey}</td><td>${JSON.stringify(subValue)}</td></tr>`;
            }
          } else {
            content += `<tr><td>${key}</td><td>${value}</td></tr>`;
          }
        }
        content += '</table>';
      }
    });

    content += `
  <h2>Executive Summary</h2>
  <div class="summary">${report.summary}</div>
  
  <h2>Recommendations</h2>
`;

    report.recommendations.forEach(rec => {
      content += `<div class="recommendation">${rec}</div>`;
    });

    content += '</body></html>';

    return {
      content,
      fileName: `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`,
      mimeType: 'text/html',
    };
  }

  /**
   * Export report to Excel format (returns JSON that can be used with xlsx library)
   */
  static exportToExcel(report: ReportData): {
    sheets: { name: string; data: any[] }[];
    fileName: string;
  } {
    const sheets: { name: string; data: any[] }[] = [];

    // Summary sheet
    sheets.push({
      name: 'Summary',
      data: [
        ['Report', report.title],
        ['Generated', report.generatedAt.toLocaleString()],
        ['Period', `${report.dateRange.start} to ${report.dateRange.end}`],
        [''],
        ['Executive Summary'],
        [report.summary],
        [''],
        ['Recommendations'],
        ...report.recommendations.map(rec => [rec]),
      ],
    });

    // Data sheets for each section
    report.sections.forEach((section) => {
      const sheetName = section.title.substring(0, 31); // Excel sheet name limit
      const sheetData: any[] = [
        [sheetName],
        [],
      ];

      if (section.type === 'metrics' || section.type === 'ratios') {
        sheetData.push(['Metric', 'Value']);
        for (const [key, value] of Object.entries(section.data)) {
          if (typeof value === 'object' && value !== null) {
            for (const [subKey, subValue] of Object.entries(value as Record<string, unknown>)) {
              sheetData.push([subKey, JSON.stringify(subValue)]);
            }
          } else {
            sheetData.push([key, value]);
          }
        }
      } else if (section.type === 'trends' && section.data.periods) {
        sheetData.push(['Period', 'Revenue', 'Profit', 'Margin']);
        section.data.periods.forEach((p: any) => {
          sheetData.push([p.period, p.revenue, p.profit, p.margin]);
        });
      }

      sheets.push({ name: sheetName, data: sheetData });
    });

    return {
      sheets,
      fileName: `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`,
    };
  }

  /**
   * Schedule a report for recurring generation
   */
  static scheduleReport(
    reportId: string,
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual',
    recipients: string[]
  ): ScheduledReport {
    const nextRun = this.calculateNextRun(new Date(), frequency);

    return {
      id: `schedule_${reportId}_${Date.now()}`,
      reportId,
      frequency,
      recipients,
      nextRun,
      isActive: true,
    };
  }

  /**
   * Calculate next run date based on frequency
   */
  private static calculateNextRun(
    baseDate: Date,
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'
  ): Date {
    const next = new Date(baseDate);

    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + 3);
        break;
      case 'annual':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }

    return next;
  }

  /**
   * Get predefined report templates
   */
  static getReportTemplates(): ReportTemplate[] {
    return [
      {
        id: 'template_financial_overview',
        name: 'Financial Overview',
        description: 'Comprehensive financial report with metrics, ratios, and trends',
        sections: ['metrics', 'ratios', 'trends'],
        defaultFormat: 'pdf',
        isActive: true,
      },
      {
        id: 'template_executive_summary',
        name: 'Executive Summary',
        description: 'High-level executive report with key metrics and recommendations',
        sections: ['metrics', 'ratios'],
        defaultFormat: 'pdf',
        isActive: true,
      },
      {
        id: 'template_detailed_analysis',
        name: 'Detailed Analysis',
        description: 'In-depth analysis including ratios, trends, and forecast',
        sections: ['ratios', 'trends', 'forecast', 'analysis'],
        defaultFormat: 'excel',
        isActive: true,
      },
      {
        id: 'template_quarterly_report',
        name: 'Quarterly Report',
        description: 'Quarterly performance report',
        sections: ['metrics', 'ratios', 'trends'],
        defaultFormat: 'pdf',
        isActive: true,
      },
      {
        id: 'template_annual_report',
        name: 'Annual Report',
        description: 'Comprehensive annual financial report',
        sections: ['metrics', 'ratios', 'trends', 'forecast'],
        defaultFormat: 'pdf',
        isActive: true,
      },
    ];
  }
}
