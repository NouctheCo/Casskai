import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';

test.describe('Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Inject axe for accessibility testing
    await injectAxe(page);
  });

  test.describe('Authentication Flow', () => {
    test('should allow user to sign up', async ({ page }) => {
      await page.goto('/auth');

      // Switch to sign up form
      await page.click('[data-testid="switch-to-signup"]');
      
      // Fill sign up form
      await page.fill('[data-testid="signup-email"]', 'newuser@casskai.app');
      await page.fill('[data-testid="signup-password"]', 'NewUserPassword123!');
      await page.fill('[data-testid="signup-password-confirm"]', 'NewUserPassword123!');
      
      // Submit form
      await page.click('[data-testid="signup-button"]');
      
      // Should show success message or redirect to email verification
      await expect(page.locator('[data-testid="signup-success"]')).toBeVisible();
    });

    test('should handle login errors gracefully', async ({ page }) => {
      await page.goto('/auth');
      
      // Try to login with invalid credentials
      await page.fill('[data-testid="email-input"]', 'invalid@email.com');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      await page.click('[data-testid="login-button"]');
      
      // Should show error message
      await expect(page.locator('[data-testid="auth-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="auth-error"]')).toContainText('Invalid');
    });

    test('should allow password reset', async ({ page }) => {
      await page.goto('/auth');
      
      // Click forgot password
      await page.click('[data-testid="forgot-password-link"]');
      
      // Fill email
      await page.fill('[data-testid="reset-email"]', 'user@casskai.app');
      
      // Submit
      await page.click('[data-testid="reset-submit"]');
      
      // Should show success message
      await expect(page.locator('[data-testid="reset-success"]')).toBeVisible();
    });
  });

  test.describe('Dashboard Navigation', () => {
    test('should navigate to all main sections', async ({ page }) => {
      await page.goto('/dashboard');

      // Test navigation to each main section
      const sections = [
        { selector: '[data-testid="nav-accounting"]', url: '/accounting' },
        { selector: '[data-testid="nav-banks"]', url: '/banks' },
        { selector: '[data-testid="nav-invoicing"]', url: '/invoicing' },
        { selector: '[data-testid="nav-inventory"]', url: '/inventory' },
        { selector: '[data-testid="nav-projects"]', url: '/projects' },
        { selector: '[data-testid="nav-hr"]', url: '/hr' },
        { selector: '[data-testid="nav-settings"]', url: '/settings' },
      ];

      for (const section of sections) {
        await page.click(section.selector);
        await page.waitForURL(`**${section.url}`);
        
        // Check that the page loaded successfully
        await expect(page.locator('main')).toBeVisible();
        
        // Run accessibility check on each page
        await checkA11y(page, undefined, {
          detailedReport: true,
          detailedReportOptions: { html: true },
        });
      }
    });

    test('should display dashboard widgets correctly', async ({ page }) => {
      await page.goto('/dashboard');

      // Check that main dashboard widgets are visible
      await expect(page.locator('[data-testid="revenue-widget"]')).toBeVisible();
      await expect(page.locator('[data-testid="expenses-widget"]')).toBeVisible();
      await expect(page.locator('[data-testid="profit-widget"]')).toBeVisible();
      await expect(page.locator('[data-testid="cash-flow-widget"]')).toBeVisible();

      // Check that charts are loaded
      await expect(page.locator('canvas')).toHaveCount(4); // Assuming 4 charts

      // Test widget interaction
      await page.click('[data-testid="revenue-widget-expand"]');
      await expect(page.locator('[data-testid="revenue-details"]')).toBeVisible();
    });

    test('should handle responsive design', async ({ page }) => {
      await page.goto('/dashboard');

      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check that mobile navigation works
      await page.click('[data-testid="mobile-menu-toggle"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Check that widgets stack properly
      const widgets = page.locator('[data-testid*="widget"]');
      await expect(widgets).toHaveCount(4);
    });
  });

  test.describe('Banking Integration Flow', () => {
    test('should connect a bank account', async ({ page }) => {
      await page.goto('/banks');

      // Click connect new bank
      await page.click('[data-testid="connect-bank-button"]');
      
      // Select provider
      await page.selectOption('[data-testid="provider-select"]', 'bridge');
      
      // Select bank
      await page.selectOption('[data-testid="bank-select"]', 'bnp_paribas');
      
      // Click connect (will redirect to PSD2 flow)
      await page.click('[data-testid="connect-submit"]');
      
      // Should redirect to bank auth page or show success message
      // Note: In real tests, we'd mock the PSD2 flow
      await expect(page.locator('[data-testid="connection-pending"]')).toBeVisible();
    });

    test('should display bank transactions', async ({ page }) => {
      await page.goto('/banks');

      // Assuming we have connected accounts
      await page.click('[data-testid="view-transactions-button"]');
      
      // Should show transactions list
      await expect(page.locator('[data-testid="transactions-list"]')).toBeVisible();
      
      // Check transaction items
      const transactions = page.locator('[data-testid="transaction-item"]');
      await expect(transactions.first()).toBeVisible();
    });

    test('should perform transaction reconciliation', async ({ page }) => {
      await page.goto('/banks');
      
      // Navigate to reconciliation
      await page.click('[data-testid="reconcile-button"]');
      
      // Should show reconciliation interface
      await expect(page.locator('[data-testid="reconciliation-dashboard"]')).toBeVisible();
      
      // Test manual reconciliation
      await page.click('[data-testid="reconcile-transaction-button"]');
      
      // Should show success feedback
      await expect(page.locator('[data-testid="reconciliation-success"]')).toBeVisible();
    });
  });

  test.describe('Accounting Workflows', () => {
    test('should create a journal entry', async ({ page }) => {
      await page.goto('/accounting');

      // Click add journal entry
      await page.click('[data-testid="add-journal-entry"]');
      
      // Fill journal entry form
      await page.fill('[data-testid="entry-description"]', 'Test journal entry');
      await page.fill('[data-testid="debit-account"]', '607000');
      await page.fill('[data-testid="debit-amount"]', '100.00');
      await page.fill('[data-testid="credit-account"]', '512000');
      await page.fill('[data-testid="credit-amount"]', '100.00');
      
      // Submit
      await page.click('[data-testid="save-journal-entry"]');
      
      // Should show success message
      await expect(page.locator('[data-testid="entry-success"]')).toBeVisible();
      
      // Entry should appear in list
      await expect(page.locator('[data-testid="journal-entries-list"]')).toContainText('Test journal entry');
    });

    test('should import FEC file', async ({ page }) => {
      await page.goto('/accounting');
      
      // Navigate to FEC import
      await page.click('[data-testid="fec-import-tab"]');
      
      // Upload file (we'll use a small test CSV)
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.click('[data-testid="fec-upload-button"]');
      const fileChooser = await fileChooserPromise;
      
      // Create a test CSV content
      const testCSV = 'JournalCode,JournalLib,EcritureNum,EcritureDate,CompteNum,CompteLib,CompAuxNum,CompAuxLib,PieceRef,PieceDate,EcritureLib,Debit,Credit,EcritureLet,DateLet,ValidDate,Montantdevise,Idevise\\nVE,VENTES,VE001,20240101,701000,VENTES,,,"","",Vente produit,0,1000,,"",20240101,0,EUR';
      
      // Note: In a real test, you'd use an actual file
      await fileChooser.setFiles([{
        name: 'test.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(testCSV),
      }]);
      
      // Should show import progress
      await expect(page.locator('[data-testid="import-progress"]')).toBeVisible();
      
      // Should show success when complete
      await expect(page.locator('[data-testid="import-success"]')).toBeVisible();
    });

    test('should generate reports', async ({ page }) => {
      await page.goto('/accounting');
      
      // Navigate to reports
      await page.click('[data-testid="reports-tab"]');
      
      // Generate balance sheet
      await page.click('[data-testid="generate-balance-sheet"]');
      
      // Should show report
      await expect(page.locator('[data-testid="balance-sheet-report"]')).toBeVisible();
      
      // Test export functionality
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-pdf-button"]');
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe('balance-sheet.pdf');
    });
  });

  test.describe('Invoicing Workflow', () => {
    test('should create and send an invoice', async ({ page }) => {
      await page.goto('/invoicing');

      // Create new invoice
      await page.click('[data-testid="create-invoice-button"]');
      
      // Fill invoice form
      await page.fill('[data-testid="client-name"]', 'Test Client');
      await page.fill('[data-testid="client-email"]', 'client@test.com');
      await page.fill('[data-testid="invoice-description"]', 'Consulting services');
      await page.fill('[data-testid="invoice-amount"]', '1500.00');
      
      // Save invoice
      await page.click('[data-testid="save-invoice"]');
      
      // Should redirect to invoice view
      await expect(page.locator('[data-testid="invoice-preview"]')).toBeVisible();
      
      // Send invoice
      await page.click('[data-testid="send-invoice-button"]');
      
      // Should show confirmation
      await expect(page.locator('[data-testid="invoice-sent-confirmation"]')).toBeVisible();
    });

    test('should handle invoice payments', async ({ page }) => {
      await page.goto('/invoicing');
      
      // Select an existing invoice
      await page.click('[data-testid="invoice-item"]:first-child');
      
      // Mark as paid
      await page.click('[data-testid="mark-paid-button"]');
      
      // Fill payment details
      await page.fill('[data-testid="payment-amount"]', '1500.00');
      await page.selectOption('[data-testid="payment-method"]', 'bank_transfer');
      
      // Confirm payment
      await page.click('[data-testid="confirm-payment"]');
      
      // Should update invoice status
      await expect(page.locator('[data-testid="invoice-status"]')).toContainText('Paid');
    });
  });

  test.describe('Settings and Configuration', () => {
    test('should update company information', async ({ page }) => {
      await page.goto('/settings');

      // Fill company form
      await page.fill('[data-testid="company-name"]', 'Updated Company Name');
      await page.fill('[data-testid="company-address"]', '123 Updated Street');
      await page.fill('[data-testid="company-phone"]', '01 02 03 04 05');
      
      // Save settings
      await page.click('[data-testid="save-settings"]');
      
      // Should show success message
      await expect(page.locator('[data-testid="settings-saved"]')).toBeVisible();
    });

    test('should configure tax settings', async ({ page }) => {
      await page.goto('/settings');
      
      // Navigate to tax settings
      await page.click('[data-testid="tax-settings-tab"]');
      
      // Configure VAT
      await page.selectOption('[data-testid="vat-regime"]', 'normal');
      await page.fill('[data-testid="vat-number"]', 'FR12345678901');
      
      // Save
      await page.click('[data-testid="save-tax-settings"]');
      
      // Should confirm save
      await expect(page.locator('[data-testid="tax-settings-saved"]')).toBeVisible();
    });
  });

  test.describe('Performance and Accessibility', () => {
    test('should meet Core Web Vitals standards', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Wait for page to fully load
      await page.waitForLoadState('networkidle');
      
      // Measure performance
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        };
      });
      
      // Assert reasonable performance
      expect(performanceMetrics.domContentLoaded).toBeLessThan(2000); // < 2s
      expect(performanceMetrics.firstContentfulPaint).toBeLessThan(1500); // < 1.5s
    });

    test('should be accessible', async ({ page }) => {
      const pages = ['/dashboard', '/accounting', '/banks', '/invoicing', '/settings'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        
        // Run accessibility check
        await checkA11y(page, undefined, {
          detailedReport: true,
          detailedReportOptions: { html: true },
          rules: {
            // Disable some rules that might be too strict for this context
            'color-contrast': { enabled: true },
            'keyboard-navigation': { enabled: true },
            'focus-management': { enabled: true },
            'semantic-markup': { enabled: true },
          },
        });
      }
    });

    test('should handle offline scenarios', async ({ page, context }) => {
      await page.goto('/dashboard');
      
      // Go offline
      await context.setOffline(true);
      
      // Try to navigate
      await page.click('[data-testid="nav-accounting"]');
      
      // Should show offline message
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
      
      // Go back online
      await context.setOffline(false);
      
      // Should work normally
      await page.reload();
      await expect(page.locator('main')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Mock failed API responses
      await page.route('**/api/**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      await page.goto('/dashboard');
      
      // Should show error state
      await expect(page.locator('[data-testid="error-boundary"]')).toBeVisible();
      
      // Should have retry button
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    test('should handle network errors', async ({ page, context }) => {
      await page.goto('/dashboard');
      
      // Simulate network error
      await context.setOffline(true);
      
      // Try to perform an action that requires network
      await page.click('[data-testid="sync-data-button"]');
      
      // Should show network error message
      await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    });
  });
});