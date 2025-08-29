import { test, expect } from '@playwright/test';
import { supabase } from '../../src/lib/supabase';

/**
 * E2E Test: Complete user journey from signup to first invoice
 * Covers: Signup -> Onboarding -> First Invoice Creation
 */

test.describe('User Journey: Signup to First Invoice', () => {
  let testUserEmail: string;
  let testUserId: string;
  let testCompanyId: string;

  test.beforeEach(async () => {
    // Generate unique test user email
    const timestamp = Date.now();
    testUserEmail = `test+${timestamp}@casskai.test`;
    
    // Clean up any existing test data
    await test.step('Clean up existing test data', async () => {
      try {
        // Delete test user if exists (cleanup from previous tests)
        const { data: existingUser } = await supabase.auth.admin.getUserByEmail(testUserEmail);
        if (existingUser?.user) {
          await supabase.auth.admin.deleteUser(existingUser.user.id);
        }
      } catch (error) {
        console.log('No existing test user to clean up');
      }
    });
  });

  test.afterEach(async () => {
    // Clean up test data after each test
    await test.step('Clean up test data', async () => {
      if (testUserId) {
        try {
          // Delete company data
          if (testCompanyId) {
            await supabase.from('companies').delete().eq('id', testCompanyId);
          }
          
          // Delete user
          await supabase.auth.admin.deleteUser(testUserId);
        } catch (error) {
          console.log('Cleanup error:', error);
        }
      }
    });
  });

  test('should complete full journey: signup -> onboarding -> first invoice', async ({ page }) => {
    // Step 1: User Registration
    await test.step('User completes registration', async () => {
      await page.goto('/auth');
      
      // Switch to signup mode
      await page.click('[data-testid="signup-tab"]');
      
      // Fill registration form
      await page.fill('[data-testid="email-input"]', testUserEmail);
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.fill('[data-testid="confirm-password-input"]', 'TestPassword123!');
      
      // Submit registration
      await page.click('[data-testid="signup-button"]');
      
      // Wait for email confirmation dialog or redirect
      await expect(page.locator('[data-testid="email-confirmation-dialog"]')).toBeVisible({ timeout: 10000 });
    });

    // Step 2: Email Verification (simulate)
    await test.step('Simulate email verification', async () => {
      // In a real test environment, we would need to handle email verification
      // For this test, we'll assume the user is verified and logged in
      
      // For testing purposes, we can verify the user directly in the database
      const { data: users } = await supabase.auth.admin.listUsers();
      const testUser = users.users.find(user => user.email === testUserEmail);
      
      if (testUser) {
        testUserId = testUser.id;
        // Mark email as verified
        await supabase.auth.admin.updateUserById(testUserId, {
          email_confirmed_at: new Date().toISOString()
        });
        
        // Create a session for the user
        const { data: session } = await supabase.auth.admin.createSignInLink(testUserEmail);
        if (session?.properties?.action_link) {
          // Extract the verification token and navigate to it
          const url = new URL(session.properties.action_link);
          await page.goto(url.pathname + url.search + url.hash);
        }
      }
    });

    // Step 3: Onboarding - Welcome Step
    await test.step('Complete welcome step', async () => {
      await page.waitForURL('**/onboarding**', { timeout: 15000 });
      
      // Verify welcome step is displayed
      await expect(page.locator('[data-testid="welcome-step"]')).toBeVisible();
      
      // Click continue to proceed
      await page.click('[data-testid="continue-button"]');
    });

    // Step 4: Onboarding - Company Information
    await test.step('Fill company information', async () => {
      // Wait for company step
      await expect(page.locator('[data-testid="company-step"]')).toBeVisible();
      
      // Fill company details
      await page.fill('[data-testid="company-name-input"]', 'Test Company Ltd');
      await page.fill('[data-testid="company-address-input"]', '123 Test Street');
      await page.fill('[data-testid="company-city-input"]', 'Test City');
      await page.fill('[data-testid="company-postal-code-input"]', '12345');
      
      // Select country
      await page.click('[data-testid="country-selector"]');
      await page.click('[data-testid="country-option-FR"]');
      
      // Select business sector
      await page.click('[data-testid="sector-selector"]');
      await page.click('[data-testid="sector-option-services"]');
      
      // Continue to next step
      await page.click('[data-testid="continue-button"]');
    });

    // Step 5: Onboarding - Preferences
    await test.step('Configure preferences', async () => {
      await expect(page.locator('[data-testid="preferences-step"]')).toBeVisible();
      
      // Select accounting standard
      await page.click('[data-testid="accounting-standard-pcg"]');
      
      // Select currency
      await page.click('[data-testid="currency-selector"]');
      await page.click('[data-testid="currency-option-EUR"]');
      
      // Select modules
      await page.check('[data-testid="module-invoicing"]');
      await page.check('[data-testid="module-accounting"]');
      
      // Continue to next step
      await page.click('[data-testid="continue-button"]');
    });

    // Step 6: Onboarding - Features Selection
    await test.step('Select features', async () => {
      await expect(page.locator('[data-testid="features-step"]')).toBeVisible();
      
      // Select key features for testing
      await page.check('[data-testid="feature-client-management"]');
      await page.check('[data-testid="feature-invoice-generation"]');
      await page.check('[data-testid="feature-payment-tracking"]');
      
      // Continue to complete onboarding
      await page.click('[data-testid="continue-button"]');
    });

    // Step 7: Complete Onboarding
    await test.step('Complete onboarding', async () => {
      await expect(page.locator('[data-testid="complete-step"]')).toBeVisible();
      
      // Click finish onboarding
      await page.click('[data-testid="finish-onboarding-button"]');
      
      // Should redirect to dashboard
      await page.waitForURL('**/dashboard**', { timeout: 10000 });
      await expect(page.locator('[data-testid="dashboard-welcome"]')).toBeVisible();
    });

    // Step 8: Create First Client
    await test.step('Create first client', async () => {
      // Navigate to client management
      await page.click('[data-testid="sidebar-clients"]');
      await page.waitForURL('**/invoicing**');
      
      // Switch to clients tab
      await page.click('[data-testid="clients-tab"]');
      
      // Create new client
      await page.click('[data-testid="add-client-button"]');
      
      // Fill client form
      await page.fill('[data-testid="client-name-input"]', 'Test Client Corp');
      await page.fill('[data-testid="client-email-input"]', 'client@testcorp.com');
      await page.fill('[data-testid="client-phone-input"]', '+33123456789');
      await page.fill('[data-testid="client-address-input"]', '456 Client Avenue');
      await page.fill('[data-testid="client-city-input"]', 'Client City');
      await page.fill('[data-testid="client-postal-code-input"]', '67890');
      
      // Save client
      await page.click('[data-testid="save-client-button"]');
      
      // Verify client was created
      await expect(page.locator('[data-testid="client-created-toast"]')).toBeVisible();
      await expect(page.locator('text=Test Client Corp')).toBeVisible();
    });

    // Step 9: Create First Invoice
    await test.step('Create first invoice', async () => {
      // Switch to invoices tab
      await page.click('[data-testid="invoices-tab"]');
      
      // Create new invoice
      await page.click('[data-testid="add-invoice-button"]');
      
      // Select client
      await page.click('[data-testid="invoice-client-selector"]');
      await page.click('[data-testid="client-option-test-client-corp"]');
      
      // Fill invoice details
      await page.fill('[data-testid="invoice-number-input"]', 'INV-001');
      
      // Set issue date (today)
      const today = new Date().toISOString().split('T')[0];
      await page.fill('[data-testid="invoice-issue-date"]', today);
      
      // Set due date (30 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      await page.fill('[data-testid="invoice-due-date"]', dueDate.toISOString().split('T')[0]);
      
      // Add invoice line
      await page.click('[data-testid="add-line-button"]');
      
      // Fill line details
      await page.fill('[data-testid="line-description-0"]', 'Consulting Services');
      await page.fill('[data-testid="line-quantity-0"]', '5');
      await page.fill('[data-testid="line-unit-price-0"]', '150');
      await page.fill('[data-testid="line-tax-rate-0"]', '20');
      
      // Verify calculated totals
      await expect(page.locator('[data-testid="invoice-subtotal"]')).toHaveText('750,00 €');
      await expect(page.locator('[data-testid="invoice-tax-amount"]')).toHaveText('150,00 €');
      await expect(page.locator('[data-testid="invoice-total"]')).toHaveText('900,00 €');
    });

    // Step 10: Save and Send Invoice
    await test.step('Save and send invoice', async () => {
      // Save invoice as draft first
      await page.click('[data-testid="save-invoice-button"]');
      
      // Verify invoice was saved
      await expect(page.locator('[data-testid="invoice-saved-toast"]')).toBeVisible();
      
      // Send invoice
      await page.click('[data-testid="send-invoice-button"]');
      
      // Confirm send in modal
      await page.click('[data-testid="confirm-send-button"]');
      
      // Verify invoice status changed to sent
      await expect(page.locator('[data-testid="invoice-status"]')).toHaveText('Envoyée');
      await expect(page.locator('[data-testid="invoice-sent-toast"]')).toBeVisible();
    });

    // Step 11: Verify Invoice in List
    await test.step('Verify invoice appears in list', async () => {
      // Navigate back to invoices list
      await page.click('[data-testid="back-to-invoices"]');
      
      // Verify invoice appears in the list
      await expect(page.locator('[data-testid="invoice-row-INV-001"]')).toBeVisible();
      await expect(page.locator('[data-testid="invoice-client-INV-001"]')).toHaveText('Test Client Corp');
      await expect(page.locator('[data-testid="invoice-amount-INV-001"]')).toHaveText('900,00 €');
      await expect(page.locator('[data-testid="invoice-status-INV-001"]')).toHaveText('Envoyée');
    });

    // Step 12: Verify Dashboard Analytics Update
    await test.step('Verify dashboard reflects new invoice', async () => {
      // Navigate to dashboard
      await page.click('[data-testid="sidebar-dashboard"]');
      
      // Verify revenue widget shows the invoice
      await expect(page.locator('[data-testid="total-revenue"]')).toContainText('900');
      await expect(page.locator('[data-testid="pending-invoices-count"]')).toContainText('1');
      
      // Verify recent activity shows invoice creation
      await expect(page.locator('[data-testid="recent-activity"]')).toContainText('Facture INV-001 créée');
    });

    // Capture company ID for cleanup
    await test.step('Capture test data for cleanup', async () => {
      // Get company ID from the current session
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: company } = await supabase
          .from('companies')
          .select('id')
          .eq('created_by', user.id)
          .single();
        
        if (company) {
          testCompanyId = company.id;
        }
      }
    });
  });

  test('should handle errors gracefully during onboarding', async ({ page }) => {
    await test.step('Navigate to onboarding', async () => {
      await page.goto('/auth');
      
      // Simulate logged-in state by setting localStorage
      await page.evaluate(() => {
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          currentSession: {
            access_token: 'mock-token',
            user: { id: 'mock-user-id', email: 'test@example.com' }
          }
        }));
      });
      
      await page.goto('/onboarding');
    });

    await test.step('Test validation errors', async () => {
      // Try to proceed without filling required fields
      await page.click('[data-testid="continue-button"]');
      
      // Should show validation errors
      await expect(page.locator('[data-testid="error-company-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-country"]')).toBeVisible();
    });

    await test.step('Test network error handling', async () => {
      // Simulate network failure
      await page.route('**/supabase/**', route => {
        route.abort('failed');
      });
      
      // Fill form and try to submit
      await page.fill('[data-testid="company-name-input"]', 'Test Company');
      await page.click('[data-testid="continue-button"]');
      
      // Should show error message
      await expect(page.locator('[data-testid="network-error-toast"]')).toBeVisible();
    });
  });

  test('should save progress during onboarding', async ({ page }) => {
    await test.step('Fill partial onboarding data', async () => {
      await page.goto('/onboarding');
      
      // Fill company information
      await page.fill('[data-testid="company-name-input"]', 'Progressive Company');
      await page.fill('[data-testid="company-address-input"]', 'Auto-save Test');
      
      // Wait for auto-save (if implemented)
      await page.waitForTimeout(2000);
    });

    await test.step('Refresh page and verify data persistence', async () => {
      await page.reload();
      
      // Data should be preserved
      await expect(page.locator('[data-testid="company-name-input"]')).toHaveValue('Progressive Company');
      await expect(page.locator('[data-testid="company-address-input"]')).toHaveValue('Auto-save Test');
    });
  });
});