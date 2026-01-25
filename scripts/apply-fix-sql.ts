import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(2);
}
const supabase = createClient(url, key);

const sql = `
create or replace function public.fix_journal_type_on_insert()
returns trigger as $$
begin
  if new.type is not null and lower(new.type) = 'sales' then
    new.type := 'sale';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_fix_journals_type on public.journals;
create trigger trg_fix_journals_type
before insert on public.journals
for each row execute function public.fix_journal_type_on_insert();
`;

async function run() {
  console.log('Applying SQL fix via RPC...');
  try {
    const res = await (supabase as any).rpc('sql', { q: sql });
    console.log('RPC response:', res);
  } catch (e) {
    console.error('RPC call failed:', e);
  }
}

run().catch(e=>{ console.error('Failed', e); process.exit(1); });
