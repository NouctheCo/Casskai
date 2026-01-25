import { createClient } from '@supabase/supabase-js';
const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Missing env'); process.exit(2); }
const supabase = createClient(url, key);
(async()=>{
  const { data, error } = await supabase.from('companies').select('*').limit(20);
  if (error) { console.error('Error:', error); process.exit(1); }
  console.log('companies:', data?.length ?? 0);
  console.dir(data, { depth: 2 });
  process.exit(0);
})();
