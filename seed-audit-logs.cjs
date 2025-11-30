/**
 * Script pour créer des logs d'audit de test
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://smtdtgrymuzwvctattmx.supabase.co',
  process.env.VITE_TEST_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedAuditLogs() {
  console.log('🌱 Création de logs d\'audit de test...\n');

  // 1. Récupérer une company et un user
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .limit(1);

  const { data: { users } } = await supabase.auth.admin.listUsers();

  if (!companies || companies.length === 0) {
    console.error('❌ Aucune entreprise trouvée');
    return;
  }

  if (!users || users.length === 0) {
    console.error('❌ Aucun utilisateur trouvé');
    return;
  }

  const companyId = companies[0].id;
  const companyName = companies[0].name;
  const userId = users[0].id;
  const userEmail = users[0].email;

  console.log(`✅ Entreprise: ${companyName} (${companyId})`);
  console.log(`✅ Utilisateur: ${userEmail} (${userId})\n`);

  // 2. Créer des logs variés
  const testLogs = [
    {
      event_type: 'LOGIN',
      company_id: companyId,
      user_id: userId,
      user_email: userEmail,
      security_level: 'standard',
      compliance_tags: ['RGPD'],
      is_sensitive: false,
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0',
      event_timestamp: new Date(Date.now() - 3600000).toISOString() // Il y a 1h
    },
    {
      event_type: 'CREATE',
      table_name: 'invoices',
      record_id: 'test-invoice-001',
      company_id: companyId,
      user_id: userId,
      user_email: userEmail,
      new_values: { invoice_number: 'INV-2025-001', amount: 1500, status: 'draft' },
      changed_fields: ['invoice_number', 'amount', 'status'],
      security_level: 'standard',
      compliance_tags: [],
      is_sensitive: false,
      ip_address: '192.168.1.100',
      event_timestamp: new Date(Date.now() - 1800000).toISOString() // Il y a 30min
    },
    {
      event_type: 'UPDATE',
      table_name: 'invoices',
      record_id: 'test-invoice-001',
      company_id: companyId,
      user_id: userId,
      user_email: userEmail,
      old_values: { status: 'draft' },
      new_values: { status: 'sent' },
      changed_fields: ['status'],
      security_level: 'standard',
      compliance_tags: [],
      is_sensitive: false,
      ip_address: '192.168.1.100',
      event_timestamp: new Date(Date.now() - 900000).toISOString() // Il y a 15min
    },
    {
      event_type: 'EXPORT_PDF',
      table_name: 'invoices',
      record_id: 'test-invoice-001',
      company_id: companyId,
      user_id: userId,
      user_email: userEmail,
      security_level: 'high',
      compliance_tags: ['RGPD', 'SOC2'],
      is_sensitive: true,
      ip_address: '192.168.1.100',
      event_timestamp: new Date(Date.now() - 300000).toISOString() // Il y a 5min
    },
    {
      event_type: 'DELETE',
      table_name: 'quotes',
      record_id: 'test-quote-001',
      company_id: companyId,
      user_id: userId,
      user_email: userEmail,
      old_values: { quote_number: 'DEV-2025-001', amount: 800, status: 'expired' },
      changed_fields: [],
      security_level: 'high',
      compliance_tags: ['RGPD'],
      is_sensitive: false,
      ip_address: '192.168.1.100',
      event_timestamp: new Date(Date.now() - 60000).toISOString() // Il y a 1min
    },
    {
      event_type: 'CONFIG_CHANGE',
      table_name: 'companies',
      record_id: companyId,
      company_id: companyId,
      user_id: userId,
      user_email: userEmail,
      old_values: { tax_rate: 20 },
      new_values: { tax_rate: 21 },
      changed_fields: ['tax_rate'],
      security_level: 'critical',
      compliance_tags: ['RGPD', 'SOC2', 'ISO27001'],
      is_sensitive: true,
      ip_address: '192.168.1.100',
      event_timestamp: new Date().toISOString()
    }
  ];

  const { data, error } = await supabase
    .from('audit_logs')
    .insert(testLogs)
    .select();

  if (error) {
    console.error('❌ Erreur lors de l\'insertion:', error.message);
    console.error('   Code:', error.code);
    console.error('   Details:', error.details);
    console.error('   Hint:', error.hint);
    return;
  }

  console.log(`✅ ${data.length} logs d'audit créés avec succès!\n`);

  // 3. Vérifier
  const { count } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total logs dans la base: ${count}`);
}

seedAuditLogs().catch(console.error);
