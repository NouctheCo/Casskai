/**
 * CassKai - Script de seeding des templates réglementaires
 *
 * Ce script peuple la table regulatory_templates avec tous les templates (79 documents)
 * pour les 25 pays supportés par CassKai.
 *
 * Usage:
 *   npx tsx scripts/seed-regulatory-templates.ts
 *
 * Prérequis:
 *   - Variables d'environnement: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY ou SUPABASE_SERVICE_KEY
 *   - Package tsx installé: npm install -D tsx
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { generateAllRegulatoryTemplates, TEMPLATE_STATS } from '../src/constants/templates';

// Charger les variables d'environnement
config();

// Configuration Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Erreur: Variables d\'environnement manquantes');
  console.error('   Requis: VITE_SUPABASE_URL et (SUPABASE_SERVICE_KEY ou VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Fonction principale de seeding
 */
async function seedRegulatoryTemplates() {
  console.log('🚀 CassKai - Seeding des templates réglementaires\n');
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

  // Vérifier la connexion Supabase
  console.log('🔌 Vérification connexion Supabase...');
  const { data: healthCheck, error: healthError } = await supabase
    .from('regulatory_templates')
    .select('count')
    .limit(1);

  if (healthError) {
    console.error('❌ Erreur connexion Supabase:', healthError.message);
    process.exit(1);
  }
  console.log('✓ Connexion établie\n');

  // Nettoyer les templates existants (optionnel)
  console.log('🧹 Nettoyage des templates existants...');
  const { error: deleteError } = await supabase
    .from('regulatory_templates')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (deleteError) {
    console.warn('⚠️  Avertissement lors du nettoyage:', deleteError.message);
  } else {
    console.log('✓ Templates existants supprimés\n');
  }

  // Insertion des templates par batch
  console.log('📝 Insertion des templates...\n');

  const BATCH_SIZE = 10;
  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ template: string; error: string }> = [];

  for (let i = 0; i < templates.length; i += BATCH_SIZE) {
    const batch = templates.slice(i, i + BATCH_SIZE);

    for (const template of batch) {
      const { error } = await supabase
        .from('regulatory_templates')
        .insert({
          country_code: template.countryCode,
          accounting_standard: template.accountingStandard,
          document_type: template.documentType,
          name: template.name,
          description: template.description,
          category: template.category,
          frequency: template.frequency,
          is_mandatory: template.isMandatory,
          form_schema: template.formSchema,
          account_mappings: template.accountMappings,
          validation_rules: template.validationRules
        });

      if (error) {
        errorCount++;
        errors.push({ template: template.documentType, error: error.message });
        console.error(`   ❌ ${template.documentType}: ${error.message}`);
      } else {
        successCount++;
        console.log(`   ✓ ${template.documentType.padEnd(25)} - ${template.name}`);
      }
    }
  }

  // Résumé
  console.log('\n' + '═'.repeat(80));
  console.log('📈 RÉSUMÉ DU SEEDING');
  console.log('═'.repeat(80));
  console.log(`✅ Succès: ${successCount}/${templates.length} templates`);
  console.log(`❌ Erreurs: ${errorCount}/${templates.length} templates`);

  if (errors.length > 0) {
    console.log('\n⚠️  DÉTAILS DES ERREURS:');
    errors.forEach(({ template, error }) => {
      console.log(`   - ${template}: ${error}`);
    });
  }

  // Vérification post-insertion
  console.log('\n🔍 Vérification des données insérées...');
  const { data: stats, error: statsError } = await supabase
    .from('regulatory_templates')
    .select('country_code, accounting_standard, category')
    .order('country_code');

  if (statsError) {
    console.error('❌ Erreur lors de la vérification:', statsError.message);
  } else {
    // Compter par pays
    const byCountry: Record<string, number> = {};
    stats?.forEach(row => {
      byCountry[row.country_code] = (byCountry[row.country_code] || 0) + 1;
    });

    console.log('\n📊 Templates par pays:');
    Object.entries(byCountry)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([country, count]) => {
        console.log(`   ${country}: ${count} templates`);
      });

    // Compter par standard
    const byStandard: Record<string, number> = {};
    stats?.forEach(row => {
      byStandard[row.accounting_standard] = (byStandard[row.accounting_standard] || 0) + 1;
    });

    console.log('\n📊 Templates par standard comptable:');
    Object.entries(byStandard).forEach(([standard, count]) => {
      console.log(`   ${standard}: ${count} templates`);
    });
  }

  console.log('\n' + '═'.repeat(80));
  console.log(successCount === templates.length ? '✅ SEEDING TERMINÉ AVEC SUCCÈS!' : '⚠️  SEEDING TERMINÉ AVEC DES ERREURS');
  console.log('═'.repeat(80) + '\n');

  process.exit(errorCount > 0 ? 1 : 0);
}

// Exécution
seedRegulatoryTemplates().catch(error => {
  console.error('\n💥 ERREUR FATALE:', error);
  process.exit(1);
});
