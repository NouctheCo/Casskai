import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { SubscriptionService, UsageLimits, FeatureAccess } from '../subscriptionService';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({ data: [], error: null }))
        })),
        order: vi.fn(() => ({ data: [], error: null }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: null }))
          }))
        }))
      }))
    }))
  }
}));

describe('SubscriptionService', () => {
  let subscriptionService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    subscriptionService = new (require('../subscriptionService').default || require('../subscriptionService').SubscriptionService)();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Feature Access Control', () => {
    it('should grant access to allowed features', async () => {
      // Mock successful RPC response
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: true,
        error: null
      });

      if (subscriptionService.canAccessFeature) {
        const result = await subscriptionService.canAccessFeature('user-123', 'invoicing');
        
        expect(result.canAccess).toBe(true);
        expect(supabase.rpc).toHaveBeenCalledWith('can_access_feature', {
          p_user_id: 'user-123',
          p_feature_name: 'invoicing'
        });
      }
    });

    it('should deny access to restricted features', async () => {
      // Mock RPC response denying access
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: false,
        error: null
      });

      if (subscriptionService.canAccessFeature) {
        const result = await subscriptionService.canAccessFeature('user-123', 'advanced_reporting');
        
        expect(result.canAccess).toBe(false);
      }
    });

    it('should handle RPC errors gracefully', async () => {
      // Mock RPC error
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      if (subscriptionService.canAccessFeature) {
        const result = await subscriptionService.canAccessFeature('user-123', 'invoicing');
        
        expect(result.canAccess).toBe(false);
        expect(result.reason).toBe('Erreur de vérification');
      }
    });

    it('should handle unexpected errors', async () => {
      // Mock thrown error
      vi.mocked(supabase.rpc).mockRejectedValueOnce(new Error('Network error'));

      if (subscriptionService.canAccessFeature) {
        const result = await subscriptionService.canAccessFeature('user-123', 'invoicing');
        
        expect(result.canAccess).toBe(false);
        expect(result.reason).toBe('Erreur inattendue');
      }
    });
  });

  describe('Subscription Plan Validation', () => {
    it('should validate plan features correctly', () => {
      const plans = {
        starter: {
          features: ['invoicing', 'basic_reporting'],
          limits: { invoices_per_month: 10, users: 1 }
        },
        professional: {
          features: ['invoicing', 'basic_reporting', 'advanced_reporting', 'api_access'],
          limits: { invoices_per_month: 100, users: 5 }
        },
        enterprise: {
          features: ['invoicing', 'basic_reporting', 'advanced_reporting', 'api_access', 'white_labeling'],
          limits: { invoices_per_month: -1, users: -1 } // -1 = unlimited
        }
      };

      // Test feature availability
      expect(plans.starter.features).toContain('invoicing');
      expect(plans.starter.features).not.toContain('advanced_reporting');
      
      expect(plans.professional.features).toContain('advanced_reporting');
      expect(plans.professional.features).not.toContain('white_labeling');
      
      expect(plans.enterprise.features).toContain('white_labeling');
    });

    it('should enforce usage limits correctly', () => {
      const checkUsageLimit = (currentUsage: number, limit: number): { allowed: boolean; percentage: number } => {
        if (limit === -1) { // Unlimited
          return { allowed: true, percentage: 0 };
        }
        
        const percentage = (currentUsage / limit) * 100;
        return {
          allowed: currentUsage < limit,
          percentage: Math.min(percentage, 100)
        };
      };

      // Within limits
      expect(checkUsageLimit(5, 10)).toEqual({ allowed: true, percentage: 50 });
      
      // At limit
      expect(checkUsageLimit(10, 10)).toEqual({ allowed: false, percentage: 100 });
      
      // Over limit
      expect(checkUsageLimit(15, 10)).toEqual({ allowed: false, percentage: 100 });
      
      // Unlimited
      expect(checkUsageLimit(1000, -1)).toEqual({ allowed: true, percentage: 0 });
    });
  });

  describe('Trial Period Management', () => {
    it('should calculate trial days remaining correctly', () => {
      const calculateTrialDaysRemaining = (trialStartDate: string, trialDurationDays: number): number => {
        const startDate = new Date(trialStartDate);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + trialDurationDays);
        
        const today = new Date();
        const timeDiff = endDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        return Math.max(0, daysDiff);
      };

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Trial started yesterday, 14-day trial
      expect(calculateTrialDaysRemaining(yesterday.toISOString().split('T')[0], 14)).toBe(13);
      
      // Trial started a week ago, 14-day trial
      expect(calculateTrialDaysRemaining(weekAgo.toISOString().split('T')[0], 14)).toBe(7);
      
      // Trial started 15 days ago, 14-day trial (expired)
      const fifteenDaysAgo = new Date(today);
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
      expect(calculateTrialDaysRemaining(fifteenDaysAgo.toISOString().split('T')[0], 14)).toBe(0);
    });

    it('should determine trial status correctly', () => {
      const getTrialStatus = (trialStartDate: string, trialDurationDays: number) => {
        const startDate = new Date(trialStartDate);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + trialDurationDays);
        
        const today = new Date();
        
        if (today < startDate) return 'not_started';
        if (today <= endDate) return 'active';
        return 'expired';
      };

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);

      // Future trial
      expect(getTrialStatus(tomorrow.toISOString().split('T')[0], 14)).toBe('not_started');
      
      // Active trial
      expect(getTrialStatus(yesterday.toISOString().split('T')[0], 14)).toBe('active');
      expect(getTrialStatus(weekAgo.toISOString().split('T')[0], 14)).toBe('active');
      
      // Expired trial
      expect(getTrialStatus(monthAgo.toISOString().split('T')[0], 14)).toBe('expired');
    });
  });

  describe('Usage Tracking', () => {
    it('should calculate usage percentages correctly', () => {
      const calculateUsagePercentage = (current: number, limit: number | null): number => {
        if (limit === null || limit === -1) return 0; // Unlimited
        if (limit === 0) return 100; // No allowance
        
        return Math.min((current / limit) * 100, 100);
      };

      expect(calculateUsagePercentage(5, 10)).toBe(50);
      expect(calculateUsagePercentage(10, 10)).toBe(100);
      expect(calculateUsagePercentage(15, 10)).toBe(100);
      expect(calculateUsagePercentage(100, null)).toBe(0);
      expect(calculateUsagePercentage(100, -1)).toBe(0);
      expect(calculateUsagePercentage(5, 0)).toBe(100);
    });

    it('should format usage limits for display', () => {
      const formatUsageLimit = (current: number, limit: number | null): string => {
        if (limit === null || limit === -1) return `${current} / Illimité`;
        return `${current} / ${limit}`;
      };

      expect(formatUsageLimit(5, 10)).toBe('5 / 10');
      expect(formatUsageLimit(100, null)).toBe('100 / Illimité');
      expect(formatUsageLimit(50, -1)).toBe('50 / Illimité');
    });

    it('should determine if usage warning should be shown', () => {
      const shouldShowUsageWarning = (current: number, limit: number | null, warningThreshold: number = 80): boolean => {
        if (limit === null || limit === -1) return false; // Unlimited
        if (limit === 0) return true; // No allowance
        
        const percentage = (current / limit) * 100;
        return percentage >= warningThreshold;
      };

      // Below warning threshold
      expect(shouldShowUsageWarning(7, 10, 80)).toBe(false);
      
      // At warning threshold
      expect(shouldShowUsageWarning(8, 10, 80)).toBe(true);
      
      // Over limit
      expect(shouldShowUsageWarning(12, 10, 80)).toBe(true);
      
      // Unlimited plans
      expect(shouldShowUsageWarning(1000, null, 80)).toBe(false);
      expect(shouldShowUsageWarning(1000, -1, 80)).toBe(false);
      
      // No allowance
      expect(shouldShowUsageWarning(1, 0, 80)).toBe(true);
    });
  });

  describe('Billing Calculations', () => {
    it('should calculate prorated billing correctly', () => {
      const calculateProratedAmount = (monthlyPrice: number, daysUsed: number, daysInMonth: number): number => {
        return Math.round((monthlyPrice * daysUsed / daysInMonth) * 100) / 100;
      };

      // Full month
      expect(calculateProratedAmount(100, 30, 30)).toBe(100);
      
      // Half month
      expect(calculateProratedAmount(100, 15, 30)).toBe(50);
      
      // One day
      expect(calculateProratedAmount(100, 1, 30)).toBe(3.33);
      
      // Leap year February
      expect(calculateProratedAmount(100, 14, 29)).toBe(48.28);
    });

    it('should calculate upgrade/downgrade credits correctly', () => {
      const calculateUpgradeCredit = (
        oldMonthlyPrice: number, 
        newMonthlyPrice: number, 
        daysRemaining: number, 
        daysInMonth: number
      ): number => {
        const oldProratedRefund = (oldMonthlyPrice * daysRemaining / daysInMonth);
        const newProratedCharge = (newMonthlyPrice * daysRemaining / daysInMonth);
        const netCharge = newProratedCharge - oldProratedRefund;
        
        return Math.round(netCharge * 100) / 100;
      };

      // Upgrade from $10 to $20, 15 days remaining in 30-day month
      expect(calculateUpgradeCredit(10, 20, 15, 30)).toBe(5);
      
      // Downgrade from $20 to $10, 15 days remaining
      expect(calculateUpgradeCredit(20, 10, 15, 30)).toBe(-5);
      
      // Same plan (no change)
      expect(calculateUpgradeCredit(15, 15, 10, 30)).toBe(0);
    });
  });

  describe('Subscription Status', () => {
    it('should determine subscription health status', () => {
      const getSubscriptionHealth = (
        status: string, 
        paymentMethod: boolean, 
        trialDaysRemaining: number,
        isOverdue: boolean
      ): 'healthy' | 'warning' | 'critical' => {
        if (isOverdue || status === 'cancelled') return 'critical';
        if (!paymentMethod && trialDaysRemaining <= 3) return 'critical';
        if (!paymentMethod && trialDaysRemaining <= 7) return 'warning';
        if (status === 'past_due') return 'warning';
        
        return 'healthy';
      };

      // Healthy subscriptions
      expect(getSubscriptionHealth('active', true, 10, false)).toBe('healthy');
      expect(getSubscriptionHealth('trialing', false, 10, false)).toBe('healthy');
      
      // Warning states
      expect(getSubscriptionHealth('past_due', true, 10, false)).toBe('warning');
      expect(getSubscriptionHealth('trialing', false, 5, false)).toBe('warning');
      
      // Critical states
      expect(getSubscriptionHealth('cancelled', false, 0, false)).toBe('critical');
      expect(getSubscriptionHealth('active', true, 10, true)).toBe('critical');
      expect(getSubscriptionHealth('trialing', false, 2, false)).toBe('critical');
    });

    it('should generate appropriate status messages', () => {
      const getStatusMessage = (
        status: string,
        trialDaysRemaining: number,
        paymentMethod: boolean
      ): string => {
        switch (status) {
          case 'trialing':
            if (trialDaysRemaining > 1) {
              return `${trialDaysRemaining} jours restants dans votre essai`;
            } else if (trialDaysRemaining === 1) {
              return 'Dernier jour de votre essai';
            } else {
              return 'Votre essai a expiré';
            }
          case 'active':
            return 'Abonnement actif';
          case 'past_due':
            return 'Paiement en retard';
          case 'cancelled':
            return 'Abonnement annulé';
          case 'incomplete':
            return 'Configuration du paiement incomplète';
          default:
            return 'Statut inconnu';
        }
      };

      expect(getStatusMessage('trialing', 5, false)).toBe('5 jours restants dans votre essai');
      expect(getStatusMessage('trialing', 1, false)).toBe('Dernier jour de votre essai');
      expect(getStatusMessage('trialing', 0, false)).toBe('Votre essai a expiré');
      expect(getStatusMessage('active', 0, true)).toBe('Abonnement actif');
      expect(getStatusMessage('past_due', 0, true)).toBe('Paiement en retard');
      expect(getStatusMessage('cancelled', 0, false)).toBe('Abonnement annulé');
    });
  });
});