/**
 * Service de génération PDF pour les factures
 * Utilise jsPDF pour créer des factures personnalisées côté client
 */

import jsPDF from 'jspdf';
import { Enterprise } from '@/types/enterprise.types';
import { Invoice } from '@/types/subscription.types';

interface InvoiceData extends Partial<Invoice> {
  invoiceNumber: string;
  enterprise: Enterprise;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  taxAmount: number;
  total: number;
}

export class PDFService {
  
  /**
   * Génère une facture PDF personnalisée
   */
  static async generateInvoicePDF(invoiceData: InvoiceData): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let y = 30;

    // Configuration des couleurs
    const primaryColor: [number, number, number] = [59, 130, 246]; // blue-500
    const textColor: [number, number, number] = [55, 65, 81]; // gray-700
    const lightGray: [number, number, number] = [243, 244, 246]; // gray-100

    // En-tête avec logo et titre
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURE', margin, 18);
    
    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    doc.text(`N° ${invoiceData.invoiceNumber}`, pageWidth - margin - 40, 18);

    y = 40;

    // Informations entreprise
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('De:', margin, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    y += 10;
    doc.text(invoiceData.enterprise.name, margin, y);
    y += 6;
    if (invoiceData.enterprise.address?.street) {
      doc.text(invoiceData.enterprise.address.street, margin, y);
      y += 6;
    }
    if (invoiceData.enterprise.address?.postalCode && invoiceData.enterprise.address?.city) {
      doc.text(`${invoiceData.enterprise.address.postalCode} ${invoiceData.enterprise.address.city}`, margin, y);
      y += 6;
    }
    if (invoiceData.enterprise.vatNumber) {
      doc.text(`TVA: ${invoiceData.enterprise.vatNumber}`, margin, y);
      y += 6;
    }
    if ((invoiceData.enterprise as any).email) {
      doc.text(`Email: ${(invoiceData.enterprise as any).email}`, margin, y);
      y += 10;
    }

    // Informations facture (à droite)
    const rightColumn = pageWidth - margin - 80;
    let rightY = 50;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Détails facture:', rightColumn, rightY);
    doc.setFont('helvetica', 'normal');
    rightY += 10;
    
    if (invoiceData.createdAt) {
      doc.text(`Date: ${invoiceData.createdAt.toLocaleDateString('fr-FR')}`, rightColumn, rightY);
      rightY += 6;
    }
    if (invoiceData.dueDate) {
      doc.text(`Échéance: ${invoiceData.dueDate.toLocaleDateString('fr-FR')}`, rightColumn, rightY);
      rightY += 6;
    }
    doc.text(`Devise: ${invoiceData.currency || 'EUR'}`, rightColumn, rightY);

    y = Math.max(y, rightY) + 20;

    // Ligne de séparation
    doc.setDrawColor(...lightGray);
    doc.line(margin, y, pageWidth - margin, y);
    y += 15;

    // Tableau des articles
    doc.setFillColor(...primaryColor);
    doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Description', margin + 2, y + 6);
    doc.text('Qté', rightColumn - 60, y + 6);
    doc.text('Prix unitaire', rightColumn - 40, y + 6);
    doc.text('Total', rightColumn, y + 6);
    
    y += 8;
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'normal');

    // Articles
    invoiceData.lineItems.forEach((item, index) => {
      if (index % 2 === 1) {
        doc.setFillColor(...lightGray);
        doc.rect(margin, y, pageWidth - 2 * margin, 6, 'F');
      }
      
      doc.text(item.description, margin + 2, y + 4);
      doc.text(item.quantity.toString(), rightColumn - 60, y + 4);
      doc.text(`${item.unitPrice.toFixed(2)}€`, rightColumn - 40, y + 4);
      doc.text(`${item.total.toFixed(2)}€`, rightColumn, y + 4);
      
      y += 6;
    });

    y += 10;

    // Totaux
    const totalsX = rightColumn - 20;
    doc.setFont('helvetica', 'normal');
    doc.text('Sous-total:', totalsX - 30, y);
    doc.text(`${invoiceData.subtotal.toFixed(2)}€`, totalsX, y);
    y += 6;
    
    doc.text('TVA:', totalsX - 30, y);
    doc.text(`${invoiceData.taxAmount.toFixed(2)}€`, totalsX, y);
    y += 6;
    
    // Total avec style
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(...primaryColor);
    doc.rect(totalsX - 35, y - 2, 50, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL:', totalsX - 30, y + 4);
    doc.text(`${invoiceData.total.toFixed(2)}€`, totalsX, y + 4);

    y += 20;
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    // Pied de page
    if (y > 250) {
      doc.addPage();
      y = 30;
    }

    doc.text('Conditions de paiement: Paiement à 30 jours', margin, y);
    y += 5;
    doc.text('Merci de votre confiance !', margin, y);

    // Footer avec numéro de page
    doc.setFontSize(7);
    doc.text(
      `Généré le ${new Date().toLocaleDateString('fr-FR')} - Page 1`, 
      pageWidth / 2 - 30, 
      doc.internal.pageSize.height - 10
    );

    return doc.output('blob');
  }

  /**
   * Télécharge la facture PDF
   */
  static downloadInvoicePDF(invoiceData: InvoiceData, filename?: string) {
    this.generateInvoicePDF(invoiceData).then(blob => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `facture-${invoiceData.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  }

  /**
   * Aperçu de la facture dans un nouvel onglet
   */
  static async previewInvoicePDF(invoiceData: InvoiceData) {
    const blob = await this.generateInvoicePDF(invoiceData);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }
}