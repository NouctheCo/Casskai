import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing SUPABASE URL or SERVICE ROLE KEY environment variables.');
  process.exit(2);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

async function run() {
  console.log('Seeding test data to:', url);

  // 1) Find or create a test company (idempotent)
  const baseCompanyName = 'Dev Test Company (local-seed)';
  let { data: foundCompanies } = await supabase
    .from('companies')
    .select('*')
    .ilike('name', `${baseCompanyName}%`)
    .order('created_at', { ascending: false })
    .limit(1);
  let company = foundCompanies && foundCompanies[0];
  if (!company) {
    const { data: newCompany, error: compErr } = await supabase
      .from('companies')
      .insert({ name: `${baseCompanyName} ${new Date().toISOString()}`, country: 'FR', created_by: null })
      .select('*')
      .single();
    if (compErr || !newCompany) {
      console.error('Failed to create company:', compErr);
      process.exit(1);
    }
    company = newCompany;
    console.log('Created company:', company.id);
  } else {
    console.log('Using existing company:', company.id);
  }

  // 2) Create sample chart of accounts
  const accountsToInsert = [
    { company_id: company.id, account_number: '101', account_name: 'Caisse', account_type: 'asset', account_class: '1', is_active: true },
    { company_id: company.id, account_number: '401', account_name: 'Fournisseurs', account_type: 'liability', account_class: '4', is_active: true },
    { company_id: company.id, account_number: '707', account_name: 'Ventes', account_type: 'revenue', account_class: '7', is_active: true },
  ];
  // 2) Insert or upsert sample chart of accounts (idempotent)
  const { data: accounts, error: accountsErr } = await supabase
    .from('chart_of_accounts')
    .upsert(accountsToInsert, { onConflict: ['company_id', 'account_number'] })
    .select('*');
  if (accountsErr) {
    console.error('Failed to upsert accounts:', accountsErr);
    process.exit(1);
  }
  console.log('Upserted accounts:', (accounts || []).map(a => a.id));

  // 3) Create a journal
  // 3) Create or get a journal (idempotent)
  const { data: existingJournal } = await supabase
    .from('journals')
    .select('*')
    .eq('company_id', company.id)
    .eq('code', 'OD')
    .limit(1);
  let journal = existingJournal && existingJournal[0];
  if (!journal) {
    const { data: createdJournal, error: journalErr } = await supabase
      .from('journals')
      .upsert({ company_id: company.id, code: 'OD', name: 'Opérations Diverses', type: 'miscellaneous', is_active: true }, { onConflict: ['company_id', 'code'] })
      .select('*')
      .single();
    if (journalErr || !createdJournal) {
      console.error('Failed to create journal:', journalErr);
      process.exit(1);
    }
    journal = createdJournal;
    console.log('Created journal:', journal.id);
  } else {
    console.log('Using existing journal:', journal.id);
  }

  // 4) Create a journal entry and lines
  const entryInsert = {
    company_id: company.id,
    journal_id: journal.id,
    entry_number: `TEST-${Date.now()}`,
    entry_date: new Date().toISOString(),
    description: 'Seed test entry',
    status: 'posted',
  };
  // Insert entry and return only id to avoid schema-cache selection issues
  const { data: entry, error: entryErr } = await supabase
    .from('journal_entries')
    .insert(entryInsert)
    .select('id')
    .single();
  if (entryErr || !entry) {
    console.error('Failed to create journal entry:', entryErr);
    process.exit(1);
  }
  console.log('Created journal entry:', entry.id);

  const accMap = (accounts || []).reduce((m: any, a: any) => { m[a.account_number] = a; return m; }, {} as any);
  const linesToInsert = [
    { journal_entry_id: entry.id, company_id: company.id, account_id: accMap['707'].id, description: 'Sale', debit_amount: 0, credit_amount: 100, line_order: 1 },
    { journal_entry_id: entry.id, company_id: company.id, account_id: accMap['401'].id, description: 'Supplier', debit_amount: 100, credit_amount: 0, line_order: 2 },
  ];
  const { data: lines, error: linesErr } = await supabase
    .from('journal_entry_lines')
    .insert(linesToInsert)
    .select('*');
  if (linesErr) {
    console.error('Failed to insert journal entry lines:', linesErr);
    process.exit(1);
  }
  console.log('Inserted lines:', lines.map((l:any)=>l.id));

  // 5) Verify counts
  const { data: entriesAfter } = await supabase
    .from('journal_entries')
    .select('id, entry_number, entry_date, description, status, company_id')
    .eq('company_id', company.id);
  const { data: linesAfter } = await supabase
    .from('journal_entry_lines')
    .select('id, journal_entry_id, account_id, debit_amount, credit_amount')
    .eq('journal_entry_id', entry.id);

  console.log(`After seed: journal_entries=${entriesAfter?.length ?? 0}, journal_entry_lines=${linesAfter?.length ?? 0}`);
  console.dir(entriesAfter, { depth: 2 });
  console.dir(linesAfter, { depth: 2 });

  console.log('Seed completed successfully.');
  process.exit(0);
}

run().catch(e=>{ console.error('Seed failed', e); process.exit(1); });
