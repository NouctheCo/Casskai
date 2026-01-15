/**
 * CassKai - Vérification des templates réglementaires en DB
 *
 * Objectif:
 *  - S'assurer que la table regulatory_templates contient bien les templates attendus
 *  - Détecter rapidement les pays/types manquants avant de lancer des exports
 *
 * Usage:
 *   npx tsx scripts/verify-regulatory-templates.ts
 *   npx tsx scripts/verify-regulatory-templates.ts --countries=FR,SN
 *
 * Prérequis:
 *   - Variables d'environnement: VITE_SUPABASE_URL, et (SUPABASE_SERVICE_KEY ou VITE_SUPABASE_ANON_KEY)
 */

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { generateAllRegulatoryTemplates } from '../src/constants/templates';

// Charger les variables d'environnement (.env.local prioritaire)
if (existsSync('.env.local')) {
  config({ path: '.env.local' });
}
if (existsSync('.env')) {
  config({ path: '.env' });
}

type VerifyOptions = {
  countries?: string[];
};

function parseArgs(argv: string[]): VerifyOptions {
  const options: VerifyOptions = {};

  for (const arg of argv) {
    if (arg.startsWith('--countries=')) {
      const raw = arg.slice('--countries='.length);
      const countries = raw
        .split(',')
        .map(s => s.trim().toUpperCase())
        .filter(Boolean);
      options.countries = countries.length ? countries : undefined;
    }
  }

  return options;
}

const options = parseArgs(process.argv.slice(2));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Erreur: Variables d'environnement manquantes");
  console.error('   Requis: VITE_SUPABASE_URL et (SUPABASE_SERVICE_KEY ou VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function keyOf(row: { document_type: string; country_code: string; accounting_standard: string; version: string }) {
  return `${row.document_type}|${row.country_code}|${row.accounting_standard}|${row.version}`;
}

async function main() {
  console.log('🔎 CassKai - Vérification regulatory_templates\n');

  let expected = generateAllRegulatoryTemplates();
  if (options.countries?.length) {
    expected = expected.filter(t => options.countries?.includes(t.countryCode));
  }

  const expectedKeys = new Set(
    expected.map(t => `${t.documentType}|${t.countryCode}|${t.accountingStandard}|${t.version ?? '1.0'}`)
  );

  const { data, error } = await supabase
    .from('regulatory_templates')
    .select('document_type,country_code,accounting_standard,version,is_active')
    .order('country_code')
    .limit(5000);

  if (error) {
    console.error('❌ Erreur lecture DB:', error.message);
    process.exit(1);
  }

  const rows = (data ?? []) as Array<{
    document_type: string;
    country_code: string;
    accounting_standard: string;
    version: string;
    is_active: boolean;
  }>;

  const filteredRows = options.countries?.length
    ? rows.filter(r => options.countries?.includes(r.country_code))
    : rows;

  const foundKeys = new Set(filteredRows.map(r => keyOf(r)));

  const missing: string[] = [];
  for (const k of expectedKeys) {
    if (!foundKeys.has(k)) missing.push(k);
  }

  const inactiveExpected: string[] = [];
  for (const r of filteredRows) {
    const k = keyOf(r);
    if (expectedKeys.has(k) && r.is_active === false) inactiveExpected.push(k);
  }

  console.log(`📦 Attendus (code): ${expectedKeys.size}`);
  console.log(`🗄️  Présents (DB):   ${foundKeys.size}`);

  if (missing.length) {
    console.log(`\n❌ Manquants: ${missing.length}`);
    missing.slice(0, 50).forEach(k => console.log(`   - ${k}`));
    if (missing.length > 50) console.log(`   ... +${missing.length - 50} autres`);
  }

  if (inactiveExpected.length) {
    console.log(`\n⚠️  Présents mais inactifs (is_active=false): ${inactiveExpected.length}`);
    inactiveExpected.slice(0, 50).forEach(k => console.log(`   - ${k}`));
    if (inactiveExpected.length > 50) console.log(`   ... +${inactiveExpected.length - 50} autres`);
  }

  if (!missing.length) {
    console.log('\n✅ OK: templates requis présents en DB.');
  } else {
    console.log('\n🛠️  Fix: lancez le seeding: npm run seed:templates');
    process.exit(2);
  }
}

main().catch(err => {
  console.error('\n💥 ERREUR FATALE:', err);
  process.exit(1);
});
