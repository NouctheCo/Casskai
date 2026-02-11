/**
 * CassKai - Edge Function: audit-log
 * Enregistre les événements d'audit côté serveur avec CORS correct.
 *
 * - Tente de vérifier le JWT via Authorization header
 * - Si pas de JWT ou JWT invalide, utilise le service role key pour insérer
 *   (les données user_id/user_email sont fournies par le client)
 * - Gère CORS (OPTIONS → 200) pour éviter les erreurs de preflight
 * - Insère dans la table public.audit_logs
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

serve(async (req: Request) => {
  // CORS preflight
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Tenter d'identifier l'utilisateur via le JWT
    let userId: string | null = null;
    let userEmail: string | null = null;

    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
        if (!authError && user) {
          userId = user.id;
          userEmail = user.email ?? null;
        }
      } catch (_) {
        // JWT invalide/expiré — pas bloquant, on continue avec les données du payload
      }
    }

    // Parse payload
    let payload: any;
    try {
      payload = await req.json();
    } catch (_) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    // Utiliser les données du JWT si disponibles, sinon celles du payload
    const entry = {
      event_type: payload.event_type ?? payload.action ?? payload.action_type ?? 'VIEW',
      user_id: userId ?? payload.user_id ?? null,
      user_email: userEmail ?? payload.user_email ?? null,

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

    // Insérer avec le service role key pour bypass RLS
    // (l'audit doit toujours pouvoir écrire, même si le JWT user est expiré)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { error: insertError } = await supabaseAdmin
      .from('audit_logs')
      .insert(entry);

    if (insertError) {
      console.error('[audit-log] insert error:', insertError);
      return new Response(JSON.stringify({ ok: false, error: insertError.message }), {
        status: 500,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[audit-log] unhandled error:', e);
    return new Response(JSON.stringify({ ok: false, error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
