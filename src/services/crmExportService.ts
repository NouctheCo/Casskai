/**
 * CRM Export Service
 * Advanced export functionality for CRM data
 * Supports CSV, Excel, PDF exports with various formats
 */

import {
  Client,
  Contact,
  Opportunity,
  CommercialAction,
  CrmStats,
  PipelineStats
} from '@/types/crm.types';
import {
  ConversionMetrics,
  SalesCycleMetrics,
  ForecastData,
  ClientHealthScore
} from './crmAnalyticsService';

class CRMExportService {
  private static instance: CRMExportService;

  private constructor() {}

  public static getInstance(): CRMExportService {
    if (!CRMExportService.instance) {
      CRMExportService.instance = new CRMExportService();
    }
    return CRMExportService.instance;
  }

  /**
   * Export clients to CSV
   */
  exportClientsToCSV(clients: Client[]): void {
    const headers = [
      'company_name',
      'industry',
      'size',
      'status',
      'address',
      'city',
      'postal_code',
      'country',
      'website',
      'total_revenue',
      'last_interaction',
      'created_at'
    ];

    const csv = this.arrayToCSV(clients, headers);
    const filename = `clients_export_${this.getDateString()}.csv`;
    this.downloadFile(csv, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Export clients to Excel (CSV with UTF-8 BOM)
   */
  exportClientsToExcel(clients: Client[]): void {
    const headers = [
      'company_name',
      'industry',
      'size',
      'status',
      'address',
      'city',
      'postal_code',
      'country',
      'website',
      'total_revenue',
      'last_interaction',
      'created_at'
    ];

    const csv = this.arrayToCSV(clients, headers);
    const bom = '\uFEFF'; // UTF-8 BOM for Excel
    const content = bom + csv;
    const filename = `clients_export_${this.getDateString()}.csv`;
    this.downloadFile(content, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Export contacts to CSV
   */
  exportContactsToCSV(contacts: Contact[]): void {
    const headers = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'position',
      'client_id',
      'is_primary',
      'notes',
      'created_at'
    ];

    const csv = this.arrayToCSV(contacts, headers);
    const filename = `contacts_export_${this.getDateString()}.csv`;
    this.downloadFile(csv, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Export opportunities to CSV
   */
  exportOpportunitiesToCSV(opportunities: Opportunity[]): void {
    const headers = [
      'title',
      'client_name',
      'contact_name',
      'stage',
      'value',
      'probability',
      'expected_close_date',
      'actual_close_date',
      'source',
      'assigned_to',
      'priority',
      'next_action',
      'next_action_date',
      'created_at'
    ];

    const csv = this.arrayToCSV(opportunities, headers);
    const filename = `opportunities_export_${this.getDateString()}.csv`;
    this.downloadFile(csv, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Export opportunities to Excel
   */
  exportOpportunitiesToExcel(opportunities: Opportunity[]): void {
    const headers = [
      'title',
      'client_name',
      'contact_name',
      'stage',
      'value',
      'probability',
      'expected_close_date',
      'actual_close_date',
      'source',
      'assigned_to',
      'priority',
      'next_action',
      'next_action_date',
      'created_at'
    ];

    const csv = this.arrayToCSV(opportunities, headers);
    const bom = '\uFEFF';
    const content = bom + csv;
    const filename = `opportunities_export_${this.getDateString()}.csv`;
    this.downloadFile(content, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Export commercial actions to CSV
   */
  exportActionsToCSV(actions: CommercialAction[]): void {
    const headers = [
      'type',
      'title',
      'description',
      'client_name',
      'contact_name',
      'opportunity_title',
      'status',
      'due_date',
      'completed_date',
      'assigned_to',
      'priority',
      'outcome',
      'follow_up_required',
      'follow_up_date',
      'duration_minutes',
      'created_at'
    ];

    const csv = this.arrayToCSV(actions, headers);
    const filename = `actions_export_${this.getDateString()}.csv`;
    this.downloadFile(csv, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Export pipeline report with analytics
   */
  exportPipelineReport(
    opportunities: Opportunity[],
    pipelineStats: PipelineStats[],
    conversionMetrics: ConversionMetrics
  ): void {
    let content = 'PIPELINE REPORT\n';
    content += `Generated: ${new Date().toLocaleString()}\n\n`;

    // Summary metrics
    content += '=== SUMMARY ===\n';
    content += `Total Opportunities: ${conversionMetrics.total_opportunities}\n`;
    content += `Total Pipeline Value: €${conversionMetrics.total_pipeline_value.toLocaleString()}\n`;
    content += `Weighted Pipeline Value: €${conversionMetrics.weighted_pipeline_value.toLocaleString()}\n`;
    content += `Average Deal Size: €${conversionMetrics.average_deal_size.toLocaleString()}\n`;
    content += `Conversion Rate: ${conversionMetrics.conversion_rate.toFixed(1)}%\n`;
    content += `Won Opportunities: ${conversionMetrics.won_opportunities}\n`;
    content += `Lost Opportunities: ${conversionMetrics.lost_opportunities}\n\n`;

    // Pipeline by stage
    content += '=== PIPELINE BY STAGE ===\n';
    content += 'Stage,Count,Value,Avg Deal Size\n';
    pipelineStats.forEach(stat => {
      content += `${stat.stage},${stat.count},€${stat.value.toLocaleString()},€${stat.avg_deal_size.toLocaleString()}\n`;
    });
    content += '\n';

    // Opportunities detail
    content += '=== OPPORTUNITIES DETAIL ===\n';
    const oppHeaders = [
      'title',
      'client_name',
      'stage',
      'value',
      'probability',
      'expected_close_date',
      'assigned_to'
    ];
    content += oppHeaders.join(',') + '\n';

    opportunities
      .filter(o => !['won', 'lost'].includes(o.stage))
      .forEach(opp => {
        const row = oppHeaders.map(header => {
          const value = (opp as any)[header] ?? '';
          const stringValue = String(value).replace(/"/g, '""');
          return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
        });
        content += row.join(',') + '\n';
      });

    const filename = `pipeline_report_${this.getDateString()}.csv`;
    const bom = '\uFEFF';
    this.downloadFile(bom + content, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Export sales forecast report
   */
  exportForecastReport(forecast: ForecastData[]): void {
    let content = 'SALES FORECAST REPORT\n';
    content += `Generated: ${new Date().toLocaleString()}\n\n`;

    content += 'Month,Committed Revenue,Best Case Revenue,Pipeline Revenue,Confidence\n';
    forecast.forEach(month => {
      content += `${month.month},€${month.committed_revenue.toLocaleString()},€${month.best_case_revenue.toLocaleString()},€${month.pipeline_revenue.toLocaleString()},${month.confidence_level}\n`;
    });

    const filename = `sales_forecast_${this.getDateString()}.csv`;
    const bom = '\uFEFF';
    this.downloadFile(bom + content, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Export sales cycle analysis
   */
  exportSalesCycleReport(salesCycle: SalesCycleMetrics, opportunities: Opportunity[]): void {
    let content = 'SALES CYCLE ANALYSIS\n';
    content += `Generated: ${new Date().toLocaleString()}\n\n`;

    content += '=== SUMMARY ===\n';
    content += `Average Days to Close: ${salesCycle.average_days_to_close}\n`;
    content += `Median Days to Close: ${salesCycle.median_days_to_close}\n`;
    content += `Fastest Deal: ${salesCycle.fastest_deal_days} days\n`;
    content += `Slowest Deal: ${salesCycle.slowest_deal_days} days\n`;
    content += `Velocity per Month: ${salesCycle.velocity_per_month} deals\n\n`;

    content += '=== AVERAGE BY STAGE ===\n';
    content += 'Stage,Average Days\n';
    Object.entries(salesCycle.average_by_stage).forEach(([stage, days]) => {
      content += `${stage},${days}\n`;
    });
    content += '\n';

    content += '=== CLOSED DEALS DETAIL ===\n';
    const closedOpps = opportunities.filter(o => ['won', 'lost'].includes(o.stage) && o.actual_close_date);
    content += 'Title,Client,Stage,Value,Days to Close,Created,Closed\n';

    closedOpps.forEach(opp => {
      const created = new Date(opp.created_at);
      const closed = new Date(opp.actual_close_date!);
      const daysToClose = Math.floor((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      content += `"${opp.title}","${opp.client_name || ''}",${opp.stage},€${opp.value},${daysToClose},${created.toISOString().substring(0, 10)},${closed.toISOString().substring(0, 10)}\n`;
    });

    const filename = `sales_cycle_analysis_${this.getDateString()}.csv`;
    const bom = '\uFEFF';
    this.downloadFile(bom + content, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Export client health scores
   */
  exportClientHealthReport(healthScores: ClientHealthScore[]): void {
    let content = 'CLIENT HEALTH REPORT\n';
    content += `Generated: ${new Date().toLocaleString()}\n\n`;

    content += 'Client,Health Score,Risk Level,Revenue,Opportunities,Days Since Interaction,Win Rate,Recommendations\n';

    healthScores.forEach(score => {
      const recommendations = score.recommendations.join('; ');
      content += `"${score.client_name}",${score.score},${score.risk_level},${score.factors.revenue_contribution},${score.factors.opportunity_count},${score.factors.last_interaction_days},${score.factors.win_rate}%,"${recommendations}"\n`;
    });

    const filename = `client_health_${this.getDateString()}.csv`;
    const bom = '\uFEFF';
    this.downloadFile(bom + content, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Export complete CRM dashboard report
   */
  exportDashboardReport(
    clients: Client[],
    opportunities: Opportunity[],
    actions: CommercialAction[],
    stats: CrmStats,
    conversionMetrics: ConversionMetrics
  ): void {
    let content = 'CRM DASHBOARD REPORT\n';
    content += `Generated: ${new Date().toLocaleString()}\n`;
    content += '='.repeat(80) + '\n\n';

    // Key metrics
    content += '=== KEY METRICS ===\n';
    content += `Total Clients: ${stats.total_clients}\n`;
    content += `Active Clients: ${stats.active_clients}\n`;
    content += `Prospects: ${stats.prospects}\n`;
    content += `Total Opportunities: ${stats.total_opportunities}\n`;
    content += `Total Pipeline Value: €${stats.opportunities_value.toLocaleString()}\n`;
    content += `Won Opportunities: ${stats.won_opportunities}\n`;
    content += `Won Value: €${stats.won_value.toLocaleString()}\n`;
    content += `Conversion Rate: ${stats.conversion_rate.toFixed(1)}%\n`;
    content += `Monthly Revenue: €${stats.monthly_revenue.toLocaleString()}\n`;
    content += `Revenue Growth: ${stats.revenue_growth.toFixed(1)}%\n\n`;

    // Activity metrics
    content += '=== ACTIVITY METRICS ===\n';
    content += `Total Actions: ${actions.length}\n`;
    content += `Completed Actions: ${actions.filter(a => a.status === 'completed').length}\n`;
    content += `Pending Actions: ${stats.pending_actions}\n`;
    content += `Overdue Actions: ${stats.overdue_actions}\n\n`;

    // Conversion metrics
    content += '=== CONVERSION METRICS ===\n';
    content += `Average Deal Size: €${conversionMetrics.average_deal_size.toLocaleString()}\n`;
    content += `Weighted Pipeline: €${conversionMetrics.weighted_pipeline_value.toLocaleString()}\n\n`;

    // Top opportunities
    content += '=== TOP OPPORTUNITIES (by value) ===\n';
    const topOpportunities = [...opportunities]
      .filter(o => !['won', 'lost'].includes(o.stage))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    content += 'Title,Client,Stage,Value,Probability,Expected Close\n';
    topOpportunities.forEach(opp => {
      content += `"${opp.title}","${opp.client_name || ''}",${opp.stage},€${opp.value},${opp.probability}%,${opp.expected_close_date}\n`;
    });
    content += '\n';

    // Top clients by revenue
    content += '=== TOP CLIENTS (by revenue) ===\n';
    const topClients = [...clients]
      .sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))
      .slice(0, 10);

    content += 'Company,Status,Industry,Revenue,Last Interaction\n';
    topClients.forEach(client => {
      content += `"${client.company_name}",${client.status},${client.industry || 'N/A'},€${(client.total_revenue || 0).toLocaleString()},${client.last_interaction || 'N/A'}\n`;
    });

    const filename = `crm_dashboard_report_${this.getDateString()}.csv`;
    const bom = '\uFEFF';
    this.downloadFile(bom + content, filename, 'text/csv;charset=utf-8;');
  }

  // Helper methods

  private arrayToCSV(data: any[], headers: string[]): string {
    const headerRow = headers.join(',');
    const rows = data.map(item =>
      headers.map(header => {
        const value = item[header] ?? '';
        const stringValue = String(value).replace(/"/g, '""');
        return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
          ? `"${stringValue}"`
          : stringValue;
      }).join(',')
    );
    return [headerRow, ...rows].join('\n');
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  private getDateString(): string {
    const now = new Date();
    return now.toISOString().substring(0, 10);
  }
}

// Export singleton instance
export const crmExportService = CRMExportService.getInstance();
export default crmExportService;
