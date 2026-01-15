import { supabase } from '@/lib/supabase';
import type { FrenchTaxDeclaration } from './FrenchTaxComplianceService';
import type { FiscalPeriod } from '@/types/regulatory';
import { generateDocument } from '@/services/regulatory/documentGenerator';
import { exportRegulatoryDocumentToPdfWithOptions } from '@/services/regulatory/pdfExporter';
import { CountryFormatService } from '@/services/regulatory/countryFormatService';

function toFiscalPeriodFromPeriodString(period: string): { fiscalYear: number; fiscalPeriod: FiscalPeriod } {
  // Supported:
  // - YYYY => ANNUAL
  // - YYYY-MM => M01..M12
  if (/^\d{4}$/.test(period)) {
    return { fiscalYear: Number(period), fiscalPeriod: 'ANNUAL' };
  }

  const match = period.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const fiscalYear = Number(match[1]);
    const month = Number(match[2]);
    if (month >= 1 && month <= 12) {
      const fiscalPeriod = (`M${String(month).padStart(2, '0')}` as FiscalPeriod);
      return { fiscalYear, fiscalPeriod };
    }
  }

  // Fallback: treat as annual (keeps UX robust even if period formatting evolves)
  const year = Number(period.slice(0, 4));
  return { fiscalYear: Number.isFinite(year) ? year : new Date().getFullYear(), fiscalPeriod: 'ANNUAL' };
}

export function mapFrenchDeclarationTypeToRegulatoryDocumentType(type: FrenchTaxDeclaration['type']): string | null {
  switch (type) {
    case 'CA3':
      return 'FR_CA3';
    case 'CA12':
      return 'FR_CA12';

    case 'LIASSE_2050':
      return 'FR_2050';
    case 'LIASSE_2051':
      return 'FR_2051';
    case 'LIASSE_2052':
      return 'FR_2052';
    case 'LIASSE_2053':
      return 'FR_2053';
    case 'LIASSE_2054':
      return 'FR_2054';
    case 'LIASSE_2055':
      return 'FR_2055';
    case 'LIASSE_2056':
      return 'FR_2056';
    case 'LIASSE_2057':
      return 'FR_2057';

    // FrenchTaxComplianceService currently produces a simplified “2058” and “2059”.
    // In the regulatory templates DB, those are stored as 2058A and 2059A.
    case 'LIASSE_2058':
      return 'FR_2058A';
    case 'LIASSE_2059':
      return 'FR_2059A';

    default:
      return null;
  }
}

export function isSupportedForRegulatoryExport(type: FrenchTaxDeclaration['type']): boolean {
  return mapFrenchDeclarationTypeToRegulatoryDocumentType(type) !== null;
}

async function resolveActiveTemplateId(documentType: string): Promise<string> {
  const { data: templates, error } = await supabase
    .from('regulatory_templates')
    .select('id, is_mandatory, version')
    .eq('document_type', documentType)
    .eq('country_code', 'FR')
    .eq('is_active', true)
    .order('is_mandatory', { ascending: false })
    .order('version', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`Erreur chargement template (${documentType}): ${error.message}`);
  }

  const templateId = templates?.[0]?.id;
  if (!templateId) {
    throw new Error(`Template introuvable (actif) pour ${documentType}`);
  }

  return templateId;
}

async function findLatestRegulatoryDocumentId(params: {
  companyId: string;
  templateId: string;
  fiscalYear: number;
  fiscalPeriod: FiscalPeriod;
}): Promise<string | null> {
  const { data, error } = await supabase
    .from('regulatory_documents')
    .select('id, version')
    .eq('company_id', params.companyId)
    .eq('template_id', params.templateId)
    .eq('fiscal_year', params.fiscalYear)
    .eq('fiscal_period', params.fiscalPeriod)
    .order('version', { ascending: false })
    .limit(1);

  if (error) {
    return null;
  }

  return data?.[0]?.id ?? null;
}

async function ensureRegulatoryDocumentForFrenchDeclaration(
  companyId: string,
  declaration: FrenchTaxDeclaration
): Promise<{ documentId: string; documentType: string }> {
  const documentType = mapFrenchDeclarationTypeToRegulatoryDocumentType(declaration.type);
  if (!documentType) {
    throw new Error(`Type non supporté pour export réglementaire: ${declaration.type}`);
  }

  const { fiscalYear, fiscalPeriod } = toFiscalPeriodFromPeriodString(declaration.period);
  const templateId = await resolveActiveTemplateId(documentType);

  const existingId = await findLatestRegulatoryDocumentId({ companyId, templateId, fiscalYear, fiscalPeriod });
  if (existingId) {
    return { documentId: existingId, documentType };
  }

  const result = await generateDocument(companyId, templateId, fiscalYear, fiscalPeriod);
  if (!result.success || !result.documentId) {
    const msg = (result.errors && result.errors.length)
      ? result.errors.map(e => `${e.field}: ${e.message}`).join('; ')
      : 'Génération impossible';
    throw new Error(`Génération document réglementaire échouée: ${msg}`);
  }

  return { documentId: result.documentId, documentType };
}

export async function exportFrenchDeclarationToRegulatoryPdf(
  companyId: string,
  declaration: FrenchTaxDeclaration
): Promise<Blob> {
  const { documentId } = await ensureRegulatoryDocumentForFrenchDeclaration(companyId, declaration);

  return exportRegulatoryDocumentToPdfWithOptions(documentId, {
    watermark: 'Document de travail (non dépôt)',
  });
}

export async function exportFrenchDeclarationToRegulatoryXmlDraft(
  companyId: string,
  declaration: FrenchTaxDeclaration
): Promise<{ blob: Blob; filename: string; mimeType: string }> {
  const { documentId, documentType } = await ensureRegulatoryDocumentForFrenchDeclaration(companyId, declaration);

  const { data: documentRow, error } = await supabase
    .from('regulatory_documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (error || !documentRow) {
    throw new Error('Document réglementaire introuvable après génération');
  }

  const payload = {
    fiscal_year: (documentRow as any).fiscal_year,
    fiscal_period: (documentRow as any).fiscal_period,
    ...((documentRow as any).data ?? {}),
  };

  const formatted = CountryFormatService.exportAsXML(payload, 'FR', documentType);
  const content = typeof formatted.content === 'string' ? formatted.content : formatted.content.toString();

  return {
    blob: new Blob([content], { type: `${formatted.mimeType};charset=utf-8` }),
    filename: formatted.filename,
    mimeType: formatted.mimeType,
  };
}
