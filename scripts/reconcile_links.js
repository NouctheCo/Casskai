#!/usr/bin/env node
/* ESM version */
import fs from 'fs';
import path from 'path';

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const txt = fs.readFileSync(envPath, 'utf8');
  return txt.split(/\r?\n/).reduce((acc, line) => {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) acc[m[1]] = m[2];
    return acc;
  }, {});
}

const env = Object.assign({}, loadEnvLocal(), process.env);
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (set in .env.local or env)');
  process.exit(1);
}
const companyId = process.argv[2] || env.COMPANY_ID || '3321651c-1298-4611-8883-9cbf81c1227d';

const headers = {
  apikey: SERVICE_KEY,
  Authorization: 'Bearer ' + SERVICE_KEY,
  'Content-Type': 'application/json',
};

const url = (p) => `${SUPABASE_URL.replace(/\/$/,'')}/rest/v1/${p}`;

async function fetchJson(u) {
  const res = await fetch(u, { headers });
  if (!res.ok) {
    let bodyText;
    try {
      bodyText = await res.text();
    } catch (e) {
      bodyText = '<unable to read response body>';
    }
    throw new Error(`Request to ${u} failed with status ${res.status} ${res.statusText}: ${bodyText}`);
  }
  return res.json();
}

// Select journal_entry_lines that look like revenue lines (credit_amount > 0)
// Join the parent journal_entries to access entry_number, entry_date and linked_invoice_id
let journalEntriesRaw = await fetchJson(url(`journal_entry_lines?select=id,journal_entry_id,debit_amount,credit_amount,journal_entries(id,entry_number,entry_date,linked_invoice_id)&journal_entries.company_id=eq.${companyId}&journal_entries.linked_invoice_id=is.null&credit_amount=gt.0`));
let invoicesRaw = await fetchJson(url(`invoices?company_id=eq.${companyId}&select=id,total_incl_tax,invoice_date,invoice_number`));

const journalEntries = Array.isArray(journalEntriesRaw) ? journalEntriesRaw : [];
const invoices = Array.isArray(invoicesRaw) ? invoicesRaw : [];

if (!Array.isArray(journalEntriesRaw)) {
  console.warn('Warning: journalEntries response not an array, raw:', journalEntriesRaw);
}
if (!Array.isArray(invoicesRaw)) {
  console.warn('Warning: invoices response not an array, raw:', invoicesRaw);
}

const matches = [];
const unmatched = [];

for (const line of journalEntries) {
  const jeAmount = Number(line.credit_amount || 0);
  const jeDate = (line.journal_entries?.entry_date || '').slice(0,10);
  const entryNumber = line.journal_entries?.entry_number || null;
  let found = null;
  for (const inv of invoices) {
    const invAmount = Number(inv.total_incl_tax || 0);
    const invDate = (inv.invoice_date || '').slice(0,10);
    if (jeAmount !== 0 && jeAmount === invAmount && jeDate === invDate) {
      found = inv;
      break;
    }
  }
  const entryMeta = { journal_entry_line_id: line.id, journal_entry_id: line.journal_entry_id, entry_number: entryNumber, amount: jeAmount, entry_date: jeDate };
  if (found) {
    matches.push({ ...entryMeta, linked_invoice_id: found.id, invoice: found });
  } else {
    unmatched.push(entryMeta);
  }
}

const report = {
  companyId,
  timestamps: { run: new Date().toISOString() },
  totals: {
    journal_entries_total: journalEntries.length,
    invoices_total: invoices.length,
    potential_matches: matches.length,
    unmatched_journal_entries: unmatched.length,
  },
  sample_matches: matches.slice(0,10),
  sample_unmatched: unmatched.slice(0,20),
};

console.log(JSON.stringify(report, null, 2));
