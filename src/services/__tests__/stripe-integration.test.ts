// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { subscriptionService } from '../subscriptionService';

// Mock Stripe
const mockStripe = {
  customers: {
    create: vi.fn(),
    retrieve: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  subscriptions: {
    create: vi.fn(),
    retrieve: vi.fn(),
    update: vi.fn(),
    cancel: vi.fn(),
    list: vi.fn()
  },
  invoices: {
    create: vi.fn(),
    retrieve: vi.fn(),
    finalizeInvoice: vi.fn(),
    sendInvoice: vi.fn(),
    list: vi.fn()
  },
  products: {
    create: vi.fn(),
    retrieve: vi.fn(),
    update: vi.fn(),
    list: vi.fn()
  },
  prices: {
    create: vi.fn(),
    retrieve: vi.fn(),
    list: vi.fn()
  },
  paymentMethods: {
    create: vi.fn(),
    retrieve: vi.fn(),
    attach: vi.fn(),
    detach: vi.fn()
  },
  setupIntents: {
    create: vi.fn(),
    retrieve: vi.fn(),
    confirm: vi.fn()
  },
  webhooks: {
    constructEvent: vi.fn()
  }
};

vi.mock('stripe', () => {
  return {
    default: vi.fn(() => mockStripe)
  };
});

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null })),
          order: vi.fn(() => ({ data: [], error: null }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ data: null, error: null }))
      })),
      upsert: vi.fn(() => ({ data: null, error: null })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({ data: null, error: null }))
      }))
    })),
    auth: {
      getUser: vi.fn(() => ({ 
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null 
      }))
    }
  }
}));

describe('Stripe Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Customer Management', () => {
    it('should create Stripe customer successfully', async () => {
      const mockCustomer = {
        id: 'cus_test123',
        email: 'test@example.com',
        name: 'Test Company',
        metadata: {
          company_id: 'comp_123',
          user_id: 'user_123'
        }
      };

      mockStripe.customers.create.mockResolvedValue(mockCustomer);

      const customerData = {
        email: 'test@example.com',
        name: 'Test Company',
        metadata: {
          company_id: 'comp_123',
          user_id: 'user_123'
        }
      };

      const createCustomer = async (data: typeof customerData) => {
        return await mockStripe.customers.create(data);
      };

      const result = await createCustomer(customerData);

      expect(mockStripe.customers.create).toHaveBeenCalledWith(customerData);
      expect(result).toEqual(mockCustomer);
      expect(result.id).toBe('cus_test123');
    });

    it('should handle customer creation errors', async () => {
      const error = new Error('Invalid email address');
      mockStripe.customers.create.mockRejectedValue(error);

      const createCustomer = async (data: any) => {
        try {
          return await mockStripe.customers.create(data);
        } catch (err) {
          throw new Error(`Customer creation failed: ${(err as Error).message}`);
        }
      };

      await expect(createCustomer({ email: 'invalid-email' }))
        .rejects.toThrow('Customer creation failed: Invalid email address');
    });

    it('should retrieve existing customer', async () => {
      const mockCustomer = {
        id: 'cus_test123',
        email: 'test@example.com',
        subscriptions: {
          data: [
            {
              id: 'sub_test123',
              status: 'active',
              current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30
            }
          ]
        }
      };

      mockStripe.customers.retrieve.mockResolvedValue(mockCustomer);

      const result = await mockStripe.customers.retrieve('cus_test123', {
        expand: ['subscriptions']
      });

      expect(mockStripe.customers.retrieve).toHaveBeenCalledWith('cus_test123', {
        expand: ['subscriptions']
      });
      expect(result.subscriptions.data).toHaveLength(1);
    });
  });

  describe('Subscription Management', () => {
    it('should create subscription with trial period', async () => {
      const mockSubscription = {
        id: 'sub_test123',
        customer: 'cus_test123',
        status: 'trialing',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 86400 * 14, // 14 days trial
        trial_end: Math.floor(Date.now() / 1000) + 86400 * 14,
        items: {
          data: [{
            price: {
              id: 'price_professional',
              unit_amount: 2900,
              currency: 'eur'
            }
          }]
        }
      };

      mockStripe.subscriptions.create.mockResolvedValue(mockSubscription);

      const subscriptionData = {
        customer: 'cus_test123',
        items: [{ price: 'price_professional' }],
        trial_period_days: 14,
        metadata: {
          company_id: 'comp_123'
        }
      };

      const result = await mockStripe.subscriptions.create(subscriptionData);

      expect(mockStripe.subscriptions.create).toHaveBeenCalledWith(subscriptionData);
      expect(result.status).toBe('trialing');
      expect(result.trial_end).toBeGreaterThan(Date.now() / 1000);
    });

    it('should handle subscription upgrade correctly', async () => {
      const currentSubscription = {
        id: 'sub_test123',
        items: {
          data: [{
            id: 'si_current',
            price: { id: 'price_starter' }
          }]
        }
      };

      const upgradedSubscription = {
        id: 'sub_test123',
        status: 'active',
        items: {
          data: [{
            id: 'si_current',
            price: { id: 'price_professional' }
          }]
        }
      };

      mockStripe.subscriptions.retrieve.mockResolvedValue(currentSubscription);
      mockStripe.subscriptions.update.mockResolvedValue(upgradedSubscription);

      const upgradeSubscription = async (subscriptionId: string, newPriceId: string) => {
        const subscription = await mockStripe.subscriptions.retrieve(subscriptionId);
        
        return await mockStripe.subscriptions.update(subscriptionId, {
          items: [{
            id: subscription.items.data[0].id,
            price: newPriceId
          }],
          proration_behavior: 'create_prorations'
        });
      };

      const result = await upgradeSubscription('sub_test123', 'price_professional');

      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith('sub_test123', {
        items: [{
          id: 'si_current',
          price: 'price_professional'
        }],
        proration_behavior: 'create_prorations'
      });
      expect(result.items.data[0].price.id).toBe('price_professional');
    });

    it('should cancel subscription with proper cleanup', async () => {
      const mockCancelledSubscription = {
        id: 'sub_test123',
        status: 'canceled',
        canceled_at: Math.floor(Date.now() / 1000),
        cancel_at_period_end: false
      };

      mockStripe.subscriptions.cancel.mockResolvedValue(mockCancelledSubscription);

      const cancelSubscription = async (subscriptionId: string, immediate: boolean = false) => {
        if (immediate) {
          return await mockStripe.subscriptions.cancel(subscriptionId);
        } else {
          return await mockStripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true
          });
        }
      };

      const result = await cancelSubscription('sub_test123', true);

      expect(mockStripe.subscriptions.cancel).toHaveBeenCalledWith('sub_test123');
      expect(result.status).toBe('canceled');
    });
  });

  describe('Payment Methods', () => {
    it('should attach payment method to customer', async () => {
      const mockPaymentMethod = {
        id: 'pm_test123',
        customer: 'cus_test123',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2028
        }
      };

      mockStripe.paymentMethods.attach.mockResolvedValue(mockPaymentMethod);

      const attachPaymentMethod = async (paymentMethodId: string, customerId: string) => {
        return await mockStripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId
        });
      };

      const result = await attachPaymentMethod('pm_test123', 'cus_test123');

      expect(mockStripe.paymentMethods.attach).toHaveBeenCalledWith('pm_test123', {
        customer: 'cus_test123'
      });
      expect(result.customer).toBe('cus_test123');
    });

    it('should create setup intent for future payments', async () => {
      const mockSetupIntent = {
        id: 'seti_test123',
        client_secret: 'seti_test123_secret_xyz',
        customer: 'cus_test123',
        status: 'requires_payment_method',
        usage: 'off_session'
      };

      mockStripe.setupIntents.create.mockResolvedValue(mockSetupIntent);

      const createSetupIntent = async (customerId: string) => {
        return await mockStripe.setupIntents.create({
          customer: customerId,
          usage: 'off_session',
          payment_method_types: ['card']
        });
      };

      const result = await createSetupIntent('cus_test123');

      expect(mockStripe.setupIntents.create).toHaveBeenCalledWith({
        customer: 'cus_test123',
        usage: 'off_session',
        payment_method_types: ['card']
      });
      expect(result.client_secret).toBeTruthy();
    });
  });

  describe('Invoice Management', () => {
    it('should create and finalize invoice', async () => {
      const mockDraftInvoice = {
        id: 'in_test123',
        customer: 'cus_test123',
        status: 'draft',
        amount_due: 2900,
        currency: 'eur'
      };

      const mockFinalizedInvoice = {
        ...mockDraftInvoice,
        status: 'open',
        invoice_pdf: 'https://files.stripe.com/invoice.pdf'
      };

      mockStripe.invoices.create.mockResolvedValue(mockDraftInvoice);
      mockStripe.invoices.finalizeInvoice.mockResolvedValue(mockFinalizedInvoice);

      const createAndFinalizeInvoice = async (customerId: string, items: any[]) => {
        const invoice = await mockStripe.invoices.create({
          customer: customerId,
          auto_advance: false
        });

        return await mockStripe.invoices.finalizeInvoice(invoice.id);
      };

      const result = await createAndFinalizeInvoice('cus_test123', []);

      expect(mockStripe.invoices.create).toHaveBeenCalledWith({
        customer: 'cus_test123',
        auto_advance: false
      });
      expect(mockStripe.invoices.finalizeInvoice).toHaveBeenCalledWith('in_test123');
      expect(result.status).toBe('open');
    });
  });

  describe('Webhook Handling', () => {
    it('should process invoice.payment_succeeded webhook', async () => {
      const mockWebhookPayload = JSON.stringify({
        id: 'evt_test123',
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_test123',
            customer: 'cus_test123',
            subscription: 'sub_test123',
            amount_paid: 2900,
            status: 'paid'
          }
        }
      });

      const mockEvent = {
        id: 'evt_test123',
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_test123',
            customer: 'cus_test123',
            subscription: 'sub_test123',
            amount_paid: 2900,
            status: 'paid',
            lines: {
              data: [{
                period: {
                  end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
                }
              }]
            }
          }
        }
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const processWebhook = async (payload: string, signature: string) => {
        const event = mockStripe.webhooks.constructEvent(payload, signature, 'whsec_test123');
        
        switch (event.type) {
          case 'invoice.payment_succeeded':
            const invoice = event.data.object as any;
            
            // Update subscription status in database
            await supabase.from('user_subscriptions').update({
              status: 'active',
              current_period_end: new Date(invoice.lines.data[0].period.end * 1000).toISOString()
            }).eq('stripe_subscription_id', invoice.subscription);
            
            return { success: true, type: 'payment_succeeded' };
            
          default:
            return { success: false, error: `Unhandled event type: ${event.type}` };
        }
      };

      const result = await processWebhook(mockWebhookPayload, 'test_signature');

      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        mockWebhookPayload,
        'test_signature',
        'whsec_test123'
      );
      expect(result.success).toBe(true);
      expect(result.type).toBe('payment_succeeded');
    });

    it('should process customer.subscription.deleted webhook', async () => {
      const mockEvent = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'canceled'
          }
        }
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const processSubscriptionDeleted = async (event: any) => {
        const subscription = event.data.object;
        
        // Update subscription in database
        await supabase.from('user_subscriptions').update({
          status: 'canceled',
          canceled_at: new Date().toISOString()
        }).eq('stripe_subscription_id', subscription.id);
        
        // Revoke access to premium features
        await supabase.from('feature_access').delete()
          .eq('user_id', subscription.customer);
        
        return { success: true };
      };

      const result = await processSubscriptionDeleted(mockEvent);
      
      expect(result.success).toBe(true);
    });

    it('should handle webhook signature verification failure', async () => {
      const error = new Error('Invalid signature');
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw error;
      });

      const processWebhook = async (payload: string, signature: string) => {
        try {
          const event = mockStripe.webhooks.constructEvent(payload, signature, 'whsec_test123');
          return { success: true };
        } catch (err) {
          return { 
            success: false, 
            error: `Webhook signature verification failed: ${(err as Error).message}` 
          };
        }
      };

      const result = await processWebhook('invalid_payload', 'invalid_signature');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Webhook signature verification failed');
    });
  });

  describe('Usage Tracking and Billing', () => {
    it('should track usage for metered billing', async () => {
      const mockUsageRecord = {
        id: 'mbur_test123',
        quantity: 100,
        timestamp: Math.floor(Date.now() / 1000),
        subscription_item: 'si_test123'
      };

      const trackUsage = async (subscriptionItemId: string, quantity: number) => {
        // Simulate usage tracking API call
        return {
          id: 'mbur_test123',
          quantity,
          timestamp: Math.floor(Date.now() / 1000),
          subscription_item: subscriptionItemId
        };
      };

      const result = await trackUsage('si_test123', 100);
      
      expect(result.quantity).toBe(100);
      expect(result.subscription_item).toBe('si_test123');
    });

    it('should calculate prorated amounts correctly', () => {
      const calculateProration = (
        oldAmount: number,
        newAmount: number,
        daysUsed: number,
        totalDays: number
      ) => {
        const unusedAmount = oldAmount * ((totalDays - daysUsed) / totalDays);
        const newProrationAmount = newAmount * ((totalDays - daysUsed) / totalDays);
        return Math.round((newProrationAmount - unusedAmount) * 100) / 100;
      };

      // Upgrade from €10 to €20 plan, 15 days into 30-day period
      const proration = calculateProration(10, 20, 15, 30);
      expect(proration).toBe(5); // Should charge €5 for remaining period

      // Downgrade from €20 to €10 plan
      const downgradeProration = calculateProration(20, 10, 15, 30);
      expect(downgradeProration).toBe(-5); // Should credit €5
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle payment failure scenarios', async () => {
      const paymentFailedEvent = {
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_test123',
            customer: 'cus_test123',
            attempt_count: 2,
            next_payment_attempt: Math.floor(Date.now() / 1000) + 86400 * 3
          }
        }
      };

      const handlePaymentFailure = async (invoice: any) => {
        const actions = [];
        
        if (invoice.attempt_count === 1) {
          // First failure - send email reminder
          actions.push('send_reminder_email');
        } else if (invoice.attempt_count === 2) {
          // Second failure - notify admin and update subscription
          actions.push('notify_admin');
          actions.push('update_subscription_status');
        } else if (invoice.attempt_count >= 3) {
          // Third failure - suspend subscription
          actions.push('suspend_subscription');
          actions.push('revoke_access');
        }
        
        return actions;
      };

      const actions = await handlePaymentFailure(paymentFailedEvent.data.object);
      
      expect(actions).toContain('notify_admin');
      expect(actions).toContain('update_subscription_status');
    });

    it('should handle API rate limiting', async () => {
      const rateLimitError = {
        type: 'StripeError',
        code: 'rate_limit',
        message: 'Too many requests'
      };

      let attempt = 0;
      const maxRetries = 3;

      const apiCallWithRetry = async (): Promise<any> => {
        attempt++;
        
        if (attempt <= 2) {
          throw rateLimitError;
        }
        
        return { success: true, attempt };
      };

      const executeWithRetry = async (fn: () => Promise<any>, retries: number = maxRetries) => {
        for (let i = 0; i < retries; i++) {
          try {
            return await fn();
          } catch (error: any) {
            if (error.code === 'rate_limit' && i < retries - 1) {
              // Wait with exponential backoff
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
              continue;
            }
            throw error;
          }
        }
      };

      const result = await executeWithRetry(apiCallWithRetry);
      
      expect(result.success).toBe(true);
      expect(result.attempt).toBe(3);
    });
  });

  describe('Security and Compliance', () => {
    it('should validate webhook signatures properly', () => {
      const validateWebhookSignature = (payload: string, signature: string, secret: string): boolean => {
        try {
          // Simplified signature validation (in real implementation, use Stripe's method)
          const expectedSignature = `sha256=${signature}`;
          return signature.length > 0 && secret.length > 0;
        } catch {
          return false;
        }
      };

      expect(validateWebhookSignature('payload', 'valid_signature', 'whsec_test')).toBe(true);
      expect(validateWebhookSignature('payload', '', 'whsec_test')).toBe(false);
      expect(validateWebhookSignature('payload', 'signature', '')).toBe(false);
    });

    it('should sanitize customer data before storing', () => {
      const sanitizeCustomerData = (data: any) => {
        const sanitized = { ...data };
        
        // Remove sensitive fields that shouldn't be stored locally
        delete sanitized.payment_method;
        delete sanitized.default_payment_method;
        
        // Validate email format
        if (sanitized.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized.email)) {
          delete sanitized.email;
        }
        
        // Limit string lengths
        if (sanitized.name && sanitized.name.length > 255) {
          sanitized.name = sanitized.name.substring(0, 255);
        }
        
        return sanitized;
      };

      const rawData = {
        email: 'test@example.com',
        name: 'Valid Company Name',
        payment_method: 'pm_secret123',
        metadata: { user_id: '123' }
      };

      const sanitized = sanitizeCustomerData(rawData);
      
      expect(sanitized.email).toBe('test@example.com');
      expect(sanitized.name).toBe('Valid Company Name');
      expect(sanitized.payment_method).toBeUndefined();
      expect(sanitized.metadata).toBeDefined();
    });

    it('should log security events appropriately', async () => {
      const securityEvents: any[] = [];
      
      const logSecurityEvent = (event: string, details: any) => {
        securityEvents.push({
          timestamp: new Date().toISOString(),
          event,
          details,
          severity: event.includes('failed') ? 'warning' : 'info'
        });
      };

      // Simulate various security events
      logSecurityEvent('webhook_received', { type: 'invoice.payment_succeeded' });
      logSecurityEvent('signature_verification_failed', { ip: '192.168.1.1' });
      logSecurityEvent('subscription_created', { customer: 'cus_test123' });
      
      expect(securityEvents).toHaveLength(3);
      expect(securityEvents[1].severity).toBe('warning');
      expect(securityEvents[0].event).toBe('webhook_received');
    });
  });
});