import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FrenchTaxDeclaration } from './FrenchTaxComplianceService';

export type FranceTaxExportFormat = 'pdf' | 'edi';

type CompanyInfo = {
  name?: string;
  siren?: string;
  vatNumber?: string;
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
  if (value instanceof Date) return value.toLocaleDateString('fr-FR');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function toKeyValueRows(data: Record<string, unknown>): Array<[string, string]> {
  return Object.entries(data)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => [key, formatValue(value)]);
}

export async function exportFrenchTaxDeclarationToPdf(
  declaration: FrenchTaxDeclaration,
  company?: CompanyInfo
): Promise<Blob> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  const marginX = 40;
  let y = 50;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Déclaration fiscale (brouillon)', marginX, y);

  y += 18;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const headerLines: string[] = [
    `Type: ${declaration.type}`,
    `Période: ${declaration.period}`,
    `Statut: ${declaration.status}`,
    `Échéance: ${declaration.dueDate.toLocaleDateString('fr-FR')}`
  ];

  if (company?.name) headerLines.unshift(`Entreprise: ${company.name}`);
  if (company?.siren) headerLines.push(`SIREN: ${company.siren}`);
  if (company?.vatNumber) headerLines.push(`TVA: ${company.vatNumber}`);

  headerLines.forEach(line => {
    doc.text(line, marginX, y);
    y += 14;
  });

  if (declaration.warnings?.length) {
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Avertissements', marginX, y);
    y += 10;
    doc.setFont('helvetica', 'normal');

    const warningRows = declaration.warnings.map(w => [w]);
    autoTable(doc, {
      startY: y,
      head: [['Message']],
      body: warningRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [245, 158, 11] }
    });
    y = (doc as any).lastAutoTable.finalY + 20;
  }

  if (declaration.validationErrors?.length) {
    doc.setFont('helvetica', 'bold');
    doc.text('Erreurs de validation', marginX, y);
    y += 10;
    doc.setFont('helvetica', 'normal');

    const errorRows = declaration.validationErrors.map(e => [e]);
    autoTable(doc, {
      startY: y,
      head: [['Message']],
      body: errorRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [239, 68, 68] }
    });
    y = (doc as any).lastAutoTable.finalY + 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Données', marginX, y);

  y += 10;
  doc.setFont('helvetica', 'normal');

  const rawData = (declaration.data ?? {}) as Record<string, unknown>;
  const topLevel = Object.fromEntries(
    Object.entries(rawData).filter(([, v]) => typeof v !== 'object' || v === null)
  ) as Record<string, unknown>;

  const nested = Object.fromEntries(
    Object.entries(rawData).filter(([, v]) => typeof v === 'object' && v !== null)
  ) as Record<string, unknown>;

  autoTable(doc, {
    startY: y,
    head: [['Champ', 'Valeur']],
    body: toKeyValueRows(topLevel),
    styles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 200 }, 1: { cellWidth: pageWidth - marginX * 2 - 200 } }
  });

  y = (doc as any).lastAutoTable.finalY + 20;

  for (const [sectionName, sectionValue] of Object.entries(nested)) {
    doc.setFont('helvetica', 'bold');
    doc.text(sectionName, marginX, y);
    y += 10;
    doc.setFont('helvetica', 'normal');

    const sectionObj = sectionValue as Record<string, unknown>;
    autoTable(doc, {
      startY: y,
      head: [['Champ', 'Valeur']],
      body: toKeyValueRows(sectionObj),
      styles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 200 }, 1: { cellWidth: pageWidth - marginX * 2 - 200 } }
    });

    y = (doc as any).lastAutoTable.finalY + 20;
  }

  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Généré par CassKai — Document de travail (non dépôt)', pageWidth / 2, pageHeight - 20, { align: 'center' });

  return doc.output('blob');
}

export function exportFrenchTaxDeclarationToEdiDraft(declaration: FrenchTaxDeclaration): Blob {
  const payload = {
    format: 'CASSKAI_EDI_DRAFT_V1',
    jurisdiction: 'FR',
    generatedAt: new Date().toISOString(),
    declaration: {
      id: declaration.id,
      type: declaration.type,
      period: declaration.period,
      dueDate: declaration.dueDate.toISOString(),
      status: declaration.status,
      data: declaration.data,
      validationErrors: declaration.validationErrors,
      warnings: declaration.warnings
    }
  };

  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
}

export function blobToObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function downloadObjectUrl(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
