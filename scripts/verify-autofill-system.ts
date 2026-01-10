/**
 * CassKai - Script de vérification du système auto-fill
 *
 * Ce script vérifie que le système d'auto-fill fonctionne correctement:
 * 1. Vérifie que les templates ont des accountMappings valides
 * 2. Vérifie que les comptes référencés suivent les conventions
 * 3. Génère un rapport de couverture
 *
 * Usage:
 *   npx tsx scripts/verify-autofill-system.ts
 */

import {
  generateAllRegulatoryTemplates,
  TEMPLATE_STATS,
  getTemplatesByCountry
} from '../src/constants/templates';

interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  template: string;
  field?: string;
  message: string;
}

/**
 * Valide la structure d'un account mapping
 */
function validateAccountMapping(
  templateId: string,
  fieldId: string,
  mapping: any
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Vérifier les propriétés requises
  if (!mapping.accounts || !Array.isArray(mapping.accounts)) {
    issues.push({
      severity: 'error',
      template: templateId,
      field: fieldId,
      message: 'Missing or invalid accounts array'
    });
  }

  if (!mapping.debitCredit || !['DEBIT', 'CREDIT', 'NET'].includes(mapping.debitCredit)) {
    issues.push({
      severity: 'error',
      template: templateId,
      field: fieldId,
      message: `Invalid debitCredit: ${mapping.debitCredit}`
    });
  }

  if (!mapping.operation || !['SUM', 'AVG', 'COUNT', 'MIN', 'MAX'].includes(mapping.operation)) {
    issues.push({
      severity: 'error',
      template: templateId,
      field: fieldId,
      message: `Invalid operation: ${mapping.operation}`
    });
  }

  // Vérifier le format des comptes
  if (mapping.accounts && Array.isArray(mapping.accounts)) {
    mapping.accounts.forEach((account: string) => {
      // Vérifier format (doit être numérique ou avec wildcard)
      if (!/^[\d*]+$/.test(account)) {
        issues.push({
          severity: 'warning',
          template: templateId,
          field: fieldId,
          message: `Account ${account} has invalid format (should be numeric or with *)`
        });
      }

      // Vérifier longueur (généralement 3-6 caractères)
      if (account.replace('*', '').length > 6) {
        issues.push({
          severity: 'info',
          template: templateId,
          field: fieldId,
          message: `Account ${account} is unusually long`
        });
      }
    });
  }

  return issues;
}

/**
 * Analyse la couverture des account mappings
 */
function analyzeAccountMappingCoverage(template: any): {
  totalFields: number;
  mappedFields: number;
  formulaFields: number;
  manualFields: number;
} {
  let totalFields = 0;
  let mappedFields = 0;
  let formulaFields = 0;

  if (!template.formSchema?.sections) {
    return { totalFields: 0, mappedFields: 0, formulaFields: 0, manualFields: 0 };
  }

  template.formSchema.sections.forEach((section: any) => {
    if (section.fields) {
      section.fields.forEach((field: any) => {
        totalFields++;

        // Vérifier si le champ a un mapping
        if (template.accountMappings && template.accountMappings[field.id]) {
          mappedFields++;
        }

        // Vérifier si le champ a une formule
        if (field.formula) {
          formulaFields++;
        }
      });
    }
  });

  const manualFields = totalFields - mappedFields - formulaFields;
  return { totalFields, mappedFields, formulaFields, manualFields };
}

/**
 * Fonction principale de vérification
 */
async function verifyAutofillSystem() {
  console.log('🔍 CassKai - Vérification du système auto-fill\n');
  console.log('═'.repeat(80));

  // Générer tous les templates
  console.log('📋 Génération des templates...');
  const templates = generateAllRegulatoryTemplates();
  console.log(`✓ ${templates.length} templates générés\n`);

  // Statistiques globales
  let totalIssues = 0;
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalFields = 0;
  let totalMappedFields = 0;
  let totalFormulaFields = 0;
  let totalManualFields = 0;

  const issues: ValidationIssue[] = [];

  // Par standard comptable
  const statsByStandard: Record<string, {
    templates: number;
    fields: number;
    mapped: number;
    formula: number;
    manual: number;
  }> = {};

  console.log('🔬 Analyse des templates...\n');

  // Vérifier chaque template
  templates.forEach(template => {
    // Initialiser les stats par standard
    if (!statsByStandard[template.accountingStandard]) {
      statsByStandard[template.accountingStandard] = {
        templates: 0,
        fields: 0,
        mapped: 0,
        formula: 0,
        manual: 0
      };
    }

    statsByStandard[template.accountingStandard].templates++;

    // Analyser la couverture
    const coverage = analyzeAccountMappingCoverage(template);
    totalFields += coverage.totalFields;
    totalMappedFields += coverage.mappedFields;
    totalFormulaFields += coverage.formulaFields;
    totalManualFields += coverage.manualFields;

    statsByStandard[template.accountingStandard].fields += coverage.totalFields;
    statsByStandard[template.accountingStandard].mapped += coverage.mappedFields;
    statsByStandard[template.accountingStandard].formula += coverage.formulaFields;
    statsByStandard[template.accountingStandard].manual += coverage.manualFields;

    // Valider les account mappings
    if (template.accountMappings) {
      Object.entries(template.accountMappings).forEach(([fieldId, mapping]) => {
        const fieldIssues = validateAccountMapping(
          template.documentType,
          fieldId,
          mapping
        );
        issues.push(...fieldIssues);
      });
    }

    // Vérifier cohérence accountMappings vs formSchema
    if (template.accountMappings) {
      Object.keys(template.accountMappings).forEach(fieldId => {
        let fieldExists = false;

        template.formSchema?.sections?.forEach((section: any) => {
          if (section.fields?.some((f: any) => f.id === fieldId)) {
            fieldExists = true;
          }
        });

        if (!fieldExists) {
          issues.push({
            severity: 'warning',
            template: template.documentType,
            field: fieldId,
            message: 'Account mapping exists but field not found in formSchema'
          });
        }
      });
    }
  });

  // Compter les issues par sévérité
  totalIssues = issues.length;
  totalErrors = issues.filter(i => i.severity === 'error').length;
  totalWarnings = issues.filter(i => i.severity === 'warning').length;

  // Afficher les résultats
  console.log('═'.repeat(80));
  console.log('📊 RÉSULTATS GLOBAUX');
  console.log('═'.repeat(80));
  console.log(`Total templates:        ${templates.length}`);
  console.log(`Total champs:           ${totalFields}`);
  console.log(`  ├─ Auto-fill:         ${totalMappedFields} (${(totalMappedFields / totalFields * 100).toFixed(1)}%)`);
  console.log(`  ├─ Formules:          ${totalFormulaFields} (${(totalFormulaFields / totalFields * 100).toFixed(1)}%)`);
  console.log(`  └─ Saisie manuelle:   ${totalManualFields} (${(totalManualFields / totalFields * 100).toFixed(1)}%)`);
  console.log();
  console.log(`Issues détectées:       ${totalIssues}`);
  console.log(`  ├─ Erreurs:           ${totalErrors}`);
  console.log(`  └─ Avertissements:    ${totalWarnings}`);

  // Statistiques par standard
  console.log('\n' + '═'.repeat(80));
  console.log('📈 STATISTIQUES PAR STANDARD COMPTABLE');
  console.log('═'.repeat(80));

  Object.entries(statsByStandard).forEach(([standard, stats]) => {
    console.log(`\n${standard}:`);
    console.log(`  Templates:           ${stats.templates}`);
    console.log(`  Champs totaux:       ${stats.fields}`);
    console.log(`  Auto-fill:           ${stats.mapped} (${(stats.mapped / stats.fields * 100).toFixed(1)}%)`);
    console.log(`  Formules:            ${stats.formula} (${(stats.formula / stats.fields * 100).toFixed(1)}%)`);
    console.log(`  Saisie manuelle:     ${stats.manual} (${(stats.manual / stats.fields * 100).toFixed(1)}%)`);
  });

  // Afficher les erreurs
  if (totalErrors > 0) {
    console.log('\n' + '═'.repeat(80));
    console.log('❌ ERREURS DÉTECTÉES');
    console.log('═'.repeat(80));

    issues
      .filter(i => i.severity === 'error')
      .forEach(issue => {
        console.log(`\n[${issue.template}] ${issue.field || 'N/A'}`);
        console.log(`   ${issue.message}`);
      });
  }

  // Afficher les avertissements (limité à 10)
  if (totalWarnings > 0) {
    console.log('\n' + '═'.repeat(80));
    console.log(`⚠️  AVERTISSEMENTS (${totalWarnings > 10 ? '10 premiers sur ' + totalWarnings : totalWarnings})`);
    console.log('═'.repeat(80));

    issues
      .filter(i => i.severity === 'warning')
      .slice(0, 10)
      .forEach(issue => {
        console.log(`\n[${issue.template}] ${issue.field || 'N/A'}`);
        console.log(`   ${issue.message}`);
      });

    if (totalWarnings > 10) {
      console.log(`\n... et ${totalWarnings - 10} autres avertissements`);
    }
  }

  // Tests par pays
  console.log('\n' + '═'.repeat(80));
  console.log('🌍 VÉRIFICATION PAR PAYS');
  console.log('═'.repeat(80));

  const testCountries = ['FR', 'SN', 'CI', 'CM', 'KE', 'NG', 'GH', 'ZA', 'DZ', 'TN', 'MA'];

  testCountries.forEach(countryCode => {
    const countryTemplates = getTemplatesByCountry(countryCode);
    const countryFields = countryTemplates.reduce((sum, t) => {
      const coverage = analyzeAccountMappingCoverage(t);
      return sum + coverage.totalFields;
    }, 0);
    const countryMapped = countryTemplates.reduce((sum, t) => {
      const coverage = analyzeAccountMappingCoverage(t);
      return sum + coverage.mappedFields;
    }, 0);

    console.log(`${countryCode}: ${countryTemplates.length} templates, ${countryFields} champs, ${countryMapped} auto-fill (${(countryMapped / countryFields * 100).toFixed(1)}%)`);
  });

  // Résumé final
  console.log('\n' + '═'.repeat(80));

  if (totalErrors === 0 && totalWarnings === 0) {
    console.log('✅ SYSTÈME AUTO-FILL VALIDÉ AVEC SUCCÈS');
    console.log('   Tous les templates sont correctement configurés!');
  } else if (totalErrors === 0) {
    console.log('✅ SYSTÈME AUTO-FILL VALIDÉ (avec avertissements)');
    console.log(`   ${totalWarnings} avertissements détectés (non bloquants)`);
  } else {
    console.log('❌ SYSTÈME AUTO-FILL INVALIDE');
    console.log(`   ${totalErrors} erreurs critiques détectées`);
  }

  console.log('═'.repeat(80) + '\n');

  // Exit code
  process.exit(totalErrors > 0 ? 1 : 0);
}

// Exécution
verifyAutofillSystem().catch(error => {
  console.error('\n💥 ERREUR FATALE:', error);
  process.exit(1);
});
