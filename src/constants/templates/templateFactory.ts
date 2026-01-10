/**
 * CassKai - Factory pour génération automatique de templates
 * Permet de créer rapidement tous les formulaires à partir de configurations compactes
 */

import type { RegulatoryTemplate, FormSection, FormField } from '@/types/regulatory';

/**
 * Configuration compacte d'un champ
 */
interface FieldConfig {
  id: string;
  label: string;
  type?: 'currency' | 'text' | 'number' | 'date' | 'percentage';
  required?: boolean;
  accounts?: string[];
  operation?: 'SUM' | 'AVG' | 'COUNT';
  debitCredit?: 'DEBIT' | 'CREDIT' | 'NET';
  formula?: string;
  description?: string;
}

/**
 * Configuration compacte d'une section
 */
interface SectionConfig {
  id: string;
  title: string;
  fields: FieldConfig[];
  description?: string;
}

/**
 * Configuration compacte d'un template
 */
export interface TemplateConfig {
  documentType: string;
  countryCode: string;
  accountingStandard: 'PCG' | 'SYSCOHADA' | 'IFRS' | 'SCF' | 'PCM';
  name: string;
  description: string;
  category: 'financial_statements' | 'tax_returns' | 'social_declarations';
  frequency: 'ANNUAL' | 'QUARTERLY' | 'MONTHLY';
  isMandatory: boolean;
  sections: SectionConfig[];
  balanceChecks?: Array<{ left: string[]; right: string[]; tolerance?: number }>;
}

/**
 * Génère un FormField complet à partir d'une FieldConfig
 */
function createField(config: FieldConfig, order: number): FormField {
  const field: FormField = {
    id: config.id,
    name: config.id,
    label: config.label,
    type: config.type || 'currency',
    required: config.required !== false,
    order,
    description: config.description
  };

  // Auto-fill depuis comptes comptables
  if (config.accounts && config.accounts.length > 0) {
    field.autoFill = {
      source: 'accounts',
      accounts: config.accounts,
      operation: config.operation || 'SUM',
      debitCredit: config.debitCredit || 'DEBIT'
    };
  }

  // Champ calculé
  if (config.formula) {
    field.calculated = true;
    field.calculationFormula = config.formula;
  }

  return field;
}

/**
 * Génère une FormSection complète à partir d'une SectionConfig
 */
function createSection(config: SectionConfig, order: number): FormSection {
  return {
    id: config.id,
    title: config.title,
    description: config.description,
    order,
    fields: config.fields.map((f, i) => createField(f, i + 1))
  };
}

/**
 * Génère un RegulatoryTemplate complet à partir d'une TemplateConfig
 */
export function createTemplateFromConfig(
  config: TemplateConfig
): Omit<RegulatoryTemplate, 'id' | 'createdAt' | 'updatedAt'> {
  const template: Omit<RegulatoryTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
    documentType: config.documentType,
    countryCode: config.countryCode,
    accountingStandard: config.accountingStandard,
    name: config.name,
    description: config.description,
    category: config.category,
    frequency: config.frequency,
    isMandatory: config.isMandatory,
    version: '1.0',
    isActive: true,

    formSchema: {
      version: '1.0',
      sections: config.sections.map((s, i) => createSection(s, i + 1))
    },

    validationRules: {
      required: [],
      numeric: []
    }
  };

  // Ajouter les balance checks si présents
  if (config.balanceChecks && config.balanceChecks.length > 0) {
    template.validationRules!.balanceChecks = config.balanceChecks.map(check => ({
      leftFields: check.left,
      rightFields: check.right,
      message: `Balance check failed`,
      tolerance: check.tolerance || 1.0
    }));
  }

  // Générer accountMappings depuis les champs avec accounts
  const mappings: any = {};
  config.sections.forEach(section => {
    section.fields.forEach(field => {
      if (field.accounts && field.accounts.length > 0) {
        mappings[field.id] = {
          accounts: field.accounts,
          operation: field.operation || 'SUM',
          debitCredit: field.debitCredit || 'DEBIT'
        };
      }
    });
  });

  if (Object.keys(mappings).length > 0) {
    template.accountMappings = mappings;
  }

  return template;
}

/**
 * Génère plusieurs templates à partir d'un tableau de configs
 */
export function createTemplatesFromConfigs(
  configs: TemplateConfig[]
): Array<Omit<RegulatoryTemplate, 'id' | 'createdAt' | 'updatedAt'>> {
  return configs.map(createTemplateFromConfig);
}
