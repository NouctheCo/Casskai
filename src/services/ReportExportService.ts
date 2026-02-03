/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */
// Service d'export de rapports avec génération PDF et Excel
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { chartGenerationService } from './chartGenerationService';
import { logger } from '@/lib/logger';
import { getCurrentCompanyCurrency } from '@/lib/utils';
export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  orientation?: 'portrait' | 'landscape';
  title?: string;
  subtitle?: string;
  fileName?: string;
  includeCharts?: boolean;
  charts?: string[]; // Images base64 des graphiques
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
  subtitle?: string;
  summary?: Record<string, any> | any[][];
  footer?: string[];
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
      // Configuration PDF avec support UTF-8 amélioré
      const pdf = new jsPDF({
        orientation: options.orientation || 'portrait',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
        floatPrecision: 16 // Améliore la précision pour un meilleur rendu
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
      const resolvedCurrency = this.resolveCurrency();
      for (let i = 0; i < tables.length; i++) {
        const table = this.sanitizeTableData(tables[i]);
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
          styles: {
            cellPadding: 2
          } as any,
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 10
          },
          bodyStyles: {
            fontSize: 9,
            textColor: 50,
            overflow: 'linebreak' as const
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          columnStyles: this.getColumnStyles(table.headers),
          margin: { left: 20, right: 20 },
          didDrawPage: (data: any) => {
            // Pied de page avec numérotation correcte
            const pageCount = (pdf.internal as any).getNumberOfPages();
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.text(
              `Page ${data.pageNumber} / ${pageCount} - ${options.companyInfo?.name || 'Rapport'} - ${format(new Date(), 'dd/MM/yyyy')}`,
              20,
              pdf.internal.pageSize.height - 10
            );
          }
        } as any;
        autoTable(pdf, tableConfig);
        currentY = (pdf as any).lastAutoTable?.finalY + 15 || currentY + 50;
        // Résumé si disponible
        if (table.summary) {
          this.addPDFSummary(pdf, table.summary, currentY);
          currentY += 30;
        }
        // Note de devise sous le tableau
        currentY = this.addCurrencyNote(pdf, resolvedCurrency, currentY);
        // Nouvelle page pour le tableau suivant (sauf le dernier)
        if (i < tables.length - 1) {
          pdf.addPage();
          currentY = 20;
        }
      }
      // Ajouter les graphiques si disponibles
      if (options.includeCharts && options.charts && options.charts.length > 0) {
        pdf.addPage();
        currentY = 20;
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Graphiques et Visualisations', 20, currentY);
        currentY += 15;
        for (let i = 0; i < options.charts.length; i++) {
          const chartImage = options.charts[i];
          // Vérifier s'il reste assez d'espace sur la page
          if (currentY > pdf.internal.pageSize.height - 100) {
            pdf.addPage();
            currentY = 20;
          }
          // Ajouter le graphique
          try {
            pdf.addImage(chartImage, 'PNG', 20, currentY, 170, 85);
            currentY += 95;
          } catch (error) {
            logger.error('ReportExport', 'Erreur lors de l\'ajout du graphique:', error);
          }
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
      logger.error('ReportExport', 'Erreur lors de la génération PDF:', error instanceof Error ? error.message : String(error));
      throw new Error('Impossible de générer le rapport PDF');
    }
  }
  // Excel Export avec feuilles multiples et formatage
  async exportToExcel(
    data: TableData | TableData[],
    options: ExportOptions = { format: 'excel' }
  ): Promise<string> {
    try {
      const workbook = new ExcelJS.Workbook();
      const tables = Array.isArray(data) ? data : [data];
      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        const sheetName = table.title || `Feuille ${i + 1}`;
        // Créer la feuille
        const worksheet = workbook.addWorksheet(sheetName);
        // En-têtes + données
        worksheet.addRow(table.headers);
        table.rows.forEach((row) => worksheet.addRow(row));
        // Largeurs de colonnes automatiques
        worksheet.columns = table.headers.map((header) => ({
          header,
          width: Math.max(String(header).length, 15)
        }));
        // Style des en-têtes
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell) => {
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2980B9' } };
          cell.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        // Bordures pour toutes les cellules
        worksheet.eachRow((row) => {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        });
        // Ajouter une feuille de résumé si disponible
        if (table.summary) {
          this.addExcelSummarySheet(workbook, table.summary, `${sheetName} - Résumé`);
        }
      }
      // Métadonnées du fichier
      workbook.creator = options.companyInfo?.name || 'CassKai';
      workbook.title = options.title || 'Rapport Financier';
      workbook.subject = options.subtitle || 'Rapport généré automatiquement';
      workbook.created = new Date();
      // Générer le fichier Excel
      const excelBuffer = await workbook.xlsx.writeBuffer();
      const excelBlob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(excelBlob);
      return url;
    } catch (error) {
      logger.error('ReportExport', 'Erreur lors de la génération Excel:', error instanceof Error ? error.message : String(error));
      throw new Error('Impossible de générer le rapport Excel');
    }
  }
  // CSV Export simple et efficace
  exportToCSV(
    data: TableData | TableData[],
    _options: ExportOptions = { format: 'csv' }
  ): string {
    try {
      const tables = Array.isArray(data) ? data : [data];
      let csvContent = '';
      tables.forEach((table, index) => {
        if (index > 0) csvContent += '\n\n';
        if (table.title) csvContent += `${table.title}\n`;
        csvContent += [
          table.headers.join(','),
          ...table.rows.map(row =>
            row.map(cell =>
              typeof cell === 'string' && cell.includes(',')
                ? `"${cell.replace(/"/g, '""')}"`
                : cell
            ).join(',')
          )
        ].join('\n');
      });
      const csvBlob = new Blob([`\ufeff${csvContent}`], {
        type: 'text/csv;charset=utf-8'
      });
      const url = URL.createObjectURL(csvBlob);
      return url;
    } catch (error) {
      logger.error('ReportExport', 'Erreur lors de la génération CSV:', error instanceof Error ? error.message : String(error));
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
    // Logo de l'entreprise SI il existe (pas de fallback vers logo CassKai)
    const logoUrl = companyInfo.logo_url || companyInfo.logo;
    if (logoUrl) {
      try {
        pdf.addImage(logoUrl, 'PNG', 20, 10, 30, 20);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.warn('ReportExport', 'Logo entreprise non chargé:', errorMsg);
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
        // Colonnes de montants: alignement à droite + largeur minimale pour éviter le débordement
        styles[index] = {
          halign: 'right',
          minCellWidth: 30, // Largeur minimale en mm pour éviter le débordement
          cellWidth: 'wrap',
          overflow: 'linebreak',
          cellPadding: { left: 2, right: 3 } // Padding pour un meilleur espacement
        };
      } else if (header.toLowerCase().includes('date')) {
        styles[index] = {
          halign: 'center',
          minCellWidth: 25 // Largeur minimale pour les dates
        };
      } else if (header.toLowerCase().includes('compte')) {
        // Colonnes de comptes: largeur fixe
        styles[index] = {
          cellWidth: 25
        };
      } else if (header.toLowerCase().includes('libellé') || header.toLowerCase().includes('libelle') || header.toLowerCase().includes('description')) {
        // Colonnes de libellés: largeur automatique avec wrapping
        styles[index] = {
          cellWidth: 'auto',
          overflow: 'linebreak'
        };
      }
    });
    return styles;
  }
  private resolveCurrency(): string {
    return getCurrentCompanyCurrency();
  }
  private stripCurrencyFromValue(value: any): any {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    // Remplacer l'espace insecable (U+00A0) par espace normal d'abord
    const normalized = trimmed.replace(/\u00A0/g, ' ');
    const currencyRegex = /(€|EUR|XOF|XAF|FCFA|F\s*\/?\/\s*CFA)\s*$/i;
    if (!currencyRegex.test(normalized)) return normalized;
    const withoutCurrency = normalized.replace(currencyRegex, '').replace(/\s{2,}/g, ' ').trim();
    return withoutCurrency || value;
  }
  private sanitizeTableData(table: TableData): TableData {
    const rows = table.rows.map(row => row.map(cell => this.stripCurrencyFromValue(cell)));
    let summary = table.summary;
    if (summary && !Array.isArray(summary)) {
      summary = Object.fromEntries(
        Object.entries(summary).map(([key, value]) => [key, this.stripCurrencyFromValue(value)])
      );
    } else if (Array.isArray(summary)) {
      summary = summary.map(row => row.map(cell => this.stripCurrencyFromValue(cell)));
    }
    return {
      ...table,
      rows,
      summary
    };
  }
  private addCurrencyNote(pdf: any, currency: string, startY: number): number {
    const note = `Devise: ${currency} (valeurs exprimées dans cette devise)`;
    const pageHeight = pdf.internal.pageSize.height;
    let yPos = startY + 6;
    if (yPos > pageHeight - 20) {
      pdf.addPage();
      yPos = 20;
    }
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(120);
    pdf.text(note, 20, yPos);
    pdf.setTextColor(0);
    pdf.setFont('helvetica', 'normal');
    return yPos + 8;
  }
  private addPDFSummary(pdf: any, summary: Record<string, any>, startY: number) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Résumé:', 20, startY);
    let yPos = startY + 8;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    Object.entries(summary).forEach(([key, value]) => {
      // Normaliser les espaces insécables (U+00A0) en espaces normaux pour jsPDF
      const normalizedValue = String(value).replace(/\u00A0/g, ' ');
      pdf.text(`${key}: ${normalizedValue}`, 25, yPos);
      yPos += 5;
    });
  }
  private addPDFWatermark(pdf: any, text: string) {
    // ANCIEN CODE: Watermark au milieu SUPPRIMÉ
    // Maintenant on ajoute un footer discret "Généré par CassKai" sur chaque page
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Footer discret "Généré par CassKai" centré en gris clair
      pdf.setFontSize(8);
      pdf.setTextColor(180, 180, 180); // Gris clair
      pdf.text('Généré par CassKai - casskai.app', pageWidth / 2, pageHeight - 10, {
        align: 'center'
      });
    }
  }
  private addExcelSummarySheet(workbook: ExcelJS.Workbook, summary: Record<string, any>, sheetName: string) {
    const summaryData = [
      ['Élément', 'Valeur'],
      ...Object.entries(summary)
    ];
    const worksheet = workbook.addWorksheet(sheetName);
    summaryData.forEach((row) => worksheet.addRow(row));
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2980B9' } };
    });
    worksheet.columns = [
      { width: 30 },
      { width: 40 }
    ];
  }
  /**
   * Export PDF avec tables ET graphiques intégrés
   * Permet d'ajouter des visualisations graphiques entre les tables
   */
  async exportToPDFWithCharts(
    tables: TableData[],
    charts: ChartData[],
    options: ExportOptions = { format: 'pdf' }
  ): Promise<string> {
    try {
      const pdf = new jsPDF({
        orientation: options.orientation || 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      let currentY = 20;
      // En-tête
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
      // Tables avec graphiques intercalés
      const resolvedCurrency = this.resolveCurrency();
      for (let i = 0; i < tables.length; i++) {
        const table = this.sanitizeTableData(tables[i]);
        // Vérifier si on a besoin d'une nouvelle page
        if (currentY > 250) {
          pdf.addPage();
          currentY = 20;
        }
        // Titre de la table
        if (table.title) {
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(table.title, 20, currentY);
          currentY += 10;
        }
        // Tableau
        const tableConfig = {
          startY: currentY,
          head: [table.headers],
          body: table.rows,
          theme: 'grid' as const,
          styles: {
            cellPadding: 2
          } as any,
          headStyles: {
            fillColor: [41, 128, 185] as [number, number, number],
            textColor: 255,
            fontStyle: 'bold' as const
          },
          bodyStyles: {
            overflow: 'linebreak' as const
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245] as [number, number, number]
          },
          margin: { left: 20, right: 20 }
        };
        autoTable(pdf, tableConfig);
        currentY = (pdf as any).lastAutoTable.finalY + 10;
        // Summary si présent
        if (table.summary) {
          if (currentY > 260) {
            pdf.addPage();
            currentY = 20;
          }
          const summaryArray = Array.isArray(table.summary)
            ? table.summary
            : Object.entries(table.summary).map(([key, value]) => [key, value]);
          autoTable(pdf, {
            startY: currentY,
            body: summaryArray,
            theme: 'plain' as const,
            styles: {
              fontStyle: 'bold' as const
            },
            margin: { left: 20, right: 20 }
          });
          currentY = (pdf as any).lastAutoTable.finalY + 15;
        }
        // Note de devise sous le tableau
        currentY = this.addCurrencyNote(pdf, resolvedCurrency, currentY);
        // Ajouter un graphique après certaines tables si disponible
        if (options.includeCharts && charts[i]) {
          const chart = charts[i];
          if (currentY > 180) {
            pdf.addPage();
            currentY = 20;
          }
          try {
            let chartImageData: string;
            // Générer le graphique selon le type
            if (chart.type === 'bar') {
              chartImageData = await chartGenerationService.generateBarChart(
                chart.labels,
                chart.data,
                chart.title
              );
            } else if (chart.type === 'line') {
              chartImageData = await chartGenerationService.generateLineChart(
                chart.labels,
                [{ label: chart.title, data: chart.data, color: '#3b82f6' }],
                chart.title
              );
            } else if (chart.type === 'pie') {
              chartImageData = await chartGenerationService.generatePieChart(
                chart.labels,
                chart.data,
                chart.title
              );
            } else {
              chartImageData = await chartGenerationService.generateBarChart(
                chart.labels,
                chart.data,
                chart.title
              );
            }
            // Ajouter l'image du graphique au PDF
            const imgWidth = 170;
            const imgHeight = 100;
            pdf.addImage(chartImageData, 'PNG', 20, currentY, imgWidth, imgHeight);
            currentY += imgHeight + 15;
          } catch (error) {
            logger.error('ReportExport', 'Error adding chart to PDF:', error);
            // Continuer même si le graphique échoue
          }
        }
        currentY += 5;
      }
      // Footer discret "Généré par CassKai" sur chaque page (remplace l'ancien watermark)
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Footer discret centré en gris clair
        pdf.setFontSize(8);
        pdf.setTextColor(180, 180, 180); // Gris clair
        pdf.text('Généré par CassKai - casskai.app', pageWidth / 2, pageHeight - 10, {
          align: 'center'
        });
      }
      // Générer blob URL
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      return url;
    } catch (error) {
      logger.error('ReportExport', 'Error in exportToPDFWithCharts:', error);
      throw new Error('Impossible de générer le PDF avec graphiques');
    }
  }
  /**
   * Méthode helper pour ajouter un graphique simple au rapport d'analyse
   */
  async addChartToAnalysisReport(
    pdf: jsPDF,
    chartType: 'bar' | 'line' | 'pie',
    labels: string[],
    data: number[],
    title: string,
    startY: number
  ): Promise<number> {
    try {
      let chartImageData: string;
      if (chartType === 'bar') {
        chartImageData = await chartGenerationService.generateBarChart(labels, data, title);
      } else if (chartType === 'line') {
        chartImageData = await chartGenerationService.generateLineChart(
          labels,
          [{ label: title, data, color: '#3b82f6' }],
          title
        );
      } else {
        chartImageData = await chartGenerationService.generatePieChart(labels, data, title);
      }
      const imgWidth = 170;
      const imgHeight = 100;
      pdf.addImage(chartImageData, 'PNG', 20, startY, imgWidth, imgHeight);
      return startY + imgHeight + 10;
    } catch (error) {
      logger.error('ReportExport', 'Error adding chart:', error);
      return startY;
    }
  }
}
// Export singleton
export const reportExportService = ReportExportService.getInstance();