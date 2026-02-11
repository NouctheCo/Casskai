/**
 * CassKai - Edge Function: cancel-subscription
 * Annuler un abonnement Stripe
 *
 * Priorité: HAUTE
 * Date: 6 décembre 2025
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface RequestBody {
  subscriptionId?: string;
  enterpriseId?: string;
  cancelAtPeriodEnd?: boolean;
  reason?: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

interface SuccessResponse {
  success: boolean;
  subscription: Stripe.Subscription;
  message: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  try {
    console.log('[cancel-subscription] Function invoked');

    // ========================================
    // 1. VÉRIFICATION DES VARIABLES D'ENVIRONNEMENT
    // ========================================
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
      console.error('[cancel-subscription] Missing environment variables');
      return new Response(
        JSON.stringify({
          error: 'Server configuration error',
          details: 'Missing required environment variables'
        } as ErrorResponse),
        { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-08-16' });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ========================================
    // 2. AUTHENTIFICATION
    // ========================================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[cancel-subscription] No authorization header');
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          details: 'No authorization header provided'
        } as ErrorResponse),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('[cancel-subscription] Authentication failed:', authError);
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          details: 'Invalid or expired token'
        } as ErrorResponse),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log('[cancel-subscription] User authenticated:', user.id);

    // ========================================
    // 3. RÉCUPÉRER LES PARAMÈTRES
    // ========================================
    const body: RequestBody = await req.json();
    const { subscriptionId, enterpriseId, cancelAtPeriodEnd = true, reason } = body;

    console.log('[cancel-subscription] Request params:', {
      subscriptionId,
      enterpriseId,
      cancelAtPeriodEnd,
      reason
    });

    // ========================================
    // 4. RÉCUPÉRER L'ABONNEMENT
    // ========================================
    let stripeSubscriptionId = subscriptionId;

    // Si enterpriseId fourni, récupérer le subscription ID depuis la DB
    if (!stripeSubscriptionId && enterpriseId) {
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('stripe_subscription_id')
        .eq('id', enterpriseId)
        .single();

      if (companyError || !companyData) {
        console.error('[cancel-subscription] Company not found:', companyError);
        return new Response(
          JSON.stringify({
            error: 'Company not found',
            details: 'Unable to find company with provided ID'
          } as ErrorResponse),
          { status: 404, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }

      stripeSubscriptionId = companyData.stripe_subscription_id;
    }

    if (!stripeSubscriptionId) {
      console.error('[cancel-subscription] No subscription ID provided');
      return new Response(
        JSON.stringify({
          error: 'Missing subscription ID',
          details: 'Either subscriptionId or enterpriseId must be provided'
        } as ErrorResponse),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // 5. ANNULER L'ABONNEMENT STRIPE
    // ========================================
    console.log('[cancel-subscription] Canceling subscription:', stripeSubscriptionId);

    let subscription: Stripe.Subscription;

    if (cancelAtPeriodEnd) {
      // Annuler à la fin de la période
      subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
        cancel_at_period_end: true,
        metadata: {
          cancellation_reason: reason || 'User requested cancellation',
          cancelled_by: user.id,
          cancelled_at: new Date().toISOString()
        }
      });
      console.log('[cancel-subscription] Subscription will cancel at period end');
    } else {
      // Annuler immédiatement
      subscription = await stripe.subscriptions.cancel(stripeSubscriptionId, {
        invoice_now: false,
        prorate: false
      });
      console.log('[cancel-subscription] Subscription cancelled immediately');
    }

    // ========================================
    // 6. METTRE À JOUR LA BASE DE DONNÉES
    // ========================================
    if (enterpriseId) {
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          subscription_status: cancelAtPeriodEnd ? 'canceling' : 'canceled',
          subscription_cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', enterpriseId);

      if (updateError) {
        console.error('[cancel-subscription] Failed to update company:', updateError);
        // Ne pas échouer la requête, l'annulation Stripe a réussi
      }
    }

    // ========================================
    // 7. RETOURNER LA RÉPONSE
    // ========================================
    const message = cancelAtPeriodEnd
      ? 'Subscription will be cancelled at the end of the billing period'
      : 'Subscription cancelled immediately';

    return new Response(
      JSON.stringify({
        success: true,
        subscription,
        message
      } as SuccessResponse),
      {
        status: 200,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[cancel-subscription] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to cancel subscription',
        details: error.message
      } as ErrorResponse),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      }
    );
  }
});
