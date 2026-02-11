// Edge Function: create-portal-session
// Description: Cr�e une session du portail client Stripe pour g�rer l'abonnement

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.10.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  try {
    console.log('=� Edge Function called - create-portal-session');

    // V�rification de l'authentification
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
        }
      )
    }

    // Cr�er un client Supabase avec le token utilisateur
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Creating portal session for user: ${user.id}`)

    // R�cup�rer le stripe_customer_id depuis la table existante stripe_customers
    const { data: customer, error: customerError } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (customerError || !customer) {
      console.error('No Stripe customer found for user:', user.id)
      return new Response(
        JSON.stringify({
          error: 'No Stripe customer found. Please subscribe first.',
          code: 'NO_CUSTOMER'
        }),
        {
          status: 404,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Using Stripe customer: ${customer.stripe_customer_id}`)

    // Cr�er la session portail Stripe
    const origin = req.headers.get('origin') || 'https://casskai.app'
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: `${origin}/billing`,
    })

    console.log(`Portal session created: ${session.id}`)

    return new Response(
      JSON.stringify({
        url: session.url,
        success: true
      }),
      {
        headers: {
          ...getCorsHeaders(req),
          'Content-Type': 'application/json',
        }
      }
    )
  } catch (error) {
    console.error('Portal error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        type: typeof error,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      }
    )
  }
})
