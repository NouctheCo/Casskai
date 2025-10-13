// Service d'export de rapports avec génération PDF et Excel
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  orientation?: 'portrait' | 'landscape';
  title?: string;
  subtitle?: string;
  includeCharts?: boolean;
  watermark?: string;
  companyInfo?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
  };
}

export interface TableData {
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
  title?: string;
  summary?: Record<string, string | number>;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie';
  title: string;
  data: number[];
  labels: string[];
}

export class ReportExportService {
  private static instance: ReportExportService;

  static getInstance(): ReportExportService {
    if (!this.instance) {
      this.instance = new ReportExportService();
    }
    return this.instance;
  }

  // Lazy load the heavy export functionality
  private async loadHeavyExporter(): Promise<any> {
    const { HeavyReportExporter } = await import('./HeavyReportExporter');
    return HeavyReportExporter.getInstance();
  }

  // PDF Export avec tables et graphiques - lazy loaded
  async exportToPDF(
    data: TableData | TableData[],
    options: ExportOptions = { format: 'pdf' }
  ): Promise<string> {
    const heavyExporter = await this.loadHeavyExporter();
    return heavyExporter.exportToPDF(data, options);
  }

  // Excel Export avec feuilles multiples et formatage - lazy loaded
  async exportToExcel(
    data: TableData | TableData[],
    options: ExportOptions = { format: 'excel' }
  ): Promise<string> {
    const heavyExporter = await this.loadHeavyExporter();
    return heavyExporter.exportToExcel(data, options);
  }

  // CSV Export - lightweight, no lazy loading needed
  async exportToCSV(
    data: TableData | TableData[],
    options: ExportOptions = { format: 'csv' }
  ): Promise<string> {
    try {
      const tables = Array.isArray(data) ? data : [data];
      let csvContent = '';

      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];

        // Add title if present
        if (table.title) {
          csvContent += `"${table.title}"\n\n`;
        }

        // Add headers
        csvContent += table.headers.map(header => `"${header}"`).join(',') + '\n';

        // Add rows
        for (const row of table.rows) {
          csvContent += row.map(cell =>
            cell !== null && cell !== undefined ? `"${String(cell).replace(/"/g, '""')}"` : '""'
          ).join(',') + '\n';
        }

        // Add summary if present
        if (table.summary) {
          csvContent += '\n';
          for (const [key, value] of Object.entries(table.summary)) {
            csvContent += `"${key}","${value}"\n`;
          }
        }

        // Add separator between tables
        if (i < tables.length - 1) {
          csvContent += '\n\n';
        }
      }

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${options.title || 'export'}_${format(new Date(), 'yyyy-MM-dd_HH-mm', { locale: fr })}.csv`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return `CSV export completed: ${options.title || 'export'}.csv`;
    } catch (error) {
      console.error('CSV export error:', error);
      throw new Error('Failed to export CSV');
    }
  }
}

// Export singleton
export const reportExportService = ReportExportService.getInstance();