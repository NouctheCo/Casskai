#!/usr/bin/env node
/**
 * Script pour appliquer la migration finale du module bancaire SEPA
 * Usage: node apply-bank-sepa-migration.js
 */

const fs = require('fs');
const path = require('path');

const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251128_bank_module_FINAL.sql');

console.log('Module Bancaire - Migration SEPA\n');
console.log('===============================================================\n');

// Verifier que le fichier existe
if (!fs.existsSync(migrationPath)) {
  console.error('Erreur: Fichier de migration non trouve:', migrationPath);
  process.exit(1);
}

const sql = fs.readFileSync(migrationPath, 'utf8');

console.log('Migration SQL chargee');
console.log('Fichier:', path.basename(migrationPath));
console.log('Taille:', (sql.length / 1024).toFixed(2), 'KB\n');

console.log('Contenu de la migration:\n');
console.log('   Tables a creer:');
console.log('   - sepa_exports (historique exports SEPA XML)');
console.log('   - sepa_payments (detail paiements)\n');
console.log('   Securite:');
console.log('   - 6 politiques RLS (Row Level Security)');
console.log('   - 7 index de performance\n');

console.log('===============================================================\n');
console.log('INSTRUCTIONS D\'APPLICATION:\n');
console.log('Methode 1 - Supabase Dashboard (RECOMMANDEE):');
console.log('   1. Ouvrez https://app.supabase.com');
console.log('   2. Selectionnez votre projet CassKai');
console.log('   3. Allez dans SQL Editor (panneau gauche)');
console.log('   4. Cliquez sur "+ New query"');
console.log('   5. Copiez-collez le contenu du fichier:');
console.log('     ', migrationPath);
console.log('   6. Cliquez sur "Run" (ou Ctrl+Enter)\n');

console.log('Methode 2 - Supabase CLI:');
console.log('   supabase migration up\n');

console.log('===============================================================\n');
console.log('REQUETES DE VERIFICATION POST-MIGRATION:\n');

const verifyQueries = `-- 1. Verifier que les tables ont ete creees
SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('sepa_exports', 'sepa_payments')
ORDER BY table_name;

-- 2. Verifier les politiques RLS
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('sepa_exports', 'sepa_payments')
ORDER BY tablename, policyname;

-- 3. Verifier les index
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('sepa_exports', 'sepa_payments')
ORDER BY tablename, indexname;

-- 4. Test d'insertion (necessite un company_id et bank_account_id valides)
-- REMPLACEZ les UUID par vos valeurs reelles
/*
INSERT INTO sepa_exports (
  company_id,
  bank_account_id,
  file_name,
  message_id,
  execution_date,
  nb_of_transactions,
  total_amount
) VALUES (
  'VOTRE_COMPANY_ID'::uuid,
  'VOTRE_BANK_ACCOUNT_ID'::uuid,
  'TEST-SEPA-001.xml',
  'MSG-TEST-001',
  CURRENT_DATE,
  1,
  100.00
) RETURNING id, file_name, status;
*/`;

console.log(verifyQueries);
console.log('\n===============================================================\n');
console.log('Le SQL complet est disponible dans:');
console.log('  ', migrationPath, '\n');
console.log('Une fois appliquee, votre module bancaire sera operationnel!\n');

// Sauvegarder les requetes de verification dans un fichier separe
const verifyPath = path.join(__dirname, 'verify-bank-migration.sql');
fs.writeFileSync(verifyPath, verifyQueries, 'utf8');
console.log('Requetes de verification sauvegardees dans:', verifyPath, '\n');
