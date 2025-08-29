import { test, expect } from '@playwright/test';
import { supabase } from '../../src/lib/supabase';

/**
 * E2E Test: Stripe Payment and Subscription Flow
 * Covers: Payment setup -> Subscription creation -> Webhook processing -> Payment handling
 * Note: This test requires Stripe test mode configuration
 */

test.describe('Stripe Payment Integration', () => {
  let testUserEmail: string;
  let testUserId: string;
  let testCompanyId: string;

  test.beforeAll(async () => {
    // Ensure we're using Stripe test environment
    process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY_TEST || 'sk_test_51234567890';
    process.env.STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY_TEST || 'pk_test_51234567890';
    
    const timestamp = Date.now();
    testUserEmail = `stripetest+${timestamp}@casskai.test`;

    // Create test user and company
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testUserEmail,
      password: 'TestPassword123!',
      email_confirmed_at: new Date().toISOString()
    });

    if (authError || !authUser.user) {
      throw new Error('Failed to create test user');
    }

    testUserId = authUser.user.id;

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: 'Stripe Test Company',
        email: testUserEmail,
        country: 'FR',
        currency: 'EUR',
        created_by: testUserId,
        onboarding_completed: true
      })
      .select()
      .single();

    if (companyError || !company) {
      throw new Error('Failed to create test company');
    }

    testCompanyId = company.id;
  });

  test.afterAll(async () => {
    // Clean up test data
    if (testCompanyId) {
      await supabase.from('user_subscriptions').delete().eq('company_id', testCompanyId);
      await supabase.from('stripe_customers').delete().eq('company_id', testCompanyId);
      await supabase.from('companies').delete().eq('id', testCompanyId);
    }
    
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  test('should complete full payment flow with Stripe', async ({ page }) => {
    // Step 1: Login and navigate to billing
    await test.step('Login and access billing section', async () => {
      await page.goto('/auth');
      
      await page.fill('[data-testid="email-input"]', testUserEmail);
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('**/dashboard**', { timeout: 10000 });
      
      // Navigate to billing/subscription page
      await page.click('[data-testid="sidebar-billing"]');
      await page.waitForURL('**/billing**');
    });

    // Step 2: Review current subscription status
    await test.step('Review trial subscription status', async () => {
      // Should show trial status
      await expect(page.locator('[data-testid="subscription-status"]')).toContainText('Essai gratuit');
      await expect(page.locator('[data-testid="trial-days-remaining"]')).toBeVisible();
      
      // Show available plans
      await expect(page.locator('[data-testid="pricing-plans"]')).toBeVisible();
      await expect(page.locator('[data-testid="plan-starter"]')).toBeVisible();
      await expect(page.locator('[data-testid="plan-professional"]')).toBeVisible();
      await expect(page.locator('[data-testid="plan-enterprise"]')).toBeVisible();
    });

    // Step 3: Select and upgrade to Professional plan
    await test.step('Select professional plan', async () => {
      // Click on Professional plan
      await page.click('[data-testid="select-plan-professional"]');
      
      // Should show plan details modal
      await expect(page.locator('[data-testid="plan-details-modal"]')).toBeVisible();
      
      // Verify plan features
      await expect(page.locator('[data-testid="plan-price"]')).toContainText('29€/mois');
      await expect(page.locator('[data-testid="plan-features"]')).toContainText('Facturation illimitée');
      await expect(page.locator('[data-testid="plan-features"]')).toContainText('Rapports avancés');
      await expect(page.locator('[data-testid="plan-features"]')).toContainText('Support prioritaire');
      
      // Confirm plan selection
      await page.click('[data-testid="confirm-plan-selection"]');
    });

    // Step 4: Set up payment method
    await test.step('Configure payment method with Stripe', async () => {
      // Should redirect to payment setup
      await expect(page.locator('[data-testid="payment-setup-form"]')).toBeVisible();
      await expect(page.locator('[data-testid="stripe-card-element"]')).toBeVisible();
      
      // Wait for Stripe Elements to load
      await page.waitForSelector('[data-testid="stripe-card-element"] iframe');
      
      // Fill card details in Stripe Elements iframe
      const cardFrame = page.frameLocator('[data-testid="stripe-card-element"] iframe');
      await cardFrame.locator('[name="cardnumber"]').fill('4242424242424242');
      await cardFrame.locator('[name="exp-date"]').fill('1228');
      await cardFrame.locator('[name="cvc"]').fill('123');
      await cardFrame.locator('[name="postal"]').fill('75001');
      
      // Fill billing information
      await page.fill('[data-testid="cardholder-name"]', 'Test Cardholder');
      await page.fill('[data-testid="billing-address"]', '123 Test Street');
      await page.fill('[data-testid="billing-city"]', 'Paris');
      await page.fill('[data-testid="billing-postal-code"]', '75001');
      await page.selectOption('[data-testid="billing-country"]', 'FR');
    });

    // Step 5: Complete subscription creation
    await test.step('Complete subscription setup', async () => {
      // Submit payment setup
      await page.click('[data-testid="setup-payment-method"]');
      
      // Wait for payment processing
      await expect(page.locator('[data-testid="processing-payment"]')).toBeVisible();
      await expect(page.locator('[data-testid="processing-payment"]')).not.toBeVisible({ timeout: 15000 });
      
      // Should show success and redirect to billing dashboard
      await expect(page.locator('[data-testid="payment-setup-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="subscription-active"]')).toBeVisible();
    });

    // Step 6: Verify subscription activation
    await test.step('Verify active subscription status', async () => {
      // Refresh page to ensure latest status
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check subscription status
      await expect(page.locator('[data-testid="subscription-status"]')).toContainText('Actif');
      await expect(page.locator('[data-testid="current-plan"]')).toContainText('Professional');
      await expect(page.locator('[data-testid="next-billing-date"]')).toBeVisible();
      
      // Verify payment method is stored
      await expect(page.locator('[data-testid="saved-payment-method"]')).toBeVisible();
      await expect(page.locator('[data-testid="card-last-four"]')).toContainText('4242');
      
      // Check billing history
      await page.click('[data-testid="billing-history-tab"]');
      await expect(page.locator('[data-testid="billing-history-item"]')).toHaveCount.toBeGreaterThan(0);
    });

    // Step 7: Test feature access with paid subscription
    await test.step('Verify premium features are accessible', async () => {
      // Navigate to reports section (premium feature)
      await page.click('[data-testid="sidebar-reports"]');
      await page.waitForURL('**/reports**');
      
      // Should have access to advanced reports
      await expect(page.locator('[data-testid="advanced-reports-tab"]')).toBeVisible();
      await expect(page.locator('[data-testid="custom-reports-tab"]')).toBeVisible();
      
      // Test advanced report generation
      await page.click('[data-testid="advanced-reports-tab"]');
      await page.click('[data-testid="generate-cash-flow-report"]');
      
      // Should not show upgrade prompt
      await expect(page.locator('[data-testid="upgrade-prompt"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="report-generated"]')).toBeVisible({ timeout: 10000 });
    });

    // Step 8: Test subscription management
    await test.step('Test subscription management features', async () => {
      await page.click('[data-testid="sidebar-billing"]');
      
      // Test plan change
      await page.click('[data-testid="change-plan-button"]');
      await expect(page.locator('[data-testid="plan-change-modal"]')).toBeVisible();
      
      // Preview Enterprise upgrade
      await page.click('[data-testid="preview-enterprise-upgrade"]');
      await expect(page.locator('[data-testid="upgrade-preview"]')).toBeVisible();
      await expect(page.locator('[data-testid="prorated-amount"]')).toBeVisible();
      
      // Cancel the upgrade for now
      await page.click('[data-testid="cancel-plan-change"]');
      
      // Test adding additional payment method
      await page.click('[data-testid="add-payment-method"]');
      await expect(page.locator('[data-testid="add-card-modal"]')).toBeVisible();
      
      // Add second card
      const newCardFrame = page.frameLocator('[data-testid="new-card-element"] iframe');
      await newCardFrame.locator('[name="cardnumber"]').fill('5555555555554444');
      await newCardFrame.locator('[name="exp-date"]').fill('0630');
      await newCardFrame.locator('[name="cvc"]').fill('456');
      
      await page.click('[data-testid="save-payment-method"]');
      await expect(page.locator('[data-testid="payment-method-added"]')).toBeVisible();
      
      // Verify both cards are listed
      await expect(page.locator('[data-testid="payment-method"]')).toHaveCount(2);
    });

    // Step 9: Test invoice handling
    await test.step('Generate and handle invoices', async () => {
      // Trigger manual invoice generation (for testing)
      await page.click('[data-testid="generate-test-invoice"]');
      
      await expect(page.locator('[data-testid="invoice-generated"]')).toBeVisible();
      
      // View invoice details
      await page.click('[data-testid="view-latest-invoice"]');
      await expect(page.locator('[data-testid="invoice-details-modal"]')).toBeVisible();
      
      // Verify invoice information
      await expect(page.locator('[data-testid="invoice-amount"]')).toContainText('29,00 €');
      await expect(page.locator('[data-testid="invoice-status"]')).toContainText('Payé');
      
      // Download invoice PDF
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-invoice-pdf"]');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toContain('invoice');
      expect(download.suggestedFilename()).toContain('.pdf');
      
      await page.click('[data-testid="close-invoice-modal"]');
    });
  });

  test('should handle payment failures gracefully', async ({ page }) => {
    await test.step('Login and attempt payment with declined card', async () => {
      await page.goto('/auth');
      await page.fill('[data-testid="email-input"]', testUserEmail);
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('**/dashboard**');
      await page.click('[data-testid="sidebar-billing"]');
    });

    await test.step('Test declined card handling', async () => {
      // Add payment method with declined card
      await page.click('[data-testid="add-payment-method"]');
      
      const cardFrame = page.frameLocator('[data-testid="new-card-element"] iframe');
      await cardFrame.locator('[name="cardnumber"]').fill('4000000000000002'); // Declined card
      await cardFrame.locator('[name="exp-date"]').fill('1228');
      await cardFrame.locator('[name="cvc"]').fill('123');
      
      await page.click('[data-testid="save-payment-method"]');
      
      // Should show decline error
      await expect(page.locator('[data-testid="payment-declined-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-declined-error"]')).toContainText('Votre carte a été refusée');
      
      // Should suggest alternative actions
      await expect(page.locator('[data-testid="try-different-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="contact-bank"]')).toBeVisible();
    });

    await test.step('Test insufficient funds scenario', async () => {
      // Try with insufficient funds card
      const cardFrame = page.frameLocator('[data-testid="new-card-element"] iframe');
      await cardFrame.locator('[name="cardnumber"]').clear();
      await cardFrame.locator('[name="cardnumber"]').fill('4000000000009995'); // Insufficient funds
      
      await page.click('[data-testid="save-payment-method"]');
      
      await expect(page.locator('[data-testid="insufficient-funds-error"]')).toBeVisible();
    });

    await test.step('Test successful retry after failure', async () => {
      // Use valid card after failures
      const cardFrame = page.frameLocator('[data-testid="new-card-element"] iframe');
      await cardFrame.locator('[name="cardnumber"]').clear();
      await cardFrame.locator('[name="cardnumber"]').fill('4242424242424242'); // Valid card
      
      await page.click('[data-testid="save-payment-method"]');
      
      await expect(page.locator('[data-testid="payment-method-added"]')).toBeVisible();
    });
  });

  test('should handle subscription lifecycle events', async ({ page }) => {
    await test.step('Set up subscription for lifecycle testing', async () => {
      await page.goto('/auth');
      await page.fill('[data-testid="email-input"]', testUserEmail);
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('**/dashboard**');
      await page.click('[data-testid="sidebar-billing"]');
    });

    await test.step('Test subscription pause/resume', async () => {
      // Pause subscription
      await page.click('[data-testid="subscription-actions"]');
      await page.click('[data-testid="pause-subscription"]');
      
      await expect(page.locator('[data-testid="pause-confirmation-modal"]')).toBeVisible();
      await page.fill('[data-testid="pause-reason"]', 'Temporary business closure');
      await page.click('[data-testid="confirm-pause"]');
      
      await expect(page.locator('[data-testid="subscription-paused-notice"]')).toBeVisible();
      await expect(page.locator('[data-testid="subscription-status"]')).toContainText('En pause');
      
      // Resume subscription
      await page.click('[data-testid="resume-subscription"]');
      await expect(page.locator('[data-testid="subscription-resumed-notice"]')).toBeVisible();
      await expect(page.locator('[data-testid="subscription-status"]')).toContainText('Actif');
    });

    await test.step('Test subscription cancellation', async () => {
      // Initiate cancellation
      await page.click('[data-testid="subscription-actions"]');
      await page.click('[data-testid="cancel-subscription"]');
      
      await expect(page.locator('[data-testid="cancellation-modal"]')).toBeVisible();
      
      // Show retention offer
      await expect(page.locator('[data-testid="retention-offer"]')).toBeVisible();
      await expect(page.locator('[data-testid="discount-offer"]')).toContainText('50% de réduction');
      
      // Decline retention offer
      await page.click('[data-testid="decline-offer"]');
      
      // Provide cancellation feedback
      await page.selectOption('[data-testid="cancellation-reason"]', 'too_expensive');
      await page.fill('[data-testid="cancellation-feedback"]', 'Budget constraints due to economic conditions');
      
      // Choose cancellation timing
      await page.check('[data-testid="cancel-at-period-end"]');
      
      await page.click('[data-testid="confirm-cancellation"]');
      
      // Verify cancellation scheduled
      await expect(page.locator('[data-testid="cancellation-scheduled"]')).toBeVisible();
      await expect(page.locator('[data-testid="subscription-ends-on"]')).toBeVisible();
    });

    await test.step('Test reactivation after cancellation', async () => {
      // Reactivate before period end
      await page.click('[data-testid="reactivate-subscription"]');
      
      await expect(page.locator('[data-testid="reactivation-modal"]')).toBeVisible();
      await page.click('[data-testid="confirm-reactivation"]');
      
      await expect(page.locator('[data-testid="subscription-reactivated"]')).toBeVisible();
      await expect(page.locator('[data-testid="subscription-status"]')).toContainText('Actif');
    });
  });

  test('should handle webhook events correctly', async ({ page, request }) => {
    await test.step('Simulate Stripe webhook events', async () => {
      // This test would typically require a webhook testing endpoint
      // For now, we'll verify the UI responds to subscription changes
      
      await page.goto('/auth');
      await page.fill('[data-testid="email-input"]', testUserEmail);
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('**/dashboard**');
    });

    await test.step('Test real-time subscription updates', async () => {
      // Navigate to billing page
      await page.click('[data-testid="sidebar-billing"]');
      
      // Simulate webhook processing by updating subscription status in database
      await supabase
        .from('user_subscriptions')
        .update({ status: 'past_due' })
        .eq('user_id', testUserId);
      
      // Refresh page to see updated status
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Should show past due warning
      await expect(page.locator('[data-testid="payment-past-due-warning"]')).toBeVisible();
      await expect(page.locator('[data-testid="update-payment-method-cta"]')).toBeVisible();
      
      // Update payment method to resolve issue
      await page.click('[data-testid="update-payment-method-cta"]');
      await expect(page.locator('[data-testid="payment-update-modal"]')).toBeVisible();
    });
  });

  test('should display accurate billing information', async ({ page }) => {
    await test.step('Login and check billing dashboard', async () => {
      await page.goto('/auth');
      await page.fill('[data-testid="email-input"]', testUserEmail);
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('**/dashboard**');
      await page.click('[data-testid="sidebar-billing"]');
    });

    await test.step('Verify billing calculations and display', async () => {
      // Check current period billing
      await expect(page.locator('[data-testid="current-period-cost"]')).toBeVisible();
      await expect(page.locator('[data-testid="next-invoice-amount"]')).toBeVisible();
      
      // Verify tax calculations (if applicable)
      await expect(page.locator('[data-testid="tax-information"]')).toBeVisible();
      
      // Check usage-based billing (if applicable)
      if (await page.locator('[data-testid="usage-billing-section"]').isVisible()) {
        await expect(page.locator('[data-testid="current-usage"]')).toBeVisible();
        await expect(page.locator('[data-testid="usage-chart"]')).toBeVisible();
      }
      
      // Verify billing contact information
      await page.click('[data-testid="billing-details-tab"]');
      await expect(page.locator('[data-testid="billing-email"]')).toHaveValue(testUserEmail);
      await expect(page.locator('[data-testid="billing-address"]')).toBeVisible();
    });

    await test.step('Test invoice generation and delivery', async () => {
      // Check invoice delivery preferences
      await expect(page.locator('[data-testid="invoice-delivery-email"]')).toBeChecked();
      
      // Test invoice preview functionality
      if (await page.locator('[data-testid="preview-next-invoice"]').isVisible()) {
        await page.click('[data-testid="preview-next-invoice"]');
        await expect(page.locator('[data-testid="invoice-preview-modal"]')).toBeVisible();
        
        // Verify invoice line items
        await expect(page.locator('[data-testid="invoice-line-item"]')).toHaveCount.toBeGreaterThan(0);
        
        await page.click('[data-testid="close-invoice-preview"]');
      }
    });
  });
});