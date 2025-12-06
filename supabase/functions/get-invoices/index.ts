/**
 * CassKai - Edge Function: get-invoices
 * Récupérer la liste des factures Stripe de l'utilisateur
 *
 * Priorité: MOYENNE
 * Date: 6 décembre 2025
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  limit?: number;
  starting_after?: string;
  ending_before?: string;
  status?: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
}

interface ErrorResponse {
  error: string;
  details?: string;
}

interface SuccessResponse {
  success: boolean;
  invoices: Stripe.Invoice[];
  has_more: boolean;
  total_count?: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[get-invoices] Function invoked');

    // ========================================
    // 1. VÉRIFICATION DES VARIABLES D'ENVIRONNEMENT
    // ========================================
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
      console.error('[get-invoices] Missing environment variables');
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
      console.error('[get-invoices] No authorization header');
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
      console.error('[get-invoices] Authentication failed:', authError);
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

    console.log('[get-invoices] User authenticated:', user.id);

    // ========================================
    // 3. RÉCUPÉRATION DU STRIPE CUSTOMER ID
    // ========================================
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subError || !subscription?.stripe_customer_id) {
      console.error('[get-invoices] No Stripe customer found:', subError);
      return new Response(
        JSON.stringify({
          error: 'No subscription found',
          details: 'User does not have a Stripe customer ID'
        } as ErrorResponse),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const stripeCustomerId = subscription.stripe_customer_id;
    console.log('[get-invoices] Stripe customer ID:', stripeCustomerId);

    // ========================================
    // 4. RÉCUPÉRATION DES PARAMÈTRES
    // ========================================
    const body: RequestBody = await req.json().catch(() => ({}));
    const {
      limit = 10,
      starting_after,
      ending_before,
      status
    } = body;

    // Validation de la limite
    const validatedLimit = Math.min(Math.max(limit, 1), 100); // Entre 1 et 100

    // ========================================
    // 5. INITIALISATION DE STRIPE
    // ========================================
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // ========================================
    // 6. RÉCUPÉRATION DES FACTURES DEPUIS STRIPE
    // ========================================
    const invoiceParams: Stripe.InvoiceListParams = {
      customer: stripeCustomerId,
      limit: validatedLimit,
    };

    // Ajouter les paramètres de pagination
    if (starting_after) {
      invoiceParams.starting_after = starting_after;
    }
    if (ending_before) {
      invoiceParams.ending_before = ending_before;
    }

    // Ajouter le filtre de status
    if (status) {
      invoiceParams.status = status;
    }

    console.log('[get-invoices] Fetching invoices with params:', invoiceParams);

    const invoices = await stripe.invoices.list(invoiceParams);

    console.log('[get-invoices] Found', invoices.data.length, 'invoices');

    // ========================================
    // 7. FORMATAGE DES FACTURES
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

    // ========================================
    // 8. LOGGING RGPD (Optionnel - accès aux données)
    // ========================================
    const logResult = await supabaseAdmin
      .from('rgpd_logs')
      .insert({
        user_id: user.id,
        action_type: 'data_access',
        action_category: 'access',
        description: `User accessed their invoices (${invoices.data.length} invoices)`,
        severity: 'low',
        status: 'success',
        metadata: {
          invoice_count: invoices.data.length,
          has_more: invoices.has_more,
          stripe_customer_id: stripeCustomerId
        }
      });

    if (logResult.error) {
      console.warn('[get-invoices] Failed to log action:', logResult.error);
    }

    // ========================================
    // 9. RÉPONSE SUCCÈS
    // ========================================
    return new Response(
      JSON.stringify({
        success: true,
        invoices: formattedInvoices,
        has_more: invoices.has_more,
        total_count: invoices.data.length
      } as SuccessResponse),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[get-invoices] Unexpected error:', error);

    // Gérer les erreurs Stripe spécifiques
    if (error instanceof Stripe.errors.StripeError) {
      return new Response(
        JSON.stringify({
          error: 'Stripe error',
          details: error.message
        } as ErrorResponse),
        {
          status: error.statusCode || 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

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
