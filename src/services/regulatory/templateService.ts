/**
 * CassKai - Template Management Service
 * Handles loading, caching, and operations on regulatory templates
 */
import { supabase } from '@/lib/supabase';
import type { RegulatoryTemplate, FormSchema, AccountMapping } from '@/types/regulatory';
import { logger } from '@/lib/logger';
// In-memory template cache
const templateCache = new Map<string, RegulatoryTemplate>();
const cacheExpiration = new Map<string, number>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
/**
 * Get template by ID from cache or database
 */
export async function getTemplate(templateId: string): Promise<RegulatoryTemplate | null> {
  // Check cache first
  const cached = templateCache.get(templateId);
  const expiration = cacheExpiration.get(templateId);
  if (cached && expiration && Date.now() < expiration) {
    return cached;
  }
  // Fetch from database
  const { data, error } = await supabase
    .from('regulatory_templates')
    .select('*')
    .eq('id', templateId)
    .single();
  if (error || !data) {
    logger.error('Template', 'Error fetching template:', error);
    return null;
  }
  // Cache the result
  templateCache.set(templateId, data);
  cacheExpiration.set(templateId, Date.now() + CACHE_TTL);
  return data;
}
/**
 * Get templates by accounting standard and country
 */
export async function getTemplatesByStandardAndCountry(
  accountingStandard: string,
  countryCode: string
): Promise<RegulatoryTemplate[]> {
  const { data, error } = await supabase
    .from('regulatory_templates')
    .select('*')
    .eq('accounting_standard', accountingStandard)
    .eq('country_code', countryCode)
    .eq('is_active', true);
  if (error) {
    logger.error('Template', 'Error fetching templates:', error);
    return [];
  }
  return data || [];
}
/**
 * Get all active templates
 */
export async function getAllActiveTemplates(): Promise<RegulatoryTemplate[]> {
  const { data, error } = await supabase
    .from('regulatory_templates')
    .select('*')
    .eq('is_active', true);
  if (error) {
    logger.error('Template', 'Error fetching templates:', error);
    return [];
  }
  return data || [];
}
/**
 * Get templates by country with all accounting standards
 */
export async function getTemplatesByCountry(countryCode: string): Promise<RegulatoryTemplate[]> {
  const { data, error } = await supabase
    .from('regulatory_templates')
    .select('*')
    .eq('country_code', countryCode)
    .eq('is_active', true);
  if (error) {
    logger.error('Template', 'Error fetching templates:', error);
    return [];
  }
  return data || [];
}
/**
 * Get templates by document type
 */
export async function getTemplatesByDocumentType(
  documentType: string
): Promise<RegulatoryTemplate[]> {
  const { data, error } = await supabase
    .from('regulatory_templates')
    .select('*')
    .eq('document_type', documentType)
    .eq('is_active', true);
  if (error) {
    logger.error('Template', 'Error fetching templates:', error);
    return [];
  }
  return data || [];
}
/**
 * Get mandatory templates for a company
 */
export async function getMandatoryTemplates(
  accountingStandard: string,
  countryCode: string
): Promise<RegulatoryTemplate[]> {
  const { data, error } = await supabase
    .from('regulatory_templates')
    .select('*')
    .eq('accounting_standard', accountingStandard)
    .eq('country_code', countryCode)
    .eq('is_mandatory', true)
    .eq('is_active', true);
  if (error) {
    logger.error('Template', 'Error fetching mandatory templates:', error);
    return [];
  }
  return data || [];
}
/**
 * Group templates by category
 */
export function groupTemplatesByCategory(
  templates: RegulatoryTemplate[]
): Record<string, RegulatoryTemplate[]> {
  return templates.reduce((acc, template) => {
    const category = template.category ?? 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, RegulatoryTemplate[]>);
}
/**
 * Get auto-fill fields from template
 * Returns list of fields that can be auto-filled from accounting data
 */
export function getAutoFillFields(template: RegulatoryTemplate): Array<{
  fieldId: string;
  label: string;
  accountMapping: any;
}> {
  const autoFillFields: Array<{
    fieldId: string;
    label: string;
    accountMapping: any;
  }> = [];
  function traverseSections(sections: any[]): void {
    sections.forEach((section) => {
      if (section.fields) {
        section.fields.forEach((field: any) => {
          if (field.autoFill && field.accountMapping) {
            autoFillFields.push({
              fieldId: field.id,
              label: field.label,
              accountMapping: field.accountMapping,
            });
          }
        });
      }
      if (section.subsections) {
        traverseSections(section.subsections);
      }
    });
  }
  if (template.formSchema?.sections) {
    traverseSections(template.formSchema.sections);
  }
  return autoFillFields;
}
/**
 * Get computed fields from template
 * Returns list of fields that are computed from other fields
 */
export function getComputedFields(template: RegulatoryTemplate): Array<{
  fieldId: string;
  label: string;
  formula: string;
  dependsOn: string[];
}> {
  const computedFields: Array<{
    fieldId: string;
    label: string;
    formula: string;
    dependsOn: string[];
  }> = [];
  function extractFieldIds(formula: string): string[] {
    const matches = formula.match(/=([a-zA-Z_][a-zA-Z0-9_]*)/g);
    return (matches || []).map((m) => m.substring(1));
  }
  function traverseSections(sections: any[]): void {
    sections.forEach((section) => {
      if (section.fields) {
        section.fields.forEach((field: any) => {
          if (field.computed && field.computationFormula) {
            computedFields.push({
              fieldId: field.id,
              label: field.label,
              formula: field.computationFormula,
              dependsOn: extractFieldIds(field.computationFormula),
            });
          }
        });
      }
      if (section.subsections) {
        traverseSections(section.subsections);
      }
    });
  }
  if (template.formSchema?.sections) {
    traverseSections(template.formSchema.sections);
  }
  return computedFields;
}
/**
 * Validate template structure
 */
export function validateTemplateStructure(template: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!template.id) errors.push('Template must have an id');
  if (!template.documentType) errors.push('Template must have a documentType');
  if (!template.accountingStandard) errors.push('Template must have an accountingStandard');
  if (!template.countryCode) errors.push('Template must have a countryCode');
  if (!template.name) errors.push('Template must have a name');
  if (!template.formSchema) errors.push('Template must have a formSchema');
  if (!template.formSchema?.sections || template.formSchema.sections.length === 0) {
    errors.push('Template formSchema must have at least one section');
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}
/**
 * Clear template cache
 */
export function clearTemplateCache(): void {
  templateCache.clear();
  cacheExpiration.clear();
}
/**
 * Clear cache entry for a specific template
 */
export function clearTemplateCacheEntry(templateId: string): void {
  templateCache.delete(templateId);
  cacheExpiration.delete(templateId);
}
/**
 * Get template statistics
 */
export async function getTemplateStatistics(): Promise<{
  totalTemplates: number;
  activeTemplates: number;
  mandatoryTemplates: number;
  templatesByStandard: Record<string, number>;
  templatesByCountry: Record<string, number>;
}> {
  const templates = await getAllActiveTemplates();
  const byStandard: Record<string, number> = {};
  const byCountry: Record<string, number> = {};
  let mandatoryCount = 0;
  templates.forEach((template) => {
    // Count by standard
    byStandard[template.accountingStandard] = (byStandard[template.accountingStandard] || 0) + 1;
    // Count by country
    byCountry[template.countryCode] = (byCountry[template.countryCode] || 0) + 1;
    // Count mandatory
    if (template.isMandatory) {
      mandatoryCount++;
    }
  });
  return {
    totalTemplates: templates.length,
    activeTemplates: templates.filter((t) => t.isActive).length,
    mandatoryTemplates: mandatoryCount,
    templatesByStandard: byStandard,
    templatesByCountry: byCountry,
  };
}
/**
 * Export templates to JSON format
 */
export async function exportTemplatesToJSON(): Promise<string> {
  const templates = await getAllActiveTemplates();
  return JSON.stringify(templates, null, 2);
}
/**
 * Export templates to CSV format (simplified)
 */
export async function exportTemplatesToCSV(): Promise<string> {
  const templates = await getAllActiveTemplates();
  const headers = ['ID', 'Document Type', 'Standard', 'Country', 'Name', 'Category', 'Mandatory'];
  const rows = templates.map((t) => [
    t.id,
    t.documentType,
    t.accountingStandard,
    t.countryCode,
    t.name,
    t.category,
    t.isMandatory ? 'Yes' : 'No',
  ]);
  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');
  return csv;
}
export default {
  getTemplate,
  getTemplatesByStandardAndCountry,
  getAllActiveTemplates,
  getTemplatesByCountry,
  getTemplatesByDocumentType,
  getMandatoryTemplates,
  groupTemplatesByCategory,
  getAutoFillFields,
  getComputedFields,
  validateTemplateStructure,
  clearTemplateCache,
  clearTemplateCacheEntry,
  getTemplateStatistics,
  exportTemplatesToJSON,
  exportTemplatesToCSV,
};