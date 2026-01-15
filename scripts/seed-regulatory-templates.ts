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
import { existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { generateAllRegulatoryTemplates, TEMPLATE_STATS } from '../src/constants/templates';

// Charger les variables d'environnement (.env.local prioritaire)
if (existsSync('.env.local')) {
  config({ path: '.env.local' });
}
if (existsSync('.env')) {
  config({ path: '.env' });
}

type SeedOptions = {
  wipe: boolean;
  countries?: string[];
};

function parseArgs(argv: string[]): SeedOptions {
  const options: SeedOptions = { wipe: false };

  for (const arg of argv) {
    if (arg === '--wipe') {
      options.wipe = true;
      continue;
    }

    if (arg.startsWith('--countries=')) {
      const raw = arg.slice('--countries='.length);
      const countries = raw
        .split(',')
        .map(s => s.trim().toUpperCase())
        .filter(Boolean);
      options.countries = countries.length ? countries : undefined;
      continue;
    }
  }

  return options;
}

const options = parseArgs(process.argv.slice(2));

// Configuration Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_KEY = SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

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
  let templates = generateAllRegulatoryTemplates();
  if (options.countries?.length) {
    templates = templates.filter(t => options.countries?.includes(t.countryCode));
  }
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
  if (options.wipe) {
    if (!SUPABASE_SERVICE_KEY) {
      console.error('❌ Refus de wipe: SUPABASE_SERVICE_KEY manquant.');
      console.error('   Le wipe est destructif et nécessite la service key.');
      process.exit(1);
    }

    console.log('🧹 Nettoyage des templates existants (wipe)...');
    let deleteQuery = supabase.from('regulatory_templates').delete();
    if (options.countries?.length) {
      deleteQuery = deleteQuery.in('country_code', options.countries);
    } else {
      deleteQuery = deleteQuery.neq('id', '00000000-0000-0000-0000-000000000000');
    }

    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      console.warn('⚠️  Avertissement lors du nettoyage:', deleteError.message);
    } else {
      console.log('✓ Templates existants supprimés\n');
    }
  } else {
    console.log('ℹ️  Mode non-destructif: upsert uniquement (pas de wipe).');
    console.log('   Astuce: ajoutez --wipe (service key requise) si vous voulez repartir à zéro.\n');
  }

  // Upsert des templates par batch
  console.log('📝 Upsert des templates...\n');

  const BATCH_SIZE = 50;
  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ batchStart: number; error: string }> = [];

  const records = templates.map(template => ({
    country_code: template.countryCode,
    accounting_standard: template.accountingStandard,
    document_type: template.documentType,
    name: template.name,
    description: template.description,
    category: template.category,
    frequency: template.frequency ?? 'ANNUAL',
    is_mandatory: template.isMandatory ?? true,
    form_schema: template.formSchema,
    account_mappings: template.accountMappings ?? null,
    validation_rules: template.validationRules ?? null,
    calculation_rules: template.calculationRules ?? null,
    version: template.version ?? '1.0',
    is_active: template.isActive ?? true
  }));

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('regulatory_templates')
      .upsert(batch, { onConflict: 'document_type,country_code,accounting_standard,version' });

    if (error) {
      errorCount += batch.length;
      errors.push({ batchStart: i, error: error.message });
      console.error(`   ❌ Batch ${i}-${i + batch.length - 1}: ${error.message}`);
    } else {
      successCount += batch.length;
      console.log(`   ✓ Batch ${i}-${i + batch.length - 1} OK`);
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
    errors.forEach(({ batchStart, error }) => {
      console.log(`   - Batch starting at ${batchStart}: ${error}`);
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
