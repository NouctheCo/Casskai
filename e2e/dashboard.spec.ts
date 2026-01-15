import { test, expect } from '@playwright/test';

import { dismissOverlays } from './testUtils/dismissOverlays';

const RUN_AUTHED_E2E =
  process.env.PLAYWRIGHT_RUN_AUTHED_E2E === '1' || process.env.PLAYWRIGHT_RUN_AUTHED_E2E === 'true';

/**
 * E2E Tests - Dashboard
 * Critical user journey: View KPIs → Navigate Modules → Access Reports
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

test.describe('Dashboard', () => {
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

  test('should display dashboard with KPIs', async ({ page }) => {
    // Check dashboard title
    await expect(page.getByText(/dashboard|tableau de bord/i)).toBeVisible();

    // Check for KPI cards (Revenue, Expenses, Profit, etc.)
    const kpiCards = page.locator('[data-testid*="kpi"]').or(
      page.locator('.kpi-card, .metric-card')
    );

    // Should have at least one KPI visible
    await expect(kpiCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display recent transactions', async ({ page }) => {
    // Look for recent transactions section
    const transactionsSection = page.getByText(/recent transactions|transactions récentes/i);

    if (await transactionsSection.isVisible().catch(() => false)) {
      await expect(transactionsSection).toBeVisible();

      // Check for transaction list or empty state
      const hasTransactions = await page.getByRole('list').isVisible().catch(() => false);
      const hasTable = await page.getByRole('table').isVisible().catch(() => false);
      const hasEmptyState = await page.getByText(/no transactions|aucune transaction/i).isVisible().catch(() => false);

      expect(hasTransactions || hasTable || hasEmptyState).toBeTruthy();
    }
  });

  test('should display charts', async ({ page }) => {
    // Wait for charts to render
    await page.waitForLoadState('networkidle');

    // Look for chart containers
    const charts = page.locator('[data-testid*="chart"]').or(
      page.locator('canvas, svg[class*="chart"], .recharts-wrapper')
    );

    // Should have at least one chart
    const chartCount = await charts.count();
    expect(chartCount).toBeGreaterThan(0);
  });

  test('should navigate to invoicing module', async ({ page }) => {
    // Look for invoicing link in navigation
    const invoicingLink = page.getByRole('link', { name: /invoicing|facturation/i });

    await invoicingLink.click();

    // Check URL changed
    await expect(page).toHaveURL(/invoicing|facturation/i);
  });

  test('should navigate to accounting module', async ({ page }) => {
    // Look for accounting link
    const accountingLink = page.getByRole('link', { name: /accounting|comptabilité/i });

    await accountingLink.click();

    // Check URL changed
    await expect(page).toHaveURL(/accounting|comptabilite/i);
  });

  test('should open settings', async ({ page }) => {
    // Look for settings link (usually in sidebar or user menu)
    const settingsLink = page.getByRole('link', { name: /settings|paramètres/i });

    if (await settingsLink.isVisible().catch(() => false)) {
      await settingsLink.click();
      await expect(page).toHaveURL(/settings|parametres/i);
    } else {
      // Try user menu
      await page.getByRole('button', { name: /menu|profile/i }).click();
      await page.getByRole('menuitem', { name: /settings|paramètres/i }).click();
      await expect(page).toHaveURL(/settings|parametres/i);
    }
  });

  test('should display notifications', async ({ page }) => {
    // Look for notification bell icon
    const notificationButton = page.getByRole('button', { name: /notifications/i }).or(
      page.locator('[data-testid="notifications-button"]')
    );

    if (await notificationButton.isVisible().catch(() => false)) {
      await notificationButton.click();

      // Check notification panel opened
      const notificationPanel = page.getByRole('dialog').or(
        page.locator('[data-testid="notifications-panel"]')
      );

      await expect(notificationPanel).toBeVisible({ timeout: 3000 });

      // Check for notifications or empty state
      const hasNotifications = await page.getByRole('listitem').isVisible().catch(() => false);
      const hasEmptyState = await page.getByText(/no notifications|aucune notification/i).isVisible().catch(() => false);

      expect(hasNotifications || hasEmptyState).toBeTruthy();
    }
  });

  test('should filter dashboard by date range', async ({ page }) => {
    // Look for date range picker
    const dateRangePicker = page.getByRole('button', { name: /date range|période|filtre/i }).or(
      page.locator('[data-testid="date-range-picker"]')
    );

    if (await dateRangePicker.isVisible().catch(() => false)) {
      await dateRangePicker.click();

      // Select a preset (e.g., "This Month", "Last 30 Days")
      const preset = page.getByRole('button', { name: /this month|ce mois|last 30 days|30 derniers jours/i });

      if (await preset.isVisible().catch(() => false)) {
        await preset.click();

        // Wait for dashboard to update
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should switch between companies (multi-tenant)', async ({ page }) => {
    // Look for company switcher
    const companySwitcher = page.getByRole('button', { name: /company|entreprise/i }).or(
      page.locator('[data-testid="company-selector"]')
    );

    if (await companySwitcher.isVisible().catch(() => false)) {
      await companySwitcher.click();

      // Check dropdown opened
      const dropdown = page.getByRole('menu').or(page.getByRole('listbox'));
      await expect(dropdown).toBeVisible({ timeout: 3000 });

      // Get company count
      const companies = await page.getByRole('menuitem').or(page.getByRole('option')).count();

      if (companies > 1) {
        // Select second company
        await page.getByRole('menuitem').or(page.getByRole('option')).nth(1).click();

        // Wait for dashboard to reload with new company data
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should display quick actions', async ({ page }) => {
    // Look for quick action buttons
    const quickActions = page.locator('[data-testid*="quick-action"]').or(
      page.getByRole('button', { name: /create|new|créer|nouveau/i })
    );

    const actionCount = await quickActions.count();
    expect(actionCount).toBeGreaterThan(0);

    // Try clicking first quick action
    if (actionCount > 0) {
      const firstAction = quickActions.first();
      await firstAction.click();

      // Should open a modal or navigate to creation page
      const hasModal = await page.getByRole('dialog').isVisible().catch(() => false);
      const urlChanged = page.url() !== (await page.evaluate(() => window.location.href));

      expect(hasModal || urlChanged).toBeTruthy();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload page
    await page.reload();

    // Check mobile menu button is visible
    const mobileMenuButton = page.getByRole('button', { name: /menu|navigation/i });
    await expect(mobileMenuButton).toBeVisible();

    // Open mobile menu
    await mobileMenuButton.click();

    // Check navigation menu opened
    const mobileNav = page.getByRole('navigation');
    await expect(mobileNav).toBeVisible();
  });
});
