/**
 * CassKai - Edge Function: get-invoices
 * Récupérer la liste des factures Stripe de l'utilisateur
 *
 * Comportement robuste : retourne toujours { invoices: [] } en cas d'erreur
 * pour éviter les crashes côté client
 */

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  const corsH = getCorsHeaders(req);

  try {
    console.log('[get-invoices] Function invoked');

    // ========================================
    // 1. VÉRIFICATION DE LA CLÉ STRIPE
    // ========================================
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    // Si pas de clé Stripe configurée, retourner liste vide
    if (!stripeSecretKey) {
      console.log('[get-invoices] No Stripe key configured - returning empty list');
      return new Response(
        JSON.stringify({ invoices: [] }),
        {
          status: 200,
          headers: { ...corsH, 'Content-Type': 'application/json' }
        }
      );
    }

    // ========================================
    // 2. AUTHENTIFICATION
    // ========================================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('[get-invoices] No auth header - returning empty list');
      return new Response(
        JSON.stringify({ invoices: [] }),
        {
          status: 200,
          headers: { ...corsH, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('[get-invoices] Auth failed - returning empty list');
      return new Response(
        JSON.stringify({ invoices: [] }),
        {
          status: 200,
          headers: { ...corsH, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[get-invoices] User authenticated:', user.id);

    // ========================================
    // 3. RÉCUPÉRATION DU STRIPE CUSTOMER ID
    // ========================================
    // Essayer d'abord depuis profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let stripeCustomerId = profile?.stripe_customer_id;

    // Si pas trouvé dans profiles, essayer dans subscriptions
    if (!stripeCustomerId) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      stripeCustomerId = subscription?.stripe_customer_id;
    }

    // Si toujours pas de customer Stripe, retourner liste vide (PAS d'erreur)
    if (!stripeCustomerId) {
      console.log('[get-invoices] No Stripe customer for user:', user.id, '- returning empty list');
      return new Response(
        JSON.stringify({ invoices: [] }),
        {
          status: 200,
          headers: { ...corsH, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[get-invoices] Stripe customer ID:', stripeCustomerId);

    // ========================================
    // 4. RÉCUPÉRATION DES FACTURES STRIPE
    // ========================================
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient()
    });

    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: 100,
    });

    console.log('[get-invoices] Found', invoices.data.length, 'invoices');

    // ========================================
    // 5. FORMATAGE ET RETOUR
    // ========================================
    const formattedInvoices = invoices.data.map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      currency: invoice.currency,
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      amount_remaining: invoice.amount_remaining,
      created: invoice.created,
      due_date: invoice.due_date,
      paid: invoice.paid,
      paid_at: invoice.status_transitions?.paid_at,
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
      period_start: invoice.period_start,
      period_end: invoice.period_end,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      total: invoice.total,
      description: invoice.description,
      lines: {
        data: invoice.lines.data.map(line => ({
          id: line.id,
          description: line.description,
          amount: line.amount,
          currency: line.currency,
          quantity: line.quantity,
          price: line.price,
          period: line.period
        }))
      }
    }));

    return new Response(
      JSON.stringify({
        invoices: formattedInvoices,
        has_more: invoices.has_more
      }),
      {
        status: 200,
        headers: { ...corsH, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[get-invoices] Error:', error.message || error);

    // IMPORTANT : Retourner liste vide même en cas d'erreur (pas de crash côté client)
    return new Response(
      JSON.stringify({
        invoices: [],
        error: error.message || 'Unknown error'
      }),
      {
        status: 200, // Status 200 pour éviter les rejets de promesse
        headers: { ...corsH, 'Content-Type': 'application/json' }
      }
    );
  }
});
