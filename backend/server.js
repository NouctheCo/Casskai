import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20'
});

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Webhook endpoint (before JSON parsing)
app.use('/webhook', express.raw({ type: 'application/json' }));

// JSON parsing for other routes
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    stripe: !!process.env.STRIPE_SECRET_KEY,
    supabase: !!process.env.SUPABASE_URL
  });
});

// =================
// STRIPE PRODUCTS & PRICES
// =================

// Create checkout session
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  try {
    const { priceId, userId, planId, successUrl, cancelUrl, metadata } = req.body;

    if (!priceId || !userId) {
      return res.status(400).json({ error: 'priceId and userId are required' });
    }

    // Get or create Stripe customer
    let customerId;
    const { data: existingCustomer } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .not('stripe_customer_id', 'is', null)
      .limit(1);

    if (existingCustomer && existingCustomer.length > 0) {
      customerId = existingCustomer[0].stripe_customer_id;
    } else {
      // Get user email from Supabase auth
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError || !user?.email) {
        return res.status(400).json({ error: 'User not found or no email' });
      }

      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: userId }
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
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
          plan_id: planId
        }
      }
    });

    res.json({
      url: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create billing portal session
app.post('/api/stripe/create-portal-session', async (req, res) => {
  try {
    const { customerId, returnUrl } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'customerId is required' });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || process.env.FRONTEND_URL,
    });

    res.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update subscription
app.post('/api/stripe/update-subscription', async (req, res) => {
  try {
    const { subscriptionId, newPriceId } = req.body;

    if (!subscriptionId || !newPriceId) {
      return res.status(400).json({ error: 'subscriptionId and newPriceId are required' });
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'always_invoice'
    });

    res.json({ subscription: updatedSubscription });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel subscription
app.post('/api/stripe/cancel-subscription', async (req, res) => {
  try {
    const { subscriptionId, cancelAtPeriodEnd = true } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'subscriptionId is required' });
    }

    let subscription;
    if (cancelAtPeriodEnd) {
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });
    } else {
      subscription = await stripe.subscriptions.cancel(subscriptionId);
    }

    res.json({ subscription });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// =================
// WEBHOOKS
// =================

app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// =================
// WEBHOOK HANDLERS
// =================

async function handleSubscriptionChange(subscription) {
  const userId = subscription.metadata.user_id;
  const planId = subscription.metadata.plan_id;

  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  const subscriptionData = {
    user_id: userId,
    plan_id: planId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    metadata: subscription.metadata,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('user_subscriptions')
    .upsert(subscriptionData, { 
      onConflict: 'stripe_subscription_id',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Error updating subscription in Supabase:', error);
  } else {
    console.log('Subscription updated successfully:', subscription.id);
  }
}

async function handleSubscriptionDeleted(subscription) {
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error marking subscription as canceled:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  // Save invoice to database
  const invoiceData = {
    user_id: invoice.metadata?.user_id || null,
    stripe_invoice_id: invoice.id,
    subscription_id: invoice.subscription,
    amount: (invoice.total / 100).toString(),
    currency: invoice.currency.toUpperCase(),
    status: 'paid',
    invoice_url: invoice.hosted_invoice_url,
    pdf_url: invoice.invoice_pdf,
    due_date: new Date(invoice.due_date * 1000).toISOString(),
    paid_at: new Date(invoice.status_transitions.paid_at * 1000).toISOString(),
    created_at: new Date(invoice.created * 1000).toISOString()
  };

  const { error } = await supabase
    .from('invoices')
    .upsert(invoiceData, { onConflict: 'stripe_invoice_id' });

  if (error) {
    console.error('Error saving invoice:', error);
  }
}

async function handleInvoicePaymentFailed(invoice) {
  const { error } = await supabase
    .from('invoices')
    .update({
      status: 'payment_failed',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_invoice_id', invoice.id);

  if (error) {
    console.error('Error updating invoice status:', error);
  }
}

// =================
// ERROR HANDLING
// =================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CassKai Stripe Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Webhook endpoint: http://localhost:${PORT}/webhook`);
});

export default app;