// Heavy report exporter with PDF and Excel functionality
// This file is lazy loaded to reduce initial bundle size
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
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

export class HeavyReportExporter {
  private static instance: HeavyReportExporter;

  static getInstance(): HeavyReportExporter {
    if (!this.instance) {
      this.instance = new HeavyReportExporter();
    }
    return this.instance;
  }

  // PDF Export avec tables et graphiques
  async exportToPDF(
    data: TableData | TableData[],
    options: ExportOptions = { format: 'pdf' }
  ): Promise<string> {
    try {
      const pdf = new jsPDF({
        orientation: options.orientation || 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const tables = Array.isArray(data) ? data : [data];
      let currentY = 20;

      // En-tête avec logo et informations de l'entreprise
      if (options.companyInfo) {
        await this.addPDFHeader(pdf, options.companyInfo, options.title, options.subtitle);
        currentY = 60;
      }

      // Titre principal
      if (options.title) {
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(options.title, 20, currentY);
        currentY += 10;
      }

      // Sous-titre
      if (options.subtitle) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(options.subtitle, 20, currentY);
        currentY += 10;
      }

      // Tables
      for (const table of tables) {
        if (currentY > 250) {
          pdf.addPage();
          currentY = 20;
        }

        if (table.title) {
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(table.title, 20, currentY);
          currentY += 8;
        }

        // @ts-ignore - jspdf-autotable types
        pdf.autoTable({
          head: [table.headers],
          body: table.rows.map(row => row.map(cell => cell || '')),
          startY: currentY,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [41, 128, 185], textColor: 255 },
          alternateRowStyles: { fillColor: [245, 245, 245] },
        });

        currentY = (pdf as any).lastAutoTable.finalY + 10;
      }

      // Pied de page avec date et filigrane
      const pageCount = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128);
        pdf.text(`Page ${i} - ${options.companyInfo?.name || 'Rapport'} - ${format(new Date(), 'dd/MM/yyyy')}`, 20, 290);
      }

      // Filigrane
      if (options.watermark) {
        await this.addPDFWatermark(pdf, options.watermark);
      }

      // Téléchargement
      const fileName = `${options.title || 'rapport'}_${format(new Date(), 'yyyy-MM-dd_HH-mm', { locale: fr })}.pdf`;
      pdf.save(fileName);

      return `PDF export completed: ${fileName}`;
    } catch (error) {
      console.error('PDF export error:', error);
      throw new Error('Failed to export PDF');
    }
  }

  // Excel Export avec feuilles multiples et formatage
  async exportToExcel(
    data: TableData | TableData[],
    options: ExportOptions = { format: 'excel' }
  ): Promise<string> {
    try {
      const workbook = XLSX.utils.book_new();
      const tables = Array.isArray(data) ? data : [data];

      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        const worksheet = XLSX.utils.aoa_to_sheet([]);

        // Add title if present
        if (table.title) {
          XLSX.utils.sheet_add_aoa(worksheet, [[table.title]], { origin: 'A1' });
          XLSX.utils.sheet_add_aoa(worksheet, [[]], { origin: 'A2' });
        }

        // Add headers
        const headerRow = table.title ? 2 : 0;
        XLSX.utils.sheet_add_aoa(worksheet, [table.headers], { origin: `A${headerRow + 1}` });

        // Add data rows
        XLSX.utils.sheet_add_aoa(worksheet, table.rows, { origin: `A${headerRow + 2}` });

        // Add summary if present
        if (table.summary) {
          const summaryStartRow = headerRow + table.rows.length + 3;
          XLSX.utils.sheet_add_aoa(worksheet, [['Summary']], { origin: `A${summaryStartRow}` });

          let summaryRow = summaryStartRow + 1;
          for (const [key, value] of Object.entries(table.summary)) {
            XLSX.utils.sheet_add_aoa(worksheet, [[key, value]], { origin: `A${summaryRow}` });
            summaryRow++;
          }
        }

        // Style the worksheet
        this.applyExcelStyling(worksheet, table.headers.length, table.rows.length);

        // Add worksheet to workbook
        const sheetName = table.title || `Sheet${i + 1}`;
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31)); // Excel sheet name limit
      }

      // Generate filename and save
      const fileName = `${options.title || 'export'}_${format(new Date(), 'yyyy-MM-dd_HH-mm', { locale: fr })}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      return `Excel export completed: ${fileName}`;
    } catch (error) {
      console.error('Excel export error:', error);
      throw new Error('Failed to export Excel');
    }
  }

  private async addPDFHeader(pdf: any, companyInfo: any, title?: string, subtitle?: string) {
    let currentY = 20;

    // Logo
    if (companyInfo.logo) {
      try {
        // Add logo image (simplified - would need actual image handling)
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text(companyInfo.name, 20, currentY);
      } catch (error) {
        console.warn('Could not load company logo:', error);
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text(companyInfo.name, 20, currentY);
      }
    } else {
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(companyInfo.name, 20, currentY);
    }

    currentY += 8;

    // Company info
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    if (companyInfo.address) {
      pdf.text(companyInfo.address, 20, currentY);
      currentY += 5;
    }
    if (companyInfo.phone) {
      pdf.text(`Tel: ${companyInfo.phone}`, 20, currentY);
      currentY += 5;
    }
    if (companyInfo.email) {
      pdf.text(`Email: ${companyInfo.email}`, 20, currentY);
      currentY += 5;
    }

    // Date
    pdf.setFontSize(8);
    pdf.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 150, currentY);
  }

  private async addPDFWatermark(pdf: any, text: string) {
    const pageCount = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.saveGraphicsState();
      pdf.setTextColor(200, 200, 200);
      pdf.setFontSize(50);
      pdf.setFont('helvetica', 'bold');

      // Rotate and position watermark
      pdf.text(text, 105, 148, {
        angle: 45,
        align: 'center'
      });
      pdf.restoreGraphicsState();
    }
  }

  private applyExcelStyling(worksheet: any, columnCount: number, rowCount: number) {
    // Basic styling - headers in bold
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let col = range.s.c; col <= range.e.c; col++) {
      const headerCellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[headerCellAddress]) continue;

      if (!worksheet[headerCellAddress].s) {
        worksheet[headerCellAddress].s = {};
      }
      worksheet[headerCellAddress].s.font = { bold: true };
    }
  }
}