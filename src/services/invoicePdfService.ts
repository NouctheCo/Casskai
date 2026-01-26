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
import autoTable from 'jspdf-autotable';
import { logger } from '@/lib/logger';
import { formatCurrencyForPDF, getCurrentCompanyCurrency } from '@/lib/utils';

type InvoicePdfClient = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  // DB-style
  address_street?: string | null;
  address_city?: string | null;
  address_postal_code?: string | null;
  // Service-style
  address_line1?: string | null;
  city?: string | null;
  postal_code?: string | null;
};

type InvoicePdfItem = {
  description?: string | null;
  name?: string | null;
  quantity: number;
  unit_price: number;
  tax_rate?: number | null;
  line_total_ttc?: number | null;
};

export type InvoicePdfInput = {
  // Support multiple invoice models (DB-style, service-style)
  invoice_number?: string | null;
  invoice_date?: string | null;
  // Common aliases
  invoiceNumber?: string | null;
  issueDate?: string | null;
  number?: string | null;
  date?: string | null;
  due_date?: string | null;
  service_date?: string | null;
  delivery_date?: string | null;
  currency?: string | null;
  notes?: string | null;
  terms?: string | null;
  vat_exemption_reason?: string | null;
  paid_amount?: number | null;
  remaining_amount?: number | null;
  // Totals - DB naming
  total_ht?: number | null;
  total_tva?: number | null;
  total_ttc?: number | null;
  // Totals - service naming
  subtotal_excl_tax?: number | null;
  total_tax_amount?: number | null;
  total_incl_tax?: number | null;
  total_amount?: number | null;
  client?: InvoicePdfClient | null;
  third_party?: InvoicePdfClient | null;
  invoice_items?: InvoicePdfItem[] | null;
  invoice_lines?: InvoicePdfItem[] | null;
};

// Extension for autoTable - lastAutoTable is added by jspdf-autotable after calling autoTable()
declare module 'jspdf' {
  interface jsPDF {
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
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  siret?: string;
  vatNumber?: string;
  legalForm?: string;
  shareCapital?: number | string;
  rcsCity?: string;
  rcsNumber?: string;
  legalMentions?: string;
  defaultTerms?: string;
  vatNote?: string;
  mainBankName?: string;
  mainBankIban?: string;
  mainBankBic?: string;
  paymentInstructions?: string;
  currency?: string;
  logo?: string;
}
export class InvoicePdfService {
  private static getInvoiceNumber(invoice: InvoicePdfInput): string {
    const raw =
      invoice.invoice_number ??
      invoice.invoiceNumber ??
      invoice.number ??
      '';
    return String(raw || '').trim() || 'N/A';
  }

  private static getInvoiceDate(invoice: InvoicePdfInput): Date | null {
    const raw =
      invoice.invoice_date ??
      invoice.issueDate ??
      invoice.date ??
      null;

    if (!raw) return null;
    const parsed = new Date(String(raw));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  /**
   * Génère un PDF pour une facture
   */
  static generateInvoicePDF(invoice: InvoicePdfInput, companyData?: CompanyInfo): jsPDF {
    const doc = new jsPDF();
    const currency = invoice.currency || companyData?.currency || getCurrentCompanyCurrency();
    // Configuration des couleurs
  const primaryColor = [41, 98, 255]; // Bleu
    // 1. En-tête de l'entreprise
  this.addCompanyHeader(doc, companyData, primaryColor);
    // 2. Informations facture et client
    this.addInvoiceAndClientInfo(doc, invoice);
    // 3. Tableau des articles
    this.addItemsTable(doc, invoice, currency);
    // 4. Totaux
    const totalsY = this.addTotals(doc, invoice, currency);
    const contentEndY = this.addBankDetails(doc, companyData, currency, totalsY);
    // 5. Notes et conditions
    this.addNotesAndTerms(doc, invoice, companyData, currency, contentEndY);
    // 6. Pied de page
  this.addFooter(doc, companyData, currency);
    return doc;
  }
  /**
   * Ajoute l'en-tête de l'entreprise
   */
  private static addCompanyHeader(doc: jsPDF, companyData: CompanyInfo | undefined, primaryColor: number[]) {
    let yPos = 10;

    // Logo de l'entreprise SI il existe
    if (companyData?.logo) {
      try {
        // Afficher le logo de l'entreprise
        doc.addImage(companyData.logo, 'PNG', 20, yPos, 30, 20);
        yPos += 25; // Décaler le nom EN DESSOUS du logo
      } catch (error) {
        logger.warn('InvoicePdf', 'Logo non chargé dans le PDF:', error);
        // Si erreur de chargement du logo, continuer sans logo
      }
    }

    // Nom de l'entreprise (sous le logo si présent, ou directement en haut)
    doc.setFontSize(24);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(companyData?.name || 'Votre Entreprise', 20, yPos);

    // Informations de l'entreprise
    doc.setFontSize(10);
    doc.setTextColor(100);
    yPos += 10;
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
  private static addInvoiceAndClientInfo(doc: jsPDF, invoice: InvoicePdfInput) {
    doc.setTextColor(0);
    doc.setFontSize(10);
    // Informations facture (colonne droite)
    const invoiceInfoX = 120;
    let yPos = 35;
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURE N°:', invoiceInfoX, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(this.getInvoiceNumber(invoice), invoiceInfoX + 30, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', invoiceInfoX, yPos);
    doc.setFont('helvetica', 'normal');
    const invoiceDate = this.getInvoiceDate(invoice);
    doc.text(invoiceDate ? invoiceDate.toLocaleDateString('fr-FR') : 'N/A', invoiceInfoX + 30, yPos);
    yPos += 6;
    const serviceDate = (invoice.service_date as string) || (invoice.delivery_date as string);
    if (serviceDate) {
      doc.setFont('helvetica', 'bold');
      doc.text('Prestation:', invoiceInfoX, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date(serviceDate).toLocaleDateString('fr-FR'), invoiceInfoX + 30, yPos);
      yPos += 6;
    }
    if (invoice.due_date) {
      doc.setFont('helvetica', 'bold');
      doc.text('Échéance:', invoiceInfoX, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date(invoice.due_date as any).toLocaleDateString('fr-FR'), invoiceInfoX + 30, yPos);
      yPos += 6;
    }
    // Informations client (colonne gauche)
    const resolvedClient = invoice.client || invoice.third_party;
    if (resolvedClient) {
      yPos = 75;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('FACTURÉ À:', 20, yPos);
      yPos += 8;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text((resolvedClient.name as string) || 'Client', 20, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const street = resolvedClient.address_street || resolvedClient.address_line1;
      if (street) {
        doc.text(street as string, 20, yPos);
        yPos += 5;
      }
      const city = resolvedClient.address_city || resolvedClient.city;
      const postalCode = resolvedClient.address_postal_code || resolvedClient.postal_code;
      if (city) {
        const address = `${postalCode || ''} ${city}`.trim();
        doc.text(address, 20, yPos);
        yPos += 5;
      }
      if (resolvedClient.email) {
        doc.text(`Email: ${resolvedClient.email}`, 20, yPos);
        yPos += 5;
      }
      if (resolvedClient.phone) {
        doc.text(`Tél: ${resolvedClient.phone}`, 20, yPos);
        yPos += 5;
      }
    }
  }
  /**
   * Ajoute le tableau des articles
   */
  private static addItemsTable(doc: jsPDF, invoice: InvoicePdfInput, currency: string) {
    const items = invoice.invoice_items || invoice.invoice_lines || [];
    const tableData = items.map(item => [
      item.description || item.name || '',
      item.quantity.toString(),
      this.formatCurrency(item.unit_price, currency),
      `${item.tax_rate || 0}%`,
      this.formatCurrency(item.line_total_ttc || (item.quantity * item.unit_price), currency)
    ]);
    autoTable(doc, {
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
  private static addTotals(doc: jsPDF, invoice: InvoicePdfInput, currency: string): number {
    const startY = doc.lastAutoTable.finalY + 10;
    const rightX = 190;
    const labelX = 140;
    doc.setFontSize(10);
    doc.setTextColor(0);

    // Calculer les totaux depuis les items si les totaux de la facture sont invalides
    const items = invoice.invoice_items || invoice.invoice_lines || [];
    let totalHT = Number(invoice.total_ht ?? invoice.subtotal_excl_tax ?? 0);
    let totalTVA = Number(invoice.total_tva ?? invoice.total_tax_amount ?? 0);
    let totalTTC = Number(invoice.total_ttc ?? invoice.total_incl_tax ?? invoice.total_amount ?? 0);

    // Si les totaux sont NaN ou 0, recalculer depuis les items
    if (!totalHT || isNaN(totalHT) || totalHT === 0) {
      totalHT = items.reduce((sum, item) => {
        const qty = parseFloat(String(item.quantity)) || 0;
        const price = parseFloat(String(item.unit_price)) || 0;
        return sum + (qty * price);
      }, 0);
    }

    if (!totalTVA || isNaN(totalTVA) || totalTVA === 0) {
      totalTVA = items.reduce((sum, item) => {
        const qty = parseFloat(String(item.quantity)) || 0;
        const price = parseFloat(String(item.unit_price)) || 0;
        const rate = parseFloat(String(item.tax_rate)) || 20;
        return sum + (qty * price * rate / 100);
      }, 0);
    }

    if (!totalTTC || isNaN(totalTTC) || totalTTC === 0) {
      totalTTC = totalHT + totalTVA;
    }

    // Total HT
    doc.setFont('helvetica', 'normal');
    doc.text('Total HT:', labelX, startY);
    doc.text(this.formatCurrency(totalHT, currency), rightX, startY, { align: 'right' });
    // TVA
    doc.text('TVA:', labelX, startY + 6);
    doc.text(this.formatCurrency(totalTVA, currency), rightX, startY + 6, { align: 'right' });
    // Ligne de séparation
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(labelX, startY + 10, rightX, startY + 10);
    // Total TTC
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total TTC:', labelX, startY + 16);
    doc.text(this.formatCurrency(totalTTC, currency), rightX, startY + 16, { align: 'right' });
    // Montant payé et restant dû
    if (invoice.paid_amount > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 150, 0);
      doc.text('Montant payé:', labelX, startY + 24);
      doc.text(this.formatCurrency(invoice.paid_amount, currency), rightX, startY + 24, { align: 'right' });
      if (invoice.remaining_amount > 0) {
        doc.setTextColor(200, 0, 0);
        doc.text('Restant dû:', labelX, startY + 30);
        doc.text(this.formatCurrency(invoice.remaining_amount, currency), rightX, startY + 30, { align: 'right' });
      }
    }
    return startY + 30;
  }
  /**
   * Ajoute les coordonnées bancaires
   */
  private static addBankDetails(
    doc: jsPDF,
    companyData: CompanyInfo | undefined,
    _currency: string,
    previousSectionY: number
  ): number {
    const hasBankInfo =
      !!(companyData?.mainBankName || companyData?.mainBankIban || companyData?.mainBankBic);
    if (!hasBankInfo) {
      return previousSectionY;
    }
    const startY = Math.max(doc.lastAutoTable.finalY + 20, previousSectionY + 8, 160);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Coordonnées bancaires:', 20, startY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    let y = startY + 6;
    if (companyData?.mainBankName) {
      doc.text(`Banque: ${companyData.mainBankName}`, 20, y);
      y += 5;
    }
    if (companyData?.mainBankIban) {
      doc.text(`IBAN: ${companyData.mainBankIban}`, 20, y);
      y += 5;
    }
    if (companyData?.mainBankBic) {
      doc.text(`BIC: ${companyData.mainBankBic}`, 20, y);
      y += 5;
    }
    if (companyData?.paymentInstructions) {
      const lines = doc.splitTextToSize(companyData.paymentInstructions, 170);
      doc.text(lines, 20, y);
      y += lines.length * 4 + 2;
    }
    return y;
  }
  /**
   * Ajoute les notes et conditions
   */
  private static addNotesAndTerms(
    doc: jsPDF,
    invoice: InvoicePdfInput,
    companyData: CompanyInfo | undefined,
    _currency: string,
    minStartY?: number
  ) {
    let startY = Math.max(doc.lastAutoTable.finalY + 50, minStartY || 0, 200);
    const sections: Array<{ title: string; lines: string[] }> = [];
    if (invoice.notes) {
      sections.push({
        title: 'Notes',
        lines: doc.splitTextToSize(invoice.notes as string, 170) as string[],
      });
    }
    const legalTerms: string[] = [];
    const dueDateText = invoice.due_date
      ? new Date(invoice.due_date as string).toLocaleDateString('fr-FR')
      : undefined;
    const penaltyRateText =
      'Pénalités de retard: taux directeur BCE en vigueur + 10 points (minimum légal applicable).';
    const recoveryFeeText =
      'Indemnité forfaitaire pour frais de recouvrement: 40€ (art. L441-10 CMF).';
    const discountText = 'Escompte pour paiement anticipé: aucun (0%) sauf stipulation contraire.';
    const providedTermsRaw = invoice.terms || companyData?.defaultTerms || '';
    const providedTerms = typeof providedTermsRaw === 'string' ? providedTermsRaw : String(providedTermsRaw);
    const mergedTerms = providedTerms
      ? doc.splitTextToSize(providedTerms, 170)
      : [penaltyRateText, recoveryFeeText, discountText];
    const vatNoteShouldShow = typeof invoice.total_tva === 'number' && invoice.total_tva === 0;
    const vatNote = vatNoteShouldShow
      ? invoice.vat_exemption_reason || companyData?.vatNote || 'TVA non applicable, art. 293 B du CGI.'
      : undefined;
    const serviceDate = (invoice.service_date as string) || (invoice.delivery_date as string);
    const serviceDateText = serviceDate
      ? `Date de prestation/livraison: ${new Date(serviceDate).toLocaleDateString('fr-FR')}`
      : undefined;
    if (dueDateText) {
      legalTerms.push(`Échéance: ${dueDateText}`);
    }
    legalTerms.push(...mergedTerms.filter(Boolean));
    if (serviceDateText) legalTerms.push(serviceDateText);
    if (vatNote) legalTerms.push(vatNote);
    if (companyData?.paymentInstructions) legalTerms.push(companyData.paymentInstructions);
    if (legalTerms.length) {
      sections.push({
        title: 'Conditions de paiement',
        lines: legalTerms,
      });
    }
    if (sections.length === 0) {
      return;
    }
    sections.forEach(section => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text(`${section.title}:`, 20, startY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const lines = Array.isArray(section.lines) ? section.lines : [section.lines];
      doc.text(lines, 20, startY + 6);
      startY += 6 + lines.length * 4 + 4;
    });
  }
  /**
   * Ajoute le pied de page
   */
  private static addFooter(doc: jsPDF, companyData: CompanyInfo | undefined, currency: string) {
    const pageHeight = doc.internal.pageSize.height;
    const footerY = pageHeight - 20;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont('helvetica', 'normal');
    // Informations légales
    const legalInfo: string[] = [];
    if (companyData?.legalForm) legalInfo.push(companyData.legalForm);
    if (companyData?.shareCapital !== undefined) {
      const capitalValue =
        typeof companyData.shareCapital === 'number'
          ? this.formatCurrency(companyData.shareCapital, companyData.currency || currency || getCurrentCompanyCurrency())
          : companyData.shareCapital;
      legalInfo.push(`Capital: ${capitalValue}`);
    }
    if (companyData?.siret) legalInfo.push(`SIRET: ${companyData.siret}`);
    if (companyData?.rcsCity || companyData?.rcsNumber) {
      const rcsNumber = companyData.rcsNumber || companyData.siret;
      const rcsCity = companyData.rcsCity || companyData.city;
      const rcsLabel = [rcsCity ? `RCS ${rcsCity}` : 'RCS', rcsNumber].filter(Boolean).join(' ');
      legalInfo.push(rcsLabel);
    }
    if (companyData?.vatNumber) legalInfo.push(`TVA: ${companyData.vatNumber}`);
    if (legalInfo.length > 0) {
      doc.text(legalInfo.join(' • '), 105, footerY, { align: 'center' });
    }
    if (companyData?.legalMentions) {
      const mentionsLines = doc.splitTextToSize(companyData.legalMentions, 180);
      doc.text(mentionsLines, 105, footerY - 6, { align: 'center' });
    }
    // Numéro de page avec total
    const pageCount = (doc.internal as any).getNumberOfPages();
    const currentPage = (doc.internal as any).getCurrentPageInfo().pageNumber;
    doc.text(`Page ${currentPage} / ${pageCount}`, 105, footerY + 5, { align: 'center' });

    // Footer discret "Généré par CassKai" centré en gris clair
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180); // Gris clair
    doc.text('Généré par CassKai - casskai.app', 105, footerY + 10, { align: 'center' });
  }
  /**
   * Formate un montant en devise pour les PDF
   * Note: On remplace l'espace insécable par un espace normal car jsPDF ne le supporte pas bien
   */
  private static formatCurrency(amount: number, currency?: string): string {
    return formatCurrencyForPDF(amount, currency || undefined);
  }
  /**
   * Télécharge le PDF
   */
  static downloadInvoicePDF(invoice: InvoicePdfInput, companyData?: CompanyInfo): void {
    const doc = this.generateInvoicePDF(invoice, companyData);
    const fileName = `facture-${this.getInvoiceNumber(invoice)}.pdf`;
    doc.save(fileName);
  }
  /**
   * Génère un blob PDF pour envoi par email ou affichage
   */
  static generateInvoicePDFBlob(invoice: InvoicePdfInput, companyData?: CompanyInfo): Blob {
    const doc = this.generateInvoicePDF(invoice, companyData);
    return doc.output('blob');
  }
  /**
   * Génère une URL de données PDF pour prévisualisation
   */
  static generateInvoicePDFDataUrl(invoice: InvoicePdfInput, companyData?: CompanyInfo): string {
    const doc = this.generateInvoicePDF(invoice, companyData);
    return doc.output('datauristring');
  }
}
export default InvoicePdfService;