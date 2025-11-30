/**
 * Script pour vérifier les tables d'audit
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://smtdtgrymuzwvctattmx.supabase.co',
  process.env.VITE_TEST_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAuditTables() {
  console.log('🔍 Vérification de la table audit_logs...\n');

  // 1. Compter les logs
  const { count, error: countError } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Erreur count:', countError.message);
  } else {
    console.log('✅ Total logs dans audit_logs:', count);
  }

  // 2. Récupérer quelques logs
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .limit(5);

  if (error) {
    console.error('❌ Erreur select:', error.message);
  } else {
    console.log('✅ Logs récupérés:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('\n📋 Exemple de log:');
      console.log(JSON.stringify(data[0], null, 2));
    }
  }

  // 3. Vérifier les autres tables mentionnées
  console.log('\n\n🔍 Vérification des autres tables...\n');

  const tables = ['user_activity_log', 'usage_tracking', 'user_activity_logs'];

  for (const table of tables) {
    const { count: c, error: e } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (e) {
      console.log(`❌ Table '${table}' n'existe pas ou erreur:`, e.message);
    } else {
      console.log(`✅ Table '${table}' existe avec ${c} enregistrements`);

      // Récupérer un exemple
      const { data: sample } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (sample && sample.length > 0) {
        console.log(`   Colonnes: ${Object.keys(sample[0]).join(', ')}`);
      }
    }
  }

  // 4. Vérifier les RLS policies sur audit_logs
  console.log('\n\n🔒 Vérification des RLS policies...\n');

  const { data: policies, error: policiesError } = await supabase
    .rpc('exec', {
      sql: `
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
        FROM pg_policies
        WHERE tablename = 'audit_logs';
      `
    });

  if (policiesError) {
    console.log('⚠️  Impossible de vérifier les policies RLS (méthode alternative nécessaire)');
  } else if (policies) {
    console.log('✅ Policies RLS trouvées:', policies.length);
  }
}

checkAuditTables().catch(console.error);
