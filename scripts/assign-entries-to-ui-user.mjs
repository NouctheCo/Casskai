import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
let url = process.env.VITE_SUPABASE_URL;
let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let targetUserId = process.env.UI_USER_ID; // pass the browser user id here
const companyId = process.env.UI_COMPANY_ID || '3321651c-1298-4611-8883-9cbf81c1227d';

// If env vars are not set, try to read .env.local from workspace root
if ((!url || !serviceKey) && fs.existsSync('.env.local')) {
  const envText = fs.readFileSync('.env.local', 'utf8');
  for (const line of envText.split(/\r?\n/)) {
    const m = line.match(/^\s*([^=]+)=(.*)$/);
    if (!m) continue;
    const k = m[1].trim();
    let v = m[2] || '';
    v = v.replace(/^"|"$/g, '').trim();
    if (!url && k === 'VITE_SUPABASE_URL') url = v;
    if (!serviceKey && k === 'SUPABASE_SERVICE_ROLE_KEY') serviceKey = v;
  }
}

if (!targetUserId) {
  console.error('Please set UI_USER_ID environment variable to the browser user id (see logs).');
  process.exit(2);
}

if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment or .env.local');
  process.exit(2);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

async function run() {
  console.log('Assigning journal_entries.created_by =>', targetUserId, 'for company', companyId);
  const { error } = await admin.from('journal_entries').update({ created_by: targetUserId }).eq('company_id', companyId);
  if (error) {
    console.error('Failed to update entries:', error);
    process.exit(1);
  }
  console.log('Updated journal_entries.created_by for company', companyId);
}

run().catch(err => { console.error(err); process.exit(1); });
