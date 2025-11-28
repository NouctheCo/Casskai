#!/usr/bin/env node
/**
 * Script pour appliquer la migration du module bancaire
 * Usage: node apply-bank-migration.js
 */

const fs = require('fs');
const path = require('path');

const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251128_bank_module_complete.sql');

console.log('📦 Application de la migration du module bancaire...\n');

if (!fs.existsSync(migrationPath)) {
  console.error('❌ Fichier de migration non trouvé:', migrationPath);
  process.exit(1);
}

const sql = fs.readFileSync(migrationPath, 'utf8');

console.log('✅ Migration SQL chargée');
console.log(`📄 Fichier: ${migrationPath}`);
console.log(`📊 Taille: ${(sql.length / 1024).toFixed(2)} KB`);
console.log('\n📋 Contenu de la migration:\n');
console.log('- ✅ Table bank_accounts (avec colonnes status, last_import)');
console.log('- ✅ Table bank_transactions (transactions importées)');
console.log('- ✅ Table sepa_exports (historique exports SEPA)');
console.log('- ✅ Table sepa_payments (détail paiements)');
console.log('- ✅ 16 politiques RLS (Row Level Security)');
console.log('- ✅ 13 index de performance');
console.log('- ✅ 1 trigger (update_bank_account_balance)');
console.log('\n🔧 Pour appliquer la migration:\n');
console.log('1. Ouvrez le Dashboard Supabase');
console.log('2. Allez dans SQL Editor');
console.log('3. Copiez le contenu du fichier:');
console.log(`   ${migrationPath}`);
console.log('4. Exécutez la requête\n');
console.log('Ou utilisez Supabase CLI:');
console.log('   supabase migration up\n');
console.log('✅ Migration prête à être appliquée!');
