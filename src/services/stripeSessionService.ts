import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.VITE_STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-08-27.basil' as any
});

/**
 * Get Stripe checkout session status
 * Used by PaymentConfirmationPage to verify payment success
 */
export async function getSessionStatus(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    return {
      id: session.id,
      payment_status: session.payment_status, // 'paid' | 'unpaid' | 'no_payment_required'
      customer: session.customer,
      subscription: session.subscription,
      client_secret: session.client_secret,
      url: session.url,
    };
  } catch (error) {
    console.error('Error retrieving session status:', error);
    throw error;
  }
}

/**
 * Get subscription details from Stripe
 */
export async function getSubscriptionDetails(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    return {
      id: subscription.id,
      status: subscription.status,
      customer: subscription.customer,
      current_period_start: (subscription as any).current_period_start || subscription.created,
      current_period_end: (subscription as any).current_period_end || subscription.created,
      items: subscription.items.data.map(item => ({
        id: item.id,
        price: (item.price as any)?.id,
        quantity: item.quantity,
      })),
      metadata: subscription.metadata,
    };
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    throw error;
  }
}

/**
 * Get customer's payment methods
 */
export async function getCustomerPaymentMethods(customerId: string) {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
    
    return paymentMethods.data.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: {
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        exp_month: pm.card?.exp_month,
        exp_year: pm.card?.exp_year,
      },
      billing_details: pm.billing_details,
    }));
  } catch (error) {
    console.error('Error retrieving payment methods:', error);
    throw error;
  }
}
