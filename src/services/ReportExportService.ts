// Service d'export de rapports avec génération PDF et Excel
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
  rows: any[][];
  title?: string;
  summary?: Record<string, any>;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie';
  title: string;
  data: any[];
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
      } else if (options.title) {
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text(options.title, 20, currentY);
        currentY += 15;

        if (options.subtitle) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          pdf.text(options.subtitle, 20, currentY);
          currentY += 10;
        }
      }

      // Date de génération
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 20, currentY);
      currentY += 15;

      // Tables
      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];

        if (table.title) {
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(table.title, 20, currentY);
          currentY += 10;
        }

        // Tableau principal
        const tableConfig = {
          startY: currentY,
          head: [table.headers],
          body: table.rows,
          theme: 'grid',
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 10
          },
          bodyStyles: {
            fontSize: 9,
            textColor: 50
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          columnStyles: this.getColumnStyles(table.headers),
          margin: { left: 20, right: 20 },
          didDrawPage: (data) => {
            // Pied de page
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.text(
              `Page ${data.pageNumber} - ${options.companyInfo?.name || 'Rapport'} - ${format(new Date(), 'dd/MM/yyyy')}`,
              20,
              pdf.internal.pageSize.height - 10
            );
          }
        };

        pdf.autoTable(tableConfig);
        currentY = pdf.lastAutoTable?.finalY + 15 || currentY + 50;

        // Résumé si disponible
        if (table.summary) {
          this.addPDFSummary(pdf, table.summary, currentY);
          currentY += 30;
        }

        // Nouvelle page pour le tableau suivant (sauf le dernier)
        if (i < tables.length - 1) {
          pdf.addPage();
          currentY = 20;
        }
      }

      // Filigrane
      if (options.watermark) {
        this.addPDFWatermark(pdf, options.watermark);
      }

      // Générer le blob et créer l'URL de téléchargement
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);

      return url;
    } catch (error) {
      console.error('Erreur lors de la génération PDF:', error instanceof Error ? error.message : String(error));
      throw new Error('Impossible de générer le rapport PDF');
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
        const sheetName = table.title || `Feuille ${i + 1}`;

        // Créer les données avec en-têtes
        const worksheetData = [
          table.headers,
          ...table.rows
        ];

        // Créer la feuille
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // Formatage des colonnes
        const range = XLSX.utils.decode_range(worksheet['!ref']!);

        // Largeurs de colonnes automatiques
        const colWidths = table.headers.map(header => ({
          wch: Math.max(header.length, 15)
        }));
        worksheet['!cols'] = colWidths;

        // Style des en-têtes
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
          if (!worksheet[cellAddress]) continue;

          worksheet[cellAddress].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "2980B9" } },
            border: {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" }
            }
          };
        }

        // Bordures pour toutes les cellules
        for (let row = range.s.r; row <= range.e.r; row++) {
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            if (!worksheet[cellAddress]) continue;

            if (!worksheet[cellAddress].s) {
              worksheet[cellAddress].s = {};
            }

            worksheet[cellAddress].s.border = {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" }
            };
          }
        }

        // Ajouter la feuille au classeur
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        // Ajouter une feuille de résumé si disponible
        if (table.summary) {
          this.addExcelSummarySheet(workbook, table.summary, `${sheetName} - Résumé`);
        }
      }

      // Métadonnées du fichier
      workbook.Props = {
        Title: options.title || 'Rapport Financier',
        Subject: options.subtitle || 'Rapport généré automatiquement',
        Author: options.companyInfo?.name || 'CassKai',
        CreatedDate: new Date()
      };

      // Générer le fichier Excel
      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
        bookSST: true
      });

      const excelBlob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = URL.createObjectURL(excelBlob);
      return url;
    } catch (error) {
      console.error('Erreur lors de la génération Excel:', error instanceof Error ? error.message : String(error));
      throw new Error('Impossible de générer le rapport Excel');
    }
  }

  // CSV Export simple et efficace
  exportToCSV(
    data: TableData,
    options: ExportOptions = { format: 'csv' }
  ): string {
    try {
      const csvContent = [
        data.headers.join(','),
        ...data.rows.map(row =>
          row.map(cell =>
            typeof cell === 'string' && cell.includes(',')
              ? `"${cell.replace(/"/g, '""')}"`
              : cell
          ).join(',')
        )
      ].join('\n');

      const csvBlob = new Blob([`\ufeff${  csvContent}`], {
        type: 'text/csv;charset=utf-8'
      });

      const url = URL.createObjectURL(csvBlob);
      return url;
    } catch (error) {
      console.error('Erreur lors de la génération CSV:', error instanceof Error ? error.message : String(error));
      throw new Error('Impossible de générer le rapport CSV');
    }
  }

  // Téléchargement automatique
  downloadFile(url: string, filename: string) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Nettoyer l'URL après téléchargement
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Helpers privés
  private async addPDFHeader(pdf: any, companyInfo: any, title?: string, subtitle?: string) {
    // Logo si disponible
    if (companyInfo.logo) {
      try {
        pdf.addImage(companyInfo.logo, 'PNG', 20, 10, 30, 20);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.warn('Impossible de charger le logo:', errorMsg);
      }
    }

    // Informations entreprise
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(companyInfo.name, 60, 20);

    if (companyInfo.address || companyInfo.phone || companyInfo.email) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      let yPos = 25;

      if (companyInfo.address) {
        pdf.text(companyInfo.address, 60, yPos);
        yPos += 5;
      }
      if (companyInfo.phone) {
        pdf.text(`Tél: ${companyInfo.phone}`, 60, yPos);
        yPos += 5;
      }
      if (companyInfo.email) {
        pdf.text(`Email: ${companyInfo.email}`, 60, yPos);
      }
    }

    // Titre du rapport
    if (title) {
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, 20, 45);
    }

    if (subtitle) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(subtitle, 20, 52);
    }
  }

  private getColumnStyles(headers: string[]): any {
    const styles: any = {};

    headers.forEach((header, index) => {
      if (header.toLowerCase().includes('montant') || header.toLowerCase().includes('prix') || header.toLowerCase().includes('total')) {
        styles[index] = { halign: 'right' };
      } else if (header.toLowerCase().includes('date')) {
        styles[index] = { halign: 'center' };
      }
    });

    return styles;
  }

  private addPDFSummary(pdf: any, summary: Record<string, any>, startY: number) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Résumé:', 20, startY);

    let yPos = startY + 8;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    Object.entries(summary).forEach(([key, value]) => {
      pdf.text(`${key}: ${value}`, 25, yPos);
      yPos += 5;
    });
  }

  private addPDFWatermark(pdf: any, text: string) {
    const pageCount = pdf.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setGState(new pdf.GState({ opacity: 0.1 }));
      pdf.setFontSize(50);
      pdf.setTextColor(128);

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.text(text, pageWidth / 2, pageHeight / 2, {
        angle: 45,
        align: 'center'
      });
    }
  }

  private addExcelSummarySheet(workbook: any, summary: Record<string, any>, sheetName: string) {
    const summaryData = [
      ['Élément', 'Valeur'],
      ...Object.entries(summary)
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(summaryData);

    // Style des en-têtes du résumé
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "2980B9" } }
    };

    worksheet['A1'].s = headerStyle;
    worksheet['B1'].s = headerStyle;

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }
}

// Export singleton
export const reportExportService = ReportExportService.getInstance();
