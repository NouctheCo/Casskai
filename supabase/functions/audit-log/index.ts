/**
 * CassKai - Edge Function: audit-log
 * Enregistre les événements d'audit côté serveur avec CORS correct.
 *
 * - Vérifie le JWT via Authorization header
 * - Gère CORS (OPTIONS → 200) pour éviter les erreurs de preflight
 * - Insère dans la table public.audit_logs
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Auth context (for user_id / email)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse payload
    let payload: any;
    try {
      payload = await req.json();
    } catch (_) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalize/Enrich entry server-side
    const entry = {
      event_type: payload.event_type ?? payload.action ?? payload.action_type ?? 'VIEW',
      user_id: user.id,
      user_email: user.email ?? null,

      company_id: payload.company_id ?? null,
      table_name: payload.table_name ?? payload.entityType ?? null,
      record_id: payload.record_id ?? payload.entityId ?? null,

      old_values: payload.old_values ?? null,
      new_values: payload.new_values ?? null,
      changed_fields: payload.changed_fields ?? null,

      security_level: payload.security_level ?? 'standard',
      compliance_tags: payload.compliance_tags ?? [],
      is_sensitive: payload.is_sensitive ?? false,

      ip_address: payload.ip_address ?? null,
      user_agent: payload.user_agent ?? null,
      session_id: payload.session_id ?? null,
      request_id: payload.request_id ?? null,

      event_timestamp: payload.event_timestamp ?? new Date().toISOString(),
    };

    // Insert into audit_logs (RLS should allow authenticated users)
    const { error: insertError } = await supabase
      .from('audit_logs')
      .insert(entry);

    if (insertError) {
      console.error('[audit-log] insert error:', insertError);
      return new Response(JSON.stringify({ ok: false, error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[audit-log] unhandled error:', e);
    return new Response(JSON.stringify({ ok: false, error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
