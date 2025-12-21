/**
 * CassKai - Diagnostic de connectivité Supabase
 * Test de l'interconnexion Frontend <-> Supabase pour les modules critiques
 */

import { supabase } from './src/lib/supabase';

interface DiagnosticResult {
  module: string;
  table: string;
  canRead: boolean;
  canWrite: boolean;
  recordCount: number;
  error?: string;
}

const results: DiagnosticResult[] = [];

/**
 * Test de lecture/écriture pour une table
 */
async function testTable(
  module: string,
  table: string,
  sampleData: Record<string, any>
): Promise<DiagnosticResult> {
  const result: DiagnosticResult = {
    module,
    table,
    canRead: false,
    canWrite: false,
    recordCount: 0
  };

  try {
    // Test READ
    const { data: readData, error: readError, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (readError) {
      result.error = `Read error: ${readError.message}`;
      return result;
    }

    result.canRead = true;
    result.recordCount = count || 0;

    // Test WRITE (insert puis delete immédiatement)
    const { data: insertData, error: insertError } = await supabase
      .from(table)
      .insert(sampleData)
      .select()
      .single();

    if (insertError) {
      result.error = `Write error: ${insertError.message}`;
      return result;
    }

    result.canWrite = true;

    // Cleanup - supprimer le test record
    if (insertData && insertData.id) {
      await supabase.from(table).delete().eq('id', insertData.id);
    }

  } catch (error) {
    result.error = `Exception: ${error instanceof Error ? error.message : String(error)}`;
  }

  return result;
}

/**
 * Fonction principale de diagnostic
 */
async function runDiagnostic() {
  console.log('🔍 Diagnostic de connectivité Supabase CassKai\n');
  console.log('=' .repeat(80));

  // Récupérer l'utilisateur et la première company
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    console.error('❌ Utilisateur non authentifié');
    return;
  }

  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .eq('owner_id', userData.user.id)
    .limit(1);

  if (!companies || companies.length === 0) {
    console.error('❌ Aucune entreprise trouvée pour cet utilisateur');
    return;
  }

  const companyId = companies[0].id;
  const companyName = companies[0].name;

  console.log(`✅ Utilisateur: ${userData.user.email}`);
  console.log(`✅ Entreprise: ${companyName} (${companyId})\n`);

  // =====================================================================
  // MODULE 1: COMPTABILITÉ (Accounting)
  // =====================================================================
  console.log('\n📊 MODULE COMPTABILITÉ');
  console.log('-'.repeat(80));

  // Test journal_entries
  results.push(await testTable(
    'Accounting',
    'journal_entries',
    {
      company_id: companyId,
      entry_date: new Date().toISOString().split('T')[0],
      entry_number: 'TEST-DIAG-001',
      description: 'Test diagnostic',
      status: 'draft'
    }
  ));

  // Test journal_entry_lines
  const { data: testEntry } = await supabase
    .from('journal_entries')
    .select('id')
    .eq('company_id', companyId)
    .limit(1)
    .single();

  const { data: testAccount } = await supabase
    .from('chart_of_accounts')
    .select('id')
    .eq('company_id', companyId)
    .limit(1)
    .single();

  if (testEntry && testAccount) {
    results.push(await testTable(
      'Accounting',
      'journal_entry_lines',
      {
        journal_entry_id: testEntry.id,
        account_id: testAccount.id,
        debit_amount: 100.00,
        credit_amount: 0,
        description: 'Test line'
      }
    ));
  }

  // Test chart_of_accounts
  results.push(await testTable(
    'Accounting',
    'chart_of_accounts',
    {
      company_id: companyId,
      account_number: '999999',
      account_name: 'Test Account',
      account_type: 'asset',
      account_class: 9,
      is_active: true
    }
  ));

  // Test journals
  results.push(await testTable(
    'Accounting',
    'journals',
    {
      company_id: companyId,
      code: 'TEST',
      name: 'Test Journal',
      type: 'general',
      is_active: true
    }
  ));

  // =====================================================================
  // MODULE 2: FACTURATION (Invoicing)
  // =====================================================================
  console.log('\n💰 MODULE FACTURATION');
  console.log('-'.repeat(80));

  // Test invoices
  results.push(await testTable(
    'Invoicing',
    'invoices',
    {
      company_id: companyId,
      invoice_number: 'TEST-INV-001',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date().toISOString().split('T')[0],
      status: 'draft',
      currency: 'EUR',
      total_amount: 0,
      total_ht: 0,
      total_ttc: 0,
      total_tva: 0
    }
  ));

  // =====================================================================
  // MODULE 3: CRM
  // =====================================================================
  console.log('\n👥 MODULE CRM');
  console.log('-'.repeat(80));

  // Test clients
  results.push(await testTable(
    'CRM',
    'clients',
    {
      company_id: companyId,
      name: 'Test Client',
      email: 'test@example.com',
      client_type: 'company',
      is_active: true
    }
  ));

  // Test contacts
  const { data: testClient } = await supabase
    .from('clients')
    .select('id')
    .eq('company_id', companyId)
    .limit(1)
    .single();

  if (testClient) {
    results.push(await testTable(
      'CRM',
      'contacts',
      {
        client_id: testClient.id,
        first_name: 'Test',
        last_name: 'Contact',
        email: 'test.contact@example.com'
      }
    ));
  }

  // =====================================================================
  // MODULE 4: RH (HR)
  // =====================================================================
  console.log('\n👔 MODULE RESSOURCES HUMAINES');
  console.log('-'.repeat(80));

  // Test employees
  results.push(await testTable(
    'HR',
    'employees',
    {
      company_id: companyId,
      first_name: 'Test',
      last_name: 'Employee',
      email: 'test.employee@example.com',
      employment_status: 'active'
    }
  ));

  // =====================================================================
  // MODULE 5: ACHATS (Purchases)
  // =====================================================================
  console.log('\n🛒 MODULE ACHATS');
  console.log('-'.repeat(80));

  // Test purchases
  results.push(await testTable(
    'Purchases',
    'purchases',
    {
      company_id: companyId,
      purchase_number: 'TEST-PUR-001',
      purchase_date: new Date().toISOString().split('T')[0],
      status: 'draft',
      total_amount: 0,
      currency: 'EUR'
    }
  ));

  // =====================================================================
  // MODULE 6: PROJETS (Projects)
  // =====================================================================
  console.log('\n📁 MODULE PROJETS');
  console.log('-'.repeat(80));

  // Test projects
  results.push(await testTable(
    'Projects',
    'projects',
    {
      company_id: companyId,
      name: 'Test Project',
      status: 'active',
      start_date: new Date().toISOString().split('T')[0]
    }
  ));

  // =====================================================================
  // MODULE 7: AUDIT LOGS
  // =====================================================================
  console.log('\n🔒 MODULE AUDIT LOGS');
  console.log('-'.repeat(80));

  // Test audit_logs
  results.push(await testTable(
    'Audit',
    'audit_logs',
    {
      event_type: 'CREATE',
      table_name: 'test_table',
      company_id: companyId,
      user_id: userData.user.id,
      security_level: 'standard',
      event_timestamp: new Date().toISOString()
    }
  ));

  // =====================================================================
  // AFFICHAGE DES RÉSULTATS
  // =====================================================================
  console.log('\n\n📋 RÉSULTATS DU DIAGNOSTIC');
  console.log('='.repeat(80));
  console.log(`${'Module'.padEnd(20)} ${'Table'.padEnd(30)} ${'Read'.padEnd(8)} ${'Write'.padEnd(8)} ${'Count'.padEnd(10)}`);
  console.log('-'.repeat(80));

  let totalTables = 0;
  let readableCount = 0;
  let writableCount = 0;
  let errorCount = 0;

  for (const result of results) {
    totalTables++;
    if (result.canRead) readableCount++;
    if (result.canWrite) writableCount++;
    if (result.error) errorCount++;

    const readStatus = result.canRead ? '✅ OK' : '❌ ERR';
    const writeStatus = result.canWrite ? '✅ OK' : '❌ ERR';

    console.log(
      `${result.module.padEnd(20)} ${result.table.padEnd(30)} ${readStatus.padEnd(8)} ${writeStatus.padEnd(8)} ${result.recordCount.toString().padEnd(10)}`
    );

    if (result.error) {
      console.log(`  ⚠️  ${result.error}`);
    }
  }

  console.log('-'.repeat(80));
  console.log(`\n📊 STATISTIQUES:`);
  console.log(`   Total tables testées: ${totalTables}`);
  console.log(`   ✅ Lecture OK: ${readableCount}/${totalTables} (${Math.round(readableCount/totalTables*100)}%)`);
  console.log(`   ✅ Écriture OK: ${writableCount}/${totalTables} (${Math.round(writableCount/totalTables*100)}%)`);
  console.log(`   ❌ Erreurs: ${errorCount}`);

  if (readableCount === totalTables && writableCount === totalTables) {
    console.log(`\n✅ ✨ TOUS LES MODULES SONT OPÉRATIONNELS! ✨`);
  } else if (errorCount > 0) {
    console.log(`\n⚠️  ATTENTION: Certains modules ont des erreurs de connectivité`);
  }

  console.log('\n' + '='.repeat(80));
}

// Exécuter le diagnostic
runDiagnostic().catch(error => {
  console.error('❌ Erreur fatale durant le diagnostic:', error);
  process.exit(1);
});
