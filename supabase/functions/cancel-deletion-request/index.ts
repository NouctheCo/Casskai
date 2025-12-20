import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(supabaseUrl, serviceKey);

function getBearerToken(req: Request) {
  const h = req.headers.get("Authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7) : h;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: cors });
  try {
    const bearer = getBearerToken(req);
    const { data: userData, error: userErr } = await admin.auth.getUser(bearer);
    if (userErr || !userData?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: cors });
    }
    const userId = userData.user.id;

    const { data: pending, error: fetchErr } = await admin
      .from("account_deletion_requests")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "pending")
      .limit(1)
      .maybeSingle();
    if (fetchErr) {
      return Response.json({ error: fetchErr.message }, { status: 500, headers: cors });
    }
    if (!pending?.id) {
      return Response.json({ error: "No pending deletion request" }, { status: 404, headers: cors });
    }

    const { error: updateErr } = await admin
      .from("account_deletion_requests")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", pending.id);
    if (updateErr) {
      return Response.json({ error: updateErr.message }, { status: 500, headers: cors });
    }
    return Response.json({ ok: true }, { headers: cors });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500, headers: cors });
  }
});

/**
 * CassKai - Edge Function: cancel-deletion-request
 * Annuler une demande de suppression de compte pendant la période de grâce (30 jours)
 *
 * Priorité: HAUTE
 * Date: 6 décembre 2025
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  deletion_request_id?: string;
  cancellation_reason?: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

interface SuccessResponse {
  success: boolean;
  message: string;
  deletion_request: any;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[cancel-deletion-request] Function invoked');

    // ========================================
    // 1. VÉRIFICATION DES VARIABLES D'ENVIRONNEMENT
    // ========================================
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[cancel-deletion-request] Missing environment variables');
      return new Response(
        JSON.stringify({
          error: 'Server configuration error',
          details: 'Missing required environment variables'
        } as ErrorResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ========================================
    // 2. AUTHENTIFICATION JWT
    // ========================================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[cancel-deletion-request] No authorization header');
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          details: 'Missing authorization header'
        } as ErrorResponse),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Créer client Supabase avec service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Vérifier le JWT et récupérer l'utilisateur
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('[cancel-deletion-request] Authentication failed:', authError);
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          details: 'Invalid or expired token'
        } as ErrorResponse),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[cancel-deletion-request] User authenticated:', user.id);

    // ========================================
    // 3. RÉCUPÉRATION ET VALIDATION DES DONNÉES
    // ========================================
    const body: RequestBody = await req.json();
    const { deletion_request_id, cancellation_reason } = body;

    // Si pas d'ID fourni, chercher la demande active de l'utilisateur
    let deletionRequest;

    if (deletion_request_id) {
      // Récupérer la demande spécifique
      const { data, error } = await supabaseAdmin
        .from('account_deletion_requests')
        .select('*')
        .eq('id', deletion_request_id)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        console.error('[cancel-deletion-request] Deletion request not found:', error);
        return new Response(
          JSON.stringify({
            error: 'Not found',
            details: 'Deletion request not found or does not belong to you'
          } as ErrorResponse),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      deletionRequest = data;
    } else {
      // Chercher la dernière demande active
      const { data, error } = await supabaseAdmin
        .from('account_deletion_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        console.error('[cancel-deletion-request] No pending deletion request found:', error);
        return new Response(
          JSON.stringify({
            error: 'Not found',
            details: 'No pending deletion request found'
          } as ErrorResponse),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      deletionRequest = data;
    }

    // Vérifier que la demande est bien en attente
    if (deletionRequest.status !== 'pending') {
      return new Response(
        JSON.stringify({
          error: 'Invalid status',
          details: `Cannot cancel a ${deletionRequest.status} deletion request`
        } as ErrorResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Vérifier que la période de grâce n'est pas expirée
    const scheduledDate = new Date(deletionRequest.scheduled_deletion_date);
    const now = new Date();

    if (now >= scheduledDate) {
      return new Response(
        JSON.stringify({
          error: 'Grace period expired',
          details: 'The 30-day grace period has expired. Please contact support.'
        } as ErrorResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ========================================
    // 4. ANNULATION DE LA DEMANDE
    // ========================================
    const { data: updatedRequest, error: updateError } = await supabaseAdmin
      .from('account_deletion_requests')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        metadata: {
          ...deletionRequest.metadata,
          cancellation_reason: cancellation_reason || 'User cancelled',
          cancelled_by: user.id,
          cancelled_at_timestamp: Date.now()
        }
      })
      .eq('id', deletionRequest.id)
      .select()
      .single();

    if (updateError || !updatedRequest) {
      console.error('[cancel-deletion-request] Failed to cancel request:', updateError);
      return new Response(
        JSON.stringify({
          error: 'Update failed',
          details: 'Failed to cancel deletion request'
        } as ErrorResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ========================================
    // 5. LOGGING RGPD
    // ========================================
    const logResult = await supabaseAdmin
      .from('rgpd_logs')
      .insert({
        user_id: user.id,
        action_type: 'account_deletion_cancelled',
        action_category: 'deletion',
        description: `Account deletion request cancelled by user`,
        severity: 'high',
        status: 'success',
        metadata: {
          deletion_request_id: deletionRequest.id,
          cancellation_reason: cancellation_reason || 'User cancelled',
          days_remaining: Math.ceil((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        }
      });

    if (logResult.error) {
      console.warn('[cancel-deletion-request] Failed to log action:', logResult.error);
    }

    // ========================================
    // 6. RÉPONSE SUCCÈS
    // ========================================
    console.log('[cancel-deletion-request] Deletion request cancelled successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account deletion request cancelled successfully. Your account will not be deleted.',
        deletion_request: updatedRequest
      } as SuccessResponse),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[cancel-deletion-request] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as ErrorResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
