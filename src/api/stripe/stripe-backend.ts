// Backend API handlers pour Stripe
// À déployer comme API routes (Netlify Functions, Vercel API, ou Express.js)

import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

// IMPORTANT: Remplacez par votre vraie clé secrète
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_live_YOUR_SECRET_KEY_HERE';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_YOUR_WEBHOOK_SECRET_HERE';

if (!STRIPE_SECRET_KEY || STRIPE_SECRET_KEY.includes('YOUR_SECRET_KEY_HERE')) {
  throw new Error('STRIPE_SECRET_KEY must be set in environment variables');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// ================================
// CONFIGURATION DES PRODUITS
// ================================

export async function setupStripeProducts(plans: any[]) {
  try {
    const results = [];

    for (const plan of plans) {
      // Créer le produit
      const product = await stripe.products.create({
        id: `casskai_${plan.id}`,
        name: plan.name,
        description: plan.description,
        metadata: {
          plan_id: plan.id,
          app: 'casskai'
        }
      });

      // Créer le prix
      const price = await stripe.prices.create({
        unit_amount: Math.round(plan.price * 100), // En centimes
        currency: plan.currency.toLowerCase(),
        recurring: {
          interval: plan.interval
        },
        product: product.id,
        metadata: {
          plan_id: plan.id,
          app: 'casskai'
        }
      });

      results.push({
        product,
        price,
        plan_id: plan.id
      });

      // Mettre à jour dans Supabase
      await supabase
        .from('subscription_plans')
        .update({
          stripe_product_id: product.id,
          stripe_price_id: price.id
        })
        .eq('id', plan.id);
    }

    return { success: true, products: results };
  } catch (error) {
    console.error('Error setting up Stripe products:', error);
    throw error;
  }
}

// ================================
// SESSIONS DE CHECKOUT
// ================================

export async function createCheckoutSession(
  priceId: string,
  userId: string,
  planId: string,
  successUrl: string,
  cancelUrl: string,
  metadata: Record<string, string> = {}
) {
  try {
    // Récupérer ou créer le customer Stripe
    let customer;
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .single();

    if (existingSubscription?.stripe_customer_id) {
      customer = await stripe.customers.retrieve(existingSubscription.stripe_customer_id);
    } else {
      // Récupérer l'email de l'utilisateur depuis user_profiles
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('email, first_name, last_name')
        .eq('id', userId)
        .single();

      customer = await stripe.customers.create({
        email: userProfile?.email,
        name: `${userProfile?.first_name} ${userProfile?.last_name}`.trim(),
        metadata: {
          user_id: userId,
          app: 'casskai'
        }
      });
    }

    // Créer la session de checkout
    const session = await stripe.checkout.sessions.create({
      customer: typeof customer === 'string' ? customer : customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: userId,
        plan_id: planId,
        ...metadata
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          plan_id: planId,
          app: 'casskai'
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto'
      }
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

// ================================
// GESTION DES ABONNEMENTS
// ================================

export async function cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd
    });

    return subscription;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

export async function updateSubscription(subscriptionId: string, newPriceId: string) {
  try {
    // Récupérer l'abonnement actuel
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Mettre à jour le prix
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations',
    });

    return updatedSubscription;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

// ================================
// MÉTHODES DE PAIEMENT
// ================================

export async function attachPaymentMethod(paymentMethodId: string, customerId: string) {
  try {
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    return paymentMethod;
  } catch (error) {
    console.error('Error attaching payment method:', error);
    throw error;
  }
}

export async function detachPaymentMethod(paymentMethodId: string) {
  try {
    const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
    return paymentMethod;
  } catch (error) {
    console.error('Error detaching payment method:', error);
    throw error;
  }
}

// ================================
// PORTAIL DE FACTURATION
// ================================

export async function createPortalSession(customerId: string, returnUrl: string) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
}

// ================================
// WEBHOOKS STRIPE
// ================================

export async function handleStripeWebhook(payload: string, signature: string) {
  try {
    // Vérifier la signature
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      STRIPE_WEBHOOK_SECRET
    );

    // Enregistrer l'événement dans la base de données
    await supabase
      .from('stripe_webhooks')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        data: event.data,
        processed: false
      });

    // Traiter l'événement
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
        
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.warn(`Unhandled event type: ${event.type}`);
    }

    // Marquer l'événement comme traité
    await supabase
      .from('stripe_webhooks')
      .update({ processed: true })
      .eq('stripe_event_id', event.id);

    return { received: true };
  } catch (error) {
    console.error('Error handling webhook:', error);
    throw error;
  }
}

// ================================
// HANDLERS D'ÉVÉNEMENTS
// ================================

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  try {
    const userId = subscription.metadata.user_id;
    const planId = subscription.metadata.plan_id;
    
    if (!userId) {
      console.error('No user_id in subscription metadata');
      return;
    }

    // Mettre à jour ou créer l'abonnement dans Supabase
    const subscriptionData = {
      user_id: userId,
      plan_id: planId || 'starter',
      stripe_subscription_id: subscription.id,
      stripe_customer_id: typeof subscription.customer === 'string' 
        ? subscription.customer 
        : subscription.customer?.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      trial_start: subscription.trial_start 
        ? new Date(subscription.trial_start * 1000).toISOString()
        : null,
      trial_end: subscription.trial_end 
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      metadata: subscription.metadata,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('user_subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'stripe_subscription_id'
      });

    if (error) {
      console.error('Error updating subscription:', error);
    }
  } catch (error) {
    console.error('Error in handleSubscriptionChange:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    await supabase
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);
  } catch (error) {
    console.error('Error in handleSubscriptionDeleted:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = typeof invoice.subscription === 'string' 
      ? invoice.subscription 
      : invoice.subscription?.id;

    if (!subscriptionId) return;

    // Récupérer l'abonnement pour avoir le user_id
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (!subscription) return;

    // Enregistrer la facture
    await supabase
      .from('invoices_stripe')
      .upsert({
        user_id: subscription.user_id,
        subscription_id: subscriptionId,
        stripe_invoice_id: invoice.id,
        amount: (invoice.amount_paid || 0) / 100,
        currency: invoice.currency,
        status: invoice.status || 'paid',
        invoice_url: invoice.hosted_invoice_url,
        pdf_url: invoice.invoice_pdf,
        due_date: new Date((invoice.due_date || Date.now() / 1000) * 1000).toISOString(),
        paid_at: new Date().toISOString(),
      }, {
        onConflict: 'stripe_invoice_id'
      });
  } catch (error) {
    console.error('Error in handlePaymentSucceeded:', error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = typeof invoice.subscription === 'string' 
      ? invoice.subscription 
      : invoice.subscription?.id;

    if (subscriptionId) {
      await supabase
        .from('user_subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscriptionId);
    }
  } catch (error) {
    console.error('Error in handlePaymentFailed:', error);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const userId = session.metadata?.user_id;
    const planId = session.metadata?.plan_id;

    if (!userId || !planId) {
      console.error('Missing metadata in checkout session');
      return;
    }

    // L'abonnement sera géré par l'événement subscription.created
    console.warn(`Checkout completed for user ${userId}, plan ${planId}`);
  } catch (error) {
    console.error('Error in handleCheckoutCompleted:', error);
  }
}