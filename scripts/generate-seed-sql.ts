/**
 * CassKai - Générateur de migration SQL pour les templates réglementaires
 *
 * Ce script génère un fichier SQL avec tous les INSERT statements
 * pour les 79 templates réglementaires.
 *
 * Usage:
 *   npx tsx scripts/generate-seed-sql.ts
 *
 * Output:
 *   supabase/migrations/20260102000005_insert_all_templates.sql
 */

import { config } from 'dotenv';
import { writeFileSync } from 'fs';
import { generateAllRegulatoryTemplates, TEMPLATE_STATS } from '../src/constants/templates';

// Charger les variables d'environnement
config();

/**
 * Échappe les apostrophes pour SQL
 */
function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

/**
 * Convertit un objet JSON en string SQL
 */
function jsonToSql(obj: any): string {
  return escapeSql(JSON.stringify(obj));
}

/**
 * Génère le fichier SQL
 */
function generateSeedSql() {
  console.log('🚀 CassKai - Génération du fichier SQL de seeding\n');
  console.log('📊 Statistiques:');
  console.log(`   - Total templates: ${TEMPLATE_STATS.total}`);
  console.log(`   - Total pays: ${TEMPLATE_STATS.totalCountries}`);
  console.log(`   - France (PCG): ${TEMPLATE_STATS.france.count} templates`);
  console.log(`   - OHADA (SYSCOHADA): ${TEMPLATE_STATS.ohada.count} templates pour ${TEMPLATE_STATS.ohada.countries} pays`);
  console.log(`   - IFRS: ${TEMPLATE_STATS.ifrs.count} templates pour ${TEMPLATE_STATS.ifrs.countries} pays`);
  console.log(`   - Maghreb (SCF/PCM): ${TEMPLATE_STATS.maghreb.count} templates pour ${TEMPLATE_STATS.maghreb.countries} pays\n`);

  // Générer tous les templates
  console.log('⚙️  Génération des templates...');
  const templates = generateAllRegulatoryTemplates();
  console.log(`✓ ${templates.length} templates générés\n`);

  // Début du fichier SQL
  let sql = `/**
 * Migration: Insertion de tous les templates réglementaires
 * Date: ${new Date().toISOString().split('T')[0]}
 * Generated automatically by scripts/generate-seed-sql.ts
 *
 * 79 templates pour 25 pays:
 * - France (PCG): ${TEMPLATE_STATS.france.count} templates
 * - OHADA (SYSCOHADA): ${TEMPLATE_STATS.ohada.count} templates
 * - IFRS: ${TEMPLATE_STATS.ifrs.count} templates
 * - Maghreb (SCF/PCM): ${TEMPLATE_STATS.maghreb.count} templates
 */

BEGIN;

-- Nettoyage des templates existants (optionnel)
-- DELETE FROM regulatory_templates WHERE country_code IN ('FR', 'SN', 'CI', 'CM', 'KE', 'NG', 'GH', 'ZA', 'DZ', 'TN', 'MA', 'MULTI');

`;

  // Grouper par standard comptable
  const byStandard: Record<string, typeof templates> = {
    PCG: [],
    SYSCOHADA: [],
    IFRS: [],
    'SCF/PCM': []
  };

  templates.forEach(template => {
    const key = template.accountingStandard === 'SCF' || template.accountingStandard === 'PCM'
      ? 'SCF/PCM'
      : template.accountingStandard;
    byStandard[key].push(template);
  });

  // Générer les INSERT par standard
  Object.entries(byStandard).forEach(([standard, standardTemplates]) => {
    if (standardTemplates.length === 0) return;

    sql += `\n-- ========================================\n`;
    sql += `-- ${standard} (${standardTemplates.length} templates)\n`;
    sql += `-- ========================================\n\n`;

    standardTemplates.forEach(template => {
      sql += `-- ${template.documentType}: ${template.name}\n`;
      sql += `INSERT INTO regulatory_templates (\n`;
      sql += `  country_code,\n`;
      sql += `  accounting_standard,\n`;
      sql += `  document_type,\n`;
      sql += `  name,\n`;
      sql += `  description,\n`;
      sql += `  category,\n`;
      sql += `  frequency,\n`;
      sql += `  is_mandatory,\n`;
      sql += `  form_schema,\n`;
      sql += `  account_mappings,\n`;
      sql += `  validation_rules,\n`;
      sql += `  version,\n`;
      sql += `  is_active\n`;
      sql += `) VALUES (\n`;
      sql += `  '${template.countryCode}',\n`;
      sql += `  '${template.accountingStandard}',\n`;
      sql += `  '${template.documentType}',\n`;
      sql += `  '${escapeSql(template.name)}',\n`;
      sql += `  '${escapeSql(template.description)}',\n`;
      sql += `  '${template.category}',\n`;
      sql += `  '${template.frequency}',\n`;
      sql += `  ${template.isMandatory},\n`;
      sql += `  '${jsonToSql(template.formSchema)}'::jsonb,\n`;
      sql += `  '${jsonToSql(template.accountMappings || {})}'::jsonb,\n`;
      sql += `  '${jsonToSql(template.validationRules || {})}'::jsonb,\n`;
      sql += `  '1.0',\n`;
      sql += `  true\n`;
      sql += `);\n\n`;
    });
  });

  sql += `COMMIT;\n\n`;

  // Vérifications post-insertion
  sql += `-- Vérifications\n`;
  sql += `SELECT COUNT(*) as total_templates FROM regulatory_templates;\n\n`;
  sql += `SELECT country_code, COUNT(*) as count\n`;
  sql += `FROM regulatory_templates\n`;
  sql += `GROUP BY country_code\n`;
  sql += `ORDER BY country_code;\n\n`;
  sql += `SELECT accounting_standard, COUNT(*) as count\n`;
  sql += `FROM regulatory_templates\n`;
  sql += `GROUP BY accounting_standard;\n\n`;
  sql += `-- Devrait afficher:\n`;
  sql += `-- PCG: ${TEMPLATE_STATS.france.count}\n`;
  sql += `-- SYSCOHADA: ${TEMPLATE_STATS.ohada.count}\n`;
  sql += `-- IFRS: ${TEMPLATE_STATS.ifrs.count}\n`;
  sql += `-- SCF/PCM: ${TEMPLATE_STATS.maghreb.count}\n`;
  sql += `-- Total: ${TEMPLATE_STATS.total}\n`;

  // Écrire le fichier
  const outputPath = 'supabase/migrations/20260102000005_insert_all_templates.sql';
  console.log('📝 Écriture du fichier SQL...');
  writeFileSync(outputPath, sql, 'utf8');
  console.log(`✓ Fichier créé: ${outputPath}\n`);

  // Statistiques
  const fileSizeKB = Math.round(Buffer.byteLength(sql, 'utf8') / 1024);
  console.log('═'.repeat(80));
  console.log('📊 RÉSUMÉ');
  console.log('═'.repeat(80));
  console.log(`Fichier: ${outputPath}`);
  console.log(`Taille: ${fileSizeKB} KB`);
  console.log(`Templates: ${templates.length}`);
  console.log(`INSERT statements: ${templates.length}`);
  console.log();
  console.log('✅ Fichier SQL généré avec succès!');
  console.log();
  console.log('📋 Prochaine étape:');
  console.log('   1. Vérifier le fichier généré');
  console.log('   2. Appliquer la migration: supabase db push');
  console.log('   OU');
  console.log('   3. Exécuter via Supabase Dashboard > SQL Editor');
  console.log('═'.repeat(80) + '\n');
}

// Exécution
try {
  generateSeedSql();
  process.exit(0);
} catch (error) {
  console.error('\n💥 ERREUR FATALE:', error);
  process.exit(1);
}
