import { supabase } from '@/lib/supabase';
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

  const year = Number(period.slice(0, 4));
  return { fiscalYear: Number.isFinite(year) ? year : new Date().getFullYear(), fiscalPeriod: 'ANNUAL' };
}

export function mapDeclarationTypeToRegulatoryDocumentType(countryCode: string, declarationType: string): string | null {
  const cc = countryCode.toUpperCase();
  const dt = declarationType.toUpperCase();

  // France (subset: single-form exports)
  if (cc === 'FR') {
    if (dt === 'CA3') return 'FR_CA3';
    if (dt === 'CA12') return 'FR_CA12';

    // Direct liasse pages when provided
    if (dt.startsWith('LIASSE_')) {
      // 2058/2059 are stored as A variants in DB templates
      if (dt === 'LIASSE_2058') return 'FR_2058A';
      if (dt === 'LIASSE_2059') return 'FR_2059A';

      const page = dt.replace('LIASSE_', '');
      if (/^20\d{2}$/.test(page)) return `FR_${page}`;
    }

    // Multi-form bundles are not a single regulatory template
    if (dt === 'LIASSE_FISCALE') return null;
    return null;
  }

  // VAT patterns (MultiCountryTaxService config)
  // - DECLARATION_TVA_SN => SN_TVA
  // - VAT_RETURN_GH => GH_VAT
  const tvaMatch = dt.match(/^DECLARATION_TVA_([A-Z]{2})$/);
  if (tvaMatch) {
    const tvaCc = tvaMatch[1];
    // Algeria uses a specific VAT form name in templates
    if (tvaCc === 'DZ') return 'DZ_TVA_G50';
    return `${tvaCc}_TVA`;
  }

  const vatReturnMatch = dt.match(/^VAT_RETURN_([A-Z]{2})$/);
  if (vatReturnMatch) {
    const vatCc = vatReturnMatch[1];
    switch (vatCc) {
      case 'ZA':
        return 'ZA_VAT201';
      default:
        return `${vatCc}_VAT`;
    }
  }

  // Country-specific known tax forms (common names)
  if (cc === 'CI' && (dt.includes('BIC') || dt.includes('IS') || dt.includes('CIT'))) return 'CI_BIC';

  if (cc === 'DZ') {
    if (dt.includes('G50') || dt.includes('TVA')) return 'DZ_TVA_G50';
    if (dt.includes('IBS') || dt.includes('IS') || dt.includes('CIT')) return 'DZ_IBS';
  }

  if (cc === 'MA' && (dt.includes('IS') || dt.includes('CIT'))) return 'MA_IS';
  if (cc === 'TN' && (dt.includes('IS') || dt.includes('CIT'))) return 'TN_IS';

  if (cc === 'SN' && (dt.includes('IS') || dt.includes('CIT'))) return 'SN_IS';
  if (cc === 'CM' && (dt.includes('IS') || dt.includes('CIT'))) return 'CM_IS';

  if (cc === 'KE' && (dt.includes('CIT') || dt.includes('IS'))) return 'KE_CIT';
  if (cc === 'GH' && (dt.includes('CIT') || dt.includes('IS'))) return 'GH_CIT';
  if (cc === 'NG' && (dt.includes('CIT') || dt.includes('IS'))) return 'NG_CIT';
  if (cc === 'ZA' && (dt.includes('CIT') || dt.includes('IS') || dt.includes('IT14'))) return 'ZA_IT14';

  return null;
}

async function resolveActiveTemplateId(params: {
  countryCode: string;
  documentType: string;
}): Promise<string> {
  const { countryCode, documentType } = params;

  // Note: we include MULTI as a potential fallback even if current configs don't use it,
  // so future shared templates keep working.
  const { data: templates, error } = await supabase
    .from('regulatory_templates')
    .select('id, country_code, is_mandatory, version')
    .eq('document_type', documentType)
    .in('country_code', [countryCode, 'MULTI'])
    .eq('is_active', true)
    .order('is_mandatory', { ascending: false })
    .order('version', { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(`Erreur chargement template (${countryCode}/${documentType}): ${error.message}`);
  }

  const best = (templates ?? []).find(t => t.country_code === countryCode) ?? templates?.[0];
  const templateId = best?.id;

  if (!templateId) {
    throw new Error(
      `Template introuvable (actif) pour ${countryCode}/${documentType}. ` +
        `Si vous venez d'activer un nouveau pays, seed la table regulatory_templates (scripts/seed-regulatory-templates.ts).`
    );
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

  if (error) return null;
  return data?.[0]?.id ?? null;
}

export async function ensureRegulatoryDocumentForDeclaration(params: {
  companyId: string;
  countryCode: string;
  declarationType: string;
  period: string;
}): Promise<{ documentId: string; documentType: string }> {
  const documentType = mapDeclarationTypeToRegulatoryDocumentType(params.countryCode, params.declarationType);
  if (!documentType) {
    throw new Error(`Export réglementaire non supporté pour ${params.countryCode}/${params.declarationType}`);
  }

  const { fiscalYear, fiscalPeriod } = toFiscalPeriodFromPeriodString(params.period);
  const templateId = await resolveActiveTemplateId({ countryCode: params.countryCode, documentType });

  const existingId = await findLatestRegulatoryDocumentId({
    companyId: params.companyId,
    templateId,
    fiscalYear,
    fiscalPeriod
  });

  if (existingId) {
    return { documentId: existingId, documentType };
  }

  const result = await generateDocument(params.companyId, templateId, fiscalYear, fiscalPeriod);
  if (!result.success || !result.documentId) {
    const msg = (result.errors && result.errors.length)
      ? result.errors.map(e => `${e.field}: ${e.message}`).join('; ')
      : 'Génération impossible';
    throw new Error(`Génération document réglementaire échouée: ${msg}`);
  }

  return { documentId: result.documentId, documentType };
}

export async function exportDeclarationToRegulatoryPdf(params: {
  companyId: string;
  countryCode: string;
  declarationType: string;
  period: string;
}): Promise<{ blob: Blob; filename: string; mimeType: string }> {
  const { documentId, documentType } = await ensureRegulatoryDocumentForDeclaration(params);
  const blob = await exportRegulatoryDocumentToPdfWithOptions(documentId, {
    watermark: 'Document de travail (non dépôt)',
  });

  const safePeriod = params.period.replace(/[^a-zA-Z0-9._-]/g, '-');
  const safeType = documentType.replace(/[^a-zA-Z0-9._-]/g, '-');

  return {
    blob,
    filename: `${safeType}_${safePeriod}_${params.companyId}_regulatory.pdf`,
    mimeType: 'application/pdf'
  };
}

export async function exportDeclarationToRegulatoryXmlDraft(params: {
  companyId: string;
  countryCode: string;
  declarationType: string;
  period: string;
}): Promise<{ blob: Blob; filename: string; mimeType: string }> {
  const { documentId, documentType } = await ensureRegulatoryDocumentForDeclaration(params);

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

  const formatted = CountryFormatService.exportAsXML(payload, params.countryCode, documentType);
  const content = typeof formatted.content === 'string' ? formatted.content : formatted.content.toString();

  return {
    blob: new Blob([content], { type: `${formatted.mimeType};charset=utf-8` }),
    filename: formatted.filename,
    mimeType: formatted.mimeType,
  };
}
