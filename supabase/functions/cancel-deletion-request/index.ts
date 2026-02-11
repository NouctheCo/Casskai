/**
 * CassKai - Edge Function: cancel-deletion-request
 * Annuler une demande de suppression de compte pendant la période de grâce (30 jours)
 *
 * Priorité: HAUTE
 * Date: 6 décembre 2025
 */

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitResponse, getRateLimitPreset } from '../_shared/rate-limit.ts';

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(supabaseUrl, serviceKey);

function getBearerToken(req: Request) {
  const h = req.headers.get("Authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7) : h;
}

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
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  // Rate limiting
  const rateLimit = checkRateLimit(req, getRateLimitPreset('cancel-deletion-request'));
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfter!, getCorsHeaders(req));
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: getCorsHeaders(req) });
  }

  try {
    console.log('[cancel-deletion-request] Function invoked');

    // Authentication
    const bearer = getBearerToken(req);
    const { data: userData, error: authError } = await admin.auth.getUser(bearer);
    if (authError || !userData?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: getCorsHeaders(req) });
    }
    const userId = userData.user.id;
    console.log('[cancel-deletion-request] User authenticated:', userId);

    // Parse body
    const body: RequestBody = await req.json();
    const { deletion_request_id, cancellation_reason } = body;

    // Find deletion request
    let deletionRequest;
    if (deletion_request_id) {
      const { data, error } = await admin
        .from('account_deletion_requests')
        .select('*')
        .eq('id', deletion_request_id)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return Response.json({
          error: 'Not found',
          details: 'Deletion request not found or does not belong to you'
        } as ErrorResponse, { status: 404, headers: getCorsHeaders(req) });
      }
      deletionRequest = data;
    } else {
      const { data, error } = await admin
        .from('account_deletion_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return Response.json({
          error: 'Not found',
          details: 'No pending deletion request found'
        } as ErrorResponse, { status: 404, headers: getCorsHeaders(req) });
      }
      deletionRequest = data;
    }

    // Validate status
    if (deletionRequest.status !== 'pending') {
      return Response.json({
        error: 'Invalid status',
        details: `Cannot cancel a ${deletionRequest.status} deletion request`
      } as ErrorResponse, { status: 400, headers: getCorsHeaders(req) });
    }

    // Check grace period
    const scheduledDate = new Date(deletionRequest.scheduled_deletion_date);
    const now = new Date();
    if (now >= scheduledDate) {
      return Response.json({
        error: 'Grace period expired',
        details: 'The 30-day grace period has expired. Please contact support.'
      } as ErrorResponse, { status: 400, headers: getCorsHeaders(req) });
    }

    // Cancel the request
    const { data: updatedRequest, error: updateError } = await admin
      .from('account_deletion_requests')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        metadata: {
          ...deletionRequest.metadata,
          cancellation_reason: cancellation_reason || 'User cancelled',
          cancelled_by: userId,
          cancelled_at_timestamp: Date.now()
        }
      })
      .eq('id', deletionRequest.id)
      .select()
      .single();

    if (updateError || !updatedRequest) {
      return Response.json({
        error: 'Update failed',
        details: 'Failed to cancel deletion request'
      } as ErrorResponse, { status: 500, headers: getCorsHeaders(req) });
    }

    // Log RGPD action
    await admin.from('rgpd_logs').insert({
      user_id: userId,
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

    console.log('[cancel-deletion-request] Deletion request cancelled successfully');
    return Response.json({
      success: true,
      message: 'Account deletion request cancelled successfully. Your account will not be deleted.',
      deletion_request: updatedRequest
    } as SuccessResponse, { headers: getCorsHeaders(req) });

  } catch (error) {
    console.error('[cancel-deletion-request] Unexpected error:', error);
    return Response.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    } as ErrorResponse, { status: 500, headers: getCorsHeaders(req) });
  }
});
