import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.9.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Validation stricte des variables d'environnement - Fail-fast security
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Vérifier que toutes les variables requises sont configurées
if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required')
}
if (!supabaseUrl) {
  throw new Error('SUPABASE_URL environment variable is required')
}
if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required')
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-08-16',
})

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Edge Function called - create-checkout-session');
    console.log('📋 Request method:', req.method);

    // SÉCURITÉ: Validation de l'authentification JWT
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      console.error('❌ Security: Missing authorization header')
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Extraire et vérifier le token JWT
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('❌ Security: Invalid JWT token', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid authentication token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ User authenticated:', user.email)

    const requestBody = await req.json();
    const { planId, userId } = requestBody;

    console.log('📦 Request body:', { planId, userId });

    if (!planId || !userId) {
      throw new Error('Missing required parameters: planId and userId');
    }

    // SÉCURITÉ: Vérifier que l'utilisateur authentifié correspond au userId demandé
    if (user.id !== userId) {
      console.error('❌ Security: User ID mismatch', { authenticated: user.id, requested: userId })
      return new Response(
        JSON.stringify({ error: 'Forbidden: Cannot create checkout for another user' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('🎯 Creating checkout session for:', { planId, userId: user.id })

    // Handle free plan
    if (planId === 'free') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Free plan selected - no payment required',
          redirect: '/dashboard'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Get plan details from database
    // Map frontend plan IDs to database plan_ids
    const planIdMapping: Record<string, string> = {
      'starter_monthly': 'starter_monthly',
      'starter_yearly': 'starter_yearly',
      'pro_monthly': 'pro_monthly',
      'pro_yearly': 'pro_yearly',
      'enterprise_monthly': 'enterprise_monthly',
      'enterprise_yearly': 'enterprise_yearly',
      // Legacy compatibility
      'starter': 'starter_monthly',
      'professional': 'pro_monthly',
      'enterprise': 'enterprise_monthly',
      'pro': 'pro_monthly',
    };

    const dbPlanId = planIdMapping[planId] || planId;
    console.log('Plan mapping:', { originalPlanId: planId, mappedPlanId: dbPlanId });

    // Définir le Price ID à utiliser - d'abord essayer les prix codés en dur
    const hardcodedPrices = {
      'starter_monthly': 'price_1S41hYR73rjyEju0EKgIBDHu',
      'starter_yearly': 'price_1S41abR73rjyEju0VG4dhoo4',
      'pro_monthly': 'price_1S41glR73rjyEju0evm9xCiz',
      'pro_yearly': 'price_1S41buR73rjyEju0CVANPm3D',
      'enterprise_monthly': 'price_1S41gHR73rjyEju0YsNBUoZb',
      'enterprise_yearly': 'price_1S41d1R73rjyEju0t6a2GBwo',
      'trial': 'price_1S82ISR73rjyEju0Dklrlubp',
    };

    let finalPriceId = hardcodedPrices[dbPlanId];

    if (!finalPriceId) {
      // Si pas de prix codé en dur, essayer la base de données
      const { data: planData, error: planError } = await supabase
        .from('subscription_plans')
        .select('plan_id, name, price, billing_cycle, stripe_price_id')
        .eq('plan_id', dbPlanId)
        .single()

      if (planData && !planError) {
        finalPriceId = planData.stripe_price_id || planData.plan_id;
        console.log('Found plan in database:', planData);
      }
    }

    if (!finalPriceId) {
      throw new Error(`No price ID found for plan: ${planId} (mapped to ${dbPlanId})`);
    }

    console.log('✅ Using Price ID:', { planId, dbPlanId, finalPriceId });

    // SÉCURITÉ: Utiliser les vraies données de l'utilisateur authentifié
    console.log('👤 Using authenticated user data:', { email: user.email, id: user.id });

    // Create or get Stripe customer
    console.log('💳 Looking for existing Stripe customer...');
    let customerId: string
    try {
      const { data: existingCustomer } = await supabase
        .from('stripe_customers')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .single()

      console.log('💳 Existing customer lookup result:', existingCustomer);

      if (existingCustomer?.stripe_customer_id) {
        customerId = existingCustomer.stripe_customer_id;
        console.log('✅ Using existing customer:', customerId);
      } else {
        console.log('🆕 Creating new Stripe customer...');
        // Create new Stripe customer avec l'email réel de l'utilisateur authentifié
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            user_id: user.id,
          },
        });
        customerId = customer.id;
        console.log('✅ Created new Stripe customer:', customerId);

        // Store customer ID in database
        console.log('💾 Storing customer ID in database...');
        const { error: insertError } = await supabase
          .from('stripe_customers')
          .insert({
            user_id: user.id,
            stripe_customer_id: customerId,
          });

        if (insertError) {
          console.error('❌ Error storing customer ID:', insertError);
          // Ne pas échouer pour ça, continuer
        } else {
          console.log('✅ Customer ID stored in database');
        }
      }
    } catch (customerError) {
      console.error('💥 Error with Stripe customer:', customerError);
      throw customerError;
    }

    // Create checkout session avec le Price ID Stripe
    console.log('💰 Creating Stripe checkout session with Price ID:', finalPriceId);
    console.log('👤 Using customer ID:', customerId);

    let session;
    try {
      const origin = req.headers.get('origin') || 'https://casskai.app';
      console.log('🌐 Using origin for URLs:', origin);

      session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: finalPriceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${origin}/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/stripe/cancel`,
        metadata: {
          user_id: user.id,
          plan_id: planId,
        },
      });

      console.log('🎉 Stripe session created successfully:', session.id);
    } catch (stripeError) {
      console.error('💥 Stripe session creation failed:', stripeError);
      throw stripeError;
    }

    const response = {
      sessionId: session.id,
      url: session.url,
      success: true
    };

    console.log('📤 Returning response:', response);

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('💥 Error creating checkout session:', error);
    console.error('💥 Error type:', typeof error);
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('💥 Error message:', error instanceof Error ? error.message : String(error));

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = {
      error: errorMessage,
      type: typeof error,
      timestamp: new Date().toISOString(),
      function: 'create-checkout-session',
      stack: error instanceof Error ? error.stack : undefined
    };

    console.error('💥 Returning error response:', errorDetails);

    return new Response(
      JSON.stringify(errorDetails),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})