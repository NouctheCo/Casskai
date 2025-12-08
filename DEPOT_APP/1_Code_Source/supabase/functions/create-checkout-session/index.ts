import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.9.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 create-checkout-session called');

    // ============================================
    // 1. VÉRIFIER LES VARIABLES D'ENVIRONNEMENT
    // ============================================
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeSecretKey) throw new Error('STRIPE_SECRET_KEY not configured');
    if (!supabaseUrl) throw new Error('SUPABASE_URL not configured');
    if (!supabaseServiceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-08-16' });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ============================================
    // 2. RÉCUPÉRER LES PRICE IDs DEPUIS LES SECRETS
    // ============================================
    const priceIds: Record<string, string | undefined> = {
      'starter_monthly': Deno.env.get('STRIPE_PRICE_STARTER_MONTHLY'),
      'starter_yearly': Deno.env.get('STRIPE_PRICE_STARTER_YEARLY'),
      'pro_monthly': Deno.env.get('STRIPE_PRICE_PRO_MONTHLY'),
      'pro_yearly': Deno.env.get('STRIPE_PRICE_PRO_YEARLY'),
      'enterprise_monthly': Deno.env.get('STRIPE_PRICE_ENTERPRISE_MONTHLY'),
      'enterprise_yearly': Deno.env.get('STRIPE_PRICE_ENTERPRISE_YEARLY'),
      'trial': Deno.env.get('STRIPE_PRICE_TRIAL'),
      // Alias avec tirets
      'starter-monthly': Deno.env.get('STRIPE_PRICE_STARTER_MONTHLY'),
      'starter-yearly': Deno.env.get('STRIPE_PRICE_STARTER_YEARLY'),
      'pro-monthly': Deno.env.get('STRIPE_PRICE_PRO_MONTHLY'),
      'pro-yearly': Deno.env.get('STRIPE_PRICE_PRO_YEARLY'),
      'enterprise-monthly': Deno.env.get('STRIPE_PRICE_ENTERPRISE_MONTHLY'),
      'enterprise-yearly': Deno.env.get('STRIPE_PRICE_ENTERPRISE_YEARLY'),
    };

    console.log('📋 Price IDs loaded from secrets:', {
      starter_monthly: !!priceIds['starter_monthly'],
      starter_yearly: !!priceIds['starter_yearly'],
      pro_monthly: !!priceIds['pro_monthly'],
      pro_yearly: !!priceIds['pro_yearly'],
      enterprise_monthly: !!priceIds['enterprise_monthly'],
      enterprise_yearly: !!priceIds['enterprise_yearly'],
      trial: !!priceIds['trial'],
    });

    // ============================================
    // 3. AUTHENTIFICATION - Récupérer userId du JWT
    // ============================================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non authentifié - Authorization header manquant' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Session expirée ou invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const userEmail = user.email;
    console.log('✅ User authenticated:', userId);

    // ============================================
    // 4. RÉCUPÉRER LES PARAMÈTRES
    // ============================================
    const requestBody = await req.json();
    let { planId, interval, currency = 'EUR' } = requestBody;

    console.log('📦 Request body:', { planId, interval, currency });

    if (!planId) {
      return new Response(
        JSON.stringify({ error: 'planId est requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // 5. MAPPING DES PLAN IDs (Compatibilité legacy)
    // ============================================
    const planIdMapping: Record<string, string> = {
      // Standard formats (pass-through)
      'starter_monthly': 'starter_monthly',
      'starter_yearly': 'starter_yearly',
      'pro_monthly': 'pro_monthly',
      'pro_yearly': 'pro_yearly',
      'enterprise_monthly': 'enterprise_monthly',
      'enterprise_yearly': 'enterprise_yearly',
      // Legacy compatibility - formats avec "professional"
      'professional': 'pro_monthly',
      'professional_monthly': 'pro_monthly',
      'professional_yearly': 'pro_yearly',
      // Legacy compatibility - formats courts
      'starter': 'starter_monthly',
      'pro': 'pro_monthly',
      'enterprise': 'enterprise_monthly',
      // Legacy compatibility - formats avec tirets
      'starter-monthly': 'starter_monthly',
      'starter-yearly': 'starter_yearly',
      'pro-monthly': 'pro_monthly',
      'pro-yearly': 'pro_yearly',
      'professional-monthly': 'pro_monthly',
      'professional-yearly': 'pro_yearly',
      'enterprise-monthly': 'enterprise_monthly',
      'enterprise-yearly': 'enterprise_yearly',
    };

    // Appliquer le mapping si le plan existe dans la table
    const mappedPlanId = planIdMapping[planId] || planId;

    // Si interval est fourni séparément et pas déjà dans le planId
    if (interval && !mappedPlanId.includes('_') && !mappedPlanId.includes('-')) {
      planId = `${mappedPlanId}_${interval}`;
    } else {
      planId = mappedPlanId;
    }

    console.log('🎯 Plan mapping:', { original: requestBody.planId, mapped: planId });

    // ============================================
    // 6. PLAN GRATUIT / TRIAL
    // ============================================
    if (planId === 'free') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Plan gratuit sélectionné',
          redirect: '/dashboard'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // 7. TROUVER LE PRICE ID
    // ============================================
    const priceId = priceIds[planId];

    if (!priceId) {
      console.error('❌ Unknown plan or missing secret:', planId);
      console.error('Available plans:', Object.keys(priceIds).filter(k => priceIds[k]));
      return new Response(
        JSON.stringify({
          error: `Plan inconnu ou secret non configuré: ${planId}`,
          hint: 'Vérifiez que le secret STRIPE_PRICE_xxx est configuré dans Supabase Edge Functions',
          requestedPlan: planId,
          availablePlans: Object.keys(priceIds).filter(k => priceIds[k])
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Price ID found:', priceId);

    // ============================================
    // 8. CRÉER OU RÉCUPÉRER LE CUSTOMER STRIPE
    // ============================================
    let customerId: string;

    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (existingCustomer?.stripe_customer_id) {
      customerId = existingCustomer.stripe_customer_id;
      console.log('✅ Existing Stripe customer:', customerId);
    } else {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;
      console.log('✅ New Stripe customer created:', customerId);

      await supabase.from('stripe_customers').insert({
        user_id: userId,
        stripe_customer_id: customerId,
        customer_email: userEmail,
      });
    }

    // ============================================
    // 9. CRÉER LA SESSION CHECKOUT
    // ============================================
    const origin = req.headers.get('origin') || 'https://casskai.app';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${origin}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing?canceled=true`,
      metadata: {
        supabase_user_id: userId,
        plan_id: planId,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true },
      customer_update: {
        name: 'auto',
        address: 'auto',
      },
    });

    console.log('🎉 Checkout session created:', session.id);

    return new Response(
      JSON.stringify({
        success: true,
        sessionId: session.id,
        url: session.url,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erreur serveur',
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
