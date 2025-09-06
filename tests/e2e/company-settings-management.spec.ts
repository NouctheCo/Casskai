// @ts-nocheck
import { test, expect } from '@playwright/test';
import { supabase } from '../../src/lib/supabase';

/**
 * E2E Test: Company Settings Management
 * Covers: Company profile updates, preferences, integrations, and security settings
 */

test.describe('Company Settings Management', () => {
  let testUserEmail: string;
  let testUserId: string;
  let testCompanyId: string;

  test.beforeAll(async () => {
    // Create test user and company
    const timestamp = Date.now();
    testUserEmail = `settingstest+${timestamp}@casskai.test`;

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
        name: 'Settings Test Company',
        email: testUserEmail,
        country: 'FR',
        currency: 'EUR',
        created_by: testUserId,
        onboarding_completed: true,
        phone: '+33123456789',
        address: '123 Test Street',
        city: 'Test City',
        postal_code: '12345',
        siret: '12345678901234',
        vat_number: 'FR12345678901'
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
      await supabase.from('company_integrations').delete().eq('company_id', testCompanyId);
      await supabase.from('companies').delete().eq('id', testCompanyId);
    }
    
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  test('should manage complete company settings', async ({ page }) => {
    // Step 1: Login
    await test.step('Login to application', async () => {
      await page.goto('/auth');
      
      await page.fill('[data-testid="email-input"]', testUserEmail);
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('**/dashboard**', { timeout: 10000 });
      await expect(page.locator('[data-testid="dashboard-welcome"]')).toBeVisible();
    });

    // Step 2: Navigate to Settings
    await test.step('Navigate to company settings', async () => {
      await page.click('[data-testid="sidebar-settings"]');
      await page.waitForURL('**/settings**');
      
      // Verify settings tabs are available
      await expect(page.locator('[data-testid="settings-tabs"]')).toBeVisible();
      await expect(page.locator('[data-testid="company-tab"]')).toBeVisible();
      await expect(page.locator('[data-testid="preferences-tab"]')).toBeVisible();
      await expect(page.locator('[data-testid="integrations-tab"]')).toBeVisible();
      await expect(page.locator('[data-testid="security-tab"]')).toBeVisible();
    });

    // Step 3: Update Company Information
    await test.step('Update company profile information', async () => {
      // Should be on company tab by default
      await expect(page.locator('[data-testid="company-settings-form"]')).toBeVisible();
      
      // Verify current data is loaded
      await expect(page.locator('[data-testid="company-name"]')).toHaveValue('Settings Test Company');
      await expect(page.locator('[data-testid="company-email"]')).toHaveValue(testUserEmail);
      
      // Update company information
      await page.fill('[data-testid="company-name"]', 'Updated Settings Test Company SARL');
      await page.fill('[data-testid="company-website"]', 'https://www.updatedcompany.com');
      await page.fill('[data-testid="company-phone"]', '+33 1 98 76 54 32');
      
      // Update address
      await page.fill('[data-testid="company-address"]', '456 New Business Avenue');
      await page.fill('[data-testid="company-address-2"]', 'Suite 200');
      await page.fill('[data-testid="company-city"]', 'Paris');
      await page.fill('[data-testid="company-postal-code"]', '75001');
      await page.selectOption('[data-testid="company-country"]', 'FR');
      
      // Update business information
      await page.fill('[data-testid="company-description"]', 'Société de conseil en technologies innovantes spécialisée dans le développement d\'applications métier.');
      await page.selectOption('[data-testid="company-sector"]', 'technology');
      await page.fill('[data-testid="company-employees"]', '25');
      
      // Save changes
      await page.click('[data-testid="save-company-info"]');
      await expect(page.locator('[data-testid="company-saved-toast"]')).toBeVisible();
    });

    // Step 4: Update Business Settings
    await test.step('Configure business preferences', async () => {
      await page.click('[data-testid="preferences-tab"]');
      await expect(page.locator('[data-testid="preferences-form"]')).toBeVisible();
      
      // Accounting preferences
      await page.selectOption('[data-testid="accounting-standard"]', 'PCG');
      await page.selectOption('[data-testid="fiscal-year-end"]', '12-31');
      await page.selectOption('[data-testid="default-currency"]', 'EUR');
      
      // Invoice preferences
      await page.fill('[data-testid="invoice-prefix"]', 'FAC');
      await page.fill('[data-testid="invoice-starting-number"]', '1000');
      await page.fill('[data-testid="quote-prefix"]', 'DEV');
      await page.selectOption('[data-testid="default-payment-terms"]', '30');
      
      // Tax settings
      await page.fill('[data-testid="default-vat-rate"]', '20');
      await page.check('[data-testid="vat-included-by-default"]');
      
      // Date and number formats
      await page.selectOption('[data-testid="date-format"]', 'DD/MM/YYYY');
      await page.selectOption('[data-testid="number-format"]', 'french');
      await page.selectOption('[data-testid="currency-display"]', 'symbol');
      
      // Save preferences
      await page.click('[data-testid="save-preferences"]');
      await expect(page.locator('[data-testid="preferences-saved-toast"]')).toBeVisible();
    });

    // Step 5: Configure Notifications
    await test.step('Set up notification preferences', async () => {
      // Scroll to notifications section
      await page.scrollIntoViewIfNeeded('[data-testid="notification-settings"]');
      
      // Email notifications
      await page.check('[data-testid="notify-invoice-sent"]');
      await page.check('[data-testid="notify-payment-received"]');
      await page.check('[data-testid="notify-quote-accepted"]');
      await page.check('[data-testid="notify-overdue-invoices"]');
      
      // Set notification frequency
      await page.selectOption('[data-testid="overdue-reminder-frequency"]', '7'); // Weekly
      await page.selectOption('[data-testid="report-frequency"]', '30'); // Monthly
      
      // SMS notifications (if available)
      await page.check('[data-testid="sms-notifications-enabled"]');
      await page.fill('[data-testid="sms-phone-number"]', '+33123456789');
      
      await page.click('[data-testid="save-preferences"]');
      await expect(page.locator('[data-testid="preferences-saved-toast"]')).toBeVisible();
    });

    // Step 6: Configure Integrations
    await test.step('Set up third-party integrations', async () => {
      await page.click('[data-testid="integrations-tab"]');
      await expect(page.locator('[data-testid="integrations-list"]')).toBeVisible();
      
      // Banking integration
      await page.click('[data-testid="banking-integration-card"]');
      await expect(page.locator('[data-testid="banking-integration-modal"]')).toBeVisible();
      
      // Configure bank connection (simulation)
      await page.selectOption('[data-testid="bank-provider"]', 'bridge');
      await page.fill('[data-testid="bank-client-id"]', 'test_client_id_123');
      await page.fill('[data-testid="bank-client-secret"]', 'test_client_secret_456');
      
      await page.click('[data-testid="test-bank-connection"]');
      await expect(page.locator('[data-testid="connection-test-success"]')).toBeVisible();
      
      await page.click('[data-testid="save-bank-integration"]');
      await page.click('[data-testid="close-integration-modal"]');
      
      // Payment integration (Stripe)
      await page.click('[data-testid="payment-integration-card"]');
      await expect(page.locator('[data-testid="payment-integration-modal"]')).toBeVisible();
      
      await page.fill('[data-testid="stripe-publishable-key"]', 'pk_test_123456789');
      await page.fill('[data-testid="stripe-secret-key"]', 'sk_test_987654321');
      await page.fill('[data-testid="stripe-webhook-secret"]', 'whsec_test_webhook_123');
      
      await page.check('[data-testid="enable-online-payments"]');
      await page.check('[data-testid="enable-subscriptions"]');
      
      await page.click('[data-testid="test-stripe-connection"]');
      await expect(page.locator('[data-testid="stripe-test-success"]')).toBeVisible();
      
      await page.click('[data-testid="save-payment-integration"]');
      await page.click('[data-testid="close-integration-modal"]');
      
      // Email integration
      await page.click('[data-testid="email-integration-card"]');
      await expect(page.locator('[data-testid="email-integration-modal"]')).toBeVisible();
      
      await page.selectOption('[data-testid="email-provider"]', 'smtp');
      await page.fill('[data-testid="smtp-host"]', 'smtp.company.com');
      await page.fill('[data-testid="smtp-port"]', '587');
      await page.fill('[data-testid="smtp-username"]', 'noreply@updatedcompany.com');
      await page.fill('[data-testid="smtp-password"]', 'smtp_password_123');
      
      await page.check('[data-testid="smtp-use-tls"]');
      
      await page.click('[data-testid="test-email-connection"]');
      await page.fill('[data-testid="test-email-address"]', testUserEmail);
      await page.click('[data-testid="send-test-email"]');
      
      await expect(page.locator('[data-testid="email-test-success"]')).toBeVisible();
      
      await page.click('[data-testid="save-email-integration"]');
      await page.click('[data-testid="close-integration-modal"]');
    });

    // Step 7: Configure Security Settings
    await test.step('Configure security and access settings', async () => {
      await page.click('[data-testid="security-tab"]');
      await expect(page.locator('[data-testid="security-settings-form"]')).toBeVisible();
      
      // Password policy
      await page.check('[data-testid="require-strong-passwords"]');
      await page.selectOption('[data-testid="password-expiry"]', '90'); // 90 days
      await page.selectOption('[data-testid="failed-login-attempts"]', '5');
      
      // Two-factor authentication
      await page.click('[data-testid="enable-2fa-button"]');
      await expect(page.locator('[data-testid="2fa-setup-modal"]')).toBeVisible();
      
      // QR code should be displayed for 2FA setup
      await expect(page.locator('[data-testid="2fa-qr-code"]')).toBeVisible();
      
      // Simulate 2FA setup completion
      await page.fill('[data-testid="2fa-verification-code"]', '123456');
      await page.click('[data-testid="verify-2fa-button"]');
      await expect(page.locator('[data-testid="2fa-setup-success"]')).toBeVisible();
      await page.click('[data-testid="close-2fa-modal"]');
      
      // Session management
      await page.selectOption('[data-testid="session-timeout"]', '480'); // 8 hours
      await page.check('[data-testid="force-logout-inactive-users"]');
      
      // IP restrictions (for enterprise)
      await page.check('[data-testid="enable-ip-restrictions"]');
      await page.fill('[data-testid="allowed-ip-ranges"]', '192.168.1.0/24\n10.0.0.0/16');
      
      // Audit logging
      await page.check('[data-testid="enable-audit-logging"]');
      await page.check('[data-testid="log-data-access"]');
      await page.check('[data-testid="log-data-modifications"]');
      await page.selectOption('[data-testid="audit-retention"]', '365'); // 1 year
      
      await page.click('[data-testid="save-security-settings"]');
      await expect(page.locator('[data-testid="security-saved-toast"]')).toBeVisible();
    });

    // Step 8: Set up Data Backup and Export
    await test.step('Configure data backup settings', async () => {
      await page.scrollIntoViewIfNeeded('[data-testid="data-management-section"]');
      
      // Automated backups
      await page.check('[data-testid="enable-automated-backups"]');
      await page.selectOption('[data-testid="backup-frequency"]', 'daily');
      await page.selectOption('[data-testid="backup-retention"]', '30'); // 30 days
      
      // Export settings
      await page.selectOption('[data-testid="default-export-format"]', 'excel');
      await page.check('[data-testid="include-attachments-export"]');
      
      // GDPR compliance
      await page.check('[data-testid="enable-data-anonymization"]');
      await page.selectOption('[data-testid="data-retention-period"]', '2555'); // 7 years
      
      await page.click('[data-testid="save-security-settings"]');
      await expect(page.locator('[data-testid="security-saved-toast"]')).toBeVisible();
    });

    // Step 9: Test Data Export
    await test.step('Test data export functionality', async () => {
      await page.click('[data-testid="export-company-data-button"]');
      await expect(page.locator('[data-testid="export-modal"]')).toBeVisible();
      
      // Select data to export
      await page.check('[data-testid="export-company-info"]');
      await page.check('[data-testid="export-invoices"]');
      await page.check('[data-testid="export-clients"]');
      await page.check('[data-testid="export-quotes"]');
      
      // Select format and options
      await page.selectOption('[data-testid="export-format"]', 'excel');
      await page.check('[data-testid="include-metadata"]');
      
      // Start export
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="start-export-button"]');
      
      // Wait for export completion
      await expect(page.locator('[data-testid="export-progress"]')).toBeVisible();
      await expect(page.locator('[data-testid="export-completed"]')).toBeVisible({ timeout: 30000 });
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('company-data-export');
      expect(download.suggestedFilename()).toContain('.xlsx');
      
      await page.click('[data-testid="close-export-modal"]');
    });

    // Step 10: Manage User Access and Permissions
    await test.step('Configure user management settings', async () => {
      await page.click('[data-testid="users-tab"]');
      await expect(page.locator('[data-testid="users-management"]')).toBeVisible();
      
      // Invite new user
      await page.click('[data-testid="invite-user-button"]');
      await expect(page.locator('[data-testid="invite-user-modal"]')).toBeVisible();
      
      await page.fill('[data-testid="invite-email"]', 'colleague@updatedcompany.com');
      await page.fill('[data-testid="invite-first-name"]', 'Jean');
      await page.fill('[data-testid="invite-last-name"]', 'Dupont');
      await page.selectOption('[data-testid="invite-role"]', 'accountant');
      
      // Set permissions
      await page.check('[data-testid="permission-view-invoices"]');
      await page.check('[data-testid="permission-create-invoices"]');
      await page.check('[data-testid="permission-view-reports"]');
      // Do not check admin permissions
      
      await page.click('[data-testid="send-invitation"]');
      await expect(page.locator('[data-testid="invitation-sent-toast"]')).toBeVisible();
      await page.click('[data-testid="close-invite-modal"]');
      
      // Verify user appears in list
      await expect(page.locator('[data-testid="invited-user-colleague"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-status-invited"]')).toBeVisible();
    });

    // Step 11: Configure API Access
    await test.step('Set up API access and webhooks', async () => {
      await page.click('[data-testid="api-tab"]');
      await expect(page.locator('[data-testid="api-settings"]')).toBeVisible();
      
      // Generate API key
      await page.click('[data-testid="generate-api-key"]');
      await expect(page.locator('[data-testid="api-key-generated-modal"]')).toBeVisible();
      
      // Copy API key (simulation)
      const apiKey = await page.locator('[data-testid="generated-api-key"]').textContent();
      expect(apiKey).toBeTruthy();
      expect(apiKey).toMatch(/^sk_/);
      
      await page.click('[data-testid="copy-api-key"]');
      await page.click('[data-testid="confirm-api-key-copied"]');
      
      // Configure webhooks
      await page.click('[data-testid="add-webhook-button"]');
      await page.fill('[data-testid="webhook-name"]', 'Invoice Created Webhook');
      await page.fill('[data-testid="webhook-url"]', 'https://api.updatedcompany.com/webhooks/invoice-created');
      
      await page.check('[data-testid="webhook-event-invoice-created"]');
      await page.check('[data-testid="webhook-event-invoice-paid"]');
      await page.check('[data-testid="webhook-event-quote-accepted"]');
      
      await page.fill('[data-testid="webhook-secret"]', 'webhook_secret_123');
      
      await page.click('[data-testid="test-webhook"]');
      await expect(page.locator('[data-testid="webhook-test-success"]')).toBeVisible();
      
      await page.click('[data-testid="save-webhook"]');
      await expect(page.locator('[data-testid="webhook-saved-toast"]')).toBeVisible();
    });

    // Step 12: Review and Apply All Changes
    await test.step('Review all configuration changes', async () => {
      // Navigate back to company tab to verify all changes
      await page.click('[data-testid="company-tab"]');
      
      // Verify company information was saved
      await expect(page.locator('[data-testid="company-name"]')).toHaveValue('Updated Settings Test Company SARL');
      await expect(page.locator('[data-testid="company-website"]')).toHaveValue('https://www.updatedcompany.com');
      await expect(page.locator('[data-testid="company-address"]')).toHaveValue('456 New Business Avenue');
      
      // Check integration status indicators
      await page.click('[data-testid="integrations-tab"]');
      await expect(page.locator('[data-testid="banking-integration-status-connected"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-integration-status-connected"]')).toBeVisible();
      await expect(page.locator('[data-testid="email-integration-status-connected"]')).toBeVisible();
      
      // Verify security settings
      await page.click('[data-testid="security-tab"]');
      await expect(page.locator('[data-testid="2fa-enabled-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="audit-logging-status"]')).toContainText('Activé');
    });

    // Step 13: Test Settings Impact on Application
    await test.step('Verify settings impact across application', async () => {
      // Navigate to invoice creation to test preferences
      await page.click('[data-testid="sidebar-invoicing"]');
      await page.click('[data-testid="add-invoice-button"]');
      
      // Verify invoice number uses new prefix
      await expect(page.locator('[data-testid="invoice-number"]')).toHaveValue('FAC-1000');
      
      // Verify default payment terms
      await expect(page.locator('[data-testid="invoice-payment-terms"]')).toHaveValue('30');
      
      // Verify VAT rate default
      await page.click('[data-testid="add-invoice-line"]');
      await expect(page.locator('[data-testid="line-tax-rate-0"]')).toHaveValue('20');
      
      // Cancel invoice creation
      await page.click('[data-testid="cancel-invoice-creation"]');
      
      // Check dashboard for updated company name
      await page.click('[data-testid="sidebar-dashboard"]');
      await expect(page.locator('[data-testid="company-name-header"]')).toContainText('Updated Settings Test Company SARL');
    });
  });

  test('should handle settings validation and errors', async ({ page }) => {
    await test.step('Login and navigate to settings', async () => {
      await page.goto('/auth');
      await page.fill('[data-testid="email-input"]', testUserEmail);
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('**/dashboard**');
      await page.click('[data-testid="sidebar-settings"]');
    });

    await test.step('Test validation errors', async () => {
      // Test invalid email format
      await page.fill('[data-testid="company-email"]', 'invalid-email');
      await page.click('[data-testid="save-company-info"]');
      
      await expect(page.locator('[data-testid="email-validation-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="email-validation-error"]')).toContainText('Format email invalide');
      
      // Test invalid phone format
      await page.fill('[data-testid="company-email"]', 'valid@email.com'); // Fix email
      await page.fill('[data-testid="company-phone"]', 'invalid-phone');
      await page.click('[data-testid="save-company-info"]');
      
      await expect(page.locator('[data-testid="phone-validation-error"]')).toBeVisible();
      
      // Test invalid SIRET
      await page.fill('[data-testid="company-phone"]', '+33123456789'); // Fix phone
      await page.fill('[data-testid="company-siret"]', '123'); // Too short
      await page.click('[data-testid="save-company-info"]');
      
      await expect(page.locator('[data-testid="siret-validation-error"]')).toBeVisible();
    });

    await test.step('Test network error handling', async () => {
      // Fix all validation errors
      await page.fill('[data-testid="company-siret"]', '12345678901234');
      
      // Simulate network error
      await page.route('**/companies/**', route => {
        route.abort('failed');
      });
      
      await page.click('[data-testid="save-company-info"]');
      
      // Should show network error
      await expect(page.locator('[data-testid="network-error-toast"]')).toBeVisible();
      await expect(page.locator('[data-testid="network-error-toast"]')).toContainText('Erreur de réseau');
    });

    await test.step('Test settings conflict resolution', async () => {
      // Clear network route
      await page.unroute('**/companies/**');
      
      // Simulate concurrent modification
      await page.evaluate(() => {
        localStorage.setItem('settings_modified_at', Date.now().toString());
      });
      
      await page.click('[data-testid="save-company-info"]');
      
      // Should show conflict resolution dialog
      await expect(page.locator('[data-testid="settings-conflict-dialog"]')).toBeVisible();
      
      // Choose to overwrite
      await page.click('[data-testid="overwrite-changes"]');
      
      await expect(page.locator('[data-testid="company-saved-toast"]')).toBeVisible();
    });
  });

  test('should support settings import and export', async ({ page }) => {
    await test.step('Login and navigate to settings', async () => {
      await page.goto('/auth');
      await page.fill('[data-testid="email-input"]', testUserEmail);
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('**/dashboard**');
      await page.click('[data-testid="sidebar-settings"]');
    });

    await test.step('Export current settings', async () => {
      await page.click('[data-testid="advanced-tab"]');
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-settings-button"]');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('company-settings');
      expect(download.suggestedFilename()).toContain('.json');
    });

    await test.step('Import settings configuration', async () => {
      // Create mock settings file
      const mockSettings = {
        company: {
          name: 'Imported Company Name',
          website: 'https://imported.com'
        },
        preferences: {
          currency: 'USD',
          invoice_prefix: 'IMP'
        }
      };
      
      // Simulate file upload
      await page.setInputFiles('[data-testid="import-settings-file"]', {
        name: 'settings.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(mockSettings))
      });
      
      // Preview import
      await page.click('[data-testid="preview-import"]');
      await expect(page.locator('[data-testid="import-preview-modal"]')).toBeVisible();
      
      // Verify changes preview
      await expect(page.locator('text=Imported Company Name')).toBeVisible();
      await expect(page.locator('text=USD')).toBeVisible();
      
      // Apply import
      await page.click('[data-testid="apply-import"]');
      await expect(page.locator('[data-testid="settings-imported-toast"]')).toBeVisible();
      
      // Verify changes were applied
      await page.click('[data-testid="company-tab"]');
      await expect(page.locator('[data-testid="company-name"]')).toHaveValue('Imported Company Name');
      await expect(page.locator('[data-testid="company-website"]')).toHaveValue('https://imported.com');
    });
  });
});