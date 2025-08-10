import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  SubscriptionResponse,
  PaymentResponse,
  BillingResponse,
  CheckoutSession,
  BillingPortalSession,
  SubscriptionPlan,
  UserSubscription,
  PaymentMethod,
  Invoice
} from '@/types/subscription.types';

// Stripe configuration
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_mock_key';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class StripeService {
  private stripe: Promise<Stripe | null>;
  private initialized = false;

  constructor() {
    this.stripe = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }

  async initialize(): Promise<Stripe | null> {
    if (!this.initialized) {
      this.initialized = true;
    }
    return await this.stripe;
  }

  // Subscription Management
  async createCheckoutSession(
    planId: string,
    userId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<SubscriptionResponse> {
    try {
      // In a real implementation, this would call your backend API
      // For now, we'll simulate the response
      console.log('Creating checkout session for plan:', planId, 'user:', userId);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock checkout session
      const mockCheckoutUrl = `https://checkout.stripe.com/pay/cs_test_mock_${planId}_${userId}`;
      
      return {
        success: true,
        checkoutUrl: mockCheckoutUrl
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return {
        success: false,
        error: 'Impossible de créer la session de paiement'
      };
    }
  }

  async getCurrentSubscription(userId: string): Promise<SubscriptionResponse> {
    try {
      // Mock current subscription - in real app, fetch from your backend
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if user has a subscription in localStorage (for demo)
      const mockSubscription = localStorage.getItem(`subscription_${userId}`);
      
      if (mockSubscription) {
        const subscription: UserSubscription = JSON.parse(mockSubscription);
        return {
          success: true,
          subscription
        };
      }
      
      return {
        success: true,
        subscription: undefined
      };
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return {
        success: false,
        error: 'Impossible de récupérer l\'abonnement'
      };
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<SubscriptionResponse> {
    try {
      console.log('Canceling subscription:', subscriptionId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update mock subscription
      const userId = localStorage.getItem('current_user_id');
      if (userId) {
        const mockSubscription = localStorage.getItem(`subscription_${userId}`);
        if (mockSubscription) {
          const subscription: UserSubscription = JSON.parse(mockSubscription);
          subscription.status = 'canceled';
          subscription.cancelAtPeriodEnd = true;
          subscription.updatedAt = new Date();
          
          localStorage.setItem(`subscription_${userId}`, JSON.stringify(subscription));
          
          return {
            success: true,
            subscription
          };
        }
      }
      
      return {
        success: false,
        error: 'Abonnement introuvable'
      };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return {
        success: false,
        error: 'Impossible d\'annuler l\'abonnement'
      };
    }
  }

  async updateSubscription(subscriptionId: string, newPlanId: string): Promise<SubscriptionResponse> {
    try {
      console.log('Updating subscription:', subscriptionId, 'to plan:', newPlanId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update mock subscription
      const userId = localStorage.getItem('current_user_id');
      if (userId) {
        const mockSubscription = localStorage.getItem(`subscription_${userId}`);
        if (mockSubscription) {
          const subscription: UserSubscription = JSON.parse(mockSubscription);
          subscription.planId = newPlanId;
          subscription.updatedAt = new Date();
          
          localStorage.setItem(`subscription_${userId}`, JSON.stringify(subscription));
          
          return {
            success: true,
            subscription
          };
        }
      }
      
      return {
        success: false,
        error: 'Abonnement introuvable'
      };
    } catch (error) {
      console.error('Error updating subscription:', error);
      return {
        success: false,
        error: 'Impossible de modifier l\'abonnement'
      };
    }
  }

  // Payment Methods
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      // Mock payment methods
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockPaymentMethods: PaymentMethod[] = [
        {
          id: 'pm_1',
          userId,
          stripePaymentMethodId: 'pm_mock_visa',
          type: 'card',
          brand: 'visa',
          last4: '4242',
          expiryMonth: 12,
          expiryYear: 2025,
          isDefault: true,
          createdAt: new Date('2024-01-15')
        }
      ];
      
      return mockPaymentMethods;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  }

  async addPaymentMethod(userId: string, paymentMethodId: string): Promise<PaymentResponse> {
    try {
      console.log('Adding payment method:', paymentMethodId, 'for user:', userId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newPaymentMethod: PaymentMethod = {
        id: `pm_${Date.now()}`,
        userId,
        stripePaymentMethodId: paymentMethodId,
        type: 'card',
        brand: 'visa',
        last4: '4242',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: false,
        createdAt: new Date()
      };
      
      return {
        success: true,
        paymentMethod: newPaymentMethod
      };
    } catch (error) {
      console.error('Error adding payment method:', error);
      return {
        success: false,
        error: 'Impossible d\'ajouter le moyen de paiement'
      };
    }
  }

  async removePaymentMethod(paymentMethodId: string): Promise<PaymentResponse> {
    try {
      console.log('Removing payment method:', paymentMethodId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Error removing payment method:', error);
      return {
        success: false,
        error: 'Impossible de supprimer le moyen de paiement'
      };
    }
  }

  // Billing Portal
  async createBillingPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<BillingResponse> {
    try {
      console.log('Creating billing portal session for customer:', customerId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock billing portal URL
      const mockPortalUrl = `https://billing.stripe.com/session/mock_${customerId}`;
      
      return {
        success: true,
        portalUrl: mockPortalUrl
      };
    } catch (error) {
      console.error('Error creating billing portal session:', error);
      return {
        success: false,
        error: 'Impossible d\'accéder au portail de facturation'
      };
    }
  }

  // Invoices
  async getInvoices(userId: string, limit: number = 10): Promise<Invoice[]> {
    try {
      // Mock invoices
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockInvoices: Invoice[] = [
        {
          id: 'inv_1',
          userId,
          stripeInvoiceId: 'in_mock_1',
          subscriptionId: 'sub_mock_1',
          amount: 69,
          currency: 'EUR',
          status: 'paid',
          invoiceUrl: 'https://invoice.stripe.com/mock_1',
          pdfUrl: 'https://invoice.stripe.com/mock_1.pdf',
          dueDate: new Date('2024-01-31'),
          paidAt: new Date('2024-01-25'),
          createdAt: new Date('2024-01-01')
        },
        {
          id: 'inv_2',
          userId,
          stripeInvoiceId: 'in_mock_2',
          subscriptionId: 'sub_mock_1',
          amount: 69,
          currency: 'EUR',
          status: 'open',
          invoiceUrl: 'https://invoice.stripe.com/mock_2',
          pdfUrl: 'https://invoice.stripe.com/mock_2.pdf',
          dueDate: new Date('2024-02-28'),
          createdAt: new Date('2024-02-01')
        }
      ];
      
      return mockInvoices.slice(0, limit);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  }

  // Utility methods
  async redirectToCheckout(sessionId: string): Promise<{ error?: any }> {
    try {
      const stripe = await this.initialize();
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId
      });

      return { error };
    } catch (error) {
      console.error('Error redirecting to checkout:', error);
      return { error };
    }
  }

  // Mock subscription creation for demo purposes
  async createMockSubscription(userId: string, planId: string): Promise<UserSubscription> {
    const mockSubscription: UserSubscription = {
      id: `sub_mock_${Date.now()}`,
      userId,
      planId,
      stripeSubscriptionId: `sub_stripe_${Date.now()}`,
      stripeCustomerId: `cus_mock_${userId}`,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store in localStorage for demo
    localStorage.setItem(`subscription_${userId}`, JSON.stringify(mockSubscription));
    localStorage.setItem('current_user_id', userId);

    return mockSubscription;
  }
}

export const stripeService = new StripeService();
export default stripeService;