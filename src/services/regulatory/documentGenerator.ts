/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Service de génération automatique de documents réglementaires
 */
import { supabase } from '@/lib/supabase';
import { safeEval } from '@/utils/safeEval';
import { logger } from '@/lib/logger';
import type {
  RegulatoryTemplate,
  AccountMapping,
  GenerationResult,
  ValidationError,
  ValidationWarning,
  FiscalPeriod
} from '@/types/regulatory';
/**
 * Génère un document réglementaire à partir d'un template
 */
export async function generateDocument(
  companyId: string,
  templateId: string,
  fiscalYear: number,
  fiscalPeriod: FiscalPeriod = 'ANNUAL'
): Promise<GenerationResult> {
  try {
    logger.debug('DocumentGenerator', '🔵 generateDocument called with:', { companyId, templateId, fiscalYear, fiscalPeriod });
    // Récupérer le template
    const { data: template, error: templateError } = await supabase
      .from('regulatory_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single();
    logger.debug('DocumentGenerator', '🔵 Template fetch result:', { template, templateError });
    if (templateError || !template) {
      logger.error('DocumentGenerator', '❌ Template not found:', templateError);
      return {
        success: false,
        errors: [{ field: 'template', message: 'Template not found', code: 'NOT_FOUND', severity: 'error' }]
      };
    }
    // Récupérer les données comptables de l'entreprise
    logger.debug('DocumentGenerator', '🔵 Fetching accounting data...');
    const accountingData = await fetchAccountingData(companyId, fiscalYear, fiscalPeriod);
    logger.debug('DocumentGenerator', '🔵 Accounting data (accounts count):', Object.keys(accountingData).length);
    logger.debug('DocumentGenerator', '🔵 Accounting data sample:', Object.entries(accountingData).slice(0, 5));
    // Appliquer le mapping des comptes - IMPORTANT: template peut avoir soit camelCase soit snake_case
    const accountMappings = (template as any).account_mappings || template.accountMappings || {};
    logger.debug('DocumentGenerator', '🔵 Account mappings:', JSON.stringify(accountMappings, null, 2));
    if (Object.keys(accountMappings).length === 0) {
      logger.warn('DocumentGenerator', '⚠️ WARNING: No account mappings defined in template! Documents will have empty data.');
    }
    const mappedData = applyAccountMapping(accountingData, accountMappings);
    logger.debug('DocumentGenerator', '🔵 Mapped data:', mappedData);
    logger.debug('DocumentGenerator', '🔵 Mapped data fields count:', Object.keys(mappedData).length);
    // Calculer les champs automatiques - IMPORTANT: template peut avoir soit camelCase soit snake_case
    const formSchema = (template as any).form_schema || template.formSchema || { sections: [] };
    logger.debug('DocumentGenerator', '🔵 Form schema:', formSchema);
    const calculatedData = calculateFields(mappedData, formSchema.sections || []);
    logger.debug('DocumentGenerator', '🔵 Calculated data:', calculatedData);
    // Valider les données
    const validationResult = validateData(calculatedData, formSchema.sections || []);
    logger.debug('DocumentGenerator', '🔵 Validation result:', validationResult);
    // Créer le document dans la base (utiliser snake_case de SQL)
    const { data: { user } } = await supabase.auth.getUser();
    // Obtenir la prochaine version pour ce type de document
    const { data: nextVersionData } = await supabase.rpc('get_next_document_version', {
      p_company_id: companyId,
      p_document_type: (template as any).document_type || template.documentType,
      p_fiscal_year: fiscalYear,
      p_fiscal_period: fiscalPeriod
    });
    const nextVersion = nextVersionData || 1;
    logger.debug('DocumentGenerator', '🔵 Next version:', nextVersion);
    const insertData = {
      company_id: companyId,
      ...(templateId && { template_id: templateId }),
      document_type: (template as any).document_type || template.documentType,
      fiscal_year: fiscalYear,
      fiscal_period: fiscalPeriod,
      country_code: (template as any).country_code || template.countryCode,
      accounting_standard: (template as any).accounting_standard || template.accountingStandard,
      version: nextVersion,
      data: {
        ...calculatedData,
        _meta: {
          validation_errors: validationResult.errors,
          validation_warnings: validationResult.warnings
        }
      },
      status: 'draft',
      created_by: user?.id
    };
    logger.debug('DocumentGenerator', '🔵 Inserting document:', insertData);
    const { data: document, error: createError } = await supabase
      .from('regulatory_documents')
      .insert(insertData)
      .select();
    logger.debug('DocumentGenerator', '🔵 Insert result:', { document, createError });
    if (createError) {
      logger.error('DocumentGenerator', '❌ Database error:', createError);
      return {
        success: false,
        errors: [{ field: 'database', message: createError.message, code: 'DB_ERROR', severity: 'error' }]
      };
    }
    // Prendre le premier résultat ou créer un objet basique
    const insertedDoc = Array.isArray(document) && document.length > 0 ? document[0] : null;
    const docId = insertedDoc?.id || (insertData as any).id;
    return {
      success: validationResult.errors.length === 0,
      documentId: docId,
      data: calculatedData,
      errors: validationResult.errors,
      warnings: validationResult.warnings
    };
  } catch (error) {
    logger.error('DocumentGenerator', 'Error generating document:', error);
    return {
      success: false,
      errors: [{ field: 'system', message: 'System error', code: 'SYSTEM_ERROR', severity: 'error' }]
    };
  }
}
/**
 * Récupère les données comptables nécessaires
 */
async function fetchAccountingData(
  companyId: string,
  fiscalYear: number,
  fiscalPeriod: FiscalPeriod
): Promise<Record<string, any>> {
  const { startDate, endDate } = calculatePeriodDates(fiscalYear, fiscalPeriod);
  logger.debug('DocumentGenerator', '🔵 Fetching accounting data for period:', { companyId, fiscalYear, fiscalPeriod, startDate, endDate });
  // Récupérer les écritures comptables - IMPORTANT: requête depuis journal_entries
  // Inclure les statuts 'posted', 'validated' ET 'imported' (pour les imports FEC)
  // Note: account_name n'existe PAS dans journal_entry_lines, uniquement account_number
  const { data: entries, error } = await supabase
    .from('journal_entries')
    .select(`
      entry_date,
      status,
      journal_entry_lines (
        account_number,
        debit_amount,
        credit_amount
      )
    `)
    .eq('company_id', companyId)
    .in('status', ['posted', 'validated', 'imported'])
    .gte('entry_date', startDate)
    .lte('entry_date', endDate);
  if (error) {
    logger.error('DocumentGenerator', '❌ Error fetching journal entries:', error);
    return {};
  }
  logger.debug('DocumentGenerator', '🔵 Found total journal entries:', entries?.length || 0);
  if (!entries || entries.length === 0) {
    logger.warn('DocumentGenerator', '⚠️ WARNING: No journal entries found for this company and period!');
    logger.warn('DocumentGenerator', '   - Company ID:', companyId);
    logger.warn('DocumentGenerator', '   - Date range:', startDate, 'to', endDate);
    logger.warn('DocumentGenerator', '   - Check if journal entries exist in the database for this period.');
    return {};
  }
  // Log status breakdown
  const statusCounts = entries.reduce((acc: any, e: any) => {
    const status = e.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  logger.debug('DocumentGenerator', '🔵 Status breakdown:', statusCounts);
  // Compter le nombre total de lignes
  let totalLines = 0;
  entries.forEach(entry => {
    totalLines += entry.journal_entry_lines?.length || 0;
  });
  logger.debug('DocumentGenerator', '🔵 Total entry lines:', totalLines);
  // Agréger par compte
  const accountData: Record<string, number> = {};
  entries.forEach((entry: any) => {
    // Parcourir toutes les lignes de l'écriture
    entry.journal_entry_lines?.forEach((line: any) => {
      const accountNumber = line.account_number;
      if (!accountNumber) return;
      if (!accountData[accountNumber]) {
        accountData[accountNumber] = 0;
      }
      // Calculer le solde net (débit - crédit)
      accountData[accountNumber] += (line.debit_amount || 0) - (line.credit_amount || 0);
    });
  });
  logger.debug('DocumentGenerator', '🔵 Aggregated account data (count):', Object.keys(accountData).length);
  logger.debug('DocumentGenerator', '🔵 Aggregated account data (sample):', Object.entries(accountData).slice(0, 10));
  return accountData;
}
/**
 * Applique le mapping des comptes selon le template
 */
function applyAccountMapping(
  accountData: Record<string, any>,
  mapping: AccountMapping
): Record<string, any> {
  const mappedData: Record<string, any> = {};
  for (const [fieldName, rule] of Object.entries(mapping)) {
    let total = 0;
    let matchCount = 0;
    // La règle contient un tableau de comptes avec wildcards
    if (rule.accounts && Array.isArray(rule.accounts)) {
      rule.accounts.forEach((accountPattern) => {
        // Wildcard explicite: "401*" match tous les comptes commençant par 401
        if (accountPattern.includes('*')) {
          const prefix = accountPattern.replace('*', '');
          Object.keys(accountData).forEach((account) => {
            if (account.startsWith(prefix)) {
              const value = accountData[account] || 0;
              total += value; // La valeur est déjà nette (debit - credit)
              matchCount++;
            }
          });
        } else {
          // Compte sans wildcard: traiter comme un préfixe (matching implicite)
          // "101" matche "101", "101300", "1013", etc.
          // "45" matche "45", "455001", "455002", etc.
          Object.keys(accountData).forEach((account) => {
            if (account.startsWith(accountPattern)) {
              const value = accountData[account] || 0;
              total += value; // La valeur est déjà nette (debit - credit)
              matchCount++;
            }
          });
        }
      });
    }
    logger.debug('DocumentGenerator', `🔵 Field "${fieldName}": matched ${matchCount} accounts, total = ${total}`);
    // Appliquer l'opération (SUM par défaut)
    if (rule.operation === 'AVG' && matchCount > 0) {
      total = total / matchCount;
    }
    // MIN, MAX, COUNT peuvent être ajoutés si nécessaire
    mappedData[fieldName] = total;
  }
  return mappedData;
}
/**
 * Calcule les champs avec formules
 */
function calculateFields(
  data: Record<string, any>,
  sections: any[]
): Record<string, any> {
  const result = { ...data };
  sections.forEach((section) => {
    section.fields?.forEach((field: any) => {
      // Vérifier si le champ a une formule (peut être dans field.formula.expression ou field.calculationFormula)
      const formulaExpression = field.formula?.expression || field.calculationFormula;
      if (formulaExpression && field.calculated) {
        try {
          // Extract variables from formula to validate they exist
          const variableMatches = formulaExpression.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
          const undefinedVariables = variableMatches.filter(
            (v) => !['SUM', 'ABS', 'IF', 'MAX', 'MIN'].includes(v) && result[v] === undefined
          );
          if (undefinedVariables.length > 0) {
            logger.warn('documentGenerator', 
              `Field ${field.name}: Formula references undefined variables: ${undefinedVariables.join(', ')}. Formula skipped.`,
              { formula: formulaExpression, availableVars: Object.keys(result).filter((k) => result[k] !== undefined) }
            );
            // Initialize with 0 instead of failing
            result[field.name] = 0;
          } else {
            result[field.name] = safeEval(formulaExpression, result);
          }
        } catch (error) {
          logger.error('documentGenerator', `Error calculating field ${field.name}:`, error, {
            formula: formulaExpression,
            availableData: Object.keys(result),
          });
          result[field.name] = 0;
        }
      }
    });
  });
  return result;
}
/**
 * Valide les données selon les règles du template
 */
function validateData(
  data: Record<string, any>,
  sections: any[]
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  sections.forEach((section) => {
    section.fields?.forEach((field: any) => {
      const value = data[field.name];
      // Champ requis
      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: field.name,
          message: `Le champ ${field.label} est requis`,
          code: 'REQUIRED_FIELD',
          severity: 'error'
        });
      }
      // Validation selon le type
      if (value !== undefined && value !== null) {
        if (field.type === 'number' && typeof value !== 'number') {
          errors.push({
            field: field.name,
            message: `Le champ ${field.label} doit être un nombre`,
            code: 'INVALID_TYPE',
            severity: 'error'
          });
        }
        // Validation personnalisée avec field.min et field.max
        if (field.min !== undefined && value < field.min) {
          errors.push({
            field: field.name,
            message: field.validationMessage || `${field.label} doit être >= ${field.min}`,
            code: 'MIN_VALUE',
            severity: 'error'
          });
        }
        if (field.max !== undefined && value > field.max) {
          warnings.push({
            field: field.name,
            message: field.validationMessage || `${field.label} doit être <= ${field.max}`,
            code: 'MAX_VALUE',
            severity: 'warning'
          });
        }
        // Pattern validation
        if (field.pattern && typeof value === 'string') {
          const regex = new RegExp(field.pattern);
          if (!regex.test(value)) {
            errors.push({
              field: field.name,
              message: field.validationMessage || `${field.label} ne correspond pas au format attendu`,
              code: 'PATTERN_MISMATCH',
              severity: 'error'
            });
          }
        }
      }
    });
  });
  return { errors, warnings };
}
/**
 * Recalcule tous les champs calculés d'un document
 */
export async function recalculateDocument(
  documentId: string
): Promise<GenerationResult> {
  try {
    // Récupérer le document
    const { data: document, error: docError } = await supabase
      .from('regulatory_documents')
      .select('*')
      .eq('id', documentId)
      .single();
    if (docError || !document) {
      return {
        success: false,
        errors: [{ field: 'document', message: 'Document not found', code: 'NOT_FOUND', severity: 'error' }]
      };
    }
    // Récupérer le template
    const { data: template, error: templateError } = await supabase
      .from('regulatory_templates')
      .select('*')
      .eq('document_type', document.document_type)
      .eq('country_code', document.country_code)
      .eq('is_active', true)
      .single();
    if (templateError || !template) {
      return {
        success: false,
        errors: [{ field: 'template', message: 'Template not found', code: 'NOT_FOUND', severity: 'error' }]
      };
    }
    // Recalculer les champs (utiliser snake_case de SQL)
    const formSchema = template.form_schema || { sections: [] };
    const calculatedData = calculateFields(document.data, formSchema.sections || []);
    // Valider
    const validationResult = validateData(calculatedData, formSchema.sections || []);
    // Fusionner les données originales avec les champs recalculés
    const mergedData = {
      ...document.data,
      ...calculatedData,
      _meta: {
        validation_errors: validationResult.errors,
        validation_warnings: validationResult.warnings
      }
    };
    // Mettre à jour le document
    await supabase
      .from('regulatory_documents')
      .update({
        data: mergedData,
        status: validationResult.errors.length === 0 ? 'draft' : 'draft'
      })
      .eq('id', documentId);
    return {
      success: validationResult.errors.length === 0,
      documentId,
      data: mergedData,
      errors: validationResult.errors,
      warnings: validationResult.warnings
    };
  } catch (error) {
    logger.error('DocumentGenerator', 'Error recalculating document:', error);
    return {
      success: false,
      errors: [{ field: 'system', message: 'System error', code: 'SYSTEM_ERROR', severity: 'error' }]
    };
  }
}
/**
 * Calcule les dates de début et fin pour une période fiscale
 * @param year - Année fiscale
 * @param period - Période fiscale (ANNUAL, Q1, Q2, Q3, Q4, M01-M12)
 * @returns Object avec startDate et endDate au format YYYY-MM-DD
 */
export function calculatePeriodDates(
  year: number,
  period: FiscalPeriod
): { startDate: string; endDate: string } {
  let startMonth = 0;
  let startDay = 1;
  let endMonth = 11;
  let endDay = 31;
  if (period === 'ANNUAL') {
    // Exercice complet: 1er janvier au 31 décembre
    startMonth = 0;
    endMonth = 11;
    endDay = 31;
  } else if (period.startsWith('Q')) {
    // Trimestre
    const quarter = parseInt(period.substring(1));
    startMonth = (quarter - 1) * 3;
    endMonth = startMonth + 2;
    // Dernier jour du dernier mois du trimestre
    const lastMonthDate = new Date(year, endMonth + 1, 0);
    endDay = lastMonthDate.getDate();
  } else if (period.startsWith('M')) {
    // Mois spécifique (M01 à M12)
    const month = parseInt(period.substring(1));
    startMonth = month - 1;
    endMonth = month - 1;
    // Dernier jour du mois
    const lastDayDate = new Date(year, month, 0);
    endDay = lastDayDate.getDate();
  }
  const startDate = `${year}-${String(startMonth + 1).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
  const endDate = `${year}-${String(endMonth + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
  return { startDate, endDate };
}
/**
 * Valide les données d'un document par rapport à son template
 * @param documentData - Données du document à valider
 * @param template - Template réglementaire de référence
 * @returns Résultat de validation avec isValid, errors et warnings
 */
export function validateDocumentData(
  documentData: Record<string, any>,
  template: RegulatoryTemplate
): { isValid: boolean; errors: ValidationError[]; warnings: ValidationWarning[] } {
  const formSchema = (template as any).form_schema || template.formSchema || { sections: [] };
  const { errors, warnings } = validateData(documentData, formSchema.sections || []);
  // Validations supplémentaires spécifiques au type de document
  if (template.documentType.includes('balance_sheet')) {
    // Vérifier l'équilibre du bilan (actif = passif)
    const totalAssets = documentData.total_assets || 0;
    const totalLiabilitiesEquity = documentData.total_liabilities_equity || 0;
    if (Math.abs(totalAssets - totalLiabilitiesEquity) > 0.01) {
      errors.push({
        field: 'balance',
        message: `Le bilan n'est pas équilibré: Actif (${totalAssets}) ≠ Passif (${totalLiabilitiesEquity})`,
        code: 'UNBALANCED_SHEET',
        severity: 'error'
      });
    }
  }
  if (template.documentType.includes('income_statement')) {
    // Vérifier la cohérence du compte de résultat
    const revenue = documentData.revenue || 0;
    const expenses = documentData.expenses || 0;
    const netIncome = documentData.net_income || 0;
    const calculatedNetIncome = revenue - expenses;
    if (Math.abs(netIncome - calculatedNetIncome) > 0.01) {
      warnings.push({
        field: 'net_income',
        message: `Résultat net incohérent: déclaré (${netIncome}) vs calculé (${calculatedNetIncome})`,
        code: 'INCONSISTENT_NET_INCOME',
        severity: 'warning'
      });
    }
  }
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
