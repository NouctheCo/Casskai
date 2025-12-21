/**
 * Script de vérification des tables de suppression dans Supabase
 * Vérifie l'existence des tables account_deletion_requests et company_deletion_requests
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://smtdtgrymuzwvctattmx.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY non définie dans les variables d\'environnement');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkTables() {
  console.log('🔍 Vérification des tables de suppression Supabase...\n');

  try {
    // 1. Vérifier account_deletion_requests
    console.log('1️⃣  Vérification de account_deletion_requests...');
    const { data: accountDeleteData, error: accountDeleteError } = await supabase
      .from('account_deletion_requests')
      .select('count', { count: 'exact', head: true });

    if (accountDeleteError) {
      if (accountDeleteError.code === '42P01') {
        console.log('   ❌ Table account_deletion_requests NON CRÉÉE');
      } else {
        console.log(`   ❌ Erreur: ${accountDeleteError.message}`);
      }
    } else {
      console.log('   ✅ Table account_deletion_requests EXISTS');
      console.log(`   📊 Nombre d'entrées: ${accountDeleteData?.[0]?.count || 0}`);
    }

    // 2. Vérifier company_deletion_requests
    console.log('\n2️⃣  Vérification de company_deletion_requests...');
    const { data: companyDeleteData, error: companyDeleteError } = await supabase
      .from('company_deletion_requests')
      .select('count', { count: 'exact', head: true });

    if (companyDeleteError) {
      if (companyDeleteError.code === '42P01') {
        console.log('   ❌ Table company_deletion_requests NON CRÉÉE');
      } else {
        console.log(`   ❌ Erreur: ${companyDeleteError.message}`);
      }
    } else {
      console.log('   ✅ Table company_deletion_requests EXISTS');
      console.log(`   📊 Nombre d'entrées: ${companyDeleteData?.[0]?.count || 0}`);
    }

    // 3. Vérifier rgpd_logs
    console.log('\n3️⃣  Vérification de rgpd_logs...');
    const { data: rgpdLogsData, error: rgpdLogsError } = await supabase
      .from('rgpd_logs')
      .select('count', { count: 'exact', head: true });

    if (rgpdLogsError) {
      if (rgpdLogsError.code === '42P01') {
        console.log('   ❌ Table rgpd_logs NON CRÉÉE');
      } else {
        console.log(`   ❌ Erreur: ${rgpdLogsError.message}`);
      }
    } else {
      console.log('   ✅ Table rgpd_logs EXISTS');
      console.log(`   📊 Nombre d'entrées: ${rgpdLogsData?.[0]?.count || 0}`);
    }

    // 4. Vérifier company_deletion_approvals
    console.log('\n4️⃣  Vérification de company_deletion_approvals...');
    const { data: approvalData, error: approvalError } = await supabase
      .from('company_deletion_approvals')
      .select('count', { count: 'exact', head: true });

    if (approvalError) {
      if (approvalError.code === '42P01') {
        console.log('   ❌ Table company_deletion_approvals NON CRÉÉE');
      } else {
        console.log(`   ❌ Erreur: ${approvalError.message}`);
      }
    } else {
      console.log('   ✅ Table company_deletion_approvals EXISTS');
      console.log(`   📊 Nombre d'entrées: ${approvalData?.[0]?.count || 0}`);
    }

    // 5. Vérifier user_companies pour la structure
    console.log('\n5️⃣  Vérification de user_companies (structure)...');
    const { data: userCompaniesData, error: userCompaniesError } = await supabase
      .from('user_companies')
      .select('*', { count: 'exact', head: true })
      .limit(1);

    if (userCompaniesError && userCompaniesError.code !== '42P01') {
      console.log(`   ⚠️  Erreur: ${userCompaniesError.message}`);
    } else {
      console.log('   ✅ Table user_companies EXISTS');
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 RÉSUMÉ:');
    console.log('='.repeat(60));
    console.log('✅ account_deletion_requests:', accountDeleteError ? '❌ NON' : '✅ OUI');
    console.log('✅ company_deletion_requests:', companyDeleteError ? '❌ NON' : '✅ OUI');
    console.log('✅ rgpd_logs:', rgpdLogsError ? '❌ NON' : '✅ OUI');
    console.log('✅ company_deletion_approvals:', approvalError ? '❌ NON' : '✅ OUI');

  } catch (error) {
    console.error('💥 Erreur générale:', error);
    process.exit(1);
  }
}

checkTables();
