/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Service d'export PDF pour documents réglementaires
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { logger } from '@/lib/logger';
import type {
  RegulatoryDocument,
  RegulatoryTemplate,
  PdfExportOptions,
  FormSection,
  FormField
} from '@/types/regulatory';

function normalizeRegulatoryTemplateRow(row: any): RegulatoryTemplate {
  return {
    id: row.id,
    documentType: row.documentType ?? row.document_type,
    countryCode: row.countryCode ?? row.country_code,
    accountingStandard: row.accountingStandard ?? row.accounting_standard,
    name: row.name,
    description: row.description,
    category: row.category,
    formSchema: row.formSchema ?? row.form_schema,
    accountMappings: row.accountMappings ?? row.account_mappings,
    validationRules: row.validationRules ?? row.validation_rules,
    calculationRules: row.calculationRules ?? row.calculation_rules,
    frequency: row.frequency,
    isMandatory: row.isMandatory ?? row.is_mandatory,
    version: row.version,
    isActive: row.isActive ?? row.is_active,
    effectiveFrom: row.effectiveFrom ?? row.effective_from,
    effectiveTo: row.effectiveTo ?? row.effective_to,
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at,
  } as RegulatoryTemplate;
}

function normalizeRegulatoryDocumentRow(row: any): RegulatoryDocument {
  return {
    id: row.id,
    companyId: row.companyId ?? row.company_id,
    documentType: row.documentType ?? row.document_type,
    category: row.category,
    fiscalYear: row.fiscalYear ?? row.fiscal_year,
    fiscalPeriod: row.fiscalPeriod ?? row.fiscal_period,
    countryCode: row.countryCode ?? row.country_code,
    accountingStandard: row.accountingStandard ?? row.accounting_standard,
    data: row.data ?? {},
    status: row.status,
    version: row.version,
    pdfUrl: row.pdfUrl ?? row.pdf_url,
    xmlUrl: row.xmlUrl ?? row.xml_url,
    notes: row.notes,
    internalComments: row.internalComments ?? row.internal_comments,
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at,
    createdBy: row.createdBy ?? row.created_by,
    updatedBy: row.updatedBy ?? row.updated_by,
    submittedAt: row.submittedAt ?? row.submitted_at,
    submittedBy: row.submittedBy ?? row.submitted_by,
    validatedAt: row.validatedAt ?? row.validated_at,
    validatedBy: row.validatedBy ?? row.validated_by,
  } as RegulatoryDocument;
}
/**
 * Génère un PDF pour un document réglementaire
 */
export async function exportToPdf(
  document: RegulatoryDocument,
  template: RegulatoryTemplate,
  options: Partial<PdfExportOptions> = {}
): Promise<Blob> {
  const defaultOptions: PdfExportOptions = {
    format: 'A4',
    orientation: 'portrait',
    includeHeader: true,
    includeFooter: true,
    includeSignature: true,
    companyLogo: true
  };
  const finalOptions = { ...defaultOptions, ...options };
  // Créer le document PDF
  const pdf = new jsPDF({
    orientation: finalOptions.orientation,
    unit: 'mm',
    format: finalOptions.format,
    putOnlyUsedFonts: true,
    floatPrecision: 16
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let currentY = margin;
  // En-tête
  if (finalOptions.includeHeader) {
    currentY = addHeader(pdf, document, template, currentY, pageWidth, margin);
  }
  // Contenu du document
  currentY = await addContent(pdf, document, template, currentY, pageWidth, pageHeight, margin);
  // Signature
  if (finalOptions.includeSignature) {
    currentY = addSignature(pdf, currentY, pageWidth, pageHeight, margin);
  }
  // Pied de page
  if (finalOptions.includeFooter) {
    addFooter(pdf, document, pageWidth, pageHeight, margin);
  }
  // Watermark si demandé
  if (finalOptions.watermark) {
    addWatermark(pdf, finalOptions.watermark, pageWidth, pageHeight);
  }

  void currentY;
  return pdf.output('blob');
}
/**
 * Ajoute l'en-tête du document
 */
function addHeader(
  pdf: jsPDF,
  document: RegulatoryDocument,
  template: RegulatoryTemplate,
  startY: number,
  pageWidth: number,
  margin: number
): number {
  let y = startY;
  // Titre du document
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(template.name, pageWidth / 2, y, { align: 'center' });
  y += 10;
  // Informations générales
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const info = [
    `Type de document: ${template.documentType}`,
    `Exercice fiscal: ${document.fiscalYear}`,
    `Période: ${document.fiscalPeriod}`,
    `Standard comptable: ${document.accountingStandard}`,
    `Pays: ${document.countryCode}`,
    `Statut: ${document.status}`
  ];
  info.forEach(line => {
    pdf.text(line, margin, y);
    y += 5;
  });
  y += 5;
  // Ligne de séparation
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 10;
  return y;
}
/**
 * Ajoute le contenu du document (sections et champs)
 */
async function addContent(
  pdf: jsPDF,
  document: RegulatoryDocument,
  template: RegulatoryTemplate,
  startY: number,
  pageWidth: number,
  pageHeight: number,
  margin: number
): Promise<number> {
  let y = startY;
  const formSchema = template.formSchema as any;
  if (!formSchema || !formSchema.sections) {
    return y;
  }
  // Parcourir toutes les sections
  for (const section of formSchema.sections) {
    y = addSection(pdf, section, document.data, y, pageWidth, pageHeight, margin);
  }
  return y;
}
/**
 * Ajoute une section du formulaire
 */
function addSection(
  pdf: jsPDF,
  section: FormSection,
  data: Record<string, any>,
  startY: number,
  pageWidth: number,
  pageHeight: number,
  margin: number
): number {
  let y = startY;
  // Vérifier si nouvelle page nécessaire
  if (y > pageHeight - 40) {
    pdf.addPage();
    y = margin;
  }
  // Titre de section
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text(section.title, margin, y);
  y += 7;
  // Description si présente
  if (section.description) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'italic');
    const descLines = pdf.splitTextToSize(section.description, pageWidth - 2 * margin);
    pdf.text(descLines, margin, y);
    y += descLines.length * 4;
  }
  y += 3;
  // Champs de la section
  const tableData: any[][] = [];
  for (const field of section.fields) {
    if (field.hidden) continue;
    const label = field.label;
    const value = formatFieldValue(data[field.id], field);
    tableData.push([label, value]);
  }
  if (tableData.length > 0) {
    autoTable(pdf, {
      startY: y,
      head: [],
      body: tableData,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
        cellWidth: 'wrap'
      },
      columnStyles: {
        0: {
          cellWidth: 'auto',
          fontStyle: 'bold',
          overflow: 'linebreak'
        },
        1: {
          cellWidth: 'auto',
          halign: 'right',
          overflow: 'linebreak'
        }
      },
      theme: 'plain'
    });
    y = (pdf as any).lastAutoTable.finalY + 10;
  }
  // Sous-sections
  if (section.subsections) {
    for (const subsection of section.subsections) {
      y = addSection(pdf, subsection, data, y, pageWidth, pageHeight, margin);
    }
  }
  return y;
}
/**
 * Formate une valeur de champ pour l'affichage
 */
function formatFieldValue(value: any, field: FormField): string {
  if (value === null || value === undefined) {
    return '-';
  }
  switch (field.type) {
    case 'currency': {
      const formatted = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(Number(value));
      // Remplacer les espaces par des espaces insécables pour éviter les problèmes d'affichage
      return formatted.replace(/\s/g, '\u00A0');
    }
    case 'percentage':
      return `${Number(value).toFixed(field.decimals || 2)}\u00A0%`;
    case 'number': {
      const formatted = new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: field.decimals || 0,
        maximumFractionDigits: field.decimals || 2
      }).format(Number(value));
      // Remplacer les espaces par des espaces insécables
      return formatted.replace(/\s/g, '\u00A0');
    }
    case 'date':
      try {
        return new Date(value).toLocaleDateString('fr-FR');
      } catch {
        return String(value);
      }
    default:
      return String(value);
  }
}
/**
 * Ajoute la zone de signature
 */
function addSignature(
  pdf: jsPDF,
  startY: number,
  pageWidth: number,
  pageHeight: number,
  margin: number
): number {
  let y = startY;
  // Vérifier si nouvelle page nécessaire
  if (y > pageHeight - 60) {
    pdf.addPage();
    y = margin;
  }
  y += 20;
  // Zone de signature
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const signatureText = 'Fait le: ________________   À: ________________';
  pdf.text(signatureText, margin, y);
  y += 15;
  pdf.text('Signature et cachet de l\'entreprise:', margin, y);
  y += 20;
  // Cadre pour la signature
  pdf.setDrawColor(150, 150, 150);
  pdf.rect(margin, y, 80, 40);
  return y + 45;
}
/**
 * Ajoute le pied de page
 */
function addFooter(
  pdf: jsPDF,
  document: RegulatoryDocument,
  pageWidth: number,
  pageHeight: number,
  margin: number
): void {
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(150, 150, 150);
    // Numéro de page
    pdf.text(
      `Page ${i} / ${pageCount}`,
      pageWidth / 2,
      pageHeight - margin + 5,
      { align: 'center' }
    );
    // Date de génération
    const generationDate = new Date().toLocaleString('fr-FR');
    pdf.text(
      `Généré le ${generationDate}`,
      margin,
      pageHeight - margin + 5
    );
    // ID du document
    pdf.text(
      `ID: ${document.id.substring(0, 8)}`,
      pageWidth - margin,
      pageHeight - margin + 5,
      { align: 'right' }
    );

    // Footer discret "Généré par CassKai" centré en gris clair
    pdf.setFontSize(8);
    pdf.setTextColor(180, 180, 180); // Gris clair
    pdf.text(
      'Généré par CassKai - casskai.app',
      pageWidth / 2,
      pageHeight - margin + 10,
      { align: 'center' }
    );

    pdf.setTextColor(0, 0, 0);
  }
}
/**
 * Ajoute un watermark
 */
function addWatermark(
  pdf: jsPDF,
  watermarkText: string,
  pageWidth: number,
  pageHeight: number
): void {
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(50);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(200, 200, 200);
    pdf.text(
      watermarkText,
      pageWidth / 2,
      pageHeight / 2,
      {
        align: 'center',
        angle: 45
      }
    );
    pdf.setTextColor(0, 0, 0);
  }
}
/**
 * Exporte un document réglementaire en PDF (fonction wrapper)
 */
export async function exportRegulatoryDocumentToPdf(documentId: string): Promise<Blob> {
  try {
    const { supabase } = await import('@/lib/supabase');
    // Charger le document et son template
    const { data: document, error: docError } = await supabase
      .from('regulatory_documents')
      .select('*')
      .eq('id', documentId)
      .single();
    if (docError || !document) {
      throw new Error('Document not found');
    }
    const { data: template, error: templateError } = await supabase
      .from('regulatory_templates')
      .select('*')
      .eq('id', document.template_id)
      .single();
    if (templateError || !template) {
      throw new Error('Template not found');
    }
    const normalizedDocument = normalizeRegulatoryDocumentRow(document);
    const normalizedTemplate = normalizeRegulatoryTemplateRow(template);
    // Générer le PDF
    return await exportToPdf(normalizedDocument, normalizedTemplate);
  } catch (error) {
    logger.error('PdfExporter', 'Error exporting document to PDF:', error);
    throw error;
  }
}

/**
 * Exporte un document réglementaire en PDF (fonction wrapper, avec options)
 */
export async function exportRegulatoryDocumentToPdfWithOptions(
  documentId: string,
  options: Partial<PdfExportOptions> = {}
): Promise<Blob> {
  try {
    const { supabase } = await import('@/lib/supabase');

    const { data: document, error: docError } = await supabase
      .from('regulatory_documents')
      .select('*')
      .eq('id', documentId)
      .single();
    if (docError || !document) {
      throw new Error('Document not found');
    }

    const { data: template, error: templateError } = await supabase
      .from('regulatory_templates')
      .select('*')
      .eq('id', (document as any).template_id)
      .single();
    if (templateError || !template) {
      throw new Error('Template not found');
    }

    const normalizedDocument = normalizeRegulatoryDocumentRow(document);
    const normalizedTemplate = normalizeRegulatoryTemplateRow(template);
    return await exportToPdf(normalizedDocument, normalizedTemplate, options);
  } catch (error) {
    logger.error('PdfExporter', 'Error exporting document to PDF with options:', error);
    throw error;
  }
}
/**
 * Sauvegarde le PDF dans Supabase Storage
 */
export async function savePdfToStorage(
  blob: Blob,
  documentId: string,
  fileName: string
): Promise<string | null> {
  try {
    const { supabase } = await import('@/lib/supabase');
    const filePath = `regulatory-documents/${documentId}/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, blob, {
        contentType: 'application/pdf',
        upsert: true
      });
    if (uploadError) {
      logger.error('PdfExporter', 'Error uploading PDF:', uploadError);
      return null;
    }
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);
    return urlData.publicUrl;
  } catch (error) {
    logger.error('PdfExporter', 'Error saving PDF:', error);
    return null;
  }
}
