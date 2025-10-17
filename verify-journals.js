// Script de vérification des journaux comptables
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Vérification des journaux comptables CassKai\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function verifyJournals() {
  // 1. Vérifier les journaux requis
  console.log('1️⃣  VÉRIFICATION DES JOURNAUX REQUIS\n');

  const requiredJournals = ['VENTES', 'ACHATS', 'BANQUE'];
  const { data: journals, error: journalsError } = await supabase
    .from('journals')
    .select('id, code, name, type')
    .in('code', requiredJournals);

  if (journalsError) {
    console.error('❌ Erreur lors de la récupération des journaux:', journalsError.message);
    return;
  }

  console.log(`   Journaux trouvés: ${journals?.length || 0}/3\n`);

  requiredJournals.forEach(code => {
    const journal = journals?.find(j => j.code === code);
    if (journal) {
      console.log(`   ✅ ${code.padEnd(10)} - ${journal.name} (${journal.type})`);
    } else {
      console.log(`   ❌ ${code.padEnd(10)} - MANQUANT`);
    }
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 2. Vérifier tous les journaux
  console.log('2️⃣  TOUS LES JOURNAUX\n');

  const { data: allJournals, error: allError } = await supabase
    .from('journals')
    .select('id, code, name, type')
    .order('code');

  if (allError) {
    console.error('❌ Erreur:', allError.message);
  } else if (!allJournals || allJournals.length === 0) {
    console.log('   ⚠️  Aucun journal trouvé dans la base de données\n');
    console.log('   💡 Suggestion: Exécutez la migration pour créer les journaux par défaut');
  } else {
    console.log(`   Total: ${allJournals.length} journaux\n`);
    allJournals.forEach(j => {
      console.log(`   • ${j.code.padEnd(10)} - ${j.name} (${j.type})`);
    });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 3. Vérifier les templates d'écritures
  console.log('3️⃣  VÉRIFICATION DES TEMPLATES D\'ÉCRITURES\n');

  const { data: templates, error: templatesError } = await supabase
    .from('journal_entry_templates')
    .select('id, name, type')
    .order('type');

  if (templatesError) {
    console.error('❌ Erreur:', templatesError.message);
  } else if (!templates || templates.length === 0) {
    console.log('   ⚠️  Aucun template trouvé\n');
    console.log('   💡 Les templates permettent de créer automatiquement des écritures');
  } else {
    console.log(`   Total: ${templates.length} templates\n`);
    const byType = templates.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      return acc;
    }, {});
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   • ${type}: ${count} template(s)`);
    });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 4. Vérifier les écritures récentes
  console.log('4️⃣  ÉCRITURES COMPTABLES RÉCENTES\n');

  const { data: entries, error: entriesError } = await supabase
    .from('journal_entries')
    .select('id, date, reference, journal:journal_id(code), debit, credit')
    .order('date', { ascending: false })
    .limit(5);

  if (entriesError) {
    console.error('❌ Erreur:', entriesError.message);
  } else if (!entries || entries.length === 0) {
    console.log('   📋 Aucune écriture comptable pour le moment\n');
    console.log('   💡 Les écritures seront créées automatiquement lors de:');
    console.log('      - Création de factures');
    console.log('      - Enregistrement d\'achats');
    console.log('      - Transactions bancaires');
  } else {
    console.log(`   Dernières écritures (${entries.length}):\n`);
    entries.forEach(e => {
      const journalCode = e.journal?.code || 'N/A';
      console.log(`   • ${e.date} - ${e.reference} [${journalCode}] ${e.debit || e.credit}€`);
    });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 5. Test de création (simulation)
  console.log('5️⃣  TEST DE CRÉATION D\'ÉCRITURE (SIMULATION)\n');

  const ventesJournal = journals?.find(j => j.code === 'VENTES');

  if (!ventesJournal) {
    console.log('   ⚠️  Journal VENTES non trouvé - impossible de tester\n');
  } else {
    console.log('   ✅ Journal VENTES disponible\n');
    console.log('   📝 Exemple de création d\'écriture pour une facture:');
    console.log('      {');
    console.log(`        journal_id: "${ventesJournal.id}",`);
    console.log('        date: "2025-10-12",');
    console.log('        reference: "FA-2025-001",');
    console.log('        debit: 1200.00,');
    console.log('        credit: 0,');
    console.log('        account_number: "411",');
    console.log('        description: "Facture client XYZ"');
    console.log('      }');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 6. Recommandations
  console.log('6️⃣  RECOMMANDATIONS\n');

  const missingJournals = requiredJournals.filter(code =>
    !journals?.find(j => j.code === code)
  );

  if (missingJournals.length > 0) {
    console.log('   ⚠️  JOURNAUX MANQUANTS:\n');
    missingJournals.forEach(code => {
      console.log(`   ❌ ${code}`);
    });
    console.log('\n   📋 ACTION REQUISE:');
    console.log('      Exécutez la migration SQL pour créer les journaux par défaut:');
    console.log('      npx supabase db push\n');
  } else {
    console.log('   ✅ Tous les journaux requis sont présents\n');
  }

  if (!templates || templates.length === 0) {
    console.log('   💡 SUGGESTION:');
    console.log('      Créez des templates pour automatiser la création d\'écritures\n');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ Vérification terminée\n');
}

// Exécuter la vérification
verifyJournals().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
