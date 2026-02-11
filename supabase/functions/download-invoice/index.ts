/**
 * CassKai - Edge Function: download-invoice
 * Télécharger le PDF d'une facture Stripe
 *
 * Priorité: MOYENNE
 * Date: 6 décembre 2025
 */

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface RequestBody {
  invoice_id: string;
  download_format?: 'url' | 'pdf'; // 'url' retourne l'URL, 'pdf' redirige vers le PDF
}

interface ErrorResponse {
  error: string;
  details?: string;
}

interface SuccessResponse {
  success: boolean;
  invoice_id: string;
  invoice_number?: string;
  pdf_url?: string;
  hosted_url?: string;
  download_url?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  const corsH = getCorsHeaders(req);

  try {
    console.log('[download-invoice] Function invoked');

    // ========================================
    // 1. VÉRIFICATION DES VARIABLES D'ENVIRONNEMENT
    // ========================================
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
      console.error('[download-invoice] Missing environment variables');
      return new Response(
        JSON.stringify({
          error: 'Server configuration error',
          details: 'Missing required environment variables'
        } as ErrorResponse),
        {
          status: 500,
          headers: { ...corsH, 'Content-Type': 'application/json' },
        }
      );
    }

    // ========================================
    // 2. AUTHENTIFICATION JWT
    // ========================================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[download-invoice] No authorization header');
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          details: 'Missing authorization header'
        } as ErrorResponse),
        {
          status: 401,
          headers: { ...corsH, 'Content-Type': 'application/json' },
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
      console.error('[download-invoice] Authentication failed:', authError);
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          details: 'Invalid or expired token'
        } as ErrorResponse),
        {
          status: 401,
          headers: { ...corsH, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[download-invoice] User authenticated:', user.id);

    // ========================================
    // 3. RÉCUPÉRATION ET VALIDATION DES DONNÉES
    // ========================================
    const body: RequestBody = await req.json();
    const { invoice_id, download_format = 'url' } = body;

    if (!invoice_id) {
      return new Response(
        JSON.stringify({
          error: 'Missing parameter',
          details: 'invoice_id is required'
        } as ErrorResponse),
        {
          status: 400,
          headers: { ...corsH, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validation du format
    if (!['url', 'pdf'].includes(download_format)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid parameter',
          details: 'download_format must be "url" or "pdf"'
        } as ErrorResponse),
        {
          status: 400,
          headers: { ...corsH, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[download-invoice] Fetching invoice:', invoice_id);

    // ========================================
    // 4. RÉCUPÉRATION DU STRIPE CUSTOMER ID
    // ========================================
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subError || !subscription?.stripe_customer_id) {
      console.error('[download-invoice] No Stripe customer found:', subError);
      return new Response(
        JSON.stringify({
          error: 'No subscription found',
          details: 'User does not have a Stripe customer ID'
        } as ErrorResponse),
        {
          status: 404,
          headers: { ...corsH, 'Content-Type': 'application/json' },
        }
      );
    }

    const stripeCustomerId = subscription.stripe_customer_id;
    console.log('[download-invoice] Stripe customer ID:', stripeCustomerId);

    // ========================================
    // 5. INITIALISATION DE STRIPE
    // ========================================
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // ========================================
    // 6. RÉCUPÉRATION DE LA FACTURE DEPUIS STRIPE
    // ========================================
    let invoice: Stripe.Invoice;
    try {
      invoice = await stripe.invoices.retrieve(invoice_id);
    } catch (error) {
      console.error('[download-invoice] Invoice not found:', error);
      return new Response(
        JSON.stringify({
          error: 'Invoice not found',
          details: 'The specified invoice does not exist'
        } as ErrorResponse),
        {
          status: 404,
          headers: { ...corsH, 'Content-Type': 'application/json' },
        }
      );
    }

    // ========================================
    // 7. VÉRIFICATION DE PROPRIÉTÉ
    // ========================================
    if (invoice.customer !== stripeCustomerId) {
      console.error('[download-invoice] Invoice does not belong to user');
      return new Response(
        JSON.stringify({
          error: 'Forbidden',
          details: 'This invoice does not belong to you'
        } as ErrorResponse),
        {
          status: 403,
          headers: { ...corsH, 'Content-Type': 'application/json' },
        }
      );
    }

    // ========================================
    // 8. VÉRIFICATION QUE LE PDF EXISTE
    // ========================================
    if (!invoice.invoice_pdf) {
      console.error('[download-invoice] Invoice PDF not available');
      return new Response(
        JSON.stringify({
          error: 'PDF not available',
          details: 'PDF is not available for this invoice'
        } as ErrorResponse),
        {
          status: 404,
          headers: { ...corsH, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[download-invoice] Invoice verified, PDF URL:', invoice.invoice_pdf);

    // ========================================
    // 9. LOGGING RGPD
    // ========================================
    const logResult = await supabaseAdmin
      .from('rgpd_logs')
      .insert({
        user_id: user.id,
        action_type: 'data_access',
        action_category: 'access',
        description: `User downloaded invoice ${invoice.number || invoice_id}`,
        severity: 'low',
        status: 'success',
        metadata: {
          invoice_id,
          invoice_number: invoice.number,
          amount: invoice.total,
          currency: invoice.currency,
          download_format
        }
      });

    if (logResult.error) {
      console.warn('[download-invoice] Failed to log action:', logResult.error);
    }

    // ========================================
    // 10. RÉPONSE SELON LE FORMAT
    // ========================================
    if (download_format === 'pdf') {
      // Rediriger directement vers le PDF Stripe
      console.log('[download-invoice] Redirecting to PDF');
      return new Response(null, {
        status: 302,
        headers: {
          ...corsH,
          'Location': invoice.invoice_pdf
        },
      });
    } else {
      // Retourner les URLs en JSON
      console.log('[download-invoice] Returning URLs');
      return new Response(
        JSON.stringify({
          success: true,
          invoice_id: invoice.id,
          invoice_number: invoice.number || undefined,
          pdf_url: invoice.invoice_pdf,
          hosted_url: invoice.hosted_invoice_url || undefined,
          download_url: invoice.invoice_pdf
        } as SuccessResponse),
        {
          status: 200,
          headers: { ...corsH, 'Content-Type': 'application/json' },
        }
      );
    }

  } catch (error) {
    console.error('[download-invoice] Unexpected error:', error);

    // Gérer les erreurs Stripe spécifiques
    if (error instanceof Stripe.errors.StripeError) {
      return new Response(
        JSON.stringify({
          error: 'Stripe error',
          details: error.message
        } as ErrorResponse),
        {
          status: error.statusCode || 500,
          headers: { ...corsH, 'Content-Type': 'application/json' },
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
        headers: { ...corsH, 'Content-Type': 'application/json' },
      }
    );
  }
});
