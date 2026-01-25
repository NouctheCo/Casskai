import { createClient } from '@supabase/supabase-js';
const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Missing env'); process.exit(2); }
const supabase = createClient(url, key);
(async()=>{
  const { data, error } = await supabase.rpc('sql', { q: `SELECT conname, pg_get_constraintdef(c.oid) as def
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE conname = 'journals_type_check';` }).catch(e=>({ error: e }));
  if ((data && data.length) || !error) {
    console.log('Constraint RPC result:', data);
  } else {
    console.error('RPC error or no data:', error);
  }
  process.exit(0);
})();
