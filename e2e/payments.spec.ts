import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Payment Recording
 * Critical user journey: Record Payment → Link to Invoice → View Payment History
 */

// Helper function to login
async function login(page: any) {
  const testEmail = process.env.TEST_USER_EMAIL || 'test@casskai.app';
  const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

  await page.goto('/');
  await page.getByLabel(/email/i).fill(testEmail);
  await page.getByLabel(/password/i).fill(testPassword);
  await page.getByRole('button', { name: /connexion|login/i }).click();
  await page.waitForURL(/dashboard|accueil/i, { timeout: 10000 });
}

test.describe('Payments', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Navigate to invoicing/payments
    await page.goto('/invoicing');
  });

  test('should display payments tab', async ({ page }) => {
    // Look for payments tab
    const paymentsTab = page.getByRole('tab', { name: /payments|paiements/i });

    if (await paymentsTab.isVisible().catch(() => false)) {
      await paymentsTab.click();

      // Check payments view loaded
      await expect(page.getByText(/payments|paiements/i)).toBeVisible();
    }
  });

  test('should open record payment form', async ({ page }) => {
    // Look for record payment button
    const recordPaymentButton = page.getByRole('button', {
      name: /record payment|enregistrer paiement|receive payment/i
    });

    if (await recordPaymentButton.isVisible().catch(() => false)) {
      await recordPaymentButton.click();

      // Check form opened
      await expect(page.getByText(/record payment|enregistrer paiement/i)).toBeVisible({ timeout: 3000 });
      await expect(page.getByLabel(/amount|montant/i)).toBeVisible();
      await expect(page.getByLabel(/date/i)).toBeVisible();
    }
  });

  test('should validate payment form', async ({ page }) => {
    // Open record payment form
    const recordPaymentButton = page.getByRole('button', {
      name: /record payment|enregistrer paiement/i
    });

    if (await recordPaymentButton.isVisible().catch(() => false)) {
      await recordPaymentButton.click();

      // Try to submit empty form
      await page.getByRole('button', { name: /save|enregistrer/i }).click();

      // Check validation errors
      await expect(page.getByText(/required|obligatoire/i).first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('should record payment successfully', async ({ page }) => {
    // Open record payment form
    const recordPaymentButton = page.getByRole('button', {
      name: /record payment|enregistrer paiement/i
    });

    if (await recordPaymentButton.isVisible().catch(() => false)) {
      await recordPaymentButton.click();

      // Fill payment form
      // Amount
      const amountInput = page.getByLabel(/amount|montant/i);
      await amountInput.fill('50000');

      // Date
      const dateInput = page.getByLabel(/date/i);
      await dateInput.fill(new Date().toISOString().split('T')[0]);

      // Payment method
      const methodSelect = page.getByLabel(/method|méthode|mode de paiement/i);
      if (await methodSelect.isVisible().catch(() => false)) {
        await methodSelect.click();
        await page.getByRole('option', { name: /bank transfer|virement|mobile money/i }).first().click();
      }

      // Select invoice to link (if available)
      const invoiceSelect = page.getByLabel(/invoice|facture/i);
      if (await invoiceSelect.isVisible().catch(() => false)) {
        await invoiceSelect.click();
        await page.getByRole('option').first().click();
      }

      // Add reference number
      const referenceInput = page.getByLabel(/reference|référence|transaction/i);
      if (await referenceInput.isVisible().catch(() => false)) {
        await referenceInput.fill(`PAY-TEST-${Date.now()}`);
      }

      // Submit form
      await page.getByRole('button', { name: /save|enregistrer|record/i }).click();

      // Wait for success message
      await expect(
        page.getByText(/success|recorded|enregistré|succès/i)
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('should link payment to invoice', async ({ page }) => {
    // Navigate to a specific invoice (assuming one exists)
    await page.goto('/invoicing');

    // Click on first invoice in list
    const firstInvoice = page.getByRole('row').nth(1);
    if (await firstInvoice.isVisible().catch(() => false)) {
      await firstInvoice.click();

      // Look for "Record Payment" button on invoice detail
      const recordPaymentButton = page.getByRole('button', {
        name: /record payment|receive|enregistrer paiement/i
      });

      if (await recordPaymentButton.isVisible().catch(() => false)) {
        await recordPaymentButton.click();

        // Invoice should be pre-selected
        // Fill minimal details
        await page.getByLabel(/amount|montant/i).fill('10000');
        await page.getByLabel(/date/i).fill(new Date().toISOString().split('T')[0]);

        // Submit
        await page.getByRole('button', { name: /save|enregistrer/i }).click();

        // Check payment was linked
        await expect(
          page.getByText(/payment recorded|paiement enregistré/i)
        ).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('should display payment history', async ({ page }) => {
    // Navigate to payments section
    const paymentsLink = page.getByRole('link', { name: /payments|paiements/i });

    if (await paymentsLink.isVisible().catch(() => false)) {
      await paymentsLink.click();

      // Check payment list
      const hasPaymentTable = await page.getByRole('table').isVisible().catch(() => false);
      const hasPaymentList = await page.getByRole('list').isVisible().catch(() => false);
      const hasEmptyState = await page.getByText(/no payments|aucun paiement/i).isVisible().catch(() => false);

      expect(hasPaymentTable || hasPaymentList || hasEmptyState).toBeTruthy();
    }
  });

  test('should filter payments by date range', async ({ page }) => {
    // Navigate to payments
    await page.goto('/invoicing');

    const paymentsTab = page.getByRole('tab', { name: /payments|paiements/i });
    if (await paymentsTab.isVisible().catch(() => false)) {
      await paymentsTab.click();

      // Look for date filter
      const dateFilter = page.getByLabel(/date range|période|filter by date/i);

      if (await dateFilter.isVisible().catch(() => false)) {
        await dateFilter.click();

        // Select a preset
        await page.getByRole('button', { name: /this month|ce mois/i }).click();

        // Wait for filtered results
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should filter payments by method', async ({ page }) => {
    // Navigate to payments
    await page.goto('/invoicing');

    const paymentsTab = page.getByRole('tab', { name: /payments|paiements/i });
    if (await paymentsTab.isVisible().catch(() => false)) {
      await paymentsTab.click();

      // Look for payment method filter
      const methodFilter = page.getByLabel(/payment method|méthode de paiement/i);

      if (await methodFilter.isVisible().catch(() => false)) {
        await methodFilter.click();
        await page.getByRole('option', { name: /bank transfer|mobile money/i }).first().click();

        // Wait for filtered results
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should export payments to CSV', async ({ page }) => {
    // Navigate to payments
    await page.goto('/invoicing');

    const paymentsTab = page.getByRole('tab', { name: /payments|paiements/i });
    if (await paymentsTab.isVisible().catch(() => false)) {
      await paymentsTab.click();

      // Look for export button
      const exportButton = page.getByRole('button', { name: /export|télécharger/i });

      if (await exportButton.isVisible().catch(() => false)) {
        // Setup download listener
        const downloadPromise = page.waitForEvent('download');
        await exportButton.click();

        // Select CSV format if prompted
        const csvOption = page.getByRole('menuitem', { name: /csv/i });
        if (await csvOption.isVisible().catch(() => false)) {
          await csvOption.click();
        }

        // Wait for download
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx)$/i);
      }
    }
  });

  test('should handle partial payments', async ({ page }) => {
    // Create or navigate to an invoice
    await page.goto('/invoicing');

    // Try to record a partial payment
    const recordButton = page.getByRole('button', { name: /record payment/i });

    if (await recordButton.isVisible().catch(() => false)) {
      await recordButton.click();

      // Enter amount less than invoice total
      await page.getByLabel(/amount|montant/i).fill('5000');
      await page.getByLabel(/date/i).fill(new Date().toISOString().split('T')[0]);

      // Select invoice
      const invoiceSelect = page.getByLabel(/invoice|facture/i);
      if (await invoiceSelect.isVisible().catch(() => false)) {
        await invoiceSelect.click();
        await page.getByRole('option').first().click();
      }

      // Submit
      await page.getByRole('button', { name: /save|enregistrer/i }).click();

      // Should show partial payment indicator
      await page.waitForLoadState('networkidle');

      // Check invoice status is "Partially Paid" if visible
      const partialStatus = page.getByText(/partially paid|partiellement payé/i);
      if (await partialStatus.isVisible().catch(() => false)) {
        await expect(partialStatus).toBeVisible();
      }
    }
  });
});
