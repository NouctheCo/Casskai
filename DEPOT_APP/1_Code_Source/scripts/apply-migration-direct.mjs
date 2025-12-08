#!/usr/bin/env node

console.log('🚀 APPLICATION MIGRATION AUTOMATISATION - APPROCHE DIRECTE');
console.log('=' .repeat(60));

// Utilisons curl directement avec des commandes simples
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const SUPABASE_URL = 'https://smtdtgrymuzwvctattmx.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU3NjAyMywiZXhwIjoyMDcwMTUyMDIzfQ.lmr9l3Lr1AjP5b-iFNgYo_b4QOSqHTfJQxZr--vdFxA';

async function executeSQL(sql, description) {
  console.log(`\n📋 ${description}...`);

  const curlCommand = `curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" ` +
    `-H "Authorization: Bearer ${SERVICE_KEY}" ` +
    `-H "Content-Type: application/json" ` +
    `-d "{\\"sql\\": \\"${sql.replace(/"/g, '\\"')}\\"}"`;

  try {
    const { stdout, stderr } = await execAsync(curlCommand);

    if (stderr) {
      console.log(`⚠️ Warning: ${stderr}`);
    }

    if (stdout.includes('error') || stdout.includes('ERROR')) {
      console.log(`❌ Erreur SQL: ${stdout}`);
      return false;
    } else {
      console.log(`✅ Succès: ${description}`);
      return true;
    }
  } catch (error) {
    console.log(`❌ Erreur exec: ${error.message}`);
    return false;
  }
}

async function testTables() {
  console.log(`\n🧪 TEST DES TABLES...`);

  const tables = ['workflows', 'notifications', 'email_logs', 'email_configs'];
  let allGood = true;

  for (const table of tables) {
    const testCommand = `curl -s -X GET "${SUPABASE_URL}/rest/v1/${table}?limit=1" ` +
      `-H "Authorization: Bearer ${SERVICE_KEY}"`;

    try {
      const { stdout } = await execAsync(testCommand);

      if (stdout.includes('error') || stdout.includes('ERROR')) {
        console.log(`❌ Table ${table}: KO`);
        allGood = false;
      } else {
        console.log(`✅ Table ${table}: OK`);
      }
    } catch (error) {
      console.log(`❌ Table ${table}: ${error.message}`);
      allGood = false;
    }
  }

  return allGood;
}

async function main() {
  console.log('🔧 ÉTAPE 1: CRÉATION DES TABLES');

  // Table workflows (simplifiée)
  const workflowsSQL = 'CREATE TABLE IF NOT EXISTS workflows (' +
    'id uuid DEFAULT gen_random_uuid() PRIMARY KEY, ' +
    'company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE, ' +
    'name text NOT NULL, ' +
    'description text, ' +
    'is_active boolean DEFAULT true, ' +
    'trigger jsonb NOT NULL, ' +
    'actions jsonb NOT NULL, ' +
    'last_run timestamp with time zone, ' +
    'next_run timestamp with time zone, ' +
    'run_count integer DEFAULT 0, ' +
    'success_count integer DEFAULT 0, ' +
    'error_count integer DEFAULT 0, ' +
    'created_at timestamp with time zone DEFAULT now(), ' +
    'updated_at timestamp with time zone DEFAULT now())';

  await executeSQL(workflowsSQL, 'Création table workflows');

  // Table notifications
  const notificationsSQL = 'CREATE TABLE IF NOT EXISTS notifications (' +
    'id uuid DEFAULT gen_random_uuid() PRIMARY KEY, ' +
    'company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE, ' +
    'user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, ' +
    'title text NOT NULL, ' +
    'message text NOT NULL, ' +
    'type text NOT NULL DEFAULT \'info\', ' +
    'priority text NOT NULL DEFAULT \'medium\', ' +
    'category text NOT NULL DEFAULT \'system\', ' +
    'data jsonb, ' +
    'read boolean DEFAULT false, ' +
    'read_at timestamp with time zone, ' +
    'action_url text, ' +
    'action_label text, ' +
    'expires_at timestamp with time zone, ' +
    'created_at timestamp with time zone DEFAULT now(), ' +
    'updated_at timestamp with time zone DEFAULT now())';

  await executeSQL(notificationsSQL, 'Création table notifications');

  // Table email_logs
  const emailLogsSQL = 'CREATE TABLE IF NOT EXISTS email_logs (' +
    'id uuid DEFAULT gen_random_uuid() PRIMARY KEY, ' +
    'company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE, ' +
    'to_emails jsonb NOT NULL, ' +
    'subject text NOT NULL, ' +
    'status text NOT NULL, ' +
    'sent_at timestamp with time zone NOT NULL, ' +
    'created_at timestamp with time zone DEFAULT now())';

  await executeSQL(emailLogsSQL, 'Création table email_logs');

  // Table email_configs
  const emailConfigsSQL = 'CREATE TABLE IF NOT EXISTS email_configs (' +
    'id uuid DEFAULT gen_random_uuid() PRIMARY KEY, ' +
    'company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE, ' +
    'provider text NOT NULL DEFAULT \'resend\', ' +
    'from_email text NOT NULL, ' +
    'from_name text NOT NULL, ' +
    'is_active boolean DEFAULT true, ' +
    'created_at timestamp with time zone DEFAULT now(), ' +
    'updated_at timestamp with time zone DEFAULT now())';

  await executeSQL(emailConfigsSQL, 'Création table email_configs');

  console.log('\n🔧 ÉTAPE 2: CRÉATION DES INDEX');

  await executeSQL('CREATE INDEX IF NOT EXISTS idx_workflows_company_id ON workflows(company_id)', 'Index workflows');
  await executeSQL('CREATE INDEX IF NOT EXISTS idx_notifications_company_id ON notifications(company_id)', 'Index notifications');

  console.log('\n🔧 ÉTAPE 3: ACTIVATION ROW LEVEL SECURITY');

  await executeSQL('ALTER TABLE workflows ENABLE ROW LEVEL SECURITY', 'RLS workflows');
  await executeSQL('ALTER TABLE notifications ENABLE ROW LEVEL SECURITY', 'RLS notifications');

  console.log('\n🔧 ÉTAPE 4: POLITIQUES RLS BASIQUES');

  // Politique simplifiée pour workflows
  const workflowPolicy = 'DROP POLICY IF EXISTS \"workflows_company_policy\" ON workflows; ' +
    'CREATE POLICY \"workflows_company_policy\" ON workflows FOR ALL TO authenticated USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()))';

  await executeSQL(workflowPolicy, 'Politique RLS workflows');

  // Test final
  console.log('\n🔧 ÉTAPE 5: VÉRIFICATION FINALE');

  const allGood = await testTables();

  if (allGood) {
    console.log('\n🎉 MIGRATION RÉUSSIE !');
    console.log('Les modèles d\'automatisation sont maintenant utilisables.');
  } else {
    console.log('\n⚠️ MIGRATION PARTIELLE');
    console.log('Certaines tables peuvent nécessiter une intervention manuelle.');
  }

  console.log('\n🎯 MIGRATION TERMINÉE');
}

main().catch(console.error);