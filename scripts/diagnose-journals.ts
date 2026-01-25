import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.SUPABASE_URL_PUBLIC || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON;

if (!url || !key) {
  console.error('Missing Supabase URL or ANON KEY environment variables.');
  console.error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_URL/SUPABASE_ANON_KEY).');
  process.exit(2);
}

const supabase = createClient(url, key);

async function run() {
  console.log('Running journal diagnostics against:', url);

  const { data: entries, error: entriesError } = await supabase
    .from('journal_entries')
    .select('id, entry_number, entry_date, description, status, company_id')
    .order('entry_date', { ascending: false })
    .limit(10);

  if (entriesError) {
    console.error('Error fetching journal_entries:', entriesError);
  } else {
    console.log(`journal_entries returned: ${entries?.length ?? 0} rows`);
    console.table(entries ?? []);
  }

  const { data: lines, error: linesError } = await supabase
    .from('journal_entry_lines')
    .select('id, journal_entry_id, account_id, debit_amount, credit_amount')
    .limit(20);

  if (linesError) {
    console.error('Error fetching journal_entry_lines:', linesError);
  } else {
    console.log(`journal_entry_lines returned: ${lines?.length ?? 0} rows`);
    const totals = (lines ?? []).reduce((acc, l: any) => {
      acc.debit += Number(l.debit_amount || 0);
      acc.credit += Number(l.credit_amount || 0);
      return acc;
    }, { debit: 0, credit: 0 });
    console.log('lines totals:', totals);
    console.table((lines ?? []).slice(0, 20));
  }

  // fetch a join to see if lines are returned with entries
  const { data: joined, error: joinedError } = await supabase
    .from('journal_entries')
    .select(`id, entry_number, journal_entry_lines(id, account_id, debit_amount, credit_amount)`)
    .order('entry_date', { ascending: false })
    .limit(5);

  if (joinedError) {
    console.error('Error fetching joined entries:', joinedError);
  } else {
    console.log(`joined query returned: ${joined?.length ?? 0} rows`);
    console.dir(joined, { depth: 3 });
  }

  process.exit(0);
}

run().catch((e) => {
  console.error('Diag script failed:', e);
  process.exit(1);
});
