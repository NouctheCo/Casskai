import { createClient } from '@supabase/supabase-js';
import { glob } from 'glob';
import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';

function loadEnvFileIfExists(envPath, override) {
  try {
    dotenv.config({ path: envPath, override });
  } catch {
    // ignore
  }
}

type KbConfig = {
  include: string[];
  exclude: string[];
  chunk: { maxChars: number; minChars: number };
  defaults: { visibility: 'public' | 'company'; sensitivity: 'public' | 'internal' | 'secret' };
};

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

function chunkText(text: string, maxChars: number, minChars: number): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  const paragraphs = normalized.split(/\n\n+/g).map(p => p.trim()).filter(Boolean);

  const chunks: string[] = [];
  let current = '';

  for (const p of paragraphs) {
    const next = current ? `${current}\n\n${p}` : p;
    if (next.length > maxChars) {
      if (current && current.length >= minChars) chunks.push(current);
      if (p.length > maxChars) {
        for (let i = 0; i < p.length; i += maxChars) {
          const slice = p.slice(i, i + maxChars).trim();
          if (slice.length >= minChars) chunks.push(slice);
        }
        current = '';
      } else {
        current = p;
      }
    } else {
      current = next;
    }
  }

  if (current && current.length >= minChars) chunks.push(current);
  return chunks;
}

function looksSensitive(content: string): boolean {
  const needles = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'SERVICE_ROLE',
    'OPENAI_API_KEY',
    'VITE_OPENAI_API_KEY',
    'JWT_SECRET',
    'PRIVATE KEY',
    'BEGIN PRIVATE KEY',
  ];
  const hay = content.toLowerCase();
  return needles.some(n => hay.includes(n.toLowerCase()));
}

function getOnlyArg(): string | null {
  const idx = process.argv.indexOf('--only');
  if (idx === -1) return null;
  const value = process.argv[idx + 1];
  return value?.trim() ? value.trim() : null;
}

function getOnlyFromNpmConfig(): string | null {
  const value = process.env.npm_config_only;
  return value?.trim() ? value.trim() : null;
}

async function main() {
  // Load env for local runs (safe defaults: .env first, then .env.local overrides)
  loadEnvFileIfExists('.env', false);
  loadEnvFileIfExists('.env.local', true);
  loadEnvFileIfExists('.env.local.prod', true);
  loadEnvFileIfExists('.env.production', false);
  loadEnvFileIfExists('.env.production.local', true);

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const effectiveSupabaseUrl = supabaseUrl || process.env.VITE_SUPABASE_URL;
  const effectiveServiceRoleKey = supabaseServiceRoleKey;
  const effectiveOpenAiKey = openaiKey || process.env.VITE_OPENAI_API_KEY;

  if (!effectiveSupabaseUrl || !effectiveServiceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  if (!effectiveOpenAiKey) {
    throw new Error('Missing OPENAI_API_KEY');
  }

  const configPath = path.join(process.cwd(), 'scripts', 'kb', 'kb.config.json');
  const config = JSON.parse(await fs.readFile(configPath, 'utf8')) as KbConfig;

  const supabase = createClient(effectiveSupabaseUrl, effectiveServiceRoleKey);

  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey: effectiveOpenAiKey });

  const only = getOnlyArg() ?? getOnlyFromNpmConfig();
  const include = only ? [only] : config.include;
  const files = await glob(include, {
    ignore: only ? [] : config.exclude,
    nodir: true,
    windowsPathsNoEscape: true,
  });

  if (!files.length) {
    console.log('No files matched for ingestion. Check scripts/kb/kb.config.json');
    return;
  }

  console.log(`Ingesting ${files.length} file(s) into kb_documents/kb_chunks...`);

  for (const file of files) {
    const abs = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
    const rel = path.relative(process.cwd(), abs).replace(/\\/g, '/');
    const raw = await fs.readFile(abs, 'utf8');
    const cleaned = raw.replace(/\u0000/g, '');

    if (looksSensitive(cleaned)) {
      console.warn(`Skipping sensitive file: ${rel}`);
      continue;
    }

    const title = path.basename(rel);
    const content = cleaned.trim();
    if (!content) continue;

    const { data: doc, error: docErr } = await supabase
      .from('kb_documents')
      .upsert(
        {
          company_id: null,
          visibility: config.defaults.visibility,
          sensitivity: config.defaults.sensitivity,
          title,
          source: rel,
          content,
          metadata: { path: rel, kind: 'app_doc' },
        },
        { onConflict: 'company_id,source' }
      )
      .select('*')
      .single();

    if (docErr) {
      console.error(`Failed upserting document ${rel}:`, docErr);
      continue;
    }

    const chunks = chunkText(content, config.chunk.maxChars, config.chunk.minChars);
    if (!chunks.length) continue;

    // Delete previous chunks for this document (idempotent refresh)
    const { error: delErr } = await supabase.from('kb_chunks').delete().eq('document_id', doc.id);
    if (delErr) {
      console.error(`Failed deleting old chunks for ${rel}:`, delErr);
      continue;
    }

    // Embed in small batches
    const batchSize = 16;
    for (let batchStart = 0; batchStart < chunks.length; batchStart += batchSize) {
      const batch = chunks.slice(batchStart, batchStart + batchSize);

      const emb = await openai.embeddings.create({
        model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
        input: batch,
      });

      const rows = batch.map((chunk, i) => ({
        document_id: doc.id,
        company_id: null,
        visibility: config.defaults.visibility,
        sensitivity: config.defaults.sensitivity,
        chunk_index: batchStart + i,
        content: chunk,
        metadata: { path: rel, kind: 'app_doc' },
        embedding: toVectorLiteral(emb.data[i].embedding),
      }));

      const { error: insErr } = await supabase.from('kb_chunks').insert(rows);
      if (insErr) {
        console.error(`Failed inserting chunks for ${rel}:`, insErr);
        break;
      }
    }

    console.log(`OK: ${rel} (${chunks.length} chunks)`);
  }

  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
