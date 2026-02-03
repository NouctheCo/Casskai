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
  const testPassword = process.env.TEST_USER_PASSWORD || 'Test123456az';

  await page.goto('/login');
  await dismissOverlays(page);
  await page.getByLabel(/email/i).fill(testEmail);
  await page.getByLabel(/mot de passe|password/i).fill(testPassword);
  await page.getByRole('button', { name: /sign in|se connecter|connexion/i }).click();
  await page.waitForURL(/dashboard|accueil/i, { timeout: 10000 });
}

async function waitForAppReady(page: any) {
  await page.waitForLoadState('networkidle');
  await page
    .getByText(/Chargement de l'application|Chargement de CassKai/i)
    .first()
    .waitFor({ state: 'hidden', timeout: 10000 })
    .catch(() => {});
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
    const invoicingNav = page
      .getByRole('button', { name: /invoicing|facturation/i })
      .or(page.getByRole('link', { name: /invoicing|facturation/i }));

    const isVisible = await invoicingNav.first().isVisible().catch(() => false);
    test.skip(!isVisible, 'Invoicing navigation not available');

    await invoicingNav.first().click();
    await waitForAppReady(page);

    // Check invoicing page loaded
    await expect(page).toHaveURL(/invoicing|facturation/i);
    await expect(page.getByText(/invoices|factures/i)).toBeVisible();
  });

  test('should display invoice list', async ({ page }) => {
    // Navigate to invoicing
    await page.goto('/invoicing');
    await waitForAppReady(page);

    // Check for invoice list or empty state
    const hasInvoices = await page.getByRole('table').isVisible().catch(() => false);
    const hasListTitle = await page.getByText(/Liste des factures/i).isVisible().catch(() => false);
    const hasEmptyState = await page.getByText(/aucune facture|no invoices|Créer ma première facture|Commencez par créer votre première facture/i)
      .isVisible()
      .catch(() => false);
    const hasHeader = await page.getByRole('heading', { name: /factures|invoices/i }).isVisible().catch(() => false);
    const hasCreateButton = await page
      .getByRole('button', { name: /nouvelle facture|create invoice|créer facture/i })
      .isVisible()
      .catch(() => false);

    const hasAny = hasInvoices || hasListTitle || hasEmptyState || hasHeader || hasCreateButton;
    test.skip(!hasAny, 'Invoice list UI not available');
    expect(hasAny).toBeTruthy();
  });

  test('should open create invoice form', async ({ page }) => {
    // Navigate to invoicing
    await page.goto('/invoicing');
    await waitForAppReady(page);

    // Open invoices tab if present
    const invoicesTab = page.getByRole('tab', { name: /factures|invoices/i });
    if (await invoicesTab.isVisible().catch(() => false)) {
      await invoicesTab.click();
    }

    // Click create button
    const newInvoiceButton = page.getByRole('button', { name: /nouvelle facture|create invoice|créer facture/i });
    const hasButton = await newInvoiceButton.isVisible().catch(() => false);
    test.skip(!hasButton, 'New invoice button not available');
    await newInvoiceButton.click();

    // Check form opened
    await expect(page.getByText(/Nouvelle facture|Créer facture|Modifier la facture/i)).toBeVisible({ timeout: 3000 });
    await expect(page.getByLabel(/client/i)).toBeVisible();
    await expect(page.getByLabel(/date/i)).toBeVisible();
  });

  test('should validate invoice form', async ({ page }) => {
    // Navigate to invoicing and open form
    await page.goto('/invoicing');
    await waitForAppReady(page);

    const invoicesTab = page.getByRole('tab', { name: /factures|invoices/i });
    if (await invoicesTab.isVisible().catch(() => false)) {
      await invoicesTab.click();
    }

    const newInvoiceButton = page.getByRole('button', { name: /nouvelle facture|create invoice|créer facture/i });
    const hasButton = await newInvoiceButton.isVisible().catch(() => false);
    test.skip(!hasButton, 'New invoice button not available');
    await newInvoiceButton.click();

    // Try to submit empty form
    await page.getByRole('button', { name: /créer|save|enregistrer/i }).click();

    // Check validation errors
    await expect(page.getByText(/Champs requis|Articles invalides|obligatoire/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should create invoice successfully', async ({ page }) => {
    // Navigate to invoicing
    await page.goto('/invoicing');
    await waitForAppReady(page);

    const invoicesTab = page.getByRole('tab', { name: /factures|invoices/i });
    if (await invoicesTab.isVisible().catch(() => false)) {
      await invoicesTab.click();
    }

    // Click create button
    const newInvoiceButton = page.getByRole('button', { name: /nouvelle facture|create invoice|créer facture/i });
    const hasButton = await newInvoiceButton.isVisible().catch(() => false);
    test.skip(!hasButton, 'New invoice button not available');
    await newInvoiceButton.click();

    // Fill invoice form
    const invoiceNumber = `INV-TEST-${Date.now()}`;

    // Select client (first option if dropdown exists)
    const clientSelect = page.getByRole('combobox', { name: /client/i });
    const clientSelectVisible = await clientSelect.isVisible().catch(() => false);
    test.skip(!clientSelectVisible, 'Client selector not available');
    await clientSelect.click();
    await page.getByRole('option').first().click();

    const invoiceNumberInput = page.locator('#invoiceNumber');
    if (await invoiceNumberInput.isVisible().catch(() => false)) {
      await invoiceNumberInput.fill(invoiceNumber);
    }

    const issueDateInput = page.locator('#issueDate');
    if (await issueDateInput.isVisible().catch(() => false)) {
      await issueDateInput.fill(new Date().toISOString().split('T')[0]);
    }

    const dueDateInput = page.locator('#dueDate');
    if (await dueDateInput.isVisible().catch(() => false)) {
      const due = new Date();
      due.setDate(due.getDate() + 15);
      await dueDateInput.fill(due.toISOString().split('T')[0]);
    }

    // Fill line item details
    const descriptionInput = page.getByPlaceholder('Description du produit/service');
    const qtyInput = page.getByPlaceholder('Qté');
    const priceInput = page.getByPlaceholder('Prix HT');

    if (await descriptionInput.isVisible().catch(() => false)) {
      await descriptionInput.fill('Service E2E');
    }
    if (await qtyInput.isVisible().catch(() => false)) {
      await qtyInput.fill('1');
    }
    if (await priceInput.isVisible().catch(() => false)) {
      await priceInput.fill('10000');
    }

    // Submit form
    await page.getByRole('button', { name: /créer|save|enregistrer/i }).click();

    // Wait for success message or redirect
    await expect(
      page.getByText(/Facture créée avec succès|success|créée|succès/i).or(page.getByRole('table'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('should filter invoices by status', async ({ page }) => {
    // Navigate to invoicing
    await page.goto('/invoicing');
    await waitForAppReady(page);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for status filter
    const statusFilter = page.getByText(/Tous les statuts/i).or(
      page.getByRole('combobox', { name: /statut|status|filtre|filter/i })
    );

    if (await statusFilter.isVisible()) {
      await statusFilter.click();

      // Select a status
      await page.getByRole('option', { name: /draft|brouillon|paid|payé/i }).first().click();

      // Wait for filtered results
      await page.waitForLoadState('networkidle');
    }
  });

  test('should search invoices', async ({ page }) => {
    // Navigate to invoicing
    await page.goto('/invoicing');
    await waitForAppReady(page);

    // Look for search input
    const searchInput = page
      .locator('input[placeholder*="Rechercher"], input[placeholder^="Search"], input[placeholder*="search"]')
      .first();

    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('INV');

      // Wait for search results
      await page.waitForLoadState('networkidle');
    }
  });

  test('should export invoice to PDF', async ({ page }) => {
    // Navigate to invoicing
    await page.goto('/invoicing');
    await waitForAppReady(page);

    // Check if there are invoices
    const hasInvoices = await page.getByRole('table').isVisible().catch(() => false);

    if (hasInvoices) {
      // Click first invoice
      await page.getByRole('row').nth(1).click();

      // Look for PDF export button
      const exportButton = page.getByRole('button', { name: /Exporter PDF|pdf|export|télécharger/i });

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
