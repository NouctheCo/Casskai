#!/usr/bin/env node

/**
 * Seed realistic E2E data for a specific user in the connected Supabase project.
 * Usage (PowerShell):
 *   $env:E2E_SEED_ALLOW_PROD='1'; node scripts/seed-e2e-production-data.mjs
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load env files if present
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.test.local' });
dotenv.config();

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const testUserEmail =
  process.env.E2E_SEED_USER_EMAIL ||
  process.env.TEST_USER_EMAIL ||
  'test@casskai.app';

const allowProd = ['1', 'true', 'yes'].includes((process.env.E2E_SEED_ALLOW_PROD || '').toLowerCase());

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase credentials. Provide SUPABASE_URL and SUPABASE_SERVICE_KEY/ROLE_KEY.');
  process.exit(1);
}

if (!allowProd) {
  console.error('❌ Refusing to seed without E2E_SEED_ALLOW_PROD=1');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

const MODULES = [
  { key: 'dashboard', name: 'Tableau de bord' },
  { key: 'settings', name: 'Paramètres' },
  { key: 'users', name: 'Utilisateurs' },
  { key: 'security', name: 'Sécurité' },
  { key: 'onboarding', name: 'Onboarding' },
  { key: 'accounting', name: 'Comptabilité' },
  { key: 'invoicing', name: 'Facturation' },
  { key: 'banking', name: 'Banque' },
  { key: 'purchases', name: 'Achats' },
  { key: 'reports', name: 'Rapports' },
  { key: 'budget', name: 'Budget & Prévisions' },
  { key: 'tax', name: 'Fiscalité' },
  { key: 'salesCrm', name: 'CRM Ventes' },
  { key: 'inventory', name: 'Stock & Inventaire' },
  { key: 'projects', name: 'Projets' },
  { key: 'thirdParties', name: 'Tiers' },
  { key: 'contracts', name: 'Contrats' },
  { key: 'humanResources', name: 'Ressources Humaines' },
  { key: 'automation', name: 'Automatisation' },
];

const ACCOUNTS = [
  { account_number: '101', account_name: 'Capital social', account_type: 'equity', account_class: 1 },
  { account_number: '201', account_name: 'Immobilisations', account_type: 'asset', account_class: 2 },
  { account_number: '301', account_name: 'Stocks', account_type: 'asset', account_class: 3 },
  { account_number: '401', account_name: 'Fournisseurs', account_type: 'liability', account_class: 4 },
  { account_number: '411', account_name: 'Clients', account_type: 'asset', account_class: 4 },
  { account_number: '512', account_name: 'Banque', account_type: 'asset', account_class: 5 },
  { account_number: '601', account_name: 'Achats', account_type: 'expense', account_class: 6 },
  { account_number: '701', account_name: 'Ventes', account_type: 'revenue', account_class: 7 },
];

const now = new Date();
const toDate = (d) => d.toISOString().split('T')[0];
const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

async function getUserIdByEmail(email) {
  const admin = supabase.auth.admin;
  if (typeof admin.getUserByEmail === 'function') {
    const { data, error } = await admin.getUserByEmail(email);
    if (error || !data?.user) {
      throw new Error(`User not found for email ${email}: ${error?.message || 'unknown error'}`);
    }
    return data.user.id;
  }

  const { data, error } = await admin.listUsers({ page: 1, perPage: 1000 });
  if (error || !data?.users) {
    throw new Error(`Failed to list users: ${error?.message || 'unknown error'}`);
  }

  const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  if (!match) {
    throw new Error(`User not found for email ${email}`);
  }

  return match.id;
}

async function getOrCreateCompany({ name, businessKey, ownerId, currency }) {
  const { data: existing } = await supabase
    .from('companies')
    .select('id, name')
    .eq('business_key', businessKey)
    .limit(1);

  if (existing && existing.length > 0) {
    return existing[0];
  }

  const { data, error } = await supabase
    .from('companies')
    .insert({
      name,
      business_key: businessKey,
      owner_id: ownerId,
      country: 'SN',
      country_code: 'SN',
      default_currency: currency,
      default_locale: 'fr-FR',
      is_active: true,
      onboarding_completed_at: new Date().toISOString(),
    })
    .select('id, name')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create company ${name}: ${error?.message || 'unknown error'}`);
  }

  return data;
}

async function ensureUserCompanyLink(userId, companyId, isDefault) {
  const { data: existing } = await supabase
    .from('user_companies')
    .select('id')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .limit(1);

  if (existing && existing.length > 0) {
    if (isDefault) {
      await supabase
        .from('user_companies')
        .update({ is_default: true, is_active: true, status: 'active' })
        .eq('id', existing[0].id);
    }
    return;
  }

  const { error } = await supabase
    .from('user_companies')
    .insert({
      user_id: userId,
      company_id: companyId,
      role: 'owner',
      is_default: isDefault,
      is_active: true,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throw new Error(`Failed to link user to company: ${error.message}`);
  }
}

async function ensureSubscription(userId, companyId) {
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id, plan_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (existing && existing.length > 0) {
    return existing[0];
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      company_id: companyId,
      plan_id: 'enterprise_monthly',
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: addMonths(new Date(), 1).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id, plan_id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create subscription: ${error?.message || 'unknown error'}`);
  }

  return data;
}

async function seedModules(companyId) {
  const payload = MODULES.map((module, index) => ({
    company_id: companyId,
    module_key: module.key,
    module_name: module.name,
    is_enabled: true,
    is_visible: true,
    display_order: index + 1,
    activated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('company_modules')
    .upsert(payload, { onConflict: 'company_id,module_key' });

  if (error) {
    throw new Error(`Failed to seed modules: ${error.message}`);
  }
}

async function seedAccounts(companyId) {
  const payload = ACCOUNTS.map((acc) => ({
    ...acc,
    company_id: companyId,
    is_active: true,
    is_detail_account: true,
  }));

  const { error } = await supabase
    .from('chart_of_accounts')
    .upsert(payload, { onConflict: 'company_id,account_number' });

  if (error) {
    throw new Error(`Failed to seed accounts: ${error.message}`);
  }

  const { data } = await supabase
    .from('chart_of_accounts')
    .select('id, account_number')
    .eq('company_id', companyId)
    .in('account_number', ACCOUNTS.map((a) => a.account_number));

  return data || [];
}

async function seedJournalData(companyId, accounts) {
  const accountMap = accounts.reduce((acc, item) => {
    acc[item.account_number] = item.id;
    return acc;
  }, {});

  const { data: journals } = await supabase
    .from('journals')
    .select('id')
    .eq('company_id', companyId)
    .eq('code', 'OD')
    .limit(1);

  let journalId = journals?.[0]?.id;
  if (!journalId) {
    const { data: journal, error } = await supabase
      .from('journals')
      .insert({
        company_id: companyId,
        code: 'OD',
        name: 'Opérations diverses',
        type: 'miscellaneous',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error || !journal) {
      throw new Error(`Failed to create journal: ${error?.message || 'unknown error'}`);
    }
    journalId = journal.id;
  }

  const entries = [
    {
      entry_number: `E2E-JE-SALE-${companyId.slice(0, 6)}`,
      entry_date: toDate(now),
      description: 'Vente E2E',
      lines: [
        { account: '411', debit: 10000, credit: 0, description: 'Client' },
        { account: '701', debit: 0, credit: 10000, description: 'Vente' },
      ],
    },
    {
      entry_number: `E2E-JE-EXP-${companyId.slice(0, 6)}`,
      entry_date: toDate(now),
      description: 'Achat E2E',
      lines: [
        { account: '601', debit: 4000, credit: 0, description: 'Achats' },
        { account: '401', debit: 0, credit: 4000, description: 'Fournisseurs' },
      ],
    },
    {
      entry_number: `E2E-JE-OLD-${companyId.slice(0, 6)}`,
      entry_date: toDate(addMonths(now, -6)),
      description: 'Vente E2E (historique)',
      lines: [
        { account: '411', debit: 6000, credit: 0, description: 'Client' },
        { account: '701', debit: 0, credit: 6000, description: 'Vente' },
      ],
    },
    {
      entry_number: `E2E-JE-CASH-${companyId.slice(0, 6)}`,
      entry_date: toDate(addMonths(now, -1)),
      description: 'Encaissement E2E',
      lines: [
        { account: '512', debit: 7000, credit: 0, description: 'Banque' },
        { account: '411', debit: 0, credit: 7000, description: 'Clients' },
      ],
    },
  ];

  for (const entry of entries) {
    const { data: existing } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('company_id', companyId)
      .eq('entry_number', entry.entry_number)
      .limit(1);

    let entryId = existing?.[0]?.id;
    if (!entryId) {
      const { data: inserted, error } = await supabase
        .from('journal_entries')
        .insert({
          company_id: companyId,
          journal_id: journalId,
          entry_number: entry.entry_number,
          entry_date: entry.entry_date,
          description: entry.description,
          status: 'posted',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error || !inserted) {
        throw new Error(`Failed to create journal entry: ${error?.message || 'unknown error'}`);
      }
      entryId = inserted.id;
    }

    const { data: existingLines } = await supabase
      .from('journal_entry_lines')
      .select('id')
      .eq('journal_entry_id', entryId)
      .limit(1);

    if (!existingLines || existingLines.length === 0) {
      const linesPayload = entry.lines.map((line, index) => ({
        journal_entry_id: entryId,
        company_id: companyId,
        account_id: accountMap[line.account],
        description: line.description,
        debit_amount: line.debit,
        credit_amount: line.credit,
        line_order: index + 1,
        created_at: new Date().toISOString(),
      }));

      const { error: lineError } = await supabase
        .from('journal_entry_lines')
        .insert(linesPayload);

      if (lineError) {
        throw new Error(`Failed to create journal entry lines: ${lineError.message}`);
      }
    }
  }
}

async function seedInvoicing(companyId) {
  const { data: customers } = await supabase
    .from('customers')
    .select('id, customer_number')
    .eq('company_id', companyId)
    .eq('customer_number', 'CUST-E2E-001')
    .limit(1);

  let customerId = customers?.[0]?.id;
  if (!customerId) {
    const { data: customer, error } = await supabase
      .from('customers')
      .insert({
        company_id: companyId,
        customer_number: 'CUST-E2E-001',
        name: 'Client E2E',
        email: 'client-e2e@casskai.test',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error || !customer) {
      throw new Error(`Failed to create customer: ${error?.message || 'unknown error'}`);
    }
    customerId = customer.id;
  }

  const { data: thirdParties } = await supabase
    .from('third_parties')
    .select('id, code')
    .eq('company_id', companyId)
    .eq('code', 'TP-E2E-001')
    .limit(1);

  let thirdPartyId = thirdParties?.[0]?.id;
  if (!thirdPartyId) {
    const { data: thirdParty, error } = await supabase
      .from('third_parties')
      .insert({
        company_id: companyId,
        code: 'TP-E2E-001',
        name: 'Client E2E',
        type: 'customer',
        email: 'client-e2e@casskai.test',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error || !thirdParty) {
      throw new Error(`Failed to create third party: ${error?.message || 'unknown error'}`);
    }
    thirdPartyId = thirdParty.id;
  }

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id')
    .eq('company_id', companyId)
    .eq('invoice_number', 'E2E-INV-001')
    .limit(1);

  let invoiceId = invoices?.[0]?.id;
  if (!invoiceId) {
    const invoiceDate = toDate(now);
    const dueDate = toDate(addMonths(now, 1));
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        company_id: companyId,
        invoice_number: 'E2E-INV-001',
        invoice_type: 'sale',
        status: 'sent',
        invoice_date: invoiceDate,
        due_date: dueDate,
        currency: 'XOF',
        subtotal_excl_tax: 10000,
        total_tax_amount: 1800,
        total_incl_tax: 11800,
        paid_amount: 0,
        remaining_amount: 11800,
        third_party_id: thirdPartyId,
        customer_id: customerId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error || !invoice) {
      throw new Error(`Failed to create invoice: ${error?.message || 'unknown error'}`);
    }
    invoiceId = invoice.id;
  }

  const { data: invoiceItems } = await supabase
    .from('invoice_items')
    .select('id')
    .eq('invoice_id', invoiceId)
    .limit(1);

  if (!invoiceItems || invoiceItems.length === 0) {
    const { error } = await supabase
      .from('invoice_items')
      .insert({
        invoice_id: invoiceId,
        name: 'Prestation E2E',
        quantity: 1,
        unit_price: 10000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Failed to create invoice item: ${error.message}`);
    }
  }

  const paymentMethodCode = `BANK-${companyId.slice(0, 6)}`;
  const { data: paymentMethods } = await supabase
    .from('payment_methods')
    .select('id')
    .eq('company_id', companyId)
    .eq('code', paymentMethodCode)
    .limit(1);

  let paymentMethodId = paymentMethods?.[0]?.id;
  if (!paymentMethodId) {
    const { data: method, error } = await supabase
      .from('payment_methods')
      .insert({
        company_id: companyId,
        code: paymentMethodCode,
        name: 'Virement bancaire',
        is_active: true,
        is_default: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error || !method) {
      throw new Error(`Failed to create payment method: ${error?.message || 'unknown error'}`);
    }
    paymentMethodId = method.id;
  }

  const { data: payments } = await supabase
    .from('payments')
    .select('id')
    .eq('invoice_id', invoiceId)
    .limit(1);

  if (!payments || payments.length === 0) {
    const { error } = await supabase
      .from('payments')
      .insert({
        company_id: companyId,
        customer_id: customerId,
        invoice_id: invoiceId,
        amount: 5000,
        currency: 'XOF',
        payment_date: toDate(now),
        received_date: toDate(now),
        status: 'completed',
        payment_method: 'transfer',
        payment_method_id: paymentMethodId,
        reference: `E2E-PAY-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }
}

async function seedCompany(company) {
  console.log(`
🏢 Seeding company: ${company.name}`);
  await seedModules(company.id);
  const accounts = await seedAccounts(company.id);
  await seedJournalData(company.id, accounts);
  await seedInvoicing(company.id);
}

async function run() {
  console.log('🔧 Seeding E2E data in Supabase:', supabaseUrl);
  console.log('👤 Target user:', testUserEmail);

  const userId = await getUserIdByEmail(testUserEmail);
  const primaryCompany = await getOrCreateCompany({
    name: 'CassKai E2E Company A',
    businessKey: 'casskai-e2e-a',
    ownerId: userId,
    currency: 'XOF',
  });
  const secondaryCompany = await getOrCreateCompany({
    name: 'CassKai E2E Company B',
    businessKey: 'casskai-e2e-b',
    ownerId: userId,
    currency: 'EUR',
  });

  await ensureUserCompanyLink(userId, primaryCompany.id, true);
  await ensureUserCompanyLink(userId, secondaryCompany.id, false);

  await ensureSubscription(userId, primaryCompany.id);

  await seedCompany(primaryCompany);
  await seedCompany(secondaryCompany);

  console.log('\n✅ E2E seed completed successfully.');
}

run().catch((error) => {
  console.error('💥 Seed failed:', error);
  process.exit(1);
});
