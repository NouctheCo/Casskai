/**
 * CassKai - Edge Function: reactivate-subscription
 * Réactiver un abonnement Stripe annulé
 *
 * Priorité: HAUTE
 * Date: 6 décembre 2025
 */

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface RequestBody {
  subscriptionId?: string;
  enterpriseId?: string;
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
    console.log('[reactivate-subscription] Function invoked');

    // ========================================
    // 1. VÉRIFICATION DES VARIABLES D'ENVIRONNEMENT
    // ========================================
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
      console.error('[reactivate-subscription] Missing environment variables');
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
      console.error('[reactivate-subscription] No authorization header');
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
      console.error('[reactivate-subscription] Authentication failed:', authError);
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          details: 'Invalid or expired token'
        } as ErrorResponse),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log('[reactivate-subscription] User authenticated:', user.id);

    // ========================================
    // 3. RÉCUPÉRER LES PARAMÈTRES
    // ========================================
    const body: RequestBody = await req.json();
    const { subscriptionId, enterpriseId } = body;

    console.log('[reactivate-subscription] Request params:', {
      subscriptionId,
      enterpriseId
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
        console.error('[reactivate-subscription] Company not found:', companyError);
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
      console.error('[reactivate-subscription] No subscription ID provided');
      return new Response(
        JSON.stringify({
          error: 'Missing subscription ID',
          details: 'Either subscriptionId or enterpriseId must be provided'
        } as ErrorResponse),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // 5. VÉRIFIER L'ÉTAT ACTUEL DE L'ABONNEMENT
    // ========================================
    console.log('[reactivate-subscription] Fetching current subscription:', stripeSubscriptionId);

    const currentSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    if (!currentSubscription) {
      console.error('[reactivate-subscription] Subscription not found');
      return new Response(
        JSON.stringify({
          error: 'Subscription not found',
          details: 'Unable to find subscription with provided ID'
        } as ErrorResponse),
        { status: 404, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier si l'abonnement peut être réactivé
    if (currentSubscription.status === 'canceled') {
      console.error('[reactivate-subscription] Cannot reactivate fully canceled subscription');
      return new Response(
        JSON.stringify({
          error: 'Cannot reactivate subscription',
          details: 'Subscription has been fully canceled and cannot be reactivated. Please create a new subscription.'
        } as ErrorResponse),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    if (!currentSubscription.cancel_at_period_end) {
      console.log('[reactivate-subscription] Subscription is already active');
      return new Response(
        JSON.stringify({
          success: true,
          subscription: currentSubscription,
          message: 'Subscription is already active'
        } as SuccessResponse),
        { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // 6. RÉACTIVER L'ABONNEMENT STRIPE
    // ========================================
    console.log('[reactivate-subscription] Reactivating subscription');

    const reactivatedSubscription = await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: false,
      metadata: {
        reactivated_by: user.id,
        reactivated_at: new Date().toISOString()
      }
    });

    console.log('[reactivate-subscription] Subscription reactivated successfully');

    // ========================================
    // 7. METTRE À JOUR LA BASE DE DONNÉES
    // ========================================
    if (enterpriseId) {
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          subscription_status: 'active',
          subscription_cancel_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', enterpriseId);

      if (updateError) {
        console.error('[reactivate-subscription] Failed to update company:', updateError);
        // Ne pas échouer la requête, la réactivation Stripe a réussi
      }
    }

    // ========================================
    // 8. RETOURNER LA RÉPONSE
    // ========================================
    return new Response(
      JSON.stringify({
        success: true,
        subscription: reactivatedSubscription,
        message: 'Subscription reactivated successfully'
      } as SuccessResponse),
      {
        status: 200,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[reactivate-subscription] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to reactivate subscription',
        details: error.message
      } as ErrorResponse),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      }
    );
  }
});
