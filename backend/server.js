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

// Trust proxy for reverse proxy setups (Traefik, Nginx, etc.)
// Use explicit safe ranges to avoid permissive trust-proxy warnings
app.set('trust proxy', ['127.0.0.1', '::1', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16']);

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

// Attach a payment method to a customer
app.post('/api/stripe/attach-payment-method', async (req, res) => {
  try {
    const { paymentMethodId, customerId } = req.body;
    if (!paymentMethodId || !customerId) {
      return res.status(400).json({ error: 'paymentMethodId and customerId are required' });
    }

    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    res.json(paymentMethod);
  } catch (error) {
    console.error('Error attaching payment method:', error);
    res.status(500).json({ error: error.message });
  }
});

// Detach a payment method from a customer
app.post('/api/stripe/detach-payment-method', async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    if (!paymentMethodId) {
      return res.status(400).json({ error: 'paymentMethodId is required' });
    }

    const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);

    res.json(paymentMethod);
  } catch (error) {
    console.error('Error detaching payment method:', error);
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

app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// 404 handler (avoid wildcard pattern that breaks path-to-regexp)
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// =================
// SECURE STRIPE ENDPOINTS
// =================

// Middleware: verify user owns this Stripe session (via DB record)
async function verifySessionOwnership(req, res, next) {
  try {
    const { session_id } = req.query || req.body;
    
    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }

    // Retrieve session metadata from DB to verify user ownership
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('user_id, stripe_subscription_id')
      .eq('stripe_subscription_id', session_id)
      .limit(1);

    if (error || !subscription || subscription.length === 0) {
      console.warn(`Unauthorized access attempt to session ${session_id}`);
      return res.status(403).json({ error: 'Unauthorized access to this session' });
    }

    // Store for next middleware
    req.sessionMetadata = subscription[0];
    next();
  } catch (err) {
    console.error('Session verification error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get session status (SECURED: verify ownership)
app.get('/api/stripe/session-status', verifySessionOwnership, async (req, res) => {
  try {
    const { session_id } = req.query;

    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    // Only return safe fields - NEVER return client_secret to frontend
    res.json({
      id: session.id,
      payment_status: session.payment_status,
      customer: session.customer,
      subscription: session.subscription,
      // Removed: client_secret (sensitive - only (SECURED with devOnlyProtection)
  app.get('/api/dev/kpis', devOnlyProtection, async (req, res) => {
    try {
      const companyId = String(req.query.companyId || req.headers['x-company-id'] || '').trim(
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// Dev-only: recompute KPIs on-demand
// -------------------------
// Middleware: strict dev-only protection
function devOnlyProtection(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    console.warn(`Unauthorized dev endpoint access from ${req.ip}`);
    return res.status(403).json({ error: 'This endpoint is not available in production' });
  }

  // In development, require explicit dev token or localhost
  const devToken = req.headers['x-dev-token'] || req.query.dev_token;
  const isLocalhost = req.ip === '127.0.0.1' || req.ip === '::1' || req.hostname === 'localhost';
  
  if (!isLocalhost && devToken !== process.env.DEV_TOKEN) {
    console.warn(`Dev token missing or invalid from ${req.ip}`);
    return res.status(401).json({ error: 'Dev token required for non-local access' });
  }

  next();
}

// server-side KPI cache (dev-only)
if (process.env.NODE_ENV !== 'production') {
  const serverKpiCache = new Map();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Helper to compute KPIs (same logic as recompute)
  async function computeKpisForCompany(companyId) {
    const startOfYear = `${new Date().getFullYear()}-01-01`;
    const endOfYear = `${new Date().getFullYear()}-12-31`;

    // invoices revenue
    const { data: invoices, error: invErr } = await supabase
      .from('invoices')
      .select('total_incl_tax, status, invoice_type, invoice_date')
      .eq('company_id', companyId)
      .eq('invoice_type', 'sale')
      .in('status', ['sent', 'paid', 'partially_paid'])
      .gte('invoice_date', startOfYear)
      .lte('invoice_date', endOfYear);

    let revenue = 0;
    if (!invErr && invoices && invoices.length > 0) {
      revenue = invoices.reduce((s, i) => s + Number(i.total_incl_tax || 0), 0);
    } else {
      const { data: accounts } = await supabase
        .from('chart_of_accounts')
        .select('current_balance')
        .eq('company_id', companyId)
        .eq('account_class', 7)
        .eq('is_active', true);
      if (accounts) revenue = accounts.reduce((s, a) => s + Math.abs(Number(a.current_balance || 0)), 0);
    }

    const { count: pendingCount } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('invoice_type', 'sale')
      .in('status', ['draft', 'sent', 'overdue'])
      .neq('status', 'cancelled');

    return { companyId, revenue, pendingInvoices: pendingCount || 0 };
  }

  // GET: return cached KPIs or compute and cache
  app.get('/api/dev/kpis', async (req, res) => {
    try {
      const companyId = String(req.query.companyId || req.headers['x-company-id'] || '');
      if (!companyId) return res.status(400).json({ error: 'companyId required (query or x-company-id header)' });

      const cached = serverKpiCache.get(companyId);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL && cached.isValid) {
        console.log('[dev/kpis] Returning cached KPIs for', companyId);
        return res.json({ fromCache: true, ...cached.data });
      }

      console.log('[dev/kpis] Computing KPIs for', companyId);
      const data = await computeKpisForCompany(companyId);
      serverKpiCache.set(companyId, { data, timestamp: Date.now(), isValid: true });
      return res.json({ fromCache: false, ...data });
    } catch (err) {
      console.error('[dev/kpis] Error:', err);
      return res.status(500).json({ error: String(err) });
    }
  });

  // POST: clear cache for a company or all (SECURED with devOnlyProtection)
  app.post('/api/dev/kpis/clear', devOnlyProtection, (req, res) => {
    try {
      const companyId = (req.body?.companyId || req.query.companyId || req.headers['x-company-id'] || '').toString().trim();
      if (companyId) {
        serverKpiCache.delete(companyId);
        console.log(`[dev/kpis/clear] Cleared cache for ${companyId} from ${req.ip}`);
        return res.json({ cleared: companyId });
      }
      serverKpiCache.clear();
      console.log(`[dev/kpis/clear] Cleared all KPI cache from ${req.ip}`);
      return res.json({ cleared: 'all' });
    } catch (err) {
      console.error('[dev/kpis/clear] Error:', err);
      return res.status(500).json({ error: String(err) });
    }
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CassKai Stripe Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Webhook endpoint: http://localhost:${PORT}/webhook`);
});

export default app;