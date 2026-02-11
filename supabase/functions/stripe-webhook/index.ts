import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0'
import Stripe from 'https://esm.sh/stripe@12.9.0'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { checkRateLimit, rateLimitResponse, getRateLimitPreset } from '../_shared/rate-limit.ts'

// Validation stricte des variables d'environnement - Fail-fast security
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

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
if (!endpointSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required')
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-08-16',
})

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  // Handle CORS preflight requests
  const preflightResponse = handleCorsPreflightRequest(req)
  if (preflightResponse) return preflightResponse

  // Rate limiting
  const rateLimit = checkRateLimit(req, getRateLimitPreset('stripe-webhook'))
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfter!, getCorsHeaders(req))
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: getCorsHeaders(req)
    })
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  // Sécurité: Toujours exiger la signature Stripe
  if (!sig) {
    console.error('❌ Security: Missing stripe-signature header')
    return new Response('Unauthorized: Missing webhook signature', {
      status: 401,
      headers: getCorsHeaders(req)
    })
  }

  let event: Stripe.Event

  try {
    // Vérification cryptographique de la signature Stripe
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    console.log('✅ Webhook signature verified successfully:', event.type)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('❌ Webhook signature verification failed:', errorMessage)
    return new Response(`Webhook Error: Invalid signature - ${errorMessage}`, {
      status: 401, // 401 au lieu de 400 pour indiquer un problème d'authentification
      headers: getCorsHeaders(req)
    })
  }

  console.log('Received webhook event:', event.type)

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error processing webhook:', errorMessage)
    return new Response(`Webhook error: ${errorMessage}`, {
      status: 500,
      headers: getCorsHeaders(req)
    })
  }
})

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout session completed:', session.id)

  const userId = session.metadata?.user_id
  if (!userId) {
    console.error('No user_id in session metadata')
    return
  }

  // Get subscription details from Stripe
  if (session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

    // Update or create subscription in database
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan_id: session.metadata?.plan_id || subscription.metadata?.plan_id || 'starter_monthly',
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        status: mapStripeStatus(subscription.status),
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Error updating subscription:', error)
      throw error
    }

    console.log('Subscription updated for user:', userId)
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Processing subscription created:', subscription.id)

  // Find user by customer ID
  const { data: existingSub, error: findError } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', subscription.customer)
    .single()

  if (findError || !existingSub) {
    console.error('Could not find user for subscription:', subscription.id)
    return
  }

  // Update subscription
  const { error } = await supabase
    .from('subscriptions')
    .update({
      stripe_subscription_id: subscription.id,
      status: mapStripeStatus(subscription.status),
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', existingSub.user_id)

  if (error) {
    console.error('Error updating subscription:', error)
    throw error
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Processing subscription updated:', subscription.id)

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: mapStripeStatus(subscription.status),
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating subscription:', error)
    throw error
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing subscription deleted:', subscription.id)

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error cancelling subscription:', error)
    throw error
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Processing invoice payment succeeded:', invoice.id)

  // Update subscription status if payment was for a subscription
  if (invoice.subscription) {
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', invoice.subscription)

    if (subError) {
      console.error('Error updating subscription after payment:', subError)
    }
  }

  // Store invoice information
  const { error: invoiceError } = await supabase
    .from('invoices_stripe')
    .upsert({
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: invoice.subscription as string,
      stripe_customer_id: invoice.customer as string,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status,
      invoice_url: invoice.hosted_invoice_url,
      invoice_pdf: invoice.invoice_pdf,
      period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
      period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
      user_id: invoice.metadata?.user_id, // Assuming user_id is stored in metadata
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'stripe_invoice_id'
    })

  if (invoiceError) {
    console.error('Error storing invoice:', invoiceError)
  } else {
    console.log('Invoice stored successfully:', invoice.id)
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processing invoice payment failed:', invoice.id)

  // Mark subscription as past_due if payment failed
  if (invoice.subscription) {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', invoice.subscription)

    if (error) {
      console.error('Error updating subscription after failed payment:', error)
    }
  }
}

function mapStripeStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case 'active':
      return 'active'
    case 'canceled':
      return 'cancelled'
    case 'incomplete':
      return 'incomplete'
    case 'incomplete_expired':
      return 'expired'
    case 'past_due':
      return 'past_due'
    case 'trialing':
      return 'trialing'
    default:
      return 'unknown'
  }
}