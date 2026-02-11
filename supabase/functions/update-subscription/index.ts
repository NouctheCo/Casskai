/**
 * CassKai - Edge Function: update-subscription
 * Mettre à jour un abonnement Stripe (changement de plan)
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
  newPriceId?: string;
  new_plan_id?: string;
  proration_behavior?: 'create_prorations' | 'none' | 'always_invoice';
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
    console.log('[update-subscription] Function invoked');

    // ========================================
    // 1. VÉRIFICATION DES VARIABLES D'ENVIRONNEMENT
    // ========================================
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
      console.error('[update-subscription] Missing environment variables');
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
      console.error('[update-subscription] No authorization header');
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
      console.error('[update-subscription] Authentication failed:', authError);
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          details: 'Invalid or expired token'
        } as ErrorResponse),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log('[update-subscription] User authenticated:', user.id);

    // ========================================
    // 3. RÉCUPÉRER LES PARAMÈTRES
    // ========================================
    const body: RequestBody = await req.json();
    const {
      subscriptionId,
      enterpriseId,
      newPriceId,
      new_plan_id,
      proration_behavior = 'create_prorations'
    } = body;

    // Support both parameter names
    const priceId = newPriceId || new_plan_id;

    console.log('[update-subscription] Request params:', {
      subscriptionId,
      enterpriseId,
      priceId,
      proration_behavior
    });

    if (!priceId) {
      console.error('[update-subscription] No price ID provided');
      return new Response(
        JSON.stringify({
          error: 'Missing price ID',
          details: 'Either newPriceId or new_plan_id must be provided'
        } as ErrorResponse),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

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
        console.error('[update-subscription] Company not found:', companyError);
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
      console.error('[update-subscription] No subscription ID provided');
      return new Response(
        JSON.stringify({
          error: 'Missing subscription ID',
          details: 'Either subscriptionId or enterpriseId must be provided'
        } as ErrorResponse),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // 5. RÉCUPÉRER L'ABONNEMENT ACTUEL
    // ========================================
    console.log('[update-subscription] Fetching current subscription:', stripeSubscriptionId);

    const currentSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    if (!currentSubscription || currentSubscription.items.data.length === 0) {
      console.error('[update-subscription] Subscription not found or has no items');
      return new Response(
        JSON.stringify({
          error: 'Subscription not found',
          details: 'Unable to find active subscription'
        } as ErrorResponse),
        { status: 404, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // 6. METTRE À JOUR L'ABONNEMENT STRIPE
    // ========================================
    console.log('[update-subscription] Updating subscription to price:', priceId);

    const subscriptionItemId = currentSubscription.items.data[0].id;

    const updatedSubscription = await stripe.subscriptions.update(stripeSubscriptionId, {
      items: [{
        id: subscriptionItemId,
        price: priceId,
      }],
      proration_behavior: proration_behavior,
      metadata: {
        updated_by: user.id,
        updated_at: new Date().toISOString(),
        previous_price: currentSubscription.items.data[0].price.id
      }
    });

    console.log('[update-subscription] Subscription updated successfully');

    // ========================================
    // 7. METTRE À JOUR LA BASE DE DONNÉES
    // ========================================
    if (enterpriseId) {
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          stripe_price_id: priceId,
          subscription_status: updatedSubscription.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', enterpriseId);

      if (updateError) {
        console.error('[update-subscription] Failed to update company:', updateError);
        // Ne pas échouer la requête, la mise à jour Stripe a réussi
      }
    }

    // ========================================
    // 8. RETOURNER LA RÉPONSE
    // ========================================
    return new Response(
      JSON.stringify({
        success: true,
        subscription: updatedSubscription,
        message: 'Subscription updated successfully'
      } as SuccessResponse),
      {
        status: 200,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[update-subscription] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update subscription',
        details: error.message
      } as ErrorResponse),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      }
    );
  }
});
