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

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { InvoiceWithDetails } from '@/types/database/invoices.types';

// Extension for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: unknown) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

export interface CompanyInfo {
  name?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  siret?: string;
  vatNumber?: string;
  logo?: string;
}

export class InvoicePdfService {
  /**
   * Génère un PDF pour une facture
   */
  static generateInvoicePDF(invoice: InvoiceWithDetails, companyData?: CompanyInfo): jsPDF {
    const doc = new jsPDF();
    
    // Configuration des couleurs
  const primaryColor = [41, 98, 255]; // Bleu
    
    // 1. En-tête de l'entreprise
  this.addCompanyHeader(doc, companyData, primaryColor);
    
    // 2. Informations facture et client
    this.addInvoiceAndClientInfo(doc, invoice);
    
    // 3. Tableau des articles
    this.addItemsTable(doc, invoice);
    
    // 4. Totaux
    this.addTotals(doc, invoice);
    
    // 5. Notes et conditions
    this.addNotesAndTerms(doc, invoice);
    
    // 6. Pied de page
  this.addFooter(doc, companyData);
    
    return doc;
  }
  
  /**
   * Ajoute l'en-tête de l'entreprise
   */
  private static addCompanyHeader(doc: jsPDF, companyData: CompanyInfo | undefined, primaryColor: number[]) {
    // Logo CassKai (par défaut si non fourni)
    try {
      const logoUrl = companyData?.logo || '/logo.png';
      // Note: En production, convertir le SVG en base64 pour l'inclure
      doc.addImage(logoUrl, 'PNG', 20, 10, 30, 20);
    } catch (error) {
      console.warn('Logo non chargé dans le PDF:', error);
    }
    // Logo ou nom de l'entreprise
    doc.setFontSize(24);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(companyData?.name || 'Votre Entreprise', 20, 25);
    
    // Informations de l'entreprise
    doc.setFontSize(10);
    doc.setTextColor(100);
    let yPos = 35;
    
    if (companyData?.address) {
      doc.text(companyData.address, 20, yPos);
      yPos += 5;
    }
    if (companyData?.city && companyData?.postalCode) {
      doc.text(`${companyData.postalCode} ${companyData.city}`, 20, yPos);
      yPos += 5;
    }
    if (companyData?.phone) {
      doc.text(`Tél: ${companyData.phone}`, 20, yPos);
      yPos += 5;
    }
    if (companyData?.email) {
      doc.text(`Email: ${companyData.email}`, 20, yPos);
      yPos += 5;
    }
    if (companyData?.website) {
      doc.text(`Web: ${companyData.website}`, 20, yPos);
      yPos += 5;
    }
    
    // Titre FACTURE
    doc.setFontSize(20);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('FACTURE', 150, 25);
    
    // Ligne de séparation
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, 65, 190, 65);
  }
  
  /**
   * Ajoute les informations de facturation et client
   */
  private static addInvoiceAndClientInfo(doc: jsPDF, invoice: InvoiceWithDetails) {
    doc.setTextColor(0);
    doc.setFontSize(10);
    
    // Informations facture (colonne droite)
    const invoiceInfoX = 120;
    let yPos = 35;
    
    doc.setFont(undefined, 'bold');
    doc.text('FACTURE N°:', invoiceInfoX, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(invoice.invoice_number as string, invoiceInfoX + 30, yPos);
    yPos += 6;
    
    doc.setFont(undefined, 'bold');
    doc.text('Date:', invoiceInfoX, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(new Date(invoice.issue_date as string).toLocaleDateString('fr-FR'), invoiceInfoX + 30, yPos);
    yPos += 6;
    
    if (invoice.due_date) {
      doc.setFont(undefined, 'bold');
      doc.text('Échéance:', invoiceInfoX, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(new Date(invoice.due_date as any).toLocaleDateString('fr-FR'), invoiceInfoX + 30, yPos);
      yPos += 6;
    }
    
    // Informations client (colonne gauche)
    if (invoice.client) {
      yPos = 75;
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.text('FACTURÉ À:', 20, yPos);
      
      yPos += 8;
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(invoice.client.name as string, 20, yPos);
      
      yPos += 6;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      
      if (invoice.client.address_street) {
        doc.text(invoice.client.address_street as string, 20, yPos);
        yPos += 5;
      }
      if (invoice.client.address_city) {
        const address = `${invoice.client.address_postal_code || ''} ${invoice.client.address_city}`.trim();
        doc.text(address, 20, yPos);
        yPos += 5;
      }
      if (invoice.client.email) {
        doc.text(`Email: ${invoice.client.email}`, 20, yPos);
        yPos += 5;
      }
      if (invoice.client.phone) {
        doc.text(`Tél: ${invoice.client.phone}`, 20, yPos);
        yPos += 5;
      }
    }
  }
  
  /**
   * Ajoute le tableau des articles
   */
  private static addItemsTable(doc: jsPDF, invoice: InvoiceWithDetails) {
    const tableData = invoice.invoice_lines?.map(item => [
      item.description,
      item.quantity.toString(),
      this.formatCurrency(item.unit_price),
      `${item.tax_rate || 0}%`,
      this.formatCurrency(item.line_total_ttc || (item.quantity * item.unit_price))
    ]) || [];
    
    doc.autoTable({
      startY: 120,
      head: [['Description', 'Qté', 'Prix HT', 'TVA', 'Total TTC']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 98, 255],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [55, 65, 81]
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 35, halign: 'right' }
      },
      margin: { left: 20, right: 20 },
      styles: {
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      }
    });
  }
  
  /**
   * Ajoute les totaux
   */
  private static addTotals(doc: jsPDF, invoice: InvoiceWithDetails) {
    const startY = doc.lastAutoTable.finalY + 10;
    const rightX = 190;
    const labelX = 140;
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    
    // Total HT
    doc.setFont(undefined, 'normal');
    doc.text('Total HT:', labelX, startY);
    doc.text(this.formatCurrency(invoice.total_ht), rightX, startY, { align: 'right' });
    
    // TVA
    doc.text('TVA:', labelX, startY + 6);
    doc.text(this.formatCurrency(invoice.total_tva), rightX, startY + 6, { align: 'right' });
    
    // Ligne de séparation
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(labelX, startY + 10, rightX, startY + 10);
    
    // Total TTC
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('Total TTC:', labelX, startY + 16);
    doc.text(this.formatCurrency(invoice.total_ttc), rightX, startY + 16, { align: 'right' });
    
    // Montant payé et restant dû
    if (invoice.paid_amount > 0) {
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 150, 0);
      doc.text('Montant payé:', labelX, startY + 24);
      doc.text(this.formatCurrency(invoice.paid_amount), rightX, startY + 24, { align: 'right' });
      
      if (invoice.remaining_amount > 0) {
        doc.setTextColor(200, 0, 0);
        doc.text('Restant dû:', labelX, startY + 30);
        doc.text(this.formatCurrency(invoice.remaining_amount), rightX, startY + 30, { align: 'right' });
      }
    }
  }
  
  /**
   * Ajoute les notes et conditions
   */
  private static addNotesAndTerms(doc: jsPDF, invoice: InvoiceWithDetails) {
    let startY = doc.lastAutoTable.finalY + 50;
    
    if (invoice.notes || invoice.terms) {
      startY = Math.max(startY, 200);
      
      if (invoice.notes) {
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0);
        doc.text('Notes:', 20, startY);
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        const notesLines = doc.splitTextToSize(invoice.notes as string, 170);
        doc.text(notesLines, 20, startY + 6);
        startY += 6 + (notesLines.length * 4);
      }
      
      if (invoice.terms) {
        startY += 5;
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0);
        doc.text('Conditions de paiement:', 20, startY);
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        const termsLines = doc.splitTextToSize(invoice.terms as string, 170);
        doc.text(termsLines, 20, startY + 6);
      }
    }
  }
  
  /**
   * Ajoute le pied de page
   */
  private static addFooter(doc: jsPDF, companyData: CompanyInfo | undefined) {
    const pageHeight = doc.internal.pageSize.height;
    const footerY = pageHeight - 20;
    
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont(undefined, 'normal');
    
    // Informations légales
    const legalInfo = [];
    if (companyData?.siret) legalInfo.push(`SIRET: ${companyData.siret}`);
    if (companyData?.vatNumber) legalInfo.push(`TVA: ${companyData.vatNumber}`);
    
    if (legalInfo.length > 0) {
      doc.text(legalInfo.join(' - '), 105, footerY, { align: 'center' });
    }
    
    // Numéro de page
    doc.text(`Page 1`, 105, footerY + 5, { align: 'center' });
  }
  
  /**
   * Formate un montant en devise
   */
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }
  
  /**
   * Télécharge le PDF
   */
  static downloadInvoicePDF(invoice: InvoiceWithDetails, companyData?: CompanyInfo): void {
    const doc = this.generateInvoicePDF(invoice, companyData);
    const fileName = `facture-${invoice.invoice_number}.pdf`;
    doc.save(fileName);
  }
  
  /**
   * Génère un blob PDF pour envoi par email ou affichage
   */
  static generateInvoicePDFBlob(invoice: InvoiceWithDetails, companyData?: CompanyInfo): Blob {
    const doc = this.generateInvoicePDF(invoice, companyData);
    return doc.output('blob');
  }
  
  /**
   * Génère une URL de données PDF pour prévisualisation
   */
  static generateInvoicePDFDataUrl(invoice: InvoiceWithDetails, companyData?: CompanyInfo): string {
    const doc = this.generateInvoicePDF(invoice, companyData);
    return doc.output('datauristring');
  }
}

export default InvoicePdfService;
