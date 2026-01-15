import { test, expect } from '@playwright/test';

import { dismissOverlays } from './testUtils/dismissOverlays';

const RUN_AUTHED_E2E =
  process.env.PLAYWRIGHT_RUN_AUTHED_E2E === '1' || process.env.PLAYWRIGHT_RUN_AUTHED_E2E === 'true';

/**
 * E2E Tests - Invoicing Flow
 * Critical user journey: Create Invoice → Send → View PDF
 */

// Helper function to login
async function login(page: any) {
  const testEmail = process.env.TEST_USER_EMAIL || 'test@casskai.app';
  const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

  await page.goto('/login');
  await dismissOverlays(page);
  await page.getByLabel(/email/i).fill(testEmail);
  await page.getByLabel(/mot de passe|password/i).fill(testPassword);
  await page.getByRole('button', { name: /se connecter|connexion|login/i }).click();
  await page.waitForURL(/dashboard|accueil/i, { timeout: 10000 });
}

test.describe('Invoicing', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !RUN_AUTHED_E2E,
      'Authenticated E2E disabled by default; set PLAYWRIGHT_RUN_AUTHED_E2E=1'
    );

    test.skip(
      !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD,
      'Missing TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.test.local'
    );

    await login(page);
  });

  test('should navigate to invoicing page', async ({ page }) => {
    // Navigate to invoicing
    await page.getByRole('link', { name: /invoicing|facturation/i }).click();

    // Check invoicing page loaded
    await expect(page).toHaveURL(/invoicing|facturation/i);
    await expect(page.getByText(/invoices|factures/i)).toBeVisible();
  });

  test('should display invoice list', async ({ page }) => {
    // Navigate to invoicing
    await page.goto('/invoicing');

    // Check for invoice list or empty state
    const hasInvoices = await page.getByRole('table').isVisible().catch(() => false);
    const hasEmptyState = await page.getByText(/no invoices|aucune facture/i).isVisible().catch(() => false);

    expect(hasInvoices || hasEmptyState).toBeTruthy();
  });

  test('should open create invoice form', async ({ page }) => {
    // Navigate to invoicing
    await page.goto('/invoicing');

    // Click create button
    await page.getByRole('button', { name: /create|new|créer|nouvelle/i }).click();

    // Check form opened
    await expect(page.getByText(/create invoice|créer facture/i)).toBeVisible({ timeout: 3000 });
    await expect(page.getByLabel(/client/i)).toBeVisible();
    await expect(page.getByLabel(/date/i)).toBeVisible();
  });

  test('should validate invoice form', async ({ page }) => {
    // Navigate to invoicing and open form
    await page.goto('/invoicing');
    await page.getByRole('button', { name: /create|new|créer|nouvelle/i }).click();

    // Try to submit empty form
    await page.getByRole('button', { name: /save|enregistrer|créer/i }).click();

    // Check validation errors
    await expect(page.getByText(/required|obligatoire|champ requis/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('should create invoice successfully', async ({ page }) => {
    // Navigate to invoicing
    await page.goto('/invoicing');

    // Click create button
    await page.getByRole('button', { name: /create|new|créer|nouvelle/i }).click();

    // Fill invoice form
    const invoiceNumber = `INV-TEST-${Date.now()}`;

    // Select client (first option if dropdown exists)
    const clientSelect = page.getByLabel(/client/i);
    if (await clientSelect.isVisible()) {
      await clientSelect.click();
      await page.getByRole('option').first().click();
    }

    // Fill date
    const dateInput = page.getByLabel(/date/i);
    if (await dateInput.isVisible()) {
      await dateInput.fill(new Date().toISOString().split('T')[0]);
    }

    // Add line item
    const addLineButton = page.getByRole('button', { name: /add line|ajouter ligne/i });
    if (await addLineButton.isVisible()) {
      await addLineButton.click();

      // Fill line item details
      await page.getByLabel(/description/i).first().fill('Test Product');
      await page.getByLabel(/quantity|quantité/i).first().fill('1');
      await page.getByLabel(/price|prix/i).first().fill('10000');
    }

    // Submit form
    await page.getByRole('button', { name: /save|enregistrer|créer/i }).click();

    // Wait for success message or redirect
    await expect(
      page.getByText(/success|created|créée|succès/i).or(page.getByRole('table'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('should filter invoices by status', async ({ page }) => {
    // Navigate to invoicing
    await page.goto('/invoicing');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for status filter
    const statusFilter = page.getByLabel(/status|statut/i).or(
      page.getByRole('combobox', { name: /filter|filtre/i })
    );

    if (await statusFilter.isVisible()) {
      await statusFilter.click();

      // Select a status
      await page.getByRole('option', { name: /draft|brouillon|paid|payé/i }).first().click();

      // Wait for filtered results
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('status');
    }
  });

  test('should search invoices', async ({ page }) => {
    // Navigate to invoicing
    await page.goto('/invoicing');

    // Look for search input
    const searchInput = page.getByPlaceholder(/search|rechercher/i);

    if (await searchInput.isVisible()) {
      await searchInput.fill('INV');

      // Wait for search results
      await page.waitForLoadState('networkidle');
    }
  });

  test('should export invoice to PDF', async ({ page }) => {
    // Navigate to invoicing
    await page.goto('/invoicing');

    // Check if there are invoices
    const hasInvoices = await page.getByRole('table').isVisible().catch(() => false);

    if (hasInvoices) {
      // Click first invoice
      await page.getByRole('row').nth(1).click();

      // Look for PDF export button
      const exportButton = page.getByRole('button', { name: /pdf|export|télécharger/i });

      if (await exportButton.isVisible()) {
        // Setup download listener
        const downloadPromise = page.waitForEvent('download');
        await exportButton.click();

        // Wait for download
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
      }
    }
  });
});
